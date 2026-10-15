---
title: Đặc tả & Thiết kế Dữ liệu Cục bộ Phân hệ Kiosk (Kiosk Data Specs & Design)
version: 2.0
status: Approved
owner: Edge Vision Lead & Data Engineer
type: spec
scope: KSK
updated: 2026-10-08
---

# KIOSK DATA SPECS & DESIGN — Đặc tả & Thiết kế Dữ liệu Cục bộ Phân hệ Kiosk

Tài liệu này là **Spec Facet Data của Phân hệ Kiosk** (`kiosk-app`) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §7.2), tích hợp đồng nhất:
1. Danh mục 7 Thực thể Dữ liệu Cục bộ (`DATA-KSK-001..004`, `DATA-KSK-007..009`).
2. Danh mục 4 Quy tắc Lưu trữ & Bảo vệ Quyền riêng tư (`DATA-KSK-005..006`, `DATA-KSK-010..011`).
3. Danh mục 5 Thành phần Thiết kế Dữ liệu Kỹ thuật (`DTD-KSK-001` đến `DTD-KSK-005`).
4. Toàn bộ Lược đồ DDL SQLite có kiểm chuẩn chặt chẽ, kiến trúc ma trận RAM NumPy, bộ đệm cooldown, cấu hình bảo mật DPAPI và nhật ký vận hành.

---

## 1. Requirements (Yêu cầu Dữ liệu & Lưu trữ Cục bộ Kiosk)

