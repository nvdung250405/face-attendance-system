# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Web Portal

> **Mã tài liệu:** `SPEC-API-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các giao diện REST API mà Web Portal tiêu thụ từ Backend và các kênh WebSocket STOMP đăng ký nhận sự kiện thời gian thực.

---

## 1. Danh mục Giao diện REST Tiêu thụ (Consumed REST Interfaces)

Toàn bộ các yêu cầu HTTP gửi từ Web Portal lên Backend đều tuân thủ:
* Base URL: `http://localhost:8080/api/v1` (Môi trường Dev) hoặc URL cấu hình qua biến môi trường `VITE_API_BASE_URL`.
* Headers mặc định: `Content-Type: application/json; charset=UTF-8`, `Accept: application/json`.
* Header bảo mật: `Authorization: Bearer <accessToken>` (ngoại trừ API Login).
* Timeout mặc định: $10.0\text{ s}$ cho các truy vấn bảng, $5.0\text{ s}$ cho xác thực.

| Mã Giao diện | Tên Nghiệp vụ | Phương thức & URL | Mục đích & Trách nhiệm | Vai trò Yêu cầu | SLA |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `API-WEB-001` | Xác thực Đăng nhập | `POST /api/v1/auth/login` | Gửi email/mật khẩu, nhận cặp Access/Refresh Token và hồ sơ người dùng. | Public | $\le 500\text{ ms}$ |
| `API-WEB-002` | Làm mới Token | `POST /api/v1/auth/refresh` | Đổi Refresh Token lấy Access Token mới khi token cũ hết hạn 1 giờ. | Public | $\le 300\text{ ms}$ |
| `API-WEB-003` | Ký Cam kết Sinh trắc | `POST /api/v1/employee/consent` | Ký xác nhận đồng ý thu thập dữ liệu sinh trắc học và nhận mã OTP 6 số kích hoạt tại Kiosk. | `EMPLOYEE` | $\le 500\text{ ms}$ |
| `API-WEB-004` | Tra cứu Điểm danh Toàn công ty | `GET /api/v1/admin/attendance` | Truy vấn danh sách điểm danh có phân trang, bộ lọc ngày, phòng ban, trạng thái và từ khóa. | `HR_MANAGER`, `ADMIN` | $\le 800\text{ ms}$ |
| `API-WEB-005` | Tra cứu Điểm danh Cá nhân | `GET /api/v1/employee/attendance` | Truy vấn bảng công và các lượt quẹt trong tháng của chính nhân viên đang đăng nhập. | `EMPLOYEE` | $\le 500\text{ ms}$ |
| `API-WEB-006` | Danh mục Hồ sơ Nhân sự | `GET /api/v1/admin/employees` | Truy vấn danh sách nhân sự toàn công ty kèm trạng thái kích hoạt khuôn mặt/mã PIN. | `HR_MANAGER`, `ADMIN` | $\le 800\text{ ms}$ |

---

## 2. Danh mục Kênh WebSocket STOMP Đăng ký (Subscribed STOMP Topics)

* **Điểm cuối Bắt tay (Handshake Endpoint)**: `ws://localhost:8080/ws-attendance` (kèm SockJS fallback).
* **Header Bắt tay STOMP**: `Authorization: Bearer <accessToken>`.

| Mã Giao diện | Tên Topic Đăng ký | Mục đích Nhận Dữ liệu | Xử lý Giao diện Web Portal |
| :--- | :--- | :--- | :--- |
| `API-WEB-007` | `/topic/live-attendance` | Nhận thông báo mỗi khi có bản ghi điểm danh mới thành công từ bất kỳ trạm Kiosk nào. | Tự động chèn dòng mới lên đầu Live Table với hiệu ứng highlight xanh ngọc; tăng bộ đếm thẻ KPI Dashboard. |
| `API-WEB-008` | `/topic/enrollment/{otp}` | Nhận thông báo kích hoạt khi nhân viên vừa hoàn tất quét mặt thành công tại trạm Kiosk. | Tự động đóng Modal hiển thị mã OTP trên máy tính nhân viên, hiển thị thông báo thành công và chuyển trạng thái sang `ACTIVE`. |

---

## 3. Đặc tả Tham số & Biên Dữ liệu (Interface Input/Output Specifications)

