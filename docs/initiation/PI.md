# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
> - **Mã tài liệu**: PI-FAS-01
> - **Tên tài liệu**: Khởi tạo dự án (Project Initiation - PI)
> - **Phiên bản**: 3.2
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: nvdung
> - **Ngày hiệu lực**: 2026-09-29
> - **Tài liệu liên quan**: [README.md](../README.md), [PC.md](PC.md), [PP.md](../planning/PP.md), [SRS.md](../requirements/SRS.md), [DDS.md](../design/DDS.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-09-25)*: Khởi tạo tài liệu Project Initiation Document (PID).
>   - *v2.0 (2026-09-29)*: Nâng cấp đề án kiến trúc phân tán 3 phân hệ độc lập.
>   - *v3.0 (2026-09-29)*: Bổ sung khung quản trị an toàn dữ liệu và tuân thủ Luật 2025.
>   - *v3.1 (2026-09-29)*: Chuẩn hóa theo khung SDLC chuẩn hóa (Mục 1 đến Mục 5).
>   - *v3.2 (2026-09-29)*: Hiệu chỉnh chính xác nguồn lực dự án cá nhân (1 người: nvdung) và phần cứng Laptop cá nhân.

---

## PI — Khởi tạo dự án (Project Initiation)

**1. Định hướng dự án**

- 1.1. Mục tiêu dự án
  - Nghiên cứu, thiết kế và phát triển toàn diện Hệ thống Chấm công bằng Nhận diện Khuôn mặt (Face Attendance System - FAS) tự động, không tiếp xúc, hoạt động đa nền tảng dựa trên kiến trúc phân tán 3 phân hệ độc lập.
  - Tối ưu hóa pipeline thị giác máy tính và học sâu (Edge AI) chạy mượt mà trực tiếp trên bộ vi xử lý CPU của Laptop cá nhân tiêu chuẩn (không bắt buộc trang bị GPU rời chuyên dụng), đạt tốc độ nhận diện trọn vòng tại biên $\le 350\text{ ms}$.
  - Chặn đứng 100% các hình thức gian lận chấm công hộ (buddy punching) và các cuộc tấn công giả mạo 2D (ảnh in màu, video phát lại) thông qua module kiểm tra thực thể sống thụ động (Passive Anti-Spoofing Gate).
  - Cung cấp cơ chế phòng vệ ngoại tuyến (Offline Resilient Queue) đảm bảo việc điểm danh diễn ra liên tục, không thất thoát dữ liệu ($\text{RPO} = 0$) ngay cả khi đứt kết nối mạng nội bộ.
  - Thiết lập chuẩn mực bảo mật cấp doanh nghiệp, tuân thủ nghiêm ngặt Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 của Việt Nam: Mã hóa vector mẫu bằng AES-256-GCM, ký Informed Consent số và tự động tiêu hủy vĩnh viễn dữ liệu sinh trắc học sau 20 ngày kể từ khi nhân viên thôi việc.

- 1.2. Kết quả / sản phẩm chính
  - **Phân hệ Trạm Điểm danh Desktop (`app/kiosk-app`)**: Ứng dụng Desktop Python 3.10+ (PySide6, OpenCV, YuNet, ArcFace MobileFaceNet 512D, MiniFASNet, SQLite WAL, Bàn phím số ảo PIN dự phòng).
  - **Phân hệ Máy chủ Doanh nghiệp (`app/backend-service`)**: Dịch vụ máy chủ Java 21 LTS / Spring Boot 4.x (REST API OpenAPI 3.0, CSDL PostgreSQL 16+, Caffeine Cache 120s Cooldown, Spring WebSocket STOMP Broker, Mã hóa AES-256-GCM, Cron job tự động xóa dữ liệu sau 20 ngày).
  - **Phân hệ Cổng Web Quản trị & Tự phục vụ (`app/web-portal`)**: Ứng dụng Web ReactJS 18+ (TypeScript 5+, Vite, Tailwind CSS, STOMPjs, Live Monitoring Dashboard, Quản lý Nhân sự, Cấu hình ca kíp, Duyệt đơn giải trình, Cổng tự phục vụ Onboarding OTP, Kết xuất báo cáo chống Formula Injection).
  - **Bộ tài liệu kỹ thuật vòng đời phát triển phần mềm (SDLC)**: Trọn bộ 8 tài liệu chuẩn mực gồm PC, PI, PP, SRS, DDS, BP, TP, DP.

