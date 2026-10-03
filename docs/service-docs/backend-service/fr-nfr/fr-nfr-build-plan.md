---
title: Backend Core Build Plan
version: 1.0
status: Approved
owner: Backend Lead
---

# FR/NFR BUILD PLAN — Kế hoạch Thi công Cốt lõi Phân hệ Backend


## 1. Approach & Sequencing (Chiến lược Thi công Backend)

Trình tự phát triển phân tầng nghiệp vụ theo nguyên tắc Dependency Inversion:
$$\text{Security \& Auth} \rightarrow \text{Biometric Encryption} \rightarrow \text{Attendance Engine} \rightarrow \text{Batch Sync} \rightarrow \text{OTP Lifecycle} \rightarrow \text{STOMP Broadcaster}$$

---

## 2. Core Build Work Items (Danh mục Hạng mục Thi công Cốt lõi)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-BE-009` | Lập trình Security Filter & JWT Provider | Xây dựng bộ phát hành token RSA-256 hoặc HMAC-SHA256, filter chặn và phân quyền theo Role. | `SOL-BE-001` | `FND-BE-004` | Cấp phát token hợp lệ; từ chối token hết hạn; phân quyền URL chính xác. | Done |
| `BLD-BE-010` | Lập trình Dịch vụ Mã hóa AES-256-GCM | Xây dựng `BiometricCryptoService` mã hóa mảng byte vector ArcFace với khóa bí mật từ biến môi trường. | `SOL-BE-004` | `FND-BE-001` | Mã hóa và giải mã bảo toàn 100% dữ liệu gốc; sinh mới IV ngẫu nhiên mỗi lần mã hóa. | Done |
| `BLD-BE-011` | Lập trình Động cơ Xử lý Điểm danh | Xây dựng `AttendanceService` đối chiếu ca kíp, tính toán số phút trễ, lưu bản ghi vào PostgreSQL. | `SOL-BE-002` | `BLD-BE-009` | Phản hồi trong $\le 100\text{ ms}$; phân loại trạng thái điểm danh chuẩn xác. | Done |
| `BLD-BE-012` | Lập trình Xử lý Gói lô Đồng bộ Bù | Xây dựng dịch vụ tiếp nhận mảng 50 bản ghi, thực thi batch insert có bắt ngoại lệ bản ghi trùng. | `SOL-BE-003` | `BLD-BE-011` | Lưu trọn vẹn gói lô không lỗi giao dịch; trả về danh sách ID thành công. | Done |
| `BLD-BE-013` | Lập trình Quản lý Đăng ký & OTP | Xây dựng logic kiểm tra điều kiện Informed Consent, sinh mã OTP 6 số, kiểm tra thời hạn 48 giờ. | `SOL-BE-005` | `BLD-BE-010` | Nhân viên ký cam kết mới được sinh OTP; OTP hết hạn không cho kích hoạt. | Done |
| `BLD-BE-014` | Tích hợp Bộ Phát sóng STOMP | Tích hợp `SimpMessagingTemplate` bắn sự kiện điểm danh lên `/topic/live-attendance` và gallery lên `/topic/kiosk-gallery`. | `SOL-BE-006` | `FND-BE-005` | Kiosk và Web Portal nhận được JSON payload ngay khi Backend hoàn tất lưu CSDL. | Done |
| `BLD-BE-015` | Lập trình Aspect Kiểm toán Bất biến | Xây dựng Spring AOP ghi log các thao tác cập nhật dữ liệu của người dùng vào bảng `audit_logs`. | `SOL-BE-007` | `BLD-BE-009` | Mọi thay đổi giờ công hoặc thông tin nhân viên đều có bản ghi audit chi tiết. | Done |