### 1.1. Local Data Entities (Thực thể Dữ liệu Cục bộ & Bộ nhớ Biên)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-KSK-001` | Quản lý thực thể Hàng đợi Ngoại tuyến (`offline_punches`) lưu trữ toàn bộ giao dịch điểm danh trong CSDL cục bộ SQLite WAL khi mất mạng hoặc timeout gửi trực tuyến. | Entity / Storage | Must | `FR-KSK-015`, `FR-SYS-006`, `NFR-SYS-006`, `NFR-KSK-003`, `SRS-008`, `ARC-001` | Lưu `id`, `employee_id`, `punch_timestamp` UTC ISO-8601, `verification_method`, `confidence_score` (ràng buộc chéo bắt buộc NULL nếu PIN và [0.0, 1.0] nếu FACE), `source`, `kiosk_id`, `is_synced` (0/1/-1), `retry_count` (0-10); cam kết bảo toàn dữ liệu RPO = 0 ở chế độ PRAGMA synchronous = FULL; hỗ trợ unstick flow cho bản ghi kẹt. | Approved |
| `DATA-KSK-002` | Quản lý thực thể Ma trận Gallery RAM (`GalleryMatrix`) duy trì thường trực $N \times 512$ vector ArcFace đã chuẩn hóa L2 để so khớp Cosine 1:N tức thì dưới 2 ms. | Entity / Memory | Must | `FR-KSK-003`, `FR-KSK-008`, `FR-KSK-009`, `NFR-KSK-001`, `ARC-001`, `PD-002`, `INF-007` | Mảng `numpy.ndarray float32` kèm mảng `id_map`, hashmap `metadata_registry`, và số phiên bản `gallery_version`; nạp nóng hoán đổi nguyên tử (Atomic Swap) drop khung hình $\le 1\text{ frame}$; tự động phát hiện out-of-sync hoặc rollback để kích hoạt FORCE_SYNC. | Approved |
| `DATA-KSK-003` | Quản lý thực thể Bộ đệm Cooldown Biên (`LocalCooldownCache`) lưu trữ mốc giờ quẹt thành công gần nhất của từng nhân viên trong RAM trạm để chặn quẹt trùng dồn dập. | Entity / Memory | Must | `FR-KSK-005`, `FR-SYS-005`, `ARC-001`, `ARC-002`, `DD-SYS-006` | Cửa sổ giãn cách 120 giây; từ chối ghi nhận và hiển thị thông báo đã điểm danh khi quẹt lặp; luồng nền tự động dọn dẹp các mục quá 300 giây để giải phóng tài nguyên; hỗ trợ tiếp nhận mã lỗi 409 Conflict từ Backend. | Approved |
| `DATA-KSK-004` | Quản lý thực thể Cấu hình Vận hành Trạm (`KioskConfig`) lưu trữ các tham số camera, mạng, token xác thực, các ngưỡng AI khởi tạo và hỗ trợ cập nhật runtime an toàn có kiểm chuẩn. | Entity / Config | Must | `FR-KSK-009`, `FR-KSK-013`, `FR-KSK-017`, `FR-SYS-020`, `SRS-006`, `ARC-001`, `ARC-016` | Quản lý tham số phân định rõ thuộc tính Bắt buộc (Required) và Tùy chọn; thứ tự kiểm chuẩn phân tầng khi khởi động; kiểm chuẩn dải tham số an toàn (`ENROLL_LIVENESS_THOLD` thuộc `[0.85, 0.99]`); Circuit Breaker có đầy đủ cấu hình ngưỡng và trạng thái phục hồi. | Approved |
| `DATA-KSK-007` | Quản lý thực thể Bộ đệm Danh mục Khuôn mặt Cục bộ (`local_gallery_cache`) trong SQLite lưu trữ bản sao vector mã hóa AES-256-GCM phục vụ khởi động nguội khi mất mạng. | Entity / Storage | Must | `FR-KSK-009`, `NFR-KSK-009`, `FR-SYS-003`, `FR-SYS-014`, `SRS-001`, `ARC-001`, `ARC-007` | Lưu `employee_id`, `employee_code`, `full_name`, `department` (ràng buộc không rỗng), `vector_data` (2048 bytes), `iv` (12 bytes), `auth_tag` (16 bytes); quy trình xoay vòng khóa chuẩn 2-phase commit chống mất dữ liệu khi sập nguồn; khôi phục khóa qua Emergency Recovery Token. | Approved |
| `DATA-KSK-008` | Quản lý thực thể Trạng thái Vận hành Bền bỉ (`KioskPersistedState` & `KioskOperationalState`) phục vụ bảo toàn trạng thái khóa qua khởi động lại, báo cáo nhịp tim và chẩn đoán. | Entity / Runtime & DB | Must | `FR-KSK-010`, `FR-KSK-012`, `FR-KSK-014`, `NFR-KSK-008`, `ARC-012`, `ARC-016` | Duy trì trạng thái trạm (ACTIVE, LOCKED, MAINTENANCE) bền vững qua bảng SQLite `kiosk_persisted_state`; lưu vết `locked_at` để đánh giá mốc > 1 giờ kích hoạt FORCE_SYNC; theo dõi trọn vẹn số lần và cửa sổ Circuit Breaker; đồng bộ với heartbeat payload `FR-KSK-010`. | Approved |
| `DATA-KSK-009` | Quản lý thực thể Nhật ký Vận hành Cục bộ (`KioskOperationalLogs`) lưu trữ có cấu trúc JSON dòng đơn, làm sạch dữ liệu định danh cá nhân và tự động quay vòng lưu trữ. | Entity / Logging | Must | `NFR-KSK-010`, `FR-KSK-014`, `ARC-015`, `SRS-010` | Định dạng JSON chuẩn; tự động che giấu PII (họ tên, email; làm tròn chỉ số sinh trắc để chống tái định danh); thực thi chính sách quay vòng 3 tầng có thứ tự ưu tiên dọn dẹp dung lượng đĩa nghiêm ngặt. | Approved |

---

