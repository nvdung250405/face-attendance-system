---
title: Backend Data Design
version: 2.0
status: Approved
owner: Database Architect & Backend Lead
---

# DATA DESIGN — Thiết kế Dữ liệu Trung tâm Phân hệ Backend

## 1. Structure (Cấu trúc Mô hình & Lưu trữ Dữ liệu)

### 1.1. Data Model (Mô hình Dữ liệu & Ràng buộc)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DTD-BE-001` | Lược đồ CSDL Quan hệ & DDL 3NF | Lược đồ 8 bảng CSDL PostgreSQL 16 chuẩn 3NF kèm quan hệ khóa ngoại, ràng buộc toàn vẹn, cờ audit và kiểu dữ liệu tối ưu. | `STK-013` | `DATA-BE-001`, `DATA-BE-002`, `DATA-BE-003`, `DATA-BE-004`, `DATA-BE-005`, `DATA-BE-006`, `DATA-BE-007`, `DATA-BE-008` | `DD-SYS-003`, `DD-BE-005`, `DD-BE-006` | Accepted |
| `DTD-BE-002` | Chiến lược Chỉ mục Hiệu năng B-Tree | Bộ chỉ mục B-tree tối ưu hóa truy vấn tra cứu điểm danh theo nhân viên, mốc giờ, kiosk, mã ca kíp và bảng kiểm toán. | `STK-013` | `DATA-BE-009`, `DATA-BE-014`, `NFR-BE-001` | `DD-SYS-001` | Accepted |
| `DTD-BE-007` | Cột Trạng thái Vòng đời Thông tin Xác thực | Bổ sung cột `must_change_password BOOLEAN NOT NULL DEFAULT FALSE` vào bảng `users` bằng kịch bản tăng dần `V2__add_credential_lifecycle.sql` (không sửa `V1` đã áp dụng); tận dụng các cột sẵn có `password_hash`, `pin_hash`, `pin_locked_until`; không cần chỉ mục mới vì cờ chỉ được đọc theo khóa chính. | `STK-013` | `DATA-BE-016`, `DATA-BE-012` | `DD-BE-013` | Accepted |

### 1.2. Storage & Access (Lưu trữ, Caching & Quản lý Kết nối)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DTD-BE-003` | Kiến trúc Bộ nhớ đệm Cooldown Caffeine | Bộ nhớ đệm In-Memory Caffeine chống quẹt thẻ dồn dập (TTL 120s) trên khóa `cooldown:punch:{userId}:{date}`, giảm 95% tải tra cứu CSDL. | `STK-011` | `DATA-BE-012`, `FR-BE-002` | `DD-SYS-006`, `DD-BE-003` | Accepted |
| `DTD-BE-004` | Cấu hình Kết nối CSDL HikariCP | Cấu hình pool kết nối HikariCP tối đa 20 kết nối cho thông lượng cao và tải 50 trạm Kiosk đồng thời, thời gian chờ $\le 5\text{ s}$. | `STK-011`, `STK-013` | `NFR-BE-001`, `NFR-BE-002` | `DD-SYS-001` | Accepted |

---

## 2. Behavior (Diễn biến Luồng & Vòng đời Dữ liệu)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DTD-BE-005` | Luồng Biến đổi & Mã hóa Dữ liệu Sinh trắc | Nhận vector 512D từ Kiosk $\rightarrow$ Thẩm định độ dài chuẩn $L_2\text{ Norm} = 1.0$ $\rightarrow$ Sinh ngẫu nhiên IV 12-byte $\rightarrow$ Mã hóa AES-256-GCM $\rightarrow$ Persist vào `biometric_templates` dạng `BYTEA` ciphertext kèm IV. | `DTD-BE-001`, `STK-010` | `DATA-BE-005`, `DATA-BE-010`, `DATA-BE-015` | `DD-SYS-003`, `DD-BE-007` | Accepted |
| `DTD-BE-006` | Chu trình Tự động Dọn dẹp & Tiêu hủy Dữ liệu 20 Ngày | Spring `@Scheduled` chạy 01:00 hàng ngày $\rightarrow$ Quét bảng `users` tìm nhân sự có `terminated_date <= CURRENT_DATE - 20 days` $\rightarrow$ Xóa cứng (`HARD DELETE`) bản ghi `biometric_templates` $\rightarrow$ Ghi log bất biến vào `audit_logs`. | `DTD-BE-001`, `STK-011` | `DATA-BE-013`, `DATA-BE-014` | `DD-SYS-003`, `DD-BE-008` | Accepted |

