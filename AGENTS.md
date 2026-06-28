# AGENTS.md

## Project Status

Du an dang chay on dinh. Uu tien cao nhat la giu app dung logic nghiep vu, khong refactor qua tay va khong doi schema neu task khong yeu cau ro.

Sau moi thay doi quan trong phai chay:

```bash
npm.cmd run lint
npm.cmd run build
```

Trong do `npm.cmd run lint` la TypeScript check (`tsc --noEmit`). Neu lint hoac build loi, phai sua truoc khi tiep tuc task moi.

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

## Current IA And Navigation

Desktop dung sidebar phang co nhom. Item nghiep vu con duoc bam truc tiep tu sidebar; content khong render them subtab lap lai neu sidebar da chon dung man.

```text
TONG QUAN
- Tong quan

DAO TAO
- Hoc sinh
- Lop hoc
- Giao vien

VAN HANH
- Lich day & Van hanh

TAI CHINH
- Hoc phi & Thu chi

BAO CAO
- Bao cao & Thong ke

HE THONG
- Cai dat
```

Mobile bottom nav hien co 5 vung chinh:

```text
Tong quan | Dao tao | Van hanh | Tai chinh | Bao cao
```

`Cai dat` nam trong nhom `He thong`, khong phai item chinh cua bottom nav.

Khong dua lai cac muc demo/cu vao navigation chinh:

- Hoc lieu
- Dashboard demo
- Bao cao tach 3 item rieng
- Hoc sinh rieng ngoai nhom Dao tao
- Lop hoc rieng ngoai nhom Dao tao
- Diem danh/Hoc phi kieu tab cap chinh cu

## Current Product Decisions

- `LearningTab` la wrapper cho `StudentsTab`, `ClassesTab`, `TeachersTab`.
- `OperationsTab` la mot man gop: `Lich day & Van hanh`.
- `FinanceTab` la mot man gop: `Hoc phi & Thu chi`.
- `ReportsTab` la mot man gop: `Bao cao & Thong ke`.
- Cac key noi bo van duoc giu de tranh doi rong:
  - `TrainingSub = students | classes | teachers`
  - `OperationsSub = schedule | lessons | attendance`
  - `FinanceSub = ledger | debt | expense`
  - `ReportsSub = training | operations | finance`
- Hoc lieu khong thuoc app quan ly hien tai. Neu can, sau nay tach thanh app hoc tap rieng.
- Diem danh va nhat ky duoc hieu la mot thao tac chung: `Ghi buoi hoc`.

## Architecture Map

- `App.tsx`: app shell, routing state, settings, modal state, goi hooks, render tabs.
- `Layout.tsx`: desktop sidebar, mobile header, bottom nav, settings nav item.
- `useAppData.ts`: fetch data, transform data, cache localStorage, auto reload.
- `useDomains.ts`: save/update/delete, optimistic update, goi Google Apps Script.
- `helpers.ts`: date helpers, sanitize, teacher resolving, fetch timeout, export utilities.
- `rules.ts`: business constants, thresholds, pagination, network timing.
- `types.ts`: shared domain types and navigation types.
- `dsComponents.tsx`: UI controls nen nhu Button, Input, Select, SearchBar, TableActions, Pager.
- `AppComponents.tsx`: shared UI cu/bridge nhu StatBlock, StatGrid, TABLE_WRAP, FAB.
- `uiSystem.tsx`: UI system chinh moi hon nhu PageToolbar, DataTable, EmptyState, StatusBadge, MoneyText, DateText, MonthText, MobileCard.

## Safety Rules

- Khong tu y them thu vien moi.
- Khong tu y rename component, function hoac file neu khong can.
- Khong doi UI khi task chi la sua logic.
- Khong doi business logic khi task chi la UI hoac navigation.
- Khong xoa file cu neu chua kiem tra import.
- Khong sua Google Apps Script contract neu chua kiem tra frontend/backend.
- Khong doi field du lieu neu chua cap nhat day du o `types.ts`, `useAppData.ts`, `useDomains.ts`, Google Apps Script va Google Sheets headers.
- Khong refactor `useAppData.ts` hoac `useDomains.ts` neu task khong lien quan truc tiep den data flow.

## Refactor Rules

