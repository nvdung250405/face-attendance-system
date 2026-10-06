---
title: Kiosk Local Data Design
version: 2.0
status: Approved
owner: Edge Vision Lead & System Architect
---

# DATA DESIGN — Thiết kế Dữ liệu Cục bộ Phân hệ Kiosk


## 1. Local Data Design Elements & Architecture (Thành phần Thiết kế Dữ liệu Biên)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DTD-KSK-001` | SQLite Offline Queue Schema & WAL PRAGMA Tuning | Thiết kế bảng `offline_punches` và chỉ mục B-tree trên SQLite cục bộ, kích hoạt WAL mode và busy_timeout 5000ms. | `STK-005` | `DATA-KSK-001`, `DATA-KSK-006` | `DD-SYS-005` | Accepted |
| `DTD-KSK-002` | In-Memory NumPy Gallery Matrix Architecture | Thiết kế lớp `FaceGalleryManager` lưu trữ ma trận $N \times 512$ `float32`, nhân ma trận Cosine Similarity dưới 2ms cho 1,000 nhân sự. | `STK-004` | `DATA-KSK-002` | `DD-SYS-006` | Accepted |
| `DTD-KSK-003` | Local Edge Cooldown Cache Architecture | Thiết kế bộ đệm RAM `LocalCooldownCache` lưu mốc thời gian chấm công gần nhất, áp dụng cửa sổ 120s và tự động dọn dẹp sau 300s. | `STK-001` | `DATA-KSK-003` | `DD-SYS-002` | Accepted |
| `DTD-KSK-004` | Zero-Disk Image Memory Pipeline | Cơ chế cô lập khung hình camera và ảnh crop trong bộ nhớ RAM, giải phóng tức thì sau chu kỳ suy luận (< 350ms). | `STK-002` | `DATA-KSK-005` | `DD-SYS-003` | Accepted |
| `DTD-KSK-005` | Cấu trúc Cấu hình Vận hành Trạm (`KioskConfig`) | Dataclass nạp từ `.env` gồm `KIOSK_ID`, `BACKEND_URL`, `KIOSK_SECRET_TOKEN`, `CAMERA_DEVICE_INDEX` và các ngưỡng AI (`similarity = 0.50`, `liveness = 0.85`, `stability = 0.60s`); kiểm tra biến bắt buộc khi khởi động và không ghi log giá trị Secret Token. | `STK-007` | `DATA-KSK-004` | `DD-SYS-001` | Accepted |

---

## 2. Local Database Schema & Performance Tuning (`kiosk_local.db`)

CSDL SQLite cục bộ được sử dụng làm hàng đợi bền vững bảo đảm dữ liệu điểm danh không bị thất thoát ($\text{RPO} = 0$) khi mất mạng hoặc cúp điện đột ngột:

### 1.1. DDL Script Tạo Bảng & Chỉ mục
```sql
-- Khởi tạo bảng hàng đợi điểm danh ngoại tuyến
CREATE TABLE IF NOT EXISTS offline_punches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    punch_timestamp TEXT NOT NULL,       -- Chuỗi ISO-8601 kèm múi giờ (YYYY-MM-DDTHH:MM:SS.sss+07:00)
    punch_type TEXT NOT NULL,            -- CHECK_IN hoặc CHECK_OUT
    verification_method TEXT NOT NULL,   -- VERIFICATION_FACE hoặc VERIFICATION_PIN
    confidence_score REAL,              -- Cosine Similarity score (0.0000 - 1.0000)
    kiosk_id TEXT NOT NULL,             -- Mã trạm Kiosk thực hiện
    is_synced INTEGER NOT NULL DEFAULT 0,-- 0: Chưa đồng bộ, 1: Đã đồng bộ lên máy chủ
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Chỉ mục tối ưu hóa cho truy vấn quét các bản ghi chưa đồng bộ
CREATE INDEX IF NOT EXISTS idx_offline_sync ON offline_punches(is_synced, id);

-- Chỉ mục phục vụ thống kê lượt chấm trong ngày tại trạm
CREATE INDEX IF NOT EXISTS idx_offline_timestamp ON offline_punches(punch_timestamp DESC);
```

### 1.2. Cấu hình PRAGMA Tối ưu hóa I/O Biên
Mỗi khi khởi tạo kết nối CSDL trong ứng dụng Kiosk, các chỉ thị PRAGMA sau bắt buộc phải được kích hoạt:

```sql
PRAGMA journal_mode = WAL;          -- Ghi trước nhật ký (Write-Ahead Logging): Cho phép đọc và ghi đồng thời
PRAGMA synchronous = NORMAL;        -- Giảm thiểu thao tác fsync đĩa cứng, bảo đảm an toàn dữ liệu khi mất điện
PRAGMA busy_timeout = 5000;         -- Tự động chờ mở khóa tối đa 5,000ms nếu CSDL đang bận, chống lỗi DatabaseLocked
PRAGMA cache_size = -64000;         -- Dành riêng 64MB bộ nhớ đệm RAM cho SQLite
PRAGMA temp_store = MEMORY;         -- Lưu trữ các bảng tạm thời trong RAM
```

---

