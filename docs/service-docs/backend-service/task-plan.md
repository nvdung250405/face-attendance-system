---
title: Backend Task Plan
version: 2.0
status: Approved
owner: Backend Lead
---

# TASK PLAN — Kế hoạch Thi công Chi tiết Phân hệ Backend

## 1. Approach (Chiến lược Thực hiện)

Tài liệu này là lớp kế hoạch thi công (Execution Planning) giữa các đơn vị quy hoạch (`BLD-`, `FND-`) và giai đoạn viết mã (BUILD), tuân thủ chặt chẽ Mục 9.4.1 của [docs/sdlc-docs.md](../../sdlc-docs.md).
* **Nguyên tắc phân rã**: Mỗi `TASK-` là một đơn vị thi công thực tế có thể hoàn thành trọn vẹn trong một Pull Request. Mỗi task bắt buộc `Derived from` đúng một `BLD-` hoặc `FND-` cùng service.
* **Giải quyết phụ thuộc**: Phụ thuộc xuyên facet (cross-facet dependency) được giải quyết duy nhất tại đây thông qua quan hệ `Depends on` giữa các `TASK-`.
* **Cơ chế Wave**: Wave là hình chiếu gom nhóm các task độc lập có thể triển khai song song theo đồ thị phụ thuộc (DAG) và tuân thủ quy tắc tại Mục 14.4 của `sdlc-docs.md`: `Wave(task)` phải **lớn hơn** wave của mọi task mà nó `Depends on`. Người thực thi nhận nhiệm vụ theo `TASK-`, không nhận theo Wave.

