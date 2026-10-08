---
title: Đặc tả Ngữ cảnh & Kiến trúc Phân hệ Kiosk App (Kiosk Spec Core)
version: 2.0
status: Approved
owner: Kiosk Lead Architect
type: spec
scope: KSK
updated: 2026-10-08
---

# KIOSK SPEC CORE — Đặc tả Ngữ cảnh & Kiến trúc Phân hệ Kiosk

Tài liệu này là **Spec Core cấp Phân hệ** của trạm Kiosk điểm danh cận biên (`kiosk-app`) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §7.2). Tài liệu xác lập:
1. Ngữ cảnh tương tác phân hệ, kế thừa các tác nhân (`ACT-`) và thiết bị/dịch vụ ngoại vi (`EXT-`).
2. Kiến trúc nội bộ phân hệ Kiosk (Internal Architecture): mô hình đa luồng PySide6, luồng dữ liệu thị giác máy tính, cơ chế ngoại tuyến bền vững và máy trạng thái vận hành.
3. Danh mục quyết định thiết kế kiến trúc phân hệ Kiosk (`DD-KSK-`).

---

## 1. Subsystem Context (Ngữ cảnh Vận hành Phân hệ Kiosk)

Phân hệ Kiosk vận hành như một thiết bị trạm cận biên tự phục vụ (Self-service Edge Station), đóng gói thành ứng dụng desktop Windows (PySide6 / Python 3.14) chạy trên máy tính đặt tại sảnh ra vào cơ quan/doanh nghiệp:

### 1.1. Actors (Tác nhân Tương tác)

