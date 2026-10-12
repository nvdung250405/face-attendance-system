---
title: Backend Foundation Setup Plan
version: 3.0
status: Approved
owner: Backend Lead & DevOps
type: plan
scope: BE
updated: 2026-10-12
---

# FOUNDATION SETUP PLAN — Kế hoạch Thiết lập Nền tảng Phân hệ Backend

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Chuẩn bị hoàn chỉnh môi trường phát triển, công cụ xây dựng, tiêu chuẩn đóng gói container, cơ chế sẵn sàng tích hợp và bộ khung kiểm thử hợp đồng cho phân hệ `app/backend-service`, kế thừa từ kế hoạch nền tảng hệ thống (`FND-SYS-001`, `FND-SYS-006`, `FND-SYS-008`).
* **Mục tiêu**:
  * Thiết lập môi trường Java 21 LTS và Apache Maven Wrapper (`./mvnw`) bảo đảm tính tái lập môi trường build.
  * Khởi tạo khung dự án Spring Boot 4.1.x với đầy đủ các starter: Web, Security, Data JPA, Validation, WebSocket STOMP, Actuator và Flyway.
  * Tích hợp cơ chế kiểm soát lược đồ CSDL tự động qua Flyway Migration trên PostgreSQL 16.
  * Cấu hình an ninh không trạng thái (Stateless Security) với JSON Web Token (JWT) và bộ nhớ đệm Caffeine.
  * Chuẩn hóa quy chuẩn đóng gói Dockerfile multi-stage chạy với tài khoản không đặc quyền (`appuser:appgroup`).
  * Cung cấp các endpoint sẵn sàng tích hợp: Actuator health check liveness/readiness, OpenAPI 3.0 documentation và graceful shutdown.
  * Cung cấp bộ khung kiểm thử hợp đồng (Contract Testing Harness) qua MockMvc và Testcontainers.

---

## 2. Approach Decisions (Quyết định Tiếp cận Nền tảng Backend)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-010` | Sử dụng Java 21 LTS kết hợp Maven Wrapper (`./mvnw`) để quản lý công cụ xây dựng và biên dịch. | Loại bỏ phụ thuộc vào việc cài đặt Maven toàn cục trên máy phát triển; bảo đảm môi trường build đồng nhất 100% giữa local và CI/CD runner. | Cài đặt Maven trực tiếp trên hệ điều hành của lập trình viên hoặc sử dụng Gradle (bị loại vì Gradle cấu hình phức tạp hơn, Maven chuẩn hóa hơn với Spring Boot). | File wrapper `mvnw`, `mvnw.cmd` và thư mục `.mvn/wrapper` được lưu vào kho mã nguồn; toàn bộ thành viên dự án và máy chủ build tự động tải cùng một bản Maven 3.9.x. | `STK-010`, `STK-023` | Accepted |
| `APC-BE-011` | Phân tách cấu hình đa môi trường qua Spring Profiles kết hợp biến môi trường `.env`. | Tách biệt rạch ròi giữa môi trường kiểm thử tự động (profile `test` dùng H2 in-memory chế độ `PostgreSQL`) và môi trường cục bộ; bảo mật tuyệt đối các khóa bí mật JWT và credential qua placeholder `${...}` thay vì hardcode. | Hardcode cấu hình kết nối CSDL và secret key trong `application.yml` (bị loại vì rủi ro lộ lọt bảo mật và không cô lập được môi trường kiểm thử). | Cấu hình chính nằm tại `src/main/resources/application.yml` (đọc biến môi trường), bộ test ghi đè bằng `src/test/resources/application.yml`; `./mvnw test` không cần Docker daemon, PostgreSQL 16 cục bộ chỉ cần khi phát triển qua `docker compose up -d`. | `SRS-001`, `STK-012` | Accepted |
| `APC-BE-012` | Chuẩn hóa đóng gói Dockerfile multi-stage không đặc quyền và phơi bày giám sát Actuator/OpenAPI. | Bảo đảm an ninh vận hành container trên môi trường tích hợp và sản xuất; giảm kích thước image; hỗ trợ giám sát liveness/readiness tự động. | Chạy container quyền root với fat jar JDK đầy đủ | Cần cấu hình tạo user non-root `appuser:appgroup` trong Alpine; phân quyền thư mục ứng dụng; cấu hình SecurityFilterChain cho phép Actuator và Swagger. | `STK-010`, `STK-022`, `STK-035` | Accepted |

---

