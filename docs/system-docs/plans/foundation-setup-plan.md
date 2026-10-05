---
title: System Foundation Setup Plan
version: 1.0
status: Approved
owner: Lead DevOps Engineer
---

# FOUNDATION SETUP PLAN — Kế hoạch Chuẩn bị Nền tảng Chung Hệ thống

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
| `APC-SYS-006` | Quản lý tham số nhạy cảm qua `.env` kết hợp `.env.example` chuẩn mẫu. | Bảo đảm an toàn thông tin mật (khóa mã hóa, credential CSDL), không commit secret lên repo. | Hardcode vào mã nguồn, Quản lý qua Vault server đắt tiền | Mỗi nhà phát triển phải tự tạo file `.env` cục bộ dựa trên template mẫu. | `SRS-001`, `NFR-SYS-005` | Accepted |

---

## 3. Foundation Work Items (Danh mục Công việc Chuẩn bị Nền tảng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-SYS-001` | Khởi tạo Khung Kho Mã nguồn (Monorepo Scaffolding) | Thiết lập cấu trúc thư mục `/app`, `/docs`, cấu hình Git, `.gitignore` và quy chuẩn commit Conventional Commits. | `STK-021` | — | Cây thư mục monorepo được tạo lập; file `.gitignore` chặn commit các file rác, `.venv` và `.env`. | Done |
| `FND-SYS-002` | Thiết lập Môi trường Ảo Python cho Kiosk | Khởi tạo môi trường ảo Python 3.14 (`app/kiosk-app/.venv`), cài đặt danh mục dependencies trong `requirements.txt`. | `STK-001`, `STK-002` | `FND-SYS-001` | Môi trường ảo kích hoạt thành công; `import cv2`, `import PySide6`, `import onnxruntime` không lỗi. | Done |
| `FND-SYS-003` | Nạp & Kiểm định Bộ Trọng số AI ONNX | Tải 3 mô hình AI chuẩn (`yunet.onnx`, `minifasnet.onnx`, `arcface_mobilefacenet.onnx`) vào thư mục `assets/models/`. | `STK-005`, `STK-006`, `STK-007` | `FND-SYS-002` | Tệp mô hình hiện diện đầy đủ; mã băm SHA-256 khớp với bản kiểm chuẩn; nạp ONNX Session thành công. | Done |
| `FND-SYS-004` | Khởi tạo Dự án Maven Spring Boot 3.3 | Khởi tạo dự án Java 21 LTS tại `app/backend-service` với các starter: Web, Security, Data JPA, WebSocket. | `STK-010`, `STK-011` | `FND-SYS-001` | Lệnh `./mvnw clean compile` chạy thành công; tạo bản build `.jar` kiểm thử không lỗi. | Planned |
| `FND-SYS-005` | Khởi tạo Dự án ReactJS Vite TypeScript | Khởi tạo dự án Web SPA tại `app/web-portal` bằng Vite, cài đặt Tailwind CSS và thư viện `@stomp/stompjs`. | `STK-016`, `STK-017`, `STK-018`, `STK-019` | `FND-SYS-001` | Lệnh `npm run dev` khởi động dev server hiển thị trang chào mừng thành công. | Done |
| `FND-SYS-006` | Thiết lập Docker Compose CSDL PostgreSQL 16 | Viết file `docker-compose.yml` điều phối container PostgreSQL 16 alpine kèm volume bền vững `pgdata` và script DDL khởi tạo. | `STK-012`, `STK-022` | `FND-SYS-001` | Lệnh `docker compose up -d` khởi chạy container cổng 5432; kết nối thành công qua DBeaver/VS Code. | Planned |
| `FND-SYS-007` | Chuẩn hóa Tệp Biến Môi trường Toàn cục | Thiết lập tệp `.env.example` và tệp cấu hình môi trường `.env` chứa các tham số: `KIOSK_ID`, `BACKEND_URL`, `ENCRYPTION_MASTER_KEY`. | `STK-015`, `ARC-001` | `FND-SYS-001` | Toàn bộ 3 phân hệ đọc đúng giá trị biến môi trường tương ứng tại thời điểm khởi chạy. | Done |

---

## 4. Verification Plan (Kế hoạch Kiểm định Nền tảng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-SYS-008` | Kiểm định Scaffolding & Môi trường Python | Kích hoạt `.venv`, chạy script kiểm tra import và nạp model ONNX với dummy tensor. | `STK-001`, `STK-004` | `FND-SYS-003` | Nạp thành công cả 3 mô hình AI với thời gian nạp session $< 300\text{ms}$. | Done |
| `FND-SYS-009` | Kiểm định Khung Dịch vụ Backend Java | Chạy lệnh `./mvnw test-compile` trên phân hệ `backend-service`. | `STK-010`, `STK-011` | `FND-SYS-004` | Biên dịch thành công mã nguồn Java 21 không có cảnh báo nghiêm trọng. | Planned |
| `FND-SYS-010` | Kiểm định Khung Cổng Web Frontend | Chạy lệnh `npm run build` trên phân hệ `web-portal`. | `STK-016`, `STK-017` | `FND-SYS-005` | Đóng gói bundle tĩnh không lỗi TypeScript và CSS compilation. | Done |
| `FND-SYS-011` | Kiểm định Hạ tầng CSDL Container | Chạy `docker compose up -d` và thực hiện lệnh `pg_isready -h localhost -p 5432`. | `STK-012`, `STK-022` | `FND-SYS-006` | PostgreSQL trả về trạng thái accepting connections, khởi tạo schema đầy đủ. | Planned |
