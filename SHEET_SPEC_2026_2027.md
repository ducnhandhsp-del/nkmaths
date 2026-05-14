# SHEET_SPEC_2026_2027.md

## Mục đích

Đây là đặc tả chuẩn cho bộ Google Sheet mới dùng cho app quản lý **Lớp Toán NK** trong năm học **2026–2027**.

Mục tiêu của bộ sheet mới:

- Làm sạch dữ liệu từ đầu năm học mới.
- Tránh lệ thuộc vào cấu trúc sheet thử nghiệm năm 2025–2026.
- Giảm trùng lặp dữ liệu.
- Tối ưu cho app quản lý vận hành.
- Dễ viết Apps Script mới.
- Dễ mở rộng các nghiệp vụ sau này như công nợ, học bù, lương giáo viên, báo cáo.
- Giữ thao tác hằng ngày thật nhanh, đặc biệt là ghi buổi học và điểm danh.

---

## Nguyên tắc thiết kế

### 1. Sheet là database, app là giao diện chính

Google Sheet chỉ nên lưu dữ liệu gốc.

Không cố biến Google Sheet thành giao diện quản lý đẹp.

App sẽ chịu trách nhiệm:

- hiển thị trực quan,
- join dữ liệu,
- tạo cảnh báo,
- tính toán KPI,
- hiển thị tên học sinh/lớp/giáo viên,
- tạo nội dung diễn giải dễ đọc.

---

### 2. Hạn chế trùng lặp dữ liệu

Không lưu lại những thông tin có thể suy ra dễ dàng từ mã định danh.

Ví dụ:

- Có `MaHS` thì không cần lưu `HoTen` trong mọi sheet.
- Có `MaLop` thì không cần lưu `TenLop`, `Khoi`, `CoSo` trong mọi sheet.
- Có `MaGV` thì không cần lưu `HoTenGV` trong mọi sheet.
- Có `MaBuoi` thì không cần lưu lại `Ngay`, `MaLop`, `CaDay` trong `DiemDanh`.

Ngoại lệ:

- Dữ liệu tài chính có thể lưu một số snapshot như `MaLop` tại thời điểm thu để báo cáo lịch sử ổn định hơn.

---

### 3. Mỗi nghiệp vụ chính phải có khóa riêng

Các khóa chính:

```text
HocSinh      → MaHS
GiaoVien     → MaGV
LopHoc       → MaLop
DangKyLop    → MaDangKy
BuoiHoc      → MaBuoi
DiemDanh     → MaDiemDanh
HocPhi       → MaPhieuThu
ChiPhi       → MaPhieuChi
NghiHoc      → MaNghi
NhatKyHeThong→ LogId
```

Không thay đổi mã sau khi đã tạo.

---

### 4. Buổi học là trung tâm vận hành

Tất cả nghiệp vụ vận hành nên xoay quanh `BuoiHoc`.

```text
LopHoc
→ BuoiHoc
→ DiemDanh
→ NghiHoc
→ HocBu sau này
→ Tính công/lương giáo viên sau này
```

Không nên tiếp tục dùng cách ghép tạm:

```text
Ngay + MaLop + CaDay
```

làm khóa chính lâu dài.

---

### 5. Điểm danh phải nhanh cho giáo viên

UI điểm danh nên hoạt động như sau:

```text
Mặc định tất cả học sinh = Có mặt
Giáo viên chỉ bấm các em Vắng / Muộn / Nghỉ có phép
Khi lưu, Apps Script vẫn ghi đủ từng học sinh vào DiemDanh
```

Như vậy:

- thao tác nhanh,
- dữ liệu vẫn chuẩn,
- báo cáo chuyên cần vẫn dễ,
- không cần nhập từng dòng trong Sheet.

---

### 6. Quy ước ngày tháng

Tất cả cột ngày dùng định dạng:

```text
DD/MM/YYYY
```

Ví dụ:

```text
01/06/2026
```

Không dùng:

```text
HH:mm - DD/MM/YYYY
```

Nếu cần thời gian tạo/cập nhật, dùng riêng:

```text
CreatedAt
UpdatedAt
```

Các cột timestamp có thể dùng:

```text
YYYY-MM-DD HH:mm:ss
```

hoặc

