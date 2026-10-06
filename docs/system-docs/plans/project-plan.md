---
title: System Project Plan
version: 1.0
status: Approved
owner: Project Manager
---

# PROJECT PLAN — Kế hoạch Tổng thể & Quản trị Dự án

Kế hoạch điều phối tổng thể, phân bổ các chặng phát triển, quản trị vai trò và kiểm soát rủi ro cho toàn bộ Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §9.2).

---

## 1. Scope & Objectives (Phạm vi & Mục tiêu Dự án)

* **Phạm vi dự án**: Thiết kế, phát triển, kiểm thử và đóng gói triển khai giải pháp Face Attendance System bao gồm 3 phân hệ liên hoàn:
  * Trạm điểm danh Kiosk App (`kiosk-app`): Python 3.14, PySide6, Edge AI ONNX (YuNet $\rightarrow$ MiniFASNet $\rightarrow$ ArcFace), SQLite WAL.
  * Máy chủ Backend Service (`backend-service`): Java 21 LTS, Spring Boot 4.1+, PostgreSQL 16, WebSocket STOMP, AES-256-GCM.
  * Cổng quản trị Web Portal (`web-portal`): React 19+, Vite, Tailwind CSS, TypeScript, STOMP Client.
* **Mục tiêu kỹ thuật cốt lõi**:
  * Chu kỳ tính toán suy luận tại biên $\le 350\text{ ms}$ (`NFR-SYS-001`), tổng thời gian face-to-dashboard $\le 1.2\text{ s}$ (`NFR-SYS-003`), ngưỡng Cosine Matcher $0.50$ (`FR-SYS-003`), ngưỡng thực thể sống liveness $S_{\text{liveness}} \ge 0.85$ (`DD-SYS-027`).
  * Vận hành ngoại tuyến $100\%$ khi mất mạng Internet ($\text{RPO} = 0$, `NFR-SYS-006`), tự động gửi bù đồng bộ khi khôi phục kết nối.
  * Tuân thủ quy định bảo vệ dữ liệu cá nhân theo Luật số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP (Consent, Audit log, cron tiêu hủy 20 ngày thôi việc / 7 ngày rút Consent).

---

## 2. Approach & Lifecycle (Cách Tiếp cận & Vòng đời Dự án)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-001` | Áp dụng phương pháp luận phát triển Spec-Driven Development kết hợp Solo Scrum. | Chia nhỏ dự án thành các chặng 2 tuần, hoàn thiện tài liệu đặc tả và thiết kế trước khi lập trình mã nguồn (Upstream-First). | Waterfall cổ điển, Agile tự do không tài liệu | Cần kỷ luật cao trong việc duy trì đồng bộ giữa tài liệu SDLC và mã nguồn. | `PD-001` | Accepted |
| `APC-SYS-002` | Chiến lược kiểm thử tự động đa tầng liên tục (Pytest, JUnit 5, Vitest). | Chạy kiểm thử tự động tại môi trường cục bộ và kịch bản GitHub Actions trước khi merge mã nguồn vào nhánh chính. | Chỉ kiểm thử thủ công E2E, Bỏ qua automated tests | Tốn thời gian viết test suites ban đầu nhưng đảm bảo an toàn tuyệt đối khi refactor. | `PD-001`, `STK-029` | Accepted |
| `APC-SYS-003` | Triển khai đóng gói thử nghiệm bằng Docker Compose chạy trực tiếp trên máy trạm. | Cho phép điều phối toàn bộ cụm dịch vụ (PostgreSQL, Backend, Web Portal) trên 1 máy tính duy nhất để phục vụ tích hợp. | Cài đặt trực tiếp dịch vụ lên OS máy chủ, Dùng hạ tầng Cloud đắt tiền | Đòi hỏi máy trạm phát triển có hỗ trợ Docker/WSL2 và tối thiểu 8GB-16GB RAM. | `PD-001`, `STK-022` | Accepted |

---

## 3. Phases & Milestones (Phân rã Giai đoạn & Mốc Dự án)

| ID | Name | Type | Includes | Depends on | Target | Estimate | Owner | Exit criteria | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- | :--- | :---: |
| `PRJ-001` | M1: Nền tảng Kiosk & Edge Vision | Milestone | `FND-SYS-001`, `FND-SYS-002`, `FND-SYS-003`, `BLD-SYS-001`, `BLD-SYS-002`, `BLD-SYS-003` | — | 2026-10-02 | 2 weeks | Lead Engineer | Chạy được app Kiosk điểm danh và lưu trữ ngoại tuyến SQLite WAL thành công | Done |
| `PRJ-002` | M2: Máy chủ Doanh nghiệp & Bảo mật | Milestone | `FND-SYS-004`, `FND-SYS-006`, `BLD-SYS-004`, `BLD-SYS-005` | `PRJ-001` | 2026-10-16 | 2 weeks | Lead Engineer | Toàn bộ API nghiệp vụ và mã hóa sinh trắc học AES-256-GCM vượt qua test suite | In progress |
| `PRJ-003` | M3: Cổng Web Quản trị & Thời gian thực | Milestone | `FND-SYS-005`, `BLD-SYS-006`, `BLD-SYS-007`, `BLD-SYS-008` | `PRJ-002` | 2026-10-30 | 2 weeks | Lead Engineer | Web Portal kết nối WebSocket nhận sự kiện real-time và quản trị đầy đủ dữ liệu | Planned |
| `PRJ-004` | M4: Tích hợp Toàn trình & Đo lường KPI | Milestone | `BLD-SYS-009`, `TST-SYS-001..033` | `PRJ-003` | 2026-11-15 | 2 weeks | Lead Engineer | Điểm danh tại Kiosk đẩy dữ liệu real-time lên Web trong $\le 1.2\text{s}$; tự phục hồi khi mất mạng | Planned |
| `PRJ-005` | M5: Tinh chỉnh, Đóng gói & Nghiệm thu | Gate | `DPL-SYS-001..005` | `PRJ-004` | 2026-11-30 | 2 weeks | Lead Engineer | Docker Compose chạy thông suốt toàn bộ hệ thống; 100% tài liệu SDLC đồng bộ | Planned |

