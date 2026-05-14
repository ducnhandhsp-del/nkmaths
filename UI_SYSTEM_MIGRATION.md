# UI_SYSTEM_MIGRATION.md

## Mục đích

File này ghi lại chiến lược chuẩn hóa hệ UI cho app **Lớp Toán NK**.

Mục tiêu:

- Xác định rõ vai trò của các file UI hiện tại.
- Chọn `uiSystem.tsx` làm chuẩn UI chính trong tương lai.
- Giữ `dsComponents.tsx` làm bộ primitive/control nền.
- Xem `AppComponents.tsx` là legacy shared UI và thay thế dần.
- Tránh rewrite toàn bộ giao diện trong một lần.
- Giúp Codex migrate UI có kiểm soát, không phá logic nghiệp vụ.

---

## Hiện trạng UI

Dự án hiện có 3 lớp UI song song:

```text
dsComponents.tsx
AppComponents.tsx
uiSystem.tsx
```

Đây không phải là 3 UI system hoàn toàn riêng biệt, mà đúng hơn là 3 tầng khác nhau:

```text
dsComponents.tsx   = UI primitives / controls
AppComponents.tsx  = legacy shared UI
uiSystem.tsx       = application UI system mới hơn
```

---

## Vai trò chuẩn đề xuất

### 1. dsComponents.tsx

`dsComponents.tsx` nên được giữ lại.

Vai trò chuẩn:

```text
UI primitives / controls
```

Tức là các component nhỏ, cơ bản, dùng làm nền:

```text
Button
IconButton
Input
Select
SearchBar
FilterTabs
Badge
Pager
TableActions
AttendancePicker
DataTable primitive nếu cần
```

Không nên bỏ `dsComponents.tsx`.

Nó đóng vai trò như “bộ gạch xây nhà”.

Quy tắc:

- Code mới vẫn được dùng `dsComponents`.
- Không duplicate Button/Input/Select/SearchBar ở nơi khác.
- Nếu cần sửa style control nền, sửa ở `dsComponents.tsx`.
- Không tạo Button/Input/Select mới trong từng tab.

---

### 2. uiSystem.tsx

`uiSystem.tsx` nên được phát triển thành chuẩn UI chính.

Vai trò chuẩn:

```text
Application UI system
```

Tức là các component cấp màn hình và layout:

```text
PageScaffold
PageHeader
ContextBar
ActionableKpi
ActionableKpiGrid
QuickTaskList
SubTabBar
FilterBar
DataTable
StatusBadge
ChartPanel
MonthNavigator
EmptyState
Card/Shell components
```

Nó đóng vai trò như “bản thiết kế căn nhà”.

Quy tắc:

- Code mới ưu tiên dùng `uiSystem.tsx` cho layout/tab/dashboard.
- Các tab chính nên dần đi theo pattern của `uiSystem`.
- Không tạo thêm hệ page layout mới nếu `uiSystem` đã có component phù hợp.
- Nếu thiếu component cấp hệ thống, bổ sung vào `uiSystem.tsx` thay vì tạo riêng trong từng tab.

---

### 3. AppComponents.tsx

`AppComponents.tsx` hiện vẫn đang được dùng nhiều.

Vai trò hiện tại:

```text
legacy shared UI
```

Nó chứa các component/style cũ:

```text
fmtM
TABLE_WRAP
TH_SHARED
TD_SHARED
trStyle
AppTable
StatBlock
StatGrid
FAB
ErrorBoundary
```

Không nên xóa ngay.

Nhưng về định hướng, `AppComponents.tsx` nên được thay thế dần bởi `uiSystem.tsx`.

Quy tắc:

- Không thêm component mới vào `AppComponents.tsx` nếu không bắt buộc.
- Không xóa component trong `AppComponents.tsx` khi vẫn còn usage.
- Khi migrate xong component nào, kiểm tra không còn usage rồi mới xóa.
- Code mới nên ưu tiên `uiSystem.tsx` + `dsComponents.tsx`.

Có thể thêm comment đầu file `AppComponents.tsx`:

```tsx
/**
 * Legacy shared UI components.
 * Prefer uiSystem.tsx + dsComponents.tsx for new UI.
 * Do not remove until all usages are migrated.
 */
```

---

## Định hướng cuối cùng

Tương lai mong muốn:

```text
dsComponents.tsx   → primitives / controls
uiSystem.tsx       → application UI system
AppComponents.tsx  → legacy, giảm dần và có thể xóa sau
```

Không nên duy trì lâu dài 3 nơi cùng giải quyết một vấn đề.

