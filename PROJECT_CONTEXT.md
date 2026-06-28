# PROJECT_CONTEXT.md

## Overview

Day la app quan ly noi bo cho **LOP TOAN NK**. App tap trung vao van hanh lop hoc hang ngay, quan ly hoc sinh/lop/giao vien, ghi buoi hoc, diem danh, hoc phi, thu chi va bao cao nhanh.

App nay la app quan ly van hanh, khong phai LMS/hoc lieu. Hoc lieu khong nam trong navigation hien tai.

## Product Direction

Quy trinh san pham nen xoay quanh viec dieu hanh lop hoc thuc te:

```text
Tong quan
-> Dao tao
-> Van hanh
-> Tai chinh
-> Bao cao
-> He thong
```

Nguyen tac nghiep vu chinh:

- Don vi thao tac trung tam la **buoi hoc**.
- Diem danh va nhat ky buoi hoc duoc gom trong thao tac **Ghi buoi hoc**.
- Tai chinh uu tien xu ly hoc phi/cong no theo ky hien tai, sau do moi xem lich su thu/chi.
- Bao cao chi dung de xem/in/xuat, khong chua thao tac nghiep vu chinh.

## Current Technical Status

Repo hien tai:

```text
C:\Users\Admin\QUAN_LY_TOAN_NK
```

Trang thai gan nhat:

```text
npm.cmd run lint: pass
npm.cmd run build: pass
```

Build co the co warning bundle size lon hon 500 kB. Do la rui ro toi uu hieu nang, khong phai loi release.

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

## Current IA

### Desktop Sidebar

Desktop dung sidebar phang co nhom:

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

### Mobile Navigation

Mobile bottom nav:

```text
Tong quan | Dao tao | Van hanh | Tai chinh | Bao cao
```

`Cai dat` thuoc nhom He thong, khong phai workflow chinh tren bottom nav.

### Navigation Types

Theo `src/types.ts`:

```ts
export type Screen =
  | 'overview'
  | 'operations'
  | 'training'
  | 'finance'
  | 'reports'
  | 'settings';

export type TrainingSub = 'students' | 'classes' | 'teachers';
export type OperationsSub = 'schedule' | 'lessons' | 'attendance';
export type FinanceSub = 'ledger' | 'debt' | 'expense';
export type ReportsSub = 'training' | 'operations' | 'finance';
```

Sub keys co the van duoc giu de handler cu khong vo, nhung UI chinh khong nen render them tang tab lap khi sidebar da chon dung man.

## Source Map

```text
src/
  App.tsx
  Layout.tsx
  OverviewTab.tsx
  LearningTab.tsx
  StudentsTab.tsx
  ClassesTab.tsx
  TeachersTab.tsx
  OperationsTab.tsx
  FinanceTab.tsx
  ReportsTab.tsx
  SettingsTab.tsx
  ModalStudent.tsx
  ModalClass.tsx
  ModalTeacher.tsx
  ModalFinance.tsx
  ModalDiary.tsx
  useAppData.ts
  useDomains.ts
  useCommands.ts
  helpers.ts
  rules.ts
  types.ts
  dsComponents.tsx
  AppComponents.tsx
  uiSystem.tsx
```

## Main Responsibilities

### App.tsx

- Quan ly `screen` va cac sub state noi bo.
- Goi `useAppData` va `useDomains`.
- Quan ly modal state.
- Render tab theo screen.
- Truyen handler xuong cac tab.

Khong nen nhoi them business logic moi vao `App.tsx`.

### Layout.tsx

- Desktop sidebar grouped flat navigation.
- Sidebar collapse/expand.
- Mobile header.
- Mobile bottom nav.
- Dieu huong item sidebar sang `screen` va sub key tuong ung.

### useAppData.ts

- Fetch du lieu tu Google Apps Script.
- Transform raw sheet data.
- Cache localStorage.
- Restore cache khi loi mang.
- Auto reload khi online/visibility/interval.

Day la data layer nhay cam. Khong sua neu task chi la UI/navigation.

### useDomains.ts

- Save/update/delete hoc sinh, lop, giao vien, hoc phi, chi phi, buoi hoc.
- Goi Google Apps Script.
- Optimistic update.
- Chan reload ghi de khi dang save.

Day la domain/business layer nhay cam. Khong refactor manh neu chua co task rieng.

### helpers.ts

