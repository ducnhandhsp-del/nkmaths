# MVP Portal v1.1 - Parent/Student Lookup

## Muc tieu

Portal public cho phu huynh/hoc sinh tra cuu tinh hinh hoc phi va diem danh cua
mot hoc sinh cu the, nhung khong lam lo app quan tri hoac bundle quan tri tren
domain public.

Domain public hien tai `nkmaths.vercel.app` phai uu tien an toan:

- `/` hien portal tra cuu.
- `/tra-cuu` hien portal tra cuu.
- Portal build khong import `App.tsx`, `useAppData`, `useDomains`, cac tab quan tri,
  modal quan tri, hay route/admin shell.
- App quan tri khong duoc coi la public surface cua domain portal.

## Pham vi v1.1

### Co trong v1.1

- Tach public entry thanh portal-only bundle.
- Giu UI portal hien co:
  - form `Ma hoc sinh`
  - form `So dien thoai phu huynh`
  - hoc phi thang hien tai
  - phieu thu gan day
  - tong quan diem danh
  - 10 buoi hoc gan nhat
- Giu action GAS public `lookupStudentPortal`.
- Root domain public khong render admin app.
- Sua layout row de ngay, noi dung, badge khong chong chu tren desktop/mobile.

### Chua co trong v1.1

- Chon thang hoc phi.
- QR thanh toan.
- Diem so/bai kiem tra.
- Dang nhap tai khoan phu huynh.
- Deploy admin protected domain rieng.

Nhung muc nay thuoc v1.2+ hoac phase security rieng.

## Kien truc public portal

### Entry points

`index.html`

- Entry public production.
- Script: `/src/portalMain.tsx`.
- Chi render `ParentPortal`.

`admin.html`

- Entry quan tri cho local/dev hoac deploy rieng sau nay.
- Script: `/src/main.tsx`.
- Khong duoc coi la public URL chinh.

### Vercel routing

`vercel.json` rewrite tat ca request ve `/`, vi `/` la portal-only entry.

Dieu nay dam bao:

- `https://nkmaths.vercel.app`
- `https://nkmaths.vercel.app/tra-cuu`
- URL sai bat ky

deu render portal, khong render admin app.

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

- Tach admin sang domain/project rieng.
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
  - `/` hien portal.
  - `/tra-cuu` hien portal.
  - Khong thay sidebar/admin shell.
  - Row phieu thu va diem danh khong chong chu.
- Mobile 390px:
  - form khong tran ngang.
  - row ngay/noi dung/badge khong chong chu.
- Build:
  - `npm.cmd run lint`
  - `npm.cmd run build`
- Kiem tra bundle:
  - production build public khong tao/chua admin entry trong `dist/index.html`.
  - `dist/index.html` tham chieu portal entry.

## Tieu chi hoan thanh

- `nkmaths.vercel.app` khong con hien admin app.
- `nkmaths.vercel.app/tra-cuu` van tra cuu duoc.
- Public bundle khong import admin app.
- Admin app van con trong source de deploy rieng sau nay.
