# Thuê phòng — UX vận hành đồng đều desktop/mobile

## Mục tiêu

Tối ưu thao tác hằng ngày trên phân hệ Thuê phòng mà không đổi dữ liệu, API GAS hay quy tắc tiền thuê V2. Desktop ưu tiên quét bảng/lịch; mobile ưu tiên thẻ gọn nhưng có cùng thao tác.

## Điều chỉnh giao diện

1. **Sub-tab mobile**: sáu sub-tab nằm trên một hàng cuộn ngang. Không xuống dòng, không tăng chiều cao toolbar. Tab đang chọn vẫn có màu và viền trạng thái của `ToolbarTabs` hiện có.
2. **Lịch phòng desktop**: nhóm ca theo ngày. Mỗi nhóm hiển thị ngày, số ca, rồi các dòng giờ–khách–trạng thái thanh toán cùng nút Thu tiền/Sửa. Mobile giữ `MobileCard`.
3. **Bộ lọc lịch**: nằm sát dữ liệu, gồm từ khóa, trạng thái và phạm vi `Hôm nay` / `7 ngày tới` / `Tháng này` / `Tất cả`.
4. **KPI theo ngữ cảnh**:
   - Lịch phòng/Ca thuê: số ca, phải thu, đã thu, còn phải thu theo phạm vi vận hành đang chọn.
   - Báo cáo: các KPI theo tháng chọn.
5. **Thao tác ca thuê**:
   - Modal thêm/sửa có trạng thái `Đã xác nhận` hoặc `Hoàn thành`.
   - Hủy riêng một ca giữ nguyên giao dịch đã thu.
   - Với ca thuộc lịch lặp, có nút `Hủy chuỗi`; chỉ hủy những ca chưa diễn ra theo logic GAS hiện có và yêu cầu xác nhận trước.

## Ràng buộc

- Không thay đổi Google Sheets headers, payload API hoặc nghiệp vụ chống trùng/chống thu vượt.
- Không dùng UI system mới; tái sử dụng `PageToolbar`, `ToolbarTabs`, `DataTable`, `MobileCard`, `Button`, `Select` và `StatusBadge`.
- Hành động trên mobile tương đương desktop: Thu tiền, Sửa, Hủy, Hủy chuỗi (nếu có).

## Tiêu chí nghiệm thu

- Ở màn hình 390px, sub-tab chỉ một dòng và cuộn ngang được.
- Lịch desktop không còn lưới thẻ ba cột; các ca được quét theo từng ngày.
- Có thể đánh dấu hoàn thành trực tiếp từ modal sửa ca.
- Hủy chuỗi hiện diện cho ca có `seriesId`, có xác nhận và gọi đúng `onCancelSeries`.
- Thay đổi bộ lọc thời gian cập nhật cả danh sách lịch lẫn KPI vận hành.
