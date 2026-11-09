# Tasks: Xác thực Điểm danh Dự phòng bằng Mã PIN (FEAT-FALLBACK-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Authoritative Task Breakdown  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/FEAT-FALLBACK-001/tasks.md`  
> **Status:** Completed  
> **Last updated:** 2026-11-08  

- **Feature ID:** `FEAT-FALLBACK-001`
- **Inputs:** `docs/features/FEAT-FALLBACK-001/spec.md`, `docs/adr/ADR-005-pin-fallback-and-lockout.md`, `contracts/openapi.yaml`

---

## 1. Task List

- [x] `T-001` [US-FALLBACK-001] Xây dựng bàn phím số ảo PIN Pad trên màn hình cảm ứng Kiosk
  - **Depends on:** None
  - **Target Files:** `app/kiosk-app/ui/components/pin_pad.py`, `app/kiosk-app/tests/test_pin_pad.py`
  - **Acceptance:** Bàn phím số ảo 0-9 hiển thị trực tiếp trong viewport; có nút Clear và Submit; tự động ẩn sau 30 giây không thao tác.
  - **Verify Command:** `pytest app/kiosk-app/tests/test_pin_pad.py` (Exit 0)

- [x] `T-002` [US-FALLBACK-002] Xây dựng API thẩm định mã PIN băm BCrypt tại Backend
  - **Depends on:** `T-001`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/service/PinAuthService.java`, `com/fas/controller/KioskPunchController.java`
  - **Acceptance:** Thẩm định mã PIN 6 số đối chiếu hash BCrypt trong CSDL; ghi nhận bản ghi điểm danh với `authMethod: PIN`.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=PinAuthServiceTest` (Exit 0)

- [x] `T-003` [US-FALLBACK-003] Thiết lập cơ chế khóa cứng 15 phút chống brute-force sau 5 lần nhập sai
  - **Depends on:** `T-002`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/security/LoginAttemptService.java`
  - **Acceptance:** Đếm số lần nhập sai liên tiếp; khóa tài khoản trong đúng 15 phút sau 5 lần sai; trả về HTTP 423 Locked.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=LoginAttemptServiceTest` (Exit 0)

---

## 2. Execution Contract & Completion Gate
- [x] Toàn bộ 3 nhiệm vụ đã hoàn thành và kiểm chứng thực nghiệm.
- [x] Minh chứng nghiệm thu chi tiết được ghi nhận tại `docs/features/FEAT-FALLBACK-001/acceptance-report.md`.

