-- ==============================================================================
-- Migration Script: V3__add_excuse_requests_and_kiosk_lifecycle.sql
-- Phân hệ: Backend Service
-- Đặc tả tham chiếu: docs/service-docs/backend-service/data/data-design.md
--   DTD-BE-009 (bảng đơn giải trình), DTD-BE-010 (vòng đời trạm Kiosk),
--   DTD-BE-011 (chỉ mục tra cứu kiểm toán/Consent)
-- Work item: BLD-BE-023 | Task: TASK-BE-028
-- ==============================================================================
-- V1 đã có sẵn: idx_emp_shifts_lookup(user_id, effective_from, effective_to), các cột
-- kiosks.secret_token_hash / is_active / last_ping_at, và enrollment_sessions.consent_signed_at.
-- V3 chỉ bổ sung bảng đơn giải trình và các chỉ mục tra cứu còn thiếu.

-- 1. Bảng đơn giải trình công (DTD-BE-009, DATA-BE-018)
-- Lưu ý: KHÔNG khai báo CHECK constraint cho cột status ở đây. H2 (CSDL dùng cho profile kiểm thử) không
-- đánh giá được CHECK constraint do Flyway tạo: biểu thức ràng buộc giữ tham chiếu tới session DDL đã đóng
-- nên mọi INSERT sau đó lỗi "Check constraint invalid / The database has been closed". Để giữ MỘT lược đồ
-- duy nhất cho mọi môi trường, tập trạng thái được ràng buộc bởi enum `ExcuseRequestStatus` (kiểm tra lúc
-- biên dịch) và bởi luồng nghiệp vụ duyệt/từ chối ở tầng dịch vụ (TASK-BE-030, FR-BE-015).
CREATE TABLE IF NOT EXISTS excuse_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_log_id BIGINT REFERENCES attendance_logs(id) ON DELETE CASCADE,
    reason VARCHAR(500) NOT NULL,
    requested_punch_timestamp TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    decided_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMP WITH TIME ZONE,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_excuse_user_status ON excuse_requests(user_id, status);
CREATE INDEX idx_excuse_status_created ON excuse_requests(status, created_at DESC);

-- 2. Chỉ mục tra cứu nhật ký kiểm toán theo tác nhân và loại hành vi (DTD-BE-011, FR-BE-016)
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- 3. Chỉ mục tra cứu Consent cho Cán bộ Bảo vệ Dữ liệu (DTD-BE-011, FR-BE-016)
CREATE INDEX idx_enrollment_consent ON enrollment_sessions(user_id, consent_signed_at DESC);

-- 4. Chỉ mục giám sát trạng thái và mốc ping của trạm Kiosk (DTD-BE-010, FR-BE-017)
CREATE INDEX idx_kiosks_active_ping ON kiosks(is_active, last_ping_at DESC);
