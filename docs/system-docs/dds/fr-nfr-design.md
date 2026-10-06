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
| `SOL-SYS-019` | Bộ Quản lý Vòng đời Thông tin Xác thực Tài khoản | Sinh mật khẩu tạm ngẫu nhiên khi HR khởi tạo hồ sơ nhân sự, ép buộc đổi mật khẩu ở lần đăng nhập đầu tiên, băm một chiều mã PIN dự phòng và xác thực PIN phía máy chủ kèm khóa 15 phút sau 5 lần nhập sai. | `STK-011`, `STK-015` | `FR-SYS-017`, `DATA-SYS-016`, `SRS-005` | `DD-SYS-017` | Accepted |
| `SOL-SYS-020` | Bộ Quản lý Ca kíp & Phân ca Nhân sự | Quản lý danh mục ca (tạo/sửa/vô hiệu hóa, ân hạn 0-60 phút), phân ca theo khoảng hiệu lực, kiểm tra chồng lấn khoảng trước khi ghi, và cung cấp ca đang hiệu lực cho bộ tính công khi chấm công; nhân viên chưa được phân ca nhận trạng thái `ANOMALOUS`. | `STK-011`, `STK-012` | `FR-SYS-018`, `DATA-SYS-002`, `DATA-SYS-003`, `DATA-SYS-017` | `DD-SYS-018`, `DD-SYS-007` | Accepted |

---

## 2. Quality & Resilience Mechanisms (Cơ chế Đảm bảo Chất lượng)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SOL-SYS-014` | Cơ chế Miễn nhiễm Rò rỉ Bộ nhớ (Zero Memory Leak) | Giải phóng mảng khung hình `np.ndarray` và ma trận điểm ảnh trung gian ngay sau mỗi chu kỳ suy luận; duy trì RAM ứng dụng Kiosk $\le 600\text{ MB}$ sau 10,000 khung hình. | `STK-001`, `STK-008` | `NFR-SYS-009` | `DD-SYS-001` | Accepted |
| `SOL-SYS-015` | Cơ chế Tách biệt Luồng Giao diện (GUI Thread Isolation) | Đẩy toàn bộ tác vụ đọc camera, suy luận ONNX, đọc/ghi SQLite và gọi HTTP/STOMP sang worker `QThread` độc lập; đảm bảo luồng giao diện QML render $\ge 30\text{ FPS}$ không giật lag. | `STK-001`, `STK-002` | `NFR-SYS-002` | `DD-SYS-001` | Accepted |
| `SOL-SYS-016` | Cơ chế Tự Phục hồi Camera Ngoại vi (Camera Auto-Reconnect) | Phát hiện mất tín hiệu video liên tiếp 10 frames hoặc camera bị ngắt kết nối; kích hoạt vòng lặp kết nối lại mỗi 3 giây mà không làm sập tiến trình Kiosk. | `STK-001`, `STK-003` | `NFR-SYS-008` | `DD-SYS-001` | Accepted |

---

## 3. Behavior & Processing Flows (Luồng Xử lý Nghiệp vụ & Trạng thái)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SOL-SYS-017` | Luồng Điều phối Pipeline AI Biên Tuần tự | Thu nhận frame $\rightarrow$ YuNet phát hiện & kiểm tra góc $\le 15^\circ$ $\rightarrow$ Căn chỉnh Oval $0.5 - 1.0\text{ s}$ $\rightarrow$ MiniFASNet $S_{\text{liveness}} \ge 0.85$ $\rightarrow$ ArcFace 512D $\rightarrow$ Cosine Matcher $\ge 0.50$ trong $\le 350\text{ ms}$. | `SOL-SYS-001`, `SOL-SYS-002`, `SOL-SYS-003`, `SOL-SYS-004`, `SOL-SYS-005`, `SOL-SYS-006` | `FR-SYS-001`, `FR-SYS-002`, `FR-SYS-003`, `NFR-SYS-001` | `DD-SYS-001`, `DD-SYS-005` | Accepted |
| `SOL-SYS-018` | Luồng Kiểm soát Quét Trùng Hai Lớp (Dual Cooldown) | Khi nhận diện thành công: Lớp 1 kiểm tra mảng bộ nhớ Kiosk $\ge 120\text{ s}$; Lớp 2 gửi Backend kiểm tra Caffeine Cache (TTL 120s khóa `empId_punchDate`), từ chối nếu vi phạm. | `SOL-SYS-007` | `FR-SYS-005` | `DD-SYS-006` | Accepted |

---

