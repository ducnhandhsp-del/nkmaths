# Spec: Module Điểm số

## Mục tiêu

Thêm nghiệp vụ theo dõi điểm học sinh cho LỚP TOÁN NK, tách khỏi logic điểm danh và học phí.

Module này chưa code trong bước hiện tại vì cần chốt schema Google Sheet và Apps Script trước.

## Vị trí trong app

`Vận hành` sẽ có 4 subtab:

1. Lịch dạy
2. Buổi học
3. Chuyên cần
4. Điểm số

Subtab `Điểm số` dùng để xem, nhập và theo dõi:

- Điểm GK1
- Điểm HK1
- Điểm GK2
- Điểm HK2
- Trung bình môn
- Điểm khảo sát riêng của lớp Toán NK

## Nguyên tắc nghiệp vụ

- Không trộn điểm số vào sheet điểm danh.
- Không dùng điểm số để tự động đổi trạng thái học sinh.
- Không ảnh hưởng công nợ, phiếu thu, phiếu chi.
- Không tính học phí dựa trên điểm.
- Mỗi điểm phải gắn được với `MaHS`.
- Nếu có thể, điểm nên gắn thêm `MaLop` để xem theo lớp.
- Dữ liệu cũ không có điểm vẫn phải chạy bình thường.

## Schema khuyến nghị

Nên dùng schema dạng dài để dễ mở rộng, không nên tạo quá nhiều cột cố định.

Sheet đề xuất: `DiemSo`

| Cột | Bắt buộc | Ghi chú |
| --- | --- | --- |
| MaDiem | Có | ID bản ghi điểm, ví dụ DS-202605-HS001-GK1 |
| MaHS | Có | Mã học sinh chuẩn HS001 |
| MaLop | Không | Lớp tại thời điểm ghi điểm |
| NamHoc | Có | Ví dụ 2026-2027 |
| HocKy | Có | HK1 hoặc HK2 |
| LoaiDiem | Có | GK1, HK1, GK2, HK2, TBM, KhaoSatNK |
| TenBai | Không | Tên bài khảo sát nếu là điểm NK |
| Diem | Có | Số điểm |
| HeSo | Không | Mặc định 1 nếu chưa dùng |
| NgayKiemTra | Không | DD/MM/YYYY |
| GhiChu | Không | Ghi chú ngắn |
| CreatedAt | Không | Timestamp |
| UpdatedAt | Không | Timestamp |

## Lý do chọn schema dạng dài

- Dễ thêm nhiều bài khảo sát NK trong năm.
- Không phải thêm cột mới mỗi lần có bài kiểm tra.
- Dễ lọc theo học sinh, lớp, kỳ, loại điểm.
- Dễ xuất báo cáo tiến bộ theo thời gian.

## Apps Script contract đề xuất

Chỉ thêm sau khi chốt schema:

- `getScores`
- `addScore`
- `updateScore`
- `deleteScore`

Payload `addScore/updateScore`:

```json
{
  "MaDiem": "DS-202605-HS001-GK1",
  "MaHS": "HS001",
  "MaLop": "12A_2K9_2026",
  "NamHoc": "2026-2027",
  "HocKy": "HK1",
  "LoaiDiem": "GK1",
  "TenBai": "",
  "Diem": 8.5,
  "HeSo": 1,
  "NgayKiemTra": "15/05/2026",
  "GhiChu": ""
}
```

## UI đề xuất

### Filter

- Tìm học sinh
- Lớp
- Năm học
- Học kỳ
- Loại điểm

### Bảng chính

Cột đề xuất:

- Học sinh
- Lớp
- GK1
- HK1
- GK2
- HK2
- TB môn
- Khảo sát NK
- Thao tác

Nếu dữ liệu khảo sát nhiều, cột `Khảo sát NK` chỉ hiển thị điểm mới nhất hoặc trung bình khảo sát, chi tiết nằm trong modal.

### Chi tiết học sinh

Trong chi tiết học sinh có thể thêm section `Điểm số`:

- Bảng điểm theo kỳ
- Biểu đồ nhỏ xu hướng điểm nếu có đủ dữ liệu
- Danh sách bài khảo sát NK

## Quy tắc tính toán

Giai đoạn đầu nên chỉ hiển thị dữ liệu đã nhập.

Nếu cần tính TB môn:

- Không tự tính nếu chưa chốt công thức.
- Có thể nhập `TBM` thủ công.
- Công thức tự động là phase sau.

## Rủi ro cần tránh

- Không thêm `DiemGK1`, `DiemHK1` trực tiếp vào sheet `HocSinh`.
- Không đổi schema `HocSinh`, `LopHoc`, `DiemDanh`, `HocPhi`.
- Không dùng điểm khảo sát NK thay cho điểm học kỳ trường.
- Không tự động sinh báo cáo điểm nếu chưa có đủ dữ liệu.

## Thứ tự triển khai đề xuất

1. Chốt sheet `DiemSo` và headers.
2. Bổ sung Apps Script `getScores/addScore/updateScore/deleteScore`.
3. Thêm type `ScoreRecord`.
4. Bổ sung transform trong `useAppData`.
5. Bổ sung handler trong `useDomains`.
6. Thêm subtab `Vận hành > Điểm số`.
7. Thêm modal nhập/sửa điểm.
8. Bổ sung báo cáo điểm trong module `Báo cáo` nếu cần.

