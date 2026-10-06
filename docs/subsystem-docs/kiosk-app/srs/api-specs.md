---
title: Kiosk API Specifications
version: 2.1
status: Approved
owner: Edge Vision Lead & Network Engineer
---

# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Kiosk

Đặc tả các giao diện lập trình ứng dụng RESTful API và kênh truyền thông thời gian thực WebSocket STOMP do máy trạm Kiosk tiêu thụ từ phân hệ Backend theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §7.2).

---

## 1. Consumed Interfaces Specifications (Đặc tả Giao diện Tiêu thụ)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `API-KSK-001` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/punches`: Gửi sự kiện điểm danh trực tuyến ngay sau khi xác thực thành công. | REST | Must | `FR-SYS-005`, `FR-SYS-013`, `ARC-005`, `FR-KSK-005`, `FR-KSK-006` | Header `X-Kiosk-Id`, timeout 3.0s, Backend phản hồi $\le 300\text{ ms}$; khi lỗi mạng tự động chuyển ghi SQLite WAL. | Approved |
| `API-KSK-002` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/sync-batch`: Đẩy gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi mạng phục hồi. | REST | Must | `FR-SYS-006`, `NFR-SYS-006`, `ARC-005`, `FR-KSK-006` | Phản hồi $\le 2000\text{ ms}$; nhận danh sách ID đã lưu; cập nhật `is_synced = 1` trong SQLite cục bộ; chống trùng bằng khóa `(kioskId, localId)`. | Approved |
| `API-KSK-003` | Tiêu thụ giao diện `GET /api/v1/kiosks/{id}/gallery`: Tải toàn bộ danh mục vector 512D của nhân sự `ACTIVE` khi Kiosk khởi động. | REST | Must | `FR-SYS-003`, `FR-SYS-014`, `ARC-005`, `FR-KSK-003` | Phản hồi $\le 3000\text{ ms}$; hỗ trợ nén `gzip` qua TLS 1.3; nạp đủ $N$ vector vào RAM; fallback nạp từ `local_gallery_cache` nếu mất mạng. | Approved |
| `API-KSK-004` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/verify-otp`: Xác thực mã OTP 6 số nhân viên nhập tại Kiosk để mở khóa quét mặt. | REST | Must | `FR-SYS-008`, `FR-SYS-009`, `ARC-005`, `FR-KSK-007` | Phản hồi $\le 1000\text{ ms}$; nhận thông tin nhân viên khi OTP hợp lệ; hiển thị thông báo lỗi khi OTP sai/hết hạn. | Approved |
| `API-KSK-005` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/enroll-face`: Gửi vector đặc trưng 512D mới kèm mã OTP để lưu CSDL và kích hoạt hồ sơ. | REST | Must | `FR-SYS-009`, `FR-SYS-010`, `ARC-005`, `FR-KSK-007` | Phản hồi $\le 1500\text{ ms}$; nhận xác nhận HTTP 200; tự hủy OTP (burn-after-use); cập nhật tức thì vector mới vào Gallery RAM Kiosk. | Approved |
| `API-KSK-006` | Lắng nghe kênh STOMP Topic `/topic/kiosk-gallery`: Đón nhận thông điệp nạp nóng vector mới hoặc xóa nhân sự thôi việc. | WebSocket | Must | `FR-SYS-014`, `ARC-006`, `FR-KSK-008` | Cập nhật ma trận RAM tức thời qua Atomic Swap mà không làm giật khung hình camera; tự kết nối lại khi đứt mạng. | Approved |
| `API-KSK-007` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/verify-pin`: Xác thực mã PIN 6 số của nhân viên qua Backend trước khi ghi nhận điểm danh. | REST | Must | `FR-SYS-004`, `FR-SYS-017`, `ARC-001`, `ARC-002`, `FR-KSK-004` | Phản hồi $\le 1000\text{ ms}$; trả HTTP 200 kèm danh tính nếu PIN đúng; trả 401 nếu sai kèm lượt thử; trả 423 kèm `lockedUntil` nếu sai quá 5 lần. | Approved |

---

## 2. Đặc tả Tham số & Biên Dữ liệu (Interface Input/Output Specifications)

### 2.1. `API-KSK-001` — `POST /api/v1/kiosks/{id}/punches`
* **Mục đích**: Gửi giao dịch chấm công trực tuyến tức thời từ Kiosk lên Backend.
* **Headers**: `X-Kiosk-Id: {kiosk_id}`, `Authorization: Bearer {kiosk_token}`, `Content-Type: application/json`.
* **Payload đầu vào (Request)**:
  ```json
  {
    "employeeId": 1042,
    "punchTimestamp": "2026-10-06T08:30:15.123+07:00",
    "verificationMethod": "VERIFICATION_FACE",
    "confidenceScore": 0.882,
    "kioskId": "KIOSK-HN-01"
  }
  ```
