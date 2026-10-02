# UI/UX DESIGN — Thiết kế Chi tiết Giao diện Phân hệ Kiosk

> **Mã tài liệu:** `DES-UI-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết hệ thống Design Tokens, tỷ lệ co giãn động và cấu trúc layout các thành phần QML của trạm Kiosk.

---

## 1. Design Tokens & Proportional Metrics (Hệ thống Định lượng & Màu sắc)

### 1.1. Color Tokens (Bảng Mã Màu Chuẩn)
* `bg_base`: `#0B0F17` (Nền chính)
* `surface_card`: `#1E293B` (Thẻ card kết quả)
* `oval_standby`: `#64748B` (Viền xám chờ)
* `oval_aligning`: `#F59E0B` (Viền vàng hổ phách)
* `oval_success`: `#10B981` (Viền xanh lá thành công)
* `oval_rejected`: `#EF4444` (Viền đỏ cảnh báo)

### 1.2. Công thức Tỷ lệ Co giãn Động (Dynamic Proportional Scaling)
* Độ phân giải gốc: $1080 \times 1920\text{ px}$ (Tỷ lệ 9:16).
* Tỷ lệ co giãn: $S = \min(W_{\text{actual}} / 1080, H_{\text{actual}} / 1920)$.
* Kích thước khung Oval gốc: Chiều rộng $470 \times S\text{ px}$, Chiều cao $604 \times S\text{ px}$.
* Bán kính bo góc: $16 \times S\text{ px}$. Font size tiêu đề: $28 \times S\text{ px}$.

---

## 2. Layout Structure & Components (Cấu trúc Bố cục Thành phần)

| ID | Thành phần Giao diện | Định nghĩa & Bố cục Kỹ thuật | Realizes | Quyết định | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `UXD-KSK-001` | Khung nhìn Chính Tỷ lệ 9:16 | Bố cục 3 tầng: `HeaderBar` (đồng hồ số, logo, online icon), `PortraitCameraPanel` (luồng video + Oval) và `FooterBar` (phím F2, F3). | `UI-KSK-001` | `DD-UXD-001` | Approved |
| `UXD-KSK-002` | Khung Oval Căn chỉnh 4 Màu | Vẽ động viền oval tại trung tâm màn hình, hỗ trợ đổi 4 màu trạng thái (Standby, Aligning, Success, Rejected) và hiệu ứng quét Pulse Scan. | `UI-KSK-004` đến `UI-KSK-007` | `DD-UXD-002` | Approved |
| `UXD-KSK-003` | Thẻ Kết quả Nổi (Result Card) | Card hiển thị kết quả bo góc $16\text{ px}$, hiệu ứng kính mờ Glassmorphism, tự động trượt lên trong $2.5\text{ s}$ khi điểm danh thành công. | `UI-KSK-001` | `DD-UXD-001` | Approved |
| `UXD-KSK-004` | Hộp thoại Bàn phím Số ảo PIN Pad | Modal popup chính giữa màn hình, chứa lưới phím số $3\times 4$ kích thước tối thiểu $60\times 60\text{ px}$, ô hiển thị 6 dấu chấm bảo mật. | `UI-KSK-002` | `DD-UXD-001` | Approved |
| `UXD-KSK-005` | Hộp thoại Đăng ký In-Viewport | Quy trình tự ẩn ở Bước 2 để nhường toàn bộ khung nhìn cho camera chính, hiển thị thanh tiến trình 3 mẫu ảnh và tự mở lại ở Bước 3. | `UI-KSK-003` | `DD-UXD-003` | Approved |
