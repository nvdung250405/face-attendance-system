---
title: System Foundation Setup Plan
version: 2.0
status: Approved
owner: Lead DevOps Engineer
type: plan
scope: SYS
updated: 2026-10-08
---

# FOUNDATION SETUP PLAN — Kế hoạch Chuẩn bị Nền tảng Chung Hệ thống

Kế hoạch thiết lập cơ sở hạ tầng nền tảng, công cụ phát triển, cấu trúc kho mã nguồn và môi trường thực thi dùng chung cho toàn bộ Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §8.3).

---

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ các công tác chuẩn bị môi trường, cấu trúc repository, công cụ phát triển và cơ sở hạ tầng nền tảng cho 3 phân hệ `kiosk-app`, `backend-service`, và `web-portal`.
* **Mục tiêu**:
  * Đảm bảo môi trường lập trình cô lập, không xung đột thư viện giữa các thành phần.
  * Chuẩn hóa khung dự án (Scaffolding), định dạng mã nguồn và quy chuẩn Git.
  * Thiết lập cấu hình môi trường dùng chung và sẵn sàng hạ tầng lưu trữ.

---

## 2. Approach Decisions (Quyết định Tiếp cận Nền tảng)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-004` | Cấu trúc Monorepo thống nhất phân tách 3 dịch vụ tại thư mục `/app`. | Đơn giản hóa quản lý mã nguồn trong solo-developer, dễ dàng đồng bộ hợp đồng API và tài liệu. | Multi-repo riêng rẽ, Submodule lồng nhau | Cần quy ước nhánh và script build kiểm thử độc lập cho từng service. | `PRJ-001`, `STK-021` | Accepted |
| `APC-SYS-005` | Cô lập môi trường thực thi (Python venv, Node local modules, Dockerized DB). | Ngăn ngừa ô nhiễm môi trường máy trạm chủ (Zero Host Pollution), tái lập chính xác cấu hình dev. | Cài đặt toàn cục trên hệ điều hành host | Cần hướng dẫn kích hoạt venv và cài đặt dependencies rõ ràng cho từng dịch vụ. | `STK-001`, `STK-012` | Accepted |
| `APC-SYS-006` | Phân tầng quản lý bí mật: `.env` cho môi trường dev và cơ chế biến môi trường bảo mật trên máy chủ cho production. | Bảo đảm an toàn thông tin mật (`MASTER_KEY_AES`, mật khẩu CSDL), không commit secret lên Git; trên máy chủ sản xuất cấu hình qua Docker secrets hoặc file cấu hình host phân quyền chặt (NTFS ACL / `chmod 600`). | Hardcode vào mã nguồn, Triển khai Vault server đắt tiền cho solo-dev | Cần file mẫu `.env.example` rõ ràng; môi trường sản xuất yêu cầu thiết lập biến an toàn trước khi khởi động container. | `SRS-001`, `NFR-SYS-007`, `STK-034` | Accepted |

---

## 3. Foundation Work Items (Danh mục Công việc Chuẩn bị Nền tảng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `FND-SYS-001` | Khởi tạo Khung Kho Mã nguồn (Monorepo Scaffolding) | Thiết lập cấu trúc thư mục `/app`, `/docs`, cấu hình Git, `.gitignore` và quy chuẩn commit Conventional Commits. | `STK-020`, `STK-021` | — | Cây thư mục monorepo được tạo lập; file `.gitignore` chặn commit các file rác, `.venv` và `.env`. | Done |
| `FND-SYS-002` | Thiết lập Môi trường Ảo Python cho Kiosk | Khởi tạo môi trường ảo Python 3.14 (`app/kiosk-app/.venv`), cài đặt danh mục dependencies trong `requirements.txt`. | `STK-001`, `STK-002`, `STK-003`, `STK-004` | `FND-SYS-001` | Môi trường ảo kích hoạt thành công; import `cv2`, `PySide6`, `onnxruntime` không lỗi; nạp ONNX Session với tensor giả lập hoàn tất trong $< 300\text{ ms}$. | Done |
| `FND-SYS-003` | Nạp & Kiểm định Bộ Trọng số AI ONNX | Tải 3 mô hình AI chuẩn (`yunet.onnx`, `minifasnet.onnx`, `arcface_mobilefacenet.onnx`) vào thư mục `assets/models/`. | `STK-005`, `STK-006`, `STK-007`, `ARC-001` | `FND-SYS-002` | Tệp mô hình hiện diện đầy đủ; mã băm SHA-256 khớp $100\%$ với bản kiểm chuẩn định nghĩa tại `assets/models/checksums.sha256`; nạp session cả 3 mô hình thành công. | Done |
| `FND-SYS-004` | Khởi tạo Dự án Maven Spring Boot 4.1 | Khởi tạo dự án Java 21 LTS tại `app/backend-service` với các starter: Web, Security, Data JPA, WebSocket. | `STK-010`, `STK-011`, `STK-023` | `FND-SYS-001` | Lệnh `./mvnw clean compile` và `./mvnw test-compile` chạy thành công; mã nguồn Java 21 biên dịch không có lỗi cú pháp. | Planned |
| `FND-SYS-005` | Khởi tạo Dự án ReactJS Vite TypeScript | Khởi tạo dự án Web SPA tại `app/web-portal` bằng Vite, cài đặt Tailwind CSS và thư viện `@stomp/stompjs`. | `STK-016`, `STK-017`, `STK-018`, `STK-019` | `FND-SYS-001` | Lệnh `npm run dev` khởi động dev server hiển thị trang chào mừng; `npm run build` xuất gói tĩnh `dist/` không lỗi TypeScript và CSS. | Done |
| `FND-SYS-006` | Thiết lập Docker Compose CSDL PostgreSQL 16 | Viết file `docker-compose.yml` điều phối container PostgreSQL 16 alpine kèm volume bền vững `pgdata` và script DDL khởi tạo. | `STK-012`, `STK-022`, `ARC-004` | `FND-SYS-001` | Lệnh `docker compose up -d` khởi chạy container cổng 5432; `pg_isready -h localhost -p 5432` trả về trạng thái accepting connections; volume `pgdata` mount bền vững. | Planned |
| `FND-SYS-007` | Chuẩn hóa Biến Môi trường & Quản trị Bí mật | Thiết lập tệp `.env.example` và quy tắc nạp biến môi trường toàn cục (`KIOSK_ID`, `BACKEND_URL`, `MASTER_KEY_AES`, `DB_PASSWORD`). | `STK-034`, `ARC-005` | `FND-SYS-001` | Toàn bộ 3 phân hệ đọc đúng giá trị biến môi trường tương ứng tại thời điểm khởi chạy; file bí mật phân quyền chỉ định riêng cho tài khoản chạy dịch vụ. | Done |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Tính Tương thích Python 3.14**: Môi trường Kiosk App sử dụng Python 3.14 trên Windows; các gói phụ thuộc nhị phân (`opencv-python`, `onnxruntime`, `PySide6`) tương thích ổn định với CPython 3.14 mà không phát sinh lỗi ABI.
* **Quyền Truy cập Docker Hub & Maven Central**: Quá trình tải image PostgreSQL và thư viện Maven/NPM yêu cầu kết nối mạng thông suốt hoặc mirror nội bộ có sẵn trong mạng doanh nghiệp.
* **Bản Kiểm chuẩn Trọng số AI**: Tệp `assets/models/checksums.sha256` được cam kết vào repo như nguồn đối chiếu kiểm chuẩn duy nhất để bảo đảm chuỗi cung ứng bảo mật cho các mô hình AI ONNX.