## 2. In-Memory NumPy Gallery Matrix Architecture (Cấu trúc Ma trận RAM)

Để đạt mục tiêu thời gian so khớp danh tính 1:N dưới 2 mili-giây cho 1,000 nhân sự trên CPU thuần mà không giật lag màn hình camera:

### 2.1. Cấu trúc Lớp `FaceGalleryManager`
```text
┌────────────────────────────────────────────────────────────────────────┐
│                          FaceGalleryManager                            │
├────────────────────────────────────────────────────────────────────────┤
│ - _matrix: np.ndarray (shape: [N, 512], dtype: np.float32)             │
│ - _id_map: np.ndarray (shape: [N], dtype: np.int64)                    │
│ - _metadata: dict[int, dict]  # {emp_id: {"name": ..., "code": ...}}   │
│ - _version: int                                                        │
│ - _lock: threading.Lock (hoặc QReadWriteLock)                          │
├────────────────────────────────────────────────────────────────────────┤
│ + load_gallery(items: list[dict]) -> None                              │
│ + match(query_vector: np.ndarray, threshold: float) -> tuple[int, flt]  │
│ + add_or_update(emp_id: int, vector: np.ndarray, meta: dict) -> None   │
│ + remove(emp_id: int) -> None                                          │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Thuật toán So khớp Cosine Vector hóa (Vectorized Cosine Matcher)
Giả sử vector khuôn mặt trích xuất từ camera là $\vec{u} \in \mathbb{R}^{512}$ đã được chuẩn hóa độ dài ($||\vec{u}||_2 = 1.0$).
Ma trận danh mục $\mathbf{M} \in \mathbb{R}^{N \times 512}$ chứa $N$ khuôn mặt nhân viên đã chuẩn hóa độ dài hàng ($||\mathbf{M}_{i,:}||_2 = 1.0$).

1. **Phép nhân ma trận tính toàn bộ điểm tương đồng Cosine trong 1 phép tính duy nhất**:
   $$\vec{s} = \mathbf{M} \cdot \vec{u}^T \quad \left(\vec{s} \in \mathbb{R}^N, \quad s_i \in [-1.0, 1.0]\right)$$
2. **Tìm nhân sự có độ tương đồng cao nhất**:
   $$i^* = \arg\max(\vec{s}), \quad s_{\max} = \vec{s}[i^*]$$
3. **Thẩm định ngưỡng nhận diện**:
   * Nếu $s_{\max} \ge \text{SIMILARITY\_THRESHOLD}$ (mặc định $0.50$): Xác định danh tính khớp là nhân viên `_id_map[i*]`, trả về `(employee_id, s_max)`.
   * Nếu $s_{\max} < 0.50$: Kết luận người lạ / không tìm thấy thông tin trong danh mục.

### 2.3. Cơ chế Nạp Nóng Không Khóa Dừng (Thread-Safe Hot-Patching)
Khi trạm Kiosk nhận được thông điệp đẩy từ topic WebSocket STOMP `/topic/kiosk-gallery`:
* **Thao tác Thêm / Cập nhật (`ADD_VECTOR`)**:
  1. Kiểm tra nếu `employee_id` đã tồn tại trong `_id_map`: Cập nhật lại dòng tương ứng trong `_matrix`.
  2. Nếu là nhân viên mới:
     ```python
     with self._lock:
         self._matrix = np.vstack([self._matrix, new_vector])
         self._id_map = np.append(self._id_map, emp_id)
         self._metadata[emp_id] = meta_info
     ```
* **Thao tác Xóa Nhân sự Thôi việc (`DELETE_VECTOR`)**:
  ```python
  with self._lock:
      idx = np.where(self._id_map == emp_id)[0]
      if len(idx) > 0:
          self._matrix = np.delete(self._matrix, idx[0], axis=0)
          self._id_map = np.delete(self._id_map, idx[0])
          self._metadata.pop(emp_id, None)
  ```
Toàn bộ thao tác nạp nóng diễn ra trong vòng $< 1\text{ ms}$, camera stream vẫn tiếp tục hiển thị $30\text{ FPS}$ mà không hề bị giật hoặc đứng hình.

---

## 3. Local Cooldown Cache Management (Quản lý Bộ đệm Cooldown Biên)

* **Cấu trúc lưu trữ**: `_cooldown_cache: dict[int, float]` lưu `employee_id` và mốc giờ epoch của lần quẹt thành công gần nhất.
* **Logic Kiểm tra**:
  ```python
  current_time = time.monotonic()
  last_punch = _cooldown_cache.get(emp_id, 0.0)
  if current_time - last_punch < 120.0:
      remaining_seconds = int(120.0 - (current_time - last_punch))
      return CooldownRejected(remaining_seconds)
  # Nếu qua 120s: Chấp thuận và cập nhật mốc giờ mới
  _cooldown_cache[emp_id] = current_time
  ```
* **Dọn dẹp Tự động (Garbage Collection)**: Định kỳ mỗi 5 phút, tiến trình xóa các `emp_id` có `current_time - last_punch > 300.0` để giữ dung lượng RAM hashmap luôn nhỏ hơn $100\text{ KB}$.
