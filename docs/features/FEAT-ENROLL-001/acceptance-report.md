---
title: Báo Cáo Đánh Giá & Kiểm Thử Nghiệm Thu Tính Năng Đăng Ký Khuôn Mặt
version: 2.0
status: Approved
owner: Lead Quality Engineer & Security Review Team
type: report
scope: SYS
feature_id: FEAT-ENROLL-001
date: 2026-11-01
compliance: Luật Bảo vệ dữ liệu cá nhân 2025 (Luật số 91/2025/QH15) & Nghị định 356/2025/NĐ-CP
---

# Báo Cáo Đánh Giá & Kiểm Thử Nghiệm Thu (Verification & Review Report)
## Tính Năng: Đăng Ký & Kích Hoạt Mẫu Khuôn Mặt — Multi-Template + Guided Multi-Pose (FEAT-ENROLL-001 v2.0)

Tài liệu này tổng hợp toàn bộ kết quả thẩm định kiến trúc, kiểm thử tự động đa tầng (Unit, Integration, Adversarial Stress) cho tính năng **FEAT-ENROLL-001 v2.0** — nâng cấp từ single-template 3-frame thụ động sang **Multi-Template (3 vector ArcFace 512D độc lập)** kết hợp **Guided Multi-Pose (FRONTAL → LEFT_TILT → RIGHT_TILT)**, theo đặc tả tại [spec.md](spec.md).

---

## 1. Tóm Tắt Kết Quả (Executive Summary)

### Quyết Định Kiến Trúc v2.0
- **Phương pháp thu thập**: Guided Multi-Pose — 3 bước tương tác hướng dẫn người dùng giữ tư thế FRONTAL (|Yaw| ≤ 5°), LEFT_TILT (10°–25°), RIGHT_TILT (−25° đến −10°) trong ≥ 0.25 giây trước khi chụp.
- **Phương pháp lưu trữ**: Multi-Template — 3 vector ArcFace 512D chuẩn hóa $L_2$, mỗi vector **mã hóa độc lập** bằng AES-256-GCM (IV riêng biệt, key master riêng biệt).
- **Khớp mặt điểm danh**: `Best Score = max(sim_front, sim_left, sim_right)` — ≤ 350 ms SLA.
- **Góc Euler**: Ước tính từ 5 landmarks YuNet — không cần model bổ sung.
- **Backward Compatibility**: Bản ghi single-template cũ được parse như pose FRONTAL; không cần migration.

### Kết Quả Tổng Thể: **100% PASSED** trên tất cả phân hệ

| Phân Hệ | Test Count | Kết Quả |
| :--- | :---: | :---: |
| Central Backend (`./mvnw test`) | **537/537** | ✅ 0 failures, 0 errors |
| Edge Kiosk (`pytest tests/`) | **203/203** | ✅ 0 failures |
| Edge Kiosk (ruff linter) | — | ✅ All checks passed |
| Web Portal (`npm test`) | **397/397** | ✅ 0 failures |
| Web Portal (`npm run lint`) | — | ✅ 0 errors, 2 pre-existing warnings |
| Web Portal (`npm run build`) | 2205 modules | ✅ Success |
| Docs Governance (`check_docs.py`) | 1045 ID, 756 refs | ✅ Exit 0 |

---

## 2. Ma Trận Nghiệm Thu 8 Tiêu Chí Chấp Nhận (Acceptance Criteria Matrix)

