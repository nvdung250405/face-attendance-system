---
title: System Build Plan
version: 1.0
status: Approved
owner: Technical Lead
---

# BUILD PLAN — Kế hoạch Xây dựng & Tích hợp Hệ thống

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Thi công mã nguồn và tích hợp liên thông 3 phân hệ `kiosk-app`, `backend-service`, và `web-portal` trong kiến trúc tổng thể Monorepo.
* **Mục tiêu**:
  * Hiện thực hóa pipeline AI biên, máy trạng thái giao diện và bộ đệm SQLite WAL cho Kiosk.
  * Xây dựng lõi nghiệp vụ chấm công, mã hóa bảo mật, CSDL PostgreSQL và WebSocket STOMP cho Backend.
  * Hiện thực hóa Dashboard giám sát thời gian thực và các mô-đun quản trị nhân sự, consent cho Web Portal.
  * Tích hợp toàn trình (End-to-End) thông suốt và đóng gói điều phối qua Docker Compose.

---

## 2. Approach Decisions (Quyết định Tiếp cận Thi công)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-007` | Thứ tự thi công: Từ Biên đến Trung tâm rồi ra Trình diễn (Edge $\rightarrow$ Backend $\rightarrow$ Web $\rightarrow$ E2E). | Kiểm soát sớm các rủi ro phức tạp nhất về thị giác máy tính và phần cứng camera tại biên trước khi tích hợp hệ thống. | Triển khai Backend trước, Triển khai đồng thời cả 3 không ưu tiên | Cần mock dữ liệu API giai đoạn đầu khi Kiosk cần giao tiếp Backend. | `PRJ-001`, `SOL-SYS-001` | Accepted |
| `APC-SYS-008` | Đảm bảo tính độc lập và khả năng giả lập dịch vụ (Mocking/Decoupled Build). | Các phân hệ Kiosk và Web có thể phát triển song song với Backend dựa trên hợp đồng OpenAPI và STOMP Contract đã duyệt. | Chờ Backend hoàn tất 100% mới làm Kiosk/Web | Tiết kiệm thời gian, tăng tốc độ hoàn thành dự án cho solo developer. | `APD-SYS-001`, `APC-SYS-001` | Accepted |
| `APC-SYS-009` | Tích hợp liên tục và xác thực tự động trên từng gói tính năng. | Mỗi work item hoàn thành phải vượt qua bộ test unit/integration tương ứng trước khi chuyển sang work item kế tiếp. | Gom toàn bộ kiểm thử vào giai đoạn cuối | Duy trì chất lượng mã nguồn cao và phát hiện lỗi hồi quy tức thời. | `APC-SYS-002`, `NFR-SYS-001` | Accepted |

---

## 3. Build Configuration (Cấu hình Môi trường Đóng gói)

| Phân hệ | Môi trường / Ngôn ngữ | Trình Quản lý Gói & Build Tool | Đầu ra Đóng gói (Build Artifacts) |
| :--- | :--- | :--- | :--- |
| **Kiosk App** | Python 3.14 / PySide6 | `pip`, Virtualenv | Standalone App / Python executable script |
| **Backend Service**| Java 21 LTS / Spring Boot 4.1 | Apache Maven 3.9+ (`./mvnw`) | Executable Uber JAR (`backend-service-1.0.jar`) |
| **Web Portal** | Node.js 24+ / TypeScript 6.x | `npm` / Vite 8.x | Static SPA Bundle (`dist/`) |
| **Hạ tầng Cụm** | Docker 29+, Compose V2 | `docker-compose.yml` | Multi-container stack (PostgreSQL + Backend + Web Nginx) |

---

