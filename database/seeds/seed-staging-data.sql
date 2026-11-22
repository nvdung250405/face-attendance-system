-- ==============================================================================
-- Kịch bản Nạp Dữ Liệu Mẫu Cho Môi Trường STAGING (Pre-production / UAT Seed)
-- Vị trí: database/seeds/seed-staging-data.sql
-- Áp dụng cho: fas-postgres (môi trường Staging, Docker Compose Staging)
--
-- Đặc điểm dữ liệu Staging:
-- 1. Mô phỏng cơ cấu tổ chức doanh nghiệp thực tế (5 Khối/Phòng ban chuẩn).
-- 2. Đầy đủ các vai trò RBAC: ADMIN, HR, LEAD, EMPLOYEE.
-- 3. Phủ kín các trạng thái nhân sự: ACTIVE (3 tư thế ArcFace, bao gồm nhân sự rút consent chuyển sang dùng PIN),
--    PENDING_CONSENT, và TERMINATED.
-- 4. 4 Trạm Kiosk phân bổ theo địa bàn thực tế (Hà Nội, TP.HCM, Bắc Ninh).
-- 5. Lịch sử chấm công đa dạng (Đúng giờ, Đi muộn, Về sớm, Offline sync, PIN fallback).
-- 6. Dữ liệu giải trình công (PENDING, APPROVED, REJECTED) để test quy trình duyệt.
-- 7. Kỳ công tháng (LOCKED tháng trước, OPEN tháng này).
--
-- Mật khẩu mặc định toàn bộ tài khoản Staging: Staging@FAS2026!
-- Mã PIN Kiosk mặc định: 123456
-- Lệnh nạp:
--   docker exec -i fas-postgres-staging psql -U fas_staging_admin -d fas_staging_db < database/seeds/seed-staging-data.sql
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 1. TRẠM KIOSK ĐIỂM DANH STAGING (KIOSKS)
-- ==============================================================================
INSERT INTO kiosks (id, location_name, secret_token_hash, is_active, last_ping_at, created_at)
VALUES 
    (
        'KIOSK-HN-HQ-01',
        'Sảnh Tầng 1 - Tòa Nhà Trụ Sở Hà Nội (Cửa Chính)',
        crypt('staging-kiosk-token-hn01', gen_salt('bf', 10)),
        TRUE,
        CURRENT_TIMESTAMP - INTERVAL '15 seconds',
        CURRENT_TIMESTAMP - INTERVAL '60 days'
    ),
    (
        'KIOSK-HN-HQ-02',
        'Tầng 5 - Khối Kỹ Thuật & Công Nghệ (Hà Nội)',
        crypt('staging-kiosk-token-hn02', gen_salt('bf', 10)),
        TRUE,
        CURRENT_TIMESTAMP - INTERVAL '45 seconds',
        CURRENT_TIMESTAMP - INTERVAL '60 days'
    ),
    (
        'KIOSK-HCM-BRANCH',
        'Chi Nhánh TP. Hồ Chí Minh - Tòa Nhà Bitexco Tầng 12',
        crypt('staging-kiosk-token-hcm', gen_salt('bf', 10)),
        TRUE,
        CURRENT_TIMESTAMP - INTERVAL '2 minutes',
        CURRENT_TIMESTAMP - INTERVAL '45 days'
    ),
    (
        'KIOSK-FACTORY-BN',
        'Nhà Máy Sản Xuất & Lắp Ráp - KCN Yên Phong Bắc Ninh',
        crypt('staging-kiosk-token-bn', gen_salt('bf', 10)),
        TRUE,
        CURRENT_TIMESTAMP - INTERVAL '5 minutes',
        CURRENT_TIMESTAMP - INTERVAL '30 days'
    ),
    (
        'KIOSK-WAREHOUSE-BAK',
        'Cổng Kiểm Soát Kho Vận - Trạm Dự Phòng (Tạm đóng)',
        crypt('staging-kiosk-token-wh', gen_salt('bf', 10)),
        FALSE,
        CURRENT_TIMESTAMP - INTERVAL '5 days',
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
    ('SHIFT-OFFICE', 'Ca Hành Chính Văn Phòng (08:30 - 17:30)', '08:30:00', '17:30:00', 15, TRUE, CURRENT_TIMESTAMP - INTERVAL '180 days'),
    ('SHIFT-MORNING', 'Ca Sáng Sản Xuất (06:00 - 14:00)', '06:00:00', '14:00:00', 10, TRUE, CURRENT_TIMESTAMP - INTERVAL '180 days'),
    ('SHIFT-AFTERNOON', 'Ca Chiều Sản Xuất (14:00 - 22:00)', '14:00:00', '22:00:00', 10, TRUE, CURRENT_TIMESTAMP - INTERVAL '180 days'),
    ('SHIFT-NIGHT', 'Ca Đêm Vận Hành (22:00 - 06:00)', '22:00:00', '06:00:00', 10, TRUE, CURRENT_TIMESTAMP - INTERVAL '180 days'),
    ('SHIFT-FLEXI', 'Ca Linh Hoạt Khối Kỹ Thuật (09:00 - 18:00)', '09:00:00', '18:00:00', 30, TRUE, CURRENT_TIMESTAMP - INTERVAL '90 days')
ON CONFLICT (shift_code) DO UPDATE
SET shift_name = EXCLUDED.shift_name,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    grace_period_minutes = EXCLUDED.grace_period_minutes,
    is_active = EXCLUDED.is_active;


-- ==============================================================================
-- 3. HỒ SƠ NHÂN SỰ & NGƯỜI DÙNG DOANH NGHIỆP (USERS)
-- Mật khẩu chung: Staging@FAS2026!
-- Mã PIN chung: 123456
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
    pin_failed_attempts,
    terminated_date,
    created_at,
    updated_at
)
VALUES
    -- 3.1. KHỐI QUẢN TRỊ HỆ THỐNG & BẢO VỆ DỮ LIỆU (ADMIN)
    (
        'STG-ADM-001',
        'Nguyễn Thành Nam (Quản Trị Hệ Thống)',
        'staging-admin@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'ADMIN',
        'ACTIVE',
        'Ban Quản Trị Hệ Thống',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '180 days',
        CURRENT_TIMESTAMP
    ),
    (
        'STG-ADM-002',
        'Trần Quốc Bảo (Cán Bộ Bảo Vệ Dữ Liệu DPO)',
        'dpo.officer@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'DPO',
        'ACTIVE',
        'Ban An Toàn & Pháp Chế',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '150 days',
        CURRENT_TIMESTAMP
    ),

    -- 3.2. KHỐI QUẢN TRỊ NHÂN SỰ & TIỀN LƯƠNG (HR_MANAGER)
    (
        'STG-HR-001',
        'Lê Thị Thu Hương (Trưởng Phòng Nhân Sự)',
        'hr.manager@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'HR_MANAGER',
        'ACTIVE',
        'Phòng Quản Trị Nhân Sự',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '150 days',
        CURRENT_TIMESTAMP
    ),
    (
        'STG-HR-002',
        'Phạm Quỳnh Nga (Chuyên Viên C&B Chấm Công)',
        'hr.specialist@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'HR_MANAGER',
        'ACTIVE',
        'Phòng Quản Trị Nhân Sự',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '120 days',
        CURRENT_TIMESTAMP
    ),

    -- 3.3. KHỐI CÔNG NGHỆ THÔNG TIN & PHẦN MỀM (EMPLOYEE)
    (
        'STG-ENG-001',
        'Vũ Hoàng Đăng (Trưởng Nhóm Kỹ Thuật)',
        'tech.lead@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Khối Kỹ Thuật Phần Mềm',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '120 days',
        CURRENT_TIMESTAMP
    ),
    (
        'STG-ENG-002',
        'Đỗ Tuấn An (Kỹ Sư Backend Cấp Cao)',
        'dev.an@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Khối Kỹ Thuật Phần Mềm',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '90 days',
        CURRENT_TIMESTAMP
    ),
    (
        'STG-ENG-003',
        'Hoàng Thúy Bình (Kỹ Sư Kiểm Thử QA)',
        'qa.binh@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Khối Kỹ Thuật Phần Mềm',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '90 days',
        CURRENT_TIMESTAMP
    ),
    (
        'STG-ENG-004',
        'Bùi Quang Hùng (Thực Tập Sinh - Chưa Ký Cam Kết)',
        'intern.hung@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'PENDING_CONSENT',
        'Khối Kỹ Thuật Phần Mềm',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '7 days',
        CURRENT_TIMESTAMP
    ),

    -- 3.4. KHỐI VẬN HÀNH & SẢN XUẤT (EMPLOYEE)
    (
        'STG-OPS-001',
        'Đinh Văn Mạnh (Quản Đốc Phân Xưởng)',
        'ops.lead@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Khối Sản Xuất & Vận Hành',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '150 days',
        CURRENT_TIMESTAMP
    ),
    (
        'STG-OPS-002',
        'Phan Đình Cường (Kỹ Thuật Viên Vận Hành)',
        'worker.cuong@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Khối Sản Xuất & Vận Hành',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '60 days',
        CURRENT_TIMESTAMP
    ),
    (
        'STG-OPS-003',
        'Nguyễn Văn Dũng (Công Nhân - Thường Chấm PIN Dự Phòng)',
        'worker.dung@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Khối Sản Xuất & Vận Hành',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '60 days',
        CURRENT_TIMESTAMP
    ),
    (
        'STG-OPS-004',
        'Vũ Thị Phương Thảo (Nhân Viên Đã Rút Consent Sinh Trắc)',
        'worker.thao@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'ACTIVE',
        'Khối Sản Xuất & Vận Hành',
        crypt('123456', gen_salt('bf', 10)),
        0,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '90 days',
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        'STG-OPS-005',
        'Trần Đình Tuấn (Nhân Viên Đã Thôi Việc)',
        'worker.tuan@fas.company.com',
        crypt('Staging@FAS2026!', gen_salt('bf', 10)),
        'EMPLOYEE',
        'TERMINATED',
        'Khối Sản Xuất & Vận Hành',
        crypt('123456', gen_salt('bf', 10)),
        0,
        CURRENT_DATE - INTERVAL '15 days',
        CURRENT_TIMESTAMP - INTERVAL '120 days',
        CURRENT_TIMESTAMP - INTERVAL '15 days'
    )
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    department = EXCLUDED.department,
    password_hash = EXCLUDED.password_hash,
    pin_hash = EXCLUDED.pin_hash,
    updated_at = CURRENT_TIMESTAMP;


