# UI_RULES.md

## Purpose

File này ghi lại quy tắc giao diện cho app quản lý **Lớp Toán NK**.

Mục tiêu:

- Giữ UI nhất quán.
- Tránh Codex tự tạo thêm hệ component mới.
- Tránh redesign quá tay.
- Ưu tiên tốc độ thao tác và độ rõ nghiệp vụ.
- Dùng lại component đã có trong project.

---

## Product UI philosophy

Đây là app quản lý nội bộ, không phải landing page.

Ưu tiên:

1. Dễ hiểu.
2. Dễ thao tác hằng ngày.
3. Ít click.
4. Dữ liệu rõ ràng.
5. Mobile dùng được.
6. Không quá nhiều hiệu ứng.
7. Không làm đẹp bằng cách làm rối nghiệp vụ.

Không ưu tiên:

- Animation phức tạp.
- Layout quá nghệ thuật.
- Nhiều màu trang trí.
- Redesign toàn app khi chỉ cần sửa một vùng nhỏ.

---

## Current UI systems

Project hiện có 3 tầng UI component.

### 1. dsComponents.tsx

Dùng cho control nền:

- `Button`
- `IconButton`
- `Input`
- `Select`
- `SearchBar`
- `DataTable`
- `TableActions`
- `AttendancePicker`
- `FilterTabs`
- `Badge`
- `Pager`

Ưu tiên dùng file này cho form, nút, filter, table action.

---

### 2. AppComponents.tsx

Dùng cho UI shared/legacy đang xuất hiện nhiều:

- `fmtM`
- `TABLE_WRAP`
- `TH_SHARED`
- `TD_SHARED`
- `trStyle`
- `AppTable`
- `StatBlock`
- `StatGrid`
- `FAB`

Dùng cho table đơn giản, KPI block, floating action button.

---

### 3. uiSystem.tsx

Dùng cho UI dashboard/report mới hơn:

- `PageScaffold`
- `PageHeader`
- `ContextBar`
- `ActionableKpi`
- `ActionableKpiGrid`
- `QuickTaskList`
- `SubTabBar`
- `FilterBar`
- `DataTable`
- `StatusBadge`
- `ChartPanel`
- `MonthNavigator`

Dùng cho các màn dashboard, báo cáo, tổng hợp, context bar và KPI có action.

---

## Important rule

Không tạo UI system thứ tư.

Nếu cần component mới, trước tiên kiểm tra:

```text
dsComponents.tsx
AppComponents.tsx
uiSystem.tsx
```

Chỉ tạo component mới nếu:

- component đó lặp lại nhiều lần,
- không thể dùng component sẵn có,
- và task hiện tại cho phép thêm component.

---

## Navigation UI

Navigation chính hiện tại chỉ có 5 vùng:

1. Tổng quan
2. Vận hành
3. Lớp & Học sinh
4. Tài chính
5. Giáo viên

Cài đặt là mục phụ ở cuối sidebar/menu.

Không đưa các mục sau trở lại navigation chính:

- Học liệu
- Báo cáo
- Lớp học riêng
- Học sinh riêng

---

## Desktop sidebar

Sidebar desktop cần:

- Rõ ràng.
- Gọn.
- Không quá nhiều mục.
- Icon dễ nhận biết.
- Active state nổi bật.
- Settings tách khỏi nhóm nghiệp vụ chính.

Không nhồi các chức năng phụ vào sidebar chính.

---

## Mobile bottom nav

Mobile bottom nav chỉ chứa 5 vùng chính:

```text
Tổng quan
Vận hành
Lớp/HS
Tài chính
GV
```

Không đưa Cài đặt vào bottom nav.

Không đưa Học liệu/Báo cáo vào bottom nav.

---

## Page layout pattern

Mỗi tab chính nên có cấu trúc gần giống nhau:

```text
Header
→ Subtabs nếu có
→ Filter/context row nếu có
→ KPI/summary nếu cần
→ Main content
→ Table/detail/cards
```

Ưu tiên layout theo chiều dọc, dễ cuộn.

---

## Header pattern

Header nên gồm:

- Tên màn hình.
- Mô tả ngắn hoặc số liệu tổng.
- Subtab nếu có.
- Nút action chính nếu cần.

Ví dụ:

```text
Tài chính
Công nợ, phiếu thu/chi
[Tổng hợp] [Công nợ] [Phiếu thu] [Phiếu chi]
[Thêm phiếu thu/chi]
```

