---
title: Danh mục Công nghệ & Công cụ (Tech & Tool Stack)
version: 1.0
status: Approved
owner: Lead System Architect
---

# STACK — Danh mục Công nghệ & Công cụ (Tech & Tool Stack)

Xác lập danh mục chuẩn hóa về công nghệ nền tảng (Tech Stack) và công cụ kỹ thuật (Tool Stack) được áp dụng trên toàn bộ hệ thống Monorepo, có gắn mã `STK-` và truy vết về các quyết định dự án (`PD-`).

---

## 1. Tech Stack (Công nghệ Hệ thống)

| ID        | Category            | Name                   |     Version     | Applies to | Role                                                             |   Basis   | Requires             | Status  |
| :-------- | :------------------ | :--------------------- | :-------------: | :--------: | :--------------------------------------------------------------- | :-------: | :------------------- | :-----: |
| `STK-001` | Edge Runtime        | Python                 |     3.14.x      |   `KSK`    | Môi trường thực thi phân hệ Kiosk và điều phối AI                | `PD-002`  | —                    | Adopted |
| `STK-002` | Edge GUI            | PySide6                |      6.8+       |   `KSK`    | Khung giao diện đồ họa Kiosk tỷ lệ 9:16 và QML Bridge            | `PD-001`  | `STK-001`            | Adopted |
| `STK-003` | Vision Engine       | OpenCV                 |      4.10+      |   `KSK`    | Thu nhận luồng video, DirectShow backend, biến đổi hình học      | `PD-002`  | `STK-001`            | Adopted |
| `STK-004` | AI Inference        | ONNX Runtime           |      1.20+      |   `KSK`    | Động cơ thực thi mạng nơ-ron học sâu tối ưu hóa trên CPU         | `PD-002`  | `STK-001`            | Adopted |
| `STK-005` | AI Model (Detector) | YuNet (OpenCV Zoo)     |      2023       |   `KSK`    | Phát hiện khuôn mặt nhẹ (~230KB), trích xuất 5 điểm mốc          | `INF-006` | `STK-004`            | Adopted |
| `STK-006` | AI Model (Liveness) | MiniFASNet             |       2.7       |   `KSK`    | Kiểm tra thực thể sống thụ động từ ảnh RGB, ngưỡng 0.85          | `PD-003`  | `STK-004`            | Adopted |
| `STK-007` | AI Model (Feature)  | ArcFace MobileFaceNet  |       v1        |   `KSK`    | Trích xuất vector đặc trưng 512 chiều chuẩn hóa L2 Norm          | `INF-006` | `STK-004`            | Adopted |
| `STK-008` | Math Engine         | NumPy                  |   2.x / 1.26+   |   `KSK`    | Quản lý ma trận Gallery RAM và tính tích vô hướng Cosine         | `INF-007` | `STK-001`            | Adopted |
| `STK-009` | Local Storage       | SQLite 3               |      3.47+      |   `KSK`    | Hàng đợi lưu trữ ngoại tuyến bền vững khi mất mạng (WAL)         | `PD-004`  | `STK-001`            | Adopted |
| `STK-010` | Backend Runtime     | Java LTS (Temurin)     |     21 LTS      |    `BE`    | Môi trường thực thi máy chủ doanh nghiệp đa luồng                | `PD-001`  | —                    | Adopted |
| `STK-011` | Backend Framework   | Spring Boot            |     4.1.x       |    `BE`    | Khung phát triển phân hệ Backend và REST API                     | `PD-001`  | `STK-010`            | Adopted |
| `STK-012` | Enterprise DB       | PostgreSQL             |    17+ / 16+    |    `BE`    | Cơ sở dữ liệu quan hệ trung tâm, lưu trữ vector mã hóa BYTEA     | `PD-001`  | —                    | Adopted |
| `STK-013` | Backend Cache       | Caffeine Cache         |      3.1+       |    `BE`    | Bộ đệm RAM quản lý cửa sổ Cooldown chống quét trùng 120s         | `PD-001`  | `STK-011`            | Adopted |
| `STK-014` | Realtime Protocol   | Spring WebSocket STOMP |      4.1+       |   `SYS`    | Kênh truyền thông điệp đẩy 2 chiều thời gian thực                | `PD-006`  | `STK-011`            | Adopted |
| `STK-015` | Biometric Crypto    | AES-256-GCM            | NIST SP 800-38D |    `BE`    | Mã hóa đối xứng vector sinh trắc học ở trạng thái tĩnh           | `PD-005`  | `STK-011`            | Adopted |
| `STK-016` | Frontend Runtime    | Node.js                |    v24.x LTS    |   `WEB`    | Môi trường thực thi phân hệ Web Portal                           | `PD-001`  | —                    | Adopted |
| `STK-017` | Frontend Framework  | ReactJS                |      19.2+      |   `WEB`    | Khung phát triển phân hệ Web Portal (SPA)                        | `PD-001`  | `STK-016`            | Adopted |
| `STK-018` | Frontend Styling    | Tailwind CSS           |      4.3+       |   `WEB`    | Hệ thống thiết kế giao diện người dùng CSS tiện ích              | `PD-001`  | `STK-016`, `STK-017` | Adopted |
| `STK-019` | Frontend Bundler    | Vite                   |      8.3+       |   `WEB`    | Máy chủ phát triển cục bộ tốc độ cao và đóng gói tĩnh            | `PD-001`  | `STK-016`, `STK-017` | Adopted |
| `STK-030` | Edge HTTP Client    | httpx                  |      0.28+      |   `KSK`    | Khách hàng HTTP tiêu thụ REST API và điều phối worker đồng bộ    | `PD-001`  | `STK-001`            | Adopted |
| `STK-031` | Web HTTP Client     | Axios                  |     1.20+       |   `WEB`    | Khách hàng HTTP gọi REST API kèm mutex refresh token interceptor | `PD-001`  | `STK-016`, `STK-017` | Adopted |
| `STK-032` | Web State Cache     | TanStack Query         |       5.x       |   `WEB`    | Quản lý bộ đệm trạng thái máy chủ và tự động retry kết nối       | `PD-001`  | `STK-016`, `STK-017` | Adopted |
| `STK-033` | Web Realtime Client | @stomp/stompjs         |      7.3+       |   `WEB`    | Khách hàng STOMP nhận thông báo điểm danh Live Dashboard         | `PD-006`  | `STK-016`, `STK-017` | Adopted |

