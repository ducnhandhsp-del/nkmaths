# PROJECT_STATUS.md

# TOAN NK Manager - Project Status

Day la baseline hien tai cua app quan ly **LOP TOAN NK** sau cac dot on dinh du lieu, navigation, UI rebuild va QA bug-fix gan nhat.

Muc tieu cua file nay: giup nguoi/AI tiep theo biet app dang o trang thai nao, dau la quyet dinh san pham hien hanh, va nhung vung nao khong duoc pha vo.

## 1. Current Status

App hien la he thong quan ly lop hoc noi bo, tap trung vao thao tac hang ngay voi du lieu that tu Google Sheets/App Script.

Trang thai gan nhat:

```text
npm.cmd run lint: pass
npm.cmd run build: pass
```

Cac vung nghiep vu hien tai:

```text
Tong quan
Dao tao
Van hanh
Tai chinh
Bao cao
He thong
```

Vai tro:

- **Tong quan**: dashboard dieu hanh hom nay.
- **Dao tao**: du lieu goc hoc sinh, lop hoc, giao vien.
- **Van hanh**: lich day, ghi buoi hoc, buoi hoc gan day, canh bao chuyen can.
- **Tai chinh**: hoc phi, cong no, phieu thu, phieu chi.
- **Bao cao**: bao cao va thong ke de xem/in/xuat.
- **He thong**: cai dat trung tam, tai chinh, van hanh, thong bao, ket noi.

Khong dua lai kieu navigation demo cu: Dashboard / Hoc sinh / Lop hoc / Diem danh / Hoc phi / Lich / Bao cao tach roi.

## 2. IA / Navigation Hien Tai

### 2.1 Desktop

Desktop dung sidebar trai dang **grouped flat navigation**:

```text
TONG QUAN
- Tong quan

DAO TAO
- Hoc sinh
- Lop hoc
- Giao vien

VAN HANH
- Lich day & Van hanh

TAI CHINH
- Hoc phi & Thu chi

BAO CAO
- Bao cao & Thong ke

HE THONG
- Cai dat
```

Sidebar co collapse desktop:

```text
expanded: 236px
collapsed: 72px
```

### 2.2 Mobile

Mobile bottom nav giu 5 vung chinh:

```text
Tong quan | Dao tao | Van hanh | Tai chinh | Bao cao
```

`Cai dat` thuoc He thong, khong phai item chinh cua bottom nav.

### 2.3 Internal State

Type hien tai:

```text
Screen = overview | operations | training | finance | reports | settings
TrainingSub = students | classes | teachers
OperationsSub = schedule | lessons | attendance
FinanceSub = ledger | debt | expense
ReportsSub = training | operations | finance
```

Sub keys co the con duoc giu noi bo de tranh doi rong, nhung UI hien tai khong nen render them tab con lap lai o content neu sidebar da chon dung man.

## 3. Data And Business Logic Stable Areas

### 3.1 Google Sheet / Apps Script

App da dong bo voi Sheet/App Script moi cho nam hoc 2026-2027.

Da ra cac cum:

- `GiaoVien`
- `LopHoc`
- `HocSinh`
- `DangKyLop`
- `HocPhi/CongNo`
- `BuoiHoc/TeachingLog`
- `DiemDanh`

Khong sua Apps Script hoac schema khi task chi la UI/navigation/documentation.

### 3.2 Student ID

Ma hoc sinh chuan:

```text
HS001
HS002
HS003
...
```

Khong tu doi format ma hoc sinh.

### 3.3 Phone

So dien thoai phai giu string de khong mat so `0` dau:

- SDT hoc sinh
- SDT phu huynh
- SDT/Zalo giao vien
- SDT/Zalo trung tam

### 3.4 Attendance

Trang thai diem danh chi co:

```text
Co mat
Vang
Co phep
```

Khong them trang thai moi neu chua co yeu cau nghiep vu ro.

### 3.5 Tuition/Debt

Logic cong no da on theo hoc sinh billable.

Bat buoc ton trong:

- `startDate`
- `endDate`
- `status`
- `thangHP`
- `namHP`

Khong tinh no:

- Truoc thang bat dau hoc.
- Sau thang nghi hoc.
- Cho thang tuong lai.
- Cho hoc sinh khong billable.

### 3.6 Teachers

Lien ket giao vien:

- Uu tien `MaGV`.
- Fallback theo `GiaoVien`/ten giao vien de tuong thich du lieu cu.
- Lop co the giu ca `MaGV` va `GiaoVien`.

### 3.7 Payments

Hinh thuc thanh toan hien thi:

```text
Chuyen khoan
Tien mat
```

