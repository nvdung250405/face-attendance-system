---
title: Thiết kế Chi tiết Giao diện & Trải nghiệm Người dùng (UI/UX Design)
version: 1.0
status: Approved
owner: Product Designer
---

# UI/UX DESIGN — Thiết kế Chi tiết Giao diện & Trải nghiệm Người dùng

Thiết kế chi tiết cấu trúc thông tin, hệ thống Design Tokens (`UXD-SYS-`), bố cục màn hình và máy trạng thái hành vi tương tác cho Trạm Kiosk Desktop và Cổng Web Quản trị.

---

## 1. Design Tokens & Visual Language (Hệ thống Thiết kế Chuẩn hóa)

### 1.1. Bảng Mã Màu Sắc Chủ đạo (Color Palette)

| Mã Token | Tên Màu & Giá trị Hex | Ứng dụng & Ý nghĩa Giao diện |
| :--- | :--- | :--- |
| `color-bg-base` | Dark Navy (`#0B0F17`) | Màu nền chủ đạo của ứng dụng Kiosk và chế độ Dark mode trên Web. |
| `color-surface` | Slate Dark (`#1E293B`) | Màu nền các thẻ card, thanh tiêu đề và hộp thoại modal. |
| `color-primary` | Vibrant Blue (`#3B82F6`) | Màu thương hiệu, nút hành động chính, thanh tiến trình. |
| `color-standby` | Neutral Slate (`#64748B`) | Màu viền khung Oval ở trạng thái Chờ (chưa phát hiện mặt). |
| `color-aligning`| Amber Yellow (`#F59E0B`) | Màu viền khung Oval và thông điệp chỉ dẫn điều hướng (đang căn chỉnh/lệch tâm). |
| `color-success` | Emerald Green (`#10B981`)| Màu viền khung Oval khi điểm danh thành công, trạng thái Đúng giờ. |
| `color-rejected`| Crimson Red (`#EF4444`) | Màu viền khung Oval khi bị từ chối/giả mạo, trạng thái Đi muộn/Vắng mặt. |

### 1.2. Kiểu Chữ & Tỷ lệ (Typography & Metrics)
* **Font chữ hệ thống**: Sử dụng `Inter` hoặc `Outfit` (sans-serif) cho toàn bộ tiêu đề, nhãn trạng thái và đồng hồ số.
* **Tỷ lệ hiển thị Kiosk**: Thiết kế gốc chuẩn $1080 \times 1920\text{ px}$ (tỷ lệ 9:16), tự động tính toán hệ số tỷ lệ co giãn động:
  $$S = \min\left(\frac{W_{\text{viewport}}}{1080}, \frac{H_{\text{viewport}}}{1920}\right)$$
  Mọi kích thước padding, font-size, bán kính bo góc và kích thước khung oval đều được nhân với hệ số $S$.

---

