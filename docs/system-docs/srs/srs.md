---
title: Yêu cầu Tổng thể & Ngữ cảnh Hệ thống (SRS)
version: 1.1
status: Approved
owner: Requirements Lead
---

# SRS — Yêu cầu Tổng thể & Ngữ cảnh Hệ thống (System Requirements Specification)

Đặc tả ngữ cảnh vận hành toàn hệ thống, danh mục tác nhân người dùng (`ACT-`), hệ thống/thiết bị bên ngoài (`EXT-`) và các yêu cầu kỹ thuật xuyên suốt (`SRS-`) chi phối toàn bộ giải pháp Monorepo.

---

## 1. System Context (Ngữ cảnh Hệ thống)

Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS) vận hành theo mô hình phân tán 3 phân hệ độc lập:
* **Phân hệ Kiosk Biên (`kiosk-app`)**: Trạm Kiosk thu nhận video trực tiếp từ cảm biến camera, thực thi toàn bộ pipeline AI (phát hiện mặt, kiểm tra liveness, trích xuất vector 512D) và so khớp ma trận RAM cục bộ.
* **Phân hệ Máy chủ Doanh nghiệp (`backend-service`)**: Máy chủ Backend tiếp nhận lượt chấm công, quản lý ca kíp, chống quét trùng Cooldown 120s, mã hóa bảo mật vector mẫu bằng AES-256-GCM và phát sóng sự kiện thời gian thực.
* **Phân hệ Web Quản trị & Tự phục vụ (`web-portal`)**: Cổng Web Portal cung cấp Live Monitoring Dashboard thời gian thực, quản trị nhân sự, duyệt giải trình công và cổng tự phục vụ ký Informed Consent.

---

### 1.1. Actors (Sổ Đăng ký Tác nhân Người dùng)

| ID | Tác nhân (Actor Name) | Vai trò & Mục đích Tương tác trong Hệ thống | Quyền hạn Hệ thống |
| :--- | :--- | :--- | :--- |
| `ACT-001` | Nhân viên (Employee) | Điểm danh hàng ngày qua khuôn mặt/mã PIN tại trạm Kiosk; tự đăng ký mẫu mặt qua OTP; ký cam kết Informed Consent điện tử và gửi đơn giải trình công trên Cổng Web. | Role `EMPLOYEE` |
| `ACT-002` | Chuyên viên Nhân sự (HR Specialist) | Quản lý danh sách nhân sự, cấu hình ca kíp làm việc, theo dõi sĩ số trực tiếp đầu giờ trên Live Dashboard, duyệt đơn giải trình công và kết xuất báo cáo bảng công. | Role `HR_MANAGER` |
| `ACT-003` | Quản trị viên Hệ thống (System Admin) | Cấu hình tham số vận hành, giám sát nhật ký audit log, quản lý tài khoản người dùng, giám sát kết nối mạng giữa Kiosk và Backend, sao lưu/phục hồi CSDL. | Role `ADMIN` |
| `ACT-004` | Cán bộ Bảo vệ Dữ liệu (DPO) | Kiểm soát việc thực thi chính sách bảo vệ dữ liệu cá nhân theo Luật 91/2025/QH15, kiểm tra chữ ký thỏa thuận Consent, giám sát lịch trình tiêu hủy dữ liệu sinh trắc 20 ngày khi thôi việc và 7 ngày khi rút đồng thuận (`FR-SYS-025`). | Role `DPO` (chỉ đọc) |

---

### 1.2. External Systems & Devices (Hệ thống & Thiết bị Ngoại vi)

| ID | Tên Hệ thống / Thiết bị | Loại Giao tiếp | Giao thức / Ranh giới | Vai trò Kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| `EXT-001` | Camera Quang học UVC / Webcam | Thiết bị phần cứng USB | DirectShow / V4L2 | Cung cấp luồng khung hình video liên tục $\ge 15\text{ FPS}$ độ phân giải HD/Full HD. |
| `EXT-002` | CSDL PostgreSQL 16 LTS Doanh nghiệp | Dịch vụ CSDL trung tâm | TCP/IP (Port 5432, JPA/JDBC)| Lưu trữ bền vững dữ liệu nhân sự, ca kíp, bảng công và vector mã hóa BYTEA. |
| `EXT-003` | Nguồn Chuẩn Giờ Mạng (NTP Server) | Dịch vụ mạng hệ thống | NTP (UDP Port 123) | Đồng bộ mốc thời gian chuẩn giữa các trạm Kiosk và máy chủ Backend (sai lệch $< 50\text{ ms}$). |

---

