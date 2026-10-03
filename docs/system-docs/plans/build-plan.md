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

| ID | Quyết định Tiếp cận Thi công | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-007` | Thứ tự thi công: Từ Biên đến Trung tâm rồi ra Trình diễn (Edge $\rightarrow$ Backend $\rightarrow$ Web $\rightarrow$ E2E). | Kiểm soát sớm các rủi ro phức tạp nhất về thị giác máy tính và phần cứng camera tại biên trước khi tích hợp hệ thống. | `PRJ-SYS-001`, `SOL-SYS-001` | Approved |
| `APC-SYS-008` | Đảm bảo tính độc lập và khả năng giả lập dịch vụ (Mocking/Decoupled Build). | Các phân hệ Kiosk và Web có thể phát triển song song với Backend dựa trên hợp đồng OpenAPI và STOMP Contract đã duyệt. | `APD-SYS-001`, `APC-SYS-001` | Approved |
| `APC-SYS-009` | Tích hợp liên tục và xác thực tự động trên từng gói tính năng. | Mỗi work item hoàn thành phải vượt qua bộ test unit/integration tương ứng trước khi chuyển sang work item kế tiếp. | `APC-SYS-002`, `NFR-SYS-001` | Approved |

---

## 3. Build Configuration (Cấu hình Môi trường Đóng gói)

| Phân hệ | Môi trường / Ngôn ngữ | Trình Quản lý Gói & Build Tool | Đầu ra Đóng gói (Build Artifacts) |
| :--- | :--- | :--- | :--- |
| **Kiosk App** | Python 3.14 / PySide6 | `pip`, Virtualenv | Standalone App / Python executable script |
| **Backend Service**| Java 21 LTS / Spring Boot 3.3 | Apache Maven 3.9+ (`./mvnw`) | Executable Uber JAR (`backend-service-1.0.jar`) |
| **Web Portal** | Node.js 20+ / TypeScript 5.x | `npm` / Vite 5.x | Static SPA Bundle (`dist/`) |
| **Hạ tầng Cụm** | Docker 26+, Compose V2 | `docker-compose.yml` | Multi-container stack (PostgreSQL + Backend + Web Nginx) |

---

## 4. System Build Work Items (Danh mục Hạng mục Thi công Hệ thống)

| ID | Hạng mục Thi công (Work Item) | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-SYS-001` | Xây dựng Pipeline AI Biên cho Kiosk | Hiện thực hóa module đọc camera đa luồng, tích hợp YuNet, MiniFASNet, ArcFace và ma trận RAM NumPy. | `SOL-SYS-001` đến `SOL-SYS-006` | `FND-SYS-002`, `FND-SYS-003` | Chu kỳ nhận diện hoàn tất $\le 350\text{ ms}$; nhận diện đúng $\ge 95\%$, chặn giả mạo $\ge 98\%$. | **Hoàn thành** |
| `BLD-SYS-002` | Xây dựng Giao diện Kiosk & PIN Pad | Thiết kế UI PySide6 tỷ lệ 9:16, máy trạng thái viền oval 4 màu, bàn phím số ảo PIN dự phòng và quy trình đăng ký In-Viewport. | `UXD-SYS-001` đến `UXD-SYS-004` | `BLD-SYS-001` | Màn hình phản hồi tức thì $\le 50\text{ ms}$; bàn phím khóa 15p sau 5 lần sai; popup tự ẩn ở Bước 2. | **Hoàn thành** |
| `BLD-SYS-003` | Xây dựng Hàng đợi Ngoại tuyến SQLite WAL | Quản lý kết nối `kiosk_local.db` chế độ WAL, lưu đệm lượt quẹt khi mất mạng và luồng đồng bộ ngầm định kỳ 10s. | `SOL-SYS-008`, `DTD-SYS-002` | `BLD-SYS-001` | Ngắt mạng điểm danh bình thường; khi có mạng gửi bù lô tối đa 50 bản ghi thành công 100%. | **Hoàn thành** |
| `BLD-SYS-004` | Xây dựng CSDL Quan hệ PostgreSQL | Tạo các bảng theo lược đồ DDL, thiết lập khóa ngoại và chỉ mục hiệu năng cao bằng Flyway Migration. | `DTD-SYS-001` đến `DTD-SYS-009` | `FND-SYS-006` | Toàn bộ 9 bảng CSDL được khởi tạo chính xác; migration tự động chạy khi khởi động Spring Boot. | Sẵn sàng |
| `BLD-SYS-005` | Xây dựng Lõi Nghiệp vụ & Bảo mật Backend | Xử lý ca kíp, ân hạn 15p, bộ đệm Cooldown 120s Caffeine, mã hóa AES-256-GCM và cron job tiêu hủy sau 20 ngày. | `SOL-SYS-007`, `SOL-SYS-009` đến `SOL-SYS-011` | `BLD-SYS-004` | Chống quẹt lặp 120s; vector được mã hóa ciphertext; tự động xóa dữ liệu thôi việc quá 20 ngày. | Sẵn sàng |
| `BLD-SYS-006` | Xây dựng Hệ thống REST API & STOMP Broker | Phát triển các endpoint RESTful và cấu hình Spring WebSocket Message Broker phát sóng các topic thời gian thực. | `APD-SYS-001` đến `APD-SYS-009`, `SOL-SYS-012` | `BLD-SYS-005` | Kiosk gọi API thành công; thông điệp điểm danh đẩy tới topic trong vòng $\le 200\text{ ms}$. | Sẵn sàng |
| `BLD-SYS-007` | Xây dựng Màn hình Live Dashboard trên Web | Thiết kế giao diện ReactJS nhận tin STOMP, hiển thị thẻ sĩ số trực quan và bảng danh sách lượt chấm cuộn mượt. | `UXD-SYS-005`, `FR-SYS-015` | `BLD-SYS-006` | Dashboard tự cập nhật tức thời khi có người chấm công mà không cần tải lại trang Web. | Kế hoạch |
| `BLD-SYS-008` | Xây dựng Quản trị Nhân sự & Cổng Tự phục vụ | Phát triển giao diện quản lý nhân viên, phân ca, modal ký cam kết Informed Consent, cấp mã OTP và xuất file Excel. | `UXD-SYS-006`, `FR-SYS-007`, `FR-SYS-016` | `BLD-SYS-006` | Nhân viên ký Consent số; mã OTP sinh đúng hạn 48h; file Excel xuất ra sạch mã độc công thức. | Kế hoạch |
| `BLD-SYS-009` | Tích hợp Toàn trình & Đóng gói Docker Compose | Kết nối đồng bộ toàn bộ luồng dữ liệu 3 phân hệ, viết cấu hình `docker-compose.yml` điều phối toàn bộ cụm dịch vụ. | `ARC-SYS-001` đến `ARC-SYS-004` | `BLD-SYS-001` đến `BLD-SYS-008` | Chạy 1 lệnh `docker compose up -d` khởi động toàn bộ môi trường; kiểm thử E2E thông suốt. | Kế hoạch |

