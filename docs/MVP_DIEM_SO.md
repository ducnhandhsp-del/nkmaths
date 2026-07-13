# MVP Spec — Tab Điểm số

## 1. Mục tiêu

Tab Điểm số phục vụ ba công việc vận hành của trung tâm:

1. Tạo bài kiểm tra và nhập điểm hàng loạt theo lớp.
2. Tra cứu sổ điểm lớp/học sinh trên cùng một thang quy đổi.
3. Phát hiện học sinh cần hỗ trợ từ dữ liệu đã chốt.

MVP không phải LMS: không quản lý đề, đáp án, học liệu hoặc chấm bài trực tuyến.

## 2. Kết luận audit và điểm nghẽn

### 2.1. Điểm nghẽn đã xử lý trong thiết kế

- **Điểm 0 khác vắng và chưa nhập:** `scored`, `absent`, `exempt` là trạng thái đã lưu; dòng chưa có kết quả không được lưu.
- **Khác thang điểm:** luôn lưu điểm gốc và điểm tối đa; phân tích dùng `score / maxScore * 10`.
- **Sai số do dữ liệu chưa hoàn tất:** chỉ bài `finalized` được đưa vào sổ điểm trung bình, xu hướng và cảnh báo.
- **Sửa điểm không kiểm soát:** bài đã chốt bị khóa; phải mở lại trước khi sửa và cập nhật `UpdatedAt`.
- **Học sinh chuyển/nghỉ lớp:** danh sách nhập lấy học sinh thuộc lớp và hoạt động tại ngày kiểm tra; kết quả đã tồn tại luôn được giữ lại để bảo toàn lịch sử.
- **Thi lại:** MVP tạo một bài kiểm tra mới; không ghi đè hoặc tự chọn điểm chính thức.
- **Tải dữ liệu lõi:** Điểm số dùng domain/hook riêng, không mở rộng `useAppData` và `useDomains`.

### 2.2. Giới hạn cần chấp nhận trong MVP

- Chưa có phân quyền giáo viên theo lớp.
- Chưa gửi kết quả cho phụ huynh.
- Chưa có quy tắc tự động thay thế điểm thi lại.
- Chưa phân tích theo kỹ năng nhỏ; `ChuyenDe` là một nhãn văn bản trên bài kiểm tra.
- Danh sách phải hoàn tất trước khi chốt được frontend gửi lên server; server kiểm tra lại toàn bộ ID được yêu cầu.
- Roster lịch sử được dựng từ `DangKyLop` theo `NgayVao–NgayRa`; nếu dữ liệu đăng ký cũ bị thiếu, frontend mới fallback về lớp hiện tại.

## 3. Kiến trúc thông tin

Màn hình `Điểm số` có ba subtab:

- **Bài kiểm tra:** danh sách bài, tạo/sửa, nhập điểm, lưu nháp, chốt/mở lại.
- **Sổ điểm:** ma trận các bài đã chốt theo lớp và hồ sơ kết quả từng học sinh.
- **Tiến bộ & Cảnh báo:** danh sách ưu tiên xử lý, không thay thế màn Báo cáo.

Desktop dùng bảng làm trung tâm. Mobile dùng record card và giữ đủ hành động tương ứng.

## 4. Mô hình dữ liệu

### `BaiKiemTra`

`MaBaiKT`, `TenBaiKT`, `MaLop`, `MaBuoi`, `NgayKiemTra`, `LoaiBaiKT`, `ChuyenDe`, `DiemToiDa`, `TrongSo`, `MaGV`, `TrangThai`, `GhiChu`, `CreatedAt`, `UpdatedAt`.

Trạng thái: `draft | entering | finalized`.

### `KetQuaDiem`

`MaKetQua`, `MaBaiKT`, `MaHS`, `Diem`, `TrangThai`, `NhanXet`, `CreatedAt`, `UpdatedAt`.

Trạng thái: `scored | absent | exempt`.

## 5. Quy tắc nghiệp vụ

- `DiemToiDa > 0`, `TrongSo > 0`.
- Kết quả `scored` bắt buộc có điểm từ 0 đến `DiemToiDa`.
- `absent` và `exempt` không có giá trị điểm, không tham gia trung bình.
- Lưu nháp thay toàn bộ kết quả của bài bằng snapshot form hiện tại; dòng chưa nhập bị loại khỏi snapshot.
- Chốt điểm là một thao tác atomic: server tự dựng lại roster lịch sử, kiểm tra danh sách bắt buộc, lưu snapshot, rồi đổi trạng thái bài thành `finalized`.
- Không sửa hoặc xóa bài `finalized`; phải mở lại trước.
- Trung bình học sinh là trung bình có trọng số của các kết quả `scored` thuộc bài `finalized`.
- Xu hướng chỉ kết luận khi có ít nhất 3 điểm; giảm khi ba điểm gần nhất giảm liên tiếp.
- Cảnh báo MVP gồm: trung bình dưới 5, giảm 3 bài liên tiếp, hoặc vắng từ 2 bài đã chốt.

## 6. API GAS

- `getScores`
- `saveAssessment`
- `updateAssessment`
- `deleteAssessment`
- `saveScores` (`finalize: true` để chốt atomic)
- `reopenAssessment`

Mọi write action dùng idempotency flow hiện có.

## 7. Acceptance criteria

- Tạo bài kiểm tra hợp lệ cho một lớp.
- Nhập điểm 0 hợp lệ và không bị hiểu là chưa nhập.
- Lưu nháp khi còn dòng chưa nhập.
- Không thể chốt khi còn học sinh chưa có trạng thái.
- Bài đã chốt xuất hiện trong Sổ điểm và Cảnh báo.
- Không thể sửa/xóa bài đã chốt trước khi mở lại.
- Học sinh nghỉ/chuyển lớp vẫn giữ kết quả cũ.
- Desktop và mobile đều tạo bài, nhập điểm và xem sổ điểm được.
- `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run gas:check` đều pass.
