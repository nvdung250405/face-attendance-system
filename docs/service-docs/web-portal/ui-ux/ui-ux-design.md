# UI/UX DESIGN — Thiết kế Chi tiết Giao diện Phân hệ Web Portal

> **Mã tài liệu:** `DES-UI-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết hệ thống Design Tokens Tailwind CSS, bố cục component và trải nghiệm người dùng của Web Portal.

---

## 1. Design Tokens & Visual Language (Hệ thống Thiết kế Web)

* **Font chữ chuẩn**: Inter (Google Fonts) hỗ trợ đa trọng lượng (Regular, Medium, Semi-bold, Bold).
* **Màu sắc chủ đạo**:
  * `Primary Brand`: Indigo `#4F46E5`
  * `Background Light`: `#F8FAFC`
  * `Surface Card`: `#FFFFFF`
  * `Text Primary`: `#0F172A`
  * `Text Muted`: `#64748B`
  * `Status Success`: `#10B981` (Đúng giờ)
  * `Status Warning`: `#F59E0B` (Đi muộn)
  * `Status Danger`: `#EF4444` (Vắng mặt)

---

## 2. Layout Structure & Components (Cấu trúc Bố cục Giao diện)

| ID | Thành phần Giao diện | Định nghĩa & Bố cục Kỹ thuật | Realizes | Quyết định | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `UXD-WEB-001` | Khung Bố cục Quản trị (Admin Layout)| Bố cục Sidebar cố định bên trái ($260\text{ px}$), Header cố định trên cùng chứa avatar/thông báo và Main Content co giãn linh hoạt. | `UI-WEB-001` | `DD-UXD-001` | Approved |
| `UXD-WEB-002` | Hộp thoại Cam kết & Hiển thị OTP | Modal nổi chính giữa màn hình, chứa khung cuộn văn bản pháp lý, nút ký cam kết và card hiển thị mã OTP 6 số cùng mã QR. | `UI-WEB-002` | `DD-UXD-003` | Approved |
| `UXD-WEB-003` | Thẻ Chỉ số Thống kê (KPI Cards) | Hàng 4 thẻ card hiển thị các con số quan trọng: Tổng quân số, Đã điểm danh, Đi muộn, Chưa đến với biểu tượng trực quan. | `UI-WEB-003` | `DD-UXD-001` | Approved |
| `UXD-WEB-004` | Bảng Dữ liệu Trực tiếp (Live Table) | Bảng danh sách điểm danh thời gian thực, có huy hiệu trạng thái màu, hỗ trợ tìm kiếm nhanh theo tên hoặc mã nhân viên. | `UI-WEB-003` | `DD-UXD-001` | Approved |
| `UXD-WEB-005` | Khung Lịch biểu Cá nhân (Calendar) | Chế độ xem lịch tháng cho nhân viên, tô màu từng ô ngày theo trạng thái điểm danh và hiển thị chi tiết khi nhấp chuột. | `UI-WEB-004` | `DD-UXD-001` | Approved |
