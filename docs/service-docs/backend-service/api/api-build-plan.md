---
title: Backend API Build Plan
version: 1.0
status: Approved
owner: Backend Lead
---

# API BUILD PLAN — Kế hoạch Thi công Giao tiếp Mạng Phân hệ Backend


## 1. Approach & Sequencing (Chiến lược Thi công Tầng Giao tiếp)

$$\text{Global Exception \& DTOs} \rightarrow \text{Kiosk REST Endpoints} \rightarrow \text{Admin/Employee REST} \rightarrow \text{STOMP Broker Handlers}$$

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công Tầng Giao tiếp)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `ABL-BE-001` | Lập trình DTOs & Validation Rules | Định nghĩa các Java Record DTOs kèm Jakarta Validation annotations (`@NotNull`, `@Size`, `@Pattern`). | `APD-BE-001`, `APD-BE-004` | `FND-BE-002` | Dữ liệu không hợp lệ tự động trả về lỗi 400 Bad Request kèm chi tiết trường lỗi. | **Hoàn thành** |
| `ABL-BE-002` | Lập trình Kiosk REST Controller | Xây dựng `KioskAttendanceController` tiếp nhận punch, sync-batch, gallery và xác thực OTP. | `APD-BE-001` | `ABL-BE-001`, `CBL-BE-003` | Kết nối thành công với Kiosk; xử lý phản hồi trong $\le 100\text{ ms}$. | **Hoàn thành** |
| `ABL-BE-003` | Lập trình Portal REST Controllers | Xây dựng `AuthController`, `AttendanceAdminController` và `ConsentController` cho Cổng Web. | `APD-BE-002` | `ABL-BE-001`, `CBL-BE-001` | Người dùng Web thực hiện được toàn bộ luồng đăng nhập, ký cam kết và xem báo cáo. | **Hoàn thành** |
| `ABL-BE-004` | Lập trình STOMP Message Broker | Cấu hình WebSocket channel interceptor, topic destination prefix `/topic` và endpoint `/ws-attendance`. | `APD-BE-003` | `FND-BE-005`, `CBL-BE-006` | Client Web và Kiosk nhận được bản tin cập nhật tức thời khi có sự kiện phát sinh. | **Hoàn thành** |
