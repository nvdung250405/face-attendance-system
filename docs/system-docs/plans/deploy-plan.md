---
title: System Deploy Plan
version: 1.1
status: Approved
owner: Release Engineer
---

# DEPLOY PLAN — Kế hoạch Triển khai & Vận hành Hệ thống

Kế hoạch đóng gói, phát hành, thiết lập cấu hình môi trường vận hành, quy trình kiểm tra khói (Smoke Test) và phương án phục hồi sau sự cố cho toàn bộ Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §9.7).

---

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ quy trình đóng gói, phát hành, thiết lập môi trường vận hành thực tế và kịch bản phục hồi sau sự cố cho toàn bộ giải pháp Face Attendance System.
* **Mục tiêu**:
  * Đóng gói tự động cụm dịch vụ máy chủ, CSDL và Web Portal thông qua Docker Compose kết hợp Reverse Proxy Nginx (`STK-036`) thực thi TLS 1.3 và quản trị chứng chỉ tự động.
  * Đóng gói bản phân phối độc lập `FAS_Kiosk.exe` kèm tệp kê khai băm SHA-256 cho trạm điểm danh biên Kiosk Desktop trên Windows 11.
  * Đảm bảo quy trình phát hành an toàn với kịch bản kiểm tra khói tự động, thời gian khôi phục sự cố ($\text{RTO} \le 15.8\text{ phút}$, $\text{RPO} = 0$) và kịch bản hoàn nguyên (Rollback) dưới 3 phút.

---

## 2. Approach Decisions (Quyết định Tiếp cận Triển khai)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-013` | Mô hình lai (Hybrid Host/Container Architecture): Cụm máy chủ chạy Docker, Kiosk chạy Native Host. | Container hóa Backend/DB/Web giúp cô lập môi trường và dễ mở rộng; Kiosk chạy native trên OS máy trạm để tối ưu giao tiếp camera USB độ trễ $< 15\text{ ms}$ và tập lệnh vector CPU AVX2. | Chạy toàn bộ trong container (kể cả Kiosk), Cài đặt thủ công toàn bộ trên host | Cần đóng gói PyInstaller .exe riêng cho Kiosk và docker-compose cho cụm server. | `ARC-001`, `STK-022` | Accepted |
| `APC-SYS-014` | Chiến lược phát hành Tái tạo Thực thể với Khởi động Mềm (In-place Rolling Recreate with Graceful Shutdown & Healthcheck). | Phân hệ Backend sử dụng In-memory STOMP Broker (`DD-SYS-014`); triển khai Blue/Green 2 instance song song sẽ làm phân mảnh phiên WebSocket và tranh chấp Flyway migration. Với thời gian dừng và nạp container mới $< 10\text{ s}$, gián đoạn hoàn toàn nằm trong ngân sách cho phép của SLA 99.9% ($15.8\text{ phút/tháng}$, `NFR-SYS-008`). | Blue/Green song song (gây đứt phiên STOMP và lỗi Flyway), Dừng máy chủ thủ công không kiểm soát | Kết nối STOMP của client Web có thể ngắt kết nối ngắn $< 10\text{ s}$ và client tự động reconnect trong suốt. | `NFR-SYS-008`, `STK-022`, `DD-SYS-014` | Accepted |
| `APC-SYS-015` | Cổng Tự động Hoàn nguyên (Automated Rollback Gate) dựa trên kịch bản Smoke Test. | Script triển khai sau khi pull image mới sẽ chạy vòng lặp kiểm tra sức khỏe `curl -f http://localhost:8080/actuator/health` tối đa 60s (chu kỳ 5s); nếu không trả mã HTTP 200, script tự động thực thi lệnh khôi phục image ổn định trước đó. | Chờ người dùng báo lỗi rồi mới rollback thủ công | Giảm thiểu tối đa thời gian chết của hệ thống khi bản phát hành mới phát sinh lỗi nghiêm trọng. | `RSK-001`, `NFR-SYS-008` | Accepted |

---

## 3. Environment Architecture (Kiến trúc & Topology Môi trường)

