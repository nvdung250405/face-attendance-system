-- ==============================================================================
-- Kịch bản Làm Sạch Hoàn Toàn Dữ Liệu CSDL (Production-Ready Clean State)
-- Giữ lại tài khoản Administrator gốc, xóa sạch dữ liệu điểm danh, đăng ký khuôn mặt rác
-- ==============================================================================

BEGIN;

-- 1. Xóa dữ liệu điểm danh, ngoại lệ, thông báo, kỳ công và các bảng liên quan với RESTART IDENTITY
TRUNCATE TABLE attendance_logs, excuse_requests, notifications, audit_logs, 
               enrollment_sessions, biometric_templates, consent_withdrawals, 
               data_subject_requests, employee_shifts, payroll_periods 
RESTART IDENTITY CASCADE;

-- 2. Xóa các tài khoản nhân viên thử nghiệm (chỉ giữ lại tài khoản ADMIN gốc)
DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE role != 'ADMIN');
DELETE FROM users WHERE role != 'ADMIN';
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;

COMMIT;
