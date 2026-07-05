# Settings Unified Screen Spec

## Muc tieu

Don dep tab Cai dat thanh mot man hinh duy nhat, it click, de scan va chi giu cac cau hinh that su can thao tac. Day la thay doi UI/settings flow, khong doi Google Apps Script contract, Google Sheets headers, schema du lieu hay nghiep vu domain.

## Pham vi

- Gop cac subtab hien tai thanh mot man cuon duy nhat.
- Bo subtab `Van hanh`.
- Bo phan cau hinh `Ca day` khoi Settings.
- Bo phan `Trang thai diem danh` khoi Settings vi day la nghiep vu co dinh.
- Bo `Tuy chon hien thi` va toggle `An hoc sinh da nghi hoc theo mac dinh` khoi Settings.
- Giu lai cac handler luu/tai du lieu/reset/cache/Zalo/QR dang co.

## Bo cuc moi

Thu tu section tren mot man:

1. Header trang thai
   - Ket noi GAS.
   - Trang thai dong bo/cache.
   - Nut `Tai du lieu`.
   - Nut `Luu thay doi` hoac `Da luu`.
   - Hien canh bao cau hinh neu co.

2. Ket noi du lieu
   - Apps Script URL.
   - Google Sheet URL.
   - Google Doc URL.
   - Cache offline: thoi diem cap nhat, dung luong, xoa cache.
   - Reset cai dat trinh duyet.

3. Thong tin trung tam
   - Quan ly/GV co so Nguyen Quang Bich.
   - Quan ly/GV co so Dao Tan.
   - Chi giu label ngan; bo cac dong giai thich dai.

4. Hoc phi va thanh toan
   - Hoc phi mac dinh.
   - Nien khoa.
   - Han dong hoc phi.
   - Bank ID, so tai khoan, ten tai khoan.
   - Nut xem QR VietQR.

5. Mau Zalo
   - Danh sach mau.
   - Them/sua/xoa mau.
   - Noi dung mau.
   - Chen bien.
   - Preview ngan.

## Nguyen tac UI

- Khong dung subtab/chip navigation ben trong Settings.
- Khong dung hero, gradient, card trang tri lon.
- Section compact, scan nhanh, uu tien form grid.
- Bo bot hint dai duoi field; chi giu placeholder/label va warning can thiet.
- Desktop uu tien 2 cot khi hop ly; mobile xep 1 cot.

## Acceptance criteria

- Vao Settings thay du cac nhom cau hinh tren cung mot man, khong can click subtab.
- Khong con nhom `Van hanh`, `Ca day`, `Trang thai diem danh`, `Tuy chon hien thi`.
- Nut luu/tai du lieu/cache/reset/Zalo/QR van hoat dong nhu truoc.
- `npm.cmd run lint` pass.
- `npm.cmd run build` pass.