```text
DD/MM/YYYY HH:mm:ss
```

nhưng phải thống nhất trong Apps Script.

---

### 7. Quy ước trạng thái

Dữ liệu nên dùng status code không dấu, app hiển thị tiếng Việt.

Ví dụ:

```text
active      → Đang hoạt động / Đang học
inactive    → Đã nghỉ / Ngừng hoạt động
onleave     → Tạm nghỉ
trial       → Học thử
scheduled   → Đã lên lịch
completed   → Hoàn tất
cancelled   → Đã hủy
pending     → Chờ xử lý
approved    → Đã duyệt
rejected    → Từ chối
paid        → Đã đóng
partial     → Đóng thiếu
refunded    → Đã hoàn tiền
present     → Có mặt
absent      → Vắng
late        → Muộn
excused     → Nghỉ có phép
```

Không nhập lẫn tiếng Việt và tiếng Anh trong dữ liệu gốc.

---

## Danh sách sheet chuẩn

Bộ sheet tối ưu cho năm học 2026–2027:

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

Tạm thời chưa cần:

```text
HocBu
HocLieu
```

Lý do:

- `HocBu` nên thêm sau khi workflow `NghiHoc` ổn định.
- `HocLieu` không thuộc app quản lý vận hành chính.

---

# 1. Sheet `Config`

## Mục đích

Lưu cấu hình chung cho app và Apps Script.

## Header

