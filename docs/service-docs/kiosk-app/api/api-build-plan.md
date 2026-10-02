# API BUILD PLAN — Kế hoạch Thi công Tầng Mạng Phân hệ Kiosk

> **Mã tài liệu:** `PLN-ABL-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công giao tiếp mạng (`ABL-KSK-`) của phân hệ Kiosk Desktop.

---

## 1. Approach & Sequencing (Chiến lược Thi công Tầng Mạng)

$$\text{HTTP Client Wrapper} \rightarrow \text{STOMP Subscriber Worker} \rightarrow \text{Offline Sync Worker}$$

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công Tầng Mạng)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `ABL-KSK-001` | Lập trình HTTP Client Wrapper | Xây dựng module đóng gói `httpx` với các hàm `send_punch()`, `sync_batch()`, `fetch_gallery()`, đính kèm xác thực. | `APD-KSK-001` | `FND-KSK-002` | Gọi API thành công; tự động bắt ngoại lệ timeout sau 3.0s. | **Hoàn thành** |
| `ABL-KSK-002` | Lập trình STOMP Subscriber Worker | Xây dựng `KioskStompWorker (QThread)` duy trì kết nối WebSocket STOMP tới Backend, nhận bản tin `/topic/kiosk-gallery`. | `APD-KSK-002` | `FND-KSK-002` | Tự động kết nối lại khi rớt mạng; nạp nóng vector vào RAM thành công. | **Hoàn thành** |
| `ABL-KSK-003` | Lập trình Offline Sync Worker | Xây dựng luồng ngầm định kỳ 10s ping máy chủ; gom lô tối đa 50 bản ghi gửi `sync-batch` và cập nhật `is_synced = 1`. | `APD-KSK-003` | `ABL-KSK-001`, `CBL-KSK-006` | Tự động đồng bộ bù khi có mạng mà không làm đơ giao diện Kiosk. | **Hoàn thành** |
