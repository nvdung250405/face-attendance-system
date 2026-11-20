# Danh Mục & Vòng Đời Lược Đồ CSDL (Database Migrations)

> **Công nghệ quản lý:** Flyway Migration 10.x  
> **Vị trí tệp mã nguồn:** [`app/backend-service/src/main/resources/db/migration/`](../../app/backend-service/src/main/resources/db/migration/)  
> **Nguyên tắc cốt lõi (Immutable Schema):** Các tệp migration đã phát hành tuyệt đối **không được sửa đổi nội dung**. Mọi thay đổi về cấu trúc bảng bắt buộc phải tạo tệp phiên bản mới (`V9__...sql`).

---

## 1. Danh Mục Các Phiên Bản Lược Đồ (Migration Catalog)

| Phiên Bản | Tệp Migration | Phạm Vi Thay Đổi | Bảng Ảnh Hưởng |
| :--- | :--- | :--- | :--- |
| **`V1`** | `V1__initial_schema.sql` | Khởi tạo 8 bảng cốt lõi (Users, Shifts, Employee Shifts, Kiosks, Biometrics, Attendance Logs, Enrollment, Audit Logs) | `users`, `shifts`, `kiosks`, `attendance_logs`, `biometric_templates`... |
| **`V2`** | `V2__add_credential_lifecycle.sql` | Tách bảo mật đăng nhập: Cột must_change_password trong users | `users` |
| **`V3`** | `V3__add_excuse_requests_and_kiosk_lifecycle.sql` | Bổ sung phân hệ giải trình đi muộn / về sớm cho nhân viên và chỉ mục kiểm toán | `excuse_requests`, `audit_logs`, `kiosks` |
| **`V4`** | `V4__add_lifecycle_entities.sql` | Bổ sung bảng kỳ công, refresh tokens, thông báo, rút đồng thuận và yêu cầu dữ liệu cá nhân | `payroll_periods`, `refresh_tokens`, `notifications`, `consent_withdrawals`, `data_subject_requests` |
| **`V5`** | `V5__drop_must_change_password.sql` | Tối ưu luồng đăng nhập lần đầu của tài khoản nhân viên | `users` |
| **`V6`** | `V6__add_pin_failed_attempts.sql` | Bổ sung cơ chế đếm số lần nhập sai mã PIN để khóa trạm tạm thời | `users` |
| **`V7`** | `V7__add_audit_logs_entity_type_created_idx.sql` | Bổ sung chỉ mục (entity_type, created_at DESC) tra cứu nhật ký kiểm toán | `audit_logs` |
| **`V8`** | `V8__add_pose_type_to_biometric_templates.sql` | Bổ sung cột `pose_type` lưu 3 tư thế khuôn mặt (`FRONTAL`, `LEFT_TILT`, `RIGHT_TILT`) | `biometric_templates` |
| **`V9`** | `V9__performance_and_foreign_key_indexes.sql` | Bổ sung các chỉ mục hiệu năng, chỉ mục khóa ngoại và partial indexes | `attendance_logs`, `excuse_requests`, `employee_shifts`, `payroll_periods`, `data_subject_requests`, `biometric_templates`, `notifications`, `consent_withdrawals` |

---

## 2. Quy Tắc Đặt Tên & Phát Triển Migration

1. **Quy ước đặt tên tệp:**  
   `V<VersionNumber>__<mo_ta_ngan_gon_bang_tieng_anh>.sql` (Lưu ý: dùng **2 dấu gạch dưới** `__`).
2. **Nguyên tắc tương thích H2 In-Memory Database:**  
   Để các bài kiểm thử unit test và integration test của Spring Boot chạy mượt mà trên H2 Database, tránh dùng các cú pháp đặc thù riêng biệt của PostgreSQL mà H2 không hỗ trợ (ví dụ: hạn chế `CHECK constraint` phức tạp trong SQL migration, nên chuyển sang kiểm tra ở tầng ứng dụng qua JPA `@Enumerated` và Bean Validation).
