---
title: Backend API Specification & Design
type: api
scope: BE
status: Approved
owner: Backend Lead & API Architect
version: 4.0
updated: 2026-10-20
---

# Đặc tả Hợp đồng Giao tiếp (API & Events): Backend Service

Tài liệu này mô tả các giao diện REST và STOMP Backend Service hiện cung cấp cho Web Portal, Kiosk App và client vận hành. Tên trường JSON dùng `camelCase`; thời điểm dùng ISO-8601 với offset `+07:00`.

---

## Registry truy vết

Các ID dưới đây được duy trì để giữ liên kết hai chiều với plan, test và các facet khác. Chi tiết contract nằm ở các mục 1–4.

| ID | Name | Priority | Realizes | Status |
|---|---|---|---|---|
| `API-BE-001` | Authentication login | Must | `FR-BE-001` | Approved |
| `API-BE-002` | Token refresh | Must | `FR-BE-001` | Approved |
| `API-BE-003` | Kiosk punch | Must | `FR-BE-002` | Approved |
| `API-BE-004` | Kiosk batch sync | Must | `FR-BE-003` | Approved |
| `API-BE-005` | Kiosk gallery | Must | `FR-BE-004` | Approved |
| `API-BE-006` | Kiosk OTP verification | Must | `FR-BE-005` | Approved |
| `API-BE-007` | Kiosk face enrollment | Must | `FR-BE-006` | Approved |
| `API-BE-008` | Admin attendance query | Must | `FR-BE-008` | Approved |
| `API-BE-009` | Employee attendance query | Must | `FR-BE-008` | Approved |
| `API-BE-010` | Employee consent | Must | `FR-BE-005` | Approved |
| `API-BE-011` | Employee directory | Must | `FR-BE-001` | Approved |
| `API-BE-012` | Kiosk gallery topic | Must | `FR-BE-007` | Approved |
| `API-BE-013` | Live attendance topic | Must | `FR-BE-007` | Approved |
| `API-BE-014` | Enrollment topic | Must | `FR-BE-007` | Approved |
| `API-BE-015` | Kiosk authentication | Must | `FR-BE-002` | Approved |
| `API-BE-016` | Problem Details errors | Must | `FR-BE-001` | Approved |
| `API-BE-017` | Create employee | Must | `FR-BE-010` | Approved |
| `API-BE-018` | Update employee | Must | `FR-BE-010` | Approved |
| `API-BE-019` | Update employee status | Must | `FR-BE-010` | Approved |
| `API-BE-020` | Change password | Must | `FR-BE-011` | Approved |
| `API-BE-021` | Employee PIN | Must | `FR-BE-012` | Approved |
| `API-BE-022` | Kiosk PIN verification | Must | `FR-BE-012` | Approved |
| `API-BE-023` | Shift management | Must | `FR-BE-013` | Approved |
| `API-BE-024` | Employee shift assignment | Must | `FR-BE-013` | Approved |
| `API-BE-025` | Employee shift query | Must | `FR-BE-013` | Approved |
| `API-BE-026` | Submit excuse request | Must | `FR-BE-014` | Approved |
| `API-BE-027` | Employee excuse query | Must | `FR-BE-014` | Approved |
| `API-BE-028` | Admin excuse query | Must | `FR-BE-015` | Approved |
| `API-BE-029` | Decide excuse request | Must | `FR-BE-015` | Approved |
| `API-BE-030` | Audit log query | Must | `FR-BE-016` | Approved |
| `API-BE-031` | DPO compliance query | Must | `FR-BE-016` | Approved |
| `API-BE-032` | Kiosk registration | Must | `FR-BE-017` | Approved |
| `API-BE-033` | Kiosk update | Must | `FR-BE-017` | Approved |
| `API-BE-034` | Kiosk health query | Must | `FR-BE-017` | Approved |
| `API-BE-035` | Attendance report export | Must | `FR-BE-008` | Approved |
| `API-BE-036` | Credential reset | Must | `FR-BE-019` | Approved |
| `API-BE-037` | Employee PIN reset | Must | `FR-BE-019` | Approved |
| `API-BE-038` | Logout | Must | `FR-BE-020` | Approved |
| `API-BE-039` | Payroll lock and unlock | Must | `FR-BE-021` | Approved |
| `API-BE-040` | Payroll period query | Must | `FR-BE-021` | Approved |
| `API-BE-041` | Consent withdrawal | Must | `FR-BE-022` | Approved |
| `API-BE-042` | Data subject requests | Must | `FR-BE-022` | Approved |
| `API-BE-043` | Role management | Must | `FR-BE-023` | Approved |
| `API-BE-044` | In-app notifications | Should | `FR-BE-024` | Approved |
| `API-BE-045` | Kiosk health probe | Must | `FR-BE-002` | Approved |
| `API-BE-046` | Authenticated user profile | Must | `FR-BE-001` | Approved |
| `API-BE-047` | Attendance statistics | Must | `FR-BE-008` | Approved |
| `API-BE-048` | Attendance adjustment | Must | `FR-BE-008` | Approved |
| `APD-BE-001` | JWT authentication contract | Must | `API-BE-001`, `API-BE-020`, `API-BE-038`, `API-BE-046` | Approved |
| `APD-BE-002` | Token refresh contract | Must | `API-BE-002` | Approved |
| `APD-BE-003` | Kiosk punch contract | Must | `API-BE-003`, `API-BE-004`, `API-BE-015`, `API-BE-045` | Approved |
| `APD-BE-004` | Common response contract | Must | `API-BE-016` | Approved |
| `APD-BE-005` | STOMP contract | Must | `API-BE-012`, `API-BE-013`, `API-BE-014` | Approved |
| `APD-BE-006` | Kiosk gallery contract | Must | `API-BE-005`, `API-BE-006`, `API-BE-007` | Approved |
| `APD-BE-007` | Employee lifecycle contract | Must | `API-BE-011`, `API-BE-017`, `API-BE-036` | Approved |
| `APD-BE-008` | Update employee contract | Must | `API-BE-018` | Approved |
| `APD-BE-009` | Employee lifecycle contract | Must | `API-BE-019` | Approved |
| `APD-BE-010` | Employee consent contract | Must | `API-BE-010` | Approved |
| `APD-BE-011` | Employee PIN contract | Must | `API-BE-021`, `API-BE-037` | Approved |
| `APD-BE-012` | Kiosk PIN contract | Must | `API-BE-022` | Approved |
| `APD-BE-013` | Shift management contract | Must | `API-BE-023` | Approved |
| `APD-BE-014` | Employee shift contract | Must | `API-BE-024`, `API-BE-025` | Approved |
| `APD-BE-015` | Employee excuse contract | Must | `API-BE-026`, `API-BE-027` | Approved |
| `APD-BE-016` | Admin excuse contract | Must | `API-BE-028`, `API-BE-029` | Approved |
| `APD-BE-017` | Kiosk administration contract | Must | `API-BE-032`, `API-BE-033`, `API-BE-034` | Approved |
| `APD-BE-018` | Attendance query contract | Must | `API-BE-008`, `API-BE-009`, `API-BE-047`, `API-BE-048` | Approved |
| `APD-BE-019` | Report export contract | Must | `API-BE-035` | Approved |
| `APD-BE-020` | Payroll period contract | Must | `API-BE-039`, `API-BE-040` | Approved |
| `APD-BE-021` | Consent withdrawal contract | Must | `API-BE-041` | Approved |
| `APD-BE-022` | Data subject request contract | Must | `API-BE-042` | Approved |
| `APD-BE-023` | Role management contract | Must | `API-BE-043` | Approved |
| `APD-BE-024` | Notification contract | Should | `API-BE-044` | Approved |
| `APD-BE-025` | Audit query contract | Must | `API-BE-030` | Approved |
| `APD-BE-026` | Compliance query contract | Must | `API-BE-031` | Approved |

