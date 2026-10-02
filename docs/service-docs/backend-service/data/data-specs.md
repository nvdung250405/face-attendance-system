# DATA SPECS — Đặc tả Dữ liệu Trung tâm Phân hệ Backend

> **Mã tài liệu:** `SPEC-DAT-BE-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `backend-service`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả các thực thể dữ liệu quan hệ (`DATA-BE-`), quy tắc toàn vẹn và yêu cầu bảo mật dữ liệu của máy chủ trung tâm Backend.

---

## 1. Central Data Entities (Thực thể Dữ liệu Trung tâm)

| ID | Tên Thực thể Dữ liệu | Ý nghĩa & Phạm vi Sở hữu | Thuộc tính Cốt lõi | Tiêu chí Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- |
| `DATA-BE-001` | Người dùng & Nhân sự (`users`) | Lưu trữ hồ sơ nhân sự, tài khoản đăng nhập, vai trò hệ thống và trạng thái kích hoạt. | `id`, `employee_code`, `full_name`, `email`, `role`, `status`, `department_id`, `created_at`. | Mã nhân viên duy nhất; mật khẩu băm BCrypt. |
| `DATA-BE-002` | Nhật ký Điểm danh (`attendance_logs`)| Lưu trữ toàn bộ lịch sử điểm danh qua trạm Kiosk hoặc bổ sung thủ công bởi HR. | `id`, `user_id`, `punch_timestamp`, `punch_type`, `verification_method`, `confidence_score`, `kiosk_id`, `status`. | Không cho phép trùng lặp `(user_id, punch_timestamp, punch_type)`. |
| `DATA-BE-003` | Mẫu Sinh trắc học Mã hóa (`biometric_templates`)| Lưu trữ vector đặc trưng khuôn mặt 512 chiều được mã hóa bảo vệ theo Luật 2025. | `id`, `user_id`, `encrypted_vector`, `algorithm`, `version`, `is_active`, `created_at`. | Không bao giờ lưu trữ vector ở dạng rõ; xóa mềm khi nhân viên nghỉ việc. |
| `DATA-BE-004` | Phiên Đăng ký Khuôn mặt (`enrollment_sessions`)| Quản lý mã OTP 6 chữ số và trạng thái tiến trình đăng ký khuôn mặt tại Kiosk. | `id`, `user_id`, `otp_hash`, `expires_at`, `is_used`, `consent_signed_at`. | Thời hạn hiệu lực đúng 48 giờ; OTP băm BCrypt. |
| `DATA-BE-005` | Nhật ký Kiểm toán Bất biến (`audit_logs`)| Ghi lại mọi hành động chỉnh sửa dữ liệu nhạy cảm của người dùng và quản trị viên. | `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `before_state`, `after_state`, `created_at`. | Bảng chỉ cho phép thêm (Append-only); cấm cập nhật/xóa. |

---

## 2. Data Protection & Compliance Rules (Quy định Bảo vệ Dữ liệu)

* **Bảo vệ Dữ liệu Sinh trắc (Biometric Privacy)**: Tuân thủ quy định bảo mật sinh trắc học; cấm lưu trữ hình ảnh khuôn mặt thô trên CSDL trung tâm; vector số học bắt buộc mã hóa AES-256-GCM.
* **Quy tắc Kiểm soát Toàn vẹn**: Khóa ngoại `user_id` liên kết chặt chẽ; các bản ghi chấm công có ràng buộc toàn vẹn thời gian và định dạng ISO-8601.
