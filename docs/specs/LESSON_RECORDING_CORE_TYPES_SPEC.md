# Lesson Recording Core Types Spec

Last updated: 2026-07-10

## Goal

Chuan hoa nghiep vu ghi buoi hoc de form phu hop voi thuc te day hoc:

- Buoi hoc co the gan lop hoac khong gan lop.
- Hoc sinh co the hoc bu, hoc ghep nhom khac, hoac hoc trong nhom tron.
- Moi luot `Co mat` deu duoc tinh vao so buoi thong ke cua hoc sinh.
- Hoc phi/cong no khong phu thuoc so buoi, van theo thang hoc phi.

## Lesson Type

`LoaiBuoiHoc` chi co 2 gia tri nghiep vu:

- `regular`: Chinh khoa
- `extra`: Tang cuong

Khong tao loai rieng cho `hoc bu`, `on tap`, `phu dao`.
Nhung thong tin nay thuoc ve `NoiDung` hoac `GhiChuGV`.

Backward compatibility:

- Du lieu cu `makeup`, `hoc_bu`, `hoc bu` duoc xem la `regular`.
- Du lieu cu `review`, `on_tap`, `on tap`, `them_buoi`, `them buoi` duoc xem la `extra`.
- Gia tri rong/mac dinh duoc xem la `regular`.

## Class Binding

`MaLop` la tuy chon trong form ghi buoi.

- Neu co `MaLop`, app tu nap hoc sinh dang hoc trong lop vao danh sach diem danh.
- Neu khong co `MaLop`, day la buoi nhom tron/khong gan lop; giao vien them hoc sinh thu cong.
- Buoi bam tu dong lich day co san se duoc dien san `MaLop`, `Ngay`, `CaDay` va mac dinh `regular`.

## Attendance Count

Thong ke so buoi hoc cua hoc sinh dem theo quy tac:

- Dem moi cap duy nhat `MaBuoi + MaHS`.
- Chi dem neu `TrangThai` la `Co mat`.
- Khong phan biet `regular` hay `extra`.
- Khong phan biet hoc sinh thuoc lop goc hay duoc them ngoai lop.

## Tuition

Hoc phi/cong no khong duoc tinh theo so buoi.

- No/thanh toan theo `ThangHP` va `NamHP`.
- So buoi chi la thong tin doi soat/phu tro trong man tai chinh.
- Hoc sinh co hoc trong thang nao thi thang do van la ky phi can chot; neu `endDate` nam trong thang thi chi cac thang sau thang do moi khong tinh phi.

## Lesson Id

Quy tac tao `MaBuoi`:

- Buoi co `MaLop`, loai `regular`: dung ma on dinh theo `Ngay + MaLop + CaDay`.
- Buoi khong co `MaLop`: tao ma adhoc duy nhat, ke ca khi loai la `regular`.
- Buoi `extra`: tao ma adhoc duy nhat.

Ly do: buoi khong gan lop nhung trung ngay/ca se bi trung ma neu dung cong thuc `Ngay + MaLop + CaDay` voi `MaLop` rong.