---

## 4. Roles & Responsibilities (Tổ chức & Phân công Vai trò)

| ID | Role | Responsibility | Assignee |
| :--- | :--- | :--- | :--- |
| `ROL-001` | Kỹ sư Toàn quyền Kỹ thuật & Quản trị Dự án (Full-stack & AI Lead) | Đảm nhiệm toàn bộ vòng đời kỹ thuật: nghiên cứu mô hình AI, phát triển mã nguồn 3 phân hệ, thiết kế CSDL, kiểm thử tự động, tích hợp CI/CD và duy trì tài liệu SDLC v3.0; cam kết 20–25 giờ/tuần. | nvdung |
| `ROL-002` | Chuyên viên Quản lý Nhân sự Nghiệp vụ (HR Domain Advisor) | Cung cấp yêu cầu nghiệp vụ ca kíp, quy tắc ân hạn, mẫu báo cáo xuất Excel và phản hồi trải nghiệm người dùng trên Web Portal. | HR Representative |
| `ROL-003` | Cán bộ Bảo vệ Dữ liệu Cá nhân (Data Protection Officer - DPO) | Giám sát tính tuân thủ pháp lý về sinh trắc học theo Luật 91/2025/QH15 và Nghị định 356/2025/NĐ-CP, kiểm tra văn bản Informed Consent và lịch trình tiêu hủy dữ liệu. | DPO Officer |

---

## 5. Risk Management (Quản trị Rủi ro Dự án)

| ID | Risk | Probability | Impact | Response | Owner | Basis | Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `RSK-001` | Mất kết nối camera USB vật lý đột ngột trong khi trạm Kiosk đang vận hành. | Trung bình | Rất cao | Tích hợp vòng lặp tự động kết nối lại (`watchdog reconnect loop`) mỗi 3s trong bộ thu nhận video (`ARC-012`). | Kỹ sư Kiosk | `INF-006` | Mitigating |
| `RSK-002` | Khóa tranh chấp CSDL SQLite cục bộ khi luồng nhận diện đọc và worker gửi bù ghi đồng thời. | Cao | Cao | Bắt buộc cấu hình chế độ Write-Ahead Logging với `PRAGMA synchronous = FULL;` và timeout bận 5.0s (`DD-SYS-002`). | Kỹ sư Kiosk | `INF-011`, `NFR-SYS-006` | Mitigating |
| `RSK-003` | Suy luận AI bị chậm hoặc giật khung hình trên máy trạm cấu hình không có GPU. | Thấp | Cao | Lọc khuôn mặt kích thước nhỏ ngay từ đầu; tối ưu hóa số luồng vector ONNX Runtime trên tập lệnh CPU AVX2 (`DD-SYS-001`). | Kỹ sư Kiosk | `INF-006`, `PD-002` | Mitigating |
| `RSK-004` | Rò rỉ bộ nhớ RAM khi ứng dụng Kiosk hoạt động camera liên tục 8–24 giờ. | Trung bình | Cao | Giải phóng triệt để các mảng khung hình NumPy ngay sau mỗi chu kỳ nhận diện; chạy bài kiểm thử ngâm tải 8h đạt $\Delta_{\text{RAM}} \le 10\%$ (`NFR-SYS-009`). | Kỹ sư Kiosk | `INF-006`, `NFR-SYS-009` | Mitigating |
| `RSK-005` | Nguy cơ tấn công chèn mã độc công thức (CWE-1236) khi xuất file Excel báo cáo chấm công. | Thấp | Cao | Tự động làm sạch dữ liệu, chèn ký tự escape `'` trước các ô dữ liệu văn bản bắt đầu bằng `=`, `+`, `-`, `@` (`DD-SYS-008`). | Kỹ sư Backend | `SRS-007` | Mitigating |

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Ước lượng Nguồn lực Thực tế**: Kế hoạch tiến độ (Estimate) được xây dựng dựa trên năng lực solo developer với thời lượng 20–25 giờ/tuần; các mốc Milestone M1–M5 được xếp nối tiếp nhau kèm bộ đệm dự phòng rủi ro kỹ thuật.
* **Quyền Quản trị Hệ điều hành Máy trạm**: Môi trường máy trạm Kiosk và Docker host được giả định có đầy đủ quyền Administrator/root để cấu hình cổng mạng, truy cập thiết bị camera UVC và cấp phát volume lưu trữ persistent.