---

## 3. Relational Database Schema (PostgreSQL 16 DDL Script)

Hệ thống CSDL được chuẩn hóa ở mức 3NF, áp dụng khóa ngoại, chỉ mục hiệu năng và ràng buộc toàn vẹn:

```sql
-- Migration Script: V1__initial_schema.sql

-- 1. Bảng nhân sự và người dùng hệ thống
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'EMPLOYEE',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_CONSENT',
    department VARCHAR(64),
    pin_hash VARCHAR(255),
    pin_locked_until TIMESTAMP WITH TIME ZONE,
    terminated_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_terminated ON users(terminated_date) WHERE terminated_date IS NOT NULL;

-- 2. Bảng ca làm việc
CREATE TABLE IF NOT EXISTS shifts (
    id BIGSERIAL PRIMARY KEY,
    shift_code VARCHAR(32) NOT NULL UNIQUE,
    shift_name VARCHAR(64) NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    grace_period_minutes INT NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng phân công ca làm việc cho nhân viên
CREATE TABLE IF NOT EXISTS employee_shifts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id BIGINT NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emp_shifts_lookup ON employee_shifts(user_id, effective_from, effective_to);

-- 4. Bảng trạm Kiosk được ủy quyền
CREATE TABLE IF NOT EXISTS kiosks (
    id VARCHAR(64) PRIMARY KEY,
    location_name VARCHAR(128) NOT NULL,
    secret_token_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_ping_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng mẫu sinh trắc học ArcFace mã hóa AES-256-GCM
CREATE TABLE IF NOT EXISTS biometric_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_vector BYTEA NOT NULL,
    encryption_iv BYTEA NOT NULL,
    algorithm VARCHAR(32) NOT NULL DEFAULT 'ARCFACE_512D',
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_biometric_user_active ON biometric_templates(user_id, is_active);

-- 6. Bảng nhật ký điểm danh
CREATE TABLE IF NOT EXISTS attendance_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    punch_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    punch_type VARCHAR(16) NOT NULL,
    verification_method VARCHAR(32) NOT NULL,
    confidence_score NUMERIC(5, 4),
    kiosk_id VARCHAR(64) NOT NULL REFERENCES kiosks(id),
    status VARCHAR(32) NOT NULL DEFAULT 'ON_TIME',
    late_minutes INT NOT NULL DEFAULT 0,
    is_offline_sync BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_punch_user_time_type UNIQUE (user_id, punch_timestamp, punch_type)
);

CREATE INDEX idx_attendance_user_date ON attendance_logs(user_id, punch_timestamp DESC);
CREATE INDEX idx_attendance_kiosk_time ON attendance_logs(kiosk_id, punch_timestamp DESC);
CREATE INDEX idx_attendance_status ON attendance_logs(status);

-- 7. Bảng phiên đăng ký OTP và thỏa thuận Informed Consent
CREATE TABLE IF NOT EXISTS enrollment_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash VARCHAR(255) NOT NULL,
    consent_version VARCHAR(32) NOT NULL,
    consent_signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_enrollment_otp_lookup ON enrollment_sessions(otp_hash, is_used, expires_at);

-- 8. Bảng nhật ký kiểm toán bất biến (Append-only Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(128),
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

---

## 4. In-Memory Cooldown & Cache Architecture (`Caffeine`)

Để ngăn chặn tình trạng quẹt thẻ dồn dập (Double Punching) và bảo vệ máy chủ:
* **Công nghệ Cache**: Sử dụng Caffeine Cache (trong tiến trình) kết hợp Redis Cache (nếu chạy đa instance).
* **Key Pattern**: `cooldown:punch:{userId}:{todayDateString}`
* **Giá trị**: `{ lastPunchTimestamp: "2026-10-03T08:00:00+07:00", punchType: "CHECK_IN" }`
* **TTL (Time-To-Live)**: $120\text{ giây}$.
* **Quy tắc Kiểm tra**:
  * Khi nhận request `/api/v1/kiosk/punch`, Backend kiểm tra key Cache trước.
  * Nếu chênh lệch mốc giờ giữa request mới và `lastPunchTimestamp` $< 120\text{ giây}$, Backend trả về HTTP `409 Conflict` kèm thông báo `COOLDOWN_ACTIVE`, không ghi thêm bản ghi mới vào CSDL.

---

## 5. Connection Pooling & Database Sizing (`HikariCP`)

Cấu hình tối ưu trong file cấu hình `application.yml` cho tải cao:

```yaml
spring:
  datasource:
    hikari:
      pool-name: FAS-HikariPool
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000          # 5 phút
      max-lifetime: 1800000         # 30 phút
      connection-timeout: 10000     # 10 giây
      connection-test-query: SELECT 1
