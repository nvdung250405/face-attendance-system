---
title: Web Portal API Test Plan
version: 1.0
status: Approved
owner: Web QA Lead
---

# API TEST PLAN — Kế hoạch Kiểm thử Tầng Mạng Web Portal

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Tầng truyền thông mạng của Web Portal bao gồm Axios HTTP Client, cơ chế bắt lỗi 401 & làm mới token tự động (Token Refresh Interceptor) và StompWebSocketService.
* **Mục tiêu**:
  * Đảm bảo mọi request cần xác thực đều được tự động tiêm Bearer Token.
  * Kiểm chứng khả năng giải quyết Race Condition khi có 5-10 request 401 đồng thời chỉ gửi duy nhất 1 request `/auth/refresh`.
  * Xác nhận kết nối WebSocket STOMP tự động hồi phục khi rớt mạng và không để lại rò rỉ bộ nhớ khi unmount component.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Mạng Web)

| ID | Quyết định Tiếp cận Kiểm thử Mạng Web | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-WEB-005` | Sử dụng `msw` (Mock Service Worker) bắt chặn request ở tầng network ảo. | Kiểm thử chân thực luồng HTTP mà không can thiệp vào mã nguồn nội bộ của Axios. | `STK-015`, `API-WEB-001` | Approved |
| `APC-WEB-006` | Mô phỏng kịch bản Token Hết Hạn Đồng Thời (Concurrent 401 Chaos Testing). | Xác thực cơ chế Mutex Promise Queue hoạt động hoàn hảo, bảo vệ Refresh Token không bị vô hiệu hóa do gọi lặp. | `APD-WEB-002`, `NFR-WEB-001` | Approved |

---

## 3. API Test Items (Danh mục Ca Kiểm thử Mạng Web)

| ID | Name | Covers | Level | Pass Criteria | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-009` | Kiểm thử Tự Động Gắn Bearer Token | `API-WEB-001` | Unit / Network | Request gửi đi tự động có header `Authorization: Bearer <token>`; request public không có header này. | Done |
| `TST-WEB-010` | Kiểm thử Mutex Refresh Interceptor khi 401 | `API-WEB-002`, `APD-WEB-002` | Integration / Concurrency | Bắn đồng thời 5 request trả về 401; chỉ có 1 request refresh được gọi; 5 request ban đầu retry thành công. | Done |
| `TST-WEB-011` | Kiểm thử Kết nối & Tự Reconnect STOMP | `API-WEB-007`, `APD-WEB-003` | Integration / Realtime | Mô phỏng WebSocket đóng bất ngờ; STOMP client kích hoạt cơ chế thử lại sau mỗi 5s và khôi phục kênh. | Done |
| `TST-WEB-012` | Kiểm thử Clean-up Subscription trong Hooks | `APD-WEB-003` | Component / Memory | Unmount component sử dụng `useLiveAttendance`; hàm cleanup gọi `subscription.unsubscribe()` giải phóng RAM. | Done |

---

## 4. Defect Management (Quản lý Lỗi Giao tiếp Mạng Web)

* Lỗi rơi vào vòng lặp Refresh Token vô tận hoặc đơ giao diện khi gọi API được xếp mức **Blocker (P0)**.
