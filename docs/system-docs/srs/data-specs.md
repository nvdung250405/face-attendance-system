---
title: Đặc tả Yêu cầu Dữ liệu Hệ thống (Data Specs)
version: 1.0
status: Approved
owner: Data Architect
---

# DATA SPECS — Đặc tả Yêu cầu Dữ liệu Hệ thống

Đặc tả các thực thể dữ liệu nghiệp vụ (`DATA-SYS-`), quy tắc toàn vẹn dữ liệu và chính sách bảo vệ vòng đời dữ liệu sinh trắc học theo Luật 2025 trên toàn hệ thống.

---

## 1. Data Entities (Thực thể Dữ liệu Nghiệp vụ)

| ID | Tên Thực thể Dữ liệu | Ý nghĩa Nghiệp vụ & Phạm vi Sở hữu | Thuộc tính Cốt lõi | Nguồn Gốc Dữ liệu (Source of Truth) |
| :--- | :--- | :--- | :--- | :--- |
| `DATA-SYS-001` | Nhân viên (`Employee`) | Quản lý hồ sơ định danh, phòng ban, vai trò hệ thống, trạng thái công tác và mã PIN dự phòng. | `emp_code`, `full_name`, `email`, `department`, `role`, `status`, `pin_hash`, `pin_locked_until`, `terminated_date`. | CSDL PostgreSQL (Nhập liệu từ HR qua Web Portal). |
| `DATA-SYS-002` | Ca Làm việc (`Shift`) | Định nghĩa khung giờ làm việc chuẩn, thời gian ân hạn và trạng thái kích hoạt của ca kíp. | `shift_code`, `shift_name`, `start_time`, `end_time`, `grace_period_minutes` (15p), `is_active`. | CSDL PostgreSQL (Thiết lập từ HR qua Web Portal). |
| `DATA-SYS-003` | Phân công Ca (`EmployeeShift`) | Ánh xạ nhân viên với ca làm việc cụ thể theo khoảng thời gian hiệu lực. | `employee_id`, `shift_id`, `effective_from`, `effective_to`. | CSDL PostgreSQL (Phân ca từ HR qua Web Portal). |
| `DATA-SYS-004` | Lượt Điểm danh (`AttendanceRecord`)| Bản ghi lịch sử chấm công thực tế của nhân viên qua khuôn mặt hoặc mã PIN. | `employee_id`, `punch_date`, `punch_time`, `punch_type`, `verification_method`, `status`, `late_minutes`, `kiosk_id`, `confidence_score`, `is_synced_from_offline`. | Trạm Kiosk (Ghi nhận biên) $\rightarrow$ Backend PostgreSQL. |
| `DATA-SYS-005` | Mẫu Sinh trắc học (`BiometricTemplate`)| Vector đặc trưng 512D đã được mã hóa đối xứng AES-256-GCM bảo vệ an toàn ở trạng thái tĩnh. | `employee_id`, `template_vector_encrypted` (BYTEA), `initialization_vector` (12 bytes), `auth_tag` (16 bytes), `model_version`, `is_active`. | Trạm Kiosk trích xuất $\rightarrow$ Backend mã hóa lưu CSDL. |
| `DATA-SYS-006` | Mã OTP Kích hoạt (`EnrollmentOtp`) | Mã số kích hoạt 6 chữ số có hiệu lực giới hạn dùng để nhân viên tự nạp khuôn mặt tại trạm Kiosk. | `employee_id`, `otp_hash` (SHA-256), `expires_at` (48 giờ), `is_used`. | Backend sinh mã $\rightarrow$ Nhân viên mang ra Kiosk. |
| `DATA-SYS-007` | Nhật ký Cam kết (`ConsentAuditLog`) | Bản ghi lưu vết pháp lý văn bản thỏa thuận Informed Consent điện tử theo Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15. | `employee_id`, `consent_version`, `agreed_at`, `ip_address`, `user_agent`, `legal_basis`. | Web Portal (Nhân viên ký nhận lần đầu). |
| `DATA-SYS-008` | Đơn Giải trình Công (`ExcuseRequest`) | Đơn xin giải trình lý do đi muộn, về sớm hoặc quên chấm công của nhân viên. | `employee_id`, `attendance_date`, `reason`, `proof_file_path`, `status` (PENDING/APPROVED/REJECTED), `reviewed_by_id`, `review_comment`. | Web Portal (Nhân viên gửi $\rightarrow$ HR phê duyệt). |

