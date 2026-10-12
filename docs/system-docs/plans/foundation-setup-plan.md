---
title: System Foundation Setup Plan
version: 3.0
status: Approved
owner: Lead System Architect & Lead DevOps Engineer
type: plan
scope: SYS
updated: 2026-10-12
---

# FOUNDATION SETUP PLAN — Kế hoạch Chuẩn bị Nền tảng Chung Hệ thống

Kế hoạch thiết lập cơ sở hạ tầng nền tảng, công cụ phát triển, môi trường tích hợp liên phân hệ và cấu trúc kho mã nguồn dùng chung cho toàn bộ Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS) theo chuẩn SDLC v3.x ([sdlc-docs.md](../../sdlc-docs.md) §8.3).

---

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ các công tác chuẩn bị môi trường dùng chung, cấu trúc kho mã nguồn monorepo, hạ tầng tích hợp liên phân hệ, quản trị bí mật và cơ chế dữ liệu hạt giống phục vụ kiểm thử tích hợp xuyên suốt 3 phân hệ `kiosk-app`, `backend-service`, và `web-portal`.
* **Mục tiêu**:
  * Đảm bảo môi trường lập trình cô lập, chuẩn hóa khung dự án (Scaffolding), định dạng mã nguồn và quy chuẩn Git.
  * Phân định rạch ròi trách nhiệm giữa Nền tảng Hệ thống (System FSP) và Nền tảng Phân hệ (Subsystem FSP) theo ma trận 8 nhóm quan ngại tại Mục 8.3 của `sdlc-docs.md`.
  * Thiết lập môi trường tích hợp tập trung qua Docker Compose và mạng nội bộ container (`fas-network`), bảo đảm kết nối thông suốt giữa Kiosk, Backend và Web.
  * Cung cấp công cụ điều phối tự động (`manage-services.ps1`) kèm kịch bản kiểm tra sẵn sàng tích hợp tối thiểu (Smoke Check).
  * Chuẩn hóa bộ dữ liệu hạt giống (Data seed/reset harness) giúp môi trường tích hợp có thể tái lập nhanh chóng về trạng thái sạch phục vụ kiểm thử liên thông.

### Ma trận Phân công Trách nhiệm Nền tảng (§8.3)

| Nhóm Quan ngại | Trách nhiệm Cấp Hệ thống (System FSP) | Trách nhiệm Cấp Phân hệ (Subsystem FSP) |
| :--- | :--- | :--- |
| **Environment** | Môi trường build/test dùng chung; môi trường tích hợp liên phân hệ (`docker-compose.yml`). | Môi trường lập trình cục bộ (`.venv`, Node modules, Maven local). |
| **Shared infrastructure** | Hạ tầng mạng container (`fas-network`), CSDL PostgreSQL dùng chung, WebSocket STOMP Broker, chính sách cổng dịch vụ. | — |
| **Credentials** | Quản trị bí mật dùng chung xuyên hệ thống (`.env`, `JWT_SECRET`, `KIOSK_SECRET_TOKEN`, `MASTER_KEY_AES`). | Cấu hình tham số riêng của phân hệ khi cần thiết (`application.yml`, `settings.py`). |
| **Tooling / access** | Chuẩn hóa Monorepo Scaffolding, quy chuẩn Git, CI/CD GitHub Actions và script quản lý tập trung (`manage-services.ps1`). | Toolchain riêng của phân hệ (Python virtualenv, Maven compiler, Vite bundler). |
| **Packaging toolchain** | — | Tiêu chuẩn Dockerfile multi-stage, base-image chuẩn bảo mật, các bước đóng gói CI. |
| **Integration readiness** | Điều phối môi trường tích hợp, verify kết nối liên phân hệ và Smoke Check tối thiểu. | Health check endpoints (`/actuator/health`), graceful shutdown, API version exposure. |
| **Contract testing** | — | Bộ khung kiểm thử hợp đồng (Mock transport, OpenAPI contract harness, STOMP test harness). |
| **Data seed/reset** | Cơ chế nạp hạt giống và tái lập CSDL PostgreSQL cho môi trường tích hợp. | Dữ liệu mẫu cục bộ (Local SQLite fixture, mock JSON). |

---