```text
Key
Value
Group
Note
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| Key | Tên khóa cấu hình | Có |
| Value | Giá trị | Có |
| Group | Nhóm cấu hình | Không |
| Note | Ghi chú | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Ví dụ

```text
schoolYear | 2026-2027 | general | Năm học hiện tại | 01/06/2026
baseTuition | 600000 | finance | Học phí mặc định | 01/06/2026
caDayOptions | 7h30,9h,13h30,15h30,17h30,19h30 | schedule | Ca dạy chuẩn | 01/06/2026
```

---

# 2. Sheet `HocSinh`

## Mục đích

Lưu hồ sơ học sinh.

Không lưu `MaLop` cố định trong sheet này. Lớp hiện tại lấy từ `DangKyLop`.

## Header

```text
MaHS
HoTen
NgaySinh
CoSo
Khoi
Truong
TenPhuHuynh
SDTPhuHuynh
SDTHocSinh
DiaChi
HocLucToan
MucTieu
CanHoTro
TrangThai
NgayBatDau
NgayKetThuc
LyDoNghi
FacebookURL
GhiChu
CreatedAt
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaHS | Mã học sinh | Có |
| HoTen | Họ tên học sinh | Có |
| NgaySinh | Ngày sinh | Không |
| CoSo | Cơ sở học tập chính | Không |
| Khoi | Khối lớp hiện tại | Có |
| Truong | Trường đang học | Không |
| TenPhuHuynh | Họ tên phụ huynh | Không |
| SDTPhuHuynh | SĐT phụ huynh/Zalo | Nên có |
| SDTHocSinh | SĐT học sinh | Không |
| DiaChi | Địa chỉ | Không |
| HocLucToan | Học lực Toán hiện tại | Không |
| MucTieu | Mục tiêu điểm số | Không |
| CanHoTro | Phần kiến thức cần hỗ trợ | Không |
| TrangThai | Trạng thái học sinh | Có |
| NgayBatDau | Ngày bắt đầu học | Có |
| NgayKetThuc | Ngày kết thúc nếu đã nghỉ | Không |
| LyDoNghi | Lý do nghỉ | Không |
| FacebookURL | Link Facebook | Không |
| GhiChu | Ghi chú chung | Không |
| CreatedAt | Thời điểm tạo | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaHS: HS0001, HS0002...
Khoi: 6, 7, 8, 9, 10, 11, 12
TrangThai: active | inactive | onleave | trial
NgaySinh: DD/MM/YYYY hoặc để trống
NgayBatDau: DD/MM/YYYY
NgayKetThuc: DD/MM/YYYY hoặc để trống
```

## Không nên lưu trong sheet này

```text
MaLop
GiaoVienChinh
TenLop
TenGiaoVien
```

Các thông tin này nên lấy qua:

```text
HocSinh → DangKyLop → LopHoc → GiaoVien
```

---

# 3. Sheet `GiaoVien`

## Mục đích

Lưu hồ sơ giáo viên và thông tin phục vụ tính lương sau này.

## Header

```text
MaGV
HoTen
SDT
Email
TrangThai
ChuyenMon
DonGiaMoiBuoi
LuongCoBan
PhuCap
GhiChu
CreatedAt
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaGV | Mã giáo viên | Có |
| HoTen | Họ tên giáo viên | Có |
| SDT | Số điện thoại | Không |
| Email | Email | Không |
| TrangThai | Trạng thái giáo viên | Có |
| ChuyenMon | Chuyên môn | Không |
| DonGiaMoiBuoi | Đơn giá mỗi buổi | Không |
| LuongCoBan | Lương cơ bản nếu có | Không |
| PhuCap | Phụ cấp | Không |
| GhiChu | Ghi chú | Không |
| CreatedAt | Thời điểm tạo | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaGV: GV0001, GV0002...
TrangThai: active | inactive | onleave
```

## Cột chưa cần đưa vào giai đoạn đầu

```text
GioiTinh
NgaySinh
DiaChi
CCCD
BangCap
KinhNghiemNam
```

Các cột này có thể thêm sau nếu thực sự dùng.

---

# 4. Sheet `LopHoc`

## Mục đích

Lưu thông tin lớp học, lịch học cố định và học phí mặc định.

## Header

```text
MaLop
TenLop
NamHoc
Khoi
CoSo
MaGV
TrangThai
HocPhiMacDinh
Buoi1
Buoi2
Buoi3
NgayBatDau
NgayKetThuc
GhiChu
CreatedAt
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaLop | Mã lớp | Có |
| TenLop | Tên lớp | Có |
| NamHoc | Năm học | Có |
| Khoi | Khối | Có |
| CoSo | Cơ sở học | Không |
| MaGV | Giáo viên chính | Có |
| TrangThai | Trạng thái lớp | Có |
| HocPhiMacDinh | Học phí mặc định của lớp | Có |
| Buoi1 | Lịch học buổi 1 | Không |
| Buoi2 | Lịch học buổi 2 | Không |
| Buoi3 | Lịch học buổi 3 | Không |
| NgayBatDau | Ngày bắt đầu lớp | Không |
| NgayKetThuc | Ngày kết thúc lớp | Không |
| GhiChu | Ghi chú | Không |
| CreatedAt | Thời điểm tạo | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaLop: NHAN_11A_2026 hoặc KIEN_10A_2026
NamHoc: 2026-2027
Khoi: 6, 7, 8, 9, 10, 11, 12
TrangThai: active | paused | finished
Buoi1/Buoi2/Buoi3: T2 17h30, T4 17h30, T6 17h30
```

## Không nên lưu

```text
TenGV
SiSo
SoHocSinh
```

Các thông tin này có thể suy ra:

```text
TenGV: MaGV → GiaoVien
SiSo: LopHoc → DangKyLop active
```

---

# 5. Sheet `DangKyLop`

## Mục đích

Quản lý quan hệ học sinh - lớp.

Đây là sheet quan trọng để xử lý:

- học sinh vào lớp,
- học sinh chuyển lớp,
- học sinh nghỉ,
- học sinh quay lại,
- học sinh học nhiều lớp,
- sĩ số theo thời điểm.

## Header

```text
MaDangKy
MaHS
MaLop
NgayVao
NgayRa
TrangThai
GhiChu
CreatedAt
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaDangKy | Mã đăng ký lớp | Có |
| MaHS | Mã học sinh | Có |
| MaLop | Mã lớp | Có |
| NgayVao | Ngày vào lớp | Có |
| NgayRa | Ngày ra khỏi lớp | Không |
| TrangThai | Trạng thái đăng ký | Có |
| GhiChu | Ghi chú | Không |
| CreatedAt | Thời điểm tạo | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaDangKy: DK0001, DK0002...
TrangThai: active | inactive | transferred | trial
```

## Ghi chú

Nếu học sinh đang học trong lớp, dòng `DangKyLop` có:

```text
TrangThai = active
NgayRa = trống
```

Khi học sinh chuyển lớp hoặc nghỉ, cập nhật:

```text
NgayRa
TrangThai
GhiChu
```

App hiện tại vẫn có thể nhận `classId` bằng cách Apps Script lấy lớp active hiện tại từ `DangKyLop`.

---

# 6. Sheet `BuoiHoc`

## Mục đích

Lưu từng buổi học thực tế.

Đây là trung tâm của nghiệp vụ vận hành.

## Header

```text
MaBuoi
Ngay
MaLop
CaDay
MaGV
TrangThai
NoiDung
BaiTapVeNha
GhiChuGV
CreatedAt
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaBuoi | Mã buổi học | Có |
| Ngay | Ngày dạy | Có |
| MaLop | Mã lớp | Có |
| CaDay | Ca dạy | Có |
| MaGV | Giáo viên dạy buổi đó | Có |
| TrangThai | Trạng thái buổi học | Có |
| NoiDung | Nội dung bài dạy | Có khi hoàn tất |
| BaiTapVeNha | Bài tập về nhà | Không |
| GhiChuGV | Ghi chú giáo viên | Không |
| CreatedAt | Thời điểm tạo | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaBuoi: BH-20260601-NHAN_11A_2026-17h30
Ngay: DD/MM/YYYY
CaDay: 7h30 | 9h | 13h30 | 15h30 | 17h30 | 19h30
TrangThai: scheduled | completed | missing_attendance | cancelled
```

## Không nên lưu

```text
TenLop
TenGV
SoCoMat
SoVang
SoMuon
```

Các thông tin này có thể suy ra từ:

```text
MaLop → LopHoc
MaGV → GiaoVien
MaBuoi → DiemDanh
```

## Workflow app

```text
Lịch dạy
→ click buổi
→ mở form Ghi buổi học
→ nhập nội dung
→ điểm danh
→ lưu
```

---

# 7. Sheet `DiemDanh`

## Mục đích

Lưu điểm danh từng học sinh theo từng buổi học.

## Header

```text
MaDiemDanh
MaBuoi
MaHS
TrangThai
GhiChu
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaDiemDanh | Mã điểm danh | Có |
| MaBuoi | Mã buổi học | Có |
| MaHS | Mã học sinh | Có |
| TrangThai | Trạng thái điểm danh | Có |
| GhiChu | Ghi chú riêng cho học sinh | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaDiemDanh: DD-BH-20260601-NHAN_11A_2026-17h30-HS0001
TrangThai: present | absent | late | excused
```

## Không lưu trong DiemDanh

```text
Ngay
MaLop
CaDay
HoTen
```

Lý do:

```text
Ngay/MaLop/CaDay lấy từ MaBuoi → BuoiHoc
HoTen lấy từ MaHS → HocSinh
```

## UI điểm danh tối ưu

App nên hiển thị:

```text
Mặc định tất cả học sinh = Có mặt
Giáo viên chỉ bấm các em Vắng / Muộn / Nghỉ có phép
```

Khi lưu, Apps Script ghi đủ từng học sinh vào `DiemDanh`.

Đây là cách cân bằng tốt nhất:

```text
UI nhanh
Sheet sạch
Báo cáo dễ
Không phải nhập thủ công từng em trong Sheet
```

---

# 8. Sheet `HocPhi`

## Mục đích

Lưu phiếu thu học phí.

Đây là dữ liệu chứng từ nên có thể lưu `MaLop` để snapshot lớp tại thời điểm thu.

## Header

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
TrangThai
GhiChu
CreatedAt
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaPhieuThu | Mã phiếu thu | Có |
| NgayThu | Ngày thu | Có |
| MaHS | Mã học sinh | Có |
| MaLop | Mã lớp tại thời điểm thu | Nên có |
| ThangHP | Tháng học phí | Có |
| NamHP | Năm học phí | Có |
| SoTien | Số tiền | Có |
| HinhThuc | Hình thức thanh toán | Có |
| NguoiNop | Người nộp | Không |
| NguoiThu | Người thu | Không |
| TrangThai | Trạng thái phiếu thu | Có |
| GhiChu | Ghi chú | Không |
| CreatedAt | Thời điểm tạo | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaPhieuThu: PT-20260601-HS0001-T6
NgayThu: DD/MM/YYYY
ThangHP: 1–12
NamHP: 2026
HinhThuc: cash | bank | momo | other
TrangThai: paid | partial | cancelled | refunded
```

