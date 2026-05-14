# PROJECT_CONTEXT.md

## Overview

Đây là app quản lý nội bộ cho **Lớp Toán NK**.

Mục tiêu chính của app:

- Quản lý học sinh.
- Quản lý lớp học.
- Ghi buổi học.
- Điểm danh.
- Theo dõi học phí và công nợ.
- Quản lý phiếu thu / phiếu chi.
- Quản lý giáo viên.
- Xem tổng quan vận hành hằng ngày.

App này là app quản lý vận hành, không phải app LMS/học liệu. Học liệu đã được loại khỏi navigation chính và có thể tách thành app học tập riêng sau này.

---

## Product direction

App nên vận hành theo quy trình thực tế của trung tâm toán:

```text
Tổng quan
→ Vận hành buổi học
→ Lớp & Học sinh
→ Tài chính
→ Giáo viên
→ Cài đặt
```

Nguyên tắc nghiệp vụ quan trọng:

- Đơn vị thao tác chính là **buổi học**.
- Điểm danh và nhật ký không nên là hai việc tách rời.
- Một buổi học gồm:
  - lớp
  - ngày
  - ca dạy
  - giáo viên
  - điểm danh
  - nội dung bài dạy
  - bài tập về nhà
  - ghi chú giáo viên

---

## Current navigation

Navigation chính hiện tại gồm 5 vùng nghiệp vụ:

1. Tổng quan
2. Vận hành
3. Lớp & Học sinh
4. Tài chính
5. Giáo viên

Cài đặt nằm riêng ở cuối sidebar/menu.

Đã bỏ khỏi navigation chính:

- Học liệu
- Báo cáo
- Học sinh riêng
- Lớp học riêng

---

## Current technical status

Bản hiện tại trong repo:

```text
C:\Users\Admin\QUAN_LY_TOAN_NK
```

đã kiểm tra:

```bash
npm run lint
npm run build
```

Kết quả:

```text
lint: pass
build: pass
```

Build có cảnh báo bundle lớn hơn 500 kB. Đây là warning tối ưu hiệu năng, chưa phải lỗi.

---

## Stack

- React 19
- Vite
- TypeScript
- TailwindCSS
- Express
- better-sqlite3
- Google Apps Script / Google Sheets data source
- LocalStorage cache
- lucide-react
- recharts
- react-hot-toast

---

## Main source structure

Hiện tại phần lớn source vẫn nằm phẳng trong `src/`.

Các nhóm file chính:

```text
src/
  App.tsx
  Layout.tsx
  OverviewTab.tsx
  OperationsTab.tsx
  LearningTab.tsx
  FinanceTab.tsx
  TeachersTab.tsx
  ClassesTab.tsx
  StudentsTab.tsx
  ModalStudent.tsx
  ModalClass.tsx
  ModalFinance.tsx
  ModalDiary.tsx
  useAppData.ts
  useDomains.ts
  useCommands.ts
  helpers.ts
  rules.ts
  measures.ts
  aggregations.ts
  types.ts
  dsComponents.tsx
  AppComponents.tsx
  uiSystem.tsx
```

Sau khi mốc hiện tại ổn định, task kế tiếp nên là chia folder structure, nhưng không đổi logic/UI.

---

## Main files and responsibilities

### App.tsx

Vai trò:

- App shell chính.
- Quản lý screen hiện tại.
- Load settings từ localStorage.
- Gọi `useAppData`.
- Gọi `useDomains`.
- Render tab theo screen.
- Quản lý modal state.
- Truyền handler xuống các tab.

Không nên nhồi thêm business logic mới vào `App.tsx`.

---

### Layout.tsx

Vai trò:

- Desktop sidebar.
- Mobile header.
- Bottom nav mobile.
- Settings nav item.
- Responsive hook `useIsDesktop`.

Navigation chính lấy từ `NAV_ITEMS`.

Hiện navigation đã gọn còn:

```text
overview
operations
learning
finance
teachers
```

`settings` nằm ngoài workflow chính.

---

### useAppData.ts

Đây là **data layer**.

Vai trò:

- Fetch dữ liệu từ Google Apps Script.
- Transform raw sheet data thành object frontend.
- Quản lý cache localStorage.
- Restore cache khi lỗi mạng.
- Auto reload khi online / visibility / interval.
- Trả về state, setters và refs cho domain layer.

Các transform chính:

```text
txStudents
txPayments
txExpenses
txLogs
txClasses
txTeachers
txMaterials
```

Các ref quan trọng:

```text
silentRef
lastLoadTimeRef
isSavingRef
```

