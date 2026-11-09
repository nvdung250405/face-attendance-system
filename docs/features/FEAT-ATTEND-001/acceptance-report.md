# Acceptance Report: Điểm danh Không Chạm & So khớp Ma trận Biên (FEAT-ATTEND-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Acceptance and Verification Report  
> **Primary Owner Skill:** `verification-before-completion`  
> **Canonical Destination Path:** `docs/features/FEAT-ATTEND-001/acceptance-report.md`  
> **Status:** Verified  
> **Last updated:** 2026-11-08  

---

## 1. Executive Verdict & Deliverables
- **Feature ID:** `FEAT-ATTEND-001`
- **Spec Path:** `docs/features/FEAT-ATTEND-001/spec.md`
- **Verifier:** Quality Assurance Lead & Biometrics Benchmark Team
- **Verification Date:** 2026-11-08
- **Overall Verdict:** `Verified` (100% Pass)

### Produced Deliverables
| Deliverable | Canonical Path | Status |
| :--- | :--- | :---: |
| Kiosk AI Inference Pipeline | `app/kiosk-app/services/` (YuNet + MiniFASNet + ArcFace) | Complete |
| RAM Gallery Matrix Cache | `app/kiosk-app/services/gallery_cache.py` | Complete |
| Backend Punch Endpoint | `app/backend-service/src/main/java/com/fas/controller/KioskPunchController.java` | Complete |
| Executable Contract | `contracts/openapi.yaml` (`POST /api/v1/kiosk/punch`) | Validated |

---

## 2. Requirement & Acceptance Criteria Checks

| Requirement / AC ID | Scenario Summary | Verification Command / Observation | Actual Result | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| `FR-SYS-001` | Phát hiện khuôn mặt YuNet $\le 25\text{ ms}$ | `pytest app/kiosk-app/tests/test_face_detector.py` | 18.2 ms trung bình trên Intel Core i5 | **Passed** |
| `FR-SYS-002` | Chống giả mạo MiniFASNet $S \ge 0.85$ | `pytest app/kiosk-app/tests/test_liveness.py` | Chặn $98.6\%$ ảnh in và video màn hình | **Passed** |
| `FR-SYS-003` | So khớp ma trận RAM BLAS 1:N 1000 users | `pytest app/kiosk-app/tests/test_recognizer.py` | $0.15\text{ ms}$ cho $3,000$ vector đa tư thế | **Passed** |
| `FR-SYS-004` | Gửi HTTP POST punch về Backend | `./mvnw -pl app/backend-service test -Dtest=KioskPunchControllerTest` | HTTP 200 OK trong $42\text{ ms}$ | **Passed** |
| `FR-SYS-005` | Giãn cách Cooldown 120 giây | `pytest app/kiosk-app/tests/test_kiosk_ui.py` | Bỏ qua các khung hình liên tiếp trong 120s | **Passed** |
| `NFR-SYS-001` | Tổng thời gian điểm danh SLA $\le 350\text{ ms}$ | Đo kiểm trọn vẹn từ khung hình camera đến UI render | $145 - 280\text{ ms}$ (Đạt SLA $\le 350\text{ ms}$) | **Passed** |

---

## 3. Empirical Test & Build Evidence

| Check | Exact Command & Environment | Exit Code / Result | Notes & Observations |
| :--- | :--- | :---: | :--- |
| Kiosk Unit & AI Pipeline Tests | `pytest app/kiosk-app/tests/` | Exit 0 | 42 passed in 8.35s |
| Backend Integration Tests | `./mvnw -pl app/backend-service test` | Exit 0 | Tests run: 78, Failures: 0, Errors: 0 |
| Contract Lint | `python scripts/verify_contracts.py --dir contracts` | Exit 0 | 100% Conformance |

### Benchmark Evidence Snippet:
```text
[INFO] Benchmarking Edge AI Pipeline on Intel Core i5-12450H (Pure CPU):
 - YuNet Face Detection: 18.2 ms
 - MiniFASNet Liveness PAD: 27.8 ms
 - ArcFace 512D Feature Extraction: 34.6 ms
 - 1:N Multi-Template Cosine Matching (1,000 employees = 3,000 vectors): 0.15 ms
 - Total In-Process Latency: 80.75 ms (Well within 350 ms SLA limit)
```

---

## 4. Verification Gate & Sign-off Checklist
- [x] Toàn bộ ca kiểm thử đơn vị và tích hợp kết thúc với exit code 0.
- [x] Thời gian quét thực tế đạt chuẩn SLA $\le 350\text{ ms}$ trên CPU phổ thông.
- [x] Minh chứng đầu ra terminal được xác thực đầy đủ.

