---
title: Backend Data Specification & Design
version: 3.0
status: Approved
owner: Database Architect & Backend Lead
type: spec
scope: BE
facet: data
updated: 2026-10-08
---

# DATA SPECS & DESIGN — Đặc tả & Thiết kế Dữ liệu Trung tâm Phân hệ Backend

Tài liệu hợp nhất đặc tả thực thể dữ liệu nghiệp vụ (`DATA-BE-`) và thiết kế kỹ thuật CSDL PostgreSQL (`DTD-BE-`) của phân hệ Backend theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §7.2).

---

## 1. Danh mục Thực thể Dữ liệu Nghiệp vụ (Data Entities)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-BE-001` | Quản lý thực thể Người dùng & Nhân sự (`users`) gồm định danh hệ thống, mã nhân viên, họ tên, email, mật khẩu BCrypt, vai trò RBAC, trạng thái hồ sơ và mã PIN dự phòng. | Entity | Must | `FR-SYS-017`, `PD-001` | CSDL lưu trữ đầy đủ các trường, `employee_code` và `email` không trùng lặp, hỗ trợ khóa PIN sau 5 lần sai. | Approved |
| `DATA-BE-002` | Quản lý thực thể Ca Làm việc (`shifts`) gồm mã ca, tên ca, giờ bắt đầu, giờ kết thúc, thời gian ân hạn đi muộn (15 phút) và cờ kích hoạt áp dụng. | Entity | Must | `FR-SYS-018`, `PD-001` | Hỗ trợ ca cố định và ca gãy, cấu hình thời gian ân hạn linh hoạt từ HR Web Portal. | Approved |
| `DATA-BE-003` | Quản lý thực thể Phân công Ca (`employee_shifts`) ánh xạ nhân viên với ca làm việc tương ứng theo khoảng thời gian hiệu lực `effective_from` đến `effective_to`. | Entity | Must | `FR-SYS-018`, `PD-001` | Khóa ngoại trỏ đúng `users(id)` và `shifts(id)`, không cho phép phân trùng ca cùng thời điểm cho 1 nhân viên. | Approved |
| `DATA-BE-004` | Quản lý thực thể Nhật ký Điểm danh (`attendance_logs`) lưu trữ toàn bộ giao dịch quẹt mặt/PIN thực tế từ Kiosk và nhập bù của HR. | Entity | Must | `FR-SYS-005`, `PD-002` | Ghi nhận chính xác mốc giờ thực tế, phương thức xác thực, điểm số tương đồng, mã Kiosk, trạng thái và cờ đồng bộ offline. | Approved |
| `DATA-BE-005` | Quản lý thực thể Mẫu Sinh trắc học Mã hóa (`biometric_templates`) lưu trữ vector ArcFace 512D được bảo vệ bằng mã hóa đối xứng AES-256-GCM kèm IV riêng biệt. | Entity | Must | `SRS-001`, `PD-005`, `PD-006` | Vector mã hóa lưu dạng BYTEA kèm IV 12 bytes, algorithm ARCFACE_512D, không lưu ảnh gốc; liên kết cascade với users. | Approved |
| `DATA-BE-006` | Quản lý thực thể Phiên Đăng ký OTP (`enrollment_sessions`) quản lý mã OTP 6 số kích hoạt tạm thời và xác nhận văn bản thỏa thuận pháp lý Informed Consent. | Entity | Must | `FR-SYS-007`, `FR-SYS-008`, `PD-003` | Lưu otp_hash, consent_version, consent_signed_at, client_ip, expires_at (48h), is_used; vô hiệu hóa sau 1 lần dùng. | Approved |
| `DATA-BE-007` | Quản lý thực thể Trạm Kiosk (`kiosks`) quản lý danh sách phần cứng Kiosk được cấp phép kết nối qua Secret Token băm BCrypt. | Entity | Must | `FR-SYS-020`, `PD-001` | Định danh trạm Kiosk duy nhất qua `id`, lưu tên vị trí đặt trạm, token hash, trạng thái hoạt động và mốc ping gần nhất. | Approved |
| `DATA-BE-008` | Quản lý thực thể Nhật ký Kiểm toán Bất biến (`audit_logs`) lưu vết kiểm toán append-only cho mọi hành vi nhạy cảm phục vụ thanh tra pháp lý. | Entity | Must | `FR-SYS-019`, `SRS-010`, `PD-001` | Ghi nhận actor_id, actor_email, action, entity_type, entity_id, before_state JSONB, after_state JSONB, IP và thời điểm tạo. | Approved |
| `DATA-BE-016` | Quản lý trạng thái vòng đời thông tin xác thực trên bảng `users`: mật khẩu băm một chiều và mã PIN dự phòng băm một chiều kèm mốc khóa PIN. Không lưu cờ buộc đổi mật khẩu. | Entity | Must | `FR-SYS-004`, `FR-BE-011`, `FR-BE-012` | `password_hash` và `pin_hash` không bao giờ lưu văn bản rõ; cột `must_change_password` từng được thêm ở `V2` đã bị gỡ ở `V5__drop_must_change_password.sql` theo CR; `pin_locked_until` là mốc mở khóa PIN sau 5 lần nhập sai. | Approved |
| `DATA-BE-018` | Quản lý thực thể Đơn giải trình công (`excuse_requests`) gồm nhân sự, bản ghi điểm danh liên quan, lý do, mốc thời gian đề nghị điều chỉnh, trạng thái `PENDING`/`APPROVED`/`REJECTED`, người duyệt và lý do từ chối. | Entity | Must | `FR-SYS-014`, `FR-BE-014`, `FR-BE-015` | Bảng được tạo bằng migration `V3__add_excuse_requests_and_kiosk_lifecycle.sql`; duyệt đơn cập nhật bản ghi điểm danh tương ứng trong cùng giao dịch; đơn đã xử lý không đổi được trạng thái. | Approved |
| `DATA-BE-019` | Vòng đời trạm Kiosk trong bảng `kiosks`: mã định danh duy nhất, `secret_token_hash` băm một chiều, trạng thái hoạt động và mốc `last_ping_at`. | Entity | Must | `FR-SYS-020`, `FR-BE-017` | Không tồn tại cột lưu Secret Token dạng văn bản rõ; trạm `INACTIVE` bị từ chối xác thực ở mọi giao diện Kiosk; `last_ping_at` cập nhật theo mỗi lượt gọi hợp lệ. | Approved |
| `DATA-BE-021` | Quản lý thực thể Kỳ công (`payroll_periods`): kỳ theo năm/tháng (cột `period_year`/`period_month`), trạng thái `OPEN`/`LOCKED`, người chốt và lý do mở lại; ràng buộc duy nhất theo `(period_year, period_month)`. | Entity | Must | `FR-SYS-024`, `FR-BE-021` | Bảng được tạo bằng migration `V4__add_lifecycle_entities.sql`; kỳ `LOCKED` từ chối mọi điều chỉnh công và đơn giải trình thuộc kỳ; mở lại lưu lý do và người mở. | Approved |
| `DATA-BE-022` | Quản lý thực thể Phiên làm việc (`refresh_tokens`): tài khoản, `token_hash` băm một chiều, mốc hết hạn, trạng thái thu hồi và ngữ cảnh đăng nhập (IP/User Agent). | Entity | Must | `FR-SYS-023`, `FR-BE-020` | Token chỉ dùng được khi chưa hết hạn và chưa bị thu hồi; đổi/cấp lại mật khẩu và vô hiệu hóa tài khoản thu hồi toàn bộ token của tài khoản; không có cột lưu token dạng văn bản rõ. | Approved |
| `DATA-BE-023` | Quản lý thực thể Thông báo trong ứng dụng (`notifications`) và vết rút Consent (`consent_withdrawals`): người nhận, loại sự kiện, tham chiếu đối tượng, mốc thời gian, trạng thái đã đọc; vết rút Consent lưu IP và hạn tiêu hủy sinh trắc. | Entity | Must | `FR-SYS-025`, `FR-BE-022`, `FR-BE-024` | Thông báo gắn đúng người nhận và chỉ người nhận đọc được; vết rút Consent là bất biến và dùng để tính hạn tiêu hủy 7 ngày cùng việc loại khỏi gallery Kiosk. | Approved |
| `DATA-BE-024` | Quản lý thực thể Yêu cầu Dữ liệu Cá nhân (`data_subject_requests`): nhân sự, loại yêu cầu (truy cập/chỉnh sửa), nội dung, trạng thái xử lý và phản hồi của DPO. | Entity | Must | `FR-SYS-025`, `FR-BE-022` | Yêu cầu khởi tạo ở trạng thái `RECEIVED`; chỉ role `DPO` cập nhật được trạng thái; mọi thay đổi trạng thái ghi `audit_logs` và sinh thông báo cho nhân sự liên quan. | Approved |

