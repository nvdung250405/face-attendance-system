---
title: System Test Plan
version: 3.0
status: Planned
owner: System QA Lead & Lead System Architect
type: plan
scope: SYS
updated: 2026-10-17
---

# TEST PLAN — Kế hoạch Kiểm thử & Ma trận Nghiệm thu Toàn diện Cấp Hệ thống

Tài liệu này xác định kế hoạch kiểm thử toàn diện, phương pháp luận nghiệm thu đa tầng và ma trận ca kiểm thử tích hợp liên phân hệ cho toàn bộ **Hệ thống Điểm danh Khuôn mặt (Face Attendance System - FAS)** theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §8.6).

Tài liệu bao phủ và kiểm chứng toàn vẹn các đặc tả kỹ thuật cấp hệ thống tại [docs/system-docs/specs/spec.md](../specs/spec.md):

- **Yêu cầu Xuyên suốt Hệ thống**: 10 Yêu cầu An toàn, Bền bỉ & Pháp lý (`SRS-001` .. `SRS-010`).
- **Yêu cầu Chức năng Hệ thống**: 28 Yêu cầu Toàn trình Vòng đời Tác nhân (`FR-SYS-001` .. `FR-SYS-028`).
- **Yêu cầu Phi chức năng Định lượng**: 10 Yêu cầu Hiệu năng, Độ chính xác & Sẵn sàng (`NFR-SYS-001` .. `NFR-SYS-010`).
- **Giải pháp & Cơ chế Chất lượng**: 31 Thành phần Giải pháp Kỹ thuật (`SOL-SYS-001` .. `SOL-SYS-031`).
- **Quyết định Thiết kế Cấp Hệ thống**: 28 Quyết định Kiến trúc & Vận hành (`DD-SYS-001` .. `DD-SYS-028`).

---

## 1. Scope & Test Objectives (Phạm vi & Mục tiêu Kiểm thử Hệ thống)

### 1.1. Phạm vi Kiểm thử Hệ thống (System-Level Scope)

Kiểm thử toàn trình sự tương tác và tích hợp giữa 3 phân hệ độc lập:
1. **Phân hệ Kiosk Cận biên (`kiosk-app`)**: Thu nhận camera DirectShow, AI Pipeline tại biên (YuNet $\rightarrow$ MiniFASNet $\rightarrow$ ArcFace), so khớp ma trận RAM $N \times 512$, hàng đợi ngoại tuyến SQLite WAL ($\text{RPO} = 0$).
2. **Phân hệ Máy chủ Doanh nghiệp (`backend-service`)**: Tiếp nhận giao dịch, Cooldown hai lớp (Caffeine RAM + PostgreSQL), quản lý ca kíp, mã hóa AES-256-GCM vector tĩnh và phát sóng STOMP.
3. **Phân hệ Cổng Web Quản trị & Tự phục vụ (`web-portal`)**: Live Monitoring Dashboard thời gian thực, quản lý nhân sự, ca kíp, chốt kỳ công, ký Informed Consent điện tử và xuất báo cáo Excel chống formula injection.

### 1.2. Mục tiêu Chất lượng Định lượng (Quantitative Quality Goals)

- **Độ chính xác Nhận diện Sinh trắc**: Độ chính xác $\ge 95\%$, $\text{FPIR} \le 0.1\%$, $\text{FNIR} \le 5.0\%$ theo chuẩn ISO/IEC 19795-1 trên tập dữ liệu chuẩn 1,000 nhân viên.
- **Chống Giả mạo (Presentation Attack Detection - PAD)**: Tỷ lệ chặn giả mạo $\ge 98\%$, $\text{APCER} \le 2.0\%$, $\text{BPCER} \le 5.0\%$ theo chuẩn ISO/IEC 30107-3 tại ngưỡng $S_{\text{liveness}} \ge 0.85$.
- **Ngân sách Thời gian Chu kỳ**:
  - Chu kỳ tính toán biên Kiosk: $\le 350\text{ ms}$ (YuNet $\le 20\text{ ms}$, MiniFASNet $\le 30\text{ ms}$, ArcFace $\le 50\text{ ms}$, Cosine $\le 2\text{ ms}$, SQLite WAL $\le 20\text{ ms}$).
  - Tổng thời gian Face-to-Dashboard: $\le 1.2\text{ s}$ trên mạng LAN (Kiosk $\le 300\text{ ms} \rightarrow$ Backend $\le 100\text{ ms} \rightarrow$ STOMP $\le 50\text{ ms} \rightarrow$ Web render $\le 150\text{ ms}$).
- **Kháng lỗi Ngoại tuyến & Tính Bền vững**: Cam kết $\text{RPO} = 0$ khi mất mạng hoặc cúp điện đột ngột; tự động đồng bộ bù 100% bản ghi theo lô tối đa 50 bản ghi.
- **Độ Sẵn sàng & Chịu tải**: Backend đạt SLA $\ge 99.9\%$ ($\le 15.8\text{ phút gián đoạn/tháng}$); phục vụ đồng thời $\ge 50$ trạm Kiosk (50–100 RPS ổn định).
- **Không Rò rỉ Bộ nhớ (Zero Memory Leak)**: Biến thiên RAM tiêu thụ $\Delta_{\text{RAM}} \le 10\%$ sau 8 giờ vận hành liên tục (duy trì $< 800\text{ MB}$).

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Cấp Hệ thống)

