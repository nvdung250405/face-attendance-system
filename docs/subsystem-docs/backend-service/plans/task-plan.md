---
title: Backend Task Plan
version: 2.0
status: Approved
owner: Backend Lead
type: plan
scope: BE
updated: 2026-10-08
---

# TASK PLAN — Kế hoạch Thi công Chi tiết Phân hệ Backend

## 1. Approach (Chiến lược Thực hiện)

Tài liệu này là lớp kế hoạch thi công (Execution Planning) giữa các đơn vị quy hoạch (`BLD-`, `FND-`) và giai đoạn viết mã (BUILD), tuân thủ chặt chẽ Mục 9.4.1 của [docs/sdlc-docs.md](../../../sdlc-docs.md).
* **Nguyên tắc phân rã**: Mỗi `TASK-` là một đơn vị thi công thực tế có thể hoàn thành trọn vẹn trong một Pull Request. Mỗi task bắt buộc `Derived from` đúng một `BLD-` hoặc `FND-` cùng service.
* **Giải quyết phụ thuộc**: Phụ thuộc xuyên facet (cross-facet dependency) được giải quyết duy nhất tại đây thông qua quan hệ `Depends on` giữa các `TASK-`.
* **Cơ chế Wave**: Wave là hình chiếu gom nhóm các task độc lập có thể triển khai song song theo đồ thị phụ thuộc (DAG) và tuân thủ quy tắc tại Mục 14.4 của `sdlc-docs.md`: `Wave(task)` phải **lớn hơn** wave của mọi task mà nó `Depends on`. Người thực thi nhận nhiệm vụ theo `TASK-`, không nhận theo Wave.

### Approach Decisions (Quyết định Tiếp cận Thi công Chi tiết)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-009` | Chiến lược Thực thi theo Wave & Quản lý Phụ thuộc Đồ thị DAG | Phân rã toàn bộ 40 hạng mục thi công `FND-` và `BLD-` của Backend thành 40 `TASK-` độc lập, giải quyết phụ thuộc xuyên facet qua đồ thị DAG 11 Wave từ Foundation đến Service Integration. | Triển khai theo mô hình Big-bang integration hoặc phân công tự do không theo thứ tự DAG (bị loại vì nguy cơ nghẽn luồng và khó cô lập lỗi). | Mọi dependency xuyên facet bắt buộc phải giải quyết tại Task Plan; các task trong cùng một Wave có thể triển khai song song độc lập; mỗi task có tiêu chí `Done when` rõ ràng. | `ARC-002`, `STK-011` | Accepted |

---

## 2. Tasks (Danh mục Nhiệm vụ Thi công)

