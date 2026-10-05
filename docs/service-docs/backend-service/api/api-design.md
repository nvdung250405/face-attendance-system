---
title: Backend API Detailed Design
version: 2.0
status: Approved
owner: Backend Lead & API Architect
---

# API DESIGN — Thiết kế Chi tiết Giao diện & Hợp đồng API (API Contract Specification)

## 1. Structure (Cấu trúc Giao diện & Hợp đồng API)

### 1.1. Interface Structure (Cấu trúc Giao thức & Tài nguyên)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APD-BE-001` | Cấu trúc REST API Phân hệ Kiosk | Thiết kế hợp đồng 5 endpoint REST phục vụ trạm Kiosk (`/punch`, `/sync-batch`, `/gallery`, `/verify-otp`, `/enroll-face`), tiền tố URL `/api/v1/kiosk`, xác thực qua header `X-Kiosk-Id`. | `STK-011` | `API-BE-003`, `API-BE-004`, `API-BE-005`, `API-BE-006`, `API-BE-007` | `DD-SYS-001`, `DD-BE-010` | Accepted |
| `APD-BE-002` | Cấu trúc REST API Cổng Web Portal | Thiết kế hợp đồng các endpoint REST phục vụ Web Portal (Auth, Admin Attendance, Employee Attendance, Consent Signing, Employee Management), xác thực Bearer JWT đa vai trò. | `STK-011` | `API-BE-001`, `API-BE-002`, `API-BE-008`, `API-BE-009`, `API-BE-010`, `API-BE-011` | `DD-SYS-001`, `DD-BE-009` | Accepted |
| `APD-BE-003` | Cấu trúc Kênh Đẩy Dữ liệu STOMP | Thiết kế kênh WebSocket STOMP endpoint `/ws-attendance`, hỗ trợ SockJS fallback và cấu hình message broker tiền tố `/topic` phục vụ đẩy sự kiện thời gian thực tới Kiosk và Web. | `STK-012` | `API-BE-012`, `API-BE-013`, `API-BE-014` | `DD-SYS-004`, `DD-BE-011` | Accepted |

### 1.2. Contracts (Mô hình Dữ liệu & Báo lỗi Toàn cục)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APD-BE-004` | Mô hình Hợp đồng Dữ liệu & ProblemDetails | Chuẩn hóa định dạng bao bọc JSON, múi giờ ISO-8601 (+07:00), mã lỗi RFC 7807 ProblemDetails và bộ DTO validation annotations (`@NotNull`, `@Size`, `@Pattern`). | `STK-011` | `API-BE-015`, `API-BE-016` | `DD-BE-009` | Accepted |

---

## 2. Behavior (Diễn biến Luồng Giao tiếp, Xác thực & Idempotency)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APD-BE-005` | Xác thực & Lọc Kênh WebSocket STOMP | Client gửi frame `CONNECT` kèm header `Authorization` hoặc `X-Kiosk-Id` $\rightarrow$ `ChannelInterceptor` thẩm định $\rightarrow$ cho phép subscribe các topic `/topic/live-attendance`, `/topic/kiosk-gallery`. | `APD-BE-003`, `STK-012` | `API-BE-012`, `API-BE-013`, `API-BE-014`, `API-BE-015` | `DD-SYS-004`, `DD-BE-011` | Accepted |
| `APD-BE-006` | Cơ chế Idempotency Xử lý Điểm danh | Tiếp nhận punch $\rightarrow$ đối chiếu khóa tự nhiên `(user_id, punch_timestamp, punch_type)` trên PostgreSQL và cache 120s $\rightarrow$ nếu trùng trả về HTTP 409 hoặc bỏ qua trong gói lô (`ON CONFLICT DO NOTHING`). | `APD-BE-001`, `STK-013` | `API-BE-003`, `API-BE-004` | `DD-SYS-006`, `DD-BE-012` | Accepted |

---

## 3. Quy chuẩn Chung Toàn bộ API (Global API Conventions)

