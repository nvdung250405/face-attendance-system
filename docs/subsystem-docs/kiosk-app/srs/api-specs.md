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
| `API-KSK-001` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/punches`: Gửi sự kiện điểm danh trực tuyến ngay sau khi xác thực thành công. | REST | Must | `FR-SYS-005`, `FR-SYS-013`, `ARC-005`, `FR-KSK-001` | Header `X-Kiosk-Id`, timeout 3.0s, phản hồi $\le 500\text{ ms}$; khi lỗi mạng tự động chuyển ghi SQLite WAL. | Approved |
| `API-KSK-002` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/sync-batch`: Đẩy gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi mạng phục hồi. | REST | Must | `FR-SYS-006`, `NFR-SYS-006`, `ARC-005`, `FR-KSK-006` | Phản hồi $\le 2000\text{ ms}$; nhận danh sách ID đã lưu; cập nhật `is_synced = 1` trong SQLite cục bộ. | Approved |
| `API-KSK-003` | Tiêu thụ giao diện `GET /api/v1/kiosks/{id}/gallery`: Tải toàn bộ danh mục vector 512D của nhân sự `ACTIVE` khi Kiosk khởi động. | REST | Must | `FR-SYS-003`, `FR-SYS-014`, `ARC-005`, `FR-KSK-003` | Phản hồi $\le 3000\text{ ms}$; nạp đủ $N$ vector vào RAM; fallback nạp từ `local_gallery_cache` nếu mất mạng. | Approved |
| `API-KSK-004` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/verify-otp`: Xác thực mã OTP 6 số nhân viên nhập tại Kiosk để mở khóa quét mặt. | REST | Must | `FR-SYS-008`, `FR-SYS-009`, `ARC-005`, `FR-KSK-007` | Phản hồi $\le 1000\text{ ms}$; nhận thông tin nhân viên khi OTP hợp lệ; hiển thị thông báo lỗi khi OTP sai/hết hạn. | Approved |
| `API-KSK-005` | Tiêu thụ giao diện `POST /api/v1/kiosks/{id}/enroll-face`: Gửi vector đặc trưng 512D mới kèm mã OTP để lưu CSDL và kích hoạt hồ sơ. | REST | Must | `FR-SYS-009`, `FR-SYS-010`, `ARC-005`, `FR-KSK-007` | Phản hồi $\le 1500\text{ ms}$; nhận xác nhận HTTP 200; cập nhật tức thì vector mới vào Gallery RAM Kiosk. | Approved |
| `API-KSK-006` | Lắng nghe kênh STOMP Topic `/topic/kiosk-gallery`: Đón nhận thông điệp nạp nóng vector mới hoặc xóa nhân sự thôi việc. | WebSocket | Must | `FR-SYS-014`, `ARC-006`, `FR-KSK-008` | Cập nhật ma trận RAM tức thời qua Atomic Swap mà không làm giật khung hình camera; tự kết nối lại khi đứt mạng. | Approved |

---

## 2. Đặc tả Tham số & Biên Dữ liệu (Interface Input/Output Specifications)

### 2.1. `API-KSK-001` — `POST /api/v1/kiosks/{id}/punches`
* **Mục đích**: Gửi giao dịch chấm công trực tuyến tức thời từ Kiosk lên Backend.
* **Headers**: `X-Kiosk-Id: {kiosk_id}`, `Authorization: Bearer {kiosk_token}`, `Content-Type: application/json`.
* **Payload đầu vào (Request)**:
  * `employeeId` (`int64`, bắt buộc): Mã ID nhân viên khớp từ Gallery RAM (`> 0`).
  * `punchTimestamp` (`string`, bắt buộc): Chuỗi ISO-8601 kèm múi giờ lấy từ đồng hồ Kiosk (Ví dụ: `2026-10-03T08:29:45.120+07:00`).
  * `verificationMethod` (`string`, bắt buộc): `VERIFICATION_FACE` hoặc `VERIFICATION_PIN`.
  * `confidenceScore` (`float`, không bắt buộc): Điểm cosine ($0.0 \le score \le 1.0$), `null` nếu xác thực bằng PIN.
  * `kioskId` (`string`, bắt buộc): Khớp với `kiosk_id` trong cấu hình.
* **Payload thành công (Response 200 OK)**:
  * `{"recordId": 9812, "employeeCode": "NV-1042", "fullName": "Ngô Văn Dũng", "punchType": "CHECK_IN", "status": "ON_TIME", "lateMinutes": 0, "department": "Phòng Kỹ thuật"}`
* **Xử lý Biên & Mã Lỗi**:
  * `409 Conflict` (`COOLDOWN_ACTIVE`): Quét lặp trong 120s; Kiosk hiển thị "Đã ghi nhận", không ghi offline.
  * Timeout $\ge 3.0\text{ s}$ / Lỗi mạng (`HTTP 5xx` / Connection Refused): Tự động lưu vào SQLite WAL `offline_punches`.

### 2.2. `API-KSK-002` — `POST /api/v1/kiosks/{id}/sync-batch`
* **Mục đích**: Đẩy gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi kết nối mạng phục hồi.
* **Payload đầu vào (Request)**: Mảng `records` chứa tối đa 50 phần tử với cấu trúc tương tự `API-KSK-001`, kèm `localId` cục bộ.
* **Payload thành công (Response 200 OK)**:
  * `{"syncedCount": 20, "syncedIds": [1, 2, ..., 20]}`
* **Xử lý Biên**: Cập nhật `is_synced = 1` cho các ID có trong `syncedIds`; các bản ghi lỗi giữ nguyên để retry theo Exponential Backoff.

### 2.3. `API-KSK-003` — `GET /api/v1/kiosks/{id}/gallery`
* **Mục đích**: Tải toàn bộ danh mục vector 512D của nhân sự `ACTIVE` khi Kiosk khởi động.
* **Payload thành công (Response 200 OK)**:
  * `{"version": 12, "totalCount": 1000, "employees": [{"employeeId": 1042, "code": "NV-1042", "name": "Ngô Văn Dũng", "department": "Kỹ thuật", "vector": [0.023, -0.015, ...]}]}`
* **Xử lý Biên**: Nếu lỗi mạng, Kiosk nạp dữ liệu từ bảng SQLite `local_gallery_cache` (`DATA-KSK-007`).

### 2.4. `API-KSK-004` — `POST /api/v1/kiosks/{id}/verify-otp`
* **Mục đích**: Xác thực mã Onboarding OTP 6 số nhân viên nhập tại màn hình đăng ký khuôn mặt.
* **Payload đầu vào (Request)**: `{"otpCode": "123456"}`
* **Response 200 OK**: `{"valid": true, "employeeId": 1042, "employeeCode": "NV-1042", "fullName": "Ngô Văn Dũng"}`
* **Response 400/404**: `{"error": "OTP_INVALID" | "OTP_EXPIRED"}` $\rightarrow$ Kiosk hiển thị lỗi từ chối rõ ràng.

### 2.5. `API-KSK-005` — `POST /api/v1/kiosks/{id}/enroll-face`
* **Mục đích**: Gửi vector khuôn mặt 512D mới trích xuất từ 3 ảnh chụp camera chính kèm mã OTP để lưu trữ CSDL.
* **Payload đầu vào (Request)**: `{"employeeId": 1042, "otpCode": "123456", "featureVector": [0.023, -0.015, ...]}`
* **Response 200 OK**: `{"status": "SUCCESS", "message": "Face enrolled successfully"}`
* **Xử lý Kiosk**: Nạp tức thì vector mới vào `GalleryMatrix` và cập nhật `local_gallery_cache`.

### 2.6. `API-KSK-006` — STOMP Topic `/topic/kiosk-gallery`
* **Mục đích**: Nhận thông điệp đồng bộ vector từ Backend thời gian thực khi có nhân sự mới đăng ký hoặc thôi việc.
* **Tin nhắn nhận được (JSON Message)**:
  * Sự kiện thêm mới: `{"action": "ADD", "employeeId": 1042, "code": "NV-1042", "name": "Ngô Văn Dũng", "department": "Kỹ thuật", "vector": [...]}`
  * Sự kiện xóa: `{"action": "DELETE", "employeeId": 1042}`
* **Xử lý Kiosk**: Thực thi Atomic Swap trên ma trận RAM mà không khóa luồng đọc video camera.

