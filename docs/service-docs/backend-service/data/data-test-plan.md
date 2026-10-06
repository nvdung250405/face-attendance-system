---
title: Backend Data Test Plan
version: 2.0
status: Approved
owner: Backend QA & Data Engineer
---

# DATA TEST PLAN — Kế hoạch Kiểm thử Tầng Dữ liệu Backend

## 1. Approach Decisions (Quyết định Phương pháp Kiểm thử Dữ liệu)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-001` | Sử dụng Testcontainers PostgreSQL 16 cho kiểm thử tích hợp CSDL | Đảm bảo môi trường kiểm thử tương đương 100% với môi trường chạy thực tế (Production Parity), kiểm chứng toàn vẹn cú pháp Flyway DDL và PostgreSQL native features. | Sử dụng H2 Database in-memory hoặc mock JDBC (bị loại vì H2 không kiểm tra được kiểu `BYTEA`, `TIMESTAMPTZ` và cú pháp PostgreSQL native). | Yêu cầu Docker Daemon hoạt động trên môi trường chạy test; thời gian khởi tạo container ban đầu tốn vài giây nhưng đảm bảo tính chính xác 100%. | `STK-012`, `DATA-BE-001` | Accepted |
| `APC-BE-002` | Kiểm thử xung đột khóa ngoại và dữ liệu biên (Negative Testing) | Phòng ngừa lỗi tràn số, trùng lặp mã nhân viên và lỗi vi phạm toàn vẹn quan hệ cha-con trước khi mã nguồn được tích hợp vào pipeline chung. | Chỉ kiểm thử luồng thuận (Happy Path) qua Web/Kiosk API (bị loại vì không kiểm soát được race condition và lỗi ràng buộc CSDL). | Phải lập trình các kịch bản cố tình chèn dữ liệu sai, chèn trùng khóa duy nhất để kiểm tra ngoại lệ `DataIntegrityViolationException` và rollback tự động. | `DATA-BE-001`, `DATA-BE-008` | Accepted |

---

