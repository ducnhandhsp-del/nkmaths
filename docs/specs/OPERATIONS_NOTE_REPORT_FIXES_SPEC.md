# Operations Note And Report Fixes Spec

## Muc tieu

Sua cac loi van hanh dang anh huong thao tac hang ngay:

- Ghi chu tung hoc sinh trong form ghi buoi phai go duoc dau cach binh thuong.
- Ghi buoi co cach danh dau mot buoi nghi do giao vien ban hoac lop nghi.
- Bao cao doanh thu thang khong so sanh tien may moc voi thang truoc.
- Card hoc sinh mobile bot chip hoc luc.
- Form/modal mobile co font deu va de doc hon.

## Quyet dinh nghiep vu

### Ghi chu diem danh

Input ghi chu cua tung hoc sinh khong duoc trim trong luc nguoi dung dang go. App chi lam sach tag `Chua lam BTVN` khi compose ghi chu va chi trim khi luu xuong data layer.

### Nghi buoi

Chon phuong an khong doi schema/GAS trong dot nay, nhung doi cach bieu dien nghiep vu:

`Nghi buoi` la trang thai cua buoi hoc/lop hoc, khong phai trang thai diem danh cua tung hoc sinh. Vi vay khong duoc gan hoc sinh la `Co phep` hang loat.

Khi bam `Nghi` tu lich day:

- Hien confirm nho: `Xac nhan nghi buoi lop {classId}, ca {caDay}, ngay {date}?`
- Neu xac nhan, app luu ngay mot teaching log dac biet, khong mo form ghi buoi.
- Teaching log dac biet co:
  - `content`: `Lop nghi`
  - `homework`: `---`
  - `teacherNote`: `[NGHI_BUOI] Lop nghi/GV ban.`
  - `attendanceList`: `[]`
  - `present`: `0`
  - `absent`: `0`
  - `excused`: `0`

Hien thi:

- Trong lich day: slot co log `[NGHI_BUOI]` hien badge `Da nghi`.
- Trong danh sach buoi hoc: hien `Lop nghi`, khong hien `Chua diem danh`.
- Trong chi tiet buoi hoc: hien ro `Lop nghi`, khong render danh sach diem danh rong nhu loi thieu du lieu.

Thong ke:

- Buoi nghi khong tinh vao ty le chuyen can.
- Buoi nghi khong tinh vao so hoc sinh `Co phep`.
- Buoi nghi khong tinh vao canh bao vang hoc, streak vang, hay danh sach can theo doi.
- Buoi nghi khong tinh vao bo loc `Chua diem danh`.
- Data health khong canh bao log `[NGHI_BUOI]` la thieu `attendanceList`.

Rui ro chap nhan: du lieu nghi buoi van nam trong bang nhat ky buoi hoc. Neu sau nay can bao cao nghi buoi rieng, nen tach schema thanh `lessonExceptions` voi khoa `date + classId + caDay`.

### Tai sao khong dung `Co phep`

`Co phep` la trang thai cua hoc sinh trong mot buoi hoc co dien ra. Neu ca lop nghi/GV ban, buoi hoc khong dien ra nen khong co su kien diem danh hoc sinh. Luu ca lop thanh `Co phep` se lam sai:

- Tong so luot diem danh.
- Ty le chuyen can.
- So luot nghi co phep.
- Cac bao cao theo hoc sinh/lop/giao vien.

Viec dung teaching log dac biet voi `attendanceList: []` giu duoc dau vet van hanh ma khong lam bien dang du lieu diem danh.

### Bao cao doanh thu thang

Bo nhan so sanh doanh thu voi thang truoc vi tien hoc phi co the thu som, thu muon, thu gop va khong phan anh truc tiep hieu qua thang.

Bang doanh thu thang hien:

- Tong tien thang.
- So phieu thu.
- Trung binh/phieu.
- Ty trong trong doanh thu nam.

## Tieu chi nghiem thu

- Go `abc def` trong ghi chu diem danh khong bi thanh `abcdef`.
- Tick/untick `Chua BTVN` van giu noi dung ghi chu rieng.
- Buoi chua toi gio van co the bam `Nghi`.
- Bam `Nghi` xong la luu ngay sau confirm, khong mo form ghi buoi.
- Teaching log nghi buoi co `attendanceList: []`.
- Teaching log nghi buoi co `present = 0`, `absent = 0`, `excused = 0`.
- Buoi nghi hien trang thai de nhan biet khi xem danh sach buoi hoc.
- Buoi nghi khong lam tang danh sach `Chua diem danh`.
- Buoi nghi khong lam tang so hoc sinh `Co phep`.
- Bao cao doanh thu khong con hien `+/- so voi thang truoc`.
- Card hoc sinh mobile khong con chip hoc luc.
- `npm.cmd run lint` va `npm.cmd run build` pass.
