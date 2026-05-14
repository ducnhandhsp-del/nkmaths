# APPS_SCRIPT_CONTRACT_2026_2027.md

## Mục đích

File này là hợp đồng dữ liệu giữa:

```text
Google Sheet chuẩn 2026–2027
↔ Apps Script mới
↔ App React hiện tại
```

Mục tiêu quan trọng nhất:

```text
Sheet mới có schema sạch hơn,
nhưng Apps Script phải làm adapter để app React hiện tại vẫn nhận được format quen thuộc.
```

Không được sửa frontend theo schema sheet mới trực tiếp nếu chưa có task migration riêng.

---

## Nguyên tắc contract

### 1. Apps Script giữ tên action cũ

Để app React hiện tại ít phải sửa, Apps Script mới vẫn phải hỗ trợ các action cũ:

```text
getData

saveHS
updateHS
deleteHS

saveClass
updateClass
deleteClass

savePayment
updatePayment
deletePayment

saveExpense
updateExpense
deleteExpense

saveDiary
updateDiary
deleteDiary

saveTeacher
updateTeacher
deleteTeacher
```

Có thể thêm action mới, nhưng không xóa hoặc đổi tên action cũ nếu chưa cập nhật frontend.

---

### 2. `getData` phải trả format frontend hiện tại

`getData` bắt buộc trả về:

```js
{
  ok: true,
  hs: [],
  uCls: [],
  py: [],
  ex: [],
  logs: [],
  tv: [],
  hl: [],
  summary: {
    totalRevenue: 0,
    totalExpense: 0,
    chart: []
  }
}
```

Ý nghĩa:

```text
hs      → danh sách học sinh cho frontend
uCls    → danh sách lớp học
py      → danh sách phiếu thu/học phí
ex      → danh sách phiếu chi
logs    → danh sách buổi học/nhật ký/điểm danh
tv      → danh sách giáo viên
hl      → học liệu, hiện trả [] để tương thích
summary → tổng hợp tài chính cơ bản
```

Ngay cả khi app không dùng `hl`, vẫn trả `hl: []` để tránh lỗi transform cũ.

---

### 3. Apps Script là adapter

Schema sheet mới:

```text
HocSinh
GiaoVien
LopHoc
DangKyLop
BuoiHoc
DiemDanh
HocPhi
ChiPhi
NghiHoc
NhatKyHeThong
```

khác với schema cũ, nhưng Apps Script phải map về shape mà app React hiểu.

Ví dụ:

```text
Sheet mới không lưu HocSinh.MaLop,
nhưng getData vẫn phải trả Student.classId cho app.
```

`classId` được tính từ:

```text
HocSinh.MaHS
→ DangKyLop active
→ MaLop
```

---

## Sheet mới

Bộ sheet chuẩn:

```text
Config
HocSinh
GiaoVien
LopHoc
DangKyLop
BuoiHoc
DiemDanh
HocPhi
ChiPhi
NghiHoc
NhatKyHeThong
```

Không dùng `HocLieu` trong app quản lý chính.

Nếu frontend cũ còn transform học liệu, Apps Script trả:

```js
hl: []
```

---

## Contract `getData`

### `hs` — học sinh

Frontend hiện cần các field gần với `Student`:

```text
id
name
dob
branch
grade
school
teacher
parentName
parentPhone
studentPhone
address
academicLevel
goal
supportNeeded
classId
startDate
endDate
status
notes
facebookUrl
```

Apps Script map từ sheet mới:

```text
HocSinh.MaHS          → id
HocSinh.HoTen         → name
HocSinh.NgaySinh      → dob
HocSinh.CoSo          → branch
HocSinh.Khoi          → grade
HocSinh.Truong        → school
HocSinh.TenPhuHuynh   → parentName
HocSinh.SDTPhuHuynh   → parentPhone
HocSinh.SDTHocSinh    → studentPhone
HocSinh.DiaChi        → address
HocSinh.HocLucToan    → academicLevel
HocSinh.MucTieu       → goal
HocSinh.CanHoTro      → supportNeeded
HocSinh.TrangThai     → status
HocSinh.NgayBatDau    → startDate
HocSinh.NgayKetThuc   → endDate
HocSinh.GhiChu        → notes
HocSinh.FacebookURL   → facebookUrl
```

Các field suy ra:

```text
classId = DangKyLop.MaLop của dòng active
teacher = GiaoVien.HoTen từ LopHoc.MaGV của lớp active
```

