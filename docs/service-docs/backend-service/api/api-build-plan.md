---
title: Backend API Build Plan
version: 2.0
status: Approved
owner: Backend Lead
---

# API BUILD PLAN — Kế hoạch Thi công Giao diện & Hợp đồng API Backend

## 1. Approach Decisions (Quyết định Phương pháp Thi công API)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-008` | Chiến lược Thi công Hợp đồng API & STOMP Broker | Triển khai theo quy trình Contract-First: Lập trình Java Record DTOs & Jakarta Validation Rules $\rightarrow$ Lập trình Kiosk REST Controller $\rightarrow$ Lập trình Portal REST Controllers $\rightarrow$ Cấu hình STOMP Message Broker & Channel Interceptors. Định nghĩa hoàn thành (DoD): 100% endpoints được kiểm thử với MockMvc/RestAssured; phản hồi lỗi khớp chuẩn ProblemDetails RFC 7807; xử lý token header an toàn. | Lập trình Controller trực tiếp dùng JPA Entities làm input/output (bị loại vì rủi ro lộ schema CSDL và khó kiểm soát validation). | Phải duy trì lớp Java Record DTOs độc lập kèm mapper; phân tách triệt để Presentation Layer khỏi Data Entity; kiểm soát 100% dữ liệu vào/ra. | `ARC-002`, `STK-011` | Accepted |

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công API)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-BE-005` | Lập trình DTOs & Validation Rules | Định nghĩa các Java Record DTOs kèm Jakarta Validation annotations (`@NotNull`, `@Size`, `@Pattern`) và bộ bọc lỗi ProblemDetails RFC 7807. | `APD-BE-001`, `APD-BE-002`, `APD-BE-004` | `FND-BE-002` | Dữ liệu không hợp lệ tự động trả về lỗi 400 Bad Request kèm chi tiết `invalidParams`; mapping đúng các Java Records. | Done |
| `BLD-BE-006` | Lập trình Kiosk REST Controller | Xây dựng `KioskAttendanceController` tiếp nhận punch, sync-batch, gallery, verify-otp và enroll-face với header `X-Kiosk-Id`. | `APD-BE-001`, `APD-BE-006` | `BLD-BE-005` | Kết nối thành công với Kiosk; xử lý phản hồi trong $\le 100\text{ ms}$; thẩm định header `X-Kiosk-Id` và Secret Token chính xác. | Planned |
| `BLD-BE-007` | Lập trình Portal REST Controllers | Xây dựng `AuthController`, `AttendanceAdminController`, `AttendanceEmployeeController` và `ConsentController` cho Cổng Web Portal. | `APD-BE-002` | `BLD-BE-005` | Người dùng Web thực hiện được toàn bộ luồng đăng nhập, làm mới token, ký cam kết, tra cứu điểm danh và xem danh sách nhân sự. | Planned |
| `BLD-BE-008` | Lập trình STOMP Message Broker & Interceptors | Cấu hình WebSocket channel interceptor, topic destination prefix `/topic`, endpoint `/ws-attendance` và cơ chế xác thực kết nối. | `APD-BE-003`, `APD-BE-005` | `FND-BE-005` | Client Web và Kiosk nhận được bản tin cập nhật tức thời qua các topic `/topic/live-attendance`, `/topic/kiosk-gallery`, `/topic/enrollment/{otp}`. | Planned |
| `BLD-BE-021` | Lập trình Admin Employee REST Controller | Xây dựng `AdminEmployeeController` cho `POST /api/v1/admin/employees`, `PATCH /api/v1/admin/employees/{id}` và `PATCH /api/v1/admin/employees/{id}/status` theo hợp đồng Mục 4.12. | `APD-BE-007`, `APD-BE-008`, `APD-BE-009` | `BLD-BE-005` | Ba endpoint trả đúng mã trạng thái (201/200) và mã lỗi (409/403/400); phân quyền `HR_MANAGER`/`ADMIN` chính xác; mọi thay đổi sinh audit log. | Planned |
| `BLD-BE-022` | Lập trình Auth Change-Password & PIN Controllers | Xây dựng `AuthController.changePassword`, `EmployeePinController` (`/api/v1/employee/pin`) và `KioskPinController` (`/api/v1/kiosk/verify-pin`) kèm hai mã lỗi mới. | `APD-BE-010`, `APD-BE-011`, `APD-BE-012` | `BLD-BE-005` | Đổi mật khẩu trả HTTP 200 và thu hồi mọi phiên cũ; thiết lập/đổi PIN trả `hasPin`; `verify-pin` trả 200/401/423 đúng hợp đồng và Kiosk không ghi điểm danh khi thất bại. | Planned |
| `BLD-BE-027` | Lập trình Shift & Assignment REST Controllers | Xây dựng `ShiftController` (`/api/v1/admin/shifts`) và `EmployeeShiftController` (`/api/v1/admin/employee-shifts`) theo hợp đồng `APD-BE-013`/`APD-BE-014`. | `APD-BE-013`, `APD-BE-014` | `BLD-BE-005` | Ba nhóm endpoint trả đúng 201/200/204 và mã lỗi 400/409; phân quyền `HR_MANAGER`/`ADMIN` chính xác; tra cứu lịch phân ca theo nhân viên và khoảng ngày hoạt động đúng. | Planned |
| `BLD-BE-028` | Lập trình Excuse Request REST Controllers | Xây dựng `EmployeeExcuseController` (`/api/v1/employee/excuse-requests`) và `AdminExcuseController` (`/api/v1/admin/excuse-requests`) theo hợp đồng `APD-BE-015`/`APD-BE-016`. | `APD-BE-015`, `APD-BE-016` | `BLD-BE-005` | Nhân viên chỉ nộp và xem được đơn của mình (404 nếu bản ghi không thuộc người gửi); HR duyệt/từ chối trả 200 và đơn đã xử lý trả 409; từ chối thiếu lý do trả 400. | Planned |
| `BLD-BE-029` | Lập trình Compliance, Kiosk Admin & Export Controllers | Xây dựng `AuditLogController` (`/api/v1/admin/audit-logs`), `DpoComplianceController` (`/api/v1/dpo/**`), `KioskAdminController` (`/api/v1/admin/kiosks`) và `ReportExportController` (`/api/v1/admin/reports/export`). | `APD-BE-017`, `APD-BE-018`, `APD-BE-019` | `BLD-BE-005` | Tra cứu audit/Consent chỉ đọc với đúng phân quyền `ADMIN`/`DPO`; đăng ký/đổi token trạm trả token một lần; file `.xlsx` escape ký tự `=`, `+`, `-`, `@` và kết xuất 1,000 nhân sự trong $\le 3\text{ giây}$. | Planned |
| `BLD-BE-034` | Lập trình Controllers cho Khôi phục, Phiên, Kỳ công, Consent, Quyền & Thông báo | Xây dựng `CredentialRecoveryController`, `LogoutController`, `PayrollPeriodController`, `ConsentWithdrawalController`, `DataSubjectRequestController`, `RoleManagementController` và `NotificationController`. | `APD-BE-020`, `APD-BE-021`, `APD-BE-022`, `APD-BE-023`, `APD-BE-024`, `APD-BE-025`, `APD-BE-026` | `BLD-BE-005` | Các endpoint trả đúng 200/201/204 và mã lỗi 400/401/403/409 theo hợp đồng; phân quyền `ADMIN`/`HR_MANAGER`/`DPO`/`EMPLOYEE` chính xác; thông báo và lịch sử công chỉ trả dữ liệu của người gọi. | Planned |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Tài liệu hóa Tự động qua SpringDoc OpenAPI**: Định nghĩa API và cấu trúc DTO được tự động xuất bản tại `/swagger-ui.html` và `/v3/api-docs` trong môi trường phát triển; cấu hình production sẽ khóa endpoint này để bảo vệ bí mật hệ thống.
* **Tự động Hóa Kiểm chuẩn Jakarta Validation**: Mọi tham số đầu vào của Request Body được xác thực tự động bởi `MethodArgumentNotValidException` của Hibernate Validator trước khi Controller chuyển quyền điều khiển cho Service Layer.
* **Trạng thái Thực thi Thực tế**: `Status` của các hạng mục `BLD-BE-` được đối chiếu lại với mã nguồn tại `app/backend-service`; hiện chỉ `BLD-BE-005` (DTOs, Validation & ProblemDetails) hoàn tất, các hạng mục Controller và STOMP Interceptor còn lại đang ở trạng thái `Planned`.
* **Ràng buộc Xác thực Trạm Kiosk**: `SecurityConfig` hiện `permitAll` cho toàn bộ tiền tố `/api/v1/kiosk/**` để phục vụ giai đoạn dựng khung. `TASK-BE-019` và `TASK-BE-021` bắt buộc siết xác thực `X-Kiosk-Id` + Secret Token tại tầng Security Filter (`API-BE-015`, `DD-BE-010`) trước khi các endpoint Kiosk được đưa vào hoạt động.

