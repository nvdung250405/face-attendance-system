-- ==============================================================================
-- Kịch bản Nạp Dữ liệu Mẫu Toàn Diện cho Hệ Thống (Comprehensive Demo & E2E Seed)
-- Phân hệ: Backend Service + Web Portal + Kiosk Edge Desktop
-- Mục đích: Khởi tạo đầy đủ dữ liệu thực tế cho mọi phân hệ (Users, Kiosks, Shifts,
--          Biometric Templates, Attendance Logs, Excuse Requests, Payroll, Audit Logs)
-- Cách dùng: .\scripts\manage-services.ps1 seed
--         hoặc: docker exec -i fas-postgres psql -U fas_admin -d fas_db < scripts/seed-e2e-data.sql
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 1. TRẠM KIOSK ĐIỂM DANH (KIOSKS)
-- ==============================================================================
INSERT INTO kiosks (id, location_name, secret_token_hash, is_active, last_ping_at, created_at)
VALUES 
    (
        'KIOSK-LOBBY-01',
        'Sảnh Chính Tòa Nhà A - Cửa Vào 01',
        crypt('kiosk-secret-lobby-01', gen_salt('bf', 10)),
        TRUE,
        CURRENT_TIMESTAMP - INTERVAL '30 seconds',
        CURRENT_TIMESTAMP - INTERVAL '60 days'
    ),
    (
        'KIOSK-LOBBY-02',
        'Cổng Phụ Tòa Nhà B - Cửa Vào 02',
        crypt('kiosk-secret-lobby-02', gen_salt('bf', 10)),
        TRUE,
        CURRENT_TIMESTAMP - INTERVAL '7 minutes',
        CURRENT_TIMESTAMP - INTERVAL '45 days'
    ),
    (
        'KIOSK-GATE-01',
        'Cổng Bảo Vệ - Khu Nhà Máy & Sản Xuất',
        crypt('kiosk-secret-gate-01', gen_salt('bf', 10)),
        TRUE,
        CURRENT_TIMESTAMP - INTERVAL '1 minute',
        CURRENT_TIMESTAMP - INTERVAL '30 days'
    ),
    (
        'KIOSK-WAREHOUSE',
        'Cửa Nhập Hàng - Khu Kho Vận',
        crypt('kiosk-secret-warehouse', gen_salt('bf', 10)),
        FALSE,
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        CURRENT_TIMESTAMP - INTERVAL '20 days'
    )
ON CONFLICT (id) DO UPDATE
SET location_name = EXCLUDED.location_name,
    is_active = EXCLUDED.is_active,
    last_ping_at = EXCLUDED.last_ping_at;


-- ==============================================================================
-- 2. CA LÀM VIỆC DOANH NGHIỆP (SHIFTS)
-- ==============================================================================
INSERT INTO shifts (shift_code, shift_name, start_time, end_time, grace_period_minutes, is_active, created_at)
VALUES
    ('CA-HANH-CHINH', 'Ca Hành Chính Văn Phòng', '08:00:00', '17:00:00', 15, TRUE, CURRENT_TIMESTAMP - INTERVAL '90 days'),
    ('CA-SANG',       'Ca Sáng Sản Xuất',        '06:00:00', '14:00:00', 15, TRUE, CURRENT_TIMESTAMP - INTERVAL '90 days'),
    ('CA-CHIEU',      'Ca Chiều Sản Xuất',       '14:00:00', '22:00:00', 15, TRUE, CURRENT_TIMESTAMP - INTERVAL '90 days'),
    ('CA-DEM',        'Ca Đêm Nhà Xưởng',        '22:00:00', '06:00:00', 15, TRUE, CURRENT_TIMESTAMP - INTERVAL '90 days')
ON CONFLICT (shift_code) DO UPDATE
SET shift_name = EXCLUDED.shift_name,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    grace_period_minutes = EXCLUDED.grace_period_minutes,
    is_active = EXCLUDED.is_active;