## 4. System Build Work Items (Danh mục Hạng mục Thi công Hệ thống)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-SYS-001` | Xây dựng Pipeline AI Biên cho Kiosk | Hiện thực hóa module đọc camera đa luồng, tích hợp YuNet, MiniFASNet, ArcFace và ma trận RAM NumPy. | `SOL-SYS-001`, `SOL-SYS-002`, `SOL-SYS-003`, `SOL-SYS-004`, `SOL-SYS-005`, `SOL-SYS-006` | `FND-SYS-002`, `FND-SYS-003` | Chu kỳ nhận diện hoàn tất $\le 350\text{ ms}$; nhận diện đúng $\ge 95\%$, chặn giả mạo $\ge 98\%$. | Done |
| `BLD-SYS-002` | Xây dựng Giao diện Kiosk & PIN Pad | Thiết kế UI PySide6 tỷ lệ 9:16, máy trạng thái viền oval 4 màu, bàn phím số ảo PIN dự phòng và quy trình đăng ký In-Viewport. | `UXD-SYS-001`, `UXD-SYS-002`, `UXD-SYS-003`, `UXD-SYS-004` | `BLD-SYS-001` | Màn hình phản hồi tức thì $\le 50\text{ ms}$; bàn phím khóa 15p sau 5 lần sai; popup tự ẩn ở Bước 2. | Done |
| `BLD-SYS-003` | Xây dựng Hàng đợi Ngoại tuyến SQLite WAL | Quản lý kết nối `kiosk_local.db` chế độ WAL, lưu đệm lượt quẹt khi mất mạng và luồng đồng bộ ngầm định kỳ 10s. | `SOL-SYS-008`, `DTD-SYS-010` | `BLD-SYS-001` | Ngắt mạng điểm danh bình thường; khi có mạng gửi bù lô tối đa 50 bản ghi thành công 100%. | Done |
| `BLD-SYS-004` | Xây dựng CSDL Quan hệ PostgreSQL | Tạo các bảng theo lược đồ DDL, thiết lập khóa ngoại và chỉ mục hiệu năng cao bằng Flyway Migration. | `DTD-SYS-001`, `DTD-SYS-002`, `DTD-SYS-003`, `DTD-SYS-004`, `DTD-SYS-005`, `DTD-SYS-006`, `DTD-SYS-007`, `DTD-SYS-008`, `DTD-SYS-009` | `FND-SYS-006` | Toàn bộ 9 bảng CSDL được khởi tạo chính xác; migration tự động chạy khi khởi động Spring Boot. | Planned |
| `BLD-SYS-005` | Xây dựng Lõi Nghiệp vụ & Bảo mật Backend | Xử lý ca kíp, ân hạn 15p, bộ đệm Cooldown 120s Caffeine, mã hóa AES-256-GCM và cron job tiêu hủy sau 20 ngày. | `SOL-SYS-007`, `SOL-SYS-009`, `SOL-SYS-010`, `SOL-SYS-011` | `BLD-SYS-004` | Chống quẹt lặp 120s; vector được mã hóa ciphertext; tự động xóa dữ liệu thôi việc quá 20 ngày. | Planned |
| `BLD-SYS-006` | Xây dựng Hệ thống REST API & STOMP Broker | Phát triển các endpoint RESTful và cấu hình Spring WebSocket Message Broker phát sóng các topic thời gian thực. | `APD-SYS-001`, `APD-SYS-002`, `APD-SYS-003`, `APD-SYS-004`, `APD-SYS-005`, `APD-SYS-006`, `APD-SYS-007`, `APD-SYS-008`, `APD-SYS-009`, `SOL-SYS-012` | `BLD-SYS-005` | Kiosk gọi API thành công; thông điệp điểm danh đẩy tới topic trong vòng $\le 200\text{ ms}$. | Planned |
| `BLD-SYS-007` | Xây dựng Màn hình Live Dashboard trên Web | Thiết kế giao diện ReactJS nhận tin STOMP, hiển thị thẻ sĩ số trực quan và bảng danh sách lượt chấm cuộn mượt. | `UXD-SYS-005`, `SOL-SYS-012` | `BLD-SYS-006` | Dashboard tự cập nhật tức thời khi có người chấm công mà không cần tải lại trang Web. | Planned |
| `BLD-SYS-008` | Xây dựng Quản trị Nhân sự & Cổng Tự phục vụ | Phát triển giao diện quản lý nhân viên, phân ca, modal ký cam kết Informed Consent, cấp mã OTP và xuất file Excel. | `UXD-SYS-006`, `SOL-SYS-013` | `BLD-SYS-006` | Nhân viên ký Consent số; mã OTP sinh đúng hạn 48h; file Excel xuất ra sạch mã độc công thức. | Planned |
| `BLD-SYS-009` | Tích hợp Toàn trình & Đóng gói Docker Compose | Kết nối đồng bộ toàn bộ luồng dữ liệu 3 phân hệ, viết cấu hình `docker-compose.yml` điều phối toàn bộ cụm dịch vụ. | `ARC-001`, `ARC-002`, `ARC-003`, `ARC-004` | `BLD-SYS-001`, `BLD-SYS-002`, `BLD-SYS-003`, `BLD-SYS-004`, `BLD-SYS-005`, `BLD-SYS-006`, `BLD-SYS-007`, `BLD-SYS-008` | Chạy 1 lệnh `docker compose up -d` khởi động toàn bộ môi trường; kiểm thử E2E thông suốt. | Planned |

---

## 5. Verification Plan (Kế hoạch Kiểm định Xây dựng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-SYS-010` | Kiểm định Build Kiosk Standalone | Thực thi kịch bản chạy Kiosk UI và camera loop. | `ARC-001` | `BLD-SYS-002` | Ứng dụng khởi động ổn định ở 30 FPS, không treo giao diện. | Done |
| `BLD-SYS-011` | Kiểm định Package Spring Boot JAR | Chạy `./mvnw package -DskipTests=false`. | `ARC-002` | `BLD-SYS-005` | Tạo tệp JAR hoàn chỉnh, toàn bộ unit test JPA và Security pass. | Planned |
| `BLD-SYS-012` | Kiểm định Bundle Frontend SPA | Chạy `npm run build`. | `ARC-003` | `BLD-SYS-008` | Bundle tối ưu hóa được xuất ra thư mục `dist/` không lỗi. | Planned |
| `BLD-SYS-013` | Kiểm định Triển khai Docker E2E | Khởi động compose stack và kiểm tra health check. | `ARC-004` | `BLD-SYS-009` | Cả 3 dịch vụ `backend`, `web`, `db` đều đạt trạng thái `healthy`. | Planned |

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Phân định Trách nhiệm Xây dựng (System vs Service Scope)**: `BLD-SYS-001` .. `BLD-SYS-008` định nghĩa các hạng mục tích hợp cấp hệ thống; việc thi công chi tiết mã nguồn và kiểm thử tương ứng được cụ thể hóa tại các tài liệu `fr-nfr-build-plan.md` và `task-plan.md` của từng dịch vụ (`kiosk-app`, `backend-service`, `web-portal`).
* **Tính Sẵn sàng của Hợp đồng Tích hợp**: Giai đoạn phát triển Kiosk và Web Portal độc lập dựa trên OpenAPI Contract và STOMP Contract giả lập; kiểm thử tích hợp thực tế với Backend được kích hoạt ngay khi hoàn thành `BLD-SYS-006`.

