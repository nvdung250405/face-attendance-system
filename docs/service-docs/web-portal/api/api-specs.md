---
title: Web Portal API Specifications
version: 2.0
status: Approved
owner: Web Lead & Frontend Architect
---

# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Web Portal


## 1. Specification Schema (Đặc tả Giao diện API Phân hệ Web Portal)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `API-WEB-001` | Giao diện REST xác thực đăng nhập qua `POST /api/v1/auth/login`. | REST | Must | `SRS-001`, `ARC-003` | Nhận Access/Refresh Token và thông tin user; SLA $\le 500\text{ ms}$. | Approved |
| `API-WEB-002` | Giao diện REST làm mới access token qua `POST /api/v1/auth/refresh`. | REST | Must | `SRS-001`, `ARC-003` | Đổi Refresh Token lấy Access Token mới trong suốt; SLA $\le 300\text{ ms}$. | Approved |
| `API-WEB-003` | Giao diện REST ký cam kết sinh trắc qua `POST /api/v1/employee/consent`. | REST | Must | `SRS-001`, `ARC-003` | Nhận mã OTP 6 số và mã QR kích hoạt tại Kiosk; SLA $\le 500\text{ ms}$. | Approved |
| `API-WEB-004` | Giao diện REST tra cứu điểm danh toàn công ty qua `GET /api/v1/admin/attendance`. | REST | Must | `SRS-003`, `ARC-003` | Phân trang, lọc theo ngày/phòng ban/trạng thái; SLA $\le 800\text{ ms}$. | Approved |
| `API-WEB-005` | Giao diện REST tra cứu điểm danh cá nhân qua `GET /api/v1/employee/attendance`. | REST | Should | `SRS-003`, `ARC-003` | Trả về tổng kết tháng và chi tiết các lượt quẹt; SLA $\le 500\text{ ms}$. | Approved |
| `API-WEB-006` | Giao diện REST tra cứu danh mục nhân sự qua `GET /api/v1/admin/employees`. | REST | Must | `SRS-003`, `ARC-003` | Phân trang danh sách nhân sự và trạng thái sinh trắc; SLA $\le 800\text{ ms}$. | Approved |
| `API-WEB-007` | Kênh WebSocket STOMP nhận điểm danh trực tiếp qua topic `/topic/live-attendance`. | WebSocket | Must | `SRS-003`, `ARC-003` | Nhận event và chèn dòng lên đầu Live Table tức thời. | Approved |
| `API-WEB-008` | Kênh WebSocket STOMP nhận thông báo kích hoạt qua topic `/topic/enrollment/{otp}`. | WebSocket | Must | `SRS-001`, `ARC-003` | Tự đóng modal OTP và chuyển trạng thái ACTIVE khi quét xong tại Kiosk. | Approved |
| `API-WEB-009` | Giao diện REST quản lý hồ sơ nhân sự qua `POST /api/v1/admin/employees`, `PATCH /api/v1/admin/employees/{id}` và `PATCH /api/v1/admin/employees/{id}/status`. | REST | Must | `FR-SYS-017`, `API-SYS-008` | Tạo hồ sơ nhận HTTP 201 kèm `temporaryPassword` hiển thị một lần; trùng mã/email trả 409 hiển thị tại trường tương ứng; SLA $\le 800\text{ ms}$. | Approved |
| `API-WEB-010` | Giao diện REST cấp lại mật khẩu tạm qua `POST /api/v1/admin/employees/{id}/credentials/reset`. | REST | Must | `FR-SYS-022`, `API-SYS-029` | Nhận mật khẩu tạm mới hiển thị một lần; hiển thị cảnh báo phiên cũ đã bị thu hồi; SLA $\le 800\text{ ms}$. | Approved |
| `API-WEB-011` | Giao diện REST quản lý ca và phân ca qua `/api/v1/admin/shifts` và `/api/v1/admin/employee-shifts`. | REST | Must | `FR-SYS-018`, `API-SYS-024`, `API-SYS-025` | Tạo/sửa ca và phân ca theo khoảng ngày; lỗi chồng lấn trả 409 kèm thông tin khoảng đã dùng; SLA $\le 800\text{ ms}$. | Approved |
| `API-WEB-012` | Giao diện REST đổi mật khẩu và quản lý PIN qua `POST /api/v1/auth/change-password`, `POST /api/v1/employee/pin`, `POST /api/v1/employee/pin/reset`. | REST | Must | `FR-SYS-017`, `FR-SYS-022`, `API-SYS-029` | Trả 403 `PASSWORD_CHANGE_REQUIRED` được client diễn giải thành luồng bắt buộc; thiết lập/đặt lại PIN trả trạng thái `hasPin`; SLA $\le 500\text{ ms}$. | Approved |
| `API-WEB-013` | Giao diện REST chốt và mở lại kỳ công qua `/api/v1/admin/payroll-periods`. | REST | Must | `FR-SYS-024`, `API-SYS-031` | Trả danh sách kỳ kèm trạng thái `OPEN`/`LOCKED`; chốt/mở lại trả 200; lỗi nghiệp vụ 409 hiển thị nguyên văn thông điệp Backend; SLA $\le 800\text{ ms}$. | Approved |
| `API-WEB-014` | Giao diện REST rút Consent và yêu cầu dữ liệu cá nhân qua `POST /api/v1/employee/consent/withdraw`, `/api/v1/employee/data-requests` và `/api/v1/dpo/data-requests`. | REST | Must | `FR-SYS-025`, `API-SYS-032` | Nhận hạn tiêu huỷ dữ liệu sinh trắc sau khi rút; gửi và theo dõi yêu cầu dữ liệu cá nhân; role `DPO` xử lý được danh sách yêu cầu. | Approved |
| `API-WEB-015` | Giao diện REST đăng xuất và thu hồi phiên qua `POST /api/v1/auth/logout`. | REST | Must | `FR-SYS-023`, `API-SYS-030` | Trả 204 và refresh token không dùng lại được; client xoá storage và đồng bộ đa tab sau khi gọi thành công. | Approved |
| `API-WEB-016` | Giao diện REST thông báo trong ứng dụng qua `GET /api/v1/notifications` và `PATCH /api/v1/notifications/{id}/read`. | REST | Should | `FR-SYS-027`, `API-SYS-034` | Trả danh sách thông báo của người đang đăng nhập kèm số chưa đọc; đánh dấu đã đọc trả 200; SLA $\le 500\text{ ms}$. | Approved |
| `API-WEB-017` | Giao diện REST tra cứu kiểm toán và quản lý trạm Kiosk qua `/api/v1/admin/audit-logs`, `/api/v1/admin/kiosks/**` và `/api/v1/dpo/**`. | REST | Must | `FR-SYS-019`, `FR-SYS-020`, `API-SYS-026`, `API-SYS-027`, `API-SYS-028` | ADMIN tra cứu audit log và quản lý trạm; Secret Token chỉ hiển thị một lần; role `DPO` chỉ đọc dữ liệu tuân thủ; SLA $\le 800\text{ ms}$. | Approved |
| `API-WEB-018` | Giao diện REST kết xuất báo cáo bảng công qua `GET /api/v1/admin/reports/export`. | REST | Must | `FR-WEB-006`, `API-SYS-011` | Nhận file `.xlsx` an toàn (đã escape công thức) và tải xuống trong $\le 3\text{ giây}$ với 1,000 nhân sự. | Approved |

