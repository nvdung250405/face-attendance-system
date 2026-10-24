---
title: Đặc tả Toàn diện Phân hệ Kiosk App (Kiosk Spec Core)
version: 2.1
status: Approved
owner: Edge Vision Lead & Requirements Analyst
type: spec
scope: KSK
updated: 2026-10-09
---

# KIOSK SPEC CORE — Đặc tả Toàn diện Phân hệ Kiosk

Tài liệu này là **Spec Core của Phân hệ Kiosk** (`kiosk-app`) theo chuẩn SDLC v3.x ([sdlc-docs.md](../../../sdlc-docs.md) §7.2). Tài liệu hợp nhất toàn diện:
1. Ngữ cảnh tương tác phân hệ, kế thừa các tác nhân (`ACT-`) và thiết bị/dịch vụ ngoại vi (`EXT-`), cùng chu trình tương tác thực tế của tác nhân con người và ngữ cảnh tích hợp Backend.
2. Danh mục 17 Yêu cầu Chức năng Phân hệ Kiosk (`FR-KSK-001` đến `FR-KSK-017`).
3. Danh mục 11 Yêu cầu Phi chức năng Phân hệ Kiosk đo lường được (`NFR-KSK-001` đến `NFR-KSK-011`).
4. Kiến trúc nội bộ phân hệ Kiosk: mô hình đa luồng PySide6, luồng dữ liệu thị giác máy tính, cơ chế bộ nhớ không ghi đĩa, máy trạng thái vận hành và 11 Thành phần Kỹ thuật Giải pháp (`SOL-KSK-001` đến `SOL-KSK-011`).
5. Danh mục 6 Quyết định Thiết kế Kiến trúc Phân hệ Kiosk (`DD-KSK-001` đến `DD-KSK-006`).
6. Giả định và các vấn đề mở của phân hệ Kiosk.

---

## 1. Subsystem Context (Ngữ cảnh Vận hành Phân hệ Kiosk)

Phân hệ Kiosk vận hành như một thiết bị trạm cận biên tự phục vụ (Self-service Edge Station), đóng gói thành ứng dụng desktop Windows (PySide6 / Python 3.14) chạy trên máy tính đặt tại sảnh ra vào cơ quan/doanh nghiệp:

### 1.1. Actors (Tác nhân Tương tác)

