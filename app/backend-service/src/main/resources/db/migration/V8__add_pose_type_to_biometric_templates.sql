-- ==============================================================================
-- Migration Script: V8__add_pose_type_to_biometric_templates.sql
-- Phân hệ: Backend Service
-- Đặc tả tham chiếu: FEAT-ENROLL-001 (Multi-Template Storage & Guided Multi-Pose Capture)
-- Ràng buộc kiến trúc: KHÔNG thêm CHECK constraint trong migration script
-- để đảm bảo tương thích hoàn toàn với H2 in-memory test database (issue #56).
-- Tính toàn vẹn miền giá trị ('FRONTAL', 'LEFT_TILT', 'RIGHT_TILT') được bảo đảm
-- ở tầng ứng dụng qua Java enum PoseType, JPA @Enumerated và Jakarta Validation.
-- ==============================================================================

-- 1. Bổ sung cột pose_type với giá trị mặc định 'FRONTAL' cho các bản ghi đơn mẫu hiện hữu
ALTER TABLE biometric_templates 
    ADD COLUMN IF NOT EXISTS pose_type VARCHAR(20) NOT NULL DEFAULT 'FRONTAL';

-- 2. Chỉ mục phức hợp tối ưu tra cứu đa mẫu theo người dùng, góc chụp và trạng thái hoạt động
CREATE INDEX IF NOT EXISTS idx_biometric_user_pose_active 
    ON biometric_templates(user_id, pose_type, is_active);
