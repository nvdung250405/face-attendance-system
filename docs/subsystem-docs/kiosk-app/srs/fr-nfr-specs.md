---
title: Kiosk FR/NFR Specifications
version: 1.1
status: Approved
owner: Edge Vision Lead & Requirements Analyst
---

# FR/NFR SPECS — Đặc tả Yêu cầu Chức năng & Phi chức năng Phân hệ Kiosk

Tài liệu xác lập toàn bộ các yêu cầu chức năng (`FR-KSK-`) và phi chức năng (`NFR-KSK-`) của trạm điểm danh cận biên `kiosk-app` theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §7.2), được phân tích dựa trên chu trình tương tác thực tế của các tác nhân con người (`ACT-001`, `ACT-003`) và ngữ cảnh tích hợp ngoại vi (`Backend Service`, `EXT-001`, `EXT-003`).

---

## 1. Actor Lifecycle & Operational Context (Ngữ cảnh & Vòng đời Tác nhân)

Phân hệ Kiosk vận hành như một thiết bị trạm biên tự phục vụ (Self-service Edge Station), kế thừa và tham chiếu trực tiếp các vai trò tác nhân và thực thể ngoại vi được chuẩn hóa tại cấp toàn hệ thống ([srs.md](../../../system-docs/srs/srs.md)):

