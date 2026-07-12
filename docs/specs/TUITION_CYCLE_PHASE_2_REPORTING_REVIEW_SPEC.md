# Spec giai đoạn 2 — Đối soát và báo cáo học phí theo chu kỳ

## 1. Mục tiêu

Hoàn thiện cách vận hành sau khi Công nợ và Tổng quan đã dùng `getTuitionCycleState`:

- Tách khoản **phải thu thật** khỏi hồ sơ **cần kiểm tra thủ công**.
- Tách rõ báo cáo **dòng tiền theo ngày thu** và **công nợ tại thời điểm hiện tại**.
- Cho phép xuất CSV để đối chiếu lại với dữ liệu Google Sheets mà không đổi schema.

## 2. Hai trục báo cáo độc lập

### 2.1. Dòng tiền

- Phiếu thu được xếp tháng/năm bằng `NgayThu` qua `getPaymentReceiptPeriod`.
- `ThangHP` và `NamHP` chỉ là nhãn tra cứu, không quyết định doanh thu tháng.
- Bộ chọn tháng của Báo cáo chỉ tác động các chỉ tiêu dòng tiền và vận hành theo tháng.

### 2.2. Công nợ chu kỳ

- Là ảnh chụp trạng thái hiện tại từ `getTuitionCycleState`.
- Không hồi quy công nợ lịch sử theo tháng vì giai đoạn này chưa lưu lịch sử đóng/mở từng chu kỳ.
- `due` và `overdue` mới được cộng vào số tiền cần thu.
- `needs_review` không được cộng vào công nợ và không được tự động mở thao tác thu phí.

## 3. Luồng `Cần kiểm tra`

Một hồ sơ `needs_review` phải:

- Có bộ lọc riêng tại FinanceTab.
- Hiển thị số buổi đã học/mốc chu kỳ và ngày bắt đầu chu kỳ.
- Không nằm trong bộ lọc mặc định `Cần thu`.
- Không cộng vào KPI `Cần thu`, `Tới hạn` hoặc `Quá hạn`.
- Cho phép mở chi tiết học sinh bằng hành vi click dòng/card hiện có.

Giai đoạn 2 không tự động quyết định miễn, giảm, truy thu hay hoàn tiền.

## 4. Báo cáo tài chính

Báo cáo hiển thị đồng thời:

- `Thu trong tháng`: tổng tiền theo ngày phiếu thu của tháng đang chọn.
- `Cần thu hiện tại`: tổng `outstandingAmount` của `due + overdue`.
- `Quá hạn hiện tại`: số học sinh `overdue` và số tiền tương ứng.
- `Cần kiểm tra`: số hồ sơ `needs_review`, không có số tiền phải thu tự động.

CSV bổ sung:

- Các KPI công nợ hiện tại, ghi chú rõ là ảnh chụp tại thời điểm xuất.
- Danh sách từng học sinh tới hạn/quá hạn/cần kiểm tra, gồm mã HS, lớp, trạng thái, tiến độ buổi, ngày bắt đầu chu kỳ và số tiền phải thu.

## 5. Tiêu chí nghiệm thu

1. Học sinh `needs_review` không xuất hiện trong danh sách mặc định `Cần thu`.
2. Có thể lọc riêng `Cần kiểm tra` trên desktop và mobile.
3. Tổng công nợ Finance, Overview và Reports bằng nhau khi dùng cùng dữ liệu đầu vào.
4. Doanh thu tháng vẫn theo `NgayThu`, không bị ảnh hưởng bởi trạng thái chu kỳ.
5. CSV phân biệt rõ dòng tiền theo kỳ lọc và công nợ hiện tại.
6. Không đổi GAS contract, Google Sheets headers hoặc schema lưu trữ.

## 6. Ngoài phạm vi

- Chốt/miễn/giảm công nợ bằng một field mới.
- Khôi phục chính xác công nợ tại một ngày lịch sử.
- Học phí riêng theo lớp hoặc theo học sinh.
- Tự động xử lý số tiền đóng thiếu/thừa.