---

## 1. Danh mục Giao diện (Interface Catalog)

| Giao thức | Phương thức / Kiểu | Đường dẫn (Endpoint / Topic / Queue) | Phân quyền (Scope / Role) | Mô tả tóm tắt |
|---|---|---|---|---|
| REST | `POST` | `/api/v1/auth/login`, `/refresh` | Public | Đăng nhập và làm mới cặp token. |
| REST | `GET`, `POST` | `/api/v1/auth/me`, `/change-password`, `/logout` | Authenticated | Quản lý hồ sơ và phiên hiện hành. |
| REST | `GET` | `/api/v1/kiosk/health` | Public | Kiểm tra sẵn sàng Backend. |
| REST | `POST` | `/api/v1/kiosk/punch`, `/sync-batch` | Kiosk secret | Điểm danh trực tuyến hoặc đồng bộ lô ngoại tuyến. |
| REST | `GET` | `/api/v1/kiosk/gallery` | Kiosk secret | Cấp danh mục embedding đang hoạt động. |
| REST | `POST` | `/api/v1/kiosk/verify-otp`, `/enroll-face`, `/verify-pin` | Kiosk secret | Ghi danh khuôn mặt và xác thực PIN dự phòng. |
| REST | `GET` | `/api/v1/employee/attendance`, `/attendance/logs` | `EMPLOYEE` | Xem bảng công và các lần điểm danh của chính mình. |
| REST | `POST` | `/api/v1/employee/consent`, `/consent/withdraw` | `EMPLOYEE` | Ký hoặc rút informed consent. |
| REST | `GET` | `/api/v1/employee/consent/withdrawal` | `EMPLOYEE` | Tra cứu trạng thái rút consent. |
| REST | `GET`, `POST` | `/api/v1/employee/pin`, `/pin/reset` | `EMPLOYEE` | Đọc, đặt/đổi hoặc đặt lại PIN. |
| REST | `POST`, `GET` | `/api/v1/employee/excuse-requests` | `EMPLOYEE` | Nộp và tra cứu đơn giải trình của chính mình. |
| REST | `POST`, `GET` | `/api/v1/employee/data-requests`, `/{id}` | `EMPLOYEE` | Gửi và theo dõi yêu cầu dữ liệu cá nhân. |
| REST | `GET`, `PATCH` | `/api/v1/admin/attendance`, `/{id}`, `/stats` | `HR_MANAGER`, `ADMIN` | Tra cứu, điều chỉnh điểm danh và lấy KPI. |
| REST | `GET`, `POST`, `PATCH` | `/api/v1/admin/employees`, `/{id}`, `/{id}/status` | `HR_MANAGER`, `ADMIN` | Liệt kê, tạo, sửa và đổi trạng thái nhân sự. |
| REST | `POST` | `/api/v1/admin/employees/{id}/credentials/reset` | `HR_MANAGER`, `ADMIN` | Cấp mật khẩu tạm một lần. |
| REST | `GET`, `POST`, `PATCH` | `/api/v1/admin/shifts`, `/{id}`, `/{id}/activate`, `/{id}/deactivate` | `HR_MANAGER`, `ADMIN` | Quản lý danh mục ca. |
| REST | `GET`, `POST`, `DELETE` | `/api/v1/admin/employee-shifts`, `/batch`, `/{id}` | `HR_MANAGER`, `ADMIN` | Tra cứu, phân ca (đơn lẻ / hàng loạt) và gỡ phân ca. |
| REST | `GET`, `PATCH`, `POST` | `/api/v1/admin/excuse-requests`, `/{id}`, `/{id}/approve`, `/{id}/reject` | `HR_MANAGER`, `ADMIN` | Xử lý đơn giải trình. |
| REST | `GET` | `/api/v1/admin/audit-logs` | `ADMIN` | Tra cứu nhật ký kiểm toán. |
| REST | `GET`, `POST`, `PATCH` | `/api/v1/admin/kiosks`, `/{id}`, `/{id}/rotate-secret`, `/{id}/health` | `ADMIN` | Đăng ký, quản trị và kiểm tra Kiosk. |
| REST | `GET`, `POST` | `/api/v1/admin/payroll-periods`, `/{period}`, `/{period}/lock`, `/{period}/unlock` | `HR_MANAGER`/`ADMIN`; unlock: `ADMIN` | Tra cứu, chốt và mở kỳ công. |
| REST | `GET` | `/api/v1/admin/reports/export` | `HR_MANAGER`, `ADMIN` | Xuất báo cáo điểm danh XLSX. |
| REST | `PATCH` | `/api/v1/admin/users/{id}/role` | `ADMIN` | Cập nhật vai trò người dùng. |
| REST | `GET`, `PATCH`, `POST` | `/api/v1/notifications`, `/unread-count`, `/{id}/read`, `/read-all` | Authenticated | Đọc và cập nhật trạng thái thông báo. |
| REST | `GET` | `/api/v1/dpo/consents`, `/retention-schedule`, `/consent-withdrawals` | `DPO` | Tra cứu dữ liệu tuân thủ. |
| REST | `GET`, `PATCH` | `/api/v1/dpo/data-requests`, `/{id}` | `DPO` | Xử lý yêu cầu dữ liệu cá nhân. |
| WebSocket/STOMP | `CONNECT`, `SUBSCRIBE` | `/ws`, `/ws-attendance`; `/topic/*`, `/queue/*` | JWT hoặc Kiosk secret | Kênh sự kiện thời gian thực; hỗ trợ SockJS fallback. |

