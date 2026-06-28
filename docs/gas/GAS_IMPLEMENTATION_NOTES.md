# GAS_IMPLEMENTATION_NOTES.md

## Mục đích

File này ghi chú kỹ thuật triển khai Apps Script mới cho bộ Google Sheet **Lớp Toán NK 2026–2027**.

Dùng cho Codex hoặc người sửa code sau này để hiểu:

```text
- cấu trúc Apps Script
- quy tắc đọc/ghi sheet
- quy tắc adapter
- quy tắc tạo mã
- quy tắc ngày tháng/status
- các vùng không được sửa tùy tiện
```

---

## File Apps Script chính

File hiện tại:

```text
LOP_TOAN_NK_GAS_2026_2027_FULL.gs
```

Có thể copy toàn bộ vào `Code.gs` trong Google Apps Script.

---

## Cách deploy

1. Tạo Google Sheet mới theo `SHEET_SPEC_2026_2027.md`.
2. Mở Google Sheet.
3. Vào `Extensions → Apps Script`.
4. Dán code Apps Script mới vào `Code.gs`.
5. Chạy hàm:

```js
setupSheets()
```

6. Deploy Web App:
   - Execute as: Me
   - Who has access: Anyone

7. Copy Web App URL vào app React.

---

## Cấu trúc Apps Script

Apps Script nên chia section theo thứ tự:

```text
1. Constants
2. Entry points
3. setupSheets
4. getData adapter
5. actions HocSinh
6. actions LopHoc
7. actions HocPhi
8. actions ChiPhi
9. actions BuoiHoc/DiemDanh
10. actions GiaoVien
11. actions NghiHoc
12. enrollment helpers
13. generic sheet helpers
14. utility functions
15. maps/joins
16. config/logs
17. debug helpers
```

Có thể để một file lớn để dễ copy, nhưng section phải rõ.

---

## Constants quan trọng

Các sheet chuẩn:

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

Header phải ở dòng 1.

Data bắt đầu từ dòng 2:

```js
var DATA_START = 2;
```

Timezone:

```js
var TZ = 'Asia/Ho_Chi_Minh';
```

---

## setupSheets()

`setupSheets()` dùng để:

```text
- tạo sheet nếu chưa có
- ghi header chuẩn
- freeze dòng header
- định dạng header
- seed một số config mặc định
```

Không nên để `setupSheets()` xóa dữ liệu cũ.

Nếu cần reset dữ liệu, phải tạo hàm riêng và có cảnh báo rõ.

---

## getData()

`getData()` là hàm quan trọng nhất.

Nó phải:

```text
1. đọc sheet mới
2. build map/join dữ liệu
3. trả về format app React hiện tại
```

Không được trả trực tiếp schema mới nếu frontend chưa được migrate.

Contract bắt buộc:

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

---

## Adapter philosophy

Sheet mới dùng dữ liệu gọn:

```text
HocSinh không lưu MaLop
DiemDanh không lưu Ngay/MaLop/CaDay/HoTen
LopHoc dùng MaGV
```

Nhưng `getData()` phải join để app vẫn thấy:

```text
Student.classId
Student.teacher
ClassRecord.Giáo viên
TeachingLog.teacherName
Payment.studentName
```

Không ép app tự join nếu chưa migrate frontend.

---

## MaBuoi là khóa trung tâm

`MaBuoi` là khóa chính của nghiệp vụ buổi học.

Format đề xuất:

```text
BH-YYYYMMDD-MaLop-CaDay
```

Ví dụ:

```text
BH-20260601-NHAN_11A_2026-17H30
```

Các sheet liên quan dùng `MaBuoi`:

```text
BuoiHoc
DiemDanh
NghiHoc
HocBu sau này
LuongGV sau này
```

Không quay lại thiết kế xóa/sửa điểm danh chỉ bằng:

```text
Ngay + MaLop
```

vì có thể xóa nhầm nhiều ca trong cùng ngày.

