---
title: Thiết kế Hiện thực Hóa Giải pháp Chức năng & Phi chức năng (FR/NFR)
version: 1.0
status: Approved
owner: Solution Architect
---

# FR/NFR DESIGN — Thiết kế Hiện thực Hóa Giải pháp Chức năng & Phi chức năng

Thiết kế chi tiết các thành phần giải pháp kỹ thuật (`SOL-SYS-`), thuật toán xử lý logic và cơ chế đảm bảo các thuộc tính chất lượng (NFR) nhằm hiện thực hóa trọn vẹn 16 yêu cầu chức năng của hệ thống.

---

## 1. Solution Components & Architecture (Thành phần Kỹ thuật Giải pháp)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SOL-SYS-001` | Bộ Thu nhận Luồng Video Độ trễ thấp | Khởi tạo kết nối camera quang học UVC với driver DirectShow, thu nhận mảng khung hình NumPy liên tục $\ge 15\text{ FPS}$. | `STK-001`, `STK-003` | `FR-SYS-001`, `NFR-SYS-002` | `DD-SYS-001` | Accepted |
| `SOL-SYS-002` | Bộ Phát hiện & Kiểm chuẩn Góc Euler | Nạp mô hình ONNX YuNet, định vị khuôn mặt $\ge 120\times 120\text{ px}$, đo 5 điểm mốc và kiểm tra góc quay Yaw, Pitch, Roll $\le 15^\circ$. | `STK-004`, `STK-005` | `FR-SYS-001`, `NFR-SYS-004` | `DD-SYS-001` | Accepted |
| `SOL-SYS-003` | Cổng Căn chỉnh Oval & Độ Ổn định Thời gian | Tính toán độ lệch tâm ($\le 120\text{ px}$), tỷ lệ diện tích ($25\% - 75\%$), độ sắc nét Laplacian ($\ge 30$) và duy trì ổn định liên tục $0.5 - 1.0\text{ s}$. | `STK-001`, `STK-003` | `FR-SYS-001`, `UI-SYS-001` | `DD-SYS-005` | Accepted |
| `SOL-SYS-004` | Cổng Lọc Thực thể sống Thụ động (PAD Gate) | Crop vùng mặt mở rộng tỷ lệ 1.5x, đưa qua mô hình MiniFASNet tính điểm $S_{\text{liveness}} \ge 0.85$ để chặn ảnh in 2D và video. | `STK-004`, `STK-006` | `FR-SYS-002`, `NFR-SYS-005` | `DD-SYS-003` | Accepted |
| `SOL-SYS-005` | Bộ Trích xuất Vector Đặc trưng 512D | Căn chỉnh hình học Affine 5 điểm mốc về chuẩn $112\times 112\text{ px}$, chạy ArcFace MobileFaceNet sinh vector 512D chuẩn hóa L2 Norm. | `STK-004`, `STK-007` | `FR-SYS-003`, `DATA-SYS-010` | `DD-SYS-001` | Accepted |
| `SOL-SYS-006` | Bộ So khớp Danh mục Ma trận RAM | Duy trì ma trận $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32`, tính tích vô hướng Cosine $\vec{s} = \vec{u} \cdot \mathbf{M}^T$ qua NumPy trong thời gian $< 2\text{ ms}$. | `STK-008` | `FR-SYS-003`, `NFR-SYS-001` | `DD-SYS-001` | Accepted |
| `SOL-SYS-007` | Bộ Kiểm soát Cooldown Hai lớp (Dual-layer) | Lớp 1 tại biên (Kiosk RAM đếm lùi 120s); Lớp 2 tại máy chủ (Caffeine Cache với TTL 120s khóa `empId_punchDate`). | `STK-008`, `STK-013` | `FR-SYS-005` | `DD-SYS-006` | Accepted |
| `SOL-SYS-008` | Bộ Quản lý Hàng đợi Bền vững SQLite WAL | Mở kết nối `kiosk_local.db` chế độ WAL, thực thi `enqueue_punch()`, `fetch_unsynced_batch()`, `mark_synced()` không nghẽn. | `STK-009` | `FR-SYS-006`, `NFR-SYS-006` | `DD-SYS-002` | Accepted |
| `SOL-SYS-009` | Bộ Mã hóa Sinh trắc học AES-256-GCM | Sử dụng thư viện bảo mật mã hóa vector 512D (2048 bytes gốc) thành ciphertext kèm IV ngẫu nhiên 12 bytes và Auth Tag 16 bytes. | `STK-015` | `FR-SYS-010`, `SRS-001` | `DD-SYS-003` | Accepted |
| `SOL-SYS-010` | Tác vụ Tiêu hủy Dữ liệu Định kỳ 20 ngày | Lên lịch Spring `@Scheduled(cron = "0 0 1 * * ?")` quét CSDL xóa sạch bản ghi `biometric_templates` của nhân viên thôi việc quá 20 ngày. | `STK-010`, `STK-011` | `FR-SYS-011`, `DATA-SYS-013` | `DD-SYS-003` | Accepted |
| `SOL-SYS-011` | Bộ Tính toán Ca kíp & Thời gian Ân hạn | Đối soát mốc giờ chấm công với cấu hình `shifts`, cộng 15 phút ân hạn (`grace_period_minutes`) để phân loại `ON_TIME / LATE`. | `STK-011` | `FR-SYS-012` | `DD-SYS-007` | Accepted |
| `SOL-SYS-012` | Bộ Điều phối Sự kiện Đẩy WebSocket STOMP | Tích hợp Spring WebSocket Message Broker, đóng gói và phát tán thông điệp JSON tới các topic `/topic/live-attendance` và `/topic/kiosk-gallery`. | `STK-014` | `FR-SYS-013`, `FR-SYS-014` | `DD-SYS-004` | Accepted |
| `SOL-SYS-013` | Bộ Xuất Báo cáo Excel Chống Formula Injection | Sử dụng Apache POI sinh file `.xlsx`, tự động kiểm tra và chèn ký tự `'` trước các chuỗi bắt đầu bằng `=`, `+`, `-`, `@`. | `STK-011` | `FR-SYS-016`, `SRS-007` | `DD-SYS-008` | Accepted |

