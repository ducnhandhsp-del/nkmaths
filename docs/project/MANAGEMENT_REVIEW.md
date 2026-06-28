# MANAGEMENT_REVIEW.md

## Mục đích

File này ghi lại góc nhìn quản lý, nghiệp vụ và giao diện cho app **Lớp Toán NK**.

Nội dung này dùng để:

- Định hướng sản phẩm.
- Giúp Codex hiểu mục tiêu quản lý thật.
- Tránh phát triển app theo kiểu nhiều tab rời rạc.
- Ưu tiên workflow vận hành hằng ngày.
- Làm cơ sở cho các lần refactor/nâng cấp tiếp theo.

---

## 1. Hiểu tổng thể về dự án

Dự án hiện là app quản lý vận hành cho **Lớp Toán NK**, không đơn thuần là app lưu danh sách học sinh.

App đang đi theo hướng dashboard quản lý trung tâm/lớp học nhỏ, tập trung vào:

- Lớp học.
- Buổi học.
- Học sinh.
- Học phí.
- Giáo viên.
- Cảnh báo vận hành hằng ngày.

Cấu trúc sản phẩm hiện tại gồm 5 vùng chính:

```text
Tổng quan
Vận hành
Lớp & Học sinh
Tài chính
Giáo viên
```

Đây là cấu trúc hợp lý hơn việc có quá nhiều tab rời như:

```text
Học sinh
Lớp học
Học liệu
Báo cáo
Tài chính
Giáo viên
```

---

## 2. Hiểu nghiệp vụ hiện tại

### Tổng quan

Tổng quan không nên chỉ là trang KPI đẹp.

Tổng quan nên là **bảng điều hành hằng ngày**, giúp người quản lý mở app lên là biết ngay:

- Hôm nay có lớp nào?
- Có buổi học nào chưa ghi?
- Học sinh nào vắng liên tiếp?
- Học sinh nào chưa đóng phí?
- Tài chính tháng này ra sao?
- Có việc gì cần xử lý ngay?

Hiện `OverviewTab` đã có các hướng đúng:

- Lịch dạy hôm nay theo giáo viên.
- Cảnh báo học sinh vắng liên tiếp.
- Cảnh báo học sinh chưa đóng phí.
- Biểu đồ doanh thu 6 tháng.
- KPI có thể click để thao tác nhanh.

Định hướng tiếp theo:

```text
Tổng quan = bảng việc cần xử lý hôm nay
```

Không nên biến Tổng quan thành trang báo cáo tĩnh hoặc chỉ có biểu đồ.

---

### Vận hành

Vận hành là vùng quan trọng nhất cho việc dạy học thực tế.

Hiện `OperationsTab` có 3 phần:

```text
Lịch dạy
Buổi học
Chuyên cần
```

Đây là hướng đúng.

Đặc biệt, lịch tuần có thể:

- Click buổi đã ghi để xem nhật ký.
- Click buổi chưa ghi để mở form ghi buổi.
- Phân biệt buổi đã ghi / chưa ghi / tương lai.

Tư duy chuẩn:

```text
Trung tâm vận hành theo buổi học.
```

Không nên để người dùng phải hiểu:

```text
Điểm danh ở đâu?
Nhật ký ở đâu?
Chuyên cần ở đâu?
```

Hành động đúng nên là:

```text
Ghi buổi học
```

Một buổi học nên gồm:

- Lớp.
- Ngày.
- Ca dạy.
- Giáo viên.
- Điểm danh.
- Nội dung bài dạy.
- Bài tập về nhà.
- Ghi chú giáo viên.
- Lưu một lần.

---

### Lớp & Học sinh

Việc gộp `ClassesTab` và `StudentsTab` thành `LearningTab` là đúng.

Trong thực tế:

- Học sinh luôn gắn với lớp.
- Lớp luôn cần sĩ số, giáo viên, lịch học.
- Quản lý học sinh tách rời lớp sẽ khó vận hành.

`LearningTab` nên là vùng quản lý:

```text
Lớp học
Học sinh
```

Định hướng:

