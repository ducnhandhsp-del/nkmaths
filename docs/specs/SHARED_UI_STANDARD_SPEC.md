# Spec: Chuẩn hóa UI dùng chung

Mục tiêu: gom các pattern giao diện lặp lại về component dùng chung để toàn app LỚP TOÁN NK nhìn thống nhất, dễ bảo trì, không làm lệch logic nghiệp vụ.

## 1. PageToolbar / FilterBar

PageToolbar là chuẩn cho hàng đầu màn:

```text
Title | Filter/Search | Primary action
```

Quy tắc:

- Title uppercase, ngắn, không subtitle dài.
- Filter/search nằm cùng hàng khi đủ rộng.
- Primary action nằm cuối hàng.
- Mobile được wrap nhưng vẫn giữ thứ tự: title, filter, action.
- Không tự dựng header riêng nếu component dùng chung đáp ứng được.

FilterBar dùng khi màn cần một vùng lọc riêng:

- Search width mặc định 240-280px.
- Select/filter dùng cùng height và radius.
- Reset filter chỉ hiện khi thật sự cần.
- Không để filter phụ làm màn rối hơn dữ liệu.

## 2. StatusBadge / TableActions

StatusBadge là nguồn màu trạng thái duy nhất:

- Student: Đang học / Tạm nghỉ / Đã nghỉ.
- Tuition: Đã thu / Chưa thu / Quá hạn / Đóng thiếu.
- Lesson: Sắp tới / Đang diễn ra / Đã ghi / Chưa ghi / Đã hủy.
- Attendance: Có mặt / Vắng / Có phép.
- Teacher: Đang dạy / Nghỉ phép / Đã nghỉ / Thiếu hồ sơ.
- Data: Đã đồng bộ / Dữ liệu cục bộ / Thiếu dữ liệu / Bất thường.

TableActions:

- Tối đa 2-3 action trong row.
- Ưu tiên nhãn ngắn: Chi tiết, Sửa, Xóa, Thu phí, Nhắc phí, Zalo.
- Hạn chế icon-only nhiều màu.
- Button trong bảng phải nhỏ, đều, dễ bấm trên mobile.

## 3. MoneyText / DateText

MoneyText:

- Dùng chung format tiền Việt Nam.
- Không tự viết `toLocaleString` rải rác trong tab.
- Cho phép tone âm/dương/trung tính.
- Hỗ trợ compact dạng triệu khi dùng trong KPI.

DateText:

- Luôn đi qua helper `formatDate`.
- Không tự parse ngày trong component.
- Hỗ trợ placeholder `—` khi không có ngày.

MonthText:

- Format chuẩn `T5/2026`.
- Dùng cho kỳ học phí, báo cáo, filter tháng.

## 4. Confirm / Toast

Confirm:

- Dùng trước thao tác xóa hoặc thao tác có thể mất dữ liệu.
- Tiêu đề ngắn, message rõ đối tượng bị ảnh hưởng.
- Variant: info / warning / danger.
- Nút hủy luôn ở trái, nút xác nhận ở phải.

Toast:

- Dùng cho phản hồi ngắn: đã lưu, đã xóa, đã copy Zalo, lỗi lưu.
- Không dùng toast để thay thế confirm.
- Message ngắn, không nhồi dữ liệu dài.

## 5. MobileCard

MobileCard là pattern chung cho list mobile:

- Header: title, subtitle, badge/status.
- Body: các dòng key/value ngắn.
- Footer: action nhanh.
- Tap target action tối thiểu 40px.
- Dùng cho học sinh, lớp, giáo viên, công nợ, phiếu thu/chi, buổi học.

## 6. Legacy cleanup

Ưu tiên thứ tự:

1. Thêm component chuẩn vào `uiSystem.tsx`.
2. Cho wrapper cũ trong `AppComponents.tsx` / `UIComponents.tsx` gọi lại component chuẩn.
3. Migrate từng tab lớn sau khi lint/build pass.
4. Chỉ xóa legacy khi không còn import.

Không làm:

- Không đổi Apps Script.
- Không đổi Google Sheet schema.
- Không đổi logic công nợ, điểm danh, phiếu thu/chi.
- Không đổi field dữ liệu.
