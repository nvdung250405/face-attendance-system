---
title: Backend Foundation Setup Plan
version: 2.0
status: Approved
owner: Backend Lead & DevOps
---

# FOUNDATION SETUP PLAN — Kế hoạch Thiết lập Nền tảng Phân hệ Backend

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Chuẩn bị hoàn chỉnh môi trường phát triển, công cụ xây dựng, cấu hình khung dự án Spring Boot và kết nối cơ sở dữ liệu cho phân hệ `app/backend-service`, kế thừa từ kế hoạch nền tảng hệ thống (`FND-SYS-001`, `FND-SYS-003`).
* **Mục tiêu**:
  * Thiết lập môi trường Java 21 LTS và Apache Maven Wrapper (`./mvnw`) bảo đảm tính tái lập môi trường build.
  * Khởi tạo khung dự án Spring Boot 4.1.x với đầy đủ các starter: Web, Security, Data JPA, Validation, WebSocket STOMP, Actuator và Flyway.
  * Tích hợp cơ chế kiểm soát lược đồ CSDL tự động qua Flyway Migration trên PostgreSQL 16.
  * Cấu hình an ninh không trạng thái (Stateless Security) với JSON Web Token (JWT) và bộ nhớ đệm Caffeine.

---

## 2. Approach Decisions (Quyết định Tiếp cận Nền tảng Backend)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-010` | Sử dụng Java 21 LTS kết hợp Maven Wrapper (`./mvnw`) để quản lý công cụ xây dựng và biên dịch. | Loại bỏ phụ thuộc vào việc cài đặt Maven toàn cục trên máy phát triển; bảo đảm môi trường build đồng nhất 100% giữa local và CI/CD runner. | Cài đặt Maven trực tiếp trên hệ điều hành của lập trình viên hoặc sử dụng Gradle (bị loại vì Gradle cấu hình phức tạp hơn, Maven chuẩn hóa hơn với Spring Boot). | File wrapper `mvnw`, `mvnw.cmd` và thư mục `.mvn/wrapper` được lưu vào kho mã nguồn; toàn bộ thành viên dự án và máy chủ build tự động tải cùng một bản Maven 3.9.x. | `STK-010`, `STK-023` | Accepted |
| `APC-BE-011` | Phân tách cấu hình đa môi trường qua Spring Profiles kết hợp biến môi trường `.env` và Testcontainers. | Tách biệt rạch ròi giữa môi trường kiểm thử tự động (`test` dùng Testcontainers PostgreSQL 16) và môi trường cục bộ (`local`); bảo mật tuyệt đối các khóa bí mật JWT và credential. | Hardcode cấu hình kết nối CSDL và secret key trong `application.yml` (bị loại vì rủi ro lộ lọt bảo mật và không cô lập được môi trường kiểm thử). | Cần duy trì các profile cấu hình độc lập (`application-local.yml`, `application-test.yml`, `application-prod.yml`); yêu cầu máy dev và CI runner chạy Docker daemon khi chạy integration test. | `SRS-001`, `STK-012` | Accepted |

---

## 3. Foundation Work Items (Hạng mục Thiết lập Nền tảng Backend)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-BE-001` | Cấu hình Java 21 Toolchain & Maven | Thiết lập Maven POM với Java 21 compiler, Spring Boot Starter Parent và cấu hình plugin phụ trợ. | `STK-010`, `STK-011`, `STK-023` | `FND-SYS-001` | Lệnh `./mvnw clean compile` thành công với zero warning; nhận diện đúng Java 21. | Done |
| `FND-BE-002` | Khởi tạo Khung Dự án Spring Boot | Khai báo các starter cốt lõi: Web, Security, Data JPA, Validation, WebSocket, Actuator, Flyway. | `STK-011` | `FND-BE-001` | Ứng dụng khởi động được ở profile `local` mà không ném lỗi bean wiring. | Done |
| `FND-BE-003` | Cấu hình Flyway Migration & DataSource | Thiết lập kết nối PostgreSQL qua `application.yml`, cấu hình Flyway kiểm soát thư mục `db/migration`. | `STK-013`, `STK-014` | `FND-BE-002` | Tự động tạo bảng `flyway_schema_history` và chạy các migration script ban đầu thành công. | Done |
| `FND-BE-004` | Cấu hình Spring Security & JWT Base | Thiết lập `SecurityFilterChain` không trạng thái (Stateless), bộ sinh và thẩm định JSON Web Token. | `STK-011`, `ARC-002` | `FND-BE-002` | Endpoint công khai truy cập bình thường; endpoint bảo vệ trả về 401 khi thiếu token. | Done |
| `FND-BE-005` | Cấu hình WebSocket STOMP Broker | Thiết lập endpoint `/ws-attendance` hỗ trợ SockJS fallback, message broker giản đơn cho topic `/topic`. | `STK-012`, `ARC-002` | `FND-BE-002` | Trình duyệt và Kiosk kết nối bắt tay STOMP thành công; gửi nhận ping frame ổn định. | Done |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Yêu cầu Nền tảng JDK 21 LTS**: Máy trạm phát triển và máy chủ CI/CD phải được cài đặt JDK 21 (khuyến nghị bản phân phối Eclipse Temurin 21 LTS) và biến môi trường `JAVA_HOME` được trỏ chính xác.
* **Cổng Dịch vụ Mặc định**: Phân hệ Backend chạy mặc định trên cổng mạng `8080`; khi triển khai song song hoặc gặp xung đột cổng trên máy dev, có thể ghi đè linh hoạt qua tham số `-Dserver.port=...` hoặc thiết lập biến `SERVER_PORT` trong file `.env`.
* **Trạng thái Docker Daemon cho Integration Test**: Để thực thi toàn bộ test suite có chứa Testcontainers (`test`), Docker Engine phải ở trạng thái running; nếu Docker không khả dụng, chỉ các unit test không phụ thuộc CSDL mới có thể thực thi.