## Không cần cột `DienGiai`

Không cần dùng `DienGiai` làm cột chính.

App có thể tự hiển thị:

```text
Học phí tháng 6/2026
```

từ:

```text
ThangHP + NamHP
```

Nếu cần thêm thông tin, dùng `GhiChu`.

---

# 9. Sheet `ChiPhi`

## Mục đích

Lưu phiếu chi.

## Header

```text
MaPhieuChi
NgayChi
NguoiChi
HangMuc
SoTien
NoiDung
MaLop
MaGV
TrangThai
GhiChu
CreatedAt
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaPhieuChi | Mã phiếu chi | Có |
| NgayChi | Ngày chi | Có |
| NguoiChi | Người chi | Không |
| HangMuc | Hạng mục chi | Có |
| SoTien | Số tiền | Có |
| NoiDung | Nội dung chi | Có |
| MaLop | Lớp liên quan nếu có | Không |
| MaGV | Giáo viên liên quan nếu có | Không |
| TrangThai | Trạng thái phiếu chi | Có |
| GhiChu | Ghi chú | Không |
| CreatedAt | Thời điểm tạo | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaPhieuChi: PC-20260601-001
NgayChi: DD/MM/YYYY
HangMuc: In ấn | Thiết bị | Thuê phòng | Lương GV | Marketing | Khác
TrangThai: active | cancelled
```