## 2. Approach Decisions (Quyết định Tiếp cận Nền tảng)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-004` | Cấu trúc Monorepo thống nhất phân tách 3 dịch vụ tại thư mục `/app`. | Đơn giản hóa quản lý mã nguồn trong solo-developer, dễ dàng đồng bộ hợp đồng API và tài liệu. | Multi-repo riêng rẽ, Submodule lồng nhau | Cần quy ước nhánh và script build kiểm thử độc lập cho từng service. | `PRJ-001`, `STK-021` | Accepted |
| `APC-SYS-005` | Cô lập môi trường thực thi (Python venv, Node local modules, Dockerized DB). | Ngăn ngừa ô nhiễm môi trường máy trạm chủ (Zero Host Pollution), tái lập chính xác cấu hình dev. | Cài đặt toàn cục trên hệ điều hành host | Cần hướng dẫn kích hoạt venv và cài đặt dependencies rõ ràng cho từng dịch vụ. | `STK-001`, `STK-012` | Accepted |
| `APC-SYS-006` | Phân tầng quản lý bí mật: `.env` cho môi trường dev và cơ chế biến môi trường bảo mật trên máy chủ cho production. | Bảo đảm an toàn thông tin mật (`MASTER_KEY_AES`, mật khẩu CSDL), không commit secret lên Git; trên máy chủ sản xuất cấu hình qua Docker secrets hoặc file cấu hình host phân quyền chặt (NTFS ACL / `chmod 600`). | Hardcode vào mã nguồn, Triển khai Vault server đắt tiền cho solo-dev | Cần file mẫu `.env.example` rõ ràng; môi trường sản xuất yêu cầu thiết lập biến an toàn trước khi khởi động container. | `SRS-001`, `NFR-SYS-007`, `STK-034` | Accepted |
| `APC-SYS-018` | Chuẩn hóa nền tảng ghép nối liên phân hệ qua Docker Compose tập trung và mạng container nội bộ. | Đảm bảo tính nhất quán môi trường tích hợp, loại bỏ sai lệch cấu hình mạng/cổng giữa máy phát triển của lập trình viên và máy chủ kiểm thử. | Chạy toàn bộ ứng dụng thủ công từng terminal riêng lẻ | Cần duy trì tệp `docker-compose.yml` đồng bộ với cấu hình môi trường và script `manage-services.ps1`. | `PD-001`, `STK-022` | Accepted |
| `APC-SYS-019` | Phân định rạch ròi giữa Smoke Check sẵn sàng tích hợp và Kịch bản Kiểm thử Nghiệp vụ E2E. | Smoke Check chỉ kiểm tra các container đạt trạng thái `healthy`, cổng mạng mở và endpoint sức khỏe phản hồi UP $\le 3\text{s}$, không thực hiện kiểm thử nghiệp vụ sâu để tránh làm nặng nề quá trình khởi động hạ tầng. | Nhúng toàn bộ kịch bản kiểm thử E2E vào bước khởi động môi trường | Tách biệt ranh giới: FSP xác nhận môi trường sẵn sàng; Test Plan chịu trách nhiệm thực thi xác minh nghiệp vụ. | `PD-001`, `STK-035` | Accepted |

---

