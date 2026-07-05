# Foreground Initial Load Spec

## Muc tieu

Uu tien an toan nghiep vu khi khoi dong app. App chi mo man lam viec sau khi Google Apps Script tai du lieu moi thanh cong. Khong dung cache de render app ngay luc khoi dong, tranh nguoi dung lap phieu thu/chi hoac ghi buoi hoc tren du lieu cu.

## Luong khoi dong

1. App van doc `ltn-cache` som de biet metadata va co san du lieu du phong trong bo nho.
2. `loading` luon bat khi khoi dong, ke ca khi co cache.
3. Goi GAS foreground voi `RULES.network.initialFetchTimeout`.
4. Neu GAS thanh cong:
   - replace state bang du lieu moi tu GAS.
   - update `ltn-cache` va metadata.
   - `syncState = fresh`.
   - tat loading va mo app.
5. Neu GAS loi/cham trong lan khoi dong:
   - khong mo app bang cache.
   - giu loading screen.
   - hien thong bao GAS cham/loi.
   - tu retry theo `RULES.network.initialLoadAutoRetryDelay`.

## Sau khi app da mo

- Khong tu dong sync nen theo visibility/interval, de tranh thay data giua thao tac nghiep vu.
- Nut `Tai du lieu` trong Settings van cho phep reload thu cong.
- Sau thao tac save, domain layer van co the reload silent de dong bo lai ket qua vua ghi.
- Neu reload sau khi app da san sang bi loi, app co the giu du lieu dang co/cache va hien trang thai ket noi.

## Loading screen

- Khong co nut `Thu lai` bat buoc.
- Sau nguong cham, chi hien thong bao he thong dang tu tai lai.
- Neu khong co GAS thanh cong, nguoi dung khong vao man nghiep vu.

## Acceptance criteria

- Co cache cung van thay loading khi mo app cho den khi GAS thanh cong.
- Khong co flow stale-while-revalidate luc khoi dong.
- Loading tu retry khi GAS cham/loi, khong can nguoi dung bam.
- Auto reload nen bi tat theo cau hinh.
- `npm.cmd run lint` pass.
- `npm.cmd run build` pass.