### 3.1. `API-WEB-001` — `POST /api/v1/auth/login`
* **Payload đầu vào (Request)**:
  * `email` (`string`, bắt buộc): Định dạng email doanh nghiệp hợp lệ (`dung.nv@company.com`).
  * `password` (`string`, bắt buộc): Mật khẩu tài khoản (tối thiểu 8 ký tự).
* **Payload thành công (Response 200 OK)**:
  * Trả về `accessToken`, `refreshToken`, `tokenType: "Bearer"`, `expiresIn: 3600`, và object `user` gồm: `id`, `employeeCode`, `fullName`, `email`, `role`, `status`, `department`.
* **Xử lý Biên & Mã Lỗi**:
  * `401 Unauthorized` (`AUTH_INVALID_CREDENTIALS`): Hiển thị thông báo "Email hoặc mật khẩu không chính xác".
  * `403 Forbidden` (`ACCOUNT_TERMINATED`): Hiển thị thông báo "Tài khoản của bạn đã bị vô hiệu hóa".

---

### 3.2. `API-WEB-002` — `POST /api/v1/auth/refresh`
* **Payload đầu vào (Request)**:
  * `refreshToken` (`string`, bắt buộc): Chuỗi UUID Refresh Token.
* **Payload thành công (Response 200 OK)**:
  * Trả về `accessToken` mới, `refreshToken` mới, `expiresIn: 3600`.
* **Xử lý Biên & Mã Lỗi**:
  * `401 Unauthorized` (`REFRESH_TOKEN_EXPIRED` / `REFRESH_TOKEN_INVALID`): Xóa toàn bộ `LocalStorage` và điều hướng người dùng về trang `/login`.

---

### 3.3. `API-WEB-003` — `POST /api/v1/employee/consent`
* **Payload đầu vào (Request)**:
  * `agreed` (`boolean`, bắt buộc): Bắt buộc là `true`.
  * `consentTimestamp` (`string`, bắt buộc): Chuỗi ISO-8601 thời điểm bấm nút ký cam kết.
* **Payload thành công (Response 200 OK)**:
  * `otp` (`string`): Mã OTP 6 chữ số ngẫu nhiên dùng để quét mặt tại Kiosk.
  * `qrCodeData` (`string`): Chuỗi dữ liệu mã QR hỗ trợ quét nhanh.
  * `expiresAt` (`string`): Thời điểm hết hạn của OTP (sau 48 giờ).
  * `kioskLocations` (`array[string]`): Danh sách tên/vị trí các trạm Kiosk khả dụng.

---

### 3.4. `API-WEB-004` — `GET /api/v1/admin/attendance`
* **Tham số Truy vấn (Query Parameters)**:
  * `page` (`number`, tùy chọn, default `0`), `size` (`number`, tùy chọn, default `20`).
  * `fromDate` (`string`, tùy chọn, format `YYYY-MM-DD`).
  * `toDate` (`string`, tùy chọn, format `YYYY-MM-DD`).
  * `department` (`string`, tùy chọn), `status` (`string`, tùy chọn: `ON_TIME` \| `LATE` \| `EARLY_LEAVE`).
  * `keyword` (`string`, tùy chọn): Tìm kiếm theo tên hoặc mã nhân viên.
* **Payload thành công (Response 200 OK)**:
  * Trả về `content` (mảng các `AttendanceRecord`), `page`, `size`, `totalElements`, `totalPages`, `first`, `last`.

---

### 3.5. `API-WEB-005` — `GET /api/v1/employee/attendance`
* **Tham số Truy vấn (Query Parameters)**:
  * `month` (`number`, tùy chọn, giá trị $1 - 12$), `year` (`number`, tùy chọn).
* **Payload thành công (Response 200 OK)**:
  * Trả về `month`, `year`, `totalWorkDays`, `totalOnTimeDays`, `totalLateDays`, `records` (danh sách bản ghi chấm công của cá nhân trong tháng).

---

### 3.6. `API-WEB-006` — `GET /api/v1/admin/employees`
* **Tham số Truy vấn (Query Parameters)**:
  * `page`, `size`, `department`, `status`, `keyword`.
* **Payload thành công (Response 200 OK)**:
  * Trả về danh sách nhân viên kèm trạng thái sinh trắc `hasBiometric` (`boolean`) và `hasPin` (`boolean`).
