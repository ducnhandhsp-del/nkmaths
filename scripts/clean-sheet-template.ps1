param(
  [string]$Path = "LOP_TOAN_NK_SHEET_2026_2027_TEMPLATE.xlsx",
  [string]$MirrorPath = "docs\gas\LOP_TOAN_NK_SHEET_2026_2027_TEMPLATE.xlsx"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$MainNs = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
$RelNs = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
$PkgRelNs = "http://schemas.openxmlformats.org/package/2006/relationships"
$ViCulture = [Globalization.CultureInfo]::GetCultureInfo("vi-VN")

function Read-ZipEntryText([System.IO.Compression.ZipArchive]$zip, [string]$name) {
  $entry = $zip.GetEntry($name)
  if (-not $entry) { return $null }
  $reader = [IO.StreamReader]::new($entry.Open())
  try { return $reader.ReadToEnd() } finally { $reader.Close() }
}

function Write-ZipEntryText([System.IO.Compression.ZipArchive]$zip, [string]$name, [string]$text) {
  $old = $zip.GetEntry($name)
  if ($old) { $old.Delete() }
  $entry = $zip.CreateEntry($name, [System.IO.Compression.CompressionLevel]::Optimal)
  $writer = [IO.StreamWriter]::new($entry.Open(), [Text.UTF8Encoding]::new($false))
  try { $writer.Write($text) } finally { $writer.Close() }
}

function New-Ns([System.Xml.XmlDocument]$doc, [hashtable]$extra = @{}) {
  $ns = [Xml.XmlNamespaceManager]::new($doc.NameTable)
  $ns.AddNamespace("x", $MainNs)
  foreach ($key in $extra.Keys) { $ns.AddNamespace($key, $extra[$key]) }
  return $ns
}

function Col-ToNumber([string]$letters) {
  $n = 0
  foreach ($ch in $letters.ToUpperInvariant().ToCharArray()) {
    $n = $n * 26 + ([int][char]$ch - [int][char]'A' + 1)
  }
  return $n
}

function Number-ToCol([int]$n) {
  $s = ""
  while ($n -gt 0) {
    $n--
    $s = [char]([int][char]'A' + ($n % 26)) + $s
    $n = [math]::Floor($n / 26)
  }
  return $s
}

function Cell-Col([Xml.XmlElement]$cell) {
  return ([regex]::Match($cell.GetAttribute("r"), "^[A-Z]+")).Value
}

function Normalize-Space([string]$value) {
  if ($null -eq $value) { return "" }
  return (($value -replace "\s+", " ").Trim())
}

function Title-Name([string]$value) {
  $text = Normalize-Space $value
  if (-not $text) { return "" }
  $lower = $text.ToLower($ViCulture)
  return $ViCulture.TextInfo.ToTitleCase($lower)
}

function Normalize-Phone([string]$value) {
  $digits = ([regex]::Replace([string]$value, "\D", ""))
  if (-not $digits) { return "" }
  if ($digits.StartsWith("84") -and $digits.Length -ge 11) {
    $digits = "0" + $digits.Substring(2)
  } elseif (-not $digits.StartsWith("0") -and $digits.Length -eq 9) {
    $digits = "0" + $digits
  }
  return $digits
}

function Normalize-Code([string]$value, [string]$kind) {
  $text = (Normalize-Space $value).ToUpperInvariant()
  if (-not $text) { return "" }
  $m = [regex]::Match($text, "(\d+)")
  if (-not $m.Success) { return $text }
  $num = [int]$m.Groups[1].Value
  switch ($kind) {
    "MaHS" { return "HS{0:000}" -f $num }
    "MaGV" { return "GV{0:0000}" -f $num }
    "MaDangKy" { return "DK{0:0000}" -f $num }
    default { return $text }
  }
}

function Get-CellValue($cell, $ns, [object[]]$shared) {
  if (-not $cell) { return "" }
  $t = $cell.GetAttribute("t")
  if ($t -eq "s") {
    $v = $cell.SelectSingleNode("*[local-name()='v']")
    if ($v -and $v.InnerText -ne "") { return [string]$shared[[int]$v.InnerText] }
    return ""
  }
  if ($t -eq "inlineStr") {
    $texts = $cell.SelectNodes("*[local-name()='is']//*[local-name()='t']") | ForEach-Object { $_.InnerText }
    return [string]($texts -join "")
  }
  $vn = $cell.SelectSingleNode("*[local-name()='v']")
  if ($vn) { return [string]$vn.InnerText }
  return ""
}

function Clear-CellChildren($cell, $ns) {
  foreach ($node in @($cell.SelectNodes("*[local-name()='v' or local-name()='is']"))) {
    [void]$cell.RemoveChild($node)
  }
}

function Set-CellString($doc, $cell, $ns, [string]$value) {
  Clear-CellChildren $cell $ns
  if ($value -eq "") {
    $cell.RemoveAttribute("t")
    return
  }
  $cell.SetAttribute("t", "inlineStr")
  $is = $doc.CreateElement("is", $MainNs)
  $t = $doc.CreateElement("t", $MainNs)
  if ($value -match "^\s|\s$|`n") { $t.SetAttribute("space", "http://www.w3.org/XML/1998/namespace", "preserve") }
  $t.InnerText = $value
  [void]$is.AppendChild($t)
  [void]$cell.AppendChild($is)
}

function Set-CellNumber($doc, $cell, $ns, [double]$value) {
  Clear-CellChildren $cell $ns
  $cell.RemoveAttribute("t")
  $v = $doc.CreateElement("v", $MainNs)
  $v.InnerText = $value.ToString([Globalization.CultureInfo]::InvariantCulture)
  [void]$cell.AppendChild($v)
}

function Get-UsedLastRow($rows, $ns, [object[]]$shared) {
  $last = 1
  foreach ($row in $rows) {
    $hasValue = $false
    foreach ($cell in $row.SelectNodes("*[local-name()='c']")) {
      if ((Get-CellValue -cell $cell -ns $ns -shared $shared) -ne "") { $hasValue = $true; break }
    }
    if ($hasValue) { $last = [int]$row.GetAttribute("r") }
  }
  return $last
}

function Ensure-SheetView($doc, $root, $ns) {
  $sheetViews = $root.SelectSingleNode("*[local-name()='sheetViews']")
  if (-not $sheetViews) {
    $sheetViews = $doc.CreateElement("sheetViews", $MainNs)
    $before = $root.SelectSingleNode("*[local-name()='sheetFormatPr' or local-name()='cols' or local-name()='sheetData']")
    if ($before) { [void]$root.InsertBefore($sheetViews, $before) } else { [void]$root.AppendChild($sheetViews) }
  }
  $sheetView = $sheetViews.SelectSingleNode("*[local-name()='sheetView']")
  if (-not $sheetView) {
    $sheetView = $doc.CreateElement("sheetView", $MainNs)
    $sheetView.SetAttribute("workbookViewId", "0")
    [void]$sheetViews.AppendChild($sheetView)
  }
  foreach ($node in @($sheetView.SelectNodes("*[local-name()='pane' or local-name()='selection']"))) { [void]$sheetView.RemoveChild($node) }
  $pane = $doc.CreateElement("pane", $MainNs)
  $pane.SetAttribute("ySplit", "1")
  $pane.SetAttribute("topLeftCell", "A2")
  $pane.SetAttribute("activePane", "bottomLeft")
  $pane.SetAttribute("state", "frozen")
  [void]$sheetView.AppendChild($pane)
  $selection = $doc.CreateElement("selection", $MainNs)
  $selection.SetAttribute("pane", "bottomLeft")
  [void]$sheetView.AppendChild($selection)
}

function Set-AutoFilter($doc, $root, $ns, [int]$maxCol, [int]$lastRow) {
  foreach ($node in @($root.SelectNodes("*[local-name()='autoFilter']"))) { [void]$root.RemoveChild($node) }
  if ($lastRow -le 1 -or $maxCol -le 0) { return }
  $af = $doc.CreateElement("autoFilter", $MainNs)
  $af.SetAttribute("ref", ("A1:{0}{1}" -f (Number-ToCol $maxCol), $lastRow))
  $inserted = $false
  $sheetData = $root.SelectSingleNode("*[local-name()='sheetData']")
  if ($sheetData -and $sheetData.NextSibling) {
    [void]$root.InsertAfter($af, $sheetData)
    $inserted = $true
  }
  if (-not $inserted) { [void]$root.AppendChild($af) }
}

function Set-ColumnWidths($doc, $root, $ns, $widths) {
  foreach ($node in @($root.SelectNodes("*[local-name()='cols']"))) { [void]$root.RemoveChild($node) }
  $cols = $doc.CreateElement("cols", $MainNs)
  foreach ($idx in ($widths.Keys | Sort-Object {[int]$_})) {
    $col = $doc.CreateElement("col", $MainNs)
    $col.SetAttribute("min", [string]$idx)
    $col.SetAttribute("max", [string]$idx)
    $col.SetAttribute("width", ([math]::Round([double]$widths[$idx], 1)).ToString([Globalization.CultureInfo]::InvariantCulture))
    $col.SetAttribute("customWidth", "1")
    [void]$cols.AppendChild($col)
  }
  $before = $root.SelectSingleNode("*[local-name()='sheetData']")
  if ($before) { [void]$root.InsertBefore($cols, $before) } else { [void]$root.AppendChild($cols) }
}

function Clean-Workbook([string]$xlsxPath) {
  $fullPath = (Resolve-Path $xlsxPath).Path
  $backupDir = Join-Path (Get-Location) "output\backups"
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  $backup = Join-Path $backupDir ("{0}.{1}.bak.xlsx" -f ([IO.Path]::GetFileNameWithoutExtension($xlsxPath)), (Get-Date -Format "yyyyMMdd-HHmmss"))
  Copy-Item -LiteralPath $fullPath -Destination $backup -Force

  $stats = [ordered]@{ Sheets = 0; Headers = 0; Names = 0; Phones = 0; Codes = 0; Integers = 0; Money = 0 }
  $zip = [System.IO.Compression.ZipFile]::Open($fullPath, [System.IO.Compression.ZipArchiveMode]::Update)
  try {
    $sharedDoc = [xml](Read-ZipEntryText -zip $zip -name "xl/sharedStrings.xml")
    $sharedNs = New-Ns -doc $sharedDoc
    $shared = @()
    foreach ($si in $sharedDoc.DocumentElement.SelectNodes("*[local-name()='si']")) {
      $texts = $si.SelectNodes(".//*[local-name()='t']") | ForEach-Object { $_.InnerText }
      $shared += ($texts -join "")
    }

    $wb = [xml](Read-ZipEntryText -zip $zip -name "xl/workbook.xml")
    $wbNs = New-Ns -doc $wb -extra @{ r = $RelNs }
    $rels = [xml](Read-ZipEntryText -zip $zip -name "xl/_rels/workbook.xml.rels")
    $relNs = [Xml.XmlNamespaceManager]::new($rels.NameTable)
    $relNs.AddNamespace("pr", $PkgRelNs)

    $nameHeaders = @("HoTen", "TenPhuHuynh", "NguoiNop", "NguoiThu", "NguoiChi", "NguoiBao")
    $phoneHeaders = @("SDT", "SDTPhuHuynh", "SDTHocSinh")
    $codeHeaders = @("MaHS", "MaGV", "MaDangKy")
    $classCodeHeaders = @("MaLop", "CoSo", "TrangThai", "HinhThuc", "MaBuoi", "MaDiemDanh", "MaPhieuThu", "MaPhieuChi", "MaNghi", "Status", "Action", "Entity", "EntityId")
    $integerHeaders = @("Khoi", "ThangHP", "NamHP")
    $moneyHeaders = @("SoTien", "HocPhiMacDinh", "DonGiaMoiBuoi", "LuongCoBan", "PhuCap")
    $wideHeaders = @("GhiChu", "GhiChuGV", "NoiDung", "BaiTapVeNha", "CanHoTro", "Detail", "LyDo", "LyDoNghi")

    foreach ($sheet in $wb.DocumentElement.SelectNodes("*[local-name()='sheets']/*[local-name()='sheet']")) {
      $rid = $sheet.GetAttribute("id", $RelNs)
      if (-not $rid) { $rid = $sheet.GetAttribute("r:id") }
      $rel = $rels.DocumentElement.SelectSingleNode("*[local-name()='Relationship' and @Id='$rid']")
      $target = if ($rel) { $rel.GetAttribute("Target") } else { "" }
      if (-not $rel -or $target -notlike "worksheets/*") { continue }
      $entryName = "xl/" + $target
      $doc = [xml](Read-ZipEntryText -zip $zip -name $entryName)
      $stats.Sheets++
      $ns = New-Ns -doc $doc
      $root = $doc.DocumentElement
      $rows = $doc.DocumentElement.SelectNodes("*[local-name()='sheetData']/*[local-name()='row']")
      if ($rows.Count -eq 0) { continue }

      $headerByCol = @{}
      foreach ($cell in $rows[0].SelectNodes("*[local-name()='c']")) {
        $col = Cell-Col $cell
        $headerByCol[$col] = Normalize-Space (Get-CellValue -cell $cell -ns $ns -shared $shared)
      }
      $stats.Headers += $headerByCol.Count

      foreach ($row in $rows) {
        $rowIndex = [int]$row.GetAttribute("r")
        if ($rowIndex -eq 1) { continue }
        foreach ($cell in $row.SelectNodes("*[local-name()='c']")) {
          $col = Cell-Col $cell
          if (-not $headerByCol.ContainsKey($col)) { continue }
          $header = $headerByCol[$col]
          $raw = Get-CellValue -cell $cell -ns $ns -shared $shared
          if ($raw -eq "") { continue }

          if ($nameHeaders -contains $header) {
            Set-CellString $doc $cell $ns (Title-Name $raw)
            $stats.Names++
          } elseif ($phoneHeaders -contains $header) {
            $cell.SetAttribute("s", "28")
            Set-CellString $doc $cell $ns (Normalize-Phone $raw)
            $stats.Phones++
          } elseif ($codeHeaders -contains $header) {
            $cell.SetAttribute("s", "28")
            Set-CellString $doc $cell $ns (Normalize-Code $raw $header)
            $stats.Codes++
          } elseif ($classCodeHeaders -contains $header) {
            Set-CellString $doc $cell $ns (Normalize-Space $raw)
          } elseif ($integerHeaders -contains $header) {
            $num = 0.0
            if ([double]::TryParse(([string]$raw), [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::InvariantCulture, [ref]$num)) {
              $cell.SetAttribute("s", "48")
              Set-CellNumber $doc $cell $ns ([math]::Round($num))
              $stats.Integers++
            }
          } elseif ($moneyHeaders -contains $header) {
            $num = 0.0
            if ([double]::TryParse(([string]$raw), [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::InvariantCulture, [ref]$num)) {
              $cell.SetAttribute("s", "49")
              Set-CellNumber $doc $cell $ns ([math]::Round($num))
              $stats.Money++
            }
          } else {
            $clean = Normalize-Space $raw
            if ($clean -ne $raw -and $header -notin @("GhiChu", "GhiChuGV", "CanHoTro")) {
              Set-CellString $doc $cell $ns $clean
            }
          }
        }
      }

      $lastRow = Get-UsedLastRow -rows $rows -ns $ns -shared $shared
      $maxCol = 0
      $widths = @{}
      foreach ($col in $headerByCol.Keys) {
        $idx = Col-ToNumber $col
        $header = $headerByCol[$col]
        $base = [Math]::Max(10, [Math]::Min(24, $header.Length + 2))
        if ($phoneHeaders -contains $header) { $base = 16 }
        if ($nameHeaders -contains $header) { $base = 22 }
        if ($moneyHeaders -contains $header) { $base = 14 }
        if ($integerHeaders -contains $header) { $base = 10 }
        if ($wideHeaders -contains $header) { $base = 42 }
        if ($header -in @("CreatedAt", "UpdatedAt", "Time")) { $base = 21 }
        if ($header -in @("Ngay", "NgayThu", "NgayChi", "NgaySinh", "NgayBatDau", "NgayKetThuc", "NgayVao", "NgayRa")) { $base = 13 }
        $widths[$idx] = $base
        if ($idx -gt $maxCol) { $maxCol = $idx }
      }

      Ensure-SheetView $doc $root $ns
      Set-AutoFilter $doc $root $ns $maxCol $lastRow
      Set-ColumnWidths $doc $root $ns $widths

      $xmlSettings = [Xml.XmlWriterSettings]::new()
      $xmlSettings.Encoding = [Text.UTF8Encoding]::new($false)
      $xmlSettings.OmitXmlDeclaration = $false
      $xmlSettings.Indent = $false
      $sb = [Text.StringBuilder]::new()
      $writer = [Xml.XmlWriter]::Create($sb, $xmlSettings)
      $doc.Save($writer)
      $writer.Close()
      Write-ZipEntryText -zip $zip -name $entryName -text $sb.ToString()
    }
  } finally {
    $zip.Dispose()
  }
  Write-Host ("Stats: sheets={0}; headers={1}; names={2}; phones={3}; codes={4}; integers={5}; money={6}" -f $stats.Sheets, $stats.Headers, $stats.Names, $stats.Phones, $stats.Codes, $stats.Integers, $stats.Money)
  return $backup
}

$backupPath = Clean-Workbook $Path
if ($MirrorPath -and (Test-Path $MirrorPath)) {
  Copy-Item -LiteralPath $Path -Destination $MirrorPath -Force
}

Write-Output "Cleaned: $Path"
Write-Output "Backup: $backupPath"
if ($MirrorPath) { Write-Output "Mirrored: $MirrorPath" }
