---
title: Kiosk FR/NFR Detailed Design
version: 1.0
status: Approved
owner: Edge Vision Lead & System Architect
---

# FR/NFR DESIGN — Thiết kế Kỹ thuật Phân hệ Kiosk


## 1. Solution Components & Architecture (Thành phần Kỹ thuật Kiosk)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-KSK-001` | Bộ Thu nhận Luồng Camera | Thu nhận khung hình qua OpenCV DirectShow, phát tín hiệu khung hình tới các luồng xử lý với tốc độ $\ge 15\text{ FPS}$. | `STK-002` | `FR-KSK-001`, `NFR-KSK-002` | `DD-SYS-004` | Accepted |
| `SOL-KSK-002` | Bộ Phát hiện Mặt & Góc Euler | Sử dụng YuNet ONNX phát hiện mặt $\ge 120\times 120\text{ px}$, tính góc Yaw, Pitch, Roll $\le 15^\circ$ và tọa độ 5 điểm mốc. | `STK-002`, `STK-006` | `FR-KSK-001` | `DD-SYS-004` | Accepted |
| `SOL-KSK-003` | Cổng Kiểm chuẩn Oval & Ổn định | Kiểm tra độ lệch tâm $\le 120\text{ px}$, diện tích $25\% - 75\%$, độ sắc nét $\ge 30$ và giữ ổn định $0.5 - 1.0\text{ s}$ liên tục. | `STK-001`, `STK-003` | `FR-KSK-001`, `UI-KSK-001` | `DD-SYS-004` | Accepted |
| `SOL-KSK-004` | Cổng Lọc Thực thể sống MiniFASNet | Crop ảnh mở rộng 1.5x, đưa qua MiniFASNet tính điểm $S \ge 0.85$ để phân loại người thật vs ảnh in/màn hình. | `STK-002`, `STK-006` | `FR-KSK-002` | `DD-SYS-006` | Accepted |
| `SOL-KSK-005` | Bộ Trích xuất Vector ArcFace | Căn chỉnh Affine 5 điểm mốc về $112\times 112\text{ px}$, trích xuất vector 512D chuẩn hóa L2 Norm = 1.0 qua ArcFace MobileFaceNet. | `STK-002`, `STK-006` | `FR-KSK-003` | `DD-SYS-006` | Accepted |
| `SOL-KSK-006` | Bộ So khớp Danh mục Ma trận RAM | Duy trì ma trận $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32`, nhân ma trận Cosine Similarity qua NumPy trong thời gian $< 2\text{ ms}$. | `STK-004` | `FR-KSK-003`, `NFR-KSK-001` | `DD-SYS-006` | Accepted |
| `SOL-KSK-007` | Bộ Thẩm định PIN Dự phòng qua Backend | Gửi mã PIN 6 số lên `POST /api/v1/kiosk/verify-pin` kèm `X-Kiosk-Id` + Secret Token; chỉ ghi nhận điểm danh khi nhận HTTP 200 với định danh nhân sự từ Backend; ánh xạ 401 `PIN_INVALID` và 423 `PIN_LOCKED` (kèm `lockedUntil`) thành trạng thái UI; không lưu hay so khớp PIN tại chỗ. | `STK-007`, `STK-003` | `FR-KSK-004`, `API-KSK-007` | `DD-SYS-006`, `DD-BE-015` | Accepted |
| `SOL-KSK-008` | Bộ Quản lý Vòng đời Bộ nhớ Khung hình | Cấp phát và giải phóng tường minh mọi `np.ndarray` khung hình/ảnh crop trong mỗi chu kỳ suy luận; theo dõi mức tiêu thụ RAM và cảnh báo khi vượt ngưỡng để giữ biến thiên $\le 10\%$ sau 8 giờ chạy. | `STK-002`, `STK-004` | `NFR-KSK-004`, `DATA-KSK-005` | `DD-SYS-003` | Accepted |
| `SOL-KSK-009` | Vòng lặp Tự phục hồi Kết nối Camera | Phát hiện mất tín hiệu camera và tự thử mở lại thiết bị mỗi 3 giây theo Exponential Backoff nhẹ, không chặn luồng giao diện và không làm sập ứng dụng. | `STK-002` | `NFR-KSK-005`, `FR-KSK-001` | `DD-SYS-004` | Accepted |
| `SOL-KSK-010` | Bộ Đệm Cooldown Biên 120s | Ghi nhớ `last_punch_map = {emp_id: timestamp}` trong RAM, từ chối lượt quẹt dồn dập trong 120 giây. | `STK-001` | `FR-KSK-005` | `DD-SYS-002` | Accepted |
| `SOL-KSK-011` | Bộ Quản lý Hàng đợi SQLite WAL | Mở kết nối `kiosk_local.db` chế độ WAL, thực thi `enqueue_punch()`, `fetch_unsynced_batch()`, `mark_synced()`. | `STK-005` | `FR-KSK-006`, `NFR-KSK-003` | `DD-SYS-005` | Accepted |

---

## 2. Edge Vision Pipeline Flow (Chuỗi Xử lý Thị giác Máy tính Biên)

```text
Khung hình Camera ──► [YuNet Face Detector] ──► [Oval & Temporal Stability Gate (0.5s - 1.0s)]
                             │                                  │ (Đạt chuẩn)
                             ▼                                  ▼
                   [MiniFASNet Liveness] ──► [Affine Transform (112x112)] ──► [ArcFace 512D Extractor]
                             │ (Score >= 0.85)                                        │
                             ▼                                                        ▼
                    [Người thật xác thực]                                   [Vector chuẩn hóa L2]
                                                                                      │
                                                                                      ▼
                               [Kết quả Chấm công] ◄── [RAM Cosine Matcher (M x u >= 0.50)]
```