* **Base URL**: `http://localhost:8080/api/v1` (Dev) hoặc `https://fas.company.com/api/v1` (Prod).
* **Định dạng Nội dung**: `Content-Type: application/json; charset=UTF-8`.
* **Định dạng Thời gian**: Chuỗi ISO-8601 kèm múi giờ (Ví dụ: `2026-10-03T08:30:00.000+07:00`).
* **Cấu trúc Bao bọc Phản hồi Chuẩn (Standard Response Wrapper)**:
```json
{
  "success": true,
  "code": "STRING_ENUM_CODE",
  "message": "Thông điệp mô tả kết quả xử lý thân thiện",
  "data": { ... },
  "timestamp": "2026-10-03T08:30:00.120+07:00"
}
```
* **Cấu trúc Báo lỗi Chuẩn RFC 7807 (`ProblemDetails`)**:
```json
{
  "type": "https://fas.company.com/errors/invalid-credentials",
  "title": "Xác thực thất bại",
  "status": 401,
  "detail": "Email hoặc mật khẩu không chính xác.",
  "instance": "/api/v1/auth/login",
  "code": "AUTH_INVALID_CREDENTIALS",
  "timestamp": "2026-10-03T08:30:00.125+07:00",
  "invalidParams": [
    { "field": "password", "reason": "Mật khẩu không được để trống" }
  ]
}
```

---

## 4. Hợp đồng Chi tiết Từng Endpoint REST (REST API Contracts)

### 4.1. `POST /api/v1/auth/login` — Xác thực Đăng nhập Hệ thống
* **Mục đích**: Xác thực người dùng Web Portal (HR, Nhân viên), cấp cặp Access Token và Refresh Token.
* **Xác thực**: Public (Không yêu cầu Token).
* **Request Headers**: `Content-Type: application/json`
* **Request Body**:
| Tên Trường | Kiểu Dữ liệu | Bắt buộc | Ràng buộc Validation | Mô tả & Ví dụ |
| :--- | :--- | :---: | :--- | :--- |
| `email` | `string` | Có | Format email hợp lệ | Email doanh nghiệp (`dung.nv@company.com`). |
| `password` | `string` | Có | Tối thiểu 8 ký tự | Mật khẩu tài khoản văn bản rõ. |

*Ví dụ Request Body:*
```json
{
  "email": "dung.nv@company.com",
  "password": "Password@123"
}
```

* **Response 200 OK**:
```json
{
  "success": true,
  "code": "AUTH_SUCCESS",
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d8f4c2e1-9b7a-4c3d-8e5f-1a2b3c4d5e6f",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": 1042,
      "employeeCode": "NV-1042",
      "fullName": "Ngô Văn Dũng",
      "email": "dung.nv@company.com",
      "role": "EMPLOYEE",
      "status": "PENDING_CONSENT",
      "department": "Phòng Kỹ thuật"
    }
  },
  "timestamp": "2026-10-03T08:30:00.120+07:00"
}
```
* **Mã lỗi HTTP**:
  * `401 Unauthorized`: Mã lỗi `AUTH_INVALID_CREDENTIALS` khi sai email hoặc mật khẩu.
  * `403 Forbidden`: Mã lỗi `ACCOUNT_TERMINATED` khi tài khoản đã bị vô hiệu hóa.

---

### 4.2. `POST /api/v1/auth/refresh` — Làm mới Access Token
* **Mục đích**: Đổi Refresh Token lấy Access Token mới khi Access Token hết hạn 1 giờ.
* **Request Body**:
| Tên Trường | Kiểu Dữ liệu | Bắt buộc | Mô tả & Ví dụ |
| :--- | :--- | :---: | :--- |
| `refreshToken` | `string` | Có | Chuỗi UUID Refresh Token đã được cấp phát trước đó. |

* **Response 200 OK**:
```json
{
  "success": true,
  "code": "TOKEN_REFRESHED",
  "message": "Cấp phát token mới thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
    "tokenType": "Bearer",
    "expiresIn": 3600
  },
  "timestamp": "2026-10-03T09:30:00.050+07:00"
}
```
* **Mã lỗi HTTP**: `401 Unauthorized` (`REFRESH_TOKEN_EXPIRED` hoặc `REFRESH_TOKEN_INVALID`).

---

