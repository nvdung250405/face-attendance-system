# Software Requirements Specification (SRS)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Formal System Requirements Specification (SRS)  
> **Primary Owner Skill:** `spec-driven-development`  
> **Canonical Destination Path:** `docs/specs/SRS.md`  
> **Status:** Approved  
> **Last updated:** 2026-11-08  
> **Tuân thủ pháp lý:** Luật Bảo vệ dữ liệu cá nhân 2025 (Luật số 91/2025/QH15) & Nghị định 356/2025/NĐ-CP  

---

- **Hệ thống**: Enterprise Face Attendance System (FAS)
- **Document ID / Phiên bản**: `SRS-SYS-001` / v2.0
- **Chủ sở hữu**: Solution Architect & Lead Business Analyst
- **Liên kết**: [PRD](../prd.md) | [Architecture Overview](../architecture.md) | [RTM](RTM.md) | [Contracts](../../contracts/README.md)

---

## 1. Introduction

### 1.1 Purpose
Tài liệu Đặc tả Yêu cầu Kỹ thuật Phần mềm (SRS) này thiết lập các yêu cầu chức năng, phi chức năng, giao diện, dữ liệu và quy tắc nghiệp vụ cho Hệ thống Chấm công Doanh nghiệp Bằng Nhận Diện Khuôn Mặt (FAS). Đây là căn cứ kỹ thuật chính thức phục vụ thiết kế kiến trúc, phân rã thi công tính năng và nghiệm thu hệ thống.

### 1.2 Scope and Goals
Hệ thống bao gồm 3 phân hệ cấu thành:
- **Edge Kiosk Desktop**: Thiết bị điểm danh tại chỗ, giao diện cảm ứng dọc 9:16, camera nhận diện, suy luận Edge AI thuần CPU, đệm ngoại tuyến SQLite WAL.
- **Central Backend Service**: Máy chủ xử lý nghiệp vụ, quản lý phiên JWT, mã hóa vector AES-256-GCM, CSDL PostgreSQL 16, WebSocket STOMP.
- **Web Portal SPA**: Cổng thông tin kép React 19 phục vụ Quản trị HR (Live Dashboard, ca kíp, báo cáo) và Nhân viên (ký Informed Consent, nhận OTP).

### 1.3 Definitions, Acronyms and Glossary
- **FRR / FAR**: False Rejection Rate / False Acceptance Rate (Tỷ lệ từ chối sai / Chấp nhận sai).
- **FNIR / FPIR**: False Non-Match Rate / False Positive Identification Rate trong nhận diện 1:N.
- **PAD**: Presentation Attack Detection (Phát hiện tấn công giả mạo sinh trắc học).
- **Euler Angles**: 3 góc quay đầu trong không gian (Yaw: lắc ngang, Pitch: gật ngửa, Roll: nghiêng tai).
- **Liveness Score ($S_{\text{liveness}}$)**: Điểm tin cậy thực thể sống của mạng MiniFASNet ($0.0 \le S \le 1.0$).
- **Informed Consent**: Văn bản cam kết điện tử minh bạch về mục đích thu thập và sử dụng dữ liệu khuôn mặt.

---

## 2. System Context

### 2.1 Business Context and Objectives
- Loại bỏ nạn quẹt thẻ hộ (buddy punching).
- Giải quyết dứt điểm ùn tắc đầu ca do lỗi vân tay chai sần/dính dầu mỡ.
- Giảm thiểu $90\%$ thời gian đối soát chấm công thủ công của bộ phận nhân sự.
- Đảm bảo tuân thủ 100% Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15.

### 2.2 Stakeholders and User Classes
- **Nhân viên (Employee)**: Điểm danh không chạm hàng ngày tại Kiosk; ký cam kết điện tử Informed Consent và nhận mã OTP 48h trên Web Portal.
- **Quản trị viên Nhân sự (HR Manager)**: Giám sát sĩ số trực tiếp (Live Dashboard); quản lý ca kíp; phê duyệt giải trình công; khóa kỳ công và kết xuất báo cáo Excel/PDF.
- **Data Protection Officer (DPO)**: Giám sát kiểm toán truy vết; tra cứu hồ sơ cam kết điện tử; xác nhận tiêu hủy vector sau 20 ngày.
- **Quản trị viên Kỹ thuật (System Admin)**: Cấu hình thiết bị Kiosk, giám sát kết nối dịch vụ, quản trị tài khoản và phân quyền RBAC.

