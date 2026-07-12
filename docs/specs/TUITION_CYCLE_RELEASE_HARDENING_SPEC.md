# Spec release hardening — Học phí theo chu kỳ

## 1. Phạm vi release

Chốt luồng nghiệp vụ học phí trên bốn màn vận hành chính:

- Tổng quan;
- Học sinh;
- Công nợ/Phiếu thu;
- Báo cáo.

Không đổi schema, GAS contract hoặc Google Sheets headers.

## 2. Công thức chuẩn

- Chu kỳ mục tiêu lấy theo lịch lớp: 4/8/12 buổi.
- Bắt đầu cần thu tại 50% chu kỳ: 2/4, 4/8, 6/12.
- `not_due`: chưa tới mốc bắt đầu thu.
- `due`: từ mốc bắt đầu thu đến hết target; nhãn người dùng là **Cần thu**.
- `overdue`: vượt target mà chưa có phiếu thu mới.
- Phiếu thu dương gần nhất đóng chu kỳ; buổi sau ngày thu mở chu kỳ mới.
- `needs_review` không tự động cộng vào công nợ.
- `not_started` dùng cho ảnh chụp lịch sử trước ngày nhập học.

## 3. Audit logic cũ

### Đã loại bỏ khỏi luồng chính

- Tính `Nợ x tháng` trong StudentsTab.
- Dùng `isPaid` để tính chỉ số Đã thu theo lớp trong ReportsTab.
- Nhãn `Tới hạn` ở Finance/Overview.

### Được giữ có chủ đích

- `getMonthlyTuitionState`, `isPaid`, `isStudentBillableInMonth` vẫn được giữ cho màn/modal cũ có báo cáo tháng rõ ràng, portal tương thích và các aggregation chưa nằm trong release này.
- Các helper cũ không được dùng để tính KPI công nợ trên Tổng quan, Học sinh, Finance hoặc Reports.

## 4. Quy tắc hiển thị

- Tổng quan: `Học phí cần thu`.
- Học sinh: hiển thị trạng thái chu kỳ và tiến độ, không hiển thị nợ theo số tháng.
- Finance: trạng thái `Cần thu`; chỉ hiển thị tiến độ `đã học/target`, không lặp lại mốc thu trên từng dòng.
- Reports: doanh thu theo `NgayThu`; công nợ theo snapshot chu kỳ.
- Tháng lịch sử không cho thao tác thu phí.

## 5. Test hồi quy bắt buộc

- 3/8 chưa cần thu; 4/8 cần thu; 8/8 cần thu; 9/8 quá hạn.
- Đóng phí rồi học tiếp phải bắt đầu chu kỳ mới.
- Học bù khác lớp được tính một lần theo `MaBuoi + MaHS`.
- Nghỉ giữa chu kỳ chuyển `needs_review`.
- Snapshot trước `startDate` trả `not_started` và 0 đồng.
- Phiếu sau ngày snapshot không đóng công nợ lịch sử.
- Số học sinh đã thu theo lớp được đếm duy nhất theo studentId và ngày phiếu thu.

## 6. Checklist release

- [x] Tổng quan và Finance có cùng số học sinh cần thu và tổng tiền.
- [x] Học sinh và Finance có cùng trạng thái chu kỳ cho cùng học sinh.
- [x] Reports và Phiếu thu có cùng số phiếu/tổng tiền theo `NgayThu`.
- [x] Tổng `Đã thu x/y` theo lớp bằng số học sinh duy nhất có phiếu trong tháng.
- [x] Công nợ lịch sử trước `startDate` hiển thị `Chưa nhập học tại kỳ này`.
- [x] Tháng lịch sử không có nút Thu phí/Zalo nhắc phí.
- [x] Không có nhãn `Nợ x tháng` hoặc `Tới hạn` trong luồng chính.
- [x] `npm.cmd run test:domain` đạt.
- [x] `npm.cmd run lint` đạt.
- [x] `npm.cmd run build` đạt.

### QA KPI Công nợ — 11/07/2026

- [x] `Cần kiểm tra`: 3/3 hồ sơ; bấm lại trả về 82 hồ sơ.
- [x] `Đã thu trong tháng`: 20 học sinh có phiếu theo ngày thu.
- [x] `Cần thu`: 49 học sinh, 29,4 triệu đồng.
- [x] `Quá hạn`: 0 học sinh, trạng thái rỗng đúng.
- [x] Chuyển tháng tự động xóa bộ lọc KPI đang chọn.
- [x] Console Chrome không có lỗi/cảnh báo.

## 7. Rủi ro còn lại

- Snapshot lịch sử vẫn là dữ liệu tái dựng, không bất biến.
- Lịch lớp và `baseTuition` chưa có version lịch sử.
- Phiếu thiếu/sai studentId không thể gắn chính xác vào thống kê theo lớp.
- Các báo cáo tháng legacy ngoài bốn màn chính cần được chuyển ở release riêng nếu tiếp tục sử dụng.
