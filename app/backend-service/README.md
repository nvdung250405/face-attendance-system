# Phân Hệ Máy Chủ Trung Tâm (`backend-service`)

> **Cấp độ không gian:** Cấp 2 (Service Workspace)  
> **Không gian cha:** [`README.md`](../../README.md) (Thư mục Gốc)  
> **Công nghệ cốt lõi:** Java 21 LTS, Spring Boot 3.4+/4.x, Spring Data JPA, Spring Security (JWT / RBAC), Spring WebSocket STOMP, PostgreSQL 16, Flyway V1-V9.

---

## 1. Cấu Trúc Mã Nguồn Nội Bộ (Internal Layout)

| Thư mục / Tệp | Loại tài nguyên | Trách nhiệm chi tiết |
| :--- | :--- | :--- |
| [`src/main/java/com/fas/api/`](src/main/java/com/fas/api/) | API Layer | Controllers RESTful (`controller/`) và DTOs yêu cầu / phản hồi (`dto/`) |
| [`src/main/java/com/fas/service/`](src/main/java/com/fas/service/) | Business Logic | Xử lý chấm công, ca kíp, giải trình, mã hóa AES-256-GCM, sinh mã OTP |
| [`src/main/java/com/fas/data/`](src/main/java/com/fas/data/) | Persistence Layer | JPA Entities (`entity/`), Enums (`enums/`), và Spring Data Repositories (`repository/`) |
| [`src/main/java/com/fas/config/`](src/main/java/com/fas/config/) | Configuration | Cấu hình Security, JWT Filters, WebSocket STOMP Broker, Crypto Beans |
| [`src/main/resources/db/migration/`](src/main/resources/db/migration/) | Database Migrations | 9 tệp Flyway migration (`V1__...sql` đến `V9__...sql`) |
| [`src/test/`](src/test/) | Automated Tests | Unit tests, Integration tests, ProblemDetails contract tests, Adversarial tests |

---

## 2. Bảng Tra Cứu Nghiệp Vụ Nhanh (Domain-to-File Index)

Agent tra cứu trực tiếp file code tương ứng theo nghiệp vụ mà không cần chạy lệnh tìm kiếm:

| Nghiệp vụ hệ thống | Controller RESTful | Service xử lý logic chính | Repository CSDL |
| :--- | :--- | :--- | :--- |
| **Điểm danh trạm Kiosk** | `api/controller/KioskAttendanceController.java` | `service/AttendanceService.java` | `data/repository/AttendanceLogRepository.java` |
| **Đồng bộ hàng đợi Offline** | `api/controller/KioskAttendanceController.java` | `service/OfflineBatchSyncService.java` | `data/repository/AttendanceLogRepository.java` |
| **Xác thực & Phiên JWT** | `api/controller/AuthController.java` | `service/AuthService.java` | `data/repository/UserRepository.java` |
| **Đăng ký khuôn mặt & OTP** | `api/controller/EmployeeEnrollmentController.java` | `service/EnrollmentService.java` | `data/repository/BiometricTemplateRepository.java` |
| **Mã hóa Sinh trắc học** | N/A (Internal Core) | `data/crypto/BiometricCryptoService.java` | `data/repository/BiometricTemplateRepository.java` |
| **Xóa mẫu sau 20 ngày** | N/A (Scheduled Task) | `service/BiometricCleanupExecutor.java` | `data/repository/BiometricTemplateRepository.java` |
| **Quản trị Nhân viên & PIN** | `api/controller/AdminEmployeeController.java` | `service/AccountManagementService.java` | `data/repository/UserRepository.java` |
| **Ca kíp & Phân ca** | `api/controller/ShiftController.java` | `service/ShiftManagementService.java` | `data/repository/ShiftRepository.java` |
| **Đơn giải trình đi muộn** | `api/controller/AdminExcuseController.java` | `service/ExcuseRequestService.java` | `data/repository/ExcuseRequestRepository.java` |

---

## 3. Lệnh Khởi Chạy & Kiểm Thử Chuẩn

Thực hiện từ thư mục `app/backend-service/`:

```bash
# 1. Khởi chạy máy chủ cục bộ (Local Run)
./mvnw spring-boot:run

# 2. Chạy toàn bộ Unit & Integration Tests (Bắt buộc trước khi hoàn thành)
./mvnw test

# 3. Kiểm tra chuẩn phong cách mã nguồn (Checkstyle Lint)
./mvnw checkstyle:check
```

* **Swagger UI Documentation:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **Actuator Health Endpoint:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
* **WebSocket STOMP Broker:** `ws://localhost:8080/ws`
