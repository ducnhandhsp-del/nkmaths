# Mobile Filter And Card Spec

## Scope

Spec nay ap dung cho cac man mobile data-heavy: Hoc sinh, Lich day, Cong no, Phieu thu, Phieu chi. Day la cleanup UI-only, khong doi schema, Apps Script contract, filter logic, action handler, modal behavior hay row/card click behavior.

## Mobile filter rows

- Khi toolbar mobile chi co 2 filter chinh, chia deu `1/2 - 1/2`.
- Grid mac dinh: `grid-template-columns: repeat(2, minmax(0, 1fr))`.
- Moi control trong filter row phai co `width: 100%` va `min-width: 0`.
- Neu co nut reset/clear filter, nut nay span full row de khong lam vo bo cuc 2 cot.
- Desktop giu layout compact dang co, khong ep 2 cot desktop.

## Mobile compact card meta chips

- Chip meta trong card mobile phai co vi tri on dinh giua cac card.
- Dung grid 2 cot cho meta chips thay vi `flex-wrap` theo do dai noi dung.
- Moi chip chiem tron mot cell, text dai duoc ellipsis.
- Thu tu chip phai on dinh theo nghia nghiep vu cua tung card.
- Khong them chip trang tri hoac thong tin trung voi badge/value/action.

## Schedule mobile cards

- Trang thai buoi hoc chi nen hien mot lan o badge/status chinh.
- Khong lap lai cung mot text nhu `Chua toi gio` o value, badge va action trong cung mot card.
- Action cho buoi bi khoa nen la nhan thao tac ngan, vi du `Cho gio` hoac `Khong ghi`, khong lap lai trang thai.
- Giu nguyen click card de xem/ghi buoi theo logic hien co.

## Acceptance criteria

- Hoc sinh mobile: o Tim va Lop rong bang nhau.
- Cong no, Phieu thu, Phieu chi mobile: moi cap 2 filter rong bang nhau.
- Lich day mobile: khong con card lap `Chua toi gio` nhieu lan.
- Chip nho trong cac card mobile can theo 2 cot on dinh, khong troi vi do dai noi dung.
- `npm.cmd run lint` va `npm.cmd run build` phai pass truoc khi deploy.
