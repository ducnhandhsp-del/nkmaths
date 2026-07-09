# Overview Daily Operations Spec

## Muc tieu

Tab Tong quan la bang dieu hanh hang ngay cho quan ly lop, khong phai man bao
cao dai. Khi mo app, nguoi dung can biet ngay:

- Hom nay co bao nhieu buoi can day hoac can ghi.
- Viec nao can xu ly truoc.
- Tinh hinh thu tien hien tai co diem nao can nhac.
- Quy mo hoc sinh/lop dang van hanh ra sao.

## Nguyen tac nghiep vu

- Khong doi schema Google Sheets, GAS contract, field frontend hoac data flow.
- Khong doi logic luu/sua/xoa hoc sinh, lop, phieu thu, buoi hoc.
- Tong quan chi tong hop tu du lieu hien co: `students`, `uClasses`,
  `payments`, `tlogs`.
- Neu chi so tai chinh dung logic theo chu ky so buoi thi copy phai noi ro la
  hoc phi toi han/can thu, khong goi thanh cong no thang.
- Neu chi so tai chinh dung ngay phieu thu thi copy phai noi ro la da thu
  trong thang, khong goi thanh hoc phi cua thang.

## Dinh nghia KPI

### Hoc sinh dang hoc

- Gia tri: so hoc sinh active theo `isStudentActive`.
- Phu de: tong so ho so de thay chenhlech active/inactive.
- Action: mo Dao tao/Hoc sinh.

### Buoi hom nay

- Gia tri: so slot lich hom nay lay tu `Buoi 1/2/3` cua lop active.
- Khong goi la "lop hom nay" vi mot lop co the co nhieu ca/buoi.
- Phu de uu tien so buoi chua ghi.
- Action: mo Van hanh/Lich day.

### Da thu trong thang

- Gia tri: tong payment co ngay phieu thu thuoc thang/nam hien tai.
- Copy phai ghi "Theo ngay phieu thu".
- Action: mo Tai chinh/So thu.

### Hoc phi toi han

- Gia tri: tong `outstandingAmount` tu `getTuitionCycleState`.
- Day la logic theo chu ky buoi hoc sau lan dong gan nhat.
- Copy khong duoc goi la "cong no thang" neu chua tinh theo `thangHP/namHP`.
- Action: mo Tai chinh/Cong no.

## Viec can xu ly

Thu tu uu tien:

1. Buoi da toi gio nhung chua ghi.
2. Hoc sinh co hoc phi toi han/can thu.
3. Hoc sinh dang hoc nhung chua co lop hoac lop khong ton tai.
4. Lop thieu giao vien.
5. Lop thieu lich hoc.
6. Hoc sinh nghi nhieu/can theo doi.
7. Hoc sinh moi dang ky trong thang.
8. Lop sap bat dau trong 90 phut.

Moi item phai co action dua nguoi dung ve dung man xu ly gan nhat.

## Lich day hom nay

- Sap xep theo gio bat dau, sau do theo ma lop.
- Trang thai:
  - `Da ghi`: da co teaching log trung lop/ngay/ca.
  - `Sap toi`: chua ghi va ca nam trong tuong lai.
  - `Can ghi`: chua ghi va da toi gio.
- Buoi `Can ghi` phai co nut `Ghi` mo form ghi buoi voi lop/ngay/ca da dien san.
- Click dong `Da ghi` hoac `Sap toi` co the mo man Van hanh de xem day du.

## QA can chay

- `npm.cmd run lint`
- `npm.cmd run build`
- Kiem tra desktop Tong quan:
  - Card hien "Buoi hom nay", khong con "Lop hom nay".
  - Card hien "Da thu trong thang".
  - Card hien "Hoc phi toi han".
  - Viec can xu ly uu tien buoi chua ghi va hoc phi can thu.
- Kiem tra mobile Tong quan:
  - KPI khong tran chu.
  - Quick actions van 2 cot.
  - Lich day hom nay khong chong nut/trang thai.

## RUI RO

- Neu du lieu lich lop dang sai encoding, `getClassSlots` co the khong bat duoc
  tat ca slot. Spec nay khong sua schema/encoding.
- Neu trung tam muon cong no theo thang thay vi theo chu ky buoi hoc, can task
  rieng de dong bo logic giua Tong quan va man Hoc phi.