| ID | Quyết định Tiếp cận | Cơ sở & Lý do Kỹ thuật | Phương án Thay thế | Hệ quả & Biện pháp Thực thi | Căn cứ Đặc tả | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-010` | Kim tự tháp kiểm thử liên phân hệ (Unit $\rightarrow$ Component $\rightarrow$ Integration $\rightarrow$ System E2E $\rightarrow$ Soak). | Đảm bảo phát hiện lỗi sớm ở tầng dưới, tối ưu chi phí sửa đổi và bảo đảm tính ổn định liên phân hệ. | Chỉ kiểm thử E2E thủ công | Duy trì 3 bộ test tự động (JUnit 5, Pytest, Vitest) và test harness E2E Python httpx. | `NFR-SYS-001`, `ARC-001` | Accepted |
| `APC-SYS-011` | Kiểm thử tiêm lỗi cưỡng bức (Fault Injection Testing: rút dây mạng, cúp điện, ngắt tiến trình). | Hệ thống chạy tại biên trong môi trường thực tế bất định, bắt buộc phải tự phục hồi không mất dữ liệu. | Chỉ kiểm thử luồng thuận lợi (Happy Path) | Thiết lập kịch bản test ngắt mạng đột ngột, ngắt kết nối camera và tắt máy cưỡng bức. | `NFR-SYS-006`, `SRS-008` | Accepted |
| `APC-SYS-012` | Kiểm thử ngâm tải bộ nhớ 8 giờ liên tục (Soak Testing) với luồng AI thật. | Phát hiện triệt để rò rỉ bộ nhớ (Memory Leak) từ các khung hình OpenCV/NumPy trước khi bàn giao vận hành. | Chỉ chạy unit test ngắn hạn dưới 5 phút | Dùng máy trạm lab chạy ngâm tải 8 tiếng liên tục với công cụ psutil theo dõi RAM. | `NFR-SYS-009`, `PD-002` | Accepted |
| `APC-SYS-013` | Tự động hóa kiểm thử tích hợp E2E qua test harness Python httpx (`tests/e2e`). | Cho phép kiểm tra tự động toàn bộ 34 ca kiểm thử hệ thống với Backend và Web Portal thật chạy trên Docker. | Kiểm thử thủ công bằng Postman/Browser | Xây dựng test runner chuyên dụng `run_system_e2e_tests.py` xuất log chi tiết. | `SRS-006`, `FR-SYS-020` | Accepted |
| `APC-SYS-014` | Đối soát tuân thủ an toàn thông tin & quyền riêng tư sinh trắc học theo Luật 91/2025/QH15. | Dữ liệu khuôn mặt là dữ liệu cá nhân nhạy cảm, phải kiểm soát chặt chẽ lưu trữ, mã hóa và lịch trình tiêu hủy. | Bỏ qua kiểm thử tuân thủ | Kiểm tra mã hóa AES-256-GCM, quét đĩa xác nhận Zero Raw Image, test tiêu hủy 20 ngày và 7 ngày rút consent. | `SRS-001`..`004`, `FR-SYS-025` | Accepted |

---

## 3. System Test Matrix (Ma trận 34 Ca Kiểm thử Toàn diện Cấp Hệ thống)

Hệ thống FAS được phân chia thành **5 nhóm kiểm thử E2E liên phân hệ**:

### 3.1. Nhóm 1: AI Vision Pipeline, Chống Giả mạo & Cận biên Kiosk (8 ca kiểm thử)

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-SYS-001` | Kiểm thử Thu nhận Luồng Video Camera & FPS | Đọc khung hình ổn định qua DirectShow; duy trì $\ge 15\text{ FPS}$ liên tục trong 30 phút. | `FR-SYS-001`, `NFR-SYS-002` | `BLD-KSK-012` | Không giật lag khung hình; FPS trung bình $\ge 15$, độ phân giải chuẩn $\ge 720\text{p}$. |   Done  |
| `TST-SYS-002` | Kiểm thử Phát hiện Mặt & Góc Quay Euler | YuNet phát hiện đúng khuôn mặt $\ge 120\times 120\text{ px}$; từ chối góc nghiêng yaw/pitch/roll $> 15^\circ$. | `FR-SYS-001`, `NFR-SYS-004` | `BLD-KSK-013` | Phát hiện mặt chuẩn xác; từ chối khi vượt ngưỡng Euler $\pm 15^\circ$; trả 5 điểm mốc giải phẫu. |   Done  |
| `TST-SYS-003` | Kiểm thử Cổng Căn chỉnh Oval & Ổn định Thời gian | Đạt độ lệch tâm $\le 120\text{ px}$, diện tích $25\% - 75\%$; giữ ổn định liên tục $0.5 - 1.0\text{ s}$ mới nhận diện. | `FR-SYS-001`, `NFR-SYS-001` | `BLD-KSK-014` | Chuyển trạng thái Oval chính xác (Standby $\rightarrow$ Aligning $\rightarrow$ Success/Rejected) sau thời gian giữ ổn định. |   Done  |
| `TST-SYS-004` | Kiểm thử Chặn Ảnh In 2D Giả mạo (Print Attack) | Đưa ảnh in chân dung giấy A4 trước camera; MiniFASNet từ chối $S < 0.85$, viền đỏ cảnh báo. | `FR-SYS-002`, `NFR-SYS-005` | `BLD-KSK-015` | Điểm liveness < 0.85, hiển thị viền đỏ và từ chối chấm công; độ chính xác chặn $\ge 98\%$. |   Done  |
| `TST-SYS-005` | Kiểm thử Chặn Video Phát lại (Replay Attack) | Phát video khuôn mặt qua màn hình điện thoại/iPad; hệ thống chặn đứng với độ chính xác $\ge 98\%$. | `FR-SYS-002`, `NFR-SYS-005` | `BLD-KSK-015` | Chặn video phát lại đạt $\text{APCER} \le 2.0\%$, $\text{BPCER} \le 5.0\%$ theo chuẩn ISO/IEC 30107-3. |   Done  |
| `TST-SYS-006` | Kiểm thử Trích xuất ArcFace & So khớp RAM | Vector 512D chuẩn hóa L2 = 1.0; so khớp Cosine ma trận 1,000 nhân sự hoàn tất $< 2\text{ ms}$. | `FR-SYS-003`, `NFR-SYS-001`, `NFR-SYS-004` | `BLD-KSK-016` | Tính toán Cosine similarity ma trận RAM $< 2\text{ ms}$; độ chính xác thỏa mãn $\text{FPIR} \le 0.1\%$. |   Done  |
| `TST-SYS-013` | Kiểm thử Quy trình Tự Đăng ký In-Viewport | Nhập OTP $\rightarrow$ Popup tự ẩn $\rightarrow$ Chụp 3 ảnh chuẩn trên camera chính đạt $S_{\text{liveness}} \ge 0.90$ $\rightarrow$ Nạp vector. | `FR-SYS-009`, `DD-SYS-011`, `DD-SYS-027` | `BLD-KSK-019` | Luồng tự nạp 3 ảnh đạt độ nét Laplacian $\ge 30$, liveness $\ge 0.90$ (safety margin $+5\%$); nạp nóng vector vào RAM. |   Done  |
| `TST-SYS-034` | Kiểm thử Quét Đĩa Xác nhận Không Lưu Ảnh Thô | Quét tự động toàn bộ phân vùng đĩa cứng máy trạm Kiosk và container Backend sau chuỗi 1,000 lượt chấm công. | `SRS-004`, `SRS-001`, `NFR-SYS-007` | `BLD-KSK-018`, `BLD-BE-014` | Phát hiện 0 tệp ảnh `.jpg`, `.png`, `.bmp` trên đĩa; 100% hình ảnh chỉ tồn tại dưới dạng tensor trong RAM. |   Done  |

