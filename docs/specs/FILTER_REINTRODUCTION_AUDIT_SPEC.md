# Filter Reintroduction Audit Spec

Last updated: 2026-07-10

## Muc tieu

Truoc day mot so bo loc da duoc bo bot de UI gon, dep va it vo layout. Sau khi app them nhieu nghiep vu moi nhu hoc phi theo thang, ghi buoi chinh khoa/tang cuong, chuyen can va doi soat, can ra soat lai bo loc nao nen dua lai.

Muc tieu cua spec:

- Dua lai cac bo loc thuc su can cho van hanh hang ngay.
- Khong lam toolbar bi nhay cao/thap khi filter bat/tat.
- Khong tao cam giac so lieu tong quan bi loc sai.
- Khong doi schema, GAS contract hoac cong thuc nghiep vu.

## Nguyen tac UI cho filter

### 1. Toolbar phai co chieu cao on dinh

Khong nen them/xoa nut lam toolbar nhay layout theo state.

Nen dung:

- mot filter row co slot on dinh
- select co width on dinh
- reset filter dang icon/chip nam trong slot co san
- mobile dung grid 2 cot nhu hien tai

Can han che:

- nut `Xoa loc` chi xuat hien khi co filter lam day cac control khac
- nut `Thang nay` chi xuat hien lam toolbar doi width/row
- qua nhieu select tren cung mot hang desktop

### 2. Moi filter phai co pham vi ro

Neu filter ap dung cho toan man, dat trong toolbar.

Neu filter chi ap dung cho mot section, dat trong header section do. Khong dua len toolbar vi de gay hieu nham KPI toan man cung bi loc.

### 3. Khong tron filter nghiep vu voi filter bao cao tong

Bao cao tong quan khong nen co global class filter neu KPI van la toan trung tam. Neu them loc lop cho Reports thi phai:

- hoac ap dung that su cho tat ca KPI tren man
- hoac dat o section rieng va ghi ro no chi loc section do

## Uu tien thuc hien

### P0 - Nen sua truoc vi dang co state/logic an hoac de gay hieu sai

- Finance cong no: `qF` va `fSt` dang con trong props/domain nhung khong duoc hien thi/dung nhat quan trong `FinanceTab`.
- Finance cong no: `debtFocus = unpaid` co the duoc bat tu KPI, nhung toolbar khong hien ro dang loc `Can thu`.
- Operations buoi hoc: `lessonFocus = noAttendance` co the duoc bat tu KPI, nhung toolbar khong hien ro dang loc `Chua diem danh`.
- Operations chuyen can: `attendanceFocus = warning` co the duoc bat tu KPI, nhung toolbar khong hien ro dang loc `Can theo doi`.

### P1 - Nen dua lai vi tang toc thao tac hang ngay

- Students: filter tinh trang hoc sinh.
- Classes: filter tinh trang lop.
- Teachers: search/status filter.
- Finance phieu thu: search theo hoc sinh/so phieu.
- Finance phieu chi: khong dua lai filter phu trong phase nay, giu gon theo thang va nguoi chi.

### P2 - Co the them sau neu du lieu tang lon

- Operations buoi hoc: filter loai buoi `Chinh khoa/Tang cuong`.
- Reports: filter section-level cho lop hoac loai bao cao.
- Classes: filter co so/chi nhanh neu so lop tang hoac co nhieu dia diem.

## Ra soat theo man hinh

## Hoc sinh

### Hien trang

Toolbar hien co:

- tab Dao tao
- search `Tim`
- class filter
- nut them hoc sinh

State hien co:

- `statusFilter`: `active | all | inactive`
- `hideInactive`
- `studentFocus = unassigned` trong `LearningTab`, nhung khong co UI setter

Van de:

- Mac dinh an hoc sinh nghi la dung, nhung nguoi dung kho xem nhanh hoc sinh da nghi.
- Co state filter tinh trang nhung UI khong hien.
- Hoc sinh chua gan lop la loi du lieu quan trong, nhung hien khong co nut loc nhanh.

De xuat dua lai:

1. `Tinh trang` select compact:

```text
Dang hoc | Tat ca | Da nghi | Chua co lop
```

2. Giu search + lop filter.

Khong nen them:

- filter giao vien tren man hoc sinh luc nay, vi da co lop la truc nghiep vu chinh.
- filter hoc phi trong man hoc sinh, vi man Hoc phi da xu ly cong no.

UI:

- Desktop: search 136px, lop 96px, tinh trang 116px.
- Mobile: grid 2 cot, khong doi hanh vi mobile hien tai neu chua can.

