---
title: Backend API Specification & Design
version: 3.0
status: Approved
owner: Backend Lead & API Architect
type: spec
scope: BE
facet: api
updated: 2026-10-08
---

# API SPECS & DESIGN — Đặc tả Giao diện & Thiết kế Hợp đồng API Phân hệ Backend

Tài liệu hợp nhất đặc tả các giao diện lập trình ứng dụng (`API-BE-`) và thiết kế kỹ thuật hợp đồng chi tiết (`APD-BE-`) của phân hệ Backend phục vụ Kiosk App và Web Portal theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §7.2).

---

## 1. Danh mục Giao diện & Thao tác (Interfaces & Operations)

### 1.1. Provided REST Interfaces (`API-BE-`)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `API-BE-001` | Cung cấp giao diện `POST /api/v1/auth/login` xác thực tài khoản và cấp phát cặp Access Token (1h) & Refresh Token (7 ngày). | REST Auth | Must | `API-SYS-001`, `FR-BE-001` | Trả về HTTP 200 kèm Access Token và Refresh Token khi đăng nhập đúng; trả về 401 ProblemDetails khi sai thông tin. | Approved |
| `API-BE-002` | Cung cấp giao diện `POST /api/v1/auth/refresh` làm mới Access Token từ Refresh Token hợp lệ mà không cần đăng nhập lại. | REST Auth | Must | `API-SYS-002`, `FR-BE-001` | Trả về HTTP 200 kèm Access Token mới; từ chối khi Refresh Token hết hạn hoặc không hợp lệ. | Approved |
| `API-BE-003` | Cung cấp giao diện `POST /api/v1/kiosk/punch` tiếp nhận sự kiện điểm danh đơn lẻ tức thì từ trạm Kiosk. | REST Kiosk | Must | `API-SYS-005`, `FR-BE-002` | Xác thực `X-Kiosk-Id`, phản hồi $\le 100\text{ ms}$; kiểm tra cooldown 120s và tính toán ca làm việc. | Approved |
| `API-BE-004` | Cung cấp giao diện `POST /api/v1/kiosk/sync-batch` tiếp nhận gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi mạng phục hồi. | REST Kiosk | Must | `API-SYS-006`, `FR-BE-003` | Tiếp nhận gói lô, thực thi batch insert với `ON CONFLICT DO NOTHING`, trả về danh sách ID đã lưu thành công. | Approved |
| `API-BE-005` | Cung cấp giao diện `GET /api/v1/kiosk/gallery` cung cấp toàn bộ danh mục vector ArcFace 512D đã kích hoạt để nạp vào RAM Kiosk. | REST Kiosk | Must | `API-SYS-007`, `FR-BE-004` | Trả về danh sách nhân viên ACTIVE kèm vector 512D đã giải mã; xác thực qua Kiosk Secret Token. | Approved |
| `API-BE-006` | Cung cấp giao diện `POST /api/v1/kiosk/verify-otp` thẩm định mã OTP 6 số để mở khóa camera quét mặt trên trạm Kiosk. | REST Kiosk | Must | `API-SYS-009`, `FR-BE-005` | Trả về HTTP 200 kèm thông tin nhân sự khi OTP hợp lệ và còn hạn 48h; trả về 400/404 khi OTP sai hoặc hết hạn. | Approved |
| `API-BE-007` | Cung cấp giao diện `POST /api/v1/kiosk/enroll-face` tiếp nhận vector 512D mới kèm OTP để mã hóa lưu CSDL và kích hoạt hồ sơ. | REST Kiosk | Must | `API-SYS-010`, `FR-BE-006` | Mã hóa vector AES-256-GCM, cập nhật trạng thái ACTIVE, đánh dấu OTP đã dùng và bắn thông báo hoàn tất qua STOMP. | Approved |
| `API-BE-008` | Cung cấp giao diện `GET /api/v1/admin/attendance` truy vấn và lọc lịch sử điểm danh nhân sự cho HR và Quản trị. | REST Admin | Must | `API-SYS-010`, `FR-BE-008` | Phân quyền vai trò `HR_MANAGER`/`ADMIN`, hỗ trợ phân trang `Pageable` và lọc theo ngày, phòng ban; không kết xuất file. | Approved |
| `API-BE-009` | Cung cấp giao diện `GET /api/v1/employee/attendance` cho phép nhân viên tra cứu lịch sử chấm công theo tháng của chính mình. | REST Employee | Must | `API-SYS-035`, `FR-BE-008`, `FR-SYS-028` | Phân quyền vai trò `EMPLOYEE`, chỉ trả về các bản ghi thuộc về người dùng đang đăng nhập. | Approved |
| `API-BE-010` | Cung cấp giao diện `POST /api/v1/employee/consent` ghi nhận chữ ký điện tử Informed Consent và tự động sinh mã OTP 48h. | REST Employee | Must | `API-SYS-013`, `FR-BE-005` | Lưu vết IP và thời điểm ký vào audit log, sinh mã OTP 6 số lưu CSDL và trả về cho nhân viên. | Approved |
| `API-BE-011` | Cung cấp giao diện `GET /api/v1/admin/employees` quản lý danh sách nhân sự, phòng ban và trạng thái kích hoạt khuôn mặt. | REST Admin | Must | `API-SYS-014`, `FR-BE-001` | Trả về danh sách nhân viên kèm trạng thái hồ sơ (`PENDING_CONSENT`, `ACTIVE`, `TERMINATED`). | Approved |
| `API-BE-017` | Cung cấp giao diện `POST /api/v1/admin/employees` khởi tạo hồ sơ nhân sự kèm tài khoản đăng nhập và mật khẩu tạm. | REST Admin | Must | `API-SYS-008`, `FR-BE-010`, `FR-BE-011` | Trả HTTP 201 kèm `employeeId`, `employeeCode` và `temporaryPassword` (hiển thị duy nhất một lần); yêu cầu role `HR_MANAGER`/`ADMIN`; từ chối HTTP 409 khi trùng `employeeCode`/`email`. | Approved |
| `API-BE-018` | Cung cấp giao diện `PATCH /api/v1/admin/employees/{id}` cập nhật hồ sơ nhân sự (họ tên, email, phòng ban, vai trò). | REST Admin | Must | `API-SYS-008`, `FR-BE-010` | Cập nhật thành công trả HTTP 200 kèm hồ sơ sau khi sửa; mọi thay đổi sinh bản ghi `audit_logs` với giá trị trước và sau; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-019` | Cung cấp giao diện `PATCH /api/v1/admin/employees/{id}/status` vô hiệu hóa hoặc phục hồi trạng thái công tác của nhân sự. | REST Admin | Must | `API-SYS-008`, `FR-BE-010` | Vô hiệu hóa đặt `status = TERMINATED` kèm `terminated_date` (kích hoạt tiêu hủy sinh trắc sau 20 ngày) và ghi `audit_logs`; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-020` | Cung cấp giao diện `POST /api/v1/auth/change-password` đổi mật khẩu của chính người dùng đang đăng nhập (tự nguyện). | REST Auth | Must | `API-SYS-021`, `FR-BE-011` | Đổi mật khẩu thành công trả HTTP 200 và thu hồi mọi refresh token cũ của tài khoản; mật khẩu mới tối thiểu 8 ký tự và khác mật khẩu hiện tại. | Approved |
| `API-BE-021` | Cung cấp giao diện `POST /api/v1/employee/pin` cho phép nhân viên đã đăng nhập thiết lập hoặc đổi mã PIN dự phòng 6 số. | REST Employee | Must | `API-SYS-022`, `FR-BE-012` | Thiết lập lần đầu yêu cầu `pin` và `confirmPin` khớp nhau; đổi PIN yêu cầu `currentPin` hợp lệ; PIN lưu dạng băm một chiều; trả về trạng thái `hasPin`. | Approved |
| `API-BE-022` | Cung cấp giao diện `POST /api/v1/kiosk/verify-pin` thẩm định mã PIN dự phòng cho trạm Kiosk trước khi ghi nhận điểm danh. | REST Kiosk | Must | `API-SYS-023`, `FR-BE-012`, `DATA-SYS-012` | Xác thực đúng trả HTTP 200 kèm định danh nhân viên; PIN sai trả HTTP 401 `PIN_INVALID`; đang bị khóa trả HTTP 423 `PIN_LOCKED` kèm thời gian còn lại; yêu cầu `X-Kiosk-Id` + Secret Token. | Approved |
| `API-BE-023` | Cung cấp giao diện `POST /api/v1/admin/shifts` và `PATCH /api/v1/admin/shifts/{id}` quản lý danh mục ca làm việc. | REST Admin | Must | `API-SYS-024`, `FR-BE-013` | Tạo ca trả HTTP 201 với `shift_code` duy nhất; sửa ca trả HTTP 200; từ chối HTTP 400 khi giờ bắt đầu $\ge$ giờ kết thúc; vô hiệu hóa ca đang được phân ca trả HTTP 409; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-024` | Cung cấp giao diện `POST /api/v1/admin/employee-shifts` phân ca và `DELETE /api/v1/admin/employee-shifts/{id}` gỡ phân ca cho nhân sự. | REST Admin | Must | `API-SYS-025`, `FR-BE-013` | Phân ca trả HTTP 201; từ chối HTTP 409 khi khoảng hiệu lực chồng lấn của cùng nhân viên; gỡ phân ca trả HTTP 204 và không làm mất lịch sử chấm công đã ghi; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-025` | Cung cấp giao diện `GET /api/v1/admin/employee-shifts` tra cứu lịch phân ca theo nhân viên và khoảng ngày. | REST Admin | Must | `API-SYS-025`, `FR-BE-013` | Lọc theo nhân viên, ca và khoảng ngày; trả về phân ca đang hiệu lực của từng nhân viên; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-026` | Cung cấp giao diện `POST /api/v1/employee/excuse-requests` cho phép nhân viên nộp đơn giải trình công cho một lượt chấm cụ thể. | REST Employee | Must | `API-SYS-010`, `FR-BE-014` | Trả HTTP 201 với trạng thái `PENDING`; chỉ nhận bản ghi điểm danh thuộc chính người gửi trong vòng 30 ngày gần nhất; trả HTTP 404 khi bản ghi không thuộc người gửi. | Approved |
| `API-BE-027` | Cung cấp giao diện `GET /api/v1/employee/excuse-requests` để nhân viên theo dõi trạng thái các đơn của chính mình. | REST Employee | Must | `API-SYS-010`, `FR-BE-014` | Chỉ trả về đơn của người đang đăng nhập; kèm trạng thái xử lý và lý do từ chối nếu có. | Approved |
| `API-BE-028` | Cung cấp giao diện `GET /api/v1/admin/excuse-requests` liệt kê đơn giải trình chờ xử lý cho HR. | REST Admin | Must | `API-SYS-010`, `FR-BE-015` | Lọc theo trạng thái, khoảng ngày và phòng ban; hỗ trợ phân trang; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-029` | Cung cấp giao diện `PATCH /api/v1/admin/excuse-requests/{id}` để HR duyệt hoặc từ chối đơn giải trình công. | REST Admin | Must | `API-SYS-010`, `FR-BE-015` | Quyết định trả HTTP 200; khi duyệt, bản ghi điểm danh được điều chỉnh trong cùng giao dịch và sinh một bản ghi `audit_logs` có giá trị trước/sau; từ chối bắt buộc kèm lý do; đơn đã xử lý trả HTTP 409. | Approved |
| `API-BE-030` | Cung cấp giao diện `GET /api/v1/admin/audit-logs` tra cứu nhật ký kiểm toán ở chế độ chỉ đọc. | REST Admin | Must | `API-SYS-026`, `FR-BE-016` | Lọc theo khoảng thời gian, tác nhân và loại hành vi; hỗ trợ phân trang; yêu cầu role `ADMIN`; không có thao tác ghi/sửa/xoá. | Approved |
| `API-BE-031` | Cung cấp giao diện `GET /api/v1/dpo/consents` và `GET /api/v1/dpo/retention-schedule` tra cứu dữ liệu tuân thủ ở chế độ chỉ đọc. | REST Compliance | Must | `API-SYS-027`, `FR-BE-016` | Role `DPO` chỉ đọc; trả về thời điểm ký, IP, phiên bản văn bản Consent và danh sách nhân sự thôi việc kèm mốc tiêu hủy dự kiến/thực tế; mọi thao tác ghi trả HTTP 403. | Approved |
| `API-BE-032` | Cung cấp giao diện `POST /api/v1/admin/kiosks` đăng ký trạm Kiosk mới và `GET /api/v1/admin/kiosks` liệt kê trạm. | REST Admin | Must | `API-SYS-028`, `FR-BE-017` | Đăng ký trả HTTP 201 kèm Secret Token hiển thị duy nhất một lần (lưu dạng băm một chiều); danh sách trả về trạng thái hoạt động và `last_ping_at`; yêu cầu role `ADMIN`. | Approved |
| `API-BE-033` | Cung cấp giao diện `PATCH /api/v1/admin/kiosks/{id}` đổi Secret Token hoặc vô hiệu hóa trạm Kiosk. | REST Admin | Must | `API-SYS-028`, `FR-BE-017` | Đổi token trả token mới đúng một lần và vô hiệu hóa token cũ ngay lập tức; vô hiệu hóa trạm khiến mọi giao diện Kiosk của trạm đó nhận HTTP 401; yêu cầu role `ADMIN`. | Approved |
| `API-BE-034` | Cung cấp giao diện `GET /api/v1/admin/kiosks/{id}/health` trả về trạng thái kết nối của trạm Kiosk. | REST Admin | Must | `API-SYS-028`, `FR-BE-017` | Trả về `last_ping_at` và trạng thái hoạt động; đánh dấu cảnh báo khi trạm không ping quá 5 phút; yêu cầu role `ADMIN`. | Approved |
| `API-BE-035` | Cung cấp giao diện `GET /api/v1/admin/reports/export` kết xuất báo cáo bảng công định dạng Excel an toàn. | REST Admin | Must | `API-SYS-011`, `FR-BE-008` | Trả file `.xlsx` trong đó mọi ô văn bản bắt đầu bằng `=`, `+`, `-`, `@` đã được escape; kết xuất 1,000 nhân sự trong $\le 3\text{ giây}$; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-036` | Cung cấp giao diện `POST /api/v1/admin/employees/{id}/credentials/reset` cấp lại mật khẩu tạm cho nhân sự quên mật khẩu. | REST Admin | Must | `API-SYS-029`, `FR-BE-019` | Trả HTTP 200 kèm `temporaryPassword` hiển thị duy nhất một lần; mật khẩu tạm cũ hết hiệu lực và mọi refresh token của tài khoản bị thu hồi; ghi `audit_logs`; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-037` | Cung cấp giao diện `POST /api/v1/employee/pin/reset` cho phép nhân viên đặt lại mã PIN dự phòng khi quên. | REST Employee | Must | `API-SYS-029`, `FR-BE-019` | Yêu cầu mật khẩu hiện tại đúng; PIN cũ bị vô hiệu hóa và PIN mới lưu dạng băm một chiều; trả HTTP 200 kèm `hasPin: true`; ghi `audit_logs`. | Approved |
| `API-BE-038` | Cung cấp giao diện `POST /api/v1/auth/logout` đăng xuất và thu hồi refresh token hiện tại. | REST Auth | Must | `API-SYS-030`, `FR-BE-020` | Trả HTTP 204; refresh token đã thu hồi trả HTTP 401 khi được sử dụng lại; đổi mật khẩu hoặc vô hiệu hóa tài khoản thu hồi toàn bộ refresh token của tài khoản. | Approved |
| `API-BE-039` | Cung cấp giao diện `POST /api/v1/admin/payroll-periods/{period}/lock` và `POST /api/v1/admin/payroll-periods/{period}/unlock` chốt và mở lại kỳ công. | REST Admin | Must | `API-SYS-031`, `FR-BE-021` | Chốt kỳ trả HTTP 200 kèm trạng thái `LOCKED`; mở lại yêu cầu lý do, trả HTTP 200 kèm trạng thái `OPEN` và ghi audit; chốt yêu cầu role `HR_MANAGER`/`ADMIN`, mở lại chỉ `ADMIN`. | Approved |
| `API-BE-040` | Cung cấp giao diện `GET /api/v1/admin/payroll-periods` tra cứu danh sách kỳ công và trạng thái chốt. | REST Admin | Must | `API-SYS-031`, `FR-BE-021` | Trả danh sách kỳ công kèm trạng thái `OPEN`/`LOCKED`, người chốt và mốc chốt; hỗ trợ tra cứu theo năm; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-041` | Cung cấp giao diện `POST /api/v1/employee/consent/withdraw` cho phép nhân viên rút lại Informed Consent. | REST Employee | Must | `API-SYS-032`, `FR-BE-022` | Trả HTTP 200 kèm thời điểm hiệu lực và hạn tiêu hủy dữ liệu sinh trắc (7 ngày); nhân viên bị loại khỏi danh mục gallery cấp cho Kiosk và không sinh được OTP mới; ghi vết bất biến (thời điểm, IP). | Approved |
| `API-BE-042` | Cung cấp giao diện `POST /api/v1/employee/data-requests` gửi yêu cầu về dữ liệu cá nhân và `GET /api/v1/dpo/data-requests` để DPO xử lý. | REST Compliance | Must | `API-SYS-032`, `FR-BE-022` | Nhân viên gửi được yêu cầu truy cập/chỉnh sửa và theo dõi trạng thái phản hồi; role `DPO` xem được danh sách yêu cầu và cập nhật trạng thái xử lý; mọi thay đổi trạng thái ghi audit. | Approved |
| `API-BE-043` | Cung cấp giao diện `PATCH /api/v1/admin/users/{id}/role` gán hoặc thu hồi role của tài khoản. | REST Admin | Must | `API-SYS-033`, `FR-BE-023` | Trả HTTP 200 kèm role sau thay đổi và ghi `audit_logs` giá trị trước/sau; thu hồi hoặc hạ cấp tài khoản `ADMIN` đang hoạt động cuối cùng trả HTTP 409; yêu cầu role `ADMIN`. | Approved |
| `API-BE-044` | Cung cấp giao diện `GET /api/v1/notifications` và `PATCH /api/v1/notifications/{id}/read` phục vụ thông báo trong ứng dụng. | REST Notification | Should | `API-SYS-034`, `FR-BE-024` | Chỉ trả thông báo của người đang đăng nhập, sắp xếp mới nhất trước; đánh dấu đã đọc trả HTTP 200; không có kênh email/SMS trong phạm vi MVP. | Approved |

### 1.2. Kênh Đẩy Dữ liệu Thời gian thực STOMP (`API-BE-`)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `API-BE-012` | Kênh STOMP Topic `/topic/kiosk-gallery`: Phát thông báo cập nhật vector mới (`ADD_VECTOR`) hoặc vô hiệu hóa vector (`DELETE_VECTOR`) tới Kiosk. | WebSocket STOMP | Must | `API-SYS-015`, `FR-BE-007` | Kiosk nhận được bản tin cập nhật trong $\le 50\text{ ms}$ để tự động nạp/xóa vector trong RAM không cần khởi động lại. | Approved |
| `API-BE-013` | Kênh STOMP Topic `/topic/live-attendance`: Đẩy bản tin sự kiện điểm danh trực tiếp lên bảng Live Dashboard của nhân sự. | WebSocket STOMP | Must | `API-SYS-016`, `FR-BE-007` | Dashboard Web Portal nhận được sự kiện trong $\le 50\text{ ms}$ kể từ khi Backend xử lý xong bản ghi punch. | Approved |
| `API-BE-014` | Kênh STOMP Topic `/topic/enrollment/{otp}`: Thông báo trạng thái đăng ký khuôn mặt tại Kiosk thành công về Web của nhân viên. | WebSocket STOMP | Must | `API-SYS-016`, `FR-BE-007` | Web Portal nhân viên tự động đóng modal hướng dẫn và chuyển trạng thái hoàn tất ngay khi Kiosk hoàn thành nạp mẫu. | Approved |

### 1.3. Cấu trúc Thành phần Thiết kế API (`APD-BE-`)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APD-BE-001` | Cấu trúc REST API Phân hệ Kiosk | Thiết kế hợp đồng 5 endpoint REST phục vụ trạm Kiosk (`/punch`, `/sync-batch`, `/gallery`, `/verify-otp`, `/enroll-face`), tiền tố URL `/api/v1/kiosk`, xác thực qua header `X-Kiosk-Id`. | `STK-011` | `API-BE-003..007` | `DD-SYS-001`, `DD-BE-010` | Accepted |
| `APD-BE-002` | Cấu trúc REST API Cổng Web Portal | Thiết kế hợp đồng các endpoint REST phục vụ Web Portal (Auth, Admin Attendance, Employee Attendance, Consent Signing, Employee Management), xác thực Bearer JWT đa vai trò. | `STK-011` | `API-BE-001..002`, `API-BE-008..011` | `DD-SYS-001`, `DD-BE-009` | Accepted |
| `APD-BE-003` | Cấu trúc Kênh Đẩy Dữ liệu STOMP | Thiết kế kênh WebSocket STOMP endpoint `/ws-attendance`, hỗ trợ SockJS fallback và cấu hình message broker tiền tố `/topic` phục vụ đẩy sự kiện thời gian thực tới Kiosk và Web. | `STK-012` | `API-BE-012..014` | `DD-SYS-004`, `DD-BE-011` | Accepted |
| `APD-BE-004` | Mô hình Hợp đồng Dữ liệu & ProblemDetails | Chuẩn hóa định dạng bao bọc JSON, múi giờ ISO-8601 (+07:00), mã lỗi RFC 7807 ProblemDetails và bộ DTO validation annotations (`@NotNull`, `@Size`, `@Pattern`). | `STK-011` | `API-BE-015`, `API-BE-016` | `DD-BE-009` | Accepted |
| `APD-BE-005` | Xác thực & Lọc Kênh WebSocket STOMP | Client gửi frame `CONNECT` kèm header `Authorization` hoặc `X-Kiosk-Id` $\rightarrow$ `ChannelInterceptor` thẩm định $\rightarrow$ cho phép subscribe các topic `/topic/live-attendance`, `/topic/kiosk-gallery`. | `APD-BE-003`, `STK-012` | `API-BE-012..015` | `DD-SYS-004`, `DD-BE-011` | Accepted |
| `APD-BE-006` | Cơ chế Idempotency Xử lý Điểm danh | Tiếp nhận punch $\rightarrow$ đối chiếu khóa tự nhiên `(user_id, punch_timestamp, punch_type)` trên PostgreSQL và cache 120s $\rightarrow$ nếu trùng trả về HTTP 409 hoặc bỏ qua trong gói lô (`ON CONFLICT DO NOTHING`). | `APD-BE-001`, `STK-013` | `API-BE-003`, `API-BE-004` | `DD-SYS-006`, `DD-BE-012` | Accepted |