---

## 2. Chi tiết Hợp đồng Giao diện (Data Contracts)

### 2.1. Quy ước REST chung

* **Base path:** `/api/v1`.
* **Success envelope:** mọi endpoint REST trừ response tệp và `204 No Content` trả về:

  ```json
  {
    "success": true,
    "code": "BUSINESS_RESULT_CODE",
    "message": "Thông điệp nghiệp vụ",
    "data": {},
    "timestamp": "2026-10-20T10:00:00+07:00"
  }
  ```

* **Phân trang:** endpoint danh sách hỗ trợ `page`, `size`, `sort`; `data` là trang chứa `content` và siêu dữ liệu trang.
* **Xác thực web:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
* **Xác thực Kiosk:** `X-Kiosk-Id` và `X-Kiosk-Secret`; `/kiosk/health` là công khai.
* **Tệp xuất:** `GET /admin/reports/export` trả XLSX binary với `Content-Disposition: attachment`, không dùng success envelope.

### 2.2. REST Endpoint: Xác thực và phiên

| Endpoint | Request payload | Response `data` | Kết quả |
|---|---|---|---|
| `POST /auth/login` | `email`, `password` | `accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `user` | `200` |
| `POST /auth/refresh` | `refreshToken` | cặp token mới | `200` |
| `GET /auth/me` | Bearer token | `id`, `employeeCode`, `fullName`, `email`, `role`, `status`, `department`, `hasBiometric`, `hasPin` | `200` |
| `POST /auth/change-password` | `currentPassword`, `newPassword`, `confirmPassword` | `null` | `200` |
| `POST /auth/logout` | `refreshToken` | không có body | `204` |

### 2.3. REST Endpoint: Kiosk

| Endpoint | Request payload | Response `data` | Kết quả |
|---|---|---|---|
| `POST /kiosk/punch` | `employeeId`, `punchTimestamp`, `verificationMethod`, `confidenceScore`, `kioskId` | `recordId`, nhân sự, `punchType`, `status`, `lateMinutes` | `200` |
| `POST /kiosk/sync-batch` | `kioskId`, tối đa 50 `records` có `localId` | `syncedCount`, `syncedLocalIds` | `200` |
| `GET /kiosk/gallery` | Kiosk headers | `galleryVersion`, `totalCount`, `items[]` embedding | `200` |
| `POST /kiosk/verify-otp` | `otp`, `kioskId` | `sessionToken`, định danh nhân sự | `200` |
| `POST /kiosk/enroll-face` | `otp`, `sessionToken`, `vector512`, `kioskId` | `employeeId`, `templateId`, `status`, `activatedAt` | `200` |
| `POST /kiosk/verify-pin` | `employeeCode`, `pin` | định danh nhân sự | `200` |
| `GET /kiosk/health` | — | `status: "UP"`, `service` | `200` |

### 2.4. REST Endpoint: Nghiệp vụ nhân sự, Ca làm việc, Điểm danh, Kỳ công, Kiosk Admin

#### 2.4.1. Quản lý Nhân sự & Tài khoản (`/admin/employees`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `POST /admin/employees` | `HR_MANAGER`, `ADMIN` | Body: `employeeCode`, `fullName`, `email`, `department`, `role` (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`, `DPO`) | `CreateEmployeeResponse`: `employeeId`, `employeeCode`, `fullName`, `email`, `role`, `status`, `department`, `temporaryPassword`, `createdAt` | `200` |
| `GET /admin/employees` | `HR_MANAGER`, `ADMIN` | Query: `status`, `department`, `keyword`, `page`, `size`, `sort` | `PageResponse<EmployeeItem>`: `content`: `[id, employeeCode, fullName, email, department, role, status, hasBiometric, hasPin, createdAt]`, `page`, `size`, `totalElements`, `totalPages`, `last` | `200` |
| `PATCH /admin/employees/{id}` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: `fullName`, `email`, `department`, `role` | `EmployeeItem`: `id`, `employeeCode`, `fullName`, `email`, `department`, `role`, `status`, `hasBiometric`, `hasPin`, `createdAt` | `200` |
| `PATCH /admin/employees/{id}/status` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: `status` (`ACTIVE`, `SUSPENDED`, `TERMINATED`), `reason` | `EmployeeItem`: `id`, `employeeCode`, `fullName`, `email`, `department`, `role`, `status`, `hasBiometric`, `hasPin`, `createdAt` | `200` |
| `POST /admin/employees/{id}/credentials/reset` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: empty | `ResetCredentialsResponse`: `employeeId`, `employeeCode`, `email`, `temporaryPassword` | `200` |
| `PATCH /admin/users/{id}/role` | `ADMIN` | Path: `id`. Body: `role` (`EMPLOYEE`, `HR_MANAGER`, `ADMIN`, `DPO`) | `UserRoleResponse`: `userId`, `employeeCode`, `fullName`, `email`, `role` | `200` |

