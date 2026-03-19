// QUAN_LY_LOP_TOAN_NK - Google Apps Script v29.1
// HocSinh: header r1, data r2, 20 cols (col19=GhiChuGV, col20=FacebookURL)
// LopHoc/HocPhi/ChiPhi/NhatKy/DiemDanh/GiaoVien/HocLieu: header r1, data r2

var DATA_START = 2;

function doGet(e) {
  return jsonOut({ ok: true, msg: 'Lop Toan NK GAS v29.1' });
}

function doPost(e) {
  var result;
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var map = {
      getData:        getData,
      saveHS:         saveHS,
      updateHS:       updateHS,
      deleteHS:       deleteHS,
      saveClass:      saveClass,
      updateClass:    updateClass,
      deleteClass:    deleteClass,
      savePayment:    savePayment,
      updatePayment:  updatePayment,
      deletePayment:  deletePayment,
      saveExpense:    saveExpense,
      updateExpense:  updateExpense,
      deleteExpense:  deleteExpense,
      saveDiary:      saveDiary,
      updateDiary:    updateDiary,
      deleteDiary:    deleteDiary,
      saveTeacher:    saveTeacher,
      updateTeacher:  updateTeacher,
      deleteTeacher:  deleteTeacher,
      saveMaterial:   saveMaterial,
      updateMaterial: updateMaterial,
      deleteMaterial: deleteMaterial
    };
    if (map[action]) result = map[action](data);
    else result = { ok: false, error: 'Unknown action: ' + action };
  } catch (err) {
    result = { ok: false, error: err.toString() };
  }
  return jsonOut(result);
}

// --- Utility ---

function jsonOut(obj) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function ss()     { return SpreadsheetApp.getActiveSpreadsheet(); }
function sh(name) { return ss().getSheetByName(name); }

function findRow(sheetName, keyCol, keyValue, dataStart) {
  var sheet = sh(sheetName);
  if (!sheet) return -1;
  var last = sheet.getLastRow();
  if (last < dataStart) return -1;
  var vals = sheet.getRange(dataStart, keyCol, last - dataStart + 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(keyValue)) return dataStart + i;
  }
  return -1;
}

function formatDate(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
    var iso = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];
    return val;
  }
  try {
    var d = new Date(val);
    if (!isNaN(d.getTime()))
      return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
    return String(val);
  } catch(e) { return String(val); }
}

function nowStr() {
  return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm - dd/MM/yyyy');
}

function str(v) { return v == null ? '' : String(v).trim(); }
function num(v) { return isNaN(Number(v)) ? 0 : Number(v); }

// --- getData ---

function getData() {
  try {
    var hsList  = readHocSinh();
    var lopList = readLopHoc();
    var pyList  = readHocPhi(hsList);
    var cpList  = readChiPhi();
    var logList = readNhatKy();
    var tvList  = readGiaoVien();
    var hlList  = readHocLieu();
    var totalRevenue = pyList.reduce(function(s, p) { return s + p.amount; }, 0);
    var totalExpense = cpList.reduce(function(s, e) { return s + e.amount; }, 0);
    return {
      ok: true,
      hs: hsList, uCls: lopList, py: pyList, ex: cpList,
      logs: logList, tv: tvList, hl: hlList,
      summary: { totalRevenue: totalRevenue, totalExpense: totalExpense, chart: [] }
    };
  } catch(err) { return { ok: false, error: 'getData: ' + err.toString() }; }
}

// --- Doc HocSinh (20 cols) ---
// Cols 1-20: MaHS HoTen NgaySinh CoSo Khoi Truong GiaoVien TenPH SdtPH SdtHS
//           DiaChi HocLuc MucTieu CanHoTro MaLop NgayBatDau NgayKetThuc TrangThai GhiChuGV FacebookURL

