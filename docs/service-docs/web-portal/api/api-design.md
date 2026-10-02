# API DESIGN — Thiết kế Giao diện Truyền thông Phân hệ Web Portal

> **Mã tài liệu:** `DES-API-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết máy trạm Axios Client, bộ chặn lỗi tự động gia hạn token và dịch vụ kết nối STOMP của Web Portal.

---

## 1. Network Clients Architecture (Kiến trúc Máy trạm Mạng Web)

| ID | Thành phần Mạng Web | Định nghĩa & Trách nhiệm | Uses | Realizes | Quyết định | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APD-WEB-001` | Axios API Client Instance | Đóng gói `axios` với baseURL cấu hình qua biến môi trường, tự động chèn header `Authorization: Bearer <token>`. | `STK-015` | `API-WEB-001` đến `API-WEB-005` | `DD-APD-001` | Approved |
| `APD-WEB-002` | Axios Response Interceptor (Auto Refresh)| Tự động bắt lỗi 401 Unauthorized, gọi API làm mới token bằng Refresh Token và gửi lại request ban đầu trong suốt. | `STK-015` | `API-WEB-001` | `DD-APD-001` | Approved |
| `APD-WEB-003` | StompClientService & React Hooks | Quản lý vòng đời kết nối WebSocket STOMP qua `@stomp/stompjs` và SockJS, hỗ trợ hook `useLiveAttendance()`. | `STK-015` | `API-WEB-006`, `API-WEB-007` | `DD-SYS-004` | Approved |

---

## 2. Token Lifecycle & Interceptor Flow

```text
Request ──► [Axios Request Interceptor] ──► [Gắn Bearer Token] ──► [Backend API]
                                                                        │
                                   ┌────────────────────────────────────┴────────────────────────────────────┐
                                   ▼ (200 OK)                                                                ▼ (401 Unauthorized)
                             [Trả về dữ liệu]                                                      [Gọi /api/v1/auth/refresh]
                                                                                                             │
                                                                   ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                                                                   ▼ (Refresh Thành công)                                                               ▼ (Thất bại)
                                                     [Lưu Token mới & Thử lại Request]                                                     [Xóa Token & Chuyển về /login]
```
