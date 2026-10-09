---
title: Backend Service Subsystem Specification (Backend Spec Core)
version: 3.1
status: Approved
owner: Backend Lead & Software Architect
type: spec
scope: BE
updated: 2026-10-09
---

# SUBSYSTEM SPEC CORE — Phân hệ Dịch vụ Trung tâm Backend (`backend-service`)

Tài liệu này là **Spec Core của Phân hệ Backend** (`backend-service`) theo chuẩn SDLC v3.x ([sdlc-docs.md](../../../sdlc-docs.md) §7.2). Tài liệu hợp nhất toàn diện:
1. Bối cảnh vận hành, ranh giới kỹ thuật và sơ đồ kiến trúc điều phối của phân hệ Backend.
2. Danh mục 25 Yêu cầu Chức năng Phân hệ Backend (`FR-BE-001` đến `FR-BE-025`).
3. Danh mục 5 Yêu cầu Phi chức năng Phân hệ Backend đo lường được (`NFR-BE-001` đến `NFR-BE-005`).
4. Kiến trúc tầng phân hệ, danh mục 28 giải pháp kỹ thuật (`SOL-BE-001` đến `SOL-BE-028`) và các sơ đồ tuần tự xử lý thời gian thực.
5. Danh mục 26 Quyết định Kỹ thuật Phân hệ Backend (`DD-BE-001` đến `DD-BE-026`).
6. Giả định và ranh giới phạm vi của phân hệ Backend.

---

## 1. Bối cảnh & Ranh giới Kỹ thuật (Subsystem Context & Scope)

Phân hệ **Backend Service** (`backend-service`) đóng vai trò là "bộ não" trung tâm và hạt nhân điều phối của toàn bộ Hệ thống Điểm danh Khuôn mặt:
* **Nền tảng Công nghệ**: Java 21 LTS, Spring Boot 3.4.x, PostgreSQL 16, Caffeine Cache, WebSocket STOMP.
* **Giao tiếp Biên (Edge Integration)**: Cung cấp REST API hiệu năng cao tiếp nhận giao dịch điểm danh và đồng bộ ngoại tuyến từ trạm Kiosk (`kiosk-app`); phát sóng cập nhật danh mục vector tức thời qua STOMP.
* **Cung cấp Dịch vụ Nghiệp vụ (Web Portal Services)**: Cung cấp API quản lý nhân sự, phân ca, duyệt đơn giải trình, chốt kỳ công, báo cáo kiểm toán cho quản trị viên/HR và giao diện tự phục vụ cho nhân viên (`web-portal`).
* **Bảo vệ Dữ liệu & Tuân thủ Pháp lý (Compliance & Data Protection)**: Mã hóa tĩnh dữ liệu sinh trắc học AES-256-GCM, quản lý vòng đời Informed Consent, tự động quét tiêu hủy vector sau 20 ngày nghỉ việc theo Luật Bảo vệ Dữ liệu Cá nhân (Nghị định 13/2023/NĐ-CP và Luật 91/2025/QH15).

```mermaid
graph TD
    subgraph Client_Tier["Tầng Thiết bị & Ứng dụng Khách"]
        Kiosk["Kiosk App Desktop (PySide6)"]
        WebAdmin["Web Portal HR / Admin (React/TS)"]
        WebEmployee["Web Portal Nhân viên (React/TS)"]
    end

    subgraph Backend_Subsystem["Phân hệ Backend Service (Spring Boot 3.4.x)"]
        SecurityFilter["Spring Security Filter Chain (JWT & Kiosk Auth)"]
        RestControllers["REST Controllers (Kiosk, Auth, Admin, Employee, DPO)"]
        StompBroker["WebSocket STOMP In-Memory Broker"]
        
        subgraph Business_Services["Tầng Nghiệp vụ Dịch vụ (Spring Services)"]
            AttendanceService["Attendance & Cooldown Engine"]
            BiometricService["Biometric Crypto & Retention Service"]
            ShiftService["Shift & Schedule Manager"]
            HRService["Employee & Credential Lifecycle"]
            AuditService["Audit Trail & Compliance Engine"]
        end

        Cache["In-Memory Caffeine Cache (Cooldown 120s)"]
    end

    subgraph Data_Tier["Tầng Lưu trữ Trung tâm"]
        PostgresDB[("PostgreSQL 16 3NF + Flyway")]
    end

    Kiosk -->|REST HTTPS / STOMP WSS| SecurityFilter
    WebAdmin -->|REST HTTPS / STOMP WSS| SecurityFilter
    WebEmployee -->|REST HTTPS / STOMP WSS| SecurityFilter

    SecurityFilter --> RestControllers
    RestControllers --> Business_Services
    Business_Services --> Cache
    Business_Services --> PostgresDB
    Business_Services --> StompBroker
    StompBroker -.->|Push events| Kiosk
    StompBroker -.->|Push events| WebAdmin
```

---

---

## 2. Requirements (Yêu cầu Kỹ thuật Phân hệ Backend)