## 2. Screens & Component Layout (Bố cục Màn hình & Thành phần)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UXD-SYS-001` | Khung nhìn Trực quan Kiosk (9:16) | Giao diện toàn màn hình gồm 3 khu vực: HeaderBar (Logo, đồng hồ số, network status), CameraPanel (luồng video + Oval) và FooterBar (phím chức năng F2, F3). | `STK-002` | `UI-SYS-014` | `DD-SYS-009` | Accepted |
| `UXD-SYS-002` | Vùng Canvas Căn chỉnh Khung Oval | Khung oval cố định tại trung tâm camera (kích thước chuẩn $470 \times 604\text{ px}$), hiển thị thông điệp điều hướng trực quan phía trên đầu khung oval. | `STK-002` | `UI-SYS-007`, `UI-SYS-008`, `UI-SYS-009`, `UI-SYS-010` | `DD-SYS-010` | Accepted |
| `UXD-SYS-003` | Thẻ Kết quả Điểm danh Nổi (Toast Card) | Card thông tin bo góc $16\text{ px}$, nền mờ kính (Glassmorphism), trượt mượt mà từ cạnh dưới lên trong $2.5\text{ s}$ khi nhận diện thành công. | `STK-002` | `UI-SYS-011` | `DD-SYS-009` | Accepted |
| `UXD-SYS-004` | Hộp thoại Bàn phím Số ảo PIN Pad | Modal popup chính giữa màn hình, chứa lưới phím số $3\times 4$ kích thước tối thiểu $60\times 60\text{ px}$, hỗ trợ cảm ứng điện dung nhạy bén. | `STK-002` | `UI-SYS-012` | `DD-SYS-009` | Accepted |
| `UXD-SYS-005` | Màn hình Live Monitoring Dashboard (Web) | Giao diện quản trị thời gian thực gồm: Thẻ thống kê tổng quân số, Biểu đồ tiến độ và Bảng danh sách lượt chấm cuộn mượt mà không reload trang. | `STK-017`, `STK-018` | `UI-SYS-004`, `FR-SYS-015` | `DD-SYS-004` | Accepted |
| `UXD-SYS-006` | Modal Ký Cam kết Informed Consent (Web) | Hộp thoại bắt buộc với checkbox xác nhận, hiển thị đầy đủ văn bản pháp lý Luật 2025, nút "Đồng ý và Kích hoạt" chỉ sáng khi đã tích chọn. | `STK-017` | `UI-SYS-005`, `FR-SYS-007` | `DD-SYS-003` | Accepted |

---

## 3. Interaction State Machine (Máy Trạng thái Tương tác Khung Oval)

```text
    ┌────────────────────────────────────────────────────────┐
    │                 1. STANDBY (Xám nhạt)                  │
    │  - Chưa phát hiện người hoặc mặt chưa vào khung oval   │
    │  - Thông điệp: "Vui lòng nhìn thẳng vào khung oval"    │
    └───────────────────────────┬────────────────────────────┘
                                │ Phát hiện mặt lọt vào Oval
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │               2. ALIGNING (Vàng hổ phách)              │
    │  - Mặt trong Oval nhưng chưa đạt chuẩn căn chỉnh       │
    │  - Chỉ dẫn: "Lệch tâm", "Quá xa", "Quá gần", "Nghiêng" │
    └──────────────┬──────────────────────────┬──────────────┘
                   │ Giữ ổn định 0.5s - 1.0s   │ Giả mạo / Quá góc
                   ▼                          ▼
    ┌──────────────────────────────┐  ┌──────────────────────┐
    │    3. SUCCESS (Xanh lá)      │  │  4. REJECTED (Đỏ)    │
    │ - Điểm danh thành công       │  │ - Bị từ chối / Cảnh  │
    │ - Phát tiếng "Tít" ngắn      │  │   báo giả mạo 2D     │
    │ - Hiển thị thẻ kết quả 2.5s  │  │ - Phát tiếng bíp lỗi │
    └──────────────────────────────┘  └──────────────────────┘
```

---

## 4. UI/UX Design Decisions (Quyết định Thiết kế Giao diện)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DD-SYS-009` | Phong cách Dark Modern UI & Glassmorphism | Áp dụng phong cách giao diện Dark Modern UI kết hợp hiệu ứng kính mờ Glassmorphism cho Kiosk và Web mang lại trải nghiệm cao cấp. | `STK-002`, `STK-017` | `UI-SYS-014` | - | Accepted |
| `DD-SYS-010` | Màu Vàng hổ phách cho trạng thái căn chỉnh | Quy định màu Vàng hổ phách (`#F59E0B`) cho thông điệp điều hướng và viền Oval ở trạng thái căn chỉnh trung gian giúp phân biệt rõ ràng. | `STK-002` | `UI-SYS-008` | - | Accepted |
| `DD-SYS-011` | Quy trình đăng ký tự ẩn popup In-Viewport | Thiết kế quy trình đăng ký khuôn mặt tự động ẩn modal OTP để sử dụng toàn màn hình camera chính giúp người dùng tập trung. | `STK-002` | `UI-SYS-003` | - | Accepted |
