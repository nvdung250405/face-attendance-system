---
title: Backend Data Specifications
version: 2.0
status: Approved
owner: Data Architect & Backend Lead
---

# DATA SPECS — Đặc tả Dữ liệu Trung tâm Phân hệ Backend

Đặc tả các thực thể dữ liệu nghiệp vụ (`DATA-BE-`), cấu trúc thuộc tính chi tiết, quy tắc ràng buộc toàn vẹn và chính sách bảo vệ vòng đời dữ liệu trên phân hệ Backend.

---

## 1. Data Entities (Danh mục Thực thể Dữ liệu Trung tâm)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-BE-001` | Quản lý thực thể Người dùng & Nhân sự (`users`) gồm định danh hệ thống, mã nhân viên, họ tên, email, mật khẩu BCrypt, vai trò RBAC, trạng thái hồ sơ và mã PIN dự phòng. | Entity | Must | `DATA-SYS-001`, `PD-001` | CSDL lưu trữ đầy đủ các trường, `employee_code` và `email` không trùng lặp, hỗ trợ khóa PIN sau 5 lần sai. | Approved |
| `DATA-BE-002` | Quản lý thực thể Ca Làm việc (`shifts`) gồm mã ca, tên ca, giờ bắt đầu, giờ kết thúc, thời gian ân hạn đi muộn (15 phút) và cờ kích hoạt áp dụng. | Entity | Must | `DATA-SYS-002`, `PD-001` | Hỗ trợ ca cố định và ca gãy, cấu hình thời gian ân hạn linh hoạt từ HR Web Portal. | Approved |
| `DATA-BE-003` | Quản lý thực thể Phân công Ca (`employee_shifts`) ánh xạ nhân viên với ca làm việc tương ứng theo khoảng thời gian hiệu lực `effective_from` đến `effective_to`. | Entity | Must | `DATA-SYS-003`, `PD-001` | Khóa ngoại trỏ đúng `users(id)` và `shifts(id)`, không cho phép phân trùng ca cùng thời điểm cho 1 nhân viên. | Approved |
| `DATA-BE-004` | Quản lý thực thể Nhật ký Điểm danh (`attendance_logs`) lưu trữ toàn bộ giao dịch quẹt mặt/PIN thực tế từ Kiosk và nhập bù của HR. | Entity | Must | `DATA-SYS-004`, `PD-002` | Ghi nhận chính xác mốc giờ thực tế, phương thức xác thực, điểm số tương đồng, mã Kiosk, trạng thái và cờ đồng bộ offline. | Approved |
| `DATA-BE-005` | Quản lý thực thể Mẫu Sinh trắc học Mã hóa (`biometric_templates`) lưu trữ vector ArcFace 512D được bảo vệ bằng mã hóa đối xứng AES-256-GCM kèm IV riêng biệt. | Entity | Must | `DATA-SYS-005`, `PD-005`, `PD-006` | Vector mã hóa lưu dạng BYTEA kèm IV 12 bytes, algorithm ARCFACE_512D, không lưu ảnh gốc; liên kết cascade với users. | Approved |
| `DATA-BE-006` | Quản lý thực thể Phiên Đăng ký OTP (`enrollment_sessions`) quản lý mã OTP 6 số kích hoạt tạm thời và xác nhận văn bản thỏa thuận pháp lý Informed Consent. | Entity | Must | `DATA-SYS-006`, `DATA-SYS-007`, `PD-003` | Lưu otp_hash, consent_version, consent_signed_at, client_ip, expires_at (48h), is_used; vô hiệu hóa sau 1 lần dùng. | Approved |
| `DATA-BE-007` | Quản lý thực thể Trạm Kiosk (`kiosks`) quản lý danh sách phần cứng Kiosk được cấp phép kết nối qua Secret Token băm BCrypt. | Entity | Must | `DATA-SYS-001`, `PD-001` | Định danh trạm Kiosk duy nhất qua `id`, lưu tên vị trí đặt trạm, token hash, trạng thái hoạt động và mốc ping gần nhất. | Approved |
| `DATA-BE-008` | Quản lý thực thể Nhật ký Kiểm toán Bất biến (`audit_logs`) lưu vết kiểm toán append-only cho mọi hành vi nhạy cảm phục vụ thanh tra pháp lý. | Entity | Must | `DATA-SYS-008`, `DATA-SYS-014`, `PD-001` | Ghi nhận actor_id, actor_email, action, entity_type, entity_id, before_state JSONB, after_state JSONB, IP và thời điểm tạo. | Approved |
| `DATA-BE-016` | Quản lý trạng thái vòng đời thông tin xác thực trên bảng `users`: cờ buộc đổi mật khẩu ở lần đăng nhập đầu tiên (`must_change_password`), mật khẩu băm một chiều và mã PIN dự phòng băm một chiều kèm mốc khóa PIN. | Entity | Must | `DATA-SYS-016`, `FR-BE-011`, `FR-BE-012` | Cột `must_change_password BOOLEAN NOT NULL DEFAULT FALSE` được thêm bằng migration `V2__add_credential_lifecycle.sql`; cờ bật khi HR khởi tạo tài khoản và tắt sau khi đổi mật khẩu thành công; `password_hash` và `pin_hash` không bao giờ lưu văn bản rõ. | Approved |

