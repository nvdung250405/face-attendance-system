---
title: Backend FR/NFR Detailed Design
version: 1.0
status: Approved
owner: Backend Lead & Software Architect
---

# FR/NFR DESIGN — Thiết kế Kỹ thuật Phân hệ Backend

## 1. Structure (Cấu trúc Thành phần Kỹ thuật Backend)

### 1.1. Components & Logic (Thành phần Nghiệp vụ)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-BE-001` | Bộ Lọc Bảo mật & Xác thực JWT | Quản lý chuỗi lọc Security, phân tích Header `Authorization: Bearer <token>`, trích xuất Claims người dùng và gán SecurityContext đa vai trò (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`). | `STK-011` | `FR-BE-001` | `DD-SYS-001`, `DD-BE-001` | Accepted |
| `SOL-BE-002` | Dịch vụ Xử lý Điểm danh Cốt lõi | Tiếp nhận bản ghi từ Kiosk, thẩm định ca làm việc, tính toán trạng thái (On-time, Late, Early Leave) và lưu bản ghi vào CSDL PostgreSQL. | `STK-011`, `STK-013` | `FR-BE-002`, `NFR-BE-001` | `DD-SYS-007` | Accepted |
| `SOL-BE-003` | Dịch vụ Đồng bộ Bù Ngoại tuyến | Xử lý giao dịch hàng loạt (Batch Processing) cho gói tối đa 50 bản ghi, sử dụng `UPSERT` / `ON CONFLICT DO NOTHING` chống trùng lặp dữ liệu. | `STK-013` | `FR-BE-003` | `DD-SYS-002` | Accepted |
| `SOL-BE-004` | Dịch vụ Mã hóa Sinh trắc học | Đóng gói thuật toán AES-256-GCM với IV ngẫu nhiên 12-byte; mã hóa trước khi ghi và giải mã khi Kiosk tải danh mục vector 512D. | `STK-010` | `FR-BE-004`, `FR-BE-006`, `NFR-BE-003` | `DD-SYS-003`, `DD-BE-004` | Accepted |
| `SOL-BE-005` | Quản lý Vòng đời Đăng ký OTP | Sinh mã ngẫu nhiên 6 số, băm BCrypt lưu CSDL với hạn 48h; đối soát khi Kiosk gửi yêu cầu và phát sự kiện hoàn tất kích hoạt nhân sự. | `STK-011` | `FR-BE-005`, `FR-BE-006` | `DD-SYS-003`, `DD-BE-001` | Accepted |
| `SOL-BE-006` | Bộ Phát sóng Sự kiện STOMP | Tích hợp `SimpMessagingTemplate`, phát thông điệp tới topic tương ứng khi có điểm danh mới (`/topic/live-attendance`) hoặc cập nhật gallery (`/topic/kiosk-gallery`). | `STK-012` | `FR-BE-007` | `DD-SYS-004` | Accepted |
| `SOL-BE-007` | Hệ thống Ghi vết Kiểm toán Bất biến | Spring AOP Interceptor tự động bắt các sự kiện thay đổi dữ liệu bảng nhạy cảm, lưu vào bảng `audit_logs` với đầy đủ ngữ cảnh người thao tác. | `STK-011`, `STK-013` | `FR-BE-008`, `NFR-BE-005` | `DD-BE-002` | Accepted |
| `SOL-BE-008` | Tác vụ Tiêu hủy Dữ liệu Định kỳ | Spring `@Scheduled(cron = "0 0 1 * * ?")` quét CSDL và tiêu hủy vĩnh viễn (Hard Delete) toàn bộ bản ghi `biometric_templates` của nhân viên đã thôi việc quá 20 ngày. | `STK-011`, `STK-013` | `FR-BE-009` | `DD-SYS-003` | Accepted |
| `SOL-BE-014` | Dịch vụ Quản lý Hồ sơ Nhân sự & Tài khoản | Khởi tạo hồ sơ nhân sự kèm tài khoản: chuẩn hóa `employee_code`/`email`, sinh mật khẩu tạm ngẫu nhiên (băm BCrypt, trả về đúng một lần), bật cờ buộc đổi mật khẩu; cập nhật họ tên/email/phòng ban/vai trò; vô hiệu hóa nhân sự bằng `status = TERMINATED` + `terminated_date`; mọi thay đổi phát sinh một bản ghi `audit_logs`. | `STK-011`, `STK-013` | `FR-BE-010`, `FR-BE-011` | `DD-BE-013`, `DD-BE-002` | Accepted |
| `SOL-BE-015` | Bộ Chặn Nghiệp vụ Buộc đổi Mật khẩu | Sau khi xác thực JWT, nếu tài khoản còn cờ `must_change_password` thì chặn mọi endpoint nghiệp vụ và trả HTTP 403 `PASSWORD_CHANGE_REQUIRED`; chỉ cho phép `POST /api/v1/auth/change-password` và `POST /api/v1/auth/refresh`; đổi mật khẩu thành công xóa cờ trong cùng giao dịch. | `STK-011` | `FR-BE-011` | `DD-BE-014`, `DD-SYS-001` | Accepted |

