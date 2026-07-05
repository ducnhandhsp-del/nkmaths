# Mobile Audit Checklist

Ngay audit: 02/07/2026

Pham vi: QA mobile sau khi doi `MobileCompactCard`, KPI mobile 2 cot va toi uu bao cao.

Viewport kiem tra: 390 x 844.

Nguon anh:
- Tong quan: `output/playwright/mobile-compact-qa-after/01-overview.png`
- Van hanh: `output/playwright/mobile-compact-qa-after/03-operations.png`
- Hoc phi: `output/playwright/mobile-compact-qa-after/04-finance.png`
- Bao cao cuoi: `output/playwright/mobile-compact-qa-final/05-reports-final.png`
- Bao cao sau sua loi: `output/playwright/mobile-audit-fixes/reports-mobile-fixed.png`

Luu y quan trong: Playwright dang chay trong browser rieng nen khong co cache Google Sheet that cua browser nguoi dung. Anh audit hien dang o trang thai cache rong/loi tai du lieu, vi vay checklist nay xac nhan duoc layout mobile, chua xac nhan day du card co du lieu that.

## Tong Ket Nhanh

Dat:
- Khong phat hien tran ngang: `bodyWidth = 390` voi viewport 390.
- KPI Hoc phi, Van hanh, Bao cao da gon hon voi bo cuc 2 cot.
- Tom tat ky trong Bao cao da doi sang 2 cot, chieu cao trang giam tu khoang 1594px xuong 1309px.
- Bottom nav va toolbar mobile nhin on dinh.

Can xu ly tiep:
- Can audit lai bang browser co du lieu that de xem card hoc sinh/lop/buoi hoc co tran text khong.

## Checklist Chung

| Hang muc | Trang thai | Ghi chu |
| --- | --- | --- |
| Khong tran ngang mobile | Dat | `bodyWidth = 390`, khong co scroll ngang that. |
| Header + bottom nav | Dat | Canh le on, bottom nav ro. |
| KPI mobile | Dat | Da thanh 2 cot, tiet kiem dien tich. |
| FAB khong che noi dung | Dat | Bao cao da bo FAB noi, thay bang hang nut mobile trong noi dung. |
| Empty state | Dat | De doc, khong vo layout. |
| Du lieu that | Chua xac minh | Playwright khong co cache Google Sheet that. |

## Loi Cu The

### MOB-01 - FAB che noi dung tren Bao cao

Anh: `output/playwright/mobile-compact-qa-final/05-reports-final.png`

Muc do: P2 - Da sua

Hien tuong:
- Nut FAB dau `+` nam de len goc phai cua card "Thong ke doanh thu thang (2026)".
- Bao cao la man xem/in/xuat, action khong phai thao tac nghiep vu hang ngay, nen FAB lien tuc hien co the lam roi.

De xuat:
- An FAB tren man Bao cao, dua `Xuat CSV` va `In` vao toolbar/mobile menu goc tren.
- Hoac doi FAB thanh nut nho "Xuat/In" va dat cao hon/khong de len card noi dung.

Tieu chi dat:
- Cuon dau trang Bao cao khong co FAB che bat ky card nao.
- Van co cach xuat/in tren mobile trong toi da 1 thao tac.

Ket qua sua:
- Da bo `MobileActionFab` rieng cua Bao cao.
- Them hang nut mobile `Xuat CSV` va `In T...` ngay duoi toolbar.
- Anh xac minh: `output/playwright/mobile-audit-fixes/reports-mobile-fixed.png`.
- QA nhanh: `bodyWidth = 390`, `hasFloatingFab = false`, `hasReportMobileActions = true`.

### MOB-02 - Toast loi tai du lieu che header

Anh:
- `output/playwright/mobile-compact-qa-after/01-overview.png`
- `output/playwright/mobile-compact-qa-final/05-reports-final.png`

Muc do: P3 - Da sua

Hien tuong:
- Toast "Loi tai du lieu. Dang dung cache." nam sat top, che mot phan khu vuc header/mobile menu.