### 2.1. Yêu cầu Chức năng (Functional Requirements)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `FR-BE-001` | Xác thực đăng nhập người dùng và cấp phát JWT token có thời hạn kèm phân quyền RBAC (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`, `DPO`). | Auth / Security | Must | `SRS-005`, `SRS-006`, `ACT-001`, `ACT-002`, `ACT-004` | Đăng nhập thành công trả về cặp Access Token (1h) & Refresh Token (7 ngày); mã hóa mật khẩu BCrypt ($cost = 12$); chặn truy cập trái quyền trả về HTTP 403 Forbidden; role `DPO` chỉ được truy cập các giao diện tra cứu tuân thủ ở chế độ chỉ đọc. | Approved |
| `FR-BE-002` | Tiếp nhận và xử lý bản ghi điểm danh thời gian thực từ trạm Kiosk, đối chiếu ca đang hiệu lực từ lịch phân ca để ghi nhận trạng thái đi làm/đi muộn/về sớm và áp dụng cooldown 120s phía máy chủ. | Core Attendance | Must | `FR-SYS-005`, `FR-SYS-012`, `FR-SYS-018` | Phản hồi trong $\le 100\text{ ms}$; tra cứu ca đang hiệu lực của nhân viên từ `employee_shifts` và tính `late_minutes` theo thời gian ân hạn của ca; nhân viên **chưa được phân ca** nhận trạng thái `ANOMALOUS`; chặn quẹt lặp cùng nhân viên trong 120s qua bộ nhớ đệm. | Approved |
| `FR-BE-003` | Tiếp nhận gói lô đồng bộ bù ngoại tuyến từ Kiosk, thực hiện ghi nhận không trùng lặp và bảo toàn mốc giờ thực tế. | Offline Sync | Must | `FR-SYS-006` | Hỗ trợ gói lô tối đa 50 bản ghi; trả về danh sách ID đã lưu thành công; loại bỏ trùng lặp qua ràng buộc khóa tự nhiên `(user_id, punch_timestamp, punch_type)`. | Approved |
| `FR-BE-004` | Cung cấp API tải toàn bộ danh mục vector sinh trắc học ArcFace phục vụ trạm Kiosk nạp vào bộ nhớ RAM. | Biometric Distribution | Must | `FR-SYS-003`, `FR-SYS-014` | Trả về danh sách nhân viên đang kích hoạt (`ACTIVE`) kèm vector 512D đã giải mã; xác thực qua header bí mật `X-Kiosk-Id` và Kiosk Secret Token. | Approved |
| `FR-BE-005` | Khởi tạo phiên đăng ký khuôn mặt mới, sinh mã OTP 6 số ngẫu nhiên có hiệu lực 48 giờ sau khi nhân viên ký cam kết Informed Consent. | Enrollment Lifecycle | Must | `FR-SYS-007`, `FR-SYS-008` | Chỉ sinh OTP khi bản ghi `consent_signed_at` hợp lệ; lưu vết OTP mã hóa BCrypt; vô hiệu hóa mã cũ khi sinh mã mới; hết hạn sau 48 giờ; **không** sinh OTP khi Consent đã bị rút (`FR-BE-022`). | Approved |
| `FR-BE-006` | Xác thực mã OTP và tiếp nhận vector 512D từ Kiosk, mã hóa bằng AES-256-GCM trước khi lưu trữ vào CSDL PostgreSQL. | Crypto / Biometric | Must | `FR-SYS-008`, `FR-SYS-010` | Khóa mã hóa quản lý tách biệt qua biến môi trường; vector thô không bao giờ lưu đĩa; kích hoạt trạng thái nhân sự thành `ACTIVE` sau khi nạp mẫu. | Approved |
| `FR-BE-007` | Phát sóng sự kiện thời gian thực qua WebSocket STOMP tới Kiosk (cập nhật gallery) và Web Portal (bảng chấm công trực tiếp). | Realtime Messaging | Must | `FR-SYS-013`, `FR-SYS-014` | Bản tin đẩy tới subscriber trong vòng $\le 50\text{ ms}$; hỗ trợ topic `/topic/kiosk-gallery` và `/topic/live-attendance`. | Approved |
| `FR-BE-008` | Cung cấp các báo cáo tổng hợp chấm công, kết xuất dữ liệu định dạng Excel chống Formula Injection qua giao diện chuyên trách và tra cứu lịch sử chỉnh sửa giờ công từ nhật ký kiểm toán. | Reporting / Audit | Must | `FR-SYS-016`, `API-SYS-011`, `SRS-007`, `SRS-010` | Kết xuất bảng công tháng cho 1,000 nhân sự trong $\le 3\text{ giây}$ qua endpoint chuyên trách; tự động escape ký tự nguy hiểm (`=`, `+`, `-`, `@`); mọi thao tác sửa đổi giờ công của HR đều truy vết được từ `audit_logs` kèm giá trị trước và sau. | Approved |
| `FR-BE-009` | Thực thi tác vụ quét định kỳ hàng ngày tiêu hủy vĩnh viễn dữ liệu sinh trắc học của nhân viên đã thôi việc quá 20 ngày theo Luật 91/2025/QH15. | Data Retention | Must | `FR-SYS-011`, `SRS-003`, `DATA-SYS-013` | Cron job chạy định kỳ 01:00 hàng ngày; xóa cứng (`HARD DELETE`) các bản ghi `biometric_templates` có nhân viên liên kết ở trạng thái `TERMINATED` quá 20 ngày. | Approved |
| `FR-BE-010` | Quản lý vòng đời hồ sơ nhân sự: khởi tạo hồ sơ kèm tài khoản đăng nhập, cập nhật thông tin hồ sơ và vô hiệu hóa nhân sự khi chấm dứt hợp đồng. | HR Management | Must | `API-SYS-008`, `FR-SYS-017` | Tạo hồ sơ trả về mã nhân viên và mật khẩu tạm hiển thị đúng một lần; từ chối khi trùng `employee_code` hoặc `email`; cập nhật được họ tên, email, phòng ban, vai trò; vô hiệu hóa đặt `status = TERMINATED` kèm `terminated_date` và ghi một bản ghi `audit_logs`. | Approved |
| `FR-BE-011` | Quản lý vòng đời mật khẩu: sinh mật khẩu tạm khi khởi tạo tài khoản và cho phép nhân viên tự đổi mật khẩu bất kỳ lúc nào — **không** bắt buộc, **không** chặn nghiệp vụ. | Auth / Security | Must | `FR-SYS-017`, `API-SYS-021`, `SRS-005` | Mật khẩu tạm sinh ngẫu nhiên, băm BCrypt trước khi lưu và không thể truy xuất lại sau khi trả về; tài khoản dùng mật khẩu tạm gọi được mọi endpoint nghiệp vụ (không tồn tại mã lỗi `PASSWORD_CHANGE_REQUIRED` và không có cờ buộc đổi trong lược đồ); mật khẩu mới tối thiểu 8 ký tự và khác mật khẩu hiện tại; mọi refresh token của tài khoản bị thu hồi ngay sau khi đổi mật khẩu (`FR-BE-020`). | Approved |
| `FR-BE-012` | Quản lý mã PIN dự phòng: cho phép nhân viên tự thiết lập/đổi mã PIN 6 số và thẩm định mã PIN tập trung tại máy chủ trước khi ghi nhận điểm danh. | Auth / Security | Must | `FR-SYS-004`, `FR-SYS-017`, `API-SYS-022`, `API-SYS-023`, `DATA-SYS-012` | PIN lưu dưới dạng băm một chiều; thiết lập lần đầu yêu cầu nhập lại PIN xác nhận; đổi PIN yêu cầu PIN hiện tại; xác thực PIN đúng trả về định danh nhân viên, PIN sai trả 401 `PIN_INVALID`, sai 5 lần liên tiếp trả 423 `PIN_LOCKED` trong 15 phút. | Approved |
| `FR-BE-013` | Quản lý danh mục ca làm việc và phân ca nhân sự theo khoảng ngày hiệu lực, bao gồm kiểm tra chồng lấn và cung cấp ca đang hiệu lực cho luồng chấm công. | HR Management | Must | `FR-SYS-018`, `API-SYS-024`, `API-SYS-025`, `DATA-SYS-017` | Tạo/sửa/vô hiệu hóa ca với mã duy nhất, giờ bắt đầu nhỏ hơn giờ kết thúc và ân hạn 0-60 phút; phân ca trả HTTP 201 và từ chối HTTP 409 khi chồng khoảng hiệu lực của cùng nhân viên; vô hiệu hóa ca đang được phân trả HTTP 409 kèm hướng dẫn xử lý; lịch phân ca tra cứu được theo nhân viên và khoảng ngày. | Approved |
| `FR-BE-014` | Cho phép nhân viên nộp đơn giải trình công cho một lượt chấm cụ thể và theo dõi trạng thái các đơn của chính mình. | HR Management | Must | `FR-SYS-016`, `API-SYS-010`, `ACT-001` | Đơn chỉ được nộp cho bản ghi điểm danh thuộc chính người gửi; trạng thái khởi tạo `PENDING`; chỉ nộp được cho bản ghi trong vòng 30 ngày gần nhất; nhân viên chỉ nhận được đơn của mình. | Approved |
| `FR-BE-015` | Cho phép HR duyệt hoặc từ chối đơn giải trình công; khi duyệt, điều chỉnh bản ghi điểm danh tương ứng trong cùng một giao dịch và ghi nhật ký kiểm toán. | HR Management | Must | `FR-SYS-016`, `API-SYS-010`, `NFR-BE-005` | Duyệt đơn cập nhật `punch_time`/`status` của bản ghi liên quan và ghi một bản ghi `audit_logs` chứa giá trị trước và sau; từ chối bắt buộc kèm lý do; đơn đã `APPROVED`/`REJECTED` không đổi được trạng thái; từ chối (HTTP 409) khi bản ghi công thuộc kỳ đã chốt (`FR-BE-021`); yêu cầu role `HR_MANAGER`/`ADMIN`. | Approved |
| `FR-BE-016` | Cung cấp khả năng tra cứu chỉ đọc phục vụ kiểm toán và tuân thủ dữ liệu cá nhân: nhật ký kiểm toán cho Quản trị viên, dữ liệu Consent và lịch trình tiêu hủy sinh trắc cho Cán bộ Bảo vệ Dữ liệu. | Reporting / Audit | Must | `FR-SYS-019`, `API-SYS-026`, `API-SYS-027`, `SRS-010` | Tra cứu `audit_logs` lọc theo khoảng thời gian, tác nhân và loại hành vi, có phân trang; role `DPO` chỉ đọc được Consent và lịch trình tiêu hủy, nhận HTTP 403 ở mọi endpoint ghi; không tồn tại API sửa hoặc xoá `audit_logs`. | Approved |
| `FR-BE-017` | Quản lý vòng đời trạm Kiosk: đăng ký trạm kèm Secret Token hiển thị một lần, đổi token, vô hiệu hóa trạm và cung cấp trạng thái kết nối của từng trạm. | Device Management | Must | `FR-SYS-020`, `API-SYS-028`, `DATA-SYS-019`, `ACT-003` | Secret Token chỉ trả về một lần khi đăng ký hoặc đổi và lưu dạng băm một chiều; trạm `INACTIVE` nhận HTTP 401 ở mọi giao diện Kiosk; đổi token vô hiệu hóa token cũ ngay lập tức; trả về `last_ping_at`; yêu cầu role `ADMIN`. | Approved |
| `FR-BE-018` | Khởi tạo an toàn cho lần triển khai đầu tiên (Bootstrap): tạo tài khoản quản trị đầu tiên qua cấu hình bootstrap có kiểm soát, dùng được ngay bằng mật khẩu tạm và không tồn tại mật khẩu mặc định trong mã nguồn hay kịch bản migration. | Security / Operations | Must | `FR-SYS-021`, `SRS-005`, `SRS-006` | Lần chạy đầu trên CSDL trống tạo đúng một tài khoản `ADMIN` dùng được ngay bằng mật khẩu tạm; gọi lại bootstrap không tạo thêm tài khoản (idempotent); không có mật khẩu mặc định trong mã nguồn, `application.yml` hay kịch bản Flyway. | Approved |
| `FR-BE-019` | Hỗ trợ khôi phục thông tin xác thực: HR/ADMIN cấp lại mật khẩu tạm mới và nhân viên tự đặt lại mã PIN sau khi xác thực bằng mật khẩu của chính mình. | Security / Support | Must | `FR-SYS-022`, `API-SYS-029`, `FR-BE-011`, `FR-BE-012` | Mật khẩu tạm cũ hết hiệu lực ngay và mọi refresh token của tài khoản bị thu hồi; mật khẩu tạm mới chỉ hiển thị một lần; đặt lại PIN yêu cầu mật khẩu hiện tại đúng và vô hiệu hóa PIN cũ; mọi thao tác ghi audit. | Approved |
| `FR-BE-020` | Quản lý vòng đời phiên làm việc: đăng xuất, lưu refresh token dạng băm một chiều và thu hồi token theo tài khoản khi đổi mật khẩu, cấp lại mật khẩu hoặc tài khoản bị vô hiệu hóa. | Auth / Security | Must | `FR-SYS-023`, `API-SYS-030`, `SRS-006`, `DATA-SYS-022` | Đăng xuất trả HTTP 204 và refresh token hiện tại không dùng lại được; refresh token đã thu hồi trả HTTP 401; tài khoản `TERMINATED`/`SUSPENDED` không dùng được cả access token còn hạn; thời hạn access 1 giờ và refresh 7 ngày đọc từ một cấu hình duy nhất. | Approved |
| `FR-BE-021` | Cho phép HR chốt kỳ công theo tháng và từ chối mọi điều chỉnh công hoặc đơn giải trình thuộc kỳ đã chốt. | HR Management | Must | `FR-SYS-024`, `API-SYS-031`, `DATA-SYS-021`, `FR-BE-015` | Chốt kỳ ghi nhận người chốt và mốc thời gian; nộp/duyệt đơn hoặc điều chỉnh công thuộc kỳ `LOCKED` trả HTTP 409; ADMIN mở lại kèm lý do và ghi audit; trạng thái chốt trả về trong báo cáo và bản kết xuất. | Approved |
| `FR-BE-022` | Cho phép nhân viên rút lại Informed Consent và gửi yêu cầu về dữ liệu cá nhân; khi Consent bị rút, điểm danh bằng khuôn mặt bị vô hiệu hóa và dữ liệu sinh trắc bị tiêu hủy trong 7 ngày. | Compliance | Must | `FR-SYS-025`, `API-SYS-032`, `DATA-SYS-023`, `FR-BE-005` | Rút Consent ghi vết bất biến (thời điểm, IP) và đặt hạn tiêu hủy 7 ngày; nhân viên đã rút Consent không còn trong danh mục gallery cấp cho Kiosk và không sinh được OTP mới; yêu cầu truy cập/chỉnh sửa dữ liệu cá nhân được ghi nhận, phản hồi trạng thái và DPO tra cứu được. | Approved |
| `FR-BE-023` | Quản lý vòng đời quyền quản trị: gán/thu hồi role `HR_MANAGER`/`DPO`/`ADMIN`, ghi audit mọi thay đổi và chặn hạ cấp tài khoản ADMIN đang hoạt động cuối cùng. | Security / Governance | Must | `FR-SYS-026`, `API-SYS-033`, `SRS-006` | Gán/thu hồi role trả HTTP 200 kèm audit giá trị trước/sau; thu hồi hoặc hạ cấp ADMIN cuối cùng trả HTTP 409 và không thay đổi dữ liệu; vô hiệu hóa nhân sự thu hồi role trong cùng giao dịch. | Approved |
| `FR-BE-024` | Sinh và phục vụ thông báo trong ứng dụng cho đúng tác nhân theo các sự kiện vòng đời. | Notification | Should | `FR-SYS-027`, `API-SYS-034`, `DATA-SYS-023` | Thông báo được sinh cho các sự kiện: tài khoản được tạo, phiên bị thu hồi, PIN bị khóa, đơn giải trình được xử lý, Consent bị rút và kỳ công đã chốt; người dùng chỉ thấy thông báo của mình và đánh dấu đã đọc được; không gửi email/SMS trong phạm vi MVP. | Approved |
| `FR-BE-025` | Cung cấp giao diện tự phục vụ để nhân viên tra cứu lịch sử chấm công của chính mình theo tháng. | Self-service | Must | `FR-SYS-028`, `API-SYS-035`, `DATA-SYS-004` | Chỉ trả bản ghi thuộc người đang đăng nhập; lọc theo tháng và phân trang; kèm trạng thái công và số phút đi muộn; nhân viên khác không truy cập được dữ liệu này. | Approved |

