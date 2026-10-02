# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Kiosk

> **Mã tài liệu:** `SPEC-API-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các giao diện mà trạm Kiosk tiêu thụ (Consumed Interfaces) từ Backend và kênh nhận dữ liệu đẩy thời gian thực WebSocket STOMP.

---

## 1. Danh mục Giao diện Tiêu thụ (Consumed Interfaces Summary)

Toàn bộ các yêu cầu HTTP gửi từ trạm Kiosk lên Backend đều bắt buộc có:
* Base URL: `http://localhost:8080/api/v1` (Môi trường Dev) hoặc URL máy chủ Backend được nạp từ `kiosk_config.json`.
* Header bắt buộc:
  * `Content-Type: application/json; charset=UTF-8`
  * `X-Kiosk-Id: <kiosk_id>` (Ví dụ: `KIOSK-HN-01`)
  * `Authorization: Bearer <kiosk_secret_token>` (Token bí mật được cấu hình tĩnh hoặc cấp phát cho trạm)
* Timeout mặc định: $3.0\text{ s}$.

| Mã Giao diện | Tên Nghiệp vụ | Phương thức & Đường dẫn | Trách nhiệm Kỹ thuật | SLA Phản hồi | Xử lý khi Lỗi Mạng |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `API-KSK-001` | Gửi Điểm danh Trực tiếp | `POST /api/v1/kiosk/punch` | Gửi kết quả nhận diện (khuôn mặt hoặc mã PIN) ngay sau khi xác thực thành công. | $\le 500\text{ ms}$ | Ghi ngay vào SQLite WAL (`offline_punches`), thông báo offline thành công. |
| `API-KSK-002` | Đồng bộ Bù Ngoại tuyến | `POST /api/v1/kiosk/sync-batch` | Đẩy gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi mạng phục hồi. | $\le 2000\text{ ms}$ | Thử lại sau $10\text{ s}$ ở chu kỳ quét tiếp theo của `OfflineSyncWorker`. |
| `API-KSK-003` | Tải Danh mục Vector Mẫu | `GET /api/v1/kiosk/gallery` | Tải toàn bộ danh mục vector 512D của nhân sự `ACTIVE` khi Kiosk khởi động. | $\le 3000\text{ ms}$ | Fallback nạp từ snapshot SQLite cục bộ `local_gallery_cache` (nếu có). |
| `API-KSK-004` | Xác minh OTP Kích hoạt | `POST /api/v1/kiosk/verify-otp` | Xác thực mã OTP 6 số nhân viên nhập tại màn hình Kiosk để mở khóa quét mặt. | $\le 1000\text{ ms}$ | Hiển thị thông báo lỗi mạng trên modal, giữ nguyên trạng thái nhập. |
| `API-KSK-005` | Nạp Vector Mẫu Mới | `POST /api/v1/kiosk/enroll-face` | Gửi vector đặc trưng 512D mới trích xuất từ camera kèm session token để lưu CSDL. | $\le 1500\text{ ms}$ | Hiển thị lỗi nạp thất bại trên modal, cho phép bấm thử lại. |
| `API-KSK-006` | Kênh Đẩy Cập nhật Gallery | STOMP Topic `/topic/kiosk-gallery` | Đón nhận thông điệp đẩy nạp nóng vector mới hoặc xóa nhân sự thôi việc vào RAM. | Thời gian thực | Tự động thử lại kết nối WebSocket với Exponential Backoff. |

---

## 2. Đặc tả Tham số & Biên Dữ liệu (Interface Input/Output Specifications)

### 2.1. `API-KSK-001` — `POST /api/v1/kiosk/punch`
* **Mục đích**: Gửi giao dịch chấm công trực tuyến tức thời.
* **Payload đầu vào (Request)**:
  * `employeeId` (`int64`, bắt buộc): Mã ID nhân viên khớp từ Gallery RAM (`> 0`).
  * `punchTimestamp` (`string`, bắt buộc): Chuỗi ISO-8601 kèm múi giờ lấy từ đồng hồ hệ thống Kiosk (Ví dụ: `2026-10-03T08:29:45.120+07:00`).
  * `verificationMethod` (`string`, bắt buộc): `VERIFICATION_FACE` hoặc `VERIFICATION_PIN`.
  * `confidenceScore` (`float`, không bắt buộc): Điểm cosine ($0.0 \le score \le 1.0$), `null` nếu xác thực bằng PIN.
  * `kioskId` (`string`, bắt buộc): Khớp với `kiosk_id` trong cấu hình.
* **Payload thành công (Response 200 OK)**:
  * Trả về thông tin chấm công đã chuẩn hóa: `recordId`, `employeeCode`, `fullName`, `punchType` (`CHECK_IN`/`CHECK_OUT`), `status` (`ON_TIME`/`LATE`), `lateMinutes`, `department`.
* **Xử lý Biên & Mã Lỗi**:
  * `409 Conflict` (`COOLDOWN_ACTIVE`): Kiosk bỏ qua, không ghi offline, hiển thị thông báo đã quẹt trước đó.
  * `TimeoutException` / `ConnectionError`: Kiosk lưu vào SQLite cục bộ và kích hoạt UI hiển thị "Điểm danh ngoại tuyến thành công".

---

