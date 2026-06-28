# QA Release Checklist - LOP TOAN NK

Muc tieu: xac nhan app san sang dung hang ngay, khong lam hong du lieu Google Sheet/App Script.

## 1. Navigation va shell

- [ ] Desktop sidebar/bottom mobile mo dung 5 vung nghiep vu hien tai.
- [ ] Click tung muc khong bi man trang.
- [ ] Doi man hinh tu scroll len dau.
- [ ] Settings khong che mat workflow chinh.
- [ ] Khong con muc demo/khong dung nhu Hoc lieu/MathPro/phone shell production.

## 2. Hoc sinh va lop

- [ ] Them hoc sinh moi sinh ma HS dung chuoi hien co.
- [ ] Sua hoc sinh khong lam mat SDT co so 0 dau.
- [ ] Luu parentPhone/studentPhone duoi dang string.
- [ ] Gan lop/classId dung de Apps Script tao/giu DangKyLop.
- [ ] Sua lop giu duoc MaLop, TenLop, Khoi, GiaoVien/MaGV, CoSo, lich hoc.

## 3. Ghi buoi hoc va diem danh

- [ ] Ghi buoi hoc luu dung lop, ngay, ca, giao vien, noi dung, bai tap.
- [ ] Diem danh chi co 3 trang thai: Co mat, Vang, Co phep.
- [ ] Co phep khong bi tinh nhu vang lien tiep.
- [ ] Sua buoi hoc cu khong tao trung buoi.
- [ ] Mobile modal Ghi buoi de bam nut Luu/Huy.

## 4. Hoc phi, cong no va phieu thu

- [ ] Cong no chi tinh hoc sinh billable theo startDate/endDate/status.
- [ ] Khong tinh no truoc thang bat dau hoc.
- [ ] Khong tinh no sau thang nghi hoc.
- [ ] Phieu thu luu MaHS, MaLop, ThangHP, NamHP, SoTien.
- [ ] Hinh thuc thanh toan chi hien thi Chuyen khoan/Tien mat.
- [ ] Bien lai hien dung hoc sinh, lop, ky phi, so tien.

## 5. Phieu chi

- [ ] Them/sua phieu chi luu ngay, noi dung, hang muc, nguoi chi, so tien.
- [ ] Xoa phieu chi co confirm.
- [ ] So tien chi khong anh huong cong no hoc phi.

## 6. Zalo va lien he

- [ ] Nut Zalo/Goi khong hien sai so.
- [ ] Copy nhac phi tao noi dung dung thang/nam dang xem.
- [ ] Khong tu dong gui Zalo hang loat khi chua co tich hop chinh thuc.
- [ ] Neu khong co SDT/Zalo thi UI khong hien nut lien he gay nham.

## 7. Data compatibility

- [ ] Frontend doc duoc field moi Apps Script: MaHS, MaLop, MaPhieuThu, ThangHP, NamHP.
- [ ] Frontend van doc duoc field cu/legacy neu co.
- [ ] Khong doi schema Google Sheet.
- [ ] Khong doi Apps Script contract.

## 8. Build gate

- [ ] `npm.cmd run lint` pass.
- [ ] `npm.cmd run build` pass.
- [ ] Neu co warning bundle size, ghi nhan la rui ro toi uu hieu nang, khong phai bug release.