---

---

### 2.2. Yêu cầu Phi chức năng (Non-functional Requirements)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `NFR-BE-001` | Thời gian phản hồi trung bình của API tiếp nhận điểm danh đạt $\le 100\text{ ms}$ ở bách phân vị $95\%$ (p95). | Performance | Must | `NFR-SYS-001`, `NFR-SYS-003` | Đo kiểm dưới tải đồng thời 50 kết nối Kiosk; sử dụng HikariCP connection pool tối ưu; thời gian ghi nhận điểm danh hoàn tất trong $\le 100\text{ ms}$. | Approved |
| `NFR-BE-002` | Năng lực chịu tải của hệ thống máy chủ đạt tối thiểu $500\text{ req/giây}$ (RPS) trên cấu hình 2 vCPU và 4 GB RAM. | Throughput | Must | `NFR-SYS-004` | Tỷ lệ lỗi HTTP 5xx $< 0.01\%$ khi kiểm thử ngập tải (Stress Testing); mức chiếm dụng CPU $\le 75\%$. | Approved |
| `NFR-BE-003` | 100% dữ liệu vector sinh trắc học và thông tin định danh cá nhân được mã hóa ở trạng thái nghỉ (Encryption-at-Rest). | Security / Privacy | Must | `NFR-SYS-007`, `SRS-001` | Tuân thủ Luật Bảo vệ dữ liệu cá nhân; áp dụng thuật toán AES-256-GCM với IV ngẫu nhiên 12-byte và khóa Master tách biệt. | Approved |
| `NFR-BE-004` | Đảm bảo tính khả dụng của dịch vụ máy chủ đạt $\ge 99.9\%$ thời gian trong tháng (Downtime $\le 43.8\text{ phút/tháng}$). | Availability | Must | `NFR-SYS-008`, `SRS-009` | Thiết kế Stateless kiến trúc, sẵn sàng triển khai cân bằng tải đa phiên bản; endpoint `/actuator/health` phản hồi `UP` liên tục. | Approved |
| `NFR-BE-005` | Toàn bộ các thao tác chỉnh sửa dữ liệu nhạy cảm được ghi nhật ký bất biến (Immutable Audit Trail). | Compliance | Must | `SRS-010`, `NFR-SYS-008` | Nhật ký lưu lại ID người sửa, IP, mốc giờ ISO-8601, giá trị trước và sau khi thay đổi; bảng `audit_logs` chỉ cho phép append-only. | Approved |

---

---

## 3. Architecture & Internal Design (Kiến trúc Nội bộ & Giải pháp Kỹ thuật)

### 3.1. Kiến trúc Tầng Phân hệ (Layered Architecture)

1. **Security & Interception Layer**:
   - `JwtAuthenticationFilter`: Phân tích token Bearer, giải mã Claims, nạp `SecurityContext` cho người dùng Web.
   - `KioskAuthenticationFilter`: Thẩm định tiêu đề `X-Kiosk-Id` và Secret Token băm một chiều của trạm Kiosk.
   - `StompChannelInterceptor`: Thẩm định quyền kết nối và đăng ký lắng nghe từng Topic thời gian thực.
2. **Web / Controller Layer**:
   - Chuẩn hóa định dạng Envelope dữ liệu trả về theo `DD-SYS-012`.
   - Bắt và chuyển đổi ngoại lệ toàn cục qua `@RestControllerAdvice` theo RFC 7807 `ProblemDetails`.
