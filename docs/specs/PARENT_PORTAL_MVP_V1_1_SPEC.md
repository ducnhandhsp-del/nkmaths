# MVP Portal v1.1 - Parent/Student Lookup

## Muc tieu

Portal public cho phu huynh/hoc sinh tra cuu tinh hinh hoc phi va diem danh cua
mot hoc sinh cu the, deploy tren domain/project rieng, khong lam lo app quan tri
hoac bundle quan tri.

Quyet dinh domain:

- `nkmaths.vercel.app` giu vai tro app quan tri.
- Portal tra cuu dung domain/project rieng.
- Root `/` cua portal domain hien portal tra cuu.
- Portal build khong import `App.tsx`, `useAppData`, `useDomains`, cac tab quan tri,
  modal quan tri, hay route/admin shell.
- App quan tri khong duoc coi la public surface cua domain portal.

## Pham vi v1.1

### Co trong v1.1

- Tach portal entry thanh portal-only bundle.
- Giu UI portal hien co:
  - form `Ma hoc sinh`
  - form `So dien thoai phu huynh`
  - hoc phi thang hien tai
  - phieu thu gan day
  - tong quan diem danh
  - 10 buoi hoc gan nhat
- Giu action GAS public `lookupStudentPortal`.
- Root domain portal rieng khong render admin app.
- Sua layout row de ngay, noi dung, badge khong chong chu tren desktop/mobile.

### Chua co trong v1.1

- Chon thang hoc phi.
- QR thanh toan.
- Diem so/bai kiem tra.
- Dang nhap tai khoan phu huynh.
- Chon domain portal chinh thuc.

Nhung muc nay thuoc v1.2+ hoac phase security rieng.

## Kien truc public portal

### Entry points

`portal.html`

- Entry portal production.
- Script: `/src/portalMain.tsx`.
- Chi render `ParentPortal`.

`index.html`

- Entry quan tri mac dinh cho `nkmaths.vercel.app`.
- Script: `/src/main.tsx`.

### Vercel routing

Portal project/domain rieng build bang `npm.cmd run build:portal`, sau do
`dist/portal.html` duoc promote thanh `dist/index.html`.

Dieu nay dam bao:

- `nkmaths.vercel.app` van la app quan tri.
- Portal domain rieng render portal, khong render admin app.

## GAS contract

Public action:

```json
{
  "action": "lookupStudentPortal",
  "studentId": "HS019",
  "parentPhone": "0353167135"
}
```

Response thanh cong:

```json
{
  "ok": true,
  "student": {
    "id": "HS019",
    "name": "Ten hoc sinh",
    "classId": "12B",
    "grade": "12",
    "school": "",
    "parentName": "",
    "status": "active",
    "startDate": "01/06/2026",
    "endDate": ""
  },
  "tuitionAmount": 600000,
  "payments": [],
  "attendance": [],
  "generatedAt": "12:00:00 - 09/07/2026"
}
```

Response that bai:

```json
{
  "ok": false,
  "error": "Khong tim thay thong tin phu hop."
}
```

Khong phan biet sai ma hoc sinh, sai so dien thoai, hoc sinh khong ton tai, hay
loi noi bo.

## Bao mat

### Bat buoc

- Portal public khong dung action `getData`.
- Portal public khong doc/ghi `ltn-cache`.
- Portal public khong import admin app/bundle.
- GAS `lookupStudentPortal` chi tra du lieu sau khi khop day du:
  - `MaHS`
  - `SDTPhuHuynh` da chuan hoa
- Khong tra dia chi, so dien thoai, ghi chu noi bo, danh sach lop, danh sach hoc
  sinh, hay du lieu hoc sinh khac.

### Can lam tiep sau v1.1

- Deploy portal sang domain/project rieng.
- Them `adminToken` hoac proxy server-side cho cac action admin:
  - `getData`
  - `save*`
  - `update*`
  - `delete*`
- Khong de cac action admin anonymous tren cung GAS endpoint neu Web App URL bi
  lo.

## Nghiep vu hoc phi

- `tuitionAmount` uu tien tu `LopHoc.HocPhiMacDinh`.
- Neu lop khong co hoc phi mac dinh, fallback `Config.baseTuition`.
- Frontend chi fallback `FEE_DEFAULT` khi response khong co `tuitionAmount`.
- Thang hien tai duoc tinh theo may nguoi dung.
- `startDate` va `endDate` van dung helper `isStudentBillableInMonth`.

Trang thai hien thi:

- Da ghi nhan du: `remaining <= 0`.
- Con can doi soat: `remaining > 0`.
- Chua thuoc ky tinh: hoc sinh chua bat dau hoc hoac da nghi truoc thang dang xem.

## Nghiep vu diem danh

- Chi dung 3 trang thai:
  - `Co mat`
  - `Vang`
  - `Co phep`
- Tinh ty le co mat = `Co mat / Tong so ban ghi diem danh`.
- Hien 10 buoi gan nhat.

## QA bat buoc

- Desktop 1365px:
  - `nkmaths.vercel.app` hien admin app.
  - Portal domain rieng `/` hien portal.
  - Portal domain rieng khong thay sidebar/admin shell.
  - Row phieu thu va diem danh khong chong chu.
- Mobile 390px:
  - form khong tran ngang.
  - row ngay/noi dung/badge khong chong chu.
- Build:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npm.cmd run build:portal`
- Kiem tra bundle:
  - admin build mac dinh tham chieu `/src/main.tsx`.
  - portal build rieng tham chieu `/src/portalMain.tsx`.

## Tieu chi hoan thanh

- `nkmaths.vercel.app` hien admin app.
- Portal domain rieng tra cuu duoc.
- Portal bundle khong import admin app.
- Admin action trong GAS duoc bao ve bang `adminToken` hoac proxy.
