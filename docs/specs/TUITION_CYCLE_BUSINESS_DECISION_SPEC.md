# Tuition Cycle Business Decision Spec

Last updated: 2026-07-11
Status: Approved business decision - Phase 1

## 1. Mục tiêu

Chốt một nguồn sự thật duy nhất cho nghiệp vụ học phí của Lớp Toán NK,
đặc biệt với học sinh bắt đầu học giữa tháng.

Quyết định trung tâm:

```text
Tới hạn/cần thu = theo chu kỳ số buổi học.
Doanh thu        = theo NgàyThu.
Kỳ ghi trên phiếu = theo ThangHP/NamHP để tra cứu và đối soát.
```

`ThangHP/NamHP` không tự tạo công nợ chỉ vì lịch chuyển sang tháng mới.

## 2. Tình huống chuẩn cần giải quyết

Ví dụ:

```text
Học sinh bắt đầu: 15/06/2026
Lớp học: 2 buổi/tuần
Phụ huynh nộp học phí: cuối tháng 06/2026
```

Kết quả bắt buộc:

- Khoản thu cuối tháng 6 đóng chu kỳ học phí đầu tiên.
- Sang ngày 01/07, học sinh không tự động trở thành chưa nộp/nợ.
- Chu kỳ mới bắt đầu cần thu khi học sinh tích lũy 50% số lượt học sau lần đóng
  gần nhất.
- Với lớp 2 buổi/tuần, bắt đầu cần thu ở lượt thứ 4/8 và quá hạn sau lượt thứ 8.

## 3. Ba mốc dữ liệu phải tách biệt

### 3.1. Ngày thu

`NgayThu` là ngày tiền thực tế được ghi nhận.

Dùng cho:

- doanh thu ngày/tháng/năm;
- dòng tiền;
- sổ thu;
- báo cáo thu theo thời gian.

Không dùng `NgayThu` để quyết định chu kỳ nào đang tới hạn.

### 3.2. Kỳ ghi trên phiếu

`ThangHP/NamHP` là nhãn đối soát của phiếu thu.

Dùng cho:

- tìm phiếu;
- lọc sổ thu theo kỳ;
- in biên lai;
- tương thích dữ liệu Google Sheets hiện có.

Không dùng việc thiếu phiếu của tháng lịch mới để tự kết luận học sinh đang nợ.

### 3.3. Chu kỳ học phí

Chu kỳ học phí quyết định các trạng thái:

```text
not_due  -> chưa tới hạn
due      -> đã học từ nửa chu kỳ đến hết target và cần thu
overdue  -> đã vượt toàn bộ target mà chưa thu
paid     -> vừa có khoản thu đóng chu kỳ, chưa phát sinh lượt học mới
inactive -> học sinh đã nghỉ, không mở chu kỳ mới
no_schedule -> chưa xác định được số buổi chuẩn của lớp
```

## 4. Cách xác định độ dài chu kỳ

Nguồn chuẩn nằm trong `RULES.finance`:

```text
Lớp 1 buổi/tuần -> 4 lượt học/chu kỳ
Lớp 2 buổi/tuần -> 8 lượt học/chu kỳ
Lớp 3 buổi/tuần -> 12 lượt học/chu kỳ
```

Số buổi/tuần được lấy từ lịch hợp lệ `Buổi 1/2/3` của lớp hiện tại.

Nếu không có lịch hợp lệ:

- trạng thái là `no_schedule`;
- không tự tạo công nợ;
- hiển thị cảnh báo cần bổ sung lịch lớp.

## 5. Cách đếm lượt học

Một lượt học được tính khi:

- có cặp duy nhất `MaBuoi + MaHS`;
- trạng thái điểm danh là `Có mặt`;
- ngày buổi học nằm trong khoảng chu kỳ đang xét.

Quy tắc bổ sung:

- `Vắng` và `Có phép` không tăng lượt học;
- học tăng cường/học ghép/học ở lớp khác vẫn tăng lượt nếu học sinh `Có mặt`;
- dòng điểm danh trùng trong cùng `MaBuoi` chỉ tính một lần;
- buổi nghỉ lớp không tăng lượt học.

## 6. Mốc bắt đầu chu kỳ

### 6.1. Chu kỳ đầu tiên

Chu kỳ đầu bắt đầu tại `student.startDate`.

Không tính bất kỳ buổi nào trước `startDate`.

### 6.2. Chu kỳ sau khi thu tiền

Khi có phiếu thu hợp lệ, chu kỳ trước được xem là đã đóng.

Chu kỳ mới:

- bắt đầu sau `NgayThu` của phiếu gần nhất;
- không đếm lại buổi học đúng ngày thu nếu buổi đó xảy ra trước thời điểm thu;
- trong MVP, nếu chỉ có dữ liệu ngày mà không có thời gian thu/buổi, dùng quy
  tắc an toàn: chỉ đếm các buổi có ngày lớn hơn `NgayThu`.

### 6.3. Nhiều phiếu thu

Phiếu gần nhất theo `NgayThu` là mốc đóng chu kỳ gần nhất.

Nếu có nhiều phiếu cùng ngày:

- ưu tiên `CreatedAt/UpdatedAt` nếu dữ liệu có;
- nếu không có, dùng thứ tự dữ liệu ổn định và ghi cảnh báo đối soát;
- không cộng nhiều phiếu cùng ngày thành nhiều chu kỳ nếu chưa có nghiệp vụ
  đóng trước nhiều kỳ.

## 7. Học sinh bắt đầu giữa tháng

Không prorate tự động theo ngày lịch.

Quy tắc:

- bắt đầu ngày nào thì đếm lượt học từ ngày đó;
- không tự tạo khoản nợ cho phần tháng trước ngày bắt đầu;
- không tự mở kỳ mới vào ngày đầu tháng kế tiếp;
- số tiền thu lần đầu mặc định là `baseTuition`, nhưng người thu được phép sửa
  trước khi lưu.

Ví dụ `startDate = 15/06/2026`:

- chu kỳ đầu bắt đầu 15/6;
- đóng cuối tháng 6 thì chu kỳ mới bắt đầu sau ngày đóng;
- tháng 7 chỉ là tháng báo cáo, không phải nguyên nhân tự tạo nợ.

## 8. Học sinh nghỉ học

Quyết định Phase 1:

- không đếm buổi sau `endDate`;
- không mở chu kỳ mới sau `endDate`;
- nếu học sinh đã đủ/vượt chu kỳ trước hoặc đúng `endDate`, khoản đó vẫn cần
  đối soát;
- nếu chưa đủ chu kỳ tại `endDate`, không tự thu đủ hoặc prorate; hiển thị
  `Cần kiểm tra khi nghỉ` để quản lý quyết định thủ công;
- không tự tạo công nợ cho tháng chứa hoặc tháng sau `endDate` chỉ dựa trên
  tháng lịch.

Phase 1 không tự động hoàn tiền hoặc bảo lưu phần buổi còn lại.

## 9. Thu thiếu, thu thừa và thu nhiều kỳ

Hệ thống hiện chưa có schema phân bổ tiền theo nhiều chu kỳ.

Quyết định MVP:

- một phiếu thu có số tiền dương đóng một chu kỳ;
- không tự tính số tiền còn thiếu so với `baseTuition`;
- không tự chuyển phần thừa sang chu kỳ sau;
- nếu số tiền khác mức chuẩn, biên lai và màn chi tiết phải hiển thị số tiền
  thực thu và nhãn `Số tiền điều chỉnh`;
- thu trước nhiều chu kỳ, thu thiếu, thu bù, hoàn tiền và bảo lưu là nghiệp vụ
  Phase sau, không suy diễn tự động.

Điều này bắt buộc áp dụng giống nhau ở admin và cổng phụ huynh.

## 10. Mức học phí áp dụng

Quyết định Phase 1:

- nguồn chuẩn là `baseTuition` trong cài đặt trung tâm;
- chưa hỗ trợ học phí riêng theo lớp/học sinh trong công nợ chính;
- `HocPhiMacDinh` ở lớp chỉ được xem là dữ liệu dự phòng/legacy;
- cổng phụ huynh và admin phải cùng dùng một nguồn tiền chuẩn.

Chỉ bật học phí riêng theo lớp khi có task riêng cập nhật đầy đủ UI, frontend,
GAS, cổng phụ huynh và test.

## 11. Trạng thái và copy giao diện

Không dùng từ `Nợ tháng` cho logic chu kỳ.

Copy chuẩn:

```text
Đã thu            -> vừa đóng chu kỳ, chưa có lượt mới
Chưa tới hạn      -> chưa đủ số buổi
Tới hạn           -> đúng ngưỡng 4/8/12 buổi
Quá hạn           -> vượt ngưỡng 4/8/12 buổi
Chưa có lịch      -> không xác định được target
Cần kiểm tra nghỉ -> nghỉ khi chu kỳ chưa chốt rõ
```

Các khu vực dùng trạng thái chu kỳ:

- Tổng quan: `Học phí tới hạn`;
- Tài chính/Công nợ;
- trạng thái học phí trong danh sách học sinh;
- chi tiết lớp;
- chi tiết giáo viên nếu hiển thị số học sinh cần thu;
- cổng phụ huynh.

