# Mobile Operational Card Spec

## Muc tieu

Mobile card khong phai ban thu nho cua bang desktop. Moi card chi can giup nguoi dung tra loi nhanh:

- Day la ai/cai gi?
- Lien quan lop, ky, ngay nao?
- Can thao tac gi tiep?

Khong dua ma ky thuat nhu `HS078`, `PC-260709-KVML` len subtitle mac dinh neu no khong giup quyet dinh ngay. Cac ma nay nam trong detail/modal hoac bang desktop.

## Layout chuan

Moi card dung 3 hang:

```text
Title / doi tuong chinh             Right / metric chinh
Meta ngan: lop, ky, ngay, ngu canh
Note / trang thai                   Actions
```

Quy tac:

- Title duoc toi da 2 dong.
- Meta la text ngan, khong dung pill cho thong tin dai.
- Note la canh bao/trang thai/phu trach.
- Actions nam cuoi card, khong treo giua cot phai.
- Moi card chi co mot metric chinh ben phai: tien, so hoc sinh, ty le, hoac trang thai.

## 4 loai card

### 1. Profile card

Dung cho Hoc sinh va Giao vien.

Hoc sinh:

```text
Hoang Nha Phuong                    Chua thu
6A · PH: Hoang Thi Thu Huong
Chua co SDT                         [Thu]
```

Giao vien:

```text
Le Duc Nhan                         Dang day
8 lop · 73 HS · CC 90%
HP T7: 1/73 · 600 000d              [Goi]
```

### 2. Group / session card

Dung cho Lop hoc, Lich day, Buoi hoc, Chuyen can.

```text
17h30 · 10B                         Co the ghi
Thu 4 · 08/07 · Dao Tan
Le Duc Nhan                         [Ghi] [Nghi]
```

### 3. Money due card

Dung cho Cong no hoc phi.

```text
Bao Han                             600 000d
12A · T7/2026 · 4 buoi
Chua thu                            [Thu] [Nhac]
```

### 4. Transaction card

Dung cho Phieu thu va Phieu chi.

```text
Tran Khanh Phong                    600 000d
09/07 · T7/2026 · 10A
Le Duc Nhan                         [Sua] [Xoa]
```

Phieu chi:

```text
Tien dien                           2tr
09/07 · Van hanh
Nhan                                [Sua] [Xoa]
```

## Khong lam

- Khong hien tat ca cot desktop tren mobile card.
- Khong dung 3-4 chip trong mot card neu chi la thong tin phu.
- Khong lap trang thai da ro tu tab hien tai, vi du `Da thu` trong tab Phieu thu hoac `Da chi` trong tab Phieu chi.
- Khong dua search/filter vao card.
