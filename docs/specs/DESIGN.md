---
name: TOAN_NK_MANAGER
description: Design system cho app quản lý LỚP TOÁN NK. Ưu tiên rõ ràng, gọn, hiện đại, dễ vận hành trên desktop và mobile.

colors:
  primary: "#4F46E5"
  primaryDark: "#3730A3"
  primarySoft: "#EEF2FF"
  accent: "#06B6D4"

  success: "#10B981"
  successDark: "#065F46"
  successSoft: "#DCFCE7"

  warning: "#F59E0B"
  warningDark: "#78350F"
  warningSoft: "#FEF3C7"

  danger: "#EF4444"
  dangerDark: "#7F1D1D"
  dangerSoft: "#FEE2E2"

  background: "#F1F3FB"
  surface: "#FFFFFF"
  surfaceAlt: "#F8FAFC"
  border: "#E8EAF3"

  sidebar: "#1E1B4B"
  text: "#1A1D2E"
  muted: "#6B7280"
  faint: "#9CA3AF"

typography:
  fontFamily: "Be Vietnam Pro"
  h1:
    fontSize: "28px"
    lineHeight: "1.25"
    fontWeight: 800
  body:
    fontSize: "14px"
    lineHeight: "1.6"
    fontWeight: 400
  label:
    fontSize: "12px"
    lineHeight: "1.4"
    fontWeight: 700
  caption:
    fontSize: "11px"
    lineHeight: "1.4"
    fontWeight: 600

radius:
  sm: "10px"
  md: "12px"
  lg: "16px"
  full: "999px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"

shadow:
  card: "0 2px 12px rgba(79,70,229,.09)"
  modal: "0 18px 48px rgba(15,23,42,.24)"

layout:
  desktopSidebarExpanded: "236px"
  desktopSidebarCollapsed: "72px"
  mobileBottomNavHeight: "64px"
  contentPaddingDesktop: "24px 28px"
  contentPaddingMobile: "14px 16px"

touch:
  tapSm: "40px"
  tapMd: "44px"
  tapLg: "48px"
---

# TOÁN NK Manager Design System

## 1. Vai trò

`DESIGN.md` là luật giao diện cho app quản lý **LỚP TOÁN NK**.

Mục tiêu:

- Giữ desktop và mobile nhất quán.
- Ưu tiên quản lý thật, không trang trí.
- Tránh mỗi tab tự sinh một kiểu header, table, badge, button.
- Giữ UI phục vụ nghiệp vụ: hôm nay dạy gì, ai cần điểm danh, ai nợ phí, cần liên hệ ai.

---

## 2. Tinh thần thiết kế

App phục vụ giáo viên/quản lý lớp học nên cần:

- Rõ.
- Gọn.
- Ít click.
- Đọc dữ liệu nhanh.
- Hành động chính dễ thấy.
- Màu ít nhưng có ý nghĩa nghiệp vụ.
- Desktop mạnh về quản trị bảng dữ liệu.
- Mobile mạnh về thao tác nhanh: điểm danh, thu phí, Zalo.

Không thiết kế theo hướng marketing, hero, hiệu ứng nhiều, hoặc dashboard báo cáo quá dài.

---

## 3. IA hiện tại

### 3.1. Desktop

Desktop dùng sidebar trái dạng **grouped flat navigation**. Item nghiệp vụ con bấm trực tiếp, content không hiện subtab lặp.

```text
TỔNG QUAN
- Tổng quan

ĐÀO TẠO
- Học sinh
- Lớp học
- Giáo viên

VẬN HÀNH
- Lịch dạy
- Buổi học
- Chuyên cần

TÀI CHÍNH
- Công nợ
- Phiếu thu
- Phiếu chi

BÁO CÁO
- Báo cáo đào tạo
- Báo cáo vận hành
- Báo cáo tài chính

HỆ THỐNG
- Cài đặt
```

Sidebar:

- Nền tím đậm `#1E1B4B`.
- Active item dùng `primary`.
- Group label uppercase nhỏ.
- Desktop có thể expanded 236px hoặc collapsed 72px.
- Nếu collapsed chỉ hiện icon, active item vẫn phải rõ.