- Date helpers.
- Sanitize input.
- Validate phone/date.
- Resolve teacher aliases.
- Export CSV.
- Fetch timeout.

Luon uu tien `formatDate`, `parseDMY`, va helper resolve teacher co san.

### uiSystem.tsx

UI system chinh hien tai:

- `PageToolbar`
- `DataTable`
- `EmptyState`
- `StatusBadge`
- `MoneyText`
- `DateText`
- `MonthText`
- `MobileCard`
- `ConfirmDialog/useConfirm`
- `notify`

`dsComponents.tsx` va `AppComponents.tsx` van ton tai nhu bridge/legacy. Khong xoa neu chua kiem tra import va rui ro.

## Current Screens

### Tong quan

Vai tro: dashboard dieu hanh hang ngay, khong phai bao cao dai.

Nen uu tien:

- KPI nhanh.
- Viec can xu ly.
- Lich day hom nay.
- Thao tac nhanh.
- Canh bao no phi/vang nhieu/chua ghi buoi neu du lieu co.

### Dao tao

`LearningTab` gom:

- `StudentsTab`
- `ClassesTab`
- `TeachersTab`

Day la vung quan ly du lieu goc. Khong tinh lai logic tai chinh/chuyen can tai day neu khong can.

### Van hanh

`OperationsTab` hien la man gop **Lich day & Van hanh**.

No nen bao gom:

- Lich day tuan/hom nay.
- Ghi buoi hoc.
- Buoi hoc gan day.
- Canh bao chuyen can.

Giu dung 3 trang thai diem danh:

```text
Co mat
Vang
Co phep
```

### Tai chinh

`FinanceTab` hien la man gop **Hoc phi & Thu chi**.

No nen bao gom:

- KPI tai chinh thang.
- Cong no can xu ly.
- Phieu thu gan day.
- Phieu chi gan day.
- Them phieu thu.
- Them phieu chi.

Logic cong no phai giu nguyen theo billable, `startDate`, `endDate`, `status`, `thangHP`, `namHP`.

### Bao cao

`ReportsTab` hien la mot man **Bao cao & Thong ke**.

Vai tro:

- Xem thong ke.
- Loc theo thang/nam neu co.
- In/xuat neu handler co san.
- Khong chua thao tac nghiep vu chinh nhu them hoc sinh, thu phi, ghi buoi.

### He thong

`SettingsTab` gom cac nhom:

- Trung tam
- Tai chinh
- Van hanh
- Thong bao
- He thong

Khong dua lai muc `Giao dien` neu chua co gia tri thuc te.

## Data Rules

### Dates

Du lieu ngay co the den tu GAS/Sheets o nhieu format:

- `DD/MM/YYYY`
- `YYYY-MM-DD`
- ISO UTC string
- timestamp dang chuoi

Dung helper co san. Khong tu parse neu khong can.

### Tuition/Debt

Khi xu ly cong no:

- Khong tinh no truoc `startDate`.
- Khong tinh no sau `endDate`.
- Khong tinh thang tuong lai la no.
- Ton trong `thangHP` va `namHP` neu payment co du lieu.
- Chi tinh hoc sinh billable.

### Teachers

Lien ket giao vien:

- Uu tien `MaGV`.
- Fallback `GiaoVien`/ten de tuong thich du lieu cu.

### Phones

So dien thoai luu string, khong ep number.

### Payments

Hinh thuc thanh toan hien thi chuan:

```text
Chuyen khoan
Tien mat
```

Khong hien `bank/cash` cho nguoi dung.

## Known Risks

- `FinanceTab.tsx`, `OperationsTab.tsx`, `TeachersTab.tsx`, `OverviewTab.tsx`, `useAppData.ts`, `useDomains.ts` van lon.
- `dsComponents.tsx`, `AppComponents.tsx`, `uiSystem.tsx` con song song. Chi don legacy khi chac chan an toan.
- Build warning chunk size lon hon 500 kB can toi uu sau, khong phai bug nghiep vu.
- Cac key subtab cu van duoc giu noi bo. Dung xoa neu chua kiem tra handler/navigation.

## Next Recommended Work

1. Chay QA release checklist voi du lieu Google Sheet that.
2. Chi sua bug that phat hien trong QA.
3. Sau khi on dinh, moi tach folder/module theo nhom nho.
4. Sau do moi tinh toi uu performance/bundle splitting.
