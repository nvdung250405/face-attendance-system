---
title: Đặc tả Yêu cầu & Thiết kế Giải pháp Chức năng / Phi chức năng Hệ thống (System FR/NFR Specs & Design)
version: 2.0
status: Approved
owner: Requirements Lead & Solution Architect
type: spec
scope: SYS
updated: 2026-10-08
---

# SYSTEM FR/NFR SPECS & DESIGN — Đặc tả Yêu cầu & Thiết kế Giải pháp Chức năng & Phi chức năng

Tài liệu này là **Spec Facet FR/NFR cấp Hệ thống** của dự án Face Attendance System (FAS) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §7.1), tích hợp đồng nhất:
1. Phân tích yêu cầu theo Vòng đời 4 Tác nhân (`ACT-001` đến `ACT-004`).
2. Danh mục 28 Yêu cầu Chức năng Hệ thống (`FR-SYS-001` đến `FR-SYS-028`).
3. Danh mục 10 Yêu cầu Phi chức năng Hệ thống đo lường được (`NFR-SYS-001` đến `NFR-SYS-010`).
4. Danh mục các Thành phần Giải pháp Kỹ thuật & Cơ chế Chất lượng (`SOL-SYS-001` đến `SOL-SYS-031`).

---

## 1. Khung Phân tích Yêu cầu theo Vòng đời Tác nhân (Actor Lifecycle Analysis Framework)

Kỹ thuật phân tích yêu cầu theo vòng đời tác nhân (Actor Lifecycle-Driven Requirements Engineering) đặt con người và vai trò tương tác làm trung tâm, theo dõi hành trình nghiệp vụ từ điểm tiếp xúc đầu tiên (tiếp nhận/khởi tạo) qua quá trình vận hành thường nhật, xử lý ngoại lệ, cho đến điểm kết thúc (chấm dứt/tiêu hủy).

### 1.1. Vòng đời Tác nhân Nhân viên (`ACT-001` — Employee Lifecycle)

1. **Giai đoạn Tiếp nhận & Kích hoạt Danh tính (Onboarding & Activation)**:
   * Nhân viên nhận mật khẩu tạm do hệ thống sinh, đăng nhập Cổng Web lần đầu mà không bị ép buộc đổi mật khẩu (`FR-SYS-017`).
   * Nhân viên đọc và ký cam kết thỏa thuận Informed Consent điện tử về thu thập dữ liệu sinh trắc học (`FR-SYS-007`).
   * Sau khi ký Consent, nhân viên nhận mã Onboarding OTP 6 chữ số có thời hạn 48 giờ (`FR-SYS-008`).
   * Nhân viên mang mã OTP ra trạm Kiosk thực hiện quy trình tự nạp mẫu khuôn mặt 3 bước đạt chuẩn (độ nét, góc nghiêng, liveness) (`FR-SYS-009`).
   * Nhân viên tự thiết lập mã PIN dự phòng cá nhân 6 số trên Web Portal để làm kênh xác thực thay thế (`FR-SYS-017`).
2. **Giai đoạn Vận hành Điểm danh Thường nhật (Daily Attendance)**:
   * Khi bước vào trạm Kiosk, camera tự động phát hiện khuôn mặt thời gian thực qua YuNet (`FR-SYS-001`).
   * Bộ lọc MiniFASNet kiểm tra thực thể sống thụ động (Passive Liveness) để chặn đứng ảnh in và video giả mạo (`FR-SYS-002`).
   * Bộ trích xuất ArcFace sinh vector 512D và so khớp Cosine 1:N tức thì với ma trận RAM tại biên (`FR-SYS-003`).
   * Trong trường hợp khuôn mặt bị tổn thương, ánh sáng bất lợi, hoặc sai lệch nhân khẩu học (NIST IR 8271), nhân viên sử dụng bàn phím ảo PIN dự phòng (`FR-SYS-004`).
   * Hệ thống áp dụng cơ chế Cooldown 120 giây chống quẹt trùng lặp vô ý (`FR-SYS-005`).
   * Khi mạng nội bộ gặp sự cố, trạm Kiosk tự động đệm dữ liệu vào SQLite WAL và đồng bộ bù khi kết nối phục hồi (`FR-SYS-006`).
3. **Giai đoạn Tự phục vụ, Đối soát & Xử lý Ngoại lệ (Self-Service & Exception Handling)**:
   * Nhân viên tự tra cứu lịch sử chấm công cá nhân theo tháng trên Web Portal (`FR-SYS-028`).
   * Khi có sai sót chấm công (quên quẹt, đi công tác), nhân viên gửi đơn giải trình công trực tuyến kèm lý do chính đáng (`FR-SYS-016`).
   * Khi quên thông tin xác thực, nhân viên được cấp lại mật khẩu tạm hoặc tự đặt lại mã PIN dự phòng sau khi xác thực mật khẩu (`FR-SYS-022`).
   * Nhân viên nhận thông báo trong ứng dụng về tình trạng tài khoản, đơn giải trình và trạng thái công (`FR-SYS-027`).
4. **Giai đoạn Rút Quyền & Chấm dứt Tương tác (Consent Revocation & Offboarding)**:
   * Nhân viên có quyền rút lại Informed Consent bất kỳ lúc nào; khi rút, tính năng điểm danh khuôn mặt bị vô hiệu hóa ngay và chuyển hoàn toàn sang mã PIN (`FR-SYS-025`).
   * Dữ liệu sinh trắc học của nhân viên rút Consent bị kích hoạt tiêu hủy vĩnh viễn trong vòng 7 ngày (`FR-SYS-025`).
   * Mọi phiên làm việc bị thu hồi tức thì khi nhân viên đổi mật khẩu hoặc thôi việc (`FR-SYS-023`).

---

### 1.2. Vòng đời Tác nhân Chuyên viên Nhân sự (`ACT-002` — HR Specialist Lifecycle)

1. **Giai đoạn Thiết lập & Cấu hình Chính sách (Policy & Workforce Setup)**:
   * HR khởi tạo hồ sơ nhân sự mới, bàn giao mật khẩu tạm hiển thị duy nhất một lần cho nhân viên (`FR-SYS-017`).
   * Cấu hình danh mục ca làm việc (ca chuẩn, ca gãy, thời gian ân hạn 15 phút, mốc đi muộn/về sớm) (`FR-SYS-012`, `FR-SYS-018`).
   * Phân ca làm việc linh hoạt cho nhân sự theo khoảng thời gian hiệu lực, ngăn chặn triệt để chồng lấn ca (`FR-SYS-018`).
2. **Giai đoạn Giám sát Vận hành Ca trực Thời gian thực (Live Monitoring & Operations)**:
   * Theo dõi sĩ số trực tiếp đầu giờ trên màn hình Live Monitoring Dashboard qua kênh WebSocket STOMP (`FR-SYS-013`, `FR-SYS-015`).
   * Nắm bắt tức thì danh sách nhân sự đi làm đúng giờ, đi muộn, về sớm hoặc quẹt công bất thường (`FR-SYS-012`, `FR-SYS-015`).
   * Quản lý phân phối đồng bộ dữ liệu vector mẫu nhân viên mới ra toàn bộ mạng lưới Kiosk biên (`FR-SYS-014`).
3. **Giai đoạn Đối soát, Xử lý Giải trình & Chốt kỳ Công (Reconciliation & Period Close)**:
   * Tiếp nhận, đối chiếu minh chứng và xét duyệt hoặc từ chối các đơn giải trình công của nhân viên (`FR-SYS-016`).
   * Xử lý các bản ghi chấm công bất thường (`ANOMALOUS`) do nhân sự chưa được phân ca trước đó (`FR-SYS-018`).
   * Thực hiện thủ tục chốt bảng công kỳ tháng, khóa cứng mọi khả năng chỉnh sửa dữ liệu công sau khi đã chốt (`FR-SYS-024`).
   * Kết xuất báo cáo bảng công định dạng file Excel (.xlsx) an toàn, tự động vô hiệu hóa mã độc Formula Injection (`FR-SYS-016`).

---

### 1.3. Vòng đời Tác nhân Quản trị viên Hệ thống (`ACT-003` — System Admin Lifecycle)

