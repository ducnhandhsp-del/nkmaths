# Spec Schema/GAS: Module Diem So

## 1. Muc tieu

Them nghiep vu theo doi diem so cho Lop Toan NK ma khong lam anh huong cac luong da on dinh:

- Hoc sinh/lop/giao vien
- Ghi buoi hoc/diem danh
- Hoc phi/cong no/thu chi
- Bao cao hien co

Module Diem so phuc vu 2 nhu cau:

1. Theo doi diem chinh khoa: GK1, HK1, GK2, HK2, trung binh mon.
2. Theo doi diem khao sat rieng cua Lop Toan NK theo tung bai/lan khao sat.

Nguyen tac quan trong:

- Khong them cot diem vao sheet `HocSinh`.
- Khong tron diem so vao `DiemDanh`.
- Khong dung diem so de tu dong doi trang thai hoc sinh.
- Khong dung diem so de tinh hoc phi.
- App phai chay binh thuong neu sheet diem so chua co hoac rong.

---

## 2. Thiet ke schema de xuat

Dung 2 sheet moi:

```text
BaiKiemTra
DiemSo
```

Ly do khong chi dung 1 sheet:

- Mot bai khao sat NK co metadata chung: ten bai, ngay kiem tra, lop, hoc ky, he so.
- Neu luu metadata lap lai trong moi dong diem hoc sinh thi de sai lech ten/ngay/he so.
- Tach `BaiKiemTra` giup sau nay xem diem theo bai, theo lop, theo nam hoc ro hon.

Neu muon MVP rat nhanh, co the chi dung `DiemSo`, nhung khuyen nghi chot ngay 2 sheet de sach du lieu.

---

## 3. Sheet `BaiKiemTra`

### Muc dich

Luu metadata cua mot bai/lan kiem tra.

Vi du:

- GK1 hoc ky 1
- HK1 hoc ky 1
- Khao sat dau vao
- Khao sat chuyen de ham so
- Khao sat thang 9

### Header

```text
MaBai
TenBai
LoaiDiem
NamHoc
HocKy
MaLop
Khoi
NgayKiemTra
DiemToiDa
HeSo
TrangThai
GhiChu
CreatedAt
UpdatedAt
```

### Y nghia cot

| Cot | Bat buoc | Ghi chu |
|---|---:|---|
| MaBai | Co | Ma bai kiem tra, khong doi sau khi tao |
| TenBai | Co | Ten hien thi cua bai |
| LoaiDiem | Co | GK1, HK1, GK2, HK2, TBM, KhaoSatNK |
| NamHoc | Co | Vi du `2026-2027` |
| HocKy | Co | HK1, HK2, CaNam |
| MaLop | Khong | Neu bai gan voi mot lop cu the |
| Khoi | Khong | Dung khi bai ap dung cho ca khoi |
| NgayKiemTra | Khong | DD/MM/YYYY |
| DiemToiDa | Khong | Mac dinh 10 |
| HeSo | Khong | Mac dinh 1 |
| TrangThai | Co | active, draft, cancelled |
| GhiChu | Khong | Ghi chu ngan |
| CreatedAt | Khong | Timestamp |
| UpdatedAt | Khong | Timestamp |

### Quy uoc

```text
MaBai: BK-2026-HK1-GK1-12A_2K9_2026
LoaiDiem: GK1 | HK1 | GK2 | HK2 | TBM | KhaoSatNK
HocKy: HK1 | HK2 | CaNam
TrangThai: active | draft | cancelled
DiemToiDa: number, mac dinh 10
HeSo: number, mac dinh 1
NgayKiemTra: DD/MM/YYYY
```

### Ghi chu nghiep vu

- `TBM` co the la diem nhap tay trong giai doan dau.
- Khong tu tinh trung binh mon neu chua chot cong thuc.
- `KhaoSatNK` la diem noi bo cua Lop Toan NK, khong thay the diem tren truong.

---

## 4. Sheet `DiemSo`

### Muc dich

Luu diem cua tung hoc sinh trong tung bai kiem tra.

### Header

```text
MaDiem
MaBai
MaHS
MaLop
Diem
XepLoai
NhanXet
GhiChu
CreatedAt
UpdatedAt
```

### Y nghia cot

| Cot | Bat buoc | Ghi chu |
|---|---:|---|
| MaDiem | Co | Ma ban ghi diem, khong doi sau khi tao |
| MaBai | Co | Link sang `BaiKiemTra.MaBai` |
| MaHS | Co | Link sang `HocSinh.MaHS` |
| MaLop | Khong | Snapshot lop tai thoi diem ghi diem |
| Diem | Co | So diem |
| XepLoai | Khong | Gioi, Kha, TB, Yeu... neu can |
| NhanXet | Khong | Nhan xet ngan cho hoc sinh |
| GhiChu | Khong | Ghi chu noi bo |
| CreatedAt | Khong | Timestamp |
| UpdatedAt | Khong | Timestamp |

