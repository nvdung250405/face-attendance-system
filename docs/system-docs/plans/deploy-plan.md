---
title: System Deploy Plan
version: 1.0
status: Approved
owner: Release Engineer
---

# DEPLOY PLAN — Kế hoạch Triển khai & Vận hành Hệ thống

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ quy trình đóng gói, phát hành, thiết lập môi trường vận hành thực tế và kịch bản phục hồi sau sự cố cho toàn bộ giải pháp Face Attendance System.
* **Mục tiêu**:
  * Đóng gói tự động cụm dịch vụ máy chủ và web portal thông qua Docker Compose.
  * Đóng gói bản phân phối độc lập cho trạm điểm danh biên Kiosk Desktop.
  * Đảm bảo quy trình phát hành an toàn với kịch bản kiểm tra khói (Smoke Test) và khôi phục sự cố (Rollback) dưới 5 phút.

---

## 2. Approach Decisions (Quyết định Tiếp cận Triển khai)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-013` | Mô hình lai (Hybrid Host/Container Architecture): Cụm máy chủ chạy Docker, Kiosk chạy Native Host. | Container hóa Backend/DB/Web giúp cô lập môi trường và dễ mở rộng; Kiosk chạy native trên OS máy trạm để tối ưu giao tiếp camera USB độ trễ $< 15\text{ms}$ và tập lệnh vector CPU AVX2. | Chạy toàn bộ trong container (kể cả Kiosk), Cài đặt thủ công toàn bộ trên host | Cần đóng gói PyInstaller .exe riêng cho Kiosk và docker-compose cho cụm server. | `ARC-001`, `STK-022` | Accepted |
| `APC-SYS-014` | Chiến lược phát hành Blue/Green với Docker Container. | Giảm thiểu thời gian gián đoạn (Downtime $\approx 0$), cho phép chuyển đổi tức thì giữa các phiên bản Backend và Web. | Dừng máy chủ cập nhật trực tiếp (In-place Downtime) | Yêu cầu máy chủ có đủ dung lượng RAM để chạy song song 2 container trong thời điểm chuyển đổi. | `NFR-SYS-006`, `STK-022` | Accepted |
| `APC-SYS-015` | Quy trình Rollback tự động dựa trên kết quả Smoke Test. | Nếu kiểm tra sau triển khai không phản hồi mã 200 trong vòng 60s, hệ thống tự động hoàn nguyên container trước đó. | Chờ người dùng báo lỗi rồi mới rollback thủ công | Giảm thiểu tối đa thời gian chết của hệ thống khi bản phát hành mới phát sinh lỗi nghiêm trọng. | `RSK-001`, `NFR-SYS-006` | Accepted |

---

## 3. Environment Architecture (Kiến trúc & Topology Môi trường)

* **Cụm Dịch vụ Máy chủ & Web (Containerized)**:
  * Mạng ảo nội bộ Docker: `fas-net` (Bridge Network).
  * `fas-postgres`: CSDL PostgreSQL 16 Alpine, ánh xạ cổng 5432, lưu trữ persistent qua docker volume `pgdata`.
  * `fas-backend`: Ứng dụng Spring Boot Java 21, ánh xạ cổng 8080.
  * `fas-web`: Nginx Web Server đóng gói SPA ReactJS, ánh xạ cổng 3000/80, reverse proxy `/api` và `/ws` tới backend.
* **Trạm Điểm danh Biên (Native Desktop Host)**:
  * Máy trạm Windows 11 / Linux cấu hình tối thiểu Intel Core i3 Gen 8, 8GB RAM, camera USB 720p 30 FPS.
  * File thực thi độc lập `FAS_Kiosk.exe` kết nối mạng LAN tới `fas-backend:8080`.

---