1. **Giai đoạn Khởi tạo Hạ tầng & Cấp phát (Bootstrap & Provisioning)**:
   * Khởi tạo an toàn tài khoản quản trị đầu tiên (Bootstrap) trên CSDL trống qua biến môi trường/CLI, không dùng mật khẩu mặc định cố định (`FR-SYS-021`).
   * Đăng ký trạm Kiosk biên mới vào hệ thống, sinh Secret Token hiển thị duy nhất một lần để xác thực kết nối máy trạm (`FR-SYS-020`).
2. **Giai đoạn Quản trị An ninh, Phiên & Phân quyền (Security Governance & Operations)**:
   * Quản lý phân quyền RBAC: gán và thu hồi các role `HR_MANAGER`, `DPO`, `ADMIN`, đồng thời bảo vệ tài khoản quản trị hoạt động cuối cùng (`FR-SYS-026`).
   * Quản lý vòng đời phiên làm việc, giám sát và thu hồi tức thì refresh token khi có dấu hiệu lộ lọt hoặc thay đổi thông tin xác thực (`FR-SYS-023`).
   * Cấp lại mật khẩu tạm thời khi nhân sự quên mật khẩu đăng nhập (`FR-SYS-022`).
   * Giám sát trạng thái kết nối nhịp tim (ping), phát hiện trạm Kiosk ngoại tuyến (`FR-SYS-020`) và giám sát endpoint sức khỏe dịch vụ Backend `/actuator/health` (`SRS-009`, `NFR-SYS-008`).
3. **Giai đoạn Kiểm toán, Bảo trì & Phục hồi Sự cố (Audit & Incident Response)**:
   * Tra cứu nhật ký kiểm toán hệ thống (`audit_logs`) chi tiết phục vụ điều tra sự cố kỹ thuật và truy vết hành vi người dùng (`FR-SYS-019`).
   * Mở khóa kỳ công đã chốt khi có yêu cầu đặc biệt từ ban giám đốc, ghi nhận lý do và vết kiểm toán đầy đủ (`FR-SYS-024`).

---

### 1.4. Vòng đời Tác nhân Cán bộ Bảo vệ Dữ liệu (`ACT-004` — DPO Compliance Lifecycle)

1. **Giai đoạn Giám sát Tuân thủ & Hồ sơ Đồng thuận (Consent Governance)**:
   * Tra cứu, kiểm tra danh mục chữ ký thỏa thuận Informed Consent điện tử của toàn bộ nhân sự trong tổ chức (`FR-SYS-019`).
   * Xác minh tính hợp pháp của việc thu thập và sử dụng dữ liệu sinh trắc học theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (`FR-SYS-007`, `FR-SYS-019`).
2. **Giai đoạn Thực thi Quyền của Chủ thể Dữ liệu (Data Subject Rights)**:
   * Tiếp nhận, giám sát việc xử lý các yêu cầu rút lại Informed Consent từ nhân viên (`FR-SYS-025`).
   * Phối hợp phản hồi các yêu cầu tiếp cận, tra cứu hoặc đính chính dữ liệu cá nhân của người lao động trong ứng dụng (`FR-SYS-025`).
3. **Giai đoạn Kiểm toán Mã hóa & Giám sát Tiêu hủy Dữ liệu (Destruction Auditing)**:
   * Giám sát việc thực thi mã hóa đối xứng AES-256-GCM bảo vệ vector tĩnh tại CSDL PostgreSQL (`FR-SYS-010`, `NFR-SYS-007`).
   * Kiểm tra định kỳ tác vụ tự động tiêu hủy vĩnh viễn (Hard Delete) mẫu vector sinh trắc học sau đúng 20 ngày kể từ ngày chấm dứt hợp đồng lao động theo Điều 18 & 19 Luật số 91/2025/QH15 (`FR-SYS-011`).
   * Giám sát việc tiêu hủy triệt để dữ liệu sinh trắc học trong vòng 7 ngày đối với các trường hợp rút thỏa thuận Consent (`FR-SYS-025`).

---

### 1.5. Ma trận Ánh xạ Vòng đời Tác nhân sang Yêu cầu Kỹ thuật

| Giai đoạn Vòng đời | Tác nhân Chính | Mục tiêu Tác nhân (Actor Goal) | Danh mục Yêu cầu Đáp ứng |
| :--- | :--- | :--- | :--- |
| **Tiếp nhận & Kích hoạt** | `ACT-001` Nhân viên | Đăng nhập tài khoản ban đầu, ký cam kết bảo vệ dữ liệu, nhận OTP và tự nạp khuôn mặt tại Kiosk | `FR-SYS-007`, `FR-SYS-008`, `FR-SYS-009`, `FR-SYS-017` |
| **Điểm danh Thường nhật** | `ACT-001` Nhân viên | Điểm danh khuôn mặt nhanh chóng, chính xác; dùng mã PIN dự phòng khi sự cố; chống quẹt trùng | `FR-SYS-001`, `FR-SYS-002`, `FR-SYS-003`, `FR-SYS-004`, `FR-SYS-005`, `FR-SYS-006` |
| **Tự phục vụ & Ngoại lệ** | `ACT-001` Nhân viên | Tra cứu lịch sử công tháng, gửi đơn giải trình khi quên quẹt, đổi mật khẩu/đặt lại PIN, nhận thông báo | `FR-SYS-016`, `FR-SYS-022`, `FR-SYS-027`, `FR-SYS-028` |
| **Rút quyền & Thôi việc** | `ACT-001` Nhân viên | Rút Informed Consent, yêu cầu bảo vệ quyền riêng tư và chuyển sang điểm danh PIN hoàn toàn | `FR-SYS-023`, `FR-SYS-025` |
| **Thiết lập Chính sách** | `ACT-002` Nhân sự | Khởi tạo hồ sơ nhân sự, cấu hình ca kíp, thời gian ân hạn và phân ca làm việc không chồng lấn | `FR-SYS-012`, `FR-SYS-017`, `FR-SYS-018` |
| **Giám sát Ca trực** | `ACT-002` Nhân sự | Theo dõi sĩ số trực tiếp đầu giờ trên Dashboard, phát hiện đi muộn/về sớm, đồng bộ vector Kiosk | `FR-SYS-013`, `FR-SYS-014`, `FR-SYS-015` |
| **Đối soát & Chốt kỳ** | `ACT-002` Nhân sự | Xét duyệt đơn giải trình công, chốt bảng công tháng, kết xuất báo cáo Excel chống Formula Injection | `FR-SYS-016`, `FR-SYS-024` |
| **Khởi tạo & Cấp phát** | `ACT-003` Quản trị viên | Bootstrap an toàn tài khoản quản trị đầu tiên, đăng ký trạm Kiosk và cấp Secret Token hiển thị 1 lần | `FR-SYS-020`, `FR-SYS-021` |
| **Quản trị An ninh** | `ACT-003` Quản trị viên | Phân quyền RBAC, thu hồi phiên làm việc tức thì, cấp lại mật khẩu tạm, giám sát nhịp tim trạm Kiosk | `FR-SYS-020`, `FR-SYS-022`, `FR-SYS-023`, `FR-SYS-026` |
| **Kiểm toán & Bảo trì** | `ACT-003` Quản trị viên | Tra cứu nhật ký kiểm toán hệ thống bất biến, mở khóa kỳ công khi có yêu cầu hợp lệ | `FR-SYS-019`, `FR-SYS-024` |
| **Giám sát Hồ sơ Consent**| `ACT-004` Cán bộ DPO | Kiểm tra hồ sơ chữ ký Informed Consent, đối soát tuân thủ Luật Bảo vệ dữ liệu cá nhân 2025 | `FR-SYS-007`, `FR-SYS-019` |
| **Quyền Chủ thể Dữ liệu** | `ACT-004` Cán bộ DPO | Tiếp nhận và thực thi yêu cầu rút Consent, yêu cầu trích xuất/chỉnh sửa dữ liệu cá nhân của nhân sự | `FR-SYS-025` |
| **Kiểm toán Tiêu hủy** | `ACT-004` Cán bộ DPO | Kiểm tra việc mã hóa vector AES-256-GCM, giám sát lịch trình tiêu hủy 20 ngày thôi việc và 7 ngày rút consent | `FR-SYS-010`, `FR-SYS-011`, `FR-SYS-025` |

---

## 2. Requirements (Yêu cầu Kỹ thuật Hệ thống)