3. **Business Service Layer**:
   - Quản lý giao dịch nguyên tử `@Transactional`.
   - Kiểm soát Cooldown quẹt thẻ 120s bằng bộ nhớ đệm Caffeine.
   - Mã hóa và giải mã vector sinh trắc học AES-256-GCM với IV ngẫu nhiên 12 bytes.
4. **Data Persistence Layer**:
   - Quản lý phiên bản cấu trúc CSDL bằng công cụ Flyway (`V1__initial_schema.sql` đến `V5__drop_must_change_password.sql`).
   - Kết nối CSDL thông qua HikariCP Connection Pool tối ưu cho tải đồng thời.
5. **Scheduled Jobs Layer**:
   - Quét định kỳ hàng ngày lúc 01:00 tiêu hủy dữ liệu sinh trắc học của nhân viên nghỉ việc quá 20 ngày.
   - Quét dọn các phiên OTP quá hạn 48 giờ.

---

---

### 3.2. Danh mục Thành phần Kỹ thuật & Giải pháp (`SOL-BE-`)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-BE-001` | Bộ Lọc Bảo mật & Xác thực JWT | Quản lý chuỗi lọc Security, phân tích Header `Authorization: Bearer <token>`, trích xuất Claims người dùng và gán SecurityContext đa vai trò (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`, `DPO`). | `STK-011` | `FR-BE-001` | `DD-SYS-001`, `DD-BE-001` | Accepted |
| `SOL-BE-002` | Dịch vụ Xử lý Điểm danh Cốt lõi | Tiếp nhận bản ghi từ Kiosk, thẩm định ca làm việc, tính toán trạng thái (On-time, Late, Early Leave) và lưu bản ghi vào CSDL PostgreSQL. | `STK-011`, `STK-013` | `FR-BE-002`, `NFR-BE-001` | `DD-SYS-007` | Accepted |
| `SOL-BE-003` | Dịch vụ Đồng bộ Bù Ngoại tuyến | Xử lý giao dịch hàng loạt (Batch Processing) cho gói tối đa 50 bản ghi, sử dụng `UPSERT` / `ON CONFLICT DO NOTHING` chống trùng lặp dữ liệu. | `STK-013` | `FR-BE-003` | `DD-SYS-002` | Accepted |
| `SOL-BE-004` | Dịch vụ Mã hóa Sinh trắc học | Đóng gói thuật toán AES-256-GCM với IV ngẫu nhiên 12-byte; mã hóa trước khi ghi và giải mã khi Kiosk tải danh mục vector 512D. | `STK-010` | `FR-BE-004`, `FR-BE-006`, `NFR-BE-003` | `DD-SYS-003`, `DD-BE-004` | Accepted |
| `SOL-BE-005` | Quản lý Vòng đời Đăng ký OTP | Sinh mã ngẫu nhiên 6 số, băm BCrypt lưu CSDL với hạn 48h; đối soát khi Kiosk gửi yêu cầu và phát sự kiện hoàn tất kích hoạt nhân sự. | `STK-011` | `FR-BE-005`, `FR-BE-006` | `DD-SYS-003`, `DD-BE-001` | Accepted |
| `SOL-BE-006` | Bộ Phát sóng Sự kiện STOMP | Tích hợp `SimpMessagingTemplate`, phát thông điệp tới topic tương ứng khi có điểm danh mới (`/topic/live-attendance`) hoặc cập nhật gallery (`/topic/kiosk-gallery`). | `STK-012` | `FR-BE-007` | `DD-SYS-004`, `DD-BE-011` | Accepted |
| `SOL-BE-007` | Hệ thống Ghi vết Kiểm toán Bất biến | Spring AOP Interceptor tự động bắt các sự kiện thay đổi dữ liệu bảng nhạy cảm, lưu vào bảng `audit_logs` với đầy đủ ngữ cảnh người thao tác. | `STK-011`, `STK-013` | `FR-BE-008`, `NFR-BE-005` | `DD-BE-002` | Accepted |
| `SOL-BE-008` | Tác vụ Tiêu hủy Dữ liệu Định kỳ | Spring `@Scheduled(cron = "0 0 1 * * ?")` quét CSDL và tiêu hủy vĩnh viễn (Hard Delete) toàn bộ bản ghi `biometric_templates` của nhân viên đã thôi việc quá 20 ngày. | `STK-011`, `STK-013` | `FR-BE-009` | `DD-SYS-003` | Accepted |
| `SOL-BE-009` | Bộ Kiểm soát Cooldown 120s Máy chủ | Cơ chế đệm bộ nhớ trong (In-Memory Cache) với TTL 120s khóa `empId_punchDate`, chặn ngay lượt quẹt lặp lại từ cùng một nhân viên trước khi truy vấn CSDL. | `STK-013` | `FR-BE-002`, `NFR-BE-001` | `DD-SYS-006`, `DD-BE-003` | Accepted |
| `SOL-BE-010` | Cấu hình Connection Pool HikariCP | Cấu hình HikariCP tối ưu cho 50 trạm Kiosk đồng thời: `maximum-pool-size=20`, `connection-timeout=5000ms`, `leak-detection-threshold=2000ms`. | `STK-013` | `NFR-BE-001`, `NFR-BE-002` | `DD-SYS-001` | Accepted |
| `SOL-BE-011` | Khả năng Kháng lỗi & Giám sát Sức khỏe | Thiết kế kiến trúc Stateless không lưu trạng thái phiên trên máy chủ, tích hợp Spring Boot Actuator endpoint `/actuator/health` phục vụ giám sát và tự phục hồi kết nối CSDL. | `STK-011` | `NFR-BE-004` | `DD-SYS-001` | Accepted |
| `SOL-BE-012` | Luồng Xử lý Điểm danh Thời gian thực | Tiếp nhận punch từ Kiosk $\rightarrow$ Kiểm tra xác thực `X-Kiosk-Id` $\rightarrow$ Thẩm định Cooldown 120s $\rightarrow$ Tính toán ca kíp $\rightarrow$ Lưu PostgreSQL $\rightarrow$ Phát sóng STOMP $\rightarrow$ Phản hồi HTTP 200 $\le 100\text{ ms}$. | `SOL-BE-002`, `SOL-BE-006`, `SOL-BE-009` | `FR-BE-002`, `NFR-BE-001` | `DD-SYS-004`, `DD-SYS-006` | Accepted |
| `SOL-BE-013` | Luồng Vòng đời Đăng ký Mẫu Khuôn mặt OTP | Nhân viên ký Consent trên Web $\rightarrow$ Backend sinh mã OTP 6 số (hạn 48h) $\rightarrow$ Kiosk xác minh OTP $\rightarrow$ Backend nhận vector 512D $\rightarrow$ Mã hóa AES-256-GCM $\rightarrow$ Lưu PostgreSQL $\rightarrow$ Kích hoạt `ACTIVE` $\rightarrow$ Broadcast gallery. | `SOL-BE-004`, `SOL-BE-005`, `SOL-BE-006` | `FR-BE-005`, `FR-BE-006` | `DD-SYS-003`, `DD-SYS-004` | Accepted |
| `SOL-BE-014` | Dịch vụ Quản lý Hồ sơ Nhân sự & Tài khoản | Khởi tạo hồ sơ nhân sự kèm tài khoản: chuẩn hóa `employee_code`/`email`, sinh mật khẩu tạm ngẫu nhiên (băm BCrypt, trả về đúng một lần); cập nhật họ tên/email/phòng ban/vai trò; vô hiệu hóa nhân sự bằng `status = TERMINATED` + `terminated_date`; mọi thay đổi phát sinh một bản ghi `audit_logs`. | `STK-011`, `STK-013` | `FR-BE-010`, `FR-BE-011` | `DD-BE-013`, `DD-BE-002` | Accepted |
| `SOL-BE-015` | Bộ Chặn Nghiệp vụ Buộc đổi Mật khẩu | **Deprecated** theo CR: yêu cầu buộc đổi mật khẩu ở lần đăng nhập đầu tiên đã bị rút, nên không còn bộ chặn nghiệp vụ nào dựa trên cờ `must_change_password`. | `STK-011` | `FR-BE-011` | `DD-BE-014`, `DD-SYS-001` | Deprecated |
| `SOL-BE-016` | Dịch vụ Mã PIN Dự phòng & Thẩm định PIN | Nhân viên thiết lập PIN 6 số (nhập lại để xác nhận) hoặc đổi PIN (yêu cầu PIN hiện tại), lưu băm một chiều vào `users.pin_hash`; Kiosk gọi Backend thẩm định PIN: đúng trả định danh nhân viên, sai trả 401 `PIN_INVALID`, sai 5 lần liên tiếp đặt `pin_locked_until = NOW() + 15m` và trả 423 `PIN_LOCKED`; không có bản ghi điểm danh nào được tạo khi thẩm định thất bại. | `STK-011`, `STK-013` | `FR-BE-012` | `DD-BE-015`, `DD-SYS-012` | Accepted |
| `SOL-BE-017` | Dịch vụ Quản lý Ca kíp & Phân ca | Quản lý danh mục ca (mã duy nhất, giờ bắt đầu/kết thúc, ân hạn 0-60 phút, cờ kích hoạt) và phân ca theo khoảng hiệu lực; kiểm tra chồng lấn trong giao dịch có khóa theo `user_id`; cung cấp ca đang hiệu lực cho luồng chấm công và trả `ANOMALOUS` khi nhân viên chưa được phân ca. | `STK-011`, `STK-012` | `FR-BE-013`, `DATA-BE-017` | `DD-BE-017`, `DD-SYS-018` | Accepted |
| `SOL-BE-018` | Dịch vụ Xử lý Đơn Giải trình Công | Nhân viên nộp đơn cho một bản ghi điểm danh thuộc chính mình (trong 30 ngày gần nhất, trạng thái `PENDING`); HR duyệt hoặc từ chối; khi duyệt, điều chỉnh `attendance_logs` trong cùng giao dịch với việc đổi trạng thái đơn và ghi `audit_logs` giá trị trước/sau. | `STK-011` | `FR-BE-014`, `FR-BE-015`, `DATA-BE-018` | `DD-BE-018`, `DD-SYS-021` | Accepted |
| `SOL-BE-019` | Dịch vụ Tra cứu Kiểm toán & Tuân thủ | Truy vấn chỉ đọc `audit_logs` (ADMIN) và dữ liệu Consent/lịch trình tiêu hủy (DPO) với chỉ mục tra cứu; không tồn tại nhánh ghi/sửa/xoá trên `audit_logs`; role `DPO` chỉ được cấp quyền đọc. | `STK-011` | `FR-BE-016`, `DATA-BE-020` | `DD-BE-019`, `DD-SYS-019` | Accepted |
| `SOL-BE-020` | Dịch vụ Quản lý Trạm Kiosk | Đăng ký trạm kèm sinh Secret Token hiển thị một lần và lưu băm một chiều, đổi token (vô hiệu hóa token cũ ngay), vô hiệu hóa trạm và cập nhật `last_ping_at` mỗi lượt xác thực hợp lệ; trạm `INACTIVE` bị từ chối ở mọi giao diện Kiosk. | `STK-011`, `STK-012` | `FR-BE-017`, `DATA-BE-019` | `DD-BE-020`, `DD-SYS-020` | Accepted |
| `SOL-BE-021` | Bộ Khởi tạo Hệ thống & Bootstrap | Tạo tài khoản `ADMIN` đầu tiên trên CSDL trống từ cấu hình bootstrap (biến môi trường hoặc CLI một lần), dùng được ngay bằng mật khẩu tạm; cơ chế idempotent và tự vô hiệu hóa sau khi hoàn tất. | `STK-011` | `FR-BE-018`, `SRS-005` | `DD-BE-021`, `DD-SYS-022` | Accepted |
| `SOL-BE-022` | Dịch vụ Khôi phục Thông tin Xác thực | Cấp lại mật khẩu tạm mới cho nhân sự (vô hiệu hóa mật khẩu tạm cũ, thu hồi toàn bộ phiên, ghi audit) và cho phép nhân viên đặt lại PIN sau khi xác thực bằng mật khẩu hiện tại. | `STK-011` | `FR-BE-019`, `FR-BE-011`, `FR-BE-012` | `DD-BE-022`, `DD-SYS-023` | Accepted |
| `SOL-BE-023` | Dịch vụ Quản lý Phiên & Thu hồi Token | Lưu refresh token dạng băm một chiều kèm hạn dùng và ngữ cảnh đăng nhập; xử lý đăng xuất, thu hồi toàn bộ token theo tài khoản khi đổi/cấp lại mật khẩu hoặc tài khoản bị vô hiệu hóa; từ chối access token của tài khoản không còn hoạt động. | `STK-011`, `STK-012` | `FR-BE-020`, `DATA-BE-022`, `SRS-006` | `DD-BE-023`, `DD-SYS-026` | Accepted |
| `SOL-BE-024` | Dịch vụ Chốt Kỳ công & Khoá Điều chỉnh | Quản lý kỳ công theo tháng với trạng thái `OPEN`/`LOCKED`; cung cấp kiểm tra kỳ đã chốt cho mọi đường nộp/duyệt đơn và điều chỉnh công; cho phép ADMIN mở lại kèm lý do và ghi audit. | `STK-011`, `STK-012` | `FR-BE-021`, `DATA-BE-021`, `FR-BE-015` | `DD-BE-024`, `DD-SYS-024` | Accepted |
| `SOL-BE-025` | Dịch vụ Rút Consent & Yêu cầu Dữ liệu Cá nhân | Ghi vết rút Informed Consent bất biến, loại nhân sự khỏi danh mục gallery cấp cho Kiosk, chặn sinh OTP mới và đặt hạn tiêu hủy dữ liệu sinh trắc 7 ngày; tiếp nhận, cập nhật trạng thái và phản hồi yêu cầu truy cập/chỉnh sửa dữ liệu cá nhân. | `STK-011` | `FR-BE-022`, `DATA-BE-023`, `DATA-BE-024`, `FR-BE-005` | `DD-BE-025`, `DD-SYS-025` | Accepted |
| `SOL-BE-026` | Dịch vụ Vòng đời Quyền Quản trị | Gán và thu hồi role `HR_MANAGER`/`DPO`/`ADMIN` kèm audit giá trị trước/sau; chặn thu hồi hoặc hạ cấp tài khoản `ADMIN` đang hoạt động cuối cùng bằng kiểm tra đếm trong cùng giao dịch; thu hồi role khi vô hiệu hóa nhân sự. | `STK-011` | `FR-BE-023`, `SRS-006` | `DD-BE-026`, `DD-SYS-019` | Accepted |
| `SOL-BE-027` | Dịch vụ Thông báo Trong ứng dụng | Sinh thông báo theo sự kiện vòng đời và phục vụ truy vấn/đánh dấu đã đọc cho đúng người nhận; không dùng email/SMS trong phạm vi MVP. | `STK-011`, `STK-017` | `FR-BE-024`, `DATA-BE-023` | `DD-SYS-025`, `DD-BE-025` | Accepted |
| `SOL-BE-028` | Dịch vụ Tra cứu Lịch sử Công Tự phục vụ | Truy vấn lịch sử chấm công của chính nhân viên đang đăng nhập theo tháng kèm trạng thái công và số phút đi muộn; chỉ trả dữ liệu thuộc người gọi và không cho truy cập chéo người dùng. | `STK-011` | `FR-BE-025`, `DATA-BE-004` | `DD-BE-019`, `DD-SYS-019` | Accepted |

