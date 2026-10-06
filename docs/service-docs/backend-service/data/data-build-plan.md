---
title: Backend Data Build Plan
version: 2.0
status: Approved
owner: Backend Lead
---

# DATA BUILD PLAN — Kế hoạch Thi công Tầng Dữ liệu Backend

## 1. Approach Decisions (Quyết định Phương pháp Thi công)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-007` | Chiến lược Thi công Dữ liệu Backend & Quản lý Migration Flyway | Triển khai theo trình tự: Kịch bản Migration Flyway V1 $\rightarrow$ Mapping JPA Entities & Enums $\rightarrow$ Spring Data Repositories $\rightarrow$ Cấu hình Caffeine Cache Manager. Định nghĩa hoàn thành (DoD): 100% kịch bản migration chạy thành công trên PostgreSQL 16 Testcontainers; không có cảnh báo vi phạm mapping JPA; mọi truy vấn chính có chỉ mục B-tree hỗ trợ. | Sử dụng `hibernate.ddl-auto=update` (bị loại vì rủi ro lệch schema production), Dùng Liquibase thay vì Flyway (bị loại vì Flyway SQL-native đơn giản hơn). | Schema CSDL hoàn toàn tường minh, kiểm soát phiên bản qua Git; file migration V1 là bất biến; thay đổi tương lai phải tạo file version mới. | `ARC-002`, `STK-013` | Accepted |

---

## 2. Data Build Work Items (Danh mục Hạng mục Thi công CSDL)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-BE-001` | Viết Kịch bản Migration Flyway V1 | Tạo file `V1__init_schema.sql` khởi tạo đủ 8 bảng CSDL: `users`, `shifts`, `employee_shifts`, `kiosks`, `biometric_templates`, `attendance_logs`, `enrollment_sessions`, `audit_logs`. | `DTD-BE-001` | `FND-BE-003` | Flyway tự động migrate thành công khi ứng dụng khởi động lần đầu; 8 bảng CSDL và toàn bộ chỉ mục được tạo lập đúng schema. | Done |
| `BLD-BE-002` | Lập trình Lớp JPA Entities & Enums | Tạo các Java class `@Entity` tương ứng kèm định dạng Enum cho `Role`, `EmployeeStatus`, `PunchType`, `VerificationMethod`, `AttendanceStatus`. | `DTD-BE-001` | `BLD-BE-001` | Mapping ORM Hibernate chuẩn xác; sinh đúng quan hệ khóa ngoại và ràng buộc duy nhất; build Maven pass 100%. | Done |
| `BLD-BE-003` | Lập trình Spring Data JPA Repositories | Xây dựng các interface Repository với phương thức truy vấn tối ưu, hỗ trợ phân trang `Pageable`, tìm kiếm đa tiêu chí và native batch insert. | `DTD-BE-001`, `DTD-BE-002` | `BLD-BE-002` | Các truy vấn điểm danh theo ngày và người dùng phản hồi $< 15\text{ ms}$; batch insert 50 bản ghi $< 50\text{ ms}$. | Done |
| `BLD-BE-004` | Cấu hình Caffeine Cache & Cooldown Manager | Cấu hình Spring Cache với Caffeine, thiết lập TTL 120s cho key `cooldown:punch:{userId}:{date}`. | `DTD-BE-003` | `FND-BE-002` | Quẹt liên tiếp trong 120s được chặn tức thời từ bộ nhớ RAM không cần chạm CSDL; giảm $95\%$ áp lực truy vấn. | Done |
| `BLD-BE-018` | Viết Kịch bản Migration Flyway V2 & Ánh xạ Trạng thái Xác thực | Tạo `V2__add_credential_lifecycle.sql` bổ sung cột `must_change_password` cho bảng `users`; cập nhật entity `User` và repository tương ứng. | `DTD-BE-007` | `BLD-BE-001` | Migration V2 chạy thành công trên CSDL đang có dữ liệu mà không mất bản ghi; tài khoản mới có cờ `TRUE`; cờ tắt sau khi đổi mật khẩu thành công. | Done |
| `BLD-BE-023` | Viết Kịch bản Migration Flyway V3 & Chỉ mục Tra cứu | Tạo `V3__add_excuse_requests_and_kiosk_lifecycle.sql`: bảng `excuse_requests`, chỉ mục `(user_id, effective_from, effective_to)` cho `employee_shifts`, chỉ mục tra cứu `audit_logs`/Consent và chỉ mục trạng thái cho `kiosks`; cập nhật entity/repository tương ứng. | `DTD-BE-008`, `DTD-BE-009`, `DTD-BE-010`, `DTD-BE-011` | `BLD-BE-001` | Migration V3 chạy thành công trên CSDL đã áp dụng `V1`/`V2` mà không mất bản ghi; bảng `excuse_requests` và toàn bộ chỉ mục được tạo đúng lược đồ; không có cột lưu Secret Token dạng văn bản rõ. | Planned |
| `BLD-BE-030` | Viết Kịch bản Migration Flyway V4 cho Thực thể Vòng đời | Tạo `V4__add_lifecycle_entities.sql`: bảng `payroll_periods`, `refresh_tokens`, `notifications`, `consent_withdrawals`, `data_subject_requests` kèm chỉ mục và ràng buộc (duy nhất theo `(year, month)`, chỉ mục tra cứu phiên/thông báo); cập nhật entity/repository tương ứng. | `DTD-BE-012`, `DTD-BE-013`, `DTD-BE-014`, `DTD-BE-015` | `BLD-BE-001` | Migration V4 chạy thành công trên CSDL đã áp dụng `V1`–`V3` mà không mất bản ghi; 5 bảng và toàn bộ chỉ mục được tạo đúng lược đồ; không có cột lưu token/OTP dạng văn bản rõ. | Planned |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Tính Bất biến của Kịch bản Migration Flyway**: Kịch bản `V1__init_schema.sql` là baseline cố định; bất kỳ thay đổi nào về cấu trúc bảng hoặc chỉ mục sau khi release đều phải thực hiện qua migration version tiếp theo (`V2__...sql`) và không được sửa đổi file migration đã áp dụng.
* **Cấu hình Kết nối CSDL Khi Chạy Build/Test**: Bộ kiểm thử tự động chạy trên `src/test/resources/application.yml` với profile `test`, dùng H2 in-memory ở chế độ `MODE=PostgreSQL` (`ddl-auto: create-drop` kèm Flyway), do đó không yêu cầu Docker Engine cục bộ. Kiểm thử tích hợp trên PostgreSQL 16 thật được thực hiện trong CI qua service container `postgres:16-alpine` khai báo trong `.github/workflows/ci.yml`.