### 2.1. Functional Requirements (Yêu cầu Chức năng)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-SYS-001` | Hệ thống phải thu nhận luồng video liên tục từ camera quang học và phát hiện khuôn mặt thời gian thực bằng mô hình nhẹ YuNet. | Vision / Kiosk | Must | `PD-002`, `ACT-001` | Tốc độ xử lý luồng video $\ge 15\text{ FPS}$ (khuyến nghị $\ge 24\text{ FPS}$); phát hiện khuôn mặt kích thước $\ge 120\times 120\text{ px}$; trả về tọa độ bounding box và 5 điểm mốc giải phẫu khuôn mặt trong $\le 20\text{ ms}$ trên CPU. | Approved |
| `FR-SYS-002` | Hệ thống phải kiểm tra thực thể sống thụ động (Passive Liveness) bằng mô hình MiniFASNet để loại bỏ ảnh in 2D và video phát lại. | Vision / Security | Must | `PD-003`, `INF-008`, `ACT-001` | Điểm số liveness $S_{\text{liveness}} \ge 0.85$; tuân thủ chuẩn ISO/IEC 30107-3 với sai số chấp nhận tấn công $\text{APCER} \le 2.0\%$ (chặn $\ge 98\%$ các cuộc tấn công Presentation Attack ảnh in và màn hình) và sai số từ chối người thật $\text{BPCER} \le 5.0\%$; thời gian suy luận $\le 30\text{ ms}$ trên CPU. | Approved |
| `FR-SYS-003` | Hệ thống phải trích xuất vector đặc trưng 512 chiều chuẩn hóa L2 Norm qua ArcFace và so khớp Cosine 1:N với ma trận RAM tại trạm Kiosk. | Vision / Identity | Must | `PD-002`, `INF-007`, `ACT-001` | Ngưỡng Cosine Similarity $\ge 0.50$; thời gian so khớp ma trận 1,000 nhân sự $< 2\text{ ms}$; đáp ứng đầy đủ tiêu chí chất lượng độ chính xác sinh trắc học định lượng tại `NFR-SYS-004`. | Approved |
| `FR-SYS-004` | Hệ thống phải cung cấp bàn phím số ảo PIN dự phòng trên màn hình cảm ứng để nhân viên điểm danh khi gặp sự cố sinh trắc học hoặc đã rút Informed Consent; mã PIN được thẩm định tập trung tại máy chủ Backend khi có kết nối mạng. | Fallback / UX | Should | `PD-008`, `INF-012`, `ACT-001` | Nhập mã PIN 6 số cá nhân; gọi thẩm định tập trung phía máy chủ Backend và ghi nhận điểm danh `VERIFICATION_PIN`; Backend áp dụng khóa tạm thời (Lockout) per-account tối thiểu 15 phút sau 5 lần nhập sai liên tiếp trên bất kỳ trạm nào kết hợp khóa per-device tại bàn phím Kiosk; khi mất mạng đồng thời với lỗi sinh trắc học, nhân viên nộp đơn giải trình công bổ sung (`FR-SYS-016`). | Approved |
| `FR-SYS-005` | Hệ thống phải áp dụng cơ chế Cooldown chống quét trùng lặp trong khoảng thời gian 120 giây cho cùng một nhân viên. | Business Rule | Should | `INF-001`, `ACT-001` | Kiểm soát đa tầng: trạm Kiosk kiểm tra bộ đệm RAM cục bộ để chặn quẹt trùng tức thì tại biên kể cả khi ngoại tuyến; Backend kiểm tra ràng buộc mốc giờ trong CSDL để chặn quẹt trùng luân chuyển giữa nhiều trạm; giao diện hiển thị thông báo "Bạn đã chấm công, vui lòng không quẹt lại". | Approved |
| `FR-SYS-006` | Hệ thống phải lưu trữ đệm các lượt quẹt vào CSDL cục bộ SQLite chế độ WAL khi mất mạng và tự động đồng bộ bù khi có mạng lại. | Resiliency | Must | `PD-004`, `INF-011`, `ACT-001` | Bản ghi điểm danh ngoại tuyến được bảo toàn an toàn trong SQLite cục bộ; khi kết nối mạng phục hồi, background worker tự động gửi bù theo lô tối đa 50 bản ghi/request về Backend thành công 100% không trùng lặp; thỏa mãn cam kết chất lượng $\text{RPO} = 0$ tại `NFR-SYS-006` và chính sách bền bỉ `SRS-008`. | Approved |
| `FR-SYS-007` | Hệ thống phải cung cấp quy trình ký văn bản thỏa thuận Informed Consent điện tử trước khi cho phép thu thập và kích hoạt dữ liệu khuôn mặt. | Compliance | Must | `PD-005`, `ACT-001`, `ACT-004` | Nhân viên tích chọn đồng ý điều khoản theo Luật 91/2025/QH15 trên Web Portal; lưu vết mốc thời gian, IP và User-Agent vào bảng `consent_audit_logs`; chỉ cho phép sinh OTP Onboarding khi đã có Consent hợp lệ. | Approved |
| `FR-SYS-008` | Hệ thống phải sinh mã kích hoạt Onboarding OTP 6 chữ số có hiệu lực giới hạn 48 giờ để nhân viên mang ra trạm Kiosk tự nạp khuôn mặt. | Enrollment | Must | `PD-007`, `FR-SYS-007`, `ACT-001` | Mã OTP gồm 6 chữ số ngẫu nhiên; mã băm một chiều bằng HMAC-SHA-256 kèm pepper bảo mật hoặc Argon2id/BCrypt lưu trong bảng `enrollment_otps`; tự hủy sau 48 giờ hoặc ngay sau khi nạp mặt thành công theo `PD-007`; giới hạn tối đa 5 lần xác thực sai cho mỗi mã OTP. | Approved |
| `FR-SYS-009` | Hệ thống phải thực hiện quy trình tự nạp mẫu khuôn mặt 3 bước trực tiếp trên camera Kiosk: kiểm chuẩn ảnh, chụp liên tiếp 3 ảnh đạt chuẩn và nạp vector. | Enrollment / UX | Must | `PD-007`, `FR-SYS-008`, `ACT-001` | Bước 1 xác minh OTP 6 số; Bước 2 tự động chụp 3 ảnh chuẩn (Laplacian độ nét $\ge 30$, điểm sống $S_{\text{liveness}} \ge 0.90$ với Safety Margin $+5\%$ so với ngưỡng vận hành $0.85$, góc nghiêng pose $\le 15^\circ$); Bước 3 nạp nóng vector vào RAM Kiosk và đồng bộ mã hóa về Backend. | Approved |
| `FR-SYS-010` | Hệ thống phải mã hóa đối xứng AES-256-GCM ở trạng thái tĩnh cho toàn bộ vector đặc trưng khuôn mặt trước khi lưu vào CSDL PostgreSQL. | Security | Must | `PD-005`, `SRS-001`, `ACT-004` | Thực thi chính sách bảo mật `SRS-001` và chất lượng `NFR-SYS-007`; 100% bản ghi vector trong CSDL có dạng BYTEA kèm IV 12 bytes và Auth Tag 16 bytes; giải mã thành công qua khóa Master Key (`STK-034`) nạp độc lập từ biến môi trường. | Approved |
| `FR-SYS-011` | Hệ thống phải tự động tiêu hủy vĩnh viễn (Hard Delete) toàn bộ dữ liệu sinh trắc học của nhân viên đã thôi việc sau đúng 20 ngày theo Điều 18 & 19 Luật số 91/2025/QH15. | Compliance | Must | `PD-005`, `SRS-003`, `ACT-004` | Cron job chạy định kỳ 01:00 hàng ngày; quét và xóa sạch bản ghi trong `biometric_templates` của nhân viên có `terminated_date <= CurrentDate - 20 days` tuân thủ chính sách `SRS-003`; ghi nhật ký kiểm toán bất biến. | Approved |
| `FR-SYS-012` | Hệ thống phải quản lý ca làm việc linh hoạt, hỗ trợ thời gian ân hạn 15 phút và tự động phân loại đi muộn / về sớm. | Business Rule | Must | `ACT-002`, `FR-SYS-018` | Tự động tính số phút đi muộn (nếu check-in sau giờ bắt đầu ca + thời gian ân hạn cấu hình 0-60 phút, mặc định 15 phút) và về sớm; gán nhãn trạng thái chính xác `ON_TIME`, `LATE`, `EARLY_LEAVE` trong bảng công. | Approved |
| `FR-SYS-013` | Hệ thống phải phát sóng sự kiện điểm danh thời gian thực tức thì từ Backend lên Cổng Web qua kênh WebSocket STOMP. | Realtime | Must | `PD-006`, `ACT-002` | Đẩy thông điệp JSON tới topic `/topic/live-attendance`; Web Portal nhận và hiển thị lên Live Dashboard trong vòng $\le 200\text{ ms}$ kể từ khi Backend xử lý xong (gồm $\le 50\text{ ms}$ truyền STOMP và $\le 150\text{ ms}$ render giao diện theo `NFR-SYS-003`). | Approved |
| `FR-SYS-014` | Hệ thống phải đồng bộ danh mục vector khuôn mặt mẫu hai chiều giữa Backend và mạng lưới các trạm Kiosk qua WebSocket STOMP. | Realtime Sync | Must | `PD-006`, `ACT-002`, `ACT-003` | Khi có nhân viên mới hoàn tất đăng ký mẫu hoặc bị thôi việc/rút consent, Backend đẩy thông báo tới `/topic/kiosk-gallery`; các trạm Kiosk cập nhật nóng RAM trong $\le 500\text{ ms}$ mà không cần khởi động lại ứng dụng. | Approved |
| `FR-SYS-015` | Hệ thống phải cung cấp màn hình Live Monitoring Dashboard hiển thị sĩ số trực quan, biểu đồ tỷ lệ đúng giờ và nhật ký quẹt thẻ thời gian thực. | Web UX | Must | `ACT-002`, `FR-SYS-013` | Tự động cập nhật không cần reload trang; hiển thị ảnh avatar, họ tên, phòng ban, giờ chấm công, trạng thái đúng giờ/đi muộn với độ trễ cập nhật $< 200\text{ ms}$. | Approved |
| `FR-SYS-016` | Hệ thống phải hỗ trợ gửi/duyệt đơn giải trình công trực tuyến và kết xuất báo cáo Excel bảng công có cơ chế chống Formula Injection. | HR Management | Must | `ACT-001`, `ACT-002`, `INF-003`, `SRS-007` | Nhân viên nộp đơn giải trình trong vòng 30 ngày kèm lý do; HR duyệt/từ chối; xuất file Excel (.xlsx) tự động vô hiệu hóa ký tự chèn công thức macro (`=`, `+`, `-`, `@`) bằng dấu nháy đơn (`'`). | Approved |
| `FR-SYS-017` | Hệ thống phải quản lý vòng đời thông tin xác thực của tài khoản nhân sự: khởi tạo mật khẩu tạm do hệ thống sinh khi HR tạo hồ sơ, cho phép nhân viên tự đổi mật khẩu bất kỳ lúc nào (không bắt buộc), cho phép nhân viên tự thiết lập/đổi mã PIN dự phòng 6 số (băm một chiều) và xác thực mã PIN ở phía máy chủ trước khi ghi nhận điểm danh. | HR Management / Security | Must | `ACT-001`, `ACT-002`, `ACT-003`, `FR-SYS-004`, `SRS-005` | HR tạo hồ sơ nhận mật khẩu tạm hiển thị đúng một lần; nhân viên đăng nhập bằng mật khẩu tạm dùng được ngay mọi chức năng; chức năng đổi mật khẩu luôn khả dụng tự nguyện; nhân viên tự đặt mã PIN 6 số (lưu băm an toàn); Backend thẩm định mã PIN tập trung; khóa per-account 15 phút sau 5 lần nhập sai liên tiếp; áp dụng giới hạn tần suất (Rate Limiting) $\le 5\text{ requests/phút}$ trên endpoint xác thực. | Approved |
| `FR-SYS-018` | Hệ thống phải quản lý danh mục ca làm việc và phân ca cho nhân sự: HR tạo/sửa/vô hiệu hóa ca (mã ca, giờ bắt đầu/kết thúc, thời gian ân hạn), phân ca theo khoảng ngày hiệu lực và không cho phép hai phân ca chồng lấn thời gian của cùng một nhân viên. | HR Management | Must | `ACT-002`, `FR-SYS-012` | HR tạo được ca thường và ca gãy; phân ca theo `effective_from`/`effective_to`; từ chối (HTTP 409) khi khoảng hiệu lực chồng lấn của cùng nhân viên; ca đang hiệu lực tự động áp dụng khi tính công; bản ghi chấm công của nhân viên chưa được phân ca gán nhãn `ANOMALOUS` để HR xử lý. | Approved |
| `FR-SYS-019` | Hệ thống phải cung cấp khả năng tra cứu chỉ đọc phục vụ kiểm toán và tuân thủ dữ liệu cá nhân: tra cứu nhật ký kiểm toán (`audit_logs`) cho Quản trị viên, tra cứu chữ ký Informed Consent và lịch trình tiêu hủy dữ liệu sinh trắc cho Cán bộ Bảo vệ Dữ liệu. | Compliance / Auditing | Must | `ACT-003`, `ACT-004`, `SRS-010`, `PD-005` | ADMIN tra cứu được audit log theo khoảng thời gian, tác nhân và loại hành vi; role `DPO` chỉ đọc được dữ liệu Consent và lịch trình tiêu hủy, nhận HTTP 403 ở mọi endpoint ghi; không tồn tại giao diện sửa hoặc xóa `audit_logs`. | Approved |
| `FR-SYS-020` | Hệ thống phải quản lý vòng đời trạm Kiosk: đăng ký trạm mới kèm cấp Secret Token hiển thị một lần, đổi token, vô hiệu hóa trạm và giám sát mốc ping gần nhất của từng trạm. | Device Management | Must | `ACT-003`, `SRS-009` | Secret Token chỉ hiển thị một lần và lưu dạng băm một chiều tại Backend; trạm Kiosk lưu trữ token trong tệp cấu hình bảo vệ bằng Windows NTFS ACL và DPAPI; trạm bị vô hiệu hóa nhận HTTP 401 ở mọi giao diện Kiosk; ADMIN xem được danh sách trạm kèm `last_ping_at` và trạng thái kết nối. | Approved |
| `FR-SYS-021` | Hệ thống phải có cơ chế khởi tạo an toàn cho lần triển khai đầu tiên: tạo tài khoản quản trị đầu tiên với mật khẩu tạm (đổi được bất kỳ lúc nào, không bắt buộc), không tồn tại mật khẩu mặc định cố định trong mã nguồn hay kịch bản migration, và cơ chế khởi tạo tự vô hiệu hóa sau khi hoàn tất. | Security / Operations | Must | `ACT-003`, `SRS-005`, `SRS-006` | Lần chạy đầu trên CSDL trống tạo đúng một tài khoản `ADMIN` qua biến môi trường hoặc CLI có kiểm soát; mật khẩu tạm có độ phức tạp cao (tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt); dùng được ngay; gọi lại không tạo thêm tài khoản (idempotent); không có mật khẩu mặc định trong mã nguồn hay script migration. | Approved |
| `FR-SYS-022` | Hệ thống phải hỗ trợ khôi phục thông tin xác thực: cấp lại mật khẩu tạm khi nhân viên quên mật khẩu và cho phép nhân viên đặt lại mã PIN dự phòng khi quên, không phụ thuộc kênh email/SMS. | Security / Support | Must | `ACT-001`, `ACT-002`, `ACT-003`, `FR-SYS-017`, `SRS-005` | HR/ADMIN cấp lại mật khẩu tạm mới hiển thị một lần; mật khẩu cũ hết hiệu lực ngay và mọi phiên cũ bị thu hồi; nhân viên tự đặt lại PIN sau khi xác thực mật khẩu của chính mình thành công; áp dụng rate limit $\le 5\text{ lần/phút}$ cho thao tác khôi phục. | Approved |
| `FR-SYS-023` | Hệ thống phải quản lý vòng đời phiên làm việc: cho phép đăng xuất và thu hồi tức thì refresh token khi đổi mật khẩu, cấp lại mật khẩu hoặc tài khoản bị vô hiệu hóa. | Security | Must | `ACT-001`, `ACT-002`, `ACT-003`, `SRS-006`, `FR-SYS-017` | Đăng xuất vô hiệu hóa refresh token hiện tại; đổi mật khẩu, cấp lại mật khẩu và chuyển trạng thái `TERMINATED`/`SUSPENDED` lập tức thu hồi 100% refresh token của tài khoản; access token còn hạn bị từ chối khi tài khoản không còn hoạt động; thời hạn access 1h và refresh 7d cấu hình tập trung. | Approved |
| `FR-SYS-024` | Hệ thống phải cho phép HR chốt bảng công theo kỳ tháng và khóa mọi điều chỉnh công thuộc kỳ đã chốt. | HR Management | Must | `ACT-002`, `FR-SYS-016` | Chốt kỳ ghi nhận người chốt và mốc thời gian; sau khi chốt, hệ thống từ chối nộp/duyệt đơn giải trình và mọi điều chỉnh công thuộc kỳ đó (HTTP 409); ADMIN mở lại được kèm lý do và ghi audit; trạng thái chốt hiển thị trên báo cáo và file kết xuất. | Approved |
| `FR-SYS-025` | Hệ thống phải cho phép nhân viên rút lại Informed Consent và thực hiện quyền của chủ thể dữ liệu cá nhân (truy cập, chỉnh sửa) thông qua Cán bộ Bảo vệ Dữ liệu. | Compliance | Must | `ACT-001`, `ACT-004`, `FR-SYS-007`, `SRS-003` | Nhân viên rút Consent trực tuyến; hệ thống ghi vết thời điểm/IP, vô hiệu hóa điểm danh khuôn mặt (chuyển sang phương thức PIN dự phòng) và tiêu hủy dữ liệu sinh trắc trong vòng 7 ngày theo `PD-005`; nhân viên gửi được yêu cầu truy cập/chỉnh sửa dữ liệu cá nhân; DPO tra cứu được hồ sơ rút Consent. | Approved |
| `FR-SYS-026` | Hệ thống phải quản lý vòng đời quyền quản trị: gán và thu hồi role `HR_MANAGER`/`DPO`/`ADMIN`, ghi audit mọi thay đổi và bảo vệ tài khoản quản trị cuối cùng. | Security / Governance | Must | `ACT-002`, `ACT-003`, `ACT-004`, `SRS-006` | ADMIN gán/thu hồi role cho tài khoản khác và mọi thay đổi được ghi audit kèm giá trị trước/sau; từ chối thu hồi hoặc hạ cấp tài khoản `ADMIN` đang hoạt động cuối cùng (HTTP 409); vô hiệu hóa nhân sự thu hồi role trong cùng thao tác. | Approved |
| `FR-SYS-027` | Hệ thống phải thông báo trong ứng dụng cho đúng tác nhân theo các sự kiện vòng đời: tài khoản được tạo, phiên bị thu hồi, PIN bị khóa, đơn giải trình được xử lý, Consent bị rút và kỳ công đã chốt. | UX / Notification | Should | `ACT-001`, `ACT-002`, `ACT-004` | Thông báo hiển thị trong ứng dụng cho đúng người nhận kèm mốc thời gian và tham chiếu tới đối tượng liên quan; đánh dấu được trạng thái đã đọc; không gửi email/SMS trong phạm vi MVP. | Approved |
| `FR-SYS-028` | Hệ thống phải cho phép nhân viên tự tra cứu lịch sử chấm công của chính mình theo tháng. | Self-service | Must | `ACT-001` | Chỉ trả về dữ liệu của người đang đăng nhập; hỗ trợ tra cứu theo tháng và phân trang; hiển thị trạng thái (`ON_TIME`, `LATE`, `EARLY_LEAVE`, `ANOMALOUS`) kèm số phút đi muộn. | Approved |