function readHocSinh() {
  var sheet = sh('HocSinh');
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < DATA_START) return [];
  var ncol = Math.max(sheet.getLastColumn(), 20);
  var data = sheet.getRange(DATA_START, 1, last - DATA_START + 1, ncol).getValues();
  return data.filter(function(r) { return r[0]; }).map(function(r) {
    return {
      id:            str(r[0]),
      name:          str(r[1]),
      dob:           formatDate(r[2]),
      branch:        str(r[3]),
      grade:         str(r[4]),
      school:        str(r[5]),
      teacher:       str(r[6]),
      parentName:    str(r[7]),
      parentPhone:   str(r[8]),
      studentPhone:  str(r[9]),
      address:       str(r[10]),
      academicLevel: str(r[11]),
      goal:          str(r[12]),
      supportNeeded: str(r[13]),
      classId:       str(r[14]),
      startDate:     formatDate(r[15]),
      endDate:       formatDate(r[16]),
      status:        str(r[17]) || 'active',
      notes:         str(r[18]),
      facebookUrl:   str(r[19])
    };
  });
}

// --- Doc LopHoc (8 cols) ---
function readLopHoc() {
  var sheet = sh('LopHoc');
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < DATA_START) return [];
  var data = sheet.getRange(DATA_START, 1, last - DATA_START + 1, 8).getValues();
  return data.filter(function(r) { return r[0]; }).map(function(r) {
    return {
      MaLop: str(r[0]), 'Ma Lop': str(r[0]),
      TenLop: str(r[1]), Khoi: str(r[2]), GiaoVien: str(r[3]),
      CoSo: str(r[4]), Buoi1: str(r[5]), Buoi2: str(r[6]), Buoi3: str(r[7])
    };
  });
}

// --- Doc HocPhi (10 cols) ---
function readHocPhi(hsList) {
  var sheet = sh('HocPhi');
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < DATA_START) return [];
  var data = sheet.getRange(DATA_START, 1, last - DATA_START + 1, 10).getValues();
  var hsMap = {};
  if (hsList) hsList.forEach(function(s) { hsMap[s.id] = s.name; });
  return data.filter(function(r) { return r[0]; }).map(function(r) {
    var sid = str(r[3]);
    return {
      date: str(r[0]), docNum: str(r[1]), description: str(r[2]),
      studentId: sid, studentName: hsMap[sid] || sid,
      payer: str(r[4]), method: str(r[5]),
      amount: num(r[6]), note: str(r[7]),
      thangHP: num(r[8]), namHP: num(r[9])
    };
  });
}

// --- Doc ChiPhi (6 cols) ---
function readChiPhi() {
  var sheet = sh('ChiPhi');
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < DATA_START) return [];
  var data = sheet.getRange(DATA_START, 1, last - DATA_START + 1, 6).getValues();
  return data.filter(function(r) { return r[0]; }).map(function(r) {
    return {
      date: str(r[0]), docNum: str(r[1]), spender: str(r[2]),
      category: str(r[3]), amount: num(r[4]), description: str(r[5])
    };
  });
}

// --- Doc NhatKy + DiemDanh ---
function readNhatKy() {
  var nkSheet = sh('NhatKy');
  if (!nkSheet) return [];
  var ddMap = {};
  var ddSheet = sh('DiemDanh');
  if (ddSheet) {
    var ddLast = ddSheet.getLastRow();
    if (ddLast >= DATA_START) {
      var ddData = ddSheet.getRange(DATA_START, 1, ddLast - DATA_START + 1, 6).getValues();
      ddData.forEach(function(row) {
        if (!row[0] || !row[1]) return;
        var key = formatDate(row[0]) + '|' + str(row[1]);
        if (!ddMap[key]) ddMap[key] = [];
        ddMap[key].push({
          maHS: str(row[2]), tenHS: str(row[3]),
          trangThai: str(row[4]) || 'Co mat', ghiChu: str(row[5]),
          'MaHS': str(row[2]), 'TrangThai': str(row[4]) || 'Co mat', 'GhiChu': str(row[5])
        });
      });
    }
  }
  var nkLast = nkSheet.getLastRow();
  if (nkLast < DATA_START) return [];
  var nkData = nkSheet.getRange(DATA_START, 1, nkLast - DATA_START + 1, 7).getValues();
  var result = [];
  nkData.forEach(function(r) {
    if (!r[0] || !r[1]) return;
    var ngay = formatDate(r[0]);
    var classId = str(r[1]);
    var caDay = str(r[6]);
    var key = ngay + '|' + classId;
    var attList = ddMap[key] || [];
    var present = 0, absent = 0, late = 0;
    attList.forEach(function(a) {
      var st = a.trangThai;
      if (st === 'Co mat' || st === 'Co mat') present++;
      else if (st === 'Vang' || st === 'Vang') absent++;
      else if (st === 'Muon' || st === 'Muon') late++;
    });
    result.push({
      date: ngay, rawDate: ngay, originalDate: ngay,
      classId: classId, originalClassId: classId,
      caDay: caDay, originalCaDay: caDay,
      teacherName: str(r[2]), content: str(r[3]),
      homework: str(r[4]) || '---', teacherNote: str(r[5]),
      present: present, absent: absent, late: late,
      attendanceList: attList
    });
  });
  return result;
}