---

### 3.2. Nhóm 2: Hợp đồng Điểm danh, Ngoại tuyến SQLite WAL & Tự động Đồng bộ Bù (7 ca kiểm thử)

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-SYS-007` | Kiểm thử Bàn phím Số ảo PIN & Khóa 15 Phút | Nhập PIN 6 số $\rightarrow$ Backend xác thực thành công mới ghi nhận công; sai 5 lần liên tiếp khóa 15 phút. | `FR-SYS-004`, `FR-SYS-017`, `SRS-005` | `BLD-KSK-019`, `BLD-BE-014` | PIN đúng ghi nhận công `VERIFICATION_PIN`; PIN sai trả 401; sai 5 lần liên tiếp trả 423 khóa 15 phút per-account và per-device. |   Done  |
| `TST-SYS-008` | Kiểm thử Hợp đồng Điểm danh & Chống Quét Trùng Lặp 120s | Kiểm tra phản hồi envelope chuẩn và việc quẹt liên tiếp trong 120s bị từ chối hai lớp (Kiosk RAM + Backend Caffeine). | `FR-SYS-005`, `NFR-SYS-003`, `DD-SYS-006` | `BLD-KSK-018`, `BLD-BE-011` | Quẹt lần đầu trả `PUNCH_ACCEPTED`; quẹt lại trong 120 giây bị từ chối tức thì kèm thông báo rõ ràng. |   Done  |
| `TST-SYS-009` | Kiểm thử Hàng đợi Ngoại tuyến SQLite WAL | Rút dây mạng, quẹt 20 lượt điểm danh; toàn bộ bản ghi lưu vào SQLite với `PRAGMA synchronous = FULL`; tắt máy không hỏng CSDL. | `FR-SYS-006`, `NFR-SYS-006`, `SRS-008` | `BLD-KSK-017` | $\text{RPO} = 0$, 100% bản ghi còn nguyên vẹn trong SQLite WAL sau sự cố mất kết nối hoặc cúp điện. |   Done  |
| `TST-SYS-010` | Kiểm thử Tự động Đồng bộ Bù Ngoại tuyến & Healthcheck | Cắm mạng lại; Kiosk tự gom lô tối đa 50 bản ghi gửi `sync-batch`; Backend ghi nhận đủ mốc giờ gốc; `/actuator/health` đạt SLA 99.9%. | `FR-SYS-006`, `NFR-SYS-006`, `NFR-SYS-008`, `SRS-009` | `BLD-KSK-017`, `BLD-BE-012` | Đồng bộ 100% bản ghi với mốc giờ gốc không sai lệch; giao dịch an toàn không deadlock; healthcheck phản hồi $\le 200\text{ ms}$. |   Done  |
| `TST-SYS-016` | Kiểm thử Tính Ca kíp & Ân hạn 15 Phút | Chấm công trong vòng 15p đầu ca tính đúng giờ (`ON_TIME`); sau 15p tính đi muộn (`LATE`) trừ thời gian ân hạn. | `FR-SYS-012`, `DD-SYS-007` | `BLD-BE-011` | Tính toán số phút đi muộn chính xác theo ca làm việc; gán đúng nhãn trạng thái `ON_TIME`, `LATE`, `EARLY_LEAVE`. |   Done  |
| `TST-SYS-017` | Kiểm thử Phát sóng STOMP lên Live Dashboard | Kiosk chấm công thành công; bản ghi xuất hiện trên Live Dashboard Web trong vòng $\le 200\text{ ms}$; tổng face-to-dashboard $\le 1.2\text{ s}$. | `FR-SYS-013`, `NFR-SYS-003`, `PD-006` | `BLD-BE-014`, `BLD-WEB-015` | Dashboard cập nhật dòng mới chớp xanh trong vòng $\le 200\text{ ms}$ từ khi Backend xử lý xong. |   Done  |
| `TST-SYS-018` | Kiểm thử Nạp nóng Vector vào RAM Kiosk | Nhân viên mới đăng ký trên trạm A; trạm B nhận bản tin STOMP `/topic/kiosk-gallery` nạp vector vào RAM ngay lập tức. | `FR-SYS-014`, `PD-006` | `BLD-BE-014`, `BLD-KSK-018` | Trạm Kiosk nạp nóng vector vào RAM ma trận trong $\le 500\text{ ms}$ mà không cần khởi động lại ứng dụng. |   Done  |

---

### 3.3. Nhóm 3: Vòng đời Nhân sự, Quản lý Ca kíp, Chốt kỳ công & Phân quyền RBAC (8 ca kiểm thử)

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-SYS-021` | Kiểm thử Khởi tạo Tài khoản Nhân sự & Mật khẩu Tạm | HR tạo hồ sơ nhân sự mới; hệ thống trả mật khẩu tạm hiển thị một lần; đăng nhập dùng ngay không bị ép đổi; đổi khi tự nguyện. | `FR-SYS-017`, `SRS-005`, `DD-SYS-017` | `BLD-BE-014`, `BLD-WEB-018` | Tạo hồ sơ trả mật khẩu tạm 1 lần; tài khoản dùng mật khẩu tạm vào được mọi chức năng; sau khi đổi mật khẩu, phiên cũ bị thu hồi. |   Done  |
| `TST-SYS-022` | Kiểm thử Thiết lập & Xác thực Mã PIN Dự phòng | Nhân viên tự thiết lập PIN trên Web Portal; Kiosk xác thực PIN qua Backend; kiểm tra rate limit $\le 5\text{ lần/phút}$ và khóa brute-force. | `FR-SYS-017`, `SRS-005` | `BLD-BE-014`, `BLD-WEB-018` | PIN đúng ghi nhận `VERIFICATION_PIN`; PIN sai trả 401; sai 5 lần liên tiếp trả 423 khóa 15 phút. |   Done  |
| `TST-SYS-024` | Kiểm thử Tạo Ca, Phân ca & Áp dụng khi Chấm công | HR tạo ca (thường và ca gãy), phân ca theo khoảng hiệu lực; ca hiệu lực áp dụng khi tính công; chưa phân ca gán nhãn `ANOMALOUS`. | `FR-SYS-018`, `FR-SYS-012` | `BLD-BE-014`, `BLD-WEB-019` | Ca 08:00-17:30 ân hạn 15p: chấm lúc 08:20 tính `LATE` 5 phút; nhân viên chưa phân ca nhận trạng thái `ANOMALOUS`. |   Done  |
| `TST-SYS-025` | Kiểm thử Chống Chồng lấn Lịch Phân ca | Tạo/sửa phân ca giao nhau về khoảng ngày cho cùng nhân viên; kiểm tra phản hồi 409 Conflict và tính toàn vẹn CSDL. | `FR-SYS-018`, `DD-SYS-018` | `BLD-BE-014` | Phân ca chồng khoảng trả HTTP 409 và không ghi CSDL; phân ca liền kề được chấp nhận; yêu cầu đồng thời không sinh chồng lấn. |   Done  |
| `TST-SYS-029` | Kiểm thử Khởi tạo Hệ thống An toàn (Bootstrap Admin) | Bootstrap trên CSDL trống tạo tài khoản quản trị đầu tiên; mật khẩu phức tạp $\ge 12$ ký tự, idempotent, không có mật khẩu mặc định. | `FR-SYS-021`, `SRS-005`, `DD-SYS-022` | `BLD-BE-014` | Bootstrap tạo đúng 1 tài khoản `ADMIN`; đăng nhập dùng được ngay; gọi lại không tạo thêm; không có credential hardcoded. |   Done  |
| `TST-SYS-030` | Kiểm thử Khôi phục Xác thực & Vòng đời Phiên | HR cấp lại mật khẩu tạm; nhân viên đặt lại PIN; kiểm tra đăng xuất và thu hồi tức thì refresh token khi đổi mật khẩu/vô hiệu hóa. | `FR-SYS-022`, `FR-SYS-023`, `SRS-006` | `BLD-BE-014` | Mật khẩu cũ hết hiệu lực ngay và mọi phiên cũ bị thu hồi; refresh token đã thu hồi trả HTTP 401; thao tác ghi audit log đầy đủ. |   Done  |
| `TST-SYS-031` | Kiểm thử Chốt Kỳ công & Khoá Điều chỉnh | HR chốt kỳ công tháng; thử nộp/duyệt đơn và sửa công thuộc kỳ đã chốt; cờ `isAdjustmentLocked` lan tỏa; ADMIN mở lại có lý do. | `FR-SYS-024`, `SRS-010`, `DD-SYS-024` | `BLD-BE-014`, `BLD-WEB-019` | Điều chỉnh công thuộc kỳ `LOCKED` trả HTTP 409; ADMIN mở lại bắt buộc nhập lý do, ghi audit và cho phép điều chỉnh trở lại. |   Done  |
| `TST-SYS-033` | Kiểm thử Vòng đời Quyền, Thông báo & WCAG 2.2 AA | ADMIN gán/thu hồi role; chặn hạ cấp ADMIN cuối cùng; kiểm tra thông báo trong ứng dụng; kiểm chuẩn trợ năng WCAG 2.2 AA. | `FR-SYS-026`, `FR-SYS-027`, `NFR-SYS-010` | `BLD-BE-014`, `BLD-WEB-021` | Thay đổi role ghi audit; thu hồi ADMIN cuối cùng trả 409; 0 vi phạm Serious trên Axe Core; tương phản $\ge 4.5:1$. |   Done  |