-- ==============================================================================
-- 4. PHÂN CÔNG CA LÀM VIỆC DOANH NGHIỆP (EMPLOYEE_SHIFTS)
-- ==============================================================================
DELETE FROM employee_shifts WHERE user_id IN (SELECT id FROM users WHERE employee_code LIKE 'STG-%');

INSERT INTO employee_shifts (user_id, shift_id, effective_from, effective_to, created_at)
SELECT u.id, s.id, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '180 days', CURRENT_TIMESTAMP
FROM users u, shifts s
WHERE u.employee_code IN ('STG-ADM-001', 'STG-ADM-002', 'STG-HR-001', 'STG-HR-002')
  AND s.shift_code = 'SHIFT-OFFICE';

-- Khối Công nghệ dùng Ca Linh hoạt
INSERT INTO employee_shifts (user_id, shift_id, effective_from, effective_to, created_at)
SELECT u.id, s.id, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '180 days', CURRENT_TIMESTAMP
FROM users u, shifts s
WHERE u.employee_code IN ('STG-ENG-001', 'STG-ENG-002', 'STG-ENG-003', 'STG-ENG-004')
  AND s.shift_code = 'SHIFT-FLEXI';

-- Khối Sản xuất phân ca xoay vòng (Ca Sáng)
INSERT INTO employee_shifts (user_id, shift_id, effective_from, effective_to, created_at)
SELECT u.id, s.id, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '180 days', CURRENT_TIMESTAMP
FROM users u, shifts s
WHERE u.employee_code IN ('STG-OPS-001', 'STG-OPS-002', 'STG-OPS-003', 'STG-OPS-004')
  AND s.shift_code = 'SHIFT-MORNING';


