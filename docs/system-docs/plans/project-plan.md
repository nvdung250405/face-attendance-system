---
title: System Project Plan
version: 2.0
status: Approved
owner: Project Manager
type: plan
scope: SYS
updated: 2026-10-08
---

# PROJECT PLAN — Kế hoạch Tổng thể & Quản trị Dự án

Kế hoạch điều phối tổng thể, phân bổ các chặng phát triển, quản trị vai trò và kiểm soát rủi ro cho toàn bộ Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §8.2).

---

## 1. Scope & Objectives (Phạm vi & Mục tiêu Dự án)

* **Phạm vi dự án**: Thiết kế, phát triển, kiểm thử và đóng gói triển khai giải pháp Face Attendance System bao gồm 3 phân hệ liên hoàn:
  * Trạm điểm danh Kiosk App (`kiosk-app`): Python 3.14, PySide6, Edge AI ONNX (YuNet $\rightarrow$ MiniFASNet $\rightarrow$ ArcFace), SQLite WAL.
  * Máy chủ Backend Service (`backend-service`): Java 21 LTS, Spring Boot 4.1+, PostgreSQL 16, WebSocket STOMP, AES-256-GCM.
  * Cổng quản trị Web Portal (`web-portal`): React 19+, Vite, Tailwind CSS, TypeScript, STOMP Client.
* **Mục tiêu kỹ thuật cốt lõi**:
  * Chu kỳ tính toán suy luận tại biên $\le 350\text{ ms}$ (`NFR-SYS-001`), tổng thời gian face-to-dashboard $\le 1.2\text{ s}$ (`NFR-SYS-003`), ngưỡng Cosine Matcher $0.50$ (`FR-SYS-003`), ngưỡng thực thể sống liveness chuẩn hóa: vận hành $S_{\text{liveness}} \ge 0.85$, nạp mẫu $S_{\text{liveness}} \ge 0.90$ (Safety Margin $+5\%$) theo `DD-SYS-027`.
  * Vận hành ngoại tuyến $100\%$ khi mất mạng Internet ($\text{RPO} = 0$, `NFR-SYS-006`), tự động gửi bù đồng bộ khi khôi phục kết nối.
  * Tuân thủ quy định bảo vệ dữ liệu cá nhân theo Luật số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP (Consent, Audit log, cron tiêu hủy 20 ngày thôi việc / 7 ngày rút Consent).

---