---

## 2. Data Rules (Quy tắc Toàn vẹn & Ràng buộc Nghiệp vụ)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-BE-009` | Ràng buộc chống trùng lặp giao dịch điểm danh (Idempotency): bộ ba `(user_id, punch_timestamp, punch_type)` bắt buộc là duy nhất trên `attendance_logs`. | Constraint | Must | `DATA-SYS-009`, `FR-BE-003` | CSDL ném lỗi vi phạm toàn vẹn khi insert trùng; luồng sync ngoại tuyến áp dụng `ON CONFLICT DO NOTHING`. | Approved |
| `DATA-BE-010` | Chuẩn hóa Vector sinh trắc học: mảng đặc trưng khuôn mặt phải có đúng 512 phần tử float32 và đạt chuẩn độ dài hình học $L_2\text{ Norm} = 1.0 \pm 10^{-4}$. | Constraint | Must | `DATA-SYS-010`, `FR-BE-006` | Backend từ chối nạp mẫu khuôn mặt vào hệ thống nếu sai kích thước 512D hoặc chưa chuẩn hóa độ dài hình học. | Approved |
| `DATA-BE-011` | Hiệu lực mã kích hoạt OTP: mỗi mã OTP chỉ có hiệu lực tối đa 48 giờ (`expires_at = created_at + 48h`) và chỉ được dùng đúng 1 lần (`is_used = true`). | Constraint | Must | `DATA-SYS-011`, `FR-BE-005` | Từ chối kích hoạt và trả về mã lỗi thích hợp khi OTP đã qua sử dụng hoặc quá hạn 48 giờ. | Approved |
| `DATA-BE-012` | Bảo vệ mã PIN chống Brute-force: khóa tài khoản điểm danh bằng PIN 15 phút nếu nhập sai mã PIN quá 5 lần liên tiếp (`pin_locked_until = NOW() + 15m`). | Constraint | Must | `DATA-SYS-012`, `FR-BE-001` | Bàn phím Kiosk từ chối thao tác nhập PIN và hiển thị thời gian đếm lùi mở khóa cho nhân viên. | Approved |

---

