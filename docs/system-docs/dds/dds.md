---
title: Thiết kế Chi tiết & Kiến trúc Hệ thống (DDS)
version: 1.0
status: Approved
owner: Lead System Architect
---

# DDS — Thiết kế Chi tiết & Kiến trúc Hệ thống (Detailed Design Specification)

Thiết kế kiến trúc kỹ thuật toàn diện, cấu trúc phân tầng (`ARC-SYS-`), các thuộc tính thiết kế xuyên suốt và các quyết định kỹ thuật cấp hệ thống (`DD-SYS-`) của Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS).

---

## 1. System Architecture (Kiến trúc Tổng thể & Ranh giới Phân hệ)

### 1.1. Cấu trúc Phân tầng (3-Tier Distributed Architecture)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ARC-001` | Tầng Biên: Trạm Kiosk Desktop (`kiosk-app`) | Thu nhận luồng camera video, thực thi pipeline AI cục bộ, so khớp ma trận RAM, bàn phím số PIN và hàng đợi ngoại tuyến SQLite WAL. | `STK-001`, `STK-002`, `STK-003`, `STK-004`, `STK-008`, `STK-009`, `STK-030` | `FR-SYS-001`, `FR-SYS-002`, `FR-SYS-003`, `FR-SYS-004`, `FR-SYS-006` | `DD-SYS-001`, `DD-SYS-002` | Accepted |
| `ARC-002` | Tầng Trung tâm: Dịch vụ Máy chủ (`backend-service`) | Quản lý ca kíp, tính toán giờ công, bộ đệm Cooldown 120s, mã hóa AES-256-GCM, phát sóng STOMP và cron job tiêu hủy sau 20 ngày. | `STK-010`, `STK-011`, `STK-012`, `STK-013`, `STK-014`, `STK-015` | `FR-SYS-005`, `FR-SYS-010`, `FR-SYS-011`, `FR-SYS-012`, `FR-SYS-013`, `FR-SYS-014` | `DD-SYS-003`, `DD-SYS-004` | Accepted |
| `ARC-003` | Tầng Trình diễn: Cổng Web Quản trị (`web-portal`) | Giao diện Live Monitoring Dashboard thời gian thực, quản lý nhân viên, phân ca, phê duyệt giải trình, ký Consent và xuất báo cáo an toàn. | `STK-016`, `STK-017`, `STK-018`, `STK-019`, `STK-031`, `STK-032`, `STK-033` | `FR-SYS-007`, `FR-SYS-008`, `FR-SYS-015`, `FR-SYS-016` | `DD-SYS-004` | Accepted |
| `ARC-004` | Tầng Dữ liệu Bền vững (PostgreSQL Enterprise DB) | Quản lý bền vững toàn bộ dữ liệu quan hệ ACID chuẩn 3NF: nhân sự, ca kíp, bảng công và vector mã hóa BYTEA. | `STK-012` | `DATA-SYS-001`, `DATA-SYS-002`, `DATA-SYS-003`, `DATA-SYS-004`, `DATA-SYS-005`, `DATA-SYS-006`, `DATA-SYS-007`, `DATA-SYS-008` | `DD-SYS-003` | Accepted |

### 1.2. Thiết kế Xuyên suốt (Cross-cutting Design)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ARC-005` | Khung Bảo mật Kênh truyền & Khóa Dữ liệu | Thực thi TLS 1.3 cho toàn bộ REST API/STOMP trên production; quản lý Master Key độc lập nạp từ biến môi trường cho giải mã AES-256-GCM. | `STK-014`, `STK-015` | `SRS-001`, `SRS-002` | `DD-SYS-003` | Accepted |
| `ARC-006` | Khung Nhật ký Kiểm toán Bất biến (Audit Trail) | Tự động ghi nhật ký các hành vi nhạy cảm (ký Consent, duyệt công, xóa dữ liệu 20 ngày, nạp mẫu) vào bảng `audit_logs` có đầy đủ mốc thời gian, IP và tác nhân. | `STK-012` | `SRS-010`, `DATA-SYS-007` | `DD-SYS-003` | Accepted |
| `ARC-007` | Khung Bền bỉ Ngoại tuyến & Tự Đồng bộ (Offline Resilience) | Trạm Kiosk duy trì vận hành khi đứt mạng qua SQLite WAL; worker chạy ngầm tự động phát hiện mạng và gửi bù theo lô tối đa 50 bản ghi khi có kết nối trở lại. | `STK-009`, `STK-030` | `SRS-008`, `FR-SYS-006` | `DD-SYS-002` | Accepted |

