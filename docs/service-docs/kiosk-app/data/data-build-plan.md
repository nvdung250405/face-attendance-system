# DATA BUILD PLAN — Kế hoạch Thi công Tầng Dữ liệu Cục bộ Kiosk

> **Mã tài liệu:** `PLN-DBL-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công lưu trữ dữ liệu cục bộ (`DBL-KSK-`) của phân hệ Kiosk Desktop.

---

## 1. Approach & Sequencing (Chiến lược Thi công Dữ liệu Cục bộ)

$$\text{SQLite WAL Database Setup} \rightarrow \text{Offline Queue Operations} \rightarrow \text{NumPy RAM Matrix Handler}$$

---

## 2. Data Build Work Items (Danh mục Hạng mục Thi công Dữ liệu)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `DBL-KSK-001` | Khởi tạo CSDL SQLite WAL | Viết script khởi tạo bảng `offline_punches`, chỉ mục `idx_offline_sync` và thiết lập PRAGMA WAL. | `DTD-KSK-001` | `FND-KSK-005` | CSDL khởi tạo tại `kiosk_local.db`; kiểm tra `PRAGMA journal_mode` trả về `wal`. | **Hoàn thành** |
| `DBL-KSK-002` | Lập trình Thao tác Hàng đợi Ngoại tuyến | Xây dựng các hàm `enqueue_punch()`, `fetch_unsynced_batch(limit=50)`, `mark_synced(ids)`. | `DATA-KSK-001` | `DBL-KSK-001` | Ghi đệm giao dịch an toàn khi mất mạng; đọc lô 50 bản ghi nhanh chóng. | **Hoàn thành** |
| `DBL-KSK-003` | Lập trình Ma trận Gallery RAM | Xây dựng lớp quản lý ma trận NumPy $\mathbf{M}$, hỗ trợ nhân ma trận Cosine, nạp nóng `np.vstack` khi có nhân viên mới. | `DATA-KSK-002` | `FND-KSK-002` | Tính tích vô hướng $< 2\text{ ms}$; nạp nóng vector mới vào RAM mà không làm gián đoạn camera. | **Hoàn thành** |