// --- Doc GiaoVien (12 cols) ---
function readGiaoVien() {
  var sheet = sh('GiaoVien');
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < DATA_START) return [];
  var data = sheet.getRange(DATA_START, 1, last - DATA_START + 1, 12).getValues();
  return data.filter(function(r) { return r[0]; }).map(function(r) {
    return {
      id: str(r[0]), name: str(r[1]), phone: str(r[2]), email: str(r[3]),
      gender: str(r[4]), dob: formatDate(r[5]), subject: str(r[6]),
      degree: str(r[7]), experience: num(r[8]), salary: num(r[9]),
      status: str(r[10]) || 'active', notes: str(r[11])
    };
  });
}

// --- Doc HocLieu (11 cols) ---
function readHocLieu() {
  var sheet = sh('HocLieu');
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < DATA_START) return [];
  var data = sheet.getRange(DATA_START, 1, last - DATA_START + 1, 11).getValues();
  return data.filter(function(r) { return r[0]; }).map(function(r) {
    return {
      id: str(r[0]), title: str(r[1]), type: str(r[2]),
      subject: str(r[3]), grade: str(r[4]), classId: str(r[5]),
      url: str(r[6]), description: str(r[7]), tags: str(r[8]),
      uploader: str(r[9]), uploadDate: formatDate(r[10])
    };
  });
}

// === HocSinh CRUD ===
// hsVals: 20 cols - col19=notes, col20=facebookUrl

function hsVals(d) {
  return [
    str(d.id),            str(d.name),          str(d.dob),
    str(d.branch),        str(d.grade),          str(d.school),
    str(d.teacher),       str(d.parentName),     str(d.parentPhone),
    str(d.studentPhone),  str(d.address),        str(d.academicLevel),
    str(d.goal),          str(d.supportNeeded),  str(d.classId),
    str(d.startDate),     str(d.endDate),        str(d.status) || 'active',
    str(d.notes),         str(d.facebookUrl)
  ];
}

function saveHS(d) {
  try { sh('HocSinh').appendRow(hsVals(d)); return { ok: true }; }
  catch(err) { return { ok: false, error: 'saveHS: ' + err }; }
}

function updateHS(d) {
  try {
    var row = findRow('HocSinh', 1, d.id, DATA_START);
    if (row < 0) return saveHS(d);
    sh('HocSinh').getRange(row, 1, 1, 20).setValues([hsVals(d)]);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'updateHS: ' + err }; }
}

function deleteHS(d) {
  try {
    var row = findRow('HocSinh', 1, d.id, DATA_START);
    if (row >= 0) sh('HocSinh').deleteRow(row);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'deleteHS: ' + err }; }
}

// === LopHoc CRUD ===
function lopVals(d) {
  return [
    str(d.MaLop || d['Ma Lop']), str(d.TenLop), str(d.Khoi), str(d.GiaoVien),
    str(d.CoSo), str(d.Buoi1), str(d.Buoi2), str(d.Buoi3)
  ];
}
function saveClass(d) {
  try { sh('LopHoc').appendRow(lopVals(d)); return { ok: true }; }
  catch(err) { return { ok: false, error: 'saveClass: ' + err }; }
}
function updateClass(d) {
  try {
    var row = findRow('LopHoc', 1, d.MaLop || d['Ma Lop'], DATA_START);
    if (row < 0) return saveClass(d);
    sh('LopHoc').getRange(row, 1, 1, 8).setValues([lopVals(d)]);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'updateClass: ' + err }; }
}
function deleteClass(d) {
  try {
    var row = findRow('LopHoc', 1, d.MaLop || d['Ma Lop'], DATA_START);
    if (row >= 0) sh('LopHoc').deleteRow(row);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'deleteClass: ' + err }; }
}