### 4.3. `POST /api/v1/kiosk/punch` — Tiếp nhận Điểm danh Trực tiếp từ Kiosk
* **Mục đích**: Ghi nhận một lượt chấm công khuôn mặt hoặc mã PIN ngay sau khi quét thành công tại Kiosk.
* **Xác thực**: Yêu cầu Header `X-Kiosk-Id: <id>` và `Authorization: Bearer <SecretToken>`.
* **Request Body**:
| Tên Trường | Kiểu Dữ liệu | Bắt buộc | Ràng buộc Validation | Mô tả & Ví dụ |
| :--- | :--- | :---: | :--- | :--- |
| `employeeId` | `int64` | Có | $> 0$ | Mã định danh số của nhân viên trong CSDL (`1042`). |
| `punchTimestamp` | `string` | Có | ISO-8601 kèm múi giờ | Mốc thời gian quét thực tế (`2026-10-03T08:29:45.120+07:00`). |
| `verificationMethod` | `string` | Có | `VERIFICATION_FACE` hoặc `VERIFICATION_PIN` | Phương thức xác thực đã dùng tại Kiosk. |
| `confidenceScore` | `float` | Không | $0.0 \le score \le 1.0$ | Điểm số tương đồng Cosine Similarity (`0.8924`). |
| `kioskId` | `string` | Có | Khớp với Header `X-Kiosk-Id` | Mã trạm điểm danh (`KIOSK-HN-01`). |

*Ví dụ Request Body:*
```json
{
  "employeeId": 1042,
  "punchTimestamp": "2026-10-03T08:29:45.120+07:00",
  "verificationMethod": "VERIFICATION_FACE",
  "confidenceScore": 0.8924,
  "kioskId": "KIOSK-HN-01"
}
```

* **Response 200 OK**:
```json
{
  "success": true,
  "code": "PUNCH_RECORDED",
  "message": "Ghi nhận điểm danh thành công",
  "data": {
    "recordId": 98231,
    "employeeId": 1042,
    "employeeCode": "NV-1042",
    "fullName": "Ngô Văn Dũng",
    "punchType": "CHECK_IN",
    "punchTime": "2026-10-03T08:29:45.120+07:00",
    "status": "ON_TIME",
    "lateMinutes": 0,
    "department": "Phòng Kỹ thuật"
  },
  "timestamp": "2026-10-03T08:29:45.185+07:00"
}
```
* **Mã lỗi HTTP**:
  * `409 Conflict`: Mã lỗi `COOLDOWN_ACTIVE` (lượt quẹt trong khoảng 120s trước đó đã được ghi nhận).
  * `404 Not Found`: Mã lỗi `EMPLOYEE_NOT_FOUND` (không tìm thấy ID nhân viên).
  * `401 Unauthorized`: Mã lỗi `KIOSK_UNAUTHORIZED` (sai `X-Kiosk-Id` hoặc Secret Token).

---

### 4.4. `POST /api/v1/kiosk/sync-batch` — Đồng bộ Bù Ngoại tuyến từ Kiosk
* **Mục đích**: Đẩy lô các bản ghi điểm danh ngoại tuyến khi trạm Kiosk khôi phục mạng Internet.
* **Xác thực**: Yêu cầu Header `X-Kiosk-Id` và Bearer Token của Kiosk.
* **Request Body**:
| Tên Trường | Kiểu Dữ liệu | Bắt buộc | Ràng buộc Validation | Mô tả & Ví dụ |
| :--- | :--- | :---: | :--- | :--- |
| `kioskId` | `string` | Có | Chuỗi không rỗng | Mã trạm Kiosk (`KIOSK-HN-01`). |
| `batchSize` | `int` | Có | $1 \le batchSize \le 50$ | Số lượng bản ghi trong lô đồng bộ. |
| `records` | `array[object]`| Có | Tối đa 50 phần tử | Danh sách các bản ghi ngoại tuyến cần lưu. |

*Cấu trúc từng phần tử trong `records`:*
* `localQueueId` (`int64`, bắt buộc): ID bản ghi trong SQLite WAL cục bộ của Kiosk (`101`).
* `employeeId` (`int64`, bắt buộc): ID nhân viên.
* `punchTimestamp` (`string`, bắt buộc): Mốc thời gian ISO-8601 lúc quẹt ngoại tuyến.
* `verificationMethod` (`string`, bắt buộc): `VERIFICATION_FACE` hoặc `VERIFICATION_PIN`.
* `confidenceScore` (`float`, không bắt buộc): Điểm số Cosine.

