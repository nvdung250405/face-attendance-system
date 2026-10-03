---
title: Kiosk UI/UX Build Plan
version: 2.0
status: Approved
owner: Edge Vision Lead & UI Engineer
---

# UI/UX BUILD PLAN — Kế hoạch Thi công Giao diện Phân hệ Kiosk


## 1. Approach & Sequencing (Chiến lược Thi công Giao diện)

Xây dựng giao diện QML theo 5 giai đoạn liên tục:
$$\text{Design Tokens} \rightarrow \text{Viewport Layouts (9:16)} \rightarrow \text{Proportional Scaling} \rightarrow \text{Modals \& Dialogs} \rightarrow \text{Animation \& Sounds}$$

---

## 2. UI Build Work Items (Danh mục Hạng mục Thi công Giao diện)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-KSK-004` | Khởi tạo Design Tokens & Theme | Định nghĩa bảng màu Dark Glassmorphism, kích thước phông chữ Inter, bán kính bo góc và các biến dùng chung trong QML. | `UXD-KSK-005` | `FND-KSK-002` | Mọi thành phần QML đều sử dụng token tập trung, không dùng giá trị màu hoặc kích thước cứng. | Done |
| `BLD-KSK-005` | Xây dựng Bố cục Khung nhìn 9:16 | Lắp ráp HeaderBar ($968\times 120\text{ px}$), PortraitCameraPanel ($968\times 1496\text{ px}$) và ActionDock ($968\times 144\text{ px}$) trong khung nhìn canvas $1080\times 1920\text{ px}$. | `UXD-KSK-005` | `BLD-KSK-004` | Bố cục tỷ lệ dọc 9:16 cân đối; co giãn tỷ lệ động mượt mà từ HD 720p đến 4K qua công thức $S$. | Done |
| `BLD-KSK-006` | Lập trình Khung Oval & Pulse Scan | Vẽ khung Oval hình elip vector $470 \times 604\text{ px}$, máy trạng thái 4 màu (Standby, Aligning, Success, Rejected) và dải sóng quét Laser Pulse Scan. | `UXD-KSK-001` | `BLD-KSK-005` | Chuyển đổi màu sắc tức thì khi nhận tín hiệu từ AI; đường nét viền mượt mà không răng cưa. | Done |
| `BLD-KSK-007` | Xây dựng Thẻ Kết quả Nổi & Âm thanh | Thẻ card kết quả bo góc $20\text{ px}$, kính mờ Glassmorphism trượt lên trong $2.5\text{ s}$ kèm phát file âm thanh "Tít" ($880\text{ Hz}$) hoặc "Bíp" ($300\text{ Hz}$). | `UXD-KSK-002` | `BLD-KSK-006` | Card xuất hiện mượt mà sau khi nhận diện thành công; âm thanh phát rõ ràng đồng bộ với visual. | Done |
| `BLD-KSK-008` | Xây dựng 3 Hộp thoại Modals | Thiết kế bàn phím số ảo PIN Pad $720\times 880\text{ px}$, Modal Đăng ký 3 bước tự ẩn in-viewport $800\times 960\text{ px}$, và Modal Hướng dẫn Trợ giúp. | `UXD-KSK-003`, `UXD-KSK-004` | `BLD-KSK-006` | Phím bấm cảm ứng nhạy bén; popup tự ẩn nhường trọn camera chính ở Bước 2. | Done |