* **Payload thành công (Response 200 OK — Chuẩn hóa Envelope `DD-SYS-012`)**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": "Punch recorded successfully",
    "data": {
      "recordId": 9812,
      "employeeCode": "NV-1042",
      "fullName": "Ngô Văn Dũng",
      "punchType": "CHECK_IN",
      "status": "ON_TIME",
      "lateMinutes": 0,
      "department": "Phòng Kỹ thuật"
    },
    "timestamp": "2026-10-06T08:30:15.350Z"
  }
  ```
* **Xử lý Biên & Mã Lỗi**:
  * `409 Conflict` (`COOLDOWN_ACTIVE`): Quét lặp trong 120s; response trả `{"success": false, "code": "COOLDOWN_ACTIVE", "message": "Cooldown window active", "timestamp": "..."}`; Kiosk hiển thị "Đã ghi nhận", không ghi offline.
  * Timeout client $\ge 3.0\text{ s}$ / Lỗi mạng (`HTTP 5xx` / Connection Refused): Tự động lưu vào SQLite WAL `offline_punches`. Backend xử lý và phản hồi $\le 300\text{ ms}$ (`NFR-SYS-003`).

### 2.2. `API-KSK-002` — `POST /api/v1/kiosks/{id}/sync-batch`
* **Mục đích**: Đẩy gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi kết nối mạng phục hồi.
* **Khóa chống trùng lặp (Idempotency Key)**: Bộ đôi `(kioskId, localId)`. Backend áp dụng quy tắc `ON CONFLICT DO NOTHING` trên `(kiosk_id, local_id)` đảm bảo gửi lại không bao giờ sinh duplicate punch (`D13`).
* **Payload đầu vào (Request)**:
  ```json
  {
    "batchSize": 2,
    "records": [
      {
        "localId": 101,
        "employeeId": 1042,
        "punchTimestamp": "2026-10-06T07:55:00.000+07:00",
        "verificationMethod": "VERIFICATION_FACE",
        "confidenceScore": 0.891,
        "kioskId": "KIOSK-HN-01"
      },
      {
        "localId": 102,
        "employeeId": 1045,
        "punchTimestamp": "2026-10-06T07:58:12.000+07:00",
        "verificationMethod": "VERIFICATION_PIN",
        "confidenceScore": null,
        "kioskId": "KIOSK-HN-01"
      }
    ]
  }
  ```
* **Payload thành công (Response 200 OK — Chuẩn hóa Envelope `DD-SYS-012`)**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": "Batch synced successfully",
    "data": {
      "syncedCount": 2,
      "syncedLocalIds": [101, 102]
    },
    "timestamp": "2026-10-06T08:05:00.120Z"
  }
  ```
* **Xử lý Biên**: Cập nhật `is_synced = 1` cho các ID có trong `syncedLocalIds`; các bản ghi lỗi giữ nguyên để retry theo Exponential Backoff.

### 2.3. `API-KSK-003` — `GET /api/v1/kiosks/{id}/gallery`
* **Mục đích**: Tải toàn bộ danh mục vector 512D của nhân sự `ACTIVE` khi Kiosk khởi động.
* **Bảo mật & Nén kênh truyền**: Toàn bộ dữ liệu truyền qua TLS 1.3; hỗ trợ tiêu đề `Accept-Encoding: gzip` và Backend nén `Content-Encoding: gzip` để giảm dung lượng mạng từ ~10MB xuống ~2MB cho 1,000 nhân sự.
* **Payload thành công (Response 200 OK — Chuẩn hóa Envelope `DD-SYS-012`)**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": "Gallery retrieved successfully",
    "data": {
      "version": 12,
      "totalCount": 1000,
      "employees": [
        {
          "employeeId": 1042,
          "employeeCode": "NV-1042",
          "fullName": "Ngô Văn Dũng",
          "department": "Phòng Kỹ thuật",
          "vector": [0.0234, -0.0152, 0.0891]
        }
      ]
    },
    "timestamp": "2026-10-06T07:00:00.000Z"
  }
  ```
* **Xử lý Biên**: Nếu lỗi mạng hoặc timeout 3.0s, Kiosk nạp dữ liệu từ bảng SQLite `local_gallery_cache` (`DATA-KSK-007`).

### 2.4. `API-KSK-004` — `POST /api/v1/kiosks/{id}/verify-otp`
* **Mục đích**: Xác thực mã Onboarding OTP 6 số nhân viên nhập tại màn hình đăng ký khuôn mặt.
* **Payload đầu vào (Request)**: `{"otpCode": "123456"}`
* **Response 200 OK — Chuẩn hóa Envelope `DD-SYS-012`**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": "OTP verified successfully",
    "data": {
      "valid": true,
      "employeeId": 1042,
      "employeeCode": "NV-1042",
      "fullName": "Ngô Văn Dũng",
      "department": "Phòng Kỹ thuật"
    },
    "timestamp": "2026-10-06T08:30:15.123Z"
  }
  ```
