# Opportunity Brief: Enterprise Touchless Face Attendance System (FAS)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Opportunity Brief  
> **Primary Owner Skill:** `interview-me`, `idea-refine`  
> **Canonical Destination Path:** `docs/discovery/opportunity-brief.md`  
> **Status:** Committed  
> **Last updated:** 2026-11-08  

---

## 1. Problem Framing (Required)

### The Observed Problem
Các doanh nghiệp và cơ sở sản xuất tại Việt Nam đang gặp tổn thất lớn từ gian lận chấm công (quẹt thẻ hộ - *Buddy Punching*) và độ trễ nghiêm trọng khi sử dụng máy chấm công vân tay truyền thống (dễ bẩn, hỏng mắt đọc, ùn tắc vào giờ cao điểm ca sáng).  
Hơn nữa, khi các doanh nghiệp thử nghiệm giải pháp điểm danh khuôn mặt bằng cách cho nhân viên "tự chụp ảnh chân dung tải lên" (*Client Photo Upload*), hệ thống phát sinh 3 rủi ro chí mạng:
1. **Lạm dụng ảnh giả (Presentation Attack / Spoofing)**: Sử dụng ảnh in 2D, ảnh làm đẹp từ smartphone, hoặc video phát lại để chấm công gian lận.
2. **Suy giảm chất lượng nhận diện**: Ảnh tải lên không đồng nhất về góc chụp, ánh sáng và tiêu cự khiến vector đặc trưng ArcFace bị sai lệch, tỷ lệ từ chối sai (FRR) tăng vọt.
3. **Rủi ro Pháp lý nghiêm trọng**: Việc thu thập ảnh sinh trắc học bừa bãi vi phạm **Nghị định 13/2023/NĐ-CP** và **Luật Bảo vệ dữ liệu cá nhân 2025** (Luật số 91/2025/QH15) do thiếu cam kết minh bạch (*Informed Consent*) và thiếu cơ chế tiêu hủy an toàn.

### Who Has This Problem?
- **Nhân viên (1,000+ người)**: Bực bội vì ùn tắc quẹt vân tay giờ cao điểm; lo ngại dữ liệu khuôn mặt cá nhân bị lộ lọt hoặc chia sẻ trái phép.
- **Quản trị viên Nhân sự (HR Manager)**: Tốn hàng chục giờ mỗi tháng đối soát dữ liệu chấm công thủ công; không có cái nhìn thời gian thực về sĩ số nhân sự có mặt; bị động khi giải quyết khiếu nại chấm công muộn.
- **Data Protection Officer (DPO) / Pháp chế Doanh nghiệp**: Chịu áp lực pháp lý kiểm toán tuân thủ Nghị định 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân 2025; rủi ro bị xử phạt nếu không có cơ chế Hard Delete vector sinh trắc sau 20 ngày nhân viên nghỉ việc hoặc khi nhân viên rút Consent.
- **Quản trị viên Hệ thống (Admin / IT Lead)**: Cần hệ thống trạm Kiosk độc lập, chống chịu mất mạng diện rộng ($\text{RPO} = 0$), tự động đồng bộ khi có kết nối trở lại.

### Cost of Inaction
- Thiệt hại ước tính $2-4\%$ tổng quỹ lương do hiện tượng quẹt thẻ hộ và gian lận giờ công.
- Ùn tắc cửa ra vào gây trễ giờ làm từ $5-15$ phút mỗi ca.
- Mức xử phạt hành chính lên tới hàng trăm triệu đồng theo Luật Bảo vệ dữ liệu cá nhân nếu để rò rỉ dữ liệu sinh trắc học hoặc không lưu giữ hồ sơ cam kết điện tử.

---

## 2. Evidence & Research Findings (Required)

### Qualitative Signals
- Khảo sát thực tế tại các xưởng sản xuất cho thấy mắt đọc vân tay đạt tỷ lệ lỗi lên tới $18\%$ đối với công nhân làm việc trong môi trường bụi, ẩm hoặc tay dính dầu mỡ.
- Nhân viên phàn nàn việc phải chạm tay vào thiết bị dùng chung sau dịch bệnh.
- Phòng Nhân sự yêu cầu màn hình Live Dashboard cập nhật tức thời để quản lý sĩ số ca làm việc mà không cần bấm F5 tải lại trang.