-- ==============================================================================
-- 5. PHIÊN ĐỒNG THUẬN INFORMED CONSENT & MÃ OTP (ENROLLMENT_SESSIONS)
-- Tuân thủ Luật Bảo vệ dữ liệu cá nhân 2025 & Nghị định 13/2023/NĐ-CP
-- ==============================================================================
DELETE FROM enrollment_sessions WHERE user_id IN (SELECT id FROM users WHERE employee_code LIKE 'STG-%');

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
    crypt('889900', gen_salt('bf', 10)),
    'v2.1-2026-STAGING-PDPD',
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    '10.20.30.45',
    CURRENT_TIMESTAMP + INTERVAL '180 days',
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '60 days'
FROM users u
WHERE u.employee_code IN ('STG-ADM-001', 'STG-ADM-002', 'STG-HR-001', 'STG-HR-002', 'STG-ENG-001', 'STG-ENG-002', 'STG-ENG-003', 'STG-OPS-001', 'STG-OPS-002', 'STG-OPS-003');

-- Bản ghi rút đồng thuận cho nhân viên STG-OPS-004
DELETE FROM consent_withdrawals WHERE user_id IN (SELECT id FROM users WHERE employee_code = 'STG-OPS-004');
INSERT INTO consent_withdrawals (
    user_id,
    withdrawn_at,
    client_ip,
    biometric_disposal_due_at,
    processed_at,
    created_at
)
SELECT
    u.id,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    '10.20.30.99',
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM users u
WHERE u.employee_code = 'STG-OPS-004';