`MaLop` và `MaGV` có thể để trống.

---

# 10. Sheet `NghiHoc`

## Mục đích

Lưu yêu cầu nghỉ học hoặc thông tin nghỉ có phép.

## Header

```text
MaNghi
Ngay
MaHS
MaBuoi
LyDo
TrangThai
NguoiBao
GhiChu
CreatedAt
UpdatedAt
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| MaNghi | Mã nghỉ học | Có |
| Ngay | Ngày báo nghỉ | Có |
| MaHS | Mã học sinh | Có |
| MaBuoi | Buổi học liên quan | Không |
| LyDo | Lý do nghỉ | Không |
| TrangThai | Trạng thái xử lý | Có |
| NguoiBao | Ai báo nghỉ | Không |
| GhiChu | Ghi chú | Không |
| CreatedAt | Thời điểm tạo | Không |
| UpdatedAt | Thời điểm cập nhật | Không |

## Quy ước

```text
MaNghi: NG-20260601-HS0001
TrangThai: pending | approved | rejected
NguoiBao: parent | student | teacher | admin
```

## Ghi chú

Nếu `NghiHoc` được duyệt, app có thể tự đánh dấu điểm danh của học sinh là:

```text
excused
```

trong buổi liên quan.

---

# 11. Sheet `NhatKyHeThong`

## Mục đích

Lưu log hệ thống cơ bản.

Không cần dùng phức tạp ngay, nhưng nên có để truy vết khi app dùng thật.

## Header

```text
LogId
Time
Action
Entity
EntityId
User
Detail
Status
```

## Ý nghĩa cột

| Cột | Ý nghĩa | Bắt buộc |
|---|---|---|
| LogId | Mã log | Có |
| Time | Thời điểm | Có |
| Action | Hành động | Có |
| Entity | Loại dữ liệu | Có |
| EntityId | ID dữ liệu | Không |
| User | Người thao tác | Không |
| Detail | Chi tiết | Không |
| Status | Trạng thái | Không |

## Ví dụ

```text
LOG0001 | 01/06/2026 10:00:00 | savePayment | HocPhi | PT-20260601-HS0001-T6 | admin | Thu học phí HS0001 | ok
```

---

# Apps Script compatibility layer

Apps Script mới nên đóng vai trò adapter.

Sheet mới có thể chuẩn hơn, nhưng `getData()` nên trả về format tương thích frontend hiện tại.

## getData nên trả về

```js
{
  ok: true,
  hs: [],
  uCls: [],
  py: [],
  ex: [],
  logs: [],
  tv: [],
  summary: {}
}
```

## Mapping đề xuất

### HocSinh → frontend Student

Frontend hiện cần:

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

Apps Script mới nên map:

```text
MaHS          → id
HoTen         → name
NgaySinh      → dob
CoSo          → branch
Khoi          → grade
Truong        → school
TenPhuHuynh   → parentName
SDTPhuHuynh   → parentPhone
SDTHocSinh    → studentPhone
DiaChi        → address
HocLucToan    → academicLevel
MucTieu       → goal
CanHoTro      → supportNeeded
TrangThai     → status
NgayBatDau    → startDate
NgayKetThuc   → endDate
GhiChu        → notes
FacebookURL   → facebookUrl
```

`classId` lấy từ `DangKyLop` active.

`teacher` lấy từ:

```text
DangKyLop active → LopHoc.MaGV → GiaoVien.HoTen
```

---

### LopHoc → frontend ClassRecord

Frontend hiện cần dạng gần giống:

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

Apps Script mới nên map:

```text
MaLop       → Mã Lớp
TenLop      → Tên Lớp
Khoi        → Khối
MaGV        → Giáo viên = GiaoVien.HoTen
CoSo        → Cơ sở
Buoi1       → Buổi 1
Buoi2       → Buổi 2
Buoi3       → Buổi 3
```

---

### BuoiHoc + DiemDanh → frontend TeachingLog

Frontend hiện cần:

```text
rawDate
date
originalDate
classId
originalClassId
caDay
originalCaDay
teacherName
content
homework
teacherNote
present
absent
late
attendanceList
```

Apps Script mới nên map:

```text
BuoiHoc.Ngay        → date/rawDate/originalDate
BuoiHoc.MaLop       → classId/originalClassId
BuoiHoc.CaDay       → caDay/originalCaDay
BuoiHoc.MaGV        → teacherName = GiaoVien.HoTen
BuoiHoc.NoiDung     → content
BuoiHoc.BaiTapVeNha → homework
BuoiHoc.GhiChuGV    → teacherNote
DiemDanh rows       → attendanceList
```

Đếm:

```text
present = số DiemDanh.TrangThai = present
absent  = số DiemDanh.TrangThai = absent
late    = số DiemDanh.TrangThai = late
```

Khi trả về frontend, có thể convert:

```text
present → Có mặt
absent  → Vắng
late    → Muộn
excused → Nghỉ có phép
```

hoặc xử lý ở frontend.

---

### HocPhi → frontend Payment

Frontend hiện cần:

```text
id
date
docNum
studentId
studentName
payer
method
description
amount
note
thangHP
namHP
```

Apps Script mới nên map:

```text
MaPhieuThu → id/docNum
NgayThu    → date
MaHS       → studentId
HoTen      → studentName = HocSinh.HoTen
NguoiNop   → payer
HinhThuc   → method
SoTien     → amount
GhiChu     → note
ThangHP    → thangHP
NamHP      → namHP
description = Học phí tháng {ThangHP}/{NamHP}
```

---

### ChiPhi → frontend Expense

Frontend hiện cần:

```text
id
date
docNum
description
category
amount
spender
```

Apps Script mới nên map:

```text
MaPhieuChi → id/docNum
NgayChi    → date
NoiDung    → description
HangMuc    → category
SoTien     → amount
NguoiChi   → spender
```

---

### GiaoVien → frontend Teacher

Frontend hiện cần:

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
```