---

### 2.2. Non-functional Requirements (Yêu cầu Phi chức năng)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-SYS-001` | Tổng thời gian chu kỳ tính toán nhận diện toàn trình tại trạm Kiosk (Phát hiện + Liveness + Trích xuất 512D + So khớp RAM) phải đạt $\le 350\text{ ms}$ trên CPU thuần Intel Core i5 / AMD Ryzen 5 phổ thông. | Performance | Must | `INF-006`, `PD-002` | Thời gian chu kỳ tính toán thuần từ khung hình video cuối cùng được chấp nhận đến khi hiển thị kết quả (YuNet $\le 20\text{ ms}$, MiniFASNet $\le 30\text{ ms}$, ArcFace $\le 50\text{ ms}$, Cosine 1:1,000 $\le 2\text{ ms}$, ghi SQLite WAL $\le 20\text{ ms}$) đạt p95 $\le 350\text{ ms}$; định nghĩa này loại trừ thời gian nhân viên căn chỉnh giữ khuôn mặt ổn định trước camera (0.5 - 1.0 giây). | Approved |
| `NFR-SYS-002` | Giao diện Kiosk phải duy trì tốc độ hiển thị luồng video từ camera đạt $\ge 15\text{ FPS}$ (khuyến nghị $\ge 24\text{ FPS}$) liên tục, không giật lag màn hình. | Performance | Must | `INF-006` | Luồng hiển thị PySide6/QML tách biệt đa luồng bất đồng bộ (Worker Thread) với luồng suy luận AI; không bị rớt khung hình hiển thị khi tải nhận diện cao. | Approved |
| `NFR-SYS-003` | Tổng thời gian từ khi khuôn mặt được trạm Kiosk nhận diện thành công đến khi sự kiện chấm công hiển thị trên Web Dashboard phải đạt $\le 1.2\text{ giây}$ (p95). | Performance | Must | `PD-001`, `PD-006` | Chuỗi pipeline phân tán: Kiosk ghi SQLite & gửi REST POST $\le 300\text{ ms} \rightarrow$ Backend tiếp nhận & xử lý $\le 100\text{ ms} \rightarrow$ WebSocket STOMP Broadcast $\le 50\text{ ms} \rightarrow$ Web render $\le 150\text{ ms}$; tổng thời gian face-to-dashboard $\le 1.2\text{ s}$ trên mạng LAN. | Approved |
| `NFR-SYS-004` | Độ chính xác nhận diện sinh trắc học khuôn mặt 1:N phải đạt chuẩn ISO/IEC 19795-1 với tỷ lệ bỏ sót nhận diện sai $\text{FNIR} \le 5.0\%$ tại tỷ lệ chấp nhận sai $\text{FPIR} \le 0.1\%$. | Biometric Accuracy | Must | `INF-007`, `PD-002` | Kiểm thử trên tập dữ liệu chuẩn 1,000 nhân viên với ngưỡng Cosine Similarity $\ge 0.50$ trong điều kiện độ rọi $\ge 150\text{ lux}$; tương đương tỷ lệ chấp nhận sai của cặp độc lập $\text{FAR} \le 10^{-6} = 0.0001\%$ trên mỗi lượt so khớp với $N = 1,000$. | Approved |
| `NFR-SYS-005` | Khả năng phòng chống tấn công giả mạo (PAD) phải đạt tỷ lệ sai số tấn công thành công $\text{APCER} \le 2.0\%$ và tỷ lệ từ chối người thật $\text{BPCER} \le 5.0\%$ theo chuẩn ISO/IEC 30107-3. | Biometric PAD | Must | `INF-008`, `PD-003` | Bộ lọc MiniFASNet từ chối $\ge 98\%$ các mẫu tấn công Presentation Attack (ảnh in màu giấy A4, ảnh màn hình smartphone, video phát lại tablet) tại ngưỡng hoạt động $S_{\text{liveness}} \ge 0.85$. | Approved |
| `NFR-SYS-006` | Hệ thống cam kết không thất thoát bất kỳ bản ghi điểm danh nào ($\text{RPO} = 0$) trong tình huống mất kết nối mạng hoặc cúp điện đột ngột. | Reliability | Must | `INF-011`, `PD-004`, `SRS-008` | CSDL cục bộ SQLite chế độ WAL với `PRAGMA synchronous=FULL`; 100% bản ghi ngoại tuyến được gửi bù nguyên vẹn lên máy chủ Backend khi mạng phục hồi mà không bị trùng lặp. | Approved |
| `NFR-SYS-007` | Toàn bộ vector sinh trắc học 512D lưu trữ phải được mã hóa chuẩn FIPS AES-256-GCM; không lưu ảnh thô trên bất kỳ thiết bị đĩa nào. | Security | Must | `SRS-001`, `PD-005` | Master Key (`STK-034`) nạp độc lập từ biến môi trường; 100% vector trong CSDL có IV 12 bytes và Auth Tag 16 bytes; không có file ảnh camera nào được ghi đĩa; bộ nhớ RAM giải mã tại Kiosk được cô lập và bảo vệ bằng chính sách OS hardening và an toàn vật lý trạm biên. | Approved |
| `NFR-SYS-008` | Độ sẵn sàng dịch vụ (High Availability) của máy chủ Backend phải đạt tối thiểu $99.9\%$ trong giờ làm việc hành chính (07:00 - 19:00). | Availability | Must | `SRS-009`, `STK-035` | Endpoint `/actuator/health` (`STK-035`) phản hồi HTTP 200 trong $\le 200\text{ ms}$; tổng thời gian gián đoạn dịch vụ tích lũy không vượt quá $\le 15.8\text{ phút/tháng}$ (tương ứng 0.1% của 264 giờ hành chính trong tháng); năng lực phục vụ đồng thời tối thiểu 50 trạm Kiosk trong khung giờ cao điểm đầu ca (50-100 RPS ổn định với p99 $\le 200\text{ ms}$); Kiosk tự động thử lại kết nối camera và mạng mỗi 3 giây. | Approved |
| `NFR-SYS-009` | Ứng dụng Kiosk phải vận hành bền bỉ liên tục 8 giờ làm việc với độ biến thiên dung lượng RAM tiêu thụ không vượt quá $10\%$ (Zero Memory Leak). | Reliability | Must | `PD-002`, `INF-006` | Bộ nhớ đệm khung hình video OpenCV/NumPy và đối tượng QImage được giải phóng triệt để ngay sau mỗi chu kỳ suy luận; tiến trình Kiosk giữ mức RAM ổn định $< 800\text{ MB}$; kiểm chứng bằng công cụ profiling bộ nhớ qua kịch bản chạy thử nghiệm 8 giờ liên tục với 2,000 lượt nhận diện. | Approved |
| `NFR-SYS-010` | Giao diện Web Portal phải tuân thủ chuẩn Web Content Accessibility Guidelines (WCAG 2.2 Level AA) và thiết kế Responsive đa kích thước màn hình. | Usability | Should | `INF-003` | Hỗ trợ hiển thị tối ưu trên màn hình desktop, laptop và tablet với tỷ lệ tương phản màu chữ $\ge 4.5:1$; kiểm chứng tự động bằng công cụ kiểm tra trợ năng trên toàn bộ các trang Cổng Web đạt điểm số $\ge 90/100$ và 0 lỗi nghiêm trọng; hỗ trợ thao tác qua bàn phím và chế độ Dark/Light mode. | Approved |