| ID | Name | Description | Derived from | Depends on | Wave | Done when | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| `TASK-BE-001` | Cấu hình Java 21 Toolchain & Maven Wrapper | Khởi tạo file `pom.xml` với Java 21, Spring Boot Starter Parent và bộ plugin Maven compiler. | `FND-BE-001` | — | Wave 1 | Lệnh `./mvnw clean compile` thành công với zero warning; nhận diện đúng Java 21. | Done |
| `TASK-BE-002` | Khởi tạo Khung Dự án Spring Boot & Starters | Khai báo các starter cốt lõi: Web, Security, Data JPA, Validation, WebSocket, Actuator, Flyway. | `FND-BE-002` | `TASK-BE-001` | Wave 2 | Ứng dụng khởi động được ở profile `local` mà không ném lỗi bean wiring. | Done |
| `TASK-BE-003` | Cấu hình DataSource PostgreSQL & Flyway | Thiết lập kết nối CSDL qua `application.yml` và kích hoạt tự động quét thư mục `db/migration`. | `FND-BE-003` | `TASK-BE-002` | Wave 3 | Khởi tạo bảng `flyway_schema_history` thành công; kết nối PostgreSQL thông suốt. | Done |
| `TASK-BE-004` | Cấu hình Spring Security Stateless & JWT Base | Thiết lập `SecurityFilterChain` không trạng thái (Stateless), chuẩn bị các bean mã hóa mật khẩu. | `FND-BE-004` | `TASK-BE-002` | Wave 3 | Endpoint public truy cập được; endpoint bảo vệ trả về HTTP 401 khi thiếu xác thực. | Done |
| `TASK-BE-005` | Cấu hình WebSocket STOMP Endpoint | Thiết lập endpoint `/ws-attendance` hỗ trợ SockJS fallback và Message Broker giản đơn cho prefix `/topic`. | `FND-BE-005` | `TASK-BE-002` | Wave 3 | Client kết nối bắt tay STOMP thành công; gửi nhận ping frame ổn định. | Done |
| `TASK-BE-006` | Viết Kịch bản Migration Flyway V1 8 Bảng CSDL | Viết file `V1__init_schema.sql` khởi tạo đủ 8 bảng CSDL, khóa ngoại tham chiếu và toàn bộ chỉ mục B-tree. | `BLD-BE-001` | `TASK-BE-003` | Wave 4 | Flyway chạy thành công trên PostgreSQL 16 Testcontainers; tạo lập 8 bảng đúng lược đồ 3NF. | Done |
| `TASK-BE-007` | Lập trình 8 JPA Entities & Enums Nghiệp vụ | Khai báo 8 Java Entity classes ánh xạ chính xác lược đồ CSDL kèm các Enum (`Role`, `AttendanceStatus`...). | `BLD-BE-002` | `TASK-BE-006` | Wave 5 | Entity mapping vượt qua kiểm thử Hibernate Schema Validation không có cảnh báo. | Done |
| `TASK-BE-008` | Lập trình Spring Data JPA Repositories | Khởi tạo 8 Spring Data Repositories kèm các truy vấn tối ưu và derived query methods. | `BLD-BE-003` | `TASK-BE-007` | Wave 6 | Toàn bộ các thao tác CRUD và truy vấn điểm danh, tìm kiếm nhân sự thực thi chính xác. | Done |
| `TASK-BE-009` | Cấu hình Caffeine Cache Cooldown Manager | Cài đặt Spring Cache với Caffeine, cấu hình TTL 120s cho key `cooldown:punch:{userId}:{date}`. | `BLD-BE-004` | `TASK-BE-002` | Wave 3 | Lượt quẹt liên tiếp trong 120s được chặn tức thời từ RAM không cần truy vấn CSDL. | Done |
| `TASK-BE-010` | Lập trình DTOs, Validation & ProblemDetails | Khai báo Java Record DTOs kèm Jakarta Validation annotations và bộ bọc lỗi RFC 7807 ProblemDetails. | `BLD-BE-005` | `TASK-BE-002` | Wave 3 | Request không hợp lệ tự động trả về lỗi 400 Bad Request kèm chi tiết `invalidParams`. | Done |
| `TASK-BE-011` | Lập trình JwtTokenProvider & Security Filter | Xây dựng bộ sinh/thẩm định JWT token, `JwtAuthenticationFilter` chặn request và trích xuất Roles RBAC. | `BLD-BE-009` | `TASK-BE-004`, `TASK-BE-008` | Wave 7 | Cấp phát token hợp lệ khi login; từ chối token hết hạn; phân quyền URL chính xác. | Done |
| `TASK-BE-012` | Lập trình Dịch vụ Mã hóa AES-256-GCM | Xây dựng `BiometricCryptoService` mã hóa/giải mã vector ArcFace 512D với IV ngẫu nhiên 12-byte. | `BLD-BE-010` | `TASK-BE-001` | Wave 2 | Mã hóa và giải mã bảo toàn 100% dữ liệu gốc vector; không lưu plaintext trên đĩa. | Done |
| `TASK-BE-013` | Lập trình Động cơ Điểm danh & Cooldown 120s | Xây dựng `AttendanceService` đối chiếu ca kíp, tính số phút trễ/về sớm và tích hợp Cooldown Cache 120s. | `BLD-BE-011` | `TASK-BE-008`, `TASK-BE-009`, `TASK-BE-011` | Wave 8 | Xử lý điểm danh hoàn tất trong $\le 100\text{ ms}$; phân loại trạng thái điểm danh chuẩn xác. | Done |
| `TASK-BE-014` | Lập trình Xử lý Gói lô Điểm danh Ngoại tuyến | Xây dựng dịch vụ tiếp nhận mảng 50 bản ghi điểm danh ngoại tuyến, batch insert có bắt trùng lặp khóa. | `BLD-BE-012` | `TASK-BE-013` | Wave 9 | Gói 50 bản ghi lưu thành công 100%; bỏ qua bản ghi trùng và trả về danh sách ID thành công. | Ready |
| `TASK-BE-015` | Lập trình Luồng Quản lý Đăng ký & OTP 48h | Xây dựng logic kiểm tra Informed Consent, sinh mã OTP 6 số ngẫu nhiên có hạn 48h và kích hoạt khuôn mặt. | `BLD-BE-013` | `TASK-BE-008`, `TASK-BE-012` | Wave 7 | Chỉ sinh OTP khi có cam kết; từ chối khi OTP sai/hết hạn; nạp vector hợp lệ kích hoạt `ACTIVE`. | Done |
| `TASK-BE-016` | Tích hợp Dịch vụ Phát sóng STOMP | Tích hợp `SimpMessagingTemplate` bắn tin lên `/topic/live-attendance` và `/topic/kiosk-gallery`. | `BLD-BE-014` | `TASK-BE-005` | Wave 4 | Kiosk và Web Portal nhận được JSON payload ngay khi Backend xử lý xong trong $\le 50\text{ ms}$. | Done |
| `TASK-BE-017` | Lập trình Aspect Ghi vết Kiểm toán Bất biến | Xây dựng Spring AOP Aspect ghi log các thao tác chỉnh sửa dữ liệu người dùng vào bảng `audit_logs`. | `BLD-BE-015` | `TASK-BE-008`, `TASK-BE-011` | Wave 8 | Mọi thao tác sửa giờ công hoặc nhân viên đều tự động có bản ghi audit chi tiết ngữ cảnh người sửa. | Ready |
| `TASK-BE-018` | Lập trình Tác vụ Tiêu hủy Dữ liệu 20 Ngày | Xây dựng Spring `@Scheduled` cron job 01:00 hàng ngày xóa cứng vector nhân viên thôi việc quá 20 ngày. | `BLD-BE-017` | `TASK-BE-008` | Wave 7 | Tự động xóa sạch vector sinh trắc học nhân viên thôi việc quá 20 ngày; bảo toàn audit log. | Done |
| `TASK-BE-019` | Lập trình Kiosk REST Controller | Xây dựng `KioskAttendanceController` tiếp nhận punch, sync-batch, gallery, verify-otp, enroll-face. | `BLD-BE-006` | `TASK-BE-010`, `TASK-BE-013`, `TASK-BE-014`, `TASK-BE-015` | Wave 10 | Tiếp nhận và phản hồi Kiosk trong $\le 100\text{ ms}$; thẩm định header `X-Kiosk-Id` chính xác. | Ready |
| `TASK-BE-020` | Lập trình Web Portal REST Controllers | Xây dựng `AuthController`, `AttendanceAdminController`, `AttendanceEmployeeController`, `ConsentController`. | `BLD-BE-007` | `TASK-BE-010`, `TASK-BE-011`, `TASK-BE-013` | Wave 9 | Người dùng Web thực hiện được toàn bộ luồng đăng nhập, xem lịch sử, ký cam kết và quản lý. | Ready |
| `TASK-BE-021` | Lập trình WebSocket Channel Interceptor & Auth | Cấu hình Interceptor chặn frame `CONNECT` và `SUBSCRIBE` để thẩm định token JWT/Kiosk Secret. | `BLD-BE-008` | `TASK-BE-005`, `TASK-BE-011`, `TASK-BE-016` | Wave 8 | Từ chối kết nối WebSocket khi thiếu token; cho phép client hợp lệ subscribe đúng kênh. | Ready |
| `TASK-BE-022` | Tích hợp Toàn trình Luồng Điểm danh & STOMP | Ghép nối luồng tiếp nhận punch từ Kiosk qua REST API, kiểm tra cooldown, lưu DB và phát sóng STOMP. | `BLD-BE-016` | `TASK-BE-019`, `TASK-BE-020`, `TASK-BE-021` | Wave 11 | Toàn trình từ Kiosk gửi punch đến Web Portal nhận sự kiện điểm danh hoàn tất trong $\le 100\text{ ms}$. | Ready |
| `TASK-BE-023` | Lập trình Migration V2 & Ánh xạ Trạng thái Xác thực | Viết `V2__add_credential_lifecycle.sql` bổ sung cột `must_change_password`, cập nhật entity `User` và repository tương ứng (cột này đã được gỡ ở `TASK-BE-040` theo CR rút yêu cầu buộc đổi mật khẩu). | `BLD-BE-018` | `TASK-BE-007` | Wave 6 | Migration V2 chạy thành công trên CSDL đang có dữ liệu mà không mất bản ghi; trạng thái xác thực (mật khẩu băm, PIN băm, mốc khóa PIN) ánh xạ đúng và test ràng buộc dữ liệu đạt. | Done |
| `TASK-BE-024` | Lập trình Dịch vụ Tài khoản | Xây dựng `AccountManagementService` (tạo hồ sơ kèm mật khẩu tạm dùng một lần, cập nhật hồ sơ, vô hiệu hóa nhân sự) và endpoint đổi mật khẩu tự nguyện. | `BLD-BE-019` | `TASK-BE-023`, `TASK-BE-011` | Wave 8 | Tạo hồ sơ trả mật khẩu tạm đúng một lần; tài khoản dùng mật khẩu tạm không bị chặn nghiệp vụ; vô hiệu hóa nhân sự đặt `terminated_date` và ghi audit. | Ready |
| `TASK-BE-025` | Lập trình Dịch vụ Mã PIN & Thẩm định PIN | Xây dựng `PinService` (thiết lập/đổi mã PIN 6 số, băm một chiều) và luồng thẩm định PIN cho trạm Kiosk kèm khóa 15 phút. | `BLD-BE-020` | `TASK-BE-023` | Wave 7 | PIN đúng trả về định danh nhân viên; PIN sai trả 401 `PIN_INVALID`; sai 5 lần liên tiếp trả 423 `PIN_LOCKED`; không tạo bản ghi điểm danh khi thẩm định thất bại. | Done |
| `TASK-BE-026` | Lập trình Admin Employee REST Controller | Xây dựng `AdminEmployeeController` cho ba endpoint tạo/cập nhật/vô hiệu hóa nhân sự theo hợp đồng Mục 4.12 của API Design. | `BLD-BE-021` | `TASK-BE-024`, `TASK-BE-010` | Wave 9 | Ba endpoint trả đúng mã 201/200 và mã lỗi 409/403/400; phân quyền `HR_MANAGER`/`ADMIN` chính xác; mọi thay đổi sinh audit log. | Ready |
| `TASK-BE-027` | Lập trình Auth Change-Password & PIN Controllers | Xây dựng `AuthController.changePassword`, `EmployeePinController` và `KioskPinController` (`/api/v1/kiosk/verify-pin`) kèm ba mã lỗi mới. | `BLD-BE-022` | `TASK-BE-024`, `TASK-BE-025`, `TASK-BE-010` | Wave 9 | Đổi mật khẩu thành công thu hồi mọi phiên cũ; thiết lập/đổi PIN trả `hasPin`; `verify-pin` trả 200/401/423 đúng hợp đồng; Kiosk không ghi điểm danh khi thẩm định thất bại. | Ready |
| `TASK-BE-028` | Lập trình Migration V3, Bảng Đơn Giải trình & Chỉ mục Tra cứu | Viết `V3__add_excuse_requests_and_kiosk_lifecycle.sql` (bảng `excuse_requests`, chỉ mục phân ca, chỉ mục audit/Consent, chỉ mục trạng thái trạm) và cập nhật entity/repository tương ứng. | `BLD-BE-023` | `TASK-BE-007` | Wave 6 | Migration V3 chạy thành công trên CSDL đã có `V1`/`V2` mà không mất bản ghi; bảng và chỉ mục đúng lược đồ; không có cột lưu Secret Token dạng văn bản rõ. | Done |
| `TASK-BE-029` | Lập trình Dịch vụ Quản lý Ca kíp & Phân ca | Xây dựng `ShiftManagementService` (CRUD ca, phân/gỡ phân ca, kiểm tra chồng lấn có khóa theo nhân viên) và tích hợp tra cứu ca hiệu lực vào động cơ điểm danh. | `BLD-BE-024` | `TASK-BE-028`, `TASK-BE-008` | Wave 7 | Phân ca chồng khoảng trả 409 và không ghi bản ghi; vô hiệu hóa ca đang được phân trả 409; động cơ điểm danh tính `late_minutes` theo ca hiệu lực và trả `ANOMALOUS` khi chưa phân ca. | Done |
| `TASK-BE-030` | Lập trình Dịch vụ Xử lý Đơn Giải trình Công | Xây dựng `ExcuseRequestService`: nộp đơn cho bản ghi của chính mình (30 ngày gần nhất), HR duyệt/từ chối và điều chỉnh `attendance_logs` trong cùng giao dịch kèm audit. | `BLD-BE-025` | `TASK-BE-028`, `TASK-BE-008` | Wave 7 | Đơn khởi tạo `PENDING`; duyệt đơn cập nhật đúng bản ghi công và sinh đúng một bản ghi audit giá trị trước/sau; từ chối bắt buộc có lý do; đơn đã xử lý trả 409. | Done |
| `TASK-BE-031` | Lập trình Dịch vụ Tra cứu Tuân thủ & Quản lý Trạm Kiosk | Xây dựng `AuditQueryService` (truy vấn chỉ đọc `audit_logs`, Consent, lịch trình tiêu hủy) và `KioskAdminService` (đăng ký trạm, sinh/đổi token băm một chiều, vô hiệu hóa, cập nhật `last_ping_at`). | `BLD-BE-026` | `TASK-BE-008`, `TASK-BE-011` | Wave 8 | Tra cứu audit/Consent chỉ đọc, role `DPO` nhận 403 ở mọi endpoint ghi; Secret Token chỉ trả về một lần và token cũ vô hiệu hóa ngay; trạm `INACTIVE` bị từ chối xác thực. | Ready |
| `TASK-BE-032` | Lập trình Shift & Assignment REST Controllers | Xây dựng `ShiftController` và `EmployeeShiftController` theo hợp đồng `APD-BE-013`/`APD-BE-014`. | `BLD-BE-027` | `TASK-BE-029`, `TASK-BE-010` | Wave 8 | Ba nhóm endpoint trả đúng 201/200/204 và mã lỗi 400/409; phân quyền `HR_MANAGER`/`ADMIN` chính xác; tra cứu lịch phân ca theo nhân viên và khoảng ngày hoạt động đúng. | Ready |
| `TASK-BE-033` | Lập trình Excuse Request REST Controllers | Xây dựng `EmployeeExcuseController` và `AdminExcuseController` theo hợp đồng `APD-BE-015`/`APD-BE-016`. | `BLD-BE-028` | `TASK-BE-030`, `TASK-BE-010` | Wave 8 | Nhân viên chỉ nộp/xem được đơn của mình (404 nếu bản ghi không thuộc người gửi); HR duyệt/từ chối trả 200; từ chối thiếu lý do trả 400; đơn đã xử lý trả 409. | Ready |
| `TASK-BE-034` | Lập trình Compliance, Kiosk Admin & Export Controllers | Xây dựng `AuditLogController`, `DpoComplianceController`, `KioskAdminController` và `ReportExportController`. | `BLD-BE-029` | `TASK-BE-031`, `TASK-BE-010` | Wave 9 | Tra cứu audit/Consent đúng phân quyền `ADMIN`/`DPO`; đăng ký/đổi token trạm trả token đúng một lần; file `.xlsx` escape ký tự `=`, `+`, `-`, `@` và kết xuất 1,000 nhân sự trong $\le 3\text{ giây}$. | Ready |
| `TASK-BE-035` | Lập trình Migration V4 cho Thực thể Vòng đời | Viết `V4__add_lifecycle_entities.sql` (kỳ công, phiên làm việc, thông báo, vết rút Consent, yêu cầu dữ liệu cá nhân) kèm chỉ mục/ràng buộc và cập nhật entity/repository tương ứng. | `BLD-BE-030` | `TASK-BE-007` | Wave 6 | Migration V4 chạy trên CSDL đã áp dụng `V1`–`V3` mà không mất bản ghi; 5 bảng và toàn bộ chỉ mục đúng lược đồ; chèn trùng kỳ công theo tháng/năm bị từ chối. | Done |
| `TASK-BE-036` | Lập trình Bootstrap, Khôi phục Thông tin Xác thực & Quản lý Phiên | Xây dựng `BootstrapInitializer`, `CredentialRecoveryService` và `SessionService`. | `BLD-BE-031` | `TASK-BE-035`, `TASK-BE-011`, `TASK-BE-024` | Wave 9 | Bootstrap idempotent tạo đúng một ADMIN dùng được ngay bằng mật khẩu tạm; cấp lại mật khẩu thu hồi mọi phiên cũ; refresh token đã thu hồi trả 401. | Ready |
| `TASK-BE-037` | Lập trình Chốt Kỳ công, Rút Consent & Thông báo | Xây dựng `PayrollPeriodService`, `ConsentWithdrawalService`, `DataSubjectRequestService` và `NotificationService`. | `BLD-BE-032` | `TASK-BE-035`, `TASK-BE-030` | Wave 8 | Điều chỉnh công/đơn thuộc kỳ `LOCKED` trả 409; nhân sự rút Consent bị loại khỏi gallery và không sinh được OTP; thông báo sinh đúng người nhận theo sự kiện. | Ready |
| `TASK-BE-038` | Lập trình Vòng đời Quyền & Tra cứu Tự phục vụ | Xây dựng `RoleManagementService` và `EmployeeAttendanceQueryService`. | `BLD-BE-033` | `TASK-BE-011`, `TASK-BE-008` | Wave 8 | Thay đổi role ghi audit giá trị trước/sau; thu hồi ADMIN cuối cùng trả 409 kể cả khi hai yêu cầu đồng thời; nhân viên chỉ truy vấn được dữ liệu của mình. | Ready |
| `TASK-BE-039` | Lập trình Controllers Vòng đời | Xây dựng `CredentialRecoveryController`, `LogoutController`, `PayrollPeriodController`, `ConsentWithdrawalController`, `DataSubjectRequestController`, `RoleManagementController` và `NotificationController`. | `BLD-BE-034` | `TASK-BE-036`, `TASK-BE-037`, `TASK-BE-038`, `TASK-BE-010` | Wave 10 | Các endpoint trả đúng mã theo hợp đồng; phân quyền `ADMIN`/`HR_MANAGER`/`DPO`/`EMPLOYEE` chính xác; thông báo và lịch sử công chỉ trả dữ liệu của người gọi. | Ready |
| `TASK-BE-040` | Lập trình Migration V5 Gỡ bỏ Cờ Buộc đổi Mật khẩu | Viết `V5__drop_must_change_password.sql` gỡ cột khỏi bảng `users`, gỡ trường `mustChangePassword` khỏi entity `User` và cập nhật ca kiểm thử trạng thái xác thực. | `BLD-BE-035` | `TASK-BE-023` | Wave 7 | Migration V5 chạy thành công trên CSDL đã áp dụng `V1`–`V4` mà không mất bản ghi; lược đồ sau cùng không còn cột `must_change_password`; test khẳng định cột đã bị gỡ và dữ liệu xác thực còn nguyên. | Done |