*Ví dụ Request Body:*
```json
{
  "kioskId": "KIOSK-HN-01",
  "batchSize": 2,
  "records": [
    {
      "localQueueId": 101,
      "employeeId": 1042,
      "punchTimestamp": "2026-10-03T07:45:10.000+07:00",
      "verificationMethod": "VERIFICATION_FACE",
      "confidenceScore": 0.885
    },
    {
      "localQueueId": 102,
      "employeeId": 1088,
      "punchTimestamp": "2026-10-03T07:48:22.000+07:00",
      "verificationMethod": "VERIFICATION_PIN",
      "confidenceScore": null
    }
  ]
}
```

* **Response 200 OK**:
```json
{
  "success": true,
  "code": "BATCH_SYNC_PROCESSED",
  "message": "Đồng bộ thành công 2 bản ghi",
  "data": {
    "syncedCount": 2,
    "syncedLocalIds": [101, 102],
    "failedLocalIds": []
  },
  "timestamp": "2026-10-03T08:35:12.300+07:00"
}
```

---

### 4.5. `GET /api/v1/kiosk/gallery` — Tải Danh mục Vector Mẫu Sinh trắc học
* **Mục đích**: Cung cấp toàn bộ danh mục vector ArcFace 512D của nhân viên `ACTIVE` để Kiosk nạp vào RAM.
* **Xác thực**: Yêu cầu Header `X-Kiosk-Id` và Bearer Token của Kiosk.
* **Response 200 OK**:
```json
{
  "success": true,
  "code": "GALLERY_FETCHED",
  "message": "Lấy danh mục vector thành công",
  "data": {
    "galleryVersion": 18,
    "totalCount": 2,
    "items": [
      {
        "employeeId": 1042,
        "employeeCode": "NV-1042",
        "fullName": "Ngô Văn Dũng",
        "department": "Phòng Kỹ thuật",
        "vector512": [0.0412, -0.0521, 0.0189, 0.0823, "...512 số float..."],
        "updatedAt": "2026-10-02T15:30:00+07:00"
      },
      {
        "employeeId": 1088,
        "employeeCode": "NV-1088",
        "fullName": "Trần Thị Mai",
        "department": "Phòng Nhân sự",
        "vector512": [-0.0125, 0.0381, -0.0654, 0.0419, "...512 số float..."],
        "updatedAt": "2026-10-02T16:00:00+07:00"
      }
    ]
  },
  "timestamp": "2026-10-03T07:00:00.450+07:00"
}
```

---

### 4.6. `POST /api/v1/kiosk/verify-otp` — Xác minh Mã OTP Kích hoạt tại Kiosk
* **Mục đích**: Kiểm tra mã OTP 6 số nhân viên nhập tại màn hình Kiosk để mở khóa camera quét mặt.
* **Request Body**:
```json
{
  "otp": "839201",
  "kioskId": "KIOSK-HN-01"
}
```
* **Response 200 OK**:
```json
{
  "success": true,
  "code": "OTP_VERIFIED",
  "message": "Mã OTP hợp lệ",
  "data": {
    "sessionToken": "tmp_sess_9a8b7c6d5e4f3a2b1c0d",
    "employeeId": 1042,
    "employeeCode": "NV-1042",
    "fullName": "Ngô Văn Dũng",
    "department": "Phòng Kỹ thuật"
  },
  "timestamp": "2026-10-03T08:40:11.100+07:00"
}
```
* **Mã lỗi HTTP**:
  * `400 Bad Request`: Mã lỗi `OTP_INVALID` (mã OTP không khớp) hoặc `OTP_EXPIRED` (mã quá hạn 48 giờ).
  * `409 Conflict`: Mã lỗi `OTP_ALREADY_USED` (mã OTP này đã được dùng để đăng ký trước đó).

---

