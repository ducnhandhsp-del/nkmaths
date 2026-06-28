# BUSINESS_STATUS.md

## Mục đích

File này ghi lại đánh giá hiện trạng nghiệp vụ của app **Lớp Toán NK**.

Nội dung tập trung trả lời câu hỏi:

```text
Nghiệp vụ đã làm đến đâu?
Phần nào đã ổn?
Phần nào mới là nền?
Phần nào chưa nên làm vội?
Thứ tự nâng cấp nghiệp vụ tiếp theo là gì?
```

---

## 1. Kết luận nhanh

Dự án đã có **lõi nghiệp vụ vận hành khá tốt**, không chỉ mới làm giao diện.

Tuy nhiên, app chưa phải một hệ quản lý trung tâm hoàn chỉnh 100%.

Đánh giá tổng quan:

```text
Đã có lõi vận hành + tài chính + giáo viên
Chưa có đủ vòng đời quản lý trung tâm
```

Nói ngắn gọn:

```text
Giao diện: đang bắt đầu đồng bộ
Nghiệp vụ: đã có nền khá mạnh, nhưng còn thiếu vài vòng lặp quản lý quan trọng
```

Ước lượng hiện trạng:

```text
Học sinh/lớp:       65%
Vận hành buổi học:  70%
Tài chính:          75%
Giáo viên:          60%
Tuyển sinh:         20–30%
Xin nghỉ/học bù:    20–30%
Lương giáo viên:    20–30%
Báo cáo quản lý:    40–50%
```

Đây là mức tốt cho một app nội bộ đang phát triển, nhưng chưa nên gọi là ERP trung tâm hoàn chỉnh.

---

## 2. Nghiệp vụ đã làm rồi

### 2.1. Quản lý học sinh

Đã có:

```text
- thêm/sửa học sinh
- trạng thái đang học/đã nghỉ
- ngày bắt đầu học
- ngày kết thúc
- lớp đang học
- giáo viên
- phụ huynh/liên hệ
- học lực
- mục tiêu
- kiến thức cần hỗ trợ
```

Trong `useDomains.ts`, phần lưu học sinh đã có:

```text
- validate mã HS/tên
- chống trùng mã
- chuẩn hóa startDate/endDate
- optimistic update
- gọi Google Apps Script để lưu
```

Đánh giá:

```text
Nền học sinh đã khá tốt.
```

Thiếu sâu hơn:

```text
- lịch sử chuyển lớp
- lý do nghỉ học
- trạng thái tạm nghỉ/bảo lưu
- học thử
- nguồn tuyển sinh
- lịch sử chăm sóc/phụ huynh
```

---

### 2.2. Quản lý lớp học

Đã có:

```text
- mã lớp
- tên lớp
- giáo viên
- cơ sở
- khối
- buổi học 1/2/3
- gắn học sinh vào lớp
```

`LearningTab` đã gộp lớp và học sinh lại, đúng với nghiệp vụ thực tế.

Đánh giá:

```text
Nền quản lý lớp đã ổn.
```

Thiếu sâu hơn:

```text
- sĩ số tối đa
- trạng thái lớp: đang mở / tạm dừng / đã kết thúc
- lịch sử đổi giáo viên
- lịch sử đổi lịch học
- lớp học thử / lớp chính thức
```

---

### 2.3. Vận hành buổi học

Đã có khá tốt.

`OperationsTab` hiện có 3 phần:

```text
Lịch dạy
Buổi học
Chuyên cần
```

Đã có:

```text
- lịch tuần
- click buổi đã ghi để xem nhật ký
- click buổi chưa ghi để mở form ghi buổi
- phân biệt buổi đã ghi / chưa ghi / tương lai
- danh sách buổi học
- xem/sửa nhật ký
- thống kê học sinh vắng/muộn
- filter chuyên cần
```

Đánh giá:

```text
Vận hành buổi học đã đúng hướng.
```

Thiếu sâu hơn:

```text
- trạng thái buổi học: chưa đến / chưa ghi / thiếu điểm danh / hoàn tất
- học sinh xin nghỉ trước buổi học
- học bù
- bảo lưu buổi
- tự cảnh báo buổi đã qua nhưng chưa ghi
- xác nhận giáo viên đã hoàn thành buổi học
```

---

### 2.4. Tài chính

