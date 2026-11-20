-- ==============================================================================
-- Migration Script: V9__performance_and_foreign_key_indexes.sql
-- Phân hệ: Backend Service
-- Đặc tả tham chiếu: DB-PERF-001, DB-PERF-002, DB-PERF-003, DB-INTEG-002, DB-CASC-001
-- ==============================================================================

-- 1. DB-PERF-001: Chỉ mục tối ưu truy vấn khoảng thời gian trên attendance_logs
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_logs(punch_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_time_status ON attendance_logs(punch_timestamp DESC, status);

-- 2. DB-PERF-002: Chỉ mục cho các cột khóa ngoại còn thiếu (tránh Table Scan & Table Lock khi cascade/join)
CREATE INDEX IF NOT EXISTS idx_excuse_attendance_log ON excuse_requests(attendance_log_id);
CREATE INDEX IF NOT EXISTS idx_excuse_decided_by ON excuse_requests(decided_by);
CREATE INDEX IF NOT EXISTS idx_emp_shifts_shift_id ON employee_shifts(shift_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_locked_by ON payroll_periods(locked_by);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_handled_by ON data_subject_requests(handled_by);

-- 3. DB-PERF-003: Chỉ mục tối ưu hoá điều kiện lọc cho tra cứu mẫu, thông báo chưa đọc và hàng đợi tiêu hủy
-- (Để đảm bảo tương thích hoàn toàn với H2 in-memory test database theo issue #56,
--  các cột điều kiện lọc được gộp vào chỉ mục phức hợp thay vì dùng mệnh đề WHERE của PostgreSQL).
CREATE INDEX IF NOT EXISTS idx_biometric_active ON biometric_templates(user_id, pose_type, is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_withdrawals_disposal ON consent_withdrawals(biometric_disposal_due_at, processed_at);