---

## 2. Thiết kế Kỹ thuật Mô hình & Lưu trữ (`DTD-BE-`)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DTD-BE-001` | Lược đồ CSDL Quan hệ & DDL 3NF | Lược đồ CSDL PostgreSQL 16 chuẩn 3NF kèm quan hệ khóa ngoại, ràng buộc toàn vẹn, cờ audit và kiểu dữ liệu tối ưu. | `STK-013` | `DATA-BE-001`, `DATA-BE-002`, `DATA-BE-003`, `DATA-BE-004`, `DATA-BE-005`, `DATA-BE-006`, `DATA-BE-007`, `DATA-BE-008` | `DD-SYS-003`, `DD-BE-005`, `DD-BE-006` | Accepted |
| `DTD-BE-002` | Chiến lược Chỉ mục Hiệu năng B-Tree | Bộ chỉ mục B-tree tối ưu hóa truy vấn tra cứu điểm danh theo nhân viên, mốc giờ, kiosk, mã ca kíp và bảng kiểm toán. | `STK-013` | `DATA-BE-009`, `DATA-BE-014`, `NFR-BE-001` | `DD-SYS-001` | Accepted |
| `DTD-BE-003` | Kiến trúc Bộ nhớ đệm Cooldown Caffeine | Bộ nhớ đệm In-Memory Caffeine chống quẹt thẻ dồn dập (TTL 120s) trên khóa `cooldown:punch:{userId}:{date}`, giảm 95% tải tra cứu CSDL. | `STK-011` | `DATA-BE-012`, `FR-BE-002` | `DD-SYS-006`, `DD-BE-003` | Accepted |
| `DTD-BE-004` | Cấu hình Kết nối CSDL HikariCP | Cấu hình pool kết nối HikariCP tối đa 20 kết nối cho thông lượng cao và tải 50 trạm Kiosk đồng thời, thời gian chờ $\le 5\text{ s}$. | `STK-011`, `STK-013` | `NFR-BE-001`, `NFR-BE-002` | `DD-SYS-001` | Accepted |
| `DTD-BE-005` | Luồng Biến đổi & Mã hóa Dữ liệu Sinh trắc | Nhận vector 512D từ Kiosk $\rightarrow$ Thẩm định độ dài chuẩn $L_2\text{ Norm} = 1.0$ $\rightarrow$ Sinh ngẫu nhiên IV 12-byte $\rightarrow$ Mã hóa AES-256-GCM $\rightarrow$ Persist vào `biometric_templates` dạng `BYTEA` ciphertext kèm IV. | `DTD-BE-001`, `STK-010` | `DATA-BE-005`, `DATA-BE-010`, `DATA-BE-015` | `DD-SYS-003`, `DD-BE-007` | Accepted |
| `DTD-BE-006` | Chu trình Tự động Dọn dẹp & Tiêu hủy Dữ liệu 20 Ngày | Spring `@Scheduled` chạy 01:00 hàng ngày $\rightarrow$ Quét bảng `users` tìm nhân sự có `terminated_date <= CURRENT_DATE - 20 days` $\rightarrow$ Xóa cứng (`HARD DELETE`) bản ghi `biometric_templates` $\rightarrow$ Ghi log bất biến vào `audit_logs`. | `DTD-BE-001`, `STK-011` | `DATA-BE-013`, `DATA-BE-014` | `DD-SYS-003`, `DD-BE-008` | Accepted |
| `DTD-BE-007` | Trạng thái Vòng đời Thông tin Xác thực | Bảng `users` lưu `password_hash` (băm một chiều), `pin_hash` (băm một chiều) và `pin_locked_until`; tận dụng các cột sẵn có từ `V1`. | `STK-013` | `DATA-BE-016`, `DATA-BE-012` | `DD-BE-013` | Accepted |
| `DTD-BE-008` | Chỉ mục & Ràng buộc Lịch Phân ca | Bổ sung chỉ mục `(user_id, effective_from, effective_to)` cho `employee_shifts` và ràng buộc `shift_code` duy nhất trên `shifts`; quy tắc không chồng lấn khoảng hiệu lực thực thi ở tầng dịch vụ có khóa theo `user_id`. | `STK-012` | `DATA-BE-017`, `DATA-BE-003` | `DD-BE-017`, `DD-SYS-018` | Accepted |
| `DTD-BE-009` | Cấu trúc bảng Đơn Giải trình Công | Tạo bảng `excuse_requests` gồm khoá ngoại tới `users(id)` và `attendance_logs(id)`, lý do, mốc thời gian đề nghị điều chỉnh, trạng thái `PENDING`/`APPROVED`/`REJECTED`, người duyệt và mốc duyệt; chỉ mục `(user_id, status)` và `(status, created_at)`. | `STK-012` | `DATA-BE-018` | `DD-BE-018`, `DD-SYS-021` | Accepted |
| `DTD-BE-010` | Cấu trúc Vòng đời Trạm Kiosk | Bổ sung trạng thái hoạt động và chỉ mục tra cứu cho bảng `kiosks`; không thêm cột lưu Secret Token dạng văn bản rõ; trạng thái `INACTIVE` được kiểm tra ở bộ lọc xác thực Kiosk. | `STK-012` | `DATA-BE-019`, `DATA-BE-007` | `DD-BE-020`, `DD-SYS-020` | Accepted |
| `DTD-BE-011` | Chỉ mục Tra cứu Kiểm toán & Consent | Bổ sung chỉ mục `(created_at)`, `(user_id)`, `(action)` trên `audit_logs` và chỉ mục theo `(user_id, created_at)` trên bản ghi Consent; ràng buộc append-only thực thi ở tầng ứng dụng. | `STK-012` | `DATA-BE-020`, `DATA-BE-014` | `DD-BE-019`, `DD-SYS-019` | Accepted |
| `DTD-BE-012` | Cấu trúc Kỳ công (`payroll_periods`) | Bảng kỳ công theo `(period_year, period_month)` với trạng thái `OPEN`/`LOCKED`, người chốt, mốc chốt, người mở lại và lý do mở lại; ràng buộc duy nhất theo `(period_year, period_month)`. Tên cột tránh từ khoá dành riêng `YEAR`/`MONTH` của H2. | `STK-012` | `DATA-BE-021` | `DD-BE-024`, `DD-SYS-024` | Accepted |
| `DTD-BE-013` | Cấu trúc Phiên làm việc (`refresh_tokens`) | Bảng phiên: khoá ngoại tới `users(id)`, `token_hash` băm một chiều, `expires_at`, `revoked_at`, IP/User Agent; chỉ mục `(user_id, revoked_at)` phục vụ thu hồi theo tài khoản; không có cột lưu token dạng văn bản rõ. | `STK-012` | `DATA-BE-022` | `DD-BE-023`, `DD-SYS-026` | Accepted |
| `DTD-BE-014` | Cấu trúc Thông báo & Vết rút Consent | Bảng `notifications` (người nhận, loại sự kiện, tham chiếu đối tượng, mốc thời gian, `read_at`) và bảng `consent_withdrawals` (thời điểm rút, IP, hạn tiêu hủy 7 ngày); chỉ mục `(user_id, read_at)` và `(user_id, withdrawn_at)`. | `STK-012` | `DATA-BE-023` | `DD-BE-025`, `DD-SYS-025` | Accepted |
| `DTD-BE-015` | Cấu trúc Yêu cầu Dữ liệu Cá nhân (`data_subject_requests`) | Bảng yêu cầu của chủ thể dữ liệu: khoá ngoại tới `users(id)`, loại yêu cầu, nội dung, trạng thái `RECEIVED`/`IN_PROGRESS`/`FULFILLED`/`REJECTED`, người xử lý và phản hồi; chỉ mục `(user_id, status)`. | `STK-012` | `DATA-BE-024` | `DD-BE-025`, `DD-SYS-025` | Accepted |
| `DTD-BE-016` | Cấu trúc & Hiệu lực Phiên đăng ký OTP | Bảng `enrollment_sessions` với `otp_hash` (BCrypt), `expires_at = created_at + 48h` và `is_used`; chỉ mục theo `otp_hash` để thẩm định $O(1)$; ràng buộc một lần dùng và hết hạn sau 48 giờ. | `STK-012` | `DATA-BE-011`, `DATA-BE-006` | `DD-SYS-002`, `DD-BE-005` | Accepted |

