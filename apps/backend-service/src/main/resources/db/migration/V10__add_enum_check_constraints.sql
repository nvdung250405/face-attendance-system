-- ==============================================================================
-- Migration Script: V10__add_enum_check_constraints.sql
-- Phân hệ: Backend Service & Database
-- Đặc tả tham chiếu: DATA-BE-001, SEC-DATA-001, DB-INTEG-003
-- Mục đích: Khóa chặt tính toàn vẹn của các giá trị Enum tại tầng CSDL PostgreSQL/H2,
--          ngăn chặn tuyệt đối việc nạp sai giá trị chuỗi từ các tệp seed hoặc câu lệnh SQL ngoài.
-- ==============================================================================

-- 1. Ràng buộc trạng thái và vai trò của người dùng / nhân sự (users)
ALTER TABLE users ADD CONSTRAINT chk_users_status 
    CHECK (status IN ('PENDING_CONSENT', 'ACTIVE', 'SUSPENDED', 'TERMINATED'));

ALTER TABLE users ADD CONSTRAINT chk_users_role 
    CHECK (role IN ('ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'DPO'));

-- 2. Ràng buộc nhật ký điểm danh (attendance_logs)
ALTER TABLE attendance_logs ADD CONSTRAINT chk_attendance_verification_method 
    CHECK (verification_method IN ('VERIFICATION_FACE', 'VERIFICATION_PIN', 'MANUAL_HR', 'FACE_MATCH', 'FALLBACK_PIN', 'HR_OVERRIDE'));

ALTER TABLE attendance_logs ADD CONSTRAINT chk_attendance_status 
    CHECK (status IN ('ON_TIME', 'LATE', 'EARLY_LEAVE', 'OVERTIME', 'ANOMALOUS'));

ALTER TABLE attendance_logs ADD CONSTRAINT chk_attendance_punch_type 
    CHECK (punch_type IN ('CHECK_IN', 'CHECK_OUT'));

-- 3. Ràng buộc đơn giải trình (excuse_requests)
ALTER TABLE excuse_requests ADD CONSTRAINT chk_excuse_requests_status 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- 4. Ràng buộc kỳ chốt công (payroll_periods)
ALTER TABLE payroll_periods ADD CONSTRAINT chk_payroll_periods_status 
    CHECK (status IN ('OPEN', 'LOCKED'));

-- 5. Ràng buộc yêu cầu dữ liệu cá nhân DSR (data_subject_requests)
ALTER TABLE data_subject_requests ADD CONSTRAINT chk_data_subject_requests_type 
    CHECK (request_type IN ('ACCESS', 'CORRECTION'));

ALTER TABLE data_subject_requests ADD CONSTRAINT chk_data_subject_requests_status 
    CHECK (status IN ('RECEIVED', 'IN_PROGRESS', 'FULFILLED', 'REJECTED'));

-- 6. Ràng buộc tư thế khuôn mặt sinh trắc học (biometric_templates)
ALTER TABLE biometric_templates ADD CONSTRAINT chk_biometric_pose_type 
    CHECK (pose_type IN ('FRONTAL', 'LEFT_TILT', 'RIGHT_TILT'));
