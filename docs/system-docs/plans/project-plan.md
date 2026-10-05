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
  * Máy chủ Backend Service (Java 21/Spring Boot 4.1+, PostgreSQL 16/17, WebSocket/STOMP, AES-256-GCM).
  * Cổng quản trị Web Portal (React 19+/Vite/TailwindCSS/TypeScript, STOMP Client).
* **Mục tiêu kỹ thuật cốt lõi**:
  * Tốc độ nhận diện điểm danh tại biên $\le 1.5\text{s}$, độ chính xác cosine threshold $\ge 0.65$, liveness threshold $\ge 0.85$.
  * Vận hành ngoại tuyến $100\%$ khi mất mạng Internet, tự động đồng bộ khi khôi phục kết nối.
  * Tuân thủ quy định bảo vệ dữ liệu cá nhân Luật số 91/2025/QH15 (Consent, Audit log, cron tiêu hủy 20 ngày).

## 2. Approach & Lifecycle (Cách Tiếp cận & Vòng đời Dự án)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-001` | Áp dụng phương pháp luận phát triển Spec-Driven Development kết hợp Solo Scrum. | Chia nhỏ dự án thành các chặng 2 tuần, hoàn thiện tài liệu đặc tả và thiết kế trước khi lập trình mã nguồn (Upstream-First). | Waterfall cổ điển, Agile tự do không tài liệu | Cần kỷ luật cao trong việc duy trì đồng bộ giữa tài liệu SDLC và mã nguồn. | `PD-001` | Accepted |
| `APC-SYS-002` | Chiến lược kiểm thử tự động đa tầng liên tục (Pytest, JUnit 5, Vitest). | Chạy kiểm thử tự động tại môi trường cục bộ và kịch bản GitHub Actions trước khi merge mã nguồn vào nhánh chính. | Chỉ kiểm thử thủ công E2E, Bỏ qua automated tests | Tốn thời gian viết test suites ban đầu nhưng đảm bảo an toàn tuyệt đối khi refactor. | `PD-001`, `STK-029` | Accepted |
| `APC-SYS-003` | Triển khai đóng gói thử nghiệm bằng Docker Compose chạy trực tiếp trên máy trạm. | Cho phép điều phối toàn bộ cụm dịch vụ (PostgreSQL, Backend, Web Portal) trên 1 máy tính duy nhất để phục vụ tích hợp. | Cài đặt trực tiếp dịch vụ lên OS máy chủ, Dùng hạ tầng Cloud đắt tiền | Đòi hỏi máy trạm phát triển có hỗ trợ Docker/WSL2 và tối thiểu 8GB-16GB RAM. | `PD-001`, `STK-022` | Accepted |

---

## 3. Work Breakdown Structure & Milestones (Phân rã Công việc & Mốc Dự án)

| ID | Name | Type | Includes | Depends on | Target | Estimate | Owner | Exit criteria | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- | :--- | :---: |
| `PRJ-001` | M1: Nền tảng Kiosk & Edge Vision | Milestone | `FND-SYS-002`, `FND-SYS-003`, `BLD-SYS-001`, `BLD-SYS-002`, `BLD-SYS-003` | — | 2026-10-02 | 2 weeks | Lead Engineer | Chạy được app Kiosk điểm danh và lưu trữ ngoại tuyến thành công | Done |
| `PRJ-002` | M2: Máy chủ Doanh nghiệp & Bảo mật | Milestone | `FND-SYS-004`, `FND-SYS-006`, `BLD-SYS-004`, `BLD-SYS-005` | `PRJ-001` | 2026-10-16 | 2 weeks | Lead Engineer | Toàn bộ API nghiệp vụ và mã hóa sinh trắc học vượt qua test suite | In progress |
| `PRJ-003` | M3: Cổng Web Quản trị & Thời gian thực | Milestone | `FND-SYS-005`, `BLD-SYS-006`, `BLD-SYS-007`, `BLD-SYS-008` | `PRJ-002` | 2026-10-30 | 2 weeks | Lead Engineer | Web Portal kết nối WebSocket nhận sự kiện real-time và quản trị đầy đủ dữ liệu | Planned |
| `PRJ-004` | M4: Tích hợp Toàn trình & Đo lường KPI | Milestone | `BLD-SYS-009`, `TST-SYS-001..020` | `PRJ-003` | 2026-11-15 | 2 weeks | Lead Engineer | Điểm danh tại Kiosk đẩy dữ liệu real-time lên Web trong $\le 1.2\text{s}$; tự phục hồi khi mất mạng | Planned |
| `PRJ-005` | M5: Tinh chỉnh, Đóng gói & Nghiệm thu | Gate | `DPL-SYS-001..005` | `PRJ-004` | 2026-11-30 | 2 weeks | Lead Engineer | Docker Compose chạy thông suốt toàn bộ hệ thống; 100% tài liệu SDLC đồng bộ | Planned |