### 3.2. Mobile

Mobile dùng bottom nav theo nhóm lớn:

```text
Tổng quan | Đào tạo | Vận hành | Tài chính | Báo cáo
```

Các màn con trên mobile có thể dùng chip/segmented control hoặc quick list trong module.

Không dùng phone shell trong production. Không dùng:

```html
user-scalable=no
```

Viewport production:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

---

## 4. Vai trò từng vùng

## 4.1. Tổng quan

Tổng quan là dashboard điều hành hằng ngày.

Nên gồm:

```text
Header hôm nay
KPI nhanh
Việc cần xử lý
Lịch dạy hôm nay
Thao tác nhanh
```

Không biến Tổng quan thành trang báo cáo dài. Số liệu phân tích sâu chuyển sang module Báo cáo.

KPI nên ưu tiên:

- Học sinh đang học.
- Lớp hôm nay.
- Doanh thu tháng này.
- Công nợ.
- Chưa điểm danh.

Quick actions nên ưu tiên:

- Ghi buổi học / Điểm danh.
- Thu học phí.
- Thêm học sinh.
- Nhắc phí Zalo.

## 4.2. Đào tạo

Đào tạo là dữ liệu gốc.

Màn trực tiếp:

```text
Học sinh
Lớp học
Giáo viên
```

Không có màn Tổng hợp trong Đào tạo. Insight tổng hợp đi vào Tổng quan hoặc Báo cáo đào tạo.

### Học sinh

Desktop table hiện ưu tiên:

```text
Tên
Lớp
Phụ huynh
Công nợ
Thao tác
```

Nguyên tắc:

- Không nhồi quá nhiều thông tin trong một ô.
- Tên chỉ là tên.
- Công nợ hiển thị số tháng/số trạng thái ngắn.
- Row click mở chi tiết nếu có handler.
- Action giữ gọn: Sửa, Zalo, Thu phí nếu có.

### Lớp học

Desktop table ưu tiên:

```text
Lớp
Lịch học
Giáo viên
Sĩ số
Đóng phí
Thao tác
```

Không kéo ngang trên laptop 1366px nếu có thể tránh.

### Giáo viên

Desktop table ưu tiên:

```text
Giáo viên
Phụ trách
Thu HP lớp
Số buổi
Thao tác
```

Không gọi thu học phí là lương hoặc doanh thu giáo viên.

## 4.3. Vận hành

Vận hành là thao tác hằng ngày.

Màn trực tiếp:

```text
Lịch dạy
Buổi học
Chuyên cần
```

Không có màn Tổng hợp trong Vận hành. Cảnh báo quan trọng đi vào Tổng quan hoặc Báo cáo vận hành.

### Lịch dạy

Badge chuẩn:

```text
Sắp tới
Đang diễn ra
Đã ghi
Chưa ghi
Đã hủy
```

Mobile ưu tiên lịch hôm nay trước.

### Buổi học

Mỗi buổi học nên hiển thị:

```text
Ngày
Lớp
Giáo viên
Nội dung
Bài tập
Trạng thái ghi nhận
```

### Chuyên cần

Chỉ dùng:

```text
Có mặt
Vắng
Có phép
```

Mobile target điểm danh khoảng 40-44px.

## 4.4. Tài chính

Tài chính là màn thao tác thu/chi, không phải báo cáo dài.

Màn trực tiếp:

```text
Công nợ
Phiếu thu
Phiếu chi
```

Không có màn Tổng hợp trong Tài chính. Tổng hợp tài chính nằm trong Báo cáo tài chính.

### Công nợ

Ưu tiên:

- Tìm học sinh/mã HS.
- Lọc lớp.
- Lọc tháng.
- Trạng thái: Tất cả / Chưa thu / Đã thu / Quá hạn.
- Nhắc phí/Zalo.
- Tạo phiếu thu.

Logic phải giữ:

```text
Billable students
startDate
endDate
status
thangHP
namHP
```

### Phiếu thu

Phải giữ:

- `MaHS`
- `MaLop`
- `ThangHP`
- `NamHP`
- Hình thức thanh toán: Chuyển khoản / Tiền mặt

### Phiếu chi

Ưu tiên bảng gọn:

```text
Ngày
Nội dung
Hạng mục
Người chi
Số tiền
Thao tác
```

## 4.5. Báo cáo

Báo cáo là nơi xem lại, in, xuất CSV.

Màn trực tiếp:

```text
Báo cáo đào tạo
Báo cáo vận hành
Báo cáo tài chính
```

Không đưa báo cáo dài vào Tổng quan.

## 4.6. Cài đặt

Cài đặt nằm trong nhóm Hệ thống.

Nhóm cấu hình:

```text
Trung tâm
Tài chính
Vận hành
Thông báo
Hệ thống
```

Không đưa lại mục “Giao diện” nếu chưa có giá trị thật.

---

## 5. Component patterns

### 5.1. Page header

Pattern chuẩn:

```text
Title | filters/search | primary action
```

Quy tắc:

- Header là card trắng, bo 14-16px, viền nhẹ.
- Không dùng subtitle dài nếu không có giá trị.
- Filter nằm cùng hàng title khi đủ rộng.
- Nút thêm/thao tác chính ở cuối hàng.
- Mobile có thể wrap xuống hàng nhưng vẫn giữ thứ tự.

### 5.2. Card

Card dùng cho:

- KPI.
- Khối dashboard.
- Lịch hôm nay.
- Việc cần xử lý.
- Empty state có hướng xử lý.

Style:

```text
Nền trắng
Viền nhẹ
Bo góc 14-16px
Shadow nhẹ
Padding 14-24px tùy mật độ
```

### 5.3. KPI card

KPI card gồm:

```text
Icon
Value
Label
Sub text ngắn
```

Không dùng badge tăng/giảm nếu không có dữ liệu so sánh thật.

### 5.4. Table

Table desktop:

- Header uppercase 11-12px, màu muted.
- Body 13-14px.
- Row cao 52-64px.
- Hover nhẹ.
- Dữ liệu chính bên trái.
- Trạng thái dùng badge.
- Action bên phải, tối đa 2-3 nút.
- Tránh horizontal scroll trên laptop 1366px.

Mobile:

- Không dùng table dài.
- Chuyển thành card/list compact.
- Action target tối thiểu 40px.

### 5.5. Badge

Badge phải ngắn và nhất quán.

```text
Đang học: success
Tạm nghỉ: warning
Đã nghỉ: gray
Có mặt: success
Vắng: danger
Có phép: warning
Đã thu: success
Chưa thu: warning
Quá hạn: danger
Sắp tới: info
Đang diễn ra: info
Đã ghi: success
Chưa ghi: warning/danger
Đã hủy: gray
```

### 5.6. Button

Primary button:

- Dùng cho hành động chính của màn.
- Màu primary hoặc green nếu là thu/ghi nhận tiền.
- Không dùng quá nhiều primary cùng một hàng.

Secondary/outline:

- Dùng cho sửa, chi tiết, xuất CSV, Zalo.
- Không dùng quá nhiều icon màu khác nhau trong bảng.

### 5.7. Empty state

Empty state phải gọn:

```text
Chưa có dữ liệu.
Thêm mới hoặc đổi bộ lọc để xem dữ liệu.
```

Không để vùng trống quá cao khi dữ liệu ít.

### 5.8. Toast

Toast dùng cho phản hồi ngắn:

```text
Đã lưu
Đã cập nhật
Đã xóa
Đã copy tin nhắn Zalo
```

Lỗi cần người dùng xử lý nên dùng alert/dialog rõ hơn.

### 5.9. Modal / Bottom sheet

Desktop dùng modal hoặc side panel.

Mobile dùng bottom sheet cho:

- Thêm/sửa học sinh.
- Ghi buổi học.
- Thu học phí.
- Tạo tin nhắn Zalo.
- Chi tiết công nợ.

---

## 6. Màu sắc

Màu trạng thái:

```text
Xanh lá: đã xong, đang học, có mặt, đã thu
Vàng/cam: cần chú ý, tạm nghỉ, có phép, chưa thu, sắp tới
Đỏ: lỗi, vắng, quá hạn, cảnh báo cần xử lý ngay
Xám: đã nghỉ, đã hủy, dữ liệu phụ
Tím/xanh: điều hướng, thông tin lớp/module
```

Không dùng màu chỉ để trang trí.

---

## 7. Typography

Font chuẩn:

```text
Be Vietnam Pro
```

Desktop:

```text
H1: 28px / 800-900
Body: 14px
Table body: 13-14px
Table header: 11-12px uppercase
Caption: 11-12px
```

Mobile:

```text
Title: 18-22px
Body: 13-14px
Caption: 11px
```

Không scale font theo viewport width.

---

## 8. Layout

Desktop:

```text
Sidebar expanded: 236px
Sidebar collapsed: 72px
Content padding: 24px 28px
Card radius: 14-16px
```

Mobile:

```text
Bottom nav: 64px
Content padding: 14px 16px
Tap target: 40-44px
```

---

## 9. Nghiệp vụ cần phản ánh trong UI

### 9.1. Công nợ

UI tài chính phải phản ánh:

```text
Không tính nợ trước startDate
Không tính nợ sau endDate
Không tính học sinh đã nghỉ
Tôn trọng thangHP/namHP
```

### 9.2. Zalo nhắc phí

UI công nợ nên hỗ trợ an toàn:

```text
Tạo tin nhắn
Copy tin nhắn
Mở Zalo nếu có số/link
Không tự gửi hàng loạt nếu chưa chắc chắn
Không thêm field đã nhắc nếu chưa cập nhật schema
```

Mẫu tin nhắn cơ bản:

```text
Chào phụ huynh em {{TenHS}}, LỚP TOÁN NK thông báo học phí tháng {{Thang}}/{{Nam}} của em hiện còn {{SoTienNo}}. Phụ huynh vui lòng kiểm tra và thanh toán giúp lớp. Em cảm ơn ạ.
```

### 9.3. Buổi học / chuyên cần

Điểm danh và nhật ký nên hiểu là một thao tác chung: **Ghi buổi học**.

Một buổi học cần có:

```text
Ngày
Lớp
Giáo viên
Nội dung
Bài tập
Điểm danh
Trạng thái ghi nhận
```

---

## 10. Do / Don't

### Do

- Giữ sidebar grouped flat trên desktop.
- Giữ item nghiệp vụ con bấm trực tiếp.
- Giữ Tổng quan ngắn, tập trung việc hôm nay.
- Đưa báo cáo sâu vào module Báo cáo.
- Dùng badge cho trạng thái.
- Dùng table desktop và card/list mobile.
- Giữ logic tài chính đã ổn.
- Giữ SĐT dạng string.
- Giữ `MaGV` và fallback `GiaoVien`.

### Don't

- Không đưa lại subtab Tổng hợp trong Đào tạo/Vận hành/Tài chính.
- Không hiện subtab con lặp trong content khi sidebar đã có item trực tiếp.
- Không đổi field Apps Script khi chỉ sửa UI.
- Không đổi schema Google Sheet khi chỉ sửa UI.
- Không thêm trạng thái điểm danh mới.
- Không tính công nợ cho học sinh chưa billable.
- Không đưa phone shell vào production.
- Không dùng dữ liệu demo MathPro/2025 trong production.

---

## 11. Checklist khi sửa UI

```text
[ ] Desktop sidebar grouped flat đúng các nhóm hiện tại.
[ ] Active item đúng theo screen/subtab state.
[ ] Content không hiện subtab lặp.
[ ] Mobile bottom nav không vỡ.
[ ] Học sinh/Lớp/Giáo viên table không kéo ngang bất hợp lý.
[ ] Lịch dạy badge đúng trạng thái.
[ ] Công nợ giữ billable/startDate/endDate/status/thangHP/namHP.
[ ] Chuyên cần chỉ Có mặt/Vắng/Có phép.
[ ] Không có MathPro/demo 2025/phone shell production.
[ ] npm.cmd run lint pass.
[ ] npm.cmd run build pass.
```