#### 2.4.2. Ca làm việc & Phân ca (`/admin/shifts`, `/admin/employee-shifts`, `/employee/shifts`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `POST /admin/shifts` | `HR_MANAGER`, `ADMIN` | Body: `shiftCode`, `shiftName`, `startTime` (`HH:mm:ss`), `endTime` (`HH:mm:ss`), `gracePeriodMinutes` | `ShiftResponse`: `id`, `shiftCode`, `shiftName`, `startTime`, `endTime`, `gracePeriodMinutes`, `isActive` | `200` |
| `GET /admin/shifts` | `HR_MANAGER`, `ADMIN` | Query: `activeOnly` (boolean, optional) | `List<ShiftResponse>`: danh sách các ca làm việc | `200` |
| `GET /admin/shifts/{id}` | `HR_MANAGER`, `ADMIN` | Path: `id` | `ShiftResponse`: thông tin chi tiết ca | `200` |
| `PATCH /admin/shifts/{id}` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: `shiftName`, `startTime`, `endTime`, `gracePeriodMinutes`, `isActive` | `ShiftResponse`: thông tin ca sau khi cập nhật | `200` |
| `POST /admin/shifts/{id}/activate` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: empty | `ShiftResponse`: `isActive = true` | `200` |
| `POST /admin/shifts/{id}/deactivate` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: empty | `ShiftResponse`: `isActive = false` | `200` |
| `POST /admin/employee-shifts` | `HR_MANAGER`, `ADMIN` | Body: `userId`, `shiftId`, `effectiveFrom` (`YYYY-MM-DD`), `effectiveTo` (`YYYY-MM-DD` hoặc `null`) | `EmployeeShiftResponse`: `id`, `userId`, `employeeCode`, `fullName`, `shiftId`, `shiftCode`, `shiftName`, `effectiveFrom`, `effectiveTo` | `200` |
| `POST /admin/employee-shifts/batch` | `HR_MANAGER`, `ADMIN` | Body: `userIds` (`List<Long>`), `shiftId`, `effectiveFrom` (`YYYY-MM-DD`), `effectiveTo` (`YYYY-MM-DD` hoặc `null`) | `BatchAssignShiftResponse`: `total`, `successCount`, `failedCount`, `failures`: `[{userId, employeeCode, fullName, reason}]`, `assignments`: `List<EmployeeShiftResponse>` | `200` |
| `GET /admin/employee-shifts` | `HR_MANAGER`, `ADMIN` | Query: `userId`, `shiftId`, `effectiveDate`, `page`, `size` | `PageResponse<EmployeeShiftResponse>`: danh sách phân ca theo bộ lọc | `200` |
| `DELETE /admin/employee-shifts/{id}` | `HR_MANAGER`, `ADMIN` | Path: `id` | `null` (`ApiResponse<Void>`) | `200` |
| `GET /employee/shifts/my` | `EMPLOYEE` | Query: `from` (`YYYY-MM-DD`), `to` (`YYYY-MM-DD`) | `List<EmployeeShiftResponse>`: lịch phân ca của cá nhân | `200` |

#### 2.4.3. Điểm danh & Thống kê (`/admin/attendance`, `/employee/attendance`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `GET /admin/attendance` | `HR_MANAGER`, `ADMIN` | Query: `fromDate`, `toDate`, `department`, `status`, `keyword`, `page`, `size`, `sort` | `PageResponse<AttendanceLogItem>`: `content`: `[recordId, employeeId, employeeCode, fullName, department, punchTimestamp, punchType, verificationMethod, status, lateMinutes, kioskId]`, metadata phân trang | `200` |
| `GET /admin/attendance/stats` | `HR_MANAGER`, `ADMIN` | Query: `date` (`YYYY-MM-DD`, mặc định hiện tại) | `AttendanceStatsResponse`: `totalEmployees`, `presentCount`, `onTimeCount`, `lateCount`, `absentCount` | `200` |
| `PATCH /admin/attendance/{id}` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: `punchTimestamp`, `status` (`PRESENT`, `LATE`), `lateMinutes`, `reason` | `AttendanceLogItem`: bản ghi điểm danh sau khi điều chỉnh | `200` |
| `GET /employee/attendance` | `EMPLOYEE` | Query: `month` (1-12), `year` (`YYYY`) | `PersonalAttendanceResponse`: `month`, `year`, `totalWorkDays`, `totalOnTimeDays`, `totalLateDays`, `records`: `[date, checkInTime, checkOutTime, status, lateMinutes, checkInLogId, checkOutLogId]` | `200` |
| `GET /employee/attendance/logs` | `EMPLOYEE` | Query: `year`, `month`, `page`, `size` | `PageResponse<AttendanceLogItem>`: lịch sử quẹt thẻ cá nhân | `200` |

