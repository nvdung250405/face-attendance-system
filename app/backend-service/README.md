# Phân hệ Máy chủ Trung tâm (`backend-service`)

> **Mã phân hệ:** `SVC-BE`  
> **Cấp độ không gian:** Child Service Workspace  
> **Đường dẫn:** `app/backend-service`  
> **Không gian cha:** [`app/README.md`](../README.md)  
> **Trách nhiệm cốt lõi (Single Responsibility):** Quản lý định danh, xử lý nghiệp vụ chấm công (Check-in/Check-out, Cooldown 2 phút, ca kíp), mã hóa vector sinh trắc học bằng AES-256-GCM, tự động xóa vector sau 20 ngày theo Luật Bảo vệ Dữ liệu 2025, và phát sóng sự kiện thời gian thực qua WebSocket STOMP.

---

## 1. Mục đích & Vai trò Kỹ thuật

`backend-service` là máy chủ trung tâm (Core Enterprise Server) điều phối toàn bộ luồng dữ liệu của hệ sinh thái FAS:
* **Nền tảng công nghệ**: Java 21 (LTS), Spring Boot 4.x, Spring Data JPA, Spring Security (JWT / RBAC), Spring WebSocket STOMP.
* **Cơ sở dữ liệu**: PostgreSQL 16 (quản lý di chuyển lược đồ tự động qua **Flyway Migrations** tại `src/main/resources/db/migration/`).
* **Bảo mật Sinh trắc học & Pháp lý**:
  - Vector đặc trưng 512D được mã hóa bằng thuật toán **AES-256-GCM** với khóa Master Key độc lập trước khi lưu DB.
  - Tác vụ định kỳ `@Scheduled` chạy ngầm hàng ngày, tự động xóa vĩnh viễn vector của nhân viên nghỉ việc sau 20 ngày theo Nghị định 356/2025/NĐ-CP.
* **Kênh truyền thông**: Cung cấp 44 REST API Endpoints chuẩn RFC 7807 và Message Broker STOMP phục vụ cập nhật tức thời cho Web Dashboard và nạp nóng RAM Gallery cho trạm Kiosk.

---

## 2. Bản đồ Cấu trúc Nội bộ (Internal Layout)

| Thư mục / Tệp | Loại tài nguyên | Trách nhiệm chi tiết |
|:---|:---|:---|
| [`src/main/java/com/fas/api/`](src/main/java/com/fas/api/) | API Layer | Controllers RESTful (`controller/`) và các DTOs yêu cầu / phản hồi (`dto/`) |
| [`src/main/java/com/fas/service/`](src/main/java/com/fas/service/) | Business Logic | Xử lý chấm công, ca kíp, tính toán thời gian, mã hóa AES-256-GCM, sinh mã OTP |
| [`src/main/java/com/fas/data/`](src/main/java/com/fas/data/) | Persistence | JPA Entities (`entity/`), Enums (`enums/`), và Spring Data Repositories (`repository/`) |
| [`src/main/java/com/fas/config/`](src/main/java/com/fas/config/) | Configuration | Cấu hình Spring Security, JWT Filters, WebSocket STOMP Broker, Crypto Beans |
| [`src/main/resources/`](src/main/resources/) | Application Assets | `application.yml`, kịch bản di chuyển CSDL Flyway (`db/migration/V1..V8`) |
| [`src/test/`](src/test/) | Automated Tests | Bộ kiểm thử đơn vị, kiểm thử tích hợp Controller, và Adversarial Challenge Tests |
| [`pom.xml`](pom.xml) | Maven Project Spec | Khai báo thư viện phụ thuộc, cấu hình compiler Java 21 và checkstyle plugins |

---

## 3. Hướng dẫn Khởi chạy Cục bộ (Local Run Guide)

### 3.1. Yêu cầu Tiên quyết: CSDL PostgreSQL
Đảm bảo PostgreSQL đang chạy (thông qua Docker từ thư mục gốc):
```bash
docker compose up -d fas-postgres
```

### 3.2. Khởi chạy Máy chủ Spring Boot
Từ thư mục `app/backend-service/`:
```bash
# Khởi chạy dịch vụ qua Maven Wrapper
./mvnw spring-boot:run
```
*(Trên Windows PowerShell, sử dụng: `.\mvnw.cmd spring-boot:run`)*

### 3.3. Các Điểm cuối Tương tác Chính (Endpoints & Ports)
* **Cổng dịch vụ mặc định**: `http://localhost:8080`
* **Swagger UI / OpenAPI Documentation**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **OpenAPI 3.1 Raw Spec**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)
* **Actuator Health Endpoint**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
* **WebSocket STOMP Endpoint**: `ws://localhost:8080/ws`

---

## 4. Kiểm thử & Đảm bảo Chất lượng (Testing & Lint)

```bash
# 1. Chạy toàn bộ Unit Tests và Integration Tests
./mvnw test

# 2. Kiểm tra chuẩn phong cách code (Checkstyle)
./mvnw checkstyle:check

# 3. Đóng gói ứng dụng thành tệp JAR độc lập
./mvnw clean package -DskipTests
```

---

## 5. Chính sách Dữ liệu & Quy tắc Git (Data & Git Policy)

* **Tài nguyên theo dõi (Tracked)**: Toàn bộ mã nguồn Java `src/`, tệp cấu hình Flyway `db/migration/`, cấu hình `pom.xml`, và kịch bản `Dockerfile`.
* **Tài nguyên bỏ qua (Ignored 100%)**:
  * Thư mục bản dựng: `target/`, `*.class`, `*.jar`, `*.war`.
  * Nhật ký hệ thống: `logs/backend/`, `*.log`.
  * Tệp tạm IDE: `.mvn/timing.properties`, `.project`, `.settings/`.
