# Spec — Chu kỳ học phí trong ModalFinance và Parent Portal

## Mục tiêu

- Modal chi tiết tài chính và Parent Portal dùng cùng trạng thái `getTuitionCycleState` với Công nợ.
- Doanh thu và lịch sử phiếu thu tiếp tục dùng `NgayThu`.
- `thangHP/namHP` được giữ làm metadata tương thích, không quyết định trạng thái công nợ.

## ModalFinance

### Phiếu thu

- Cho phép hai chu kỳ được thu trong cùng một tháng.
- Chỉ cảnh báo khả năng ghi trùng khi học sinh đang ở trạng thái `paid`: đã có phiếu gần nhất và chưa phát sinh buổi có mặt sau phiếu đó.
- Nếu chu kỳ là `due` hoặc `overdue`, không cảnh báo trùng chỉ vì đã có phiếu cùng `thangHP/namHP`.
- Biên lai vẫn lưu và hiển thị kỳ phí để tương thích dữ liệu cũ.

### Chi tiết tài chính

- Bỏ kết luận `đã đóng x/y tháng` và `còn thiếu n tháng`.
- Hiển thị trạng thái chu kỳ, tiến độ buổi, ngưỡng bắt đầu thu, số cần thu và phiếu gần nhất.
- Lịch sử phiếu thu sắp xếp và tổng hợp theo `NgayThu`; kỳ phí chỉ là thông tin tham chiếu.

## Parent Portal

- GAS public chỉ bổ sung dữ liệu tối thiểu: `tuitionCycle.target` và `tuitionCycle.collectionThreshold`.
- Không trả thêm dữ liệu học sinh khác hoặc dữ liệu quản trị.
- Frontend dựng trạng thái chu kỳ từ học sinh, phiếu thu, chuyên cần và chỉ tiêu chu kỳ.
- Hiển thị `Cần thu`, `Quá hạn`, `Đã thu`, `Chưa đến hạn`, `Cần kiểm tra`, `Chưa có lịch` theo helper chung.
- Lịch sử phiếu thu dùng ngày phiếu; `thangHP/namHP` chỉ là metadata.

## Ngoài phạm vi

- Không đổi header Google Sheets hoặc schema bản ghi phiếu thu.
- Không đổi cách tính doanh thu theo ngày phiếu.
- Không mở rộng quyền truy cập của action public `lookupStudentPortal`.

## Nghiệm thu

- Hai phiếu hợp lệ của hai chu kỳ trong cùng tháng không bị chặn bởi cảnh báo tháng cũ.
- Modal tài chính khớp trạng thái Công nợ của cùng học sinh.
- Parent Portal khớp tiến độ và trạng thái chu kỳ của admin.
- `test:domain`, `lint`, `build`, `build:portal` và kiểm tra GAS đạt.
