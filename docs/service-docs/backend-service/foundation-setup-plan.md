---
title: Backend Foundation Setup Plan
version: 1.0
status: Approved
owner: Backend Lead & DevOps
---

# FOUNDATION SETUP PLAN — Kế hoạch Thiết lập Nền tảng Phân hệ Backend


## 1. Mục tiêu & Phạm vi (Objectives & Scope)

* **Mục tiêu**: Chuẩn bị hoàn chỉnh môi trường phát triển Java 21 LTS, cấu hình dự án Spring Boot, thiết lập kết nối CSDL PostgreSQL qua Testcontainers/Docker và quản lý cấu hình tập trung.
* **Phạm vi**: Giới hạn trong phân hệ `app/backend-service`, kế thừa từ kế hoạch nền tảng hệ thống (`FND-SYS-001`, `FND-SYS-003`).

---

## 2. Hiện trạng & Yêu cầu Kỹ thuật (Prerequisites & Constraints)

* **JDK Runtime**: Eclipse Temurin hoặc OpenJDK phiên bản 21 LTS 64-bit.
* **Công cụ Xây dựng**: Apache Maven 3.9+ (sử dụng Maven Wrapper `mvnw` đi kèm dự án).
* **CSDL & Cache**: PostgreSQL 16 và Redis 7 (chạy qua Docker Compose trong môi trường dev/staging).
* **Quản trị Phiên bản CSDL**: Tích hợp Flyway Migration tự động kiểm soát lược đồ CSDL.

---

## 3. Foundation Work Items (Hạng mục Thiết lập Nền tảng Backend)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-BE-001` | Cấu hình Java 21 Toolchain & Maven | Thiết lập Maven POM với Java 21 compiler, Spring Boot Starter Parent và cấu hình plugin phụ trợ. | `STK-010`, `STK-011` | `FND-SYS-001` | Lệnh `./mvnw clean compile` thành công với zero warning; nhận diện đúng Java 21. | Done |
| `FND-BE-002` | Khởi tạo Khung Dự án Spring Boot | Khai báo các starter cốt lõi: Web, Security, Data JPA, Validation, WebSocket, Actuator, Flyway. | `STK-011` | `FND-BE-001` | Ứng dụng khởi động được ở profile `local` mà không ném lỗi bean wiring. | Done |
| `FND-BE-003` | Cấu hình Flyway Migration & DataSource | Thiết lập kết nối PostgreSQL qua `application.yml`, cấu hình Flyway kiểm soát thư mục `db/migration`. | `STK-013`, `STK-014` | `FND-BE-002` | Tự động tạo bảng `flyway_schema_history` và chạy các migration script ban đầu thành công. | Done |
| `FND-BE-004` | Cấu hình Spring Security & JWT Base | Thiết lập `SecurityFilterChain` không trạng thái (Stateless), bộ sinh và thẩm định JSON Web Token. | `STK-011`, `ARC-002` | `FND-BE-002` | Endpoint công khai truy cập bình thường; endpoint bảo vệ trả về 401 khi thiếu token. | Done |
| `FND-BE-005` | Cấu hình WebSocket STOMP Broker | Thiết lập endpoint `/ws-attendance` hỗ trợ SockJS fallback, message broker giản đơn cho topic `/topic`. | `STK-012`, `ARC-002` | `FND-BE-002` | Trình duyệt và Kiosk kết nối bắt tay STOMP thành công; gửi nhận ping frame ổn định. | Done |