Khong hien text `bank/cash` cho nguoi dung.

## 4. Current Screens

### 4.1 Tong quan

Vai tro: dashboard dieu hanh hang ngay, khong phai bao cao dai.

No nen tap trung:

- KPI nhanh.
- Viec can xu ly.
- Lich day hom nay.
- Thao tac nhanh.
- Canh bao no phi/vang nhieu/chua ghi buoi neu co du lieu.

### 4.2 Dao tao

`LearningTab` gom:

- `StudentsTab`
- `ClassesTab`
- `TeachersTab`

Vai tro: quan ly du lieu goc. Khong tinh lai logic tai chinh/chuyen can neu khong can.

### 4.3 Van hanh

`OperationsTab` hien la mot man gop:

```text
LICH DAY & VAN HANH
```

No gom:

- KPI van hanh neu co.
- Lich day tuan nay.
- Nut `Ghi buoi hoc`.
- Buoi hoc gan day.
- Canh bao chuyen can.

Khong doi logic luu buoi hoc/diem danh.

### 4.4 Tai chinh

`FinanceTab` hien la mot man gop:

```text
HOC PHI & THU CHI
```

No gom:

- KPI tai chinh thang.
- Cong no can xu ly.
- Phieu thu gan day.
- Phieu chi gan day.
- Action them phieu thu/phieu chi.

Khong doi logic cong no/thu/chi.

### 4.5 Bao cao

`ReportsTab` hien la mot man gop:

```text
BAO CAO & THONG KE
```

No gom:

- KPI bao cao tong quan.
- Doanh thu theo thang.
- Hoc sinh theo lop.
- Cac thong ke phu neu logic cu da co va render an toan.

Khong dua thao tac nghiep vu chinh vao Bao cao.

### 4.6 He thong

`SettingsTab` gom:

- Trung tam
- Tai chinh
- Van hanh
- Thong bao
- He thong

Khong dua lai muc `Giao dien` neu chua co gia tri thuc te.

## 5. UI System Status

`uiSystem.tsx` la nguon chuan moi cho UI dung chung:

- `PageToolbar`
- `DataTable`
- `EmptyState`
- `StatusBadge`
- `MoneyText`
- `DateText`
- `MonthText`
- `MobileCard`
- `ConfirmDialog/useConfirm`
- `notify`

`dsComponents.tsx` va `AppComponents.tsx` van giu nhu bridge/legacy. Khong xoa neu con import hoac chua chac an toan.

UI hien tai uu tien:

- Sidebar grouped flat navigation.
- Header ngan: title + filter/action.
- Table desktop compact.
- Mobile dung card/list khi co the.
- Modal form toi uu cho thao tac nhanh.
- Empty state ngan gon.

## 6. No-Break Rules

Khong duoc:

- Doi Google Sheet schema neu khong co yeu cau ro.
- Doi Apps Script contract neu task khong lien quan.
- Doi field du lieu ma chua cap nhat day du frontend/backend/sheet.
- Doi logic cong no da on.
- Bo `startDate/endDate/status/thangHP/namHP`.
- Ep so dien thoai sang number.
- Them trang thai diem danh ngoai `Co mat / Vang / Co phep`.
- Xoa fallback giao vien legacy.
- Bien Tong quan thanh bao cao dai.
- Dua lai subtab/tong hop lap lai trong content neu sidebar da chon man.

## 7. QA Checklist

Checklist chi tiet nam o:

```text
QA_RELEASE_CHECKLIST.md
```

Can test tay toi thieu:

- Click tung item sidebar khong bi man trang.
- Mobile bottom nav khong vo.
- Them/sua hoc sinh giu SDT co so 0 dau.
- Ghi buoi hoc luu dung lop/ngay/ca/giao vien/noi dung/diem danh.
- Diem danh chi co 3 trang thai.
- Cong no tinh dung billable.
- Phieu thu luu duoc `MaHS`, `MaLop`, `ThangHP`, `NamHP`, so tien.
- Phieu chi khong anh huong cong no hoc phi.
- Zalo/Goi khong hien sai so.
- Bien lai dung thong tin.

## 8. Next Priorities

1. Chay QA release voi du lieu that.
2. Chi sua bug that phat hien trong QA.
3. Neu UI da on, commit moc on dinh.
4. Sau do moi tach folder/module nho neu can.
5. Sau do moi toi uu bundle/performance.

## 9. Build Gate

Sau moi thay doi quan trong:

```bash
npm.cmd run lint
npm.cmd run build
```

Neu build co warning chunk size lon hon 500 kB, ghi nhan la rui ro toi uu hieu nang, khong phai bug nghiep vu.