---

## DiemDanh

Sheet `DiemDanh` chỉ nên lưu:

```text
MaDiemDanh
MaBuoi
MaHS
TrangThai
GhiChu
UpdatedAt
```

Không lưu lặp:

```text
Ngay
MaLop
CaDay
HoTen
```

Các thông tin đó lấy bằng join:

```text
MaBuoi → BuoiHoc
MaHS → HocSinh
```

---

## Quy tắc điểm danh trong UI

UI tối ưu:

```text
Mặc định tất cả học sinh = Có mặt.
Giáo viên chỉ bấm em Vắng / Muộn / Nghỉ có phép.
Khi lưu, Apps Script vẫn ghi đủ từng học sinh vào DiemDanh.
```

Không chuyển sang kiểu lưu JSON trong một ô nếu chưa có task riêng.

Lý do:

```text
- JSON khó kiểm tra trong Sheet
- khó thống kê trực tiếp
- dễ hỏng nếu sai format
- khó sửa tay
```

---

## DangKyLop

`DangKyLop` quản lý quan hệ học sinh - lớp.

Sheet:

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

`HocSinh` không lưu `MaLop` cố định.

Khi app cũ gửi `classId` trong `saveHS/updateHS`, Apps Script phải:

```text
- lưu hồ sơ HocSinh
- tạo/cập nhật DangKyLop active
```

Khi học sinh đổi lớp:

```text
1. đóng dòng DangKyLop cũ
2. tạo dòng DangKyLop mới
```

---

## GiaoVien và MaGV

Sheet `LopHoc` dùng `MaGV`.

Frontend có thể gửi tên giáo viên.

Apps Script cần hàm:

```text
findTeacherIdByName()
```

để map tên giáo viên sang `MaGV`.

Không nên tự tạo giáo viên mới nếu không tìm thấy, trừ khi có yêu cầu rõ.

---

## Quy tắc ngày tháng

Ngày nghiệp vụ dùng:

```text
DD/MM/YYYY
```

Ví dụ:

```text
01/06/2026
```

Không dùng trong field nghiệp vụ:

```text
HH:mm - DD/MM/YYYY
```

Các field này phải là ngày thuần:

```text
NgaySinh
NgayBatDau
NgayKetThuc
Ngay
NgayThu
NgayChi
NgayVao
NgayRa
```

Timestamp chỉ dùng cho:

```text
CreatedAt
UpdatedAt
Time trong NhatKyHeThong
```

---

## Quy tắc status

Trong Sheet nên lưu status code:

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

Apps Script có thể convert khi trả về frontend.

Riêng `attendanceList` trả về app cũ nên dùng:

```text
Có mặt
Vắng
Muộn
Nghỉ có phép
```

---

## Quy tắc tạo mã

Nếu frontend không gửi mã, Apps Script tự sinh.

Quy ước:

```text
MaHS        → HS0001
MaGV        → GV0001
MaDangKy    → DK0001
MaBuoi      → BH-YYYYMMDD-MaLop-CaDay
MaDiemDanh  → DD-MaBuoi-MaHS
MaPhieuThu  → PT-YYYYMMDD-HHmmss-MaHS-T{Thang}-{Nam}
MaPhieuChi  → PC-YYYYMMDD-HHmmss
MaNghi      → NG-YYYYMMDD-MaHS
LogId       → LOG-YYYYMMDD-HHmmss-SSS
```

Không đổi mã sau khi đã tạo.

---

## Các helper quan trọng

Các helper nên giữ hoặc viết tương đương:

```text
formatDate()
parseDMY()
todayStr()
nowStr()
normalizeGrade()
normalizeGeneralStatus()
normalizeAttendanceStatus()
statusCodeToVi()
normalizeCaDay()
makeLessonId()
makeAttendanceId()
makePaymentId()
makeExpenseId()
makeSequentialId()
```

Không parse ngày thủ công ở từng action.