#### 2.4.4. Quản trị Kỳ công (`/admin/payroll-periods`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `GET /admin/payroll-periods` | `HR_MANAGER`, `ADMIN` | Query: `year` (optional), `page`, `size` | `PageResponse<PayrollPeriodResponse>`: `[id, periodYear, periodMonth, status, lockedById, lockedByName, lockedAt, unlockedById, unlockedByName, unlockedAt, unlockReason, createdAt, updatedAt]` | `200` |
| `GET /admin/payroll-periods/{period}` | `HR_MANAGER`, `ADMIN` | Path: `period` (`YYYY-MM`) | `PayrollPeriodResponse`: thông tin trạng thái kỳ công | `200` |
| `POST /admin/payroll-periods/{period}/lock` | `HR_MANAGER`, `ADMIN` | Path: `period` (`YYYY-MM`). Body: empty | `PayrollPeriodResponse`: `status = LOCKED`, `lockedAt`, `lockedByName` | `200` |
| `POST /admin/payroll-periods/{period}/unlock` | `ADMIN` duy nhất | Path: `period` (`YYYY-MM`). Body: `reason` (bắt buộc) | `PayrollPeriodResponse`: `status = OPEN`, `unlockedAt`, `unlockReason` | `200` |

#### 2.4.5. Quản trị Kiosk Edge (`/admin/kiosks`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `POST /admin/kiosks` | `ADMIN` | Body: `id` (mã kiosk), `locationName` | `RegisterKioskResponse`: `id`, `locationName`, `secretToken` (chỉ hiển thị một lần duy nhất), `createdAt` | `200` |
| `GET /admin/kiosks` | `ADMIN` | Query: `page`, `size` | `PageResponse<KioskItemResponse>`: `[id, locationName, isActive, lastPingAt, createdAt, isOnline]`, metadata phân trang | `200` |
| `GET /admin/kiosks/{id}` | `ADMIN` | Path: `id` | `KioskItemResponse`: `id`, `locationName`, `isActive`, `lastPingAt`, `createdAt`, `isOnline` | `200` |
| `PATCH /admin/kiosks/{id}` | `ADMIN` | Path: `id`. Body: `locationName`, `isActive` | `KioskItemResponse`: thông tin kiosk cập nhật | `200` |
| `POST /admin/kiosks/{id}/rotate-secret` | `ADMIN` | Path: `id`. Body: empty | `RotateKioskTokenResponse`: `id`, `newSecretToken` (chỉ hiển thị một lần duy nhất), `rotatedAt` | `200` |
| `GET /admin/kiosks/{id}/health` | `ADMIN` | Path: `id` | `KioskHealthResponse`: `id`, `locationName`, `isActive`, `lastPingAt`, `isHealthy`, `warningMessage` | `200` |

#### 2.4.6. Mã PIN Nhân sự (`/employee/pin`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `GET /employee/pin` | `EMPLOYEE` | Bearer token | `PinOperationResult`: `hasPin` (boolean), `message` | `200` |
| `POST /employee/pin/setup` | `EMPLOYEE` | Body: `pin` (6 chữ số), `confirmPin` | `PinOperationResult`: `hasPin = true`, `message` | `200` |
| `POST /employee/pin/change` | `EMPLOYEE` | Body: `currentPin`, `newPin`, `confirmPin` | `PinOperationResult`: `hasPin = true`, `message` | `200` |
| `POST /employee/pin/reset` | `EMPLOYEE` | Body: `currentPassword`, `newPin`, `confirmPin` | `PinOperationResult`: `hasPin = true`, `message` | `200` |

### 2.5. REST Endpoint: Tuân thủ DPO, Yêu cầu Dữ liệu Cá nhân, Giải trình Công, Thông báo, Xuất báo cáo

#### 2.5.1. Đơn giải trình công (`/employee/excuse-requests`, `/admin/excuse-requests`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `POST /employee/excuse-requests` | `EMPLOYEE` | Body: `attendanceLogId` (Long), `reason` (String), `requestedPunchTimestamp` (Instant, optional) | `ExcuseRequestResponse`: `id`, `userId`, `employeeCode`, `fullName`, `attendanceLogId`, `originalPunchTimestamp`, `requestedPunchTimestamp`, `reason`, `status` (`PENDING`), `decidedById`, `decidedByName`, `decidedAt`, `rejectionReason`, `createdAt`, `updatedAt` | `200` |
| `GET /employee/excuse-requests` | `EMPLOYEE` | Query: `page`, `size` | `PageResponse<ExcuseRequestResponse>`: danh sách đơn giải trình của cá nhân | `200` |
| `GET /admin/excuse-requests` | `HR_MANAGER`, `ADMIN` | Query: `status` (`PENDING`, `APPROVED`, `REJECTED`, optional), `page`, `size` | `PageResponse<ExcuseRequestResponse>`: danh sách đơn giải trình toàn hệ thống | `200` |
| `GET /admin/excuse-requests/{id}` | `HR_MANAGER`, `ADMIN` | Path: `id` | `ExcuseRequestResponse`: chi tiết đơn giải trình | `200` |
| `PATCH /admin/excuse-requests/{id}` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: `status` (`APPROVED` hoặc `REJECTED`), `reviewNote` (optional), `rejectionReason` (bắt buộc khi `REJECTED`) | `ExcuseRequestResponse`: đơn sau khi quyết định | `200` |
| `POST /admin/excuse-requests/{id}/approve` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: `reviewNote` (optional) | `ExcuseRequestResponse`: `status = APPROVED`, `decidedByName`, `decidedAt` | `200` |
| `POST /admin/excuse-requests/{id}/reject` | `HR_MANAGER`, `ADMIN` | Path: `id`. Body: `rejectionReason` (bắt buộc) | `ExcuseRequestResponse`: `status = REJECTED`, `rejectionReason`, `decidedAt` | `200` |

