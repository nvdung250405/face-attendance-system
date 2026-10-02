# UI/UX BUILD PLAN — Kế hoạch Thi công Giao diện Phân hệ Kiosk

> **Mã tài liệu:** `PLN-UBL-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công giao diện (`UBL-KSK-`) của phân hệ Kiosk Desktop.

---

## 1. Approach & Sequencing (Chiến lược Thi công Giao diện)

Xây dựng giao diện QML theo 5 giai đoạn:
$$\text{Design Tokens} \rightarrow \text{Viewport Layouts} \rightarrow \text{Proportional Scaling} \rightarrow \text{Modals \& Dialogs} \rightarrow \text{Animation \& Sounds}$$

---

## 2. UI Build Work Items (Danh mục Hạng mục Thi công Giao diện)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `UBL-KSK-001` | Khởi tạo Design Tokens & Theme | Định nghĩa bảng màu HSL, kích thước font Inter, bán kính bo góc và các biến dùng chung trong QML. | `UXD-KSK-001` | `FND-KSK-002` | Mọi thành phần QML đều sử dụng token tập trung, không dùng màu cứng. | **Hoàn thành** |
| `UBL-KSK-002` | Xây dựng Bố cục Khung nhìn 9:16 | Lắp ráp HeaderBar (đồng hồ, logo, online icon), PortraitCameraPanel và FooterBar trong khung nhìn chính. | `UXD-KSK-001` | `UBL-KSK-001` | Bố cục tỷ lệ dọc 9:16 cân đối; co giãn tỷ lệ động mượt mà từ 720p đến 4K. | **Hoàn thành** |
| `UBL-KSK-003` | Lập trình Khung Oval & Pulse Scan | Vẽ khung Oval cố định $470 \times 604\text{ px}$, máy trạng thái 4 màu và hiệu ứng sóng quét Pulse Scan. | `UXD-KSK-002` | `UBL-KSK-002` | Chuyển đổi màu sắc tức thì khi nhận tín hiệu từ AI; nét viền mượt mà không vỡ hạt. | **Hoàn thành** |
| `UBL-KSK-004` | Xây dựng Thẻ Kết quả Nổi & Âm thanh | Thẻ card kết quả bo góc $16\text{ px}$, hiệu ứng trượt 2.5s kèm phát file âm thanh `beep_success.wav` / `beep_error.wav`. | `UXD-KSK-003` | `UBL-KSK-003` | Card xuất hiện mượt mà sau khi nhận diện thành công; âm thanh phát rõ ràng. | **Hoàn thành** |
| `UBL-KSK-005` | Xây dựng Modal PIN Pad & In-Viewport | Thiết kế bàn phím số ảo PIN Pad cảm ứng và luồng đăng ký 3 bước tự ẩn popup ở Bước 2. | `UXD-KSK-004`, `UXD-KSK-005` | `UBL-KSK-003` | Phím bấm nhạy bén; popup tự ẩn nhường toàn màn hình cho camera chính ở Bước 2. | **Hoàn thành** |