### 1.2. Quality Mechanisms (Cơ chế Đảm bảo Chất lượng & Hiệu năng)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-BE-009` | Bộ Kiểm soát Cooldown 120s Máy chủ | Cơ chế đệm bộ nhớ trong (In-Memory Cache) với TTL 120s khóa `empId_punchDate`, chặn ngay lượt quẹt lặp lại từ cùng một nhân viên trước khi truy vấn CSDL. | `STK-013` | `FR-BE-002`, `NFR-BE-001` | `DD-SYS-006`, `DD-BE-003` | Accepted |
| `SOL-BE-010` | Cấu hình Connection Pool HikariCP | Cấu hình HikariCP tối ưu cho 50 trạm Kiosk đồng thời: `maximum-pool-size=20`, `connection-timeout=5000ms`, `leak-detection-threshold=2000ms`. | `STK-013` | `NFR-BE-001`, `NFR-BE-002` | `DD-SYS-001` | Accepted |
| `SOL-BE-011` | Khả năng Kháng lỗi & Giám sát Sức khỏe | Thiết kế kiến trúc Stateless không lưu trạng thái phiên trên máy chủ, tích hợp Spring Boot Actuator endpoint `/actuator/health` phục vụ giám sát và tự phục hồi kết nối CSDL. | `STK-011` | `NFR-BE-004` | `DD-SYS-001` | Accepted |

---

## 2. Behavior (Diễn biến Luồng Xử lý Nghiệp vụ)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-BE-012` | Luồng Xử lý Điểm danh Thời gian thực | Tiếp nhận punch từ Kiosk $\rightarrow$ Kiểm tra xác thực `X-Kiosk-Id` $\rightarrow$ Thẩm định Cooldown 120s $\rightarrow$ Tính toán ca kíp $\rightarrow$ Lưu PostgreSQL $\rightarrow$ Phát sóng STOMP $\rightarrow$ Phản hồi HTTP 200 $\le 100\text{ ms}$. | `SOL-BE-002`, `SOL-BE-006`, `SOL-BE-009` | `FR-BE-002`, `NFR-BE-001` | `DD-SYS-004`, `DD-SYS-006` | Accepted |
| `SOL-BE-013` | Luồng Vòng đời Đăng ký Mẫu Khuôn mặt OTP | Nhân viên ký Consent trên Web $\rightarrow$ Backend sinh mã OTP 6 số (hạn 48h) $\rightarrow$ Kiosk xác minh OTP $\rightarrow$ Backend nhận vector 512D $\rightarrow$ Mã hóa AES-256-GCM $\rightarrow$ Lưu PostgreSQL $\rightarrow$ Kích hoạt `ACTIVE` $\rightarrow$ Broadcast gallery. | `SOL-BE-004`, `SOL-BE-005`, `SOL-BE-006` | `FR-BE-005`, `FR-BE-006` | `DD-SYS-003`, `DD-SYS-004` | Accepted |
| `SOL-BE-016` | Dịch vụ Mã PIN Dự phòng & Thẩm định PIN | Nhân viên thiết lập PIN 6 số (nhập lại để xác nhận) hoặc đổi PIN (yêu cầu PIN hiện tại), lưu băm một chiều vào `users.pin_hash`; Kiosk gọi Backend thẩm định PIN: đúng trả định danh nhân viên, sai trả 401 `PIN_INVALID`, sai 5 lần liên tiếp đặt `pin_locked_until = NOW() + 15m` và trả 423 `PIN_LOCKED`; không có bản ghi điểm danh nào được tạo khi thẩm định thất bại. | `STK-011`, `STK-013` | `FR-BE-012` | `DD-BE-015`, `DD-SYS-012` | Accepted |
| `SOL-BE-017` | Dịch vụ Quản lý Ca kíp & Phân ca | Quản lý danh mục ca (mã duy nhất, giờ bắt đầu/kết thúc, ân hạn 0-60 phút, cờ kích hoạt) và phân ca theo khoảng hiệu lực; kiểm tra chồng lấn trong giao dịch có khóa theo `user_id`; cung cấp ca đang hiệu lực cho luồng chấm công và trả `ANOMALOUS` khi nhân viên chưa được phân ca. | `STK-011`, `STK-012` | `FR-BE-013`, `DATA-BE-017` | `DD-BE-017`, `DD-SYS-018` | Accepted |
| `SOL-BE-018` | Dịch vụ Xử lý Đơn Giải trình Công | Nhân viên nộp đơn cho một bản ghi điểm danh thuộc chính mình (trong 30 ngày gần nhất, trạng thái `PENDING`); HR duyệt hoặc từ chối; khi duyệt, điều chỉnh `attendance_logs` trong cùng giao dịch với việc đổi trạng thái đơn và ghi `audit_logs` giá trị trước/sau. | `STK-011` | `FR-BE-014`, `FR-BE-015`, `DATA-BE-018` | `DD-BE-018`, `DD-SYS-021` | Accepted |
| `SOL-BE-019` | Dịch vụ Tra cứu Kiểm toán & Tuân thủ | Truy vấn chỉ đọc `audit_logs` (ADMIN) và dữ liệu Consent/lịch trình tiêu hủy (DPO) với chỉ mục tra cứu; không tồn tại nhánh ghi/sửa/xoá trên `audit_logs`; role `DPO` chỉ được cấp quyền đọc. | `STK-011` | `FR-BE-016`, `DATA-BE-020` | `DD-BE-019`, `DD-SYS-019` | Accepted |
| `SOL-BE-020` | Dịch vụ Quản lý Trạm Kiosk | Đăng ký trạm kèm sinh Secret Token hiển thị một lần và lưu băm một chiều, đổi token (vô hiệu hóa token cũ ngay), vô hiệu hóa trạm và cập nhật `last_ping_at` mỗi lượt xác thực hợp lệ; trạm `INACTIVE` bị từ chối ở mọi giao diện Kiosk. | `STK-011`, `STK-012` | `FR-BE-017`, `DATA-BE-019` | `DD-BE-020`, `DD-SYS-020` | Accepted |

