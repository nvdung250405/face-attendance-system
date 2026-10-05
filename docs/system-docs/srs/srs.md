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
* **Tầng Biên (Edge Tier)**: Trạm Kiosk thu nhận video trực tiếp từ cảm biến camera, thực thi toàn bộ pipeline AI (phát hiện mặt, kiểm tra liveness, trích xuất vector 512D) và so khớp ma trận RAM cục bộ.
* **Tầng Máy chủ (Server Tier)**: Dịch vụ Backend tiếp nhận lượt chấm công, quản lý ca kíp, chống quét trùng Cooldown 120s, mã hóa bảo mật vector mẫu bằng AES-256-GCM và phát sóng sự kiện thời gian thực.
* **Tầng Trình diễn (Web Tier)**: Cổng Web Portal cung cấp Live Monitoring Dashboard thời gian thực, quản trị nhân sự, duyệt giải trình công và cổng tự phục vụ ký Informed Consent.

---

### 1.1. Actors (Sổ Đăng ký Tác nhân Người dùng)

| ID | Tác nhân (Actor Name) | Vai trò & Mục đích Tương tác trong Hệ thống | Quyền hạn Hệ thống |
| :--- | :--- | :--- | :--- |
| `ACT-001` | Nhân viên (Employee) | Điểm danh hàng ngày qua khuôn mặt/mã PIN tại trạm Kiosk; tự đăng ký mẫu mặt qua OTP; ký cam kết Informed Consent điện tử và gửi đơn giải trình công trên Cổng Web. | Role `EMPLOYEE` |
| `ACT-002` | Chuyên viên Nhân sự (HR Specialist) | Quản lý danh sách nhân sự, cấu hình ca kíp làm việc, theo dõi sĩ số trực tiếp đầu giờ trên Live Dashboard, duyệt đơn giải trình công và kết xuất báo cáo bảng công. | Role `HR` |
| `ACT-003` | Quản trị viên Hệ thống (System Admin / nvdung) | Cấu hình tham số vận hành, giám sát nhật ký audit log, quản lý tài khoản người dùng, giám sát kết nối mạng giữa Kiosk và Backend, sao lưu/phục hồi CSDL. | Role `ADMIN` |
| `ACT-004` | Cán bộ Bảo vệ Dữ liệu (DPO Reference) | Vai trò tham chiếu kiểm soát việc thực thi chính sách bảo vệ dữ liệu cá nhân theo Luật 2025, kiểm tra chữ ký thỏa thuận Consent và lịch trình tiêu hủy dữ liệu 20 ngày. | Audit Read-only |

---

### 1.2. External Systems & Devices (Hệ thống & Thiết bị Ngoại vi)

| ID | Tên Hệ thống / Thiết bị | Loại Giao tiếp | Giao thức / Ranh giới | Vai trò Kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| `EXT-001` | Camera Quang học UVC / Webcam | Thiết bị phần cứng USB | DirectShow / V4L2 | Cung cấp luồng khung hình video liên tục $\ge 15\text{ FPS}$ độ phân giải HD/Full HD. |
| `EXT-002` | CSDL PostgreSQL 16+ Doanh nghiệp | Dịch vụ CSDL trung tâm | TCP/IP (Port 5432, JPA/JDBC)| Lưu trữ bền vững dữ liệu nhân sự, ca kíp, bảng công và vector mã hóa BYTEA. |
| `EXT-003` | Nguồn Chuẩn Giờ Mạng (NTP Server) | Dịch vụ mạng hệ thống | NTP (UDP Port 123) | Đồng bộ mốc thời gian chuẩn giữa các trạm Kiosk và máy chủ Backend (sai lệch $< 50\text{ ms}$). |

---