## Lop hoc

### Hien trang

Toolbar hien co:

- search lop
- filter giao vien

State/logic hien co:

- `getClassStatus`: `active | missingTeacher | missingSchedule | inactive`
- `classFocus = missingTeacher` trong `LearningTab`, nhung khong co UI setter

Van de:

- Lop thieu giao vien/chua co lich la loi van hanh quan trong.
- Hien co badge tren row, nhung khong co filter de loc nhanh nhom can sua.

De xuat dua lai:

1. `Tinh trang lop` select:

```text
Tat ca | Dang mo | Thieu GV | Chua lich | Da dong
```

2. Giu search + giao vien.

Khong nen them ngay:

- branch/co so filter, tru khi co nhieu co so that su.
- filter si so, vi do la sort/ranking hon la filter.

UI:

- Desktop co 3 control nho sau tab Dao tao.
- Mobile grid 2 cot, control thu 3 xuong hang rieng nhung toolbar can co chieu cao on dinh.

## Giao vien

### Hien trang

Toolbar hien co:

- chi co tab Dao tao + nut Them giao vien.

State/props:

- `focusFilter?: all | active` co trong props nhung chua dung.
- Rows da sort active truoc, sau do theo so buoi day/thang.

Van de:

- Khi so giao vien tang, khong co search.
- Giao vien nghi/tam nghi van co the xuat hien tu du lieu lop/hoc sinh/nhat ky cu.
- Kho loc `dang day`, `tam nghi`, `chua co lop`.

De xuat dua lai:

1. Search `Tim GV`.
2. `Trang thai` select:

```text
Dang day | Tat ca | Tam nghi | Da nghi | Chua co lop
```

Khong nen them:

- filter mon/chuyen mon, vi app hien gan nhu Toan va chua phai truc van hanh chinh.
- filter doanh thu giao vien, vi nen la sort/ranking neu can.

UI:

- Desktop: search 136px + status 120px.
- Mobile: co the giu an neu giao vien it, hoac grid 2 cot.

## Van hanh

## Lich day

### Hien trang

Toolbar hien co:

- month period control
- nut `Thang nay` chi hien khi khac thang hien tai
- class filter

Van de:

- Nut `Thang nay` conditional co the lam toolbar thay doi width.
- Khong co status filter, nhung display da sap theo viec can lam nen tam on.

De xuat:

1. Chua can them status filter neu danh sach van ngan.
2. Nen gop `Thang nay` vao period control bang icon/chip co slot co dinh de khong nhay layout.
3. Neu can them sau, chi them mot select:

```text
Tat ca | Can ghi | Chua toi gio | Da ghi | Nghi
```

## Buoi hoc

### Hien trang

Toolbar hien co:

- month filter
- class filter

State an:

- `lessonFocus = all | noAttendance`

Van de:

- Khi bam KPI `Chua diem danh`, list da loc nhung toolbar khong hien filter dang active.
- De gay nham la du lieu bi thieu.

De xuat dua lai:

1. `Trang thai` select:

```text
Tat ca | Chua diem danh
```

2. Giu month + class.

P2:

- `Loai buoi`: `Tat ca | Chinh khoa | Tang cuong`
- Chi them khi nhu cau doi soat tang cuong/chinh khoa xuat hien thuong xuyen.

## Chuyen can

### Hien trang

Toolbar hien co:

- month filter
- class filter

State an:

- `attendanceFocus = all | warning`

Van de:

- Khi bam KPI canh bao chuyen can, list da loc nhung toolbar khong hien ro.

De xuat dua lai:

1. `Muc do` select:

```text
Tat ca | Can theo doi
```

2. Giu month + class.

Khong nen them:

- filter rieng `vang/co phep/co mat`, vi bang nay dang la bang tong hop canh bao, khong phai bang log diem danh chi tiet.

## Hoc phi va Thu chi

## Cong no

### Hien trang

Toolbar hien co:

- class filter
- month filter

State/props lien quan:

- `qF`, `fSt`, `fTch` van con trong `useDomains` va props.
- `FinanceTab` dang reset `fTch` ve rong.
- `debtFocus = all | unpaid` la state noi bo trong FinanceTab.

Van de:

- Co hai he filter cu/moi chua duoc don sach:
  - `fSt` tu domain
  - `debtFocus` trong FinanceTab
- Search cong no theo hoc sinh (`qF`) khong con hien/dung nhat quan.
- Khi bam KPI `Con phai thu`, table co the dang loc nhung toolbar khong co select noi ro.