---

### 3.4. Nhóm 4: Tuân thủ Luật Dữ liệu Cá nhân, Consent, Tiêu hủy Sinh trắc & Quản trị Kiosk (8 ca kiểm thử)

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-SYS-011` | Kiểm thử Ký Thỏa thuận Informed Consent | Nhân viên mới tích chọn đồng ý trên Web (cuộn 100%); lưu vết IP, timestamp và User-Agent vào `consent_audit_logs`. | `FR-SYS-007`, `SRS-004`, `SRS-010` | `BLD-WEB-013` | Ghi nhận văn bản thỏa thuận bất biến trong audit logs; chỉ sinh OTP Onboarding khi đã có Consent hợp lệ. |   Done  |
| `TST-SYS-012` | Kiểm thử Xác thực Mã Onboarding OTP 48h | Nhập đúng OTP mở khóa nạp mặt; OTP sai hoặc quá hạn 48h báo lỗi; mã OTP băm một chiều kèm pepper; khóa sau 5 lần sai. | `FR-SYS-008`, `PD-007` | `BLD-BE-013` | OTP dùng đúng 1 lần và từ chối khi hết hạn 48h; khóa tạm thời sau 5 lần nhập sai liên tiếp. |   Done  |
| `TST-SYS-014` | Kiểm thử Mã hóa Dữ liệu Tĩnh AES-256-GCM & TLS 1.3 | Cột `template_vector_encrypted` lưu BYTEA kèm IV 12B và Tag 16B; giải mã đúng khi nạp Kiosk; kết nối HTTPS/WSS TLS 1.3. | `FR-SYS-010`, `SRS-001`, `SRS-002`, `NFR-SYS-007` | `BLD-BE-010` | Dữ liệu tĩnh mã hóa FIPS AES-GCM; không giải mã được nếu thiếu Master Key; kênh truyền từ chối TLS < 1.3. |   Done  |
| `TST-SYS-015` | Kiểm thử Tự động Xóa Dữ liệu sau 20 Ngày | Nhân viên nghỉ việc quá 20 ngày; cron job quét xóa sạch vector khỏi CSDL theo Điều 18 & 19 Luật 91/2025/QH15 và ghi log. | `FR-SYS-011`, `SRS-003` | `BLD-BE-010` | Xóa sạch vector sau đúng 20 ngày kể từ `terminated_date`; ghi vết kiểm toán bất biến phục vụ thanh tra. |   Done  |
| `TST-SYS-023` | Kiểm thử Vô hiệu hóa Nhân sự & Kích hoạt Tiêu hủy | HR vô hiệu hóa nhân sự; kiểm tra trạng thái `TERMINATED`, thu hồi phiên, bản ghi audit và lịch trình tiêu hủy vector sinh trắc. | `FR-SYS-011`, `FR-SYS-017`, `SRS-003` | `BLD-BE-010`, `BLD-WEB-018` | Vô hiệu hóa đặt trạng thái `TERMINATED` kèm `terminated_date` và ghi audit log; sau 20 ngày cron job xóa sạch vector. |   Done  |
| `TST-SYS-026` | Kiểm thử Tra cứu Kiểm toán & Tuân thủ Dữ liệu | ADMIN tra cứu `audit_logs`; DPO tra cứu chữ ký Consent và lịch trình tiêu hủy; chặn ghi/sửa tuyệt đối với role DPO. | `FR-SYS-019`, `SRS-010`, `DD-SYS-019` | `BLD-BE-014`, `BLD-WEB-021` | ADMIN lọc được `audit_logs`; role `DPO` chỉ đọc được Consent/retention; không tồn tại đường sửa/xoá `audit_logs`. |   Done  |
| `TST-SYS-027` | Kiểm thử Vòng đời Trạm Kiosk | Đăng ký trạm mới, dùng Secret Token gọi Kiosk API, đổi token và vô hiệu hóa trạm; kiểm tra cập nhật `last_ping_at`. | `FR-SYS-020`, `SRS-006`, `DD-SYS-020` | `BLD-BE-014`, `BLD-WEB-021` | Secret Token chỉ hiển thị 1 lần và lưu dạng băm; token cũ bị từ chối sau khi đổi; trạm `INACTIVE` nhận 401 ở mọi API. |   Done  |
| `TST-SYS-032` | Kiểm thử Rút Consent & Quyền Chủ thể Dữ liệu | Nhân viên rút Consent; vô hiệu hóa nhận diện mặt, hạn tiêu hủy 7 ngày theo Nghị định 356/2025/NĐ-CP, phản hồi yêu cầu dữ liệu qua DPO. | `FR-SYS-025`, `SRS-003`, `DD-SYS-025` | `BLD-BE-014`, `BLD-WEB-020` | Rút Consent chuyển sang điểm danh PIN; tiêu hủy sinh trắc trong 7 ngày; DPO tra cứu và xử lý yêu cầu dữ liệu. |   Done  |

---

### 3.5. Nhóm 5: Đơn Giải trình, Báo cáo Excel Chống Injection, Độ Bền bỉ & Ngâm tải (3 ca kiểm thử)

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-SYS-019` | Kiểm thử Duyệt Giải trình & Xuất Báo cáo Excel | HR duyệt đơn giải trình; xuất file Excel bảng công kiểm tra tự động chèn dấu `'` chống formula injection (`=`, `+`, `-`, `@`). | `FR-SYS-015`, `FR-SYS-016`, `SRS-007`, `DD-SYS-008` | `BLD-WEB-016` | File Excel xuất ra được chèn dấu escape `'` trước ký tự nguy hiểm; tải xuống $\le 3\text{ s}$; số liệu khớp 100%. |   Done  |
| `TST-SYS-020` | Kiểm thử Ngâm tải Bộ nhớ Liên tục 8 Giờ với Vòng lặp AI | Kích hoạt luồng đọc camera và vòng lặp suy luận AI liên tục 8 giờ trên máy trạm Kiosk CPU AVX2; giám sát bộ nhớ qua psutil. | `NFR-SYS-009`, `SOL-SYS-014` | `BLD-KSK-018` | Sau 8 giờ chạy liên tục, mức tăng RAM $\Delta_{\text{RAM}} \le 10\%$, tổng RAM $< 800\text{ MB}$, không rò rỉ NumPy hay QImage. | Planned |
| `TST-SYS-028` | Kiểm thử Luồng Đơn Giải trình Công Toàn trình | Nhân viên nộp đơn cho lượt chấm sai; HR duyệt trong cùng giao dịch ACID; bản ghi công cập nhật kèm audit log giá trị trước/sau. | `FR-SYS-016`, `SRS-010`, `DD-SYS-021` | `BLD-BE-014`, `BLD-WEB-018` | Đơn được duyệt cập nhật đúng bản ghi điểm danh và sinh 1 bản ghi audit; đơn đã xử lý không thể thay đổi lần hai. |   Done  |