### 2.2. `API-KSK-002` — `POST /api/v1/kiosk/sync-batch`
* **Mục đích**: Đẩy danh sách bản ghi ngoại tuyến tồn đọng trong SQLite lên Backend.
* **Payload đầu vào (Request)**:
  * `kioskId` (`string`, bắt buộc): Mã trạm Kiosk.
  * `batchSize` (`int`, bắt buộc): Số lượng bản ghi trong lô ($1 \le batchSize \le 50$).
  * `records` (`array[object]`, bắt buộc): Mảng các bản ghi ngoại tuyến, mỗi phần tử gồm:
    * `localQueueId` (`int64`): ID tăng tự động từ SQLite `offline_punches.local_id`.
    * `employeeId` (`int64`): ID nhân sự.
    * `punchTimestamp` (`string`): Chuỗi ISO-8601 thời điểm quẹt thực tế lúc offline.
    * `verificationMethod` (`string`): `VERIFICATION_FACE` hoặc `VERIFICATION_PIN`.
    * `confidenceScore` (`float`, nullable): Điểm cosine matching lúc offline.
* **Payload thành công (Response 200 OK)**:
  * `syncedCount` (`int`): Số lượng bản ghi đã xử lý thành công.
  * `syncedLocalIds` (`array[int64]`): Danh sách `localQueueId` đã lưu CSDL thành công để Kiosk cập nhật SQLite `status = 'SENT'`.
  * `failedLocalIds` (`array[int64]`): Danh sách `localQueueId` thất bại (nếu có).

---

### 2.3. `API-KSK-003` — `GET /api/v1/kiosk/gallery`
* **Mục đích**: Kiosk kéo toàn bộ danh mục vector đặc trưng sinh trắc học để nạp vào bộ nhớ RAM khi ứng dụng khởi động.
* **Tham số Query**: Không có.
* **Payload thành công (Response 200 OK)**:
  * `galleryVersion` (`int`): Phiên bản danh mục vector tại Backend.
  * `totalCount` (`int`): Tổng số nhân viên đang `ACTIVE` có vector.
  * `items` (`array[object]`): Mảng vector, mỗi phần tử gồm:
    * `employeeId` (`int64`), `employeeCode` (`string`), `fullName` (`string`), `department` (`string`).
    * `vector512` (`array[float]`): Mảng 512 số thực đặc trưng chuẩn hóa $L_2$.
    * `updatedAt` (`string`): Thời điểm cập nhật mẫu.

---

### 2.4. `API-KSK-004` — `POST /api/v1/kiosk/verify-otp`
* **Mục đích**: Xác minh mã OTP 6 số nhân viên nhập trên màn hình cảm ứng để kích hoạt đăng ký khuôn mặt mới.
* **Payload đầu vào (Request)**:
  * `otp` (`string`, bắt buộc): Chuỗi 6 chữ số (`^\d{6}$`).
  * `kioskId` (`string`, bắt buộc): Mã trạm Kiosk.
* **Payload thành công (Response 200 OK)**:
  * `sessionToken` (`string`): Khóa bảo mật phiên đăng ký tạm thời (hết hạn sau $5\text{ phút}$).
  * `employeeId` (`int64`), `employeeCode` (`string`), `fullName` (`string`), `department` (`string`).
* **Xử lý Biên & Mã Lỗi**:
  * `400 Bad Request` (`OTP_INVALID` / `OTP_EXPIRED`): Kiosk hiển thị lỗi "Mã OTP không chính xác hoặc đã hết hạn".
  * `409 Conflict` (`OTP_ALREADY_USED`): Kiosk hiển thị lỗi "Mã OTP này đã được sử dụng".

---

### 2.5. `API-KSK-005` — `POST /api/v1/kiosk/enroll-face`
* **Mục đích**: Gửi vector trích xuất từ 5 khung hình camera chất lượng cao tại Kiosk lên máy chủ lưu trữ.
* **Payload đầu vào (Request)**:
  * `otp` (`string`, bắt buộc): Chuỗi 6 chữ số đã xác minh.
  * `sessionToken` (`string`, bắt buộc): Token phiên nhận được từ `API-KSK-004`.
  * `vector512` (`array[float]`, bắt buộc): Đúng 512 số float32 với độ dài chuẩn $L_2 = 1.0 \pm 10^{-4}$.
  * `kioskId` (`string`, bắt buộc): Mã trạm Kiosk.
* **Payload thành công (Response 200 OK)**:
  * `employeeId` (`int64`), `templateId` (`int64`), `status` (`ACTIVE`), `activatedAt` (`string`).

---

### 2.6. `API-KSK-006` — STOMP Topic `/topic/kiosk-gallery`
* **Mục đích**: Kênh đăng ký nhận thông điệp cập nhật Gallery thời gian thực từ Backend.
* **Phương thức**: WebSocket STOMP qua đường dẫn `/ws-attendance`.
* **Payload Sự kiện (Message Schema)**:
  * Sự kiện Thêm/Cập nhật (`action = "ADD_VECTOR"`): Gồm `employeeId`, `employeeCode`, `fullName`, `vector512`, `updatedAt`.
  * Sự kiện Thu hồi/Xóa (`action = "DELETE_VECTOR"`): Gồm `employeeId`, `reason` (`EMPLOYEE_TERMINATED` / `BIOMETRIC_REVOKED`), `updatedAt`.