-- ==============================================================================
-- 6. MẪU SINH TRẮC HỌC KHUÔN MẶT 3 TƯ THẾ (BIOMETRIC_TEMPLATES)
-- Thuật toán ArcFace 512D, mã hóa AES-256-GCM
-- Tư thế: FRONTAL (Chính diện), LEFT_TILT (Nghiêng trái), RIGHT_TILT (Nghiêng phải)
-- ==============================================================================
DELETE FROM biometric_templates WHERE user_id IN (SELECT id FROM users WHERE employee_code LIKE 'STG-%');

-- Nạp 3 tư thế cho các nhân sự nòng cốt
INSERT INTO biometric_templates (user_id, encrypted_vector, encryption_iv, algorithm, version, is_active, pose_type, created_at)
SELECT 
    u.id,
    decode(repeat('41', 512), 'hex'), -- Vector giả lập 512 bytes
    decode('1a2b3c4d5e6f7a8b9c0d1e2f', 'hex'), -- 12 bytes IV
    'ARCFACE_512D',
    1,
    TRUE,
    p.pose,
    CURRENT_TIMESTAMP - INTERVAL '60 days'
FROM users u
CROSS JOIN (VALUES ('FRONTAL'), ('LEFT_TILT'), ('RIGHT_TILT')) AS p(pose)
WHERE u.employee_code IN ('STG-ADM-001', 'STG-HR-001', 'STG-ENG-001', 'STG-ENG-002', 'STG-ENG-003', 'STG-OPS-001', 'STG-OPS-002', 'STG-OPS-003');


-- ==============================================================================
-- 7. NHẬT KÝ ĐIỂM DANH THỰC TẾ 14 NGÀY QUA (ATTENDANCE_LOGS)
-- ==============================================================================
DELETE FROM attendance_logs WHERE user_id IN (SELECT id FROM users WHERE employee_code LIKE 'STG-%');

