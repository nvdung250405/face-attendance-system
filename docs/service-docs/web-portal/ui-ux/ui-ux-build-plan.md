# UI/UX BUILD PLAN — Kế hoạch Thi công Giao diện Phân hệ Web Portal

> **Mã tài liệu:** `PLN-UBL-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công giao diện người dùng (`UBL-WEB-`) của Cổng Web Portal.

---

## 1. Approach & Sequencing (Chiến lược Thi công Giao diện Web)

$$\text{Theme Tokens \& Base UI} \rightarrow \text{Layout Shell (Sidebar/Header)} \rightarrow \text{Dashboard \& Tables} \rightarrow \text{Modals \& Forms}$$

---

## 2. UI Build Work Items (Danh mục Hạng mục Thi công Giao diện)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `UBL-WEB-001` | Xây dựng Bộ Thành phần Cơ bản (Base UI)| Xây dựng các component Button, Input, Modal, Badge, Card, Avatar bằng Tailwind CSS tái sử dụng. | `UXD-WEB-001` | `FND-WEB-002` | Các component đồng bộ kiểu dáng; hỗ trợ variant màu và trạng thái disabled. | **Hoàn thành** |
| `UBL-WEB-002` | Lắp ráp Khung Bố cục Quản trị | Xây dựng Sidebar điều hướng thu phóng, Header chứa thông tin tài khoản và breadcrumbs. | `UXD-WEB-001` | `UBL-WEB-001` | Chuyển trang mượt mà không nhấp nháy; điều hướng active chuẩn xác. | **Hoàn thành** |
| `UBL-WEB-003` | Xây dựng Bảng Thống kê & Bảng Trực tiếp | Thiết kế 4 thẻ KPI và bảng Live Attendance Table với animation thêm hàng mới mượt mà. | `UXD-WEB-003`, `UXD-WEB-004` | `UBL-WEB-001` | Bảng hiển thị thông tin đầy đủ, phân trang và tìm kiếm nhanh hoạt động tốt. | **Hoàn thành** |
| `UBL-WEB-004` | Xây dựng Modal Cam kết & Thẻ OTP | Thiết kế hộp thoại cam kết bảo vệ dữ liệu với nút ký, hiển thị thẻ OTP 6 số và QR Code rõ nét. | `UXD-WEB-002` | `UBL-WEB-001` | Mã QR quét được bằng ứng dụng điện thoại; chữ số OTP lớn dễ đọc. | **Hoàn thành** |
| `UBL-WEB-005` | Xây dựng Khung Lịch biểu Cá nhân | Thiết kế Calendar View hiển thị lịch làm việc và giờ quẹt vân tay/mặt của nhân viên trong tháng. | `UXD-WEB-005` | `UBL-WEB-001` | Hiển thị màu sắc trực quan (Xanh: Đúng giờ, Vàng: Đi muộn, Đỏ: Vắng). | **Hoàn thành** |