---

## 3. Solution Design Elements (Thiết kế Hiện thực Hóa Giải pháp Chức năng & Phi chức năng)

### 3.1. Solution Components (Thành phần Kỹ thuật Giải pháp)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SOL-SYS-001` | Bộ Thu nhận Luồng Video Độ trễ thấp | Khởi tạo kết nối camera quang học UVC với driver DirectShow, thu nhận mảng khung hình NumPy liên tục $\ge 15\text{ FPS}$. | `STK-001`, `STK-003` | `FR-SYS-001`, `NFR-SYS-002` | `DD-SYS-001` | Accepted |
| `SOL-SYS-002` | Bộ Phát hiện & Kiểm chuẩn Góc Euler | Nạp mô hình ONNX YuNet, định vị khuôn mặt $\ge 120\times 120\text{ px}$, đo 5 điểm mốc và kiểm tra góc quay Yaw, Pitch, Roll $\le 15^\circ$. | `STK-004`, `STK-005` | `FR-SYS-001`, `NFR-SYS-004` | `DD-SYS-001` | Accepted |
| `SOL-SYS-003` | Cổng Căn chỉnh Oval & Độ Ổn định Thời gian | Tính toán độ lệch tâm ($\le 120\text{ px}$), tỷ lệ diện tích ($25\% - 75\%$), độ sắc nét Laplacian ($\ge 30$) và duy trì ổn định liên tục $0.5 - 1.0\text{ s}$. | `STK-001`, `STK-003` | `FR-SYS-001` | `DD-SYS-005` | Accepted |
| `SOL-SYS-004` | Cổng Lọc Thực thể sống Thụ động (PAD Gate) | Crop vùng mặt mở rộng tỷ lệ 1.5x, đưa qua mô hình MiniFASNet tính điểm $S_{\text{liveness}} \ge 0.85$ để chặn ảnh in 2D và video. | `STK-004`, `STK-006` | `FR-SYS-002`, `NFR-SYS-005` | `DD-SYS-003`, `DD-SYS-027` | Accepted |
| `SOL-SYS-005` | Bộ Trích xuất Vector Đặc trưng 512D | Căn chỉnh hình học Affine 5 điểm mốc về chuẩn $112\times 112\text{ px}$, chạy ArcFace MobileFaceNet sinh vector 512D chuẩn hóa L2 Norm. | `STK-004`, `STK-007` | `FR-SYS-003` | `DD-SYS-001` | Accepted |
| `SOL-SYS-006` | Bộ So khớp Danh mục Ma trận RAM | Duy trì ma trận $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32`, tính tích vô hướng Cosine $\vec{s} = \vec{u} \cdot \mathbf{M}^T$ qua NumPy trong thời gian $< 2\text{ ms}$. | `STK-008` | `FR-SYS-003`, `NFR-SYS-001` | `DD-SYS-001` | Accepted |
| `SOL-SYS-007` | Bộ Kiểm soát Cooldown Hai lớp (Dual-layer) | Lớp 1 tại biên (Kiosk RAM đếm lùi 120s); Lớp 2 tại máy chủ (Caffeine Cache với TTL 120s khóa `empId_punchDate`). | `STK-008`, `STK-013` | `FR-SYS-005` | `DD-SYS-006` | Accepted |
| `SOL-SYS-008` | Bộ Quản lý Hàng đợi Bền vững SQLite WAL | Mở kết nối `kiosk_local.db` chế độ WAL với `PRAGMA synchronous=FULL`, thực thi `enqueue_punch()`, `fetch_unsynced_batch()`, `mark_synced()` không nghẽn. | `STK-009` | `FR-SYS-006`, `NFR-SYS-006` | `DD-SYS-002` | Accepted |
| `SOL-SYS-009` | Bộ Mã hóa Sinh trắc học AES-256-GCM | Sử dụng thư viện bảo mật mã hóa vector 512D (2048 bytes gốc) thành ciphertext kèm IV ngẫu nhiên 12 bytes và Auth Tag 16 bytes. | `STK-015` | `FR-SYS-010`, `SRS-001` | `DD-SYS-003`, `DD-SYS-016` | Accepted |
| `SOL-SYS-010` | Tác vụ Tiêu hủy Dữ liệu Định kỳ 20 ngày | Lên lịch Spring `@Scheduled(cron = "0 0 1 * * ?")` quét CSDL xóa sạch bản ghi `biometric_templates` của nhân viên thôi việc quá 20 ngày. | `STK-010`, `STK-011` | `FR-SYS-011`, `SRS-003` | `DD-SYS-003` | Accepted |
| `SOL-SYS-011` | Bộ Tính toán Ca kíp & Thời gian Ân hạn | Đối soát mốc giờ chấm công với cấu hình `shifts`, cộng 15 phút ân hạn (`grace_period_minutes`) để phân loại `ON_TIME / LATE`. | `STK-011` | `FR-SYS-012` | `DD-SYS-007` | Accepted |
| `SOL-SYS-012` | Bộ Điều phối Sự kiện Đẩy WebSocket STOMP | Tích hợp Spring WebSocket Message Broker, đóng gói và phát tán thông điệp JSON tới các topic `/topic/live-attendance` và `/topic/kiosk-gallery`. | `STK-014` | `FR-SYS-013`, `FR-SYS-014` | `DD-SYS-004`, `DD-SYS-014` | Accepted |
| `SOL-SYS-013` | Bộ Xuất Báo cáo Excel Chống Formula Injection | Sử dụng Apache POI sinh file `.xlsx`, tự động kiểm tra và chèn ký tự `'` trước các chuỗi bắt đầu bằng `=`, `+`, `-`, `@`. | `STK-011` | `FR-SYS-016`, `SRS-007` | `DD-SYS-008` | Accepted |
| `SOL-SYS-019` | Bộ Quản lý Vòng đời Thông tin Xác thực Tài khoản | Sinh mật khẩu tạm ngẫu nhiên khi HR khởi tạo hồ sơ nhân sự, cho phép nhân viên tự đổi mật khẩu bất kỳ lúc nào (không bắt buộc, không chặn nghiệp vụ), băm một chiều mã PIN dự phòng và xác thực PIN phía máy chủ kèm khóa 15 phút sau 5 lần nhập sai. | `STK-011`, `STK-015` | `FR-SYS-017`, `SRS-005` | `DD-SYS-017` | Accepted |
| `SOL-SYS-020` | Bộ Quản lý Ca kíp & Phân ca Nhân sự | Quản lý danh mục ca (tạo/sửa/vô hiệu hóa, ân hạn 0-60 phút), phân ca theo khoảng hiệu lực, kiểm tra chồng lấn khoảng trước khi ghi, và cung cấp ca đang hiệu lực cho bộ tính công khi chấm công; nhân viên chưa được phân ca nhận trạng thái `ANOMALOUS`. | `STK-011`, `STK-012` | `FR-SYS-018`, `FR-SYS-012` | `DD-SYS-018`, `DD-SYS-007` | Accepted |
| `SOL-SYS-021` | Bộ Tra cứu Kiểm toán & Tuân thủ Dữ liệu | Cung cấp truy vấn chỉ đọc trên `audit_logs` (lọc theo thời gian, tác nhân, loại hành vi) và trên dữ liệu Consent/lịch trình tiêu hủy sinh trắc; phân quyền `ADMIN` cho nhật ký kiểm toán và role `DPO` chỉ đọc cho dữ liệu tuân thủ. | `STK-011` | `FR-SYS-019`, `SRS-010` | `DD-SYS-019` | Accepted |
| `SOL-SYS-022` | Bộ Quản lý Trạm Kiosk | Đăng ký trạm kèm sinh Secret Token hiển thị một lần, băm một chiều trước khi lưu, đổi token, vô hiệu hóa trạm và cập nhật `last_ping_at` theo mỗi lượt xác thực hợp lệ. | `STK-011`, `STK-012` | `FR-SYS-020`, `SRS-009` | `DD-SYS-020` | Accepted |
| `SOL-SYS-023` | Bộ Xử lý Đơn Giải trình Công | Tiếp nhận đơn giải trình kèm bản ghi điểm danh liên quan, kiểm tra quyền sở hữu của người nộp, chuyển HR duyệt/từ chối và khi duyệt thì điều chỉnh bản ghi công trong cùng giao dịch kèm nhật ký kiểm toán. | `STK-011` | `FR-SYS-016`, `FR-SYS-012` | `DD-SYS-021` | Accepted |
| `SOL-SYS-024` | Bộ Khởi tạo Hệ thống An toàn | Tạo tài khoản quản trị đầu tiên trên CSDL trống qua cấu hình bootstrap có kiểm soát (biến môi trường hoặc CLI), dùng được ngay bằng mật khẩu tạm (đổi được bất kỳ lúc nào) và tự vô hiệu hóa sau khi hoàn tất; không có mật khẩu mặc định trong mã nguồn. | `STK-011` | `FR-SYS-021`, `SRS-005` | `DD-SYS-022` | Accepted |
| `SOL-SYS-025` | Bộ Khôi phục Thông tin Xác thực | Cấp lại mật khẩu tạm mới khi nhân viên quên mật khẩu (thu hồi mật khẩu tạm cũ, thu hồi mọi phiên) và cho phép nhân viên tự đặt lại PIN sau khi xác thực bằng mật khẩu của chính mình. | `STK-011` | `FR-SYS-022`, `FR-SYS-017`, `SRS-005` | `DD-SYS-023` | Accepted |
| `SOL-SYS-026` | Bộ Quản lý Vòng đời Phiên & Thu hồi Quyền truy cập | Lưu refresh token dạng băm một chiều kèm hạn dùng; xử lý đăng xuất, thu hồi toàn bộ token khi đổi/cấp lại mật khẩu hoặc khi tài khoản bị `TERMINATED`/`SUSPENDED`; từ chối access token của tài khoản không còn hoạt động. | `STK-011`, `STK-012` | `FR-SYS-023`, `SRS-006` | `DD-SYS-026` | Accepted |
| `SOL-SYS-027` | Bộ Chốt Kỳ công & Khoá Điều chỉnh | Quản lý kỳ công theo tháng với trạng thái `OPEN`/`LOCKED`; từ chối nộp/duyệt đơn và mọi điều chỉnh công thuộc kỳ đã chốt; cho phép ADMIN mở lại kèm lý do và ghi audit. | `STK-011`, `STK-012` | `FR-SYS-024`, `FR-SYS-016` | `DD-SYS-024` | Accepted |
| `SOL-SYS-028` | Bộ Rút Đồng thuận & Quyền Chủ thể Dữ liệu | Ghi vết rút Informed Consent bất biến, vô hiệu hóa điểm danh bằng khuôn mặt (chuyển sang PIN) và kích hoạt tiêu hủy dữ liệu sinh trắc trong 7 ngày; tiếp nhận và phản hồi yêu cầu truy cập/chỉnh sửa dữ liệu cá nhân qua DPO. | `STK-011` | `FR-SYS-025`, `FR-SYS-007`, `SRS-003` | `DD-SYS-025` | Accepted |
| `SOL-SYS-029` | Bộ Quản lý Vòng đời Quyền Quản trị | Gán và thu hồi role `HR_MANAGER`/`DPO`/`ADMIN` kèm audit giá trị trước/sau; chặn thu hồi hoặc hạ cấp tài khoản `ADMIN` đang hoạt động cuối cùng; thu hồi role trong cùng thao tác vô hiệu hóa nhân sự. | `STK-011` | `FR-SYS-026`, `SRS-006` | `DD-SYS-019` | Accepted |
| `SOL-SYS-030` | Bộ Thông báo Trong ứng dụng | Sinh thông báo theo sự kiện vòng đời (tài khoản được tạo, phiên bị thu hồi, PIN bị khóa, đơn giải trình được xử lý, Consent bị rút, kỳ công đã chốt) và gửi tới đúng tác nhân qua kênh trong ứng dụng; không dùng email/SMS trong phạm vi MVP. | `STK-011`, `STK-017` | `FR-SYS-027` | `DD-SYS-025` | Accepted |
| `SOL-SYS-031` | Bộ Tra cứu Lịch sử Công Tự phục vụ | Truy vấn lịch sử chấm công của chính nhân viên đang đăng nhập theo tháng, kèm trạng thái công và số phút đi muộn; chỉ trả dữ liệu thuộc người gọi. | `STK-011` | `FR-SYS-028` | `DD-SYS-019` | Accepted |