-- 7.1. Nhân viên gương mẫu đi làm đúng giờ (STG-ENG-002 - Đỗ Tuấn An)
INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync, created_at)
SELECT 
    u.id,
    (CURRENT_DATE - (d || ' days')::INTERVAL + '08:45:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'CHECK_IN',
    'FACE_MATCH',
    0.9425,
    'KIOSK-HN-HQ-02',
    'ON_TIME',
    0,
    FALSE,
    CURRENT_TIMESTAMP
FROM users u
CROSS JOIN generate_series(1, 14) AS d
WHERE u.employee_code = 'STG-ENG-002'
  AND EXTRACT(DOW FROM (CURRENT_DATE - (d || ' days')::INTERVAL)) NOT IN (0, 6); -- Trừ T7, CN

-- Check-out tương ứng
INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync, created_at)
SELECT 
    u.id,
    (CURRENT_DATE - (d || ' days')::INTERVAL + '18:15:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'CHECK_OUT',
    'FACE_MATCH',
    0.9310,
    'KIOSK-HN-HQ-01',
    'ON_TIME',
    0,
    FALSE,
    CURRENT_TIMESTAMP
FROM users u
CROSS JOIN generate_series(1, 14) AS d
WHERE u.employee_code = 'STG-ENG-002'
  AND EXTRACT(DOW FROM (CURRENT_DATE - (d || ' days')::INTERVAL)) NOT IN (0, 6);

-- 7.2. Nhân viên có ca đi muộn & về sớm (STG-ENG-003 - Hoàng Thúy Bình)
-- Ngày hôm qua: Đi muộn 40 phút (09:40)
INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync, created_at)
SELECT 
    u.id,
    (CURRENT_DATE - INTERVAL '1 day' + '09:40:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'CHECK_IN',
    'FACE_MATCH',
    0.9150,
    'KIOSK-HN-HQ-02',
    'LATE',
    40,
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM users u
WHERE u.employee_code = 'STG-ENG-003';

-- Ngày hôm kia: Về sớm 45 phút (17:15)
INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync, created_at)
SELECT 
    u.id,
    (CURRENT_DATE - INTERVAL '2 days' + '17:15:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'CHECK_OUT',
    'FACE_MATCH',
    0.8980,
    'KIOSK-HN-HQ-01',
    'EARLY_LEAVE',
    0,
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM users u
WHERE u.employee_code = 'STG-ENG-003';

-- 7.3. Công nhân xưởng chấm công bằng PIN dự phòng & có ca Offline Sync (STG-OPS-003)
INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync, created_at)
SELECT 
    u.id,
    (CURRENT_DATE - INTERVAL '1 day' + '05:55:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'CHECK_IN',
    'FALLBACK_PIN',
    NULL,
    'KIOSK-FACTORY-BN',
    'ON_TIME',
    0,
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM users u
WHERE u.employee_code = 'STG-OPS-003';

-- Bản ghi điểm danh Offline Sync (khi xưởng mất mạng)
INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, confidence_score, kiosk_id, status, late_minutes, is_offline_sync, created_at)
SELECT 
    u.id,
    (CURRENT_DATE - INTERVAL '3 days' + '05:58:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'CHECK_IN',
    'FACE_MATCH',
    0.9120,
    'KIOSK-FACTORY-BN',
    'ON_TIME',
    0,
    TRUE, -- Offline sync
    CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM users u
WHERE u.employee_code = 'STG-OPS-003';


-- ==============================================================================
-- 8. ĐƠN GIẢI TRÌNH CÔNG (EXCUSE_REQUESTS)
-- Phục vụ kiểm thử quy trình duyệt/từ chối của HR và Lead
-- ==============================================================================
DELETE FROM excuse_requests WHERE user_id IN (SELECT id FROM users WHERE employee_code LIKE 'STG-%');

-- 8.1. Đơn ĐÃ DUYỆT (APPROVED) cho ca đi muộn 40 phút của Hoàng Thúy Bình
INSERT INTO excuse_requests (
    user_id,
    attendance_log_id,
    reason,
    requested_punch_timestamp,
    status,
    decided_by,
    decided_at,
    rejection_reason,
    created_at,
    updated_at
)
SELECT
    u.id,
    a.id,
    'Tắc đường do sự cố ngập cục bộ tại Cầu Giấy, có báo cáo cho Tech Lead qua Slack lúc 08:35.',
    (CURRENT_DATE - INTERVAL '1 day' + '09:00:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'APPROVED',
    approver.id,
    CURRENT_TIMESTAMP - INTERVAL '18 hours',
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '23 hours',
    CURRENT_TIMESTAMP - INTERVAL '18 hours'
FROM users u
JOIN users approver ON approver.employee_code = 'STG-HR-001'
JOIN attendance_logs a ON a.user_id = u.id AND a.status = 'LATE'
WHERE u.employee_code = 'STG-ENG-003'
LIMIT 1;

-- 8.2. Đơn ĐANG CHỜ DUYỆT (PENDING) để HR/Lead vào test chức năng duyệt
INSERT INTO excuse_requests (
    user_id,
    attendance_log_id,
    reason,
    requested_punch_timestamp,
    status,
    decided_by,
    decided_at,
    rejection_reason,
    created_at,
    updated_at
)
SELECT
    u.id,
    NULL,
    'Đi khám bệnh định kỳ theo lịch bác sĩ tại Bệnh viện Bạch Mai, xin phép đến muộn 1 tiếng ca sáng.',
    (CURRENT_DATE + '09:30:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'PENDING',
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM users u
WHERE u.employee_code = 'STG-OPS-002';

-- 8.3. Đơn BỊ TỪ CHỐI (REJECTED) do lý do không hợp lệ
INSERT INTO excuse_requests (
    user_id,
    attendance_log_id,
    reason,
    requested_punch_timestamp,
    status,
    decided_by,
    decided_at,
    rejection_reason,
    created_at,
    updated_at
)
SELECT
    u.id,
    NULL,
    'Quên bấm máy chấm công buổi chiều do bận việc riêng cá nhân.',
    (CURRENT_DATE - INTERVAL '4 days' + '14:00:00'::TIME)::TIMESTAMP WITH TIME ZONE,
    'REJECTED',
    approver.id,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    'Lý do việc riêng cá nhân không thuộc trường hợp được chấp thuận điều chỉnh công theo quy chế công ty.',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM users u
JOIN users approver ON approver.employee_code = 'STG-HR-002'
WHERE u.employee_code = 'STG-OPS-003';


-- ==============================================================================
-- 9. KỲ CÔNG DOANH NGHIỆP (PAYROLL_PERIODS)
-- ==============================================================================
INSERT INTO payroll_periods (period_year, period_month, status, locked_by, locked_at, created_at, updated_at)
SELECT
    EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INT,
    EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::INT,
    'LOCKED',
    u.id,
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP - INTERVAL '40 days',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
FROM users u
WHERE u.employee_code = 'STG-HR-001'
ON CONFLICT (period_year, period_month) DO UPDATE
SET status = 'LOCKED';

-- Kỳ công tháng hiện tại đang mở
INSERT INTO payroll_periods (period_year, period_month, status, created_at, updated_at)
VALUES (
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    'OPEN',
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    CURRENT_TIMESTAMP
)
ON CONFLICT (period_year, period_month) DO UPDATE
SET status = 'OPEN';


-- ==============================================================================
-- 10. THÔNG BÁO HỆ THỐNG TRONG ỨNG DỤNG (NOTIFICATIONS)
-- ==============================================================================
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE employee_code LIKE 'STG-%');

INSERT INTO notifications (user_id, event_type, title, body, reference_type, reference_id, read_at, created_at)
SELECT
    u.id,
    'EXCUSE_APPROVED',
    'Đơn giải trình công đã được phê duyệt',
    'Đơn giải trình đi muộn ngày hôm qua của bạn đã được Lê Thị Thu Hương (HR) chấp thuận.',
    'EXCUSE',
    '1',
    CURRENT_TIMESTAMP - INTERVAL '12 hours',
    CURRENT_TIMESTAMP - INTERVAL '18 hours'
FROM users u
WHERE u.employee_code = 'STG-ENG-003';

INSERT INTO notifications (user_id, event_type, title, body, reference_type, reference_id, read_at, created_at)
SELECT
    u.id,
    'EXCUSE_SUBMITTED',
    'Có đơn giải trình công mới cần phê duyệt',
    'Kỹ thuật viên Phan Đình Cường vừa gửi đơn giải trình công ca sáng cần bạn xem xét.',
    'EXCUSE',
    '2',
    NULL, -- Chưa đọc
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM users u
WHERE u.employee_code = 'STG-HR-001';


-- ==============================================================================
-- 11. NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT_LOGS)
-- Ghi nhận lịch sử kiểm toán mẫu phục vụ tính năng tra cứu Audit Trail
-- ==============================================================================
DELETE FROM audit_logs WHERE actor_id IN (SELECT id FROM users WHERE employee_code LIKE 'STG-%');

INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, before_state, after_state, ip_address, created_at)
SELECT
    u.id,
    u.email,
    'LOCK_PAYROLL_PERIOD',
    'PAYROLL_PERIOD',
    '1',
    '{"status": "OPEN"}'::JSONB,
    '{"status": "LOCKED", "locked_by": "STG-HR-001"}'::JSONB,
    '10.20.30.15',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
FROM users u
WHERE u.employee_code = 'STG-HR-001';

INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, before_state, after_state, ip_address, created_at)
SELECT
    u.id,
    u.email,
    'CONSENT_WITHDRAWN',
    'CONSENT',
    'STG-OPS-004',
    '{"status": "ACTIVE"}'::JSONB,
    '{"status": "WITHDRAWN", "retention_disposal_days": 7}'::JSONB,
    '10.20.30.99',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM users u
WHERE u.employee_code = 'STG-OPS-004';

COMMIT;