Apps Script có thể trả thêm alias cũ như:

```text
Mã HS
Họ và tên học sinh
Mã Lớp
Trạng thái
```

để tương thích transform cũ.

---

### `uCls` — lớp học

Frontend hiện cần lớp theo shape gần với `ClassRecord`:

```text
Mã Lớp
Tên Lớp
Khối
Giáo viên
Cơ sở
Buổi 1
Buổi 2
Buổi 3
```

Apps Script map:

```text
LopHoc.MaLop  → Mã Lớp
LopHoc.TenLop → Tên Lớp
LopHoc.Khoi   → Khối
LopHoc.CoSo   → Cơ sở
LopHoc.Buoi1  → Buổi 1
LopHoc.Buoi2  → Buổi 2
LopHoc.Buoi3  → Buổi 3
LopHoc.MaGV   → Giáo viên = GiaoVien.HoTen
```

Không trả `MaGV` thay cho tên giáo viên ở field `Giáo viên` nếu frontend đang hiển thị tên.

---

### `logs` — buổi học / nhật ký / điểm danh

Sheet mới dùng:

```text
BuoiHoc
DiemDanh
```

Nhưng frontend hiện cần `TeachingLog` dạng:

```text
rawDate
date
originalDate
originalClassId
originalCaDay
classId
content
homework
teacherNote
teacherName
caDay
present
absent
late
attendanceList
```

Apps Script map:

```text
BuoiHoc.MaBuoi       → maBuoi / id
BuoiHoc.Ngay         → rawDate / date / originalDate
BuoiHoc.MaLop        → classId / originalClassId
BuoiHoc.CaDay        → caDay / originalCaDay
BuoiHoc.MaGV         → teacherName = GiaoVien.HoTen
BuoiHoc.NoiDung      → content
BuoiHoc.BaiTapVeNha  → homework
BuoiHoc.GhiChuGV     → teacherNote
DiemDanh rows        → attendanceList
```

Đếm chuyên cần:

```text
present = số DiemDanh.TrangThai = present
absent  = số DiemDanh.TrangThai = absent hoặc excused
late    = số DiemDanh.TrangThai = late
```

Khi trả về `attendanceList`, nên trả trạng thái tiếng Việt để frontend cũ xử lý tốt:

```text
present → Có mặt
absent  → Vắng
late    → Muộn
excused → Nghỉ có phép
```

Một attendance item nên có cả alias:

```js
{
  maHS: "HS0001",
  "Mã HS": "HS0001",
  MaHS: "HS0001",
  tenHS: "Nguyễn Văn A",
  trangThai: "Có mặt",
  TrangThai: "Có mặt",
  "Trạng thái": "Có mặt",
  ghiChu: "",
  GhiChu: "",
  "Ghi chú": ""
}
```

---

### `py` — phiếu thu / học phí

Frontend hiện cần `Payment`:

```text
id
date
docNum
description
studentId
studentName
payer
method
amount
note
thangHP
namHP
```

Apps Script map:

```text
HocPhi.MaPhieuThu → id / docNum
HocPhi.NgayThu    → date
HocPhi.MaHS       → studentId
HocSinh.HoTen     → studentName
HocPhi.NguoiNop   → payer
HocPhi.HinhThuc   → method
HocPhi.SoTien     → amount
HocPhi.GhiChu     → note
HocPhi.ThangHP    → thangHP
HocPhi.NamHP      → namHP
```

`description` tự tạo:

```text
Học phí tháng {ThangHP}/{NamHP}
```

Không cần sheet `HocPhi` có cột `DienGiai` riêng.

---

### `ex` — phiếu chi

Frontend hiện cần `Expense`:

```text
id
date
docNum
description
category
amount
spender
```

Apps Script map:

```text
ChiPhi.MaPhieuChi → id / docNum
ChiPhi.NgayChi    → date
ChiPhi.NoiDung    → description
ChiPhi.HangMuc    → category
ChiPhi.SoTien     → amount
ChiPhi.NguoiChi   → spender
```

---

### `tv` — giáo viên

Frontend hiện cần `Teacher`:

```text
id
name
phone
email
specialization
baseSalary
hourlyRate
allowance
status
notes
createdAt
classes
```

Apps Script map:

```text
GiaoVien.MaGV          → id
GiaoVien.HoTen         → name
GiaoVien.SDT           → phone
GiaoVien.Email         → email
GiaoVien.ChuyenMon     → specialization
GiaoVien.LuongCoBan    → baseSalary
GiaoVien.DonGiaMoiBuoi → hourlyRate
GiaoVien.PhuCap        → allowance
GiaoVien.TrangThai     → status
GiaoVien.GhiChu        → notes
GiaoVien.CreatedAt     → createdAt
```

`classes` được suy ra từ:

```text
LopHoc.MaGV = GiaoVien.MaGV
```

---

## Contract các action ghi dữ liệu

### `saveHS` / `updateHS`

Frontend có thể gửi field cũ:

```text
id
name
dob
branch
grade
school
parentName
parentPhone
studentPhone
address
academicLevel
goal
supportNeeded
classId
startDate
endDate
status
notes
facebookUrl
```

Apps Script phải ghi vào:

```text
HocSinh
DangKyLop nếu có classId
```

Quy tắc:

```text
- Không lưu MaLop cố định trong HocSinh.
- Nếu frontend gửi classId, tạo/cập nhật DangKyLop active.
- Nếu học sinh đổi lớp, đóng DangKyLop cũ và tạo DangKyLop mới.
```

---

### `deleteHS`

Xóa học sinh khỏi `HocSinh`.

Có thể xóa hoặc vô hiệu hóa các dòng `DangKyLop` liên quan.

Trong giai đoạn đầu, có thể xóa dòng. Về lâu dài nên chuyển sang soft delete/status inactive.

---

### `saveClass` / `updateClass`

Frontend có thể gửi:

```text
MaLop
Tên Lớp
Khối
Giáo viên
Cơ sở
Buổi 1
Buổi 2
Buổi 3
```

Sheet mới cần `MaGV`.

Apps Script phải map:

```text
Giáo viên tên → GiaoVien.MaGV
```

Nếu không tìm thấy giáo viên:

```text
Không tự tạo giáo viên mới nếu chưa có yêu cầu.
Có thể lưu chuỗi đó vào MaGV tạm thời hoặc báo lỗi tùy phase.
```

Khuyến nghị: báo lỗi hoặc để nguyên với cảnh báo, tránh tự tạo dữ liệu sai.

---

### `saveDiary` / `updateDiary`

Đây là action quan trọng nhất trong nghiệp vụ vận hành.

Frontend có thể gửi:

```text
date
classId
caDay
teacherName
content
homework
teacherNote
attendanceList
originalDate
originalClassId
originalCaDay
maBuoi nếu có
```

Apps Script phải ghi vào:

```text
BuoiHoc
DiemDanh
```

Quy tắc lưu:

```text
1. Xác định MaBuoi.
2. Nếu frontend không gửi MaBuoi, tự sinh:
   BH-YYYYMMDD-MaLop-CaDay
3. Tạo/cập nhật BuoiHoc.
4. Xóa DiemDanh cũ theo MaBuoi nếu update.
5. Ghi lại DiemDanh đủ từng học sinh.
6. Set BuoiHoc.TrangThai = completed nếu đã lưu nhật ký.
```

Không dùng `Ngay + MaLop + CaDay` làm khóa lâu dài trong sheet; chỉ dùng để sinh `MaBuoi`.

---

### `deleteDiary`

Apps Script phải xóa:

```text
BuoiHoc theo MaBuoi
DiemDanh theo MaBuoi
```

Không xóa điểm danh theo `Ngay + MaLop` vì có thể làm mất dữ liệu ca khác.

---

### `savePayment` / `updatePayment`

Frontend có thể gửi:

```text
maHS / studentId
soTien / amount
thangHP
namHP
method
payer
date
docNum / soCT nếu có
```

Apps Script ghi vào `HocPhi`.

Quy tắc:

```text
- Nếu chưa có MaPhieuThu, tự sinh mã phiếu.
- NgayThu phải là DD/MM/YYYY.
- MaLop lấy từ DangKyLop active của học sinh tại thời điểm thu hoặc tháng học phí.
- TrangThai mặc định = paid.
```

---

### `deletePayment`

Xóa dòng `HocPhi` theo:

```text
MaPhieuThu
```

Có thể nhận alias:

```text
id
docNum
soCT
```

---

### `saveExpense` / `updateExpense`

Frontend có thể gửi:

```text
date
docNum
spender
category
amount
description
```

