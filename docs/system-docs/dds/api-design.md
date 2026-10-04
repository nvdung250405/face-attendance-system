---
title: System API Design
version: 1.0
status: Approved
owner: Solution Architect
---

# API DESIGN — Thiết kế Chi tiết Giao thức & Hợp đồng API

## 1. RESTful API Structure & Endpoints (Danh mục Điểm cuối API)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `APD-SYS-001` | Đăng nhập Xác thực JWT (`POST /api/v1/auth/login`) | Tiếp nhận tài khoản/mật khẩu, cấp phát mã JWT token và danh sách quyền RBAC. | `STK-011` | `SRS-006` | `DD-SYS-012` | Accepted |
| `APD-SYS-002` | Điểm danh Trực tiếp Kiosk (`POST /api/v1/kiosk/punch`) | Tiếp nhận một lượt điểm danh đơn lẻ thời gian thực từ trạm Kiosk. | `STK-011` | `API-SYS-001`, `API-SYS-012` | `DD-SYS-012` | Accepted |
| `APD-SYS-003` | Đồng bộ Bù Ngoại tuyến (`POST /api/v1/kiosk/sync-batch`) | Tiếp nhận gói lô tối đa 50 bản ghi điểm danh bù ngoại tuyến. | `STK-011` | `API-SYS-002`, `API-SYS-013` | `DD-SYS-013` | Accepted |
| `APD-SYS-004` | Tải Danh mục Gallery (`GET /api/v1/kiosk/gallery`) | Trả về toàn bộ danh mục vector mẫu đã giải mã để nạp vào RAM Kiosk. | `STK-011`, `STK-015` | `API-SYS-003` | `DD-SYS-003` | Accepted |
| `APD-SYS-005` | Xác thực Mã OTP Kiosk (`POST /api/v1/kiosk/verify-otp`) | Xác minh mã kích hoạt OTP 6 số để mở khóa quét mặt tại trạm Kiosk. | `STK-011` | `API-SYS-004`, `API-SYS-014` | `DD-SYS-012` | Accepted |
| `APD-SYS-006` | Nạp Mẫu Sinh trắc học Kiosk (`POST /api/v1/kiosk/enroll-face`) | Tiếp nhận vector 512D mới kèm OTP để Backend mã hóa lưu CSDL. | `STK-011`, `STK-015` | `API-SYS-005`, `API-SYS-015` | `DD-SYS-003` | Accepted |
| `APD-SYS-007` | Lấy Danh sách Nhân sự (`GET /api/v1/employees`) | Lấy danh sách hồ sơ nhân sự có phân trang, tìm kiếm và lọc phòng ban. | `STK-011` | `API-SYS-008` | `DD-SYS-012` | Accepted |
| `APD-SYS-008` | Ký Cam kết Informed Consent (`POST /api/v1/compliance/consent`) | Ghi nhận văn bản thỏa thuận Informed Consent theo Luật 2025. | `STK-011` | `API-SYS-009`, `API-SYS-016` | `DD-SYS-003` | Accepted |
| `APD-SYS-009` | Xuất Báo cáo Điểm danh Excel (`GET /api/v1/reports/export`) | Kết xuất dữ liệu bảng công ra file Excel (.xlsx) đã làm sạch mã độc. | `STK-011` | `API-SYS-011`, `SOL-SYS-013` | `DD-SYS-008` | Accepted |

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

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-SYS-012` | Đóng gói toàn bộ phản hồi API theo chuẩn thống nhất `{success, code, message, data, timestamp}`. | Đồng nhất việc bóc tách dữ liệu và bắt lỗi tập trung tại các client Kiosk và Web. | Trả về payload thô không bọc (raw POJO), Phản hồi khác nhau theo module | Toàn bộ các controller và exception handler phải tuân thủ đúng envelope format. | `API-SYS-012`, `APD-SYS-008` | Accepted |
| `DD-SYS-013` | Giới hạn kích thước gói đồng bộ tối đa 50 bản ghi cho mỗi request `sync-batch`. | Tránh quá tải payload JSON, tràn bộ nhớ Heap và nghẽn HTTP khi Kiosk ngoại tuyến lâu ngày. | Gửi từng bản ghi đơn lẻ, Gửi toàn bộ 1 gói duy nhất không giới hạn | Kiosk phải chia nhỏ hàng đợi thành nhiều đợt gửi tuần tự khi mạng phục hồi. | `API-SYS-013`, `APD-SYS-002` | Accepted |
| `DD-SYS-014` | Áp dụng WebSocket STOMP Broker chạy trực tiếp trong tiến trình Spring Boot (In-memory Simple Broker). | Tiết kiệm chi phí vận hành và tài nguyên phần cứng, không phải cài đặt message broker ngoài như RabbitMQ/Kafka. | Cài đặt cụm RabbitMQ/ActiveMQ rời, Dùng Redis Pub/Sub | Giới hạn khả năng scale đa máy chủ Backend nhưng tối ưu tuyệt đối cho hệ thống đơn cụm. | `PD-006`, `STK-014` | Accepted |
