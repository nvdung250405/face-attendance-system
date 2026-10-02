# DEPLOY PLAN — Kế hoạch Triển khai & Vận hành Hệ thống

> **Mã tài liệu:** `PLN-DPL-01`  
> **Cấp độ:** Cấp Hệ thống (System-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả các hạng mục triển khai (`DPL-SYS-`), quy trình khởi động môi trường qua Docker Compose, kịch bản kiểm tra sau triển khai (Smoke Test) và quy trình dự phòng xử lý sự cố (Rollback).

---

## 1. Approach & Deployment Architecture (Chiến lược & Topology Triển khai)

* **Mô hình Hỗn hợp (Hybrid Host/Container Architecture)**:
  * **Cụm Dịch vụ Máy chủ & Web (Containerized)**: PostgreSQL 16, Spring Boot Backend và Web Portal Nginx được đóng gói và điều phối tự động thông qua Docker Compose (`docker-compose.yml`) trong mạng nội bộ ảo `fas-net`.
  * **Trạm Điểm danh Biên (Native Desktop Host)**: Ứng dụng Kiosk chạy trực tiếp trên hệ điều hành máy trạm (Windows 11 / Linux) để có quyền truy cập trực tiếp phần cứng camera quang học với độ trễ thấp nhất ($< 15\text{ ms}$) và khai thác tập lệnh vector CPU AVX2.

---

## 2. Deployment Work Items (Danh mục Hạng mục Triển khai)

| ID | Hạng mục Triển khai (Work Item) | Mô tả Kỹ thuật Chi tiết | Covers / Uses | Depends on | Tiêu chí Hoàn tất (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `DPL-SYS-001` | Khởi tạo Container CSDL PostgreSQL | Khởi chạy container `fas-postgres` (PostgreSQL 16-alpine) gắn volume bền vững `pgdata`, cấu hình user/pass và database `fas_db`. | `STK-012`, `STK-022` | `FND-SYS-006` | Cổng 5432 mở; pg_isready trả về 0; volume `pgdata` được mount thành công. | Sẵn sàng |
| `DPL-SYS-002` | Triển khai Container Máy chủ Backend | Đóng gói Java 21 Spring Boot thành container `fas-backend`, nạp biến môi trường `ENCRYPTION_MASTER_KEY` và kết nối với CSDL. | `STK-010`, `STK-011` | `DPL-SYS-001` | Cổng 8080 mở; Flyway hoàn tất migration; endpoint `/actuator/health` trả về `{"status":"UP"}`. | Sẵn sàng |
| `DPL-SYS-003` | Triển khai Container Web Portal Nginx | Đóng gói bản build tĩnh ReactJS vào container `fas-web` (Nginx), cấu hình Reverse Proxy chuyển tiếp `/api` và `/ws` về backend. | `STK-017`, `STK-019` | `DPL-SYS-002` | Cổng 3000 / 80 mở; trình duyệt truy cập tải trang đăng nhập thành công; proxy API thông suốt. | Sẵn sàng |
| `DPL-SYS-004` | Đóng gói Tệp Thực thi Kiosk Desktop | Sử dụng PyInstaller biên dịch toàn bộ mã nguồn Kiosk và tài nguyên assets thành file thực thi độc lập `FAS_Kiosk.exe`. | `STK-001`, `STK-024` | `BLD-SYS-002` | File thực thi khởi động thành công trên máy tính Windows mà không cần cài sẵn môi trường Python. | Sẵn sàng |
| `DPL-SYS-005` | Xác minh Sức khỏe Toàn hệ thống (Smoke Check) | Thực hiện 1 lượt điểm danh thử nghiệm: Quét mặt tại Kiosk $\rightarrow$ Backend ghi CSDL $\rightarrow$ Hiển thị trên Web Live Dashboard. | `ARC-SYS-001` đến `ARC-SYS-004` | `DPL-SYS-001` đến `DPL-SYS-004` | Dữ liệu hiển thị trên Web trong vòng $\le 1.2\text{ s}$; âm thanh Kiosk phát "Tít" chính xác. | Sẵn sàng |

---

## 3. Post-Deployment Verification & Smoke Tests (Kiểm tra Sau Triển khai)

1. **Kiểm tra Sức khỏe Máy chủ (Health Check)**:
   ```bash
   curl -f http://localhost:8080/actuator/health
   # Kỳ vọng: {"status":"UP","components":{"db":{"status":"UP"}}}
   ```
2. **Kiểm tra Kênh STOMP WebSocket**:
   * Mở trình duyệt truy cập `http://localhost:3000/dashboard`, kiểm tra console log xác nhận kết nối STOMP thành công (`Connected to ws://localhost:8080/ws`).
3. **Kiểm tra Trạm Kiosk**:
   * Khởi chạy `FAS_Kiosk.exe`, kiểm tra biểu tượng trạng thái mạng chuyển màu Xanh (Online), đồng hồ số nhảy giây và viền Oval hiển thị nét đứt màu Xám.

---

## 4. Rollback & Disaster Recovery (Quy trình Dự phòng & Khôi phục Sự cố)

| Sự cố Phát sinh (Incident) | Mức độ | Hành động Rollback & Phục hồi Tức thì |
| :--- | :---: | :--- |
| **Bản build Backend mới bị lỗi sập container khi khởi động** | Blocker | Khôi phục ngay tag image container ổn định trước đó qua lệnh: `docker compose up -d fas-backend:previous-stable`. |
| **Migration CSDL PostgreSQL bị lỗi cấu trúc** | Critical | Chạy lệnh Flyway undo hoặc khôi phục dữ liệu từ bản sao lưu gần nhất (`pg_dump` backup file). |
| **Ứng dụng Kiosk bị lỗi hiển thị sau khi cập nhật bản build mới** | Major | Giữ nguyên tệp cấu hình `.env` và CSDL cục bộ `kiosk_local.db`, khôi phục bản thực thi `.exe` của phiên bản trước. |
