# Settings and System Polish Spec

## Pham vi

Spec nay chuan hoa 4 nhom con lai sau khi da xong nhom 1:

1. Sap xep lai tab Cai dat theo nghiep vu.
2. Hoan thien Zalo template.
3. Thong nhat Loading / Empty / Toast / Confirm.
4. Thong nhat format tien, ngay thang, badge trang thai.

Nguyen tac chung:
- Khong doi Google Sheet schema.
- Khong doi Apps Script contract neu khong co task rieng.
- Khong doi logic tai chinh/cong no/chuyen can khi task chi la UI/system polish.
- Khong them thu vien moi.
- Moi nhom lam rieng, xong phai chay `npm.cmd run lint` va `npm.cmd run build`.

## Nhom 2: Cai dat theo nghiep vu

Muc tieu:
- Tab Cai dat phai phan anh cach van hanh trung tam, khong chia theo ten ky thuat roi rac.
- Chi hien thi nhung setting co tac dung that hoac co ghi chu ro neu chua ap dung vao nghiep vu.

Cau truc de xuat:
- He thong: Apps Script URL, link Google Sheets/Docs, trang thai ket noi, tai lai du lieu, cache, reset cai dat.
- Trung tam: ten trung tam, so dien thoai lien he, dia chi co so.
- Tai chinh: hoc phi co ban, nien khoa, hoc phi theo khoi, thong tin ngan hang/VietQR.
- Van hanh: giao vien mac dinh/legacy, ca day, tuy chon an hoc sinh da nghi.
- Thong bao: mau tin Zalo va bien mau.
- Giao dien: co chu.

Quy tac:
- `Giao vien mac dinh/legacy` chi la fallback hien thi/du lieu cu, khong thay the sheet `GiaoVien`.
- `Hoc phi theo khoi` neu chua wire vao cong no thi phai ghi ro "chua ap dung cong no".
- Cac hanh dong xoa cache/reset/xoa cau hinh phai confirm truoc.

## Nhom 3: Zalo template

Muc tieu:
- Mau Zalo phai dung du bien dang ho tro trong Finance.
- Nguoi dung hieu ro bien nao thay duoc va ket qua tin nhan se ra sao.

Bien chuan:
- `[Ten]`: ten hoc sinh.
- `[Lop]`: ma lop hien tai cua hoc sinh, fallback `---`.
- `[Thang]`: thang hoc phi dang xem.
- `[Nam]`: nam hoc phi dang xem.
- `[SoTien]`: so tien dinh dang VND.
- `[Ngay]`: ngay hien tai dinh dang `DD/MM/YYYY`.

Yeu cau:
- Them `[Nam]` vao danh sach bien chen neu Finance da ho tro.
- Co preview tin mau bang du lieu gia dinh, khong anh huong du lieu that.
- Khong mo rong gui hang loat trong nhom nay neu chua co task rieng.

## Nhom 4: Loading / Empty / Toast / Confirm

Muc tieu:
- Nguoi dung nhin thay ro trang thai dang tai, khong co du lieu, thanh cong, loi, va truoc hanh dong nguy hiem.

Chuan de xuat:
- Loading: dung loading co san hoac text ngan "Dang tai du lieu..." trong vung can thiet.
- Empty state: co tieu de ngan, mo ta phu, khong dung cau chung chung "Khong co du lieu" neu co the noi ro hon.
- Toast thanh cong: bat dau bang hanh dong da xong, vi du "Da luu hoc sinh", "Da xoa cache".
- Toast loi: noi ro hanh dong loi, vi du "Khong luu duoc hoc sinh".
- Confirm: bat buoc cho xoa hoc sinh/lop/giao vien/phieu thu/phieu chi, xoa cache, reset cai dat, xoa template.

Quy tac:
- Khong thay modal confirm hien co neu dang dung tot.
- Khong them confirm cho thao tac khong pha huy nhu loc/tim/chuyen tab.

## Nhom 5: Format tien, ngay thang, badge

Muc tieu:
- Cung mot loai du lieu phai hien thi cung mot cach tren toan app.

Tien:
- Dung `fmtVND` cho so tien day du.
- Dung `fmtM` chi cho KPI/tom tat can rut gon.
- Khong hardcode "đ" bang string rieng neu da co helper.

Ngay thang:
- Dung `formatDate` de hien thi ngay tu Sheets/GAS.
- Dung `parseDMY` khi can so sanh ngay.
- Khong tu slice ISO date neu khong bat buoc.

Badge:
- Hoc sinh: Dang hoc = xanh, Nghi = xam/do nhat tuy muc canh bao.
- Chuyen can: Co mat = xanh, Vang = do, Co phep = vang/amber.
- Tai chinh: Da dong = xanh, Chua dong = do/amber, Chua den han = xam.
- Du lieu: Dong bo = xanh, Dang loc/local = xanh duong/xam, Loi = do.

Quy tac:
- Uu tien dung `StatusBadge`/`Badge` co san.
- Khong tao them he UI thu tu.
