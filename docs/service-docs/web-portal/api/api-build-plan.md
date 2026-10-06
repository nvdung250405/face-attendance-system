---
title: Web Portal API Build Plan
version: 2.0
status: Approved
owner: Web Lead
---

# API BUILD PLAN — Kế hoạch Thi công Tầng Mạng Phân hệ Web Portal


## 1. Approach & Sequencing (Chiến lược Thi công Tầng Mạng)

$$\text{Axios Base Client} \rightarrow \text{Mutex Token Refresh Interceptor} \rightarrow \text{STOMP Service \& React Hooks}$$

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công Tầng Mạng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-WEB-009` | Lập trình Axios Base Client & Request Interceptor | Đóng gói `axios` với baseURL, timeout $10\text{ s}$ và bộ chặn Request Interceptor tự động tiêm Bearer Token từ LocalStorage. | `APD-WEB-001` | `FND-WEB-001` | Gọi API kèm token chuẩn xác; tự động từ chối nếu không có cấu hình baseURL. | Done |
| `BLD-WEB-010` | Lập trình Token Refresh Interceptor | Xây dựng bộ chặn Response Interceptor bắt mã HTTP 401, quản lý Promise Queue chống Race Condition khi nhiều request 401 đồng thời. | `APD-WEB-002` | `BLD-WEB-009` | Tự động làm mới token trong suốt; các request đang treo được thực thi lại thành công; logout nếu refresh token hết hạn. | Done |
| `BLD-WEB-011` | Lập trình StompWebSocketService & Hooks | Tích hợp `@stomp/stompjs` và SockJS; phát triển React Hook `useLiveAttendance` và `useEnrollmentStatus`. | `APD-WEB-003` | `BLD-WEB-009` | Nhận bản tin `/topic/live-attendance` tức thời; tự hủy subscription khi component unmount mà không rò rỉ bộ nhớ. | Done |
| `BLD-WEB-022` | Lập trình Bộ Client Dịch vụ Vòng đời | Xây dựng `AdminEmployeeService`, `CredentialService`, `ShiftAdminService`, `PayrollPeriodService`, `DataSubjectService`, `LogoutService`, `NotificationService`, `ComplianceAdminService` và `ReportExportService`. | `APD-WEB-004`, `APD-WEB-005`, `APD-WEB-006`, `APD-WEB-007`, `APD-WEB-008`, `APD-WEB-009`, `APD-WEB-010`, `APD-WEB-011`, `APD-WEB-012` | `BLD-WEB-009` | Mọi giao diện vòng đời gọi đúng hợp đồng Backend; lỗi 400/401/403/409 được chuẩn hoá thành thông điệp hiển thị được; mật khẩu tạm không bị cache. | Planned |