- 1.3. Phạm vi cấp cao
  - **Trong phạm vi (In-Scope)**:
    - Thu nhận luồng video thời gian thực từ camera USB / webcam Laptop, phát hiện khuôn mặt, căn chỉnh góc chuẩn và kiểm tra thực thể sống thụ động tại biên.
    - So khớp định danh 1:N với bộ nhớ đệm RAM Gallery Cache trên trạm Kiosk.
    - Chấm công dự phòng bằng bàn phím số ảo PIN khi gặp sự cố khuôn mặt hoặc camera.
    - Cơ chế ghi đệm ngoại tuyến SQLite WAL và tự động đồng bộ bù hai chiều khi có mạng.
    - Quản lý hồ sơ nhân sự, phân ca làm việc, tính toán số phút đi muộn / về sớm với thời gian ân hạn 15 phút.
    - Cơ chế chống quét trùng lặp trong khoảng thời gian Cooldown 120 giây.
    - Ký thỏa thuận số Informed Consent và cấp phát mã OTP/QR đăng ký mẫu tại trạm Kiosk với thời hạn 48 giờ.
    - Mã hóa an toàn vector đặc trưng khuôn mặt chuẩn AES-256-GCM ở trạng thái lưu trữ.
    - Tiến trình ngầm tự động tiêu hủy dữ liệu sinh trắc học của nhân viên đã thôi việc sau 20 ngày.
    - Giám sát trực quan thời gian thực qua Web Dashboard bằng giao thức WebSocket STOMP.
    - Xuất báo cáo bảng công định dạng Excel (.xlsx) và CSV có cơ chế chống Formula Injection.
  - **Ngoài phạm vi (Out-of-Scope)**:
    - Không xây dựng module tính lương chi tiết (Payroll) bao gồm các chính sách bảo hiểm xã hội, thuế thu nhập cá nhân phức tạp (chỉ cung cấp dữ liệu công tổng hợp qua API/Excel).
    - Không thực hiện bài toán nhận diện đám đông từ xa qua camera an ninh CCTV diện rộng ngoài trời.
    - Không tích hợp điều khiển cơ điện tử phần cứng rào chắn tự động (Turnstile / Access Control Relays) trong phiên bản hiện tại.
    - Không phát triển ứng dụng di động native độc lập cho hệ điều hành iOS / Android (sử dụng giao diện Web Responsive trên thiết bị di động).

- 1.4. Tiêu chí thành công
  - **`KPI-01` (Độ chính xác môi trường kiểm soát)**: $\text{TAR} \ge 95\%$ tại $\text{FAR}_{1:N} \le 0.1\%$ trong điều kiện độ rọi sáng $300 - 500\text{ lux}$, góc nghiêng mặt $\le 15^\circ$, cự ly đứng $0.5 - 1.5\text{ m}$.
  - **`KPI-02` (Độ chính xác môi trường thực tế)**: $\text{TAR} \ge 88\%$ tại $\text{FAR}_{1:N} \le 0.5\%$ với ánh sáng tự nhiên, góc mặt $\le 30^\circ$, người dùng đeo kính cận trong suốt.
  - **`KPI-03` (Khả năng chống giả mạo Liveness PAD)**: Đạt chuẩn quốc tế ISO/IEC 30107-3 với $\text{APCER} \le 10\%$ và $\text{BPCER} \le 2\%$ trên tập mẫu tấn công ảnh in màu và video phát lại màn hình điện thoại.
  - **`KPI-04` (Độ trễ toàn trình hệ thống)**: Tổng thời gian từ khi khuôn mặt xuất hiện trước camera đến khi sự kiện chấm công hiển thị trên Web Dashboard $\le 1.2\text{ giây}$ (đo tại phân vị p95).
  - **`KPI-05` (Tốc độ khởi động & nạp RAM Kiosk)**: Đồng bộ toàn bộ 100 vector mẫu từ Backend về nạp vào RAM Kiosk hoàn tất trong $\le 3.0\text{ giây}$.
  - **`KPI-06` (Độ bền bỉ & Khả năng vận hành ngoại tuyến)**: Trạm Kiosk vận hành liên tục 8 giờ làm việc; tỷ lệ mất mát bản ghi khi đứt mạng đạt $0\%$ ($\text{RPO} = 0$), tỷ lệ rò rỉ bộ nhớ RAM $< 10\%$.

