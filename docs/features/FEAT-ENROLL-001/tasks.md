# Tasks: Đăng ký & Kích hoạt Mẫu Khuôn mặt Đa Tư Thế (FEAT-ENROLL-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Authoritative Task Breakdown  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/FEAT-ENROLL-001/tasks.md`  
> **Status:** Completed  
> **Last updated:** 2026-11-08  

- **Feature ID:** `FEAT-ENROLL-001`
- **Inputs:** `docs/features/FEAT-ENROLL-001/spec.md`, `docs/architecture.md`, `contracts/openapi.yaml`, `contracts/stomp-websocket.yaml`

---

## 1. Task List

- [x] `T-001` [US-ENROLL-001] Thiết lập giao diện ký cam kết điện tử Informed Consent trên Web Portal
  - **Depends on:** None
  - **Target Files:** `app/web-portal/src/components/ConsentModal.tsx`, `app/web-portal/src/api/consent.ts`
  - **Acceptance:** Nút ký cam kết bị khóa cho đến khi cuộn 100% nội dung pháp lý; sau khi ký hiển thị mã OTP 6 số.
  - **Verify Command:** `npm --prefix app/web-portal run test` (Exit 0)
  - **Risk / Rollback:** Low / Revert commit

- [x] `T-002` [US-ENROLL-002] Xây dựng API tiếp nhận Informed Consent và sinh mã Onboarding OTP 48h tại Backend
  - **Depends on:** `T-001`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/service/EnrollmentService.java`, `com/fas/controller/EnrollmentController.java`
  - **Acceptance:** Sinh mã OTP 6 số ngẫu nhiên mã hóa BCrypt, lưu trữ phiên với thời hạn 48 giờ.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=EnrollmentServiceTest` (Exit 0)
  - **Risk / Rollback:** Low / Revert commit

- [x] `T-003` [US-ENROLL-003] Xây dựng luồng Guided Multi-Pose Oval HUD (3 tư thế Frontal, Left, Right) tại Kiosk
  - **Depends on:** `T-002`
  - **Target Files:** `app/kiosk-app/ui/enrollment_modal.py`, `app/kiosk-app/services/face_enrollment_service.py`
  - **Acceptance:** Kiosk hướng dẫn lần lượt 3 tư thế theo góc Yaw; kiểm tra chất lượng Liveness $\ge 0.90$ và độ nét $\ge 30$; nộp 3 vector 512D.
  - **Verify Command:** `pytest app/kiosk-app/tests/test_face_enrollment.py` (Exit 0)
  - **Risk / Rollback:** Medium / Cần tinh chỉnh góc Euler

- [x] `T-004` [US-ENROLL-004] Mã hóa AES-256-GCM độc lập 3 vector và phát sóng STOMP hoàn tất
  - **Depends on:** `T-003`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/security/BiometricCryptoService.java`, `com/fas/service/StompBroadcaster.java`
  - **Acceptance:** Lưu 3 bản ghi vào `biometric_templates` với 3 IV ngẫu nhiên; gửi thông điệp `/topic/enrollment/{otp}` về Web Portal.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=BiometricCryptoServiceTest` (Exit 0)
  - **Risk / Rollback:** Low / Revert commit

---

## 2. Execution Contract & Completion Gate
- [x] Toàn bộ 4 nhiệm vụ đã hoàn thành và kiểm chứng thực nghiệm.
- [x] Kiểm thử hợp đồng WebSocket và REST API đạt 100% conformance.
- [x] Minh chứng nghiệm thu chi tiết được ghi nhận tại `docs/features/FEAT-ENROLL-001/acceptance-report.md`.