- Quản lý lớp trước.
- Quản lý học sinh sau.
- Xem nhanh sĩ số, lịch, giáo viên, trạng thái lớp.
- Xem học sinh theo lớp, trạng thái, công nợ, chuyên cần.

---

### Tài chính

`FinanceTab` hiện có 4 subtab:

```text
Tổng hợp
Công nợ
Phiếu thu
Phiếu chi
```

Đây là hướng hợp lý.

Không nên để “Báo cáo” là tab chính riêng. Báo cáo doanh thu nên nằm trong `FinanceTab`.

Nghiệp vụ tài chính cần trả lời rõ:

#### Công nợ

```text
Ai chưa đóng?
Nợ tháng nào?
Nợ bao nhiêu?
Có cần nhắc phụ huynh không?
```

#### Phiếu thu

```text
Đã thu những khoản nào?
Ai nộp?
Thu ngày nào?
Hình thức gì?
Có chứng từ không?
```

#### Phiếu chi

```text
Chi khoản nào?
Ai chi?
Chi cho hạng mục gì?
```

#### Tổng hợp

```text
Tháng này thu bao nhiêu?
Chi bao nhiêu?
Lãi/lỗ bao nhiêu?
Lớp nào tạo doanh thu chính?
Giáo viên nào phụ trách lớp có doanh thu cao?
```

Các rule quan trọng:

- Không tính nợ trước `startDate`.
- Không tính nợ sau `endDate`.
- Không tính tháng tương lai là nợ.
- Ưu tiên `thangHP` và `namHP` nếu payment có dữ liệu tháng học phí.
- Zalo nhắc phí nên copy nội dung trước, mở Zalo sau.

---

### Giáo viên

`TeachersTab` đã được nâng từ “danh bạ giáo viên” thành màn vận hành giáo viên.

Đây là hướng đúng.

Tab Giáo viên nên giúp quản lý biết:

- Giáo viên nào đang dạy?
- Giáo viên phụ trách lớp nào?
- Tháng này dạy bao nhiêu buổi?
- Có buổi nào chưa ghi không?
- Lớp phụ trách có bao nhiêu học sinh?
- Tỷ lệ đóng phí của lớp phụ trách ra sao?
- Tỷ lệ chuyên cần của lớp phụ trách ra sao?

Hiện `TeachersTab` đã có:

- Hồ sơ giáo viên.
- Giáo viên xuất hiện trong dữ liệu nhưng chưa có hồ sơ.
- Lớp phụ trách.
- Học sinh active.
- Số buổi dạy tháng.
- Doanh thu lớp phụ trách.
- Chuyên cần.
- Buổi học gần nhất.

Lưu ý:

```text
Doanh thu lớp phụ trách không phải lương giáo viên.
```

Nếu sau này làm lương giáo viên, nên tách module riêng dựa trên:

- Số buổi dạy.
- Đơn giá/buổi.
- Phụ cấp.
- Khấu trừ nếu có.

---

## 3. Hiểu giao diện hiện tại

Giao diện hiện tại đang theo phong cách dashboard quản lý nội bộ:

```text
header gọn
subtab rõ
KPI/action card
table/card dữ liệu
filter/search
modal xử lý nhanh
```

Project hiện có 3 tầng UI component:

```text
dsComponents.tsx   → Button, Input, Select, SearchBar, TableActions, Pager...
AppComponents.tsx  → StatBlock, StatGrid, TABLE_WRAP, FAB...
uiSystem.tsx       → PageScaffold, ContextBar, ActionableKpi, DataTable, StatusBadge...
```

Quy tắc quan trọng:

```text
Không tạo thêm hệ UI thứ tư.
```

Khi sửa UI, Codex phải ưu tiên dùng lại:

- `dsComponents.tsx`
- `AppComponents.tsx`
- `uiSystem.tsx`

Không redesign toàn app nếu task chỉ là sửa một vùng nhỏ.

---

## 4. Đề xuất chuẩn theo quản lý

### 4.1. Xem app là bảng điều hành vận hành

App này không nên chỉ là nơi lưu dữ liệu.

