-- ==============================================================================
-- Kịch bản Làm Sạch Hoàn Toàn Dữ Liệu CSDL (Production-Ready Clean State)
-- Giữ lại tài khoản Administrator gốc, xóa sạch dữ liệu điểm danh, đăng ký khuôn mặt rác
-- ==============================================================================

BEGIN;

-- 1. Xóa dữ liệu điểm danh, ngoại lệ, thông báo
TRUNCATE TABLE attendance_logs CASCADE;
TRUNCATE TABLE excuse_requests CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE audit_logs CASCADE;

-- 2. Xóa các phiên đăng ký và mẫu sinh trắc
TRUNCATE TABLE enrollment_sessions CASCADE;
TRUNCATE TABLE biometric_templates CASCADE;
TRUNCATE TABLE consent_withdrawals CASCADE;
TRUNCATE TABLE data_subject_requests CASCADE;

-- 3. Xóa các ca làm việc nhân viên và phân ca
TRUNCATE TABLE employee_shifts CASCADE;

-- 4. Xóa các tài khoản nhân viên thử nghiệm (chỉ giữ lại tài khoản ADMIN gốc)
DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE role != 'ADMIN');
DELETE FROM users WHERE role != 'ADMIN';

COMMIT;
