---
title: System Project Plan
version: 1.0
status: Approved
owner: Project Manager
---

# PROJECT PLAN — Kế hoạch Tổng thể & Quản trị Dự án

## 1. Scope & Objectives (Phạm vi & Mục tiêu Dự án)

* **Phạm vi dự án**: Thiết kế, phát triển và đóng gói toàn bộ giải pháp Face Attendance System bao gồm 3 phân hệ liên hoàn:
  * Trạm điểm danh Kiosk App (Python/PySide6, Edge AI ONNX, SQLite WAL).
  * Máy chủ Backend Service (Java 21/Spring Boot 3.3, PostgreSQL 16, WebSocket/STOMP, AES-256-GCM).
  * Cổng quản trị Web Portal (Vue.js 3/Vite/TailwindCSS, Pinia, Chart.js).
* **Mục tiêu kỹ thuật cốt lõi**:
  * Tốc độ nhận diện điểm danh tại biên $\le 1.5\text{s}$, độ chính xác cosine threshold $\ge 0.65$, liveness threshold $\ge 0.85$.
  * Vận hành ngoại tuyến $100\%$ khi mất mạng Internet, tự động đồng bộ khi khôi phục kết nối.
  * Tuân thủ quy định bảo vệ dữ liệu cá nhân Nghị định 13/2023/NĐ-CP (Consent, Audit log, cron tiêu hủy 20 ngày).

## 2. Approach & Lifecycle (Cách Tiếp cận & Vòng đời Dự án)

| ID | Quyết định Cách Tiếp cận (Approach Decision) | Diễn giải & Nguyên tắc Thực thi | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-001` | Áp dụng phương pháp luận phát triển Spec-Driven Development kết hợp Solo Scrum. | Chia nhỏ dự án thành các chặng 2 tuần, hoàn thiện tài liệu đặc tả và thiết kế trước khi lập trình mã nguồn (Upstream-First). | `PI-FAS-01`, `PD-001` | Approved |
| `APC-SYS-002` | Chiến lược kiểm thử tự động đa tầng liên tục (Pytest, JUnit 5, Vitest). | Chạy kiểm thử tự động tại môi trường cục bộ và kịch bản GitHub Actions trước khi merge mã nguồn vào nhánh chính. | `PD-001`, `STK-029` | Approved |
| `APC-SYS-003` | Triển khai đóng gói thử nghiệm bằng Docker Compose chạy trực tiếp trên máy trạm. | Cho phép điều phối toàn bộ cụm dịch vụ (PostgreSQL, Backend, Web Portal) trên 1 máy tính duy nhất để phục vụ tích hợp. | `PD-001`, `STK-022` | Approved |

---

## 3. Work Breakdown Structure & Milestones (Phân rã Công việc & Mốc Dự án)

| ID | Giai đoạn / Mốc Dự án (Phase / Milestone) | Thời gian Dự kiến | Mục tiêu & Sản phẩm Bàn giao Cốt lõi | Trạng thái |
| :--- | :--- | :---: | :--- | :---: |
| `PRJ-SYS-001` | **M1: Nền tảng Kiosk & Edge Vision** | Tuần 1 - 2 | Thu nhận video webcam, pipeline AI YuNet + MiniFASNet + ArcFace, giao diện PySide6, PIN Pad và SQLite WAL. | **Hoàn thành** |
| `PRJ-SYS-002` | **M2: Máy chủ Doanh nghiệp & Bảo mật** | Tuần 3 - 4 | CSDL PostgreSQL, REST API Spring Boot, mã hóa AES-256-GCM, Cooldown 120s, cron tiêu hủy 20 ngày. | Sẵn sàng |
| `PRJ-SYS-003` | **M3: Cổng Web Quản trị & Thời gian thực**| Tuần 5 - 6 | Màn hình Live Dashboard STOMP, quản trị nhân sự, phân ca kíp, cổng tự phục vụ ký Consent và xuất Excel. | Kế hoạch |
| `PRJ-SYS-004` | **M4: Tích hợp Toàn trình & Đo lường KPI** | Tuần 7 - 8 | Tích hợp liên phân hệ Kiosk $\leftrightarrow$ Backend $\leftrightarrow$ Web, kiểm thử chịu lỗi ngoại tuyến và đo đạc KPI hiệu năng. | Kế hoạch |
| `PRJ-SYS-005` | **M5: Tinh chỉnh, Đóng gói & Nghiệm thu** | Tuần 9 - 10 | Tối ưu hóa hiệu năng, đóng gói Docker Compose, hoàn thiện bộ hồ sơ hoàn công SDLC. | Kế hoạch |

---

## 4. Resource & Ownership (Tổ chức & Phân công Nguồn lực)

* **Kỹ sư Toàn quyền Kỹ thuật & Quản trị Dự án (`PRJ-ROLE-001` - nvdung)**:
  * Trách nhiệm: Đảm nhiệm 100% vai trò Full-stack & Applied AI Developer từ nghiên cứu thuật toán, lập trình mã nguồn, thiết kế CSDL, kiểm thử tự động đến viết tài liệu kỹ thuật.
  * Cam kết thời gian: Trung bình 20 - 25 giờ/tuần.

---

## 5. Risk Management (Quản trị Rủi ro Dự án)

| ID | Rủi ro Tiềm ẩn (Risk Description) | Xác suất | Ảnh hưởng | Biện pháp Phòng ngừa & Ứng phó (Mitigation Strategy) |
| :--- | :--- | :---: | :---: | :--- |
| `RSK-SYS-001` | Mất kết nối camera USB vật lý đột ngột trong khi Kiosk đang chạy. | Trung bình | Rất cao | Tích hợp vòng lặp tự động kết nối lại (`reconnect loop`) mỗi 3s trong bộ thu nhận video, không để sập ứng dụng. |
| `RSK-SYS-002` | Khóa tranh chấp CSDL SQLite cục bộ khi đọc và ghi đồng thời. | Cao | Cao | Bắt buộc cấu hình chế độ Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) và đặt timeout chờ khóa 5.0 giây. |
| `RSK-SYS-003` | Suy luận AI bị chậm hoặc giật khung hình trên máy trạm cấu hình yếu. | Thấp | Cao | Lọc khuôn mặt kích thước nhỏ ngay từ đầu; tối ưu hóa số luồng vector ONNX Runtime trên CPU. |
| `RSK-SYS-004` | Rò rỉ bộ nhớ RAM khi ứng dụng Kiosk hoạt động camera liên tục 24/7. | Trung bình | Cao | Giải phóng triệt để các mảng khung hình NumPy ngay sau chu kỳ nhận diện; thực hiện bài soak test 8 giờ liên tục. |
| `RSK-SYS-005` | Nguy cơ tấn công Formula Injection (CWE-1236) khi xuất file Excel báo cáo. | Thấp | Cao | Tự động làm sạch chuỗi, chèn ký tự `'` trước các ô dữ liệu bắt đầu bằng `=`, `+`, `-`, `@`. |
