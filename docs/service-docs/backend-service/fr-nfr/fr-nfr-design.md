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

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Quản lý Master Key Mã hóa**: Biến môi trường `ENCRYPTION_MASTER_KEY` phải là chuỗi Hex 64 ký tự (256-bit). Khi khởi động, `BiometricCryptoService` kiểm tra tính hợp lệ của khóa; nếu thiếu hoặc sai định dạng, ứng dụng từ chối khởi động để ngăn chặn ghi dữ liệu lỗi.
* **Quy mô Bộ đệm Caffeine Cache**: Cấu hình Caffeine Cache lưu tối đa 10,000 khóa `empId_punchDate` với thời gian hết hạn sau khi ghi (`expireAfterWrite`) là 120 giây; tiêu tốn chưa đến 5MB RAM máy chủ.