### Quy uoc

```text
MaDiem: DS-{MaBai}-{MaHS}
Diem: number tu 0 den DiemToiDa cua BaiKiemTra
MaHS: HS001/HS0001 theo chuan hien tai cua sheet
MaLop: lay tu DangKyLop active tai thoi diem ghi diem neu co
```

### Rang buoc

Moi cap sau nen la duy nhat:

```text
MaBai + MaHS
```

Neu update diem cua hoc sinh trong cung bai, Apps Script update dong cu, khong tao dong moi.

---

## 5. Contract `getData`

De tranh refactor lon frontend, `getData` co the tra them truong moi:

```js
{
  ok: true,
  hs: [],
  uCls: [],
  py: [],
  ex: [],
  logs: [],
  tv: [],
  scores: [],
  tests: [],
  summary: {}
}
```

Quy tac tuong thich:

- Neu sheet `BaiKiemTra` chua ton tai, tra `tests: []`.
- Neu sheet `DiemSo` chua ton tai, tra `scores: []`.
- Khong bo cac field cu `hs/uCls/py/ex/logs/tv/hl/summary`.
- Frontend cu khong dung `scores/tests` van chay binh thuong.

---

## 6. Shape frontend de xuat

### `tests`

Moi item:

```ts
{
  id: string;          // MaBai
  name: string;        // TenBai
  type: string;        // LoaiDiem
  schoolYear: string;  // NamHoc
  semester: string;    // HocKy
  classId?: string;    // MaLop
  grade?: string;      // Khoi
  date?: string;       // NgayKiemTra
  maxScore?: number;   // DiemToiDa
  coefficient?: number;// HeSo
  status?: string;     // TrangThai
  notes?: string;      // GhiChu
  createdAt?: string;
  updatedAt?: string;
}
```

### `scores`

Moi item:

```ts
{
  id: string;          // MaDiem
  testId: string;      // MaBai
  studentId: string;   // MaHS
  classId?: string;    // MaLop
  score: number;       // Diem
  rank?: string;       // XepLoai
  comment?: string;    // NhanXet
  notes?: string;      // GhiChu
  createdAt?: string;
  updatedAt?: string;

  // enrich de UI de hien thi, GAS co the join san:
  studentName?: string;
  className?: string;
  grade?: string;
  testName?: string;
  scoreType?: string;
  schoolYear?: string;
  semester?: string;
  testDate?: string;
  maxScore?: number;
}
```

---

## 7. Mapping Apps Script

### `BaiKiemTra -> tests`

```text
BaiKiemTra.MaBai       -> id
BaiKiemTra.TenBai      -> name
BaiKiemTra.LoaiDiem    -> type
BaiKiemTra.NamHoc      -> schoolYear
BaiKiemTra.HocKy       -> semester
BaiKiemTra.MaLop       -> classId
BaiKiemTra.Khoi        -> grade
BaiKiemTra.NgayKiemTra -> date
BaiKiemTra.DiemToiDa   -> maxScore
BaiKiemTra.HeSo        -> coefficient
BaiKiemTra.TrangThai   -> status
BaiKiemTra.GhiChu      -> notes
BaiKiemTra.CreatedAt   -> createdAt
BaiKiemTra.UpdatedAt   -> updatedAt
```

### `DiemSo -> scores`

```text
DiemSo.MaDiem   -> id
DiemSo.MaBai    -> testId
DiemSo.MaHS     -> studentId
DiemSo.MaLop    -> classId
DiemSo.Diem     -> score
DiemSo.XepLoai  -> rank
DiemSo.NhanXet  -> comment
DiemSo.GhiChu   -> notes
DiemSo.CreatedAt -> createdAt
DiemSo.UpdatedAt -> updatedAt
```

### Join enrich

Apps Script nen enrich them:

```text
studentName = HocSinh.HoTen theo MaHS
className   = LopHoc.TenLop theo MaLop
grade       = HocSinh.Khoi hoac LopHoc.Khoi
testName    = BaiKiemTra.TenBai
scoreType   = BaiKiemTra.LoaiDiem
schoolYear  = BaiKiemTra.NamHoc
semester    = BaiKiemTra.HocKy
testDate    = BaiKiemTra.NgayKiemTra
maxScore    = BaiKiemTra.DiemToiDa
```

---

## 8. Actions Apps Script moi

Them action moi, khong doi action cu.

```text
getScoreData
saveTest
updateTest
deleteTest
saveScore
updateScore
deleteScore
saveScoreBatch
```