## 3. Foundation Work Items (Danh mục Công việc Chuẩn bị Nền tảng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-SYS-001` | Khởi tạo Khung Kho Mã nguồn (Monorepo Scaffolding) | Thiết lập cấu trúc thư mục `/app`, `/docs`, cấu hình Git, `.gitignore` và quy chuẩn commit Conventional Commits. | `STK-020`, `STK-021` | — | Cây thư mục monorepo được tạo lập; file `.gitignore` chặn commit các file rác, `.venv` và `.env`. | Done |
| `FND-SYS-002` | Thiết lập Môi trường Ảo Python cho Kiosk | Khởi tạo môi trường ảo Python 3.14 (`app/kiosk-app/.venv`), cài đặt danh mục dependencies trong `requirements.txt`. | `STK-001`, `STK-002`, `STK-003`, `STK-004` | `FND-SYS-001` | Môi trường ảo kích hoạt thành công; import `cv2`, `PySide6`, `onnxruntime` không lỗi; nạp ONNX Session với tensor giả lập hoàn tất trong $< 300\text{ ms}$. | Done |
| `FND-SYS-003` | Nạp & Kiểm định Bộ Trọng số AI ONNX | Tải 3 mô hình AI chuẩn (`yunet.onnx`, `minifasnet.onnx`, `arcface_mobilefacenet.onnx`) vào thư mục `assets/models/`. | `STK-005`, `STK-006`, `STK-007`, `ARC-001` | `FND-SYS-002` | Tệp mô hình hiện diện đầy đủ; mã băm SHA-256 khớp $100\%$ với bản kiểm chuẩn định nghĩa tại `assets/models/checksums.sha256`; nạp session cả 3 mô hình thành công. | Done |
| `FND-SYS-004` | Khởi tạo Dự án Maven Spring Boot 4.1 | Khởi tạo dự án Java 21 LTS tại `app/backend-service` với các starter: Web, Security, Data JPA, WebSocket. | `STK-010`, `STK-011`, `STK-023` | `FND-SYS-001` | Lệnh `./mvnw clean compile` và `./mvnw test-compile` chạy thành công; mã nguồn Java 21 biên dịch không có lỗi cú pháp. | Done |
| `FND-SYS-005` | Khởi tạo Dự án ReactJS Vite TypeScript | Khởi tạo dự án Web SPA tại `app/web-portal` bằng Vite, cài đặt Tailwind CSS và thư viện `@stomp/stompjs`. | `STK-016`, `STK-017`, `STK-018`, `STK-019` | `FND-SYS-001` | Lệnh `npm run dev` khởi động dev server hiển thị trang chào mừng; `npm run build` xuất gói tĩnh `dist/` không lỗi TypeScript và CSS. | Done |
| `FND-SYS-006` | Thiết lập Docker Compose CSDL PostgreSQL 16 & Cụm Dịch vụ | Viết file `docker-compose.yml` điều phối cụm dịch vụ `fas-postgres` và `fas-backend` kèm volume bền vững `pgdata`, cấu hình kiểm tra sức khỏe tự động (`healthcheck`). | `STK-012`, `STK-022`, `ARC-004` | `FND-SYS-001` | Lệnh `docker compose up -d` khởi chạy cụm dịch vụ; cả 2 container đạt trạng thái `healthy`; volume `pgdata` mount bền vững. | Done |
| `FND-SYS-007` | Chuẩn hóa Biến Môi trường & Quản trị Bí mật Dùng chung | Thiết lập tệp `.env.example` và quy tắc nạp biến môi trường toàn cục (`KIOSK_SECRET_TOKEN`, `JWT_SECRET`, `MASTER_KEY_AES`, `DB_PASSWORD`). | `STK-034`, `ARC-005` | `FND-SYS-001` | Toàn bộ 3 phân hệ đọc đúng giá trị biến môi trường tương ứng tại thời điểm khởi chạy; file bí mật phân quyền chỉ định riêng cho tài khoản chạy dịch vụ. | Done |
| `FND-SYS-008` | Thiết lập Mạng Nội bộ & Chính sách Kết nối Liên Phân hệ | Thiết lập mạng cầu nối container (`fas-network`), quy hoạch dải cổng (5432 CSDL, 8080 Backend REST & STOMP Broker, 5173 Web Portal dev) và chính sách phân giải tên dịch vụ nội bộ. | `ARC-001`, `ARC-002`, `STK-022` | `FND-SYS-001` | Các container trong mạng `fas-network` phân giải được tên dịch vụ (`fas-postgres`, `fas-backend`), giao tiếp thông suốt qua TCP không bị chặn bởi tường lửa host. | Done |
| `FND-SYS-009` | Điều phối Môi trường Tích hợp & Kiểm tra Kết nối Tối thiểu | Xây dựng script PowerShell tiện ích quản lý tập trung (`scripts/manage-services.ps1`) hỗ trợ các lệnh `start`, `stop`, `restart`, `status`, `logs`, `down` kèm tự động kiểm tra kết nối tối thiểu qua HTTP Actuator. | `ARC-012`, `STK-022`, `STK-035` | `FND-SYS-006`, `FND-SYS-008` | Lệnh `manage-services.ps1 status` hiển thị toàn bộ container `healthy`; kiểm tra `curl http://localhost:8080/actuator/health` trả về trạng thái UP trong $\le 3\text{s}$. | Done |
| `FND-SYS-010` | Cơ chế Nạp & Tái lập Dữ liệu Mẫu Môi trường Tích hợp | Xây dựng bộ dữ liệu hạt giống (Seed data) và cơ chế làm sạch/tái lập CSDL PostgreSQL cho môi trường tích hợp (gồm: tài khoản Admin hệ thống, nhân viên mẫu `NV-001` ở trạng thái `ACTIVE` kèm phân ca hành chính, và trạm Kiosk được ủy quyền `KIOSK-LOBBY-01`). | `ARC-004`, `STK-012` | `FND-SYS-006`, `FND-SYS-007` | CSDL chứa đầy đủ dữ liệu tối thiểu phục vụ kiểm thử tích hợp xuyên suốt giữa Kiosk, Backend và Web; nhân viên mẫu có thể điểm danh và đồng bộ ngay lập tức mà không gặp lỗi từ chối tài khoản. | Done |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Yêu cầu Docker Desktop / Docker Engine**: Máy trạm phát triển và máy chủ tích hợp phải cài đặt Docker Engine $\ge 27$ và Docker Compose v2; daemon Docker được bật và cho phép mount volume cục bộ.
* **Quyền Truy cập Docker Hub & Registry**: Quá trình tải image PostgreSQL và các base image Alpine yêu cầu kết nối mạng thông suốt hoặc mirror nội bộ có sẵn trong mạng doanh nghiệp.
* **Cơ chế Tái lập Dữ liệu Môi trường Tích hợp**: Script tái lập dữ liệu hạt giống (`FND-SYS-010`) được thiết kế riêng cho môi trường phát triển và kiểm thử tích hợp nội bộ; tuyệt đối không thực thi trên môi trường sản xuất (Production) có chứa dữ liệu thật của nhân sự.