-- ==============================================================================
-- 3. TÀI KHOẢN NGƯỜI DÙNG & NHÂN SỰ (USERS)
-- Cập nhật tài khoản Admin gốc trước
-- ==============================================================================
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
    'ADMIN-001',
    'Administrator Hệ Thống',
    'admin@fas.com',
    crypt('Admin@123456', gen_salt('bf', 10)),
    'ADMIN',
    'ACTIVE',
    'Ban Quản Trị Hệ Thống',
    crypt('123456', gen_salt('bf', 10)),
    CURRENT_TIMESTAMP - INTERVAL '120 days',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET employee_code = 'ADMIN-001',
    full_name = 'Administrator Hệ Thống',
    password_hash = crypt('Admin@123456', gen_salt('bf', 10)),
    pin_hash = crypt('123456', gen_salt('bf', 10)),
    role = 'ADMIN',
    status = 'ACTIVE',
    department = 'Ban Quản Trị Hệ Thống',
    updated_at = CURRENT_TIMESTAMP;

-- Chèn hoặc cập nhật các tài khoản nhân sự khác
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
VALUES
    -- Quản trị Nhân sự (HR Manager)
    (
        'NV-HR01',
        'Trần Thị Bích',
        'hr@fas.com',
        crypt('Hr@123456', gen_salt('bf', 10)),
        'HR_MANAGER',
        'ACTIVE',
        'Phòng Nhân sự & Đào tạo',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '100 days',
        CURRENT_TIMESTAMP
    ),
    -- Cán bộ Bảo vệ Dữ liệu Cá nhân (DPO)
    (
        'NV-DPO01',
        'Lê Văn Dũng',
        'dpo@fas.com',
        crypt('Dpo@123456', gen_salt('bf', 10)),
        'DPO',
        'ACTIVE',
        'Ban Pháp chế & Bảo mật',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '90 days',
        CURRENT_TIMESTAMP
    ),
    -- Danh sách Nhân viên (EMPLOYEE)
    (
        'NV-001',
        'Nguyễn Văn A',
        'nguyenvana@fas.local',
        crypt('Admin@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kỹ thuật & Tích hợp',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '90 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-002',
        'Trần Thị Mai',
        'tranthimai@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kỹ thuật & Tích hợp',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '80 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-003',
        'Lê Hoàng Nam',
        'lehoangnam@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kinh doanh & Khách hàng',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '75 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-004',
        'Phạm Quỳnh Nga',
        'phamquynhnga@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kế toán - Tài chính',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '70 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-005',
        'Đỗ Minh Trí',
        'dominhtri@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kỹ thuật & Tích hợp',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '60 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-006',
        'Vũ Hải Đăng',
        'vuhaidang@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kho vận & Logistics',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '55 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-007',
        'Hoàng Bích Ngọc',
        'hoangbichngoc@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Nhân sự & Đào tạo',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '50 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-008',
        'Bùi Tuấn Anh',
        'buituananh@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kinh doanh & Khách hàng',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '40 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-009',
        'Ngô Thu Thảo',
        'ngothuthao@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kế toán - Tài chính',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '35 days',
        CURRENT_TIMESTAMP
    ),
    (
        'NV-010',
        'Đinh Quốc Huy',
        'dinhquochuy@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Phòng Kho vận & Logistics',
        crypt('123456', gen_salt('bf', 10)),
        CURRENT_TIMESTAMP - INTERVAL '30 days',
        CURRENT_TIMESTAMP
    ),
    -- Nhân viên mới chưa hoàn tất cam kết sinh trắc (PENDING_CONSENT)
    (
        'NV-011',
        'Triệu Lan Anh',
        'trieulananh@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'PENDING_CONSENT',
        'Phòng Kỹ thuật & Tích hợp',
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        CURRENT_TIMESTAMP
    ),
    -- Nhân viên tạm đình chỉ (SUSPENDED)
    (
        'NV-012',
        'Phan Thanh Tùng',
        'phanthantung@fas.local',
        crypt('Nhanvien@123', gen_salt('bf', 10)),
        'EMPLOYEE',
        'SUSPENDED',
        'Phòng Kinh doanh & Khách hàng',
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '45 days',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (employee_code) DO UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    department = EXCLUDED.department,
    pin_hash = EXCLUDED.pin_hash,
    updated_at = CURRENT_TIMESTAMP;


-- ==============================================================================
-- 4. PHÂN CÔNG CA LÀM VIỆC (EMPLOYEE_SHIFTS)
-- ==============================================================================
DO $$
DECLARE
    v_shift_hc BIGINT;
    v_shift_sang BIGINT;
    v_shift_chieu BIGINT;
    r RECORD;
BEGIN
    SELECT id INTO v_shift_hc FROM shifts WHERE shift_code = 'CA-HANH-CHINH';
    SELECT id INTO v_shift_sang FROM shifts WHERE shift_code = 'CA-SANG';
    SELECT id INTO v_shift_chieu FROM shifts WHERE shift_code = 'CA-CHIEU';

    -- Xóa phân ca cũ của danh sách nhân sự mẫu để gán lại sạch sẽ
    DELETE FROM employee_shifts;

    FOR r IN SELECT id, employee_code, department FROM users WHERE status != 'TERMINATED'
    LOOP
        -- Nhân viên kho vận và sản xuất gán ca sáng/chiều
        IF r.department = 'Phòng Kho vận & Logistics' THEN
            IF r.employee_code IN ('NV-006') THEN
                INSERT INTO employee_shifts (user_id, shift_id, effective_from, effective_to)
                VALUES (r.id, v_shift_sang, '2026-01-01', '2026-12-31');
            ELSE
                INSERT INTO employee_shifts (user_id, shift_id, effective_from, effective_to)
                VALUES (r.id, v_shift_chieu, '2026-01-01', '2026-12-31');
            END IF;
        ELSE
            -- Các nhân viên văn phòng, HR, Kỹ thuật, Kế toán, Quản trị gán ca hành chính
            INSERT INTO employee_shifts (user_id, shift_id, effective_from, effective_to)
            VALUES (r.id, v_shift_hc, '2026-01-01', '2026-12-31');
        END IF;
    END LOOP;
END $$;


-- ==============================================================================
-- 5. THỎA THUẬN INFORMED CONSENT & PHIÊN ĐĂNG KÝ (ENROLLMENT_SESSIONS)
-- Tạo vết đồng thuận hợp pháp theo Nghị định 13/2023/NĐ-CP cho các nhân viên ACTIVE
-- ==============================================================================
DELETE FROM enrollment_sessions;

INSERT INTO enrollment_sessions (
    user_id,
    otp_hash,
    consent_version,
    consent_signed_at,
    client_ip,
    expires_at,
    is_used,
    created_at
)
SELECT 
    u.id,
    crypt('123456', gen_salt('bf', 10)),
    'v1.0-ND13',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    '192.168.1.105',
    CURRENT_TIMESTAMP + INTERVAL '365 days',
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
FROM users u
WHERE u.employee_code IN ('NV-001', 'NV-002', 'NV-003', 'NV-004', 'NV-005', 'NV-006', 'NV-007', 'NV-008', 'NV-009', 'NV-010', 'NV-HR01', 'ADMIN-001');


-- ==============================================================================
-- 6. MẪU SINH TRẮC HỌC KHUÔN MẶT ARCFACE (BIOMETRIC_TEMPLATES)
-- Giả lập vector 512 chiều mã hóa AES-256-GCM để Kiosk có thể đồng bộ gallery và
-- API /auth/me nhận diện được cờ hasBiometric = TRUE
-- ==============================================================================
DELETE FROM biometric_templates;

INSERT INTO biometric_templates (
    user_id,
    encrypted_vector,
    encryption_iv,
    algorithm,
    version,
    is_active,
    created_at
)
SELECT 
    u.id,
    decode(repeat('0123456789abcdef', 32), 'hex'), -- Giả lập 256 bytes payload
    decode('abcdef0123456789abcdef01', 'hex'),     -- 12 bytes GCM IV
    'ARCFACE_512D',
    1,
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
FROM users u
WHERE u.employee_code IN ('NV-001', 'NV-002', 'NV-003', 'NV-004', 'NV-005', 'NV-006', 'NV-007', 'NV-008', 'NV-009', 'NV-010', 'NV-HR01');


-- ==============================================================================
-- 7. DỮ LIỆU ĐIỂM DANH THỜI GIAN THỰC (ATTENDANCE_LOGS)
-- Gồm:
--   - Hôm nay: Điểm danh buổi sáng (Check-in đúng giờ, đi muộn, vắng mặt) để test KPI
--   - 5 ngày trước: Đầy đủ Check-in và Check-out để xem lịch sử, phân trang & xuất Excel
-- ==============================================================================
DELETE FROM attendance_logs;

DO $$
DECLARE
    v_u1 BIGINT; v_u2 BIGINT; v_u3 BIGINT; v_u4 BIGINT; v_u5 BIGINT;
    v_u6 BIGINT; v_u7 BIGINT; v_u8 BIGINT; v_u9 BIGINT; v_u10 BIGINT;
    v_today_date DATE := CURRENT_DATE;
BEGIN
    SELECT id INTO v_u1 FROM users WHERE employee_code = 'NV-001';
    SELECT id INTO v_u2 FROM users WHERE employee_code = 'NV-002';
    SELECT id INTO v_u3 FROM users WHERE employee_code = 'NV-003';
    SELECT id INTO v_u4 FROM users WHERE employee_code = 'NV-004';
    SELECT id INTO v_u5 FROM users WHERE employee_code = 'NV-005';
    SELECT id INTO v_u6 FROM users WHERE employee_code = 'NV-006';
    SELECT id INTO v_u7 FROM users WHERE employee_code = 'NV-007';
    SELECT id INTO v_u8 FROM users WHERE employee_code = 'NV-008';
    SELECT id INTO v_u9 FROM users WHERE employee_code = 'NV-009';
    SELECT id INTO v_u10 FROM users WHERE employee_code = 'NV-010';

    -- --------------------------------------------------------------------------
    -- 7.1. ĐIỂM DANH HÔM NAY (CURRENT_DATE)
    -- Thống kê dự kiến:
    --   - Tổng nhân viên ca hôm nay: 10
    --   - Có mặt (presentCount): 8
    --   - Đúng giờ (onTimeCount): 5 (NV-001, NV-003, NV-004, NV-006, NV-007)
    --   - Đi muộn (lateCount): 3 (NV-002, NV-005, NV-008)
    --   - Vắng mặt (absentCount): 2 (NV-009 chưa check-in, NV-010 ca chiều chưa đến)
    -- --------------------------------------------------------------------------

    -- NV-001: Đúng giờ tuyệt đối (07:55:12) bằng khuôn mặt
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u1, (v_today_date + TIME '07:55:12')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9650, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE);

    -- NV-002: Đi muộn 22 phút (08:22:30) bằng khuôn mặt
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u2, (v_today_date + TIME '08:22:30')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9320, 'KIOSK-LOBBY-01', 'LATE', 22, FALSE);

    -- NV-003: Đúng giờ (07:58:05) bằng mã PIN dự phòng khẩn cấp
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u3, (v_today_date + TIME '07:58:05')::timestamptz, 'CHECK_IN', 'FALLBACK_PIN', 1.0000, 'KIOSK-LOBBY-02', 'ON_TIME', 0, FALSE);

    -- NV-004: Đúng giờ trong thời gian ân hạn 15 phút (08:08:40)
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u4, (v_today_date + TIME '08:08:40')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9120, 'KIOSK-LOBBY-01', 'ON_TIME', 8, FALSE);

    -- NV-005: Đi muộn 40 phút (08:40:15)
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u5, (v_today_date + TIME '08:40:15')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.8840, 'KIOSK-LOBBY-01', 'LATE', 40, FALSE);

    -- NV-006: Ca sáng kho vận, đúng giờ (05:52:10) kèm đồng bộ bù ngoại tuyến (offline sync)
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u6, (v_today_date + TIME '05:52:10')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9780, 'KIOSK-GATE-01', 'ON_TIME', 0, TRUE);

    -- NV-006: Check-out hết ca sáng (14:05:00)
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u6, (v_today_date + TIME '14:05:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.9810, 'KIOSK-GATE-01', 'ON_TIME', 0, FALSE);

    -- NV-007: Đúng giờ (07:48:22)
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u7, (v_today_date + TIME '07:48:22')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9450, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE);

    -- NV-008: Đi muộn 18 phút (08:18:00)
    INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
    VALUES (v_u8, (v_today_date + TIME '08:18:00')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9250, 'KIOSK-LOBBY-02', 'LATE', 18, FALSE);

    -- --------------------------------------------------------------------------
    -- 7.2. ĐIỂM DANH 4 NGÀY TRƯỚC ĐÓ (LỊCH SỬ TUẦN)
    -- Giúp bảng tra cứu điểm danh và báo cáo thống kê đầy đủ dữ liệu phong phú
    -- --------------------------------------------------------------------------
    FOR d IN 1..4 LOOP
        -- Check-in sáng
        INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
        VALUES 
            (v_u1, ((v_today_date - d) + TIME '07:52:00')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9610, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE),
            (v_u2, ((v_today_date - d) + TIME '07:56:00')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9420, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE),
            (v_u3, ((v_today_date - d) + TIME '08:10:00')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9200, 'KIOSK-LOBBY-02', 'ON_TIME', 10, FALSE),
            (v_u4, ((v_today_date - d) + TIME '07:45:00')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9530, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE),
            (v_u5, ((v_today_date - d) + TIME '08:25:00')::timestamptz, 'CHECK_IN', 'FALLBACK_PIN', 1.0000, 'KIOSK-LOBBY-01', 'LATE', 25, FALSE),
            (v_u7, ((v_today_date - d) + TIME '07:59:00')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9380, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE),
            (v_u8, ((v_today_date - d) + TIME '07:50:00')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9460, 'KIOSK-LOBBY-02', 'ON_TIME', 0, FALSE),
            (v_u9, ((v_today_date - d) + TIME '07:42:00')::timestamptz, 'CHECK_IN', 'FACE_MATCH', 0.9670, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE);

        -- Check-out chiều
        INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync)
        VALUES 
            (v_u1, ((v_today_date - d) + TIME '17:05:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.9700, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE),
            (v_u2, ((v_today_date - d) + TIME '17:02:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.9510, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE),
            (v_u3, ((v_today_date - d) + TIME '17:15:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.9340, 'KIOSK-LOBBY-02', 'ON_TIME', 0, FALSE),
            (v_u4, ((v_today_date - d) + TIME '17:01:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.9600, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE),
            (v_u5, ((v_today_date - d) + TIME '17:30:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.8920, 'KIOSK-LOBBY-01', 'OVERTIME', 0, FALSE),
            (v_u7, ((v_today_date - d) + TIME '17:08:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.9410, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE),
            (v_u8, ((v_today_date - d) + TIME '17:10:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.9500, 'KIOSK-LOBBY-02', 'ON_TIME', 0, FALSE),
            (v_u9, ((v_today_date - d) + TIME '17:00:00')::timestamptz, 'CHECK_OUT', 'FACE_MATCH', 0.9650, 'KIOSK-LOBBY-01', 'ON_TIME', 0, FALSE);
    END LOOP;
END $$;


-- ==============================================================================
-- 8. ĐƠN GIẢI TRÌNH ĐIỂM DANH (EXCUSE_REQUESTS)
-- Cung cấp sẵn các trường hợp PENDING, APPROVED, REJECTED để kiểm thử giao diện HR
-- ==============================================================================
DELETE FROM excuse_requests;

DO $$
DECLARE
    v_u2 BIGINT; v_u5 BIGINT; v_u8 BIGINT; v_admin BIGINT; v_hr BIGINT;
    v_log_id BIGINT;
BEGIN
    SELECT id INTO v_u2 FROM users WHERE employee_code = 'NV-002';
    SELECT id INTO v_u5 FROM users WHERE employee_code = 'NV-005';
    SELECT id INTO v_u8 FROM users WHERE employee_code = 'NV-008';
    SELECT id INTO v_admin FROM users WHERE email = 'admin@fas.com';
    SELECT id INTO v_hr FROM users WHERE email = 'hr@fas.com';

    -- Đơn 1: Chờ duyệt (PENDING) - NV-002 đi muộn hôm nay xin giải trình vì kẹt xe
    SELECT id INTO v_log_id FROM attendance_logs WHERE user_id = v_u2 AND status = 'LATE' ORDER BY punch_timestamp DESC LIMIT 1;
    INSERT INTO excuse_requests (user_id, attendance_log_id, reason, requested_punch_timestamp, status, created_at)
    VALUES (
        v_u2,
        v_log_id,
        'Ngập úng đường ngã tư Hàng Xanh do mưa to lúc 7h45, xe chết máy vào muộn. Kính mong HR xem xét tính công đúng giờ.',
        (CURRENT_DATE + TIME '08:00:00')::timestamptz,
        'PENDING',
        CURRENT_TIMESTAMP - INTERVAL '2 hours'
    );

    -- Đơn 2: Đã phê duyệt (APPROVED) - NV-005 đi hỗ trợ khách hàng sáng hôm qua
    SELECT id INTO v_log_id FROM attendance_logs WHERE user_id = v_u5 AND status = 'LATE' ORDER BY punch_timestamp DESC LIMIT 1;
    INSERT INTO excuse_requests (user_id, attendance_log_id, reason, requested_punch_timestamp, status, decided_by, decided_at, created_at)
    VALUES (
        v_u5,
        v_log_id,
        'Đi hỗ trợ kỹ thuật khắc phục sự cố tại trạm Kiosk chi nhánh khách hàng theo yêu cầu khẩn của phòng kỹ thuật.',
        (CURRENT_DATE - INTERVAL '1 day' + TIME '08:00:00')::timestamptz,
        'APPROVED',
        v_hr,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP - INTERVAL '1 day 4 hours'
    );

    -- Đơn 3: Bị từ chối (REJECTED) - NV-008 quên chấm công
    INSERT INTO excuse_requests (user_id, attendance_log_id, reason, requested_punch_timestamp, status, decided_by, decided_at, rejection_reason, created_at)
    VALUES (
        v_u8,
        NULL,
        'Quên quẹt mặt lúc vào ca sáng do vội vào họp phòng ban.',
        (CURRENT_DATE - INTERVAL '2 days' + TIME '08:00:00')::timestamptz,
        'REJECTED',
        v_hr,
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        'Lý do cá nhân không đủ căn cứ minh chứng theo quy chế kỷ luật lao động công ty.',
        CURRENT_TIMESTAMP - INTERVAL '2 days 3 hours'
    );
END $$;


-- ==============================================================================
-- 9. KỲ CÔNG THEO THÁNG (PAYROLL_PERIODS)
-- Tháng 8, 9/2026 đã khóa (LOCKED), Tháng 10/2026 đang mở (OPEN)
-- ==============================================================================
INSERT INTO payroll_periods (period_year, period_month, status, locked_by, locked_at, created_at)
SELECT 
    2026, 8, 'LOCKED', u.id, (TIMESTAMP '2026-09-02 18:00:00')::timestamptz, (TIMESTAMP '2026-08-01 00:00:00')::timestamptz
FROM users u WHERE u.email = 'admin@fas.com'
ON CONFLICT (period_year, period_month) DO UPDATE
SET status = 'LOCKED';

INSERT INTO payroll_periods (period_year, period_month, status, locked_by, locked_at, created_at)
SELECT 
    2026, 9, 'LOCKED', u.id, (TIMESTAMP '2026-10-02 18:00:00')::timestamptz, (TIMESTAMP '2026-09-01 00:00:00')::timestamptz
FROM users u WHERE u.email = 'admin@fas.com'
ON CONFLICT (period_year, period_month) DO UPDATE
SET status = 'LOCKED';

INSERT INTO payroll_periods (period_year, period_month, status, created_at)
VALUES (2026, 10, 'OPEN', (TIMESTAMP '2026-10-01 00:00:00')::timestamptz)
ON CONFLICT (period_year, period_month) DO UPDATE
SET status = 'OPEN';


-- ==============================================================================
-- 10. NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT_LOGS)
-- Lưu trữ lịch sử hành động bất biến phục vụ thanh tra và báo cáo DPO/Admin
-- ==============================================================================
DELETE FROM audit_logs;

DO $$
DECLARE
    v_admin_id BIGINT;
    v_hr_id BIGINT;
    v_u1_id BIGINT;
BEGIN
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@fas.com';
    SELECT id INTO v_hr_id FROM users WHERE email = 'hr@fas.com';
    SELECT id INTO v_u1_id FROM users WHERE employee_code = 'NV-001';

    INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, before_state, after_state, ip_address, created_at)
    VALUES
        (
            v_admin_id,
            'admin@fas.com',
            'USER_LOGIN',
            'AUTHENTICATION',
            v_admin_id::text,
            NULL,
            '{"status": "SUCCESS", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}'::jsonb,
            '192.168.1.50',
            CURRENT_TIMESTAMP - INTERVAL '4 hours'
        ),
        (
            v_admin_id,
            'admin@fas.com',
            'LOCK_PAYROLL_PERIOD',
            'PAYROLL_PERIOD',
            '2026-09',
            '{"status": "OPEN"}'::jsonb,
            '{"status": "LOCKED", "period": "2026-09"}'::jsonb,
            '192.168.1.50',
            CURRENT_TIMESTAMP - INTERVAL '15 days'
        ),
        (
            v_hr_id,
            'hr@fas.com',
            'EXCUSE_REQUEST_DECIDED',
            'EXCUSE_REQUEST',
            '2',
            '{"status": "PENDING"}'::jsonb,
            '{"status": "APPROVED", "decidedBy": "hr@fas.com"}'::jsonb,
            '192.168.1.62',
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        ),
        (
            v_u1_id,
            'nguyenvana@fas.local',
            'ENROLL_BIOMETRIC',
            'BIOMETRIC_TEMPLATE',
            v_u1_id::text,
            NULL,
            '{"algorithm": "ARCFACE_512D", "version": 1, "kioskId": "KIOSK-LOBBY-01"}'::jsonb,
            '192.168.1.105',
            CURRENT_TIMESTAMP - INTERVAL '30 days'
        ),
        (
            v_hr_id,
            'hr@fas.com',
            'EXPORT_ATTENDANCE_REPORT',
            'REPORT',
            'EXPORT-202610',
            NULL,
            '{"format": "XLSX", "recordCount": 142}'::jsonb,
            '192.168.1.62',
            CURRENT_TIMESTAMP - INTERVAL '3 days'
        );
END $$;


-- ==============================================================================
-- 11. THÔNG BÁO TRONG ỨNG DỤNG (NOTIFICATIONS)
-- Cung cấp thông báo thực tế cho Web Portal (chuông thông báo Header)
-- ==============================================================================
DELETE FROM notifications;

DO $$
DECLARE
    v_u1 BIGINT; v_u2 BIGINT; v_u5 BIGINT;
BEGIN
    SELECT id INTO v_u1 FROM users WHERE employee_code = 'NV-001';
    SELECT id INTO v_u2 FROM users WHERE employee_code = 'NV-002';
    SELECT id INTO v_u5 FROM users WHERE employee_code = 'NV-005';

    INSERT INTO notifications (user_id, event_type, title, body, reference_type, reference_id, read_at, created_at)
    VALUES
        (
            v_u1,
            'ACCOUNT_CREATED',
            'Chào mừng bạn đến với Hệ thống Điểm danh FAS',
            'Tài khoản của bạn đã được kích hoạt thành công. Vui lòng tiến hành đăng ký khuôn mặt tại Kiosk sảnh gần nhất.',
            'USER',
            v_u1::text,
            CURRENT_TIMESTAMP - INTERVAL '25 days',
            CURRENT_TIMESTAMP - INTERVAL '30 days'
        ),
        (
            v_u2,
            'PIN_LOCKED',
            'Cảnh báo nhập sai mã PIN khẩn cấp',
            'Mã PIN của bạn đã bị khóa tạm thời 15 phút do nhập sai quá 5 lần liên tiếp tại trạm Kiosk.',
            'SECURITY',
            'PIN_ALERT',
            NULL,
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        ),
        (
            v_u5,
            'EXCUSE_REQUEST_DECIDED',
            'Đơn giải trình điểm danh đã được duyệt',
            'Đơn giải trình ngày hôm qua của bạn đã được Phòng Nhân sự phê duyệt thành công.',
            'EXCUSE_REQUEST',
            '2',
            NULL,
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        );
END $$;


-- ==============================================================================
-- 12. YÊU CẦU CHỦ THỂ DỮ LIỆU CÁ NHÂN (DATA_SUBJECT_REQUESTS)
-- Dành cho phân hệ DPO kiểm thử quyền riêng tư theo NĐ 13/2023
-- ==============================================================================
DELETE FROM data_subject_requests;

DO $$
DECLARE
    v_u3 BIGINT; v_u7 BIGINT; v_dpo BIGINT;
BEGIN
    SELECT id INTO v_u3 FROM users WHERE employee_code = 'NV-003';
    SELECT id INTO v_u7 FROM users WHERE employee_code = 'NV-007';
    SELECT id INTO v_dpo FROM users WHERE email = 'dpo@fas.com';

    INSERT INTO data_subject_requests (user_id, request_type, detail, status, handled_by, response, responded_at, created_at)
    VALUES
        (
            v_u3,
            'ACCESS',
            'Kính gửi Cán bộ Bảo vệ Dữ liệu: Tôi muốn trích xuất toàn bộ lịch sử điểm danh và dữ liệu mẫu nhận diện khuôn mặt cá nhân đã lưu trữ.',
            'IN_PROGRESS',
            v_dpo,
            'Đã tiếp nhận yêu cầu, đang thực hiện tổng hợp báo cáo kiểm toán dữ liệu cá nhân theo quy định.',
            CURRENT_TIMESTAMP - INTERVAL '1 day',
            CURRENT_TIMESTAMP - INTERVAL '3 days'
        ),
        (
            v_u7,
            'CORRECTION',
            'Yêu cầu cập nhật lại thông tin số điện thoại liên lạc nội bộ và đính chính phòng ban trực thuộc.',
            'FULFILLED',
            v_dpo,
            'Hồ sơ nhân sự và phân ca làm việc đã được cập nhật chính xác theo dữ liệu mới.',
            CURRENT_TIMESTAMP - INTERVAL '10 days',
            CURRENT_TIMESTAMP - INTERVAL '12 days'
        );
END $$;

COMMIT;
