# DATA DESIGN — Thiết kế Chi tiết Dữ liệu & Lưu trữ Hệ thống

> **Mã tài liệu:** `DES-DAT-01`  
> **Cấp độ:** Cấp Hệ thống (System-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết lược đồ CSDL PostgreSQL chuẩn 3NF (`DTD-SYS-`), cấu trúc CSDL cục bộ SQLite WAL, cấu trúc ma trận bộ nhớ RAM và các chỉ mục tối ưu hóa hiệu năng truy vấn.

---

## 1. Enterprise Database Model (Lược đồ CSDL Quan hệ PostgreSQL 16+)

| ID | Tên Bảng CSDL | Khóa Chính (PK) | Khóa Ngoại (FK) & Ràng buộc | Chỉ mục Hiệu năng (Indexes) | Realizes | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `DTD-SYS-001` | `employees` | `id` (BIGSERIAL) | `emp_code` (UK), `email` (UK) | `idx_employees_status` ON (`status`) | `DATA-SYS-001`, `DATA-SYS-009` | Approved |
| `DTD-SYS-002` | `shifts` | `id` (BIGSERIAL) | `shift_code` (UK, NOT NULL) | B-Tree mặc định | `DATA-SYS-002` | Approved |
| `DTD-SYS-003` | `employee_shifts` | `id` (BIGSERIAL) | FK `employee_id` $\rightarrow$ `employees(id)`<br/>FK `shift_id` $\rightarrow$ `shifts(id)` | B-Tree ON (`employee_id`, `effective_from`) | `DATA-SYS-003` | Approved |
| `DTD-SYS-004` | `attendance_records` | `id` (BIGSERIAL) | FK `employee_id` $\rightarrow$ `employees(id)` | `idx_attendance_emp_date` ON (`employee_id`, `punch_date`)<br/>`idx_attendance_punch_time` ON (`punch_time` DESC) | `DATA-SYS-004` | Approved |
| `DTD-SYS-005` | `biometric_templates`| `id` (BIGSERIAL) | FK `employee_id` $\rightarrow$ `employees(id)`<br/>`template_vector_encrypted` (BYTEA) | `idx_biometric_emp_active` ON (`employee_id`, `is_active`) | `DATA-SYS-005`, `DATA-SYS-010` | Approved |
| `DTD-SYS-006` | `enrollment_otps` | `id` (BIGSERIAL) | FK `employee_id` $\rightarrow$ `employees(id)`<br/>`otp_hash` (VARCHAR 64) | `idx_otp_hash_active` ON (`otp_hash`, `is_used`, `expires_at`) | `DATA-SYS-006`, `DATA-SYS-011` | Approved |
| `DTD-SYS-007` | `consent_audit_logs` | `id` (BIGSERIAL) | FK `employee_id` $\rightarrow$ `employees(id)` | B-Tree ON (`employee_id`, `agreed_at`) | `DATA-SYS-007` | Approved |
| `DTD-SYS-008` | `compliance_audit_logs`| `id` (BIGSERIAL)| Ghi nhận hành vi xóa dữ liệu 20 ngày | B-Tree ON (`performed_at` DESC) | `DATA-SYS-013` | Approved |
| `DTD-SYS-009` | `excuse_requests` | `id` (BIGSERIAL) | FK `employee_id` $\rightarrow$ `employees(id)` | B-Tree ON (`employee_id`, `status`) | `DATA-SYS-008` | Approved |

---

## 2. Local Database & In-Memory Structures (Lưu trữ Biên & Bộ nhớ RAM)

### 2.1. CSDL SQLite WAL Cục bộ tại Trạm Kiosk (`kiosk_local.db`)
* **Bảng `offline_punches`**:
```sql
CREATE TABLE IF NOT EXISTS offline_punches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    punch_timestamp TEXT NOT NULL,       -- Chuỗi ISO-8601 tại thời điểm quét
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
* **Cấu hình PRAGMA SQLite**:
  * `PRAGMA journal_mode = WAL;` (Ghi log song song, đọc non-blocking).
  * `PRAGMA synchronous = NORMAL;` (Cân bằng tốc độ ghi đĩa và bảo vệ dữ liệu).
  * `PRAGMA busy_timeout = 5000;` (Chờ khóa CSDL tối đa 5.0 giây).

### 2.2. Cấu trúc Ma trận Gallery RAM Kiosk (NumPy Matrix)
* **Ma trận đặc trưng**: $\mathbf{M} \in \mathbb{R}^{N \times 512}$ kiểu `np.float32` (chiếm $\sim 2\text{ MB}$ cho $1,000$ nhân viên).
* **Mảng ánh xạ định danh**: `gallery_index_map = [emp_id_0, emp_id_1, ..., emp_id_{N-1}]`.
* **Cơ chế nạp nóng (Hot-patching)**: Khi nhận bản tin STOMP thêm nhân viên, Kiosk thực hiện nối mảng `np.vstack([M, new_vector])` và cập nhật `id_map` trong RAM tức thời không cần khởi động lại.

---

## 3. Data Design Decisions (Quyết định Thiết kế Dữ liệu)

| ID | Quyết định Thiết kế Dữ liệu | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `DD-DTD-001` | Lưu trữ vector đặc trưng mã hóa dưới dạng `BYTEA` thay vì kiểu vector chuyên dụng (như pgvector). | Vector chỉ được giải mã và nạp vào RAM Kiosk để so khớp tại biên (Edge-First), Backend không thực hiện tìm kiếm vector nên dùng BYTEA tiêu chuẩn giúp tối ưu bảo mật và không đòi hỏi extension ngoài. | `PD-002`, `PD-005` | Approved |
| `DD-DTD-002` | Tách riêng Initialization Vector (IV 12 bytes) và Authentication Tag (16 bytes) thành các cột độc lập trong CSDL. | Giúp kiểm soát tính toàn vẹn của khối AES-256-GCM, hỗ trợ giải mã chuẩn mực không cần cắt ghép chuỗi nhị phân. | `SRS-001`, `STK-015` | Approved |
| `DD-DTD-003` | Áp dụng chế độ Write-Ahead Logging (WAL) cho SQLite cục bộ tại Kiosk. | Cho phép tiến trình nhận diện ghi lượt chấm vào CSDL ngay cả khi luồng đồng bộ ngầm đang đọc dữ liệu, hoàn toàn không bị nghẽn (Zero Lock Contention). | `PD-004`, `INF-011` | Approved |
