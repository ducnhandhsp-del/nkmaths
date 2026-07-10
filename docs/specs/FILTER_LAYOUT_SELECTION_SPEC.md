# Filter Layout Selection Spec

Last updated: 2026-07-10

## Muc tieu

Spec nay tong hop lai viec dua bo loc vao app theo huong chon loc. Muc tieu khong phai dua lai tat ca filter tung co, ma la giu dung cac filter can cho nghiep vu nhung khong lam toolbar bi tran xuong hang moi tren desktop/mobile.

Nguyen tac chinh:

- Toolbar chi chua filter tac dong truc tiep va dung thuong xuyen.
- Moi active subtab chi nen co 2-3 control filter hien tren desktop.
- Mobile uu tien toi da 2 slot filter va an search de toolbar gon, tru khi co yeu cau rieng.
- Search dai khong nen chen vao toolbar neu man da co tab + nhieu filter, tru khi desktop con du cho va search la thao tac doi soat chinh.
- Reset filter khong duoc la mot nut conditional lam thay doi width toolbar.

## Ngan sach kich thuoc toolbar

### Kich thuoc control

Dung chuan nho cho toolbar:

```text
height: 32-34px
gap: 8px
border-radius: 8px hoac pill neu la tab
font-size: 12-13px
```

Kich thuoc de xuat:

| Control | Desktop width | Mobile width | Ghi chu |
| --- | ---: | ---: | --- |
| Search ngan | 116-136px | An | Desktop only, placeholder `Tim`, `Tim HS`, `Tim GV` |
| Class select | 96-108px | 100% slot | Label ngan `Lop` |
| Month select | 108px | 100% slot | `T7/2026` |
| Period control prev/next | 136-148px | 100% slot | Slot co dinh, khong them nut `Thang nay` rieng |
| Status select | 112-124px | 100% slot | Label ngan `Trang thai`, option ngan |
| Teacher select | 132-144px | 100% slot | Chi dat toolbar neu that su can |
| Spender/category select | 124-136px | 100% slot | Uu tien 1 cai trong toolbar, cai con lai vao `Loc` neu hep |
| Nut `Loc` | 74-86px | 100% slot | Co badge active count, vi du `Loc 2` |
| Nut icon reset | 32-34px | 32-34px | Nam trong `Loc` hoac slot co dinh, khong conditional chen hang |

### Gioi han so control

Desktop rong:

```text
Neu toolbar co tab + action: toi da 3 filter control, tong width <= 360px.
Neu toolbar khong co tab: toi da 4 filter control, tong width <= 460px.
```

Desktop hep/tablet:

```text
Toi da 2 filter control hien truc tiep.
Control con lai chi dua vao desktop hoac bo qua tren mobile neu khong phai thao tac hang ngay.
```

Mobile:

```text
Toi da 2 slot filter tren toolbar.
Neu co period/month thi slot 1 la period/month, slot 2 la select nghiep vu chinh.
Neu khong co period/month thi uu tien cac select nghiep vu chinh, khong hien search.
```

Khong duoc de toolbar phat sinh 3-4 control tren mobile roi wrap thanh 2 hang filter.

## Pattern filter chuan

### Inline filter

Dung cho filter dung nhieu nhat:

- thang/ky
- lop
- search nhanh
- status nghiep vu chinh cua subtab

### Nut `Loc`

Khong dung `Loc` tren mobile trong phase hien tai vi tang them mot cap thao tac va lam cam giac UI cong kenh. Tren desktop/tablet hep, chi can dung `Loc` neu thuc su khong con cach sap xep truc tiep gon.

Neu co filter phu hoac filter chi thinh thoang dung:

- trang thai phu
- giao vien
- nguoi chi
- danh muc chi
- chua co lop/thieu GV
- filter duoc bat tu KPI nhung khong du cho hien inline tren mobile

Mobile uu tien an cac filter nay; KPI hoac desktop co the mo/filter cac trang thai phu khi can.

### Section-level filter

Dung khi filter chi ap dung cho mot bang/section:

- search phieu thu trong bang `Phieu thu`
- search cong no theo hoc sinh trong bang cong no
- sort/filter `Hoc sinh theo lop` trong Reports