App nên trả lời 5 câu hỏi mỗi ngày:

```text
Hôm nay có lớp nào?
Lớp nào chưa ghi buổi học?
Ai vắng nhiều?
Ai chưa đóng phí?
Giáo viên/lớp nào cần xử lý?
```

Tổng quan nên có 4 khối:

```text
1. Lịch hôm nay
2. Việc cần xử lý
3. Tài chính tháng này
4. Hoạt động gần đây
```

Ví dụ “Việc cần xử lý”:

```text
- 3 buổi chưa ghi nhật ký
- 5 học sinh chưa đóng phí T5
- 2 học sinh vắng liên tiếp
- 1 giáo viên chưa có hồ sơ
```

---

### 4.2. Chuẩn hóa Vận hành quanh “Ghi buổi học”

Đây là đề xuất quan trọng nhất.

Workflow chuẩn:

```text
Chọn lớp
→ Chọn ngày
→ Chọn ca
→ Điểm danh
→ Nội dung bài dạy
→ Bài tập về nhà
→ Ghi chú
→ Lưu
```

Không nên tách “điểm danh” và “nhật ký” thành hai thao tác độc lập.

Mỗi buổi học nên có trạng thái:

```text
Chưa đến
Chưa ghi
Đã ghi
Thiếu điểm danh
Cần kiểm tra
```

Tổng quan sau này có thể cảnh báo:

```text
Buổi hôm qua lớp 12A chưa ghi.
Buổi 19h30 lớp 10B thiếu điểm danh.
```

---

### 4.3. Quản lý học sinh theo vòng đời

Học sinh nên được quản lý theo vòng đời:

```text
Đang học
Tạm nghỉ
Đã nghỉ
Chuyển lớp
```

Trong `LearningTab`, nên có bộ lọc nhanh:

```text
Tất cả
Đang học
Nghỉ
Nợ phí
Vắng nhiều
```

Hồ sơ học sinh nên có 5 nhóm:

```text
1. Thông tin cá nhân
2. Phụ huynh/liên hệ
3. Lớp đang học
4. Học phí/công nợ
5. Chuyên cần/nhật ký gần đây
```

Không nên để hồ sơ học sinh chỉ là một form dài.

Nên biến nó thành **hồ sơ quản lý**.

---

### 4.4. Chuẩn hóa Tài chính

Giữ cấu trúc:

```text
Tổng hợp
Công nợ
Phiếu thu
Phiếu chi
```

Nên thêm tư duy **đối soát tháng**.

Ví dụ:

```text
T5/2026:
- Số học sinh cần đóng: 42
- Đã đóng: 36
- Chưa đóng: 6
- Dự kiến thu: 25.2tr
- Đã thu: 21.6tr
- Chênh lệch: 3.6tr
```

Mục tiêu của Tài chính là giúp quản lý biết:

- Dòng tiền hiện tại.
- Công nợ cần nhắc.
- Lớp nào có doanh thu tốt.
- Khoản chi nào đáng chú ý.
- Có chênh lệch nào cần kiểm tra.

---

### 4.5. Chuẩn hóa Giáo viên

Tab Giáo viên nên có 3 khối chính:

```text
Lịch dạy
Buổi đã ghi
Lớp phụ trách
```

Với mỗi giáo viên, nên xem được:

```text
- Tuần này dạy lớp nào?
- Tháng này đã dạy bao nhiêu buổi?
- Còn buổi nào chưa ghi?
- Lớp phụ trách có bao nhiêu học sinh?
- Tỷ lệ đóng phí của lớp phụ trách?
- Tỷ lệ chuyên cần của lớp phụ trách?
```

Không gọi doanh thu lớp phụ trách là lương giáo viên.

Lương giáo viên nên là module riêng sau này:

```text
số buổi dạy
đơn giá/buổi
phụ cấp
khấu trừ
tạm tính lương
```

---

### 4.6. Chuẩn hóa cảnh báo quản lý

Một app quản lý tốt nên chủ động nhắc việc.

Các nhóm cảnh báo nên có:

#### Tài chính