---

**2. Business Case & Quyết định thực hiện**

- 2.1. Cơ sở kinh doanh và nhu cầu
  - **Thất thoát ngân sách từ gian lận chấm công**: Thống kê thực tế cho thấy hành vi chấm công hộ (buddy punching) thông qua việc quẹt thẻ từ hoặc chia sẻ mã PIN gây thất thoát từ 2% đến 5% tổng ngân sách chi trả tiền lương hàng năm của doanh nghiệp.
  - **Sự cố và rủi ro từ phương pháp truyền thống**: 62% công nhân và nhân viên tại các môi trường sản xuất gặp tình trạng đầu đọc vân tay không nhận diện được do ngón tay bị chai sần, bám bụi bẩn, dầu mồ hôi hoặc thời tiết hanh khô. Điều này dẫn đến tình trạng khiếu nại, cọ xát và tiêu tốn từ 24 đến 36 giờ làm việc mỗi tháng của bộ phận nhân sự để đối soát dữ liệu thủ công.
  - **Rủi ro pháp lý cấp bách**: Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 (hiệu lực từ 01/01/2026) quy định dữ liệu sinh trắc học là dữ liệu cá nhân nhạy cảm, đặt ra các chế tài xử phạt hành chính nghiêm khắc (lên đến 5% tổng doanh thu) đối với các hành vi thu thập không có sự đồng thuận hoặc lưu trữ không an toàn. Doanh nghiệp bắt buộc phải có giải pháp đáp ứng trọn vẹn quy định này.

- 2.2. Giá trị & lợi ích kỳ vọng
  - **Lợi ích định lượng (Tangible Benefits)**:
    - Tiết kiệm 100% thời gian tổng hợp, đối chiếu dữ liệu bảng công cuối tháng của bộ phận nhân sự.
    - Loại bỏ hoàn toàn 100% tình trạng chấm công hộ và gian lận giờ làm việc.
    - Giảm chi phí đầu tư thiết bị phần cứng từ 15 - 30 triệu đồng/máy (đối với máy chấm công khuôn mặt 3D nhập khẩu) xuống mức tối thiểu (sử dụng Laptop cá nhân sẵn có kết hợp webcam hoặc camera USB thông dụng).
  - **Lợi ích định tính (Intangible Benefits)**:
    - Nâng cao tính chuyên nghiệp, minh bạch và kỷ luật lao động trong toàn bộ tổ chức.
    - Đảm bảo an toàn vệ sinh tối đa nhờ trải nghiệm điểm danh không tiếp xúc (touchless).
    - Tạo dựng niềm tin cho người lao động thông qua cơ chế tự phục vụ minh bạch và cam kết bảo vệ dữ liệu cá nhân tuyệt đối.

