# AGENTS.md

## Project status

Dự án đang chạy được và đã qua kiểm tra:

```bash
npm run lint
npm run build
```

Ưu tiên cao nhất là giữ app ổn định, không refactor quá tay.

## Stack

- React 19
- Vite
- TypeScript
- TailwindCSS
- Express
- better-sqlite3
- Google Apps Script / Google Sheets data source
- LocalStorage cache

## Required commands

Sau mỗi thay đổi quan trọng phải chạy:

```bash
npm run lint
npm run build
```

Trong đó:

```bash
npm run lint
```

thực chất là:

```bash
tsc --noEmit
```

Nếu lint hoặc build lỗi, phải sửa lỗi trước khi tiếp tục task mới.

## Main navigation

Navigation chính hiện tại chỉ gồm 5 vùng nghiệp vụ:

1. Tổng quan
2. Vận hành
3. Lớp & Học sinh
4. Tài chính
5. Giáo viên

Cài đặt là mục phụ ở cuối sidebar/menu.

Không đưa lại các mục sau vào navigation chính:

- Học liệu
- Báo cáo
- Học sinh riêng
- Lớp học riêng

## Current product decisions

- `LearningTab` gộp `ClassesTab` và `StudentsTab`.
- `FinanceTab` chứa Tổng hợp, Công nợ, Phiếu thu, Phiếu chi.
- Báo cáo doanh thu nằm trong `FinanceTab`, không còn là tab riêng.
- `TeachersTab` là tab vận hành giáo viên, không chỉ là danh bạ.
- Học liệu không thuộc app quản lý hiện tại. Nếu cần, sau này tách thành app học tập riêng.
- Điểm danh và nhật ký nên được hiểu là một thao tác chung: Ghi buổi học.

## Architecture map

- `App.tsx`: app shell, routing, settings, modal state, gọi hooks, render tabs.
- `Layout.tsx`: sidebar, mobile header, bottom nav, settings nav item.
- `useAppData.ts`: fetch data, transform data, cache localStorage, auto reload.
- `useDomains.ts`: save/update/delete, optimistic update, gọi Google Apps Script.
- `helpers.ts`: date helpers, sanitize, teacher resolving, fetch timeout, export utilities.
- `rules.ts`: business constants, thresholds, pagination, network timing.
- `types.ts`: shared domain types.
- `dsComponents.tsx`: UI controls nền như Button, Input, Select, SearchBar, TableActions, Pager.
- `AppComponents.tsx`: shared UI cũ như StatBlock, StatGrid, TABLE_WRAP, FAB.
- `uiSystem.tsx`: UI system mới hơn như PageScaffold, ContextBar, ActionableKpi, DataTable, StatusBadge.

## Safety rules

- Không tự ý thêm thư viện mới.
- Không tự ý rename component, function hoặc file nếu không cần.
- Không đổi UI khi task chỉ là sửa logic.
- Không đổi business logic khi task chỉ là UI hoặc navigation.
- Không xóa file cũ nếu chưa kiểm tra import.
- Không sửa Google Apps Script contract nếu chưa kiểm tra frontend/backend.
- Không đổi field dữ liệu nếu chưa cập nhật đầy đủ ở:
  - `types.ts`
  - `useAppData.ts`
  - `useDomains.ts`
  - Google Apps Script
  - Google Sheets headers

## Refactor rules

Mỗi task chỉ xử lý một nhóm việc:

- Navigation
- Folder structure
- UI cleanup
- Data logic
- Finance
- Teachers
- Operations
- Learning
- Performance

Không gộp nhiều mục tiêu trong cùng một task, ví dụ:

- refactor structure
- redesign UI
- sửa nghiệp vụ
- tối ưu performance

Nếu task lớn, phải lập plan trước khi code.

## Data rules

### Date handling

Dữ liệu ngày có thể đến từ Google Sheets / GAS ở nhiều dạng:

- `DD/MM/YYYY`
- `YYYY-MM-DD`
- ISO UTC string
- timestamp dạng chuỗi

Luôn dùng helper có sẵn:

- `formatDate`
- `parseDMY`

Không tự parse date thủ công nếu không cần.

### Tuition/debt logic

Khi xử lý công nợ:

- Không tính nợ trước `startDate`.
- Không tính nợ sau `endDate`.
- Không tính tháng tương lai là nợ.
- Phải tôn trọng `thangHP` và `namHP` nếu payment có dữ liệu tháng học phí.

### Teacher logic

Tên giáo viên có thể có alias hoặc nhập không đồng nhất.

Ưu tiên dùng logic chuẩn hóa/resolve teacher hiện có thay vì so sánh string thô.

### Save/reload logic

`useAppData.ts` và `useDomains.ts` có cơ chế:

- optimistic update
- silent reload
- auto reload
- chặn reload khi đang save

Không refactor vùng này nếu task không liên quan trực tiếp đến data flow.

## UI rules

- Ưu tiên UI rõ, nhanh, dễ thao tác hằng ngày.
- Không tạo thêm UI system mới nếu `dsComponents.tsx`, `AppComponents.tsx`, hoặc `uiSystem.tsx` đã có component phù hợp.
- Mobile bottom nav chỉ chứa 5 vùng chính.
- App nội bộ ưu tiên ít click, rõ nghiệp vụ, dễ kiểm tra dữ liệu.
- Tránh hiệu ứng phức tạp nếu không tăng giá trị sử dụng.

## Known large files

Các file đang lớn, chưa nên refactor mạnh nếu chưa có task riêng:

- `FinanceTab.tsx`
- `TeachersTab.tsx`
- `OperationsTab.tsx`
- `OverviewTab.tsx`
- `useAppData.ts`
- `useDomains.ts`

Sau khi ổn định, có thể tách dần theo module nhỏ.

## Preferred workflow

1. Read `AGENTS.md`.
2. Read `PROJECT_CONTEXT.md` if available.
3. Understand the specific task.
4. Create a short plan before coding.
5. Modify only the required files.
6. Run:

```bash
npm run lint
npm run build
```

7. Report:
   - files changed
   - reason for each change
   - test/build result
   - any risk or follow-up
