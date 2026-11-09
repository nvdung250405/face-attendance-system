# Tasks: Điểm danh Không Chạm & So khớp Ma trận Biên (FEAT-ATTEND-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Authoritative Task Breakdown  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/FEAT-ATTEND-001/tasks.md`  
> **Status:** Completed  
> **Last updated:** 2026-11-08  

- **Feature ID:** `FEAT-ATTEND-001`
- **Inputs:** `docs/features/FEAT-ATTEND-001/spec.md`, `docs/architecture.md`, `contracts/openapi.yaml`, `contracts/stomp-websocket.yaml`

---

## 1. Task List

- [x] `T-001` [US-ATTEND-001] Tích hợp pipeline YuNet phát hiện khuôn mặt và landmark trên video stream camera
  - **Depends on:** None
  - **Target Files:** `app/kiosk-app/services/face_detector.py`, `app/kiosk-app/tests/test_face_detector.py`
  - **Acceptance:** Phát hiện khuôn mặt trong thời gian $\le 25\text{ ms}$ trên CPU, trả về 5 điểm mốc (landmarks).
  - **Verify Command:** `pytest app/kiosk-app/tests/test_face_detector.py` (Exit 0)

- [x] `T-002` [US-ATTEND-002] Tích hợp MiniFASNet đánh giá điểm sống thực thể chống giả mạo (PAD)
  - **Depends on:** `T-001`
  - **Target Files:** `app/kiosk-app/services/liveness_detector.py`, `app/kiosk-app/tests/test_liveness.py`
  - **Acceptance:** Trả về điểm sống $S_{\text{liveness}}$; từ chối nếu $S < 0.85$ và hiển thị viền đỏ cảnh báo.
  - **Verify Command:** `pytest app/kiosk-app/tests/test_liveness.py` (Exit 0)

- [x] `T-003` [US-ATTEND-003] Tích hợp ArcFace trích xuất vector 512D và thuật toán so khớp ma trận RAM Gallery BLAS 1:N
  - **Depends on:** `T-002`
  - **Target Files:** `app/kiosk-app/services/face_recognizer.py`, `app/kiosk-app/services/gallery_cache.py`
  - **Acceptance:** Trích xuất vector ArcFace 512D chuẩn hóa $L_2 = 1.0$; so khớp ma trận 1,000 nhân sự hoàn tất trong $< 2\text{ ms}$, lấy $\max(sim)$.
  - **Verify Command:** `pytest app/kiosk-app/tests/test_recognizer.py` (Exit 0)

- [x] `T-004` [US-ATTEND-004] Xây dựng máy trạng thái Kiosk Oval HUD và cơ chế Cooldown 120 giây
  - **Depends on:** `T-003`
  - **Target Files:** `app/kiosk-app/ui/main_window.py`, `app/kiosk-app/ui/components/oval_hud.py`
  - **Acceptance:** Khung Oval đổi màu xanh tức thì trong $\le 350\text{ ms}$; phát âm thanh chúc mừng; kích hoạt giãn cách 120s chống quẹt đúp.
  - **Verify Command:** `pytest app/kiosk-app/tests/test_kiosk_ui.py` (Exit 0)

- [x] `T-005` [US-ATTEND-005] Gửi giao dịch điểm danh trực tiếp qua HTTP REST POST `/api/v1/kiosk/punch`
  - **Depends on:** `T-004`
  - **Target Files:** `app/kiosk-app/services/api_client.py`, `app/backend-service/src/main/java/com/fas/controller/KioskPunchController.java`
  - **Acceptance:** Gửi payload điểm danh kèm header `X-Kiosk-Id`; Backend phản hồi đối soát ca kíp thành công trong $\le 100\text{ ms}$.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=KioskPunchControllerTest` (Exit 0)

---

## 2. Execution Contract & Completion Gate
- [x] Toàn bộ 5 nhiệm vụ đã hoàn thành và kiểm chứng thực nghiệm.
- [x] Thời gian quét toàn trình đạt $T_{\text{punch}} \le 350\text{ ms}$ trên CPU phổ thông.
- [x] Minh chứng nghiệm thu chi tiết được ghi nhận tại `docs/features/FEAT-ATTEND-001/acceptance-report.md`.