- 2.3. Chi phí & nguồn lực sơ bộ
  - **Chi phí bản quyền phần mềm**: 0 VNĐ ($100\%$ nền tảng công nghệ sử dụng giấy phép mã nguồn mở miễn phí: Python, OpenJDK 21 LTS, Spring Boot 4.x, ReactJS, PostgreSQL, OpenCV, ONNX Runtime).
  - **Chi phí phần cứng triển khai**: Tận dụng Laptop cá nhân có sẵn (cấu hình CPU Intel Core i5-12450H, 16GB RAM) kết hợp webcam tích hợp sẵn hoặc bổ sung camera USB Full HD 1080p có chi phí 0 VNĐ (sử dụng 100% phần cứng sẵn có).
  - **Nguồn lực nhân sự phát triển**: **01 người duy nhất — nvdung** (Dự án cá nhân), trực tiếp đảm nhiệm toàn diện vai trò Full-stack & Applied AI Developer từ nghiên cứu thuật toán, phát triển phần mềm đến kiểm thử và đóng gói.

- 2.4. Tính khả thi và phương án được lựa chọn
  - **Khả thi về kỹ thuật**: Đã được chứng minh qua thực nghiệm trên phần cứng Laptop baseline (Intel Core i5-12450H), tổng thời gian thực thi trọn vòng của pipeline AI (YuNet + MiniFASNet + ArcFace MobileFaceNet) chỉ mất ~80 - 100 ms/frame, hoàn toàn đáp ứng yêu cầu xử lý thời gian thực mà không cần card màn hình rời.
  - **Khả thi về kinh tế**: Chi phí đầu tư ban đầu và chi phí bảo trì định kỳ tiệm cận 0 VNĐ nhờ làm chủ 100% mã nguồn và kiến trúc mở.
  - **Phương án kiến trúc được lựa chọn**: Lựa chọn phương án kiến trúc phân tán 3 phân hệ độc lập (3-Tier Architecture) tổ chức theo mô hình Monorepo tại `/app`. Cả 3 phân hệ có thể chạy đồng thời trên Laptop cá nhân phục vụ phát triển, thử nghiệm và đóng gói bằng Docker Compose.

---

**3. Tổ chức & Quản trị**

- 3.1. Vai trò chủ chốt
  - **Chủ sở hữu & Kỹ sư Độc lập (Solo Full-Stack & AI Developer — nvdung)**:
    - Là người duy nhất chịu trách nhiệm toàn diện về dự án: Thiết kế kiến trúc tổng thể, nghiên cứu và tối ưu hóa mô hình AI biên (`app/kiosk-app`), lập trình máy chủ trung tâm (`app/backend-service`), phát triển Cổng thông tin Web (`app/web-portal`), kiểm thử tự động CI/CD và viết toàn bộ tài liệu kỹ thuật.
  - **Các vai trò giả định / tham chiếu nghiệp vụ (Simulated Stakeholders)**:
    - *Project Sponsor (Góc độ Quản trị Doanh nghiệp)*: Đóng vai trò định hướng bài toán kinh doanh, kiểm soát phạm vi và tiêu chí thành công của sản phẩm.
    - *HR Representative (Góc độ Nghiệp vụ Nhân sự)*: Đóng vai trò xác lập các ca làm việc mẫu, quy tắc tính phút đi muộn/về sớm và tiêu chí phê duyệt giải trình công.
    - *Data Protection Officer - DPO (Góc độ Pháp lý)*: Đóng vai trò hệ quy chiếu chuẩn mực nhằm đảm bảo mọi luồng dữ liệu đều tuân thủ chặt chẽ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15.

- 3.2. Quyền hạn & trách nhiệm
  - **nvdung (Toàn quyền Kỹ thuật & Quản trị)**:
    - Toàn quyền quyết định kiến trúc, lựa chọn công nghệ, thiết kế API Contract và tổ chức mã nguồn.
    - Chịu trách nhiệm trực tiếp về độ tin cậy của mã nguồn, độ bao phủ kiểm thử (Unit Tests) và đảm bảo các chỉ số KPI hiệu năng (`KPI-01` đến `KPI-06`).
    - Tự đánh giá và phê duyệt các Pull Request trước khi tích hợp vào nhánh chính `main`.
    - Chủ động rà soát an toàn dữ liệu, đảm bảo mã hóa AES-256-GCM và tự động xóa dữ liệu sau 20 ngày đúng theo quy chuẩn pháp luật.