## 3. Data Lifecycle & Protection (Vòng đời & Bảo vệ Dữ liệu)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-BE-013` | Tiêu hủy dữ liệu sinh trắc học sau 20 ngày: tự động xóa vĩnh viễn (Hard Delete) toàn bộ bản ghi mẫu khuôn mặt khi nhân viên nghỉ việc quá 20 ngày. | Retention | Must | `DATA-SYS-013`, `NFR-BE-003` | Tác vụ nền hàng ngày xóa sạch bản ghi `biometric_templates` có `terminated_date <= CURRENT_DATE - 20 days`. | Approved |
| `DATA-BE-014` | Lưu trữ lịch sử điểm danh tối thiểu 3 năm: dữ liệu chấm công và nhật ký kiểm toán không bị xóa tự động, phục vụ thanh tra lao động. | Retention | Must | `DATA-SYS-014`, `NFR-BE-005` | CSDL trung tâm bảo lưu toàn vẹn dữ liệu `attendance_logs` và `audit_logs` tối thiểu 3 năm theo Luật Lao động. | Approved |
| `DATA-BE-015` | Mã hóa đối xứng AES-256-GCM dữ liệu tĩnh: vector đặc trưng sinh trắc học bắt buộc mã hóa AES-256-GCM trước khi lưu trữ vào CSDL PostgreSQL. | Privacy | Must | `DATA-SYS-015`, `NFR-BE-003` | Vector lưu dưới dạng BYTEA kèm IV 96-bit ngẫu nhiên và khóa Master tách biệt trong biến môi trường. | Approved |

---

## 4. Detailed Entity Attribute Dictionaries (Từ điển Thuộc tính Thực thể Chi tiết)

### 4.1. Thuộc tính Thực thể `users` (`DATA-BE-001`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã số tự tăng định danh duy nhất người dùng. |
| `employee_code` | `VARCHAR(32)` | UNIQUE, NOT NULL | Mã nhân viên doanh nghiệp (Ví dụ: `NV-1042`, format: `^[A-Z]{2,4}-[0-9]{4,6}$`). |
| `full_name` | `VARCHAR(128)` | NOT NULL | Họ và tên đầy đủ của nhân viên. |
| `email` | `VARCHAR(128)` | UNIQUE, NOT NULL | Địa chỉ thư điện tử doanh nghiệp dùng để đăng nhập. |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Mật khẩu tài khoản băm bằng BCrypt ($cost = 12$). |
| `role` | `VARCHAR(32)` | NOT NULL | Vai trò hệ thống: `ADMIN`, `HR_MANAGER`, `EMPLOYEE`. |
| `status` | `VARCHAR(32)` | NOT NULL | Trạng thái hồ sơ: `PENDING_CONSENT`, `ACTIVE`, `SUSPENDED`, `TERMINATED`. |
| `department` | `VARCHAR(64)` | NULLABLE | Tên phòng ban / bộ phận làm việc trực thuộc. |
| `pin_hash` | `VARCHAR(255)` | NULLABLE | Mã PIN 6 số điểm danh dự phòng tại Kiosk (băm BCrypt). |
| `pin_locked_until`| `TIMESTAMP WITH TIME ZONE` | NULLABLE | Mốc thời gian khóa bàn phím PIN (sau 5 lần nhập sai). |
| `must_change_password` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Cờ buộc đổi mật khẩu ở lần đăng nhập đầu tiên; bật khi HR khởi tạo tài khoản, tắt sau khi đổi mật khẩu thành công. |
| `terminated_date` | `DATE` | NULLABLE | Ngày chính thức chấm dứt hợp đồng lao động (căn cứ đếm 20 ngày tiêu hủy dữ liệu). |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Thời điểm tạo hồ sơ người dùng. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Thời điểm cập nhật hồ sơ gần nhất. |

### 4.2. Thuộc tính Thực thể `shifts` (`DATA-BE-002`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã định danh ca làm việc. |
| `shift_code` | `VARCHAR(32)` | UNIQUE, NOT NULL | Mã ca (Ví dụ: `CA_SANG`, `CA_HANH_CHINH`, `CA_TOI`). |
| `shift_name` | `VARCHAR(64)` | NOT NULL | Tên ca hiển thị (Ví dụ: "Ca Hành chính 08:00 - 17:30"). |
| `start_time` | `TIME WITHOUT TIME ZONE` | NOT NULL | Giờ bắt đầu ca chuẩn (Ví dụ: `08:00:00`). |
| `end_time` | `TIME WITHOUT TIME ZONE` | NOT NULL | Giờ kết thúc ca chuẩn (Ví dụ: `17:30:00`). |
| `grace_period_minutes` | `INT` | NOT NULL, Default 15 | Số phút ân hạn cho phép sau giờ bắt đầu ca mà chưa tính đi muộn. |
| `is_active` | `BOOLEAN` | NOT NULL, Default TRUE | Trạng thái kích hoạt áp dụng của ca kíp. |