### 1.2. Local Storage Rules & Privacy Protection (Quy tắc Lưu trữ & Bảo vệ Quyền riêng tư)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-KSK-005` | Nguyên tắc Không Lưu Ảnh Thô (Zero Raw Image Retention tại biên): Tuyệt đối không lưu khung hình camera hay ảnh crop khuôn mặt xuống đĩa cứng Kiosk. | Privacy | Must | `SRS-004`, `SRS-001`, `NFR-KSK-009`, `PD-005` | Khung hình và crop chỉ nằm tạm trong RAM trong chu kỳ suy luận ($\le 350\text{ ms}$) và tự động giải phóng ngay sau chu kỳ; kiểm tra hệ thống tệp đĩa trạm tuyệt đối không tồn tại bất kỳ tệp hình ảnh khuôn mặt nào. | Approved |
| `DATA-KSK-006` | Quy tắc Vòng đời Hàng đợi Ngoại tuyến (Offline Queue Retention): Tự động dọn dẹp bản ghi đã đồng bộ sau 30 ngày, bảo toàn vĩnh viễn bản ghi chưa gửi. | Retention | Must | `FR-KSK-016`, `NFR-KSK-003`, `SRS-008`, `PD-002` | Bản ghi có `is_synced = 1` tự động xóa sau 30 ngày; bản ghi có `is_synced = 0` được bảo lưu vĩnh viễn trong CSDL SQLite đến khi gửi bù thành công lên máy chủ trung tâm (RPO = 0); bản ghi đạt ngưỡng MAX_RETRY được cách ly (`is_synced = -1`) nhưng không bị xóa. | Approved |
| `DATA-KSK-010` | Quy tắc Bảo vệ Khóa Mật mã & Kiểm soát Quyền Truy cập Cục bộ (Cryptographic Key & Access Control Rule). | Security | Must | `NFR-KSK-009`, `FR-KSK-004`, `FR-KSK-014`, `SRS-001`, `SRS-005`, `DD-SYS-028` | Khóa `LOCAL_STORAGE_KEY` và `KIOSK_SECRET_TOKEN` bắt buộc bảo vệ bằng Windows DPAPI (CryptProtectData); `KIOSK_ADMIN_PIN` lưu dạng băm an toàn Argon2id ($m=64\text{MB}, t=3, p=4$) trong tệp bảo vệ DPAPI; tuyệt đối không lưu mã băm PIN của người dùng trên trạm. | Approved |
| `DATA-KSK-011` | Quy tắc Tự dọn dẹp và Bảo toàn Toàn vẹn Dữ liệu khi Tắt Ứng dụng (Graceful Shutdown & Data Flush Rule). | Integrity | Must | `NFR-KSK-011`, `FR-KSK-017`, `SRS-008`, `ARC-001` | Khi tiến trình Kiosk nhận tín hiệu dừng (SIGTERM/SIGINT), toàn bộ lệnh ghi SQLite đang dở dang phải được commit hoàn tất (PRAGMA wal_checkpoint), giải phóng bộ nhớ RAM, xóa session đăng ký OTP dở dang trong $\le 3\text{ giây}$ mà không gây hỏng tệp CSDL. | Approved |

---

