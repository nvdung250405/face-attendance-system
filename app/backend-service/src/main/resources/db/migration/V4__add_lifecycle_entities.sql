-- ==============================================================================
-- Migration Script: V4__add_lifecycle_entities.sql
-- Phân hệ: Backend Service
-- Đặc tả tham chiếu: docs/service-docs/backend-service/data/data-design.md
--   DTD-BE-012 (kỳ công), DTD-BE-013 (phiên làm việc), DTD-BE-014 (thông báo & vết rút Consent),
--   DTD-BE-015 (yêu cầu dữ liệu cá nhân)
-- Work item: BLD-BE-030 | Task: TASK-BE-035
-- ==============================================================================
-- Lưu ý chung: KHÔNG dùng CHECK constraint trong kịch bản migration. H2 (CSDL của profile kiểm thử)
-- không đánh giá được CHECK do Flyway tạo (biểu thức giữ tham chiếu session DDL đã đóng), xem issue #56.
-- Tập giá trị hợp lệ được ràng buộc bằng enum Java và luồng nghiệp vụ tương ứng.

-- 1. Kỳ công theo tháng (DTD-BE-012, DATA-BE-021, FR-BE-021)
-- Đặt tên cột là period_year/period_month thay vì year/month: YEAR và MONTH là từ khoá dành riêng của H2
-- (CSDL của profile kiểm thử) nên không dùng được làm định danh trần, trong khi PostgreSQL thì cho phép.
-- Một lược đồ duy nhất cho mọi môi trường nên chọn tên cột không xung đột từ khoá.
CREATE TABLE IF NOT EXISTS payroll_periods (
    id BIGSERIAL PRIMARY KEY,
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    locked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    locked_at TIMESTAMP WITH TIME ZONE,
    unlocked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    unlock_reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payroll_period UNIQUE (period_year, period_month)
);

CREATE INDEX idx_payroll_period_status ON payroll_periods(status);

-- 2. Phiên làm việc / refresh token lưu dạng băm một chiều (DTD-BE-013, DATA-BE-022, FR-BE-020)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    client_ip VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, revoked_at);

-- 3. Thông báo trong ứng dụng (DTD-BE-014, DATA-BE-023, FR-BE-024)
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body VARCHAR(1000),
    reference_type VARCHAR(64),
    reference_id VARCHAR(64),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);

-- 4. Vết rút Informed Consent và hạn tiêu hủy dữ liệu sinh trắc 7 ngày (DTD-BE-014, FR-BE-022)
CREATE TABLE IF NOT EXISTS consent_withdrawals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    withdrawn_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_ip VARCHAR(45) NOT NULL,
    biometric_disposal_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_withdrawals_user ON consent_withdrawals(user_id, withdrawn_at DESC);

-- 5. Yêu cầu của chủ thể dữ liệu cá nhân (DTD-BE-015, DATA-BE-024, FR-BE-022)
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(32) NOT NULL,
    detail VARCHAR(1000),
    status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
    handled_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    response VARCHAR(1000),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_requests_user_status ON data_subject_requests(user_id, status);