| Mã AC | Nội Dung Tiêu Chí | Phân Hệ | Cơ Chế Xác Minh | Kết Quả |
| :--- | :--- | :--- | :--- | :---: |
| **AC-ENROLL-001** | Ký Informed Consent, sinh OTP 6 số ngẫu nhiên thời hạn 48h | Web & Backend | `POST /api/v1/employee/consent` trả HTTP 200, lưu vết kiểm toán IP, User-Agent, thời gian. | **PASS** |
| **AC-ENROLL-002** | Chặn ký cam kết khi chưa cuộn hết 100% nội dung điều khoản | Web Portal | `ConsentModal.tsx` vô hiệu hóa checkbox và nút ký nếu thanh cuộn chưa chạm đáy (dung sai 5px). | **PASS** |
| **AC-ENROLL-003** | Xác thực OTP 6 số tại Kiosk và cấp Session Token 15 phút | Kiosk & Backend | `POST /api/v1/kiosk/verify-otp` trả mã `OTP_VERIFIED` và `sessionToken` với HMAC ký an toàn. | **PASS** |
| **AC-ENROLL-004** | Xử lý lỗi khi nhập sai OTP hoặc OTP đã hết hạn sau 48h | Kiosk & Backend | Trả về mã lỗi `OTP_INVALID` hoặc `OTP_EXPIRED`, giao diện Kiosk phản hồi visual cảnh báo đỏ. | **PASS** |
| **AC-ENROLL-005** | Khóa brute-force 15 phút sau đúng 5 lần nhập sai liên tiếp | Central Backend | Backend kích hoạt bộ đếm sai; lần 5 trả HTTP 423 `OTP_LOCKED`, từ chối ngay lập tức lần 6. | **PASS** |
| **AC-ENROLL-006** | Thu nạp Guided Multi-Pose: FRONTAL → LEFT_TILT → RIGHT_TILT, Liveness ≥ 0.90, Laplacian ≥ 30 | Edge Kiosk | State machine 3 bước; góc Euler từ YuNet landmarks; 0.25 s stability hold; dead-zone Yaw ngoài vùng hợp lệ bị từ chối. | **PASS** |
| **AC-ENROLL-007** | Phản hồi trực quan HUD và từ chối ảnh mờ / tấn công giả mạo 2D | Edge Kiosk | Khung oval + gauge yaw + thẻ 3 tư thế trên QML HUD; oval đỏ khi liveness < 0.90 hoặc ảnh mờ. | **PASS** |
| **AC-ENROLL-008** | Lưu 3 vector ArcFace 512D ($L_2=1.0$), mã hóa AES-256-GCM độc lập × 3, phát STOMP multi-template | Kiosk, Backend, Web | 3 bản ghi `biometric_templates` với `pose_type`; `templateCount=3`; broadcast `poses[]` qua WebSocket STOMP. | **PASS** |

---

## 3. Kiểm Định 5 Bất Biến Kiến Trúc (Architectural Invariants)

1. **INV-1: Mã hóa độc lập 3 vector AES-256-GCM (Cryptographic Independence)**
   - *Kiểm tra*: Mỗi trong 3 vector pose (FRONTAL, LEFT_TILT, RIGHT_TILT) được mã hóa với IV 12 bytes **riêng biệt** và authentication tag 16 bytes riêng. `BiometricAdversarialChallengeTest::Challenge 3` xác nhận 3 IV khác nhau.
   - *Kết luận*: Xâm phạm một vector không lộ dữ liệu của vector còn lại.

2. **INV-2: Mã kích hoạt OTP 48 giờ sử dụng một lần (Single-Use Onboarding OTP)**
   - *Kiểm tra*: Sau khi nạp thành công 3 templates, replay attack với cùng OTP trả HTTP 409 `OTP_ALREADY_USED`.
   - *Kết luận*: Ngăn ngừa triệt để chiếm đoạt phiên đã hoàn thành.

3. **INV-3: Ngưỡng Liveness Thu nạp An toàn Cao (≥ 0.90)**
   - *Kiểm tra*: MiniFASNet áp 0.90 trong thu nạp (so với 0.85 trong điểm danh thường nhật). Liveness drop trong stability hold → reset timer tức thì.
   - *Kết luận*: Đạt tiêu chuẩn ngăn chặn gian lận ảnh in, video, mặt nạ 2D.

4. **INV-4: Triệt tiêu Upload ảnh Máy khách (100% Zero-Photo-Upload)**
   - *Kiểm tra*: Kiosk chỉ gửi 3 mảng số thực 512 chiều ($L_2 = 1.0 \pm 10^{-4}$) qua `POST /api/v1/kiosk/enroll-face`. Không có endpoint nào nhận tệp ảnh.
   - *Kết luận*: Tuân thủ tuyệt đối Luật 2025, không lưu chân dung nhạy cảm.

