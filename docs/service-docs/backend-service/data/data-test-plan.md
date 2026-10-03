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

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-BE-001` | Sử dụng Testcontainers PostgreSQL 16 cho kiểm thử tích hợp CSDL. | Đảm bảo môi trường kiểm thử tương đương 100% với môi trường chạy thực tế (Production Parity), không dùng H2 giả lập. | `STK-012`, `DATA-BE-001` | Accepted |
| `APC-BE-002` | Kiểm thử xung đột khóa ngoại và dữ liệu biên (Negative Testing). | Phòng ngừa lỗi tràn số, trùng lặp mã nhân viên và lỗi vi phạm toàn vẹn quan hệ cha-con. | `DATA-BE-001`, `DATA-BE-008` | Accepted |

---

## 3. Data Test Items (Danh mục Ca Kiểm thử Dữ liệu)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-001` | Kiểm thử Kịch bản Flyway Migration V1 | Chạy `flyway:migrate` tự động; khởi tạo 8 bảng CSDL và toàn bộ chỉ mục hiệu năng. | `DTD-BE-001` | `BLD-BE-001` | 8 bảng CSDL và toàn bộ chỉ mục được tạo lập đúng schema không có lỗi DDL. | Done |
| `TST-BE-002` | Kiểm thử Ràng buộc Toàn vẹn Khóa & Duy nhất | Thử chèn trùng `employee_code` hoặc `email` trong bảng `users` để kiểm tra toàn vẹn dữ liệu. | `DATA-BE-001`, `DATA-BE-009` | `BLD-BE-002` | Ném `DataIntegrityViolationException` và rollback transaction khi chèn trùng lặp. | Done |
| `TST-BE-003` | Kiểm thử Ghi Lô Điểm danh & Hiệu năng Batch | Chèn đồng thời 50 bản ghi điểm danh trong một giao dịch duy nhất có xử lý `ON CONFLICT`. | `DATA-BE-004`, `DTD-BE-001` | `BLD-BE-003` | Chèn 50 bản ghi hoàn tất trong $\le 50\text{ ms}$; không phát sinh lỗi khóa bảng. | Done |
| `TST-BE-004` | Kiểm thử Cooldown Cache 120 Giây | Kiểm tra bộ nhớ đệm Caffeine chặn các lượt quẹt liên tiếp của cùng một nhân viên trong 120 giây. | `DTD-BE-003`, `DATA-BE-012` | `BLD-BE-004` | Lượt quẹt thứ hai trong 120s trả về cache hit, không phát sinh lệnh INSERT xuống CSDL. | Done |

---

## 4. Defect Management (Quản lý Lỗi Tầng Dữ liệu)

* Mọi sự cố liên quan đến hỏng cấu trúc migration hoặc mất dữ liệu được xếp loại **Blocker (P0)** và yêu cầu điều tra nguyên nhân gốc (RCA) trước khi cập nhật mã nguồn.