---

## 3. Ràng buộc Toàn vẹn & Quy tắc Dữ liệu (Constraints & Integrity Rules)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-BE-009` | Ràng buộc chống trùng lặp giao dịch điểm danh (Idempotency): bộ ba `(user_id, punch_timestamp, punch_type)` bắt buộc là duy nhất trên `attendance_logs`. | Constraint | Must | `FR-SYS-006`, `FR-BE-003` | CSDL ném lỗi vi phạm toàn vẹn khi insert trùng; luồng sync ngoại tuyến áp dụng `ON CONFLICT DO NOTHING`. | Approved |
| `DATA-BE-010` | Chuẩn hóa Vector sinh trắc học: mảng đặc trưng khuôn mặt phải có đúng 512 phần tử float32 và đạt chuẩn độ dài hình học $L_2\text{ Norm} = 1.0 \pm 10^{-4}$. | Constraint | Must | `SRS-001`, `FR-BE-006` | Backend từ chối nạp mẫu khuôn mặt vào hệ thống nếu sai kích thước 512D hoặc chưa chuẩn hóa độ dài hình học. | Approved |
| `DATA-BE-011` | Hiệu lực mã kích hoạt OTP: mỗi mã OTP chỉ có hiệu lực tối đa 48 giờ (`expires_at = created_at + 48h`) và chỉ được dùng đúng 1 lần (`is_used = true`). | Constraint | Must | `FR-SYS-007`, `FR-BE-005` | Từ chối kích hoạt và trả về mã lỗi thích hợp khi OTP đã qua sử dụng hoặc quá hạn 48 giờ. | Approved |
| `DATA-BE-012` | Bảo vệ mã PIN chống Brute-force: khóa tài khoản điểm danh bằng PIN 15 phút nếu nhập sai mã PIN quá 5 lần liên tiếp (`pin_locked_until = NOW() + 15m`). | Constraint | Must | `FR-SYS-004`, `FR-BE-001` | Bàn phím Kiosk từ chối thao tác nhập PIN và hiển thị thời gian đếm lùi mở khóa cho nhân viên. | Approved |
| `DATA-BE-017` | Ràng buộc và chỉ mục lịch phân ca: khoảng hiệu lực `[effective_from, effective_to]` của cùng một nhân sự trong `employee_shifts` không được giao nhau; chỉ mục `(user_id, effective_from, effective_to)` phục vụ tra cứu ca đang hiệu lực. | Constraint | Must | `FR-SYS-018`, `FR-BE-013` | Thao tác tạo/sửa phân ca kiểm tra giao khoảng trong cùng giao dịch có khóa theo `user_id`; vi phạm trả HTTP 409 và không ghi bản ghi; `effective_to` NULL được coi là vô hạn. | Approved |
| `DATA-BE-020` | Tra cứu kiểm toán chỉ đọc: `audit_logs` là append-only và có chỉ mục `(created_at)`, `(user_id)`, `(action)`; dữ liệu Consent lưu vết IP, thời điểm ký và phiên bản văn bản. | Constraint | Must | `FR-SYS-019`, `FR-BE-016`, `NFR-BE-005` | Không tồn tại đường ghi/sửa/xoá `audit_logs` qua API; truy vấn theo khoảng thời gian trả kết quả phân trang; lượt tra cứu không tạo bản ghi audit mới. | Approved |

