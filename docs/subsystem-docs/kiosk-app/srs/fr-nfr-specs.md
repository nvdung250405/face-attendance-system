---
title: Kiosk FR/NFR Specifications
version: 1.1
status: Approved
owner: Edge Vision Lead & Requirements Analyst
---

# FR/NFR SPECS — Đặc tả Yêu cầu Chức năng & Phi chức năng Phân hệ Kiosk

Tài liệu xác lập toàn bộ các yêu cầu chức năng (`FR-KSK-`) và phi chức năng (`NFR-KSK-`) của trạm điểm danh cận biên `kiosk-app` theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §7.2), được phân tích dựa trên chu trình tương tác thực tế của các tác nhân (`ACT-001`, `ACT-003`).

---

## 1. Actor Lifecycle & Operational Context (Ngữ cảnh & Vòng đời Tác nhân)

Phân hệ Kiosk tương tác trực tiếp với hai tác nhân chủ đạo:
* **Nhân viên Điểm danh (`ACT-001`)**:
  1. *Tiếp cận & Định vị*: Bước vào vùng quan sát trạm ($0.6 - 1.2\text{ m}$), căn chỉnh khuôn mặt vào khung Oval chỉ báo 4 màu.
  2. *Điểm danh Sinh trắc học*: Giữ tư thế ổn định ($0.5 - 1.0\text{ s}$), hệ thống thực thi kiểm tra liveness thụ động và so khớp Cosine 1:N trong RAM.
  3. *Tiếp nhận Kết quả & Cooldown*: Nhận phản hồi âm thanh và hiển thị thẻ kết quả ($2.5\text{ s}$); kích hoạt bộ đệm Cooldown 120s chống quẹt dồn dập.
  4. *Điểm danh Dự phòng bằng Mã PIN*: Khi khuôn mặt không khớp hoặc nhân viên đã rút Informed Consent (vô hiệu hóa sinh trắc học theo Nghị định 356/2025/NĐ-CP), chạm F2/nút PIN Pad, nhập mã PIN 6 số để thẩm định trực tuyến qua Backend.
  5. *Tự Đăng ký Khuôn mặt (Onboarding)*: Nhân viên mới tiếp nhận mã OTP 48h từ Cổng Web, thực hiện quy trình tự đăng ký In-Viewport 3 bước để nạp vector mẫu ban đầu.
* **Quản trị viên Hệ thống / Kỹ thuật viên Vận hành Trạm (`ACT-003`)**:
  1. *Khởi động & Nạp Danh mục (Cold Start)*: Nạp biến môi trường cấu hình, khởi tạo camera DirectShow $\ge 15\text{ FPS}$, tải danh mục vector từ Backend hoặc nạp fallback từ `local_gallery_cache` cục bộ khi mất mạng.
  2. *Đồng bộ Thời gian thực & Ngoại tuyến*: Lắng nghe kênh STOMP nạp nóng vector mới; tự động chuyển sang hàng đợi SQLite WAL khi mất mạng ($\text{RPO} = 0$) và tự gửi bù theo lô tối đa 50 bản ghi khi có mạng lại.
  3. *Ổn định & Quyền Riêng tư*: Đảm bảo vòng lặp AI vận hành liên tục 8h không rò rỉ RAM ($\Delta_{\text{RAM}} \le 10\%$), watchdog tự kết nối lại camera sau 3s khi mất tín hiệu cáp, và tuyệt đối không lưu ảnh thô trên đĩa.

---