## 2. Cross-cutting Requirements (Yêu cầu Xuyên suốt Toàn Hệ thống)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `SRS-001` | Toàn bộ vector đặc trưng sinh trắc học lưu trữ ở trạng thái tĩnh phải được mã hóa chuẩn đối xứng AES-256-GCM với khóa Master Key nạp độc lập từ biến môi trường của hệ thống. | Security | Must | `PD-005` | 100% vector trong bảng `biometric_templates` là ciphertext dạng BYTEA kèm IV 12 bytes và Auth Tag 16 bytes; không giải mã được nếu thiếu khóa môi trường (`STK-034`). Tại trạm Kiosk biên, dữ liệu vector đã giải mã chỉ được lưu trong bộ nhớ RAM không phân trang (locked memory buffer) trong suốt phiên vận hành và được bảo vệ bằng các chính sách gia cố an ninh hệ điều hành (OS hardening) và an toàn vật lý của thiết bị trạm (`PD-005`). | Approved |
| `SRS-002` | Mọi luồng truyền thông mạng giữa Kiosk, Web Portal và Backend bắt buộc phải được mã hóa kênh truyền bằng TLS 1.3 (HTTPS) và Secure WebSocket (WSS) trên môi trường vận hành chính thức. | Security | Must | `PD-001` | Toàn bộ gói tin REST API và STOMP được mã hóa trên đường truyền thông qua Reverse Proxy (`STK-036`); từ chối kết nối không an toàn trên production; cho phép cấu hình fallback HTTP/WS cục bộ ở môi trường phát triển. | Approved |
| `SRS-003` | Hệ thống phải tự động tiêu hủy vĩnh viễn (Hard Delete) mẫu dữ liệu sinh trắc học của nhân viên đã thôi việc sau đúng 20 ngày kể từ ngày chấm dứt hợp đồng lao động theo Điều 18 & 19 Luật số 91/2025/QH15. | Compliance | Must | `PD-005` | Tác vụ ngầm định kỳ hàng ngày quét và xóa sạch bản ghi trong `biometric_templates` có `terminated_date <= CurrentDate - 20 days`; ghi nhật ký kiểm toán. | Approved |
| `SRS-004` | Tuyệt đối không lưu trữ ảnh chụp thô kích thước đầy đủ của nhân viên trên ổ đĩa trạm Kiosk hay máy chủ trung tâm (Zero Raw Image Retention). | Privacy | Must | `PD-005` | Khung hình camera chỉ tồn tại tạm thời trong RAM trong chu kỳ suy luận ($< 1\text{ giây}$) và lập tức được giải phóng bộ nhớ; không có file ảnh nào được ghi đĩa. | Approved |
| `SRS-005` | Mật khẩu tài khoản và mã PIN dự phòng cá nhân phải được băm một chiều bằng thuật toán an toàn chống dò vét GPU (Argon2id hoặc BCrypt), cấm lưu văn bản rõ; cơ chế xác thực mã PIN phải áp dụng khóa tạm thời (Lockout) per-account tối thiểu 15 phút sau 5 lần nhập sai liên tiếp trên toàn hệ thống kết hợp khóa per-device tại bàn phím Kiosk để ngăn chặn tấn công vét cạn. | Security | Must | `PD-001`, `PD-008` | Cột `pin_hash` trong CSDL lưu trữ hash an toàn (BCrypt với cost factor $\ge 10$ hoặc Argon2id); xác thực không lưu cache plaintext; Backend khóa per-account 15 phút sau 5 lần nhập sai mã PIN của cùng tài khoản trên bất kỳ trạm nào; Kiosk khóa bàn phím PIN cục bộ 15 phút và phát còi/cảnh báo giao diện. | Approved |
| `SRS-006` | Hệ thống phải thực thi kiểm soát truy cập dựa trên vai trò (RBAC) thông qua mã thông báo JWT; đối với phiên làm việc web/API, sử dụng access token ngắn hạn (1 giờ) kèm refresh token an toàn (7 ngày) dạng băm một chiều hỗ trợ thu hồi tức thì. | Security | Must | `PD-001` | Mọi API quản trị đều yêu cầu header `Authorization: Bearer <JWT>`; từ chối truy cập 403 Forbidden nếu không đủ quyền hạn; đổi mật khẩu, cấp lại mật khẩu hoặc vô hiệu hóa tài khoản lập tức thu hồi toàn bộ refresh token tương ứng. | Approved |
| `SRS-007` | Khi xuất dữ liệu bảng công ra file Excel/CSV, hệ thống phải tự động vô hiệu hóa mã độc chèn công thức (Anti-Formula Injection / CWE-1236). | Security | Should | `INF-003` | Tự động chèn dấu nháy đơn (`'`) trước các ô dữ liệu văn bản bắt đầu bằng các ký tự `=`, `+`, `-`, `@`. | Approved |
| `SRS-008` | Hệ thống phải duy trì khả năng vận hành độc lập tại biên (Offline-first resilient) cho phương thức nhận diện khuôn mặt chính yếu, đảm bảo không thất thoát dữ liệu ($\text{RPO} = 0$) khi mất kết nối mạng. | Reliability | Must | `PD-004` | Trạm Kiosk tiếp tục nhận diện khuôn mặt bình thường khi mất mạng, ghi đệm vào SQLite WAL và tự động gửi bù đủ 100% số bản ghi khi mạng phục hồi; kênh PIN dự phòng (`SRS-005`) yêu cầu Backend trực tuyến để bảo vệ hash PIN không lưu đĩa tại trạm biên; trong tình huống sự cố kép (mất mạng VÀ lỗi sinh trắc), nhân viên sử dụng quy trình nộp đơn giải trình công trực tuyến sau khi kết nối phục hồi (`FR-SYS-016`). | Approved |
| `SRS-009` | Hệ thống phải đảm bảo hoạt động liên tục với độ sẵn sàng dịch vụ tối thiểu 99.9% trong giờ làm việc hành chính. | Availability | Must | `PD-001`, `INF-011` | Backend cung cấp endpoint giám sát sức khỏe `/actuator/health` (`STK-035`) phản hồi HTTP 200 trong $\le 200\text{ ms}$; Kiosk có vòng lặp tự phục hồi kết nối camera mỗi 3 giây; tổng thời gian gián đoạn dịch vụ tích lũy không vượt quá $\le 15.8\text{ phút/tháng}$ theo `NFR-SYS-008`. | Approved |
| `SRS-010` | Toàn bộ các sự kiện điểm danh, đăng ký khuôn mặt, duyệt giải trình và xóa dữ liệu phải được ghi nhật ký kiểm toán (Audit Trail) không thể chỉnh sửa. | Auditing | Must | `INF-009` | Lưu trữ bản ghi trong bảng `audit_logs` có đầy đủ mốc thời gian, IP, tác nhân và hành vi nghiệp vụ. | Approved |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Chi tiết Mô hình Token JWT (Decision 1 — ĐÃ GIẢI QUYẾT)**: Thời hạn hiệu lực được chốt là access token **1 giờ** và refresh token **7 ngày** kèm bảng lưu trữ refresh token dạng **băm một chiều** trên máy chủ để hỗ trợ thu hồi quyền tức thì (revocation) khi nhân viên thôi việc đột xuất hoặc đổi mật khẩu. Quyết định chi tiết tại `DD-SYS-026`; yêu cầu chức năng tương ứng là `FR-SYS-023` (vòng đời phiên).
* **Ranh giới Cấu hình TLS/WSS (Decision 10 — ĐÃ GIẢI QUYẾT)**: Việc kết thúc TLS (TLS termination) được cấu hình tại Reverse Proxy (Nginx / Caddy — `STK-036`) khi đưa vào môi trường Production; mã nguồn ứng dụng nội bộ cho phép chạy HTTP/WS thuần để tối giản môi trường kiểm thử phát triển cục bộ. Quy định chi tiết tại `system-docs/plans/deploy-plan.md`.
* **Mục tiêu Độ sẵn sàng & RTO/RPO (Decision 8 — ĐÃ GIẢI QUYẾT)**: Cam kết độ sẵn sàng dịch vụ máy chủ đạt $\ge 99.9\%$ trong giờ hành chính (tối đa $\le 15.8\text{ phút/tháng}$ gián đoạn theo `NFR-SYS-008`, `SRS-009`); cam kết không thất thoát dữ liệu điểm danh ($\text{RPO} = 0$) tại trạm Kiosk qua hàng đợi SQLite WAL (`SRS-008`, `NFR-SYS-006`).
* **Định hướng Giảm thiểu Sai lệch Sinh trắc học & Kênh Dự phòng (`INF-013` & `SRC-009` — ĐÃ GIẢI QUYẾT)**: Nhằm triệt tiêu ảnh hưởng của hiện tượng sai lệch nhận diện theo nhân khẩu học (độ tuổi, sắc thái da theo NIST IR 8271 / `SRC-009`), hệ thống áp dụng cơ chế xác thực mã PIN dự phòng (`PD-008`, `SRS-005`, `FR-SYS-004`, `FR-SYS-017`) như kênh thay thế bắt buộc, đồng thời chuẩn hóa bộ dữ liệu kiểm thử nghiệm thu đa dạng lứa tuổi và điều kiện chiếu sáng tại `system-docs/plans/test-plan.md`.
* **Bảo vệ Khóa Master Key & An ninh RAM Kiosk (`INF-007` & `PD-005` — ĐÃ GIẢI QUYẾT)**: Vector mẫu giải mã lưu trong RAM Kiosk được bảo vệ bằng cơ chế cô lập tiến trình và bảo vệ vật lý thiết bị biên; khóa Master Key (`STK-034`) được nạp qua biến môi trường độc lập và không bao giờ commit vào kho lưu trữ mã nguồn.