// === HocPhi CRUD ===
function pyVals(d) {
  return [
    str(d.date || d.timeStamp) || nowStr(), str(d.soCT || d.docNum),
    str(d.description), str(d.maHS || d.studentId),
    str(d.nguoiNop || d.payer), str(d.method),
    num(d.soTien || d.amount), str(d.note),
    num(d.thangHP), num(d.namHP)
  ];
}
function savePayment(d) {
  try { sh('HocPhi').appendRow(pyVals(d)); return { ok: true }; }
  catch(err) { return { ok: false, error: 'savePayment: ' + err }; }
}
function updatePayment(d) {
  try {
    var row = findRow('HocPhi', 2, d.soCT || d.docNum, DATA_START);
    if (row < 0) return savePayment(d);
    sh('HocPhi').getRange(row, 1, 1, 10).setValues([pyVals(d)]);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'updatePayment: ' + err }; }
}
function deletePayment(d) {
  try {
    var row = findRow('HocPhi', 2, d.id || d.docNum || d.soCT, DATA_START);
    if (row >= 0) sh('HocPhi').deleteRow(row);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'deletePayment: ' + err }; }
}

// === ChiPhi CRUD ===
function cpVals(d) {
  return [
    str(d.date) || nowStr(), str(d.soCT || d.docNum),
    str(d.spender), str(d.category), num(d.amount), str(d.description)
  ];
}
function saveExpense(d) {
  try { sh('ChiPhi').appendRow(cpVals(d)); return { ok: true }; }
  catch(err) { return { ok: false, error: 'saveExpense: ' + err }; }
}
function updateExpense(d) {
  try {
    var row = findRow('ChiPhi', 2, d.soCT || d.docNum, DATA_START);
    if (row < 0) return saveExpense(d);
    sh('ChiPhi').getRange(row, 1, 1, 6).setValues([cpVals(d)]);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'updateExpense: ' + err }; }
}
function deleteExpense(d) {
  try {
    var row = findRow('ChiPhi', 2, d.id || d.docNum || d.soCT, DATA_START);
    if (row >= 0) sh('ChiPhi').deleteRow(row);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'deleteExpense: ' + err }; }
}