---

---

### 3.3. Luồng Xử lý Nghiệp vụ & Biểu đồ Tuần tự (Behavioral Workflows)

### 4.1. Biểu đồ Tuần tự Xử lý Điểm danh Thời gian thực (`SOL-BE-012`)

```mermaid
sequenceDiagram
    autonumber
    participant Kiosk as Trạm Kiosk
    participant Filter as KioskAuthFilter
    participant Service as AttendanceService
    participant Cache as CaffeineCache (120s)
    participant DB as PostgreSQL DB
    participant Stomp as StompBroadcaster
    participant Web as Web Portal

    Kiosk->>Filter: POST /api/v1/kiosk/punch (X-Kiosk-Id, Bearer Token)
    Filter->>Service: Thẩm định Token & Kiosk
    Service->>Cache: Kiểm tra Cooldown (empId_date)
    alt Đang trong Cooldown 120s
        Cache-->>Service: Exists
        Service-->>Kiosk: HTTP 409 Conflict (COOLDOWN_ACTIVE)
    else Chưa quẹt hoặc hết Cooldown
        Cache-->>Service: Not Exists
        Service->>Cache: Ghi nhận Cooldown (TTL 120s)
        Service->>DB: Đối chiếu Ca kíp đang hiệu lực
        DB-->>Service: Thông tin Shift (start, end, grace_period)
        Service->>DB: INSERT INTO attendance_logs VALUES (...)
        DB-->>Service: Commit Success (ID=9812)
        Service->>Stomp: Broadcast /topic/live-attendance
        Stomp-->>Web: Đẩy JSON điểm danh trực tiếp
        Service-->>Kiosk: HTTP 200 OK (Envelope DD-SYS-012, <= 100ms)
    end
```

