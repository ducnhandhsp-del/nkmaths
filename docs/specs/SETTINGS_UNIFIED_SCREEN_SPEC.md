# Settings Unified Screen Spec

## Mục tiêu

Tab Cài đặt là nơi cấu hình vận hành cục bộ của ứng dụng: học phí, tài khoản nhận tiền, mẫu Zalo và công cụ dữ liệu. Màn hình phải gọn, dễ quét và không hiển thị thông tin trung tâm/cơ sở/người quản lý không còn cần thao tác.

Thay đổi này không sửa Google Apps Script contract, Google Sheets headers, schema domain hay quy tắc tính học phí/công nợ.

## Phạm vi giao diện

1. Thanh điều khiển đầu trang
   - Hiển thị tình trạng đồng bộ bằng một trạng thái duy nhất.
   - Hiển thị lỗi cấu hình cụ thể khi có.
   - Chỉ có một nút `Tải lại dữ liệu` và một nút `Lưu thay đổi`.

2. Học phí & thanh toán
   - Học phí mặc định, niên khóa và hạn đóng.
   - Bank ID, số tài khoản, tên tài khoản và xem thử VietQR.
   - Hướng dẫn chu kỳ 2/3 buổi ở dạng dòng hỗ trợ ngắn, không dùng card trang trí lồng nhau.

3. Mẫu tin nhắn Zalo
   - Desktop: danh sách mẫu và trình soạn thảo ở hai cột.
   - Mobile: một cột, không mất thao tác thêm/sửa/xóa/chèn biến.
   - Xem trước là thao tác tùy chọn, không chiếm diện tích cố định.

4. Hệ thống nâng cao
   - Mặc định thu gọn.
   - Bao gồm tải lại dữ liệu, cache offline và reset cài đặt trình duyệt.
   - Các thao tác phá hủy luôn dùng confirm hiện có.

## Loại bỏ khỏi giao diện

- Hai cơ sở/người quản lý và các trường địa chỉ/liên hệ tương ứng.
- Google Sheet/Google Doc shortcut chỉ lưu local nhưng không tham gia nghiệp vụ.
- Nút tải dữ liệu và xóa cache trùng lặp.
- Nhãn trang trí dưới preview Zalo.

## Tương thích dữ liệu

- Các key localStorage cũ như `teacher`, `teacherList`, `addr1`, `addr2`, `phone` vẫn được giữ nguyên khi lưu cài đặt mới để tránh mất dữ liệu lịch sử.
- `centerName` tiếp tục phục vụ biên lai thu/chi; không còn được chỉnh từ màn hình này.
- `teacherList` tiếp tục phục vụ chuẩn hóa tên giáo viên trong dữ liệu cũ; chưa chuyển thành cấu hình UI trong phạm vi này.

## Acceptance criteria

- Không còn section Thông tin trung tâm/cơ sở/người quản lý.
- Mỗi thao tác tải dữ liệu và xóa cache chỉ xuất hiện một lần.
- Có thể lưu học phí, niên khóa, hạn đóng, ngân hàng và mẫu Zalo như trước.
- Dữ liệu localStorage cũ không bị xóa khi bấm lưu.
- Desktop và mobile đều không tràn ngang.
- `npm.cmd run lint` và `npm.cmd run build` đạt.
