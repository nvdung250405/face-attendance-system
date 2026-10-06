---
title: Đặc tả Yêu cầu Chức năng & Phi chức năng Hệ thống (FR/NFR)
version: 1.1
status: Approved
owner: Requirements Lead
---

# FR/NFR SPECS — Đặc tả Yêu cầu Chức năng & Phi chức năng Hệ thống

Đặc tả danh mục 28 yêu cầu chức năng cốt lõi (`FR-SYS-`) và 10 yêu cầu phi chức năng đo lường được (`NFR-SYS-`) của toàn bộ hệ thống Monorepo, áp dụng kỹ thuật phân tích yêu cầu từ vòng đời của 4 tác nhân tương tác với hệ thống (`ACT-001` đến `ACT-004`), gắn liền với tiêu chí nghiệm thu định lượng (Acceptance Criteria) theo chuẩn `sdlc-docs.md` v3.0.

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

### 1.5. Ma trận Ánh xạ Vòng đời Tác nhân sang Yêu cầu Kỹ thuật (Actor Lifecycle Requirements Matrix)

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

## 2. Functional Requirements (Yêu cầu Chức năng Hệ thống)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-SYS-001` | Hệ thống phải thu nhận luồng video liên tục từ camera quang học và phát hiện khuôn mặt thời gian thực bằng mô hình nhẹ YuNet. | Vision / Kiosk | Must | `PD-002`, `ACT-001` | Tốc độ xử lý luồng video $\ge 15\text{ FPS}$ (khuyến nghị $\ge 24\text{ FPS}$); phát hiện khuôn mặt kích thước $\ge 120\times 120\text{ px}$; trả về tọa độ bounding box và 5 điểm mốc giải phẫu khuôn mặt trong $\le 20\text{ ms}$ trên CPU. | Approved |
| `FR-SYS-002` | Hệ thống phải kiểm tra thực thể sống thụ động (Passive Liveness) bằng mô hình MiniFASNet để loại bỏ ảnh in 2D và video phát lại. | Vision / Security | Must | `PD-003`, `INF-008`, `ACT-001` | Điểm số liveness $S_{\text{liveness}} \ge 0.85$; tuân thủ chuẩn ISO/IEC 30107-3 với sai số chấp nhận tấn công $\text{APCER} \le 2.0\%$ (chặn $\ge 98\%$ các cuộc tấn công Presentation Attack ảnh in và màn hình) và sai số từ chối người thật $\text{BPCER} \le 5.0\%$; thời gian suy luận $\le 30\text{ ms}$ trên CPU. | Approved |
| `FR-SYS-003` | Hệ thống phải trích xuất vector đặc trưng 512 chiều chuẩn hóa L2 Norm qua ArcFace và so khớp Cosine 1:N với ma trận RAM tại trạm Kiosk. | Vision / Identity | Must | `PD-002`, `INF-007`, `ACT-001` | Ngưỡng Cosine Similarity $\ge 0.50$; thời gian so khớp ma trận 1,000 nhân sự $< 2\text{ ms}$; đạt chuẩn ISO/IEC 19795-1 với $\text{FNIR} \le 5.0\%$ tại $\text{FPIR} \le 0.1\%$ (tương đương $\text{FAR} \le 10^{-6} = 0.0001\%$ trên mỗi cặp so khớp độc lập với $N = 1,000$). | Approved |
| `FR-SYS-004` | Hệ thống phải cung cấp bàn phím số ảo PIN dự phòng trên màn hình cảm ứng để nhân viên điểm danh khi gặp sự cố sinh trắc học hoặc đã rút Informed Consent. | Fallback / UX | Should | `PD-008`, `INF-012`, `ACT-001` | Nhập mã PIN 6 số cá nhân; gọi thẩm định tập trung phía máy chủ Backend và ghi nhận điểm danh `VERIFICATION_PIN`; tự động khóa bàn phím PIN tại trạm Kiosk tối thiểu 15 phút sau 5 lần nhập sai liên tiếp để ngăn chặn brute-force. | Approved |
| `FR-SYS-005` | Hệ thống phải áp dụng cơ chế Cooldown chống quét trùng lặp trong khoảng thời gian 120 giây cho cùng một nhân viên. | Business Rule | Should | `INF-001`, `ACT-001` | Từ chối ghi nhận lượt quẹt tiếp theo của cùng 1 nhân viên trong vòng 120 giây kể từ lần chấm công thành công trước đó; giao diện hiển thị thông báo thân thiện "Bạn đã chấm công, vui lòng không quẹt lại". | Approved |
| `FR-SYS-006` | Hệ thống phải lưu trữ đệm các lượt quẹt vào CSDL cục bộ SQLite chế độ WAL khi mất mạng và tự động đồng bộ bù khi có mạng lại. | Resiliency | Must | `PD-004`, `INF-011`, `ACT-001` | Cam kết không thất thoát dữ liệu ($\text{RPO} = 0$); khi có kết nối trở lại, background worker tự động gửi bù theo lô tối đa 50 bản ghi/request về Backend thành công 100% không trùng lặp. | Approved |
| `FR-SYS-007` | Hệ thống phải cung cấp quy trình ký văn bản thỏa thuận Informed Consent điện tử trước khi cho phép thu thập và kích hoạt dữ liệu khuôn mặt. | Compliance | Must | `PD-005`, `ACT-001`, `ACT-004` | Nhân viên tích chọn đồng ý điều khoản theo Luật 91/2025/QH15 trên Web Portal; lưu vết mốc thời gian, IP và User-Agent vào bảng `consent_audit_logs`; chỉ cho phép sinh OTP Onboarding khi đã có Consent hợp lệ. | Approved |
| `FR-SYS-008` | Hệ thống phải sinh mã kích hoạt Onboarding OTP 6 chữ số có hiệu lực giới hạn 48 giờ để nhân viên mang ra trạm Kiosk tự nạp khuôn mặt. | Enrollment | Must | `PD-007`, `FR-SYS-007`, `ACT-001` | Mã OTP gồm 6 chữ số ngẫu nhiên; mã băm SHA-256 lưu trong bảng `enrollment_otps`; tự hủy sau 48 giờ hoặc ngay sau khi nạp mặt thành công; từ chối cấp OTP nếu chưa ký Consent. | Approved |
| `FR-SYS-009` | Hệ thống phải thực hiện quy trình tự nạp mẫu khuôn mặt 3 bước trực tiếp trên camera Kiosk: kiểm chuẩn ảnh, chụp liên tiếp 3 ảnh đạt chuẩn và nạp vector. | Enrollment / UX | Must | `PD-007`, `FR-SYS-008`, `ACT-001` | Bước 1 xác minh OTP 6 số; Bước 2 tự động chụp 3 ảnh chuẩn (Laplacian độ nét $\ge 30$, điểm sống $S_{\text{liveness}} \ge 0.60$, góc nghiêng pose $\le 15^\circ$); Bước 3 nạp nóng vector vào RAM Kiosk và đồng bộ mã hóa về Backend. | Approved |
| `FR-SYS-010` | Hệ thống phải mã hóa đối xứng AES-256-GCM ở trạng thái tĩnh cho toàn bộ vector đặc trưng khuôn mặt trước khi lưu vào CSDL PostgreSQL. | Security | Must | `PD-005`, `SRS-001`, `ACT-004` | 100% bản ghi vector trong bảng `biometric_templates` có dạng BYTEA kèm IV 12 bytes và Auth Tag 16 bytes; giải mã thành công qua khóa Master Key (`STK-034`) nạp độc lập từ biến môi trường. | Approved |
| `FR-SYS-011` | Hệ thống phải tự động tiêu hủy vĩnh viễn (Hard Delete) toàn bộ dữ liệu sinh trắc học của nhân viên đã thôi việc sau đúng 20 ngày theo Điều 18 & 19 Luật số 91/2025/QH15. | Compliance | Must | `PD-005`, `SRS-003`, `ACT-004` | Cron job chạy định kỳ 01:00 hàng ngày; xóa sạch bản ghi trong `biometric_templates` của nhân viên có `terminated_date <= CurrentDate - 20 days`; ghi nhật ký kiểm toán bất biến. | Approved |
| `FR-SYS-012` | Hệ thống phải quản lý ca làm việc linh hoạt, hỗ trợ thời gian ân hạn 15 phút và tự động phân loại đi muộn / về sớm. | Business Rule | Must | `ACT-002`, `FR-SYS-018` | Tự động tính số phút đi muộn (nếu check-in sau giờ bắt đầu ca + thời gian ân hạn cấu hình 0-60 phút, mặc định 15 phút) và về sớm; gán nhãn trạng thái chính xác `ON_TIME`, `LATE`, `EARLY_LEAVE` trong bảng công. | Approved |
| `FR-SYS-013` | Hệ thống phải phát sóng sự kiện điểm danh thời gian thực tức thì từ Backend lên Cổng Web qua kênh WebSocket STOMP. | Realtime | Must | `PD-006`, `ACT-002` | Đẩy thông điệp JSON tới topic `/topic/live-attendance`; Web Portal nhận và hiển thị lên Live Dashboard trong vòng $\le 200\text{ ms}$ kể từ khi Backend xử lý xong. | Approved |
| `FR-SYS-014` | Hệ thống phải đồng bộ danh mục vector khuôn mặt mẫu hai chiều giữa Backend và mạng lưới các trạm Kiosk qua WebSocket STOMP. | Realtime Sync | Must | `PD-006`, `ACT-002`, `ACT-003` | Khi có nhân viên mới hoàn tất đăng ký mẫu hoặc bị thôi việc/rút consent, Backend đẩy thông báo tới `/topic/kiosk-gallery`; các trạm Kiosk cập nhật nóng RAM trong $\le 500\text{ ms}$ mà không cần khởi động lại ứng dụng. | Approved |
| `FR-SYS-015` | Hệ thống phải cung cấp màn hình Live Monitoring Dashboard hiển thị sĩ số trực quan, biểu đồ tỷ lệ đúng giờ và nhật ký quẹt thẻ thời gian thực. | Web UX | Must | `ACT-002`, `FR-SYS-013` | Tự động cập nhật không cần reload trang; hiển thị ảnh avatar, họ tên, phòng ban, giờ chấm công, trạng thái đúng giờ/đi muộn với độ trễ cập nhật $< 200\text{ ms}$. | Approved |
| `FR-SYS-016` | Hệ thống phải hỗ trợ gửi/duyệt đơn giải trình công trực tuyến và kết xuất báo cáo Excel bảng công có cơ chế chống Formula Injection. | HR Management | Must | `ACT-001`, `ACT-002`, `INF-003`, `SRS-007` | Nhân viên nộp đơn giải trình trong vòng 30 ngày kèm lý do; HR duyệt/từ chối; xuất file Excel (.xlsx) tự động vô hiệu hóa ký tự chèn công thức macro (`=`, `+`, `-`, `@`) bằng dấu nháy đơn (`'`). | Approved |
| `FR-SYS-017` | Hệ thống phải quản lý vòng đời thông tin xác thực của tài khoản nhân sự: khởi tạo mật khẩu tạm do hệ thống sinh khi HR tạo hồ sơ, cho phép nhân viên tự đổi mật khẩu bất kỳ lúc nào (không bắt buộc), cho phép nhân viên tự thiết lập/đổi mã PIN dự phòng 6 số (băm một chiều) và xác thực mã PIN ở phía máy chủ trước khi ghi nhận điểm danh. | HR Management / Security | Must | `ACT-001`, `ACT-002`, `ACT-003`, `FR-SYS-004`, `SRS-005` | HR tạo hồ sơ nhận mật khẩu tạm hiển thị đúng một lần; nhân viên đăng nhập bằng mật khẩu tạm dùng được ngay mọi chức năng (không có luồng ép đổi mật khẩu); chức năng đổi mật khẩu luôn khả dụng tự nguyện; nhân viên tự đặt mã PIN 6 số (lưu băm BCrypt/Argon2id); Kiosk chỉ ghi nhận điểm danh PIN sau khi Backend thẩm định thành công; sai 5 lần liên tiếp khóa PIN 15 phút. | Approved |
| `FR-SYS-018` | Hệ thống phải quản lý danh mục ca làm việc và phân ca cho nhân sự: HR tạo/sửa/vô hiệu hóa ca (mã ca, giờ bắt đầu/kết thúc, thời gian ân hạn), phân ca theo khoảng ngày hiệu lực và không cho phép hai phân ca chồng lấn thời gian của cùng một nhân viên. | HR Management | Must | `ACT-002`, `FR-SYS-012`, `DATA-SYS-002`, `DATA-SYS-003` | HR tạo được ca thường và ca gãy; phân ca theo `effective_from`/`effective_to`; từ chối (HTTP 409) khi khoảng hiệu lực chồng lấn của cùng nhân viên; ca đang hiệu lực tự động áp dụng khi tính công; bản ghi chấm công của nhân viên chưa được phân ca gán nhãn `ANOMALOUS` để HR xử lý. | Approved |
| `FR-SYS-019` | Hệ thống phải cung cấp khả năng tra cứu chỉ đọc phục vụ kiểm toán và tuân thủ dữ liệu cá nhân: tra cứu nhật ký kiểm toán (`audit_logs`) cho Quản trị viên, tra cứu chữ ký Informed Consent và lịch trình tiêu hủy dữ liệu sinh trắc cho Cán bộ Bảo vệ Dữ liệu. | Compliance / Auditing | Must | `ACT-003`, `ACT-004`, `SRS-010`, `PD-005` | ADMIN tra cứu được audit log theo khoảng thời gian, tác nhân và loại hành vi; role `DPO` chỉ đọc được dữ liệu Consent và lịch trình tiêu hủy, nhận HTTP 403 ở mọi endpoint ghi; không tồn tại giao diện sửa hoặc xóa `audit_logs`. | Approved |
| `FR-SYS-020` | Hệ thống phải quản lý vòng đời trạm Kiosk: đăng ký trạm mới kèm cấp Secret Token hiển thị một lần, đổi token, vô hiệu hóa trạm và giám sát mốc ping gần nhất của từng trạm. | Device Management | Must | `ACT-003`, `API-SYS-019`, `SRS-009` | Secret Token chỉ hiển thị một lần và lưu dạng băm một chiều; trạm bị vô hiệu hóa nhận HTTP 401 ở mọi giao diện Kiosk; ADMIN xem được danh sách trạm kèm `last_ping_at` và trạng thái hoạt động trực tuyến/ngoại tuyến. | Approved |
| `FR-SYS-021` | Hệ thống phải có cơ chế khởi tạo an toàn cho lần triển khai đầu tiên: tạo tài khoản quản trị đầu tiên với mật khẩu tạm (đổi được bất kỳ lúc nào, không bắt buộc), không tồn tại mật khẩu mặc định cố định trong mã nguồn hay kịch bản migration, và cơ chế khởi tạo tự vô hiệu hóa sau khi hoàn tất. | Security / Operations | Must | `ACT-003`, `SRS-005`, `SRS-006` | Lần chạy đầu trên CSDL trống tạo đúng một tài khoản `ADMIN` qua biến môi trường hoặc CLI có kiểm soát; mật khẩu tạm dùng được ngay; gọi lại không tạo thêm tài khoản (idempotent); không có mật khẩu mặc định trong mã nguồn hay script migration. | Approved |
| `FR-SYS-022` | Hệ thống phải hỗ trợ khôi phục thông tin xác thực: cấp lại mật khẩu tạm khi nhân viên quên mật khẩu và cho phép nhân viên đặt lại mã PIN dự phòng khi quên, không phụ thuộc kênh email/SMS. | Security / Support | Must | `ACT-001`, `ACT-002`, `ACT-003`, `FR-SYS-017`, `SRS-005` | HR/ADMIN cấp lại mật khẩu tạm mới hiển thị một lần; mật khẩu cũ hết hiệu lực ngay và mọi phiên cũ bị thu hồi; nhân viên tự đặt lại PIN sau khi xác thực mật khẩu của chính mình thành công. | Approved |
| `FR-SYS-023` | Hệ thống phải quản lý vòng đời phiên làm việc: cho phép đăng xuất và thu hồi tức thì refresh token khi đổi mật khẩu, cấp lại mật khẩu hoặc tài khoản bị vô hiệu hóa. | Security | Must | `ACT-001`, `ACT-002`, `ACT-003`, `SRS-006`, `FR-SYS-017` | Đăng xuất vô hiệu hóa refresh token hiện tại; đổi mật khẩu, cấp lại mật khẩu và chuyển trạng thái `TERMINATED`/`SUSPENDED` lập tức thu hồi 100% refresh token của tài khoản; access token còn hạn bị từ chối khi tài khoản không còn hoạt động; thời hạn access 1h và refresh 7d cấu hình tập trung. | Approved |
| `FR-SYS-024` | Hệ thống phải cho phép HR chốt bảng công theo kỳ tháng và khóa mọi điều chỉnh công thuộc kỳ đã chốt. | HR Management | Must | `ACT-002`, `FR-SYS-016`, `DATA-SYS-014` | Chốt kỳ ghi nhận người chốt và mốc thời gian; sau khi chốt, hệ thống từ chối nộp/duyệt đơn giải trình và mọi điều chỉnh công thuộc kỳ đó (HTTP 409); ADMIN mở lại được kèm lý do và ghi audit; trạng thái chốt hiển thị trên báo cáo và file kết xuất. | Approved |
| `FR-SYS-025` | Hệ thống phải cho phép nhân viên rút lại Informed Consent và thực hiện quyền của chủ thể dữ liệu cá nhân (truy cập, chỉnh sửa) thông qua Cán bộ Bảo vệ Dữ liệu. | Compliance | Must | `ACT-001`, `ACT-004`, `FR-SYS-007`, `SRS-003` | Nhân viên rút Consent trực tuyến; hệ thống ghi vết thời điểm/IP, vô hiệu hóa điểm danh khuôn mặt (chuyển sang phương thức PIN dự phòng) và tiêu hủy dữ liệu sinh trắc trong vòng 7 ngày; nhân viên gửi được yêu cầu truy cập/chỉnh sửa dữ liệu cá nhân; DPO tra cứu được hồ sơ rút Consent. | Approved |
| `FR-SYS-026` | Hệ thống phải quản lý vòng đời quyền quản trị: gán và thu hồi role `HR_MANAGER`/`DPO`/`ADMIN`, ghi audit mọi thay đổi và bảo vệ tài khoản quản trị cuối cùng. | Security / Governance | Must | `ACT-002`, `ACT-003`, `ACT-004`, `SRS-006` | ADMIN gán/thu hồi role cho tài khoản khác và mọi thay đổi được ghi audit kèm giá trị trước/sau; từ chối thu hồi hoặc hạ cấp tài khoản `ADMIN` đang hoạt động cuối cùng (HTTP 409); vô hiệu hóa nhân sự thu hồi role trong cùng thao tác. | Approved |
| `FR-SYS-027` | Hệ thống phải thông báo trong ứng dụng cho đúng tác nhân theo các sự kiện vòng đời: tài khoản được tạo, phiên bị thu hồi, PIN bị khóa, đơn giải trình được xử lý, Consent bị rút và kỳ công đã chốt. | UX / Notification | Should | `ACT-001`, `ACT-002`, `ACT-004` | Thông báo hiển thị trong ứng dụng cho đúng người nhận kèm mốc thời gian và tham chiếu tới đối tượng liên quan; đánh dấu được trạng thái đã đọc; không gửi email/SMS trong phạm vi MVP. | Approved |
| `FR-SYS-028` | Hệ thống phải cho phép nhân viên tự tra cứu lịch sử chấm công của chính mình theo tháng. | Self-service | Must | `ACT-001`, `DATA-SYS-004` | Chỉ trả về dữ liệu của người đang đăng nhập; hỗ trợ tra cứu theo tháng và phân trang; hiển thị trạng thái (`ON_TIME`, `LATE`, `EARLY_LEAVE`, `ANOMALOUS`) kèm số phút đi muộn. | Approved |

