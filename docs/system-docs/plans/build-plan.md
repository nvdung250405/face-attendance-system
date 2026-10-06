---
title: System Build Plan
version: 1.0
status: Approved
owner: Technical Lead
---

# BUILD PLAN — Kế hoạch Xây dựng & Tích hợp Hệ thống

Kế hoạch điều phối thi công mã nguồn, cấu hình môi trường đóng gói và tích hợp liên thông các phân hệ cho toàn bộ Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §9.4).

---

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Thi công mã nguồn và tích hợp liên thông 3 phân hệ `kiosk-app`, `backend-service`, và `web-portal` trong kiến trúc tổng thể Monorepo.
* **Mục tiêu**:
  * Hiện thực hóa pipeline AI biên, máy trạng thái giao diện và bộ đệm SQLite WAL cho Kiosk.
  * Xây dựng lõi nghiệp vụ chấm công, mã hóa bảo mật AES-256-GCM, CSDL PostgreSQL và WebSocket STOMP cho Backend.
  * Hiện thực hóa Live Dashboard giám sát thời gian thực và các mô-đun quản trị nhân sự, consent cho Web Portal.
  * Tích hợp toàn trình (End-to-End) thông suốt và đóng gói điều phối qua Docker Compose.

---

## 2. Approach Decisions (Quyết định Tiếp cận Thi công)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-007` | Thứ tự thi công: Từ Biên đến Trung tâm rồi ra Trình diễn (Edge $\rightarrow$ Backend $\rightarrow$ Web $\rightarrow$ E2E). | Kiểm soát sớm các rủi ro phức tạp nhất về thị giác máy tính và phần cứng camera tại biên trước khi tích hợp hệ thống. | Triển khai Backend trước, Triển khai đồng thời cả 3 không ưu tiên | Cần mock dữ liệu API giai đoạn đầu khi Kiosk cần giao tiếp Backend. | `PRJ-001`, `ARC-001` | Accepted |
| `APC-SYS-008` | Đảm bảo tính độc lập và khả năng giả lập dịch vụ (Mocking/Decoupled Build). | Các phân hệ Kiosk và Web có thể phát triển song song với Backend dựa trên hợp đồng OpenAPI và STOMP Contract đã duyệt. | Chờ Backend hoàn tất 100% mới làm Kiosk/Web | Tiết kiệm thời gian, tăng tốc độ hoàn thành dự án cho solo developer. | `ARC-002`, `APC-SYS-001` | Accepted |
| `APC-SYS-009` | Tích hợp liên tục và xác thực tự động trên từng gói tính năng. | Mỗi work item hoàn thành phải vượt qua bộ test unit/integration tương ứng trước khi chuyển sang work item kế tiếp. | Gom toàn bộ kiểm thử vào giai đoạn cuối | Duy trì chất lượng mã nguồn cao và phát hiện lỗi hồi quy tức thời. | `APC-SYS-002`, `NFR-SYS-001` | Accepted |
| `APC-SYS-016` | Quy trình nhánh và hợp nhất trên nhánh tích hợp `develop`. | Repo dùng `develop` làm nhánh tích hợp liên tục: mọi thay đổi đi qua nhánh ngắn `<type>/<ID>-<slug>` tạo từ `develop`, hợp nhất bằng Pull Request squash rồi tự động xóa nhánh. | Dùng trực tiếp `main` làm nhánh tích hợp, Push trực tiếp không qua PR | Ruleset bắt buộc kiểm tra status checks `ci-passed` và `docs-check`, chặn force-push và xóa nhánh. | `STK-021`, `STK-029`, `APC-SYS-004` | Accepted |
| `APC-SYS-017` | Miễn yêu cầu approval tối thiểu ở ruleset khi code owner trùng tác giả. | Solo developer không thể tự approve Pull Request của chính mình trên GitHub; thay thế bằng bắt buộc giải quyết hội thoại review và biên bản review tự động. | Bật approval tối thiểu 1 kèm quyền bypass admin, Bỏ hẳn review | Ruleset đặt `required_approving_review_count = 0`; khi có reviewer thứ hai sẽ bật lại mức tối thiểu 1 approval. | `STK-029`, `APC-SYS-009` | Accepted |

---

## 3. Build Configuration (Cấu hình Môi trường Đóng gói)