Moi task chi xu ly mot nhom viec:

- Navigation
- Folder structure
- UI cleanup
- Data logic
- Finance
- Teachers
- Operations
- Learning
- Reports
- Performance

Khong gop nhieu muc tieu lon trong cung mot task, vi du vua refactor structure, vua redesign UI, vua sua nghiep vu.

Neu task lon, phai lap plan ngan truoc khi code.

## Data Rules

### Date Handling

Du lieu ngay co the den tu Google Sheets / GAS o nhieu dang:

- `DD/MM/YYYY`
- `YYYY-MM-DD`
- ISO UTC string
- timestamp dang chuoi

Luon dung helper co san:

- `formatDate`
- `parseDMY`

Khong tu parse date thu cong neu khong can.

### Tuition And Debt Logic

Khi xu ly hoc phi/cong no:

- Khong tinh no truoc `startDate`.
- Khong tinh no sau `endDate`.
- Khong tinh thang tuong lai la no.
- Phai ton trong `thangHP` va `namHP` neu payment co du lieu thang hoc phi.
- Chi tinh hoc sinh billable theo logic hien co.

### Attendance Logic

Chi dung 3 trang thai chuyen can:

```text
Co mat
Vang
Co phep
```

Khong them trang thai moi neu chua co yeu cau nghiep vu ro.

### Teacher Logic

Giao vien uu tien lien ket bang `MaGV`, fallback theo `GiaoVien`/ten giao vien de tuong thich du lieu cu. Uu tien helper resolve/normalize hien co thay vi so sanh string tho.

### Phone Logic

So dien thoai phai giu dang string de khong mat so `0` dau. Khong ep sang number.

### Save And Reload Logic

`useAppData.ts` va `useDomains.ts` co co che:

- optimistic update
- silent reload
- auto reload
- chan reload khi dang save

Khong refactor vung nay neu task khong lien quan truc tiep den data flow.

## UI Rules

- Uu tien UI ro, nhanh, de thao tac hang ngay.
- Khong tao UI system moi neu `dsComponents.tsx`, `AppComponents.tsx`, hoac `uiSystem.tsx` da co component phu hop.
- App noi bo uu tien it click, ro nghiep vu, de kiem tra du lieu.
- Desktop dung sidebar grouped flat navigation.
- Mobile bottom nav chi chua 5 vung chinh.
- Tranh hieu ung phuc tap neu khong tang gia tri su dung.

## Lop Toan NK UI Rules

- UI task phai giu nguyen data, filter, action, modal behavior va row/card click behavior neu user khong yeu cau doi.
- Khong doi GAS/API fields, Google Sheets headers, schema hoac business logic trong task chi lien quan UI.
- Uu tien dung lai `uiSystem.tsx`, `dsComponents.tsx`, `AppComponents.tsx` va pattern hien co.
- Desktop cua man data-heavy phai lay DataTable lam trong tam. KPI/card chi la thong tin phu, compact.
- Mobile dung card sach, de doc, giu du action va click behavior tuong ung voi row desktop.
- Filter phai ro, compact, nam gan data, khong tao filter panel cong kenh neu khong can.
- Tranh AI slop: khong gradient trang tri, khong hero section, khong oversized cards, khong icon ngau nhien, khong visual noise.
- Thiet ke app noi bo theo huong scan nhanh, it click, on dinh, de kiem tra du lieu.
- Rieng man Hoc sinh: desktop uu tien bang hoc sinh; mobile uu tien student cards; khong doi student schema, API, modal data shape.

## Known Large Files

Cac file dang lon, chua nen refactor manh neu chua co task rieng:

- `FinanceTab.tsx`
- `TeachersTab.tsx`
- `OperationsTab.tsx`
- `OverviewTab.tsx`
- `useAppData.ts`
- `useDomains.ts`

Sau khi on dinh, co the tach dan theo module nho.

## Preferred Workflow

1. Read `AGENTS.md`.
2. Read `PROJECT_CONTEXT.md` if available.
3. Understand the specific task.
4. Create a short plan before coding.
5. Modify only the required files.
6. Run:

```bash
npm.cmd run lint
npm.cmd run build
```

7. Report:
   - files changed
   - reason for each change
   - test/build result
   - any risk or follow-up