```

* **Sizing tính toán**: Với 50 trạm Kiosk gửi tối đa 50 requests/s và thời gian thực thi truy vấn trung bình $\le 10\text{ ms}$, pool size 20 kết nối hoàn toàn đáp ứng được thông lượng $500\text{ RPS}$ với mức chiếm dụng tài nguyên CPU $< 15\%$.

---

## 6. Decisions (Quyết định Thiết kế Dữ liệu)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-BE-005` | Chuẩn hóa 3NF và ràng buộc duy nhất tự nhiên `(user_id, punch_timestamp, punch_type)` cho bảng `attendance_logs`. | Đảm bảo tính toàn vẹn dữ liệu ở cấp CSDL, hỗ trợ cơ chế Idempotency chống ghi trùng lặp khi trạm Kiosk gửi bù gói lô ngoại tuyến. | Khóa chính UUID không ràng buộc duy nhất, Kiểm tra SELECT trước khi INSERT | Giao dịch INSERT trùng lặp sẽ phát sinh lỗi vi phạm khóa duy nhất; luồng đồng bộ áp dụng `ON CONFLICT DO NOTHING`. | `DATA-BE-009`, `FR-BE-003` | Accepted |
| `DD-BE-006` | Sử dụng Flyway Migration quản lý phiên bản schema thay cho auto DDL của Hibernate. | Kiểm soát 100% các câu lệnh DDL thực thi trên Production, ngăn ngừa rủi ro tự động drop/alter cột làm mất dữ liệu nhạy cảm. | Hibernate `hbm2ddl.auto = update`, Dùng Liquibase | Mọi thay đổi cấu trúc bảng bắt buộc phải tạo file script migration `V*__*.sql` mới và kiểm thử kỹ lưỡng. | `DATA-BE-001`, `STK-013` | Accepted |
| `DD-BE-007` | Lưu trữ vector sinh trắc dạng `BYTEA` (AES-256-GCM ciphertext + IV) thay vì pgvector trên CSDL PostgreSQL. | Đáp ứng tuyệt đối yêu cầu bảo vệ dữ liệu ở trạng thái tĩnh (Encryption-at-Rest) theo Luật 91/2025/QH15; việc so khớp khuôn mặt 1:N được phân tán thực thi tại RAM Kiosk. | Dùng extension pgvector lưu vector thô, Lưu dạng chuỗi Base64 | Không thể truy vấn vector tương đồng trực tiếp bằng SQL trên CSDL, nhưng tối ưu chi phí và bảo mật tuyệt đối. | `DATA-BE-015`, `NFR-BE-003` | Accepted |
| `DD-BE-008` | Thiết kế Append-Only cho bảng `audit_logs` với cấu trúc JSONB cho `before_state` và `after_state`. | Bảo toàn tính bất biến của lịch sử kiểm toán phục vụ thanh tra, đồng thời linh hoạt lưu trữ biến động dữ liệu đa thực thể mà không cần can thiệp schema. | Tạo bảng lịch sử riêng biệt cho từng thực thể, Lưu text JSON phẳng | Chiếm dụng thêm dung lượng lưu trữ CSDL cho các trường JSONB; cần thiết lập chỉ mục GIN nếu cần tìm kiếm sâu trong JSON. | `DATA-BE-008`, `DATA-BE-014` | Accepted |

---

## 7. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Chiến lược Checkpoint & Tối ưu Ghi PostgreSQL**: CSDL PostgreSQL được cấu hình WAL với `synchronous_commit = off` hoặc `normal` tùy thuộc vào mức độ ưu tiên giữa thông lượng ghi và độ bền dữ liệu; các chỉ mục B-tree được kiểm tra định kỳ để tránh phân mảnh (index bloat).
* **Quản trị Kích thước Volume Lưu trữ**: Dung lượng volume PostgreSQL dự toán tăng trưởng khoảng 2–5 GB mỗi năm cho quy mô 1,000 nhân viên (bao gồm log điểm danh và audit trail); cần thiết lập kịch bản backup tự động hàng đêm qua cronjob `pg_dump`.

