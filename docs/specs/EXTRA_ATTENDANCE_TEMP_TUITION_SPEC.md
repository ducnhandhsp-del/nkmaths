# Monthly Tuition Debt With Attendance Audit Spec

## Goal

Chuan hoa nghiep vu hoc phi cho Lop Toan NK theo huong de van hanh hang ngay:

- Cong no/hoc phi duoc chot theo **thang hoc phi** (`ThangHP/NamHP`).
- So buoi hoc/diem danh la thong tin **doi soat phu**, khong phai luat chinh de quyet dinh no.
- Hoc sinh co the vang, hoc bu lop khac, hoc trong buoi ghep nhieu nhom; cac luot nay van can thong ke dung de kiem tra cong bang.
- Ky nhap hoc giua thang, vi du bat dau `15/06`, phai duoc chot gon trong thang 6 neu da co phieu thu thang 6; khong duoc lam kho viec tinh cong no thang 7.

Quyet dinh san pham:

```text
Cong no = theo thang hoc phi.
Doanh thu = theo ngay thu.
So buoi = thong ke/doi soat phu.
```

## Mental Model

### Ky hoc phi

`ThangHP/NamHP` la ky cong no va doi soat hoc phi.

Vi du:

```text
ThangHP = 6, NamHP = 2026 -> hoc phi T6/2026
ThangHP = 7, NamHP = 2026 -> hoc phi T7/2026
```

Moi ky thang doc lap voi nhau. Da chot T6 thi khong tu dong keo thieu/du sang T7.

### Phieu thu

Phieu thu co hai moc thoi gian khac nhau:

- `NgayThu`: ngay tien thuc su duoc ghi nhan. Dung de tinh doanh thu/dong tien.
- `ThangHP/NamHP`: ky hoc phi ma phieu thu thanh toan. Dung de tinh da thu/chua thu cua cong no.

Mot hoc sinh duoc xem la **da thu ky Tm/yyyy** neu co it nhat mot phieu thu cua hoc sinh do voi:

```text
payment.studentId = student.id
payment.ThangHP = m
payment.NamHP = yyyy
```

So tien tren phieu la so tien da thoa thuan/da thu cho ky do. Khong tu dong tinh phan con thieu neu so tien nho hon `baseTuition`, tru khi sau nay co nghiep vu thu thieu/thu bu rieng.

### So buoi hoc

So buoi hoc cua hoc sinh duoc dem tu `DiemDanh`:

```text
1 luot hoc = hoc sinh co dong DiemDanh trong 1 MaBuoi voi TrangThai = Co mat
```

Quy tac thong ke:

- `Co mat` -> +1 luot hoc.
- `Vang` -> +0.
- `Co phep` -> +0.
- `LoaiDiemDanh = extra` van duoc tinh neu hoc sinh `Co mat`.
- Hoc sinh hoc bu lop khac van duoc tinh vao so buoi cua hoc sinh do.
- Neu mot hoc sinh bi trung dong diem danh trong cung `MaBuoi`, chi tinh 1 luot.

Nhung so buoi khong lam thay doi trang thai cong no thang.

## Business Rules

### 1. Cong no theo thang la source of truth

Voi mot ky Tm/yyyy, hoc sinh co phat sinh hoc phi neu:

- hoc sinh dang hoc trong ky do theo `startDate/endDate`;
- ky khong nam truoc thang bat dau hoc;
- ky khong nam tu thang nghi tro di theo logic hien co;
- ky khong phai thang tuong lai neu man hinh dang tinh cong no hien tai.

Trang thai ky:

```text
not_billable -> khong tinh phi ky nay
paid         -> da co phieu thu cho ThangHP/NamHP
unpaid       -> chua co phieu thu, chua qua han dong
overdue      -> chua co phieu thu, da qua han dong
inactive     -> hoc sinh da nghi/khong con tinh phi theo ky
```

Neu hoc sinh `paid`, khong hien no cho ky do bat ke so buoi hoc trong ky la bao nhieu.

### 2. Ky nhap hoc giua thang

Ky nhap hoc la thang cua `startDate`.

Vi du:

```text
startDate = 15/06/2026
```

Quy tac:

- T6/2026 la ky nhap hoc.
- Neu da co phieu thu T6/2026, T6/2026 duoc xem la da chot.
- Neu so tien phieu T6/2026 nho hon `baseTuition`, app van xem T6/2026 la `paid`; khong tu sinh "con thieu" va khong keo sang T7/2026.
- T7/2026 la ky doc lap tiep theo. Neu chua co phieu T7/2026 thi T7/2026 la `unpaid` hoac `overdue` theo han dong.

Neu ky nhap hoc chua co phieu:

- Hien trang thai `unpaid`/`overdue` nhu cac ky khac.
- Hien nhan phu `Ky nhap hoc` de nguoi dung biet so tien co the linh hoat.
- Nut `Thu phi` phai hien.
- So tien goi y co the la `baseTuition` theo mac dinh hien co, nhung form thu phi cho phep sua so tien truoc khi luu.

Khong tu dong prorate theo ngay hoc trong MVP nay. Neu sau nay can, them cau hinh rieng, khong suy dien ngam.

### 3. Ky nghi hoc

Giu logic hien co de tranh doi rong:

- Khong tinh no truoc `startDate`.
- Khong tinh no sau `endDate`.
- Voi hoc sinh co `endDate` trong mot thang, thang do khong tinh phi theo logic hien tai.

Neu trung tam muon thu mot phan thang nghi trong tuong lai, can co nghiep vu rieng.

### 4. So buoi la thong tin doi soat

Trong man cong no, so buoi chi tra loi cac cau hoi:

- Ky nay hoc sinh da hoc bao nhieu buoi?
- Co bao nhieu buoi la hoc bu/ngoai lop?
- Hoc sinh vang/hoc bu co hop ly khong?
- Co hoc sinh nao qua it buoi hoac hoc bu nhieu bat thuong khong?

So buoi khong tra loi cau hoi:

- Hoc sinh co no thang nay khong?
- Hoc sinh da dong thang nay chua?
- Thang sau co phai thu khong?

### 5. Doanh thu va da thu

Can tach ro copy UI:

- `Doanh thu trong thang`: tong `amount` theo `NgayThu`.
- `Da thu ky nay`: tong `amount` theo `ThangHP/NamHP` cua ky dang loc.
- `Con phai thu`: tong tien cua hoc sinh `unpaid`/`overdue` trong ky dang loc.

Khong dung chung mot so lieu cho ca dong tien va cong no.

## Data Contract

Khong doi schema trong phase nay.

Sheet `HocPhi` can co cac cot dang dung:

```text
MaPhieuThu
NgayThu
MaHS
MaLop
ThangHP
NamHP
SoTien
HinhThuc
NguoiNop
NguoiThu
GhiChu
```

Sheet `BuoiHoc` va `DiemDanh` van dung cho thong ke so buoi:

```text
BuoiHoc: MaBuoi, Ngay, MaLop, CaDay, LoaiBuoiHoc
DiemDanh: MaDiemDanh, MaBuoi, MaHS, TrangThai, LoaiDiemDanh, GhiChu
```

Du lieu cu:

- Thieu `LoaiBuoiHoc` -> xem la `regular`.
- Thieu `LoaiDiemDanh` -> xem la `regular`.
- Thieu `MaBuoi` -> frontend co the fallback bang `Ngay|MaLop|CaDay` cho thong ke, nhung du lieu chuan nen co `MaBuoi`.

## UI Rules

### Man Cong no

Man cong no phai toi uu cho thao tac thu tien nhanh, khong bien thanh bao cao phuc tap.

KPI de xuat:

```text
Phai thu ky nay
Da thu ky nay
Con phai thu
Qua han
```

Bang desktop de xuat:

```text
Hoc sinh | Lop | So buoi | Thanh tien | Han dong | Trang thai | Thao tac
```

Trong do:

- `Hoc sinh`: ten + ma hoc sinh.
- `Lop`: lop dang ky/chinh.
- `So buoi`: hien compact, vi du `6 buoi`, `6 buoi · 1 hoc bu`.
- `Thanh tien`:
  - `paid` -> so tien tren phieu da thu;
  - `unpaid/overdue` -> so tien goi y thu, mac dinh `baseTuition`;
  - `not_billable/inactive` -> 0 hoac an khoi bang cong no.
- `Trang thai`: `Da thu`, `Chua thu`, `Qua han`, `Khong tinh phi`.
- `Thao tac`:
  - `paid` -> xem bien lai;
  - `unpaid/overdue` -> nut `Thu phi` phai hien;
  - `not_billable/inactive` -> khong co thao tac thu.

Khong bat buoc hien chi tiet chu ky 4/8/12 trong bang cong no chinh. Neu can, dua vao tooltip, modal chi tiet, hoac section doi soat rieng.

### Section doi soat so buoi

Neu van can xem so buoi ky nay, dat thanh section phu:

```text
Doi soat so buoi
```

No co the hien:

- hoc sinh;
- lop;
- so buoi co mat trong ky;
- so buoi hoc bu/ngoai lop;
- so vang/co phep;
- ghi chu bat thuong.

Section nay khong tao cong no va khong doi trang thai thu tien.

### Form Thu phi

Khi mo tu man cong no:

- `maHS` lay tu row.
- `maLop` lay tu lop dang ky hien tai.
- `thangHP/namHP` lay tu ky dang loc.
- `soTien` goi y:
  - neu ky nhap hoc chua thu -> mac dinh `baseTuition`, cho sua;
  - ky thuong -> `baseTuition`;
  - neu co cau hinh/ghi nho so tien rieng trong tuong lai thi uu tien cau hinh do.

Khong tu dong doi `thangHP/namHP` theo `NgayThu`.

## Acceptance Criteria

### Case 1: Hoc sinh nhap hoc giua thang da dong ky dau

```text
HS001 startDate = 15/06/2026
Co phieu thu:
  ThangHP = 6
  NamHP = 2026
  SoTien = 300000
```

Ket qua:

- T6/2026: `paid`.
- App khong hien "con thieu" 300000 neu `baseTuition = 600000`.
- T7/2026: tinh doc lap; neu chua co phieu T7 thi `unpaid`/`overdue`.
- Khong keo so tien thieu cua T6 sang T7.

### Case 2: Hoc sinh nhap hoc giua thang chua dong ky dau

```text
HS001 startDate = 15/06/2026
Khong co phieu T6/2026
```

Ket qua:

- T6/2026: `unpaid` neu chua qua han, `overdue` neu da qua han.
- Row co nhan phu `Ky nhap hoc`.
- Nut `Thu phi` hien.
- Form thu phi cho phep sua so tien.

### Case 3: Hoc sinh hoc bu lop khac

```text
HS001 lop 10A
Buoi 1 lop 10A: HS001 = Vang
Buoi 2 lop 10B: HS001 = Co mat, LoaiDiemDanh = extra
```

Ket qua:

- Doi soat so buoi: HS001 co 1 buoi co mat, 1 vang.
- Cong no Tm/yyyy khong doi trang thai chi vi case hoc bu nay.
- Neu co phieu Tm/yyyy -> `paid`.
- Neu chua co phieu Tm/yyyy -> `unpaid`/`overdue`.

### Case 4: Da thu sau han dong

```text
Ky dang xem = T7/2026
Han dong = 15/07/2026
Ngay hien tai = 20/07/2026
HS001 co phieu T7/2026 ngay 20/07/2026
```

Ket qua:

- HS001 la `paid`, khong con `overdue`.
- Doanh thu thang 7 tinh theo `NgayThu = 20/07/2026`.
- Da thu ky T7/2026 tinh theo `ThangHP/NamHP = 7/2026`.

### Case 5: Thu truoc ky

```text
NgayThu = 28/06/2026
ThangHP = 7
NamHP = 2026
```

Ket qua:

- Doanh thu T6/2026 co phieu nay vi tien vao trong thang 6.
- Cong no T7/2026 xem hoc sinh la `paid`.
- Cong no T6/2026 khong bi anh huong boi phieu T7.

## Implementation Plan

### Phase 1: Chot lai helper cong no theo thang

- Tao/uu tien helper tinh `TuitionPeriodState` theo `student + period`.
- `paid` dua vao `getPaymentTuitionPeriod(payment)`.
- `overdue` dua vao `tuitionDueDay` va ky dang xem.
- `amount` cua ky chua thu mac dinh `baseTuition`.
- Neu ky da thu, amount hien theo tong phieu thu cua ky do.
- Khong dung `getTuitionCycleState` de quyet dinh cong no chinh.

### Phase 2: Giu helper so buoi cho doi soat

- Giu helper dem luot hoc theo hoc sinh va `MaBuoi`.
- Dung helper nay cho cot/section `So buoi`.
- Khong dung ket qua so buoi de tinh `paid/unpaid/overdue`.

### Phase 3: Don man Cong no

- KPI tinh theo ky thang.
- Bang hien row hoc sinh billable trong ky.
- Nut `Thu phi` hien cho `unpaid/overdue`.
- `paid` hien nut xem bien lai.
- Section doi soat so buoi de rieng, compact.

### Phase 4: Tests

Can co test cho:

- phieu T6 so tien nho hon baseTuition van chot T6 la paid;
- T7 doc lap voi T6;
- thu truoc ky: doanh thu theo ngay thu, cong no theo ThangHP/NamHP;
- hoc bu lop khac chi anh huong thong ke so buoi, khong anh huong trang thai cong no;
- nut thu phi/row status dua tren paid/unpaid/overdue theo thang.

## Non Goals

- Khong them schema moi.
- Khong tu dong prorate hoc phi theo ngay nhap hoc.
- Khong tu dong tinh so tien con thieu neu phieu thu nho hon `baseTuition`.
- Khong dung so buoi de quyet dinh cong no chinh.
- Khong thay doi logic GAS neu frontend co the xu ly bang du lieu hien co.