---

## 4. Requirements Traceability Matrix (Ma trận Truy vết Yêu cầu Hệ thống - R2T)

Bảng đối chiếu toàn diện bảo đảm **100% các mục đặc tả kỹ thuật cấp hệ thống** được kiểm chứng bởi các ca kiểm thử và file test kịch bản thực tế:

| Mã Đặc tả | Loại | Tên / Định nghĩa Yêu cầu | Ca Kiểm thử Bao phủ | File Test Kịch bản Thực thi |
| :--- | :--: | :--- | :---: | :--- |
| `SRS-001` | SRS | Mã hóa tĩnh AES-256-GCM vector sinh trắc học | `TST-SYS-014`, `034` | `tests/e2e/run_system_e2e_tests.py`, `SecurityConfigTest.java` |
| `SRS-002` | SRS | Mã hóa kênh truyền TLS 1.3 (HTTPS) & Secure WSS | `TST-SYS-014` | `run_system_e2e_tests.py`, `nginxConfig.test.ts` |
| `SRS-003` | SRS | Tự động tiêu hủy vector sau 20 ngày thôi việc & 7 ngày rút consent | `TST-SYS-015`, `023`, `032`| `run_system_e2e_tests.py`, `ComplianceSchedulerTest.java` |
| `SRS-004` | SRS | Tuyệt đối không lưu ảnh thô trên đĩa (Zero Raw Image) | `TST-SYS-011`, `034` | `test_zero_image_leak.py`, `run_system_e2e_tests.py` |
| `SRS-005` | SRS | Băm mật khẩu/PIN BCrypt & khóa 15p sau 5 lần sai | `TST-SYS-007`, `021`, `022`| `run_system_e2e_tests.py`, `AuthServiceTest.java` |
| `SRS-006` | SRS | Kiểm soát truy cập RBAC qua JWT & Secret Token Kiosk | `TST-SYS-026`, `027`, `030`| `run_system_e2e_tests.py`, `JwtTokenProviderTest.java` |
| `SRS-007` | SRS | Xuất báo cáo Excel chống Formula Injection | `TST-SYS-019` | `reportExportModule.test.tsx`, `run_system_e2e_tests.py` |
| `SRS-008` | SRS | Vận hành độc lập tại biên SQLite WAL ($\text{RPO} = 0$) | `TST-SYS-009`, `010` | `test_offline_queue.py`, `run_system_e2e_tests.py` |
| `SRS-009` | SRS | Độ sẵn sàng dịch vụ tối thiểu 99.9% qua `/actuator/health` | `TST-SYS-010`, `027` | `run_system_e2e_tests.py` |
| `SRS-010` | SRS | Nhật ký kiểm toán bất biến (`audit_logs`) cho mọi tác vụ | `TST-SYS-011`, `026`, `028`| `run_system_e2e_tests.py`, `AuditLogAspectTest.java` |
| `FR-SYS-001` | FR | Thu nhận video và phát hiện mặt YuNet | `TST-SYS-001`, `002`, `003`| `test_video_pipeline.py`, `test_yunet_detector.py` |
| `FR-SYS-002` | FR | Kiểm tra thực thể sống liveness MiniFASNet | `TST-SYS-004`, `005` | `test_liveness_minifasnet.py` |
| `FR-SYS-003` | FR | Trích xuất ArcFace 512D và so khớp Cosine ma trận RAM | `TST-SYS-006` | `test_arcface_matcher.py` |
| `FR-SYS-004` | FR | Bàn phím số ảo PIN dự phòng và xác thực tập trung | `TST-SYS-007` | `test_pin_keypad.py`, `run_system_e2e_tests.py` |
| `FR-SYS-005` | FR | Cơ chế Cooldown 120s chống quét trùng lặp hai lớp | `TST-SYS-008` | `test_cooldown.py`, `AttendanceServiceTest.java` |
| `FR-SYS-006` | FR | Lưu đệm ngoại tuyến SQLite WAL & tự động gửi bù | `TST-SYS-009`, `010` | `test_offline_queue.py`, `SyncServiceTest.java` |
| `FR-SYS-007` | FR | Ký cam kết Informed Consent điện tử | `TST-SYS-011` | `consentAndNotification.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-008` | FR | Sinh và xác thực mã Onboarding OTP 48h | `TST-SYS-012` | `run_system_e2e_tests.py`, `OtpServiceTest.java` |
| `FR-SYS-009` | FR | Quy trình tự nạp mẫu khuôn mặt 3 bước tại Kiosk | `TST-SYS-013` | `test_onboarding_wizard.py` |
| `FR-SYS-010` | FR | Mã hóa đối xứng AES-256-GCM vector mẫu CSDL | `TST-SYS-014` | `EncryptionServiceTest.java`, `run_system_e2e_tests.py` |
| `FR-SYS-011` | FR | Tự động tiêu hủy sinh trắc học sau 20 ngày thôi việc | `TST-SYS-015`, `023` | `ComplianceSchedulerTest.java`, `run_system_e2e_tests.py` |
| `FR-SYS-012` | FR | Quản lý ca kíp, ân hạn 15p và phân loại đi muộn/về sớm | `TST-SYS-016`, `024` | `ShiftCalculationServiceTest.java`, `run_system_e2e_tests.py` |
| `FR-SYS-013` | FR | Phát sóng sự kiện STOMP lên Live Dashboard | `TST-SYS-017` | `liveDashboardAndKpi.test.tsx`, `StompBroadcastTest.java` |
| `FR-SYS-014` | FR | Đồng bộ hai chiều vector mẫu giữa Backend và Kiosk | `TST-SYS-018` | `test_kiosk_sync.py`, `KioskSyncControllerTest.java` |
| `FR-SYS-015` | FR | Màn hình Live Monitoring Dashboard thời gian thực | `TST-SYS-017`, `019` | `liveDashboardAndKpi.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-016` | FR | Đơn giải trình công trực tuyến & xuất Excel an toàn | `TST-SYS-019`, `028` | `reportExportModule.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-017` | FR | Vòng đời thông tin xác thực nhân sự (mật khẩu tạm, PIN) | `TST-SYS-021`, `022` | `accountSessionLifecycle.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-018` | FR | Quản lý danh mục ca và phân ca chống chồng lấn | `TST-SYS-024`, `025` | `shiftAndPayroll.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-019` | FR | Tra cứu kiểm toán chỉ đọc cho ADMIN và tuân thủ cho DPO | `TST-SYS-026` | `kioskAndCompliance.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-020` | FR | Quản lý vòng đời trạm Kiosk (Secret Token RAM) | `TST-SYS-027` | `kioskRegistryStore.test.ts`, `run_system_e2e_tests.py` |
| `FR-SYS-021` | FR | Khởi tạo hệ thống an toàn (Bootstrap Admin) | `TST-SYS-029` | `run_system_e2e_tests.py`, `AdminBootstrapTest.java` |
| `FR-SYS-022` | FR | Khôi phục thông tin xác thực không phụ thuộc SMS/Email | `TST-SYS-030` | `accountSessionLifecycle.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-023` | FR | Quản lý vòng đời phiên làm việc & thu hồi token | `TST-SYS-030` | `tokenRefreshInterceptor.test.ts`, `run_system_e2e_tests.py` |
| `FR-SYS-024` | FR | Chốt bảng công kỳ tháng & khóa cứng điều chỉnh | `TST-SYS-031` | `payrollPeriodStore.test.ts`, `run_system_e2e_tests.py` |
| `FR-SYS-025` | FR | Rút Consent & quyền chủ thể dữ liệu (tiêu hủy 7 ngày) | `TST-SYS-032` | `kioskAndCompliance.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-026` | FR | Quản lý vòng đời quyền quản trị & bảo vệ ADMIN cuối | `TST-SYS-033` | `portalFullIntegration.test.tsx`, `run_system_e2e_tests.py` |
| `FR-SYS-027` | FR | Thông báo trong ứng dụng theo các sự kiện vòng đời | `TST-SYS-033` | `notificationStore.test.ts`, `run_system_e2e_tests.py` |
| `FR-SYS-028` | FR | Nhân viên tự tra cứu lịch sử chấm công cá nhân | `TST-SYS-031`, `033` | `personalCalendarExport.test.tsx`, `run_system_e2e_tests.py` |
| `NFR-SYS-001`..`010` | NFR | Toàn bộ 10 yêu cầu phi chức năng hệ thống | `TST-SYS-001` .. `034` | Toàn bộ test suite liên phân hệ |
| `SOL-SYS-001`..`031` | SOL | Toàn bộ 31 thành phần giải pháp kỹ thuật hệ thống | `TST-SYS-001` .. `034` | Toàn bộ test suite liên phân hệ |
| `DD-SYS-001`..`028` | DD | Toàn bộ 28 quyết định thiết kế kiến trúc hệ thống | `TST-SYS-001` .. `034` | Toàn bộ test suite liên phân hệ |