## 2. Data Design Elements (Thành phần Thiết kế Kỹ thuật Dữ liệu Biên)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DTD-KSK-001` | SQLite Offline Queue Schema & WAL PRAGMA Tuning | Thiết kế bảng `offline_punches` và chỉ mục B-tree trên SQLite cục bộ, kích hoạt WAL mode, `PRAGMA synchronous = FULL` và `busy_timeout = 5000ms`. | `STK-005` | `DATA-KSK-001`, `DATA-KSK-006` | `DD-KSK-002` | Accepted |
| `DTD-KSK-002` | In-Memory NumPy Gallery Matrix Architecture | Thiết kế lớp `FaceGalleryManager` lưu trữ ma trận $N \times 512$ `float32`, nhân ma trận Cosine Similarity dưới 2ms cho 1,000 nhân sự; hỗ trợ nạp phục hồi từ `local_gallery_cache`. | `STK-004` | `DATA-KSK-002`, `DATA-KSK-007` | `DD-KSK-003` | Accepted |
| `DTD-KSK-003` | Local Edge Cooldown Cache Architecture | Thiết kế bộ đệm RAM `LocalCooldownCache` lưu mốc thời gian chấm công gần nhất, áp dụng cửa sổ 120s và tự động dọn dẹp sau 300s. | `STK-001` | `DATA-KSK-003` | `DD-SYS-006` | Accepted |
| `DTD-KSK-004` | Zero-Disk Image Memory Pipeline | Cơ chế cô lập khung hình camera và ảnh crop trong bộ nhớ RAM, giải phóng tức thì sau chu kỳ suy luận ($< 350\text{ ms}$). | `STK-002` | `DATA-KSK-005` | `DD-SYS-003` | Accepted |
| `DTD-KSK-005` | Cấu trúc Cấu hình Vận hành Trạm (`KioskConfig`) | Dataclass nạp từ `.env` gồm `KIOSK_ID`, `BACKEND_URL`, `KIOSK_SECRET_TOKEN`, `CAMERA_DEVICE_INDEX` và các ngưỡng AI (`similarity = 0.50`, `liveness = 0.85`, `stability = 0.60s`); kiểm tra biến bắt buộc khi khởi động và bảo vệ qua Windows DPAPI. | `STK-007` | `DATA-KSK-004` | `DD-KSK-005` | Accepted |
| `DTD-KSK-006` | Persistent Operational State Storage | Thiết kế bảng SQLite `kiosk_persisted_state` lưu trữ trạng thái khóa trạm (`LOCKED`, `ACTIVE`), mốc `locked_at`, số lần thất bại Circuit Breaker và cấu trúc payload Heartbeat định kỳ. | `STK-005` | `DATA-KSK-008` | `DD-KSK-005` | Accepted |
| `DTD-KSK-007` | Structured Local Operational Logging | Thiết kế ghi log dòng đơn chuẩn JSON, tự động che giấu PII (họ tên, email, làm tròn mốc sinh trắc) và quy tắc xoay vòng dọn dẹp 3 tầng bảo vệ đĩa. | `STK-005` | `DATA-KSK-009` | `DD-KSK-005` | Accepted |
| `DTD-KSK-008` | Local DPAPI & Graceful Shutdown Protection | Thiết kế bảo vệ `LOCAL_STORAGE_KEY`, `KIOSK_SECRET_TOKEN` qua Windows DPAPI, băm Argon2id cho Admin PIN và luồng xử lý tín hiệu SIGTERM/SIGINT giải phóng RAM, commit WAL checkpoint an toàn trong $\le 3\text{ giây}$. | `STK-007` | `DATA-KSK-010`, `DATA-KSK-011` | `DD-SYS-028` | Accepted |

---

## 3. Local Storage Schemas & DDL (`kiosk_local.db`)

### 3.1. Cấu hình PRAGMA SQLite WAL Bắt buộc

Mỗi khi ứng dụng Kiosk mở kết nối tới tệp `kiosk_local.db`, các chỉ thị PRAGMA sau bắt buộc phải được kích hoạt để đảm bảo $\text{RPO} = 0$:

```sql
PRAGMA journal_mode = WAL;          -- Ghi trước nhật ký: Đọc và ghi đồng thời không khóa nghẽn
PRAGMA synchronous = FULL;          -- Bắt buộc ghi đĩa bền vững, cam kết RPO = 0 khi mất điện đột ngột
PRAGMA busy_timeout = 5000;         -- Tự động chờ tối đa 5,000ms nếu CSDL đang bận, chống DatabaseLocked
PRAGMA cache_size = -64000;         -- Cấp phát 64MB bộ nhớ đệm RAM cho SQLite
PRAGMA temp_store = MEMORY;         -- Lưu trữ bảng tạm thời trong RAM
```

### 3.2. Cấu trúc Bảng `offline_punches` (`DATA-KSK-001`, `DTD-KSK-001`)

