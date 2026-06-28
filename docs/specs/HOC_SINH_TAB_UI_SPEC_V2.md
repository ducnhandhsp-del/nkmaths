# HOC SINH TAB UI SPEC V2

## Design Read

Man Học sinh là màn quản trị dữ liệu vận hành cho trung tâm toán. Người dùng chính là giáo viên/quản lý cần tra cứu nhanh, kiểm tra công nợ, liên hệ phụ huynh và mở hồ sơ học sinh. Ngôn ngữ thiết kế: nội bộ, rõ nghiệp vụ, table-first, compact, không trang trí.

## Mục Tiêu Nghiệp Vụ

Tab Học sinh phải trả lời nhanh 5 câu hỏi:

1. Học sinh này là ai, mã HS nào, đang học lớp nào?
2. Học sinh đang học, tạm nghỉ hay đã nghỉ?
3. Hồ sơ có đủ thông tin liên hệ phụ huynh/học sinh không?
4. Học phí tháng hiện tại và công nợ đang ở trạng thái nào?
5. Cần thao tác gì ngay: xem hồ sơ, thu phí, nhắn Zalo/gọi điện?

## Tư Duy Hệ Thống

Học sinh là nút trung tâm liên kết các phân hệ:

- Lớp học: `classId`, chuyển lớp, sĩ số.
- Tài chính: công nợ, phiếu thu, tháng học phí.
- Vận hành: điểm danh, nhật ký buổi học, vắng/có phép.
- Phụ huynh: Zalo, điện thoại, liên hệ chăm sóc.
- Hồ sơ học tập: khối, trường, học lực, mục tiêu, nhu cầu hỗ trợ.

Vì vậy tab Học sinh không nên chỉ là danh bạ. Nó cần là bảng điều phối hồ sơ học sinh.

## Cấu Trúc Giao Diện Đề Xuất

### 1. Header Compact

- Tiêu đề: `Học sinh`.
- Dòng phụ: số hồ sơ đang hiển thị / tổng hồ sơ.
- Action chính duy nhất: `+ Thêm học sinh`.
- Không dùng hero, không dùng gradient, không dùng icon trang trí.

### 2. Signal Chips

Hiển thị compact, không dùng card lớn:

- Đang học.
- Tạm nghỉ.
- Còn nợ.
- Thiếu liên hệ.
- Chưa xếp lớp.

Các chip này là tín hiệu điều phối, không thay thế bộ lọc.

### 3. Filter Bar

Một hàng filter gần bảng:

- Search: tên, mã HS, phụ huynh, SĐT.
- Lớp.
- Khối.
- Trạng thái.
- Công nợ.
- Reset khi có filter.

Yêu cầu: filter không được chiếm quá nhiều chiều cao.

### 4. Desktop Table

DataTable là trọng tâm. Cột đề xuất:

1. Học sinh: tên, mã HS, trường.
2. Lớp: mã lớp, số lớp nếu học nhiều lớp.
3. Hồ sơ học tập: khối, học lực, mục tiêu ngắn.
4. Liên hệ: phụ huynh, SĐT.
5. Học phí: đủ/chưa thu/nợ tháng.
6. Trạng thái: đang học/tạm nghỉ/đã nghỉ.
7. Thao tác: thu phí, Zalo/gọi, mở hồ sơ.

Row click vẫn mở hồ sơ học sinh. Action trong row phải `stopPropagation`.

### 5. Mobile Cards

Mobile không ép bảng. Mỗi card gồm:

- Tên + mã HS + trạng thái.
- Lớp.
- Khối/học lực.
- Phụ huynh + liên hệ.
- Học phí.
- Action: Thu phí, Zalo/Gọi, Xem.

Card phải compact, không dùng avatar màu mè nếu không phục vụ nghiệp vụ.

## Quy Tắc Không Được Đổi

- Không đổi GAS/API fields.
- Không đổi schema học sinh.
- Không đổi logic công nợ.
- Không đổi modal thêm/sửa/xem học sinh.
- Không đổi row click behavior.
- Không thêm thư viện UI.

## Prototype HTML

File giao diện mẫu: `HOC_SINH_TAB_UI_V2_PROTOTYPE.html`.

Prototype thể hiện hướng giao diện V2. Khi chuyển vào React, nên map lại bằng `PageToolbar`, `FilterBar`, `DataTable`, `MobileCard`, `StatusBadge`, `Button`, `Select` hiện có.
