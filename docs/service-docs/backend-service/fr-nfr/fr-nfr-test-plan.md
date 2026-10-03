---
title: Backend Core Test Plan
version: 1.0
status: Approved
owner: Backend QA Lead
---

# FR/NFR TEST PLAN — Kế hoạch Kiểm thử Nghiệp vụ Cốt lõi Backend

## 1. Approach & Frameworks (Công cụ & Phương pháp Kiểm thử)

* **Framework**: JUnit 5, Mockito, Spring Boot Test, Testcontainers (PostgreSQL 16), MockMvc.
* **Tiêu chuẩn hoàn thành**: 100% ca kiểm thử pass; độ bao phủ dòng lệnh gói dịch vụ cốt lõi $\ge 85\%$; không có cảnh báo bảo mật nghiêm trọng từ SonarQube/Trivy.

---

## 2. Core Test Items (Danh mục Ca Kiểm thử Cốt lõi Backend)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-009` | Xác thực Đăng nhập & Sinh JWT Token | Kiểm tra xác thực tài khoản và cấp phát JWT token có thời hạn kèm phân quyền RBAC. | `FR-BE-001` | `BLD-BE-009` | Cấp phát token hợp lệ khi đúng thông tin; trả về 401 khi sai mật khẩu. | Done |
| `TST-BE-010` | Tiếp nhận Điểm danh & Tính Phút Đi muộn | Kiểm tra tiếp nhận punch, tính toán ca kíp và ghi nhận trạng thái điểm danh. | `FR-BE-002`, `NFR-BE-001` | `BLD-BE-011` | Phản hồi trong $\le 100\text{ ms}$; phân loại trạng thái điểm danh chuẩn xác. | Done |
| `TST-BE-011` | Xử lý Gói lô Đồng bộ Bù Ngoại tuyến | Kiểm tra tiếp nhận gói 50 bản ghi đồng bộ bù từ Kiosk và xử lý idempotency. | `FR-BE-003` | `BLD-BE-012` | Gửi gói 50 bản ghi lưu thành công 100%; không phát sinh bản ghi trùng lặp. | Done |
| `TST-BE-012` | Mã hóa & Giải mã Vector AES-256-GCM | Kiểm tra bảo vệ vector ArcFace 512D với AES-256-GCM và IV ngẫu nhiên. | `FR-BE-004`, `FR-BE-006` | `BLD-BE-010` | Mã hóa và giải mã bảo toàn 100% dữ liệu gốc; sinh mới IV ngẫu nhiên mỗi lần mã hóa. | Done |
| `TST-BE-013` | Vòng đời Phiên Đăng ký Khuôn mặt OTP | Kiểm tra luồng cấp phát và thẩm định OTP 6 số kích hoạt nạp mặt có hạn 48h. | `FR-BE-005`, `FR-BE-006` | `BLD-BE-013` | Chỉ tạo OTP khi có cam kết Consent; từ chối khi nhập sai hoặc hết hạn 48h. | Done |
| `TST-BE-014` | Phát sóng Bản tin WebSocket STOMP | Kiểm tra phát sóng sự kiện điểm danh tức thời lên `/topic/live-attendance`. | `FR-BE-007` | `BLD-BE-014` | Subscriber nhận đúng JSON payload trên `/topic/live-attendance` trong $\le 50\text{ ms}$. | Done |
| `TST-BE-015` | Kiểm tra Ghi vết Kiểm toán Bất biến | Kiểm tra Spring AOP tự động ghi nhận mọi biến động dữ liệu nhạy cảm vào `audit_logs`. | `FR-BE-008`, `NFR-BE-005` | `BLD-BE-015` | Cập nhật bản ghi điểm danh sinh ra đúng một dòng trong bảng `audit_logs`. | Done |
| `TST-BE-016` | Kiểm thử Tải Điểm danh Đồng thời (Load Test) | Kiểm tra năng lực chịu tải đồng thời của máy chủ dưới áp lực 50 Kiosk. | `NFR-BE-002` | `BLD-BE-011` | Chịu tải $500\text{ req/s}$ với tỷ lệ lỗi HTTP 5xx $< 0.01\%$; CPU $\le 75\%$. | Done |