---

## 3. Dependency Structure (Cấu trúc Phụ thuộc)

Đồ thị phụ thuộc (DAG) giữa các task thi công, giải quyết trọn vẹn mọi quan hệ phụ thuộc xuyên facet:

```text
[Foundation Layer]
TASK-BE-001 (Toolchain)
    ├── TASK-BE-002 (Spring Boot Skeleton)
    │       ├── TASK-BE-003 (DataSource/Flyway) ──→ TASK-BE-006 (DDL 8 Bảng) ──→ TASK-BE-007 (Entities)
    │       │                                                                        ├── TASK-BE-008 (Repositories)
    │       │                                                                        ├── TASK-BE-023 (Migration V2 Credential State)
    │       │                                                                        ├── TASK-BE-028 (Migration V3 Excuse/Kiosk/Indexes)
    │       │                                                                        └── TASK-BE-035 (Migration V4 Lifecycle Entities)
    │       ├── TASK-BE-004 (Security Base)     ──→ TASK-BE-011 (JWT Auth Filter)
    │       ├── TASK-BE-005 (STOMP Config)      ──→ TASK-BE-016 (Broadcaster) ──→ TASK-BE-021 (WS Interceptor)
    │       ├── TASK-BE-009 (Cache Cooldown)    ──→ TASK-BE-013 (Attendance Engine)
    │       └── TASK-BE-010 (DTOs & Validation) ──→ TASK-BE-019, TASK-BE-020, TASK-BE-026, TASK-BE-027
    └── TASK-BE-012 (AES Crypto)                ──→ TASK-BE-015 (OTP Lifecycle)

[Business Layer]
TASK-BE-013 (Attendance Engine)  ──→ TASK-BE-014 (Batch Sync)
TASK-BE-008 + TASK-BE-011        ──→ TASK-BE-017 (Audit Aspect)
TASK-BE-008                      ──→ TASK-BE-018 (Cleanup Cron Job)
TASK-BE-023 (Credential Schema)  ──→ TASK-BE-024 (Account & Password Lifecycle)
                                 └──→ TASK-BE-025 (PIN Service & Verification)
TASK-BE-024 + TASK-BE-010        ──→ TASK-BE-026 (Admin Employee Controller)
TASK-BE-024 + TASK-BE-025 + TASK-BE-010 ──→ TASK-BE-027 (Change-Password & PIN Controllers)
TASK-BE-028 (V3 Schema) + TASK-BE-008 ──→ TASK-BE-029 (Shift & Assignment Service)
TASK-BE-023 (V2 Schema)            ──→ TASK-BE-040 (V5 Schema Cleanup: gỡ cờ buộc đổi mật khẩu)
TASK-BE-028 + TASK-BE-008        ──→ TASK-BE-030 (Excuse Request Service)
TASK-BE-008 + TASK-BE-011        ──→ TASK-BE-031 (Compliance Query & Kiosk Admin Services)
TASK-BE-029 + TASK-BE-010        ──→ TASK-BE-032 (Shift & Assignment Controllers)
TASK-BE-030 + TASK-BE-010        ──→ TASK-BE-033 (Excuse Request Controllers)
TASK-BE-031 + TASK-BE-010        ──→ TASK-BE-034 (Compliance, Kiosk Admin & Export Controllers)
TASK-BE-035 (V4 Schema) + TASK-BE-011 + TASK-BE-024 ──→ TASK-BE-036 (Bootstrap, Credential Recovery & Session Services)
TASK-BE-035 + TASK-BE-030        ──→ TASK-BE-037 (Payroll Lock, Consent & Notification Services)
TASK-BE-011 + TASK-BE-008        ──→ TASK-BE-038 (Role Governance & Self-service Query Services)
TASK-BE-036 + TASK-BE-037 + TASK-BE-038 + TASK-BE-010 ──→ TASK-BE-039 (Lifecycle Controllers)

[Integration Layer]
TASK-BE-019 + TASK-BE-020 + TASK-BE-021 ──→ TASK-BE-022 (Full Integration) ──→ BUILD
```

