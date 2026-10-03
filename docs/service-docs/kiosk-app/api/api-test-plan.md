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

| ID | Quyết định Tiếp cận Kiểm thử Mạng | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-API-01` | Giả lập máy chủ Backend bằng `pytest-httpx` và Mock STOMP Broker. | Cho phép chạy kiểm thử tự động cô lập trong CI mà không phụ thuộc hạ tầng mạng thật. | `STK-001`, `API-KSK-001` | Approved |
| `APC-KSK-API-02` | Kiểm thử tiêm lỗi ngắt kết nối mạng (Network Chaos Testing). | Xác thực tính ổn định của vòng lặp kết nối lại (Exponential Backoff) và lưu đệm dữ liệu. | `NFR-KSK-003`, `RSK-SYS-001` | Approved |

---

## 3. API Test Items (Danh mục Ca Kiểm thử Mạng Kiosk)

| ID | Tên Ca Kiểm thử | Covers Spec | Mức độ Test | Tiêu chí Đạt (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-API-001` | Gửi Điểm danh Trực tiếp & Header Xác thực | `API-KSK-001` | Integration | Gửi request có đủ `X-Kiosk-Id` và Bearer token; nhận phản hồi 200 trong $\le 500\text{ms}$. | **Passed** |
| `TST-KSK-API-002` | Chuyển tiếp Ngoại tuyến khi Lỗi Mạng | `API-KSK-001`, `FR-KSK-006` | Chaos / Unit | Ngắt mạng mô phỏng; client tự động bắt lỗi timeout 3s, ghi vào `offline_punches` và báo thành công cục bộ. | **Passed** |
| `TST-KSK-API-003` | Đồng bộ Bù Gói Lô (Offline Sync Worker) | `API-KSK-002` | Integration | Khôi phục mạng; worker tự động gom lô 50 bản ghi gửi `sync-batch` và đánh dấu `is_synced = 1`. | **Passed** |
| `TST-KSK-API-004` | Lắng nghe STOMP & Nạp Nóng Vector | `API-KSK-005` | Realtime / E2E | Nhận bản tin STOMP thêm nhân viên; ma trận RAM cập nhật vector mới ngay tức thì. | **Passed** |

---

## 4. Defect Management (Quản lý Lỗi Giao tiếp Mạng)

* Sự cố mất gói tin điểm danh không lưu đệm được xếp loại **Blocker (P0)** và cần được kiểm tra với cơ chế khóa SQLite WAL.
