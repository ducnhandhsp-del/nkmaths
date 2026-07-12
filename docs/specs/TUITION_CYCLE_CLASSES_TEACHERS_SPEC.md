# Spec — Đồng bộ học phí chu kỳ tại Lớp và Giáo viên

## Mục tiêu

ClassesTab và TeachersTab dùng cùng trạng thái công nợ với Tổng quan, Học sinh và FinanceTab.

## Quy tắc

- Công nợ dùng `getTuitionCycleState`.
- `due` và `overdue` được tính là cần thu.
- `needs_review` được thống kê riêng, không cộng tự động vào công nợ.
- Doanh thu tháng dùng `NgayThu` qua `getPaymentReceiptPeriod`.
- Số học sinh đã thu trong tháng là số `studentId` duy nhất có phiếu dương trong tháng.
- Không dùng `ThangHP/NamHP` để tính doanh thu.

## ClassesTab

- Bảng lớp hiển thị số học sinh cần thu theo chu kỳ.
- Số tiền là doanh thu theo ngày phiếu thu của tháng hiện tại.
- Modal lớp hiển thị: sĩ số, cần thu, đã thu trong tháng, cần kiểm tra.
- Danh sách cần thu gồm `due + overdue`.

## TeachersTab

- Mỗi giáo viên hiển thị số học sinh cần thu thuộc các lớp phụ trách.
- Doanh thu lớp của giáo viên tính theo ngày phiếu thu.
- Modal giáo viên tách `Cần thu`, `Đã thu tháng`, `Thu học phí`.

## Ngoài phạm vi

- Không sửa ModalFinance.
- Không sửa ParentPortal.
- Không đổi schema/GAS/Google Sheets.

## Nghiệm thu

- Tổng cần thu theo các lớp/giáo viên không dùng công thức tháng cũ.
- Doanh thu lớp và giáo viên khớp Phiếu thu theo `NgayThu`.
- Một học sinh có nhiều phiếu trong tháng chỉ đếm một lần ở chỉ số đã thu.
- Test, lint và build đạt.
