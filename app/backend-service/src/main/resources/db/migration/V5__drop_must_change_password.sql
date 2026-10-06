-- ==============================================================================
-- Migration Script: V5__drop_must_change_password.sql
-- Phân hệ: Backend Service
-- Đặc tả tham chiếu: docs/service-docs/backend-service/data/data-design.md (DTD-BE-007)
-- Work item: BLD-BE-035 | Task: TASK-BE-040
-- ==============================================================================
-- Yêu cầu "buộc đổi mật khẩu ở lần đăng nhập đầu tiên" đã bị rút theo change request: chức năng đổi mật
-- khẩu vẫn tồn tại nhưng là tuỳ chọn tự nguyện, không chặn nghiệp vụ. Cột must_change_password do
-- V2__add_credential_lifecycle.sql thêm vào không còn mục đích sử dụng.
-- Kịch bản V2 đã được áp dụng nên giữ nguyên (bất biến theo Mục 3 của data-build-plan); việc gỡ bỏ được
-- thực hiện bằng kịch bản tăng dần V5 này.

ALTER TABLE users DROP COLUMN must_change_password;
