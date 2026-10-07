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

### 1.1. Vòng đời Nghiệp vụ Tác nhân Con người (Human Actors Lifecycle)

Mục này đặc tả vòng đời tương tác nghiệp vụ và các quy tắc vận hành của các tác nhân con người tác động lên phân hệ Kiosk theo chuẩn yêu cầu chức năng:

* **Nhân viên ([`ACT-001`](../../../system-docs/srs/srs.md) — Employee)**:
  1. *Điểm danh Sinh trắc học Không chạm (Touchless Biometric Attendance)*:
     * **Hành vi tác nhân**: Bước vào vùng quan sát nhận diện của trạm ($0.6 - 1.2\text{ m}$), hướng khuôn mặt thẳng vào camera, căn chỉnh khuôn mặt vào khung hiển thị Oval và duy trì tư thế ổn định ($0.5 - 1.0\text{ s}$).
     * **Phản hồi nghiệp vụ của Kiosk**: Tự động phát hiện khuôn mặt (`FR-KSK-001`), kiểm tra thực thể sống thụ động chống giả mạo (`FR-KSK-002`), so khớp đặc trưng 1:N trong bộ nhớ (`FR-KSK-003`) và phản hồi kết quả trực quan kèm âm thanh; đồng thời kích hoạt quy tắc chặn quẹt trùng lặp Cooldown 120 giây (`FR-KSK-005`).
  2. *Điểm danh Dự phòng bằng Mã PIN (Fallback PIN Attendance)*:
     * **Hành vi tác nhân**: Kích hoạt giao diện nhập PIN dự phòng khi nhận diện khuôn mặt thất bại, điều kiện ánh sáng bất lợi, hoặc khi nhân viên đã rút Informed Consent theo Luật Bảo vệ dữ liệu cá nhân (`FR-SYS-025`). Nhập Mã nhân viên (`employeeCode`) và Mã PIN cá nhân 6 số, sau đó xác nhận điểm danh.
     * **Phản hồi nghiệp vụ của Kiosk**: Gửi yêu cầu thẩm định tập trung về máy chủ trung tâm (`FR-KSK-004`). Nếu PIN hợp lệ, hệ thống ghi nhận giao dịch điểm danh; nếu nhập sai quá 5 lần liên tiếp, hệ thống kích hoạt cơ chế tạm khóa tài khoản 15 phút chống dò mã.
  3. *Tự Kích hoạt & Đăng ký Mẫu Khuôn mặt (Self-Onboarding Enrollment)*:
     * **Hành vi tác nhân**: Kích hoạt luồng đăng ký khuôn mặt trên màn hình Kiosk (`FR-KSK-007`), nhập mã Onboarding OTP 6 chữ số (tiếp nhận từ Cổng Web sau khi ký Informed Consent), đứng trước camera căn chỉnh vào khung Oval để hệ thống tự động thu nhận 3 ảnh mẫu đạt chuẩn chất lượng, sau đó xác nhận hoàn tất.
     * **Phản hồi nghiệp vụ của Kiosk**: Xác thực mã OTP qua máy chủ; tự động thu nhận 3 ảnh chân dung đạt chuẩn độ nét, góc nghiêng và thực thể sống; trích xuất vector đặc trưng gửi về máy chủ lưu trữ và nạp tức thời vào danh mục nhận diện cục bộ tại trạm.
  4. *Hủy bỏ Thao tác & Quay về Màn hình Chờ (Dialog Cancellation)*:
     * **Hành vi tác nhân**: Thao tác đóng hoặc hủy bỏ bất kỳ lúc nào khi muốn dừng việc nhập PIN hoặc đăng ký khuôn mặt dở dang.
     * **Phản hồi nghiệp vụ của Kiosk**: Đóng ngay lập tức các giao diện phụ, giải phóng tài nguyên phiên và hoàn trả trạm về trạng thái sẵn sàng nhận diện thường nhật.