## 3. Foundation Work Items (Hạng mục Thiết lập Nền tảng Backend)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-BE-001` | Cấu hình Java 21 Toolchain & Maven | Thiết lập Maven POM với Java 21 compiler, Spring Boot Starter Parent và cấu hình plugin phụ trợ. | `STK-010`, `STK-011`, `STK-023` | `FND-SYS-001` | Lệnh `./mvnw clean compile` thành công với zero warning; nhận diện đúng Java 21. | Done |
| `FND-BE-002` | Khởi tạo Khung Dự án Spring Boot | Khai báo các starter cốt lõi: Web, Security, Data JPA, Validation, WebSocket, Actuator, Flyway. | `STK-011` | `FND-BE-001` | Ứng dụng khởi động được ở profile `local` mà không ném lỗi bean wiring. | Done |
| `FND-BE-003` | Cấu hình Flyway Migration & DataSource | Thiết lập kết nối PostgreSQL qua `application.yml`, cấu hình Flyway kiểm soát thư mục `db/migration`. | `STK-013`, `STK-014` | `FND-BE-002` | Tự động tạo bảng `flyway_schema_history` và chạy các migration script ban đầu thành công. | Done |
| `FND-BE-004` | Cấu hình Spring Security & JWT Base | Thiết lập `SecurityFilterChain` không trạng thái (Stateless), bộ sinh và thẩm định JSON Web Token. | `STK-011`, `ARC-002` | `FND-BE-002` | Endpoint công khai truy cập bình thường; endpoint bảo vệ trả về 401 khi thiếu token. | Done |
| `FND-BE-005` | Cấu hình WebSocket STOMP Broker | Thiết lập endpoint `/ws-attendance` hỗ trợ SockJS fallback, message broker giản đơn cho topic `/topic`. | `STK-012`, `ARC-002` | `FND-BE-002` | Trình duyệt và Kiosk kết nối bắt tay STOMP thành công; gửi nhận ping frame ổn định. | Done |
| `FND-BE-006` | Chuẩn hóa Chuỗi Đóng gói Container Multi-stage | Xây dựng Dockerfile tiêu chuẩn multi-stage build (Temurin 21 JDK Alpine -> JRE Alpine), file `.dockerignore`, chạy dưới quyền tài khoản không đặc quyền `appuser:appgroup`, cấu hình Actuator healthcheck tích hợp. | `STK-010`, `STK-022`, `ARC-002` | `FND-BE-001`, `FND-BE-002` | Lệnh `docker build` tạo image thành công với kích thước $< 280\text{ MB}$; tiến trình chạy với user non-root; kiểm tra healthcheck container tự động báo `healthy`. | Done |
| `FND-BE-007` | Sẵn sàng Tích hợp & Giám sát Sức khỏe Dịch vụ | Cấu hình Spring Boot Actuator (`/actuator/health/liveness`, `/actuator/health/readiness`), tài liệu OpenAPI 3.0 / Swagger UI (`/v3/api-docs`, `/swagger-ui/index.html`) mở truy cập kiểm tra sức khỏe, cấu hình graceful shutdown. | `ARC-012`, `STK-035` | `FND-BE-002`, `FND-BE-004` | Truy vấn `/actuator/health` trả về HTTP 200 trạng thái `UP`; Swagger UI hiển thị thông suốt không bị chặn 401; dừng tiến trình hoàn tất các request dở dang. | Done |
| `FND-BE-008` | Bộ Khung Kiểm thử Hợp đồng & Giả lập Tích hợp | Thiết lập bộ khung kiểm thử hợp đồng REST API và WebSocket STOMP qua MockMvc và Testcontainers (kiểm tra tính khớp nối payload `KioskSyncBatchRequest`, `OfflinePunchRecord`, và STOMP frame). | `STK-026`, `ARC-002` | `FND-BE-002`, `FND-BE-003` | Toàn bộ 466 ca kiểm thử đơn vị và hợp đồng API pass 100% trong môi trường CI không cần máy chủ thật. | Done |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Yêu cầu Nền tảng JDK 21 LTS**: Máy trạm phát triển và máy chủ CI/CD phải được cài đặt JDK 21 (khuyến nghị bản phân phối Eclipse Temurin 21 LTS) và biến môi trường `JAVA_HOME` được trỏ chính xác.
* **Cổng Dịch vụ Mặc định**: Phân hệ Backend chạy mặc định trên cổng mạng `8080`; khi triển khai song song hoặc gặp xung đột cổng trên máy dev, có thể ghi đè linh hoạt qua tham số `-Dserver.port=...` hoặc thiết lập biến `SERVER_PORT` trong file `.env`.
* **Trạng thái Docker Daemon cho Integration Test**: Bộ test cục bộ chạy trên H2 in-memory ở chế độ `MODE=PostgreSQL` nên không cần Docker; khi cần kiểm thử trên PostgreSQL 16 thật (ví dụ trước khi phát hành), khởi động `docker compose up -d` để có CSDL cục bộ. Trong CI, PostgreSQL 16 được cung cấp bằng service container khai báo tại `.github/workflows/ci.yml`.