* **Response 400/404 (Lỗi OTP)**:
  ```json
  {
    "success": false,
    "code": "OTP_INVALID",
    "message": "OTP code is invalid or has expired",
    "data": null,
    "timestamp": "2026-10-06T08:30:15.123Z"
  }
  ```

### 2.5. `API-KSK-005` — `POST /api/v1/kiosks/{id}/enroll-face`
* **Mục đích**: Gửi vector khuôn mặt 512D mới trích xuất từ 3 ảnh chụp camera chính kèm mã OTP để lưu trữ CSDL.
* **Cơ chế Hủy OTP**: Mã OTP chỉ được sử dụng đúng 1 lần; ngay sau khi Backend lưu vector thành công, OTP tự động bị hủy (burn-after-use). Nếu request bị timeout, OTP vẫn còn hiệu lực trong cửa sổ 48h để thử lại.
* **Payload đầu vào (Request)**:
  ```json
  {
    "employeeId": 1042,
    "otpCode": "123456",
    "featureVector": [0.0234, -0.0152, 0.0891]
  }
  ```
* **Response 200 OK — Chuẩn hóa Envelope `DD-SYS-012`**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": "Face enrolled successfully",
    "data": {
      "status": "ENROLLED",
      "enrolledAt": "2026-10-06T08:32:00.000Z"
    },
    "timestamp": "2026-10-06T08:32:00.123Z"
  }
  ```
* **Xử lý Kiosk**: Nạp tức thì vector mới vào `GalleryMatrix` và cập nhật `local_gallery_cache`.

### 2.6. `API-KSK-006` — STOMP Topic `/topic/kiosk-gallery`
* **Mục đích**: Nhận thông điệp đồng bộ vector từ Backend thời gian thực khi có nhân sự mới đăng ký hoặc thôi việc.
* **Tin nhắn nhận được (JSON Message)**:
  * Sự kiện thêm mới: `{"action": "ADD", "employeeId": 1042, "code": "NV-1042", "name": "Ngô Văn Dũng", "department": "Kỹ thuật", "vector": [...]}`
  * Sự kiện xóa: `{"action": "DELETE", "employeeId": 1042}`
* **Xử lý Kiosk**: Thực thi Atomic Swap trên ma trận RAM mà không khóa luồng đọc video camera.

### 2.7. `API-KSK-007` — `POST /api/v1/kiosks/{id}/verify-pin`
* **Mục đích**: Xác thực mã PIN 6 số của nhân viên qua Backend khi điểm danh bằng bàn phím số ảo (hoặc nhân sự đã rút Consent).
* **Headers**: `X-Kiosk-Id: {kiosk_id}`, `Authorization: Bearer {kiosk_token}`, `Content-Type: application/json`.
* **Payload đầu vào (Request)**:
  ```json
  {
    "employeeCode": "NV-1042",
    "pin": "123456"
  }
  ```
* **Response 200 OK (Xác thực PIN đúng — Envelope `DD-SYS-012`)**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": "PIN verified successfully",
    "data": {
      "valid": true,
      "employeeId": 1042,
      "employeeCode": "NV-1042",
      "fullName": "Ngô Văn Dũng",
      "department": "Phòng Kỹ thuật"
    },
    "timestamp": "2026-10-06T08:30:15.123Z"
  }
  ```
  $\rightarrow$ Kiosk ghi nhận giao dịch điểm danh với `verificationMethod = "VERIFICATION_PIN"`.
* **Response 401 Unauthorized (Sai mã PIN — Envelope `DD-SYS-012`)**:
  ```json
  {
    "success": false,
    "code": "PIN_INVALID",
    "message": "Mã PIN không chính xác",
    "data": {
      "remainingAttempts": 2
    },
    "timestamp": "2026-10-06T08:30:15.123Z"
  }
  ```
  $\rightarrow$ Kiosk hiển thị thông báo "Mã PIN không chính xác, còn 2 lần thử" và rung nhẹ bàn phím số; không tạo bản ghi điểm danh.
* **Response 423 Locked (Bị khóa do sai 5 lần — Envelope `DD-SYS-012`)**:
  ```json
  {
    "success": false,
    "code": "PIN_LOCKED",
    "message": "Tài khoản tạm thời bị khóa do nhập sai PIN quá 5 lần",
    "data": {
      "lockedUntil": "2026-10-06T08:45:15.123Z"
    },
    "timestamp": "2026-10-06T08:30:15.123Z"
  }
  ```
  $\rightarrow$ Kiosk khóa bàn phím số, đếm ngược thời gian mở khóa theo `lockedUntil`.