Khong dua section-level filter len toolbar neu KPI toan man khong cung pham vi.

## Chon loc theo man hinh

## Tong quan

De xuat:

- Khong them filter.

Ly do:

- Tong quan la man dieu huong va canh bao nhanh.
- Them filter se lam KPI co nguy co bi hieu sai pham vi.

## Dao tao - Hoc sinh

Nghiep vu can:

- Tim hoc sinh nhanh.
- Loc theo lop.
- Xem nhanh hoc sinh da nghi/chua co lop khi can ra soat du lieu.

Desktop:

```text
Search 136px | Lop 104px | Trang thai 122px
```

`Trang thai` la filter mot tang:

```text
Dang hoc | Tat ca | Da nghi | Chua co lop
```

Mobile:

```text
Lop | Trang thai
```

Search an tren mobile de toolbar gon.

Khong dua filter hoc phi vao man Hoc sinh. Cong no da co man Hoc phi rieng.

## Dao tao - Lop hoc

Nghiep vu can:

- Tim lop.
- Loc theo giao vien.
- Loc lop can sua: thieu GV/chua lich/da dong.

Desktop:

```text
Search 126px | Giao vien 136px | Trang thai 124px
```

`Trang thai lop` la filter mot tang:

```text
Trang thai lop: Tat ca | Dang mo | Thieu GV | Chua lich | Da dong
```

Mobile:

```text
Giao vien | Trang thai
```

Search an tren mobile de toolbar gon.

Khong them filter co so/chi nhanh trong phase nay, tru khi du lieu co nhieu co so that su.

## Dao tao - Giao vien

Nghiep vu can:

- Tim giao vien.
- An/hien giao vien nghi tam thoi.

Desktop:

```text
Search 136px | Trang thai 124px
```

Mobile:

```text
Trang thai
```

Option:

```text
Dang day | Tat ca | Tam nghi | Da nghi | Chua co lop
```

Khong them filter doanh thu/gio day vao toolbar. Neu can, do la sort/ranking sau.

## Van hanh - Lich day

Nghiep vu can:

- Doi thang.
- Loc theo lop.
- Thao tac ghi/nghi buoi nhanh.

Desktop:

```text
Period 148px | Lop 108px
```

Mobile:

```text
Period | Lop
```

Khong them status filter trong phase nay vi danh sach lich da duoc rank theo viec can lam. Nut `Thang nay` khong nen la control rieng conditional; nen nam trong period control co slot co dinh.

## Van hanh - Buoi hoc

Nghiep vu can:

- Doi thang.
- Loc lop.
- Thay ro khi dang loc `Chua diem danh`.

Desktop:

```text
Thang 108px | Lop 108px | Trang thai 124px
```

Option `Trang thai`:

```text
Tat ca | Chua diem danh
```

Mobile:

```text
Thang | Lop
```

Mobile an `Trang thai`; KPI `Chua diem danh` co the dua nguoi dung vao danh sach can xu ly. Khong them `Loai buoi` vao phase nay. `Chinh khoa/Tang cuong` dang quan trong cho tinh so buoi, nhung khong phai filter dung hang ngay trong bang buoi hoc.

## Van hanh - Chuyen can

Nghiep vu can:

- Doi thang.
- Loc lop.
- Thay ro khi dang loc `Can theo doi`.

Desktop:

```text
Thang 108px | Lop 108px | Muc do 124px
```

Option `Muc do`:

```text
Tat ca | Can theo doi
```

Mobile:

```text
Thang | Lop
```

Mobile an `Muc do`; KPI canh bao co the dua nguoi dung vao nhom can theo doi. Khong them filter `Co mat/Vang/Co phep`, vi man nay la tong hop canh bao, khong phai log diem danh chi tiet.

## Tai chinh - Cong no

Nghiep vu can:

- Chot hoc phi theo thang.
- Loc lop.
- Tach `Can thu` va `Da thu`.
- Tim hoc sinh khi danh sach dai.

Desktop toolbar:

```text
Thang 108px | Lop 108px | Trang thai 116px | Search 150px
```

Option `Trang thai`:

```text
Can thu | Tat ca | Da thu
```