### 4.2. Luồng Vòng đời Đăng ký Mẫu Khuôn mặt OTP (`SOL-BE-013`)

1. **Nhân viên ký thỏa thuận số**: Tại Web Portal, nhân viên đồng ý Informed Consent $\rightarrow$ Backend tạo bản ghi `enrollment_sessions` với `consent_signed_at`, IP máy, sinh mã OTP 6 số ngẫu nhiên băm BCrypt (`expires_at = created_at + 48h`).
2. **Xác thực OTP tại Kiosk**: Nhân viên nhập OTP trên màn hình Kiosk $\rightarrow$ Kiosk gọi `POST /api/v1/kiosk/verify-otp` $\rightarrow$ Backend kiểm tra tính hợp lệ và thời hạn.
3. **Thu nhận và Nạp mẫu**: Kiosk trích xuất vector 512D chuẩn hóa $L_2$ gửi kèm mã OTP qua `POST /api/v1/kiosk/enroll-face`.
4. **Mã hóa và Lưu trữ**: Backend sinh IV 12 bytes ngẫu nhiên, mã hóa vector bằng AES-256-GCM, lưu `biometric_templates` dạng `BYTEA`, cập nhật hồ sơ `users.status = 'ACTIVE'`, đánh dấu `is_used = true` cho OTP.
5. **Đồng bộ Tức thời**: Backend phát bản tin STOMP `ADD_VECTOR` tới `/topic/kiosk-gallery` để các trạm Kiosk nạp nóng vào RAM qua Atomic Pointer Swap.

### 4.3. Tác vụ Tiêu hủy Dữ liệu Sinh trắc 20 Ngày (`SOL-BE-008`)

1. **Chu kỳ chạy**: Cron job chạy định kỳ 01:00 hàng ngày trên tiến trình Backend.
2. **Lọc hồ sơ thôi việc**: Quét các bản ghi `users` có `status = 'TERMINATED'` và `terminated_date <= CURRENT_DATE - 20 days`.
3. **Thực thi Xóa cứng (Hard Delete)**: Xóa vĩnh viễn các hàng tương ứng trong bảng `biometric_templates` (không giữ lại bản sao hay backup vector).
4. **Ghi vết Kiểm toán**: Ghi một bản ghi vào bảng `audit_logs` với `action = 'DELETE_BIOMETRIC_DATA'`, `entity_type = 'biometric_templates'`, `actor_id = NULL` (Hệ thống) để phục vụ kiểm toán tuân thủ pháp lý.

---

---