### 4.3. Thuộc tính Thực thể `employee_shifts` (`DATA-BE-003`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã phân công ca kíp. |
| `user_id` | `BIGINT` | FK $\rightarrow$ `users(id)`, NOT NULL | Nhân viên được áp dụng. |
| `shift_id` | `BIGINT` | FK $\rightarrow$ `shifts(id)`, NOT NULL | Ca làm việc tương ứng. |
| `effective_from` | `DATE` | NOT NULL | Ngày bắt đầu có hiệu lực của lịch phân ca. |
| `effective_to` | `DATE` | NULLABLE | Ngày kết thúc hiệu lực (NULL = vô thời hạn). |

### 4.4. Thuộc tính Thực thể `attendance_logs` (`DATA-BE-004`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã giao dịch điểm danh duy nhất. |
| `user_id` | `BIGINT` | FK $\rightarrow$ `users(id)`, NOT NULL | Nhân viên thực hiện điểm danh. |
| `punch_timestamp` | `TIMESTAMP WITH TIME ZONE` | NOT NULL | Mốc thời gian thực tế ghi nhận lượt quét (ISO-8601). |
| `punch_type` | `VARCHAR(16)` | NOT NULL | Loại điểm danh: `CHECK_IN` hoặc `CHECK_OUT`. |
| `verification_method` | `VARCHAR(32)` | NOT NULL | Phương thức xác thực: `VERIFICATION_FACE`, `VERIFICATION_PIN`, `MANUAL_HR`. |
| `confidence_score` | `NUMERIC(5, 4)` | NULLABLE | Điểm số tương đồng sinh trắc ($0.0000 - 1.0000$). |
| `kiosk_id` | `VARCHAR(64)` | NOT NULL | Mã định danh trạm Kiosk thực hiện (Ví dụ: `KIOSK-HN-01`). |
| `status` | `VARCHAR(32)` | NOT NULL | Trạng thái công: `ON_TIME`, `LATE`, `EARLY_LEAVE`, `OVERTIME`. |
| `late_minutes` | `INT` | NOT NULL, Default 0 | Số phút đi muộn tính toán được sau khi trừ thời gian ân hạn. |
| `is_offline_sync` | `BOOLEAN` | NOT NULL, Default FALSE| Đánh dấu bản ghi được đồng bộ bù từ hàng đợi ngoại tuyến SQLite. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Thời điểm ghi nhận bản ghi vào CSDL máy chủ. |

### 4.5. Thuộc tính Thực thể `biometric_templates` (`DATA-BE-005`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã định danh mẫu sinh trắc. |
| `user_id` | `BIGINT` | FK $\rightarrow$ `users(id)`, NOT NULL | Nhân viên sở hữu mẫu khuôn mặt. |
| `encrypted_vector`| `BYTEA` | NOT NULL | Mảng byte ciphertext của vector 512D (mã hóa AES-256-GCM). |
| `encryption_iv` | `BYTEA` | NOT NULL | Khối Initialization Vector 12 bytes ngẫu nhiên cho mỗi lần mã hóa. |
| `algorithm` | `VARCHAR(32)` | NOT NULL, Default 'ARCFACE_512D'| Thuật toán trích xuất đặc trưng sinh trắc học. |
| `version` | `INT` | NOT NULL, Default 1 | Phiên bản mẫu khuôn mặt của nhân viên. |
| `is_active` | `BOOLEAN` | NOT NULL, Default TRUE | Trạng thái kích hoạt hiệu lực của mẫu mặt. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Thời điểm nạp mẫu vào hệ thống. |

