---
title: Backend Data Test Plan
version: 2.0
status: Approved
owner: Backend QA & Data Engineer
---

# DATA TEST PLAN — Kế hoạch Kiểm thử Tầng Dữ liệu Backend

## 1. Approach Decisions (Quyết định Phương pháp Kiểm thử Dữ liệu)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-BE-001` | Sử dụng Testcontainers PostgreSQL 16 cho kiểm thử tích hợp CSDL | Đảm bảo môi trường kiểm thử tương đương 100% với môi trường chạy thực tế (Production Parity), kiểm chứng toàn vẹn cú pháp Flyway DDL và PostgreSQL native features. | `STK-012`, `DATA-BE-001` | Accepted |
| `APC-BE-002` | Kiểm thử xung đột khóa ngoại và dữ liệu biên (Negative Testing) | Phòng ngừa lỗi tràn số, trùng lặp mã nhân viên và lỗi vi phạm toàn vẹn quan hệ cha-con trước khi mã nguồn được tích hợp vào pipeline chung. | `DATA-BE-001`, `DATA-BE-008` | Accepted |

---

## 2. Data Test Items (Danh mục Ca Kiểm thử Dữ liệu)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `TST-BE-001` | Kiểm thử Kịch bản Flyway Migration & Schema Baseline | Chạy `flyway:migrate` tự động; khởi tạo đủ 8 bảng CSDL, quan hệ khóa ngoại, kiểu dữ liệu và toàn bộ chỉ mục hiệu năng. | `DATA-BE-001`, `DATA-BE-002`, `DATA-BE-003`, `DATA-BE-004`, `DATA-BE-005`, `DATA-BE-006`, `DATA-BE-007`, `DATA-BE-008` | `BLD-BE-001` | 8 bảng CSDL và toàn bộ chỉ mục được tạo lập đúng schema 3NF không có lỗi DDL trên container PostgreSQL 16. | Done |
| `TST-BE-002` | Kiểm thử Ràng buộc Toàn vẹn Khóa & Xác thực Dữ liệu | Thử chèn trùng `employee_code`, `email`, kiểm tra không phân trùng ca cùng thời điểm và kiểm tra khóa PIN sau 5 lần nhập sai. | `DATA-BE-001`, `DATA-BE-002`, `DATA-BE-003`, `DATA-BE-009`, `DATA-BE-012` | `BLD-BE-002` | CSDL ném `DataIntegrityViolationException` và tự động rollback transaction khi phát hiện chèn trùng lặp. | Done |
| `TST-BE-003` | Kiểm thử Ghi Lô Điểm danh & Hiệu năng Batch | Chèn đồng thời 50 bản ghi điểm danh trong một giao dịch duy nhất có xử lý `ON CONFLICT DO NOTHING`, kiểm chứng lưu trữ 3 năm. | `DATA-BE-004`, `DATA-BE-009`, `DATA-BE-014` | `BLD-BE-003` | Chèn 50 bản ghi hoàn tất trong $\le 50\text{ ms}$; không phát sinh lỗi khóa bảng; dữ liệu điểm danh và audit bảo lưu toàn vẹn. | Done |
| `TST-BE-004` | Kiểm thử Cooldown Cache & Bảo vệ Dữ liệu Sinh trắc | Kiểm tra bộ nhớ đệm Caffeine chặn quẹt lặp trong 120s; kiểm tra lưu vector `BYTEA` AES-256-GCM, chuẩn 512D L2-norm, OTP 48h và tác vụ tiêu hủy 20 ngày. | `DATA-BE-005`, `DATA-BE-006`, `DATA-BE-007`, `DATA-BE-010`, `DATA-BE-011`, `DATA-BE-013`, `DATA-BE-015` | `BLD-BE-004` | Lượt quẹt thứ hai trong 120s trả về cache hit; vector lưu dưới dạng ciphertext kèm IV; OTP hết hạn sau 48h; dữ liệu thôi việc quá 20 ngày bị xóa sạch. | Done |