De xuat:
- Tren mobile, dua toast xuong duoi header: top = `calc(var(--header-h) + safe-area + 8px)`.
- Hoac rut gon toast loi thanh banner nho trong content khi loi cache keo dai.

Tieu chi dat:
- Toast khong che nut menu, logo va title app.

Ket qua sua:
- Da them `ltn-toast-zone` cho `Toaster`.
- Tren mobile, toast duoc day xuong duoi header bang `calc(var(--header-h) + var(--safe-top) + 8px)`.

### MOB-03 - Chua audit duoc card co du lieu that

Anh hien tai:
- `output/playwright/mobile-compact-qa-after/03-operations.png`
- `output/playwright/mobile-compact-qa-after/04-finance.png`

Muc do: P1 cho vong QA tiep theo

Hien tuong:
- Playwright khong co du lieu/cache that, nen cac danh sach dang empty.
- Chua xac nhan duoc `MobileCompactCard` khi co ten hoc sinh dai, so tien lon, lich hoc dai, noi dung buoi hoc dai.

De xuat:
- Mo app bang browser dang co du lieu that cua nguoi dung.
- Chup cac man: Dao tao/Hoc sinh, Dao tao/Lop hoc, Van hanh/Buoi hoc, Hoc phi/Cong no, Bao cao.
- Uu tien kiem tra text dai va so tien nhieu chu so.

Tieu chi dat:
- Khong chip/text nao tran khoi card.
- So tien dai van nam trong cot phai, khong de len title.
- Action row khong lam card cao bat thuong.

## Checklist Theo Man

### Tong quan

Anh: `output/playwright/mobile-compact-qa-after/01-overview.png`

Trang thai: Dat co dieu kien.

Da dat:
- KPI 2 cot gon.
- Card "Viec can xu ly" va "Lich day hom nay" de doc.
- FAB khong che noi dung chinh o anh dau trang.

Can xem lai:
- Toast loi du lieu che header.
- Kiem tra lai khi co nhieu viec can xu ly that.

### Dao tao

Anh truoc do: `output/playwright/mobile-compact-qa/02-training.png`

Trang thai: Chua xac minh voi du lieu that.

Da dat:
- Toolbar va filter khong tran ngang.
- Empty state on.

Can xem lai:
- Hoc sinh co ten dai, nhieu lop, so dien thoai dai.
- Lop hoc co lich 3 buoi dai.
- Giao vien co doanh thu/so lop nhieu.

### Van hanh

Anh: `output/playwright/mobile-compact-qa-after/03-operations.png`

Trang thai: Dat co dieu kien.

Da dat:
- KPI da gon thanh 2 cot.
- Empty state khong vo layout.

Can xem lai:
- Danh sach lich day co du lieu that.
- Danh sach buoi hoc voi noi dung/bai tap dai.
- Danh sach chuyen can co canh bao va Zalo PH.

### Hoc phi

Anh: `output/playwright/mobile-compact-qa-after/04-finance.png`

Trang thai: Dat co dieu kien.

Da dat:
- 4 KPI 2 cot, tiet kiem dien tich hon ban cu.
- Filter lop/thang nam hop ly.

Can xem lai:
- So tien lon: hang chuc/tram trieu.
- Cong no co ten hoc sinh dai.
- Action thu phi/nhac Zalo/hoa don tren card co du lieu.

### Bao cao

Anh: `output/playwright/mobile-compact-qa-final/05-reports-final.png`

Trang thai: Dat co dieu kien.

Da dat:
- KPI 2 cot.
- Tom tat ky 2 cot.
- Khong tran ngang.
- Chieu cao trang giam ro.

Da sua:
- MOB-01: Bo FAB noi o Bao cao.
- MOB-02: Dua toast xuong duoi header mobile.

## Thu Tu Xu Ly De Xuat

1. Sua MOB-01: an/chuyen FAB tren Bao cao.
2. Sua MOB-02: chinh vi tri toast mobile.
3. Chup lai audit bang browser co du lieu that.
4. Neu card co du lieu bi cao/tran, tinh chinh `MobileCompactCard` mot lan nua.
5. Sau khi on: `npm.cmd run lint` va `npm.cmd run build`.