De xuat sua:

1. Hop nhat `fSt` va `debtFocus` thanh mot filter hien tren toolbar:

```text
Tat ca | Can thu | Da thu
```

2. Dua lai search hoc sinh cho cong no:

```text
Tim HS
```

3. Giu class + month.

UI de khong vo layout:

- Toolbar desktop hien month + class + status + search neu du chieu ngang.
- Search `Tim HS` la desktop-only.
- Mobile giu 2 cot va an search de khong vo layout; search khong duoc loc ngam tren mobile.

Nghiep vu:

- `Can thu` gom `unpaid` va `overdue`.
- `Da thu` chi gom hoc sinh billable da co phieu cho thang dang xem.
- Khong hien hoc sinh khong billable trong thang do.
- Khong quay lai logic thanh toan mot phan.

## Phieu thu

### Hien trang

Toolbar hien co:

- month filter
- class filter

Van de:

- Neu phieu thu nhieu, can tim nhanh theo hoc sinh/ma phieu.

De xuat dua lai:

1. Search desktop-only tren toolbar:

```text
Tim HS / so phieu
```

2. Giu month + class tren toolbar; mobile an search.

Khong nen them:

- status phieu thu, vi phieu thu da la giao dich da ghi.

## Phieu chi

### Hien trang

Toolbar hien co:

- month filter
- nguoi chi filter

Van de:

- So luong phieu chi hien tai con it, them nut `Loc` chi de loc danh muc lam tang thao tac va gay cam giac cong kenh.

De xuat:

1. Giu month + nguoi chi.
2. Khong hien nut `Loc` cho phieu chi trong phase nay.

P2:

- Search noi dung chi, neu phieu chi tang nhieu.

## Bao cao

### Hien trang

Toolbar hien co:

- period control T/thang
- export CSV
- print

Van de:

- Thieu filter lop co the khong phai loi, vi day la bao cao tong.
- Neu them class filter global de xem mot lop, tat ca KPI phai tinh lai theo lop, neu khong se gay sai nghiep vu.

De xuat:

1. Khong dua class filter global vao toolbar luc nay.
2. Giu period control la filter chinh.
3. Neu can loc section `Hoc sinh theo lop`, dat filter/sort trong section do, khong dat tren toolbar.
4. Neu sau nay can bao cao theo lop, nen tao mode ro:

```text
Toan trung tam | Theo lop
```

Va khi chon `Theo lop`, moi KPI phai doi theo lop do.

## ModalFinance

### Hien trang

Modal phieu thu/chi chu yeu dung form va datalist.

De xuat:

- Khong them filter phuc tap trong modal.
- Chi can sort datalist hoc sinh va danh muc theo spec sap xep.
- Neu them phieu thu tu cong no, form phai giu context thang/lop/hoc sinh da chon.

## ModalClass

### Hien trang

Modal lop/chuyen lop co select lop/giao vien.

De xuat:

- Khong them filter moi.
- Chi can sort lop/giao vien dung chuan.
- Bulk transfer co the them search hoc sinh sau, nhung khong can trong phase filter nay.

## Ket luan de xuat code

### Phase 1 - Sua filter an va hien trang thai loc

- Finance cong no: hien status filter `Tat ca/Can thu/Da thu`, hop nhat voi `debtFocus`.
- Operations buoi hoc: hien `Tat ca/Chua diem danh`.
- Operations chuyen can: hien `Tat ca/Can theo doi`.

### Phase 2 - Dua lai filter tac nghiep

- Students: `Tinh trang`.
- Classes: `Tinh trang lop`.
- Teachers: search + `Trang thai`.
- Finance cong no/phieu thu: search theo hoc sinh/so phieu.
- Finance phieu chi: giu gon `Thang` + `Nguoi chi`.

### Phase 3 - On dinh layout

- Tao pattern filter row co slot on dinh trong toolbar.
- Reset filter khong lam day layout.
- Mobile giu grid 2 cot va khong lam noi dung bi reflow bat ngo.

### Phase 4 - QA nghiep vu

- Bam KPI `Chua diem danh` trong Van hanh: toolbar phai hien dang loc.
- Bam KPI `Con phai thu`: toolbar phai hien `Can thu`.
- Chon `Da thu` o cong no: chi hien hoc sinh billable da nop thang dang xem.
- Chon `Da nghi` o Hoc sinh: khong anh huong cong no thang hien tai.
- Reports khong bi loc lop ngam.
- Reload trang giu state loc can thiet hoac reset ve mac dinh ro rang.
