# TASKS.md

## Current milestone

Hoàn thiện mốc refactor navigation và gộp các tab chính của app quản lý Lớp Toán NK.

Mục tiêu của mốc này:

- Navigation gọn hơn.
- Giữ app ổn định.
- Lint/build pass.
- Chưa push GitHub.
- Chỉ commit local sau khi test tay ổn.

---

## Current stable checks

Đã chạy tại repo:

```text
C:\Users\Admin\QUAN_LY_TOAN_NK
```

Kết quả gần nhất:

```bash
npm run lint
npm run build
```

Trạng thái:

```text
lint: pass
build: pass
```

Ghi chú:

- Build có warning bundle lớn hơn 500 kB.
- Warning này chưa phải lỗi, xử lý sau ở phase performance/code-splitting.

---

## Done in current milestone

- [x] Gộp `ClassesTab` và `StudentsTab` thành `LearningTab`.
- [x] Bỏ `MaterialsTab` khỏi navigation chính.
- [x] Bỏ `ReportsTab` khỏi navigation chính.
- [x] Đưa báo cáo doanh thu vào `FinanceTab`.
- [x] Tách `Settings` khỏi nhóm nghiệp vụ chính.
- [x] Bottom nav mobile còn 5 vùng chính.
- [x] Cập nhật `Screen` type trong `types.ts`.
- [x] Cập nhật command palette trong `useCommands.ts`.
- [x] Nâng `TeachersTab` theo hướng vận hành giáo viên.
- [x] Nâng `FinanceTab` với các subtab: Tổng hợp, Công nợ, Phiếu thu, Phiếu chi.
- [x] Sửa lỗi tiếng Việt trong `LearningTab`.
- [x] `npm run lint` pass.
- [x] `npm run build` pass.

---

## Need manual test before commit

### General

- [ ] Chạy app bằng:

```bash
npm run dev
```

- [ ] Mở app trên desktop.
- [ ] Mở app trên mobile/responsive mode.
- [ ] Kiểm tra không có lỗi console nghiêm trọng.
- [ ] Kiểm tra không có màn hình trắng.
- [ ] Kiểm tra reload app vẫn giữ cấu hình cần thiết.

---

### Navigation

- [ ] Sidebar desktop hiển thị đúng 5 vùng chính:
  - Tổng quan
  - Vận hành
  - Lớp & Học sinh
  - Tài chính
  - Giáo viên

- [ ] Cài đặt nằm riêng ở cuối sidebar/menu.
- [ ] Mobile bottom nav hiển thị đúng:
  - Tổng quan
  - Vận hành
  - Lớp/HS
  - Tài chính
  - GV

- [ ] Không còn Học liệu trong navigation chính.
- [ ] Không còn Báo cáo trong navigation chính.
- [ ] Không còn Lớp học/Học sinh là 2 tab riêng trong navigation chính.

---

### OverviewTab

- [ ] Mở tab Tổng quan.
- [ ] KPI hiển thị đúng.
- [ ] Lịch dạy hôm nay hiển thị đúng theo giáo viên.
- [ ] Cảnh báo học sinh vắng liên tiếp hiển thị nếu có dữ liệu.
- [ ] Cảnh báo học sinh chưa đóng phí hiển thị nếu có dữ liệu.
- [ ] Click cảnh báo công nợ chuyển đúng sang Tài chính.
- [ ] Click cảnh báo vắng chuyển đúng sang Vận hành.
- [ ] Biểu đồ doanh thu không lỗi.

---

### OperationsTab

- [ ] Mở tab Vận hành.
- [ ] Subtab Lịch dạy hiển thị lịch tuần.
- [ ] Click buổi đã ghi mở xem nhật ký.
- [ ] Click buổi chưa ghi mở form ghi buổi.
- [ ] Buổi tương lai không bị ghi nhầm.
- [ ] Subtab Buổi học hiển thị danh sách nhật ký.
- [ ] Tìm kiếm/lọc nhật ký hoạt động.
- [ ] Subtab Chuyên cần hiển thị thống kê vắng/muộn.
- [ ] Sửa nhật ký buổi học hoạt động.

---

### LearningTab

