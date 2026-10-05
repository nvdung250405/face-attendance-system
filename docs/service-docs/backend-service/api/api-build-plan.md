---
title: Backend API Build Plan
version: 2.0
status: Approved
owner: Backend Lead
---

# API BUILD PLAN — Kế hoạch Thi công Giao diện & Hợp đồng API Backend

## 1. Approach Decisions (Quyết định Phương pháp Thi công API)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :--- | :---: |
| `APC-BE-008` | Chiến lược Thi công Hợp đồng API & STOMP Broker | Triển khai theo quy trình Contract-First: Lập trình Java Record DTOs & Jakarta Validation Rules $\rightarrow$ Lập trình Kiosk REST Controller $\rightarrow$ Lập trình Portal REST Controllers $\rightarrow$ Cấu hình STOMP Message Broker & Channel Interceptors. Định nghĩa hoàn thành (DoD): 100% endpoints được kiểm thử với MockMvc/RestAssured; phản hồi lỗi khớp chuẩn ProblemDetails RFC 7807; xử lý token header an toàn. | `ARC-002`, `STK-011` | Accepted |

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công API)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-BE-005` | Lập trình DTOs & Validation Rules | Định nghĩa các Java Record DTOs kèm Jakarta Validation annotations (`@NotNull`, `@Size`, `@Pattern`) và bộ bọc lỗi ProblemDetails RFC 7807. | `APD-BE-001`, `APD-BE-002`, `APD-BE-004` | `FND-BE-002` | Dữ liệu không hợp lệ tự động trả về lỗi 400 Bad Request kèm chi tiết `invalidParams`; mapping đúng các Java Records. | Done |
| `BLD-BE-006` | Lập trình Kiosk REST Controller | Xây dựng `KioskAttendanceController` tiếp nhận punch, sync-batch, gallery, verify-otp và enroll-face với header `X-Kiosk-Id`. | `APD-BE-001`, `APD-BE-006` | `BLD-BE-005` | Kết nối thành công với Kiosk; xử lý phản hồi trong $\le 100\text{ ms}$; thẩm định header `X-Kiosk-Id` và Secret Token chính xác. | Done |
| `BLD-BE-007` | Lập trình Portal REST Controllers | Xây dựng `AuthController`, `AttendanceAdminController`, `AttendanceEmployeeController` và `ConsentController` cho Cổng Web Portal. | `APD-BE-002` | `BLD-BE-005` | Người dùng Web thực hiện được toàn bộ luồng đăng nhập, làm mới token, ký cam kết, tra cứu điểm danh và xem danh sách nhân sự. | Done |
| `BLD-BE-008` | Lập trình STOMP Message Broker & Interceptors | Cấu hình WebSocket channel interceptor, topic destination prefix `/topic`, endpoint `/ws-attendance` và cơ chế xác thực kết nối. | `APD-BE-003`, `APD-BE-005` | `FND-BE-005` | Client Web và Kiosk nhận được bản tin cập nhật tức thời qua các topic `/topic/live-attendance`, `/topic/kiosk-gallery`, `/topic/enrollment/{otp}`. | Done |