### 2.3 Operating Environment
- Kiosk: Windows 10/11 IoT hoặc Linux Ubuntu 22.04+, Python 3.14, CPU Intel Core i5/Ryzen 5 (không cần GPU), Camera USB góc rộng $1080\text{p}$, Màn hình cảm ứng dọc 9:16 ($1080\times 1920\text{ px}$).
- Backend: Docker Container, Java 21 LTS, Spring Boot 3.4.x, PostgreSQL 16, RAM 4GB+, Mạng nội bộ 100/1000 Mbps.
- Web Client: Chrome, Edge, Safari, Firefox trên máy tính để bàn và máy tính bảng.

---

## 3. Functional Requirements (FR)

### Nhóm 1: Nhận diện & Điểm danh tại Trạm Kiosk (Touchless Punching)
| ID | Yêu cầu Kỹ thuật | Mức Ưu Tiên | Nguồn / Căn Cứ | Phương Pháp Kiểm Chứng |
| :--- | :--- | :---: | :--- | :--- |
| **FR-SYS-001** | Hệ thống Kiosk phải tự động phát hiện khuôn mặt trong luồng video camera bằng thuật toán YuNet trong thời gian $\le 25\text{ ms}$. | Must | PRD §6.1 | Kiểm thử đơn vị & Benchmark |
| **FR-SYS-002** | Hệ thống Kiosk phải đánh giá điểm sống thực thể (Liveness) bằng MiniFASNet; từ chối và viền đỏ cảnh báo nếu $S_{\text{liveness}} < 0.85$. | Must | PRD §6.1, PAD | Kiểm thử tấn công ảnh in & video |
| **FR-SYS-003** | Hệ thống Kiosk phải trích xuất vector đặc trưng ArcFace 512D chuẩn hóa $L_2 = 1.0$ và so khớp 1:N với ma trận RAM Gallery trong thời gian $\le 2\text{ ms}$ cho tập 1,000 nhân sự. | Must | PRD §6.1 | Benchmark NumPy BLAS |
| **FR-SYS-004** | Hệ thống Kiosk phải gửi yêu cầu điểm danh qua HTTP REST POST `/api/v1/kiosk/punch` ngay khi xác thực thành công. | Must | Contracts | Automated Integration Test |
| **FR-SYS-005** | Hệ thống Kiosk phải kích hoạt thời gian giãn cách Cooldown 120 giây trên thiết bị đối với nhân viên vừa điểm danh thành công nhằm ngăn chặn quẹt đúp. | Must | PRD §6.1 | Kiosk State Machine Test |
| **FR-SYS-006** | Hệ thống Kiosk phải cung cấp bàn phím số ảo PIN Pad trên màn hình cảm ứng để nhân viên điểm danh dự phòng khi gặp sự cố khuôn mặt. | Must | PRD §6.3 | UI Component & E2E Test |

### Nhóm 2: Đăng ký & Kích hoạt Mẫu Khuôn mặt Đa Tư Thế (Guided Enrollment)
| ID | Yêu cầu Kỹ thuật | Mức Ưu Tiên | Nguồn / Căn Cứ | Phương Pháp Kiểm Chứng |
| :--- | :--- | :---: | :--- | :--- |
| **FR-SYS-007** | Web Portal phải yêu cầu nhân viên đọc và ký cam kết điện tử Informed Consent trước khi cho phép kích hoạt sinh trắc học. | Must | Luật 2025, NĐ 356 | Journey / UI Test |
| **FR-SYS-008** | Backend phải sinh mã Onboarding OTP 6 chữ số ngẫu nhiên có thời hạn 48 giờ sau khi nhận được chữ ký Informed Consent hợp lệ. | Must | PRD §6.2 | Unit Test Security |
| **FR-SYS-009** | Kiosk phải cung cấp giao diện nhập mã OTP và hướng dẫn nhân viên hoàn thành tuần tự 3 tư thế: `FRONTAL` ($\|\text{Yaw}\| \le 5^\circ$), `LEFT_TILT` ($10^\circ \le \text{Yaw} \le 25^\circ$), và `RIGHT_TILT` ($-25^\circ \le \text{Yaw} \le -10^\circ$) với ngưỡng sống an toàn $S \ge 0.90$. | Must | FEAT-ENROLL-001 | Journey Test tại Kiosk |
| **FR-SYS-010** | Backend phải mã hóa độc lập 3 vector khuôn mặt bằng AES-256-GCM với 3 IV ngẫu nhiên và lưu trữ vào bảng `biometric_templates` kèm nhãn `pose_type`. | Must | PRD §6.2, Luật 2025 | Database Integration Test |
| **FR-SYS-011** | Backend phải phát sóng thông báo hoàn tất qua STOMP `/topic/enrollment/{otp}` để Web Portal tự động đóng modal và kích hoạt hiệu ứng hoàn tất. | Must | Contracts STOMP | WebSocket Contract Test |