### 4.7. `POST /api/v1/kiosk/enroll-face` — Tiếp nhận Vector Mới Từ Kiosk
* **Mục đích**: Gửi vector 512D mới trích xuất từ camera Kiosk lên Backend để mã hóa AES-256-GCM lưu CSDL.
* **Request Body**:
| Tên Trường | Kiểu Dữ liệu | Bắt buộc | Ràng buộc | Mô tả & Ví dụ |
| :--- | :--- | :---: | :--- | :--- |
| `otp` | `string` | Có | Đúng 6 chữ số | Mã OTP kích hoạt đã dùng ở bước verify. |
| `sessionToken` | `string` | Có | Khớp phiên verify | Token tạm thời được cấp từ `verify-otp`. |
| `vector512` | `array[float]` | Có | Đúng 512 phần tử | Mảng số thực 512 chiều, độ dài chuẩn $L_2 = 1.0 \pm 10^{-4}$. |
| `kioskId` | `string` | Có | Chuỗi không rỗng | Mã trạm Kiosk thực hiện thu mẫu. |

*Ví dụ Request Body:*
```json
{
  "otp": "839201",
  "sessionToken": "tmp_sess_9a8b7c6d5e4f3a2b1c0d",
  "vector512": [0.0412, -0.0521, 0.0189, "...đủ 512 số float..."],
  "kioskId": "KIOSK-HN-01"
}
```

* **Response 200 OK**:
```json
{
  "success": true,
  "code": "ENROLLMENT_COMPLETED",
  "message": "Đăng ký khuôn mặt thành công",
  "data": {
    "employeeId": 1042,
    "templateId": 851,
    "status": "ACTIVE",
    "activatedAt": "2026-10-03T08:41:05.320+07:00"
  },
  "timestamp": "2026-10-03T08:41:05.350+07:00"
}
```

---

### 4.8. `GET /api/v1/admin/attendance` — Quản lý & Báo cáo Lịch sử Điểm danh (HR)
* **Mục đích**: Phục vụ Cổng Web Portal tra cứu danh sách chấm công toàn công ty có phân trang và bộ lọc.
* **Xác thực**: Bearer JWT với Role `HR_MANAGER` hoặc `ADMIN`.
* **Query Parameters**:
| Tên Tham số | Kiểu Dữ liệu | Bắt buộc | Mặc định | Mô tả & Ví dụ |
| :--- | :--- | :---: | :---: | :--- |
| `page` | `int` | Không | `0` | Chỉ số trang (bắt đầu từ 0). |
| `size` | `int` | Không | `20` | Số lượng bản ghi trên một trang (tối đa 100). |
| `fromDate` | `string` | Không | Ngày hiện tại | Ngày bắt đầu lọc (`YYYY-MM-DD`, ví dụ: `2026-10-01`). |
| `toDate` | `string` | Không | Ngày hiện tại | Ngày kết thúc lọc (`YYYY-MM-DD`, ví dụ: `2026-10-03`). |
| `department` | `string` | Không | Tất cả | Lọc theo tên phòng ban. |
| `status` | `string` | Không | Tất cả | Lọc trạng thái: `ON_TIME`, `LATE`, `EARLY_LEAVE`. |
| `keyword` | `string` | Không | Trống | Tìm kiếm theo tên hoặc mã nhân viên (`NV-1042` hoặc `Dũng`). |

* **Response 200 OK**:
```json
{
  "success": true,
  "code": "ATTENDANCE_QUERY_SUCCESS",
  "message": "Truy vấn danh sách điểm danh thành công",
  "data": {
    "content": [
      {
        "recordId": 98231,
        "employeeId": 1042,
        "employeeCode": "NV-1042",
        "fullName": "Ngô Văn Dũng",
        "department": "Phòng Kỹ thuật",
        "punchTimestamp": "2026-10-03T08:29:45.120+07:00",
        "punchType": "CHECK_IN",
        "verificationMethod": "VERIFICATION_FACE",
        "status": "ON_TIME",
        "lateMinutes": 0,
        "kioskId": "KIOSK-HN-01"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true
  },
  "timestamp": "2026-10-03T09:00:00.080+07:00"
}
```

---