## 4. Quyết định Kỹ thuật Phân hệ Backend (`DD-BE-`)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-BE-001` | Băm mật khẩu người dùng và mã OTP bằng BCrypt ($cost = 12$). | BCrypt tự động sinh muối (salt) và có độ phức tạp tính toán cao, chống lại hiệu quả các cuộc tấn công tra cứu bảng cầu vồng (Rainbow Table) và vét cạn (Brute-force). | SHA-256 thuần, Argon2id, PBKDF2 | Tăng tải CPU khi xác thực OTP hoặc đăng nhập nhưng bảo vệ tối đa an toàn mật khẩu. | `FR-BE-001`, `FR-BE-005` | Accepted |
| `DD-BE-002` | Áp dụng Spring AOP Interceptor cho việc ghi vết kiểm toán thay vì ghi log thủ công tại Service. | Tách biệt hoàn toàn mối quan tâm (Separation of Concerns), ngăn ngừa việc quên ghi log khi phát triển tính năng mới và tập trung hóa cấu trúc dữ liệu audit. | Ghi log thủ công trong từng Service, Sử dụng Hibernate Envers | Cần cấu hình Pointcut chuẩn xác để không bắt nhầm các phương thức đọc query dữ liệu thông thường. | `FR-BE-008`, `NFR-BE-005` | Accepted |
| `DD-BE-003` | Kiểm soát Cooldown 120s tầng máy chủ bằng Caffeine Cache in-memory. | Giảm $95\%$ áp lực truy vấn kiểm tra trùng lặp xuống CSDL PostgreSQL trong giờ cao điểm điểm danh đầu ca, đảm bảo độ trễ phản hồi API luôn $\le 100\text{ ms}$. | Truy vấn SELECT trực tiếp PostgreSQL, Dùng Redis cache ngoài | Dữ liệu cooldown lưu trong RAM máy chủ đơn cụm; khi restart máy chủ bộ đệm sẽ được làm mới. | `FR-BE-002`, `NFR-BE-001` | Accepted |
| `DD-BE-004` | Mã hóa vector sinh trắc học ArcFace bằng AES-256-GCM với IV 12-byte ngẫu nhiên. | Chuẩn mã hóa có xác thực (Authenticated Encryption) bảo vệ tính bí mật và toàn vẹn dữ liệu sinh trắc học; IV sinh mới mỗi lần ghi ngăn chặn suy đoán mã hóa lặp. | AES-CBC với HMAC riêng, RSA bất đối xứng | Phải lưu trữ riêng cột IV (12 bytes) và Auth Tag (16 bytes) đi kèm chuỗi ciphertext BYTEA trong PostgreSQL. | `FR-BE-006`, `NFR-BE-003` | Accepted |
| `DD-BE-005` | Chuẩn hóa 3NF và ràng buộc duy nhất tự nhiên `(user_id, punch_timestamp, punch_type)` cho bảng `attendance_logs`. | Đảm bảo tính toàn vẹn dữ liệu ở cấp CSDL, hỗ trợ cơ chế Idempotency chống ghi trùng lặp khi trạm Kiosk gửi bù gói lô ngoại tuyến. | Khóa chính UUID không ràng buộc duy nhất, Kiểm tra SELECT trước khi INSERT | Giao dịch INSERT trùng lặp sẽ phát sinh lỗi vi phạm khóa duy nhất; luồng đồng bộ áp dụng `ON CONFLICT DO NOTHING`. | `DATA-BE-009`, `FR-BE-003` | Accepted |
| `DD-BE-006` | Sử dụng Flyway Migration quản lý phiên bản schema thay cho auto DDL của Hibernate. | Kiểm soát 100% các câu lệnh DDL thực thi trên Production, ngăn ngừa rủi ro tự động drop/alter cột làm mất dữ liệu nhạy cảm. | Hibernate `hbm2ddl.auto = update`, Dùng Liquibase | Mọi thay đổi cấu trúc bảng bắt buộc phải tạo file script migration `V*__*.sql` mới và kiểm thử kỹ lưỡng. | `DATA-BE-001`, `STK-013` | Accepted |
| `DD-BE-007` | Lưu trữ vector sinh trắc dạng `BYTEA` (AES-256-GCM ciphertext + IV) thay vì pgvector trên CSDL PostgreSQL. | Đáp ứng tuyệt đối yêu cầu bảo vệ dữ liệu ở trạng thái tĩnh (Encryption-at-Rest) theo Luật 91/2025/QH15; việc so khớp khuôn mặt 1:N được phân tán thực thi tại RAM Kiosk. | Dùng extension pgvector lưu vector thô, Lưu dạng chuỗi Base64 | Không thể truy vấn vector tương đồng trực tiếp bằng SQL trên CSDL, nhưng tối ưu chi phí và bảo mật tuyệt đối. | `DATA-BE-015`, `NFR-BE-003` | Accepted |
| `DD-BE-008` | Thiết kế Append-Only cho bảng `audit_logs` với cấu trúc JSONB cho `before_state` và `after_state`. | Bảo toàn tính bất biến của lịch sử kiểm toán phục vụ thanh tra, đồng thời linh hoạt lưu trữ biến động dữ liệu đa thực thể mà không cần can thiệp schema. | Tạo bảng lịch sử riêng biệt cho từng thực thể, Lưu text JSON phẳng | Chiếm dụng thêm dung lượng lưu trữ CSDL cho các trường JSONB; cần thiết lập chỉ mục GIN nếu cần tìm kiếm sâu trong JSON. | `DATA-BE-008`, `DATA-BE-014` | Accepted |
| `DD-BE-009` | Chuẩn hóa mô hình báo lỗi theo chuẩn RFC 7807 ProblemDetails. | Đem lại cấu trúc lỗi máy đọc được (Machine-readable) đồng nhất cho mọi client Web và Kiosk, hỗ trợ chi tiết các trường vi phạm validation. | Tự định nghĩa cấu trúc JSON báo lỗi tự do (thiếu tính chuẩn hóa). | Mọi Controller Advice phải map thống nhất về class `ProblemDetail` của Spring Boot; client dễ dàng bóc tách mã lỗi `code` và danh sách vi phạm `invalidParams`. | `API-BE-016`, `STK-011` | Accepted |
| `DD-BE-010` | Sử dụng tiêu đề tùy biến `X-Kiosk-Id` kết hợp Secret Bearer Token cho máy trạm Kiosk. | Định danh rõ ràng phần cứng máy trạm phát sinh giao dịch, cho phép vô hiệu hóa tức thời từng trạm Kiosk riêng biệt khi có rủi ro lộ khóa. | Dùng chung 1 tài khoản JWT Service Account cho toàn bộ Kiosk (không cô lập được trạm bị thỏa hiệp). | Mỗi máy trạm Kiosk khi lắp đặt phải được cấp phát cặp `kioskId` và Secret Token riêng; Backend lọc và xác thực ngay tại tầng Security Filter. | `API-BE-003`, `API-BE-015` | Accepted |
| `DD-BE-011` | Cấu hình kênh STOMP chia tách tiền tố `/topic` (Public broadcast) và `/user` (Private unicast). | Tối ưu lưu lượng truyền thông thời gian thực: chỉ phát sóng dữ liệu chung tới subscriber liên quan, dữ liệu phiên OTP được cô lập cho người dùng đích. | Dùng một topic chung duy nhất đẩy toàn bộ sự kiện cho client tự lọc (rò rỉ bảo mật OTP). | Cần cấu hình `ChannelInterceptor` thẩm định quyền subscribe từng topic; đảm bảo Kiosk chỉ nhận thông điệp gallery và Web nhận sự kiện attendance. | `API-BE-012`, `API-BE-013`, `API-BE-014` | Accepted |
| `DD-BE-012` | Giới hạn kích thước gói lô đồng bộ bù ngoại tuyến tối đa 50 bản ghi/request. | Ngăn chặn hiện tượng nghẽn luồng kết nối và khóa bảng CSDL kéo dài khi hàng loạt trạm Kiosk đồng loạt gửi bù dữ liệu sau sự cố mất mạng diện rộng. | Gửi từng bản ghi đơn lẻ nối tiếp hoặc gửi một gói không giới hạn. | Phía trạm Kiosk phải phân trang hàng đợi SQLite ngoại tuyến thành các lô 50 bản ghi; Backend xử lý batch insert có `ON CONFLICT DO NOTHING` trong $\le 50\text{ ms}$. | `API-BE-004`, `NFR-BE-001` | Accepted |
| `DD-BE-013` | Cấp mật khẩu ban đầu bằng mật khẩu tạm do hệ thống sinh; nhân viên được phép đổi mật khẩu bất kỳ lúc nào nhưng **không** bị bắt buộc. | Backend là nơi duy nhất sinh và băm mật khẩu nên HR không phải nghĩ/ghi nhớ mật khẩu của nhân viên; không cần hạ tầng gửi thư điện tử; nhân viên vào hệ thống dùng được ngay, không phát sinh bước chặn bắt buộc. | HR tự nhập mật khẩu ban đầu; gửi email kèm liên kết đặt mật khẩu; buộc đổi mật khẩu ở lần đăng nhập đầu (đã bị loại). | Cờ `must_change_password` đã được gỡ khỏi lược đồ ở `V5__drop_must_change_password.sql` và `SOL-BE-015` chuyển `Deprecated`; mật khẩu tạm chỉ hiển thị một lần nên HR phải bàn giao ngay. | `FR-BE-011`, `API-BE-017`, `API-BE-020` | Accepted |
| `DD-BE-014` | Chặn nghiệp vụ bằng bộ lọc sau xác thực JWT thay vì xử lý trong từng controller. | Bảo đảm không endpoint nghiệp vụ nào bị bỏ sót khi bổ sung sau này; tách biệt mối quan tâm giữa xác thực và vòng đời thông tin xác thực. | Kiểm tra thủ công trong từng controller; chặn ngay trong chuỗi Spring Security Filter. | Cần danh sách trắng endpoint (đổi mật khẩu, refresh token) và khi thêm endpoint mới phải cân nhắc danh sách này. | `FR-BE-011`, `API-BE-020`, `API-SYS-021` | Accepted |
| `DD-BE-015` | Thẩm định mã PIN tại máy chủ, giữ nguyên băm PIN trong Backend và phân biệt lỗi sai PIN với lỗi khóa brute-force. | Băm PIN không bao giờ rời máy chủ; trạm Kiosk chỉ nhận kết quả thẩm định; tách mã lỗi `PIN_INVALID` (401) và `PIN_LOCKED` (423) giúp Kiosk hiển thị đúng thông điệp và đếm ngược khóa 15 phút. | Thẩm định cục bộ tại Kiosk bằng băm PIN tải kèm Gallery; gộp chung một mã lỗi cho mọi trường hợp thất bại. | Luồng điểm danh bằng PIN bắt buộc có kết nối mạng tới Backend; mọi hành vi thẩm định PIN tập trung một nơi để kiểm thử. | `FR-BE-012`, `API-BE-022`, `DATA-SYS-012` | Accepted |
| `DD-BE-016` | Ánh xạ HTTP status riêng cho vòng đời thông tin xác thực: 401 `PIN_INVALID`, 423 `PIN_LOCKED`. | Client Kiosk và Web cần phân biệt "sai PIN" và "PIN đang bị khóa" để hiển thị đúng thông báo và đếm ngược thời gian khóa, thay vì gộp chung một lỗi 401/400. | Gộp mọi thất bại xác thực vào 401 `AUTH_INVALID_CREDENTIALS`. | Bổ sung hai mã lỗi vào từ điển; mã 423 `PIN_LOCKED` kèm thời điểm mở khóa trong `invalidParams`/`message`. | `API-BE-022`, `API-SYS-021` | Accepted |
| `DD-BE-017` | Kiểm tra chồng lấn lịch phân ca ở tầng dịch vụ trong giao dịch có khóa theo `user_id`, không dựa vào ràng buộc loại trừ của PostgreSQL. | Đồng bộ với `DD-SYS-018`; PostgreSQL cần extension `btree_gist` cho `EXCLUDE USING gist` trên khoảng ngày, không chạy được trên profile kiểm thử H2; kiểm tra nghiệp vụ cho thông điệp 409 rõ ràng và kiểm thử được ở mọi môi trường. | Chỉ dùng `EXCLUDE USING gist` (phụ thuộc extension); không kiểm tra (cho phép dữ liệu công sai lệch). | Cần khóa theo `user_id` để tránh hai yêu cầu phân ca đồng thời cùng vượt qua kiểm tra; bổ sung chỉ mục `(user_id, effective_from, effective_to)` và ca kiểm thử âm. | `FR-BE-013`, `DATA-BE-017`, `DD-SYS-018` | Accepted |
| `DD-BE-018` | Duyệt đơn giải trình cập nhật bản ghi điểm danh trong cùng giao dịch với việc đổi trạng thái đơn và ghi `audit_logs`; nhân viên chỉ nộp được cho bản ghi của chính mình trong 30 ngày gần nhất. | Tránh trạng thái nửa vời (đơn đã duyệt nhưng bảng công chưa điều chỉnh); giới hạn 30 ngày ngăn việc sửa dữ liệu công đã chốt/kết xuất báo cáo; vết kiểm toán luôn khớp dữ liệu. | Cập nhật bảng công bằng tác vụ nền; cho phép nộp đơn vô thời hạn. | Cần khoá bản ghi điểm danh khi duyệt để tránh hai đơn cùng sửa một bản ghi; đơn đã `APPROVED`/`REJECTED` không đổi trạng thái lần nữa. | `FR-BE-014`, `FR-BE-015`, `API-BE-029`, `DD-SYS-021` | Accepted |
| `DD-BE-019` | Tra cứu `audit_logs` và dữ liệu tuân thủ qua API chỉ đọc; role `DPO` tách khỏi `ADMIN`; không tồn tại repository cập nhật/xoá cho `audit_logs`. | Giữ nguyên tính bất biến của nhật ký (`NFR-BE-005`) trong khi vẫn đáp ứng quyền hạn của `ACT-003`/`ACT-004`; đặc quyền tối thiểu cho dữ liệu cá nhân. | Cho `ADMIN` làm mọi tra cứu; đọc trực tiếp CSDL bằng công cụ ngoài. | Cần bổ sung role `DPO` vào RBAC và danh sách trắng endpoint chỉ đọc; cần ca kiểm thử âm cho role không đủ quyền. | `FR-BE-016`, `API-BE-030`, `API-BE-031`, `DD-SYS-019` | Accepted |
| `DD-BE-020` | Secret Token trạm Kiosk sinh một lần và băm một chiều; đổi token vô hiệu hóa token cũ ngay lập tức; vô hiệu hóa trạm thay vì xoá bản ghi. | Đồng bộ với `DD-SYS-020`; bảo toàn tham chiếu `attendance_logs.kiosk_id`; tránh lưu plaintext token; cho phép thu hồi tức thì khi trạm mất thiết bị. | Lưu token plaintext; xoá bản ghi trạm. | Token chỉ hiển thị một lần buộc quy trình bàn giao phải lưu tạm an toàn; bộ lọc xác thực Kiosk phải kiểm tra trạng thái hoạt động của trạm. | `FR-BE-017`, `API-BE-032`, `API-BE-033`, `DD-SYS-020` | Accepted |
| `DD-BE-021` | Bootstrap đọc thông tin tài khoản quản trị đầu tiên từ biến môi trường khi khởi động và tự vô hiệu hóa sau khi tạo thành công, thay vì seed sẵn trong migration. | Đồng bộ với `DD-SYS-022`; giữ yêu cầu "không mật khẩu mặc định" của `SRS-005` mà vẫn có đường triển khai trên CSDL trống; tách bạch dữ liệu khởi tạo khỏi lược đồ. | Seed `admin/admin` trong Flyway; yêu cầu DBA tạo tài khoản bằng SQL tay. | Cần biến môi trường bắt buộc ở lần chạy đầu và quy trình vận hành bàn giao mật khẩu tạm; bootstrap phải idempotent để an toàn khi restart. | `FR-BE-018`, `SRS-005`, `DD-SYS-022` | Accepted |
| `DD-BE-022` | Cấp lại mật khẩu tạm thu hồi mật khẩu tạm cũ và toàn bộ refresh token của tài khoản; đặt lại PIN yêu cầu xác thực bằng mật khẩu hiện tại. | Đồng bộ với `DD-SYS-023`; bảo đảm "mất mật khẩu" không trở thành mất quyền truy cập vĩnh viễn mà vẫn giữ kiểm soát danh tính; không cần hạ tầng email/SMS. | Cho phép nhân viên tự đặt lại mật khẩu không cần HR; giữ nguyên phiên cũ sau khi cấp lại mật khẩu. | Cần giao diện HR cấp lại mật khẩu và giao diện nhân viên đặt lại PIN; mọi thao tác phải ghi audit và sinh thông báo. | `FR-BE-019`, `API-BE-036`, `API-BE-037`, `DD-SYS-023` | Accepted |
| `DD-BE-023` | Refresh token lưu dạng băm một chiều trong bảng phiên kèm hạn dùng; thu hồi theo tài khoản; mỗi yêu cầu kiểm tra trạng thái tài khoản chứ không chỉ chữ ký token. | Đồng bộ với `DD-SYS-026`; cần thu hồi tức thì khi nhân viên thôi việc đột xuất hoặc đổi mật khẩu, điều mà JWT thuần không làm được; kiểm tra trạng thái tài khoản bịt khoảng trễ của access token 1 giờ. | JWT thuần không trạng thái; token phiên 8 giờ không refresh. | Cần thêm thực thể phiên và chỉ mục theo tài khoản; mọi luồng đổi/cấp lại mật khẩu và vô hiệu hóa nhân sự phải gọi thu hồi; chi phí thêm một truy vấn trạng thái tài khoản mỗi yêu cầu được bù bằng cache. | `FR-BE-020`, `API-BE-038`, `DATA-BE-022`, `DD-SYS-026` | Accepted |
| `DD-BE-024` | Kiểm tra kỳ công đã chốt ở tầng dịch vụ, dùng chung cho cả nộp đơn, duyệt đơn và điều chỉnh công; kỳ công là thực thể riêng theo tháng. | Đồng bộ với `DD-SYS-024`; một điểm kiểm tra duy nhất tránh bỏ sót đường điều chỉnh; khoá theo kỳ phù hợp nghiệp vụ lương/tháng. | Kiểm tra rải rác trong từng controller; chặn theo mốc thời gian từng bản ghi. | Mọi luồng điều chỉnh công phải đi qua bộ kiểm tra này; mở lại kỳ phải ghi audit kèm lý do; cần ca kiểm thử cho kỳ `LOCKED`. | `FR-BE-021`, `API-BE-039`, `DATA-BE-021`, `DD-SYS-024` | Accepted |
| `DD-BE-025` | Rút Consent loại nhân sự khỏi gallery Kiosk và chặn sinh OTP ngay lập tức, nhưng tiêu hủy dữ liệu sinh trắc theo hạn 7 ngày; mọi chuyển trạng thái yêu cầu dữ liệu cá nhân sinh thông báo. | Đồng bộ với `DD-SYS-025`; dừng ngay việc xử lý sinh trắc (không còn cơ sở pháp lý) trong khi vẫn giữ cửa sổ đối soát khiếu nại; thông báo giúp nhân viên biết yêu cầu đã được tiếp nhận. | Tiêu hủy tức thời trong cùng giao dịch; giữ tới 20 ngày như luồng thôi việc. | Cần thực thể vết rút Consent + yêu cầu dữ liệu cá nhân; luồng điểm danh của nhân sự đã rút Consent chỉ còn PIN; cần ca kiểm thử cho gallery và OTP. | `FR-BE-022`, `API-BE-041`, `API-BE-042`, `DATA-BE-023`, `DATA-BE-024` | Accepted |
| `DD-BE-026` | Chặn hạ cấp hoặc thu hồi role của tài khoản `ADMIN` đang hoạt động cuối cùng bằng phép đếm trong cùng giao dịch với thao tác cập nhật role. | Đồng bộ với `SOL-SYS-029`; tránh khoá cứng hệ thống do mất hết quyền quản trị; phép đếm trong cùng giao dịch ngăn hai yêu cầu đồng thời cùng hạ cấp hai ADMIN cuối. | Kiểm tra ở tầng ứng dụng không khoá; cấm hoàn toàn việc thu hồi role ADMIN. | Cần khoá hoặc `SELECT ... FOR UPDATE` khi đếm ADMIN; mọi thay đổi role phải ghi audit giá trị trước/sau; cần ca kiểm thử hai yêu cầu đồng thời. | `FR-BE-023`, `API-BE-043`, `SRS-006` | Accepted |