```sql
CREATE TABLE IF NOT EXISTS offline_punches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    punch_timestamp TEXT NOT NULL CHECK (
        punch_timestamp GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
        OR punch_timestamp GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
    ),
    verification_method TEXT NOT NULL CHECK (verification_method IN ('VERIFICATION_FACE', 'VERIFICATION_PIN')),
    confidence_score REAL,
    source TEXT NOT NULL DEFAULT 'OFFLINE_NETWORK_DOWN' CHECK (source IN ('OFFLINE_NETWORK_DOWN', 'TIMEOUT_NO_RESPONSE')),
    time_unreliable INTEGER NOT NULL DEFAULT 0 CHECK (time_unreliable IN (0, 1)),
    kiosk_id TEXT NOT NULL,
    is_synced INTEGER NOT NULL DEFAULT 0 CHECK (is_synced IN (0, 1, -1)), -- 0: Chờ gửi, 1: Đã đồng bộ, -1: Kẹt quá Max Retry
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 10),
    last_attempt_at TEXT CHECK (
        last_attempt_at IS NULL
        OR last_attempt_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
        OR last_attempt_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
    ),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) CHECK (
        created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    ),
    synced_at TEXT CHECK (
        synced_at IS NULL
        OR synced_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
        OR synced_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
    ),
    CONSTRAINT chk_method_confidence CHECK (
        (verification_method = 'VERIFICATION_PIN' AND confidence_score IS NULL)
        OR (verification_method = 'VERIFICATION_FACE' AND confidence_score IS NOT NULL AND confidence_score >= 0.0 AND confidence_score <= 1.0)
    )
);

CREATE INDEX IF NOT EXISTS idx_punches_sync_fifo ON offline_punches(is_synced, id);
CREATE INDEX IF NOT EXISTS idx_punches_retention ON offline_punches(is_synced, synced_at);
```

#### Quy tắc Thử lại, Biên đếm & Gỡ kẹt Hàng đợi (Retry Policy & Unstick Flow)
1. **Exponential Backoff**: Khoảng cách thử lại tính theo công thức:
   $$T_{\text{backoff}} = \min(1.0 \times 2^{\text{retry\_count}}, 60.0)\text{ giây}$$
2. **Biên Retry (Boundary at MAX_RETRY = 10)**: Sau lần thử thứ 10 thất bại, hệ thống không tăng bộ đếm mà cập nhật `is_synced = -1` (trạng thái STUCK cách ly), bảo toàn vĩnh viễn trên đĩa ($\text{RPO} = 0$), không gây nghẽn mạng và phát tín hiệu cảnh báo trong Heartbeat (`FR-KSK-010`).
3. **Quy trình Gỡ kẹt**: Quản trị viên bấm "Thử lại hàng đợi kẹt" trên màn hình F14, Kiosk chạy:
   ```sql
   UPDATE offline_punches SET is_synced = 0, retry_count = 0, last_attempt_at = NULL WHERE is_synced = -1;
   ```

---

### 3.3. Cấu trúc Bảng `local_gallery_cache` (`DATA-KSK-007`)

```sql
CREATE TABLE IF NOT EXISTS local_gallery_cache (
    employee_id INTEGER PRIMARY KEY,
    employee_code TEXT NOT NULL CHECK (length(trim(employee_code)) > 0),
    full_name TEXT NOT NULL CHECK (length(trim(full_name)) > 0),
    department TEXT NOT NULL CHECK (length(trim(department)) > 0),
    vector_data BLOB NOT NULL CHECK (length(vector_data) = 2048), -- Đúng 2048 bytes (512 float32)
    iv BLOB NOT NULL CHECK (length(iv) = 12),                     -- Đúng 12 bytes (96-bit nonce)
    auth_tag BLOB NOT NULL CHECK (length(auth_tag) = 16),         -- Đúng 16 bytes (128-bit tag)
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) CHECK (
        updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    )
);

CREATE INDEX IF NOT EXISTS idx_gallery_emp_code ON local_gallery_cache(employee_code);
```

