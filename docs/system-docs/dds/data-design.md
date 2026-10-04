---
title: System Data Design
version: 1.0
status: Approved
owner: Data Architect
---

# DATA DESIGN — Thiết kế Chi tiết Dữ liệu & Lưu trữ Hệ thống

## 1. Enterprise Database Model (Lược đồ CSDL Quan hệ PostgreSQL 16+)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DTD-SYS-001` | Bảng `employees` | Bảng lưu trữ hồ sơ nhân viên, mã số, phòng ban, vai trò, hash mã PIN; PK `id`, Unique (`emp_code`, `email`), index trên `status`. | `STK-012` | `DATA-SYS-001`, `DATA-SYS-009` | - | Accepted |
| `DTD-SYS-002` | Bảng `shifts` | Bảng định nghĩa danh mục ca làm việc, giờ bắt đầu/kết thúc, thời gian ân hạn 15p; PK `id`, Unique `shift_code`. | `STK-012` | `DATA-SYS-002` | `DD-SYS-007` | Accepted |
| `DTD-SYS-003` | Bảng `employee_shifts` | Bảng phân công ca làm việc cho nhân viên theo mốc ngày hiệu lực; PK `id`, FK `employee_id`, FK `shift_id`, index (`employee_id`, `effective_from`). | `STK-012` | `DATA-SYS-003` | - | Accepted |
| `DTD-SYS-004` | Bảng `attendance_records` | Bảng lưu trữ lịch sử điểm danh thực tế (vào/ra, phương thức mặt/PIN, trạng thái, phút muộn); PK `id`, FK `employee_id`, index (`employee_id`, `punch_date`) và `punch_time`. | `STK-012` | `DATA-SYS-004` | `DD-SYS-006` | Accepted |
| `DTD-SYS-005` | Bảng `biometric_templates` | Bảng lưu trữ mẫu vector khuôn mặt 512D mã hóa AES-256-GCM; PK `id`, FK `employee_id`, cột `template_vector_encrypted` (BYTEA), IV và Auth Tag riêng. | `STK-012`, `STK-015` | `DATA-SYS-005`, `DATA-SYS-010` | `DD-SYS-003`, `DD-SYS-015`, `DD-SYS-016` | Accepted |
| `DTD-SYS-006` | Bảng `enrollment_otps` | Bảng quản lý mã OTP kích hoạt đăng ký khuôn mặt hạn 48h; PK `id`, FK `employee_id`, chuỗi băm `otp_hash`, index (`otp_hash`, `is_used`, `expires_at`). | `STK-012` | `DATA-SYS-006`, `DATA-SYS-011` | - | Accepted |
| `DTD-SYS-007` | Bảng `consent_audit_logs` | Bảng lưu vết văn bản thỏa thuận Informed Consent theo Luật 2025; PK `id`, FK `employee_id`, IP, User Agent, mốc thời gian ký. | `STK-012` | `DATA-SYS-007` | `DD-SYS-003` | Accepted |
| `DTD-SYS-008` | Bảng `compliance_audit_logs` | Bảng lưu vết kiểm toán hành vi tiêu hủy dữ liệu sinh trắc học sau 20 ngày; PK `id`, chi tiết hành vi, người thực hiện, thời điểm xóa. | `STK-012` | `DATA-SYS-013` | `DD-SYS-003` | Accepted |
| `DTD-SYS-009` | Bảng `excuse_requests` | Bảng quản lý đơn giải trình công (quên chấm/đi muộn); PK `id`, FK `employee_id`, lý do, file minh chứng, trạng thái duyệt. | `STK-012` | `DATA-SYS-008` | - | Accepted |

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

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-SYS-015` | Lưu trữ vector đặc trưng mã hóa dưới dạng BYTEA thay vì kiểu vector chuyên dụng (pgvector). | Toàn bộ suy luận và so khớp ma trận diễn ra tại biên Kiosk; Backend chỉ lưu trữ và chuyển tiếp bản ghi mã hóa. | Dùng extension pgvector, Lưu dạng chuỗi Base64 | Tiết kiệm chi phí mở rộng extension CSDL và tăng tốc độ đọc/ghi dữ liệu nhị phân. | `PD-002`, `PD-005` | Accepted |
| `DD-SYS-016` | Tách riêng Initialization Vector (IV 12 bytes) và Authentication Tag (16 bytes) thành các cột độc lập trong CSDL. | Phục vụ giải mã chuẩn xác theo đặc tả NIST SP 800-38D AES-GCM và dễ dàng audit cấu trúc mã hóa. | Ghép chung IV + Tag + Ciphertext vào 1 blob nhị phân | Tăng độ rõ ràng về cấu trúc dữ liệu bảo mật, thuận tiện kiểm tra tính toàn vẹn độc lập. | `SRS-001`, `DD-SYS-003` | Accepted |