---

## 4. Vòng đời Dữ liệu & Bảo mật Tĩnh (Data Lifecycle & Encryption)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-BE-013` | Tiêu hủy dữ liệu sinh trắc học sau 20 ngày: tự động xóa vĩnh viễn (Hard Delete) toàn bộ bản ghi mẫu khuôn mặt khi nhân viên nghỉ việc quá 20 ngày. | Retention | Must | `FR-SYS-017`, `NFR-BE-003` | Tác vụ nền hàng ngày xóa sạch bản ghi `biometric_templates` có `terminated_date <= CURRENT_DATE - 20 days`. | Approved |
| `DATA-BE-014` | Lưu trữ lịch sử điểm danh tối thiểu 3 năm: dữ liệu chấm công và nhật ký kiểm toán không bị xóa tự động, phục vụ thanh tra lao động. | Retention | Must | `SRS-010`, `NFR-BE-005` | CSDL trung tâm bảo lưu toàn vẹn dữ liệu `attendance_logs` và `audit_logs` tối thiểu 3 năm theo Luật Lao động. | Approved |
| `DATA-BE-015` | Mã hóa đối xứng AES-256-GCM dữ liệu tĩnh: vector đặc trưng sinh trắc học bắt buộc mã hóa AES-256-GCM trước khi lưu trữ vào CSDL PostgreSQL. | Privacy | Must | `SRS-003`, `NFR-BE-003` | Vector lưu dưới dạng BYTEA kèm IV 96-bit ngẫu nhiên và khóa Master tách biệt trong biến môi trường. | Approved |

