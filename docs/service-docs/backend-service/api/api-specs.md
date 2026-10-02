# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Backend

> **Mã tài liệu:** `SPEC-API-BE-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `backend-service`)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các interface REST API và kênh WebSocket STOMP mà máy chủ trung tâm Backend cung cấp cho Kiosk Desktop và Web Portal.

---

## 1. Provided REST Interfaces (Các Giao diện REST Cung cấp)

| ID | Tên Giao diện | Phương thức & URL | Mục đích Kỹ thuật & Nghiệp vụ | Phân quyền / Xác thực |
| :--- | :--- | :--- | :--- | :--- |
| `API-BE-001` | Xác thực Đăng nhập Hệ thống | `POST /api/v1/auth/login` | Cấp phát cặp Access Token và Refresh Token cho người dùng Web. | Public (Rate limit 10 req/phút) |
| `API-BE-002` | Làm mới Mã Token Truy cập | `POST /api/v1/auth/refresh` | Cấp phát Access Token mới từ Refresh Token hợp lệ. | Public |
| `API-BE-003` | Tiếp nhận Điểm danh Từ Kiosk | `POST /api/v1/kiosk/punch` | Nhận bản ghi điểm danh đơn lẻ tức thì từ trạm Kiosk. | Kiosk Secret Token (`X-Kiosk-Id`) |
| `API-BE-004` | Tiếp nhận Đồng bộ Bù Ngoại tuyến | `POST /api/v1/kiosk/sync-batch` | Tiếp nhận gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi mạng phục hồi. | Kiosk Secret Token (`X-Kiosk-Id`) |
| `API-BE-005` | Cung cấp Danh mục Vector ArcFace | `GET /api/v1/kiosk/gallery` | Cung cấp toàn bộ danh mục vector sinh trắc học để nạp vào RAM Kiosk. | Kiosk Secret Token (`X-Kiosk-Id`) |
| `API-BE-006` | Xác minh Mã OTP Kích hoạt | `POST /api/v1/kiosk/verify-otp` | Thẩm định mã OTP 6 số để mở khóa camera quét mặt trên trạm Kiosk. | Kiosk Secret Token (`X-Kiosk-Id`) |
| `API-BE-007` | Tiếp nhận Vector Mẫu Mới | `POST /api/v1/kiosk/enroll-face` | Tiếp nhận vector 512D mới kèm OTP để mã hóa lưu CSDL và kích hoạt NV. | Kiosk Secret Token (`X-Kiosk-Id`) |
| `API-BE-008` | Quản lý & Báo cáo Điểm danh | `GET /api/v1/admin/attendance` | Truy vấn, lọc, xuất báo cáo lịch sử điểm danh nhân sự cho HR. | Bearer JWT (Role `HR_MANAGER`, `ADMIN`) |
| `API-BE-009` | Tra cứu Điểm danh Cá nhân | `GET /api/v1/employee/attendance`| Nhân viên tra cứu lịch sử chấm công theo tháng của chính mình. | Bearer JWT (Role `EMPLOYEE`) |
| `API-BE-010` | Ký Cam kết Dữ liệu Sinh trắc | `POST /api/v1/employee/consent` | Ghi nhận chữ ký điện tử Informed Consent và tự động sinh mã OTP 48h. | Bearer JWT (Role `EMPLOYEE`) |
| `API-BE-011` | Quản lý Danh sách Nhân sự | `GET /api/v1/admin/employees` | Quản lý danh sách nhân viên, phòng ban và trạng thái kích hoạt khuôn mặt. | Bearer JWT (Role `HR_MANAGER`, `ADMIN`) |

---

## 2. WebSocket STOMP Channels (Kênh Đẩy Dữ liệu Thời gian thực)

| ID | Tên Kênh / Topic | Chiều Dữ liệu | Mục đích Truyền thông |
| :--- | :--- | :---: | :--- |
| `API-BE-012` | `/topic/kiosk-gallery` | Server $\rightarrow$ Kiosk | Bắn thông báo cập nhật vector mới (ADD) hoặc vô hiệu hóa vector (DELETE) vào RAM Kiosk. |
| `API-BE-013` | `/topic/live-attendance` | Server $\rightarrow$ Web | Đẩy bản tin sự kiện điểm danh trực tiếp lên bảng Dashboard của nhân sự. |
| `API-BE-014` | `/topic/enrollment/{otp}` | Server $\rightarrow$ Web | Thông báo trạng thái đăng ký khuôn mặt tại Kiosk thành công để tự đóng Modal trên Web nhân viên. |