## 2. Data Test Items (Danh mục Ca Kiểm thử Dữ liệu)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-001` | Kiểm thử Kịch bản Flyway Migration & Schema Baseline | Chạy `flyway:migrate` tự động; khởi tạo đủ 8 bảng CSDL, quan hệ khóa ngoại, kiểu dữ liệu và toàn bộ chỉ mục hiệu năng. | `DATA-BE-001`, `DATA-BE-002`, `DATA-BE-003`, `DATA-BE-004`, `DATA-BE-005`, `DATA-BE-006`, `DATA-BE-007`, `DATA-BE-008` | `BLD-BE-001` | 8 bảng CSDL và toàn bộ chỉ mục được tạo lập đúng schema 3NF không có lỗi DDL trên container PostgreSQL 16. | Done |
| `TST-BE-002` | Kiểm thử Ràng buộc Toàn vẹn Khóa & Xác thực Dữ liệu | Thử chèn trùng `employee_code`, `email`, kiểm tra không phân trùng ca cùng thời điểm và kiểm tra khóa PIN sau 5 lần nhập sai. | `DATA-BE-001`, `DATA-BE-002`, `DATA-BE-003`, `DATA-BE-009`, `DATA-BE-012` | `BLD-BE-002` | CSDL ném `DataIntegrityViolationException` và tự động rollback transaction khi phát hiện chèn trùng lặp. | Done |
| `TST-BE-003` | Kiểm thử Ghi Lô Điểm danh & Hiệu năng Batch | Chèn đồng thời 50 bản ghi điểm danh trong một giao dịch duy nhất có xử lý `ON CONFLICT DO NOTHING`, kiểm chứng lưu trữ 3 năm. | `DATA-BE-004`, `DATA-BE-009`, `DATA-BE-014` | `BLD-BE-003` | Chèn 50 bản ghi hoàn tất trong $\le 50\text{ ms}$; không phát sinh lỗi khóa bảng; dữ liệu điểm danh và audit bảo lưu toàn vẹn. | Done |
| `TST-BE-004` | Kiểm thử Cooldown Cache & Bảo vệ Dữ liệu Sinh trắc | Kiểm tra bộ nhớ đệm Caffeine chặn quẹt lặp trong 120s; kiểm tra lưu vector `BYTEA` AES-256-GCM, chuẩn 512D L2-norm, OTP 48h và tác vụ tiêu hủy 20 ngày. | `DATA-BE-005`, `DATA-BE-006`, `DATA-BE-007`, `DATA-BE-010`, `DATA-BE-011`, `DATA-BE-013`, `DATA-BE-015` | `BLD-BE-004` | Lượt quẹt thứ hai trong 120s trả về cache hit; vector lưu dưới dạng ciphertext kèm IV; OTP hết hạn sau 48h; dữ liệu thôi việc quá 20 ngày bị xóa sạch. | Done |
| `TST-BE-022` | Kiểm thử Migration V2 & Ràng buộc Trạng thái Xác thực | Áp dụng `V2__add_credential_lifecycle.sql` trên CSDL đã có `V1`; kiểm tra cột `must_change_password`, giá trị mặc định và vòng đời bật/tắt cờ; kiểm tra ràng buộc khóa PIN 15 phút sau 5 lần sai. | `DATA-BE-016`, `DATA-BE-012` | `BLD-BE-018` | Migration `V2` chạy thành công trên CSDL đang có dữ liệu, không mất mát bản ghi; tài khoản mới có `must_change_password = TRUE`; tắt cờ sau khi đổi mật khẩu thành công; `pin_locked_until > NOW()` khi đang bị khóa. | Planned |
| `TST-BE-023` | Kiểm thử Ràng buộc & Chỉ mục Lịch Phân ca | Áp dụng chỉ mục `(user_id, effective_from, effective_to)`; thử tạo hai phân ca chồng khoảng hiệu lực của cùng nhân viên (kể cả hai yêu cầu đồng thời) và phân ca liền kề. | `DATA-BE-017` | `BLD-BE-023` | Chỉ mục được tạo đúng; phân ca chồng khoảng bị từ chối và **không** ghi bản ghi; phân ca liền kề (`effective_to` = `effective_from` kế tiếp) được chấp nhận; `effective_to` NULL được coi là vô hạn. | Planned |
| `TST-BE-024` | Kiểm thử Migration V3 & Chỉ mục Tra cứu | Chạy `V3__add_excuse_requests_and_kiosk_lifecycle.sql` trên CSDL đã có `V1`/`V2`; kiểm tra bảng `excuse_requests`, chỉ mục `audit_logs`/Consent, trạng thái trạm Kiosk và ràng buộc append-only. | `DATA-BE-018`, `DATA-BE-019`, `DATA-BE-020` | `BLD-BE-023` | Migration V3 chạy thành công, không mất bản ghi; bảng `excuse_requests` và các chỉ mục tồn tại đúng lược đồ; không có cột lưu Secret Token dạng văn bản rõ; không tồn tại thao tác cập nhật/xoá `audit_logs`. | Planned |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Yêu cầu Docker Engine cho Testcontainers**: Toàn bộ các ca kiểm thử tích hợp CSDL (`TST-BE-001` .. `TST-BE-004`) chạy trên instance PostgreSQL 16 thật thông qua Testcontainers, yêu cầu Docker Daemon hoạt động ổn định trên runner/máy phát triển.
* **Mức độ Cô lập Giao dịch**: Các bài test kiểm tra race condition ghi nhận điểm danh và trừ lượt nhập PIN sai hoạt động dưới mức độ cô lập mặc định `READ COMMITTED`, kiểm chứng cơ chế khóa bi quan hoặc khóa duy nhất ở cấp độ bảng.