---

## 2. Quality & Resilience Mechanisms (Cơ chế Đảm bảo Chất lượng)

1. **Cơ chế Miễn nhiễm Rò rỉ Bộ nhớ (Zero Memory Leak Mechanism)**:
   * Mọi mảng khung hình `np.ndarray` thu được từ OpenCV và các ma trận điểm ảnh trung gian được giải phóng hoàn toàn ngay sau mỗi chu kỳ suy luận. Bộ nhớ RAM ứng dụng Kiosk được giám sát duy trì ổn định $\le 600\text{ MB}$ sau 10,000 khung hình liên tục.
2. **Cơ chế Tách biệt Luồng Giao diện (GUI Thread Isolation)**:
   * Toàn bộ tác vụ nặng (đọc camera, suy luận ONNX, đọc/ghi SQLite, gọi mạng HTTP/STOMP) được thực thi trong các luồng nền độc lập (`QThread` trên Kiosk, `Virtual Threads` trên Backend Java 21), bảo đảm luồng giao diện chính đạt tốc độ render $\ge 30\text{ FPS}$ không giật lag.
3. **Cơ chế Tự Phục hồi Camera Ngoại vi (Camera Reconnect Loop)**:
   * Khi cảm biến camera bị rút đột ngột hoặc mất tín hiệu liên tiếp 10 khung hình, bộ thu nạp video tự động chuyển sang chế độ phục hồi, kích hoạt vòng lặp kết nối lại mỗi 3 giây mà không làm sập ứng dụng.

---

## 3. Solution Design Decisions (Quyết định Thiết kế Giải pháp)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DD-SYS-005` | Ngưỡng giữ ổn định khuôn mặt trong Oval | Thiết lập thời gian giữ ổn định khuôn mặt trong khung Oval từ 0.5s đến 1.0s trước khi kích hoạt nhận diện nhằm tránh nhận nhầm khi đang di chuyển. | `STK-001`, `STK-003` | `FR-SYS-001`, `UI-SYS-001` | - | Accepted |
| `DD-SYS-006` | Kiểm soát Cooldown 120s hai tầng | Áp dụng kiểm soát Cooldown 120s ở cả 2 tầng: Kiosk Client (RAM) và Backend Server (Caffeine Cache) chống quẹt trùng lặp. | `STK-008`, `STK-013` | `FR-SYS-005` | - | Accepted |
| `DD-SYS-007` | Thời gian ân hạn ca kíp mặc định 15 phút | Cấu hình thời gian ân hạn ca kíp mặc định là 15 phút phù hợp văn hóa làm việc và tránh ùn tắc giờ cao điểm. | `STK-011` | `FR-SYS-012`, `INF-001` | - | Accepted |
| `DD-SYS-008` | Khử mã độc Formula Injection trong file Excel | Tự động kiểm tra và chèn ký tự escape `'` trước các chuỗi bắt đầu bằng `=`, `+`, `-`, `@` khi xuất file `.xlsx`. | `STK-011` | `FR-SYS-016`, `SRS-007` | - | Accepted |