### Nhóm 3: Chống Chịu Ngoại Tuyến & Đồng Bộ Tự Phục Hồi (Offline Resiliency)
| ID | Yêu cầu Kỹ thuật | Mức Ưu Tiên | Nguồn / Căn Cứ | Phương Pháp Kiểm Chứng |
| :--- | :--- | :---: | :--- | :--- |
| **FR-SYS-012** | Khi mất kết nối mạng đến Backend, Kiosk phải tự động chuyển sang chế độ lưu đệm cục bộ vào SQLite WAL (`offline_punches`), đảm bảo điểm danh thông suốt $\text{RPO} = 0$. | Must | PRD §6.4 | Fault Injection Network Test |
| **FR-SYS-013** | Ngay khi mạng được khôi phục, worker nền của Kiosk phải tự động gửi bù các bản ghi điểm danh ngoại tuyến theo từng lô tối đa 50 bản ghi/lần tới `/api/v1/kiosk/sync-batch`. | Must | PRD §6.4 | Batch Sync Integration Test |

### Nhóm 4: Quản trị Nhân sự, Ca kíp & Báo cáo Thời Gian Thực
| ID | Yêu cầu Kỹ thuật | Mức Ưu Tiên | Nguồn / Căn Cứ | Phương Pháp Kiểm Chứng |
| :--- | :--- | :---: | :--- | :--- |
| **FR-SYS-014** | Backend phải đối soát bản ghi điểm danh với lịch ca làm việc đã phân, tự động gán trạng thái `ON_TIME`, `LATE`, `EARLY_LEAVE`, `ANOMALOUS` kèm thời gian ân hạn 15 phút. | Must | PRD §6.5 | Shift Engine Unit Tests |
| **FR-SYS-015** | Backend phải phát sóng sự kiện điểm danh mới trong $\le 200\text{ ms}$ qua WebSocket STOMP `/topic/live-attendance` tới Web Portal Live Dashboard. | Must | PRD §6.6 | Realtime Benchmark Test |
| **FR-SYS-016** | Web Portal Live Dashboard phải tự động chèn dòng mới lên đầu bảng với hiệu ứng chớp sáng nền ngọc bích ($1.5\text{ s}$) và cập nhật 5 thẻ chỉ số KPI tức thì. | Must | PRD §6.6 | E2E Playwright Test |
| **FR-SYS-017** | Web Portal phải cho phép nhân viên nộp đơn giải trình chấm công trong vòng 30 ngày kể từ ngày phát sinh sự cố; cho phép HR xét duyệt trực tuyến. | Should | PRD §6.7 | Functional E2E Test |
| **FR-SYS-018** | Web Portal phải hỗ trợ khóa cứng kỳ công tháng (`LOCKED`); ngăn chặn mọi hành vi sửa đổi dữ liệu sau khi kỳ công đã chốt. | Must | PRD §6.7 | Security Permission Test |
| **FR-SYS-019** | Hệ thống phải xuất báo cáo chấm công ra tệp Microsoft Excel (.xlsx) với cơ chế phòng chống Formula Injection (CWE-1236). | Must | PRD §6.7 | Security CSV Export Test |

### Nhóm 5: Tuân Thủ Quyền Riêng Tư & Tiêu Hủy Dữ Liệu (Compliance)
| ID | Yêu cầu Kỹ thuật | Mức Ưu Tiên | Nguồn / Căn Cứ | Phương Pháp Kiểm Chứng |
| :--- | :--- | :---: | :--- | :--- |
| **FR-SYS-020** | Backend phải vận hành tác vụ định kỳ tự động quét và Hard Delete 100% vector khuôn mặt trong CSDL sau đúng 20 ngày kể từ ngày nhân viên chấm dứt hợp đồng lao động. | Must | Luật 2025, NĐ 356 | Scheduled Task Test |
| **FR-SYS-021** | Hệ thống phải thực thi quyền rút Informed Consent của nhân viên: tiêu hủy vector trong vòng 7 ngày và chuyển hình thức điểm danh sang mã PIN bắt buộc. | Must | Luật 2025 | Consent Revoke Test |
| **FR-SYS-022** | Hệ thống phải lưu vết nhật ký kiểm toán bất biến (Audit Log) cho mọi hành vi truy cập, điều chỉnh dữ liệu chấm công và xóa vector. | Must | Luật 2025 | Audit Trail Inspection |