---

## 5. Lược đồ CSDL Quan hệ PostgreSQL 16 (Flyway DDL Scripts)

```sql
-- =============================================================================
-- Migration Script: V1__initial_schema.sql
-- =============================================================================

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
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'DPO')),
    CONSTRAINT chk_user_status CHECK (status IN ('PENDING_CONSENT', 'ACTIVE', 'SUSPENDED', 'TERMINATED'))
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
    grace_period_minutes INT NOT NULL DEFAULT 15 CHECK (grace_period_minutes >= 0 AND grace_period_minutes <= 60),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_shift_time CHECK (start_time < end_time)
);

-- 3. Bảng phân công ca làm việc cho nhân viên
CREATE TABLE IF NOT EXISTS employee_shifts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id BIGINT NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_effective_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
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
    punch_type VARCHAR(16) NOT NULL CHECK (punch_type IN ('CHECK_IN', 'CHECK_OUT')),
    verification_method VARCHAR(32) NOT NULL CHECK (verification_method IN ('VERIFICATION_FACE', 'VERIFICATION_PIN', 'MANUAL_HR')),
    confidence_score NUMERIC(5, 4) CHECK (confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)),
    kiosk_id VARCHAR(64) NOT NULL REFERENCES kiosks(id),
    status VARCHAR(32) NOT NULL DEFAULT 'ON_TIME' CHECK (status IN ('ON_TIME', 'LATE', 'EARLY_LEAVE', 'OVERTIME', 'ANOMALOUS')),
    late_minutes INT NOT NULL DEFAULT 0 CHECK (late_minutes >= 0),
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

-- =============================================================================
-- Migration Script: V3__add_excuse_requests_and_kiosk_lifecycle.sql
-- =============================================================================
CREATE TABLE IF NOT EXISTS excuse_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_log_id BIGINT NOT NULL REFERENCES attendance_logs(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    proposed_punch_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    review_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_excuse_user_status ON excuse_requests(user_id, status);
CREATE INDEX idx_excuse_status_created ON excuse_requests(status, created_at DESC);

-- =============================================================================
-- Migration Script: V4__add_lifecycle_entities.sql
-- =============================================================================
-- Kỳ công theo tháng
CREATE TABLE IF NOT EXISTS payroll_periods (
    id BIGSERIAL PRIMARY KEY,
    period_year INT NOT NULL,
    period_month INT NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED')),
    locked_by BIGINT REFERENCES users(id),
    locked_at TIMESTAMP WITH TIME ZONE,
    unlock_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_period_year_month UNIQUE (period_year, period_month)
);

-- Phiên làm việc (Refresh Tokens)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_user_revoked ON refresh_tokens(user_id, revoked_at);

-- Thông báo trong ứng dụng
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);

-- Vết rút Informed Consent
CREATE TABLE IF NOT EXISTS consent_withdrawals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    withdrawn_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    purge_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_withdrawals_user ON consent_withdrawals(user_id, withdrawn_at);

-- Yêu cầu của chủ thể dữ liệu (DPO)
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(32) NOT NULL CHECK (request_type IN ('ACCESS', 'RECTIFICATION', 'ERASURE')),
    content TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'IN_PROGRESS', 'FULFILLED', 'REJECTED')),
    handled_by BIGINT REFERENCES users(id),
    response_notes TEXT,
    handled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dsr_user_status ON data_subject_requests(user_id, status);
```