### 1.3. Topology Triển khai Hệ thống

```mermaid
flowchart TB
    subgraph Host_Machine["Thiết bị Máy trạm Biên & Môi trường Host"]
        Camera["Camera UVC / Webcam"] -->|"Khung hình Video >=15 FPS"| KioskApp["Ứng dụng Kiosk (Python/PySide6)"]
        KioskApp <-->|"Đọc/Ghi ngoại tuyến"| SQLiteDB[("SQLite WAL (kiosk_local.db)")]
        KioskApp <-->|"Nạp vector RAM"| RAMCache[("Ma trận RAM N x 512 float32")]
    end

    subgraph Server_Environment["Môi trường Máy chủ Doanh nghiệp"]
        BackendApp["Máy chủ Backend (Spring Boot 4.1+ / Java 21)"]
        BackendApp <-->|"Spring Data JPA / HikariCP"| PostgresDB[("PostgreSQL 16+ Enterprise CSDL")]
        BackendApp <-->|"Bộ đệm Cooldown 120s"| CaffeineMem[("Caffeine Cache")]
    end

    subgraph Client_Browser["Trình duyệt Quản trị & Tự phục vụ"]
        WebPortalApp["Cổng Web Portal (ReactJS 19+ / Vite / Tailwind)"]
    end

    %% Luồng truyền thông
    KioskApp -->|"REST POST /api/v1/kiosk/punch (TLS 1.3)"| BackendApp
    KioskApp -->|"REST POST /api/v1/kiosk/sync-batch"| BackendApp
    BackendApp -->|"WebSocket STOMP /topic/kiosk-gallery"| KioskApp
    BackendApp -->|"WebSocket STOMP /topic/live-attendance"| WebPortalApp
    WebPortalApp <-->|"REST API Bearer JWT"| BackendApp
```

---

## 2. End-to-End System Behavior (Luồng Tương tác Toàn trình Xuyên Phân hệ)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ARC-008` | Luồng Điểm danh Thời gian thực Chuẩn | Camera bắt mặt $\rightarrow$ YuNet $\rightarrow$ MiniFASNet $S_{\text{liveness}} \ge 0.85$ $\rightarrow$ ArcFace 512D $\rightarrow$ Cosine RAM $\ge 0.50$ $\rightarrow$ Cooldown check $\rightarrow$ REST POST $\rightarrow$ Backend JPA $\rightarrow$ STOMP broadcast $\rightarrow$ Web Dashboard $\le 1.2\text{ s}$. | `ARC-001`, `ARC-002`, `ARC-003` | `FR-SYS-001`, `FR-SYS-002`, `FR-SYS-003`, `FR-SYS-013`, `NFR-SYS-003` | `DD-SYS-001`, `DD-SYS-004` | Accepted |
| `ARC-009` | Luồng Điểm danh Ngoại tuyến & Đồng bộ Bù | Kiosk nhận diện thành công $\rightarrow$ Mất mạng/timeout $\rightarrow$ Ghi đệm SQLite WAL $\rightarrow$ Báo điểm danh offline thành công $\rightarrow$ Ping ngầm $\rightarrow$ Khôi phục mạng $\rightarrow$ Gửi bù lô 50 bản ghi $\rightarrow$ Backend cập nhật gốc. | `ARC-001`, `ARC-002` | `FR-SYS-006`, `NFR-SYS-006`, `SRS-008` | `DD-SYS-002` | Accepted |
| `ARC-010` | Luồng Tự Đăng ký & Nạp nóng Vector Mẫu | Nhân viên ký Consent trên Web $\rightarrow$ Sinh OTP 48h $\rightarrow$ Ra Kiosk nhập OTP $\rightarrow$ Chụp 3 ảnh chuẩn $\rightarrow$ Trích vector 512D $\rightarrow$ Gửi Backend mã hóa AES $\rightarrow$ Phát STOMP `/topic/kiosk-gallery` $\rightarrow$ Nạp nóng RAM Kiosk. | `ARC-001`, `ARC-002`, `ARC-003` | `FR-SYS-007`, `FR-SYS-008`, `FR-SYS-009`, `FR-SYS-014` | `DD-SYS-003`, `DD-SYS-004` | Accepted |
| `ARC-011` | Luồng Tiêu hủy Dữ liệu theo Luật 2025 | HR chuyển nhân viên `TERMINATED` $\rightarrow$ Lập tức phát STOMP gỡ vector khỏi RAM Kiosk $\rightarrow$ Cronjob 01:00 hàng ngày quét nhân viên nghỉ $> 20$ ngày $\rightarrow$ Hard Delete vector CSDL $\rightarrow$ Ghi log kiểm toán tuân thủ. | `ARC-002`, `ARC-004` | `FR-SYS-011`, `SRS-003`, `DATA-SYS-013` | `DD-SYS-003` | Accepted |