---

## Cấu trúc UI lý tưởng sau này

Khi dự án đã chia folder, có thể tiến tới cấu trúc:

```text
src/
  ui/
    primitives/
      Button.tsx
      Input.tsx
      Select.tsx
      Badge.tsx
      Pager.tsx
      SearchBar.tsx
      FilterTabs.tsx

    system/
      PageScaffold.tsx
      PageHeader.tsx
      ContextBar.tsx
      ActionableKpi.tsx
      FilterBar.tsx
      DataTable.tsx
      StatusBadge.tsx
      ChartPanel.tsx
      MonthNavigator.tsx
      EmptyState.tsx
      FloatingActionButton.tsx

    legacy/
      AppComponents.tsx
```

Nhưng hiện tại chưa cần tách file ngay.

Trước mắt cứ giữ:

```text
dsComponents.tsx
uiSystem.tsx
AppComponents.tsx
```

và áp dụng quy tắc:

```text
Code mới ưu tiên uiSystem + dsComponents.
AppComponents chỉ dùng khi chưa có component thay thế.
```

---

## Vì sao không rewrite toàn bộ UI ngay?

Không nên yêu cầu Codex:

```text
Đồng bộ lại toàn bộ giao diện app
```

vì task này quá rộng.

Rủi ro:

```text
- Sửa quá nhiều file cùng lúc.
- Đổi logic ngoài ý muốn.
- Tự tạo component mới không cần thiết.
- UI đẹp hơn nhưng workflow khó dùng hơn.
- Build pass nhưng thao tác lỗi.
- Khó review diff.
- Khó rollback.
```

Cách đúng là:

```text
Xây uiSystem đủ mạnh
→ migrate từng tab
→ test từng bước
→ xóa legacy khi không còn dùng
```

---

## Lộ trình migration an toàn

### Giai đoạn 1 — Đóng băng vai trò

Không sửa code lớn.

Chỉ thống nhất:

```text
dsComponents = primitives
uiSystem = chuẩn mới
AppComponents = legacy
```

Việc nên làm:

- Ghi rõ trong docs.
- Có thể thêm comment đầu `AppComponents.tsx`.
- Không thêm component mới vào `AppComponents.tsx`.

---

### Giai đoạn 2 — Bổ sung uiSystem cho đủ

Trước khi migrate tab, `uiSystem.tsx` cần có đủ component thay thế.

Mapping đề xuất:

```text
StatBlock      → ActionableKpi hoặc StatCard mới
StatGrid       → ActionableKpiGrid
TABLE_WRAP     → Card / TableShell
AppTable       → DataTable
FAB            → FloatingActionButton
Empty state    → EmptyState
Header pattern → PageHeader
Filter row     → FilterBar
Subtab row     → SubTabBar
Status display → StatusBadge
```

Nguyên tắc:

```text
Không migrate trước khi có component thay thế tốt.
```

Task an toàn:

```text
Chỉ bổ sung component còn thiếu vào uiSystem.tsx.
Không sửa các tab.
Không đổi UI hiện tại.
Chạy npm run lint và npm run build.
```

---

### Giai đoạn 3 — Migrate từng tab

Không migrate toàn app cùng lúc.

Thứ tự đề xuất:

```text
1. LearningTab
2. TeachersTab
3. OperationsTab
4. OverviewTab
5. FinanceTab rà lại cuối
```

Lý do:

- `LearningTab` là wrapper nhỏ, ít rủi ro.
- `TeachersTab` đã có hướng dashboard vận hành, dễ chuẩn hóa.
- `OperationsTab` quan trọng nhưng phức tạp hơn.
- `OverviewTab` cần tư duy dashboard hành động, nên làm sau khi pattern rõ.
- `FinanceTab` đã dùng nhiều UI mới, nên rà lại cuối.

---

### Giai đoạn 4 — Giảm dần AppComponents

Khi một component trong `AppComponents.tsx` không còn ai dùng nữa, mới xóa.

Ví dụ kiểm tra usage:

```bash
grep -R "StatBlock" src
```

Nếu không còn kết quả, có thể xóa `StatBlock`.

Trên Windows CMD có thể dùng:

```bash
findstr /S /N "StatBlock" src\*.tsx src\*.ts
```

Không xóa legacy component khi vẫn còn import.

---

## Pattern UI chuẩn cuối cùng

Mỗi tab chính nên theo pattern:

```text
PageScaffold
→ PageHeader
→ ContextBar hoặc KPI row
→ SubTabBar nếu có
→ FilterBar nếu có
→ Main content
→ DataTable/Card/Drawer/Modal
```

Ví dụ:

### LearningTab

```text
PageHeader: Lớp & Học sinh
Context/KPI: số lớp, số học sinh đang học
SubTabBar: Lớp học | Học sinh
Main: ClassesTab hoặc StudentsTab
```

### FinanceTab

```text
PageHeader: Tài chính
SubTabBar: Tổng hợp | Công nợ | Phiếu thu | Phiếu chi
ContextBar: kỳ báo cáo/filter
KPI: thu/chi/lợi nhuận/công nợ
Main: report/debt/ledger/expense
```

### TeachersTab

```text
PageHeader: Giáo viên
KPI: hồ sơ, lớp phụ trách, buổi dạy, doanh thu lớp phụ trách
FilterBar: search + status
DataTable: danh sách giáo viên
Drawer: chi tiết giáo viên
```

### OperationsTab

```text
PageHeader: Vận hành
SubTabBar: Lịch dạy | Buổi học | Chuyên cần
FilterBar: giáo viên/lớp/search
Main:
  - WeeklyCalendar
  - DiaryList
  - AttendanceStats
```

### OverviewTab

```text
PageHeader: Tổng quan
ActionableKpiGrid
QuickTaskList
TodaySchedule
RevenueChart
RecentActivity
```

---

## Quy tắc migration từng tab

Khi migrate một tab:

1. Không đổi props public của tab nếu không cần.
2. Không đổi data logic.
3. Không đổi business rule.
4. Không đổi handler save/delete/update.
5. Không đổi navigation.
6. Chỉ đổi layout/component UI.
7. Chạy:

```bash
npm run lint
npm run build
```

8. Test tay tab đó.
9. Báo cáo diff và rủi ro.

---

## Prompt audit cho Codex

Dùng prompt này trước khi code:

```text
Đọc AGENTS.md, PROJECT_CONTEXT.md, UI_RULES.md và UI_SYSTEM_MIGRATION.md.

Nhiệm vụ: audit hệ UI hiện tại, chưa sửa code.

Mục tiêu:
- Xác định vai trò hiện tại của dsComponents.tsx, AppComponents.tsx, uiSystem.tsx.
- Đề xuất cách biến uiSystem.tsx thành UI system chính.
- Liệt kê component nào trong AppComponents.tsx nên thay bằng component nào trong uiSystem.tsx.
- Chỉ ra component nào còn thiếu trong uiSystem.tsx.
- Đề xuất migration plan từng bước, không rewrite toàn app.

Không sửa code.
```

---

## Prompt bổ sung uiSystem an toàn

Sau audit, có thể dùng prompt này:

```text
Đọc AGENTS.md, PROJECT_CONTEXT.md, UI_RULES.md và UI_SYSTEM_MIGRATION.md.

Nhiệm vụ duy nhất: bổ sung component còn thiếu vào uiSystem.tsx để chuẩn bị migration UI.

Yêu cầu:
- Không sửa các tab.
- Không đổi UI hiện tại.
- Không đổi logic.
- Không đổi navigation.
- Không thêm thư viện.
- Chỉ thêm component UI system cần thiết.
- Chạy npm run lint và npm run build.

Báo cáo:
- component đã thêm
- component đó thay thế legacy nào
- file nào có thể migrate sau
```

---

## Prompt migrate từng tab

Ví dụ với `LearningTab`:

```text
Đọc AGENTS.md, PROJECT_CONTEXT.md, UI_RULES.md và UI_SYSTEM_MIGRATION.md.

Nhiệm vụ duy nhất: migrate UI của LearningTab sang pattern uiSystem.

Yêu cầu:
- Không đổi logic.
- Không đổi props.
- Không đổi ClassesTab/StudentsTab bên trong.
- Không đổi navigation.
- Chỉ cải thiện header, subtab, spacing, action button.
- Ưu tiên dùng uiSystem.tsx và dsComponents.tsx.
- Không dùng thêm component mới nếu uiSystem đã có.
- Chạy npm run lint và npm run build.
```

---

## Kết luận

Nên lấy `uiSystem.tsx` làm chuẩn mới.

Nhưng chiến lược đúng là:

```text
dsComponents giữ làm primitives
uiSystem phát triển thành chuẩn chính
AppComponents xem là legacy
migrate từng tab
xóa legacy khi không còn usage
```

Không rewrite toàn bộ app trong một lần.

Không để Codex tự tạo thêm UI system mới.