5. **INV-5: Tự động Xóa Vĩnh viễn Dữ liệu Sinh trắc học sau 20 ngày**
   - *Kiểm tra*: Tác vụ nền `@Scheduled` hàng ngày xóa cứng **tất cả** bản ghi `biometric_templates` (cả 3 pose) của nhân viên đã nghỉ/rút consent > 20 ngày.
   - *Kết luận*: Đảm bảo Right to Erasure — xóa toàn bộ identity dù multi-template.

---

## 4. Kiến Trúc Kỹ Thuật Multi-Template + Guided Multi-Pose

### 4.1. Schema Mở Rộng (Migration V8)

```sql
-- V8__add_pose_type_to_biometric_templates.sql
ALTER TABLE biometric_templates
    ADD COLUMN pose_type VARCHAR(20) NOT NULL DEFAULT 'FRONTAL';

CREATE UNIQUE INDEX idx_biometric_user_pose_active
    ON biometric_templates (employee_id, pose_type)
    WHERE is_active = TRUE;
```

### 4.2. Quy Trình Thu Nạp 3 Tư Thế (State Machine)

```
[Step 1: OTP]
  └─ verifyOtp() → sessionToken, employeeId
       ↓
[Step 2: Capture Loop]
  poseIndex=0  FRONTAL   |Yaw| ≤ 5°    → hold 0.25s → capture → poseIndex=1
  poseIndex=1  LEFT_TILT  Yaw ∈ [10°,25°] → hold 0.25s → capture → poseIndex=2
  poseIndex=2  RIGHT_TILT Yaw ∈ [-25°,-10°] → hold 0.25s → capture → submit
       ↓
[Step 3: Completed]
  POST /api/v1/kiosk/enroll-face { templates: [{poseType, vector512}×3] }
  → STOMP broadcast: { templateCount: 3, poses: ["FRONTAL","LEFT_TILT","RIGHT_TILT"] }
```

### 4.3. Thuật Toán Khớp Mặt Điểm Danh (Benchmark)

$$\text{Best Score} = \max(\text{sim}_\text{front},\, \text{sim}_\text{left},\, \text{sim}_\text{right})$$

**Kết quả benchmark** (vectorized NumPy dot-product 1:N):
- **3,000 vectors** (1,000 nhân viên × 3 tư thế) → **0.1171 ms** (well within ≤ 350 ms SLA)

### 4.4. Góc Euler từ YuNet Landmarks

$$\text{Yaw} = \arctan\!\left(\frac{x_R - x_L}{d_{eye}}\right) \cdot \frac{180}{\pi} \cdot k_{\text{scale}}$$

Trong đó: $x_L, x_R$ = tọa độ x mắt trái/phải, $d_{eye}$ = khoảng cách giữa 2 mắt, $k_{\text{scale}} = 1.5$.
Không cần model bổ sung — 5 landmarks từ YuNet là đủ.

---

## 5. Kết Quả Kiểm Thử Chi Tiết

### 5.1. Central Backend — 537/537 Tests Passed

| Test Suite | Tests | Kết Quả |
| :--- | :---: | :---: |
| `BiometricAdversarialChallengeTest` | 15 | ✅ |
| `KioskEnrollFaceAdversarialChallengeTest` | 8 | ✅ |
| `EnrollmentServiceTest` | 12 | ✅ |
| `AttendancePunchIntegrationTest` | 5 | ✅ |
| Các test suite còn lại | 497 | ✅ |
| **Tổng** | **537** | **✅ 0 failures** |

### 5.2. Edge Kiosk — 203/203 Tests Passed

