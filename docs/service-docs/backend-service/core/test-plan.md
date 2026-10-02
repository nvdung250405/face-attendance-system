# TEST PLAN — Kế hoạch Kiểm thử Nội bộ Phân hệ Backend

> **Mã tài liệu:** `PLN-TST-BE-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `backend-service`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục ca kiểm thử chức năng và phi chức năng nội bộ (`TST-BE-`) của máy chủ trung tâm Backend.

---

## 1. Approach & Frameworks (Công cụ & Phương pháp Kiểm thử)

* **Framework**: JUnit 5, Mockito, Spring Boot Test, Testcontainers (PostgreSQL 16), MockMvc.
* **Tiêu chuẩn hoàn thành**: 100% ca kiểm thử pass; độ bao phủ dòng lệnh gói dịch vụ cốt lõi $\ge 85\%$; không có cảnh báo bảo mật nghiêm trọng từ SonarQube/Trivy.

---

## 2. Backend Test Items (Danh mục Ca Kiểm thử Backend)

| ID | Tên Ca Kiểm thử | Covers Spec | Mức độ Test | Tiêu chí Đạt (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-001` | Xác thực Đăng nhập & Sinh JWT Token | `FR-BE-001` | Unit / Security | Cấp phát token hợp lệ khi đúng thông tin; trả về 401 khi sai mật khẩu. | **Passed** |
| `TST-BE-002` | Tiếp nhận Điểm danh & Tính Phút Đi muộn | `FR-BE-002`, `NFR-BE-001` | Integration | Lưu thành công vào CSDL; tính đúng trạng thái `LATE` và số phút trễ; thời gian $\le 100\text{ ms}$. | **Passed** |
| `TST-BE-003` | Xử lý Gói lô Đồng bộ Bù Ngoại tuyến | `FR-BE-003` | Integration | Gửi gói 50 bản ghi lưu thành công 100%; không phát sinh bản ghi trùng lặp. | **Passed** |
| `TST-BE-004` | Mã hóa & Giải mã Vector AES-256-GCM | `FR-BE-004`, `FR-BE-006` | Unit / Crypto | Dữ liệu lưu trong CSDL ở dạng chuỗi byte mã hóa; giải mã ra đúng 512 giá trị float ban đầu. | **Passed** |
| `TST-BE-005` | Vòng đời Phiên Đăng ký Khuôn mặt OTP | `FR-BE-005`, `FR-BE-006` | Functional | Chỉ tạo OTP khi có cam kết Consent; từ chối khi nhập sai hoặc hết hạn 48h. | **Passed** |
| `TST-BE-006` | Phát sóng Bản tin WebSocket STOMP | `FR-BE-007` | Integration | Subscriber nhận đúng JSON payload trên `/topic/live-attendance` trong $\le 50\text{ ms}$. | **Passed** |
| `TST-BE-007` | Kiểm tra Ghi vết Kiểm toán Bất biến | `FR-BE-008`, `NFR-BE-005` | Functional | Cập nhật bản ghi điểm danh sinh ra đúng một dòng trong bảng `audit_logs`. | **Passed** |
| `TST-BE-008` | Kiểm thử Tải Điểm danh Đồng thời (Load Test)| `NFR-BE-002` | Performance | Chịu tải $500\text{ req/s}$ với tỷ lệ lỗi HTTP 5xx $< 0.01\%$; CPU $\le 75\%$. | **Passed** |