---

## 5. Ma trận Kiểm định Trạng thái Ngoại lệ & Kháng lỗi Hệ thống (System Resilience Matrix)

| Tình huống Rủi ro / Ngoại lệ | Hành vi Kỳ vọng của Hệ thống | Ca Kiểm thử Kiểm chứng | Bằng chứng Thực thi | Trạng thái |
| :--- | :--- | :---: | :--- | :---: |
| **Đứt kết nối mạng giữa Kiosk và Backend** | Kiosk tự động đệm các lượt quẹt vào SQLite WAL; tiếp tục nhận diện khuôn mặt bình thường; gửi bù khi mạng phục hồi. | `TST-SYS-009`, `010` | `test_offline_queue.py`, `run_system_e2e_tests.py` |   Done  |
| **Cúp điện đột ngột tại trạm Kiosk biên** | `PRAGMA synchronous = FULL` bảo toàn 100% bản ghi điểm danh chưa gửi; không làm hỏng tệp tin SQLite. | `TST-SYS-009` | `test_offline_queue.py` |   Done  |
| **Tấn công giả mạo ảnh in 2D hoặc màn hình video** | MiniFASNet từ chối $S < 0.85$, viền Oval chuyển đỏ cảnh báo, không ghi nhận điểm danh. | `TST-SYS-004`, `005` | `test_liveness_minifasnet.py` |   Done  |
| **Quẹt thẻ liên tiếp 2 lần trong 120 giây** | Lớp 1 (Kiosk RAM) hoặc Lớp 2 (Backend Caffeine Cache) từ chối tức thì kèm thông báo "Bạn đã chấm công, vui lòng không quẹt lại". | `TST-SYS-008` | `test_cooldown.py`, `run_system_e2e_tests.py` |   Done  |
| **Nhập sai mã PIN liên tiếp 5 lần** | Backend khóa tài khoản 15 phút per-account; Kiosk khóa bàn phím ảo 15 phút per-device và phát cảnh báo. | `TST-SYS-007` | `test_pin_keypad.py`, `run_system_e2e_tests.py` |   Done  |
| **Mã OTP Onboarding hết hạn 48 giờ** | Hệ thống từ chối xác thực; thông báo mã OTP đã hết hiệu lực và yêu cầu tạo mã mới trên Web Portal. | `TST-SYS-012` | `run_system_e2e_tests.py` |   Done  |
| **Phân ca chồng khoảng ngày cho cùng nhân viên** | Backend bắt lỗi nghiệp vụ trong giao dịch có khóa; trả về HTTP 409 Conflict kèm khoảng trống gợi ý. | `TST-SYS-025` | `run_system_e2e_tests.py` |   Done  |
| **Thử sửa công hoặc nộp đơn thuộc kỳ công đã chốt** | Cờ khóa `isAdjustmentLocked` từ chối mọi yêu cầu chỉnh sửa với HTTP 409; chỉ ADMIN được mở lại có lý do. | `TST-SYS-031` | `run_system_e2e_tests.py` |   Done  |
| **Khai thác mã độc Formula Injection trong file Excel** | Hàm xuất báo cáo tự động thêm dấu `'` vào đầu chuỗi bắt đầu bằng `=`, `+`, `-`, `@`. | `TST-SYS-019` | `run_system_e2e_tests.py` |   Done  |
| **Mất cắp ổ đĩa máy chủ hoặc bản sao lưu CSDL** | 100% vector sinh trắc học ở dạng ciphertext AES-256-GCM; kẻ tấn công không thể giải mã nếu thiếu Master Key. | `TST-SYS-014`, `034` | `run_system_e2e_tests.py` |   Done  |

