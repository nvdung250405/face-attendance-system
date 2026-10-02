# FOUNDATION SETUP PLAN — Kế hoạch Chuẩn bị Nền tảng Chung Hệ thống

> **Mã tài liệu:** `PLN-FND-01`  
> **Cấp độ:** Cấp Hệ thống (System-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả các hạng mục công việc chuẩn bị hạ tầng, môi trường lập trình, scaffolding kho mã nguồn và cấu hình dùng chung (`FND-SYS-`) trước khi bước vào giai đoạn xây dựng mã nguồn.

---

## 1. Approach & Principles (Nguyên tắc Thiết lập Nền tảng)

* **Monorepo Cohesion**: Tổ chức cấu trúc phân tách rõ ràng tại thư mục `/app` gồm 3 phân hệ độc lập: `kiosk-app`, `backend-service`, `web-portal`.
* **Zero Host Pollution**: Mọi phụ thuộc phần mềm được cô lập trong môi trường ảo chuyên biệt (Python Virtualenv cho Kiosk, Docker Container cho CSDL PostgreSQL, npm local cho Web Portal).
* **Environment Integrity**: Toàn bộ tham số cấu hình nhạy cảm (Khóa bí mật mã hóa, cổng kết nối) được quản lý tập trung thông qua tệp biến môi trường `.env`.

---

## 2. Foundation Work Items (Danh mục Công việc Chuẩn bị Nền tảng)

| ID | Tên Hạng mục Công việc | Mô tả Kỹ thuật Chi tiết | Covers / Uses | Depends on | Tiêu chí Hoàn thành (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-SYS-001` | Khởi tạo Khung Kho Mã nguồn (Monorepo Scaffolding) | Thiết lập cấu trúc thư mục `/app`, `/docs`, cấu hình Git, `.gitignore` và quy chuẩn commit Conventional Commits. | `STK-021` | Không | Cây thư mục monorepo được tạo lập; file `.gitignore` chặn commit các file rác, `.venv` và `.env`. | **Hoàn thành** |
| `FND-SYS-002` | Thiết lập Môi trường Ảo Python cho Kiosk | Khởi tạo môi trường ảo Python 3.14 (`app/kiosk-app/.venv`), cài đặt danh mục dependencies trong `requirements.txt`. | `STK-001`, `STK-002` | `FND-SYS-001` | Môi trường ảo kích hoạt thành công; `import cv2`, `import PySide6`, `import onnxruntime` không lỗi. | **Hoàn thành** |
| `FND-SYS-003` | Nạp & Kiểm định Bộ Trọng số AI ONNX | Tải 3 mô hình AI chuẩn (`yunet.onnx`, `minifasnet.onnx`, `arcface_mobilefacenet.onnx`) vào thư mục `assets/models/`. | `STK-005` đến `STK-007`| `FND-SYS-002` | Tệp mô hình hiện diện đầy đủ; mã băm SHA-256 khớp với bản kiểm chuẩn; nạp ONNX Session thành công. | **Hoàn thành** |
| `FND-SYS-004` | Khởi tạo Dự án Maven Spring Boot 4.x | Khởi tạo dự án Java 21 LTS tại `app/backend-service` với các starter: Web, Security, Data JPA, WebSocket. | `STK-010`, `STK-011` | `FND-SYS-001` | Lệnh `./mvnw clean compile` chạy thành công; tạo bản build `.jar` kiểm thử không lỗi. | Sẵn sàng |
| `FND-SYS-005` | Khởi tạo Dự án ReactJS Vite TypeScript | Khởi tạo dự án Web SPA tại `app/web-portal` bằng Vite, cài đặt Tailwind CSS và thư viện `@stomp/stompjs`. | `STK-016` đến `STK-019`| `FND-SYS-001` | Lệnh `npm run dev` khởi động dev server hiển thị trang chào mừng thành công. | **Hoàn thành** |
| `FND-SYS-006` | Thiết lập Docker Compose CSDL PostgreSQL 16 | Viết file `docker-compose.yml` điều phối container PostgreSQL 16 alpine kèm volume bền vững `pgdata` và script DDL khởi tạo. | `STK-012`, `STK-022` | `FND-SYS-001` | Lệnh `docker compose up -d` khởi chạy container cổng 5432; kết nối thành công qua DBeaver/VS Code. | Sẵn sàng |
| `FND-SYS-007` | Chuẩn hóa Tệp Biến Môi trường Toàn cục | Thiết lập tệp `.env.example` và tệp cấu hình môi trường `.env` chứa các tham số: `KIOSK_ID`, `BACKEND_URL`, `ENCRYPTION_MASTER_KEY`. | `SRS-001` | `FND-SYS-001` | Toàn bộ 3 phân hệ đọc đúng giá trị biến môi trường tương ứng tại thời điểm khởi chạy. | **Hoàn thành** |