---

### 3.2. Quality & Resilience Mechanisms (Cơ chế Đảm bảo Chất lượng)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SOL-SYS-014` | Cơ chế Miễn nhiễm Rò rỉ Bộ nhớ (Zero Memory Leak) | Giải phóng mảng khung hình `np.ndarray` và ma trận điểm ảnh trung gian ngay sau mỗi chu kỳ suy luận; duy trì RAM ứng dụng Kiosk $\le 600\text{ MB}$ sau 10,000 khung hình. | `STK-001`, `STK-008` | `NFR-SYS-009` | `DD-SYS-001` | Accepted |
| `SOL-SYS-015` | Cơ chế Tách biệt Luồng Giao diện (GUI Thread Isolation) | Đẩy toàn bộ tác vụ đọc camera, suy luận ONNX, đọc/ghi SQLite và gọi HTTP/STOMP sang worker `QThread` độc lập; đảm bảo luồng giao diện QML render $\ge 30\text{ FPS}$ không giật lag. | `STK-001`, `STK-002` | `NFR-SYS-002` | `DD-SYS-001` | Accepted |
| `SOL-SYS-016` | Cơ chế Tự Phục hồi Camera Ngoại vi (Camera Auto-Reconnect) | Phát hiện mất tín hiệu video liên tiếp 10 frames hoặc camera bị ngắt kết nối; kích hoạt vòng lặp kết nối lại mỗi 3 giây mà không làm sập tiến trình Kiosk. | `STK-001`, `STK-003` | `NFR-SYS-008` | `DD-SYS-001` | Accepted |