| Test File | Tests | Phủ Sóng |
| :--- | :---: | :--- |
| `test_enrollment_controller.py` | 24 | State machine 3-pose, OTP flow, submit |
| `test_m3_adversarial_challenge.py` | 32 | Sequential ordering, dead-zone, stability hold, backend rejection recovery |
| `test_m3_r2_adversarial.py` | 18 | Round-2 lifecycle, QML re-open after cancel |
| `test_gallery_matcher_adversarial.py` | 22 | Multi-template matching, NaN/Inf poison, boundary |
| `test_face_detector.py` | 15 | YuNet Euler angle estimation, landmark projection |
| Các test suite còn lại | 92 | Network, PIN, SQLite, UX |
| **Tổng** | **203** | **✅ 0 failures** |

**Lỗi đã xử lý trong phiên này**: `test_reopen_after_cancel_qml_lifecycle` — `QQmlComponent` dùng relative path thất bại khi chạy từ ngoài CWD. Fix: dùng `QUrl.fromLocalFile(str(_KIOSK_ROOT / "resources/qml/dialogs/EnrollmentDialog.qml"))`.

### 5.3. Web Portal — 397/397 Tests Passed

| Gate | Kết Quả |
| :--- | :---: |
| `npm test -- --run` (397 tests, 35 files) | ✅ 0 failures |
| `npm run lint` (eslint) | ✅ 0 errors, 2 pre-existing warnings |
| `npm run build` (tsc + vite, 2205 modules) | ✅ 834 ms |

**Thay đổi**: `src/types/consent.ts` — `EnrollmentSuccessMessage` mở rộng thêm optional fields `employeeCode?`, `fullName?`, `templateCount?`, `poses?` để align với STOMP payload mới của backend. Backward compatible với subscriber cũ.

---

## 6. Đánh Giá Bảo Mật & Thử Thách Kháng Tấn Công (Adversarial Security Evaluation)

1. **Kháng Dò Mã OTP (Brute-Force)**: Khóa HTTP 423 sau đúng 5 lần sai — xác nhận qua `BiometricAdversarialChallengeTest::Challenge 1`.
2. **Kháng Replay Attack**: OTP/SessionToken single-use — xác nhận qua `test_08_full_3tier_enrollment_with_stomp_and_crypto` (staging v1.0) và `KioskEnrollFaceAdversarialChallengeTest`.
3. **Kháng Vector Anomaly**: 511/513 chiều → HTTP 400 `INVALID_VECTOR_DIMENSION`; $L_2 \neq 1.0 \pm 10^{-4}$ → HTTP 400 `VALIDATION_FAILED`.
4. **Kháng NaN/Inf Matrix Poisoning**: `np.isfinite` pre-filter trong `gallery_matcher.py` — xác nhận qua `test_gallery_matcher_adversarial.py`.
5. **Kháng Out-of-Order Pose**: State machine từ chối pose sai thứ tự — xác nhận qua `TestSequentialFlowAndDeadZone::test_out_of_order_poses_rejected_at_each_step`.
6. **Kháng Premature Capture (Stability Hold)**: Cần giữ tư thế ≥ 0.25 s liên tục — xác nhận qua `TestStabilityHoldAndDrops::test_stability_hold_duration_blocks_premature_capture`.
7. **Kháng Cryptographic Collusion**: 3 AES-256-GCM IV độc lập — xác nhận qua `Challenge 3: Cryptographic Independence`.

---

## 7. Kết Luận & Trạng Thái

Tính năng **Đăng Ký & Kích Hoạt Mẫu Khuôn Mặt Multi-Template + Guided Multi-Pose (`FEAT-ENROLL-001 v2.0`)** đã vượt qua toàn bộ cổng chất lượng theo **Definition of Done** trong `AGENTS.md`:

- ✅ Backend: `./mvnw test` → 537/537 PASS
- ✅ Kiosk: `pytest tests/` → 203/203 PASS, `ruff check` → 0 errors
- ✅ Web Portal: `npm test` → 397/397 PASS, `npm run lint` → 0 errors, `npm run build` → success
- ✅ Docs: `check_docs.py` → exit 0

**Đặc tả kỹ thuật chi tiết**: [spec.md](spec.md) (v2.0, 770+ dòng).
**Trạng thái**: Đã nghiệm thu — sẵn sàng cho giai đoạn phát hành chính thức.