Đây là phần mạnh nhất hiện tại.

`FinanceTab` hiện có:

```text
Tổng hợp
Công nợ
Phiếu thu
Phiếu chi
```

Đã có:

```text
- tổng hợp thu/chi
- công nợ
- phiếu thu
- phiếu chi
- phân trang sổ thu
- phân trang phiếu chi
- nhắc phí qua Zalo/copy message
- export CSV
- báo cáo doanh thu theo lớp
- báo cáo doanh thu theo giáo viên/lớp phụ trách
```

Logic công nợ đã có ý thức xử lý:

```text
- không tính nợ trước startDate
- không tính nợ sau endDate
- không tính tháng tương lai là nợ
```

Đánh giá:

```text
Tài chính đã vượt mức app đơn giản, gần giống module quản lý thật.
```

Thiếu sâu hơn:

```text
- học phí theo lớp/khối
- giảm giá anh em
- học thử
- đóng thiếu / đóng thừa
- hoàn tiền
- bảo lưu phí
- lịch sử nhắc nợ
- người xác nhận thu
- đối soát tháng
- phân biệt doanh thu dự kiến và doanh thu thực thu
```

---

### 2.5. Giáo viên

Đã có:

```text
- hồ sơ giáo viên
- trạng thái đang dạy/nghỉ phép/đã nghỉ
- lớp phụ trách
- học sinh phụ trách
- buổi dạy tháng này
- doanh thu lớp phụ trách
- chuyên cần lớp phụ trách
- buổi học gần nhất
```

`TeachersTab` đã đi theo hướng vận hành giáo viên, không chỉ là danh bạ.

Đánh giá:

```text
Giáo viên đã có nền vận hành tốt.
```

Thiếu sâu hơn:

```text
- bảng công/lương giáo viên
- số buổi cần trả lương
- đơn giá/buổi
- phụ cấp
- tạm ứng
- lịch nghỉ/dạy thay
- đánh giá chất lượng lớp theo giáo viên
```

---

### 2.6. Business rules

Đã có `rules.ts`.

File này gom:

```text
- học phí mặc định
- ngưỡng cảnh báo nợ
- ngưỡng chuyên cần
- thứ tự học lực
- màu học lực
- phân trang
- giáo viên mặc định
- ca dạy mặc định
- network timeout/reload
```

Đánh giá:

```text
Đây là nền tốt để phát triển nghiệp vụ chuẩn.
```

Nguyên tắc nên giữ:

```text
Magic number và business decision nên nằm trong rules.ts,
không hardcode rải rác trong UI component.
```

---

## 3. Nghiệp vụ mới chỉ định hướng, chưa hoàn chỉnh

### 3.1. Tuyển sinh / lead

Có dấu hiệu đã có kiểu `Lead`, nhưng workflow tuyển sinh chưa phải workflow chính.

Chưa nên xem là hoàn chỉnh.

Workflow chuẩn sau này:

```text
Lead mới
→ đã liên hệ
→ hẹn test/học thử
→ đăng ký
→ chuyển thành học sinh
→ mất lead
```

Hiện chưa nên ưu tiên nếu app vận hành lõi chưa ổn.

---

### 3.2. Xin nghỉ / học bù

Trong `types.ts` có `LeaveRequest`.

Tuy nhiên UI vận hành hiện vẫn chủ yếu là:

```text
Lịch dạy
Buổi học
Chuyên cần
```

Phần xin nghỉ/học bù chưa hoàn chỉnh.

Workflow chuẩn sau này:

```text
Phụ huynh báo nghỉ
→ tạo yêu cầu nghỉ
→ duyệt
→ đánh dấu buổi nghỉ có phép
→ nếu cần thì tạo học bù
```

---

### 3.3. Lương giáo viên

`Teacher` có các field như:

```text
baseSalary
hourlyRate
allowance
```

Nhưng chưa có module tính lương đầy đủ.

Hiện mới là nền dữ liệu.

Workflow chuẩn sau này:

```text
Số buổi đã dạy
× đơn giá/buổi
+ phụ cấp
- khấu trừ
= lương tạm tính
```

Không nên nhầm:

```text
Doanh thu lớp phụ trách ≠ lương giáo viên
```

---

### 3.4. Báo cáo quản lý chuẩn

