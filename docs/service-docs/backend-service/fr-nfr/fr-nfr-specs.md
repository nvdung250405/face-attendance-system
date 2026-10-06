---
title: Backend FR/NFR Specifications
version: 1.0
status: Approved
owner: Backend Technical Lead & Requirements Analyst
---

# FR/NFR SPECS — Đặc tả Yêu cầu Chức năng & Phi chức năng Phân hệ Backend

## 1. Functional Requirements (Yêu cầu Chức năng Backend)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-BE-001` | Xác thực đăng nhập người dùng và cấp phát JWT token có thời hạn kèm phân quyền RBAC (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`). | Auth / Security | Must | `SRS-005`, `SRS-006`, `ACT-001`, `ACT-002` | Đăng nhập thành công trả về cặp Access Token (1h) & Refresh Token (7 ngày); mã hóa mật khẩu BCrypt ($cost = 12$); chặn truy cập trái quyền trả về HTTP 403 Forbidden. | Approved |
| `FR-BE-002` | Tiếp nhận và xử lý bản ghi điểm danh thời gian thực từ trạm Kiosk, ghi nhận trạng thái đi làm/đi muộn/về sớm và áp dụng cooldown 120s phía máy chủ. | Core Attendance | Must | `FR-SYS-005`, `FR-SYS-012` | Phản hồi trong $\le 100\text{ ms}$; kiểm tra quy tắc ca làm việc và tính toán phút đi trễ theo lịch biểu; chặn quẹt lặp cùng nhân viên trong 120s qua bộ nhớ đệm. | Approved |
| `FR-BE-003` | Tiếp nhận gói lô đồng bộ bù ngoại tuyến từ Kiosk, thực hiện ghi nhận không trùng lặp và bảo toàn mốc giờ thực tế. | Offline Sync | Must | `FR-SYS-006` | Hỗ trợ gói lô tối đa 50 bản ghi; trả về danh sách ID đã lưu thành công; loại bỏ trùng lặp qua ràng buộc khóa tự nhiên `(user_id, punch_time)`. | Approved |
| `FR-BE-004` | Cung cấp API tải toàn bộ danh mục vector sinh trắc học ArcFace phục vụ trạm Kiosk nạp vào bộ nhớ RAM. | Biometric Distribution | Must | `FR-SYS-003`, `FR-SYS-014` | Trả về danh sách nhân viên đang kích hoạt (`ACTIVE`) kèm vector 512D đã giải mã; xác thực qua header bí mật `X-Kiosk-Id` và Kiosk Secret Token. | Approved |
| `FR-BE-005` | Khởi tạo phiên đăng ký khuôn mặt mới, sinh mã OTP 6 số ngẫu nhiên có hiệu lực 48 giờ sau khi nhân viên ký cam kết Informed Consent. | Enrollment Lifecycle | Must | `FR-SYS-007`, `FR-SYS-008` | Chỉ sinh OTP khi bản ghi `consent_signed_at` hợp lệ; lưu vết OTP mã hóa BCrypt; vô hiệu hóa mã cũ khi sinh mã mới; hết hạn sau 48 giờ. | Approved |
| `FR-BE-006` | Xác thực mã OTP và tiếp nhận vector 512D từ Kiosk, mã hóa bằng AES-256-GCM trước khi lưu trữ vào CSDL PostgreSQL. | Crypto / Biometric | Must | `FR-SYS-008`, `FR-SYS-010` | Khóa mã hóa quản lý tách biệt qua biến môi trường; vector thô không bao giờ lưu đĩa; kích hoạt trạng thái nhân sự thành `ACTIVE` sau khi nạp mẫu. | Approved |
| `FR-BE-007` | Phát sóng sự kiện thời gian thực qua WebSocket STOMP tới Kiosk (cập nhật gallery) và Web Portal (bảng chấm công trực tiếp). | Realtime Messaging | Must | `FR-SYS-013`, `FR-SYS-014` | Bản tin đẩy tới subscriber trong vòng $\le 50\text{ ms}$; hỗ trợ topic `/topic/kiosk-gallery` và `/topic/live-attendance`. | Approved |
| `FR-BE-008` | Cung cấp các báo cáo tổng hợp chấm công, xuất dữ liệu định dạng Excel chống Formula Injection và truy vết lịch sử chỉnh sửa (Audit Log). | Reporting / Audit | Should | `FR-SYS-016`, `SRS-007`, `SRS-010` | Xuất bảng công tháng 1,000 nhân sự $\le 3\text{ giây}$; tự động escape ký tự nguy hiểm (`=`, `+`, `-`, `@`); ghi log toàn bộ thao tác sửa đổi giờ công của HR. | Approved |
| `FR-BE-009` | Thực thi tác vụ quét định kỳ hàng ngày tiêu hủy vĩnh viễn dữ liệu sinh trắc học của nhân viên đã thôi việc quá 20 ngày theo Luật 91/2025/QH15. | Data Retention | Must | `FR-SYS-011`, `SRS-003`, `DATA-SYS-013` | Cron job chạy định kỳ 01:00 hàng ngày; xóa cứng (`HARD DELETE`) các bản ghi `biometric_templates` có nhân viên liên kết ở trạng thái `TERMINATED` quá 20 ngày. | Approved |
| `FR-BE-010` | Quản lý vòng đời hồ sơ nhân sự: khởi tạo hồ sơ kèm tài khoản đăng nhập, cập nhật thông tin hồ sơ và vô hiệu hóa nhân sự khi chấm dứt hợp đồng. | HR Management | Must | `API-SYS-008`, `FR-SYS-017` | Tạo hồ sơ trả về mã nhân viên và mật khẩu tạm hiển thị đúng một lần; từ chối khi trùng `employee_code` hoặc `email`; cập nhật được họ tên, email, phòng ban, vai trò; vô hiệu hóa đặt `status = TERMINATED` kèm `terminated_date` và ghi một bản ghi `audit_logs`. | Approved |
| `FR-BE-011` | Quản lý vòng đời mật khẩu: sinh mật khẩu tạm khi khởi tạo tài khoản, bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên và chặn mọi nghiệp vụ khác cho tới khi hoàn tất đổi mật khẩu. | Auth / Security | Must | `FR-SYS-017`, `API-SYS-021`, `SRS-005` | Mật khẩu tạm sinh ngẫu nhiên, băm BCrypt trước khi lưu và không thể truy xuất lại sau khi trả về; tài khoản còn cờ buộc đổi mật khẩu nhận HTTP 403 `PASSWORD_CHANGE_REQUIRED` ở mọi endpoint nghiệp vụ trừ endpoint đổi mật khẩu; mật khẩu mới tối thiểu 8 ký tự và khác mật khẩu tạm. | Approved |
| `FR-BE-012` | Quản lý mã PIN dự phòng: cho phép nhân viên tự thiết lập/đổi mã PIN 6 số và thẩm định mã PIN tập trung tại máy chủ trước khi ghi nhận điểm danh. | Auth / Security | Must | `FR-SYS-004`, `FR-SYS-017`, `API-SYS-022`, `API-SYS-023`, `DATA-SYS-012` | PIN lưu dưới dạng băm một chiều; thiết lập lần đầu yêu cầu nhập lại PIN xác nhận; đổi PIN yêu cầu PIN hiện tại; xác thực PIN đúng trả về định danh nhân viên, PIN sai trả 401 `PIN_INVALID`, sai 5 lần liên tiếp trả 423 `PIN_LOCKED` trong 15 phút. | Approved |