---

## 4. Execution Waves (Các Lớp Thực thi Song song)

Wave được tính theo quy tắc Mục 14.4: `Wave(task) = 1 + max(Wave(dep))`, nên mọi task trong cùng một Wave là độc lập và có thể triển khai song song.

* **Wave 1: Foundation Toolchain**: `TASK-BE-001`.
* **Wave 2: Project Skeleton & Crypto Base**: `TASK-BE-002`, `TASK-BE-012`.
* **Wave 3: DataSource, Security Base, Cache & API Contracts**: `TASK-BE-003`, `TASK-BE-004`, `TASK-BE-005`, `TASK-BE-009`, `TASK-BE-010`.
* **Wave 4: DDL Baseline & STOMP Broadcaster**: `TASK-BE-006`, `TASK-BE-016`.
* **Wave 5: JPA Entities**: `TASK-BE-007`.
* **Wave 6: Repositories & Database Schema Migrations**: `TASK-BE-008`, `TASK-BE-023`, `TASK-BE-028`, `TASK-BE-035`.
* **Wave 7: JWT Filter, OTP Lifecycle, Audit Aspect, PIN & Domain Services**: `TASK-BE-011`, `TASK-BE-015`, `TASK-BE-018`, `TASK-BE-025`, `TASK-BE-029`, `TASK-BE-030`, `TASK-BE-040`.
* **Wave 8: Attendance Engine, Domain Services & Controllers**: `TASK-BE-013`, `TASK-BE-017`, `TASK-BE-021`, `TASK-BE-024`, `TASK-BE-031`, `TASK-BE-032`, `TASK-BE-033`, `TASK-BE-037`, `TASK-BE-038`.
* **Wave 9: Batch Sync, Portal, Compliance & Lifecycle Services**: `TASK-BE-014`, `TASK-BE-020`, `TASK-BE-026`, `TASK-BE-027`, `TASK-BE-034`, `TASK-BE-036`.
* **Wave 10: Kiosk REST & Lifecycle Controllers**: `TASK-BE-019`, `TASK-BE-039`.
* **Wave 11: Service Integration**: `TASK-BE-022`.

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Tính Độc lập của Pull Request theo Task**: Mỗi `TASK-BE-` được thi công trên một Git branch riêng biệt và tích hợp qua Pull Request sau khi vượt qua toàn bộ unit test và linting cục bộ; các task trong cùng một Wave không có phụ thuộc lẫn nhau và có thể phân bổ cho nhiều kỹ sư phát triển song song.
* **Môi trường Cơ sở Dữ liệu Phục vụ Thi công**: Từ Wave 4 trở đi (`TASK-BE-006`), quá trình chạy thử nghiệm và kiểm thử tích hợp yêu cầu container PostgreSQL 16 khả dụng (thông qua Testcontainers hoặc Docker Compose cục bộ).
* **Hiệu chỉnh Wave theo Mục 14.4**: Wave của toàn bộ task đã được tính lại theo công thức `1 + max(Wave(dep))` để tuân thủ quy tắc `Wave(task) > Wave(dep)` của `sdlc-docs.md` Mục 14.4 (trước đây nhiều cặp task phụ thuộc nhau nằm cùng Wave). Việc gán lại Wave không thay đổi thứ tự thi công thực tế, chỉ làm rõ quan hệ song song.
