-- ==============================================================================
-- V7: Bổ sung chỉ mục kết hợp entity_type và created_at cho audit_logs
-- Tối ưu hóa truy vấn lọc theo loại thực thể và thời gian của DPO/Admin (FR-BE-016)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_entity_type_created ON audit_logs(entity_type, created_at DESC);

