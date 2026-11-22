-- ==============================================================================
-- Migration Script: V2__add_credential_lifecycle.sql
-- Phân hệ: Backend Service
-- Đặc tả tham chiếu: docs/service-docs/backend-service/data/data-design.md (DTD-BE-007)
-- Work item: BLD-BE-018 | Task: TASK-BE-023
-- ==============================================================================
-- Bổ sung trạng thái buộc đổi mật khẩu ở lần đăng nhập đầu tiên (FR-BE-011, DATA-BE-016).
-- Tận dụng các cột đã có từ V1: password_hash, pin_hash, pin_locked_until.
-- Tài khoản do HR khởi tạo được ứng dụng đặt cờ TRUE; bản ghi cũ giữ nguyên FALSE.

ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