Đã có tổng hợp tài chính và biểu đồ, nhưng chưa đủ bộ báo cáo quản lý.

Nên có sau này:

```text
- báo cáo công nợ tháng
- báo cáo chuyên cần
- báo cáo doanh thu theo lớp
- báo cáo giáo viên
- báo cáo học sinh cần theo dõi
- báo cáo học sinh nghỉ/chuyển lớp
```

---

## 4. Có nên làm nghiệp vụ tiếp theo ngay không?

Có, nhưng chưa nên nhảy vào thêm tính năng mới ngay.

Thứ tự đúng hơn:

```text
1. ổn định giao diện và structure
2. chuẩn hóa workflow Ghi buổi học
3. chuẩn hóa công nợ/đối soát tháng
4. thêm xin nghỉ/học bù
5. thêm lương giáo viên
6. thêm báo cáo quản lý sâu
```

---

## 5. Ưu tiên nghiệp vụ tiếp theo

### Ưu tiên 1 — Chuẩn hóa “Ghi buổi học”

Đây là nghiệp vụ nên ưu tiên số 1.

Mục tiêu:

```text
Lịch dạy
→ click buổi
→ ghi buổi học
→ điểm danh
→ nội dung
→ bài tập
→ lưu
→ cập nhật chuyên cần
```

Một thao tác “Ghi buổi học” nên bao gồm:

```text
- lớp
- ngày
- ca
- giáo viên
- điểm danh
- nội dung bài dạy
- bài tập về nhà
- ghi chú
```

Không nên tách điểm danh và nhật ký thành hai nghiệp vụ rời rạc.

---

### Ưu tiên 2 — Chuẩn hóa công nợ/đối soát tháng

Sau khi UI ổn, nên làm:

```text
- doanh thu dự kiến
- đã thu
- chưa thu
- học sinh không phải đóng
- học sinh mới vào
- học sinh đã nghỉ
- chênh lệch
```

Mục tiêu báo cáo tháng:

```text
T5/2026:
- Số học sinh cần đóng
- Đã đóng
- Chưa đóng
- Dự kiến thu
- Đã thu
- Chênh lệch
```

---

### Ưu tiên 3 — Xin nghỉ/học bù

Sau khi buổi học ổn mới thêm:

```text
xin nghỉ
duyệt nghỉ
học bù
```

Không nên thêm học bù khi workflow buổi học chưa thật chắc.

---

### Ưu tiên 4 — Lương giáo viên

Sau khi buổi học và giáo viên ổn:

```text
số buổi dạy
đơn giá
phụ cấp
tạm tính lương
```

Không nên làm lương giáo viên trước khi số buổi dạy và trạng thái buổi học chưa chuẩn.

---

## 6. Thứ chưa nên làm vội

Chưa nên vội thêm:

```text
- tuyển sinh phức tạp
- học bù nâng cao
- lương giáo viên chi tiết
- báo cáo quản trị sâu
- app học liệu
- phân quyền nhiều vai trò
```

Lý do:

```text
Nền UI/structure/file lớn vẫn cần ổn định trước.
```

---

## 7. Thứ nên làm trước khi nâng nghiệp vụ sâu

Trước khi mở rộng nghiệp vụ, nên làm:

```text
1. test tay kỹ bản hiện tại
2. commit local
3. đồng bộ UI system
4. chia folder structure
5. tách file lớn
6. sau đó mới nâng workflow Ghi buổi học
```

---

## 8. Kết luận

Dự án đã làm **nghiệp vụ lõi**, không phải chỉ mới làm giao diện.

Phần có giá trị nhất hiện tại:

```text
- vận hành buổi học
- tài chính/công nợ
- quản lý lớp & học sinh
- giáo viên theo lớp/buổi dạy
```

Phần chưa nên vội thêm:

```text
- tuyển sinh
- học bù
- lương giáo viên
- báo cáo sâu
```

Việc đúng tiếp theo:

```text
1. chuẩn hóa UI system
2. chia folder structure
3. tách file lớn
4. nâng workflow Ghi buổi học
5. rồi mới nâng nghiệp vụ tài chính/học bù/lương
```

Tóm lại:

```text
Giao diện đang cần đồng bộ.
Nghiệp vụ đã có nền tốt.
Bước tiếp theo là chuẩn hóa theo workflow quản lý thật.
```