## 2. Approach & Lifecycle (Cách Tiếp cận & Vòng đời Dự án)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `APC-SYS-001` | Áp dụng phương pháp luận phát triển Spec-Driven Development kết hợp Solo Scrum. | Chia nhỏ dự án thành các chặng 2 tuần, hoàn thiện tài liệu đặc tả và thiết kế trước khi lập trình mã nguồn (Upstream-First). | Waterfall cổ điển, Agile tự do không tài liệu | Cần kỷ luật cao trong việc duy trì đồng bộ giữa tài liệu SDLC và mã nguồn. | `PD-001` | Accepted |
| `APC-SYS-002` | Chiến lược kiểm thử tự động đa tầng liên tục (Pytest, JUnit 5, Vitest). | Chạy kiểm thử tự động tại môi trường cục bộ và kịch bản GitHub Actions trước khi merge mã nguồn vào nhánh chính. | Chỉ kiểm thử thủ công E2E, Bỏ qua automated tests | Tốn thời gian viết test suites ban đầu nhưng đảm bảo an toàn tuyệt đối khi refactor. | `PD-001`, `STK-029` | Accepted |
| `APC-SYS-003` | Triển khai đóng gói thử nghiệm bằng Docker Compose chạy trực tiếp trên máy trạm. | Cho phép điều phối toàn bộ cụm dịch vụ (PostgreSQL, Backend, Web Portal) trên 1 máy tính duy nhất để phục vụ tích hợp. | Cài đặt trực tiếp dịch vụ lên OS máy chủ, Dùng hạ tầng Cloud đắt tiền | Đòi hỏi máy trạm phát triển có hỗ trợ Docker/WSL2 và tối thiểu 8GB-16GB RAM. | `PD-001`, `STK-022` | Accepted |
| `APC-SYS-007` | Thứ tự thi công: Từ Biên đến Trung tâm rồi ra Trình diễn (Edge $\rightarrow$ Backend $\rightarrow$ Web $\rightarrow$ E2E). | Kiểm soát sớm các rủi ro phức tạp nhất về thị giác máy tính và phần cứng camera tại biên trước khi tích hợp hệ thống. | Triển khai Backend trước, Triển khai đồng thời cả 3 không ưu tiên | Cần mock dữ liệu API giai đoạn đầu khi Kiosk cần giao tiếp Backend. | `PRJ-001`, `ARC-001` | Accepted |
| `APC-SYS-008` | Đảm bảo tính độc lập và khả năng giả lập dịch vụ (Mocking/Decoupled Build). | Các phân hệ Kiosk và Web có thể phát triển song song với Backend dựa trên hợp đồng OpenAPI và STOMP Contract đã duyệt. | Chờ Backend hoàn tất 100% mới làm Kiosk/Web | Tiết kiệm thời gian, tăng tốc độ hoàn thành dự án cho solo developer. | `ARC-002`, `APC-SYS-001` | Accepted |
| `APC-SYS-009` | Tích hợp liên tục và xác thực tự động trên từng gói tính năng. | Mỗi work item hoàn thành phải vượt qua bộ test unit/integration tương ứng trước khi chuyển sang work item kế tiếp. | Gom toàn bộ kiểm thử vào giai đoạn cuối | Duy trì chất lượng mã nguồn cao và phát hiện lỗi hồi quy tức thời. | `APC-SYS-002`, `NFR-SYS-001` | Accepted |
| `APC-SYS-016` | Quy trình nhánh và hợp nhất trên nhánh tích hợp `develop`. | Repo dùng `develop` làm nhánh tích hợp liên tục: mọi thay đổi đi qua nhánh ngắn `<type>/<ID>-<slug>` tạo từ `develop`, hợp nhất bằng Pull Request squash rồi tự động xóa nhánh. | Dùng trực tiếp `main` làm nhánh tích hợp, Push trực tiếp không qua PR | Ruleset bắt buộc kiểm tra status checks `ci-passed` và `docs-check`, chặn force-push và xóa nhánh. | `STK-021`, `STK-029`, `APC-SYS-004` | Accepted |
| `APC-SYS-017` | Miễn yêu cầu approval tối thiểu ở ruleset khi code owner trùng tác giả. | Solo developer không thể tự approve Pull Request của chính mình trên GitHub; thay thế bằng bắt buộc giải quyết hội thoại review và biên bản review tự động. | Bật approval tối thiểu 1 kèm quyền bypass admin, Bỏ hẳn review | Ruleset đặt `required_approving_review_count = 0`; khi có reviewer thứ hai sẽ bật lại mức tối thiểu 1 approval. | `STK-029`, `APC-SYS-009` | Accepted |
| `APC-SYS-020` | Môi trường tích hợp lab cục bộ chuẩn hóa bằng Docker Compose và script điều khiển quản lý dịch vụ. | Thống nhất cách thức khởi chạy cụm dịch vụ phụ thuộc (PostgreSQL, Backend Service, Web Portal) qua PowerShell script `scripts/manage-services.ps1` và mạng container `fas-network`, bảo đảm môi trường tích hợp liên phân hệ nhất quán, dễ tái lập và cô lập. | Lập trình viên tự khởi động thủ công từng dịch vụ từ dòng lệnh, Thiết lập cụm server Kubernetes cục bộ phức tạp | Yêu cầu máy trạm có Docker Desktop và PowerShell 7+, nhưng giảm thiểu rủi ro lệch cổng, lệch biến môi trường và sai khác kết nối mạng khi tích hợp. | `PD-001`, `STK-022` | Accepted |
| `APC-SYS-021` | Chiến lược kiểm thử hợp đồng độc lập giữa các phân hệ (Contract-Driven Decoupled Testing). | Sử dụng các bộ mock transport, mock client và fixtures chuẩn hóa theo hợp đồng OpenAPI/STOMP cho phép Kiosk App và Web Portal thực thi kiểm thử tích hợp độc lập mà không bắt buộc Backend Service phải chạy thường trực. | Chỉ kiểm thử khi toàn bộ 3 phân hệ cùng chạy đồng thời trên lab thật | Cần duy trì bộ fixtures mẫu đồng bộ với hợp đồng Backend; khi Backend đổi DTO thì fixtures ở Kiosk/Web phải cập nhật theo. | `ARC-002`, `STK-015` | Accepted |