Search `Tim HS`:

- Dat truc tiep tren toolbar desktop vi con du cho va day la thao tac doi soat chinh.
- Width desktop 140-160px.
- Mobile an search va khong ap dung search ngam de tranh ket qua bi loc ma khong thay o tim.

Mobile toolbar:

```text
Thang | Trang thai
```

Mobile an loc lop va search de tranh toolbar 3-4 control.

Nghiep vu:

- `Can thu` = `unpaid` + `overdue`.
- `Da thu` = hoc sinh billable da co phieu cho thang dang xem.
- Khong hien hoc sinh khong billable trong thang dang xem.
- Khong dua lai thanh toan mot phan.

## Tai chinh - Phieu thu

Nghiep vu can:

- Doi thang.
- Loc lop.
- Tim hoc sinh/so phieu khi can doi soat.

Desktop toolbar:

```text
Thang 108px | Lop 108px | Search 188px
```

Search `Tim HS / so phieu`:

- Dat truc tiep tren toolbar desktop.
- Width 180-190px.

Mobile toolbar:

```text
Thang | Lop
```

Khong them status filter cho phieu thu.

## Tai chinh - Phieu chi

Nghiep vu can:

- Doi thang.
- Loc nguoi chi.
- Xem nhanh cac phieu chi theo nguoi chi.

Desktop toolbar:

```text
Thang 108px | Nguoi chi 128px
```

Khong hien nut `Loc` trong phase nay. Filter danh muc chi tam thoi khong dua vao toolbar vi so luong phieu chi hien con it va nut nay tao them tang thao tac khong can thiet.

Mobile toolbar:

```text
Thang | Nguoi chi
```

Khong them search noi dung chi trong phase nay, de tranh qua tai.

## Bao cao

Nghiep vu can:

- Chon ky bao cao.
- Bao cao tong khong bi loc ngam.

Desktop toolbar:

```text
Period 148px
```

Mobile toolbar:

```text
Period
```

Khong them global class filter. Neu sau nay can bao cao theo lop, tao mode rieng:

```text
Toan trung tam | Theo lop
```

Va khi vao `Theo lop`, tat ca KPI phai tinh lai theo lop do. Khong duoc chi loc mot bang ben duoi.

## ModalFinance

Khong them filter moi trong modal.

Can lam:

- sort datalist hoc sinh theo lop/ten
- giu context thang/lop/hoc sinh khi mo tu Cong no

## ModalClass

Khong them filter moi trong modal.

Can lam:

- sort lop/giao vien dung chuan
- bulk transfer neu can search thi de phase rieng, khong chen vao modal luc nay

## Thu tu uu tien code

### Phase 1 - Hien ro filter dang bi an

- Finance cong no: `Trang thai Can thu/Tat ca/Da thu`.
- Operations buoi hoc: `Trang thai Tat ca/Chua diem danh`.
- Operations chuyen can: `Muc do Tat ca/Can theo doi`.

### Phase 2 - Chon loc mobile filters

- Hoc sinh: status mot tang tren toolbar.
- Lop hoc: status lop mot tang tren toolbar.
- Phieu chi: chi giu `Thang` va `Nguoi chi`, khong hien `Loc`.
- Mobile: period/month + mot select nghiep vu chinh, khong hien search va khong dung panel `Loc`.

### Phase 3 - Search doi soat tren desktop

- Cong no: `Tim HS` tren toolbar desktop, an tren mobile.
- Phieu thu: `Tim HS / so phieu` tren toolbar desktop, an tren mobile.

### Phase 4 - QA layout

Kiem tra cac viewport:

```text
Desktop: 1366x768, 1440x1100
Narrow desktop/tablet: 1024x768
Mobile: 390x844
```

Checklist:

- Toolbar khong co filter row bi wrap bat ngo.
- Mobile moi subtab toi da 2 slot filter.
- Khi KPI bat filter phu tren mobile, uu tien doi subtab/list truc tiep; khong bat buoc chen filter phu vao toolbar.
- Reset filter khong lam toolbar doi chieu cao.
- Reports khong bi loc lop ngam.
- Cong no `Can thu/Da thu` dung voi logic billable theo thang.
