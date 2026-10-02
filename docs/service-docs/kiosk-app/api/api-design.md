# API DESIGN — Thiết kế Giao tiếp Mạng Phân hệ Kiosk

> **Mã tài liệu:** `DES-API-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết máy trạm HTTP Client (`httpx`), cơ chế retry, timeout và STOMP WebSocket Subscriber của trạm Kiosk Desktop.

---

## 1. Network Clients Architecture (Kiến trúc Máy trạm Mạng Kiosk)

| ID | Thành phần Mạng Kiosk | Định nghĩa & Trách nhiệm | Uses | Realizes | Quyết định | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APD-KSK-001` | Kiosk HTTP Client (`httpx`) | Đóng gói thư viện `httpx` gửi các request REST API đính kèm header `X-Kiosk-Id` và Bearer Secret Token; timeout 3.0s. | `STK-001` | `API-KSK-001` đến `API-KSK-005` | `DD-APD-001` | Approved |
| `APD-KSK-002` | Kiosk STOMP Subscriber Worker | Luồng ngầm `QThread` duy trì kết nối WebSocket STOMP tới Backend qua `stomp.py`, lắng nghe topic `/topic/kiosk-gallery`. | `STK-001` | `API-KSK-006` | `DD-SYS-004` | Approved |
| `APD-KSK-003` | Bộ Điều phối Ngoại tuyến & Retry | Tự động phát hiện lỗi timeout mạng, chuyển hướng lưu vào hàng đợi SQLite WAL và kích hoạt worker đồng bộ bù định kỳ 10s. | `STK-001`, `STK-009` | `FR-KSK-006` | `DD-SYS-002` | Approved |

---

## 2. Dynamic Hot-Patching Sequence (Trình tự Nạp Nóng Vector qua STOMP)

```text
Backend Server ──► [WS STOMP: /topic/kiosk-gallery] ──► [KioskStompWorker (QThread)]
                                                                  │
                                                                  ▼
[Cập nhật Ma trận RAM tức thời] ◄── [np.vstack / Xóa dòng] ◄── [Phân loại Action: ADD/DELETE]
```
