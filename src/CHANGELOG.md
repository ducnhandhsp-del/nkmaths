# Lớp Toán NK — v29.0 Deployment Changelog

## Files thay đổi (10 files)

| File | Thay đổi |
|---|---|
| `useAppData.ts` | Transform functions module-level, silentRef exposed, cache bao gồm teachers+materials |
| `useDomains.ts` | curMo/curYr reactive, optimistic delete/save, pagination auto-reset, teacher filter fix |
| `App.tsx` | Bỏ dead props ClassesTab, prevStudentCount/prevTlogCount logic đúng |
| `StudentsTab.tsx` | Bỏ 5 dead props, hideInactive lifted lên useDomains, fix row key |
| `TeachersTab.tsx` | Bỏ 3 dead imports, bỏ DEMO_TEACHERS, fix useEffect deps stale closure |
| `MaterialsTab.tsx` | Bỏ 3 dead imports, grade filter nhất quán với header count, bỏ hardcode uploadedBy |
| `ClassesTab.tsx` | Bỏ 3 dead props (tlogs/paidNow/paidPct), fix bug teacher filter dùng resolveTeacher, memoize |
| `SettingsTab.tsx` | Fix TS error fee cast |
| `OperationsTab.tsx` | Fix TS error absClasses type |
| `types.ts` | Thêm Lead interface |

## Bug quan trọng đã fix

- **ClassesTab teacher filter** — trước đây chọn GV từ dropdown không lọc được vì so sánh raw string vs resolved name
- **MaterialsTab grade count** — header "Tất cả (X)" hiển thị sai khi chọn khối
- **isPaid pipeline** — buildPaidMap parse thangHP/namHP đúng
- **Sync race condition** — transform functions stable, loadData không re-create khi teacherList thay đổi
- **Optimistic delete** — student/payment/expense/teacher/material đều có optimistic update

## Không thay đổi

Tất cả file còn lại giữ nguyên: `FinanceTab.tsx`, `OverviewTab.tsx`, `ReportsTab.tsx`, `OperationsTab.tsx` (logic), `ModalStudent.tsx`, `ModalDiary.tsx`, `ModalFinance.tsx`, `ModalClass.tsx`, `Layout.tsx`, `helpers.ts`, `measures.ts`, `aggregations.ts`, `rules.ts`, `dsComponents.tsx`, `AppComponents.tsx`, `UIComponents.tsx`