---

### 3.3. Behavior & Processing Flows (Luồng Xử lý Nghiệp vụ & Trạng thái)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SOL-SYS-017` | Luồng Điều phối Pipeline AI Biên Tuần tự | Thu nhận frame $\rightarrow$ YuNet phát hiện & kiểm tra góc $\le 15^\circ$ $\rightarrow$ Căn chỉnh Oval $0.5 - 1.0\text{ s}$ $\rightarrow$ MiniFASNet $S_{\text{liveness}} \ge 0.85$ $\rightarrow$ ArcFace 512D $\rightarrow$ Cosine Matcher $\ge 0.50$ trong $\le 350\text{ ms}$. | `SOL-SYS-001`, `SOL-SYS-002`, `SOL-SYS-003`, `SOL-SYS-004`, `SOL-SYS-005`, `SOL-SYS-006` | `FR-SYS-001`, `FR-SYS-002`, `FR-SYS-003`, `NFR-SYS-001` | `DD-SYS-001`, `DD-SYS-005` | Accepted |
| `SOL-SYS-018` | Luồng Kiểm soát Quét Trùng Hai Lớp (Dual Cooldown) | Khi nhận diện thành công: Lớp 1 kiểm tra mảng bộ nhớ Kiosk $\ge 120\text{ s}$; Lớp 2 gửi Backend kiểm tra Caffeine Cache (TTL 120s khóa `empId_punchDate`), từ chối nếu vi phạm. | `SOL-SYS-007` | `FR-SYS-005` | `DD-SYS-006` | Accepted |

