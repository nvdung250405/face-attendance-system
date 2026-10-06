---
title: Web Portal UI/UX Test Plan
version: 1.0
status: Approved
owner: Product Designer & QA Lead
---

# UI/UX TEST PLAN — Kế hoạch Kiểm thử Giao diện & Trải nghiệm Web Portal

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ hệ thống giao diện người dùng React / Tailwind CSS của Cổng Web Portal bao gồm Admin Shell, Live Dashboard, Modal Ký cam kết Informed Consent và Lịch biểu chấm công cá nhân.
* **Mục tiêu**:
  * Đảm bảo tính tương thích và phản hồi mượt mà trên đa màn hình (Responsive từ Mobile $375\text{px}$ đến Desktop $1920\text{px}$).
  * Xác nhận hiệu ứng thị giác chớp sáng vàng/xanh khi bảng nhận được lượt điểm danh mới từ WebSocket hoạt động mượt mà.
  * Kiểm chứng tính khả dụng của Modal ký cam kết sinh trắc học và hiển thị mã OTP 6 số kèm mã QR rõ ràng.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Giao diện Web)

| ID | Quyết định Tiếp cận Kiểm thử Giao diện | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-WEB-003` | Kiểm thử đa thiết bị (Cross-device Testing) bằng Playwright Headless Browser. | Tự động chụp ảnh so sánh pixel (Visual Snapshot) trên các viewport: Mobile ($390\times 844$), Tablet ($820\times 1180$), Desktop ($1440\times 900$). | `STK-015`, `UI-WEB-001` | Approved |
| `APC-WEB-004` | Kiểm định tương tác Modal và khả năng tiếp cận (Accessibility - a11y testing). | Đảm bảo các modal có bẫy tiêu điểm (Focus Trap), hỗ trợ đóng bằng phím ESC và phím Tab hoạt động chuẩn mực. | `UXD-WEB-002`, `NFR-WEB-002` | Approved |

---

## 3. UI/UX Test Items (Danh mục Ca Kiểm thử Giao diện Web)

| ID | Name | Covers | Level | Pass Criteria | Status |
| :--- | :--- | :--- | :---: | | :---: |
| `TST-WEB-005` | Kiểm thử Khung Bố cục Admin Shell Responsive | `UI-WEB-001`, `UXD-WEB-001` | Visual / GUI | Sidebar thu gọn/mở rộng mượt; trên Mobile chuyển thành Drawer menu trượt; nội dung không bị tràn ngang. | Done |
| `TST-WEB-006` | Kiểm thử Live Dashboard Row Highlight & KPI | `UI-WEB-003`, `UXD-WEB-003`, `UXD-WEB-004` | Component / Animation | Bắn sự kiện điểm danh mới; hàng mới chớp sáng màu xanh ngọc trong 1.5s; số KPI tăng tức thì. | Done |
| `TST-WEB-007` | Kiểm thử Modal Ký Cam kết Informed Consent | `UI-WEB-002`, `UXD-WEB-002` | Journey / Flow | Nhân viên đọc điều khoản $\rightarrow$ Ký điện tử $\rightarrow$ Modal hiển thị OTP 6 số và mã QR; nút Copy hoạt động tốt. | Done |
| `TST-WEB-008` | Kiểm thử Lịch Biểu Chấm công Cá nhân | `UI-WEB-005`, `UXD-WEB-005` | Component | Hiển thị dạng lưới tháng; các ô phân biệt rõ màu xanh (đúng giờ), vàng (đi muộn), xám (nghỉ lễ/phép). | Done |
| `TST-WEB-029` | Kiểm thử Màn hình Vòng đời (Danh mục, Kỳ công, Consent, Thông báo, Tuân thủ) | `UI-WEB-006`, `UI-WEB-007`, `UI-WEB-008`, `UI-WEB-009`, `UI-WEB-010`, `UI-WEB-011`, `UI-WEB-012`, `UXD-WEB-006`, `UXD-WEB-007`, `UXD-WEB-008` | Visual / Journey | Form nhập liệu trong Drawer và cảnh báo nghiệp vụ hiển thị đúng trên đầu bảng; màn hình đổi mật khẩu bắt buộc không có sidebar và không rời được bằng điều hướng; badge thông báo và dấu hiệu "chỉ đọc" của màn hình tuân thủ hiển thị chính xác. | Planned |

---

## 4. Defect Management (Quản lý Lỗi Giao diện Web)

* Lỗi làm vỡ layout responsive (Horizontal Scrollbar ngoài ý muốn) hoặc không đóng được Modal được xếp mức **Major (P2)**.
