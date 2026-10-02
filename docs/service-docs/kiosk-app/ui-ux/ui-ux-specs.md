# UI/UX SPECS — Đặc tả Giao diện & Trải nghiệm Phân hệ Kiosk

> **Mã tài liệu:** `SPEC-UI-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả hành trình người dùng (`UI-KSK-`), máy trạng thái khung Oval và yêu cầu trải nghiệm trên màn hình trạm Kiosk Desktop.

---

## 1. User Tasks & Journeys (Nhiệm vụ Người dùng tại Kiosk)

| ID | Nhiệm vụ / Hành trình | Luồng Tương tác Trực quan | Tiêu chí Nghiệm thu |
| :--- | :--- | :--- | :--- |
| `UI-KSK-001` | Điểm danh Nhận diện Khuôn mặt | Đứng trước camera $\rightarrow$ Nhìn vào khung Oval $\rightarrow$ Giữ ổn định $0.5 - 1.0\text{ s}$ $\rightarrow$ Viền Xanh lá, tiếng "Tít" $\rightarrow$ Hiện thẻ kết quả trong 2.5s. | Thao tác tự nhiên, hoàn tất trong $\le 1.0\text{ s}$. |
| `UI-KSK-002` | Điểm danh Bằng Mã PIN Dự phòng | Nhấn nút F2 $\rightarrow$ Bàn phím số ảo PIN Pad hiển thị $\rightarrow$ Nhập 6 số $\rightarrow$ Xác thực thành công $\rightarrow$ Viền Xanh lá $\rightarrow$ Đóng popup. | Phím bấm cảm ứng lớn $\ge 60\times 60\text{ px}$; khóa 15p sau 5 lần sai. |
| `UI-KSK-003` | Quy trình Tự Đăng ký 3 Bước In-Viewport | Nhấn nút F3 $\rightarrow$ Nhập OTP $\rightarrow$ Popup tự ẩn để dùng toàn màn hình camera chính $\rightarrow$ Chụp 3 ảnh đạt chuẩn $\rightarrow$ Tự mở lại ở Bước 3. | Người dùng tận dụng khung oval lớn trên camera chính, không bị che khuất. |

---

## 2. Visual States & Feedback (Trạng thái Phản hồi Trực quan)

| ID | Trạng thái Khung Oval | Màu sắc & Kiểu dáng Viền | Thông điệp Trực quan Đi kèm |
| :--- | :--- | :--- | :--- |
| `UI-KSK-004` | **Chờ (Standby)** | Xám nhạt (`#64748B`), nét đứt | "Vui lòng nhìn thẳng vào khung oval" |
| `UI-KSK-005` | **Căn chỉnh (Aligning)** | Vàng hổ phách (`#F59E0B`), nét liền | "Đến gần hơn", "Lùi ra xa", "Lệch trái", "Lệch phải", "Giữ thẳng đầu" |
| `UI-KSK-006` | **Thành công (Success)**| Xanh lá (`#10B981`), nét dày + Pulse scan | Họ tên, Mã NV, Giờ chấm công, "Đúng giờ" (Kèm tiếng "Tít" ngắn) |
| `UI-KSK-007` | **Từ chối (Rejected)** | Đỏ cảnh báo (`#EF4444`), nét dày | "Ảnh giả mạo", "Nghiêng đầu quá góc", "Không tìm thấy thông tin" (Kèm tiếng bíp) |