Apps Script mới nên map:

```text
MaGV          → id
HoTen         → name
SDT           → phone
Email         → email
ChuyenMon     → specialization
LuongCoBan    → baseSalary
DonGiaMoiBuoi → hourlyRate
PhuCap        → allowance
TrangThai     → status
GhiChu        → notes
CreatedAt     → createdAt
```

---

# Workflow chuẩn: Ghi buổi học

## Mục tiêu

Giáo viên thao tác nhanh, dữ liệu lưu chuẩn.

## UI đề xuất

```text
1. Mở Vận hành
2. Chọn buổi từ lịch
3. App mở form Ghi buổi học
4. App tự biết lớp/ngày/ca/giáo viên
5. App lấy danh sách học sinh active trong lớp từ DangKyLop
6. Mặc định tất cả = Có mặt
7. Giáo viên chỉ bấm các em Vắng / Muộn / Nghỉ có phép
8. Nhập Nội dung bài dạy
9. Nhập Bài tập về nhà nếu có
10. Nhập Ghi chú nếu có
11. Lưu
```

## Khi lưu

Apps Script:

```text
1. Tạo hoặc cập nhật BuoiHoc
2. Xóa DiemDanh cũ theo MaBuoi nếu update
3. Ghi lại DiemDanh đủ từng học sinh
4. Cập nhật BuoiHoc.TrangThai = completed
5. Ghi NhatKyHeThong nếu cần
```

