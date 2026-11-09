# Acceptance Report: Xác thực Điểm danh Dự phòng bằng Mã PIN (FEAT-FALLBACK-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Acceptance and Verification Report  
> **Primary Owner Skill:** `verification-before-completion`  
> **Canonical Destination Path:** `docs/features/FEAT-FALLBACK-001/acceptance-report.md`  
> **Status:** Verified  
> **Last updated:** 2026-11-08  

---

## 1. Executive Verdict & Deliverables
- **Feature ID:** `FEAT-FALLBACK-001`
- **Spec Path:** `docs/features/FEAT-FALLBACK-001/spec.md`
- **Overall Verdict:** `Verified` (100% Pass)

### Produced Deliverables
| Deliverable | Canonical Path | Status |
| :--- | :--- | :---: |
| Kiosk Virtual PIN Pad Component | `app/kiosk-app/ui/components/pin_pad.py` | Complete |
| Backend PIN Service & Brute-Force Guard | `app/backend-service/src/main/java/com/fas/security/LoginAttemptService.java` | Complete |
| Executable Contract | `contracts/openapi.yaml` (`POST /api/v1/kiosk/punch-pin`) | Validated |

---

## 2. Requirement & Acceptance Criteria Checks

| Requirement / AC ID | Scenario Summary | Verification Command / Observation | Actual Result | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| `FR-SYS-006` | Điểm danh bằng mã PIN dự phòng | `pytest app/kiosk-app/tests/test_pin_pad.py` | Nhập mã PIN 6 số, hiển thị dấu `*`, gửi payload punch | **Passed** |
| `NFR-SYS-008` | Khóa cứng 15 phút sau 5 lần sai | `./mvnw -pl app/backend-service test -Dtest=LoginAttemptServiceTest` | Lần thứ 6 trả về HTTP 423 Locked trong 900 giây | **Passed** |
| `AC-PIN-TIMEOUT` | Tự đóng PIN pad sau 30s không thao tác | `pytest app/kiosk-app/tests/test_pin_pad.py` | Inactivity timer kích hoạt đóng modal sau 30s | **Passed** |

---

## 3. Verification Gate & Sign-off Checklist
- [x] Toàn bộ ca kiểm thử đơn vị và brute-force guard pass 100%.
- [x] Hợp đồng API được xác nhận qua `python scripts/verify_contracts.py`.