---

## 3. System Design Decisions (Quyết định Thiết kế Cấp Hệ thống)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `DD-SYS-001` | Thực thi suy luận AI hoàn toàn tại biên trên CPU với tập lệnh AVX2, không phụ thuộc GPU. | Đạt độ trễ $\le 350\text{ ms}$, tiết kiệm 95% băng thông mạng và tận dụng PC sẵn có với chi phí 0 VNĐ. | Suy luận đám mây Cloud API, Trang bị GPU rời chuyên dụng | Cần tinh chỉnh mô hình gọn nhẹ và kiểm soát tài nguyên CPU/RAM. | `PD-002`, `INF-006` | Accepted |
| `DD-SYS-002` | Áp dụng cơ chế lưu trữ cục bộ SQLite chế độ Write-Ahead Logging (WAL) tại trạm Kiosk. | Đảm bảo $\text{RPO} = 0$ khi mất điện đột ngột và hỗ trợ đọc/ghi đồng thời non-blocking. | Bộ nhớ RAM thuần túy, File JSON cục bộ | Cần quản lý dọn dẹp và cơ chế checkpoint WAL định kỳ. | `PD-004`, `INF-011` | Accepted |
| `DD-SYS-003` | Mã hóa đối xứng AES-256-GCM ở trạng thái tĩnh cho toàn bộ vector mẫu 512D với Master Key độc lập trong biến môi trường. | Bảo đảm tính bí mật và toàn vẹn dữ liệu sinh trắc học theo Luật 91/2025/QH15. | Lưu vector plaintext, Mã hóa mức CSDL pgcrypto | Tăng tải CPU khi giải mã nạp gallery; cần bảo mật Master Key. | `PD-005`, `INF-009` | Accepted |
| `DD-SYS-004` | Sử dụng giao thức WebSocket STOMP làm kênh truyền thông đẩy thời gian thực hai chiều giữa Backend, Web Portal và Kiosk. | Đẩy dữ liệu tức thì $\le 200\text{ ms}$, tối ưu băng thông và tài nguyên so với polling. | HTTP Polling định kỳ, SSE (Server-Sent Events) | Cần quản lý vòng đời socket và xử lý mất kết nối tự động. | `PD-006`, `INF-003` | Accepted |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Ranh giới Cấu hình Cổng Mạng (Port Mapping)**: Mặc định Backend phục vụ trên cổng TCP `8080` (HTTP/REST và WebSocket), CSDL PostgreSQL lắng nghe trên cổng TCP `5432`, và máy chủ phát triển Web Portal Vite phục vụ trên cổng TCP `5173`. Trạm Kiosk kết nối tới Backend thông qua biến môi trường `BACKEND_URL`.
* **Cơ chế Đồng bộ Đồng hồ Hệ thống**: Độ chính xác của mốc thời gian chấm công phụ thuộc vào việc các trạm Kiosk và máy chủ Backend đồng bộ cùng một nguồn chuẩn giờ mạng NTP (`EXT-003`) với sai lệch mốc giờ $\le 50\text{ ms}$.