---

# Workflow chuẩn: Công nợ

## Cách xác định học sinh cần đóng tháng X/Y

Một học sinh cần đóng học phí nếu:

```text
HocSinh.TrangThai = active
và DangKyLop active trong tháng đó
và tháng đó không trước NgayVao
và tháng đó không sau NgayRa nếu có
```

Mức học phí lấy theo thứ tự ưu tiên:

```text
1. LopHoc.HocPhiMacDinh
2. Config.baseTuition
```

Đã đóng nếu có `HocPhi`:

```text
MaHS = học sinh
ThangHP = tháng cần xét
NamHP = năm cần xét
TrangThai = paid hoặc partial
```

---

# Workflow chuẩn: Chuyển lớp / Nghỉ học

## Chuyển lớp

Không sửa trực tiếp lịch sử cũ.

Thao tác đúng:

```text
1. Cập nhật dòng DangKyLop cũ:
   - NgayRa
   - TrangThai = transferred

2. Tạo dòng DangKyLop mới:
   - MaHS
   - MaLop mới
   - NgayVao
   - TrangThai = active
```

## Nghỉ học

Thao tác đúng:

```text
1. Cập nhật HocSinh:
   - TrangThai = inactive
   - NgayKetThuc
   - LyDoNghi

2. Cập nhật DangKyLop active:
   - NgayRa
   - TrangThai = inactive
```

---

# Checklist khi tạo Google Sheet mới

Tạo đúng các sheet:

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

Kiểm tra:

```text
- Header đúng thứ tự.
- Không có dòng trống trước header.
- Header ở dòng 1.
- Data bắt đầu từ dòng 2.
- Không merge cells.
- Không dùng công thức ở vùng data gốc.
- Không đổi tên sheet sau khi deploy Apps Script.
- Không đổi tên cột nếu chưa cập nhật Apps Script.
```

---

# Checklist nhập dữ liệu đầu năm

## Bước 1 — GiaoVien

Nhập giáo viên trước.

## Bước 2 — LopHoc

Nhập lớp học và gán `MaGV`.

## Bước 3 — HocSinh

Nhập học sinh.

## Bước 4 — DangKyLop

Gán học sinh vào lớp.

## Bước 5 — Test app

Chạy `getData` để kiểm tra:

```text
- học sinh có classId đúng không
- lớp có giáo viên đúng không
- lịch dạy hiện đúng không
```

## Bước 6 — Bắt đầu dùng BuoiHoc/DiemDanh/HocPhi

Không nhập tay trực tiếp nếu app đã xử lý được.

---

# Ghi chú tương thích frontend hiện tại

Dù schema mới không lưu trùng nhiều, Apps Script vẫn cần trả dữ liệu theo shape frontend hiện tại để tránh rewrite app ngay.

Mục tiêu:

```text
Sheet mới sạch hơn
Apps Script mới làm adapter
Frontend ít thay đổi nhất có thể
```

Sau khi app ổn định, frontend có thể nâng dần để dùng schema mới trực tiếp hơn.

---

# Kết luận

Schema năm học 2026–2027 nên lấy `BuoiHoc` làm trung tâm vận hành và `DangKyLop` làm trung tâm quan hệ học sinh - lớp.

Hai thay đổi quan trọng nhất:

```text
1. HocSinh không lưu MaLop cố định.
2. DiemDanh gắn MaBuoi, không gắn lặp Ngay/MaLop/CaDay.
```

Điểm danh tối ưu:

```text
UI mặc định tất cả Có mặt.
Giáo viên chỉ bấm ngoại lệ.
Khi lưu vẫn ghi đủ từng học sinh.
```

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

Đây là bộ sheet gọn, sạch, ít trùng lặp, đủ nghiệp vụ, và phù hợp để triển khai app chính thức cho năm học 2026–2027.
