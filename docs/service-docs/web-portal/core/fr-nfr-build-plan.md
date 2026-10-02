# FR/NFR BUILD PLAN — Kế hoạch Thi công Cốt lõi Phân hệ Web Portal

> **Mã tài liệu:** `PLN-BLD-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công chức năng cốt lõi (`CBL-WEB-`) của Cổng Web Portal.

---

## 1. Approach & Sequencing (Chiến lược Thi công Web Cốt lõi)

$$\text{Auth Store \& Router} \rightarrow \text{Consent \& OTP Module} \rightarrow \text{STOMP Realtime Client} \rightarrow \text{Live Attendance Dashboard} \rightarrow \text{Report Exporter}$$

---

## 2. Core Build Work Items (Danh mục Hạng mục Thi công Cốt lõi)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `CBL-WEB-001` | Lập trình Auth Store & Protected Routes | Xây dựng Zustand store quản lý user, token, và React Router bọc Auth Guard kiểm tra Role. | `SOL-WEB-001` | `FND-WEB-001` | Chặn truy cập trái phép; tự động điều hướng đúng trang HR hoặc Employee. | **Hoàn thành** |
| `CBL-WEB-002` | Lập trình Luồng Ký Cam kết Informed Consent | Xây dựng Modal điều khoản pháp lý, xử lý nút ký, gọi API và hiển thị OTP 6 số kèm mã QR. | `SOL-WEB-002` | `CBL-WEB-001` | Hiển thị mã QR và OTP rõ ràng; tự động đóng modal khi nhận được tín hiệu WebSocket. | **Hoàn thành** |
| `CBL-WEB-003` | Lập trình Dịch vụ Kết nối STOMP Client | Xây dựng Hook `useStompClient` kết nối tới `/ws-attendance`, tự động kết nối lại khi rớt mạng. | `SOL-WEB-003` | `FND-WEB-003` | Nhận tin nhắn ổn định; cập nhật trạng thái kết nối trực tuyến/ngoại tuyến. | **Hoàn thành** |
| `CBL-WEB-004` | Lập trình Bảng Chấm công HR Trực tiếp | Xây dựng bảng hiển thị sự kiện điểm danh thời gian thực, tự động thêm dòng mới vào đầu bảng. | `SOL-WEB-004` | `CBL-WEB-003` | Dòng mới chèn lên đầu kèm hiệu ứng ánh sáng nhẹ trong 3s; không giật lag. | **Hoàn thành** |
| `CBL-WEB-005` | Lập trình Module Xuất Báo cáo Excel/PDF | Xây dựng dịch vụ trích xuất bảng dữ liệu và tải xuống file Excel/PDF định dạng chuẩn. | `SOL-WEB-005` | `CBL-WEB-004` | Xuất file đầy đủ định dạng tiêu đề, thời gian, tên công ty và số liệu chấm công. | **Hoàn thành** |