---

## 4. Decisions (Quyết định Thiết kế Liên quan)

Mọi quyết định thiết kế kiến trúc và giải pháp liên quan đến yêu cầu chức năng và phi chức năng hệ thống được quản lý tập trung tại [System Spec Core (spec.md)](spec.md#5-system-design-decisions-quyết-định-thiết-kế-cấp-hệ-thống):
* `DD-SYS-001`: Suy luận AI thuần CPU AVX2 tại trạm biên Kiosk.
* `DD-SYS-002`: SQLite WAL `PRAGMA synchronous = FULL` bảo đảm $\text{RPO} = 0$.
* `DD-SYS-003`: Mã hóa AES-256-GCM bảo vệ vector tĩnh với Master Key môi trường.
* `DD-SYS-004`: WebSocket STOMP đẩy dữ liệu thời gian thực hai chiều.
* `DD-SYS-005`: Giữ ổn định khuôn mặt 0.5s–1.0s trong khung Oval.
* `DD-SYS-006`: Cơ chế chống quẹt trùng Cooldown 120s hai lớp (Kiosk RAM + Backend Cache).
* `DD-SYS-007`: Thời gian ân hạn ca kíp mặc định 15 phút.
* `DD-SYS-008`: Thoát ký tự chống Formula Injection khi xuất file Excel.
* `DD-SYS-016`: Tách riêng IV (12 bytes) và Auth Tag (16 bytes) trong CSDL.
* `DD-SYS-017`: Cấp mật khẩu tạm ban đầu, đổi mật khẩu tự nguyện, thẩm định PIN tập trung tại Backend.
* `DD-SYS-018`: Kiểm tra chồng lấn phân ca ở tầng nghiệp vụ có khóa theo nhân viên.
* `DD-SYS-019`: Tra cứu kiểm toán chỉ đọc và phân tách quyền `DPO`.
* `DD-SYS-020`: Quản lý Secret Token trạm Kiosk bảo vệ bằng NTFS ACL và DPAPI.
* `DD-SYS-021`: Duyệt đơn giải trình cập nhật bản ghi công và audit log trong cùng một giao dịch.
* `DD-SYS-022`: Bootstrap an toàn tài khoản quản trị đầu tiên với mật khẩu $\ge 12$ ký tự.
* `DD-SYS-023`: Cấp lại mật khẩu tạm và tự đặt lại mã PIN không phụ thuộc kênh ngoài SMS/Email.
* `DD-SYS-024`: Chốt kỳ công theo tháng bằng trạng thái `LOCKED`.
* `DD-SYS-025`: Rút Consent vô hiệu hóa điểm danh khuôn mặt và kích hoạt tiêu hủy vector trong 7 ngày.
* `DD-SYS-026`: Lưu Refresh Token băm một chiều trong CSDL, thu hồi tức thì theo tài khoản.
* `DD-SYS-027`: Khóa ngưỡng liveness: vận hành $S_{\text{liveness}} \ge 0.85$, nạp mẫu $S_{\text{liveness}} \ge 0.90$ (Safety Margin $+5\%$).
* `DD-SYS-028`: Chính sách quản trị vòng đời và xoay vòng khóa Master Key AES-256-GCM.

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Hiệu chuẩn Ngưỡng Cosine Matcher (Decision 3 — ĐÃ GIẢI QUYẾT)**: Ngưỡng Cosine Similarity mặc định được cấu hình là $0.50$ (`FR-SYS-003`, `NFR-SYS-004`). Ngưỡng kiểm tra thực thể sống liveness được khóa thống nhất: ngưỡng vận hành $S_{\text{liveness}} \ge 0.85$ (`FR-SYS-002`, `NFR-SYS-005`) và nạp mẫu $S_{\text{liveness}} \ge 0.90$ (`FR-SYS-009`, `DD-SYS-027`) với Safety Margin $+5\%$, bảo đảm mẫu khuôn mặt nạp vào hệ thống đạt chuẩn chất lượng cao và không bị từ chối khi điểm danh.
* **Ngân sách Chu kỳ Nhận diện Chuẩn (Decision 4 — ĐÃ GIẢI QUYẾT)**: Khóa thống nhất định nghĩa ngân sách thời gian xử lý: chu kỳ pipeline tính toán biên $\le 350\text{ ms}$ (`NFR-SYS-001`) tính từ khung hình cuối cùng được chấp nhận đến khi hiển thị kết quả, và tổng thời gian face-to-dashboard $\le 1.2\text{ s}$ (`NFR-SYS-003`). Khoảng thời gian nhân viên định vị và giữ mặt ổn định trước camera (0.5 - 1.0 giây) thuộc trải nghiệm định vị người dùng (UX positioning time), tách biệt với chu kỳ tính toán suy luận.
* **Tải Mục tiêu Máy chủ Backend (Decision 9 — ĐÃ GIẢI QUYẾT)**: Tải thiết kế của Backend đáp ứng đồng thời tối thiểu 50 trạm Kiosk gửi bản ghi đồng thời trong giờ cao điểm đầu ca (tương đương 50-100 RPS ổn định với p99 $\le 200\text{ ms}$ được tích hợp đo lường trực tiếp tại `NFR-SYS-008`). Định mức 500 RPS là chỉ tiêu kiểm thử ngập tải (Stress Testing) tại Backend cấp phân hệ (`NFR-BE-002`).
* **Kiến trúc Xác thực PIN Dự phòng & Ranh giới Ngoại tuyến (Decision 8 & PD-008 — ĐÃ GIẢI QUYẾT)**: Khung vận hành ngoại tuyến $\text{RPO} = 0$ (`SRS-008`, `NFR-SYS-006`) bảo đảm 100% cho phương thức nhận diện khuôn mặt chính yếu. Phương thức PIN dự phòng (`FR-SYS-004`, `PD-008`) bắt buộc thẩm định trực tuyến tại Backend để ngăn chặn việc lưu trữ hash PIN tại bộ nhớ đĩa trạm biên. Trong kịch bản sự cố kép hy hữu (đồng thời mất mạng VÀ lỗi sinh trắc học), nhân viên sử dụng quy trình nộp đơn giải trình công bổ sung trên Cổng Web sau khi mạng phục hồi (`FR-SYS-016`) hoặc HR ghi nhận thủ công.
* **Cơ chế Giảm thiểu Sai lệch Sinh trắc học theo Nhân khẩu học (NIST IR 8271 — ĐÃ GIẢI QUYẾT)**: Nhận thức rõ hiện tượng sai lệch nhận diện theo độ tuổi, giới tính và sắc thái da, hệ thống áp dụng cơ chế xác thực kép qua bàn phím số PIN dự phòng (`FR-SYS-004`, `PD-008`) để bảo đảm không có nhân viên nào bị tước quyền ghi nhận công khi xảy ra lỗi sinh trắc học, đồng thời chuẩn hóa bộ dataset kiểm thử nghiệm thu đa dạng lứa tuổi tại `system-docs/plans/test-plan.md`.
* **Phạm vi Trạng thái Chấm công Chuẩn**: Hệ thống chuẩn hóa 4 trạng thái chấm công duy nhất trong phạm vi phát hành: `ON_TIME`, `LATE`, `EARLY_LEAVE`, `ANOMALOUS` (`FR-SYS-012`, `FR-SYS-018`, `FR-SYS-028`). Nghiệp vụ tính giờ làm thêm (tăng ca / overtime) và quản lý lịch ngày lễ nằm ngoài phạm vi phát hành hiện tại và được theo dõi xử lý ở các phiên bản tiếp theo qua issue #42.
