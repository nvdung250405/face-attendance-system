---
title: Backend API Specifications
version: 2.0
status: Approved
owner: Backend Lead & API Architect
---

# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Backend

Đặc tả các giao diện lập trình ứng dụng RESTful API và kênh truyền thông thời gian thực WebSocket STOMP do phân hệ Backend cung cấp cho máy trạm Kiosk và Web Portal.

---

## 1. Interfaces & Operations (Giao diện & Thao tác Cung cấp)

### 1.1. Provided REST Interfaces (Các Giao diện REST)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `API-BE-001` | Cung cấp giao diện `POST /api/v1/auth/login` xác thực tài khoản và cấp phát cặp Access Token (1h) & Refresh Token (7 ngày). | REST Auth | Must | `API-SYS-001`, `FR-BE-001` | Trả về HTTP 200 kèm Access Token và Refresh Token khi đăng nhập đúng; trả về 401 ProblemDetails khi sai thông tin. | Approved |
| `API-BE-002` | Cung cấp giao diện `POST /api/v1/auth/refresh` làm mới Access Token từ Refresh Token hợp lệ mà không cần đăng nhập lại. | REST Auth | Must | `API-SYS-002`, `FR-BE-001` | Trả về HTTP 200 kèm Access Token mới; từ chối khi Refresh Token hết hạn hoặc không hợp lệ. | Approved |
| `API-BE-003` | Cung cấp giao diện `POST /api/v1/kiosk/punch` tiếp nhận sự kiện điểm danh đơn lẻ tức thì từ trạm Kiosk. | REST Kiosk | Must | `API-SYS-005`, `FR-BE-002` | Xác thực `X-Kiosk-Id`, phản hồi $\le 100\text{ ms}$; kiểm tra cooldown 120s và tính toán ca làm việc. | Approved |
| `API-BE-004` | Cung cấp giao diện `POST /api/v1/kiosk/sync-batch` tiếp nhận gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi mạng phục hồi. | REST Kiosk | Must | `API-SYS-006`, `FR-BE-003` | Tiếp nhận gói lô, thực thi batch insert với `ON CONFLICT DO NOTHING`, trả về danh sách ID đã lưu thành công. | Approved |
| `API-BE-005` | Cung cấp giao diện `GET /api/v1/kiosk/gallery` cung cấp toàn bộ danh mục vector ArcFace 512D đã kích hoạt để nạp vào RAM Kiosk. | REST Kiosk | Must | `API-SYS-007`, `FR-BE-004` | Trả về danh sách nhân viên ACTIVE kèm vector 512D đã giải mã; xác thực qua Kiosk Secret Token. | Approved |
| `API-BE-006` | Cung cấp giao diện `POST /api/v1/kiosk/verify-otp` thẩm định mã OTP 6 số để mở khóa camera quét mặt trên trạm Kiosk. | REST Kiosk | Must | `API-SYS-009`, `FR-BE-005` | Trả về HTTP 200 kèm thông tin nhân sự khi OTP hợp lệ và còn hạn 48h; trả về 400/404 khi OTP sai hoặc hết hạn. | Approved |
| `API-BE-007` | Cung cấp giao diện `POST /api/v1/kiosk/enroll-face` tiếp nhận vector 512D mới kèm OTP để mã hóa lưu CSDL và kích hoạt hồ sơ. | REST Kiosk | Must | `API-SYS-010`, `FR-BE-006` | Mã hóa vector AES-256-GCM, cập nhật trạng thái ACTIVE, đánh dấu OTP đã dùng và bắn thông báo hoàn tất qua STOMP. | Approved |
| `API-BE-008` | Cung cấp giao diện `GET /api/v1/admin/attendance` truy vấn và lọc lịch sử điểm danh nhân sự cho HR và Quản trị (kết xuất Excel thực hiện tại `API-BE-035`). | REST Admin | Must | `API-SYS-011`, `FR-BE-008` | Phân quyền vai trò `HR_MANAGER`/`ADMIN`, hỗ trợ phân trang `Pageable` và lọc theo ngày, phòng ban; giao diện này không kết xuất file. | Approved |
| `API-BE-009` | Cung cấp giao diện `GET /api/v1/employee/attendance` cho phép nhân viên tra cứu lịch sử chấm công theo tháng của chính mình. | REST Employee | Must | `API-SYS-012`, `FR-BE-008` | Phân quyền vai trò `EMPLOYEE`, chỉ trả về các bản ghi thuộc về người dùng đang đăng nhập. | Approved |
| `API-BE-010` | Cung cấp giao diện `POST /api/v1/employee/consent` ghi nhận chữ ký điện tử Informed Consent và tự động sinh mã OTP 48h. | REST Employee | Must | `API-SYS-013`, `FR-BE-005` | Lưu vết IP và thời điểm ký vào audit log, sinh mã OTP 6 số lưu CSDL và trả về cho nhân viên. | Approved |
| `API-BE-011` | Cung cấp giao diện `GET /api/v1/admin/employees` quản lý danh sách nhân sự, phòng ban và trạng thái kích hoạt khuôn mặt. | REST Admin | Must | `API-SYS-014`, `FR-BE-001` | Trả về danh sách nhân viên kèm trạng thái hồ sơ (`PENDING_CONSENT`, `ACTIVE`, `TERMINATED`). | Approved |
| `API-BE-017` | Cung cấp giao diện `POST /api/v1/admin/employees` khởi tạo hồ sơ nhân sự kèm tài khoản đăng nhập và mật khẩu tạm. | REST Admin | Must | `API-SYS-008`, `FR-BE-010`, `FR-BE-011` | Trả HTTP 201 kèm `employeeId`, `employeeCode` và `temporaryPassword` (chỉ xuất hiện duy nhất trong phản hồi này); yêu cầu role `HR_MANAGER`/`ADMIN`; từ chối HTTP 409 khi trùng `employeeCode` hoặc `email`. | Approved |
| `API-BE-018` | Cung cấp giao diện `PATCH /api/v1/admin/employees/{id}` cập nhật hồ sơ nhân sự (họ tên, email, phòng ban, vai trò). | REST Admin | Must | `API-SYS-008`, `FR-BE-010` | Cập nhật thành công trả HTTP 200 kèm hồ sơ sau khi sửa; mọi thay đổi sinh bản ghi `audit_logs` với giá trị trước và sau; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-019` | Cung cấp giao diện `PATCH /api/v1/admin/employees/{id}/status` vô hiệu hóa hoặc phục hồi trạng thái công tác của nhân sự. | REST Admin | Must | `API-SYS-008`, `FR-BE-010` | Vô hiệu hóa đặt `status = TERMINATED` kèm `terminated_date` (kích hoạt tiêu hủy sinh trắc sau 20 ngày) và ghi `audit_logs`; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-020` | Cung cấp giao diện `POST /api/v1/auth/change-password` đổi mật khẩu tài khoản, bao gồm luồng bắt buộc đổi mật khẩu tạm ở lần đăng nhập đầu tiên. | REST Auth | Must | `API-SYS-021`, `FR-BE-011` | Đổi mật khẩu thành công xóa cờ buộc đổi mật khẩu và trả HTTP 200; tài khoản còn cờ này nhận HTTP 403 `PASSWORD_CHANGE_REQUIRED` ở mọi endpoint nghiệp vụ khác; mật khẩu mới tối thiểu 8 ký tự và khác mật khẩu tạm. | Approved |
| `API-BE-021` | Cung cấp giao diện `POST /api/v1/employee/pin` cho phép nhân viên đã đăng nhập thiết lập hoặc đổi mã PIN dự phòng 6 số. | REST Employee | Must | `API-SYS-022`, `FR-BE-012` | Thiết lập lần đầu yêu cầu `pin` và `confirmPin` khớp nhau; đổi PIN yêu cầu `currentPin` hợp lệ; PIN lưu dạng băm một chiều; trả về trạng thái `hasPin`. | Approved |
| `API-BE-022` | Cung cấp giao diện `POST /api/v1/kiosk/verify-pin` thẩm định mã PIN dự phòng cho trạm Kiosk trước khi ghi nhận điểm danh. | REST Kiosk | Must | `API-SYS-023`, `FR-BE-012`, `DATA-SYS-012` | Xác thực đúng trả HTTP 200 kèm định danh nhân viên; PIN sai trả HTTP 401 `PIN_INVALID`; đang bị khóa trả HTTP 423 `PIN_LOCKED` kèm thời gian còn lại; yêu cầu header `X-Kiosk-Id` + Secret Token. | Approved |
| `API-BE-023` | Cung cấp giao diện `POST /api/v1/admin/shifts` và `PATCH /api/v1/admin/shifts/{id}` quản lý danh mục ca làm việc. | REST Admin | Must | `API-SYS-024`, `FR-BE-013` | Tạo ca trả HTTP 201 với `shift_code` duy nhất; sửa ca trả HTTP 200; từ chối HTTP 400 khi giờ bắt đầu không nhỏ hơn giờ kết thúc hoặc ân hạn ngoài khoảng 0-60 phút; vô hiệu hóa ca đang được phân ca trả HTTP 409; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-024` | Cung cấp giao diện `POST /api/v1/admin/employee-shifts` phân ca và `DELETE /api/v1/admin/employee-shifts/{id}` gỡ phân ca cho nhân sự. | REST Admin | Must | `API-SYS-025`, `FR-BE-013` | Phân ca trả HTTP 201; từ chối HTTP 409 khi khoảng hiệu lực chồng lấn của cùng nhân viên; gỡ phân ca trả HTTP 204 và không làm mất lịch sử chấm công đã ghi; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-025` | Cung cấp giao diện `GET /api/v1/admin/employee-shifts` tra cứu lịch phân ca theo nhân viên và khoảng ngày. | REST Admin | Must | `API-SYS-025`, `FR-BE-013` | Lọc theo nhân viên, ca và khoảng ngày; trả về phân ca đang hiệu lực của từng nhân viên; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-026` | Cung cấp giao diện `POST /api/v1/employee/excuse-requests` cho phép nhân viên nộp đơn giải trình công cho một lượt chấm cụ thể. | REST Employee | Must | `API-SYS-010`, `FR-BE-014` | Trả HTTP 201 với trạng thái `PENDING`; chỉ nhận bản ghi điểm danh thuộc chính người gửi trong vòng 30 ngày gần nhất; trả HTTP 404 khi bản ghi không thuộc người gửi. | Approved |
| `API-BE-027` | Cung cấp giao diện `GET /api/v1/employee/excuse-requests` để nhân viên theo dõi trạng thái các đơn của chính mình. | REST Employee | Must | `API-SYS-010`, `FR-BE-014` | Chỉ trả về đơn của người đang đăng nhập; kèm trạng thái xử lý và lý do từ chối nếu có. | Approved |
| `API-BE-028` | Cung cấp giao diện `GET /api/v1/admin/excuse-requests` liệt kê đơn giải trình chờ xử lý cho HR. | REST Admin | Must | `API-SYS-010`, `FR-BE-015` | Lọc theo trạng thái, khoảng ngày và phòng ban; hỗ trợ phân trang; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `API-BE-029` | Cung cấp giao diện `PATCH /api/v1/admin/excuse-requests/{id}` để HR duyệt hoặc từ chối đơn giải trình công. | REST Admin | Must | `API-SYS-010`, `FR-BE-015` | Quyết định trả HTTP 200; khi duyệt, bản ghi điểm danh được điều chỉnh trong cùng giao dịch và sinh một bản ghi `audit_logs` có giá trị trước/sau; từ chối bắt buộc kèm lý do; đơn đã xử lý trả HTTP 409. | Approved |
| `API-BE-030` | Cung cấp giao diện `GET /api/v1/admin/audit-logs` tra cứu nhật ký kiểm toán ở chế độ chỉ đọc. | REST Admin | Must | `API-SYS-026`, `FR-BE-016` | Lọc theo khoảng thời gian, tác nhân và loại hành vi; hỗ trợ phân trang; yêu cầu role `ADMIN`; không có thao tác ghi/sửa/xoá. | Approved |
| `API-BE-031` | Cung cấp giao diện `GET /api/v1/dpo/consents` và `GET /api/v1/dpo/retention-schedule` tra cứu dữ liệu tuân thủ ở chế độ chỉ đọc. | REST Compliance | Must | `API-SYS-027`, `FR-BE-016` | Role `DPO` chỉ đọc; trả về thời điểm ký, địa chỉ IP, phiên bản văn bản Consent và danh sách nhân sự thôi việc kèm mốc tiêu hủy dự kiến/thực tế; mọi thao tác ghi trả HTTP 403. | Approved |
| `API-BE-032` | Cung cấp giao diện `POST /api/v1/admin/kiosks` đăng ký trạm Kiosk mới và `GET /api/v1/admin/kiosks` liệt kê trạm. | REST Admin | Must | `API-SYS-028`, `FR-BE-017` | Đăng ký trả HTTP 201 kèm Secret Token hiển thị duy nhất một lần (lưu dạng băm một chiều); danh sách trả về trạng thái hoạt động và `last_ping_at`; yêu cầu role `ADMIN`. | Approved |
| `API-BE-033` | Cung cấp giao diện `PATCH /api/v1/admin/kiosks/{id}` đổi Secret Token hoặc vô hiệu hóa trạm Kiosk. | REST Admin | Must | `API-SYS-028`, `FR-BE-017` | Đổi token trả token mới đúng một lần và vô hiệu hóa token cũ ngay lập tức; vô hiệu hóa trạm khiến mọi giao diện Kiosk của trạm đó nhận HTTP 401; yêu cầu role `ADMIN`. | Approved |
| `API-BE-034` | Cung cấp giao diện `GET /api/v1/admin/kiosks/{id}/health` trả về trạng thái kết nối của trạm Kiosk. | REST Admin | Must | `API-SYS-028`, `FR-BE-017` | Trả về `last_ping_at` và trạng thái hoạt động; đánh dấu cảnh báo khi trạm không ping quá 5 phút; yêu cầu role `ADMIN`. | Approved |
| `API-BE-035` | Cung cấp giao diện `GET /api/v1/admin/reports/export` kết xuất báo cáo bảng công định dạng Excel an toàn. | REST Admin | Must | `API-SYS-011`, `FR-BE-008` | Trả file `.xlsx` trong đó mọi ô văn bản bắt đầu bằng `=`, `+`, `-`, `@` đã được escape; kết xuất 1,000 nhân sự trong $\le 3\text{ giây}$; yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |

### 1.2. Realtime STOMP Channels (Kênh Đẩy Dữ liệu Thời gian thực)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| `API-BE-012` | Kênh STOMP Topic `/topic/kiosk-gallery`: Phát thông báo cập nhật vector mới (`ADD_VECTOR`) hoặc vô hiệu hóa vector (`DELETE_VECTOR`) tới Kiosk. | WebSocket STOMP | Must | `API-SYS-015`, `FR-BE-007` | Kiosk nhận được bản tin cập nhật trong $\le 50\text{ ms}$ để tự động nạp/xóa vector trong RAM không cần khởi động lại. | Approved |
| `API-BE-013` | Kênh STOMP Topic `/topic/live-attendance`: Đẩy bản tin sự kiện điểm danh trực tiếp lên bảng Live Dashboard của nhân sự. | WebSocket STOMP | Must | `API-SYS-016`, `FR-BE-007` | Dashboard Web Portal nhận được sự kiện trong $\le 50\text{ ms}$ kể từ khi Backend xử lý xong bản ghi punch. | Approved |
| `API-BE-014` | Kênh STOMP Topic `/topic/enrollment/{otp}`: Thông báo trạng thái đăng ký khuôn mặt tại Kiosk thành công về Web của nhân viên. | WebSocket STOMP | Must | `API-SYS-016`, `FR-BE-007` | Web Portal nhân viên tự động đóng modal hướng dẫn và chuyển trạng thái hoàn tất ngay khi Kiosk hoàn thành nạp mẫu. | Approved |

---

## 2. Operations & Contract Rules (Quy tắc Thao tác & Ràng buộc Hợp đồng)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `API-BE-015` | Ràng buộc Xác thực & Phân quyền Bảo vệ Giao diện: Mọi API nội bộ yêu cầu xác thực Bearer JWT hoặc Header `X-Kiosk-Id` kèm Secret Token. | Security | Must | `SRS-005`, `FR-BE-001` | Trả về HTTP 401 Unauthorized khi thiếu/sai token; trả về HTTP 403 Forbidden khi truy cập vượt quyền hạn. | Approved |
| `API-BE-016` | Chuẩn hóa Định dạng Trao đổi Dữ liệu & Báo lỗi RFC 7807 ProblemDetails: Toàn bộ phản hồi sử dụng JSON UTF-8, mốc thời gian ISO-8601 kèm múi giờ. | Contract | Must | `NFR-SYS-008`, `API-SYS-017` | Lỗi nghiệp vụ hoặc hệ thống trả về đúng cấu trúc ProblemDetails kèm mã lỗi (`code`) và chi tiết trường vi phạm (`invalidParams`). | Approved |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Bảo mật Kênh Truyền thông (Transport Security)**: Toàn bộ các giao diện REST và WebSocket STOMP đều chạy trên nền giao thức TLS 1.3 (HTTPS và WSS) trong môi trường triển khai thực tế; môi trường phát triển nội bộ cho phép thử nghiệm qua HTTP/WS cổng 8080.
* **Quy mô STOMP Broker Cục bộ**: Message Broker in-memory của Spring Boot hiện tại đáp ứng tốt lưu lượng truyền tin cho tối đa 50 trạm Kiosk và hàng trăm phiên Web đồng thời; trường hợp mở rộng quy mô đa cụm máy chủ Backend sẽ chuyển đổi sang External Message Broker (RabbitMQ) thông qua cấu hình `StompBrokerRelay`.