#### 2.5.2. Informed Consent & Tuân thủ DPO (`/employee/consent`, `/dpo`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `POST /employee/consent` | `EMPLOYEE` | Body: `agreed` (boolean, required `true`), `consentVersion` (String, required) | `ConsentResult`: `otp` (6 số dùng kích hoạt tại Kiosk), `qrCodeDataUrl` (ảnh base64 QR), `expiresAt`, `consentSignedAt`, `notice` | `200` |
| `POST /employee/consent/withdraw` | `EMPLOYEE` | Body: empty | `ConsentWithdrawalResponse`: `id`, `userId`, `employeeCode`, `withdrawnAt`, `clientIp`, `biometricDisposalDueAt` (hạn hủy dữ liệu trong 72h), `processedAt`, `createdAt` | `200` |
| `GET /employee/consent/withdrawal` | `EMPLOYEE` | Bearer token | `ConsentWithdrawalResponse`: thông tin rút consent gần nhất của cá nhân | `200` |
| `GET /dpo/consents` | `DPO` | Query: `page`, `size` | `PageResponse<ConsentRecordItem>`: `[sessionId, userId, employeeCode, fullName, email, consentVersion, consentSignedAt, clientIp, isUsed]` | `200` |
| `GET /dpo/retention-schedule` | `DPO` | Query: `page`, `size` | `PageResponse<RetentionScheduleItem>`: `[sourceId, employeeCode, fullName, email, triggerDate, scheduledDisposalDate, isDisposed, processedAt, retentionType]` | `200` |
| `GET /dpo/consent-withdrawals` | `DPO` | Query: `page`, `size` | `PageResponse<ConsentWithdrawalResponse>`: danh sách yêu cầu rút đồng thuận | `200` |

#### 2.5.3. Quyền của Chủ thể Dữ liệu DPO (`/employee/data-requests`, `/dpo/data-requests`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `POST /employee/data-requests` | `EMPLOYEE` | Body: `requestType` (`ACCESS`, `RECTIFICATION`, `ERASURE`, `RESTRICTION`, `PORTABILITY`, `OBJECTION`), `detail` (String) | `DataSubjectRequestResponse`: `id`, `userId`, `employeeCode`, `fullName`, `requestType`, `detail`, `status` (`PENDING`), `handledById`, `handledByName`, `response`, `respondedAt`, `createdAt`, `updatedAt` | `200` |
| `GET /employee/data-requests` | `EMPLOYEE` | Query: `page`, `size` | `PageResponse<DataSubjectRequestResponse>`: danh sách yêu cầu cá nhân | `200` |
| `GET /employee/data-requests/{id}` | `EMPLOYEE` | Path: `id` | `DataSubjectRequestResponse`: chi tiết yêu cầu cá nhân | `200` |
| `GET /dpo/data-requests` | `DPO` | Query: `status` (optional), `page`, `size` | `PageResponse<DataSubjectRequestResponse>`: toàn bộ yêu cầu chủ thể dữ liệu | `200` |
| `GET /dpo/data-requests/{id}` | `DPO` | Path: `id` | `DataSubjectRequestResponse`: chi tiết yêu cầu DPO xem | `200` |
| `PATCH /dpo/data-requests/{id}` | `DPO` | Path: `id`. Body: `status` (`IN_PROGRESS`, `COMPLETED`, `REJECTED`), `response` (String) | `DataSubjectRequestResponse`: yêu cầu sau khi DPO phản hồi | `200` |

#### 2.5.4. Thông báo Nội bộ (`/notifications`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `GET /notifications` | Authenticated | Query: `page`, `size`, `sort` (default `createdAt,desc`) | `PageResponse<NotificationResponse>`: `[id, userId, eventType, title, body, referenceType, referenceId, readAt, createdAt]` | `200` |
| `GET /notifications/unread-count` | Authenticated | Bearer token | `Map<String, Long>`: `{"unreadCount": count}` | `200` |
| `PATCH /notifications/{id}/read` | Authenticated | Path: `id` | `NotificationResponse`: bản ghi thông báo sau khi đánh dấu đã đọc (`readAt != null`) | `200` |
| `POST /notifications/read-all` | Authenticated | Body: empty | `null` (`ApiResponse<Void>`) | `200` |

#### 2.5.5. Nhật ký Kiểm toán & Báo cáo (`/admin/audit-logs`, `/admin/reports`)

