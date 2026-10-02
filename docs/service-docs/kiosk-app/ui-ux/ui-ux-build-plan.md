# UI/UX BUILD PLAN — Kế hoạch Thi công Giao diện Phân hệ Kiosk

> **Mã tài liệu:** `PLN-UBL-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công giao diện (`UBL-KSK-`) của phân hệ Kiosk Desktop.

---

## 1. Approach & Sequencing (Chiến lược Thi công Giao diện)

Xây dựng giao diện QML theo 5 giai đoạn liên tục:
$$\text{Design Tokens} \rightarrow \text{Viewport Layouts (9:16)} \rightarrow \text{Proportional Scaling} \rightarrow \text{Modals \& Dialogs} \rightarrow \text{Animation \& Sounds}$$

---

## 2. UI Build Work Items (Danh mục Hạng mục Thi công Giao diện)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `UBL-KSK-001` | Khởi tạo Design Tokens & Theme | Định nghĩa bảng màu Dark Glassmorphism, kích thước phông chữ Inter, bán kính bo góc và các biến dùng chung trong QML. | `UXD-KSK-001` | `DBL-KSK-002` | Mọi thành phần QML đều sử dụng token tập trung, không dùng giá trị màu hoặc kích thước cứng. | **Hoàn thành** |
| `UBL-KSK-002` | Xây dựng Bố cục Khung nhìn 9:16 | Lắp ráp HeaderBar ($968\times 120\text{ px}$), PortraitCameraPanel ($968\times 1496\text{ px}$) và ActionDock ($968\times 144\text{ px}$) trong khung nhìn canvas $1080\times 1920\text{ px}$. | `UXD-KSK-001` | `UBL-KSK-001` | Bố cục tỷ lệ dọc 9:16 cân đối; co giãn tỷ lệ động mượt mà từ HD 720p đến 4K qua công thức $S$. | **Hoàn thành** |
| `UBL-KSK-003` | Lập trình Khung Oval & Pulse Scan | Vẽ khung Oval hình elip vector $470 \times 604\text{ px}$, máy trạng thái 4 màu (Standby, Aligning, Success, Rejected) và dải sóng quét Laser Pulse Scan. | `UXD-KSK-002` | `UBL-KSK-002` | Chuyển đổi màu sắc tức thì khi nhận tín hiệu từ AI; đường nét viền mượt mà không răng cưa. | **Hoàn thành** |
| `UBL-KSK-004` | Xây dựng Thẻ Kết quả Nổi & Âm thanh | Thẻ card kết quả bo góc $20\text{ px}$, kính mờ Glassmorphism trượt lên trong $2.5\text{ s}$ kèm phát file âm thanh "Tít" ($880\text{ Hz}$) hoặc "Bíp" ($300\text{ Hz}$). | `UXD-KSK-003` | `UBL-KSK-003` | Card xuất hiện mượt mà sau khi nhận diện thành công; âm thanh phát rõ ràng đồng bộ với visual. | **Hoàn thành** |
| `UBL-KSK-005` | Xây dựng 3 Hộp thoại Modals | Thiết kế bàn phím số ảo PIN Pad $720\times 880\text{ px}$, Modal Đăng ký 3 bước tự ẩn in-viewport $800\times 960\text{ px}$, và Modal Hướng dẫn Trợ giúp. | `UXD-KSK-004`, `UXD-KSK-005` | `UBL-KSK-003` | Phím bấm cảm ứng nhạy bén; popup tự ẩn nhường trọn camera chính ở Bước 2. | **Hoàn thành** |