### Approach Decisions (Quyết định Tiếp cận Thi công Chi tiết)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-009` | Chiến lược Thực thi theo Wave & Quản lý Phụ thuộc Đồ thị DAG | Phân rã toàn bộ 22 hạng mục thi công `FND-` và `BLD-` của Backend thành 27 `TASK-` độc lập, giải quyết phụ thuộc xuyên facet qua đồ thị DAG 11 Wave từ Foundation đến Service Integration. | Triển khai theo mô hình Big-bang integration hoặc phân công tự do không theo thứ tự DAG (bị loại vì nguy cơ nghẽn luồng và khó cô lập lỗi). | Mọi dependency xuyên facet bắt buộc phải giải quyết tại Task Plan; các task trong cùng một Wave có thể triển khai song song độc lập; mỗi task có tiêu chí `Done when` rõ ràng. | `ARC-002`, `STK-011` | Accepted |

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
| `TASK-BE-012` | Lập trình Dịch vụ Mã hóa AES-256-GCM | Xây dựng `BiometricCryptoService` mã hóa/giải mã vector ArcFace 512D với IV ngẫu nhiên 12-byte. | `BLD-BE-010` | `TASK-BE-001` | Wave 2 | Mã hóa và giải mã bảo toàn 100% dữ liệu gốc vector; không lưu plaintext trên đĩa. | Ready |
| `TASK-BE-013` | Lập trình Động cơ Điểm danh & Cooldown 120s | Xây dựng `AttendanceService` đối chiếu ca kíp, tính số phút trễ/về sớm và tích hợp Cooldown Cache 120s. | `BLD-BE-011` | `TASK-BE-008`, `TASK-BE-009`, `TASK-BE-011` | Wave 8 | Xử lý điểm danh hoàn tất trong $\le 100\text{ ms}$; phân loại trạng thái điểm danh chuẩn xác. | Ready |
| `TASK-BE-014` | Lập trình Xử lý Gói lô Điểm danh Ngoại tuyến | Xây dựng dịch vụ tiếp nhận mảng 50 bản ghi điểm danh ngoại tuyến, batch insert có bắt trùng lặp khóa. | `BLD-BE-012` | `TASK-BE-013` | Wave 9 | Gói 50 bản ghi lưu thành công 100%; bỏ qua bản ghi trùng và trả về danh sách ID thành công. | Ready |
| `TASK-BE-015` | Lập trình Luồng Quản lý Đăng ký & OTP 48h | Xây dựng logic kiểm tra Informed Consent, sinh mã OTP 6 số ngẫu nhiên có hạn 48h và kích hoạt khuôn mặt. | `BLD-BE-013` | `TASK-BE-008`, `TASK-BE-012` | Wave 7 | Chỉ sinh OTP khi có cam kết; từ chối khi OTP sai/hết hạn; nạp vector hợp lệ kích hoạt `ACTIVE`. | Ready |
| `TASK-BE-016` | Tích hợp Dịch vụ Phát sóng STOMP | Tích hợp `SimpMessagingTemplate` bắn tin lên `/topic/live-attendance` và `/topic/kiosk-gallery`. | `BLD-BE-014` | `TASK-BE-005` | Wave 4 | Kiosk và Web Portal nhận được JSON payload ngay khi Backend xử lý xong trong $\le 50\text{ ms}$. | Ready |
| `TASK-BE-017` | Lập trình Aspect Ghi vết Kiểm toán Bất biến | Xây dựng Spring AOP Aspect ghi log các thao tác chỉnh sửa dữ liệu người dùng vào bảng `audit_logs`. | `BLD-BE-015` | `TASK-BE-008`, `TASK-BE-011` | Wave 8 | Mọi thao tác sửa giờ công hoặc nhân viên đều tự động có bản ghi audit chi tiết ngữ cảnh người sửa. | Ready |
| `TASK-BE-018` | Lập trình Tác vụ Tiêu hủy Dữ liệu 20 Ngày | Xây dựng Spring `@Scheduled` cron job 01:00 hàng ngày xóa cứng vector nhân viên thôi việc quá 20 ngày. | `BLD-BE-017` | `TASK-BE-008` | Wave 7 | Tự động xóa sạch vector sinh trắc học nhân viên thôi việc quá 20 ngày; bảo toàn audit log. | Ready |
| `TASK-BE-019` | Lập trình Kiosk REST Controller | Xây dựng `KioskAttendanceController` tiếp nhận punch, sync-batch, gallery, verify-otp, enroll-face. | `BLD-BE-006` | `TASK-BE-010`, `TASK-BE-013`, `TASK-BE-014`, `TASK-BE-015` | Wave 10 | Tiếp nhận và phản hồi Kiosk trong $\le 100\text{ ms}$; thẩm định header `X-Kiosk-Id` chính xác. | Ready |
| `TASK-BE-020` | Lập trình Web Portal REST Controllers | Xây dựng `AuthController`, `AttendanceAdminController`, `AttendanceEmployeeController`, `ConsentController`. | `BLD-BE-007` | `TASK-BE-010`, `TASK-BE-011`, `TASK-BE-013` | Wave 9 | Người dùng Web thực hiện được toàn bộ luồng đăng nhập, xem lịch sử, ký cam kết và quản lý. | Ready |
| `TASK-BE-021` | Lập trình WebSocket Channel Interceptor & Auth | Cấu hình Interceptor chặn frame `CONNECT` và `SUBSCRIBE` để thẩm định token JWT/Kiosk Secret. | `BLD-BE-008` | `TASK-BE-005`, `TASK-BE-011`, `TASK-BE-016` | Wave 8 | Từ chối kết nối WebSocket khi thiếu token; cho phép client hợp lệ subscribe đúng kênh. | Ready |
| `TASK-BE-022` | Tích hợp Toàn trình Luồng Điểm danh & STOMP | Ghép nối luồng tiếp nhận punch từ Kiosk qua REST API, kiểm tra cooldown, lưu DB và phát sóng STOMP. | `BLD-BE-016` | `TASK-BE-019`, `TASK-BE-020`, `TASK-BE-021` | Wave 11 | Toàn trình từ Kiosk gửi punch đến Web Portal nhận sự kiện điểm danh hoàn tất trong $\le 100\text{ ms}$. | Ready |
| `TASK-BE-023` | Lập trình Migration V2 & Ánh xạ Trạng thái Xác thực | Viết `V2__add_credential_lifecycle.sql` bổ sung cột `must_change_password`, cập nhật entity `User` và repository tương ứng. | `BLD-BE-018` | `TASK-BE-007` | Wave 6 | Migration V2 chạy thành công trên CSDL đang có dữ liệu mà không mất bản ghi; cờ `mustChangePassword` ánh xạ đúng và test ràng buộc dữ liệu đạt. | Ready |
| `TASK-BE-024` | Lập trình Dịch vụ Tài khoản & Buộc đổi Mật khẩu | Xây dựng `AccountManagementService` (tạo hồ sơ kèm mật khẩu tạm dùng một lần, cập nhật hồ sơ, vô hiệu hóa nhân sự) và bộ chặn nghiệp vụ `PASSWORD_CHANGE_REQUIRED` cùng endpoint đổi mật khẩu. | `BLD-BE-019` | `TASK-BE-023`, `TASK-BE-011` | Wave 8 | Tạo hồ sơ trả mật khẩu tạm đúng một lần; endpoint nghiệp vụ trả 403 `PASSWORD_CHANGE_REQUIRED` cho tới khi đổi mật khẩu; vô hiệu hóa nhân sự đặt `terminated_date` và ghi audit. | Ready |
| `TASK-BE-025` | Lập trình Dịch vụ Mã PIN & Thẩm định PIN | Xây dựng `PinService` (thiết lập/đổi mã PIN 6 số, băm một chiều) và luồng thẩm định PIN cho trạm Kiosk kèm khóa 15 phút. | `BLD-BE-020` | `TASK-BE-023` | Wave 7 | PIN đúng trả về định danh nhân viên; PIN sai trả 401 `PIN_INVALID`; sai 5 lần liên tiếp trả 423 `PIN_LOCKED`; không tạo bản ghi điểm danh khi thẩm định thất bại. | Ready |
| `TASK-BE-026` | Lập trình Admin Employee REST Controller | Xây dựng `AdminEmployeeController` cho ba endpoint tạo/cập nhật/vô hiệu hóa nhân sự theo hợp đồng Mục 4.12 của API Design. | `BLD-BE-021` | `TASK-BE-024`, `TASK-BE-010` | Wave 9 | Ba endpoint trả đúng mã 201/200 và mã lỗi 409/403/400; phân quyền `HR_MANAGER`/`ADMIN` chính xác; mọi thay đổi sinh audit log. | Ready |
| `TASK-BE-027` | Lập trình Auth Change-Password & PIN Controllers | Xây dựng `AuthController.changePassword`, `EmployeePinController` và `KioskPinController` (`/api/v1/kiosk/verify-pin`) kèm ba mã lỗi mới. | `BLD-BE-022` | `TASK-BE-024`, `TASK-BE-025`, `TASK-BE-010` | Wave 9 | Đổi mật khẩu xóa cờ buộc đổi; thiết lập/đổi PIN trả `hasPin`; `verify-pin` trả 200/401/423 đúng hợp đồng; Kiosk không ghi điểm danh khi thẩm định thất bại. | Ready |