| Method & Path | Phân quyền | Query / Path / Body | Response `data` (Field-by-field) | HTTP |
|---|---|---|---|---|
| `GET /admin/audit-logs` | `ADMIN` | Query: `from`, `to`, `actorId`, `action`, `entityType`, `page`, `size` | `PageResponse<AuditLogItemResponse>`: `[id, actorId, actorEmail, action, entityType, entityId, beforeState, afterState, ipAddress, createdAt]` | `200` |
| `GET /admin/reports/export` | `HR_MANAGER`, `ADMIN` | Query: `fromDate`, `toDate`, `department`, `status`, `keyword` | Binary XLSX file (MIME: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`). Header: `Content-Disposition: attachment; filename="attendance_report_*.xlsx"` | `200` |

### 2.6. Hợp đồng Sự kiện Bất đồng bộ (WebSocket STOMP Events)

Hệ thống sử dụng WebSocket giao thức STOMP để truyền phát sự kiện thời gian thực 2 chiều:
* **Connection Handshake:** Endpoint `/ws` và `/ws-attendance` (hỗ trợ SockJS fallback cho trình duyệt).
* **Destination Prefix:** Application prefix `/app`; Simple Broker prefixes: `/topic` (broadcast), `/queue` (user/kiosk specific).
* **Bảo mật:** Client gửi `Authorization: Bearer <JWT>` (Web Portal) hoặc `X-Kiosk-Id` & `X-Kiosk-Secret` (Kiosk) trong STOMP `CONNECT` frame headers.

#### 2.6.1. Chi tiết Event Topics

| Topic | Producer & Mục đích | Consumer | Cấu trúc Payload Event (Field-by-field) |
|---|---|---|---|
| `/topic/live-attendance` | `StompEventBroadcaster`: Phát sự kiện điểm danh tức thì khi có lượt quẹt thẻ thành công (Check-in/Check-out). | Web Portal Live Attendance Dashboard | `AttendancePunchEvent`:<br>- `eventType`: `"ATTENDANCE_PUNCHED"`<br>- `recordId`: Long<br>- `employeeId`: Long<br>- `employeeCode`: String<br>- `fullName`: String<br>- `department`: String<br>- `punchTimestamp`: OffsetDateTime (`YYYY-MM-DDTHH:mm:ss+07:00`)<br>- `punchType`: Enum `PunchType` (`CHECK_IN`, `CHECK_OUT`)<br>- `verificationMethod`: Enum `VerificationMethod` (`VERIFICATION_FACE`, `VERIFICATION_PIN`, `FACE_MATCH`, `FALLBACK_PIN`, `MANUAL_HR`, `HR_OVERRIDE`)<br>- `status`: Enum `AttendanceStatus` (`PRESENT`, `LATE`)<br>- `lateMinutes`: int (số phút muộn)<br>- `kioskId`: String |
| `/topic/kiosk-gallery` | `StompEventBroadcaster`: Phát thông báo cập nhật gallery sinh trắc khi khuôn mặt được ghi danh mới hoặc bị thu hồi/xóa. | Edge Kiosks đang trực tuyến | `GalleryUpdateEvent`:<br>- `action`: String (`"ADD_VECTOR"` hoặc `"DELETE_VECTOR"`)<br>- `employeeId`: Long<br>- `employeeCode`: String<br>- `fullName`: String<br>- `vector512`: `List<Float>` (512 chiều face embedding khi `ADD_VECTOR`, `null` khi `DELETE_VECTOR`)<br>- `reason`: String<br>- `updatedAt`: OffsetDateTime |
| `/topic/enrollment/{otp}` | `StompEventBroadcaster`: Thông báo cho Web Portal khi nhân viên hoàn tất chụp khuôn mặt thành công tại Kiosk theo phiên OTP. | Web Portal (modal chờ kích hoạt sinh trắc) | `EnrollmentSuccessEvent`:<br>- `otp`: String (mã OTP phiên ghi danh)<br>- `employeeId`: Long<br>- `employeeCode`: String<br>- `fullName`: String<br>- `activatedAt`: OffsetDateTime<br>- `message`: String |

---

### 2.7. Chuẩn Định dạng Lỗi Hệ thống (Error Response - RFC 7807)

Mọi lỗi nghiệp vụ trả Problem Details với mã `code`; validation có thêm `invalidParams` khi áp dụng.

```json
{
  "type": "about:blank",
  "title": "Dữ liệu không hợp lệ",
  "status": 400,
  "detail": "Chi tiết nguyên nhân",
  "instance": "/api/v1/resource",
  "code": "VALIDATION_FAILED",
  "invalidParams": [
    { "name": "fieldName", "reason": "Ràng buộc bị vi phạm" }
  ]
}
```

---

## 3. Bảng Mã Lỗi Nghiệp vụ (Error Code Matrix)

| HTTP Status | Mã lỗi hệ thống (Machine Code) | Thông điệp mặc định | Nguyên nhân & Hướng dẫn xử lý cho Client |
|---|---|---|---|
| `400` | `VALIDATION_FAILED` | Dữ liệu không hợp lệ | Hiển thị `invalidParams`; không tự retry. |
| `401` | `AUTH_INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `KIOSK_UNAUTHORIZED`, `PIN_INVALID` | Xác thực thất bại | Refresh phiên web khi phù hợp; Kiosk kiểm tra secret; PIN cho phép nhập lại. |
| `403` | `ACCESS_DENIED` | Không đủ quyền hạn | Không hiển thị thao tác trái role. |
| `404` | `EMPLOYEE_NOT_FOUND`, `RESOURCE_NOT_FOUND` | Không tìm thấy tài nguyên | Làm mới danh sách và yêu cầu chọn lại tài nguyên. |
| `409` | `COOLDOWN_ACTIVE`, `OTP_ALREADY_USED`, `PERIOD_LOCKED`, `SHIFT_OVERLAPPING`, `SHIFT_IN_USE`, `EXCUSE_ALREADY_PROCESSED` | Xung đột trạng thái | Hiển thị thông điệp server và nạp lại dữ liệu liên quan. |
| `423` | `PIN_LOCKED` | PIN đang bị khóa | Hiển thị `lockedUntil`; không gửi lại trước thời điểm đó. |
| `500` | `INTERNAL_SERVER_ERROR` | Lỗi máy chủ nội bộ | Hiển thị lỗi thân thiện và ghi nhận mã/lần xảy ra để tra soát. |

---

## 4. Chính sách Xác thực, Phân quyền & Idempotency

### 4.1. Xác thực & Phân quyền (Authentication & RBAC)

* **Web:** Bearer JWT, không lưu trạng thái session phía server.
* **Kiosk:** Kiosk ID và secret riêng; JWT web không thay thế secret Kiosk.
* **RBAC:** `ADMIN`, `HR_MANAGER`, `EMPLOYEE`, `DPO` được kiểm tra theo endpoint; backend là nguồn áp đặt quyền cuối cùng.
* **WebSocket:** Client gửi credential trong STOMP CONNECT headers; destination được kiểm soát theo thông tin xác thực đó.

### 4.2. Cơ chế Chống Trùng lặp Giao dịch & Kế hoạch Mở rộng Idempotency (Roadmap)

#### 4.2.1. Hiện trạng triển khai (Current Baseline)
* **Quy ước hiện tại:** Hệ thống chưa bắt buộc header `Idempotency-Key` trên toàn bộ các endpoint REST.
* **Cơ chế chống trùng nghiệp vụ sẵn có:**
  * Đồng bộ ngoại tuyến Kiosk (`POST /api/v1/kiosk/sync-batch`): Phía Kiosk gửi kèm `localQueueId`; Backend áp dụng kiểm tra khóa duy nhất `(kiosk_id, local_queue_id)` để đảm bảo bản ghi không bị nhân bản khi retry mạng.
  * Điểm danh trực tiếp (`POST /api/v1/kiosk/punch`): Kiểm tra thời gian cooldown giữa các lần quẹt liên tiếp (`COOLDOWN_ACTIVE`).
  * Chuyển đổi trạng thái đơn và kỳ công: Được kiểm soát trạng thái tuần tự; request trùng trả về HTTP `409 Conflict` (`EXCUSE_ALREADY_PROCESSED`, `PERIOD_LOCKED`).

#### 4.2.2. Kế hoạch Mở rộng Header `Idempotency-Key` (Target Architecture)
Nhằm phòng ngừa triệt để hiện tượng Retry Storm và nhân đôi giao dịch khi mạng chập chờn, Backend Service thiết lập đặc tả chuẩn hóa `Idempotency-Key` mở rộng theo chuẩn quốc tế:

1. **Quy chuẩn Header & Phạm vi Áp dụng:**
   * Header: `Idempotency-Key: <string>` (khuyến nghị định dạng UUID v4 do Client sinh cho mỗi ý định giao dịch duy nhất).
   * Các endpoint trọng yếu áp dụng:
     * `POST /api/v1/kiosk/punch`: Điểm danh trực tiếp tại Kiosk.
     * `POST /api/v1/admin/payroll-periods/{period}/lock`: Chốt kỳ công nhân sự.
     * `POST /api/v1/employee/excuse-requests`: Nộp đơn giải trình công.
     * `POST /api/v1/admin/employees`: Khởi tạo hồ sơ nhân viên mới.
2. **Nguyên lý Xử lý Nguyên tử (Atomic Claim):**
   * Sử dụng bảng lưu trữ chuyên trách `idempotency_records` với khóa chính duy nhất `(idempotency_key, resource_path)`.
   * Thao tác claim chìa khóa được thực hiện bằng một lệnh duy nhất (`INSERT ... ON CONFLICT DO NOTHING`), triệt tiêu race condition (TOCTOU).
   * Vòng đời trạng thái khóa:
     * `IN_PROGRESS`: Yêu cầu đang được xử lý trong transaction hiện tại.
     * `SUCCEEDED`: Giao dịch hoàn tất thành công; lưu trữ mã trạng thái HTTP và nội dung response JSON đã trả về.
     * `FAILED`: Giao dịch thất bại do lỗi hệ thống nội bộ; cho phép client retry lại sau khi khắc phục.
3. **Bảo vệ Tính toàn vẹn Dữ liệu (Payload Guard):**
   * Server tính toán `request_hash = SHA-256(request_body)`.
   * Nếu client tái sử dụng cùng một `Idempotency-Key` nhưng gửi kèm nội dung body khác với lần đầu: Server lập tức từ chối và trả về HTTP `422 Unprocessable Entity` với mã lỗi `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`.
4. **Ứng xử với Yêu cầu Trùng lặp Đang thực thi (In-flight Duplicate Policy):**
   * Khi nhận request mang `Idempotency-Key` đang có trạng thái `IN_PROGRESS`: Server trả về ngay lập tức HTTP `409 Conflict` kèm mã `TRANSACTION_IN_PROGRESS`, yêu cầu client chờ đợi hoặc truy vấn lại kết quả.
5. **Thời gian Lưu giữ (TTL Retention Window):**
   * Bản ghi idempotency được lưu giữ tối thiểu 48 giờ (vượt qua toàn bộ chuỗi retry và hàng đợi timeout tối đa của client). Job dọn dẹp nền định kỳ thu hồi các bản ghi đã hết hạn.

#### 4.2.3. Lộ trình Triển khai Kỹ thuật (Implementation Roadmap)
* **Giai đoạn 1 (Schema & Core Module):** Tạo migration Flyway bổ sung bảng `idempotency_records` và xây dựng module `IdempotencyService` độc lập.
* **Giai đoạn 2 (Backend Interceptor/Aspect):** Cung cấp annotation `@Idempotent` tích hợp vào Spring AOP để tự động kiểm tra, lưu cache phản hồi cho các Controller trọng yếu.
* **Giai đoạn 3 (Client Adoption):** Cập nhật `apiClient` trên Web Portal và Kiosk Service tự động sinh header `Idempotency-Key` trước khi gửi các request thay đổi trạng thái (POST/PATCH).

### 4.3. Giới hạn Tần suất (Rate Limiting) & Timeout

* Hợp đồng hiện **không công bố** quota, header `X-RateLimit-*`, `Retry-After`, hay chính sách retry chung.
* Client đặt timeout riêng phù hợp kênh gọi và không suy diễn HTTP `429` như một cam kết của backend.
* Client web chỉ refresh token một lần khi nhận `401`, sau đó kết thúc phiên nếu refresh thất bại.
