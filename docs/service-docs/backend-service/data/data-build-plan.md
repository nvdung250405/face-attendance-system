# DATA BUILD PLAN — Kế hoạch Thi công Tầng Dữ liệu Backend

> **Mã tài liệu:** `PLN-DBL-BE-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `backend-service`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công cơ sở dữ liệu (`DBL-BE-`) của phân hệ Backend.

---

## 1. Approach & Sequencing (Chiến lược Thi công CSDL)

$$\text{Flyway Baseline Schema} \rightarrow \text{Spring Data JPA Entities} \rightarrow \text{Repository Queries \& Index Tuning}$$

---

## 2. Data Build Work Items (Danh mục Hạng mục Thi công CSDL)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `DBL-BE-001` | Viết Kịch bản Migration Flyway V1 | Tạo file `V1__init_schema.sql` khởi tạo các bảng `users`, `biometric_templates`, `attendance_logs`, `enrollment_sessions`, `audit_logs`. | `DTD-BE-001` | `FND-BE-003` | Flyway tự động migrate thành công khi ứng dụng khởi động lần đầu. | **Hoàn thành** |
| `DBL-BE-002` | Lập trình Lớp JPA Entities & Enums | Tạo các Java class `@Entity` tương ứng kèm định dạng Enum cho Role, PunchType, AttendanceStatus. | `DATA-BE-001` đến `DATA-BE-005` | `DBL-BE-001` | Mapping ORM chuẩn xác; sinh đúng quan hệ khóa ngoại và ràng buộc duy nhất. | **Hoàn thành** |
| `DBL-BE-003` | Lập trình Spring Data JPA Repositories| Xây dựng các interface Repository với phương thức truy vấn tối ưu, hỗ trợ phân trang và native query batch. | `DTD-BE-001` | `DBL-BE-002` | Các truy vấn điểm danh theo ngày và người dùng phản hồi $< 15\text{ ms}$. | **Hoàn thành** |
