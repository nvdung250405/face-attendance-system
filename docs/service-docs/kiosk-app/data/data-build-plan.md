---
title: Kiosk Local Data Build Plan
version: 2.0
status: Approved
owner: Edge Vision Lead
---

# DATA BUILD PLAN — Kế hoạch Thi công Tầng Dữ liệu Cục bộ Kiosk


## 1. Approach & Sequencing (Chiến lược Thi công Dữ liệu Cục bộ)

$$\text{SQLite WAL Database Setup} \rightarrow \text{Offline Queue Operations} \rightarrow \text{NumPy RAM Matrix & Cooldown Handler}$$

---

## 2. Data Build Work Items (Danh mục Hạng mục Thi công Dữ liệu)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `DBL-KSK-001` | Khởi tạo CSDL SQLite WAL | Tạo bảng `offline_punches`, chỉ mục `idx_offline_sync`, `idx_offline_retention` và áp dụng PRAGMA WAL, synchronous=NORMAL. | `DTD-KSK-001` | `FND-KSK-002` | CSDL khởi tạo tại `kiosk_local.db`; `PRAGMA journal_mode` trả về `wal`. | **Hoàn thành** |
| `DBL-KSK-002` | Lập trình Thao tác Hàng đợi Ngoại tuyến | Xây dựng các hàm `enqueue_punch()`, `fetch_pending_batch(limit=50)`, `mark_synced(local_ids)`. | `DATA-KSK-001` | `DBL-KSK-001` | Ghi đệm giao dịch ngoại tuyến $< 5\text{ ms}$; bốc lô tối đa 50 bản ghi tuần tự. | **Hoàn thành** |
| `DBL-KSK-003` | Lập trình Ma trận Gallery RAM & Cooldown | Xây dựng bộ quản lý ma trận NumPy $\mathbf{M} \in \mathbb{R}^{N \times 512}$, tính Cosine $\vec{s} = \mathbf{M} \cdot \vec{u}^T$, nạp nóng Atomic Swap và Cooldown Cache 120s. | `DATA-KSK-002`, `DATA-KSK-003` | `FND-KSK-002` | Tính tích vô hướng $< 2\text{ ms}$ cho $N = 1000$; nạp nóng vector mới vào RAM mà không làm giật khung hình camera. | **Hoàn thành** |