- 3.3. Cơ chế ra quyết định & phê duyệt
  - **Nguyên tắc Upstream-First**: Mọi quyết định thay đổi về cấu trúc CSDL hoặc API Contract phải được nvdung cập nhật trên tài liệu đặc tả ([SRS.md](../requirements/SRS.md), [DDS.md](../design/DDS.md), [api-contracts.md](../design/api-contracts.md)) trước khi sửa code thực thi.
  - **Cơ chế Phê duyệt Tự chủ (Solo Approval)**: nvdung đóng vai trò là người phê duyệt kỹ thuật duy nhất, căn cứ trên kết quả chạy tự động của bộ kiểm thử (Automated Tests) và số đo benchmark thực tế trên Laptop.

- 3.4. Cơ chế báo cáo & escalation
  - **Theo dõi tiến độ**: nvdung tự quản lý công việc và mốc thời gian thông qua Git commit history, Kanban Board cá nhân và file tài liệu kế hoạch dự án ([PP.md](../planning/PP.md)).
  - **Xử lý sự cố (Issue Resolution)**: Mọi vấn đề kỹ thuật phát sinh trong quá trình phát triển (vấn đề thuật toán, tương thích thư viện, nghẽn hiệu năng) được nvdung tự nghiên cứu, kiểm thử giải pháp thay thế và ghi nhận vào sổ theo dõi rủi ro kỹ thuật.

---

**4. Định hướng thực hiện**

- 4.1. Phương pháp / cách tiếp cận phát triển
  - Áp dụng phương pháp luận phát triển phần mềm linh hoạt (Agile / Scrum) kết hợp chặt chẽ với phương pháp **Spec-Driven Development** (Phát triển định hướng theo tài liệu đặc tả).
  - **Nguyên tắc Upstream-First**: Mọi thay đổi về cấu trúc trường dữ liệu, quy tắc nghiệp vụ hoặc giao thức truyền thông đều phải được cập nhật, chuẩn hóa và phê duyệt trên hệ thống tài liệu đặc tả ([SRS.md](../requirements/SRS.md), [DDS.md](../design/DDS.md), [api-contracts.md](../design/api-contracts.md)) trước khi viết code thực thi.
  - Triển khai chiến lược tự động hóa kiểm thử liên tục (CI/CD Pipeline): Tự động kiểm tra chất lượng mã nguồn (Linting), chạy bộ kiểm thử đơn vị (Unit Tests) và đóng gói container Docker cho từng phân hệ sau mỗi commit.

