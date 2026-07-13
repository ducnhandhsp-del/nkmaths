# Thuê phòng V2 — đặc tả nghiệp vụ

## 1. Mục tiêu và phạm vi

Thuê phòng là phân hệ độc lập để vận hành một phòng học cho thuê. Dữ liệu, báo cáo và dòng tiền của phân hệ **không** đi vào học phí, thu chi, công nợ học sinh hoặc báo cáo tài chính của trung tâm.

V2 quản lý toàn bộ vòng đời: khách thuê → lịch một lần/lặp → ca thuê → thu tiền/hoàn tiền → hủy và báo cáo. Không lưu CCCD, địa chỉ hoặc dữ liệu nhạy cảm không cần thiết; hồ sơ khách chỉ gồm tên, số điện thoại và ghi chú nghiệp vụ.

Mặc định hiện có một phòng tên `Phòng học`; trường `Phòng` được lưu sẵn để có thể thêm phòng sau này mà không đổi cấu trúc.

## 2. Mô hình dữ liệu

| Bảng | Vai trò | Khóa và trường chính |
| --- | --- | --- |
| `KhachThuePhong` | Danh bạ khách thuê | `MaKhachThue`, họ tên, SĐT, trạng thái, ghi chú |
| `LichThuePhongSeries` | Thông tin điều phối của một lịch lặp | `MaLichThue`, khách thuê, phòng, khoảng hiệu lực, quy tắc lặp, giá mặc định, trạng thái |
| `LichThuePhong` | Một ca thuê có ngày và giờ cụ thể | `MaCaThue`, `MaLichThue`, `MaKhachThue`, phòng, ngày, giờ, đơn giá, trạng thái |
| `ThuThuePhong` | Sổ giao dịch bất biến | `MaThuThue`, `MaCaThue`, ngày, số tiền có dấu, loại giao dịch, hình thức, ghi chú |
| `BangGiaThuePhong` | Bảng giá gợi ý khi tạo ca | mã, tên, điều hòa, đơn giá, thời lượng, trạng thái, thứ tự |

Việc bổ sung cột dùng cơ chế migration headers sẵn có của GAS; các dữ liệu V1 cũ vẫn đọc được nhờ fallback từ tên/SĐT trực tiếp trên ca thuê.

## 3. Trạng thái và quy tắc

### Ca thuê

- `confirmed`: đang giữ phòng, được tính phải thu.
- `completed`: đã diễn ra, được tính phải thu.
- `cancelled`: đã hủy, không chặn lịch và không tính phải thu.

Không xóa ca thuê hoặc giao dịch đã phát sinh. Hủy giữ nguyên lịch sử; nếu đã thu tiền thì hoàn tiền bằng giao dịch riêng.

### Tiền thuê

- `collection`: số tiền dương, là tiền nhận từ khách.
- `refund`: số tiền âm, là tiền trả lại khách.
- Tổng đã thu ròng = tổng tất cả giao dịch của ca.
- Còn phải thu = `max(đơn giá − đã thu ròng, 0)`.
- Hệ thống chặn thu khiến tổng ròng vượt đơn giá và chặn hoàn vượt số đã thu ròng. Giao dịch không bị sửa/xóa trong V2 để giữ sổ đối soát.

### Chống trùng và lịch lặp

- Một ca hợp lệ có giờ bắt đầu/kết thúc chuẩn `HH:mm`, kết thúc sau bắt đầu.
- Hai ca cùng phòng, cùng ngày, chưa hủy không được giao nhau theo khoảng thời gian.
- Tạo lịch lặp kiểm tra toàn bộ ngày dự kiến, bao gồm xung đột nội bộ trong chính lần gửi. Nếu chỉ một ngày lỗi thì không tạo bất kỳ ca nào.
- Chỉnh một ca chỉ tác động ca đó. Hủy chuỗi là thao tác có chủ đích và chỉ hủy những ca chưa diễn ra/chưa hoàn thành; các ca cũ vẫn giữ lịch sử.

## 4. Màn hình V2

1. **Tổng quan**: KPI tháng chọn (phải thu, đã thu ròng, còn phải thu, số ca), ca sắp diễn ra và nút tạo lịch/ghi thu.
2. **Lịch phòng**: lịch theo tuần, khung giờ cố định gợi ý và giờ tự do; tạo ca lẻ hoặc lịch lặp an toàn.
3. **Ca thuê**: danh sách, lọc thời gian/trạng thái/khách, chỉnh ca, hoàn thành/hủy, mở thu tiền.
4. **Khách thuê**: danh bạ gọn, tìm theo tên/SĐT, xem số ca và số dư còn phải thu.
5. **Thu tiền**: sổ giao dịch theo thời gian; ghi thu hoặc hoàn tiền từ ca thuê, đối chiếu bằng hình thức tiền mặt/chuyển khoản.
6. **Báo cáo**: tháng chọn, doanh thu thuê phòng riêng, công nợ chỉ tính ca đến hôm nay, phân tích theo khách.
7. **Bảng giá**: quản lý các mức giá gợi ý; mặc định có 60.000đ/90 phút không điều hòa và 70.000đ/90 phút có điều hòa.

Desktop ưu tiên bảng và bộ lọc sát dữ liệu. Mobile dùng thẻ ca/giao dịch, nhưng vẫn có đủ thao tác chính; thanh điều hướng chính có 6 mục căn đều.

## 5. API GAS

`getRoomRental` trả `bookings`, `payments`, `customers`, `series`, `pricePlans`.

Các ghi nhận:

- `saveRentalBooking`, `updateRentalBooking`, `cancelRentalBooking`, `cancelRentalSeries`
- `saveRentalPayment`
- `saveRentalCustomer`, `updateRentalCustomer`
- `saveRentalPricePlan`, `updateRentalPricePlan`

Mọi action tiếp tục đi qua admin token/idempotency hiện có. V2 không gọi `deleteRentalBooking`; action cũ được đổi thành hủy an toàn để tránh mất lịch sử.

## 6. Tiêu chí nghiệm thu

- Tạo một lịch lặp có ngày trùng phải thất bại toàn bộ, không để lại ca dở.
- Thu 70.000đ cho ca 70.000đ rồi thu thêm phải bị chặn; hoàn 20.000đ thì còn phải thu 20.000đ.
- Hủy ca đã thu không xóa giao dịch; người dùng có thể ghi hoàn tiền riêng.
- Báo cáo thuê phòng chỉ đọc các bảng thuê phòng, không thay đổi bất kỳ chỉ số học phí/thu chi nào.
- Dữ liệu V1 không mất khi GAS bổ sung cột mới.