* **Quản trị viên Hệ thống ([`ACT-003`](../../../system-docs/srs/srs.md) — System Admin)**:
  1. *Thiết lập Vận hành & Khởi động Trạm (Station Provisioning & Startup)*:
     * **Hành vi tác nhân**: Nạp các tham số cấu hình vận hành trạm (định danh thiết bị, địa chỉ dịch vụ máy chủ, mã bí mật xác thực trạm, các ngưỡng nhận diện AI và thời gian chờ), kích hoạt trạm và khởi chạy dịch vụ điểm danh.
     * **Phản hồi nghiệp vụ của Kiosk**: Kiểm tra tính sẵn sàng của thiết bị phần cứng, đồng bộ danh mục mẫu sinh trắc học từ máy chủ trung tâm và chuyển sang trạng thái sẵn sàng phục vụ 24/7.
  2. *Thao tác Điều khiển Bảo trì tại Chỗ (On-site Maintenance & Operator Control)*:
     * **Hành vi tác nhân**: Sử dụng các phím điều khiển bảo trì phần cứng tại trạm để hỗ trợ người dùng (mở nhanh giao diện nhập PIN, kích hoạt luồng đăng ký nhân viên mới, hoặc đóng cưỡng bức các phiên thao tác bị treo).
     * **Phản hồi nghiệp vụ của Kiosk**: Tiếp nhận tín hiệu điều khiển và chuyển đổi trạng thái giao diện tức thời mà không làm gián đoạn luồng video camera hay tiến trình nhận diện nền.
  3. *Bảo trì Phần cứng & Khắc phục Sự cố (Hardware Maintenance & Fault Recovery)*:
     * **Hành vi tác nhân**: Căn chỉnh góc nhìn và độ cao camera, xử lý kết nối cáp tín hiệu vật lý khi có sự cố, tra cứu nhật ký vận hành trạm và thực hiện bảo dưỡng định kỳ.
     * **Phản hồi nghiệp vụ của Kiosk**: Tự động phục hồi luồng thu nhận video khi kết nối vật lý được tái lập (`NFR-KSK-005`); tự động bảo toàn toàn vẹn dữ liệu ngoại tuyến không thất thoát (`FR-KSK-006`, `NFR-KSK-003`).

### 1.2. Ngữ cảnh Tương tác Hệ thống & Phần cứng Ngoại vi (External Systems & Hardware Context)

Mục này đặc tả các ranh giới và năng lực trao đổi thông tin giữa phân hệ Kiosk với máy chủ trung tâm và các thiết bị ngoại vi:

* **Phân hệ Máy chủ Trung tâm (`Backend Service` — Central API & Event Broker — [`ARC-002`](../../../system-docs/dds/dds.md), [`ARC-005`](../../../system-docs/dds/dds.md), [`ARC-006`](../../../system-docs/dds/dds.md))**:
  1. *Khởi tạo Danh mục Sinh trắc học*: Kiosk tiếp nhận danh mục vector đặc trưng của toàn bộ nhân sự đang hoạt động từ máy chủ khi khởi động; kích hoạt cơ chế đệm dữ liệu cục bộ đã mã hóa để sẵn sàng vận hành độc lập khi mất mạng.
  2. *Ghi nhận Điểm danh & Thẩm định Tập trung*: Kiosk truyền nhận các giao dịch điểm danh thời gian thực tới máy chủ; tiếp nhận kết quả thẩm định mã PIN cá nhân và mã Onboarding OTP từ dịch vụ trung tâm.
  3. *Đồng bộ Biến động Danh mục Thời gian thực*: Kiosk đón nhận các thông điệp cập nhật tức thời từ máy chủ (khi có nhân viên mới đăng ký hoặc nhân viên thôi việc/rút Consent) để cập nhật nóng danh mục nhận diện trong bộ nhớ mà không làm gián đoạn luồng làm việc.
  4. *Đồng bộ Bù Ngoại tuyến & Giám sát Vận hành Trạm*: Khi kết nối mạng phục hồi sau sự cố, Kiosk tự động gửi bù toàn bộ dữ liệu điểm danh đã lưu đệm an toàn; đồng thời định kỳ phát tín hiệu nhịp tim để máy chủ giám sát trạng thái hoạt động của trạm (`FR-SYS-020`, `ARC-012`).

* **Camera Quang học UVC ([`EXT-001`](../../../system-docs/srs/srs.md))**:
  * Thiết bị cung cấp luồng khung hình video liên tục đạt tốc độ tối thiểu $\ge 15\text{ FPS}$ (khuyến nghị 30 FPS) phục vụ chu trình nhận diện thời gian thực; khi gián đoạn tín hiệu phần cứng, Kiosk tự động kích hoạt chu trình thử lại và khôi phục hoạt động ngay khi kết nối vật lý được tái lập.

* **Nguồn Chuẩn Giờ Mạng NTP ([`EXT-003`](../../../system-docs/srs/srs.md))**:
  * Hệ thống cung cấp mốc thời gian chuẩn đồng bộ giữa Kiosk và máy chủ trung tâm với sai lệch không quá $\le 50\text{ ms}$, bảo đảm tính chính xác, nhất quán và giá trị pháp lý của toàn bộ dữ liệu điểm danh.

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
| `FR-KSK-007` | Trạm Kiosk phải thực hiện quy trình tự đăng ký In-Viewport 3 bước tiếp nhận mã OTP từ Cổng Web. | Enrollment / UX | Must | `FR-SYS-008`, `FR-SYS-009`, `ARC-001`, `ACT-001` | Bước 1 xác minh OTP; Bước 2 tự ẩn popup chụp 3 ảnh chuẩn trên camera chính ($S_{\text{liveness}} \ge 0.85$); Bước 3 nạp nóng vector vào RAM. | Approved |
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

