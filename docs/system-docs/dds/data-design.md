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
| `DTD-SYS-010` | Bảng SQLite WAL `offline_punches` | Bảng hàng đợi ngoại tuyến tại trạm Kiosk; PK `id` AUTOINCREMENT, `employee_id`, `punch_timestamp`, `punch_type`, `verification_method`, `kiosk_id`, `is_synced`. | `STK-009` | `DATA-SYS-004`, `FR-SYS-006` | `DD-SYS-002` | Accepted |
| `DTD-SYS-011` | Cấu trúc Ma trận Bộ nhớ RAM (`GalleryMatrix`) | Ma trận $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32` nạp trong RAM Kiosk kèm mảng đối chiếu `gallery_index_map` phục vụ so khớp Cosine $< 2\text{ ms}$. | `STK-008` | `DATA-SYS-010`, `FR-SYS-003` | `DD-SYS-001` | Accepted |

---

## 2. Storage & Access (Cấu trúc Lưu trữ, Chỉ mục & Quản lý Di chuyển)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DTD-SYS-012` | Cơ chế Di chuyển Lược đồ CSDL Flyway | Bộ quản lý migration Flyway trong Spring Boot (`db/migration/V*.sql`), đóng vai trò nguồn sự thật duy nhất (SSOT) cho tên bảng, kiểu dữ liệu và chỉ mục PostgreSQL. | `STK-011`, `STK-012` | `DATA-SYS-001`, `DATA-SYS-005` | `DD-SYS-003` | Accepted |
| `DTD-SYS-013` | Chiến lược Đánh chỉ mục (Indexing Strategy) | Thiết lập chỉ mục B-tree trên các cột tra cứu tần suất cao: `idx_attendance_emp_date`, `idx_otp_hash_status`, `idx_offline_sync`, đảm bảo tốc độ truy vấn $O(\log N)$ hoặc $O(1)$. | `STK-012` | `DATA-SYS-009`, `DATA-SYS-011` | - | Accepted |
| `DTD-SYS-014` | Cấu hình Bền bỉ PRAGMA SQLite WAL | Cấu hình `PRAGMA journal_mode = WAL;`, `PRAGMA synchronous = NORMAL;`, `PRAGMA busy_timeout = 5000;` tại trạm Kiosk; cân bằng tối ưu giữa tốc độ ghi đĩa và an toàn dữ liệu $\text{RPO} = 0$. | `STK-009` | `NFR-SYS-006`, `FR-SYS-006` | `DD-SYS-002` | Accepted |

---

## 3. Data Lifecycle & Synchronization Behavior (Vòng đời & Đồng bộ Dữ liệu)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DTD-SYS-015` | Luồng Đồng bộ Bù Dữ liệu Ngoại tuyến | Kiosk gom lô tối đa 50 bản ghi `offline_punches` có `is_synced = 0` $\rightarrow$ Gửi Backend xác thực và ghi nhận vào PostgreSQL $\rightarrow$ Kiosk đánh dấu `is_synced = 1`. | `DTD-SYS-004`, `DTD-SYS-010` | `FR-SYS-006`, `NFR-SYS-006` | `DD-SYS-002` | Accepted |
| `DTD-SYS-016` | Luồng Nạp nóng & Tiêu hủy Vector Sinh trắc học | Cập nhật vector qua STOMP $\rightarrow$ Hoán đổi ma trận RAM Kiosk; Cronjob 01:00 hàng ngày quét và thực thi Hard Delete bản ghi `biometric_templates` có `terminated_date <= CurrentDate - 20 days`. | `DTD-SYS-005`, `DTD-SYS-008`, `DTD-SYS-011` | `FR-SYS-011`, `DATA-SYS-013`, `SRS-003` | `DD-SYS-003` | Accepted |

---

## 4. Data Design Decisions (Quyết định Thiết kế Dữ liệu)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-SYS-015` | Lưu trữ vector đặc trưng mã hóa dưới dạng BYTEA thay vì kiểu vector chuyên dụng (pgvector). | Toàn bộ suy luận và so khớp ma trận diễn ra tại biên Kiosk; Backend chỉ lưu trữ và chuyển tiếp bản ghi mã hóa. | Dùng extension pgvector, Lưu dạng chuỗi Base64 | Tiết kiệm chi phí mở rộng extension CSDL và tăng tốc độ đọc/ghi dữ liệu nhị phân. | `PD-002`, `PD-005` | Accepted |
| `DD-SYS-016` | Tách riêng Initialization Vector (IV 12 bytes) và Authentication Tag (16 bytes) thành các cột độc lập trong CSDL. | Phục vụ giải mã chuẩn xác theo đặc tả NIST SP 800-38D AES-GCM và dễ dàng audit cấu trúc mã hóa. | Ghép chung IV + Tag + Ciphertext vào 1 blob nhị phân | Tăng độ rõ ràng về cấu trúc dữ liệu bảo mật, thuận tiện kiểm tra tính toàn vẹn độc lập. | `SRS-001`, `DD-SYS-003` | Accepted |

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Giới hạn Kích thước Hàng đợi SQLite WAL**: Kích thước file CSDL `kiosk_local.db` được duy trì gọn nhẹ (dưới 50 MB cho 100,000 lượt quẹt). Các bản ghi đã đồng bộ (`is_synced = 1`) có thể được lưu trữ tối thiểu 30 ngày trước khi dọn dẹp để phục vụ đối soát tại chỗ.
* **Chiến lược Phân vùng Dữ liệu Lớn**: Khi bảng `attendance_records` vượt 1,000,000 bản ghi, CSDL PostgreSQL sẽ áp dụng cơ chế phân vùng bảng theo tháng (Table Partitioning by Month) trên cột `punch_date`.