---

## 5. Verification Plan (Kế hoạch Kiểm định Xây dựng)

| ID | Hạng mục Kiểm định | Thủ tục Xác thực | Covers | Tiêu chuẩn Đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `VER-SYS-005` | Kiểm định Build Kiosk Standalone | Thực thi kịch bản chạy Kiosk UI và camera loop. | `BLD-SYS-001`, `BLD-SYS-002` | Ứng dụng khởi động ổn định ở 30 FPS, không treo giao diện. | Passed |
| `VER-SYS-006` | Kiểm định Package Spring Boot JAR | Chạy `./mvnw package -DskipTests=false` | `BLD-SYS-004`, `BLD-SYS-005` | Tạo tệp JAR hoàn chỉnh, toàn bộ unit test JPA và Security pass. | Planned |
| `VER-SYS-007` | Kiểm định Bundle Frontend SPA | Chạy `npm run build` | `BLD-SYS-007`, `BLD-SYS-008` | Bundle tối ưu hóa được xuất ra thư mục `dist/` không lỗi. | Planned |
| `VER-SYS-008` | Kiểm định Triển khai Docker E2E | Khởi động compose stack và kiểm tra health check. | `BLD-SYS-009` | Cả 3 dịch vụ `backend`, `web`, `db` đều đạt trạng thái `healthy`. | Planned |