#### Quy trình Xoay vòng Khóa An toàn Chuẩn 2-Phase (`LOCAL_STORAGE_KEY`)
1. **Giai đoạn 1 (Khóa staging)**: Kiosk sinh khóa mới $K_{\text{new}}$, ghi tệp tạm `storage.key.dpapi.staging` chứa $(K_{\text{old}}, K_{\text{new}})$ qua Windows DPAPI.
2. **Giai đoạn 2 (Giao dịch SQLite)**: `BEGIN EXCLUSIVE TRANSACTION;` giải mã từng bản ghi bằng $K_{\text{old}}$, mã hóa lại bằng $K_{\text{new}}$ (sinh `iv` và `auth_tag` mới), sau đó `COMMIT;`.
3. **Giai đoạn 3 (Hoán đổi nguyên tử)**: Dùng Win32 `ReplaceFile` hoán đổi `storage.key.dpapi.staging` thành `storage.key.dpapi` (chỉ còn $K_{\text{new}}$). Hủy $K_{\text{old}}$ khỏi RAM.

---

### 3.4. Cấu trúc Bảng `kiosk_persisted_state` (`DATA-KSK-008`)

```sql
CREATE TABLE IF NOT EXISTS kiosk_persisted_state (
    singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
    station_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (station_status IN ('ACTIVE', 'LOCKED', 'MAINTENANCE')),
    locked_at TEXT CHECK (
        locked_at IS NULL
        OR locked_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    ),
    last_force_sync_at TEXT CHECK (
        last_force_sync_at IS NULL
        OR last_force_sync_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    ),
    circuit_breaker_status TEXT NOT NULL DEFAULT 'CLOSED' CHECK (circuit_breaker_status IN ('CLOSED', 'OPEN', 'HALF_OPEN')),
    circuit_breaker_invalid_count INTEGER NOT NULL DEFAULT 0 CHECK (circuit_breaker_invalid_count >= 0),
    circuit_breaker_window_start_at TEXT CHECK (
        circuit_breaker_window_start_at IS NULL
        OR circuit_breaker_window_start_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    ),
    circuit_breaker_opened_at TEXT CHECK (
        circuit_breaker_opened_at IS NULL
        OR circuit_breaker_opened_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    ),
    circuit_breaker_isolated_until TEXT CHECK (
        circuit_breaker_isolated_until IS NULL
        OR circuit_breaker_isolated_until GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    ),
    last_known_sync TEXT CHECK (
        last_known_sync IS NULL
        OR last_known_sync GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    ),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) CHECK (
        updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'
    )
);

INSERT OR IGNORE INTO kiosk_persisted_state (singleton_id, station_status) VALUES (1, 'ACTIVE');
```

---

## 4. In-Memory Data Structures (Cấu trúc Dữ liệu RAM & Vận hành)