- 4.2. Giai đoạn & mốc chính
  - **Mốc M1 (Tuần 1 - 2) - Nền tảng Biên (Edge AI & Kiosk Foundation)**:
    - Hoàn thành bộ tài liệu bối cảnh và yêu cầu kỹ thuật (PC, PI, SRS).
    - Xây dựng hoàn chỉnh pipeline AI thị giác máy tính trên Python: YuNet Face Detection, căn chỉnh 5 điểm mốc, MiniFASNet Liveness Gate, trích xuất ArcFace 512D.
    - Hoàn thiện giao diện Desktop Kiosk cơ bản bằng PySide6 và tích hợp bàn phím ảo PIN dự phòng.
  - **Mốc M2 (Tuần 3 - 4) - Lõi Máy chủ & CSDL (Enterprise Backend & Security Core)**:
    - Hoàn thành thiết kế CSDL PostgreSQL và các file cấu trúc Flyway Migration.
    - Phát triển hệ thống REST API Spring Boot 4.x: Xác thực JWT/RBAC, logic ca kíp, bộ đệm Cooldown 120 giây.
    - Triển khai mã hóa vector mẫu sinh trắc học AES-256-GCM và tiến trình tự động xóa dữ liệu định kỳ sau 20 ngày theo Luật 2025.
  - **Mốc M3 (Tuần 5 - 6) - Cổng Quản trị & Tích hợp Thời gian thực (Web Portal & Real-time Broadcast)**:
    - Phát triển phân hệ Web Portal bằng ReactJS 18+ và TypeScript: Màn hình Live Monitoring Dashboard, quản lý nhân sự, phân ca làm việc, phê duyệt giải trình công.
    - Thiết lập hạ tầng WebSocket STOMP Message Broker trên Spring Boot và tích hợp thư viện `@stomp/stompjs` trên Web.
    - Hoàn thiện luồng tự phục vụ Onboarding OTP và modal ký cam kết Informed Consent.
  - **Mốc M4 (Tuần 7 - 8) - Tích hợp Toàn diện & Đo lường Hiệu năng (End-to-End Integration & Benchmark)**:
    - Tích hợp trọn vẹn luồng dữ liệu 3 phân hệ: Kiosk Desktop $\leftrightarrow$ Spring Boot Backend $\leftrightarrow$ React Web Portal.
    - Kiểm thử cơ chế ngoại tuyến Offline Resilient Queue trên SQLite WAL và tự động đồng bộ bù.
    - Thực hiện bài kiểm thử đo lường các chỉ số KPI hiệu năng (KPI-01 đến KPI-06) trên cấu hình Laptop baseline.
  - **Giai đoạn Dự phòng & Hoàn thiện (Tuần 9 - 10) - Buffer & Finalization**:
    - Kiểm thử tải, tối ưu hóa hiệu năng và vá các lỗi phát sinh.
    - Đóng gói toàn bộ sản phẩm bằng Docker Compose (cho phép chạy đồng thời cả 3 dịch vụ trên 1 máy Laptop).
    - Bàn giao và nghiệm thu trọn bộ 8 tài liệu SDLC chuẩn hóa.

- 4.3. Nguồn lực chính
  - **Nhân sự thực hiện**: **01 người duy nhất — nvdung** (Full-Stack & Applied AI Developer).
  - **Công cụ phát triển & Môi trường**: Visual Studio Code (IDE duy nhất), Git, Docker Desktop, Postman, PgAdmin, DBeaver.
  - **Hạ tầng phần cứng thử nghiệm (Laptop cá nhân baseline)**:
    - Thiết bị: Laptop cá nhân tiêu chuẩn
    - CPU: 12th Gen Intel(R) Core(TM) i5-12450H (8 cores/12 threads), GPU NVIDIA GeForce RTX 3050 Ti Laptop GPU 4GB
    - RAM: 16.0 GB DDR4/DDR5
    - Hệ điều hành: Windows 11 64-bit (x64)
    - Camera: Webcam tích hợp sẵn của Laptop và/hoặc Camera USB Full HD 1080p cắm ngoài.