---

## 6. Tiêu chuẩn Nghiệm thu & Quy trình Triển khai Kiểm thử Hệ thống

### 6.1. Tiêu chí Nghiệm thu để Ca Kiểm thử Chuyển sang "Done"

Một ca kiểm thử cấp hệ thống chỉ được đánh dấu hoàn thành (**`Done`**) khi đáp ứng đầy đủ các điều kiện khắt khe sau trong quá trình thực thi thực tế:

1. **Thực thi Kiểm thử Đạt 100% trên Môi trường Sống (Full-Stack Live System)**:
   - Tất cả các bước kiểm thử liên phân hệ (E2E) chạy thành công với $0\text{ Failures}$, $0\text{ Errors}$, $0\text{ Skipped}$.
   - **Tuyệt đối không tính các unit test mock của từng phân hệ (JUnit / Vitest) vào tiêu chí nghiệm thu Cấp Hệ thống.** Cấp Hệ thống chỉ chấp nhận kiểm thử Black-box/Grey-box luồng liên phân hệ thực sự xuyên suốt qua Nginx, Backend, PostgreSQL và Kiosk/Browser.
2. **Bằng chứng Thực thi Rõ ràng (Execution Evidence)**:
   - Có nhật ký thực thi (Test Execution Logs) từ test runner chuyên dụng (`tests/e2e/run_system_e2e_tests.py`) và công cụ kiểm thử trình duyệt thật (`Browser Subagent`), kèm timestamp, mã phản hồi HTTP, payload dữ liệu và trạng thái CSDL thực tế.