### 4.1. Lớp `FaceGalleryManager` (`DATA-KSK-002`, `DTD-KSK-002`)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          FaceGalleryManager                            │
├────────────────────────────────────────────────────────────────────────┤
│ - _matrix: np.ndarray (shape: [N, 512], dtype: np.float32)             │
│ - _id_map: np.ndarray (shape: [N], dtype: np.int64)                    │
│ - _metadata: dict[int, dict]  # {emp_id: {"name": ..., "code": ...}}   │
│ - _version: int (Monotonic Sequence)                                   │
│ - _lock: threading.Lock (Atomic Swap Lock)                             │
├────────────────────────────────────────────────────────────────────────┤
│ + load_gallery(items: list[dict]) -> None                              │
│ + match(query_vector: np.ndarray, threshold: float) -> tuple[int, flt]  │
│ + add_or_update(emp_id: int, vector: np.ndarray, meta: dict) -> None   │
│ + remove(emp_id: int) -> None                                          │
└────────────────────────────────────────────────────────────────────────┘
```

Thuật toán so khớp vector hóa 1:N:
$$\vec{s} = \mathbf{M} \cdot \vec{u}^T \quad \left(\vec{s} \in \mathbb{R}^N, \quad s_i \in [-1.0, 1.0]\right), \quad i^* = \arg\max(\vec{s}), \quad s_{\max} = \vec{s}[i^*]$$
Xác nhận thành công khi $s_{\max} \ge \text{SIMILARITY\_THRESHOLD}$ (mặc định $0.50$).

### 4.2. Bộ đệm Cooldown RAM `LocalCooldownCache` (`DATA-KSK-003`, `DTD-KSK-003`)

* Cấu trúc: Hashmap `{employee_id: epoch_timestamp}`.
* Kiểm tra: Nếu $\text{CurrentTime} - \text{last\_punch\_time} < 120.0\text{ s}$, từ chối nhận diện mới với độ trễ phản hồi $< 1\text{ ms}$.
* Tác vụ dọn dẹp: Luồng nền chạy mỗi 300 giây xóa các mục có tuổi thọ $> 300.0\text{ s}$.

### 4.3. Cấu trúc Thực thể RAM `KioskOperationalState` (`DATA-KSK-008`)

```json
{
  "stationStatus": "ACTIVE",
  "lockedAt": null,
  "lastForceSyncAt": "2026-10-07T07:00:00Z",
  "cameraStatus": "OK",
  "networkStatus": "ONLINE",
  "ntpDriftMs": 12,
  "clockDriftDetected": false,
  "galleryCount": 1000,
  "pendingOfflinePunches": 0,
  "stuckOfflinePunches": 0,
  "circuitBreakerStatus": "CLOSED",
  "lastSyncTimestamp": "2026-10-07T08:30:00Z",
  "lastHeartbeatTimestamp": "2026-10-07T08:30:15Z",
  "appVersion": "2.0.0",
  "uptimeSeconds": 28800
}
```

### 4.4. Nhật ký Vận hành Cục bộ `KioskOperationalLogs` (`DATA-KSK-009`)

* **Che giấu PII**: Mã nhân viên che mờ (`NV-***42`), không log họ tên đầy đủ, chỉ số sinh trắc học làm tròn 2 chữ số thập phân (`similarity: 0.89`).
* **Chính sách xoay vòng 3 tầng**:
  1. Rollover theo dung lượng: Tệp $\ge 50\text{ MB} \rightarrow$ đổi tên `kiosk.log.YYYYMMDD_HHMMSS` và mở tệp mới.
  2. Thời hạn lưu trữ: Tự động xóa tệp xoay vòng $> 14\text{ ngày}$.
  3. Trần dung lượng cứng: Nếu tổng thư mục log $> 500\text{ MB}$, xóa FIFO các tệp cũ nhất cho tới khi dung lượng $< 450\text{ MB}$.

---

## 5. Decisions (Quyết định Thiết kế Liên quan)

* `DD-KSK-002`: SQLite WAL `PRAGMA synchronous = FULL` và `busy_timeout = 5000ms`.
* `DD-KSK-003`: Cấu trúc ma trận RAM $N \times 512$ `float32` kết hợp Atomic Pointer Swap.
* `DD-KSK-004`: Circuit Breaker đa tầng và quản lý trạng thái khóa bền vững `kiosk_persisted_state`.
* `DD-KSK-005`: Quản lý bảo mật khóa mật mã và biến môi trường qua Windows DPAPI.

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Dung lượng Bộ nhớ RAM Ma trận**: Với quy mô 1,000 nhân viên, ma trận RAM chiếm ~2 MB; với 10,000 nhân viên chiếm ~20 MB. Dung lượng này hoàn toàn nằm trong giới hạn an toàn của máy trạm 8GB/16GB RAM.
* **Thời gian Phục hồi 2-Phase**: Trường hợp cúp điện đột ngột trong khi đang xoay vòng khóa, Kiosk tự phục hồi trong chu kỳ kiểm tra khởi động nguội $\le 500\text{ ms}$ mà không cần can thiệp thủ công.
