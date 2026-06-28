# Spec: DataTable và EmptyState

Mục tiêu: chuẩn hóa bảng dữ liệu và trạng thái trống cho toàn app LỚP TOÁN NK, ưu tiên rõ nghiệp vụ, gọn, đẹp và dùng tốt trên desktop/mobile.

## DataTable

Desktop:

- Bảng nằm trong card trắng, bo 14-16px, viền nhẹ, shadow nhẹ.
- Header uppercase 11px, màu muted, nền nhạt.
- Body 13px, row cao vừa phải khoảng 52-60px.
- Hover row nhẹ bằng màu primary soft.
- Pagination/footer nằm trong cùng card.
- Action trong row tối đa 2-3 nút, ưu tiên nhãn rõ hơn icon nhiều màu.

Mobile:

- Bảng dùng chung tự chuyển thành card/list compact khi đủ an toàn.
- Header ẩn.
- Mỗi cell hiện label nhỏ bên trái và value bên phải.
- Row thành card có border/radius/padding gọn.
- Action target tối thiểu 40px.
- Tránh kéo ngang nếu dữ liệu có thể đọc bằng card.

## EmptyState

- Không dùng text nghiêng rời rạc trong bảng.
- Có icon nhẹ hoặc khung icon muted.
- Title ngắn, nói đúng trạng thái dữ liệu.
- Subtitle chỉ dùng khi giúp người dùng biết bước tiếp theo.
- CTA dùng button chuẩn nếu hành động an toàn.
- Compact mode dùng trong bảng/list để không tạo khoảng trắng lớn.

## Phạm vi kỹ thuật

- Ưu tiên chuẩn hóa component dùng chung trước.
- Không đổi Apps Script.
- Không đổi schema Google Sheet.
- Không đổi logic công nợ, điểm danh, phiếu thu/phiếu chi.
- Không thêm trạng thái điểm danh mới.
