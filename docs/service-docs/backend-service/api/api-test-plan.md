---
title: Backend API Test Plan
version: 2.0
status: Approved
owner: Backend QA & API Lead
---

# API TEST PLAN — Kế hoạch Kiểm thử Giao diện & Hợp đồng API Backend

## 1. Approach Decisions (Quyết định Tiếp cận Kiểm thử API)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-BE-003` | Sử dụng MockMvc kết hợp RestAssured để kiểm thử tự động hợp đồng API. | Cho phép kiểm tra toàn diện cả tầng Web MVC (Validation, Serialization) và tích hợp HTTP thực thụ. | `STK-011`, `API-BE-001` | Accepted |
| `APC-BE-004` | Tích hợp kiểm thử tải mô phỏng Kiosk gửi punch đồng thời với Gatling. | Phát hiện sớm hiện tượng nghẽn luồng xử lý hoặc chậm trễ trên kênh WebSocket. | `NFR-BE-001`, `NFR-BE-002` | Accepted |

---

## 2. API Test Items (Danh mục Ca Kiểm thử Hợp đồng API)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-005` | Kiểm thử Xác thực Đăng nhập, Refresh Token & Quản lý Nhân sự | Kiểm tra xác thực `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, danh mục `GET /api/v1/admin/employees` và cơ chế RBAC JWT. | `API-BE-001`, `API-BE-002`, `API-BE-011`, `API-BE-015` | `BLD-BE-005`, `BLD-BE-007` | Đăng nhập đúng trả về 200 kèm JWT; đăng nhập sai trả về 401; refresh token hợp lệ cấp access token mới; truy cập admin khi thiếu quyền trả về 403. | Done |
| `TST-BE-006` | Kiểm thử Điểm danh Đơn lẻ & Gói Lô Kiosk | Kiểm tra tiếp nhận `POST /api/v1/kiosk/punch`, `POST /api/v1/kiosk/sync-batch`, xác thực `X-Kiosk-Id` và chuẩn hóa lỗi ProblemDetails RFC 7807. | `API-BE-003`, `API-BE-004`, `API-BE-015`, `API-BE-016` | `BLD-BE-006` | Header `X-Kiosk-Id` hợp lệ trả về HTTP 200 trong $\le 100\text{ ms}$; thiếu header trả về 401; lỗi dữ liệu trả về đúng RFC 7807 với `invalidParams`. | Done |
| `TST-BE-007` | Kiểm thử Tải Gallery, Thẩm định OTP & Đăng ký Mặt Mới | Kiểm tra `GET /api/v1/kiosk/gallery`, `POST /api/v1/kiosk/verify-otp`, `POST /api/v1/kiosk/enroll-face` và `POST /api/v1/employee/consent`. | `API-BE-005`, `API-BE-006`, `API-BE-007`, `API-BE-010`, `API-BE-015` | `BLD-BE-006` | `/kiosk/gallery` trả về danh sách vector 512D chuẩn; `/kiosk/verify-otp` xác thực OTP 48h; `/kiosk/enroll-face` lưu vector mã hóa; `/employee/consent` ghi vết thành công. | Done |
| `TST-BE-008` | Kiểm thử Kênh STOMP Broker & Truy vấn Lịch sử Điểm danh | Kiểm tra đẩy tin tức thời qua `/topic/live-attendance`, `/topic/kiosk-gallery`, `/topic/enrollment/{otp}` và các API tra cứu `GET /api/v1/admin/attendance`, `GET /api/v1/employee/attendance`. | `API-BE-008`, `API-BE-009`, `API-BE-012`, `API-BE-013`, `API-BE-014`, `API-BE-016` | `BLD-BE-008` | Client subscribe `/topic/live-attendance` nhận được bản tin JSON điểm danh ngay lập tức ($\le 50\text{ ms}$); API tra cứu trả về đúng cấu trúc phân trang ISO-8601. | Done |

---

## 3. Defect Management (Quản lý Lỗi Giao diện API)

* Sai lệch cấu trúc trường JSON (Schema Mismatch) hoặc mã lỗi sai được xếp loại **Critical (P1)** và phải được chỉnh sửa đồng bộ giữa Backend và Client.