---

## 4. Roles & Responsibilities (Tổ chức & Phân công Nguồn lực)

| ID | Role | Responsibility | Assignee |
| :--- | :--- | :--- | :--- |
| `ROL-001` | Kỹ sư Toàn quyền Kỹ thuật & Quản trị Dự án (Full-stack & AI Lead) | Đảm nhiệm 100% vai trò Full-stack & Applied AI Developer từ nghiên cứu thuật toán, lập trình mã nguồn, thiết kế CSDL, kiểm thử tự động đến viết tài liệu kỹ thuật; cam kết 20-25 giờ/tuần. | nvdung |

---

## 5. Risk Management (Quản trị Rủi ro Dự án)

| ID | Risk | Probability | Impact | Response | Owner | Basis | Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `RSK-001` | Mất kết nối camera USB vật lý đột ngột trong khi Kiosk đang chạy. | Trung bình | Rất cao | Tích hợp vòng lặp tự động kết nối lại (`reconnect loop`) mỗi 3s trong bộ thu nhận video. | Kỹ sư Kiosk | `INF-006` | Mitigating |
| `RSK-002` | Khóa tranh chấp CSDL SQLite cục bộ khi đọc và ghi đồng thời. | Cao | Cao | Bắt buộc cấu hình chế độ Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) và timeout 5.0s. | Kỹ sư Kiosk | `INF-011` | Mitigating |
| `RSK-003` | Suy luận AI bị chậm hoặc giật khung hình trên máy trạm cấu hình yếu. | Thấp | Cao | Lọc khuôn mặt kích thước nhỏ ngay từ đầu; tối ưu hóa số luồng vector ONNX Runtime trên CPU. | Kỹ sư Kiosk | `INF-006` | Mitigating |
| `RSK-004` | Rò rỉ bộ nhớ RAM khi ứng dụng Kiosk hoạt động camera liên tục 24/7. | Trung bình | Cao | Giải phóng triệt để các mảng khung hình NumPy ngay sau chu kỳ nhận diện; chạy bài test ngâm tải 8h. | Kỹ sư Kiosk | `INF-006` | Mitigating |
| `RSK-005` | Nguy cơ tấn công Formula Injection (CWE-1236) khi xuất file Excel báo cáo. | Thấp | Cao | Tự động làm sạch chuỗi, chèn ký tự `'` trước các ô dữ liệu bắt đầu bằng `=`, `+`, `-`, `@`. | Kỹ sư Backend | `SRS-007` | Mitigating |

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Ước lượng Thời gian Thực tế**: Ước tính tiến độ (Estimate) dựa trên năng lực solo-developer với thời lượng cam kết 20–25 giờ/tuần; các mốc Milestone M1–M5 được lập kế hoạch kế tiếp nhau với dự phòng buffer rủi ro kỹ thuật.
* **Quyền Quản trị Thiết bị Cục bộ**: Môi trường máy trạm Kiosk và Docker host được giả định có đầy đủ quyền Administrator/root để thiết lập cổng mạng, truy cập thiết bị camera UVC và cấp phát dung lượng lưu trữ persistent.

