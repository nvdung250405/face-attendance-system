---
title: Backend Data Test Plan
version: 1.0
status: Approved
owner: Backend QA & Data Engineer
---

# DATA TEST PLAN — Kế hoạch Kiểm thử Tầng Dữ liệu Backend

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Kiểm thử toàn diện tầng lưu trữ dữ liệu PostgreSQL 16, các kịch bản Flyway Migration, các thực thể JPA Entities và bộ nhớ đệm Caffeine Cache của Backend.
* **Mục tiêu**:
  * Đảm bảo tính toàn vẹn dữ liệu, các ràng buộc duy nhất (Unique) và quan hệ khóa ngoại (FK) hoạt động chính xác.
  * Xác nhận hiệu năng ghi hàng loạt (Batch Insert) và cơ chế chống quẹt lặp Cooldown 120s hoạt động ổn định.
  * Đảm bảo kịch bản Flyway migration chạy trơn tru không lỗi trên môi trường kiểm chuẩn.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Dữ liệu)

| ID | Quyết định Tiếp cận Kiểm thử Dữ liệu | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-BE-DAT-01` | Sử dụng Testcontainers PostgreSQL 16 cho kiểm thử tích hợp CSDL. | Đảm bảo môi trường kiểm thử tương đương 100% với môi trường chạy thực tế (Production Parity), không dùng H2 giả lập. | `STK-012`, `DATA-BE-001` | Approved |
| `APC-BE-DAT-02` | Kiểm thử xung đột khóa ngoại và dữ liệu biên (Negative Testing). | Phòng ngừa lỗi tràn số, trùng lặp mã nhân viên và lỗi vi phạm toàn vẹn quan hệ cha-con. | `DATA-BE-001` đến `DATA-BE-008` | Approved |

---

## 3. Data Test Items (Danh mục Ca Kiểm thử Dữ liệu)

| ID | Tên Ca Kiểm thử | Covers Spec | Mức độ Test | Tiêu chí Đạt (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-DAT-001` | Kiểm thử Kịch bản Flyway Migration V1 | `DTD-BE-001` | Integration | Chạy `flyway:migrate` thành công; 8 bảng CSDL và toàn bộ chỉ mục được tạo lập đúng schema. | **Passed** |
| `TST-BE-DAT-002` | Kiểm thử Ràng buộc Toàn vẹn Khóa & Duy nhất | `DATA-BE-001`, `DATA-BE-004` | Unit / JPA | Cố tình chèn trùng `employee_code` hoặc `email` phải ném `DataIntegrityViolationException`. | **Passed** |
| `TST-BE-DAT-003` | Kiểm thử Ghi Lô Điểm danh & Hiệu năng Batch | `DATA-BE-006`, `DTD-BE-001` | Integration / Perf | Chèn đồng thời 50 bản ghi điểm danh trong 1 transaction hoàn tất $\le 50\text{ ms}$. | **Passed** |
| `TST-BE-DAT-004` | Kiểm thử Cooldown Cache 120 Giây | `SOL-BE-002` | Component / Cache | Ghi nhận lượt quẹt đầu tiên thành công; các lượt quẹt tiếp theo của cùng nhân viên trong 120s trả về cache hit. | **Passed** |

---

## 4. Defect Management (Quản lý Lỗi Tầng Dữ liệu)

* Mọi sự cố liên quan đến hỏng cấu trúc migration hoặc mất dữ liệu được xếp loại **Blocker (P0)** và yêu cầu điều tra nguyên nhân gốc (RCA) trước khi cập nhật mã nguồn.