### 8.1 `getScoreData`

Payload:

```json
{
  "action": "getScoreData",
  "schoolYear": "2026-2027",
  "classId": "12A_2K9_2026",
  "studentId": "HS001"
}
```

Tat ca field filter deu optional.

Response:

```json
{
  "ok": true,
  "tests": [],
  "scores": []
}
```

Ghi chu:

- Co the khong can action nay neu `getData` da tra `tests/scores`.
- Nhung action rieng huu ich khi du lieu diem sau nay lon.

### 8.2 `saveTest`

Payload:

```json
{
  "action": "saveTest",
  "data": {
    "name": "Khảo sát hàm số tháng 9",
    "type": "KhaoSatNK",
    "schoolYear": "2026-2027",
    "semester": "HK1",
    "classId": "12A_2K9_2026",
    "grade": "12",
    "date": "15/09/2026",
    "maxScore": 10,
    "coefficient": 1,
    "status": "active",
    "notes": ""
  }
}
```

Apps Script:

1. Sinh `MaBai` neu chua co.
2. Ghi vao `BaiKiemTra`.
3. Tra ve test da save theo shape frontend.

Response:

```json
{
  "ok": true,
  "test": {}
}
```

### 8.3 `updateTest`

Payload:

```json
{
  "action": "updateTest",
  "id": "BK-2026-HK1-KSNK-12A_2K9_2026",
  "data": {
    "name": "Khảo sát hàm số tháng 9",
    "date": "16/09/2026",
    "status": "active"
  }
}
```

Quy tac:

- Tim theo `MaBai`.
- Khong doi `MaBai`.
- Chi update field duoc gui.
- Update `UpdatedAt`.

### 8.4 `deleteTest`

Khuyen nghi phase 1: soft delete.

Payload:

```json
{
  "action": "deleteTest",
  "id": "BK-2026-HK1-KSNK-12A_2K9_2026"
}
```

Quy tac:

- Set `BaiKiemTra.TrangThai = cancelled`.
- Khong xoa `DiemSo` de tranh mat lich su.
- Frontend an bai cancelled mac dinh.

### 8.5 `saveScore`

Payload:

```json
{
  "action": "saveScore",
  "data": {
    "testId": "BK-2026-HK1-GK1-12A_2K9_2026",
    "studentId": "HS001",
    "classId": "12A_2K9_2026",
    "score": 8.5,
    "rank": "Giỏi",
    "comment": "Tiến bộ tốt",
    "notes": ""
  }
}
```

Apps Script:

1. Validate `testId` ton tai trong `BaiKiemTra`.
2. Validate `studentId` ton tai trong `HocSinh`.
3. Neu `classId` khong gui, lay tu `DangKyLop active`.
4. Validate `score` la number va trong khoang `0..DiemToiDa`.
5. Neu da ton tai `MaBai + MaHS`, update dong cu.
6. Neu chua co, sinh `MaDiem` va append dong moi.

Response:

```json
{
  "ok": true,
  "score": {}
}
```

### 8.6 `updateScore`

Payload:

```json
{
  "action": "updateScore",
  "id": "DS-BK-2026-HK1-GK1-12A_2K9_2026-HS001",
  "data": {
    "score": 9,
    "comment": "Sửa điểm sau khi rà lại bài"
  }
}
```

Quy tac:

- Tim theo `MaDiem`.
- Khong doi `MaDiem`.
- Neu update `score`, validate lai range.
- Update `UpdatedAt`.

### 8.7 `deleteScore`

Payload:

```json
{
  "action": "deleteScore",
  "id": "DS-BK-2026-HK1-GK1-12A_2K9_2026-HS001"
}
```

Quy tac phase 1:

- Co the xoa dong vat ly vi diem nhap sai co the nhap lai.
- Neu muon audit tot hon, them `TrangThai` vao `DiemSo` sau nay va soft delete.

### 8.8 `saveScoreBatch`

Dung cho nhap diem ca lop.

Payload:

```json
{
  "action": "saveScoreBatch",
  "testId": "BK-2026-HK1-KSNK-12A_2K9_2026",
  "classId": "12A_2K9_2026",
  "scores": [
    {
      "studentId": "HS001",
      "score": 8.5,
      "comment": ""
    },
    {
      "studentId": "HS002",
      "score": 7.25,
      "comment": "Cần luyện thêm hình học"
    }
  ]
}
```

Apps Script:

1. Validate `testId`.
2. Lay danh sach hoc sinh active trong `classId` tu `DangKyLop`.
3. Chi ghi diem cho hoc sinh hop le trong lop, tru khi payload co flag admin sau nay.
4. Upsert tung dong theo `MaBai + MaHS`.
5. Tra ve danh sach diem da save va danh sach loi neu co.