* **Cụm Dịch vụ Máy chủ Doanh nghiệp (Containerized)**:
  * Mạng ảo nội bộ Docker: `fas-net` (Bridge Network).
  * `fas-proxy`: Nginx Reverse Proxy (`STK-036`), kết thúc TLS 1.3 trên cổng 443 (HTTPS/WSS), cấu hình chứng chỉ số (Let's Encrypt qua certbot hoặc CA nội bộ), chuyển hướng cổng 80, định tuyến `/api` và `/ws` tới backend và phục vụ file tĩnh web.
  * `fas-postgres`: CSDL PostgreSQL 16 Alpine, ánh xạ cổng 5432 nội bộ, lưu trữ persistent qua docker volume `pgdata`.
  * `fas-backend`: Ứng dụng Spring Boot Java 21, cổng nội bộ 8080, kết nối CSDL và đọc `MASTER_KEY_AES` từ biến môi trường máy chủ bảo mật (`STK-034`), mở Actuator `/actuator/health` và `/actuator/prometheus` (`STK-035`).
  * `fas-web`: Web Portal React 19+ SPA đóng gói bundle tĩnh (`dist/`).
* **Trạm Điểm danh Biên (Native Desktop Host)**:
  * Máy trạm Windows 11 cấu hình tối thiểu Intel Core i3 Gen 8, 8GB RAM, camera USB UVC 720p@30fps.
  * File thực thi độc lập `FAS_Kiosk_vX.Y.Z.exe` kết nối an toàn HTTPS/WSS tới Reverse Proxy thông qua biến môi trường `BACKEND_URL`.

---

## 4. Deployment Work Items (Danh mục Hạng mục Triển khai)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `DPL-SYS-001` | Khởi tạo Container CSDL PostgreSQL | Khởi chạy container `fas-postgres` (PostgreSQL 16-alpine) gắn volume bền vững `pgdata`, cấu hình user/pass và database `fas_db`. | `STK-012`, `STK-022`, `ARC-004` | `FND-SYS-006` | Cổng 5432 mở; pg_isready trả về 0; volume `pgdata` được mount thành công. | Planned |
| `DPL-SYS-002` | Triển khai Container Máy chủ Backend | Đóng gói Java 21 Spring Boot thành container `fas-backend`, nạp biến môi trường bảo mật (`MASTER_KEY_AES` qua Docker secrets hoặc file cấu hình host phân quyền nghiêm ngặt), kết nối CSDL và kích hoạt Actuator metrics. | `STK-010`, `STK-011`, `STK-034`, `STK-035`, `ARC-002`, `ARC-012`, `NFR-SYS-008` | `DPL-SYS-001` | Cổng 8080 nội bộ mở; Flyway hoàn tất migration; endpoint `/actuator/health` và `/actuator/prometheus` trả về trạng thái UP trong $\le 200\text{ ms}$. | Planned |
| `DPL-SYS-003` | Triển khai Container Reverse Proxy & Web Portal | Đóng gói Nginx Reverse Proxy (`STK-036`) và bản build tĩnh ReactJS, cấu hình TLS 1.3 với cơ chế tự động gia hạn chứng chỉ, định tuyến `/api` và `/ws` về backend. | `STK-017`, `STK-019`, `STK-036`, `ARC-003`, `ARC-005`, `NFR-SYS-007` | `DPL-SYS-002` | Cổng 443 mở với chứng chỉ TLS 1.3 hợp lệ; trình duyệt tải Web Portal an toàn; proxy REST và STOMP thông suốt; HTTP 80 tự động chuyển hướng sang 443. | Planned |
| `DPL-SYS-004` | Đóng gói Tệp Thực thi Kiosk Desktop | Sử dụng PyInstaller biên dịch toàn bộ mã nguồn Kiosk và tài nguyên assets thành file thực thi độc lập `FAS_Kiosk_vX.Y.Z.exe` kèm tệp mã băm kiểm chuẩn `manifest.sha256` trên Windows 11. | `STK-001`, `STK-024`, `ARC-001`, `NFR-SYS-001`, `NFR-SYS-009` | `BLD-SYS-002` | File thực thi khởi động thành công trên máy tính Windows mà không cần cài sẵn môi trường Python; mã băm khớp manifest; bộ nhớ RAM ổn định $< 800\text{ MB}$. | Planned |
| `DPL-SYS-005` | Xác minh Sức khỏe Toàn hệ thống (Smoke Check) | Thực hiện 1 lượt điểm danh thử nghiệm: Quét mặt tại Kiosk $\rightarrow$ Backend ghi CSDL $\rightarrow$ Hiển thị trên Web Live Dashboard trong $\le 1.2\text{ s}$. | `ARC-001`, `ARC-002`, `ARC-003`, `ARC-004`, `ARC-008`, `NFR-SYS-003` | `DPL-SYS-001`, `DPL-SYS-002`, `DPL-SYS-003`, `DPL-SYS-004` | Dữ liệu hiển thị trên Web trong vòng $\le 1.2\text{ s}$; âm thanh Kiosk phát phản hồi chính xác; trạng thái online cập nhật. | Planned |
| `DPL-SYS-006` | Thiết lập Quy trình Sao lưu & Phục hồi CSDL | Cấu hình cronjob tự động tạo bản sao lưu `pg_dump` nén hàng ngày lúc 02:00, mã hóa tệp sao lưu bằng OpenSSL AES-256 trước khi lưu đĩa, lưu giữ 30 ngày và kiểm chứng phục hồi khẩn cấp. | `ARC-004`, `SRS-009`, `NFR-SYS-008` | `DPL-SYS-001` | Bản sao lưu sinh ra định kỳ và được mã hóa bảo vệ; quy trình phục hồi khôi phục toàn vẹn dữ liệu trong vòng $\le 15.8\text{ phút}$ ($\text{RTO} \le 15.8\text{ phút}$). | Planned |

---

## 5. Verification & Rollback (Kiểm tra & Phục hồi Sự cố)

### 5.1. Kịch bản Kiểm tra Sau Triển khai (Smoke Tests)
1. **Kiểm tra Tự động Sức khỏe Máy chủ (Automated Health Check)**:
   ```bash
   # Script triển khai thực thi kiểm tra lặp lại tối đa 60 giây
   curl -f http://localhost:8080/actuator/health
   # Kỳ vọng: {"status":"UP","components":{"db":{"status":"UP"}}}
   ```
2. **Kiểm tra Kênh STOMP WebSocket & Prometheus Metrics**:
   * Truy cập `https://localhost/dashboard`, xác nhận kết nối STOMP thành công (`Connected to wss://localhost/ws`).
   * Truy cập `http://localhost:8080/actuator/prometheus`, xác nhận bộ chỉ số JVM và JDBC pool được thu thập đầy đủ.
3. **Kiểm tra Trạm Kiosk**:
   * Khởi chạy `FAS_Kiosk_vX.Y.Z.exe`, kiểm tra biểu tượng mạng chuyển màu Xanh (Online), đồng hồ số nhảy giây và viền Oval hiển thị nét đứt màu Xám.

### 5.2. Kế hoạch Dự phòng & Phục hồi Sự cố (Rollback Procedures)

| Sự cố Phát sinh (Incident) | Mức độ | Hành động Rollback & Phục hồi Tức thì |
| :--- | :---: | :--- |
| **Bản build Backend mới bị lỗi sập container khi khởi động** | Blocker | Khôi phục ngay tag image container ổn định trước đó qua lệnh: `docker compose up -d fas-backend:previous-stable` trong vòng $\le 3\text{ phút}$. |
| **Migration CSDL PostgreSQL bị lỗi cấu trúc** | Critical | Chạy lệnh Flyway undo hoặc giải mã và khôi phục dữ liệu từ bản sao lưu gần nhất (`pg_dump` encrypted file) theo runbook phục hồi ($\text{RTO} \le 15.8\text{ phút}$). Định kỳ thực hiện diễn tập phục hồi (Restore Drill) mỗi quý. |
| **Ứng dụng Kiosk bị lỗi hiển thị sau khi cập nhật bản build mới** | Major | Giữ nguyên tệp cấu hình `.env`, bảng `local_gallery_cache` và CSDL cục bộ `kiosk_local.db`, khôi phục bản thực thi `.exe` của phiên bản trước đó. |

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Cấu hình Hạ tầng Docker Host**: Máy chủ triển khai container yêu cầu tối thiểu 4GB RAM khả dụng, đã cài sẵn Docker Engine 26+ và Docker Compose V2. Cổng mạng TCP 443 (HTTPS/WSS) và 80 không bị tranh chấp bởi các tiến trình khác trên host.
* **Quyền Khởi tạo Thiết bị USB trên Trạm Kiosk**: File thực thi `FAS_Kiosk.exe` trên hệ điều hành Windows yêu cầu người dùng cấp quyền truy cập camera trong Windows Privacy Settings để DirectShow mở được luồng video.
* **Quản trị Khóa Bí mật Môi trường Sản xuất**: Khóa mã hóa `MASTER_KEY_AES` và mật khẩu CSDL trên môi trường sản xuất không lưu trong kho mã nguồn Git, được cấu hình trực tiếp trên máy chủ qua Docker secrets hoặc file biến môi trường phân quyền tài khoản quản trị hệ điều hành.