- [ ] Mở tab Lớp & Học sinh.
- [ ] Mặc định vào subtab Lớp học.
- [ ] Chuyển được sang subtab Học sinh.
- [ ] Nút Thêm lớp mở đúng modal lớp.
- [ ] Nút Thêm học sinh mở đúng modal học sinh.
- [ ] Tìm kiếm/lọc lớp vẫn hoạt động.
- [ ] Tìm kiếm/lọc học sinh vẫn hoạt động.
- [ ] Xem hồ sơ học sinh hoạt động.
- [ ] Sửa học sinh hoạt động.
- [ ] Chuyển lớp hàng loạt nếu có chức năng vẫn hoạt động.

---

### FinanceTab

- [ ] Mở tab Tài chính.
- [ ] Mặc định vào subtab Tổng hợp.
- [ ] Tổng hợp hiển thị tổng thu, tổng chi, lợi nhuận, công nợ.
- [ ] Chuyển sang Công nợ.
- [ ] Công nợ hiển thị đúng học sinh chưa đóng.
- [ ] Công nợ không tính tháng tương lai là nợ.
- [ ] Công nợ không tính trước `startDate`.
- [ ] Công nợ không tính sau `endDate`.
- [ ] Chuyển sang Phiếu thu.
- [ ] Phiếu thu có phân trang.
- [ ] Xem phiếu thu hoạt động.
- [ ] Sửa phiếu thu hoạt động.
- [ ] Xóa phiếu thu hỏi/xử lý đúng.
- [ ] Chuyển sang Phiếu chi.
- [ ] Phiếu chi có phân trang.
- [ ] Xem phiếu chi hoạt động.
- [ ] Sửa phiếu chi hoạt động.
- [ ] Xóa phiếu chi hỏi/xử lý đúng.
- [ ] Nút copy tin nhắn nhắc phí hoạt động.
- [ ] Nút mở Zalo mở đúng số phụ huynh nếu có.

---

### TeachersTab

- [ ] Mở tab Giáo viên.
- [ ] Danh sách giáo viên hiển thị đúng.
- [ ] Giáo viên có trong lớp/buổi học nhưng chưa có hồ sơ vẫn hiển thị.
- [ ] Không bị gom nhầm giáo viên nếu có tên gần giống nhau.
- [ ] Xem chi tiết giáo viên mở drawer/panel đúng.
- [ ] Chi tiết giáo viên hiển thị lớp phụ trách.
- [ ] Chi tiết giáo viên hiển thị buổi học gần nhất.
- [ ] Chi tiết giáo viên hiển thị doanh thu lớp phụ trách.
- [ ] Nút Ghi buổi từ lớp phụ trách mở đúng form ghi buổi.
- [ ] Sửa hồ sơ giáo viên mở đúng modal.
- [ ] Lưu giáo viên không lỗi.
- [ ] Label doanh thu không gây hiểu nhầm là lương giáo viên.

---

## Fix before local commit

- [ ] Kiểm tra `TeachersTab.tsx` đã đổi label:
  - “Doanh thu theo GV” → “Doanh thu lớp phụ trách”
  - “Học phí” → “Học phí lớp”

- [ ] Kiểm tra text tiếng Việt không bị lỗi encoding.
- [ ] Kiểm tra `FinanceSub` không còn nơi nào dùng `'tuition'`.
- [ ] Kiểm tra `MaterialsTab` và `ReportsTab` không còn import trong `App.tsx`.
- [ ] Kiểm tra `LearningTab.tsx` đã được Git theo dõi.
- [ ] Kiểm tra `uiSystem.tsx` đã được Git theo dõi.
- [ ] Kiểm tra không có file rác tên `git`.

---

## Commands before commit

Chạy theo thứ tự:

```bash
git status
git diff --stat
npm run lint
npm run build
```

Nếu tất cả ổn, commit local:

```bash
git add .
git commit -m "refactor navigation and consolidate core tabs"
```

Chưa push GitHub nếu chưa muốn.

---

## Next phase: folder structure

Sau khi commit local, task kế tiếp nên là **chia folder structure**, không đổi UI/logic.

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

### Folder mapping proposal