---

## 3. Dependency Structure (Cấu trúc Phụ thuộc)

Đồ thị phụ thuộc (DAG) giữa các task thi công, giải quyết trọn vẹn mọi quan hệ phụ thuộc xuyên facet:

```text
[Foundation Layer]
TASK-BE-001 (Toolchain)
    ├── TASK-BE-002 (Spring Boot Skeleton)
    │       ├── TASK-BE-003 (DataSource/Flyway) ──→ TASK-BE-006 (DDL 8 Bảng) ──→ TASK-BE-007 (Entities)
    │       │                                                                        ├── TASK-BE-008 (Repositories)
    │       │                                                                        └── TASK-BE-023 (Migration V2 Credential State)
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
* **Wave 6: Repositories & Credential Schema Migration**: `TASK-BE-008`, `TASK-BE-023`.
* **Wave 7: JWT Filter, OTP Lifecycle, Audit Aspect & PIN Service**: `TASK-BE-011`, `TASK-BE-015`, `TASK-BE-018`, `TASK-BE-025`.
* **Wave 8: Attendance Engine, Audit Aspect & Credential Services**: `TASK-BE-013`, `TASK-BE-017`, `TASK-BE-021`, `TASK-BE-024`.
* **Wave 9: Batch Sync, Portal & Credential Controllers**: `TASK-BE-014`, `TASK-BE-020`, `TASK-BE-026`, `TASK-BE-027`.
* **Wave 10: Kiosk REST Controller**: `TASK-BE-019`.
* **Wave 11: Service Integration**: `TASK-BE-022`.

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Tính Độc lập của Pull Request theo Task**: Mỗi `TASK-BE-` được thi công trên một Git branch riêng biệt và tích hợp qua Pull Request sau khi vượt qua toàn bộ unit test và linting cục bộ; các task trong cùng một Wave không có phụ thuộc lẫn nhau và có thể phân bổ cho nhiều kỹ sư phát triển song song.
* **Môi trường Cơ sở Dữ liệu Phục vụ Thi công**: Từ Wave 4 trở đi (`TASK-BE-006`), quá trình chạy thử nghiệm và kiểm thử tích hợp yêu cầu container PostgreSQL 16 khả dụng (thông qua Testcontainers hoặc Docker Compose cục bộ).
* **Hiệu chỉnh Wave theo Mục 14.4**: Wave của toàn bộ task đã được tính lại theo công thức `1 + max(Wave(dep))` để tuân thủ quy tắc `Wave(task) > Wave(dep)` của `sdlc-docs.md` Mục 14.4 (trước đây nhiều cặp task phụ thuộc nhau nằm cùng Wave). Việc gán lại Wave không thay đổi thứ tự thi công thực tế, chỉ làm rõ quan hệ song song.