---

## Generic sheet helpers

Các helper đọc/ghi sheet cần có:

```text
getRows(sheetName)
appendObject(sheetName, obj)
appendObjects(sheetName, objs)
updateRowObject(sheetName, row, obj)
findRowByValue(sheetName, headerName, value)
findObjectByValue(sheetName, headerName, value)
deleteRowsByValue(sheetName, headerName, value)
```

Tất cả đọc/ghi nên dựa vào header, không hardcode số cột trừ khi có lý do.

---

## Logging

`NhatKyHeThong` ghi log cơ bản:

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

Log không được làm hỏng nghiệp vụ chính.

Nếu log lỗi, bỏ qua.

---

## Vùng dễ lỗi

### 1. saveDiary/updateDiary

Đây là vùng dễ lỗi nhất.

Phải đảm bảo:

```text
- xác định đúng MaBuoi
- update BuoiHoc đúng
- xóa DiemDanh cũ theo MaBuoi
- ghi lại DiemDanh mới đủ học sinh
- không xóa điểm danh ca khác
```

---

### 2. saveHS/updateHS

Phải đảm bảo:

```text
- lưu HocSinh
- nếu có classId thì tạo/cập nhật DangKyLop
- không lưu MaLop cố định trong HocSinh
```

---

### 3. getData adapter

Phải đảm bảo:

```text
- hs có classId
- hs có teacher name
- uCls có Giáo viên là tên
- logs có attendanceList
- payments có studentName
- summary có totalRevenue/totalExpense
```

---

### 4. Payment class snapshot

Khi lưu `HocPhi`, nên lưu `MaLop` tại thời điểm thu.

Nếu frontend không gửi `MaLop`, Apps Script lấy từ `DangKyLop` active.

---

## Test tối thiểu sau mỗi lần sửa GAS

Sau khi sửa Apps Script, phải test:

```text
1. setupSheets() không xóa dữ liệu.
2. getData với sheet trống trả ok true.
3. Thêm giáo viên bằng app.
4. Thêm lớp gắn giáo viên.
5. Thêm học sinh gắn lớp.
6. getData.hs có classId và teacher.
7. Ghi buổi học có điểm danh.
8. BuoiHoc có MaBuoi.
9. DiemDanh có đủ dòng theo MaBuoi.
10. getData.logs có present/absent/late đúng.
11. Thu học phí.
12. getData.py có thangHP/namHP/studentName.
13. Chi phí.
14. getData.ex đúng.
15. Xóa/sửa không làm hỏng getData.
```

---

## Những điều không nên làm

Không nên:

```text
- đổi tên sheet khi chưa cập nhật code
- đổi header khi chưa cập nhật code
- lưu điểm danh JSON trong BuoiHoc
- xóa DangKyLop
- xóa MaBuoi
- trả schema mới trực tiếp cho React app cũ
- đổi action name cũ
- xóa hl khỏi getData nếu frontend vẫn transform hl
- dùng Date object không format trước khi trả về app
```

---

## Khi nào mới migrate frontend sang schema mới?

Chỉ sau khi:

```text
- Sheet mới ổn định
- Apps Script adapter chạy ổn
- app dùng ổn qua một thời gian
- đã có task riêng để frontend đọc schema mới trực tiếp
```

Hiện tại ưu tiên:

```text
Sheet mới sạch
Apps Script adapter ổn
Frontend ít sửa nhất
```

---

## Kết luận

Apps Script mới là lớp trung gian quan trọng.

Nhiệm vụ của nó:

```text
1. bảo vệ schema sheet mới
2. bảo vệ app React cũ khỏi thay đổi đột ngột
3. join/map dữ liệu
4. chuẩn hóa ngày/status/id
5. đảm bảo BuoiHoc và DiemDanh nhất quán theo MaBuoi
```

Mọi thay đổi GAS sau này phải giữ contract với app, trừ khi có task migration frontend riêng.
