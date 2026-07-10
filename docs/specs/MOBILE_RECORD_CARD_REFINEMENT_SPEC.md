# Mobile Record Card Refinement Spec

## Mục tiêu

Tinh chỉnh card mobile sau khi đã thống nhất `MobileRecordList/Row`, để thứ tự thông tin và thao tác khớp nghiệp vụ thực tế hơn. Chỉ chỉnh UI/action mobile, không đổi schema, không đổi logic tính học phí, doanh thu, điểm danh.

## Nguyên tắc chung

- Không lặp thông tin trong cùng một card nếu đã có ở marker/metric.
- Action icon phải đồng bộ kích thước 32x32; Zalo dùng mark vuông nhỏ, không dùng viên chữ dài.
- Các thao tác quyết định nhanh như `Ghi`, `Nghỉ`, `Xem`, `Sửa` có thể dùng nút chữ ngắn.
- Desktop table giữ nguyên.

## Công nợ

Hiện trạng: nút Zalo chỉ copy tin nhắn, chưa mở Zalo theo số điện thoại.

Yêu cầu:

- Nút Zalo chỉ hiện khi có SĐT hợp lệ.
- Bấm Zalo phải copy nội dung nhắc phí và mở `https://zalo.me/{phone}`.
- Nút thu phí giữ nguyên mở form phiếu thu.
- Card giữ thứ tự: tên học sinh, kỳ phí + số buổi, trạng thái, số tiền, action.

## Học sinh

Yêu cầu:

- Zalo chỉ là icon action gọn, không bọc thêm visual rườm rà.
- Zalo và phiếu thu cùng kích thước/căn giữa.

## Lớp học

Hiện trạng: marker đã ghi lớp nhưng title cũng là lớp, gây lặp.

Layout mới:

- Marker: mã lớp hoặc ký hiệu lớp.
- Title: lịch học + cơ sở.
- Right: số học sinh.
- Meta: giáo viên + học phí tháng.
- Action: `Ghi` nếu lớp có lịch.

## Lịch dạy

Hiện trạng: còn chip trạng thái như `Có thể ghi`, chiếm diện tích.

Layout mới:

- Marker: mã lớp.
- Title: thứ + ngày.
- Right: giờ học.
- Meta: cơ sở.
- Note: giáo viên.
- Action: `Ghi`, `Nghỉ`, `Xem`, hoặc `Không ghi`.

## Buổi học

Hiện trạng: chip `Đã điểm danh`/trạng thái làm mất chỗ cho nội dung.

Layout mới:

- Marker: mã lớp.
- Title: thứ + ngày.
- Right: tỷ lệ có mặt/tổng số học sinh.
- Meta: nội dung bài học.
- Note: BTVN.
- Nếu là buổi nghỉ: meta/note hiển thị lý do nghỉ phù hợp.

## Chuyên cần

Giữ cấu trúc hiện tại:

- Marker: lớp.
- Title: tên học sinh.
- Right: tỷ lệ chuyên cần.
- Meta: số vắng/có phép.
- Note: cảnh báo.
- Action: Zalo icon nếu có SĐT.

## Kiểm thử

- `npm.cmd run lint`
- `npm.cmd run build`
- Kiểm tra mobile các màn: Học sinh, Lớp học, Công nợ, Phiếu thu, Phiếu chi, Lịch dạy, Buổi học, Chuyên cần.
