# Extra Attendance And Temporary Tuition Spec

## Goal

MVP nay chi giai quyet nhu cau van hanh gan:

- Khi ghi buoi hoc, co the them hoc sinh ngoai lop vao diem danh.
- Co the ghi buoi hoc phat sinh ngoai lich co san: them buoi, hoc bu, on tap.
- Moi dong diem danh co `LoaiDiemDanh = regular | extra`.
- Bao cao hoc phi tam dua tren so lan `Co mat` cua tung hoc sinh trong thang.

Chua xu ly portal, bai thieu, ma bai hoc, hay dong bo tu dong vao cong no.

## Business Rules

### Attendance

- Hoc sinh thuoc lop cua buoi hoc co `LoaiDiemDanh = regular`.
- Hoc sinh duoc them ngoai lop co `LoaiDiemDanh = extra`.
- Mot hoc sinh duoc tinh la co di hoc neu co dong diem danh trong bat ky buoi hoc nao voi:
  - `TrangThai = present` hoac hien thi frontend la `Co mat`.
- `extra` khong lam thay doi si so lop chinh, nhung duoc tinh vao lich su tham gia hoc cua hoc sinh.

### Lesson Type

Moi buoi hoc co `LoaiBuoiHoc`:

```text
regular = buoi theo lich co dinh
extra   = them buoi phat sinh
makeup  = buoi hoc bu
review  = buoi on tap
```

- Buoi mo tu lich co dinh mac dinh `regular`.
- Buoi mo tu nut `Ghi buoi hoc` tu do mac dinh `extra`.
- Tat ca loai buoi deu co the diem danh va duoc tinh trong lich su di hoc neu hoc sinh `Co mat`.

### Temporary Tuition Report

- Bao cao tam khong thay doi logic cong no/hoc phi hien co.
- Bao cao chi de doi chieu:
  - So buoi co mat lop chinh.
  - So buoi co mat ngoai lop.
  - Tong so buoi co mat.
  - Hoc phi tam tinh theo don gia/buoi.
- Don gia/buoi MVP lay `baseTuition / 8`, lam tron xuong theo so nguyen.

## Data Contract

Sheet `DiemDanh` them cot:

```text
LoaiDiemDanh
```

Gia tri:

```text
regular
extra
```

Du lieu cu khong co cot nay duoc xem la `regular`.

Sheet `BuoiHoc` them cot:

```text
LoaiBuoiHoc
```

Du lieu cu khong co cot nay duoc xem la `regular`.

Frontend `AttendanceEntry` chap nhan cac alias:

```text
LoaiDiemDanh
loaiDiemDanh
attendanceType
type
```

## UI

Trong modal `Ghi buoi hoc`:

- Phan diem danh lop chinh giu nhu cu.
- Them block nho `Hoc sinh ngoai lop`.
- Chon hoc sinh ngoai lop bang select.
- Hoc sinh them vao danh sach diem danh co badge `Ngoai lop`.
- Co the xoa hoc sinh ngoai lop khoi buoi hoc truoc khi luu.

Trong `Tai chinh > Cong no`:

- Them section `Hoc phi tam theo so buoi co mat`.
- Section nay hien voi ky thang dang chon.
- Khong anh huong trang thai da thu/chua thu.