Không tạo header quá cao hoặc quá nhiều thông tin.

---

## Subtab pattern

Dùng `FilterTabs` hoặc `SubTabBar`.

Subtab nên:

- Ngắn gọn.
- Có icon nếu cần.
- Có count nếu hữu ích.
- Không quá 5 mục trong một hàng.

Ví dụ tốt:

```text
Lớp học | Học sinh
Tổng hợp | Công nợ | Phiếu thu | Phiếu chi
Lịch dạy | Buổi học | Chuyên cần
```

---

## KPI pattern

KPI nên có action khi có thể.

Ví dụ:

- Chưa đóng phí → click sang Công nợ.
- Phiếu thu → click sang Phiếu thu.
- Buổi chưa ghi → click sang Vận hành.
- Học sinh active → click sang Lớp & Học sinh.

Ưu tiên `StatBlock` hoặc `ActionableKpi`.

Không dùng KPI chỉ để làm đẹp nếu không giúp thao tác.

---

## Table pattern

Table nên dùng style chung:

```text
TABLE_WRAP
TH_SHARED
TD_SHARED
trStyle
```

Hoặc dùng `DataTable` nếu màn đó đã theo `uiSystem`.

Table cần:

- Header nhẹ.
- Row dễ đọc.
- Action buttons gọn.
- Empty state rõ.
- Có phân trang nếu dữ liệu nhiều.

Không render danh sách quá dài mà không phân trang.

---

## Mobile table pattern

Với màn nhiều cột như Tài chính:

- Desktop dùng table.
- Mobile có thể dùng card list.
- Không ép table quá rộng trên mobile nếu khó dùng.

Mobile cards nên có:

- Tên đối tượng chính.
- Số tiền/trạng thái nổi bật.
- Ngày/lớp/mô tả phụ.
- 2–3 action quan trọng nhất.

---

## Form/modal pattern

Modal nên:

- Tiêu đề rõ.
- Field chia nhóm hợp lý.
- Nút Hủy / Lưu rõ.
- Có `isSaving` loading state.
- Validate trước khi lưu.
- Không đóng modal nếu lỗi validate nghiêm trọng.

Nếu `onSave` yêu cầu `Promise<void>`, phải `return` promise từ handler.

Ví dụ:

```tsx
onSave={(f) => {
  setShowStudent(false);
  d.setEditStudent(null);
  return d.handleSaveStudent(f);
}}
```

---

## Button rules

Dùng `Button` từ `dsComponents.tsx`.

Intent gợi ý:

```text
primary   → action chính / điều hướng chính
success   → thu tiền, lưu thành công, thêm tích cực
warning   → sửa, giáo viên, nhắc chú ý
danger    → xóa, cảnh báo
neutral   → reset, hủy, thao tác phụ
secondary → action phụ nhưng vẫn nổi bật
```

Không tạo nhiều style button thủ công nếu component đã có.

---

## Badge/status rules

Dùng `Badge` hoặc `StatusBadge`.

Tone gợi ý:

```text
success / emerald → đang học, đã đóng, đã ghi
warning / amber   → nghỉ phép, muộn, cần chú ý
danger / rose     → chưa đóng, vắng nhiều, lỗi
neutral / slate   → đã nghỉ, không có dữ liệu
primary / indigo  → thông tin chính
```

Không dùng màu đỏ cho thông tin bình thường.

---

## Color principles

Dùng màu theo ngữ nghĩa:

```text
Indigo / Primary → điều hướng, chính
Emerald / Success → đã hoàn thành, thu tiền, tốt
Amber / Warning → cần chú ý
Rose / Danger → lỗi, nợ, vắng nhiều, xóa
Sky / Info → thông tin phụ
Slate / Neutral → trạng thái không hoạt động
```

Tránh:

- Quá nhiều màu trên cùng một màn.
- Màu gradient rực cho mọi thứ.
- Dùng đỏ/cam nếu không phải cảnh báo.

---

## Typography

Ưu tiên:

- Heading màn hình: 20–22px, font-weight 800, uppercase nếu đang dùng thống nhất.
- Label nhỏ: 11–12px, uppercase, letter spacing nhẹ.
- Text bảng: 12–14px.
- Số KPI: 20–30px, font-weight 800.

Không dùng quá nhiều cỡ chữ khác nhau trong cùng một component.

---

## Spacing

Ưu tiên layout gọn:

```text
gap màn hình: 12–16px
card padding: 12–16px
table cell padding: 11–14px
modal padding: 18–24px
border radius: 10–12px
```

Không làm khoảng cách quá lớn khiến màn hình quản lý bị ít dữ liệu.

---

## Dashboard rules

### OverviewTab

Tổng quan nên là dashboard hành động:

- Lịch dạy hôm nay.
- Cảnh báo vắng liên tiếp.
- Cảnh báo chưa đóng phí.
- Doanh thu gần đây.
- Nút nhanh.

Không biến Tổng quan thành trang chỉ có biểu đồ đẹp.

---

### OperationsTab

Vận hành là màn thao tác hằng ngày.

Ưu tiên:

- Lịch tuần.
- Buổi chưa ghi.
- Ghi buổi học.
- Chuyên cần.
- Xem/sửa nhật ký nhanh.

Màu trạng thái lịch:

```text
Đã ghi     → xanh
Chưa ghi   → vàng/cảnh báo
Tương lai  → xám
Hôm nay    → nổi bật nhẹ
```

---

### LearningTab

Lớp & Học sinh là wrapper cho:

```text
Lớp học
Học sinh
```

Không copy lại toàn bộ logic của `ClassesTab` và `StudentsTab` nếu có thể dùng lại component cũ.

Header nên hiển thị:

- Số lớp.
- Số học sinh đang học.
- Nút thêm lớp/thêm học sinh theo subtab.

---

### FinanceTab

Tài chính nên có subtab:

```text
Tổng hợp
Công nợ
Phiếu thu
Phiếu chi
```

Tổng hợp là default.

Công nợ cần hiển thị rõ:

- Ai chưa đóng.
- Nợ tháng nào.
- Tổng nợ.
- Liên hệ phụ huynh.
- Copy tin nhắn nhắc phí.
- Mở Zalo nếu có số.

Không tính nợ sai cho:

- học sinh chưa đến tháng bắt đầu học,
- học sinh đã nghỉ,
- tháng tương lai.

---

### TeachersTab

Giáo viên là màn vận hành, không chỉ danh bạ.

Nên hiển thị:

- Hồ sơ giáo viên.
- Lớp phụ trách.
- Học sinh phụ trách.
- Buổi dạy tháng này.
- Buổi học gần nhất.
- Doanh thu lớp phụ trách.
- Trạng thái hồ sơ.

Không gọi doanh thu lớp phụ trách là lương giáo viên.

---

## Accessibility

Tối thiểu cần:

- Button có `aria-label` nếu chỉ có icon.
- Link ngoài có `target="_blank"` và `rel="noopener noreferrer"`.
- Màu cảnh báo có text đi kèm, không chỉ dựa vào màu.
- Hover state không phải cách duy nhất để thấy action.

---

## Print/export

Các màn tài chính/báo cáo có thể có:

- In.
- Xuất CSV.
- Copy nội dung.

Không thêm export mới nếu chưa có yêu cầu cụ thể.

---

## Anti-patterns

Không làm:

- Tạo component UI mới khi đã có component cũ dùng được.
- Dùng inline style cực dài lặp lại nhiều lần mà không tách nếu task là cleanup.
- Đổi toàn bộ màu app trong task nhỏ.
- Đổi navigation khi task không yêu cầu.
- Xóa tab/file cũ khi chưa kiểm tra import.
- Gom nhiều refactor UI + logic + structure trong cùng một lần.
- Chuyển hết sang Tailwind nếu project đang dùng nhiều inline style, trừ khi có task riêng.

---

## Safe UI refactor workflow

Khi cần cải thiện UI:

1. Chọn đúng một màn hoặc một component.
2. Đọc component liên quan.
3. Tạo plan.
4. Không đổi data logic.
5. Không đổi field/type nếu không cần.
6. Sửa UI.
7. Chạy:

```bash
npm run lint
npm run build
```

8. Test tay màn đó.
9. Báo cáo file đã sửa và rủi ro.

---

## Recommended next UI cleanup order

Sau khi commit mốc hiện tại và chia folder structure:

1. Chuẩn hóa header các tab.
2. Chuẩn hóa subtab bar.
3. Tách component lớn của `FinanceTab`.
4. Tách component lớn của `TeachersTab`.
5. Tách `WeeklyCalendar` khỏi `OperationsTab`.
6. Tách `SmartAlerts` và `TodaySchedule` khỏi `OverviewTab`.
7. Sau đó mới tính đến performance/code-splitting.