Apps Script ghi vào `ChiPhi`.

Mapping:

```text
date        → NgayChi
docNum      → MaPhieuChi
spender     → NguoiChi
category    → HangMuc
amount      → SoTien
description → NoiDung
```

---

### `deleteExpense`

Xóa dòng `ChiPhi` theo:

```text
MaPhieuChi
```

Có thể nhận alias:

```text
id
docNum
soCT
```

---

### `saveTeacher` / `updateTeacher`

Frontend có thể gửi:

```text
id
name
phone
email
status
specialization
baseSalary
hourlyRate
allowance
notes
```

Apps Script ghi vào `GiaoVien`.

Mapping:

```text
id             → MaGV
name           → HoTen
phone          → SDT
email          → Email
status         → TrangThai
specialization → ChuyenMon
baseSalary     → LuongCoBan
hourlyRate     → DonGiaMoiBuoi
allowance      → PhuCap
notes          → GhiChu
```

---

## Quy tắc ngày tháng

Các field ngày nghiệp vụ trả cho frontend dùng:

```text
DD/MM/YYYY
```

Ví dụ:

```text
01/06/2026
```

Không trả dạng:

```text
HH:mm - DD/MM/YYYY
```

trong các field như:

```text
NgayThu
NgayChi
Ngay
NgayBatDau
NgayKetThuc
```

`CreatedAt` / `UpdatedAt` có thể dùng timestamp.

---

## Quy tắc status

Trong Sheet mới, status nên lưu code:

```text
active
inactive
onleave
trial
scheduled
completed
cancelled
pending
approved
rejected
paid
partial
refunded
present
absent
late
excused
```

Frontend có thể hiển thị tiếng Việt.

Riêng `attendanceList` trả về cho app cũ nên ưu tiên tiếng Việt:

```text
Có mặt
Vắng
Muộn
Nghỉ có phép
```

để tương thích UI hiện tại.

---

## Quy tắc mã định danh

Apps Script tự sinh mã nếu frontend không gửi:

```text
MaHS        → HS0001, HS0002...
MaGV        → GV0001, GV0002...
MaDangKy    → DK0001, DK0002...
MaBuoi      → BH-YYYYMMDD-MaLop-CaDay
MaDiemDanh  → DD-MaBuoi-MaHS
MaPhieuThu  → PT-YYYYMMDD-HHmmss-MaHS-T{Thang}-{Nam}
MaPhieuChi  → PC-YYYYMMDD-HHmmss
MaNghi      → NG-YYYYMMDD-MaHS
LogId       → LOG-YYYYMMDD-HHmmss-SSS
```

Không đổi mã sau khi tạo.

---

## Những điều Codex không được làm nếu chưa có task riêng

Không được:

```text
- đổi tên action cũ
- đổi shape getData
- bắt frontend đọc trực tiếp schema sheet mới
- bỏ hs/uCls/py/ex/logs/tv khỏi getData
- xóa hl nếu frontend còn transform hl
- đổi DiemDanh về lưu JSON trong một ô
- xóa DangKyLop
- xóa MaBuoi
- ghi điểm danh bằng Ngay + MaLop thay vì MaBuoi
- đổi status lẫn lộn tiếng Việt/tiếng Anh trong sheet
```

---

## Test contract tối thiểu

Sau khi deploy Apps Script mới, phải test:

```text
1. getData với sheet trống → ok true, mảng rỗng.
2. Thêm giáo viên → getData.tv có giáo viên.
3. Thêm lớp có MaGV → getData.uCls có tên giáo viên.
4. Thêm học sinh + classId → HocSinh có hồ sơ, DangKyLop có dòng active, getData.hs có classId.
5. Ghi buổi học → BuoiHoc có MaBuoi, DiemDanh có từng học sinh.
6. getData.logs trả present/absent/late đúng.
7. Thu học phí → HocPhi có MaPhieuThu, getData.py có thangHP/namHP.
8. Chi phí → ChiPhi có MaPhieuChi, getData.ex đúng.
9. Sửa/xóa từng loại không làm lỗi getData.
```

---

## Kết luận

Apps Script mới là adapter.

Không để app React phụ thuộc trực tiếp vào cấu trúc sheet mới ngay.

Thiết kế đúng là:

```text
Sheet mới sạch
→ Apps Script join/map/adapter
→ React app nhận format cũ
→ sau này mới migrate frontend dần nếu cần
```
