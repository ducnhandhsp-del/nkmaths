# Spec giai đoạn 3 — Công nợ chu kỳ tại thời điểm lịch sử

## 1. Mục tiêu

Cho phép Báo cáo hiển thị công nợ tại cuối tháng đang chọn, thay vì luôn hiển thị công nợ hiện tại, bằng cách tái dựng trạng thái từ dữ liệu sẵn có:

- ngày bắt đầu/nghỉ học;
- nhật ký và điểm danh buổi học;
- phiếu thu có ngày thu hợp lệ;
- lịch học và mức học phí hiện tại.

Giai đoạn này không đổi schema, Google Sheets headers hoặc GAS contract.

## 2. Khái niệm thời điểm chốt

- `asOfTs` là thời điểm cuối ngày dùng để dựng trạng thái.
- Báo cáo tháng T/M dùng cuối ngày cuối cùng của tháng M.
- Nếu chọn tháng hiện tại hoặc tương lai, thời điểm chốt không vượt quá thời điểm hiện tại để tránh tạo công nợ tương lai.
- FinanceTab và OverviewTab không truyền `asOfTs`, vì vậy vẫn là ảnh chụp hiện tại.

## 3. Quy tắc tái dựng

Khi gọi `getTuitionCycleState(..., asOfTs)`:

1. Bỏ phiếu thu có `NgayThu` sau thời điểm chốt.
2. Bỏ buổi học sau thời điểm chốt.
3. Nếu học sinh chưa tới `startDate` tại thời điểm chốt, không phát sinh công nợ.
4. Nếu `endDate` sau thời điểm chốt, học sinh vẫn được xem là đang học tại thời điểm đó.
5. Nếu `endDate` đã tới trước hoặc đúng thời điểm chốt, dừng đếm buổi tại `endDate` và áp dụng `needs_review` như công thức hiện tại.
6. Phiếu thu gần nhất trước thời điểm chốt đóng chu kỳ trước; chu kỳ mới bắt đầu sau ngày thu.
7. Chỉ `due` và `overdue` cộng vào số tiền công nợ tại thời điểm chốt.

## 4. Hiển thị Báo cáo

- Nhóm tài chính ghi rõ `Công nợ cuối T{tháng}/{năm}`.
- Hiển thị số tiền cần thu, số tiền quá hạn và số hồ sơ cần kiểm tra tại thời điểm chốt.
- CSV ghi ngày chốt và xuất danh sách học sinh `due`, `overdue`, `needs_review` tại ngày đó.
- Doanh thu vẫn độc lập và tính theo ngày phiếu thu trong kỳ lọc.

## 5. Giới hạn độ chính xác

Đây là ảnh chụp **tái dựng**, không phải sổ cái công nợ bất biến:

- Việc sửa/xóa dữ liệu buổi học hoặc phiếu thu cũ sẽ làm thay đổi báo cáo lịch sử.
- Mức `baseTuition` và lịch lớp hiện tại được dùng khi tái dựng; thay đổi cấu hình cũ không có phiên bản lịch sử.
- Mô hình hiện tại coi một phiếu thu dương là đóng một chu kỳ và không tự cộng dồn nhiều chu kỳ nợ.
- Muốn lịch sử bất biến cần một giai đoạn riêng để lưu ledger/snapshot có version và thay đổi schema.

## 6. Tiêu chí nghiệm thu

1. Phiếu thu tháng sau không làm thay đổi ảnh chụp công nợ cuối tháng trước.
2. Buổi học tháng sau không được tính vào tiến độ cuối tháng trước.
3. Học sinh nghỉ sau ngày chốt vẫn được coi là đang học tại ngày chốt.
4. Học sinh chưa bắt đầu tại ngày chốt không phát sinh nợ.
5. Báo cáo và CSV cùng dùng một thời điểm chốt.
6. FinanceTab và OverviewTab giữ nguyên kết quả ảnh chụp hiện tại.