Phân hệ Kiosk kế thừa và tham chiếu trực tiếp các tác nhân chuẩn hóa cấp toàn hệ thống ([System Spec Core](../../../system-docs/specs/spec.md#11-actors-sổ-đăng-ký-tác-nhân-người-dùng-toàn-hệ-thống)):
* **[`ACT-001`](../../../system-docs/specs/spec.md) — Nhân viên (Employee)**:
  * Điểm danh sinh trắc học khuôn mặt không chạm thời gian thực tại camera Kiosk (`FR-KSK-001..003`).
  * Điểm danh dự phòng bằng bàn phím số ảo PIN khi có sự cố nhận diện hoặc khi đã rút Informed Consent (`FR-KSK-004`).
  * Tự nạp mẫu khuôn mặt 3 bước trực tiếp tại camera Kiosk bằng mã Onboarding OTP 6 số (`FR-KSK-007`).
* **[`ACT-003`](../../../system-docs/specs/spec.md) — Quản trị viên Hệ thống (System Admin)**:
  * Khởi tạo và kích hoạt trạm Kiosk bằng Secret Token cấp phát từ Backend (`FR-KSK-009`).
  * Thao tác phím nóng bảo trì tại chỗ: F4 (Chẩn đoán kết nối), F10 (Cấu hình trạm), F12 (Xem nhật ký hoạt động).
  * Mở khóa trạm khẩn cấp qua mã PIN cục bộ (`KIOSK_ADMIN_PIN`) khi trạm bị phong tỏa (`LOCKED`) và mất mạng (`FR-KSK-012`).

### 1.2. External Systems & Devices (Hệ thống & Thiết bị Ngoại vi)

* **[`EXT-001`](../../../system-docs/specs/spec.md) — Camera Quang học UVC / Webcam**: Kết nối phần cứng qua cổng USB, cung cấp luồng khung hình video liên tục $\ge 15\text{ FPS}$ (khuyến nghị $\ge 24\text{ FPS}$) qua driver OpenCV DirectShow / Media Foundation.
* **[`EXT-003`](../../../system-docs/specs/spec.md) — Nguồn Chuẩn Giờ Mạng (NTP Server)**: Đồng bộ mốc thời gian hệ điều hành máy trạm với sai lệch $\le 50\text{ ms}$ so với máy chủ Backend qua cổng UDP 123.
* **Máy chủ Doanh nghiệp (`backend-service`)**: Đối tác cung cấp dịch vụ RESTful API tiếp nhận giao dịch điểm danh (`POST /api/v1/kiosk/punch`), thẩm định PIN dự phòng (`POST /api/v1/kiosk/verify-pin`), cấp phát dữ liệu mẫu và đẩy sự kiện đồng bộ gallery thời gian thực qua WebSocket STOMP topic `/topic/kiosk-gallery`.

---

---

### 1.3. Vòng đời Nghiệp vụ Tác nhân Con người (Human Actors Lifecycle)

* **Nhân viên ([`ACT-001`](../../../system-docs/specs/spec.md) — Employee)**:
  1. *Điểm danh Sinh trắc học Không chạm (Touchless Biometric Attendance)*:
     * **Hành vi tác nhân**: Bước vào vùng quan sát nhận diện của trạm (0.6 - 1.2 m), hướng khuôn mặt thẳng vào camera, căn chỉnh khuôn mặt vào khung hiển thị Oval và duy trì tư thế ổn định (0.5 - 1.0 s).
     * **Phản hồi nghiệp vụ của Kiosk**: Tự động phát hiện khuôn mặt (`FR-KSK-001`), kiểm tra thực thể sống thụ động chống giả mạo (`FR-KSK-002`, `NFR-KSK-007`), so khớp đặc trưng 1:N trong bộ nhớ RAM (`FR-KSK-003`, `NFR-KSK-001`, `NFR-KSK-006`) và phản hồi kết quả trực quan kèm âm thanh; gửi giao dịch điểm danh trực tuyến (`FR-KSK-006`) hoặc đệm an toàn vào CSDL cục bộ khi mất mạng (`FR-KSK-015`); đồng thời kích hoạt quy tắc giãn cách thời gian Cooldown 120 giây (`FR-KSK-005`).
  2. *Điểm danh Dự phòng bằng Mã PIN (Fallback PIN Attendance)*:
     * **Hành vi tác nhân**: Kích hoạt giao diện nhập PIN dự phòng khi nhận diện khuôn mặt thất bại, điều kiện ánh sáng bất lợi, hoặc khi nhân viên đã rút Informed Consent theo Luật Bảo vệ dữ liệu cá nhân (`FR-SYS-025`). Nhập Mã nhân viên (`employeeCode`) và Mã PIN cá nhân 6 số, sau đó xác nhận điểm danh.
     * **Phản hồi nghiệp vụ của Kiosk**: Gửi yêu cầu thẩm định trực tuyến về máy chủ trung tâm (`FR-KSK-004`, `DD-SYS-017`). Nếu PIN hợp lệ, hệ thống ghi nhận giao dịch điểm danh; nếu nhập sai quá 5 lần liên tiếp, hệ thống kích hoạt cơ chế tạm khóa tài khoản 15 phút chống dò mã.
  3. *Tự Kích hoạt & Đăng ký Mẫu Khuôn mặt (Self-Onboarding Enrollment)*:
     * **Hành vi tác nhân**: Kích hoạt luồng đăng ký khuôn mặt trên màn hình Kiosk (`FR-KSK-007`), nhập mã Onboarding OTP 6 chữ số (tiếp nhận từ Cổng Web sau khi ký Informed Consent), đứng trước camera căn chỉnh vào khung Oval để hệ thống tự động thu nhận 3 ảnh mẫu đạt chuẩn chất lượng, sau đó xác nhận hoàn tất.
     * **Phản hồi nghiệp vụ của Kiosk**: Xác thực mã OTP qua máy chủ; tự động chụp liên tiếp 3 ảnh chân dung đạt chuẩn độ nét Laplacian $\ge 30$, góc nghiêng pose $\le 15^\circ$ và điểm tin cậy thực thể sống an toàn $S_{\text{liveness}} \ge 0.90$ (áp dụng Safety Margin $+5\%$ so với ngưỡng vận hành 0.85 căn cứ phân tích ánh sáng yếu `GAP-001` và `DD-SYS-027`); trích xuất vector đặc trưng gửi về máy chủ mã hóa lưu trữ và nạp tức thời vào danh mục trạm. Mã OTP chỉ bị hủy sau khi máy chủ xác nhận lưu trữ thành công; nếu gặp sự cố mạng khi tải lên, mã OTP vẫn giữ nguyên hiệu lực 48 giờ để nhân viên thử lại.
  4. *Xử lý Ngoại lệ Điểm danh bị Từ chối (Rejected Biometric Verification)*:
     * **Hành vi tác nhân**: Khi bị hệ thống từ chối nhận diện do điểm sống dưới ngưỡng hoặc độ tương đồng khuôn mặt không đạt, nhân viên điều chỉnh lại vị trí đứng hoặc hướng nhìn để thử lại (tối đa 3 lần liên tiếp trong 30 giây).
     * **Phản hồi nghiệp vụ của Kiosk**: Hiển thị phản hồi thị giác trực quan rõ ràng ("Khuôn mặt không khớp" hoặc "Vui lòng giữ thẳng mặt trước camera"); sau 3 lần thử lại thất bại, Kiosk tự động bật gợi ý chuyển sang bàn phím nhập mã PIN dự phòng (`FR-KSK-004`) nhằm tránh gây ùn tắc trạm; tuyệt đối không phong tỏa màn hình.
  5. *Xử lý Ngoại lệ Quẹt trùng lặp trong Giờ Giãn cách (Cooldown Active — Single & Multi-Device)*:
     * **Hành vi tác nhân**: Nhân viên vô tình hoặc cố ý thực hiện nhận diện khuôn mặt lại trong vòng 120 giây kể từ lần điểm danh thành công gần nhất tại cùng một trạm hoặc trạm Kiosk khác trong mạng lưới.
     * **Phản hồi nghiệp vụ của Kiosk**: Tại cùng trạm, Kiosk tra cứu RAM tức thời và hiển thị thông báo "Bạn đã điểm danh thành công lúc [hh:mm:ss], vui lòng quay lại sau [N] giây" (`FR-KSK-005`). Nếu quẹt tại trạm khác (Multi-device), trạm gửi request lên Backend và nhận phản hồi `409 Conflict (COOLDOWN_ACTIVE)`; Kiosk lập tức hiển thị thông báo "Bạn vừa điểm danh tại trạm khác lúc [hh:mm:ss], vui lòng không quẹt lại", không ghi nhận công và không lưu vào hàng đợi ngoại tuyến.
  6. *Nhân viên đã Thu hồi / Rút Cam kết Consent (Biometric Consent Revoked)*:
     * **Hành vi tác nhân**: Nhân viên đã thực hiện quyền rút Consent theo quy định pháp luật sẽ không còn mẫu nhận diện trong hệ thống; nhân viên trực tiếp sử dụng mã PIN cá nhân để điểm danh.
     * **Phản hồi nghiệp vụ của Kiosk**: Trạm đã xóa bỏ hoàn toàn vector của nhân sự này khỏi RAM và CSDL cục bộ theo sự kiện đồng bộ (`FR-KSK-008`); chỉ tiếp nhận và xử lý điểm danh cho nhân viên qua luồng mã PIN dự phòng (`FR-KSK-004`).
  7. *Xử lý Sự cố Phần cứng, Sai lệch Giờ & Mất Mạng khi Đang Tương tác*:
     * **Hành vi tác nhân**: Đang trong quá trình tương tác thì hệ thống gặp sự cố ngắt kết nối mạng, gián đoạn tín hiệu camera hoặc mất chuẩn thời gian.
     * **Phản hồi nghiệp vụ của Kiosk**: Nếu mất kết nối mạng, Kiosk tự động chuyển sang chế độ lưu đệm ngoại tuyến SQLite (`FR-KSK-015`) mà người dùng không nhận thấy gián đoạn; nếu mất tín hiệu camera, Kiosk lập tức hiển thị thông báo sự cố phần cứng thân thiện và hướng dẫn nhân viên dùng PIN Pad (`FR-KSK-004`, `NFR-KSK-005`). Nếu phát hiện sai lệch đồng hồ hệ thống vượt ngưỡng nghiêm trọng (> 1.0 giây so với NTP theo `NFR-KSK-008`), Kiosk tạm dừng toàn bộ chu trình tự động ghi nhận điểm danh tại trạm; trường hợp khẩn cấp nếu nhân viên nhập PIN, bản ghi được gắn cờ `time_unreliable: true` gửi về Backend đánh dấu `is_anomalous = true` để HR đối soát qua Cổng Web (`FR-SYS-012`, `FR-SYS-016`).
  8. *Hủy bỏ Thao tác & Tự động Đóng Phiên dở dang (Dialog Cancellation & Inactivity Timeout)*:
     * **Hành vi tác nhân**: Thao tác bấm nút "Hủy" hoặc bỏ đi mà không hoàn tất việc nhập PIN hay đăng ký khuôn mặt.
     * **Phản hồi nghiệp vụ của Kiosk**: Đóng ngay lập tức các giao diện phụ khi bấm Hủy; hoặc tự động đếm ngược và đóng về màn hình chờ sau đúng thời gian Timeout (mặc định 30 giây, cấu hình 10 - 120 giây theo `FR-KSK-011`, `FR-KSK-013`), giải phóng bộ nhớ phiên.

* **Quản trị viên Hệ thống ([`ACT-003`](../../../system-docs/specs/spec.md) — System Admin)**:
  1. *Thiết lập Vận hành & Khởi động Trạm (Station Provisioning & Startup)*:
     * **Hành vi tác nhân**: Nạp các tham số cấu hình khởi tạo trạm (định danh thiết bị, địa chỉ dịch vụ máy chủ, mã bí mật xác thực trạm, các ngưỡng nhận diện AI và thời gian chờ), kích hoạt trạm và khởi chạy dịch vụ điểm danh.
     * **Phản hồi nghiệp vụ của Kiosk**: Kiểm tra tính sẵn sàng của thiết bị phần cứng, xác thực trạm với máy chủ, tải danh mục mẫu sinh trắc học về lưu đệm mã hóa AES-256-GCM (`DATA-KSK-007`), nạp ma trận RAM và chuyển sang trạng thái sẵn sàng phục vụ 24/7 (`FR-KSK-009`). Nếu gặp lỗi khởi động, Kiosk kích hoạt quy trình tự bảo vệ và hiển thị hướng dẫn phục hồi (`FR-KSK-017`).
  2. *Giám sát Vận hành & Chẩn đoán Kỹ thuật tại Chỗ (On-site Diagnostic & Health Monitoring)*:
     * **Hành vi tác nhân**: Thao tác phím nóng F4 hoặc kết nối bàn phím/chuột kỹ thuật để truy cập bảng điều khiển chẩn đoán trạm (Diagnostic Overlay).
     * **Phản hồi nghiệp vụ của Kiosk**: Hiển thị bảng thông số kỹ thuật tức thời: FPS thực tế, độ trễ chu kỳ AI, dung lượng RAM, trạng thái kết nối máy chủ/camera, số lượng bản ghi tồn đọng chưa đồng bộ và độ lệch đồng hồ NTP (`FR-KSK-010`).
  3. *Truy xuất Nhật ký Hoạt động Trạm Biên (Operational Log Auditing)*:
     * **Hành vi tác nhân**: Thao tác phím nóng F12 để truy cập giao diện xem nhật ký hoạt động Kiosk (`FR-KSK-014`).
     * **Phản hồi nghiệp vụ của Kiosk**: Hiển thị danh sách các sự kiện vận hành gần nhất (khởi động, mất mạng, đồng bộ hàng đợi, từ chối nhận diện, phát hiện giả mạo). Tuyệt đối không hiển thị hình ảnh thô, vector mẫu hay Secret Token; hỗ trợ xuất file log text đã được khử khuẩn an toàn ra USB bảo trì.
  4. *Bảo trì, Tái Cấu hình Tham số & Xử lý Phong tỏa Trạm (Maintenance, Re-config & Unlock)*:
     * **Hành vi tác nhân**: Thao tác phím nóng F10 để mở màn hình cấu hình trạm biên hoặc giải quyết sự cố khi trạm bị phong tỏa (`LOCKED`).
     * **Phản hồi nghiệp vụ của Kiosk**: Yêu cầu xác thực tài khoản quản trị viên trước khi cho phép điều chỉnh tham số. Khi trạm đang bị `LOCKED`, toàn bộ tương tác thường nhật bị đình chỉ và vô hiệu hóa các phím nóng F2/F3/ESC; quản trị viên có thể nhập mã PIN quản trị cục bộ (`KIOSK_ADMIN_PIN`, lockout 15 phút sau 5 lần sai) để mở khóa trạm khẩn cấp kể cả khi mất mạng (`FR-KSK-012`).
  5. *Đổi Secret Token & Thu hồi Kích hoạt Trạm (Station De-provisioning & Key Rotation)*:
     * **Hành vi tác nhân**: Nhận thông báo thu hồi hoặc xoay vòng khóa xác thực trạm từ Backend; nạp Secret Token mới hoặc nhận lệnh hủy kích hoạt từ xa.
     * **Phản hồi nghiệp vụ của Kiosk**: Nếu nhận lệnh xoay vòng khóa, Kiosk cập nhật an toàn vào file cấu hình bảo vệ (`DATA-KSK-004`). Nếu nhận tín hiệu hủy kích hoạt, Kiosk xóa sạch ma trận RAM và CSDL đệm cục bộ, chuyển về màn hình "Trạm chưa được kích hoạt" (`FR-KSK-009`).

---

### 1.4. Ngữ cảnh Tích hợp với Dịch vụ Máy chủ Trung tâm (Backend Service Integration Context)

1. **Đồng bộ Danh mục Khuôn mặt Mẫu hai chiều (Two-way Biometric Gallery Sync)**:
   * Backend cung cấp danh mục vector 512D kèm thông tin định danh qua REST API `GET /api/v1/kiosk/gallery` khi Kiosk khởi động.
   * Backend phát sóng thông điệp cập nhật tức thời qua WebSocket STOMP topic `/topic/kiosk-gallery` khi có nhân sự mới hoặc thay đổi trạng thái (`FR-KSK-008`).
2. **Tiếp nhận & Xử lý Giao dịch Điểm danh (Attendance Ingestion & Cooldown Enforcement)**:
   * Backend tiếp nhận yêu cầu chấm công thời gian thực qua REST API `POST /api/v1/kiosk/punch`.
   * Backend đối soát ca kíp, tính toán trạng thái và phản hồi trong $\le 100\text{ ms}$; kiểm soát Cooldown tầng 2 tại máy chủ (`FR-KSK-005`, `FR-KSK-006`).
   * Tiếp nhận các gói đồng bộ ngoại tuyến gửi bù theo lô qua `POST /api/v1/kiosk/sync-batch` (`FR-KSK-015`, `FR-KSK-016`).
3. **Thẩm định Tập trung Phương thức PIN Dự phòng (Centralized Fallback PIN Verification)**:
   * Backend tiếp nhận yêu cầu thẩm định mã PIN qua `POST /api/v1/kiosk/verify-pin` (`FR-KSK-004`).
   * Backend thực hiện kiểm tra `pin_hash` (Argon2id/BCrypt), áp dụng khóa per-account 15 phút sau 5 lần sai; Kiosk không lưu trữ mã băm PIN tại chỗ.
4. **Giám sát Nhịp tim & Tình trạng Hoạt động (Station Heartbeat & Health Monitoring)**:
   * Kiosk gửi bản tin nhịp tim (Ping) định kỳ mỗi 60 giây qua `POST /api/v1/kiosk/heartbeat` (`FR-KSK-010`).
5. **Điều khiển & Cập nhật Cấu hình từ xa (Remote Station Management)**:
   * Backend có thể phát lệnh phong tỏa trạm (`LOCK_KIOSK`) hoặc mở khóa (`UNLOCK_KIOSK`) qua WebSocket STOMP (`FR-KSK-012`).
   * Backend đẩy tham số cập nhật cấu hình động qua `/topic/kiosk-config/{kioskId}` (`FR-KSK-013`).
6. **Đồng bộ Chuẩn Thời gian (NTP & System Clock Synchronization)**:
   * Backend và Kiosk cùng trỏ về máy chủ NTP nội bộ (`EXT-003`). Kiosk đo lường sai lệch thời gian ở mỗi lần gửi heartbeat; nếu vượt ngưỡng $\pm 1.0\text{ s}$ sẽ kích hoạt cờ cảnh báo (`NFR-KSK-008`).

---

---

## 2. Requirements (Yêu cầu Kỹ thuật Phân hệ Kiosk)

### 2.1. Functional Requirements (Yêu cầu Chức năng)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-KSK-001` | Phân hệ Kiosk phải thu nhận khung hình video từ camera quang học và phát hiện khuôn mặt thời gian thực bằng mô hình nhẹ YuNet. | Vision / Acquisition | Must | `PD-002`, `FR-SYS-001`, `ACT-001` | Luồng đọc video OpenCV DirectShow đạt tốc độ $\ge 15\text{ FPS}$ (khuyến nghị $\ge 24\text{ FPS}$); phát hiện khuôn mặt kích thước $\ge 120\times 120\text{ px}$; trích xuất bounding box và 5 điểm mốc giải phẫu trong $\le 20\text{ ms}$ trên CPU AVX2. | Approved |
| `FR-KSK-002` | Phân hệ Kiosk phải kiểm tra thực thể sống thụ động (Passive Liveness) bằng mô hình MiniFASNet để phát hiện và ngăn chặn các hành vi giả mạo bằng ảnh in hoặc video phát lại. | Vision / Anti-Spoofing | Must | `PD-003`, `INF-008`, `FR-SYS-002`, `ACT-001` | Điểm số liveness $S_{\text{liveness}} \ge 0.85$; tuân thủ chuẩn ISO/IEC 30107-3 với sai số chấp nhận tấn công $\text{APCER} \le 2.0\%$ (chặn $\ge 98\%$ các cuộc tấn công Presentation Attack ảnh in và màn hình) và sai số từ chối người thật $\text{BPCER} \le 5.0\%$; thời gian suy luận $\le 30\text{ ms}$ trên CPU. | Approved |
| `FR-KSK-003` | Phân hệ Kiosk phải trích xuất vector đặc trưng 512 chiều chuẩn hóa L2 Norm qua mô hình ArcFace MobileFaceNet và so khớp Cosine 1:N với ma trận danh mục RAM cục bộ. | Vision / Identity | Must | `PD-002`, `INF-007`, `FR-SYS-003`, `ACT-001` | Trích xuất vector 512D trong $\le 50\text{ ms}$; thời gian so khớp Cosine ma trận 1,000 nhân sự hoàn tất $< 2\text{ ms}$; ngưỡng nhận diện Cosine Similarity cấu hình $\ge 0.50$; đáp ứng chuẩn ISO/IEC 19795-1 với $\text{FNIR} \le 5.0\%$ tại $\text{FPIR} \le 0.1\%$. | Approved |
| `FR-KSK-004` | Phân hệ Kiosk phải cung cấp bàn phím số ảo PIN dự phòng trên màn hình cảm ứng để nhân viên điểm danh khi gặp sự cố nhận diện sinh trắc học hoặc đã rút Informed Consent; mã PIN được thẩm định tập trung tại máy chủ Backend khi có kết nối mạng. | Fallback / UX | Should | `PD-008`, `INF-012`, `FR-SYS-004`, `ACT-001` | Nhập mã PIN 6 số cá nhân; gọi thẩm định trực tuyến `POST /api/v1/kiosk/verify-pin` lên Backend và ghi nhận điểm danh `VERIFICATION_PIN`; Backend áp dụng khóa tạm thời (Lockout) per-account tối thiểu 15 phút sau 5 lần nhập sai liên tiếp trên bất kỳ trạm nào kết hợp khóa per-device tại bàn phím Kiosk; khi mất mạng đồng thời với lỗi sinh trắc học, nhân viên nộp đơn giải trình công bổ sung (`FR-SYS-016`). | Approved |
| `FR-KSK-005` | Phân hệ Kiosk phải áp dụng cơ chế kiểm soát chống quét lặp Cooldown 120 giây trong bộ nhớ RAM cho cùng một nhân viên nhằm ngăn ngừa hành vi điểm danh trùng lặp vô ý tại trạm. | Business Rule | Should | `DD-SYS-006`, `FR-SYS-005`, `ACT-001` | Lưu vết mốc giờ quẹt thẻ gần nhất trong bộ nhớ đệm RAM cục bộ `LocalCooldownCache`; từ chối các lượt nhận diện lặp lại trong vòng 120 giây với độ trễ phản hồi $< 1\text{ ms}$; hiển thị thông báo "Bạn đã chấm công, vui lòng không quẹt lại" kèm thời gian đếm lùi; tự động xóa bản ghi đệm sau 300 giây. | Approved |
| `FR-KSK-006` | Phân hệ Kiosk phải gửi yêu cầu điểm danh trực tiếp qua HTTP REST POST về máy chủ Backend ngay khi nhận diện thành công hoặc thẩm định PIN hợp lệ. | Communication | Must | `PD-001`, `FR-SYS-003`, `ACT-001` | Gửi payload JSON tới `POST /api/v1/kiosk/punch` kèm `X-Kiosk-Id` và Bearer Token trong $\le 300\text{ ms}$; phân tích và hiển thị kết quả xác nhận lên giao diện người dùng tức thời; nếu lỗi kết nối HTTP Timeout (3.0s) thì chuyển sang lưu hàng đợi ngoại tuyến `FR-KSK-015`. | Approved |
| `FR-KSK-007` | Phân hệ Kiosk phải hỗ trợ quy trình tự nạp mẫu khuôn mặt 3 bước trực tiếp tại camera trạm: xác minh Onboarding OTP 6 số, tự động kiểm chuẩn và chụp liên tiếp 3 ảnh đạt chuẩn và đẩy vector mã hóa về máy chủ Backend. | Enrollment / UX | Must | `PD-007`, `FR-SYS-009`, `ACT-001` | Bước 1: Xác thực mã Onboarding OTP 6 chữ số qua Backend; Bước 2: Tự động kiểm chuẩn hình học và độ sắc nét (Laplacian $\ge 30$, góc nghiêng pose $\le 15^\circ$), chụp 3 ảnh liên tiếp đạt chuẩn an toàn thực thể sống $S_{\text{liveness}} \ge 0.90$ (áp dụng Safety Margin $+5\%$ so với ngưỡng vận hành 0.85); Bước 3: Nạp nóng vector vào RAM Kiosk và đồng bộ mã hóa về Backend. | Approved |
| `FR-KSK-008` | Phân hệ Kiosk phải duy trì kết nối WebSocket STOMP tới topic `/topic/kiosk-gallery` để tự động tiếp nhận các bản tin cập nhật danh mục khuôn mặt mẫu từ Backend theo thời gian thực. | Realtime Sync | Must | `PD-006`, `FR-SYS-014`, `ACT-003` | Tiếp nhận bản tin JSON `ADD_VECTOR` / `REMOVE_VECTOR`; thực hiện cập nhật nóng (Hot-patching) ma trận RAM trong $\le 500\text{ ms}$ mà không cần khởi động lại ứng dụng; tự động thử kết nối lại socket sau mỗi 5 giây khi rớt mạng. | Approved |
| `FR-KSK-009` | Phân hệ Kiosk phải tải toàn bộ danh mục vector khuôn mặt mẫu từ máy chủ trung tâm khi khởi động ứng dụng và giải mã nạp sẵn vào bộ nhớ RAM. | Bootstrap / Identity | Must | `SRS-001`, `DD-SYS-003`, `ACT-003` | Gọi `GET /api/v1/kiosk/gallery` với Bearer Token trạm; tiếp nhận danh sách vector mã hóa AES-256-GCM; giải mã bằng Master Key nạp từ biến môi trường; khởi tạo ma trận NumPy $N \times 512$ sẵn sàng nhận diện trong $\le 3.0\text{ s}$ cho 1,000 nhân sự; lưu đệm mã hóa vào `local_gallery_cache` trong SQLite WAL phục vụ khởi động nguội ngoại tuyến. | Approved |
| `FR-KSK-010` | Phân hệ Kiosk phải định kỳ gửi bản tin nhịp tim (Heartbeat) kèm dữ liệu đo lường kỹ thuật về Backend mỗi 60 giây và cung cấp màn hình chẩn đoán tại chỗ (phím F4) cho Quản trị viên. | Observability / Ops | Should | `SRS-009`, `ACT-003` | Heartbeat gửi tới `POST /api/v1/kiosk/heartbeat` gồm: `kiosk_id`, `status` (ONLINE/DEGRADED), `fps`, `ram_usage_mb`, `unsynced_punches_count`, `camera_status`, `ntp_offset_ms`; màn hình chẩn đoán phím F4 hiển thị trực quan các thông số trên và bảng danh sách thiết bị. | Approved |
| `FR-KSK-011` | Phân hệ Kiosk phải tự động hủy bỏ phiên tương tác dở dang và quay về màn hình chờ mặc định sau khoảng thời gian không có thao tác (Inactivity Timeout). | UX / Resilience | Should | `ACT-001`, `UI-KSK-008` | Bàn phím PIN và Modal đăng ký tự động đóng sau 30 giây không chạm màn hình; hủy bỏ phiên nạp mẫu dở dang; giải phóng bộ nhớ đệm khung hình và reset máy trạng thái Oval về `STANDBY`. | Approved |
| `FR-KSK-012` | Phân hệ Kiosk phải hỗ trợ nhận lệnh phong tỏa khẩn cấp (`LOCK_KIOSK`) và mở khóa (`UNLOCK_KIOSK`) từ xa qua WebSocket STOMP hoặc qua mã PIN quản trị cục bộ (`KIOSK_ADMIN_PIN`). | Security / Remote Control | Must | `SRS-006`, `ACT-003` | Khi nhận lệnh `LOCK_KIOSK`: Chuyển máy trạng thái sang `LOCKED` trong $\le 500\text{ ms}$, hiển thị màn hình thông báo tạm ngừng phục vụ, đình chỉ toàn bộ chu trình AI nhận diện và vô hiệu hóa các phím F2/F3/ESC; mở khóa qua lệnh `UNLOCK_KIOSK` từ Backend trong $\le 500\text{ ms}$ hoặc qua nhập mã PIN quản trị cục bộ (`KIOSK_ADMIN_PIN`, áp dụng lockout 15 phút sau 5 lần sai). | Approved |
| `FR-KSK-013` | Phân hệ Kiosk phải hỗ trợ tiếp nhận và áp dụng động các tham số cấu hình vận hành từ xa qua kênh WebSocket STOMP mà không cần khởi động lại ứng dụng. | Config / Remote Mgmt | Should | `ACT-003` | Nhận bản tin `UPDATE_CONFIG` từ `/topic/kiosk-config/{kioskId}`; kiểm tra tính hợp lệ của dải tham số (`similarity_threshold` trong khoảng 0.30–0.90, `liveness_threshold` trong khoảng 0.50–0.99, `cooldown_seconds` trong khoảng 10–600s, `inactivity_timeout_seconds` trong khoảng 10–120s); áp dụng ngay vào bộ nhớ trong $\le 100\text{ ms}$; kích hoạt Circuit Breaker cách ly 30 phút nếu nhận cấu hình lỗi > 3 lần/10 phút. | Approved |
| `FR-KSK-014` | Phân hệ Kiosk phải cung cấp giao diện tra cứu nhật ký hoạt động trạm biên tại chỗ (phím F12) bảo vệ bằng quyền Quản trị viên và hỗ trợ xuất nhật ký ra thiết bị USB bảo trì. | Auditing / Support | Should | `SRS-010`, `ACT-003` | Phím nóng F12 hiển thị bảng nhật ký 500 sự kiện gần nhất; yêu cầu xác thực Admin PIN; hỗ trợ xuất tệp text đã khử khuẩn (loại bỏ thông tin nhạy cảm, vector, token) ra ổ đĩa USB; ghi nhận sự kiện mở log vào audit log trạm. | Approved |
| `FR-KSK-015` | Phân hệ Kiosk phải lưu trữ đệm các lượt quẹt vào CSDL cục bộ SQLite chế độ WAL khi mất mạng và tự động đồng bộ bù khi có mạng lại. | Resiliency / Storage | Must | `PD-004`, `INF-011`, `FR-SYS-006`, `ACT-001` | Khi mất mạng hoặc gửi trực tiếp `POST /api/v1/kiosk/punch` thất bại (HTTP Timeout 3.0s), Kiosk tự động ghi bản ghi điểm danh vào bảng `offline_punches` trong CSDL SQLite WAL `kiosk_local.db` với `PRAGMA synchronous=FULL`; độ trễ ghi $\le 20\text{ ms}$; bảo đảm cam kết không thất thoát dữ liệu $\text{RPO} = 0$. | Approved |
| `FR-KSK-016` | Phân hệ Kiosk phải tự động đồng bộ bù các bản ghi ngoại tuyến theo lô tối đa 50 bản ghi/lần về Backend ngay khi kết nối mạng được phục hồi. | Resiliency / Sync | Must | `PD-004`, `FR-SYS-006`, `ACT-001` | Background worker định kỳ quét hàng đợi `offline_punches` mỗi 10 giây; khi có kết nối mạng, gom lô tối đa 50 bản ghi gửi tới `POST /api/v1/kiosk/sync-batch`; khi nhận HTTP 200, cập nhật `is_synced = 1` và mốc thời gian đồng bộ; đảm bảo 100% bản ghi được chuyển giao trọn vẹn và không trùng lặp. | Approved |
| `FR-KSK-017` | Phân hệ Kiosk phải có quy trình tự bảo vệ và hiển thị hướng dẫn phục hồi lỗi khi gặp sự cố trong quá trình khởi động trạm (Bootstrap Failure). | Reliability / Startup | Must | `ACT-003`, `FR-KSK-009` | Xử lý 4 kịch bản lỗi khởi động: (1) Lỗi kết nối Backend $\rightarrow$ Nạp phục hồi từ `local_gallery_cache` và chạy chế độ Offline-Ready; (2) Lỗi phần cứng Camera $\rightarrow$ Thử kết nối lại qua watchdog 3s và hiển thị cảnh báo hướng dẫn cắm lại USB; (3) CSDL SQLite bị khóa $\rightarrow$ Thử mở lại với `busy_timeout = 5000ms`; (4) Khóa mã hóa Master Key không hợp lệ $\rightarrow$ Khóa trạm hiển thị lỗi `ERR_CRYPTO_KEY_INVALID` và yêu cầu Quản trị viên nạp lại biến môi trường. | Approved |

---

### 2.2. Non-functional Requirements (Yêu cầu Phi chức năng)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-KSK-001` | Tổng thời gian chu kỳ tính toán suy luận toàn trình tại trạm Kiosk (Phát hiện + Liveness + Trích xuất 512D + So khớp ma trận RAM) phải đạt $\le 350\text{ ms}$ (p95) trên CPU thuần Intel Core i5 / AMD Ryzen 5 phổ thông hỗ trợ tập lệnh AVX2. | Performance | Must | `INF-006`, `PD-002`, `NFR-SYS-001` | Đo lường thời gian từ khung hình cuối cùng được chấp nhận đến khi hiển thị kết quả: YuNet $\le 20\text{ ms}$, MiniFASNet $\le 30\text{ ms}$, ArcFace $\le 50\text{ ms}$, Cosine 1:1,000 $\le 2\text{ ms}$, ghi SQLite WAL $\le 20\text{ ms}$ đạt p95 $\le 350\text{ ms}$; không tính thời gian người dùng căn chỉnh khuôn mặt vào khung Oval (0.5 - 1.0 giây). | Approved |
| `NFR-KSK-002` | Giao diện đồ họa Kiosk phải duy trì tốc độ hiển thị luồng video từ camera đạt $\ge 15\text{ FPS}$ (khuyến nghị $\ge 24\text{ FPS}$) liên tục, không bị rớt khung hình hay đơ giật trong suốt phiên vận hành. | Performance | Must | `INF-006`, `NFR-SYS-002` | Luồng hiển thị PySide6/QML tách biệt đa luồng bất đồng bộ (`QThread`) với luồng suy luận AI; không bị rớt khung hình khi thực hiện so khớp danh tính. | Approved |
| `NFR-KSK-003` | Cơ chế lưu trữ cục bộ SQLite chế độ WAL phải cam kết không thất thoát bất kỳ bản ghi điểm danh ngoại tuyến nào ($\text{RPO} = 0$) khi xảy ra sự cố mất điện đột ngột hoặc tắt máy cưỡng bức. | Reliability | Must | `INF-011`, `PD-004`, `NFR-SYS-006` | CSDL cục bộ `kiosk_local.db` kích hoạt chế độ WAL với chỉ thị `PRAGMA synchronous = FULL` và `busy_timeout = 5000ms`; 100% bản ghi điểm danh ngoại tuyến được bảo toàn nguyên vẹn sau sự cố cúp điện đột ngột. | Approved |
| `NFR-KSK-004` | Ứng dụng Kiosk phải vận hành bền bỉ liên tục 8 giờ làm việc với độ biến thiên dung lượng RAM tiêu thụ không vượt quá $10\%$ (Zero Memory Leak). | Reliability | Must | `PD-002`, `INF-006`, `NFR-SYS-009` | Bộ nhớ đệm khung hình video OpenCV/NumPy và đối tượng QImage được giải phóng triệt để ngay sau mỗi chu kỳ suy luận; tiến trình Kiosk giữ mức RAM ổn định $< 800\text{ MB}$; kiểm chứng bằng kịch bản chạy thử nghiệm 8 giờ liên tục với 2,000 lượt nhận diện. | Approved |
| `NFR-KSK-005` | Ứng dụng Kiosk phải tự động phát hiện mất tín hiệu camera và phục hồi kết nối trong vòng $\le 3\text{ giây}$ mà không làm sập ứng dụng. | Fault Tolerance | Must | `SRS-009`, `NFR-SYS-008` | Vòng lặp Watchdog định kỳ 3 giây kiểm tra trạng thái luồng video; khi phát hiện mất tín hiệu, hiển thị cảnh báo thân thiện trên giao diện và tự động kết nối lại thiết bị camera UVC khi cắm lại. | Approved |
| `NFR-KSK-006` | Độ chính xác nhận diện sinh trắc học khuôn mặt 1:N tại biên Kiosk phải đạt chuẩn ISO/IEC 19795-1 với tỷ lệ bỏ sót nhận diện sai $\text{FNIR} \le 5.0\%$ tại tỷ lệ chấp nhận sai $\text{FPIR} \le 0.1\%$. | Biometric Accuracy | Must | `INF-007`, `PD-002`, `NFR-SYS-004` | Thử nghiệm trên tập dữ liệu chuẩn 1,000 nhân viên với ngưỡng Cosine Similarity $\ge 0.50$ trong điều kiện độ rọi ánh sáng $\ge 150\text{ lux}$. | Approved |
| `NFR-KSK-007` | Khả năng phòng chống tấn công giả mạo (PAD) phải đạt tỷ lệ sai số tấn công thành công $\text{APCER} \le 2.0\%$ và tỷ lệ từ chối người thật $\text{BPCER} \le 5.0\%$ theo chuẩn ISO/IEC 30107-3. | Biometric PAD | Must | `INF-008`, `PD-003`, `NFR-SYS-005` | Mô hình MiniFASNet từ chối $\ge 98\%$ các mẫu tấn công Presentation Attack (ảnh in màu giấy A4, ảnh màn hình smartphone, video phát lại tablet) tại ngưỡng hoạt động $S_{\text{liveness}} \ge 0.85$. | Approved |
| `NFR-KSK-008` | Sai lệch đồng hồ hệ thống của trạm Kiosk so với máy chủ chuẩn giờ mạng NTP nội bộ phải duy trì trong ngưỡng $\le 50\text{ ms}$. | Clock Sync | Must | `SRS-008`, `NFR-SYS-006` | Trạm Kiosk định kỳ đồng bộ giờ với máy chủ NTP nội bộ (`EXT-003`) qua cổng UDP 123; cảnh báo trạng thái nếu sai lệch $> 50\text{ ms}$; tạm dừng nhận diện và cấm ghi nhận công tự động nếu sai lệch nghiêm trọng $> 1.0\text{ s}$. | Approved |
| `NFR-KSK-009` | Giao diện đồ họa Kiosk phải được tối ưu hóa cho màn hình cảm ứng tỷ lệ dọc 9:16 (1080x1920 hoặc 720x1280) và tuân thủ nguyên tắc thiết kế trợ năng cảm ứng. | Usability / UX | Should | `INF-003`, `NFR-SYS-010` | Kích thước phím bấm ảo tối thiểu $48\times 48\text{ dp}$ (phím PIN Pad $88\times 88\text{ px}$); độ tương phản màu chữ $\ge 4.5:1$; viền Oval hiển thị rõ ràng 4 trạng thái màu trực quan (Standby, Aligning, Success, Rejected); phản hồi âm thanh $\le 50\text{ ms}$. | Approved |
| `NFR-KSK-010` | Khởi động nguội ứng dụng Kiosk (Cold Startup) từ khi chạy tệp thực thi đến khi sẵn sàng nhận diện phải hoàn tất trong vòng $\le 5.0\text{ giây}$. | Performance | Should | `PD-002`, `NFR-SYS-001` | Bao gồm thời gian nạp mô hình ONNX Runtime vào RAM, kết nối camera USB, nạp ma trận 1,000 nhân sự từ bộ nhớ đệm SQLite và render giao diện QML đầu tiên. | Approved |
| `NFR-KSK-011` | Quá trình tắt ứng dụng Kiosk (Graceful Shutdown) phải hoàn tất trong vòng $\le 2.0\text{ giây}$, bảo đảm giải phóng trọn vẹn tài nguyên phần cứng và đóng kết nối CSDL an toàn. | Reliability | Should | `SRS-008`, `NFR-SYS-006` | Dừng an toàn luồng đọc camera OpenCV, đóng kết nối SQLite WAL (thực thi checkpoint WAL nếu cần), ngắt kết nối WebSocket STOMP và giải phóng bộ nhớ RAM trong $\le 2.0\text{ s}$. | Approved |

---

---

## 3. Architecture & Internal Design (Kiến trúc Nội bộ & Giải pháp Kỹ thuật)

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

---

### 2.5. Solution Components (Thành phần Kỹ thuật Giải pháp) (Thành phần Kỹ thuật Giải pháp)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-KSK-001` | Bộ Thu nhận Luồng Camera | Thu nhận khung hình qua OpenCV DirectShow, phát tín hiệu khung hình tới các luồng xử lý với tốc độ $\ge 15\text{ FPS}$. | `STK-002` | `FR-KSK-001`, `NFR-KSK-002` | `DD-KSK-001`, `DD-KSK-006` | Accepted |
| `SOL-KSK-002` | Bộ Phát hiện Mặt & Góc Euler | Sử dụng YuNet ONNX phát hiện mặt $\ge 120\times 120\text{ px}$, tính góc Yaw, Pitch, Roll $\le 15^\circ$ và tọa độ 5 điểm mốc. | `STK-002`, `STK-006` | `FR-KSK-001` | `DD-KSK-001` | Accepted |
| `SOL-KSK-003` | Cổng Kiểm chuẩn Oval & Ổn định | Kiểm tra độ lệch tâm $\le 120\text{ px}$, diện tích $25\% - 75\%$, độ sắc nét $\ge 30$ và giữ ổn định $0.5 - 1.0\text{ s}$ liên tục. | `STK-001`, `STK-003` | `FR-KSK-001`, `UI-KSK-001` | `DD-SYS-005` | Accepted |
| `SOL-KSK-004` | Cổng Lọc Thực thể sống MiniFASNet | Crop ảnh mở rộng 1.5x, đưa qua MiniFASNet tính điểm $S \ge 0.85$ để phân loại người thật vs ảnh in/màn hình. | `STK-002`, `STK-006` | `FR-KSK-002`, `NFR-KSK-007` | `DD-SYS-003`, `DD-SYS-027` | Accepted |
| `SOL-KSK-005` | Bộ Trích xuất Vector ArcFace | Căn chỉnh Affine 5 điểm mốc về $112\times 112\text{ px}$, trích xuất vector 512D chuẩn hóa L2 Norm = 1.0 qua ArcFace MobileFaceNet. | `STK-002`, `STK-006` | `FR-KSK-003`, `NFR-KSK-006` | `DD-SYS-001` | Accepted |
| `SOL-KSK-006` | Bộ So khớp Danh mục Ma trận RAM | Duy trì ma trận $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32`, nhân ma trận Cosine Similarity qua NumPy trong thời gian $< 2\text{ ms}$. | `STK-004` | `FR-KSK-003`, `NFR-KSK-001` | `DD-KSK-003` | Accepted |
| `SOL-KSK-007` | Bộ Thẩm định PIN Dự phòng qua Backend | Gửi mã PIN 6 số lên `POST /api/v1/kiosk/verify-pin` kèm `X-Kiosk-Id` + Secret Token; chỉ ghi nhận điểm danh khi nhận HTTP 200 với định danh nhân sự từ Backend; ánh xạ 401 `PIN_INVALID` và 423 `PIN_LOCKED` (kèm `lockedUntil`) thành trạng thái UI; không lưu hay so khớp PIN tại chỗ. | `STK-007`, `STK-003` | `FR-KSK-004`, `API-KSK-007` | `DD-KSK-004`, `DD-SYS-017` | Accepted |
| `SOL-KSK-008` | Bộ Quản lý Vòng đời Bộ nhớ Khung hình | Cấp phát và giải phóng tường minh mọi `np.ndarray` khung hình/ảnh crop trong mỗi chu kỳ suy luận; theo dõi mức tiêu thụ RAM và cảnh báo khi vượt ngưỡng để giữ biến thiên $\le 10\%$ sau 8 giờ chạy. | `STK-002`, `STK-004` | `NFR-KSK-004`, `DATA-KSK-005` | `DD-SYS-003` | Accepted |
| `SOL-KSK-009` | Vòng lặp Tự phục hồi Kết nối Camera | Phát hiện mất tín hiệu camera và tự thử mở lại thiết bị mỗi 3 giây theo Exponential Backoff nhẹ, không chặn luồng giao diện và không làm sập ứng dụng. | `STK-002` | `NFR-KSK-005`, `FR-KSK-001` | `DD-KSK-006` | Accepted |
| `SOL-KSK-010` | Bộ Đệm Cooldown Biên 120s | Ghi nhớ `last_punch_map = {emp_id: timestamp}` trong RAM, từ chối lượt quẹt dồn dập trong 120 giây. | `STK-001` | `FR-KSK-005` | `DD-SYS-006` | Accepted |
| `SOL-KSK-011` | Bộ Quản lý Hàng đợi SQLite WAL | Mở kết nối `kiosk_local.db` chế độ WAL, thực thi `enqueue_punch()`, `fetch_unsynced_batch()`, `mark_synced()`. | `STK-005` | `FR-KSK-015`, `FR-KSK-016`, `NFR-KSK-003` | `DD-KSK-002` | Accepted |
| `SOL-KSK-012` | KioskHeartbeatTelemetryModule | Định kỳ phát bản tin Heartbeat telemetry tới `POST /api/v1/kiosk/heartbeat` mỗi 60s và hiển thị màn hình chẩn đoán F4; đồng bộ thời gian NTP nội bộ duy trì độ lệch $\le 50\text{ ms}$. | `STK-007` | `FR-KSK-010`, `NFR-KSK-008` | `DD-KSK-005` | Accepted |
| `SOL-KSK-013` | InactivitySessionResetController | Bộ đếm thời gian Inactivity Timeout 30s tự động đóng bàn phím PIN và Modal đăng ký dở dang, reset máy trạng thái Oval về `STANDBY` và kích hoạt ngắt mạch Circuit Breaker khi lỗi lặp lại. | `STK-001` | `FR-KSK-011`, `NFR-KSK-006` | `DD-KSK-005` | Accepted |
| `SOL-KSK-014` | LocalAdminOpsAndShutdownHandler | Màn hình quản trị cục bộ F12 bảo vệ bằng Admin PIN Argon2id, xuất nhật ký đã khử PII ra USB và bắt tín hiệu SIGTERM/SIGINT giải phóng tài nguyên đóng SQLite WAL an toàn trong $\le 2\text{ giây}$. | `STK-007` | `FR-KSK-014`, `NFR-KSK-010`, `NFR-KSK-011` | `DD-SYS-028` | Accepted |

---


---

---

## 3. Giao diện Tiêu thụ & Kiến trúc Mạng Máy trạm (Consumed Interfaces & Network Architecture)

Phân hệ Kiosk đóng vai trò máy trạm biên (Edge Client) tiêu thụ các dịch vụ REST API và WebSocket STOMP do Backend Service cung cấp.

### 3.1. Danh mục Giao diện Tiêu thụ (`API-KSK-`)

| ID | Giao thức | Phương thức / Topic | Endpoint / Destination | Mô tả Tóm tắt | Nguồn Tham chiếu Upstream | Trạng thái |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| `API-KSK-001` | REST | `POST` | `/api/v1/kiosk/punch` | Gửi giao dịch điểm danh nhận diện khuôn mặt trực tuyến | `API-BE-003`, `FR-SYS-004` | Approved |
| `API-KSK-002` | REST | `POST` | `/api/v1/kiosk/sync-batch` | Đồng bộ gói lô bản ghi ngoại tuyến (tối đa 50 bản ghi/mẻ) | `API-BE-004`, `FR-SYS-005` | Approved |
| `API-KSK-003` | REST | `GET` | `/api/v1/kiosk/gallery` | Nạp toàn bộ danh mục vector đặc trưng khuôn mặt lúc khởi động | `API-BE-005`, `FR-SYS-002` | Approved |
| `API-KSK-004` | REST | `POST` | `/api/v1/kiosk/verify-otp` | Xác thực mã OTP 6 số kích hoạt quy trình tự đăng ký khuôn mặt | `API-BE-006`, `FR-SYS-008` | Approved |
| `API-KSK-005` | REST | `POST` | `/api/v1/kiosk/enroll-face` | Gửi vector 512D khuôn mặt mới sau khi tự nạp mẫu tại Kiosk | `API-BE-007`, `FR-SYS-008` | Approved |
| `API-KSK-006` | STOMP | `SUBSCRIBE` | `/topic/kiosk-gallery` | Kênh WebSocket lắng nghe nạp nóng/gỡ bỏ vector từ Backend | `API-BE-012`, `FR-SYS-002` | Approved |
| `API-KSK-007` | REST | `POST` | `/api/v1/kiosk/verify-pin` | Xác thực mã PIN dự phòng trực tuyến khi khuôn mặt thất bại | `API-BE-022`, `FR-SYS-017` | Approved |
| `API-KSK-008` | REST | `GET` | `/api/v1/kiosk/health` | Kiểm tra sẵn sàng của máy chủ trung tâm trước khi khởi động | `API-BE-045`, `NFR-SYS-008` | Approved |

### 3.2. Danh mục Thành phần Thiết kế Giao tiếp Mạng (`APD-KSK-`)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APD-KSK-001` | `KioskHttpClient` REST Client Wrapper | Thực hiện các lệnh gọi REST API đồng bộ/bất đồng bộ với timeout 3.0s; tự động tiêm Header xác thực (`X-Kiosk-Id`, Bearer Token); ánh xạ mã lỗi HTTP sang domain exceptions. | `STK-007` | `API-KSK-001`, `API-KSK-002`, `API-KSK-003`, `API-KSK-004`, `API-KSK-005`, `API-KSK-007`, `API-KSK-008` | `DD-SYS-001` | Accepted |
| `APD-KSK-002` | `KioskStompWorker` Real-time Receiver | Luồng nền `QThread` duy trì kết nối WebSocket STOMP tới Backend qua `stomp.py`, lắng nghe `/topic/kiosk-gallery`; tự động kết nối lại và phát tín hiệu nạp nóng vector. | `STK-008`, `STK-003` | `API-KSK-006` | `DD-SYS-001` | Accepted |
| `APD-KSK-003` | `OfflineSyncWorker` Batch Uploader | Luồng nền `QThread` quét hàng đợi SQLite `offline_punches` mỗi 10s, gom tối đa 50 bản ghi gửi `sync-batch` và cập nhật trạng thái đã gửi thành công. | `STK-005`, `STK-003` | `API-KSK-002` | `DD-SYS-005` | Accepted |
| `APD-KSK-004` | REST API Field-by-Field Contracts & Error Mapping | Quy chuẩn định dạng JSON, validation tham số và ánh xạ mã lỗi HTTP ProblemDetails cho toàn bộ các endpoint của trạm Kiosk. | `STK-007` | `API-KSK-001`, `API-KSK-007` | `DD-SYS-001` | Accepted |

## 4. Decisions (Quyết định Thiết kế Cấp Phân hệ Kiosk)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-KSK-001` | Phân tách kiến trúc thành 4 luồng độc lập qua `QThread` và Qt Signals/Slots. | Bảo đảm giao diện QML render $\ge 15\text{ FPS}$ liên tục không bị block khi luồng AI suy luận hoặc luồng mạng gặp độ trễ. | Chạy đơn luồng với `QCoreApplication.processEvents()`, Dùng module `threading` chuẩn Python | Phải tuân thủ quy tắc thread-safety của Qt; không truyền con trỏ thô giữa các luồng mà sử dụng Qt signals sao chép giá trị. | `NFR-KSK-002`, `NFR-KSK-001` | Accepted |
| `DD-KSK-002` | Kích hoạt SQLite WAL với `PRAGMA synchronous = FULL` và `busy_timeout = 5000ms`. | Cam kết không thất thoát dữ liệu ($\text{RPO} = 0$) khi mất điện đột ngột; hỗ trợ luồng đọc và luồng ghi đồng thời không bị lỗi `DatabaseLocked`. | Cấu hình `synchronous = NORMAL`, Lưu file text/JSON phẳng | Cần chạy tiến trình checkpoint dọn dẹp file WAL định kỳ để file SQLite không vượt quá 50 MB. | `FR-KSK-015`, `NFR-KSK-003`, `DD-SYS-002` | Accepted |
| `DD-KSK-003` | Quản lý danh mục khuôn mặt bằng ma trận RAM $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32` kết hợp hoán đổi con trỏ nguyên tử (Atomic Pointer Swap). | Tốc độ so khớp 1:1,000 nhân sự $< 2\text{ ms}$; nạp nóng vector mới từ STOMP tức thời mà luồng suy luận không gặp hiện tượng Race Condition. | Truy vấn CSDL SQLite mỗi lượt nhận diện, Dùng cấu trúc cây Faiss/HNSW | Tiêu tốn ~2 MB RAM cho 1,000 nhân viên; khi quy mô vượt 10,000 nhân sự mới cần phân đoạn ma trận. | `FR-KSK-003`, `FR-KSK-008`, `NFR-KSK-001` | Accepted |
| `DD-KSK-004` | Cơ chế Circuit Breaker và Lockout đa tầng tại trạm Kiosk. | Bảo vệ trạm trước tấn công brute-force PIN (khóa 15 phút sau 5 lần sai) và cách ly trạm 30 phút nếu nhận cấu hình lỗi liên tiếp > 3 lần/10 phút; hỗ trợ thoát khóa khẩn cấp qua Backend unlock hoặc Admin PIN local (`KIOSK_ADMIN_PIN`). | Khóa cứng không có đường thoát, Cho phép thử lại vô hạn | Cần cấu hình biến môi trường `KIOSK_ADMIN_PIN` an toàn và ghi audit log mọi lượt mở khóa. | `FR-KSK-004`, `FR-KSK-012`, `FR-KSK-013` | Accepted |
| `DD-KSK-005` | Quản lý biến môi trường cấu hình trạm (`KioskConfig`) bằng Windows NTFS ACL và DPAPI. | Bảo vệ Secret Token trạm không bị lộ qua lệnh xem tiến trình hay người dùng không có quyền truy cập file trên máy trạm Windows 11; không ghi log Secret Token. | Lưu token trong Registry, Lưu plaintext không phân quyền file | Script cài đặt trạm phải cấp quyền NTFS 0600 (chỉ tài khoản System/Service chạy trạm mới đọc được file cấu hình). | `FR-KSK-009`, `NFR-KSK-010`, `DD-SYS-020` | Accepted |
| `DD-KSK-006` | Vòng lặp tự phục hồi kết nối Camera (`watchdog reconnect loop`) chu kỳ 3 giây. | Đảm bảo tính sẵn sàng cao khi camera bị rung lắc giắc cắm USB hoặc chập chờn cáp tín hiệu mà không làm sập ứng dụng Kiosk. | Dừng ứng dụng khi mất camera, Thử kết nối lại tức thời gây chiếm dụng CPU | Giao diện hiển thị cảnh báo mất tín hiệu thân thiện và tự động kết nối lại trơn tru khi thiết bị cắm lại. | `FR-KSK-001`, `NFR-KSK-005`, `NFR-SYS-008` | Accepted |

---

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Thiết bị Đầu cuối Windows 11**: Ứng dụng Kiosk được thiết kế tối ưu cho nền tảng Windows 11 Pro 64-bit, màn hình cảm ứng tỷ lệ dọc 9:16 (1080x1920 hoặc 720x1280), CPU Intel Core i5 / AMD Ryzen 5 phổ thông hỗ trợ tập lệnh AVX2.
* **Thời gian Khởi động Nguội Ngoại tuyến**: Khi khởi động lại máy trạm trong tình trạng đứt mạng, Kiosk nạp phục hồi danh mục vector từ bảng đệm `local_gallery_cache` trong SQLite WAL đã được mã hóa AES-256-GCM với Secret Token của trạm (`DATA-KSK-007`).
* **Kênh Thẩm định PIN Dự phòng Trực tuyến**: Phương thức điểm danh bằng mã PIN bắt buộc thẩm định tập trung tại Backend (`POST /api/v1/kiosk/verify-pin`). Trong kịch bản sự cố kép hy hữu (đồng thời mất mạng VÀ lỗi nhận diện khuôn mặt), nhân viên sử dụng hình thức nộp đơn giải trình công bổ sung trên Cổng Web (`FR-SYS-016`) sau khi kết nối phục hồi.
* **Hiệu chuẩn Ngưỡng Cosine & Điểm sống Liveness**: Ngưỡng Cosine Similarity mặc định cấu hình là 0.50 (`FR-KSK-003`, `NFR-KSK-006`). Ngưỡng điểm sống thụ động liveness được cấu hình $S_{\text{liveness}} \ge 0.85$ cho nhận diện vận hành (`FR-KSK-002`) và $S_{\text{liveness}} \ge 0.90$ cho luồng tự nạp mẫu (`FR-KSK-007`) với Safety Margin +5%.
* **Đồng bộ Mốc Giờ Ngoại tuyến**: Khi Kiosk ngoại tuyến, mốc thời gian chấm công được ghi nhận từ đồng hồ máy trạm hệ điều hành Windows; nếu phát hiện sai lệch giờ > 1.0 s so với NTP trước khi mất mạng, bản ghi được gắn cờ `time_unreliable: true` để HR đối soát sau khi đồng bộ lên Backend.
* **Thời gian Giữ Ổn định Khuôn mặt**: Khoảng thời gian 0.5 - 1.0 s giữ mặt ổn định trong khung Oval là điều kiện kích hoạt suy luận, tách biệt với ngân sách thời gian tính toán chu kỳ AI $\le 350\text{ ms}$.