## 4. Deployment Work Items (Danh mục Hạng mục Triển khai)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `DPL-SYS-001` | Khởi tạo Container CSDL PostgreSQL | Khởi chạy container `fas-postgres` (PostgreSQL 16-alpine) gắn volume bền vững `pgdata`, cấu hình user/pass và database `fas_db`. | `STK-012`, `STK-022` | `FND-SYS-006` | Cổng 5432 mở; pg_isready trả về 0; volume `pgdata` được mount thành công. | Planned |
| `DPL-SYS-002` | Triển khai Container Máy chủ Backend | Đóng gói Java 21 Spring Boot thành container `fas-backend`, nạp biến môi trường `ENCRYPTION_MASTER_KEY` và kết nối với CSDL. | `STK-010`, `STK-011` | `DPL-SYS-001` | Cổng 8080 mở; Flyway hoàn tất migration; endpoint `/actuator/health` trả về `{"status":"UP"}`. | Planned |
| `DPL-SYS-003` | Triển khai Container Web Portal Nginx | Đóng gói bản build tĩnh ReactJS vào container `fas-web` (Nginx), cấu hình Reverse Proxy chuyển tiếp `/api` và `/ws` về backend. | `STK-017`, `STK-019` | `DPL-SYS-002` | Cổng 3000 / 80 mở; trình duyệt truy cập tải trang đăng nhập thành công; proxy API thông suốt. | Planned |
| `DPL-SYS-004` | Đóng gói Tệp Thực thi Kiosk Desktop | Sử dụng PyInstaller biên dịch toàn bộ mã nguồn Kiosk và tài nguyên assets thành file thực thi độc lập `FAS_Kiosk.exe`. | `STK-001`, `STK-024` | `BLD-SYS-002` | File thực thi khởi động thành công trên máy tính Windows mà không cần cài sẵn môi trường Python. | Planned |
| `DPL-SYS-005` | Xác minh Sức khỏe Toàn hệ thống (Smoke Check) | Thực hiện 1 lượt điểm danh thử nghiệm: Quét mặt tại Kiosk $\rightarrow$ Backend ghi CSDL $\rightarrow$ Hiển thị trên Web Live Dashboard. | `ARC-001`, `ARC-002`, `ARC-003`, `ARC-004` | `DPL-SYS-001`, `DPL-SYS-002`, `DPL-SYS-003`, `DPL-SYS-004` | Dữ liệu hiển thị trên Web trong vòng $\le 1.2\text{ s}$; âm thanh Kiosk phát "Tít" chính xác. | Planned |

---

## 5. Verification & Rollback (Kiểm tra & Phục hồi Sự cố)

### 5.1. Kịch bản Kiểm tra Sau Triển khai (Smoke Tests)
1. **Kiểm tra Sức khỏe Máy chủ (Health Check)**:
   ```bash
   curl -f http://localhost:8080/actuator/health
   # Kỳ vọng: {"status":"UP","components":{"db":{"status":"UP"}}}
   ```
2. **Kiểm tra Kênh STOMP WebSocket**:
   * Mở trình duyệt truy cập `http://localhost:3000/dashboard`, xác nhận kết nối STOMP thành công (`Connected to ws://localhost:8080/ws`).
3. **Kiểm tra Trạm Kiosk**:
   * Khởi chạy `FAS_Kiosk.exe`, kiểm tra biểu tượng mạng chuyển màu Xanh (Online), đồng hồ số nhảy giây và viền Oval hiển thị nét đứt màu Xám.

### 5.2. Kế hoạch Dự phòng & Phục hồi Sự cố (Rollback Procedures)

| Sự cố Phát sinh (Incident) | Mức độ | Hành động Rollback & Phục hồi Tức thì |
| :--- | :---: | :--- |
| **Bản build Backend mới bị lỗi sập container khi khởi động** | Blocker | Khôi phục ngay tag image container ổn định trước đó qua lệnh: `docker compose up -d fas-backend:previous-stable`. |
| **Migration CSDL PostgreSQL bị lỗi cấu trúc** | Critical | Chạy lệnh Flyway undo hoặc khôi phục dữ liệu từ bản sao lưu gần nhất (`pg_dump` backup file). |
| **Ứng dụng Kiosk bị lỗi hiển thị sau khi cập nhật bản build mới** | Major | Giữ nguyên tệp cấu hình `.env` và CSDL cục bộ `kiosk_local.db`, khôi phục bản thực thi `.exe` của phiên bản trước. |

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Cấu hình Hạ tầng Docker Host**: Máy chủ triển khai container yêu cầu tối thiểu 4GB RAM khả dụng, đã cài sẵn Docker Engine 26+ và Docker Compose V2. Cổng mạng TCP 8080 (Backend), 3000 (Web Portal) và 5432 (PostgreSQL) không bị tranh chấp bởi các tiến trình khác trên host.
* **Quyền Khởi tạo Thiết bị USB trên Trạm Kiosk**: File thực thi `FAS_Kiosk.exe` trên hệ điều hành Windows yêu cầu người dùng cấp quyền truy cập camera trong Privacy Settings để DirectShow mở được luồng video.

