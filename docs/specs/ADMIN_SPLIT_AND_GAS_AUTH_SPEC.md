# Admin Split And GAS Auth Spec

## Goal

Giu `nkmaths.vercel.app` la app quan tri, tach portal phu huynh/hoc sinh sang domain/project rieng, va khoa cac Google Apps Script action quan tri bang `adminToken`.

## Public Portal Boundary

- Portal project/domain rieng chi build portal bang `npm.cmd run build:portal`.
- Public portal chi duoc goi action `lookupStudentPortal`.
- Root portal `/` khong duoc load admin entry hoac admin bundle.

## Admin Boundary

- Admin domain chinh `nkmaths.vercel.app` build bang `npm.cmd run build`.
- Admin root dung `index.html` va `src/main.tsx`.
- `admin.html` duoc giu nhu entry phu/local fallback, khong phai build mac dinh.
- Admin app yeu cau nhap `adminToken` truoc khi goi `getData`; Apps Script URL khong hien tren man mo khoa.
- Token duoc luu localStorage trong `ltn-settings` cua trinh duyet admin; khong dua vao public portal config.

## GAS Auth Contract

- Public action:
  - `lookupStudentPortal`
- Admin actions bat buoc co `adminToken` khop voi `Config.adminToken`:
  - `getData`
  - `save*`
  - `update*`
  - `delete*`
  - `setupSheets`
- Neu `Config.adminToken` rong hoac thieu, GAS dung token mac dinh `314159`.
- Token mac dinh trong repo la `314159`; co the override bang `Config.adminToken`.

## Migration Before GAS Deploy

Token mac dinh hien tai la `314159`. Neu muon doi sang ma khac, mo Google Sheet va them/cap nhat row trong sheet `Config`:

```text
Key: adminToken
Value: <ma-admin-moi>
Group: security
Note: Token bat buoc cho cac action quan tri
```

Sau do vao admin domain, nhap cung token o man mo khoa hoac trong `Cai dat`.

## QA Checklist

- `nkmaths.vercel.app` hien app quan tri, khong hien portal tra cuu.
- Portal domain rieng hien tra cuu hoc phi/diem danh binh thuong.
- Portal domain rieng khong co admin UI, admin bundle, hay route quan tri.
- Admin khong co token: khong goi `getData`, hien man mo khoa.
- Admin token sai: GAS tra `ok:false`, app hien loi va co nut doi token.
- Admin token dung: tai du lieu, save/update/delete hoat dong.
- `lookupStudentPortal` khong can token va khong tra ve du lieu quan tri.
