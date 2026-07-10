# List Sorting Standard Spec

Last updated: 2026-07-10

## Muc tieu

Mot so danh sach, dropdown va bang hien dang sap xep theo thu tu du lieu goc hoac `localeCompare` don gian. Dieu nay lam cac lop nhu `10B`, `8A`, `12C` hien khong co y do ro rang, va mot so bang kho scan khi doi chieu nghiep vu.

Spec nay chuan hoa nguyen tac sap xep cho toan app:

- Moi list/bang/dropdown phai co thu tu co chu dich.
- Khong doi schema, khong doi GAS contract.
- Khong doi nghiep vu tinh hoc phi, ghi buoi, diem danh.
- Chi them comparator/helper va ap dung vao noi hien thi.

## Nguyen tac chung

### 1. Lop hoc dung natural class order

Khong sap xep lop bang chuoi thuan. Can tach phan khoi va hau to:

```text
6A, 6B, 7A, 8A, 9A, 10A, 10B, 11A, 12A, 12B, 12C
```

Quy tac:

- So khoi nho truoc.
- Cung khoi thi hau to A, B, C... theo alphabet.
- Lop trong/khong xac dinh de cuoi.
- Label hien thi van giu nguyen `Lop 10B`, `10B`, v.v.

De xuat helper:

- `compareClassCode(a, b)`
- `normalizeClassCode(value)`

### 2. Hoc sinh co 2 kieu sap xep chinh

Mac dinh cho danh sach hoc sinh:

```text
Lop natural -> Ten hoc sinh tieng Viet -> Ma HS
```

Dung cho:

- dropdown/datalist chon hoc sinh
- danh sach hoc sinh trong modal
- bang hoc sinh neu khong co sort nghiep vu rieng

Khi man hinh can nhan rui ro/cong no/chuyen can:

```text
Muc do uu tien nghiep vu -> Lop natural -> Ten hoc sinh -> Ma HS
```

Vi du: cong no qua han truoc, canh bao chuyen can truoc.

De xuat helper:

- `compareStudentByClassThenName(a, b)`
- `compareStudentByName(a, b)`

### 3. Lich va buoi hoc tach ro upcoming va history

Lich sap toi:

```text
Ngay tang dan -> Ca day tang dan -> Lop natural
```

Nhat ky/buoi da ghi:

```text
Ngay giam dan -> Ca day giam dan -> Lop natural
```

Man Van hanh co the co status-rank rieng, nhung khi cung status/cung gio van can fallback lop natural.

De xuat helper:

- `compareScheduleUpcoming(a, b)`
- `compareLessonRecent(a, b)`

### 4. Thu chi va lich su tien dung ngay parsed

Khong sort ngay bang string neu du lieu co the la `DD/MM/YYYY`, ISO, timestamp string.

Thu tu mac dinh:

```text
Ngay giam dan -> So phieu giam dan
```

De xuat helper:

- `compareReceiptRecent(a, b)`
- `compareExpenseRecent(a, b)`

Can dung helper ngay co san nhu `formatDate`, `parseDMY` hoac helper parse ngay chung trong codebase.

### 5. Setting-defined order duoc ton trong

Mot so list co thu tu cau hinh co chu dich, khong nen auto alphabet neu setting da la source of truth:

- Chi nhanh/co so.
- Danh muc mac dinh trong app.
- Danh sach giao vien neu man Cai dat da cho nguoi dung sap thu tu.

Neu khong co thu tu cau hinh ro rang, fallback:

```text
Trang thai active/onleave/inactive -> Ten tieng Viet
```

## Quet theo man hinh

## Operations

### Class options

Hien trang:

- `classOptions` va `attendanceClassOptions` dang sort bang `localeCompare`.
- Co nguy co hien `10B` truoc `8A`.

Chuan moi:

- Moi dropdown/filter lop trong Operations dung `compareClassCode`.

### Lich day

Hien trang:

- `scheduleRows` da co y do `date asc -> ca asc`, tot.
- Tie-break hien dung class string.
- `displayScheduleRows` uu tien status gan viec can lam, tot.

Chuan moi:

- Giu status-rank hien tai:
  - dang dien ra
  - co the ghi/can xu ly
  - chua toi gio
  - da ghi
  - nghi/khac
- Khi cung rank/cung gio: lop natural.

### Buoi da ghi

Hien trang:

- `filteredLessons` sort ngay giam dan va gio giam dan, hop ly.
- Tie-break class string.

Chuan moi:

- Ngay giam dan.
- Ca/gio giam dan.
- Lop natural.
- Neu cung lop/cung gio: `MaBuoi` hoac thoi gian cap nhat giam dan neu co.

### Chuyen can

Hien trang:

- `filteredAttendance` uu tien `absent desc -> streak desc`.
- `warningAttendanceRows` uu tien `absent desc -> streak desc -> name`.

Chuan moi:

- Giu uu tien nghiep vu:
  - so vang nhieu hon truoc
  - streak vang lien tiep cao hon truoc
- Tie-break:
  - lop natural
  - ten hoc sinh
  - ma hoc sinh

## Reports

### Doanh thu theo thang

Hien trang:

- Bieu do doanh thu theo thang dang theo Jan -> Dec trong nam, hop ly.

Chuan moi:

- Bao cao nam duong lich: Jan -> Dec.
- Neu sau nay them bao cao nam hoc: Jun -> May/Jun theo `buildSchoolYearMonths`.

### Hoc sinh theo lop

Hien trang:

- `classStudentRows` dang sort theo si so giam dan, sau do ten lop.
- Neu nguoi dung xem nhu bang doi chieu lop, thu tu nay co the gay cam giac khong co y do.

Chuan moi:

- Mac dinh: lop natural.
- Neu muon xem lop dong/it hoc sinh: can co sort control hoac doi label thanh dang ranking nhu `Lop dong nhat`.

### Data Health

Hien trang:

- `visibleHealthIssues` giu thu tu issue definition.

Chuan moi:

- Thu tu phai ro:
  - issue nghiem trong/can sua truoc
  - warning/can kiem tra
  - thong tin/phu
- Neu issue definition da la priority list thi giu, nhung nen comment/constant hoa y do nay.

## ModalFinance

### Chon hoc sinh trong phieu thu

Hien trang:

- `PaymentFormModal` va `FABModal` dung `activeStudents.map` theo thu tu du lieu goc.

Chuan moi:

- Datalist hoc sinh:
  - lop natural
  - ten hoc sinh
  - ma hoc sinh

Ly do:

- Khi nhap nhanh phieu thu, giao vien thuong nho lop truoc, ten sau.
- Tranh danh sach nhay lung tung theo thu tu sheet/import.

### Thang hoc phi

Hien trang:

- Thang/nam phieu thu co logic rieng, khong thay loi sap xep lon.

Chuan moi:

- Neu la chon ky hoc phi dang thu: nam/thang gan hien tai, de thao tac nhanh.
- Neu la timeline nam hoc: dung school-year order.

### Danh muc phieu chi

Hien trang:

- `categoryOptions` tong hop default + data, sau do sort alphabet.
- Dieu nay co the pha thu tu danh muc mac dinh.

Chuan moi:

Default order:

```text
Van hanh -> In an -> Trang thiet bi -> Luong -> Khac
```

Danh muc phat sinh tu du lieu:

```text
Sau default -> alphabet tieng Viet
```

### Nguoi chi

Hien trang:

- `spenderOptions` sort alphabet.

Chuan moi:

- Giu alphabet tieng Viet.

### Lich su thanh toan

Hien trang:

- `paymentHistory` sort bang string date desc.
- Co rui ro sai neu ngay la `DD/MM/YYYY`.

Chuan moi:

- Sort bang parsed date desc.
- Tie-break so phieu desc.

## ModalClass

### Giao vien

Hien trang:

- `teacherOptions` theo thu tu `teacherList` dau vao.

Chuan moi:

- Neu `teacherList` den tu Cai dat va nguoi dung co the sap thu tu: giu thu tu cau hinh.
- Neu khong co thu tu cau hinh: active/onleave/inactive -> ten tieng Viet.

### Co so/chi nhanh

Hien trang:

- `branchOptions` giu thu tu default + settings.

Chuan moi:

- Giu thu tu cau hinh, khong sort alphabet.

### Chuyen lop hang loat

Hien trang:

- `fromClasses` theo thu tu hoc sinh duoc chon.
- `classOptions` theo thu tu `uniqueClasses`.
- Chips hoc sinh theo thu tu selection.

Chuan moi:

- `fromClasses`: lop natural.
- `classOptions`: lop natural.
- Chips hoc sinh: lop natural -> ten -> ma hoc sinh.
- Neu tat ca hoc sinh dang o cung mot lop, co the exclude lop hien tai khoi dropdown lop dich de tranh chon nham.

## Cac noi can ap dung them ngoai 4 vung tren

### ModalDiary

- Dropdown lop trong form ghi buoi dung lop natural.
- Danh sach hoc sinh goi y/them vao buoi dung lop natural -> ten.

### StudentsTab

- Filter lop dung lop natural.
- Bang hoc sinh mac dinh dung lop natural -> ten -> ma HS.
- Neu co search/filter, sort van ap dung sau filter.

### ClassesTab

- Bang lop mac dinh dung lop natural.
- Neu sau nay co sort theo si so/doanh thu, can hien sort state ro.

### FinanceTab

- Class filter dung lop natural.
- Bang cong no:
  - qua han/chua thu uu tien truoc theo logic hien tai
  - sau do lop natural
  - ten hoc sinh
- Bang phieu thu/chi:
  - ngay parsed desc
  - so phieu desc

## Ke hoach code de xuat

### Phase 1: Helper trung tam

Them comparator vao helper/shared utility phu hop, uu tien file da co date/name helpers.

Khong doi UI trong phase nay ngoai import helper.

### Phase 2: Dropdown/filter it rui ro

Ap dung:

- ModalDiary class/student suggestions.
- ModalFinance student datalist/category options/payment history.
- ModalClass transfer dropdown/from-class/chips.
- Operations class filters.
- FinanceTab class filters.
- StudentsTab class filters.

### Phase 3: Bang/list chinh

Ap dung:

- StudentsTab table.
- ClassesTab table.
- Operations schedule/lessons/attendance.
- Reports class student rows/data health priority.
- Finance debt/ledger/expense tables.

### Phase 4: QA

Kiem tra bang Chrome local:

- Dropdown lop trong Ghi buoi hoc hien `6A, 7A, 8A, 9A, 10A, 10B, 11A, 12A...`.
- Them hoc sinh vao buoi: goi y theo lop/ten, khong theo thu tu sheet.
- Phieu thu: datalist hoc sinh theo lop/ten.
- Cong no: van uu tien chua thu/qua han, nhung trong cung nhom thi theo lop/ten.
- Van hanh: lich sap toi van dung thu tu viec can lam; cung gio thi lop natural.
- Reports: danh sach hoc sinh theo lop khong bi ranking ngam, tru khi label/sort control noi ro.

## Pham vi khong lam trong spec nay

- Khong doi schema Google Sheets.
- Khong doi GAS API contract.
- Khong them sort UI phuc tap neu chua can.
- Khong doi cong thuc hoc phi, doanh thu, cong no.
- Khong doi nghiep vu ghi buoi hoc.

