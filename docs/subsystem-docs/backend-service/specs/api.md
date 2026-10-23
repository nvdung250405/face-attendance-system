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
| REST | `GET`, `POST`, `DELETE` | `/api/v1/admin/employee-shifts`, `/{id}` | `HR_MANAGER`, `ADMIN` | Tra cứu, phân ca và gỡ phân ca. |
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

### 2.4. REST Endpoint: Nghiệp vụ nhân sự và quản trị

| Resource | Contract quan trọng |
|---|---|
| Nhân sự | `POST /admin/employees` nhận mã, họ tên, email, phòng ban và vai trò. Mật khẩu tạm chỉ có trong response tạo/cấp lại; không được lưu phía client. |
| Ca làm việc | Ca có `shiftCode`, `shiftName`, `startTime`, `endTime`, `gracePeriodMinutes`, `isActive`; giờ bắt đầu phải nhỏ hơn giờ kết thúc. |
| Phân ca | `POST /admin/employee-shifts` nhận `userId`, `shiftId`, `effectiveFrom`, `effectiveTo`; `effectiveTo` có thể là `null` cho hiệu lực vô thời hạn. Khoảng hiệu lực cùng nhân sự không được chồng lấn. |
| Điểm danh | Lọc qua query string; điều chỉnh nhận `punchTimestamp`, `status`, `lateMinutes`, `reason`. |
| Đơn giải trình | Nhân viên gửi bản ghi điểm danh và lý do; HR/Admin quyết định `APPROVED` hoặc `REJECTED`. Từ chối yêu cầu `rejectionReason`. |
| Kỳ công | `period` có dạng `YYYY-MM`; mở kỳ yêu cầu lý do và chỉ `ADMIN` được thực hiện. |
| Kiosk quản trị | Secret đăng ký/luân chuyển chỉ hiển thị một lần trong response. |

### 2.5. REST Endpoint: Tuân thủ, thông báo và báo cáo

| Resource | Contract quan trọng |
|---|---|
| Consent | Nhân viên ký hoặc rút consent; DPO chỉ đọc consent, lịch retention và consent withdrawal. |
| Yêu cầu dữ liệu | Nhân viên tạo/xem yêu cầu của mình; DPO xem danh sách và cập nhật trạng thái. |
| Thông báo | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all`. |
| Báo cáo | Kết xuất XLSX áp dụng lọc điểm danh và triệt tiêu công thức Excel bắt đầu bằng `=`, `+`, `-`, `@`. |

### 2.6. Hợp đồng Sự kiện Bất đồng bộ (STOMP)

* Client kết nối qua `/ws` hoặc `/ws-attendance`; Web Portal có thể dùng SockJS.
* Backend cung cấp broker cho `/topic/*` và `/queue/*`; client gửi message ứng dụng qua `/app/*`.
* Các luồng nghiệp vụ dùng topic `/topic/live-attendance`, `/topic/kiosk-gallery` và topic trạng thái enrollment theo phiên.
* Payload event là JSON nghiệp vụ. Backend không cung cấp Pub/Sub message broker hoặc CloudEvents độc lập ngoài STOMP.

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

### 4.2. Cơ chế Chống Trùng lặp Giao dịch (Idempotency)

* Hợp đồng hiện **không yêu cầu hoặc xử lý** header `Idempotency-Key` chung.
* Đồng bộ offline Kiosk là ngoại lệ nghiệp vụ: record mang `localId`; server chống trùng khi đồng bộ lô.
* Client không tự retry POST/PATCH sau timeout nếu chưa xác định kết quả thao tác trước đó.

### 4.3. Giới hạn Tần suất (Rate Limiting) & Timeout

* Hợp đồng hiện **không công bố** quota, header `X-RateLimit-*`, `Retry-After`, hay chính sách retry chung.
* Client đặt timeout riêng phù hợp kênh gọi và không suy diễn HTTP `429` như một cam kết của backend.
* Client web chỉ refresh token một lần khi nhận `401`, sau đó kết thúc phiên nếu refresh thất bại.
