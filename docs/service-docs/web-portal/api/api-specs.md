# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Web Portal

> **Mã tài liệu:** `SPEC-API-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả các interface REST API mà Web Portal tiêu thụ từ Backend và các kênh WebSocket STOMP đăng ký nhận sự kiện.

---

## 1. Consumed REST Interfaces (Các Giao diện REST Tiêu thụ)

| ID | Tên Giao diện | Phương thức & URL | Mục đích Kỹ thuật & Nghiệp vụ | Xác thực |
| :--- | :--- | :--- | :--- | :--- |
| `API-WEB-001` | Xác thực Đăng nhập | `POST /api/v1/auth/login` | Gửi thông tin email/mật khẩu và nhận về Access Token / Refresh Token. | Public |
| `API-WEB-002` | Ký Cam kết Dữ liệu Sinh trắc | `POST /api/v1/employee/consent` | Gửi xác nhận cam kết và nhận mã OTP 6 số ngẫu nhiên kèm thời hạn 48h. | Bearer JWT |
| `API-WEB-003` | Lấy Danh sách Lịch sử Điểm danh | `GET /api/v1/admin/attendance` | Truy vấn danh sách điểm danh toàn công ty theo ngày, phòng ban và từ khóa. | Bearer JWT (`HR_MANAGER`, `ADMIN`) |
| `API-WEB-004` | Lấy Lịch sử Điểm danh Cá nhân | `GET /api/v1/employee/attendance`| Truy vấn lịch sử chấm công của chính nhân viên đang đăng nhập. | Bearer JWT (`EMPLOYEE`) |
| `API-WEB-005` | Quản lý Hồ sơ Nhân sự | `GET /api/v1/admin/employees` | Truy vấn danh sách nhân viên và trạng thái kích hoạt khuôn mặt. | Bearer JWT (`HR_MANAGER`, `ADMIN`) |

---

## 2. Subscribed STOMP Topics (Các Kênh WebSocket Đăng ký)

| ID | Tên Topic Đăng ký | Mục đích Nhận Dữ liệu | Xử lý Giao diện |
| :--- | :--- | :--- | :--- |
| `API-WEB-006` | `/topic/live-attendance` | Nhận thông báo mỗi khi có bản ghi điểm danh mới thành công từ Kiosk. | Bổ sung dòng mới vào bảng Live Table và tăng bộ đếm thẻ KPI. |
| `API-WEB-007` | `/topic/enrollment/{otp}` | Nhận thông báo khi nhân viên quét mặt thành công tại trạm Kiosk. | Tự động đóng Modal đăng ký trên Web nhân viên và hiển thị thông báo thành công. |
