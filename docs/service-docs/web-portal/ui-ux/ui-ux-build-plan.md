# UI/UX BUILD PLAN — Kế hoạch Thi công Giao diện Phân hệ Web Portal

> **Mã tài liệu:** `PLN-UBL-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công giao diện (`UBL-WEB-`) của phân hệ Web Portal.

---

## 1. Approach & Sequencing (Chiến lược Thi công Giao diện)

Xây dựng giao diện React / Tailwind CSS theo 5 giai đoạn liên tục:
$$\text{Design Tokens \& Theme} \rightarrow \text{Admin Shell Layout} \rightarrow \text{Live Monitoring Dashboard} \rightarrow \text{Consent \& OTP Modals} \rightarrow \text{Employee Attendance Calendar}$$

---

## 2. UI Build Work Items (Danh mục Hạng mục Thi công Giao diện)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `UBL-WEB-001` | Cấu hình Tailwind Design Tokens & Theme | Thiết lập `tailwind.config.js` với bảng màu Indigo, phông chữ Inter và các lớp tiện ích dùng chung. | `UXD-WEB-001` | `DBL-WEB-001` | Toàn bộ giao diện áp dụng token tập trung, không dùng giá trị màu sắc hay khoảng cách tùy tiện. | **Hoàn thành** |
| `UBL-WEB-002` | Xây dựng Khung Bố cục Quản trị (Admin Shell) | Lắp ráp Sidebar $260\text{ px}$ (hỗ trợ thu gọn $72\text{ px}$), TopHeader $64\text{ px}$ và Main Viewport Responsive. | `UXD-WEB-001` | `UBL-WEB-001` | Bố cục co giãn mượt mà; hiển thị hoàn hảo từ Mobile $< 768\text{ px}$ đến màn hình lớn $\ge 1440\text{ px}$. | **Hoàn thành** |
| `UBL-WEB-003` | Lập trình Bảng Chấm công Trực tiếp & Thẻ KPI | Xây dựng lưới 4 thẻ KPI nhảy số thời gian thực và bảng Live Table có hiệu ứng chớp sáng khi nhận tin nhắn STOMP. | `UXD-WEB-003`, `UXD-WEB-004` | `UBL-WEB-002`, `ABL-WEB-003` | Dòng mới chèn lên đầu bảng mượt mà; số đếm KPI tăng tự động theo thời gian thực. | **Hoàn thành** |
| `UBL-WEB-004` | Xây dựng Hộp thoại Cam kết & Hiển thị OTP | Thiết kế Modal 2 bước: Bước 1 khóa nút gửi đến khi cuộn hết văn bản; Bước 2 hiển thị mã OTP to rõ + QR Code + hiệu ứng Confetti khi hoàn tất. | `UXD-WEB-002` | `UBL-WEB-002`, `ABL-WEB-003` | Ràng buộc cuộn hoạt động chính xác; modal tự động đóng khi nhận sự kiện quét mặt từ Kiosk. | **Hoàn thành** |
| `UBL-WEB-005` | Xây dựng Lịch Chấm công Cá nhân & Xuất File | Phát triển Calendar Grid 7 cột hiển thị giờ chấm công của nhân viên; tích hợp chức năng xuất báo cáo Excel/PDF. | `UXD-WEB-005` | `UBL-WEB-002` | Tải xuống file Excel chuẩn định dạng; nhấp chuột xem Drawer chi tiết ngày tức thời. | **Hoàn thành** |
