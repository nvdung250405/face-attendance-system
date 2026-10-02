# API DESIGN — Thiết kế Chi tiết Giao thức & Hợp đồng API

> **Mã tài liệu:** `DES-API-01`  
> **Cấp độ:** Cấp Hệ thống (System-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết các điểm cuối REST API (`APD-SYS-`), cấu trúc dữ liệu JSON Schema vào/ra, cơ chế xác thực và kênh truyền thông điệp thời gian thực WebSocket STOMP.

---

## 1. RESTful API Structure & Endpoints (Danh mục Điểm cuối API)

| ID | Phương thức & Đường dẫn API | Xác thực Yêu cầu | Mục đích Nghiệp vụ | Uses | Realizes | Trạng thái |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| `APD-SYS-001` | `POST /api/v1/auth/login` | Public | Tiếp nhận tài khoản/mật khẩu, cấp phát mã JWT token và danh sách quyền RBAC. | `STK-011` | `SRS-006` | Approved |
| `APD-SYS-002` | `POST /api/v1/kiosk/punch` | `X-Kiosk-Id` + Secret Token | Tiếp nhận một lượt điểm danh đơn lẻ thời gian thực từ trạm Kiosk. | `STK-011` | `API-SYS-001`, `API-SYS-012` | Approved |
| `APD-SYS-003` | `POST /api/v1/kiosk/sync-batch` | `X-Kiosk-Id` + Secret Token | Tiếp nhận gói lô tối đa 50 bản ghi điểm danh bù ngoại tuyến. | `STK-011` | `API-SYS-002`, `API-SYS-013` | Approved |
| `APD-SYS-004` | `GET /api/v1/kiosk/gallery` | `X-Kiosk-Id` + Secret Token | Trả về toàn bộ danh mục vector mẫu đã giải mã để nạp vào RAM Kiosk. | `STK-011`, `STK-015`| `API-SYS-003` | Approved |
| `APD-SYS-005` | `POST /api/v1/kiosk/verify-otp`| `X-Kiosk-Id` + Secret Token | Xác minh mã kích hoạt OTP 6 số để mở khóa quét mặt tại trạm Kiosk. | `STK-011` | `API-SYS-004`, `API-SYS-014` | Approved |
| `APD-SYS-006` | `POST /api/v1/kiosk/enroll-face`| `X-Kiosk-Id` + Secret Token | Tiếp nhận vector 512D mới kèm OTP để Backend mã hóa lưu CSDL. | `STK-011`, `STK-015`| `API-SYS-005`, `API-SYS-015` | Approved |
| `APD-SYS-007` | `GET /api/v1/employees` | Bearer JWT (Role HR/Admin) | Lấy danh sách hồ sơ nhân sự có phân trang, tìm kiếm và lọc phòng ban. | `STK-011` | `API-SYS-008` | Approved |
| `APD-SYS-008` | `POST /api/v1/compliance/consent`| Bearer JWT (Role Employee) | Ghi nhận văn bản thỏa thuận Informed Consent theo Luật 2025. | `STK-011` | `API-SYS-009`, `API-SYS-016` | Approved |
| `APD-SYS-009` | `GET /api/v1/reports/export` | Bearer JWT (Role HR/Admin) | Kết xuất dữ liệu bảng công ra file Excel (.xlsx) đã làm sạch mã độc. | `STK-011` | `API-SYS-011`, `SOL-SYS-013` | Approved |

---

## 2. API Contract Schemas (Cấu trúc Hợp đồng Dữ liệu Chi tiết)

### 2.1. Điểm danh Trực tiếp (`POST /api/v1/kiosk/punch`)
* **Headers**: `Content-Type: application/json`, `X-Kiosk-Id: KIOSK-LOBBY-01`, `Authorization: Bearer <SecretToken>`
* **Request Body Schema**:
```json
{
  "employeeId": 1024,
  "punchTimestamp": "2026-10-02T08:04:15.234+07:00",
  "verificationMethod": "VERIFICATION_FACE",
  "confidenceScore": 0.742,
  "kioskId": "KIOSK-LOBBY-01"
}
```
* **Response 200 OK Schema**:
```json
{
  "success": true,
  "code": "PUNCH_ACCEPTED",
  "message": "Điểm danh thành công",
  "data": {
    "recordId": 50128,
    "employeeId": 1024,
    "fullName": "Nguyễn Văn Dũng",
    "punchType": "CHECK_IN",
    "punchTime": "2026-10-02T08:04:15.234+07:00",
    "status": "ON_TIME",
    "lateMinutes": 0
  },
  "timestamp": "2026-10-02T08:04:15.310+07:00"
}
```

### 2.2. Đồng bộ Bù Ngoại tuyến (`POST /api/v1/kiosk/sync-batch`)
* **Request Body Schema**:
```json
{
  "kioskId": "KIOSK-LOBBY-01",
  "batchSize": 2,
  "records": [
    {
      "localQueueId": 12,
      "employeeId": 1024,
      "punchTimestamp": "2026-10-02T07:55:00.120+07:00",
      "verificationMethod": "VERIFICATION_FACE",
      "confidenceScore": 0.765
    }
  ]
}
```
* **Response 200 OK Schema**:
```json
{
  "success": true,
  "code": "SYNC_PROCESSED",
  "syncedCount": 2,
  "syncedLocalIds": [12, 13]
}
```

---

## 3. Real-time WebSocket STOMP Architecture (Kênh Đẩy Thời gian thực)

| Tên Topic STOMP | Bên Phát (Producer) | Bên Nhận (Subscriber) | Cấu trúc Dữ liệu Thông điệp (Payload) | Tần suất / Điều kiện Kích hoạt |
| :--- | :---: | :---: | :--- | :--- |
| `/topic/live-attendance` | `backend-service` | `web-portal` | Object JSON chứa thông tin: `recordId`, `employeeId`, `fullName`, `punchTime`, `status`, `lateMinutes`, `avatarUrl`. | Phát ngay sau khi ghi nhận 1 lượt chấm công thành công. |
| `/topic/kiosk-gallery` | `backend-service` | `kiosk-app` | Object JSON chứa: `action` (`ADD_VECTOR` / `DELETE_VECTOR`), `employeeId`, `vector` (mảng 512 số float32). | Phát ngay khi nhân viên mới nạp mặt hoặc nhân viên thôi việc. |

---

## 4. API Design Decisions (Quyết định Thiết kế API)

| ID | Quyết định Thiết kế API | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `DD-APD-001` | Đóng gói toàn bộ phản hồi API theo chuẩn thống nhất `{success, code, message, data, timestamp}`. | Tạo tính nhất quán cho các client (Kiosk và Web), dễ dàng bắt lỗi và bóc tách dữ liệu phản hồi. | `API-SYS-012` | Approved |
| `DD-APD-002` | Sử dụng phân số lô cố định tối đa 50 bản ghi cho mỗi request `sync-batch`. | Tránh quá tải payload JSON và nghẽn bộ nhớ đệm HTTP của máy chủ khi Kiosk ngoại tuyến dài ngày. | `API-SYS-013` | Approved |
| `DD-APD-003` | Áp dụng WebSocket STOMP Broker chạy trực tiếp trong tiến trình Spring Boot (In-memory Simple Broker). | Tiết kiệm chi phí triển khai, không cần dựng cụm Message Queue rời (như RabbitMQ/Kafka) trong quy mô doanh nghiệp vừa và nhỏ. | `STK-014`, `PD-006` | Approved |