### 4.9. `GET /api/v1/employee/attendance` — Tra cứu Điểm danh Cá nhân (Nhân viên)
* **Mục đích**: Nhân viên đăng nhập xem bảng công và mốc giờ quẹt của chính mình trong tháng.
* **Xác thực**: Bearer JWT với Role `EMPLOYEE`.
* **Query Parameters**: `month` (`int`, 1-12, default tháng hiện tại), `year` (`int`, default năm hiện tại).
* **Response 200 OK**:
```json
{
  "success": true,
  "code": "PERSONAL_ATTENDANCE_FETCHED",
  "message": "Lấy bảng công cá nhân thành công",
  "data": {
    "month": 10,
    "year": 2026,
    "totalWorkDays": 3,
    "totalOnTimeDays": 3,
    "totalLateDays": 0,
    "records": [
      {
        "date": "2026-10-03",
        "checkInTime": "08:29:45",
        "checkOutTime": "17:35:10",
        "status": "ON_TIME",
        "lateMinutes": 0
      }
    ]
  },
  "timestamp": "2026-10-03T09:05:00.100+07:00"
}
```

---

### 4.10. `POST /api/v1/employee/consent` — Ký Thỏa thuận Informed Consent
* **Mục đích**: Nhân viên ký điện tử đồng thuận xử lý dữ liệu khuôn mặt theo Luật 2025; Backend sinh mã kích hoạt OTP và mã QR Code.
* **Xác thực**: Bearer JWT (Role `EMPLOYEE`).
* **Request Body**:
```json
{
  "agreed": true,
  "consentVersion": "V2026.1_OCT"
}
```
* **Response 200 OK**:
```json
{
  "success": true,
  "code": "CONSENT_RECORDED",
  "message": "Ký cam kết thành công. Mã OTP đăng ký có hiệu lực trong 48 giờ.",
  "data": {
    "otp": "839201",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiresAt": "2026-10-05T08:30:00.000+07:00",
    "consentSignedAt": "2026-10-03T08:30:00.000+07:00",
    "notice": "Vui lòng mang mã OTP này ra trạm Kiosk gần nhất để quét mẫu khuôn mặt."
  },
  "timestamp": "2026-10-03T08:30:00.150+07:00"
}
```

---

### 4.11. `GET /api/v1/admin/employees` — Quản lý Danh sách Nhân sự (HR)
* **Mục đích**: HR theo dõi danh sách nhân viên, phòng ban, và tình trạng đăng ký sinh trắc (`ACTIVE` / `PENDING_CONSENT` / `TERMINATED`).
* **Xác thực**: Bearer JWT (Role `HR_MANAGER`, `ADMIN`).
* **Query Parameters**: `page` (default 0), `size` (default 20), `status`, `department`, `keyword`.
* **Response 200 OK**:
```json
{
  "success": true,
  "code": "EMPLOYEES_FETCHED",
  "message": "Lấy danh sách nhân sự thành công",
  "data": {
    "content": [
      {
        "id": 1042,
        "employeeCode": "NV-1042",
        "fullName": "Ngô Văn Dũng",
        "email": "dung.nv@company.com",
        "department": "Phòng Kỹ thuật",
        "role": "EMPLOYEE",
        "status": "ACTIVE",
        "hasBiometric": true,
        "hasPin": true,
        "createdAt": "2026-09-15T09:00:00+07:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  },
  "timestamp": "2026-10-03T09:10:00.050+07:00"
}
```

---

## 5. Hợp đồng Kênh WebSocket STOMP (STOMP Events Contract)

* **Endpoint Bắt tay WebSocket**: `ws://localhost:8080/ws-attendance` (kèm SockJS fallback `http://localhost:8080/ws-attendance`).
* **Header Kết nối STOMP**: `Authorization: Bearer <JWT>` (đối với Web) hoặc `X-Kiosk-Id` + Token (đối với Kiosk).

### 5.1. Topic `/topic/live-attendance` — Đẩy Sự kiện Điểm danh Lên Web Dashboard
* **Bên phát (Producer)**: `backend-service` (ngay sau khi ghi nhận điểm danh thành công).
* **Bên nhận (Subscriber)**: `web-portal` (trang Live Monitoring Dashboard).
* **Payload JSON**:
```json
{
  "eventType": "ATTENDANCE_PUNCHED",
  "recordId": 98231,
  "employeeId": 1042,
  "employeeCode": "NV-1042",
  "fullName": "Ngô Văn Dũng",
  "department": "Phòng Kỹ thuật",
  "punchTimestamp": "2026-10-03T08:29:45.120+07:00",
  "punchType": "CHECK_IN",
  "verificationMethod": "VERIFICATION_FACE",
  "status": "ON_TIME",
  "lateMinutes": 0,
  "kioskId": "KIOSK-HN-01"
}
```