Các khu vực vẫn dùng tháng:

- sổ thu;
- doanh thu;
- báo cáo dòng tiền;
- lọc phiếu theo `ThangHP/NamHP`;
- biên lai.

## 12. Quy tắc cho cổng phụ huynh

Cổng phụ huynh phải dùng cùng trạng thái chu kỳ với admin.

Không được:

- lấy `baseTuition - paidAmount` để tự kết luận còn thiếu nếu admin đã xem
  phiếu đó là đóng một chu kỳ;
- báo chưa nộp chỉ vì không có phiếu `ThangHP` của tháng hiện tại;
- dùng học phí riêng của lớp khi admin đang dùng mức trung tâm.

Cổng phụ huynh nên hiển thị:

- ngày thu gần nhất;
- số tiền thực thu;
- số lượt học của chu kỳ hiện tại;
- target 4/8/12;
- trạng thái hiện tại.

## 13. Acceptance criteria

### Case A - Nhập học giữa tháng, đã đóng cuối tháng

```text
startDate = 15/06/2026
target = 8
NgayThu gần nhất = 28/06/2026
```

Ngày 01/07:

- không báo chưa nộp chỉ vì sang tháng 7;
- lượt học chu kỳ mới chỉ đếm sau 28/6;
- trạng thái `not_due` cho tới hết lượt thứ 3.
- từ lượt thứ 4 (50% chu kỳ): `due` để bắt đầu thu.

### Case B - Nhập học giữa tháng, chưa đóng

```text
startDate = 15/06/2026
đã học 7 lượt Có mặt
```

Kết quả: `due` vì đã qua mốc bắt đầu thu 4/8.

Sau lượt thứ 8: `due`.

Sau lượt thứ 9: `overdue`.

### Case C - Thu trước tháng kế tiếp

```text
NgayThu = 28/06/2026
ThangHP = 7
NamHP = 2026
```

Kết quả:

- doanh thu ghi nhận trong tháng 6;
- nhãn phiếu là T7/2026;
- chu kỳ mới vẫn bắt đầu sau ngày 28/6;
- không tạo thêm một chu kỳ chỉ vì nhãn phiếu là T7.

### Case D - Phiếu thấp hơn mức chuẩn

```text
baseTuition = 600000
SoTien = 300000
```

Kết quả:

- phiếu đóng một chu kỳ trong MVP;
- admin và cổng phụ huynh cùng hiển thị số thực thu 300000;
- không tự báo còn thiếu 300000;
- hiển thị nhãn `Số tiền điều chỉnh`.

### Case E - Học bù lớp khác

Học sinh Có mặt trong một `MaBuoi` của lớp khác:

- lượt học được cộng một;
- không phụ thuộc lớp gốc của học sinh;
- không đếm trùng nếu có hai dòng điểm danh cùng `MaBuoi`.

### Case F - Nghỉ giữa chu kỳ

Học sinh có `endDate` trước khi đủ target:

- không đếm buổi sau `endDate`;
- không tự sinh công nợ tháng;
- trạng thái `Cần kiểm tra khi nghỉ`;
- quản lý xử lý thủ công trong Phase 1.

## 14. Phạm vi triển khai sau Phase 1

Phase 1 chỉ chốt nghiệp vụ và nguồn sự thật. Chưa đổi code/schema.

Thứ tự triển khai kỹ thuật tiếp theo:

1. Chuẩn hóa `getTuitionCycleState` thành helper duy nhất.
2. Viết test cho toàn bộ acceptance criteria.
3. Chuyển Tổng quan và Công nợ sang trạng thái chu kỳ.
4. Chuyển Học sinh, Lớp và Giáo viên sang cùng helper.
5. Đồng bộ cổng phụ huynh.
6. Giữ Sổ thu/Báo cáo doanh thu theo `NgayThu`.
7. Đổi copy UI từ `nợ tháng` sang `tới hạn/quá hạn chu kỳ`.

## 15. Non-goals

- Không đổi Google Sheets schema trong Phase 1.
- Không tự prorate theo ngày.
- Không tự chia một phiếu cho nhiều chu kỳ.
- Không tự chuyển tiền thừa sang chu kỳ sau.
- Không làm hoàn tiền/bảo lưu.
- Không làm học phí riêng theo lớp/học sinh.
- Không thay đổi nghiệp vụ thu–chi ngoài học phí.

## 16. Nguồn sự thật

Từ ngày 2026-07-11, file này là nguồn quyết định nghiệp vụ học phí ưu tiên cao
nhất.

Nếu tài liệu cũ mâu thuẫn với file này, áp dụng file này cho đến khi có quyết
định sản phẩm mới được ghi thành spec thay thế.
