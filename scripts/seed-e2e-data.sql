-- ==============================================================================
-- Kịch bản Nạp Dữ liệu Mẫu Kiểm thử E2E (Kiosk App + Backend Service)
-- Tham chiếu: TASK-BE-044, BLD-BE-006, TST-BE-040
-- Cách dùng: docker exec -i fas-postgres psql -U fas_user -d fas_db < scripts/seed-e2e-data.sql
-- ==============================================================================

-- 1. Khởi tạo Trạm Kiosk mẫu
INSERT INTO kiosks (id, location_name, secret_token_hash, is_active, last_ping_at, created_at)
VALUES (
    'KIOSK-LOBBY-01',
    'Sảnh Tòa Nhà - Trạm 01',
    '$2a$10$dummyHashForKioskSecretTokenVerificationNotRequiredInDevMode001',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE 
SET is_active = TRUE, 
    location_name = EXCLUDED.location_name;

-- 2. Khởi tạo Ca làm việc hành chính chuẩn (08:00 - 17:00, ân hạn 15 phút)
INSERT INTO shifts (shift_code, shift_name, start_time, end_time, grace_period_minutes, is_active, created_at)
VALUES (
    'CA-HANH-CHINH',
    'Ca Hành Chính Chuẩn',
    '08:00:00',
    '17:00:00',
    15,
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT (shift_code) DO UPDATE 
SET is_active = TRUE,
    grace_period_minutes = 15;

-- 3. Khởi tạo Nhân viên mẫu kiểm thử E2E (Mã NV-001, Pass Admin@123, PIN 123456)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (
    employee_code,
    full_name,
    email,
    password_hash,
    role,
    status,
    department,
    pin_hash,
    created_at,
    updated_at
)
VALUES (
    'NV-001',
    'Nguyễn Văn A',
    'nguyenvana@fas.local',
    crypt('Admin@123', gen_salt('bf', 10)),
    'EMPLOYEE',
    'ACTIVE',
    'Phòng Kỹ thuật & Tích hợp',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO.N4/R1L1XkF7k.YQ2d6I2rB9d1w1v3.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (employee_code) DO UPDATE
SET status = 'ACTIVE',
    password_hash = EXCLUDED.password_hash,
    pin_hash = EXCLUDED.pin_hash,
    full_name = EXCLUDED.full_name;

-- Đảm bảo tài khoản quản trị ban đầu có mật khẩu khớp cấu hình Admin@123456
UPDATE users 
SET password_hash = crypt('Admin@123456', gen_salt('bf', 10))
WHERE email = 'admin@fas.com';

-- 4. Gán ca làm việc CA-HANH-CHINH cho nhân viên NV-001
DO $$
DECLARE
    v_user_id BIGINT;
    v_shift_id BIGINT;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE employee_code = 'NV-001';
    SELECT id INTO v_shift_id FROM shifts WHERE shift_code = 'CA-HANH-CHINH';

    IF v_user_id IS NOT NULL AND v_shift_id IS NOT NULL THEN
        -- Xóa phân ca cũ của NV-001 nếu có để tránh chồng lấn
        DELETE FROM employee_shifts WHERE user_id = v_user_id;

        -- Thêm phân ca mới từ đầu năm đến cuối năm 2026
        INSERT INTO employee_shifts (user_id, shift_id, effective_from, effective_to, created_at)
        VALUES (v_user_id, v_shift_id, '2026-01-01', '2026-12-31', CURRENT_TIMESTAMP);
    END IF;
END $$;
