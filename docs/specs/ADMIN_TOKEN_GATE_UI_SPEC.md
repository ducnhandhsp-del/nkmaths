# Admin Token Gate UI Spec

## Goal

Lam man khoa admin cua `nkmaths.vercel.app` gon, dep, kin dao va tao cam giac tin cay truoc khi vao app quan tri.

## Scope

- Chi thay doi UI/UX man nhap admin token va cach luu token o frontend.
- Khong doi schema, Google Sheets headers, GAS action names hoac business logic.
- Khong hien Apps Script URL o man khoa admin hoac trong man Cai dat.
- Khong hien admin token trong man Cai dat.

## UX Rules

- Man khoa chi co mot input: `Admin token`.
- Input la `type=password`, tu dong focus khi render.
- Enter submit form.
- Nut submit disabled khi input rong.
- Khong co nut hien/an mat ma.
- Neu nguoi dung bam "Doi admin token" tu man loi tai du lieu, xoa token trong session va quay lai man khoa.

## Visual Direction

- Noi bo, nghiem tuc, it trang tri.
- Nen xam xanh rat nhat.
- Card trang, border mong, shadow nhe.
- Icon khoa nho mau xanh la, khong dung gradient tim/hero.
- Copy ngan:
  - Brand: `LOP TOAN NK`
  - Title: `Mo khoa quan tri`
  - Subtitle: `Nhap ma admin de tiep tuc.`
  - Footer: `Du lieu quan tri duoc bao ve`

## Security Behavior

- Token khong luu dai han trong `localStorage`.
- Token luu trong `sessionStorage` key `ltn-admin-token`.
- Neu trong `ltn-settings` con legacy field `adminToken`, xoa field nay khi nguoi dung dang nhap thanh cong hoac luu cai dat.
- `scriptUrl` van dung tu `ltn-settings` hoac `SCRIPT_URL_DEFAULT`, nhung khong hien o man khoa.
- GAS van kiem tra `adminToken` voi `Config.adminToken`, fallback hien tai la `314159`.

## QA Checklist

- Desktop: man khoa can giua, card khong qua rong, input/button ro rang.
- Mobile 390px: card khong tran ngang, button full width, text khong wrap xau.
- Nhap rong: khong submit.
- Nhap token: vao admin va goi `getData` co token.
- Bam "Doi admin token" khi load loi: quay ve man khoa va xoa session token.
- Reload cung tab: van giu session token.
- Dong browser/tab moi: phai nhap lai token.
- `npm.cmd run lint` pass.
- `npm.cmd run build` pass.
