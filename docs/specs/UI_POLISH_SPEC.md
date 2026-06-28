# UI_POLISH_SPEC.md

## Mục tiêu

Chuẩn hóa các trạng thái giao diện dùng lặp lại trong app quản lý Lớp Toán NK. Spec này là checklist cho các lần cleanup UI nhỏ, không đổi schema, không đổi Apps Script và không đổi nghiệp vụ.

## Empty state

- Empty state phải có thông điệp chính ngắn, dễ hiểu theo nghiệp vụ.
- Có dòng phụ hướng người dùng tới thao tác tiếp theo nếu phù hợp.
- Không dùng icon/emoji rời rạc quá nhiều kiểu; ưu tiên icon từ `lucide-react` hoặc style có sẵn.
- Không để ô trống cao quá mức khi không có dữ liệu.
- Text mẫu:
  - `Chưa có dữ liệu.`
  - `Không có việc cần xử lý.`
  - `Chưa có buổi học nào được ghi nhận.`

## Loading state

- Khi toàn app đang tải dữ liệu ban đầu, dùng `LoadingScreen`.
- Khi modal/form đang lưu, dùng prop `isSaving`/`loading` sẵn có trên button.
- Không tạo spinner mới nếu `Button` hoặc component hiện có đã hỗ trợ loading.
- Không cho người dùng bấm lưu/xóa lặp khi đang saving.

## Toast thông báo

- Thêm/sửa/xóa thành công phải dùng toast hiện có trong domain layer nếu đã có.
- UI component không tự tạo toast trùng nếu handler trong `useDomains.ts` đã toast.
- Toast phải ngắn, nêu đúng đối tượng: học sinh, lớp, giáo viên, phiếu thu, phiếu chi, buổi học.

## Confirm trước khi xóa

- Mọi hành động xóa dữ liệu thật phải đi qua `DeleteModal` hoặc `ConfirmDialog`.
- Text confirm phải nêu rõ đối tượng bị xóa.
- Không xóa trực tiếp từ row action nếu chưa có confirm.
- Nút xóa dùng tone danger/rose, nút hủy dùng neutral.

## Badge trạng thái

- Dùng `Badge` hoặc `StatusBadge` thống nhất theo nghĩa màu:
  - `emerald/success`: đang học, đang dạy, đã đóng, đã ghi.
  - `amber/warning`: có phép, nghỉ phép, cần chú ý.
  - `rose/danger`: vắng, chưa đóng, thiếu dữ liệu quan trọng.
  - `slate/neutral`: đã nghỉ, không hoạt động, không có dữ liệu.
  - `indigo/primary`: mã lớp, mã học sinh, thông tin định danh.
- Không dùng màu đỏ cho thông tin bình thường.

## Format tiền Việt Nam

- Luôn dùng helper `fmtVND` cho số tiền đầy đủ.
- Dùng `fmtM` cho KPI/card cần hiển thị gọn.
- Không tự format tiền bằng string thủ công trong component mới.
- Tiền âm/dương trong báo cáo phải có màu theo nghĩa: thu xanh, chi đỏ/rose, lợi nhuận dương indigo/green, âm warning.

## Format ngày/tháng

- Luôn dùng `formatDate` để hiển thị ngày.
- Luôn dùng `parseDMY` khi cần so sánh/tính toán ngày từ dữ liệu Sheet/GAS.
- Không parse ngày thủ công nếu helper hiện có xử lý được.
- Text kỳ tháng nên thống nhất dạng `T{tháng}/{năm}`, ví dụ `T5/2026`.