---

## 2. Quy chuẩn Chung Toàn bộ API (Global API Conventions)

* **Base URL**: `http://localhost:8080/api/v1` (Môi trường Dev) hoặc `https://fas.company.com/api/v1` (Môi trường Production).
* **Định dạng Nội dung**: `Content-Type: application/json; charset=UTF-8`.
* **Định dạng Thời gian**: Chuỗi ISO-8601 kèm múi giờ (Ví dụ: `2026-10-08T08:30:00.000+07:00`).
* **Cấu trúc Bao bọc Phản hồi Thành công Chuẩn (Envelope `DD-SYS-012`)**:
```json
{
  "success": true,
  "code": "OK",
  "message": "Thông điệp mô tả kết quả xử lý thân thiện",
  "data": { ... },
  "timestamp": "2026-10-08T08:30:00.120+07:00"
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
  "message": "Email hoặc mật khẩu không chính xác.",
  "timestamp": "2026-10-08T08:30:00.125+07:00",
  "invalidParams": [
    { "field": "password", "reason": "Mật khẩu không được để trống" }
  ]
}
```

---

## 3. Hợp đồng Chi tiết Từng Endpoint REST (Key Endpoint Contracts)

### 3.1. `POST /api/v1/auth/login` (`API-BE-001`)
* **Mục đích**: Xác thực người dùng Web Portal (HR, Nhân viên, Quản trị, DPO), cấp cặp Access Token (1 giờ) và Refresh Token (7 ngày).
* **Request**:
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
      "status": "ACTIVE",
      "department": "Phòng Kỹ thuật"
    }
  },
  "timestamp": "2026-10-08T08:30:00.120+07:00"
}
```

### 3.2. `POST /api/v1/kiosk/punch` (`API-BE-003`)
* **Headers**: `X-Kiosk-Id: KIOSK-HN-01`, `Authorization: Bearer <KioskSecretToken>`
* **Request**:
```json
{
  "employeeId": 1042,
  "punchTimestamp": "2026-10-08T08:30:15.123+07:00",
  "verificationMethod": "VERIFICATION_FACE",
  "confidenceScore": 0.8824,
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
    "recordId": 9812,
    "employeeId": 1042,
    "employeeCode": "NV-1042",
    "fullName": "Ngô Văn Dũng",
    "punchType": "CHECK_IN",
    "status": "ON_TIME",
    "lateMinutes": 0,
    "department": "Phòng Kỹ thuật"
  },
  "timestamp": "2026-10-08T08:30:15.200+07:00"
}
```

### 3.3. `POST /api/v1/kiosk/sync-batch` (`API-BE-004`)
* **Headers**: `X-Kiosk-Id: KIOSK-HN-01`, `Authorization: Bearer <KioskSecretToken>`
* **Request**:
```json
{
  "kioskId": "KIOSK-HN-01",
  "batchSize": 2,
  "records": [
    {
      "localId": 101,
      "employeeId": 1042,
      "punchTimestamp": "2026-10-08T07:55:00.000+07:00",
      "verificationMethod": "VERIFICATION_FACE",
      "confidenceScore": 0.891
    },
    {
      "localId": 102,
      "employeeId": 1045,
      "punchTimestamp": "2026-10-08T07:58:12.000+07:00",
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
  "code": "BATCH_SYNCED",
  "message": "Đồng bộ thành công 2 bản ghi",
  "data": {
    "syncedCount": 2,
    "syncedLocalIds": [101, 102]
  },
  "timestamp": "2026-10-08T08:05:00.120+07:00"
}
```

### 3.4. `GET /api/v1/kiosk/gallery` (`API-BE-005`)
* **Headers**: `X-Kiosk-Id: KIOSK-HN-01`, `Authorization: Bearer <KioskSecretToken>`, `Accept-Encoding: gzip`
* **Response 200 OK**:
```json
{
  "success": true,
  "code": "GALLERY_FETCHED",
  "message": "Lấy danh mục vector thành công",
  "data": {
    "galleryVersion": 18,
    "totalCount": 1000,
    "items": [
      {
        "employeeId": 1042,
        "employeeCode": "NV-1042",
        "fullName": "Ngô Văn Dũng",
        "department": "Phòng Kỹ thuật",
        "vector": [0.0412, -0.0521, 0.0189, "...đủ 512 số float..."]
      }
    ]
  },
  "timestamp": "2026-10-08T07:00:00.000+07:00"
}
```

### 3.5. `POST /api/v1/kiosk/verify-pin` (`API-BE-022`)
* **Headers**: `X-Kiosk-Id: KIOSK-HN-01`, `Authorization: Bearer <KioskSecretToken>`
* **Request**:
```json
{
  "employeeCode": "NV-1042",
  "pin": "123456"
}
```
* **Response 200 OK**:
```json
{
  "success": true,
  "code": "PIN_VERIFIED",
  "message": "Mã PIN chính xác",
  "data": {
    "employeeId": 1042,
    "employeeCode": "NV-1042",
    "fullName": "Ngô Văn Dũng",
    "department": "Phòng Kỹ thuật"
  },
  "timestamp": "2026-10-08T08:30:15.120+07:00"
}
```

---

## 4. Kênh Đẩy Dữ liệu Thời gian thực STOMP (STOMP Events Contract)

* **Endpoint Bắt tay WebSocket**: `ws://localhost:8080/ws-attendance` (kèm SockJS fallback).
* **Header Kết nối STOMP**: `Authorization: Bearer <JWT>` (Web) hoặc `X-Kiosk-Id` + Token (Kiosk).

### 4.1. Topic `/topic/live-attendance` — Đẩy Sự kiện Điểm danh Lên Web Dashboard
* **Bên phát**: `backend-service` $\rightarrow$ **Bên nhận**: `web-portal`.
* **Payload JSON**:
```json
{
  "eventType": "ATTENDANCE_PUNCHED",
  "recordId": 98231,
  "employeeId": 1042,
  "employeeCode": "NV-1042",
  "fullName": "Ngô Văn Dũng",
  "department": "Phòng Kỹ thuật",
  "punchTimestamp": "2026-10-08T08:29:45.120+07:00",
  "punchType": "CHECK_IN",
  "verificationMethod": "VERIFICATION_FACE",
  "status": "ON_TIME",
  "lateMinutes": 0,
  "kioskId": "KIOSK-HN-01"
}
```

### 4.2. Topic `/topic/kiosk-gallery` — Cập nhật Nạp Nóng Vector về Kiosk
* **Bên phát**: `backend-service` $\rightarrow$ **Bên nhận**: Các trạm `kiosk-app`.
* **Payload Thêm mới (`ADD`)**:
```json
{
  "action": "ADD",
  "employeeId": 1042,
  "employeeCode": "NV-1042",
  "fullName": "Ngô Văn Dũng",
  "vector": [0.0412, -0.0521, 0.0189, "...512 số float..."],
  "updatedAt": "2026-10-08T08:41:05.320+07:00"
}
```
* **Payload Xóa (`DELETE`)**:
```json
{
  "action": "DELETE",
  "employeeId": 1042,
  "reason": "EMPLOYEE_TERMINATED",
  "updatedAt": "2026-10-08T09:00:00.000+07:00"
}
```

---

## 5. Từ điển Mã Lỗi Toàn hệ thống (System Error Codes Dictionary)

| Mã Lỗi (`code`) | HTTP Status | Tiêu đề Lỗi | Diễn giải & Hướng dẫn Khắc phục |
| :--- | :---: | :--- | :--- |
| `AUTH_INVALID_CREDENTIALS` | 401 | Đăng nhập thất bại | Email hoặc mật khẩu không chính xác. |
| `TOKEN_EXPIRED` | 401 | Token hết hạn | Access Token đã quá 1 giờ; cần gọi endpoint refresh token. |
| `ACCESS_DENIED` | 403 | Không đủ quyền | Tài khoản không có vai trò phù hợp (Role Guard). |
| `KIOSK_UNAUTHORIZED` | 401 | Trạm Kiosk chưa cấp phép | Tiêu đề `X-Kiosk-Id` hoặc Secret Token không hợp lệ hoặc trạm bị vô hiệu hóa. |
| `VALIDATION_FAILED` | 400 | Dữ liệu không hợp lệ | Tham số vi phạm ràng buộc validation; chi tiết nằm trong `invalidParams`. |
| `COOLDOWN_ACTIVE` | 409 | Chống quẹt trùng lặp | Lượt điểm danh trong vòng 120 giây trước đó đã được ghi nhận. |
| `OTP_INVALID` | 400 | Mã OTP không đúng | Chuỗi 6 chữ số không khớp với phiên đăng ký đang chờ. |
| `OTP_EXPIRED` | 400 | Mã OTP đã hết hạn | Mã OTP đã vượt quá thời hạn 48 giờ kể từ lúc sinh. |
| `OTP_ALREADY_USED` | 409 | Mã OTP đã sử dụng | Mã này đã được dùng để nạp khuôn mặt thành công trước đó. |
| `INVALID_VECTOR_DIMENSION` | 400 | Sai kích thước vector | Vector không đúng 512 phần tử float32 hoặc chưa chuẩn hóa độ dài $L_2$. |
| `EMPLOYEE_NOT_FOUND` | 404 | Không tìm thấy nhân sự | ID hoặc mã nhân viên không tồn tại trong CSDL. |
| `RESOURCE_NOT_FOUND` | 404 | Không tìm thấy tài nguyên | Endpoint hoặc tài nguyên được yêu cầu không tồn tại trên máy chủ. |
| `PIN_INVALID` | 401 | Mã PIN không đúng | Mã PIN 6 số không khớp với băm lưu trong CSDL; lượt sai được đếm. |
| `PIN_LOCKED` | 423 | Mã PIN đang bị khóa | Nhập sai quá 5 lần liên tiếp; khóa trong 15 phút kèm `lockedUntil`. |
| `PERIOD_LOCKED` | 409 | Kỳ công đã chốt | Không được phép điều chỉnh giờ công hoặc nộp đơn trong kỳ công đã khóa. |
| `DATA_INTEGRITY_VIOLATION` | 400 | Lỗi toàn vẹn dữ liệu | Vi phạm ràng buộc duy nhất (Unique Email hoặc Employee Code). |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi hệ thống nội bộ | Xảy ra lỗi bất thường ngoài tầm kiểm soát; kiểm tra log máy chủ. |
