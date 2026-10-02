# DATA SPECS — Đặc tả Dữ liệu Trung tâm Phân hệ Backend

> **Mã tài liệu:** `SPEC-DAT-BE-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `backend-service`)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục thực thể dữ liệu quan hệ (`DATA-BE-`), định dạng trường chi tiết, giá trị chuẩn hóa (Enums), quy tắc toàn vẹn và yêu cầu bảo vệ vòng đời dữ liệu của máy chủ Backend.

---

## 1. Central Data Entities & Attributes (Thực thể Dữ liệu & Thuộc tính Chi tiết)

### 1.1. Thực thể Người dùng & Nhân sự (`DATA-BE-001` — `users`)
Lưu trữ định danh người dùng hệ thống, thông tin liên lạc, vai trò phân quyền và trạng thái hồ sơ.

| Tên Thuộc tính | Kiểu Dữ liệu | Ràng buộc Toàn vẹn | Ý nghĩa & Mô tả Chi tiết |
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
| `terminated_date` | `DATE` | NULLABLE | Ngày chính thức chấm dứt hợp đồng lao động (căn cứ đếm 20 ngày tiêu hủy dữ liệu). |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Thời điểm tạo hồ sơ người dùng. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Thời điểm cập nhật hồ sơ gần nhất. |

### 1.2. Thực thể Ca Làm việc (`DATA-BE-002` — `shifts`)
Định nghĩa quy chuẩn thời gian vào/ra và các quy tắc ân hạn chấm công.

| Tên Thuộc tính | Kiểu Dữ liệu | Ràng buộc Toàn vẹn | Ý nghĩa & Mô tả Chi tiết |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã định danh ca làm việc. |
| `shift_code` | `VARCHAR(32)` | UNIQUE, NOT NULL | Mã ca (Ví dụ: `CA_SANG`, `CA_HANH_CHINH`, `CA_TOI`). |
| `shift_name` | `VARCHAR(64)` | NOT NULL | Tên ca hiển thị (Ví dụ: "Ca Hành chính 08:00 - 17:30"). |
| `start_time` | `TIME WITHOUT TIME ZONE` | NOT NULL | Giờ bắt đầu ca chuẩn (Ví dụ: `08:00:00`). |
| `end_time` | `TIME WITHOUT TIME ZONE` | NOT NULL | Giờ kết thúc ca chuẩn (Ví dụ: `17:30:00`). |
| `grace_period_minutes` | `INT` | NOT NULL, Default 15 | Số phút ân hạn cho phép sau giờ bắt đầu ca mà chưa tính đi muộn. |
| `is_active` | `BOOLEAN` | NOT NULL, Default TRUE | Trạng thái kích hoạt áp dụng của ca kíp. |

### 1.3. Thực thể Phân công Ca (`DATA-BE-003` — `employee_shifts`)
Ánh xạ nhân viên với ca làm việc tương ứng theo lịch công tác.

| Tên Thuộc tính | Kiểu Dữ liệu | Ràng buộc Toàn vẹn | Ý nghĩa & Mô tả Chi tiết |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã phân công ca kíp. |
| `user_id` | `BIGINT` | FK $\rightarrow$ `users(id)`, NOT NULL | Nhân viên được áp dụng. |
| `shift_id` | `BIGINT` | FK $\rightarrow$ `shifts(id)`, NOT NULL | Ca làm việc tương ứng. |
| `effective_from` | `DATE` | NOT NULL | Ngày bắt đầu có hiệu lực của lịch phân ca. |
| `effective_to` | `DATE` | NULLABLE | Ngày kết thúc hiệu lực (NULL = vô thời hạn). |

### 1.4. Thực thể Nhật ký Điểm danh (`DATA-BE-004` — `attendance_logs`)
Lưu trữ toàn bộ giao dịch quẹt thẻ/khuôn mặt thực tế từ trạm Kiosk và nhập bù của HR.

| Tên Thuộc tính | Kiểu Dữ liệu | Ràng buộc Toàn vẹn | Ý nghĩa & Mô tả Chi tiết |
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

### 1.5. Thực thể Mẫu Sinh trắc học Mã hóa (`DATA-BE-005` — `biometric_templates`)
Lưu trữ vector đặc trưng ArcFace 512 chiều được bảo vệ bằng mã hóa đối xứng.

| Tên Thuộc tính | Kiểu Dữ liệu | Ràng buộc Toàn vẹn | Ý nghĩa & Mô tả Chi tiết |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | PK, Auto Increment | Mã định danh mẫu sinh trắc. |
| `user_id` | `BIGINT` | FK $\rightarrow$ `users(id)`, NOT NULL | Nhân viên sở hữu mẫu khuôn mặt. |
| `encrypted_vector`| `BYTEA` | NOT NULL | Mảng byte ciphertext của vector 512D (mã hóa AES-256-GCM). |
| `encryption_iv` | `BYTEA` | NOT NULL | Khối Initialization Vector 12 bytes ngẫu nhiên cho mỗi lần mã hóa. |
| `algorithm` | `VARCHAR(32)` | NOT NULL, Default 'ARCFACE_512D'| Thuật toán trích xuất đặc trưng sinh trắc học. |
| `version` | `INT` | NOT NULL, Default 1 | Phiên bản mẫu khuôn mặt của nhân viên. |
| `is_active` | `BOOLEAN` | NOT NULL, Default TRUE | Trạng thái kích hoạt hiệu lực của mẫu mặt. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default NOW() | Thời điểm nạp mẫu vào hệ thống. |

### 1.6. Thực thể Phiên Đăng ký OTP (`DATA-BE-006` — `enrollment_sessions`)
Quản lý mã kích hoạt tạm thời và xác nhận văn bản thỏa thuận pháp lý.

| Tên Thuộc tính | Kiểu Dữ liệu | Ràng buộc Toàn vẹn | Ý nghĩa & Mô tả Chi tiết |
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

### 1.7. Thực thể Trạm Kiosk (`DATA-BE-007` — `kiosks`)
Quản lý danh sách các trạm phần cứng Kiosk được phép kết nối vào máy chủ trung tâm.

| Tên Thuộc tính | Kiểu Dữ liệu | Ràng buộc Toàn vẹn | Ý nghĩa & Mô tả Chi tiết |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | PK | Mã trạm điểm danh duy nhất (Ví dụ: `KIOSK-HN-01`). |
| `location_name` | `VARCHAR(128)` | NOT NULL | Tên vị trí đặt trạm (Ví dụ: "Sảnh Lễ tân Tầng 1 - Tòa nhà Keangnam"). |
| `secret_token_hash`| `VARCHAR(255)` | NOT NULL | Khóa bí mật của trạm Kiosk băm bằng BCrypt (dùng xác thực API). |
| `is_active` | `BOOLEAN` | NOT NULL, Default TRUE | Trạng thái cho phép trạm Kiosk hoạt động. |
| `last_ping_at` | `TIMESTAMP WITH TIME ZONE` | NULLABLE | Mốc thời gian gần nhất Kiosk gửi tín hiệu kiểm tra sức khỏe. |

### 1.8. Thực thể Nhật ký Kiểm toán (`DATA-BE-008` — `audit_logs`)
Lưu vết kiểm toán bất biến (Append-only) phục vụ thanh tra và giải trình pháp lý.

| Tên Thuộc tính | Kiểu Dữ liệu | Ràng buộc Toàn vẹn | Ý nghĩa & Mô tả Chi tiết |
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

## 2. Business Data Rules (Quy tắc Toàn vẹn & Ràng buộc Nghiệp vụ)

* **Ràng buộc Chống Trùng lặp Giao dịch**:
  * Cặp `(user_id, punch_timestamp, punch_type)` bắt buộc là duy nhất. Khi nhận gói lô ngoại tuyến, sử dụng chiến lược `ON CONFLICT (user_id, punch_timestamp, punch_type) DO NOTHING` để không phát sinh bản ghi trùng lặp.
* **Thời hạn Hiệu lực OTP**:
  * Mỗi mã OTP chỉ có hiệu lực tối đa 48 giờ (`expires_at = created_at + INTERVAL '48 HOURS'`). Sau 48 giờ hoặc sau khi đã sử dụng (`is_used = true`), mọi request nạp mặt bằng mã này đều bị từ chối.
* **Quy tắc Tiêu hủy Dữ liệu 20 Ngày**:
  * Khi nhân viên thôi việc (`status = 'TERMINATED'`), trường `terminated_date` được kích hoạt. Tác vụ nền hàng ngày tự động xóa vĩnh viễn (Hard Delete) toàn bộ các bản ghi trong `biometric_templates` có `terminated_date <= CURRENT_DATE - INTERVAL '20 DAYS'`.