### Quantitative Data
- Thời gian quẹt vân tay trung bình: $2.5 - 4.0\text{ giây/người}$. Mục tiêu khuôn mặt không chạm: $\le 350\text{ ms/người}$.
- Tần suất mất mạng nội bộ tại các phân xưởng xa trung tâm: trung bình $1 - 3$ sự cố/tháng. Hệ thống bắt buộc phải duy trì điểm danh ngoại tuyến 100%.

---

## 3. Proposed Value Proposition & Hypothesis (Required)

### Core Value Proposition
> **Dành cho** các doanh nghiệp có quy mô từ 500 đến 1,000+ nhân sự, **những người đang** chịu rủi ro gian lận chấm công và ùn tắc tại cửa ra vào, **Hệ thống Chấm công Khuôn mặt FAS cung cấp** giải pháp trạm Kiosk điểm danh không chạm tốc độ cao ($\le 350\text{ ms}$), chống giả mạo thụ động MiniFASNet ($S \ge 0.85$), lưu đệm ngoại tuyến SQLite WAL tự phục hồi, mã hóa vector ArcFace 512D tập trung bằng AES-256-GCM, và tuân thủ 100% Luật Bảo vệ dữ liệu cá nhân 2025.

### Key Hypotheses
| # | Giả thuyết Cốt lõi | Phương pháp Kiểm chứng | Tiêu chí Thành công | Trạng thái |
|---|---|---|---|---|
| H1 | Điểm danh không chạm trên CPU đạt thời gian xử lý $\le 350\text{ ms}$ cho tập 1,000 nhân sự | Benchmark ma trận RAM NumPy BLAS kết hợp YuNet & ArcFace | $T_{\text{punch}} \le 350\text{ ms}$, CPU load $< 40\%$ | **Validated** |
| H2 | Chống giả mạo MiniFASNet loại bỏ triệt để ảnh in 2D và video replay | Thử nghiệm tấn công Print/Replay Attack đa điều kiện sáng | Tỷ lệ chặn giả mạo $\ge 98\%$, $S_{\text{liveness}} \ge 0.85$ | **Validated** |
| H3 | Quy trình Guided Multi-Pose trực tiếp tại Kiosk nâng cao độ chính xác khi mặt nghiêng tự nhiên | So sánh 1-template vs 3-template matching (Front, Left, Right) | $\text{FNIR} \le 5.0\%$ tại $\text{FPIR} \le 0.1\%$ | **Validated** |
| H4 | Hàng đợi SQLite WAL tự động gửi bù không làm mất bản ghi nào khi mất mạng | Rút cáp mạng LAN trong 2 giờ, thực hiện 200 lượt quẹt | $\text{RPO} = 0$, $100\%$ bản ghi đồng bộ về server | **Validated** |

---

## 4. Initial Scope Boundaries (Required)

### In Scope
- Trạm Kiosk điểm danh độc lập: Giao diện cảm ứng dọc 9:16 ($1080\times 1920\text{ px}$), camera góc rộng, phát hiện khuôn mặt YuNet, chống giả mạo MiniFASNet, trích xuất ArcFace 512D, hàng đợi ngoại tuyến SQLite WAL, bàn phím ảo PIN Pad dự phòng.
- Cổng Web quản trị & Người dùng: React 19 SPA, ký cam kết điện tử Informed Consent, cấp mã OTP nạp mẫu 48h, Live Dashboard thời gian thực qua WebSocket STOMP, quản lý ca kíp, giải trình công, xuất báo cáo an toàn.
- Máy chủ trung tâm (Backend): Spring Boot 3.4.x, CSDL PostgreSQL 16, mã hóa vector AES-256-GCM, đối soát ca kíp tự động, cron job quét tiêu hủy vector sinh trắc học sau 20 ngày.

### Explicitly Out of Scope
- Điểm danh qua ứng dụng di động cá nhân (Mobile App Punching) — loại trừ để đảm bảo tính hiện diện vật lý tại cơ sở.
- Tiếp nhận ảnh chân dung tải lên từ máy khách (Zero-Photo-Upload policy).

---

## 5. Decision Gate & Sign-off (Required)
- **Quyết định:** Cam kết triển khai toàn diện theo `workflows/full-sdlc.md`.
- **Handoff Target:** `docs/prd.md` và `docs/architecture.md`.