### 5.2. Topic `/topic/kiosk-gallery` — Cập nhật Nạp Nóng Vector về Mạng Kiosk
* **Bên phát (Producer)**: `backend-service` (khi có nhân viên mới đăng ký khuôn mặt hoặc nhân viên thôi việc).
* **Bên nhận (Subscriber)**: Tất cả trạm `kiosk-app` đang trực tuyến.
* **Payload JSON (Trường hợp Thêm Vector mới - `ADD`)**:
```json
{
  "action": "ADD_VECTOR",
  "employeeId": 1042,
  "employeeCode": "NV-1042",
  "fullName": "Ngô Văn Dũng",
  "vector512": [0.0412, -0.0521, 0.0189, "...đủ 512 số float..."],
  "updatedAt": "2026-10-03T08:41:05.320+07:00"
}
```
* **Payload JSON (Trường hợp Xóa Vector - `DELETE`)**:
```json
{
  "action": "DELETE_VECTOR",
  "employeeId": 1042,
  "reason": "EMPLOYEE_TERMINATED",
  "updatedAt": "2026-10-03T09:00:00.000+07:00"
}
```

### 5.3. Topic `/topic/enrollment/{otp}` — Báo Hoàn tất Đăng ký về Web Nhân viên
* **Bên phát (Producer)**: `backend-service` (ngay sau khi Kiosk nạp mặt thành công).
* **Bên nhận (Subscriber)**: `web-portal` (trang cá nhân của nhân viên đang mở modal hiển thị OTP).
* **Payload JSON**:
```json
{
  "status": "ENROLLMENT_SUCCESS",
  "otp": "839201",
  "employeeId": 1042,
  "message": "Khuôn mặt đã được quét và kích hoạt thành công trên trạm KIOSK-HN-01",
  "activatedAt": "2026-10-03T08:41:05.320+07:00"
}
```
* **Hành vi Web Client**: Nhận được tin nhắn này, Web Portal tự động đóng Modal OTP, hiển thị thông báo chúc mừng thành công và chuyển trạng thái tài khoản sang `ACTIVE`.

---

## 6. Từ điển Mã Lỗi Toàn hệ thống (Error Codes Dictionary)

| Mã Lỗi (`code`) | HTTP Status | Tiêu đề Lỗi | Diễn giải & Hướng dẫn Khắc phục |
| :--- | :---: | :--- | :--- |
| `AUTH_INVALID_CREDENTIALS` | 401 | Đăng nhập thất bại | Email hoặc mật khẩu không chính xác. |
| `TOKEN_EXPIRED` | 401 | Token hết hạn | Access Token đã quá 1 giờ; cần gọi refresh token. |
| `ACCESS_DENIED` | 403 | Không đủ quyền | Tài khoản không có vai trò phù hợp (Role Guard). |
| `KIOSK_UNAUTHORIZED` | 401 | Trạm Kiosk chưa cấp phép | Khóa `X-Kiosk-Id` hoặc Secret Token không hợp lệ. |
| `COOLDOWN_ACTIVE` | 409 | Chống quẹt trùng lặp | Lượt điểm danh trong vòng 120 giây trước đó đã được ghi nhận. |
| `OTP_INVALID` | 400 | Mã OTP không đúng | Chuỗi 6 chữ số không khớp với phiên đăng ký. |
| `OTP_EXPIRED` | 400 | Mã OTP đã hết hạn | Mã OTP đã vượt quá thời hạn 48 giờ kể từ lúc sinh. |
| `OTP_ALREADY_USED` | 409 | Mã OTP đã sử dụng | Mã này đã được dùng để nạp khuôn mặt thành công trước đó. |
| `INVALID_VECTOR_DIMENSION` | 400 | Sai kích thước vector | Vector gửi lên không đúng 512 phần tử float32. |
| `EMPLOYEE_NOT_FOUND` | 404 | Không tìm thấy nhân sự | ID nhân viên không tồn tại trong CSDL. |
| `DATA_INTEGRITY_VIOLATION` | 400 | Lỗi toàn vẹn dữ liệu | Vi phạm ràng buộc duy nhất (Unique Email hoặc Employee Code). |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi hệ thống nội bộ | Xảy ra lỗi bất thường ngoài tầm kiểm soát; kiểm tra log máy chủ. |