---

## 6. Kiến trúc Bộ nhớ đệm Cooldown & Cấu hình HikariCP

### 6.1. Caffeine Cache Architecture (`DTD-BE-003`)
* **Mục đích**: Triệt tiêu hiện tượng quẹt thẻ lặp dồn dập (Double Punching), giảm 95% tải tra cứu CSDL trong giờ cao điểm.
* **Key Pattern**: `cooldown:punch:{userId}:{todayDateString}`
* **Giá trị**: `{ lastPunchTimestamp: "2026-10-08T08:00:00+07:00", punchType: "CHECK_IN" }`
* **TTL (Time-To-Live)**: $120\text{ giây}$.
* **Quy tắc Kiểm tra**:
  * Khi nhận request `/api/v1/kiosk/punch`, kiểm tra key trong Caffeine trước.
  * Nếu chênh lệch mốc giờ giữa request mới và `lastPunchTimestamp` $< 120\text{ giây}$, trả về HTTP `409 Conflict` (`COOLDOWN_ACTIVE`), không ghi CSDL.

### 6.2. Cấu hình Connection Pool HikariCP (`DTD-BE-004`)
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
* **Năng lực phục vụ**: Đáp ứng 50 trạm Kiosk đồng thời gửi request với thời gian thực thi truy vấn trung bình $\le 10\text{ ms}$, chịu tải $500\text{ RPS}$ với CPU $\le 15\%$.