* **Tác nhân Con người (Human Actors)**:
  * **[`ACT-001`](../../../system-docs/srs/srs.md) — Nhân viên (Employee)** *(Kế thừa từ [srs.md](../../../system-docs/srs/srs.md#L27) §1.1 và [fr-nfr-specs.md](../../../system-docs/srs/fr-nfr-specs.md#L18) §1.1)*: Tác nhân chính thực hiện các tương tác điểm danh khuôn mặt, điểm danh dự phòng bằng mã PIN và tự đăng ký mẫu mặt qua OTP.
  * **[`ACT-003`](../../../system-docs/srs/srs.md) — Quản trị viên Hệ thống (System Admin)** *(Kế thừa từ [srs.md](../../../system-docs/srs/srs.md#L29) §1.1 và [fr-nfr-specs.md](../../../system-docs/srs/fr-nfr-specs.md#L63) §1.3)*: Tác nhân chịu trách nhiệm cấu hình thiết bị trạm, quản lý biến môi trường, thao tác phím nóng bảo trì tại chỗ và xử lý sự cố phần cứng.
* **Ngữ cảnh Tích hợp Ngoại vi (External Systems & Hardware Context)**:
  * **Dịch vụ Máy chủ Trung tâm (`Backend Service`)** *(Kế thừa từ [dds.md](../../../system-docs/dds/dds.md) qua các cầu nối kiến trúc `ARC-001`, `ARC-002`, `ARC-005`, `ARC-006`)*: Đối tác cung cấp dịch vụ RESTful API và kênh WebSocket STOMP Broker hai chiều cho Kiosk.
  * **[`EXT-001`](../../../system-docs/srs/srs.md) — Camera Quang học UVC / Webcam** *(Kế thừa từ [srs.md](../../../system-docs/srs/srs.md#L38) §1.2)*: Thiết bị phần cứng USB cung cấp luồng khung hình video liên tục $\ge 15\text{ FPS}$ qua DirectShow.
  * **[`EXT-003`](../../../system-docs/srs/srs.md) — Nguồn Chuẩn Giờ Mạng NTP** *(Kế thừa từ [srs.md](../../../system-docs/srs/srs.md#L40) §1.2)*: Dịch vụ mạng đồng bộ mốc thời gian hệ thống chuẩn giữa Kiosk và Backend với sai lệch $\le 50\text{ ms}$.

### 1.1. Hành vi Tương tác của Tác nhân Con người (Human Actors Direct Interactions)

Mục này phân tích và liệt kê chi tiết các hành vi tác động trực tiếp của con người lên giao diện, thiết bị và phản hồi tương ứng của phân hệ Kiosk:

* **Nhân viên ([`ACT-001`](../../../system-docs/srs/srs.md) — Employee)**:
  1. *Điểm danh Khuôn mặt Không chạm (Touchless Face Attendance)*:
     * **Hành vi tác nhân**: Bước vào vùng quan sát trạm ($0.6 - 1.2\text{ m}$), hướng khuôn mặt thẳng vào camera, căn chỉnh khuôn mặt vào khung Oval (đảm bảo góc nghiêng Yaw, Pitch, Roll $\le 15^\circ$) và duy trì tư thế ổn định từ $0.5 - 1.0\text{ s}$.
     * **Phản hồi của Kiosk**: Khung Oval chuyển trạng thái từ viền xám tĩnh (`Standby`) $\rightarrow$ viền vàng nhịp thở (`Aligning`) $\rightarrow$ viền xanh kèm tia quét laser dọc, âm báo "Tít" 880Hz và thẻ thông tin nhân viên (`Success`, hiển thị $2.5\text{ s}$) nếu nhận diện thành công; hoặc viền đỏ rung lắc 300ms kèm âm cảnh báo trầm 300Hz (`Rejected`) nếu phát hiện giả mạo hoặc không khớp danh mục. Kiosk kích hoạt bộ đệm Cooldown 120s trong RAM để chặn quẹt dồn dập.
  2. *Điểm danh Dự phòng bằng Mã PIN (Fallback PIN Attendance)*:
     * **Hành vi tác nhân**: Chạm nút PIN trên màn hình cảm ứng (hoặc bấm phím vật lý `F2`), chạm ô nhập Mã nhân viên (`employeeCode`), chạm bàn phím số ảo với phím bấm lớn $88\times 88\text{ px}$ để nhập mã PIN cá nhân 6 số, sau đó chạm nút "Xác nhận". (Áp dụng khi khuôn mặt không khớp, ánh sáng bất lợi hoặc nhân sự đã rút Informed Consent theo Nghị định 356/2025/NĐ-CP).
     * **Phản hồi của Kiosk**: Hiển thị lớp phủ làm mờ hậu cảnh 16px, gửi giao dịch thẩm định lên Backend qua `API-KSK-007`; nhận HTTP 200 $\rightarrow$ ghi nhận điểm danh và hiển thị thẻ kết quả; nhận HTTP 401 $\rightarrow$ rung nhẹ bàn phím, hiển thị số lần thử còn lại; nhận HTTP 423 $\rightarrow$ tạm khóa bàn phím và đếm ngược thời gian mở khóa theo `lockedUntil`.
  3. *Tự Kích hoạt & Đăng ký Khuôn mặt In-Viewport (Self-Onboarding Face Enrollment)*:
     * **Hành vi tác nhân**: Chạm nút "Đăng ký khuôn mặt" (hoặc bấm phím `F3`), nhập mã Onboarding OTP 6 chữ số (được cấp từ Web Portal sau khi ký Consent), đứng thẳng trước camera căn chỉnh vào khung Oval theo chỉ dẫn để hệ thống tự động chụp 3 ảnh chuẩn, sau đó chạm xác nhận hoàn tất.
     * **Phản hồi của Kiosk**: Xác thực mã OTP qua `API-KSK-004`; tự động ẩn popup để lộ trọn vẹn luồng camera chính; kiểm chuẩn chất lượng ảnh (độ nét Laplacian $\ge 30$, góc nghiêng $\le 15^\circ$, liveness $S \ge 0.85$); trích xuất vector 512D gửi lên Backend qua `API-KSK-005` kèm `idempotencyKey`; nạp nóng tức thời vector vào RAM Kiosk và cập nhật snapshot đệm `local_gallery_cache`.
  4. *Hủy bỏ & Thoát Hộp thoại (Dismiss / Cancel Dialogs)*:
     * **Hành vi tác nhân**: Chạm nút "Đóng / Hủy" (Target Size $\ge 48\times 48\text{ px}$), chạm vùng mờ hậu cảnh ngoài hộp thoại, hoặc bấm phím `Esc` trên bàn phím.
     * **Phản hồi của Kiosk**: Đóng hộp thoại PIN Pad hoặc hộp thoại Đăng ký tức thời, giải phóng giao diện và quay về luồng camera giám sát liên tục (`Standby`).

* **Quản trị viên Hệ thống ([`ACT-003`](../../../system-docs/srs/srs.md) — System Admin)**:
  1. *Khởi tạo Cấu hình Biên & Kích hoạt Trạm (Station Provisioning & Startup)*:
     * **Hành vi tác nhân**: Đăng nhập hệ điều hành máy trạm (Windows 11 IoT / Enterprise), thiết lập tệp cấu hình môi trường `.env` (chỉ định index camera DirectShow `CAMERA_DEVICE_INDEX=0`, URL Backend, Secret Token trạm được cấp một lần từ Web Portal, ngưỡng liveness `0.85`, ngưỡng cosine `0.50`, cooldown `120s`), bảo vệ tệp bằng phân quyền hệ điều hành (Windows NTFS ACL / DPAPI) và kích hoạt ứng dụng Kiosk ở chế độ toàn màn hình (Kiosk Fullscreen Mode).
     * **Phản hồi của Kiosk**: Đọc biến môi trường, kiểm tra phần cứng camera, kết nối Backend kéo danh mục gallery khởi động qua `API-KSK-003`, nạp ma trận RAM và hiển thị màn hình chính Standby sẵn sàng phục vụ.
  2. *Thao tác Phím nóng Điều khiển & Hỗ trợ Khẩn cấp tại Chỗ (Maintenance Hotkey Control)*:
     * **Hành vi tác nhân**: Sử dụng bàn phím vật lý kết nối vào Kiosk để bấm các phím chức năng khẩn cấp:
       - Phím `F2`: Mở/đóng nhanh hộp thoại PIN Pad để hỗ trợ nhân viên điểm danh khi màn hình cảm ứng gặp vấn đề điểm chạm.
       - Phím `F3`: Kích hoạt hộp thoại nhập OTP nạp khuôn mặt cho nhân viên mới.
       - Phím `Esc`: Buộc đóng toàn bộ hộp thoại đang mở khi có người dùng bỏ dở phiên thao tác.
     * **Phản hồi của Kiosk**: Nhận sự kiện phím tắt phần cứng PySide6/QML và chuyển đổi trạng thái giao diện tức thời mà không làm gián đoạn luồng video camera.
  3. *Xử lý Phần cứng, Căn chỉnh Camera & Phục hồi Sự cố (Hardware Maintenance & Incident Recovery)*:
     * **Hành vi tác nhân**: Căn chỉnh góc nghiêng và độ cao vật lý của camera UVC; cắm lại giắc cáp USB camera khi bị lỏng hoặc thay thế thiết bị; tra cứu tệp nhật ký ứng dụng cục bộ (`logs/kiosk_app.log`) để điều tra nguyên nhân khi có lỗi ngoại lệ; khởi động lại ứng dụng hoặc máy trạm khi bảo dưỡng định kỳ.
     * **Phản hồi của Kiosk**: Vòng lặp `watchdog reconnect loop` tự động nhận diện và khôi phục luồng đọc video camera trong $\le 3\text{ s}$ khi giắc cáp được cắm lại; tự động phục hồi CSDL SQLite WAL không bị lỗi tệp (`RPO = 0`) kể cả khi bị ngắt nguồn đột ngột.

### 1.2. Ngữ cảnh Tương tác Hệ thống & Phần cứng Ngoại vi (External Systems & Hardware Direct Interactions)

Mục này phân tích các luồng trao đổi dữ liệu, tín hiệu và sự kiện trực tiếp giữa phân hệ Kiosk với hệ thống máy chủ và các thiết bị phần cứng ngoại vi:

* **Phân hệ Máy chủ Trung tâm (`Backend Service` — Central API & Event Broker — [`ARC-002`](../../../system-docs/dds/dds.md), [`ARC-005`](../../../system-docs/dds/dds.md), [`ARC-006`](../../../system-docs/dds/dds.md))**:
  * **Chiều Kiosk $\rightarrow$ Backend (HTTP REST Client — `KioskHttpClient`)**:
    1. *Kéo danh mục khởi tạo (`API-KSK-003`)*: Kiosk gửi `GET /api/v1/kiosks/{id}/gallery` kèm header `Accept-Encoding: gzip`; Backend trả về danh mục nén gzip chứa toàn bộ vector 512D của nhân sự `ACTIVE` để Kiosk giải nén và nạp vào ma trận RAM. Khi mất kết nối mạng, Kiosk tự động fallback nạp từ `local_gallery_cache` (AES-256-GCM).
    2. *Gửi điểm danh trực tiếp (`API-KSK-001`)*: Kiosk gửi `POST /api/v1/kiosks/{id}/punches` kèm header xác thực `X-Kiosk-Id` và Bearer Token ngay sau khi nhận diện thành công; Backend phản hồi $\le 300\text{ ms}$ xác nhận kèm thẻ kết quả (`ON_TIME`, `LATE`); hoặc trả `409` (`COOLDOWN_ACTIVE`).
    3. *Thẩm định mã PIN trực tuyến (`API-KSK-007`)*: Kiosk gửi `POST /api/v1/kiosks/{id}/verify-pin` kèm `employeeCode` và `pin`; Backend xác thực trả 200 kèm danh tính nhân viên, hoặc trả 401 kèm số lượt thử còn lại, hoặc 423 kèm mốc thời gian khóa tài khoản `lockedUntil`.
    4. *Xác thực OTP & Nạp khuôn mặt mới (`API-KSK-004`, `API-KSK-005`)*: Kiosk gửi mã OTP kiểm tra tính hợp lệ; sau đó gửi vector 512D kèm mã `idempotencyKey` UUIDv4; Backend lưu vector vào PostgreSQL và tự hủy mã OTP (burn-after-use).
    5. *Đồng bộ bù gói lô ngoại tuyến (`API-KSK-002`)*: Khi kết nối mạng phục hồi, `OfflineSyncWorker` quét hàng đợi SQLite WAL và đẩy gói lô tối đa 50 bản ghi lên `POST /api/v1/kiosks/{id}/sync-batch`; Backend áp dụng `ON CONFLICT DO NOTHING` trên `(kioskId, localId)` và trả danh sách ID đã lưu; Kiosk đánh dấu `is_synced = 1`.
    6. *Báo cáo nhịp tim định kỳ (`API-KSK-008`)*: Kiosk gửi `POST /api/v1/kiosks/{id}/heartbeat` mỗi 30 giây báo cáo trạng thái camera, mức tiêu thụ RAM, số bản ghi ngoại tuyến chờ gửi; Backend cập nhật mốc `last_ping_at` phục vụ giám sát trạm (`FR-SYS-020`, `ARC-012`).
  * **Chiều Backend $\rightarrow$ Kiosk (WebSocket STOMP Broker — `KioskStompWorker`)**:
    * *Phát sóng nạp nóng / xóa vector thời gian thực (`API-KSK-006`)*: Backend broadcast thông điệp JSON tới kênh `/topic/kiosk-gallery`:
      - Sự kiện `ADD`: Backend gửi thông tin kèm vector 512D của nhân viên mới; Kiosk tiếp nhận và thực thi Atomic Swap ma trận RAM tức thời mà không làm gián đoạn camera, đồng thời cập nhật bản ghi vào `local_gallery_cache`.
      - Sự kiện `DELETE`: Backend gửi `employeeId` của nhân sự thôi việc hoặc rút Consent; Kiosk xóa vector khỏi ma trận RAM và xóa bản ghi tương ứng trong `local_gallery_cache`.

* **Camera Quang học UVC ([`EXT-001`](../../../system-docs/srs/srs.md))**:
  * *Tương tác vật lý*: Kết nối với máy trạm qua chuẩn giao tiếp USB 2.0/3.0 UVC.
  * *Tương tác luồng dữ liệu*: Cung cấp luồng khung hình video liên tục đạt tốc độ $\ge 15\text{ FPS}$ (khuyến nghị 30 FPS), độ phân giải HD $1280\times 720\text{ px}$ tới tầng phần mềm qua thư viện OpenCV DirectShow backend (`cv2.CAP_DSHOW`) trên Windows.
  * *Tương tác ngắt kết nối / phục hồi*: Khi cáp USB bị lỏng hoặc rút đột ngột, luồng DirectShow trả về frame rỗng; Kiosk kích hoạt vòng lặp `watchdog reconnect loop` thử kết nối lại mỗi 3 giây và tự phục hồi hiển thị khi cáp được cắm lại.

* **Nguồn Chuẩn Giờ Mạng NTP ([`EXT-003`](../../../system-docs/srs/srs.md))**:
  * *Tương tác đồng bộ thời gian*: Máy trạm Kiosk gửi truy vấn đồng bộ mốc thời gian định kỳ tới máy chủ NTP doanh nghiệp qua giao thức NTP (UDP Port 123).
  * *Ràng buộc dữ liệu*: Giữ sai lệch đồng hồ hệ thống Kiosk với Backend luôn trong giới hạn $\le 50\text{ ms}$, đảm bảo tính pháp lý, tính toàn vẹn và nhất quán của mốc thời gian ghi nhận điểm danh (`punchTimestamp`).

---

## 2. Functional Requirements (Yêu cầu Chức năng Kiosk)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-KSK-001` | Trạm Kiosk phải thu nhận khung hình video $\ge 15\text{ FPS}$ và phát hiện khuôn mặt thời gian thực qua YuNet. | Vision | Must | `FR-SYS-001`, `ARC-001` | Phát hiện mặt $\ge 120\times 120\text{ px}$; trả về bounding box và 5 điểm mốc; góc Euler Yaw, Pitch, Roll $\le 15^\circ$. | Approved |
| `FR-KSK-002` | Trạm Kiosk phải kiểm tra thực thể sống thụ động qua MiniFASNet để chặn đứng ảnh in 2D và video phát lại. | Vision / PAD | Must | `FR-SYS-002`, `ARC-001` | Điểm số liveness $S \ge 0.85$; thời gian suy luận $\le 30\text{ ms}$; chặn ảnh in và video đạt $\ge 98\%$ ($\text{APCER} \le 2.0\%$). | Approved |
| `FR-KSK-003` | Trạm Kiosk phải trích xuất vector 512D chuẩn hóa L2 Norm qua ArcFace và so khớp Cosine 1:N trong RAM. | Vision / Identity | Must | `FR-SYS-003`, `ARC-001` | Ngưỡng Cosine $\ge 0.50$; thời gian so khớp ma trận RAM 1,000 nhân sự $< 2\text{ ms}$; $\text{FNIR} \le 5.0\%$ tại $\text{FPIR} \le 0.1\%$ (tương đương $\text{TAR} \ge 95\%$ theo chuẩn ISO/IEC 19795-1). | Approved |
| `FR-KSK-004` | Trạm Kiosk phải cung cấp bàn phím số ảo PIN dự phòng và **thẩm định mã PIN qua Backend** (`POST /api/v1/kiosks/{id}/verify-pin`) trước khi ghi nhận điểm danh; với nhân sự đã rút Informed Consent (khuôn mặt bị vô hiệu hoá) thì PIN là phương thức điểm danh duy nhất. | Fallback / Security | Must | `FR-SYS-004`, `FR-SYS-017`, `FR-SYS-025`, `ARC-001`, `ACT-001` | Bàn phím số $3\times 4$ với phím $\ge 60\times 60\text{ px}$; chỉ tạo bản ghi điểm danh sau khi Backend trả HTTP 200; PIN sai (401 `PIN_INVALID`) hiển thị lỗi và **không** tạo bản ghi; PIN đang bị khoá (423 `PIN_LOCKED`) hiển thị đếm ngược theo `lockedUntil` do Backend trả về; thao tác thẩm định PIN không bao giờ dùng PIN làm định danh nhân sự tại chỗ. | Approved |
| `FR-KSK-005` | Trạm Kiosk phải áp dụng bộ đệm Cooldown 120 giây tại biên để chặn quẹt dồn dập. | Business Rule | Must | `FR-SYS-005`, `ARC-001`, `ARC-002` | Ghi nhớ mốc thời gian quẹt thành công trong RAM; từ chối quẹt tiếp trong 120s; hiển thị thông báo "Đã ghi nhận". | Approved |
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
| `NFR-KSK-005` | Tự động phục hồi kết nối camera vật lý trong vòng $\le 3\text{ giây}$ khi bị lỏng giắc hoặc ngắt tín hiệu. | Robustness | Must | `INF-006`, `ARC-001`, `RSK-001` | Vòng lặp `watchdog reconnect loop` tự thử lại mỗi 3s mà không làm treo hoặc sập ứng dụng. | Approved |