---

## 3. Phases & Milestones (Phân rã Giai đoạn & Mốc Dự án)

| ID | Name | Type | Includes | Depends on | Target | Estimate | Owner | Entry criteria | Exit criteria | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| `PRJ-001` | M1: Nền tảng Kiosk & Edge Vision | Milestone | `FND-SYS-001..003`, `FND-SYS-007`, `BLD-KSK-001..018` | — | 2026-10-02 | 2 weeks | `ROL-001` | Kho monorepo sẵn sàng, tài liệu Spec v2.0 được phê duyệt | Chạy được app Kiosk điểm danh và lưu trữ ngoại tuyến SQLite WAL thành công | Done |
| `PRJ-002` | M2: Máy chủ Doanh nghiệp, Bảo mật & Hệ thống API | Milestone | `FND-SYS-004`, `FND-SYS-006`, `BLD-BE-001..029` | `PRJ-001` | 2026-10-16 | 2 weeks | `ROL-001` | M1 hoàn thành; Hợp đồng OpenAPI và STOMP Contract đã chốt | Toàn bộ REST API, WebSocket STOMP và mã hóa AES-256-GCM vượt qua 100% unit tests | In progress |
| `PRJ-003` | M3: Cổng Web Quản trị, Tự phục vụ & Live Dashboard | Milestone | `FND-SYS-005`, `BLD-WEB-001..021` | `PRJ-002` | 2026-10-30 | 2 weeks | `ROL-001` | Backend REST API và WebSocket Broker sẵn sàng | Web Portal kết nối WebSocket nhận sự kiện real-time và quản trị đầy đủ dữ liệu | Planned |
| `PRJ-004` | M4: Tích hợp Toàn trình, Đo lường KPI & Ma trận Kiểm thử | Milestone | `FND-SYS-008..010`, `TST-SYS-001..034` | `PRJ-003` | 2026-11-15 | 2 weeks | `ROL-001` | Cả 3 phân hệ đã hoàn thành build; môi trường lab sẵn sàng | Điểm danh tại Kiosk đẩy dữ liệu real-time lên Web trong $\le 1.2\text{s}$; ngâm tải 8h $\Delta_{\text{RAM}} \le 10\%$ | Planned |
| `PRJ-005` | M5: Đóng gói Phát hành, Nghiệm thu & Triển khai | Checkpoint | `DPL-SYS-001..006` | `PRJ-004` | 2026-11-30 | 2 weeks | `ROL-001` | Toàn bộ 34 ca kiểm thử pass; không còn lỗi P0/P1 | Docker Compose chạy thông suốt toàn bộ hệ thống; Smoke Check $\le 1.2\text{ s}$; 100% tài liệu SDLC đồng bộ | Planned |

---

## 4. Roles & Responsibilities (Tổ chức & Phân công Vai trò)

### 4.1. Roles (Vai trò)

| ID | Role | Responsibility | Assignee |
| :--- | :--- | :--- | :--- |
| `ROL-001` | Kỹ sư Toàn quyền Kỹ thuật & Quản trị Dự án (Full-stack & AI Lead) | Đảm nhiệm toàn bộ vòng đời kỹ thuật: nghiên cứu mô hình AI, phát triển mã nguồn 3 phân hệ, thiết kế CSDL, kiểm thử tự động, tích hợp CI/CD và duy trì tài liệu SDLC v3.0; cam kết 20–25 giờ/tuần. | nvdung |
| `ROL-002` | Chuyên viên Quản lý Nhân sự Nghiệp vụ (HR Domain Advisor) | Cung cấp yêu cầu nghiệp vụ ca kíp, quy tắc ân hạn, mẫu báo cáo xuất Excel và phản hồi trải nghiệm người dùng trên Web Portal. | HR Representative |
| `ROL-003` | Cán bộ Bảo vệ Dữ liệu Cá nhân (Data Protection Officer - DPO) | Giám sát tính tuân thủ pháp lý về sinh trắc học theo Luật 91/2025/QH15 và Nghị định 356/2025/NĐ-CP, kiểm tra văn bản Informed Consent và lịch trình tiêu hủy dữ liệu. | DPO Officer |