---

## 3. Non-functional Requirements (Yêu cầu Phi chức năng Hệ thống)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-SYS-001` | Tổng thời gian chu kỳ tính toán nhận diện toàn trình tại trạm Kiosk (Phát hiện + Liveness + Trích xuất 512D + So khớp RAM) phải đạt $\le 350\text{ ms}$ trên CPU thuần Intel Core i5 / AMD Ryzen 5 phổ thông. | Performance | Must | `INF-006`, `PD-002` | Thời gian chu kỳ tính toán thuần từ khung hình video cuối cùng được chấp nhận đến khi hiển thị kết quả (YuNet $\le 20\text{ ms}$, MiniFASNet $\le 30\text{ ms}$, ArcFace $\le 50\text{ ms}$, Cosine 1:1,000 $\le 2\text{ ms}$, ghi SQLite WAL $\le 20\text{ ms}$) đạt p95 $\le 350\text{ ms}$; định nghĩa này loại trừ thời gian nhân viên căn chỉnh giữ khuôn mặt ổn định trước camera (0.5 - 1.0 giây). | Approved |
| `NFR-SYS-002` | Giao diện Kiosk phải duy trì tốc độ hiển thị luồng video từ camera đạt $\ge 15\text{ FPS}$ (khuyến nghị $\ge 24\text{ FPS}$) liên tục, không giật lag màn hình. | Performance | Must | `INF-006` | Luồng hiển thị PySide6/QML tách biệt đa luồng bất đồng bộ (Worker Thread) với luồng suy luận AI; không bị rớt khung hình hiển thị khi tải nhận diện cao. | Approved |
| `NFR-SYS-003` | Tổng thời gian từ khi khuôn mặt được trạm Kiosk nhận diện thành công đến khi sự kiện chấm công hiển thị trên Web Dashboard phải đạt $\le 1.2\text{ giây}$ (p95). | Performance | Must | `PD-001`, `PD-006` | Chuỗi pipeline phân tán: Kiosk ghi SQLite & gửi REST POST $\le 300\text{ ms} \rightarrow$ Backend tiếp nhận & xử lý $\le 100\text{ ms} \rightarrow$ WebSocket STOMP Broadcast $\le 50\text{ ms} \rightarrow$ Web render $\le 200\text{ ms}$; tổng thời gian face-to-dashboard $\le 1.2\text{ s}$ trên mạng LAN. | Approved |
| `NFR-SYS-004` | Độ chính xác nhận diện sinh trắc học khuôn mặt 1:N phải đạt chuẩn ISO/IEC 19795-1 với tỷ lệ bỏ sót nhận diện sai $\text{FNIR} \le 5.0\%$ tại tỷ lệ chấp nhận sai $\text{FPIR} \le 0.1\%$. | Biometric Accuracy | Must | `INF-007`, `PD-002` | Kiểm thử trên tập dữ liệu chuẩn 1,000 nhân viên với ngưỡng Cosine Similarity $\ge 0.50$ trong điều kiện độ rọi $\ge 150\text{ lux}$; tương đương tỷ lệ chấp nhận sai của cặp độc lập $\text{FAR} \le 10^{-6} = 0.0001\%$ trên mỗi lượt so khớp với $N = 1,000$. | Approved |
| `NFR-SYS-005` | Khả năng phòng chống tấn công giả mạo (PAD) phải đạt tỷ lệ sai số tấn công thành công $\text{APCER} \le 2.0\%$ và tỷ lệ từ chối người thật $\text{BPCER} \le 5.0\%$ theo chuẩn ISO/IEC 30107-3. | Biometric PAD | Must | `INF-008`, `PD-003` | Bộ lọc MiniFASNet từ chối $\ge 98\%$ các mẫu tấn công Presentation Attack (ảnh in màu giấy A4, ảnh màn hình smartphone, video phát lại tablet) tại ngưỡng hoạt động $S_{\text{liveness}} \ge 0.85$. | Approved |
| `NFR-SYS-006` | Hệ thống cam kết không thất thoát bất kỳ bản ghi điểm danh nào ($\text{RPO} = 0$) trong tình huống mất kết nối mạng hoặc cúp điện đột ngột. | Reliability | Must | `INF-011`, `PD-004`, `SRS-008` | CSDL cục bộ SQLite chế độ WAL với `PRAGMA synchronous=FULL`; 100% bản ghi ngoại tuyến được gửi bù nguyên vẹn lên máy chủ Backend khi mạng phục hồi mà không bị trùng lặp. | Approved |
| `NFR-SYS-007` | Toàn bộ vector sinh trắc học 512D lưu trữ phải được mã hóa chuẩn FIPS AES-256-GCM; không lưu ảnh thô trên bất kỳ thiết bị đĩa nào. | Security | Must | `SRS-001`, `PD-005` | Master Key (`STK-034`) nạp độc lập từ biến môi trường; 100% vector trong CSDL có IV 12 bytes và Auth Tag 16 bytes; không có file ảnh camera nào được ghi đĩa; bộ nhớ RAM giải mã tại Kiosk được cô lập và bảo vệ bằng chính sách OS hardening và an toàn vật lý trạm biên. | Approved |
| `NFR-SYS-008` | Độ sẵn sàng dịch vụ (High Availability) của máy chủ Backend phải đạt tối thiểu $99.9\%$ trong giờ làm việc hành chính (07:00 - 19:00). | Availability | Must | `SRS-009`, `STK-035` | Endpoint `/actuator/health` (`STK-035`) phản hồi HTTP 200 trong $\le 200\text{ ms}$; thời gian gián đoạn dịch vụ không vượt quá 43.8 phút/tháng; Kiosk tự động thử lại kết nối camera và mạng mỗi 3 giây. | Approved |
| `NFR-SYS-009` | Ứng dụng Kiosk phải vận hành bền bỉ liên tục 8 giờ làm việc với độ biến thiên dung lượng RAM tiêu thụ không vượt quá $10\%$ (Zero Memory Leak). | Reliability | Must | `PD-002`, `INF-006` | Bộ nhớ đệm khung hình video OpenCV/NumPy và đối tượng QImage được giải phóng triệt để ngay sau mỗi chu kỳ suy luận; tiến trình Kiosk giữ mức RAM ổn định $< 800\text{ MB}$. | Approved |
| `NFR-SYS-010` | Giao diện Web Portal phải tuân thủ chuẩn Web Content Accessibility Guidelines (WCAG 2.2 Level AA) và thiết kế Responsive đa kích thước màn hình. | Usability | Should | `INF-003` | Hỗ trợ hiển thị tối ưu trên màn hình desktop, laptop và tablet với tỷ lệ tương phản màu chữ $\ge 4.5:1$; hỗ trợ đầy đủ thao tác qua phím và chế độ Dark/Light mode. | Approved |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Hiệu chuẩn Ngưỡng Cosine Matcher (Decision 3)**: Ngưỡng Cosine mặc định được cấu hình là $0.50$. Trong trường hợp môi trường thực địa có độ rọi thay đổi hoặc góc đặt camera cận cảnh, ngưỡng có thể được hiệu chuẩn trong dải $0.45 - 0.55$ để cân bằng tối ưu giữa $\text{FPIR}$ và $\text{FNIR}$. Điều kiện resolve: kiểm nghiệm trên tập dữ liệu benchmark tại hiện trường lắp đặt.
* **Ngân sách Chu kỳ Nhận diện Chuẩn (Decision 4)**: Khóa thống nhất định nghĩa ngân sách thời gian xử lý: chu kỳ pipeline tính toán biên $\le 350\text{ ms}$ (`NFR-SYS-001`) tính từ khung hình cuối cùng được chấp nhận đến khi hiển thị kết quả, và tổng thời gian face-to-dashboard $\le 1.2\text{ s}$ (`NFR-SYS-003`). Khoảng thời gian nhân viên định vị và giữ mặt ổn định trước camera (0.5 - 1.0 giây) thuộc trải nghiệm định vị người dùng (UX positioning time), tách biệt với chu kỳ tính toán suy luận.
* **Tải Mục tiêu Máy chủ Backend (Decision 9)**: Tải thiết kế của Backend đáp ứng đồng thời tối thiểu 50 trạm Kiosk gửi bản ghi đồng thời trong giờ cao điểm đầu ca (tương đương 50-100 RPS ổn định với p99 $< 200\text{ ms}$). Mức 500 RPS trong tài liệu cũ là định mức stress test tối đa khi xử lý batch ngoại tuyến, không phải tải hoạt động thường nhật.
* **Cơ chế Giảm thiểu Sai lệch Sinh trắc học theo Nhân khẩu học (Demographic Bias Mitigation / NIST IR 8271)**: Nhận thức rõ hiện tượng sai lệch nhận diện theo độ tuổi, giới tính và sắc thái da, hệ thống áp dụng cơ chế xác thực kép qua bàn phím số PIN dự phòng (`FR-SYS-004`, `PD-008`) để bảo đảm không có nhân viên nào bị tước quyền ghi nhận công khi xảy ra lỗi sinh trắc học, đồng thời chuẩn hóa bộ dataset kiểm thử nghiệm thu đa dạng lứa tuổi tại `system-docs/plans/test-plan.md`.
* **Phạm vi Tăng ca Ngoài MVP**: Trạng thái `OVERTIME` trong `AttendanceStatus` được giữ lại cho giai đoạn sau; **chưa có quy tắc tính hoặc duyệt tăng ca** trong phạm vi phát hành hiện tại nên `FR-SYS-012`/`FR-BE-002` chỉ phân loại `ON_TIME`, `LATE`, `EARLY_LEAVE`. Bổ sung quy tắc tăng ca cần một change request riêng (theo dõi tại issue #42).
* **Lịch Ngày lễ Ngoài MVP**: Hệ thống chưa có lịch ngày lễ/ngày không làm việc; việc tính đi muộn/về sớm áp dụng cho mọi ngày theo ca được phân. Bổ sung lịch ngày lễ cần một change request riêng (theo dõi tại issue #42).