## 2. Functional Requirements (Yêu cầu Chức năng Kiosk)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-KSK-001` | Trạm Kiosk phải thu nhận khung hình video $\ge 15\text{ FPS}$ và phát hiện khuôn mặt thời gian thực qua YuNet. | Vision | Must | `FR-SYS-001`, `ARC-001` | Phát hiện mặt $\ge 120\times 120\text{ px}$; trả về bounding box và 5 điểm mốc; góc Euler Yaw, Pitch, Roll $\le 15^\circ$. | Approved |
| `FR-KSK-002` | Trạm Kiosk phải kiểm tra thực thể sống thụ động qua MiniFASNet để chặn đứng ảnh in 2D và video phát lại. | Vision / PAD | Must | `FR-SYS-002`, `ARC-001` | Điểm số liveness $S \ge 0.85$; thời gian suy luận $\le 30\text{ ms}$; chặn ảnh in và video đạt $\ge 98\%$ ($\text{APCER} \le 2.0\%$). | Approved |
| `FR-KSK-003` | Trạm Kiosk phải trích xuất vector 512D chuẩn hóa L2 Norm qua ArcFace và so khớp Cosine 1:N trong RAM. | Vision / Identity | Must | `FR-SYS-003`, `ARC-001` | Ngưỡng Cosine $\ge 0.50$; thời gian so khớp ma trận RAM 1,000 nhân sự $< 2\text{ ms}$; $\text{FNIR} \le 5.0\%$ tại $\text{FPIR} \le 0.1\%$ (tương đương $\text{TAR} \ge 95\%$ theo chuẩn ISO/IEC 19795-1). | Approved |
| `FR-KSK-004` | Trạm Kiosk phải cung cấp bàn phím số ảo PIN dự phòng và **thẩm định mã PIN qua Backend** (`POST /api/v1/kiosks/{id}/verify-pin`) trước khi ghi nhận điểm danh; với nhân sự đã rút Informed Consent (khuôn mặt bị vô hiệu hoá) thì PIN là phương thức điểm danh duy nhất. | Fallback / Security | Must | `FR-SYS-004`, `FR-SYS-017`, `FR-SYS-025`, `ARC-001`, `ACT-001` | Bàn phím số $3\times 4$ với phím $\ge 60\times 60\text{ px}$; chỉ tạo bản ghi điểm danh sau khi Backend trả HTTP 200; PIN sai (401 `PIN_INVALID`) hiển thị lỗi và **không** tạo bản ghi; PIN đang bị khoá (423 `PIN_LOCKED`) hiển thị đếm ngược theo `lockedUntil` do Backend trả về; thao tác thẩm định PIN không bao giờ dùng PIN làm định danh nhân sự tại chỗ. | Approved |
| `FR-KSK-005` | Trạm Kiosk phải áp dụng bộ đệm Cooldown 120 giây tại biên để chặn quẹt dồn dập. | Business Rule | Should | `FR-SYS-005`, `ARC-001`, `ARC-002` | Ghi nhớ mốc thời gian quẹt thành công trong RAM; từ chối quẹt tiếp trong 120s; hiển thị thông báo "Đã ghi nhận". | Approved |
| `FR-KSK-006` | Trạm Kiosk phải lưu trữ đệm vào SQLite WAL khi mất mạng và tự động đồng bộ bù khi có mạng lại. | Resiliency | Must | `FR-SYS-006`, `SRS-008`, `ARC-001` | Cam kết không mất dữ liệu ($\text{RPO} = 0$); khi có mạng, gom lô tối đa 50 bản ghi gửi bù thành công 100%. | Approved |
| `FR-KSK-007` | Trạm Kiosk phải thực hiện quy trình tự đăng ký In-Viewport 3 bước tiếp nhận mã OTP từ Cổng Web. | Enrollment / UX | Must | `FR-SYS-008`, `FR-SYS-009`, `ARC-001`, `ACT-003` | Bước 1 xác minh OTP; Bước 2 tự ẩn popup chụp 3 ảnh chuẩn trên camera chính ($S_{\text{liveness}} \ge 0.85$); Bước 3 nạp nóng vector vào RAM. | Approved |
| `FR-KSK-008` | Trạm Kiosk phải lắng nghe kênh STOMP `/topic/kiosk-gallery` để nạp nóng vector mới vào RAM. | Realtime Sync | Must | `FR-SYS-014`, `ARC-006` | Cập nhật ma trận RAM tức thời qua Atomic Swap mà không cần khởi động lại ứng dụng; hỗ trợ cả thao tác ADD và DELETE vector. | Approved |

---

## 3. Non-functional Requirements (Yêu cầu Phi chức năng Kiosk)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-KSK-001` | Tổng thời gian chu kỳ nhận diện trọn vòng (Phát hiện + Liveness + Trích xuất 512D + So khớp RAM) đạt $\le 350\text{ ms}$. | Performance | Must | `NFR-SYS-001`, `ARC-001` | Đo kiểm trên CPU Intel Core i5 / AMD Ryzen 5 phổ thông với tập lệnh AVX2. | Approved |
| `NFR-KSK-002` | Luồng hiển thị video QML/PySide6 duy trì tốc độ $\ge 15\text{ FPS}$ (khuyến nghị $30\text{ FPS}$) liên tục, không nghẽn luồng. | Performance | Must | `NFR-SYS-002`, `ARC-001` | Luồng đọc camera và suy luận AI chạy trong `QThread` độc lập với luồng giao diện chính. | Approved |
| `NFR-KSK-003` | Tỷ lệ mất mát bản ghi điểm danh ngoại tuyến khi mất mạng hoặc cúp điện đột ngột là $0\%$ ($\text{RPO} = 0$). | Reliability | Must | `NFR-SYS-006`, `SRS-008`, `ARC-001` | Chế độ ghi trước nhật ký SQLite WAL với `PRAGMA synchronous = FULL;` bảo toàn dữ liệu 100%; tự phục hồi khi mở lại app. | Approved |
| `NFR-KSK-004` | Ứng dụng Kiosk vận hành liên tục 8 giờ với độ biến thiên bộ nhớ RAM không quá $10\%$ (Zero Memory Leak). | Reliability | Must | `NFR-SYS-009`, `ARC-001` | Mọi mảng khung hình `np.ndarray` được giải phóng sau mỗi chu kỳ; RAM duy trì $\le 600\text{ MB}$ (quy định biên chặt chẽ hơn trần $< 800\text{ MB}$ của `NFR-SYS-009` nhằm thích ứng phần cứng nhúng mini PC). | Approved |
| `NFR-KSK-005` | Tự động phục hồi kết nối camera vật lý trong vòng $\le 3\text{ giây}$ khi bị lỏng giắc hoặc ngắt tín hiệu. | Robustness | Must | `INF-006`, `ARC-012`, `RSK-001` | Vòng lặp `watchdog reconnect loop` tự thử lại mỗi 3s mà không làm treo hoặc sập ứng dụng. | Approved |