| Phân hệ | Môi trường / Ngôn ngữ | Trình Quản lý Gói & Build Tool | Đầu ra Đóng gói (Build Artifacts) |
| :--- | :--- | :--- | :--- |
| **Kiosk App** | Python 3.14 / PySide6 | `pip`, Virtualenv, PyInstaller | Standalone Executable (`FAS_Kiosk.exe`) |
| **Backend Service**| Java 21 LTS / Spring Boot 4.1 | Apache Maven 3.9+ (`./mvnw`) | Executable Uber JAR (`backend-service-1.0.jar`) |
| **Web Portal** | Node.js 24+ / TypeScript 6.x | `npm` / Vite 8.x | Static SPA Bundle (`dist/`) |
| **Hạ tầng Cụm** | Docker 29+, Compose V2 | `docker-compose.yml` | Multi-container stack (PostgreSQL + Backend + Web Nginx) |

---

## 4. System Build Work Items (Danh mục Hạng mục Thi công Hệ thống)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-SYS-001` | Xây dựng Pipeline AI Biên cho Kiosk | Hiện thực hóa module đọc camera đa luồng, tích hợp YuNet, MiniFASNet, ArcFace và ma trận RAM NumPy tối ưu trên CPU AVX2. | `ARC-001`, `ARC-007`, `DD-SYS-001`, `DD-SYS-002`, `DD-SYS-005`, `DD-SYS-027` | `FND-SYS-002`, `FND-SYS-003` | Chu kỳ nhận diện hoàn tất $\le 350\text{ ms}$; nhận diện đúng $\ge 95\%$, chặn giả mạo $\ge 98\%$. | Done |
| `BLD-SYS-002` | Xây dựng Giao diện Kiosk & PIN Pad | Thiết kế UI PySide6 tỷ lệ 9:16, máy trạng thái viền oval 4 màu, bàn phím số ảo PIN dự phòng và quy trình nạp mẫu In-Viewport. | `ARC-001`, `DD-SYS-009`, `DD-SYS-010`, `DD-SYS-011` | `BLD-SYS-001` | Màn hình phản hồi tức thì $\le 50\text{ ms}$; bàn phím khóa 15p sau 5 lần sai; popup tự ẩn ở Bước 2. | Done |
| `BLD-SYS-003` | Xây dựng Hàng đợi Ngoại tuyến SQLite WAL | Quản lý kết nối `kiosk_local.db` chế độ WAL với `PRAGMA synchronous = FULL`, lưu đệm lượt quẹt khi mất mạng và luồng đồng bộ ngầm định kỳ 10s. | `ARC-001`, `ARC-007`, `DD-SYS-002`, `DD-SYS-013` | `BLD-SYS-001` | Ngắt mạng điểm danh bình thường; khi có mạng gửi bù lô tối đa 50 bản ghi thành công 100%. | Done |
| `BLD-SYS-004` | Xây dựng CSDL Quan hệ PostgreSQL | Tạo các bảng theo lược đồ DDL, thiết lập khóa ngoại và chỉ mục hiệu năng cao bằng Flyway Migration. | `ARC-004`, `DD-SYS-015`, `DD-SYS-016` | `FND-SYS-006` | Toàn bộ các bảng CSDL được khởi tạo chính xác; migration tự động chạy khi khởi động Spring Boot. | Planned |
| `BLD-SYS-005` | Xây dựng Lõi Nghiệp vụ & Bảo mật Backend | Xử lý ca kíp, ân hạn 15p, bộ đệm Cooldown 120s hai lớp (Caffeine + DB fallback), mã hóa AES-256-GCM và cron job tiêu hủy sau 20 ngày. | `ARC-002`, `DD-SYS-003`, `DD-SYS-006`, `DD-SYS-007`, `DD-SYS-008`, `DD-SYS-025`, `DD-SYS-028` | `BLD-SYS-004` | Chống quẹt lặp 120s; vector được mã hóa ciphertext; tự động xóa dữ liệu thôi việc quá 20 ngày. | Planned |
| `BLD-SYS-006` | Xây dựng Hệ thống REST API & STOMP Broker | Phát triển các endpoint RESTful và cấu hình Spring WebSocket Message Broker phát sóng các topic thời gian thực; tích hợp bảo vệ brute-force và audit log. | `ARC-002`, `ARC-005`, `ARC-006`, `ARC-012`, `ARC-013`, `ARC-015`, `ARC-016`, `DD-SYS-004`, `DD-SYS-012`, `DD-SYS-014`, `DD-SYS-017`, `DD-SYS-018`, `DD-SYS-019`, `DD-SYS-020`, `DD-SYS-021`, `DD-SYS-022`, `DD-SYS-023`, `DD-SYS-024`, `DD-SYS-026` | `BLD-SYS-005` | Kiosk gọi API thành công; thông điệp điểm danh đẩy tới topic trong vòng $\le 200\text{ ms}$; quản lý hồ sơ, ca kíp, phân ca, đơn giải trình và chốt kỳ công thông suốt. | Planned |
| `BLD-SYS-007` | Xây dựng Màn hình Live Dashboard trên Web | Thiết kế giao diện ReactJS nhận tin STOMP, hiển thị thẻ sĩ số trực quan và bảng danh sách lượt chấm cuộn mượt. | `ARC-003`, `DD-SYS-004`, `DD-SYS-009` | `BLD-SYS-006` | Dashboard tự cập nhật tức thời khi có người chấm công mà không cần tải lại trang Web. | Planned |
| `BLD-SYS-008` | Xây dựng Quản trị Nhân sự & Cổng Tự phục vụ | Phát triển giao diện quản lý nhân viên, phân ca, modal ký cam kết Informed Consent, cấp mã OTP và xuất file Excel an toàn. | `ARC-003`, `ARC-017`, `ARC-018`, `DD-SYS-008`, `DD-SYS-017`, `DD-SYS-023`, `DD-SYS-024` | `BLD-SYS-006` | Nhân viên ký Consent số; mã OTP sinh đúng hạn 48h; file Excel xuất ra sạch mã độc công thức; HR quản lý nhân sự hoàn chỉnh. | Planned |
| `BLD-SYS-009` | Tích hợp Toàn trình & Đóng gói Docker Compose | Kết nối đồng bộ toàn bộ luồng dữ liệu 3 phân hệ, viết cấu hình `docker-compose.yml` điều phối toàn bộ cụm dịch vụ. | `ARC-001`, `ARC-002`, `ARC-003`, `ARC-004`, `ARC-005`, `ARC-008`, `ARC-009`, `ARC-010`, `ARC-011`, `ARC-014` | `BLD-SYS-001`, `BLD-SYS-002`, `BLD-SYS-003`, `BLD-SYS-004`, `BLD-SYS-005`, `BLD-SYS-006`, `BLD-SYS-007`, `BLD-SYS-008` | Chạy 1 lệnh `docker compose up -d` khởi động toàn bộ môi trường; kiểm thử E2E thông suốt. | Planned |
| `BLD-SYS-010` | Kiểm định Build Kiosk Standalone | Thực thi kịch bản chạy Kiosk UI và camera loop. | `ARC-001` | `BLD-SYS-002` | Ứng dụng khởi động ổn định ở 30 FPS, không treo giao diện. | Done |
| `BLD-SYS-011` | Kiểm định Package Spring Boot JAR | Chạy `./mvnw package -DskipTests=false`. | `ARC-002` | `BLD-SYS-005` | Tạo tệp JAR hoàn chỉnh, toàn bộ unit test JPA và Security pass. | Planned |
| `BLD-SYS-012` | Kiểm định Bundle Frontend SPA | Chạy `npm run build`. | `ARC-003` | `BLD-SYS-008` | Bundle tối ưu hóa được xuất ra thư mục `dist/` không lỗi. | Planned |
| `BLD-SYS-013` | Kiểm định Triển khai Docker E2E | Khởi động compose stack và kiểm tra health check. | `ARC-004`, `ARC-005` | `BLD-SYS-009` | Cả 3 dịch vụ `backend`, `web`, `db` đều đạt trạng thái `healthy`. | Planned |

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Phân định Trách nhiệm Xây dựng (System vs Subsystem Scope)**: `BLD-SYS-001` .. `BLD-SYS-009` định nghĩa các hạng mục tích hợp cấp hệ thống; việc thi công chi tiết mã nguồn và kiểm thử tương ứng được cụ thể hóa tại các tài liệu `build-plan.md` và `task-plan.md` của từng dịch vụ (`kiosk-app`, `backend-service`, `web-portal`).
* **Tính Sẵn sàng của Hợp đồng Tích hợp**: Giai đoạn phát triển Kiosk và Web Portal độc lập dựa trên OpenAPI Contract và STOMP Contract giả lập; kiểm thử tích hợp thực tế với Backend được kích hoạt ngay khi hoàn thành `BLD-SYS-006`.