// === NhatKy + DiemDanh CRUD ===
function saveDiary(d) {
  try {
    var date = str(d.date), classId = str(d.classId), caDay = str(d.caDay);
    sh('NhatKy').appendRow([date, classId, str(d.teacherName), str(d.content), str(d.homework) || '---', str(d.teacherNote), caDay]);
    var attList = d.attendanceList || [];
    if (attList.length > 0) {
      var rows = attList.map(function(a) {
        return [date, classId,
          str(a.maHS || a['MaHS'] || ''), str(a.tenHS || ''),
          str(a.trangThai || a['TrangThai'] || 'Co mat'),
          str(a.ghiChu   || a['GhiChu']    || '')];
      });
      var ddSheet = sh('DiemDanh');
      ddSheet.getRange(ddSheet.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
    }
    return { ok: true };
  } catch(err) { return { ok: false, error: 'saveDiary: ' + err }; }
}

function updateDiary(d) {
  try {
    var origDate = str(d.originalDate || d.date);
    var origClass = str(d.originalClassId || d.classId);
    var origCa = str(d.originalCaDay || d.caDay);
    var newDate = str(d.date || origDate);
    var newClass = str(d.classId || origClass);
    var newCa = str(d.caDay || origCa);
    var nkSheet = sh('NhatKy');
    var nkLast = nkSheet.getLastRow();
    var nkRow = -1;
    for (var r = DATA_START; r <= nkLast; r++) {
      var rv = nkSheet.getRange(r, 1, 1, 7).getValues()[0];
      if (formatDate(rv[0]) === formatDate(origDate) && str(rv[1]) === origClass &&
          (!origCa || str(rv[6]) === origCa || str(rv[6]) === '')) {
        nkRow = r; break;
      }
    }
    if (nkRow >= 0) {
      nkSheet.getRange(nkRow, 1, 1, 7).setValues([[newDate, newClass, str(d.teacherName), str(d.content), str(d.homework) || '---', str(d.teacherNote), newCa]]);
    } else { return saveDiary(d); }
    var ddSheet = sh('DiemDanh');
    var ddLast = ddSheet.getLastRow();
    for (var dr = ddLast; dr >= DATA_START; dr--) {
      var dv = ddSheet.getRange(dr, 1, 1, 2).getValues()[0];
      if (formatDate(dv[0]) === formatDate(origDate) && str(dv[1]) === origClass) ddSheet.deleteRow(dr);
    }
    var attList = d.attendanceList || [];
    if (attList.length > 0) {
      var rows = attList.map(function(a) {
        return [newDate, newClass,
          str(a.maHS || a['MaHS'] || ''), str(a.tenHS || ''),
          str(a.trangThai || a['TrangThai'] || 'Co mat'),
          str(a.ghiChu   || a['GhiChu']    || '')];
      });
      ddSheet.getRange(ddSheet.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
    }
    return { ok: true };
  } catch(err) { return { ok: false, error: 'updateDiary: ' + err }; }
}

function deleteDiary(d) {
  try {
    var date = str(d.date), classId = str(d.classId), caDay = str(d.caDay);
    var nkSheet = sh('NhatKy');
    for (var r = nkSheet.getLastRow(); r >= DATA_START; r--) {
      var rv = nkSheet.getRange(r, 1, 1, 7).getValues()[0];
      if (formatDate(rv[0]) === formatDate(date) && str(rv[1]) === classId) {
        if (!caDay || str(rv[6]) === caDay) { nkSheet.deleteRow(r); break; }
      }
    }
    var ddSheet = sh('DiemDanh');
    for (var dr = ddSheet.getLastRow(); dr >= DATA_START; dr--) {
      var dv = ddSheet.getRange(dr, 1, 1, 2).getValues()[0];
      if (formatDate(dv[0]) === formatDate(date) && str(dv[1]) === classId) ddSheet.deleteRow(dr);
    }
    return { ok: true };
  } catch(err) { return { ok: false, error: 'deleteDiary: ' + err }; }
}

// === GiaoVien CRUD ===
function tvVals(d) {
  return [str(d.id), str(d.name), str(d.phone), str(d.email), str(d.gender),
          str(d.dob), str(d.subject), str(d.degree), num(d.experience),
          num(d.salary), str(d.status) || 'active', str(d.notes)];
}
function saveTeacher(d) {
  try { sh('GiaoVien').appendRow(tvVals(d)); return { ok: true }; }
  catch(err) { return { ok: false, error: 'saveTeacher: ' + err }; }
}
function updateTeacher(d) {
  try {
    var row = findRow('GiaoVien', 1, d.id, DATA_START);
    if (row < 0) return saveTeacher(d);
    sh('GiaoVien').getRange(row, 1, 1, 12).setValues([tvVals(d)]);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'updateTeacher: ' + err }; }
}
function deleteTeacher(d) {
  try {
    var row = findRow('GiaoVien', 1, d.id, DATA_START);
    if (row >= 0) sh('GiaoVien').deleteRow(row);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'deleteTeacher: ' + err }; }
}

// === HocLieu CRUD ===
function hlVals(d) {
  return [str(d.id), str(d.title), str(d.type), str(d.subject), str(d.grade),
          str(d.classId), str(d.url), str(d.description),
          Array.isArray(d.tags) ? d.tags.join(',') : str(d.tags),
          str(d.uploader), str(d.uploadDate) || nowStr()];
}
function saveMaterial(d) {
  try { sh('HocLieu').appendRow(hlVals(d)); return { ok: true }; }
  catch(err) { return { ok: false, error: 'saveMaterial: ' + err }; }
}
function updateMaterial(d) {
  try {
    var row = findRow('HocLieu', 1, d.id, DATA_START);
    if (row < 0) return saveMaterial(d);
    sh('HocLieu').getRange(row, 1, 1, 11).setValues([hlVals(d)]);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'updateMaterial: ' + err }; }
}
function deleteMaterial(d) {
  try {
    var row = findRow('HocLieu', 1, d.id, DATA_START);
    if (row >= 0) sh('HocLieu').deleteRow(row);
    return { ok: true };
  } catch(err) { return { ok: false, error: 'deleteMaterial: ' + err }; }
}