## 4. Solution Design Decisions (Quyết định Thiết kế Giải pháp)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-SYS-005` | Thiết lập thời gian giữ ổn định khuôn mặt trong khung Oval từ 0.5s đến 1.0s trước khi kích hoạt nhận diện. | Tránh chụp nhòe hoặc nhận diện nhầm khi người dùng đang di chuyển ngang qua camera. | Nhận diện tức thì không chờ ổn định, Yêu cầu bấm nút vật lý | Người dùng phải dừng lại nhìn thẳng 0.5s-1.0s nhưng loại bỏ triệt để ảnh nhòe motion blur. | `FR-SYS-001`, `UI-SYS-001` | Accepted |
| `DD-SYS-006` | Áp dụng kiểm soát Cooldown 120s ở cả hai tầng: Kiosk RAM đếm lùi và Backend Caffeine Cache. | Chống quẹt trùng lặp hiệu quả ngay cả khi mất mạng nội bộ hoặc nhiều trạm gửi song song. | Chỉ kiểm tra tại Backend, Chỉ kiểm tra tại Kiosk | Giữ trạng thái Cooldown trong bộ nhớ 120s; từ chối quẹt lặp tức thì không tốn I/O CSDL. | `FR-SYS-005`, `NFR-SYS-007` | Accepted |
| `DD-SYS-007` | Cấu hình thời gian ân hạn ca kíp mặc định là 15 phút. | Phù hợp văn hóa làm việc doanh nghiệp và tránh ùn tắc đầu ca tại sảnh ra vào. | Không có ân hạn (chấm trễ 1 phút tính Late), Ân hạn 30 phút | Cần tính toán `lateMinutes` sau khi trừ đi 15 phút ân hạn cho các bản ghi đi muộn. | `FR-SYS-012`, `INF-001` | Accepted |
| `DD-SYS-008` | Tự động kiểm tra và chèn ký tự escape `'` trước các chuỗi bắt đầu bằng `=`, `+`, `-`, `@` khi xuất file `.xlsx`. | Vô hiệu hóa triệt để nguy cơ tấn công chèn mã độc thực thi công thức Excel (CWE-1236). | Xuất text thô không lọc, Chặn không cho nhập ký tự đặc biệt | Bảo vệ máy tính nhân sự an toàn trước mã độc khi mở báo cáo bằng MS Excel. | `FR-SYS-016`, `SRS-007` | Accepted |
| `DD-SYS-017` | Cấp mật khẩu ban đầu bằng mật khẩu tạm do hệ thống sinh, buộc nhân viên đổi ở lần đăng nhập đầu tiên; mã PIN dự phòng do nhân viên tự thiết lập và được xác thực ở phía máy chủ. | Không cần bổ sung hạ tầng gửi thư điện tử; HR không phải nghĩ hoặc ghi nhớ mật khẩu của nhân viên; mọi tài khoản đều kết thúc bằng mật khẩu cá nhân do nhân viên tự chọn. Xác thực PIN tại máy chủ giúp hash PIN không bao giờ rời khỏi Backend. | HR tự nhập mật khẩu ban đầu; gửi email kèm liên kết đặt mật khẩu (cần bổ sung mail stack); xác thực PIN cục bộ tại Kiosk bằng hash tải kèm Gallery | Phát sinh cờ trạng thái buộc đổi mật khẩu và giao diện đổi mật khẩu; HR phải bàn giao mật khẩu tạm chỉ hiển thị một lần; Kiosk bắt buộc gọi Backend trước khi ghi nhận điểm danh bằng PIN nên luồng PIN cần kết nối mạng. | `FR-SYS-017`, `API-SYS-021`, `SRS-005` | Accepted |
| `DD-SYS-018` | Kiểm tra chồng lấn lịch phân ca ở tầng nghiệp vụ trong một giao dịch có khóa theo nhân viên, thay vì chỉ dựa vào ràng buộc loại trừ của PostgreSQL. | PostgreSQL cần extension `btree_gist` cho `EXCLUDE USING gist` trên khoảng ngày — không chạy được trên profile kiểm thử H2 và thêm phụ thuộc vận hành; kiểm tra nghiệp vụ cho thông điệp lỗi rõ ràng (HTTP 409) và kiểm thử được ở mọi môi trường. | Chỉ dùng `EXCLUDE USING gist` (cần extension, không chạy trên H2); không kiểm tra chồng lấn (cho phép dữ liệu công sai lệch) | Cần khóa theo `user_id` khi tạo/sửa phân ca để tránh race condition giữa hai yêu cầu đồng thời; bổ sung chỉ mục `(user_id, effective_from, effective_to)` và ca kiểm thử âm cho chồng lấn. | `FR-SYS-018`, `DATA-SYS-017`, `DATA-SYS-003` | Accepted |

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Chuẩn hoá Đầu vào Mô hình MiniFASNet**: Ảnh khuôn mặt crop mở rộng tỷ lệ 1.5x phải được giữ đúng chuẩn mảng số thực BGR hoặc chia tỷ lệ theo chuẩn train model. Bộ lọc liveness loại bỏ ảnh in 2D và video màn hình với ngưỡng chặn $S_{\text{liveness}} \ge 0.85$.
* **Cơ chế Atomic Swap Ma trận RAM**: Khi có cập nhật danh mục khuôn mặt từ STOMP, ma trận mới được tạo và hoán đổi con trỏ nguyên tử (Atomic Pointer Swap) để đảm bảo luồng suy luận camera đọc liên tục không gặp hiện tượng Race Condition.