### 4.2. Work Assignment (Phân công Hạng mục Thực thi Cấp Hệ thống)

| Work item | Owner | Role |
| :--- | :--- | :--- |
| `FND-SYS-001..010` | `ROL-001` | Full-stack & AI Lead |
| `DPL-SYS-001..006` | `ROL-001` | Full-stack & AI Lead |

---

## 5. Risk Management (Quản trị Rủi ro Dự án)

| ID | Risk | Probability | Impact | Response | Owner | Basis | Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `RSK-001` | Mất kết nối camera USB vật lý đột ngột trong khi trạm Kiosk đang vận hành. | Trung bình | Rất cao | Tích hợp vòng lặp tự động kết nối lại (`watchdog reconnect loop`) mỗi 3s trong bộ thu nhận video (`ARC-012`). | `ROL-001` | `INF-006` | Mitigating |
| `RSK-002` | Khóa tranh chấp CSDL SQLite cục bộ khi luồng nhận diện đọc và worker gửi bù ghi đồng thời. | Cao | Cao | Bắt buộc cấu hình chế độ Write-Ahead Logging với `PRAGMA synchronous = FULL;` và timeout bận 5.0s (`DD-SYS-002`). | `ROL-001` | `INF-011`, `NFR-SYS-006` | Mitigating |
| `RSK-003` | Suy luận AI bị chậm hoặc giật khung hình trên máy trạm cấu hình không có GPU. | Thấp | Cao | Lọc khuôn mặt kích thước nhỏ ngay từ đầu; tối ưu hóa số luồng vector ONNX Runtime trên tập lệnh CPU AVX2 (`DD-SYS-001`). | `ROL-001` | `INF-006`, `PD-002` | Mitigating |
| `RSK-004` | Rò rỉ bộ nhớ RAM khi ứng dụng Kiosk hoạt động camera liên tục 8–24 giờ. | Trung bình | Cao | Giải phóng triệt để các mảng khung hình NumPy ngay sau mỗi chu kỳ nhận diện; chạy bài kiểm thử ngâm tải 8h đạt $\Delta_{\text{RAM}} \le 10\%$ (`NFR-SYS-009`). | `ROL-001` | `INF-006`, `NFR-SYS-009` | Mitigating |
| `RSK-005` | Nguy cơ tấn công chèn mã độc công thức (CWE-1236) khi xuất file Excel báo cáo chấm công. | Thấp | Cao | Tự động làm sạch dữ liệu, chèn ký tự escape `'` trước các ô dữ liệu văn bản bắt đầu bằng `=`, `+`, `-`, `@` (`DD-SYS-008`). | `ROL-001` | `SRS-007` | Mitigating |

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Ước lượng Nguồn lực Thực tế**: Kế hoạch tiến độ (Estimate) được xây dựng dựa trên năng lực solo developer với thời lượng 20–25 giờ/tuần; các mốc Milestone M1–M5 được xếp nối tiếp nhau kèm bộ đệm dự phòng rủi ro kỹ thuật.
* **Quyền Quản trị Hệ điều hành Máy trạm**: Môi trường máy trạm Kiosk và Docker host được giả định có đầy đủ quyền Administrator/root để cấu hình cổng mạng, truy cập thiết bị camera UVC và cấp phát volume lưu trữ persistent.
* **Phụ thuộc Kết nối Mạng của Cơ chế PIN Dự phòng (`DD-SYS-017`)**: Cơ chế xác thực mã PIN được thực thi trực tuyến tại Backend (`POST /api/v1/kiosks/{id}/verify-pin`). Trong tình huống mất mạng hoàn toàn, Kiosk chỉ phục vụ điểm danh nhận diện khuôn mặt ngoại tuyến (`ARC-001`); chức năng PIN Pad dự phòng chỉ khả dụng khi có kết nối máy chủ.