---

## 2. Non-functional Requirements (Yêu cầu Phi chức năng Backend)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-BE-001` | Thời gian phản hồi trung bình của API tiếp nhận điểm danh đạt $\le 100\text{ ms}$ ở bách phân vị $95\%$ (p95). | Performance | Must | `NFR-SYS-001`, `NFR-SYS-003` | Đo kiểm dưới tải đồng thời 50 kết nối Kiosk; sử dụng HikariCP connection pool tối ưu; thời gian ghi nhận điểm danh hoàn tất trong $\le 100\text{ ms}$. | Approved |
| `NFR-BE-002` | Năng lực chịu tải của hệ thống máy chủ đạt tối thiểu $500\text{ req/giây}$ (RPS) trên cấu hình 2 vCPU và 4 GB RAM. | Throughput | Must | `NFR-SYS-004` | Tỷ lệ lỗi HTTP 5xx $< 0.01\%$ khi kiểm thử ngập tải (Stress Testing); mức chiếm dụng CPU $\le 75\%$. | Approved |
| `NFR-BE-003` | 100% dữ liệu vector sinh trắc học và thông tin định danh cá nhân được mã hóa ở trạng thái nghỉ (Encryption-at-Rest). | Security / Privacy | Must | `NFR-SYS-007`, `SRS-001` | Tuân thủ Luật Bảo vệ dữ liệu cá nhân; áp dụng thuật toán AES-256-GCM với IV ngẫu nhiên 12-byte và khóa Master tách biệt. | Approved |
| `NFR-BE-004` | Đảm bảo tính khả dụng của dịch vụ máy chủ đạt $\ge 99.9\%$ thời gian trong tháng (Downtime $\le 43.8\text{ phút/tháng}$). | Availability | Must | `NFR-SYS-008`, `SRS-009` | Thiết kế Stateless kiến trúc, sẵn sàng triển khai cân bằng tải đa phiên bản; endpoint `/actuator/health` phản hồi `UP` liên tục. | Approved |
| `NFR-BE-005` | Toàn bộ các thao tác chỉnh sửa dữ liệu nhạy cảm được ghi nhật ký bất biến (Immutable Audit Trail). | Compliance | Must | `SRS-010`, `NFR-SYS-008` | Nhật ký lưu lại ID người sửa, IP, mốc giờ ISO-8601, giá trị trước và sau khi thay đổi; bảng `audit_logs` chỉ cho phép append-only. | Approved |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Nguồn Chuẩn Giờ Mạng (NTP Time Synchronization)**: Mọi mốc thời gian điểm danh và tính toán đi muộn/về sớm của Backend dựa trên nguồn chuẩn giờ hệ điều hành đồng bộ NTP (`EXT-003`) với sai lệch $\le 50\text{ ms}$; múi giờ hệ thống mặc định là UTC+7 (Asia/Ho_Chi_Minh).
* **Giới hạn Kích thước Gói Lô Đồng bộ**: Backend giới hạn tối đa 50 bản ghi cho mỗi payload `/api/v1/kiosk/sync-batch` để đảm bảo thời gian xử lý giao dịch JDBC và bộ nhớ JVM Heap không bị nghẽn trong các đợt đồng bộ dồn toa.