---

## 5. Assumptions & Scope Boundaries (Giả định & Ranh giới Phạm vi)

* **Nguồn Chuẩn Giờ Mạng (NTP)**: Toàn bộ mốc thời gian điểm danh và tính toán đi muộn/về sớm của Backend dựa trên nguồn chuẩn giờ hệ điều hành đồng bộ NTP (`EXT-003`) với sai lệch $\le 50\text{ ms}$; múi giờ hệ thống mặc định là UTC+7 (Asia/Ho_Chi_Minh).
* **Giới hạn Gói Lô Đồng bộ**: Backend giới hạn tối đa 50 bản ghi cho mỗi payload `/api/v1/kiosk/sync-batch` để đảm bảo thời gian xử lý giao dịch JDBC và bộ nhớ JVM Heap không bị nghẽn trong các đợt đồng bộ dồn toa.
* **Cấu hình Vận hành Tách biệt**: Việc cấu hình tham số vận hành (biến môi trường, `application.yml`) và sao lưu CSDL (`pg_dump`/`pg_restore`) thuộc phạm vi tầng vận hành (`system-docs/plans/deploy-plan.md`), không cung cấp giao diện REST công khai.
* **Tra cứu Kiểm toán Không Sinh Vết Mới**: Các thao tác tra cứu `audit_logs` và Consent của `ADMIN`/`DPO` là chỉ đọc và không tạo thêm bản ghi kiểm toán, tránh khuếch đại dung lượng nhật ký.