Không refactor vùng này nếu task chỉ là UI, navigation hoặc cleanup nhẹ.

---

### useDomains.ts

Đây là **domain/business logic layer**.

Vai trò:

- Gọi API Google Apps Script.
- Save/update/delete học sinh.
- Save/update lớp.
- Save/update học phí.
- Save/update chi phí.
- Save/update nhật ký.
- Save/update giáo viên.
- Optimistic update frontend state.
- Quản lý saving state.
- Chống auto reload ghi đè state khi đang save.

Đây là file nghiệp vụ nhạy cảm. Không refactor mạnh nếu chưa có task riêng.

---

### helpers.ts

Vai trò:

- Default script URL.
- Default tuition.
- Default ca dạy.
- Default teacher list.
- Sanitize input.
- Validate phone/date.
- Format date.
- Parse date.
- Parse ca dạy.
- Resolve teacher aliases.
- Export CSV.
- Fetch timeout.

Quy tắc quan trọng:

- Luôn dùng `formatDate` và `parseDMY` cho ngày tháng.
- Không tự parse date thủ công nếu không cần.
- Tên giáo viên nên dùng logic resolve/normalize hiện có.

---

### rules.ts

Vai trò:

- Business constants.
- Threshold cảnh báo nợ.
- Threshold chuyên cần.
- Thứ tự học lực.
- Màu học lực.
- Phân trang.
- Giáo viên mặc định.
- Ca dạy mặc định.
- Network timeout/reload.

Magic number và business decision nên đưa về `rules.ts`, không hardcode trong UI component.

---

### types.ts

Các entity chính:

```text
Student
Payment
Expense
TeachingLog
AttendanceEntry
Teacher
LeaveRequest
Material
Lead
ClassRecord
SummaryData
```

Screen hiện tại:

```ts
export type Screen =
  | 'overview'
  | 'operations'
  | 'learning'
  | 'finance'
  | 'teachers'
  | 'settings';
```

Finance subtab hiện tại:

```ts
export type FinanceSub = 'ledger' | 'debt' | 'expense' | 'report';
```

---

## Current tabs

### OverviewTab

`OverviewTab` là dashboard hành động, không chỉ là KPI.

Hiện có:

- Lịch dạy hôm nay theo giáo viên.
- Cảnh báo học sinh vắng liên tiếp.
- Cảnh báo học sinh chưa đóng phí.
- Biểu đồ doanh thu 6 tháng.
- KPI có thể click để thao tác nhanh.

Định hướng:

- Tổng quan nên là bảng việc cần làm hôm nay.
- Ưu tiên hiển thị việc cần xử lý thay vì chỉ hiển thị số liệu đẹp.

---

### OperationsTab

`OperationsTab` là vùng vận hành dạy học.

Subtab hiện tại:

```text
Lịch dạy
Buổi học
Chuyên cần
```

Có `WeeklyCalendar` cho phép:

- Xem lịch tuần.
- Click buổi đã ghi để xem nhật ký.
- Click buổi chưa ghi để mở form ghi buổi.
- Phân biệt buổi đã ghi / chưa ghi / buổi tương lai.

Định hướng:

- Đây là trung tâm thao tác hằng ngày của giáo viên.
- “Ghi buổi học” nên gom cả điểm danh và nhật ký.

---

### LearningTab

`LearningTab` là wrapper mới gộp:

```text
ClassesTab
StudentsTab
```

Subtab:

```text
Lớp học
Học sinh
```

Mục tiêu:

- Quản lý lớp trước, học sinh sau.
- Xem lớp, sĩ số, giáo viên, lịch học.
- Xem học sinh, hồ sơ, trạng thái, chuyển lớp/nghỉ học.

`ClassesTab` và `StudentsTab` vẫn được giữ lại như component con, không xóa.

---

### FinanceTab

Subtab hiện tại:

```text
Tổng hợp
Công nợ
Phiếu thu
Phiếu chi
```

Định hướng:

- Báo cáo doanh thu nằm trong `FinanceTab`.
- Không dùng `ReportsTab` làm navigation chính.
- Công nợ phải tính đúng theo ngày bắt đầu/ngày nghỉ học.

Logic quan trọng:

- Không tính nợ trước `startDate`.
- Không tính nợ sau `endDate`.
- Không tính tháng tương lai là nợ.
- Zalo nhắc phí: copy nội dung trước, mở Zalo sau.
- Sổ thu và phiếu chi có phân trang.

---

### TeachersTab

`TeachersTab` đã nâng theo hướng vận hành giáo viên.

Hiện có:

- Hồ sơ giáo viên.
- Giáo viên xuất hiện trong dữ liệu nhưng chưa có hồ sơ.
- Lớp phụ trách.
- Học sinh active.
- Số buổi dạy tháng.
- Doanh thu lớp phụ trách.
- Chuyên cần.
- Buổi học gần nhất.

Cần chú ý:

- Matching giáo viên theo tên có thể gom nhầm nếu nhiều giáo viên cùng tên cuối.
- “Doanh thu lớp phụ trách” không phải “lương giáo viên”.
- Nếu sửa logic giáo viên, cần kiểm tra lại `resolveTeacher`.

---

## UI system

Dự án hiện có 3 tầng UI component.

### dsComponents.tsx

UI controls nền:

- Button
- IconButton
- Input
- Select
- SearchBar
- DataTable
- TableActions
- AttendancePicker
- FilterTabs
- Badge
- Pager

### AppComponents.tsx

Shared UI cũ đang dùng rộng:

- `fmtM`
- `TABLE_WRAP`
- `TH_SHARED`
- `TD_SHARED`
- `trStyle`
- `AppTable`
- `StatBlock`
- `StatGrid`
- `FAB`

### uiSystem.tsx

UI system mới hơn:

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

Quy tắc:

- Không tạo UI system thứ tư.
- Ưu tiên dùng lại component sẵn có.
- Nếu cần chuẩn hóa UI, lập plan trước.

---

## Data flow

```text
Google Sheets / GAS
→ useAppData fetch
→ transform raw data
→ React state
→ tabs render
→ user action
→ useDomains handler
→ optimistic update
→ GAS API save/update/delete
→ silent reload
→ cache update
```

---

## Important data rules

### Date handling

Ngày có thể ở nhiều dạng:

```text
DD/MM/YYYY
YYYY-MM-DD
ISO UTC string
HH:MM - DD/MM/YYYY
```

Luôn dùng:

```text
formatDate
parseDMY
```

Không tự xử lý date nếu không cần.

### Tuition/debt

Khi tính công nợ:

- Kiểm tra `startDate`.
- Kiểm tra `endDate`.
- Không tính tháng tương lai.
- Ưu tiên `thangHP` và `namHP` nếu payment có dữ liệu.

### Attendance

Attendance entry có thể có key cũ/mới:

```text
trangThai
Trạng thái
Mã HS
maHS
```

Không được giả định chỉ có một format.

### Teacher

Tên giáo viên có thể đến từ:

```text
students
classes
teaching logs
teachers sheet
settings teacher list
```

Nên dùng helper chuẩn hóa giáo viên.

---

## Known risks

### Large files

Các file đang lớn:

```text
FinanceTab.tsx
TeachersTab.tsx
OperationsTab.tsx
OverviewTab.tsx
useAppData.ts
useDomains.ts
```

Không tách vội nếu chưa có task riêng.

### Flat source structure

`src/` hiện còn phẳng. Nên chia folder trong phase sau.

Target structure:

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

### Bundle size

Build đang có warning chunk lớn hơn 500 kB.

Chưa cần xử lý ngay. Sau này có thể:

- dynamic import cho tab lớn
- split Finance/Teachers/Operations
- manualChunks trong Vite/Rollup

---

## Refactor roadmap

### Phase 1 — Stabilize current changes

- Lint pass.
- Build pass.
- Test tay navigation.
- Test tay LearningTab.
- Test tay FinanceTab.
- Test tay TeachersTab.

### Phase 2 — Commit local

Sau khi test tay ổn:

```bash
git add .
git commit -m "refactor navigation and consolidate core tabs"
```

Chưa push GitHub nếu chưa muốn.

### Phase 3 — Folder structure

Chỉ di chuyển file vào folder, không đổi logic/UI.

### Phase 4 — Split large tabs

Sau khi structure ổn:

Finance:

```text
FinanceTab.tsx
FinanceReportTab.tsx
FinanceDebtTab.tsx
FinanceLedgerTab.tsx
FinanceExpenseTab.tsx
```

Teachers:

```text
TeachersTab.tsx
TeacherModal.tsx
TeacherDetailDrawer.tsx
teacherMetrics.ts
```

Operations:

```text
OperationsTab.tsx
WeeklyCalendar.tsx
DiaryList.tsx
AttendanceStats.tsx
```

### Phase 5 — Improve operations workflow

Nâng “Ghi buổi học” thành workflow trung tâm:

- Chọn lớp.
- Chọn ngày.
- Chọn ca.
- Điểm danh.
- Nội dung bài dạy.
- Bài tập về nhà.
- Ghi chú.
- Lưu một lần.