### 2.1. Biểu đồ Tuần tự Xử lý Điểm danh (`SOL-BE-012`)

```text
Trạm Kiosk                KioskAuthFilter       AttendanceService      CaffeineCache     PostgreSQL DB      StompBroadcaster     Web Portal
    │                           │                      │                     │                 │                   │              │
    │── POST /api/v1/punch ────►│                      │                     │                 │                   │              │
    │   (X-Kiosk-Id, Token)     │── Thẩm định Token ──►│                     │                 │                   │              │
    │                           │                      │── Check Cooldown ──►│                 │                   │              │
    │                           │                      │◄─ [Not Exists] ─────│                 │                   │              │
    │                           │                      │── Ghi nhận Cooldown─►│                 │                   │              │
    │                           │                      │── Đối chiếu Ca kíp ──────────────────►│                   │              │
    │                           │                      │◄─ [Thông tin Shift] ──────────────────│                   │              │
    │                           │                      │── INSERT attendance_log ─────────────►│                   │              │
    │                           │                      │◄─ [Commit Success] ───────────────────│                   │              │
    │                           │                      │── Broadcast /topic/live-attendance ──────────────────────►│              │
    │                           │                      │                                                           │── Đẩy JSON ─►│
    │◄── HTTP 200 OK (<=100ms) ─┴──────────────────────│                                                           │              │
```

---