- 4.4. Rủi ro, giả định & phụ thuộc quan trọng
  - **Ma trận Rủi ro Ban đầu & Biện pháp Giảm thiểu**:
    - *Rủi ro `R-01`: Mất kết nối mạng nội bộ giữa Kiosk và Backend*: Kiosk kích hoạt cơ chế Offline Mode, lưu đệm vào SQLite WAL cục bộ với timestamp thực tế tại biên; luồng ngầm định kỳ 10 giây ping kiểm tra và tự động gửi gói tin batch sync khi mạng phục hồi.
    - *Rủi ro `R-02`: Nghẽn hiệu năng CPU Laptop do chạy đồng thời nhiều mô hình AI*: Sử dụng mô hình lightweight tối ưu cho CPU (MiniFASNet, ArcFace MobileFaceNet), tích hợp thuật toán theo vết khuôn mặt (Centroid Face Tracking) để chỉ thực thi suy luận 1 lần duy nhất cho mỗi đối tượng khi đạt trạng thái ổn định.
    - *Rủi ro `R-03`: Nguy cơ rò rỉ dữ liệu sinh trắc học trên kênh truyền hoặc trong CSDL*: Toàn bộ giao tiếp qua mạng bắt buộc mã hóa qua HTTPS/TLS 1.3 và WSS; toàn bộ vector khuôn mặt trong PostgreSQL được mã hóa chuẩn FIPS AES-256-GCM với khóa Master Key quản lý độc lập ngoài CSDL.
    - *Rủi ro `R-04`: Lệch pha dữ liệu khuôn mặt giữa Backend và các trạm Kiosk biên*: Kiosk tự động tải toàn bộ danh sách vector hợp lệ khi khởi động; Backend phát sóng sự kiện STOMP tới topic `/topic/kiosk-gallery` mỗi khi có nhân viên mới đăng ký hoặc bị vô hiệu hóa để Kiosk cập nhật RAM ngay lập tức.
    - *Rủi ro `R-05`: Tỷ lệ từ chối sai (False Rejection) gây ùn ứ*: Tích hợp bàn phím số ảo PIN dự phòng ngay trên màn hình Kiosk (truy cập nhanh qua phím tắt `F2`) để nhân viên điểm danh thay thế mà không làm nghẽn luồng di chuyển.
  - **Giả định then chốt**: Laptop cá nhân đảm bảo đủ tài nguyên RAM (16GB) để chạy song song cả 3 phân hệ (Kiosk, Backend, Web); camera được chiếu sáng ổn định trong ngưỡng 300 – 500 lux; người dùng nhìn thẳng vào camera.
  - **Phụ thuộc quan trọng**: Bộ trọng số mô hình thị giác máy tính mã nguồn mở đã được kiểm chứng (YuNet, MiniFASNet, ArcFace); tính ổn định của hệ thống driver camera hệ điều hành (DirectShow trên Windows / V4L2 trên Linux).

---

**5. Quyết định khởi động**

- 5.1. Quyết định / ủy quyền khởi động
  - **Căn cứ đề án**: Dựa trên kết quả khảo sát bối cảnh, nghiên cứu tính khả thi kỹ thuật và mục tiêu xây dựng một giải pháp hoàn chỉnh từ biên đến đám mây, nvdung chính thức khởi động triển khai dự án cá nhân **`face-attendance-system`** từ ngày 29/09/2026.
  - **Mục tiêu ủy quyền**: Phát triển hoàn thiện hệ thống phần mềm 3 phân hệ tích hợp theo đúng các yêu cầu kỹ thuật và chỉ số hiệu năng đã cam kết.

- 5.2. Quyền hạn được cấp
  - nvdung toàn quyền quyết định về mặt kỹ thuật, công nghệ, kiến trúc, phân bổ thời gian và tài nguyên phần cứng Laptop cá nhân phục vụ phát triển dự án.
  - Được toàn quyền thiết lập môi trường CSDL, triển khai thử nghiệm trên mạng cục bộ và sử dụng các dữ liệu hình ảnh mẫu phục vụ quá trình phát triển và kiểm thử.

- 5.3. Phạm vi baseline ban đầu
  - **Phạm vi kiến trúc baseline**: Cố định cấu trúc phân tán 3 phân hệ độc lập tổ chức trong thư mục `/app` gồm `app/kiosk-app` (Python), `app/backend-service` (Java 21 LTS / Spring Boot 4.x), và `app/web-portal` (ReactJS), cùng vận hành trên môi trường Laptop cá nhân.
  - **Bộ công nghệ cốt lõi baseline**: Python 3.10+, PySide6, OpenCV, ONNX Runtime CPU, Java OpenJDK 21 LTS, Spring Boot 4.x, PostgreSQL 16+, React 18+, Vite, TypeScript 5+, Tailwind CSS.
  - **Bộ chỉ số hiệu năng baseline**: Bộ chỉ số KPI từ `KPI-01` đến `KPI-06` là căn cứ kỹ thuật duy nhất để đánh giá nghiệm thu sản phẩm tại các mốc kiểm thử và hoàn thiện.
  - **Quy trình thay đổi baseline**: Mọi điều chỉnh về kiến trúc hoặc chỉ số KPI được nvdung cập nhật trực tiếp vào hệ thống tài liệu đặc tả trước khi sửa đổi mã nguồn.