Response:

```json
{
  "ok": true,
  "saved": [],
  "errors": []
}
```

---

## 9. Validate du lieu

### Bat buoc

`BaiKiemTra`:

- `TenBai` khong rong.
- `LoaiDiem` nam trong danh sach cho phep.
- `NamHoc` khong rong.
- `HocKy` nam trong danh sach cho phep.
- `DiemToiDa` > 0 neu co.
- `HeSo` > 0 neu co.

`DiemSo`:

- `MaBai` ton tai.
- `MaHS` ton tai.
- `Diem` la number.
- `Diem >= 0`.
- `Diem <= DiemToiDa`.

### Khong bat buoc

- `MaLop` co the trong neu diem nhap theo hoc sinh ngoai lop.
- `XepLoai` co the de trong.
- `NhanXet/GhiChu` co the de trong.

---

## 10. Quy tac sinh ma

### MaBai

Khuyen nghi:

```text
BK-{NamHocShort}-{HocKy}-{LoaiDiem}-{MaLopOrKhoi}-{YYYYMMDD}
```

Vi du:

```text
BK-2627-HK1-GK1-12A_2K9_2026-20260915
BK-2627-HK1-KSNK-12-20260920
```

Neu trung, them suffix:

```text
-002
-003
```

### MaDiem

```text
DS-{MaBai}-{MaHS}
```

Vi du:

```text
DS-BK-2627-HK1-GK1-12A_2K9_2026-20260915-HS001
```

---

## 11. UI/bao cao se dung du lieu nhu the nao

### Man Diem so

Filter de xuat:

- Tim hoc sinh
- Lop
- Nam hoc
- Hoc ky
- Loai diem

Bang tong hop:

- Hoc sinh
- Lop
- GK1
- HK1
- GK2
- HK2
- TBM
- Khao sat NK gan nhat
- Thao tac

Luu y:

- Bang UI co the pivot tu schema dai.
- Neu co nhieu bai `KhaoSatNK`, cot bang chi hien diem moi nhat hoac trung binh, chi tiet xem trong modal.

### Chi tiet hoc sinh

Them section:

- Diem theo ky
- Diem khao sat NK
- Nhan xet gan nhat

### Bao cao

Co the them sau:

- Diem trung binh theo lop
- Ti le hoc sinh duoi nguong
- Hoc sinh tien bo/giam sut
- Phan bo diem theo lop/khoi

Khong can lam ngay trong phase schema/GAS.

---

## 12. Backward compatibility

Apps Script phai dam bao:

- Sheet moi chua co van `getData` khong loi.
- `tests` va `scores` mac dinh la mang rong.
- Khong thay doi shape cac truong cu.
- Khong doi ten action cu.
- Khong bat frontend phai doc truc tiep header Google Sheet.

---

## 13. Test contract toi thieu

Sau khi them schema/GAS:

1. Sheet chua co `BaiKiemTra/DiemSo` -> `getData` van `ok: true`.
2. Tao `BaiKiemTra` -> getData tra `tests` co bai moi.
3. Tao diem cho 1 hoc sinh -> getData tra `scores` co diem moi.
4. Update diem -> khong tao dong trung `MaBai + MaHS`.
5. Nhap batch diem cho 1 lop -> so dong `DiemSo` dung so hoc sinh hop le.
6. Diem > `DiemToiDa` -> Apps Script tra loi.
7. Xoa/cancel test -> UI mac dinh khong hien bai cancelled.
8. Xoa diem -> getData khong con diem do.
9. Hoc sinh/lop/hoc phi/diem danh van chay nhu cu.

---

## 14. Thu tu trien khai an toan

1. Tao 2 sheet moi: `BaiKiemTra`, `DiemSo`.
2. Cap nhat Apps Script helper doc sheet an toan: sheet thieu thi tra `[]`.
3. Them mapping `tests/scores` vao `getData`.
4. Them actions:
   - `saveTest`
   - `updateTest`
   - `deleteTest`
   - `saveScore`
   - `updateScore`
   - `deleteScore`
   - `saveScoreBatch`
5. Test Apps Script truc tiep bang payload JSON.
6. Sau khi GAS on, moi them frontend type/transform/handler.
7. Sau khi frontend on, moi them UI subtab `Diem so`.

---

## 15. Viec khong lam trong phase nay

- Khong them diem vao `HocSinh`.
- Khong sua `DiemDanh`.
- Khong sua `HocPhi`.
- Khong tinh trung binh mon tu dong neu chua chot cong thuc.
- Khong them bao cao phuc tap ngay.
- Khong them schema cho hoc lieu/LMS.
- Khong doi navigation neu chua code frontend phase sau.

