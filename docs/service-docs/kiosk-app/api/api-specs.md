# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Kiosk

> **Mã tài liệu:** `SPEC-API-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả các interface mà trạm Kiosk tiêu thụ (Consumed Interfaces) từ Backend và kênh nhận dữ liệu đẩy thời gian thực WebSocket STOMP.

---

## 1. Consumed Interfaces (Các Giao diện Kiosk Tiêu thụ)

| ID | Tên Giao diện | Phương thức & URL Mục tiêu | Mục đích Kỹ thuật & Nghiệp vụ | Ràng buộc Xác thực |
| :--- | :--- | :--- | :--- | :--- |
| `API-KSK-001` | Gửi Điểm danh Trực tiếp | `POST /api/v1/kiosk/punch` | Gửi bản ghi điểm danh đơn lẻ lên Backend ngay sau khi quét thành công. | Header `X-Kiosk-Id` + Bearer Secret Token |
| `API-KSK-002` | Đồng bộ Bù Ngoại tuyến | `POST /api/v1/kiosk/sync-batch` | Đẩy gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi mạng phục hồi. | Header `X-Kiosk-Id` + Bearer Secret Token |
| `API-KSK-003` | Tải Danh mục Vector Mẫu | `GET /api/v1/kiosk/gallery` | Tải toàn bộ danh mục vector đặc trưng nhân sự để nạp vào RAM Kiosk. | Header `X-Kiosk-Id` + Bearer Secret Token |
| `API-KSK-004` | Xác minh OTP Kích hoạt | `POST /api/v1/kiosk/verify-otp` | Xác thực mã OTP 6 số để mở khóa quét mặt tại trạm Kiosk. | Header `X-Kiosk-Id` + Bearer Secret Token |
| `API-KSK-005` | Nạp Vector Mẫu Mới | `POST /api/v1/kiosk/enroll-face` | Gửi vector 512D mới kèm OTP để Backend mã hóa lưu CSDL. | Header `X-Kiosk-Id` + Bearer Secret Token |
| `API-KSK-006` | Kênh STOMP Cập nhật Gallery | Topic `/topic/kiosk-gallery` | Lắng nghe thông điệp đẩy nạp nóng vector mới hoặc xóa vector nhân sự thôi việc vào RAM. | WebSocket STOMP Connection |
