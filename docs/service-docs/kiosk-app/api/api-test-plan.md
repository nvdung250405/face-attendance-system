---
title: Kiosk API Test Plan
version: 1.0
status: Approved
owner: Edge Vision QA Lead
---

# API TEST PLAN — Kế hoạch Kiểm thử Tầng Mạng Phân hệ Kiosk

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ các giao tiếp mạng giữa ứng dụng Kiosk Desktop với Backend thông qua HTTP REST Client (`httpx`) và WebSocket STOMP Subscriber (`stomp.py`).
* **Mục tiêu**:
  * Đảm bảo cơ chế tự động chuyển tiếp ngoại tuyến (Offline Fallback) kích hoạt chính xác khi mất kết nối mạng.
  * Xác nhận luồng đồng bộ ngầm định kỳ 10s gom lô tối đa 50 bản ghi gửi bù thành công 100%.
  * Kiểm chứng việc tiếp nhận bản tin STOMP `/topic/kiosk-gallery` và nạp nóng vector vào RAM không làm gián đoạn luồng camera.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Mạng Kiosk)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-009` | Giả lập máy chủ Backend bằng `pytest-httpx` và Mock STOMP Broker. | Cho phép chạy kiểm thử tự động cô lập trong CI mà không phụ thuộc hạ tầng mạng thật. | `STK-007`, `API-KSK-001` | Accepted |
| `APC-KSK-010` | Kiểm thử tiêm lỗi ngắt kết nối mạng (Network Chaos Testing). | Xác thực tính ổn định của vòng lặp kết nối lại (Exponential Backoff) và lưu đệm dữ liệu. | `NFR-KSK-003`, `RSK-001` | Accepted |

---

## 3. API Test Items (Danh mục Ca Kiểm thử Mạng Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-009` | Gửi Điểm danh Trực tiếp & Header Xác thực | Kiểm tra gọi `POST /kiosk/punch` có đủ header `X-Kiosk-Id` và Bearer token. | `API-KSK-001`, `APD-KSK-001` | `BLD-KSK-009` | Gửi request có đủ header; nhận phản hồi 200 trong $\le 500\text{ ms}$. | Done |
| `TST-KSK-010` | Chuyển tiếp Ngoại tuyến khi Lỗi Mạng | Kiểm tra tự động ghi SQLite khi ngắt mạng hoặc timeout 3.0s. | `API-KSK-001`, `FR-KSK-006` | `BLD-KSK-009` | Client tự động bắt lỗi timeout 3s, ghi vào `offline_punches` và báo thành công cục bộ. | Done |
| `TST-KSK-011` | Đồng bộ Bù Gói Lô (Offline Sync Worker) | Kiểm tra worker ngầm 10s bốc lô 50 bản ghi gửi `sync-batch`. | `API-KSK-002`, `APD-KSK-003` | `BLD-KSK-011` | Khôi phục mạng; worker tự động gom lô 50 bản ghi gửi `sync-batch` và cập nhật `is_synced = 1`. | Done |
| `TST-KSK-012` | Lắng nghe STOMP & Nạp Nóng Vector | Kiểm tra subscribe `/topic/kiosk-gallery` và Atomic Swap RAM. | `API-KSK-006`, `APD-KSK-002` | `BLD-KSK-010` | Nhận bản tin STOMP thêm nhân viên; ma trận RAM cập nhật vector mới ngay tức thì. | Done |

---

## 4. Defect Management (Quản lý Lỗi Giao tiếp Mạng)

* Sự cố mất gói tin điểm danh không lưu đệm được xếp loại **Blocker (P0)** và cần được kiểm tra với cơ chế khóa SQLite WAL.