---

## 2. Tool Stack (Công cụ Kỹ thuật & Nền tảng Phát triển)

| ID        | Category           | Name                     | Version  | Applies to | Role                                                        |  Basis   | Requires  | Status  |
| :-------- | :----------------- | :----------------------- | :------: | :--------: | :---------------------------------------------------------- | :------: | :-------- | :-----: |
| `STK-020` | IDE Duy nhất       | Visual Studio Code       |  1.98+   |   `SYS`    | Môi trường soạn thảo mã nguồn, biên dịch và gỡ lỗi duy nhất | `PD-001` | —         | Adopted |
| `STK-021` | Version Control    | Git                      |  2.54+   |   `SYS`    | Quản lý phiên bản mã nguồn phân tán theo nhánh              | `PD-001` | —         | Adopted |
| `STK-022` | Container Engine   | Docker Desktop / Compose | 29+ / v2 |   `SYS`    | Điều phối container CSDL PostgreSQL và môi trường kiểm thử  | `PD-001` | —         | Adopted |
| `STK-023` | Java Build Tool    | Apache Maven             | 3.9.16+  |    `BE`    | Quản lý phụ thuộc và đóng gói phân hệ Backend (.jar)        | `PD-001` | `STK-010` | Adopted |
| `STK-024` | Desktop Packaging  | PyInstaller              |  6.11+   |   `KSK`    | Đóng gói phân hệ Kiosk thành tệp thực thi độc lập (.exe)    | `PD-002` | `STK-001` | Adopted |
| `STK-025` | Testing (Python)   | pytest & pytest-cov      |   9.1+   |   `KSK`    | Kiểm thử đơn vị thuật toán AI, CSDL WAL và đo độ bao phủ    | `PD-001` | `STK-001` | Adopted |
| `STK-026` | Testing (Java)     | JUnit 5 & Mockito        |  5.11+   |    `BE`    | Kiểm thử nghiệp vụ chấm công, bảo mật và Mock API           | `PD-001` | `STK-023` | Adopted |
| `STK-027` | Testing (Web)      | Vitest & Testing Library |   3.x    |   `WEB`    | Kiểm thử thành phần giao diện Web và luồng dữ liệu          | `PD-001` | `STK-016` | Adopted |
| `STK-028` | Linter / Formatter | Ruff & ESLint/Prettier   |  Latest  |   `SYS`    | Kiểm soát cú pháp tĩnh và định dạng mã nguồn chuẩn hóa      | `PD-001` | —         | Adopted |
| `STK-029` | CI/CD Platform     | GitHub Actions           |  Hosted  |   `SYS`    | Tự động hóa kiểm thử mã nguồn, docs-check và build artifact | `PD-001` | `STK-021` | Adopted |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Mở)

- **Tương thích Môi trường Python 3.14**: Thư viện `onnxruntime` và `PySide6` phải đảm bảo tương thích ổn định với môi trường Python 3.14 trên Windows 11. Các ca kiểm thử thực tế đã xác nhận việc nạp mô hình và suy luận diễn ra bình thường.
- **Chi phí Phần mềm Bản quyền = 0 VNĐ**: 100% các công cụ, thư viện và công nghệ trong danh mục đều sử dụng giấy phép mã nguồn mở (MIT, Apache 2.0, LGPL, BSD) hoặc phiên bản Community miễn phí.
- **Khả năng Mở rộng Chỉ mục Vector**: Khi quy mô nhân sự mở rộng vượt 10,000 danh tính trong tương lai, ngăn xếp công nghệ sẽ được mở rộng bổ sung thư viện chỉ mục vector xấp xỉ (`Faiss` hoặc `HNSW`) theo phân tích tại `GAP-002`.