Phân hệ Kiosk kế thừa và tham chiếu trực tiếp các tác nhân chuẩn hóa cấp toàn hệ thống ([System Spec Core](../../system-docs/specs/spec.md#11-actors-sổ-đăng-ký-tác-nhân-người-dùng-toàn-hệ-thống)):
* **[`ACT-001`](../../system-docs/specs/spec.md) — Nhân viên (Employee)**:
  * Điểm danh sinh trắc học khuôn mặt không chạm thời gian thực tại camera Kiosk (`FR-KSK-001..003`).
  * Điểm danh dự phòng bằng bàn phím số ảo PIN khi có sự cố nhận diện hoặc khi đã rút Informed Consent (`FR-KSK-004`).
  * Tự nạp mẫu khuôn mặt 3 bước trực tiếp tại camera Kiosk bằng mã Onboarding OTP 6 số (`FR-KSK-007`).
* **[`ACT-003`](../../system-docs/specs/spec.md) — Quản trị viên Hệ thống (System Admin)**:
  * Khởi tạo và kích hoạt trạm Kiosk bằng Secret Token cấp phát từ Backend (`FR-KSK-009`).
  * Thao tác phím nóng bảo trì tại chỗ: F4 (Chẩn đoán kết nối), F10 (Cấu hình trạm), F12 (Xem nhật ký hoạt động).
  * Mở khóa trạm khẩn cấp qua mã PIN cục bộ (`KIOSK_ADMIN_PIN`) khi trạm bị phong tỏa (`LOCKED`) và mất mạng (`FR-KSK-012`).

### 1.2. External Systems & Devices (Hệ thống & Thiết bị Ngoại vi)

* **[`EXT-001`](../../system-docs/specs/spec.md) — Camera Quang học UVC / Webcam**: Kết nối phần cứng qua cổng USB, cung cấp luồng khung hình video liên tục $\ge 15\text{ FPS}$ (khuyến nghị $\ge 24\text{ FPS}$) qua driver OpenCV DirectShow / Media Foundation.
* **[`EXT-003`](../../system-docs/specs/spec.md) — Nguồn Chuẩn Giờ Mạng (NTP Server)**: Đồng bộ mốc thời gian hệ điều hành máy trạm với sai lệch $\le 50\text{ ms}$ so với máy chủ Backend qua cổng UDP 123.
* **Máy chủ Doanh nghiệp (`backend-service`)**: Đối tác cung cấp dịch vụ RESTful API tiếp nhận giao dịch điểm danh (`POST /api/v1/kiosk/punch`), thẩm định PIN dự phòng (`POST /api/v1/kiosk/verify-pin`), cấp phát dữ liệu mẫu và đẩy sự kiện đồng bộ gallery thời gian thực qua WebSocket STOMP topic `/topic/kiosk-gallery`.

---

## 2. Architecture & Design (Kiến trúc Nội bộ Phân hệ Kiosk)

### 2.1. Multi-Thread Concurrency Architecture (Kiến trúc Đa luồng Bất đồng bộ)

Nhằm bảo đảm giao diện đồ họa đạt $\ge 15\text{ FPS}$ liên tục không giật lag (`NFR-KSK-002`) trong khi chu kỳ tính toán AI suy luận nặng vẫn hoàn tất $\le 350\text{ ms}$ (`NFR-KSK-001`), ứng dụng Kiosk được tổ chức thành 4 luồng xử lý độc lập giao tiếp qua cơ chế Qt Signals/Slots:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               KIOSK CONCURRENCY MODEL                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [ Luồng 1: GUI Main Thread (PySide6 / QML) ]                                          │
│  ├── Render máy trạng thái viền Oval (Standby / Aligning / Success / Rejected)         │
│  ├── Hiển thị kết quả điểm danh Glassmorphism (ResultCard) thời lượng 2.5s             │
│  ├── Bàn phím số ảo PIN Pad (PinPadDialog - F2) & Modal nạp mẫu In-Viewport (F3)      │
│  └── Tiếp nhận phím nóng bảo trì (F4: Chẩn đoán, F10: Cấu hình, F12: Nhật ký)          │
│       ▲ signals                                               │ signals                │
│       │ (frame_ready, match_result)                           │ (verify_pin, start_reg)│
│       ▼                                                       ▼                        │
│  [ Luồng 2: Vision & Inference Worker Thread (QThread) ]                               │
│  ├── Thu nhận camera OpenCV DirectShow (>= 15 FPS) + Watchdog tự phục hồi 3s           │
│  ├── YuNet ONNX: Phát hiện mặt >= 120x120px, kiểm tra góc Euler Yaw/Pitch/Roll <= 15° │
│  ├── Cổng kiểm chuẩn Oval: Lệch tâm <= 120px, diện tích 25-75%, giữ ổn định 0.5-1.0s   │
│  ├── MiniFASNet ONNX: Lọc thực thể sống thụ động (PAD) với S_liveness >= 0.85          │
│  ├── ArcFace MobileFaceNet: Căn chỉnh Affine 112x112, trích xuất vector 512D L2-Norm   │
│  └── FaceGalleryManager: So khớp ma trận NumPy Cosine 1:N với RAM Matrix (< 2ms)       │
│                                                                                        │
│  [ Luồng 3: Storage & Sync Worker Thread (QThread) ]                                   │
│  ├── Hàng đợi SQLite cục bộ (kiosk_local.db, chế độ WAL, busy_timeout = 5000ms)        │
│  ├── Ghi đệm giao dịch ngoại tuyến vào bảng `offline_punches` (RPO = 0)                │
│  └── Quét chu kỳ 10s: Gom lô tối đa 50 bản ghi gửi bù `sync-batch` về Backend          │
│                                                                                        │
│  [ Luồng 4: WebSocket STOMP Worker Thread (stomp.py) ]                                 │
│  ├── Duy trì kết nối WSS tới máy chủ Backend, heartbeat ping/pong                      │
│  ├── Lắng nghe topic `/topic/kiosk-gallery`: Nhận sự kiện ADD_VECTOR / REMOVE_VECTOR   │
│  └── Kích hoạt Hot-Patching cập nhật tức thời ma trận RAM không dừng ứng dụng          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Edge Vision Inference Pipeline (Chuỗi Xử lý Thị giác Máy tính Biên)

Chuỗi pipeline suy luận tuần tự được tối ưu hóa trên CPU AVX2, bảo đảm tổng thời gian tính toán thuần $\le 350\text{ ms}$:

```text
Khung hình Camera ──► [YuNet Face Detector (<= 20ms)] ──► [Oval & Stability Gate (0.5s - 1.0s)]
                             │                                  │ (Đạt chuẩn)
                             ▼                                  ▼
                   [MiniFASNet Liveness (<= 30ms)] ──► [Affine Transform (112x112)] ──► [ArcFace 512D (<= 50ms)]
                             │ (Score >= 0.85)                                        │
                             ▼                                                        ▼
                    [Người thật xác thực]                                   [Vector 512D chuẩn hóa L2]
                                                                                      │
                                                                                      ▼
                               [Kết quả Chấm công] ◄── [NumPy Cosine Matcher (M x u >= 0.50) (< 2ms)]
```

### 2.3. Zero-Disk Image Memory Lifecycle (Vòng đời Bộ nhớ Khung hình Không Ghi đĩa)

Tuân thủ nghiêm ngặt chính sách bảo vệ dữ liệu cá nhân (`SRS-004`, `NFR-SYS-007`):
* Mọi mảng khung hình `np.ndarray` thu nhận từ camera chỉ tồn tại trong bộ nhớ RAM không phân trang (locked memory buffer).
* Khung hình camera và mảng crop mặt tự động được hủy và giải phóng tường minh (`del frame`, `gc.collect()`) ngay khi kết thúc chu kỳ so khớp ($< 350\text{ ms}$).
* Tuyệt đối không ghi bất kỳ tệp hình ảnh trung gian hay ảnh chụp thô nào (`.jpg`, `.png`, `.bmp`) xuống ổ đĩa cứng của thiết bị trạm biên.
* Mức biến thiên tiêu thụ RAM của tiến trình Kiosk được kiểm soát $\Delta_{\text{RAM}} \le 10\%$ sau 8 giờ làm việc liên tục (`NFR-KSK-004`).

### 2.4. Offline-First State Machine (Máy Trạng thái Vận hành Thiết bị Biên)

Trạm Kiosk vận hành theo máy trạng thái hữu hạn với 6 trạng thái cơ bản:
1. `STANDBY`: Camera chờ người dùng, hiển thị viền Oval xanh mờ, quét nhận diện với tải thấp.
2. `ALIGNING`: Phát hiện khuôn mặt trong khung hình, viền Oval chuyển sang màu Vàng hổ phách (`#F59E0B`), kiểm tra độ lệch tâm, góc nghiêng và thời gian giữ ổn định ($0.5 - 1.0\text{ s}$).
3. `SUCCESS`: Nhận diện thành công và thực thể sống đạt chuẩn; hiển thị thẻ kết quả Glassmorphism viền Xanh ngọc (`#10B981`) trong $2.5\text{ s}$; phát âm thanh xác nhận; ghi nhận điểm danh.
4. `REJECTED`: Khuôn mặt không khớp danh mục hoặc giả mạo (viền Đỏ `#EF4444`); hiển thị thông điệp từ chối trong $2.0\text{ s}$; sau 3 lần từ chối liên tiếp gợi ý mở bàn phím PIN.
5. `COOLDOWN`: Cùng nhân viên quẹt lại trong vòng 120 giây; hiển thị thông báo giãn cách kèm đếm ngược thời gian còn lại.
6. `LOCKED`: Trạm bị phong tỏa do lệnh từ xa từ Backend hoặc phát hiện bất thường an ninh; toàn bộ giao diện bị vô hiệu hóa; mở khóa qua lệnh Backend hoặc Admin PIN local (`FR-KSK-012`).

---

## 3. Decisions (Quyết định Thiết kế Cấp Phân hệ Kiosk)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-KSK-001` | Phân tách kiến trúc thành 4 luồng độc lập qua `QThread` và Qt Signals/Slots. | Bảo đảm giao diện QML render $\ge 15\text{ FPS}$ liên tục không bị block khi luồng AI suy luận hoặc luồng mạng gặp độ trễ. | Chạy đơn luồng với `QCoreApplication.processEvents()`, Dùng module `threading` chuẩn Python | Phải tuân thủ quy tắc thread-safety của Qt; không truyền con trỏ thô giữa các luồng mà sử dụng Qt signals sao chép giá trị. | `NFR-KSK-002`, `NFR-KSK-001` | Accepted |
| `DD-KSK-002` | Kích hoạt SQLite WAL với `PRAGMA synchronous = FULL` và `busy_timeout = 5000ms`. | Cam kết không thất thoát dữ liệu ($\text{RPO} = 0$) khi mất điện đột ngột; hỗ trợ luồng đọc và luồng ghi đồng thời không bị lỗi `DatabaseLocked`. | Cấu hình `synchronous = NORMAL`, Lưu file text/JSON phẳng | Cần chạy tiến trình checkpoint dọn dẹp file WAL định kỳ để file SQLite không vượt quá 50 MB. | `FR-KSK-015`, `NFR-KSK-003`, `DD-SYS-002` | Accepted |
| `DD-KSK-003` | Quản lý danh mục khuôn mặt bằng ma trận RAM $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32` kết hợp hoán đổi con trỏ nguyên tử (Atomic Pointer Swap). | Tốc độ so khớp 1:1,000 nhân sự $< 2\text{ ms}$; nạp nóng vector mới từ STOMP tức thời mà luồng suy luận không gặp hiện tượng Race Condition. | Truy vấn CSDL SQLite mỗi lượt nhận diện, Dùng cấu trúc cây Faiss/HNSW | Tiêu tốn ~2 MB RAM cho 1,000 nhân viên; khi quy mô vượt 10,000 nhân sự mới cần phân đoạn ma trận. | `FR-KSK-003`, `FR-KSK-008`, `NFR-KSK-001` | Accepted |
| `DD-KSK-004` | Cơ chế Circuit Breaker và Lockout đa tầng tại trạm Kiosk. | Bảo vệ trạm trước tấn công brute-force PIN (khóa 15 phút sau 5 lần sai) và cách ly trạm 30 phút nếu nhận cấu hình lỗi liên tiếp > 3 lần/10 phút; hỗ trợ thoát khóa khẩn cấp qua Backend unlock hoặc Admin PIN local (`KIOSK_ADMIN_PIN`). | Khóa cứng không có đường thoát, Cho phép thử lại vô hạn | Cần cấu hình biến môi trường `KIOSK_ADMIN_PIN` an toàn và ghi audit log mọi lượt mở khóa. | `FR-KSK-004`, `FR-KSK-012`, `FR-KSK-013` | Accepted |
| `DD-KSK-005` | Quản lý biến môi trường cấu hình trạm (`KioskConfig`) bằng Windows NTFS ACL và DPAPI. | Bảo vệ Secret Token trạm không bị lộ qua lệnh xem tiến trình hay người dùng không có quyền truy cập file trên máy trạm Windows 11; không ghi log Secret Token. | Lưu token trong Registry, Lưu plaintext không phân quyền file | Script cài đặt trạm phải cấp quyền NTFS 0600 (chỉ tài khoản System/Service chạy trạm mới đọc được file cấu hình). | `FR-KSK-009`, `NFR-KSK-010`, `DD-SYS-020` | Accepted |
| `DD-KSK-006` | Vòng lặp tự phục hồi kết nối Camera (`watchdog reconnect loop`) chu kỳ 3 giây. | Đảm bảo tính sẵn sàng cao khi camera bị rung lắc giắc cắm USB hoặc chập chờn cáp tín hiệu mà không làm sập ứng dụng Kiosk. | Dừng ứng dụng khi mất camera, Thử kết nối lại tức thời gây chiếm dụng CPU | Giao diện hiển thị cảnh báo mất tín hiệu thân thiện và tự động kết nối lại trơn tru khi thiết bị cắm lại. | `FR-KSK-001`, `NFR-KSK-005`, `NFR-SYS-008` | Accepted |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Thiết bị Đầu cuối Windows 11**: Ứng dụng Kiosk được thiết kế tối ưu cho nền tảng Windows 11 Pro 64-bit, màn hình cảm ứng tỷ lệ dọc 9:16 (1080x1920 hoặc 720x1280), CPU Intel Core i5 / AMD Ryzen 5 phổ thông hỗ trợ tập lệnh AVX2.
* **Thời gian Khởi động Nguội Ngoại tuyến**: Khi khởi động lại máy trạm trong tình trạng đứt mạng, Kiosk nạp phục hồi danh mục vector từ bảng đệm `local_gallery_cache` trong SQLite WAL đã được mã hóa AES-256-GCM với Secret Token của trạm (`DATA-KSK-007`).
* **Kênh Thẩm định PIN Dự phòng Trực tuyến**: Phương thức điểm danh bằng mã PIN bắt buộc thẩm định tập trung tại Backend (`POST /api/v1/kiosk/verify-pin`). Trong kịch bản sự cố kép hy hữu (đồng thời mất mạng VÀ lỗi nhận diện khuôn mặt), nhân viên sử dụng hình thức nộp đơn giải trình công bổ sung trên Cổng Web (`FR-SYS-016`) sau khi kết nối phục hồi.