---

## 2. Danh mục Giao diện REST Tiêu thụ (Consumed REST Interfaces)

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

## 3. Danh mục Kênh WebSocket STOMP Đăng ký (Subscribed STOMP Topics)

* **Điểm cuối Bắt tay (Handshake Endpoint)**: `ws://localhost:8080/ws-attendance` (kèm SockJS fallback).
* **Header Bắt tay STOMP**: `Authorization: Bearer <accessToken>`.

| Mã Giao diện | Tên Topic Đăng ký | Mục đích Nhận Dữ liệu | Xử lý Giao diện Web Portal |
| :--- | :--- | :--- | :--- |
| `API-WEB-007` | `/topic/live-attendance` | Nhận thông báo mỗi khi có bản ghi điểm danh mới thành công từ bất kỳ trạm Kiosk nào. | Tự động chèn dòng mới lên đầu Live Table với hiệu ứng highlight xanh ngọc; tăng bộ đếm thẻ KPI Dashboard. |
| `API-WEB-008` | `/topic/enrollment/{otp}` | Nhận thông báo kích hoạt khi nhân viên vừa hoàn tất quét mặt thành công tại trạm Kiosk. | Tự động đóng Modal hiển thị mã OTP trên máy tính nhân viên, hiển thị thông báo thành công và chuyển trạng thái sang `ACTIVE`. |

---

## 4. Đặc tả Tham số & Biên Dữ liệu (Interface Input/Output Specifications)

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