---

## 2. Data Rules & Validation (Quy tắc Dữ liệu & Tính Toàn vẹn)

| ID | Quy tắc Toàn vẹn Dữ liệu | Ràng buộc Kỹ thuật Cụ thể | Hành vi Vi phạm / Xử lý |
| :--- | :--- | :--- | :--- |
| `DATA-SYS-009` | Duy nhất Định danh Nhân viên | Mã nhân viên `emp_code` và địa chỉ `email` bắt buộc phải là duy nhất trên toàn hệ thống (`UNIQUE, NOT NULL`). | Báo lỗi trùng lặp khi thêm mới hồ sơ nhân sự trên Web Portal. |
| `DATA-SYS-010` | Chuẩn hóa Vector Đặc trưng 512D | Vector khuôn mặt phải có đúng 512 phần tử số thực kiểu `float32` và đạt chuẩn độ dài hình học $L_2\text{ Norm} = 1.0 \pm 10^{-4}$. | Từ chối nạp mẫu khuôn mặt vào hệ thống nếu sai kích thước hoặc chưa chuẩn hóa. |
| `DATA-SYS-011` | Hiệu lực Mã Kích hoạt OTP | Mã kích hoạt OTP chỉ được sử dụng đúng 1 lần (`is_used = true`) và tự động hết hiệu lực sau đúng 48 giờ kể từ khi sinh mã. | Trả về thông báo lỗi "Mã kích hoạt không hợp lệ hoặc đã hết hạn" tại Kiosk. |
| `DATA-SYS-012` | Bảo vệ Mã PIN Chống Brute-force | Nếu nhập sai mã PIN quá 5 lần liên tiếp, tài khoản điểm danh bằng PIN bị khóa cưỡng bức 15 phút (`pin_locked_until = now() + 15m`). | Bàn phím Kiosk từ chối thao tác và hiển thị thời gian đếm lùi mở khóa. |

---

## 3. Data Lifecycle & Protection (Vòng đời & Bảo vệ Dữ liệu)

| ID | Chính sách Vòng đời Dữ liệu | Căn cứ Pháp lý & Kỹ thuật | Cơ chế Thực thi |
| :--- | :--- | :--- | :--- |
| `DATA-SYS-013` | Tiêu hủy Dữ liệu Sinh trắc học sau 20 ngày | Điều 17 Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15. | Khi nhân viên có trạng thái `TERMINATED` và `terminated_date <= CurrentDate - 20 days`, tiến trình tự động xóa sạch vĩnh viễn (Hard Delete) toàn bộ bản ghi liên quan trong `biometric_templates` và ghi log kiểm toán. |
| `DATA-SYS-014` | Lưu trữ Lịch sử Điểm danh Tối thiểu 3 Năm | Bộ luật Lao động Việt Nam phục vụ thanh tra lao động. | Dữ liệu trong bảng `attendance_records` và `audit_logs` được lưu trữ vĩnh viễn trong CSDL trung tâm, không bị xóa tự động. |
| `DATA-SYS-015` | Mã hóa Đối xứng AES-256-GCM Dữ liệu Tĩnh | Tiêu chuẩn mã hóa FIPS 197 / NIST SP 800-38D. | Vector đặc trưng được mã hóa trước khi ghi vào cột BYTEA của PostgreSQL; mỗi lần mã hóa sinh IV ngẫu nhiên 96-bit độc lập; Master Key nạp từ biến môi trường. |
