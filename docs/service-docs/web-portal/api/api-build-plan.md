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

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `ABL-WEB-001` | Lập trình Axios Base Client & Request Interceptor | Đóng gói `axios` với baseURL, timeout $10\text{ s}$ và bộ chặn Request Interceptor tự động tiêm Bearer Token từ LocalStorage. | `APD-WEB-001` | `DBL-WEB-001`, `DBL-WEB-002` | Gọi API kèm token chuẩn xác; tự động từ chối nếu không có cấu hình baseURL. | **Hoàn thành** |
| `ABL-WEB-002` | Lập trình Token Refresh Interceptor | Xây dựng bộ chặn Response Interceptor bắt mã HTTP 401, quản lý Promise Queue chống Race Condition khi nhiều request 401 đồng thời. | `APD-WEB-002` | `ABL-WEB-001` | Tự động làm mới token trong suốt; các request đang treo được thực thi lại thành công; logout nếu refresh token hết hạn. | **Hoàn thành** |
| `ABL-WEB-003` | Lập trình StompWebSocketService & Hooks | Tích hợp `@stomp/stompjs` và SockJS; phát triển React Hook `useLiveAttendance` và `useEnrollmentStatus`. | `APD-WEB-003` | `DBL-WEB-003` | Nhận bản tin `/topic/live-attendance` tức thời; tự hủy subscription khi component unmount mà không rò rỉ bộ nhớ. | **Hoàn thành** |
