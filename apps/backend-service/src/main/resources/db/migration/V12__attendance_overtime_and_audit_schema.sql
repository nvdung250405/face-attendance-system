-- ==============================================================================
-- Migration Script: V12__attendance_overtime_and_audit_schema.sql
-- Phân hệ: Backend Service & Database
-- Đặc tả tham chiếu: FINDING-BE-DOM-001, BIZ-001, FINDING-BE-DOM-003, BIZ-003,
--                   FINDING-BE-DOM-004, BIZ-004, FINDING-BE-DOM-005, BIZ-005
-- ==============================================================================

-- 1. Bổ sung cột overtime_minutes vào bảng attendance_logs
ALTER TABLE attendance_logs 
    ADD COLUMN IF NOT EXISTS overtime_minutes INTEGER DEFAULT 0 NOT NULL;

-- 2. Ràng buộc / chỉ mục duy nhất chặn quẹt thẻ trùng mốc thời gian của cùng một nhân viên
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_punch 
    ON attendance_logs(user_id, punch_timestamp);

-- 3. Bổ sung cột is_overnight vào bảng shifts để hỗ trợ ca làm việc qua đêm (22:00 - 06:00)
ALTER TABLE shifts 
    ADD COLUMN IF NOT EXISTS is_overnight BOOLEAN DEFAULT FALSE NOT NULL;

-- 4. Bảng nhật ký điều chỉnh điểm danh Append-Only phục vụ kiểm toán minh bạch
CREATE TABLE IF NOT EXISTS attendance_modification_history (
    id BIGSERIAL PRIMARY KEY,
    attendance_log_id BIGINT NOT NULL REFERENCES attendance_logs(id) ON DELETE CASCADE,
    original_timestamp TIMESTAMP WITH TIME ZONE,
    updated_timestamp TIMESTAMP WITH TIME ZONE,
    original_status VARCHAR(32),
    updated_status VARCHAR(32),
    modified_by VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_att_mod_history_log_id 
    ON attendance_modification_history(attendance_log_id);
