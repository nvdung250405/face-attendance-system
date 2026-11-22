# Chuẩn Thiết Kế Cơ Sở Dữ Liệu Toàn Cục (Global Database Architecture)

> **Cấp độ:** Toàn cục (Global)  
> **Mã tài liệu:** `DOC-DESIGN-DATABASE`  
> **Trạng thái:** [APPROVED]  
> **Hệ quản trị CSDL:** PostgreSQL 16+ LTS, H2 In-Memory (Test Runner), Flyway Migration.

---

## 1. Chiến Lược Quản Trị Phiên Bản Schema (Flyway Migration Strategy)

Mọi thay đổi cấu trúc bảng, kiểu dữ liệu, index và ràng buộc kiểm tra PHẢI được quản lý tập trung qua các file Flyway SQL migration:
- **Thư mục lưu trữ:** `apps/backend-service/src/main/resources/db/migration/`
- **Quy ước đặt tên:** `V<Version>__<Mo_ta_ngan_gon>.sql` (hai dấu gạch dưới liên tiếp).
- **Nguyên tắc Bất biến:** Tuyệt đối không sửa đổi file migration đã merge và chạy trên môi trường Staging/Production. Mọi tinh chỉnh bắt buộc tạo version mới (`V11`, `V12`...).

### Danh mục Phiên bản Schema:
- `V1`: Khởi tạo các bảng nòng cốt (`users`, `biometric_templates`, `attendance_logs`, `shifts`, `kiosks`, `audit_logs`).
- `V2`: Vòng đời thông tin đăng nhập và cơ chế đổi mật khẩu.
- `V3`: Bảng đơn giải trình (`excuse_requests`) và vòng đời kiosk.
- `V4`: Quản lý kỳ công (`payroll_periods`), yêu cầu chủ thể dữ liệu (`data_subject_requests`), rút consent (`consent_withdrawals`).
- `V6`: Đếm số lần thất bại mã PIN và chống tấn công dò mã (`pin_failed_attempts`).
- `V7`: Tối ưu index kép cho bảng kiểm toán `audit_logs(entity_type, created_at)`.
- `V8`: Mở rộng trường `pose_type` trên `biometric_templates` (hỗ trợ Guided Multi-Pose Front/Left/Right).
- `V9`: Bổ sung toàn diện các Foreign Key Indexes và Performance Indexes chống Sequential Scan.
- `V10`: Thiết lập ràng buộc kiểm tra cấp DB `CHECK` constraint trên 10 cột enum.

---

## 2. Tính Tương Thích Đa Môi Trường (PostgreSQL Staging vs H2 In-Memory Test)

Để đảm bảo các bài test tự động chạy nhanh trong RAM trên H2 mà không làm sai lệch hành vi của PostgreSQL 16 trên Staging/Production:
- **Chuẩn hóa Ràng buộc CHECK:** Khi khai báo `CHECK (status IN (...))`, luôn hỗ trợ `(status IS NULL OR status IN (...))` nếu cột đã có `NOT NULL DEFAULT ...`, ngăn chặn việc H2 đánh giá CHECK trước khi gán giá trị mặc định.
- **Tránh cú pháp đặc thù không chuẩn ANSI:** Hạn chế các hàm thủ tục độc quyền của Postgres trong migration cốt lõi nếu làm gãy H2 dialect.

---

## 3. Quy Chuẩn Đánh Index & Phòng Ngừa N+1 Queries

- **100% Khóa Ngoại Phải Có B-Tree Index:** Mọi cột khóa ngoại (`user_id`, `shift_id`, `kiosk_id`) bắt buộc có index để tối ưu các phép `JOIN` và tránh Table Lock khi xóa bản ghi cha.
- **Index Thời Gian & Composite:** Các bảng có tần suất truy vấn theo khoảng thời gian cao (`attendance_logs`, `audit_logs`) bắt buộc có index kép: `(user_id, punch_time)` hoặc `(entity_type, created_at)`.
- **Triệt tiêu N+1 Query tại Tầng JPA:** Mọi quan hệ `FetchType.LAZY` khi được nạp danh sách phân trang bắt buộc sử dụng `@EntityGraph(attributePaths = {...})` hoặc `JOIN FETCH` trong Spring Data JPA Repository.

---

## 4. Quản Trị Kết Nối & Hiệu Năng (Connection Pool HikariCP)

- **Pool Engine:** HikariCP với cấu hình mặc định tối ưu:
  - `maximum-pool-size: 20` (phù hợp với môi trường Staging/Production 2 vCPU).
  - `minimum-idle: 5`
  - `connection-timeout: 30000` (30 giây)
  - `idle-timeout: 600000` (10 phút)
  - `max-lifetime: 1800000` (30 phút)
- **Tối ưu Giao dịch Đọc:** Áp dụng `@Transactional(readOnly = true)` trên toàn bộ các phương thức truy vấn để tránh Hibernate Dirty Checking và tối ưu tài nguyên connection.

---

## 5. Cơ Chế Tiêu Hủy Dữ Liệu Tự Động (Hard Erasure per Decree 356/2025)

- **Tác vụ Cron Định Kỳ:** Chạy hàng ngày lúc 01:00 AM (`0 0 1 * * ?`).
- **Thực thi Xóa Cứng (Hard Delete):**
  - Quét nhân viên thôi việc quá 20 ngày (`status = 'TERMINATED' AND terminated_date <= NOW() - INTERVAL '20 days'`).
  - Quét nhân viên rút consent quá 7 ngày (`consent_active = false AND revoked_date <= NOW() - INTERVAL '7 days'`).
  - Thực thi: `DELETE FROM biometric_templates WHERE employee_id IN (...)` (xóa sạch vector 512D khỏi đĩa vật lý).
  - Ghi vết hành vi vào `audit_logs` phục vụ thanh tra DPO.