---

## 7. Decisions (Quyết định Thiết kế Hợp đồng API)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-BE-009` | Chuẩn hóa mô hình báo lỗi theo chuẩn RFC 7807 ProblemDetails | Đem lại cấu trúc lỗi máy đọc được (Machine-readable) đồng nhất cho mọi client Web và Kiosk, hỗ trợ chi tiết các trường vi phạm validation. | Tự định nghĩa cấu trúc JSON báo lỗi tự do (bị loại vì thiếu tính tương thích và khó tích hợp thư viện client chuẩn). | Mọi Controller Advice phải map thống nhất về class `ProblemDetail` của Spring Boot; client dễ dàng bóc tách mã lỗi `code` và danh sách vi phạm `invalidParams`. | `API-BE-016`, `STK-011` | Accepted |
| `DD-BE-010` | Sử dụng tiêu đề tùy biến `X-Kiosk-Id` kết hợp Secret Bearer Token cho máy trạm Kiosk | Định danh rõ ràng phần cứng máy trạm phát sinh giao dịch, cho phép vô hiệu hóa tức thời từng trạm Kiosk riêng biệt khi có rủi ro lộ khóa. | Dùng chung 1 tài khoản JWT Service Account cho toàn bộ Kiosk (bị loại vì không cô lập được trạm bị thỏa hiệp và khó phân biệt vị trí chấm công). | Mỗi máy trạm Kiosk khi lắp đặt phải được cấp phát cặp `kioskId` và Secret Token riêng; Backend lọc và xác thực ngay tại tầng Security Filter. | `API-BE-003`, `API-BE-015` | Accepted |
| `DD-BE-011` | Cấu hình kênh STOMP chia tách tiền tố `/topic` (Public broadcast) và `/user` (Private unicast) | Tối ưu lưu lượng truyền thông thời gian thực: chỉ phát sóng dữ liệu chung tới subscriber liên quan, dữ liệu phiên OTP được cô lập cho người dùng đích. | Dùng một topic chung duy nhất đẩy toàn bộ sự kiện cho client tự lọc (bị loại vì rò rỉ bảo mật thông tin OTP và gây lãng phí băng thông). | Cần cấu hình `ChannelInterceptor` thẩm định quyền subscribe từng topic; đảm bảo Kiosk chỉ nhận thông điệp gallery và Web nhận sự kiện attendance. | `API-BE-012`, `API-BE-013`, `API-BE-014` | Accepted |
| `DD-BE-012` | Giới hạn kích thước gói lô đồng bộ bù ngoại tuyến tối đa 50 bản ghi/request | Ngăn chặn hiện tượng nghẽn luồng kết nối và khóa bảng CSDL kéo dài khi hàng loạt trạm Kiosk đồng loạt gửi bù dữ liệu sau sự cố mất mạng diện rộng. | Gửi từng bản ghi đơn lẻ nối tiếp hoặc gửi một gói không giới hạn (bị loại vì quá tải socket HTTP hoặc nguy cơ timeout transaction CSDL). | Phía trạm Kiosk phải phân trang hàng đợi SQLite ngoại tuyến thành các lô 50 bản ghi; Backend xử lý batch insert có `ON CONFLICT DO NOTHING` trong $\le 50\text{ ms}$. | `API-BE-004`, `NFR-BE-001` | Accepted |

---

## 8. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Chiến lược Quản lý Phiên bản (API Versioning)**: Toàn bộ endpoint được định tuyến cố định qua tiền tố `/api/v1/`; các thay đổi bổ sung trường trả về (backward-compatible) không làm tăng version; trường hợp có breaking change trong tương lai sẽ mở song song tiền tố `/api/v2/`.
* **Chính sách CORS & Nguồn gốc An toàn**: Backend cấu hình Spring Security CORS chỉ cho phép các Origin hợp lệ từ Web Portal nội bộ (`http://localhost:5173`, `https://fas.company.com`); chặn toàn bộ các Origin từ bên ngoài nhằm phòng ngừa tấn công CSRF.

