# Product Telemetry Tracking Plan: Enterprise Face Attendance System (FAS)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Telemetry Tracking Plan  
> **Primary Owner Skill:** `analytics`  
> **Canonical Destination Path:** `docs/analytics/tracking-plan.md`  
> **Status:** Approved  
> **Last updated:** 2026-11-08  

---

## 1. Tracking Objectives & Core Metrics
Kế hoạch theo dõi đo lường chất lượng sản phẩm (Product Telemetry) nhằm đánh giá độ tin cậy của thuật toán sinh trắc học và tối ưu hóa trải nghiệm điểm danh không chạm:
- **Tỷ lệ nhận diện thành công lần đầu (First-Attempt Success Rate)**: Mục tiêu $\ge 96\%$.
- **Thời gian xử lý điểm danh trung bình (Avg Punch Processing Time)**: Mục tiêu $\le 250\text{ ms}$.
- **Tần suất kích hoạt dự phòng mã PIN (PIN Fallback Ratio)**: Mục tiêu $< 3\%$ tổng số lượt.
- **Tỷ lệ phát hiện và chặn giả mạo (PAD Block Rate)**: Giám sát các lượt vi phạm ngưỡng Liveness $S < 0.85$.

---

## 2. Event Taxonomy Table

| Mã Sự Kiện | Tên Sự Kiện | Nguồn Phát Sinh | Thời Điểm Kích Hoạt | Các Thuộc Tính Sự Kiện (Properties) | Mục Đích Đo Lường |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `EVT_PUNCH_SUCCESS` | `attendance_punch_success` | Kiosk App | Khi nhận diện khuôn mặt thành công và gửi punch | `kiosk_id`, `employee_id`, `auth_method: FACE`, `confidence_score`, `liveness_score`, `duration_ms` | Đo lường SLA tốc độ và độ chính xác |
| `EVT_PUNCH_PIN` | `attendance_punch_pin` | Kiosk App | Khi nhân viên điểm danh qua bàn phím số ảo PIN Pad | `kiosk_id`, `employee_id`, `auth_method: PIN`, `attempt_count` | Giám sát tỷ lệ dùng fallback |
| `EVT_PAD_REJECT` | `biometric_spoofing_blocked` | Kiosk App | Khi điểm sống MiniFASNet $S < 0.85$ | `kiosk_id`, `liveness_score`, `crop_type`, `timestamp` | Phát hiện rủi ro tấn công giả mạo |
| `EVT_OFFLINE_BUFFER` | `punch_buffered_offline` | Kiosk App | Khi Kiosk lưu đệm vào SQLite do mất mạng | `kiosk_id`, `queue_depth`, `reason: NETWORK_TIMEOUT` | Đo lường độ ổn định mạng tại trạm |
| `EVT_SYNC_BATCH_DONE` | `offline_batch_synced` | Kiosk App | Khi worker gửi bù thành công một lô bản ghi | `kiosk_id`, `batch_size`, `duration_ms` | Đánh giá hiệu năng đồng bộ bù |
| `EVT_ENROLL_COMPLETE` | `guided_enrollment_completed` | Kiosk App | Khi nhân viên hoàn thành đủ 3 tư thế (Front, Left, Right) | `employee_id`, `template_count: 3`, `duration_sec` | Đo lường thời gian hoàn thành nạp mẫu |

---

## 3. Privacy & Compliance Guardrails
- **Tuyệt đối cấm ghi dữ liệu nhận dạng cá nhân nhạy cảm trong payload sự kiện telemetry**: Không chứa ảnh chụp, không chứa vector ArcFace thô, không chứa mã PIN dạng rõ.
- Mọi ID nhân viên trong event telemetry đều được mã hóa bằng UUID giả danh (pseudonymized ID).