---

## 4. Non-Functional Requirements (NFR)

| ID | Tiêu Chí Chất Lượng | Yêu Cầu / Ngưỡng Đo Lường Định Lượng | Điều Kiện Thử Nghiệm | Phương Pháp Đo Kiểm |
| :--- | :--- | :--- | :--- | :--- |
| **NFR-SYS-001** | Thời gian điểm danh (SLA) | $T_{\text{punch}} \le 350\text{ ms}$ từ khi nhận diện mặt đến khi hiển thị kết quả và phát âm thanh. | CPU Intel Core i5 thế hệ 11+, tập 1,000 nhân sự. | Benchmark thời gian thực |
| **NFR-SYS-002** | Độ trễ phát sóng (Latency) | Độ trễ STOMP $\le 200\text{ ms}$ từ khi Kiosk gửi request tới khi Web Portal render dòng mới. | Mạng LAN nội bộ $100\text{ Mbps}$, tải 10 punches/giây. | Mạng đo WebSocket |
| **NFR-SYS-003** | Khả năng sẵn sàng ngoại tuyến | RPO = 0; dung lượng hàng đợi SQLite WAL tối thiểu 5,000 bản ghi quẹt. | Mất mạng liên tục 8 giờ vận hành. | Ngắt mạng thực nghiệm |
| **NFR-SYS-004** | Độ chính xác nhận diện 1:N | $\text{FNIR} \le 5.0\%$ tại $\text{FPIR} \le 0.1\%$ trên tập 1,000 nhân sự. | 3 tư thế (Front, Left, Right), ánh sáng $150-800\text{ lux}$. | Kiểm thử tập mẫu kiểm định |
| **NFR-SYS-005** | Tỷ lệ chặn giả mạo (PAD) | Chặn thành công $\ge 98\%$ các cuộc tấn công ảnh chụp in giấy màu A4 và video phát lại trên smartphone. | Điểm sống $S_{\text{liveness}} \ge 0.85$. | Kịch bản tấn công PAD |
| **NFR-SYS-006** | Chuẩn hóa Vector đặc trưng | Vector ArcFace 512 chiều có chuẩn $L_2 = 1.0 \pm 10^{-4}$. | Trích xuất từ ảnh khuôn mặt chuẩn $112\times 112\text{ px}$. | Math Assertion Test |
| **NFR-SYS-007** | Tiêu chuẩn Mã hóa Dữ liệu | Thuật toán AES-256-GCM với IV 12 bytes ngẫu nhiên và Authentication Tag 16 bytes. | Mã hóa trường `BYTEA` trong PostgreSQL. | Security Cryptographic Test |
| **NFR-SYS-008** | Chống Brute-Force PIN | Tự động khóa trạm/tài khoản 15 phút sau đúng 5 lần nhập sai mã PIN liên tiếp. | Bàn phím số ảo PIN Pad tại Kiosk. | Brute-force automation test |
| **NFR-SYS-009** | Độ ổn định RAM Kiosk | Mức chiếm dụng RAM của tiến trình Kiosk ổn định $\le 1.2\text{ GB}$, không rò rỉ bộ nhớ qua 8 giờ ngâm tải liên tục. | 8 giờ ngâm tải, camera hoạt động 30 fps. | Soak Testing Memory Profiler |
| **NFR-SYS-010** | Tuân thủ Luật Dữ liệu 2025 | Không lưu trữ ảnh chân dung thô; tiêu hủy vector sau 20 ngày; lưu vết kiểm toán đầy đủ. | Kiểm toán pháp lý & DPO review. | Compliance Audit Checklist |

---

## 5. Acceptance and Verification Strategy
Mọi yêu cầu trong tài liệu này được ánh xạ trực tiếp sang các ca kiểm thử tự động trong ma trận truy vết [`docs/specs/RTM.md`](RTM.md) và báo cáo nghiệm thu thực nghiệm [`docs/features/<feature-id>/acceptance-report.md`](../features/).