3. **Không gây Hồi quy (Zero Regression)**:
   - Toàn bộ các dịch vụ Backend, Kiosk và Web Portal giữ vững độ ổn định, không phát sinh lỗi sập tiến trình, rò rỉ RAM hay lỗi kết nối mạng.

### 6.2. Quy trình Triển khai Kiểm thử Hệ thống Theo Pha (Phased Execution)

- **Pha 1 — Kế hoạch & Rà soát Đặc tả Hệ thống (Planning & Review)**: *(Hoàn thành)*
  - Rà soát toàn diện và chuẩn hóa System Test Plan v3.0 bao phủ 100% đặc tả (`spec.md`).
  - Thiết lập ma trận 34 ca kiểm thử (`TST-SYS-001` .. `TST-SYS-034`) ở trạng thái khởi tạo **`Planned`**.
- **Pha 2 — Triển khai Thực thi Kiểm thử Tự động Theo Nhóm (Automated Execution by Groups)**: *(Sẵn sàng triển khai)*
  - Thực thi tuần tự 5 nhóm kiểm thử trên môi trường Docker thật và test runner Python E2E:
    - **Nhóm 1**: AI Vision Pipeline, Chống Giả mạo & Cận biên Kiosk (8 ca kiểm thử).
    - **Nhóm 2**: Hợp đồng Điểm danh, Ngoại tuyến SQLite WAL & Tự động Đồng bộ Bù (7 ca kiểm thử).
    - **Nhóm 3**: Vòng đời Nhân sự, Quản lý Ca kíp, Chốt kỳ công & Phân quyền RBAC (8 ca kiểm thử).
    - **Nhóm 4**: Tuân thủ Luật Dữ liệu Cá nhân, Consent, Tiêu hủy Sinh trắc & Quản trị Kiosk (8 ca kiểm thử).
    - **Nhóm 5**: Đơn Giải trình, Báo cáo Excel Chống Injection, Độ Bền bỉ & Ngâm tải (3 ca kiểm thử).
- **Pha 3 — Nghiệm thu & Lập Báo cáo Kết quả (System Acceptance & Reporting)**:
  - Cập nhật trạng thái `Done` cho từng nhóm kèm bằng chứng thực thi, nâng frontmatter `status` lên `Done` sau khi hoàn tất 34/34 ca kiểm thử.

### 6.3. Tiến độ & Nhật ký Nghiệm thu Thực thi Hệ thống (Execution Progress & Evidence Log)

| Nhóm Kiểm thử | Ca kiểm thử | Số ca E2E thực thi | Kết quả E2E | Bằng chứng / Kịch bản Thực thi Hệ thống Thực tế | Mốc thời gian | Trạng thái Nghiệm thu |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| **Nhóm 1: AI Vision, PAD & Kiosk Edge** | `TST-SYS-001`..`006`, `013`, `034` | 8 ca E2E | **8/8 PASS (100%)** | Kịch bản kiểm thử Cận biên Kiosk Runtime kết nối Backend thật; xác nhận Zero Raw Image Leak trên đĩa (`run_system_e2e_tests.py` Phần 13). | 2026-10-17 02:54:01 | **Done (8/8 ca)** |
| **Nhóm 2: Điểm danh, Ngoại tuyến & Đồng bộ** | `TST-SYS-007`..`010`, `016`, `017`, `018` | 7 ca E2E | **7/7 PASS (100%)** | Kịch bản kiểm thử tích hợp liên phân hệ Kiosk $\leftrightarrow$ Nginx $\leftrightarrow$ Backend $\leftrightarrow$ PostgreSQL (`run_system_e2e_tests.py` Phần 1, 6, 7, 8). | 2026-10-17 03:01:14 | **Done (7/7 ca)** |
| **Nhóm 3: Nhân sự, Ca kíp, Chốt kỳ & RBAC** | `TST-SYS-021`, `022`, `024`, `025`, `029`..`031`, `033` | 8 ca E2E | **8/8 PASS (100%)** | Kịch bản E2E Web Portal $\leftrightarrow$ Backend $\leftrightarrow$ PostgreSQL (`run_system_e2e_tests.py` Phần 2, 3, 5, 8, 10, 12) + Xác thực UI trực tiếp trên trình duyệt thật (`localhost:3000`). | 2026-10-17 03:01:14 | **Done (8/8 ca)** |
| **Nhóm 4: Tuân thủ Luật Dữ liệu & Kiosk** | `TST-SYS-011`, `012`, `014`, `015`, `023`, `026`, `027`, `032` | 8 ca E2E | **8/8 PASS (100%)** | Kịch bản E2E kiểm tra CSDL Postgres sống (AES-256-GCM BYTEA), rút consent, vô hiệu hóa nhân sự TERMINATED, lịch trình tiêu hủy 20 ngày qua DPO (`run_system_e2e_tests.py` Phần 4, 11, 12, 14) + Browser live test. | 2026-10-17 03:12:35 | **Done (8/8 ca)** |
| **Nhóm 5: Giải trình, Báo cáo & Ngâm tải** | `TST-SYS-019`, `020`, `028` | 2/3 ca E2E | **2/2 PASS (100%)** | Kịch bản E2E xuất báo cáo Excel chống injection và luồng đơn giải trình ACID (`run_system_e2e_tests.py` Phần 9, 15); ca soak 8h (`TST-SYS-020`) được lập lịch ngâm tải riêng. | 2026-10-17 03:12:35 | **In Progress (2/3 ca)** |
