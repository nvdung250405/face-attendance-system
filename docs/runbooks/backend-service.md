# Operational Runbook: Central Backend Service (`backend-service`)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Operational Runbook  
> **Primary Owner Skill:** `observability-and-instrumentation`  
> **Canonical Destination Path:** `docs/runbooks/backend-service.md`  
> **Status:** Active  
> **Last updated:** 2026-11-08  

---

## 1. Service Overview & Health Signals
- **Cụm dịch vụ:** Spring Boot 3.4.x / Java 21 LTS trên Docker (`fas-backend`).
- **Cổng dịch vụ:** `http://localhost:8080`.
- **Health Probe:** `GET /actuator/health` (Liveness & Readiness).
- **Cơ sở dữ liệu:** PostgreSQL 16 trên cổng `5432` (`fas-postgres`).
- **Quản lý dịch vụ:** `.\scripts\manage-services.ps1 status`.

---

## 2. Common Incidents & Diagnostic Triage

### Sự cố 1: Database Connection Pool Exhaustion (Hết kết nối CSDL)
- **Triệu chứng:** API trả về mã lỗi HTTP 500 hoặc 503; log hiển thị `HikariPool-1 - Connection is not available`.
- **Chẩn đoán:**
  - Kiểm tra số lượng kết nối đang mở: `docker exec -it fas-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"`.
- **Xử lý:**
  - Khởi động lại dịch vụ Backend: `.\scripts\manage-services.ps1 restart backend`.
  - Tăng `spring.datasource.hikari.maximum-pool-size` trong cấu hình môi trường nếu tải hệ thống tăng cao.

### Sự cố 2: WebSocket STOMP Broker bị ngắt kết nối
- **Triệu chứng:** Live Dashboard trên Web Portal hiển thị trạng thái "Mất kết nối WebSocket", dữ liệu không cập nhật thời gian thực.
- **Chẩn đoán:**
  - Kiểm tra log STOMP: `docker logs fas-backend | grep -i "stomp"`.
  - Kiểm tra cấu hình CORS và Reverse Proxy Nginx có giữ header `Upgrade: websocket` không.
- **Xử lý:**
  - Tải lại trang Web Portal hoặc khởi động lại container backend nếu luồng message broker bị treo.

### Sự cố 3: Tác vụ Tiêu hủy Vector 20 Ngày không chạy
- **Triệu chứng:** DPO phát hiện còn tồn tại vector của nhân viên đã nghỉ việc quá 20 ngày.
- **Xử lý:**
  - Kiểm tra log cron scheduler: `docker logs fas-backend | grep "BiometricRetentionScheduler"`.
  - Kích hoạt chạy thủ công cron job qua actuator endpoint quản trị: `POST /actuator/scheduledtasks/biometricRetention`.