## 3. Decisions (Quyết định Thiết kế Nghiệp vụ & Kỹ thuật)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-BE-001` | Băm mật khẩu người dùng và mã OTP bằng BCrypt ($cost = 12$). | BCrypt tự động sinh muối (salt) và có độ phức tạp tính toán cao, chống lại hiệu quả các cuộc tấn công tra cứu bảng cầu vồng (Rainbow Table) và vét cạn (Brute-force). | SHA-256 thuần, Argon2id, PBKDF2 | Tăng tải CPU khi xác thực OTP hoặc đăng nhập nhưng bảo vệ tối đa an toàn mật khẩu. | `FR-BE-001`, `FR-BE-005` | Accepted |
| `DD-BE-002` | Áp dụng Spring AOP Interceptor cho việc ghi vết kiểm toán thay vì ghi log thủ công tại Service. | Tách biệt hoàn toàn mối quan tâm (Separation of Concerns), ngăn ngừa việc quên ghi log khi phát triển tính năng mới và tập trung hóa cấu trúc dữ liệu audit. | Ghi log thủ công trong từng Service, Sử dụng Hibernate Envers | Cần cấu hình Pointcut chuẩn xác để không bắt nhầm các phương thức đọc query dữ liệu thông thường. | `FR-BE-008`, `NFR-BE-005` | Accepted |
| `DD-BE-003` | Kiểm soát Cooldown 120s tầng máy chủ bằng Caffeine Cache in-memory. | Giảm $95\%$ áp lực truy vấn kiểm tra trùng lặp xuống CSDL PostgreSQL trong giờ cao điểm điểm danh đầu ca, đảm bảo độ trễ phản hồi API luôn $\le 100\text{ ms}$. | Truy vấn SELECT trực tiếp PostgreSQL, Dùng Redis cache ngoài | Dữ liệu cooldown lưu trong RAM máy chủ đơn cụm; khi restart máy chủ bộ đệm sẽ được làm mới. | `FR-BE-002`, `NFR-BE-001` | Accepted |
| `DD-BE-004` | Mã hóa vector sinh trắc học ArcFace bằng AES-256-GCM với IV 12-byte ngẫu nhiên. | Chuẩn mã hóa có xác thực (Authenticated Encryption) bảo vệ tính bí mật và toàn vẹn dữ liệu sinh trắc học; IV sinh mới mỗi lần ghi ngăn chặn suy đoán mã hóa lặp. | AES-CBC với HMAC riêng, RSA bất đối xứng | Phải lưu trữ riêng cột IV (12 bytes) và Auth Tag (16 bytes) đi kèm chuỗi ciphertext BYTEA trong PostgreSQL. | `FR-BE-006`, `NFR-BE-003` | Accepted |
| `DD-BE-013` | Cấp mật khẩu ban đầu bằng mật khẩu tạm do hệ thống sinh, bắt buộc đổi ở lần đăng nhập đầu tiên. | Backend là nơi duy nhất sinh và băm mật khẩu nên HR không phải nghĩ/ghi nhớ mật khẩu của nhân viên; không cần hạ tầng gửi thư điện tử; mọi tài khoản kết thúc bằng mật khẩu cá nhân do nhân viên tự đặt. | HR tự nhập mật khẩu ban đầu; gửi email kèm liên kết đặt mật khẩu (cần bổ sung mail stack) | Phát sinh cờ `must_change_password` và bộ chặn nghiệp vụ `SOL-BE-015`; mật khẩu tạm chỉ hiển thị một lần nên HR phải bàn giao ngay. | `FR-BE-011`, `API-BE-017`, `API-BE-020` | Accepted |
| `DD-BE-014` | Chặn nghiệp vụ bằng bộ lọc sau xác thực JWT thay vì xử lý trong từng controller. | Bảo đảm không endpoint nghiệp vụ nào bị bỏ sót khi bổ sung sau này; tách biệt mối quan tâm giữa xác thực và vòng đời thông tin xác thực. | Kiểm tra thủ công trong từng controller; chặn ngay trong chuỗi Spring Security Filter | Cần danh sách trắng endpoint (đổi mật khẩu, refresh token) và khi thêm endpoint mới phải cân nhắc danh sách này. | `FR-BE-011`, `API-BE-020`, `API-SYS-021` | Accepted |
| `DD-BE-015` | Thẩm định mã PIN tại máy chủ, giữ nguyên băm PIN trong Backend và phân biệt lỗi sai PIN với lỗi khóa brute-force. | Băm PIN không bao giờ rời máy chủ; trạm Kiosk chỉ nhận kết quả thẩm định; tách mã lỗi `PIN_INVALID` (401) và `PIN_LOCKED` (423) giúp Kiosk hiển thị đúng thông điệp và đếm ngược khóa 15 phút. | Thẩm định cục bộ tại Kiosk bằng băm PIN tải kèm Gallery; gộp chung một mã lỗi cho mọi trường hợp thất bại | Luồng điểm danh bằng PIN bắt buộc có kết nối mạng tới Backend; mọi hành vi thẩm định PIN tập trung một nơi để kiểm thử. | `FR-BE-012`, `API-BE-022`, `DATA-SYS-012` | Accepted |
| `DD-BE-017` | Kiểm tra chồng lấn lịch phân ca ở tầng dịch vụ trong giao dịch có khóa theo `user_id`, không dựa vào ràng buộc loại trừ của PostgreSQL. | Đồng bộ với `DD-SYS-018`; PostgreSQL cần extension `btree_gist` cho `EXCLUDE USING gist` trên khoảng ngày, không chạy được trên profile kiểm thử H2; kiểm tra nghiệp vụ cho thông điệp 409 rõ ràng và kiểm thử được ở mọi môi trường. | Chỉ dùng `EXCLUDE USING gist` (phụ thuộc extension, không chạy trên H2); không kiểm tra (cho phép dữ liệu công sai lệch) | Cần khóa theo `user_id` để tránh hai yêu cầu phân ca đồng thời cùng vượt qua kiểm tra; bổ sung chỉ mục `(user_id, effective_from, effective_to)` và ca kiểm thử âm. | `FR-BE-013`, `DATA-BE-017`, `DD-SYS-018` | Accepted |
| `DD-BE-018` | Duyệt đơn giải trình cập nhật bản ghi điểm danh trong cùng giao dịch với việc đổi trạng thái đơn và ghi `audit_logs`; nhân viên chỉ nộp được cho bản ghi của chính mình trong 30 ngày gần nhất. | Tránh trạng thái nửa vời (đơn đã duyệt nhưng bảng công chưa điều chỉnh); giới hạn 30 ngày ngăn việc sửa dữ liệu công đã chốt/kết xuất báo cáo; vết kiểm toán luôn khớp dữ liệu. | Cập nhật bảng công bằng tác vụ nền (trễ, khó truy vết); cho phép nộp đơn vô thời hạn (phá vỡ dữ liệu công đã chốt) | Cần khoá bản ghi điểm danh khi duyệt để tránh hai đơn cùng sửa một bản ghi; đơn đã `APPROVED`/`REJECTED` không đổi trạng thái lần nữa. | `FR-BE-014`, `FR-BE-015`, `API-BE-029`, `DD-SYS-021` | Accepted |
| `DD-BE-019` | Tra cứu `audit_logs` và dữ liệu tuân thủ qua API chỉ đọc; role `DPO` tách khỏi `ADMIN`; không tồn tại repository cập nhật/xoá cho `audit_logs`. | Giữ nguyên tính bất biến của nhật ký (`NFR-BE-005`) trong khi vẫn đáp ứng quyền hạn của `ACT-003`/`ACT-004`; đặc quyền tối thiểu cho dữ liệu cá nhân. | Cho `ADMIN` làm mọi tra cứu (vi phạm least privilege); đọc trực tiếp CSDL bằng công cụ ngoài (không ghi vết, khó kiểm soát) | Cần bổ sung role `DPO` vào RBAC và danh sách trắng endpoint chỉ đọc; cần ca kiểm thử âm cho role không đủ quyền. | `FR-BE-016`, `API-BE-030`, `API-BE-031`, `DD-SYS-019` | Accepted |
| `DD-BE-020` | Secret Token trạm Kiosk sinh một lần và băm một chiều; đổi token vô hiệu hóa token cũ ngay lập tức; vô hiệu hóa trạm thay vì xoá bản ghi. | Đồng bộ với `DD-SYS-020`; bảo toàn tham chiếu `attendance_logs.kiosk_id`; tránh lưu plaintext token; cho phép thu hồi tức thì khi trạm mất thiết bị. | Lưu token plaintext (rò rỉ toàn bộ trạm nếu lộ CSDL); xoá bản ghi trạm (mất lịch sử điểm danh theo trạm) | Token chỉ hiển thị một lần buộc quy trình bàn giao phải lưu tạm an toàn; bộ lọc xác thực Kiosk phải kiểm tra trạng thái hoạt động của trạm. | `FR-BE-017`, `API-BE-032`, `API-BE-033`, `DD-SYS-020` | Accepted |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Quản lý Master Key Mã hóa**: Biến môi trường `ENCRYPTION_MASTER_KEY` phải là chuỗi Hex 64 ký tự (256-bit). Khi khởi động, `BiometricCryptoService` kiểm tra tính hợp lệ của khóa; nếu thiếu hoặc sai định dạng, ứng dụng từ chối khởi động để ngăn chặn ghi dữ liệu lỗi.
* **Quy mô Bộ đệm Caffeine Cache**: Cấu hình Caffeine Cache lưu tối đa 10,000 khóa `empId_punchDate` với thời gian hết hạn sau khi ghi (`expireAfterWrite`) là 120 giây; tiêu tốn chưa đến 5MB RAM máy chủ.

