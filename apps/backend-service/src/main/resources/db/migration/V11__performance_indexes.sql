-- ==============================================================================
-- Migration Script: V11__performance_indexes.sql
-- Phân hệ: Backend Service & Database
-- Đặc tả tham chiếu: FINDING-BE-DB-001, FINDING-BE-DB-002
-- ==============================================================================

-- 1. FINDING-BE-DB-001: Chỉ mục tối ưu truy vấn trạng thái và thời gian điểm danh
-- Đặt cột điều kiện lọc bằng (= status) lên trước khoảng thời gian (punch_timestamp DESC)
-- để PostgreSQL và H2 có thể quét B-tree hiệu quả thay vì full scan.
DROP INDEX IF EXISTS idx_attendance_time_status;
CREATE INDEX IF NOT EXISTS idx_attendance_status_time ON attendance_logs(status, punch_timestamp DESC);

-- 2. FINDING-BE-DB-002: Chỉ mục bao phủ (Covering Index) cho các truy vấn thống kê người dùng theo mốc thời gian
-- Tối ưu countDistinctUserByPunchTimestampBetween thực thi Index-Only Scan mà không cần đọc bảng dữ liệu (Heap).
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp_user ON attendance_logs(punch_timestamp DESC, user_id);