```text
- Học sinh nợ >= 2 tháng
- Học sinh chưa đóng tháng hiện tại
- Phiếu thu bất thường
```

#### Vận hành

```text
- Buổi học đã qua nhưng chưa ghi
- Buổi học thiếu điểm danh
- Học sinh vắng liên tiếp >= 2 buổi
```

#### Học sinh

```text
- Học sinh mới chưa gán lớp
- Học sinh đã nghỉ nhưng vẫn bị tính nợ
- Học sinh thiếu số phụ huynh
```

#### Giáo viên

```text
- Giáo viên có lớp nhưng chưa có hồ sơ
- Giáo viên có buổi dạy nhưng chưa ghi nhật ký
```

Cảnh báo nên gom vào Tổng quan, không nằm rải rác.

---

### 4.7. Chuẩn hóa dữ liệu

Nguyên tắc:

```text
Dữ liệu phải phục vụ báo cáo và quyết định quản lý.
```

Các field quan trọng cần giữ ổn định:

#### Học sinh

```text
id
name
classId
teacher
startDate
endDate
status
parentPhone
academicLevel
```

#### Lớp

```text
classId
className
grade
teacher
branch
schedule slots
```

#### Buổi học

```text
date
classId
caDay
teacherName
attendanceList
content
homework
teacherNote
```

#### Học phí

```text
studentId
amount
date
thangHP
namHP
docNum
method
payer
```

#### Giáo viên

```text
teacherId
name
phone
email
status
specialization
baseSalary
hourlyRate
allowance
```

Cần giữ đồng bộ giữa:

```text
types.ts
useAppData.ts
useDomains.ts
Google Apps Script
Google Sheets headers
```

---

## 5. Roadmap đề xuất

### Giai đoạn 1 — Ổn định bản hiện tại

Bạn đang ở giai đoạn này.

Checklist:

```text
lint pass
build pass
test tay
commit local
chưa push nếu chưa muốn
```

---

### Giai đoạn 2 — Chia folder structure

Không đổi UI/logic.

Target:

```text
src/
  app/
  layout/
  tabs/
  modals/
  components/
  hooks/
  lib/
  types/
  styles/
```

Đây là bước nên làm tiếp theo để Codex đỡ loạn.

---

### Giai đoạn 3 — Tách file lớn

Sau khi structure ổn:

```text
FinanceTab → FinanceReport / FinanceDebt / FinanceLedger / FinanceExpense
TeachersTab → TeacherModal / TeacherDetailDrawer / teacherMetrics
OperationsTab → WeeklyCalendar / DiaryList / AttendanceStats
OverviewTab → TodaySchedule / SmartAlerts / RevenueChart
```

---

### Giai đoạn 4 — Nâng workflow Ghi buổi học

Đây là nâng cấp nghiệp vụ quan trọng nhất.

Mục tiêu:

```text
Một thao tác Ghi buổi học
= điểm danh + nhật ký + bài tập + ghi chú
```

---

### Giai đoạn 5 — Báo cáo quản lý chuẩn

Sau cùng mới làm:

```text
Báo cáo công nợ tháng
Báo cáo chuyên cần
Báo cáo doanh thu lớp
Báo cáo giáo viên
Báo cáo học sinh cần theo dõi
```

---

## 6. Kết luận

Dự án đang đi đúng hướng.

Điểm mạnh hiện tại:

```text
Từ app nhiều tab rời
→ chuyển dần thành app quản lý theo workflow thật
```

Cấu trúc chuẩn nên là:

```text
Tổng quan = biết hôm nay cần xử lý gì
Vận hành = ghi buổi học và chuyên cần
Lớp & Học sinh = quản lý hồ sơ/lớp
Tài chính = công nợ/thu/chi/báo cáo
Giáo viên = lớp phụ trách/buổi dạy/hồ sơ
```

Việc tiếp theo không nên là thêm tính năng mới ngay.

Thứ tự nên làm:

```text
test tay kỹ
→ commit local
→ chia folder structure
→ tách file lớn
→ nâng workflow Ghi buổi học
→ rồi mới nâng báo cáo/nghiệp vụ sâu
```