## 2. Cross-cutting Requirements (Yêu cầu Xuyên suốt Toàn Hệ thống)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `SRS-001` | Toàn bộ vector đặc trưng sinh trắc học lưu trữ ở trạng thái tĩnh phải được mã hóa chuẩn đối xứng AES-256-GCM với khóa Master Key nạp độc lập từ biến môi trường. | Security | Must | `PD-005` | 100% vector trong bảng `biometric_templates` là ciphertext dạng BYTEA kèm IV 12 bytes và Auth Tag 16 bytes; không giải mã được nếu thiếu khóa môi trường. | Approved |
| `SRS-002` | Mọi luồng truyền thông mạng giữa Kiosk, Web Portal và Backend bắt buộc phải được mã hóa kênh truyền bằng TLS 1.3 (HTTPS) và Secure WebSocket (WSS) trên môi trường vận hành chính thức. | Security | Must | `PD-001` | Toàn bộ gói tin REST API và STOMP được mã hóa trên đường truyền; từ chối kết nối không an toàn trên production; cho phép cấu hình fallback HTTP/WS cục bộ ở môi trường phát triển. | Approved |
| `SRS-003` | Hệ thống phải tự động tiêu hủy vĩnh viễn (Hard Delete) mẫu dữ liệu sinh trắc học của nhân viên đã thôi việc sau đúng 20 ngày kể từ ngày chấm dứt hợp đồng lao động. | Compliance | Must | `PD-005` | Tác vụ ngầm định kỳ hàng ngày quét và xóa sạch bản ghi trong `biometric_templates` có `terminated_date <= CurrentDate - 20 days`; ghi nhật ký kiểm toán. | Approved |
| `SRS-004` | Tuyệt đối không lưu trữ ảnh chụp thô kích thước đầy đủ của nhân viên trên ổ đĩa trạm Kiosk hay máy chủ trung tâm (Zero Raw Image Retention). | Privacy | Must | `PD-005` | Khung hình camera chỉ tồn tại tạm thời trong RAM trong chu kỳ suy luận ($< 1\text{ giây}$) và lập tức được giải phóng bộ nhớ; không có file ảnh nào được ghi đĩa. | Approved |
| `SRS-005` | Mật khẩu tài khoản và mã PIN dự phòng phải được băm một chiều bằng thuật toán an toàn chống dò vét GPU (Argon2id hoặc BCrypt), cấm lưu văn bản rõ. | Security | Must | `PD-001` | Cột `pin_hash` trong CSDL lưu trữ hash an toàn; kiểm tra xác thực không lưu cache plaintext. | Approved |
| `SRS-006` | Hệ thống phải thực thi kiểm soát truy cập dựa trên vai trò (RBAC) thông qua mã thông báo JWT; đối với phiên làm việc web/API, sử dụng access token ngắn hạn kèm refresh token an toàn hoặc token phiên tối đa một ca làm việc (8 giờ). | Security | Must | `PD-001` | Mọi API quản trị đều yêu cầu header `Authorization: Bearer <JWT>`; từ chối truy cập 403 Forbidden nếu không đủ quyền hạn. | Approved |
| `SRS-007` | Khi xuất dữ liệu bảng công ra file Excel/CSV, hệ thống phải tự động vô hiệu hóa mã độc chèn công thức (Anti-Formula Injection / CWE-1236). | Security | Should | `INF-003` | Tự động chèn dấu nháy đơn (`'`) trước các ô dữ liệu văn bản bắt đầu bằng các ký tự `=`, `+`, `-`, `@`. | Approved |
| `SRS-008` | Hệ thống phải duy trì khả năng vận hành độc lập tại biên (Offline-first resilient), đảm bảo không thất thoát dữ liệu ($\text{RPO} = 0$) khi mất kết nối mạng. | Reliability | Must | `PD-004` | Trạm Kiosk tiếp tục nhận diện bình thường, ghi đệm vào SQLite WAL và tự động gửi bù đủ 100% số bản ghi khi mạng phục hồi. | Approved |
| `SRS-009` | Hệ thống phải đảm bảo hoạt động liên tục 24/7 với độ sẵn sàng dịch vụ tối thiểu 99.9% trong giờ làm việc hành chính. | Availability | Must | `PD-001`, `INF-011` | Backend cung cấp endpoint giám sát sức khỏe `/actuator/health`; Kiosk có vòng lặp tự phục hồi kết nối camera mỗi 3 giây. | Approved |
| `SRS-010` | Toàn bộ các sự kiện điểm danh, đăng ký khuôn mặt, duyệt giải trình và xóa dữ liệu phải được ghi nhật ký kiểm toán (Audit Trail) không thể chỉnh sửa. | Auditing | Must | `INF-009` | Lưu trữ bản ghi trong bảng `audit_logs` có đầy đủ mốc thời gian, IP, tác nhân và hành vi nghiệp vụ. | Approved |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Chi tiết Mô hình Token JWT (Decision 1)**: Thời hạn hiệu lực của access token (khuyến nghị 60 phút) và refresh token (7 ngày) kết hợp bảng lưu trữ refresh token trên máy chủ để hỗ trợ thu hồi quyền tức thì (revocation) khi nhân viên thôi việc đột xuất. Điều kiện resolve: chốt chi tiết tại thiết kế `service-docs/backend-service/fr-nfr/fr-nfr-design.md`.
* **Ranh giới Cấu hình TLS/WSS (Decision 10)**: Việc kết thúc TLS (TLS termination) được cấu hình tại Reverse Proxy (Nginx / Caddy / Cloudflare) khi đưa vào môi trường Production; mã nguồn ứng dụng nội bộ cho phép chạy HTTP/WS thuần để tối giản môi trường kiểm thử phát triển cục bộ. Điều kiện resolve: quy định chi tiết tại `system-docs/plans/deploy-plan.md`.
