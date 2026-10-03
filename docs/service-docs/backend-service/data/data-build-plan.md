---
title: Backend Data Build Plan
version: 2.0
status: Approved
owner: Backend Lead
---

# DATA BUILD PLAN — Kế hoạch Thi công Tầng Dữ liệu Backend


## 1. Approach & Sequencing (Chiến lược Thi công CSDL)

$$\text{Flyway Baseline Schema} \rightarrow \text{Spring Data JPA Entities \& Repositories} \rightarrow \text{Cooldown Cache Manager} \rightarrow \text{Data Verification}$$

---

## 2. Data Build Work Items (Danh mục Hạng mục Thi công CSDL)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `DBL-BE-001` | Viết Kịch bản Migration Flyway V1 | Tạo file `V1__init_schema.sql` khởi tạo đủ 8 bảng CSDL: `users`, `shifts`, `employee_shifts`, `kiosks`, `biometric_templates`, `attendance_logs`, `enrollment_sessions`, `audit_logs`. | `DTD-BE-001` | `FND-BE-003` | Flyway tự động migrate thành công khi ứng dụng khởi động lần đầu; bảng và index tạo đủ. | **Hoàn thành** |
| `DBL-BE-002` | Lập trình Lớp JPA Entities & Enums | Tạo các Java class `@Entity` tương ứng kèm định dạng Enum cho `Role`, `EmployeeStatus`, `PunchType`, `VerificationMethod`, `AttendanceStatus`. | `DATA-BE-001` đến `DATA-BE-008` | `DBL-BE-001` | Mapping ORM chuẩn xác; sinh đúng quan hệ khóa ngoại và ràng buộc duy nhất. | **Hoàn thành** |
| `DBL-BE-003` | Lập trình Spring Data JPA Repositories| Xây dựng các interface Repository với phương thức truy vấn tối ưu, hỗ trợ phân trang `Pageable`, tìm kiếm đa tiêu chí và native batch insert. | `DTD-BE-001` | `DBL-BE-002` | Các truy vấn điểm danh theo ngày và người dùng phản hồi $< 15\text{ ms}$; batch insert 50 bản ghi $< 50\text{ ms}$. | **Hoàn thành** |
| `DBL-BE-004` | Cấu hình Caffeine Cache & Cooldown Manager| Cấu hình Spring Cache với Caffeine, thiết lập TTL 120s cho key `cooldown:punch:{userId}:{date}`. | `SOL-BE-002` | `FND-BE-002` | Quẹt liên tiếp trong 120s được chặn tức thời từ bộ nhớ RAM không cần chạm CSDL. | **Hoàn thành** |
