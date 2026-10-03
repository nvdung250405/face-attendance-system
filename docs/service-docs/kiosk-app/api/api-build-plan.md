---
title: Kiosk API Build Plan
version: 2.0
status: Approved
owner: Edge Vision Lead
---

# API BUILD PLAN — Kế hoạch Thi công Tầng Mạng Phân hệ Kiosk


## 1. Approach & Sequencing (Chiến lược Thi công Tầng Mạng)

$$\text{HTTP Client Wrapper (httpx)} \rightarrow \text{STOMP Subscriber Worker (stomp.py)} \rightarrow \text{Offline Sync Worker (SQLite WAL)}$$

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công Tầng Mạng)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `ABL-KSK-001` | Lập trình HTTP Client Wrapper | Xây dựng module đóng gói `httpx.Client` với các phương thức `send_punch()`, `sync_batch()`, `fetch_gallery()`, `verify_otp()`, `enroll_face()`, tự động tiêm header xác thực. | `APD-KSK-001` | `DBL-KSK-002` | Gọi API thành công; tự động bắt ngoại lệ timeout sau 3.0s; kích hoạt fallback ngoại tuyến khi rớt mạng. | **Hoàn thành** |
| `ABL-KSK-002` | Lập trình STOMP Subscriber Worker | Xây dựng `KioskStompWorker (QThread)` duy trì kết nối WebSocket STOMP tới Backend, nhận bản tin `/topic/kiosk-gallery`. | `APD-KSK-002` | `ABL-KSK-001` | Tự động kết nối lại (Exponential Backoff); nạp nóng (`ADD_VECTOR`) và xóa (`DELETE_VECTOR`) trên ma trận RAM tức thời mà không lock Camera Stream. | **Hoàn thành** |
| `ABL-KSK-003` | Lập trình Offline Sync Worker | Xây dựng luồng ngầm định kỳ 10s quét bảng `offline_punches`; gom lô tối đa 50 bản ghi gửi `POST /sync-batch` và cập nhật `status = 'SENT'`. | `APD-KSK-003` | `ABL-KSK-001`, `DBL-KSK-001` | Tự động đồng bộ bù khi mạng phục hồi mà không làm nghẽn UI Event Loop. | **Hoàn thành** |
