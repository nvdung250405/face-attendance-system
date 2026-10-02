# DATA DESIGN — Thiết kế Dữ liệu Cục bộ Phân hệ Kiosk

> **Mã tài liệu:** `DES-DAT-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết lược đồ CSDL cục bộ SQLite WAL `kiosk_local.db` và cấu trúc mảng ma trận RAM NumPy của trạm Kiosk Desktop.

---

## 1. Local Database Schema (`kiosk_local.db`)

* **Bảng `offline_punches`**:
```sql
CREATE TABLE IF NOT EXISTS offline_punches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    punch_timestamp TEXT NOT NULL,       -- Chuỗi ISO-8601 tại thời điểm quét thực tế
    punch_type TEXT NOT NULL,            -- CHECK_IN hoặc CHECK_OUT
    verification_method TEXT NOT NULL,   -- VERIFICATION_FACE hoặc VERIFICATION_PIN
    confidence_score REAL,
    kiosk_id TEXT NOT NULL,
    is_synced INTEGER NOT NULL DEFAULT 0, -- 0: Chưa đồng bộ, 1: Đã đồng bộ
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_offline_sync ON offline_punches(is_synced, id);
```

* **Cấu hình PRAGMA Tối ưu hóa**:
  * `PRAGMA journal_mode = WAL;` (Ghi log song song, đọc non-blocking).
  * `PRAGMA synchronous = NORMAL;` (Cân bằng tốc độ ghi đĩa và bảo vệ dữ liệu khi cúp điện).
  * `PRAGMA busy_timeout = 5000;` (Thời gian chờ mở khóa tối đa 5 giây).

---

## 2. In-Memory NumPy Gallery Matrix

* **Ma trận đặc trưng**: $\mathbf{M} \in \mathbb{R}^{N \times 512}$ kiểu `np.float32`.
* **Mảng chỉ số**: `id_map = np.array([emp_1, emp_2, ..., emp_N], dtype=np.int64)`.
* **Công thức so khớp nhanh**:
  $$\vec{s} = \mathbf{M} \cdot \vec{u}^T$$
  Trong đó $\vec{u}$ là vector khuôn mặt query đã được chuẩn hóa độ dài ($L_2\text{ Norm} = 1.0$).
* **Định danh khớp**: Chỉ số $i^* = \arg\max(\vec{s})$. Nếu $s_{i^*} \ge 0.50$, trả về nhân viên `id_map[i*]`.