```text
src/app/
  App.tsx
  main.tsx

src/layout/
  Layout.tsx
  LoadingScreen.tsx
  CommandPalette.tsx

src/tabs/
  OverviewTab.tsx
  OperationsTab.tsx
  LearningTab.tsx
  FinanceTab.tsx
  TeachersTab.tsx
  SettingsTab.tsx
  ClassesTab.tsx
  StudentsTab.tsx

src/modals/
  ModalStudent.tsx
  ModalClass.tsx
  ModalFinance.tsx
  ModalDiary.tsx

src/components/
  AppComponents.tsx
  UIComponents.tsx
  dsComponents.tsx

src/hooks/
  useAppData.ts
  useDomains.ts
  useCommands.ts

src/lib/
  helpers.ts
  rules.ts
  measures.ts
  aggregations.ts
  fontCheck.ts
  ds.ts

src/types/
  types.ts

src/styles/
  index.css
  uiSystem.tsx
```

### Folder structure task rules

- [ ] Chỉ tạo folder.
- [ ] Chỉ di chuyển file.
- [ ] Chỉ sửa import path.
- [ ] Không sửa logic bên trong file.
- [ ] Không đổi UI.
- [ ] Không rename component/function.
- [ ] Chạy `npm run lint`.
- [ ] Chạy `npm run build`.

---

## Later phase: split large files

Chỉ làm sau khi folder structure đã ổn.

### Finance

- [ ] Tách `FinanceReportTab`.
- [ ] Tách `FinanceDebtTab`.
- [ ] Tách `FinanceLedgerTab`.
- [ ] Tách `FinanceExpenseTab`.
- [ ] Tách helper tài chính nếu cần.
- [ ] Giữ nguyên logic công nợ startDate/endDate.
- [ ] Giữ nguyên logic tháng học phí `thangHP` / `namHP`.

### Teachers

- [ ] Tách `TeacherModal`.
- [ ] Tách `TeacherDetailDrawer`.
- [ ] Tách `teacherMetrics.ts`.
- [ ] Chuẩn hóa matching giáo viên.
- [ ] Phân biệt rõ doanh thu lớp phụ trách và lương giáo viên.

### Operations

- [ ] Tách `WeeklyCalendar`.
- [ ] Tách danh sách buổi học.
- [ ] Tách thống kê chuyên cần.
- [ ] Tối ưu workflow “Ghi buổi học”.

### Overview

- [ ] Tách TodaySchedule.
- [ ] Tách SmartAlerts.
- [ ] Tách RevenueChart.
- [ ] Biến Tổng quan thành bảng việc cần làm hôm nay.

---

## Later business upgrades

Chưa làm trong mốc hiện tại.

- [ ] Học phí theo khối/lớp.
- [ ] Học bù.
- [ ] Xin nghỉ.
- [ ] Lương giáo viên theo buổi.
- [ ] Báo cáo phụ huynh theo tháng.
- [ ] Theo dõi học lực/chuyên đề yếu.
- [ ] Báo cáo chuyên cần theo tháng.
- [ ] Dashboard việc cần xử lý hôm nay.
- [ ] Tách app học liệu/học tập riêng nếu cần.

---

## Codex prompt for next safe task

Dùng prompt này sau khi đã commit mốc hiện tại:

```text
Đọc AGENTS.md, PROJECT_CONTEXT.md và TASKS.md.

Nhiệm vụ duy nhất: lập kế hoạch chia folder structure cho src/.
Chưa sửa code.

Yêu cầu:
1. Phân loại file hiện tại theo nhóm app/layout/tabs/modals/components/hooks/lib/types/styles.
2. Đề xuất thứ tự di chuyển file an toàn.
3. Chỉ ra import path nào có rủi ro.
4. Không đổi UI.
5. Không đổi logic.
6. Không rename component/function.
7. Chưa chỉnh sửa file nào.
```

Sau khi Codex lập plan, mới yêu cầu:

```text
Thực hiện bước 1: tạo folder và di chuyển nhóm tabs.
Chỉ cập nhật import path.
Không đổi logic/UI.
Chạy npm run lint và npm run build.
```