### 4.6. Thuộc tính Thực thể `enrollment_sessions` (`DATA-BE-006`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã phiên đăng ký. |
| `user_id` | `BIGINT` | FK $\rightarrow$ `users(id)`, NOT NULL | Nhân viên thực hiện đăng ký. |
| `otp_hash` | `VARCHAR(255)` | NOT NULL | Mã OTP 6 số ngẫu nhiên băm bằng BCrypt hoặc SHA-256. |
| `consent_version` | `VARCHAR(32)` | NOT NULL | Phiên bản văn bản thỏa thuận Informed Consent được ký. |
| `consent_signed_at`| `TIMESTAMP WITH TIME ZONE` | NOT NULL | Mốc thời gian ký nhận thỏa thuận số theo Luật 2025. |
| `client_ip` | `VARCHAR(45)` | NOT NULL | Địa chỉ IPv4/IPv6 của thiết bị ký văn bản. |
| `expires_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL | Mốc hết hạn hiệu lực của mã OTP (đúng 48 giờ sau khi sinh). |
| `is_used` | `BOOLEAN` | NOT NULL, Default FALSE| Đánh dấu mã OTP đã được dùng để nạp mặt thành công hay chưa. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Thời điểm tạo phiên đăng ký. |

### 4.7. Thuộc tính Thực thể `kiosks` (`DATA-BE-007`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | PK | Mã trạm điểm danh duy nhất (Ví dụ: `KIOSK-HN-01`). |
| `location_name` | `VARCHAR(128)` | NOT NULL | Tên vị trí đặt trạm (Ví dụ: "Sảnh Lễ tân Tầng 1 - Tòa nhà Keangnam"). |
| `secret_token_hash`| `VARCHAR(255)` | NOT NULL | Khóa bí mật của trạm Kiosk băm bằng BCrypt (dùng xác thực API). |
| `is_active` | `BOOLEAN` | NOT NULL, Default TRUE | Trạng thái cho phép trạm Kiosk hoạt động. |
| `last_ping_at` | `TIMESTAMP WITH TIME ZONE` | NULLABLE | Mốc thời gian gần nhất Kiosk gửi tín hiệu kiểm tra sức khỏe. |

### 4.8. Thuộc tính Thực thể `audit_logs` (`DATA-BE-008`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã bản ghi kiểm toán. |
| `actor_id` | `BIGINT` | NULLABLE | ID người thực hiện hành vi (NULL nếu là hệ thống/tác vụ nền). |
| `actor_email` | `VARCHAR(128)` | NULLABLE | Email người thực hiện hành vi. |
| `action` | `VARCHAR(64)` | NOT NULL | Hành vi: `LOGIN`, `PUNCH`, `ENROLL_FACE`, `CONSENT_SIGN`, `DELETE_BIOMETRIC_DATA`. |
| `entity_type` | `VARCHAR(64)` | NOT NULL | Tên bảng bị tác động (Ví dụ: `biometric_templates`, `attendance_logs`). |
| `entity_id` | `VARCHAR(64)` | NULLABLE | Khóa chính của bản ghi bị tác động. |
| `before_state` | `JSONB` | NULLABLE | Trạng thái dữ liệu trước khi thay đổi (đã che thông tin nhạy cảm). |
| `after_state` | `JSONB` | NULLABLE | Trạng thái dữ liệu sau khi thay đổi (đã che thông tin nhạy cảm). |
| `ip_address` | `VARCHAR(45)` | NULLABLE | Địa chỉ IP của máy yêu cầu. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Mốc thời gian ghi nhận (không thể cập nhật/xóa). |

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Chiến lược Phân vùng Bảng Lớn (Table Partitioning)**: Bảng `attendance_logs` được thiết kế tương thích với cơ chế phân vùng theo tháng (`PARTITION BY RANGE (punch_timestamp)`) khi khối lượng bản ghi vượt quá 1 triệu dòng mà không làm thay đổi các truy vấn ứng dụng tầng trên.
* **Định dạng Múi giờ CSDL**: Toàn bộ các cột mốc thời gian lưu trữ bằng kiểu `TIMESTAMP WITH TIME ZONE` (TIMESTAMPTZ) trong PostgreSQL, được chuẩn hóa chuyển đổi theo múi giờ máy chủ UTC+7 để đảm bảo tính nhất quán giữa Backend và báo cáo HR.

