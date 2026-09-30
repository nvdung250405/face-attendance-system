# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
>
> - **Mã tài liệu**: PC-FAS-01
> - **Tên tài liệu**: Bối cảnh dự án (Project Context - PC)
> - **Phiên bản**: 1.2
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: Hội đồng Kỹ thuật & Quản trị Dự án
> - **Ngày hiệu lực**: 2026-09-29
> - **Tài liệu liên quan**: [README.md](../README.md), [PI.md](PI.md), [PP.md](../planning/PP.md), [SRS.md](../requirements/SRS.md), [DDS.md](../design/DDS.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-09-25)*: Khởi tạo tài liệu nghiên cứu bối cảnh, thực trạng và thị trường.
>   - *v1.1 (2026-09-29)*: Bổ sung khung pháp lý Luật Bảo vệ Dữ liệu Cá nhân 2025 và cấu hình baseline phần cứng.
>   - *v1.2 (2026-09-29)*: Chuẩn hóa toàn bộ nội dung theo khung cấu trúc SDLC chuẩn hóa (Mục 1 đến Mục 4).

---

## PC — Bối cảnh dự án (Project Context)

**1. Tổng quan & Lý do dự án**

- 1.1. Tổng quan dự án / sản phẩm

  - **Tên dự án**: Hệ thống Chấm công bằng Nhận diện Khuôn mặt (Face Attendance System - FAS).
  - **Tên kho mã nguồn (Repository)**: `face-attendance-system`.
  - **Bản chất sản phẩm**: Hệ thống phần mềm doanh nghiệp tích hợp đa nền tảng, tự động hóa toàn bộ quy trình ghi nhận điểm danh nhân sự không tiếp xúc (touchless attendance) thông qua công nghệ Thị giác máy tính (Computer Vision) và Học sâu (Deep Learning) nhận diện khuôn mặt.
  - **Kiến trúc phân hệ (Monorepo tại `/app`)**:
    - `app/kiosk-app`: Ứng dụng Desktop chạy tại biên trên máy trạm Kiosk (Python 3.10+, PySide6, OpenCV, ONNX Runtime CPU, SQLite WAL).
    - `app/backend-service`: Dịch vụ máy chủ trung tâm xử lý nghiệp vụ, xác thực, mã hóa và phân phối sự kiện (Java 21 LTS, Spring Boot 4.x, PostgreSQL 16+, Caffeine Cache, Spring WebSocket STOMP Broker).
    - `app/web-portal`: Cổng thông tin Web dành cho Quản lý Nhân sự (HR Dashboard) và Cổng Tự phục vụ dành cho Nhân viên (ReactJS 18+, Vite, TypeScript 5+, Tailwind CSS, STOMPjs).
  - **Cấu hình phần cứng tham chiếu (Development Baseline Hardware Specs)**:
    - **Thiết bị**: Laptop cá nhân tiêu chuẩn
    - **CPU**: 12th Gen Intel Core i5-12450H (8 nhân / 12 luồng), GPU NVIDIA GeForce RTX 3050 Ti Laptop GPU (4GB VRAM).
    - **Bộ nhớ RAM**: 16.0 GB DDR4/DDR5.
    - **Hệ điều hành**: Windows 11 64-bit (x64) / Ubuntu Linux 22.04 LTS.
    - **Thiết bị ngoại vi**: Webcam tích hợp sẵn của Laptop và/hoặc Camera quang học USB tiêu chuẩn độ phân giải Full HD (1920x1080 @ 30 FPS).
    - **Ý nghĩa kỹ thuật**: Đóng vai trò là hệ quy chiếu phần cứng thực tế (baseline) cho toàn bộ dự án, nhằm đo đạc và tối ưu hóa hiệu năng suy luận AI (CPU on-device inference), đảm bảo hệ thống vận hành mượt mà thời gian thực ngay trên dòng máy tính xách tay (Laptop) phổ thông mà không bắt buộc trang bị GPU rời.
- 1.2. Vấn đề / nhu cầu / cơ hội

  - **Vấn đề thực tế (Pain Points)**:
    - *Gian lận chấm công hộ (Buddy Punching)*: Các hình thức quẹt thẻ từ RFID, nhập mã PIN hoặc quét mã QR tĩnh dễ dàng bị chia sẻ cho đồng nghiệp quẹt hộ, làm thất thoát ngân sách lương doanh nghiệp.
    - *Bất tiện và rủi ro vệ sinh của vân tay*: Đầu đọc vân tay dễ gặp lỗi từ chối khi ngón tay bị chai sần do lao động chân tay, đổ mồ hôi, ướt hoặc thời tiết khô lạnh; đồng thời bề mặt tiếp xúc là nguồn lây nhiễm vi khuẩn tiềm tàng tại các môi trường làm việc đông người.
    - *Ùn tắc giờ cao điểm*: Tốc độ quẹt thẻ/vân tay truyền thống (1 - 3 giây/người) gây ra hiện tượng xếp hàng kéo dài tại cửa ra vào trong khung giờ 07:45 - 08:05 sáng.
    - *Rủi ro tấn công giả mạo (Spoofing Attacks)*: Các hệ thống camera nhận diện khuôn mặt 2D sơ khai dễ bị đánh lừa bởi ảnh in màu chân dung hoặc video phát lại từ màn hình điện thoại thông minh.
    - *Gánh nặng đối soát thủ công của HR*: Cuối mỗi kỳ tính lương, nhân sự phải mất từ 3 - 5 ngày để xuất dữ liệu từ các máy chấm công độc lập, đối soát giải trình quên chấm công và tổng hợp đi muộn/về sớm bằng các file Excel rời rạc.
  - **Nhu cầu cấp thiết**:
    - Doanh nghiệp cần một giải pháp điểm danh tự động, không tiếp xúc, xác thực danh tính tức thì ($< 1\text{ giây}$) với độ chính xác cao.
    - Cần khả năng vận hành độc lập tại biên (Edge AI), không phụ thuộc liên tục vào đường truyền Internet (Offline-first resilient).
    - Cần quy trình tự phục vụ (Self-service Onboarding) trực tiếp tại Kiosk thông qua mã OTP kích hoạt để bảo vệ dữ liệu, thay vì tải ảnh tự do từ Web.
  - **Cơ hội phát triển**:
    - Thị trường công nghệ sinh trắc học và nhận diện khuôn mặt toàn cầu đang tăng trưởng mạnh mẽ với quy mô 9.5 – 10 tỷ USD (2024–2026) và dự kiến vượt 19 tỷ USD vào năm 2030 (tốc độ CAGR ~16.2%).
    - Sự phát triển vượt bậc của các kiến trúc học sâu lightweight (YuNet, ArcFace MobileFaceNet, MiniFASNet) cho phép triển khai mạng nơ-ron chính xác cao trực tiếp trên CPU phổ thông mà không tốn chi phí trang bị GPU chuyên dụng.
- 1.3. Lý do thực hiện dự án

  - Cung cấp một giải pháp chấm công khuôn mặt toàn diện từ biên đến đám mây, giải quyết triệt để vấn đề gian lận và tối ưu hóa 100% thời gian tổng hợp công của bộ phận nhân sự.
  - Xóa bỏ rào cản chi phí đầu tư: Thay thế các thiết bị chấm công chuyên dụng nhập khẩu đắt đỏ (camera 3D/IR có giá từ 15 - 30 triệu đồng/thiết bị) bằng ứng dụng phần mềm chạy trực tiếp trên Laptop cá nhân và camera USB / webcam thông dụng (chi phí 0 VNĐ bằng việc tận dụng toàn bộ webcam và phần cứng sẵn có).
  - Tiên phong tuân thủ đầy đủ khuôn khổ pháp lý về an toàn thông tin và quyền riêng tư sinh trắc học theo Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 của Việt Nam.
- 1.4. Kết quả mong muốn

  - **Về hệ thống**: Bàn giao hoàn chỉnh 3 phân hệ mã nguồn độc lập hoạt động đồng bộ: `app/kiosk-app`, `app/backend-service`, `app/web-portal`.
  - **Về chỉ số hiệu năng (KPI)**:
    - Tốc độ nhận diện trọn vòng tại biên: $\le 350\text{ ms}$ trên CPU Intel Core i5 baseline.
    - Tỷ lệ khung hình hiển thị camera: $\ge 15\text{ FPS}$ (mục tiêu $30\text{ FPS}$).
    - Độ trễ phát sóng dữ liệu WebSocket STOMP lên Web Dashboard: $\le 200\text{ ms}$.
    - Độ chính xác nhận diện: Tỷ lệ chấp nhận sai $\text{FAR} \le 0.01\%$, tỷ lệ từ chối sai $\text{FRR} \le 1.0\%$.
  - **Về an ninh & phòng vệ**:
    - Ngăn chặn 100% các cuộc tấn công giả mạo 2D bằng ảnh in và video phát lại qua module kiểm tra thực thể sống MiniFASNet ($\text{Liveness} \ge 0.85$).
    - Mã hóa an toàn tuyệt đối mảng vector đặc trưng khuôn mặt 512D bằng thuật toán AES-256-GCM chuẩn FIPS.
    - Cơ chế lưu trữ đệm ngoại tuyến SQLite WAL đảm bảo không thất thoát dữ liệu ($\text{RPO} = 0$) khi mất kết nối mạng.
  - **Về tuân thủ pháp lý**: Tự động hóa tiến trình tiêu hủy vĩnh viễn (Hard Delete) dữ liệu mẫu sinh trắc học của nhân viên đã thôi việc sau đúng 20 ngày theo quy định pháp luật.

---

**2. Hiện trạng & Môi trường liên quan**

- 2.1. Hiện trạng hoạt động / quy trình

  - *Quy trình chấm công truyền thống*:
    - Nhân viên xếp hàng lần lượt đặt ngón tay hoặc quẹt thẻ từ RFID tại máy chấm công vật lý đặt tại cửa ra vào.
    - Trường hợp quên thẻ hoặc vân tay không nhận diện được, nhân viên phải ký sổ tay bảo vệ hoặc gửi email giải trình thủ công cho người quản lý trực tiếp.
    - Định kỳ ngày 25 - 28 hàng tháng, chuyên viên nhân sự dùng USB hoặc phần mềm chuyên dụng tải dữ liệu thô từ từng máy chấm công, dùng công thức Excel đối chiếu ca kíp, tổng hợp ngày công và giải quyết các khiếu nại phát sinh.
  - *Hạn chế*: Mất nhiều thời gian, dễ sai sót dữ liệu, không có khả năng giám sát tức thời tình hình quân số đầu giờ làm việc.
- 2.2. Hệ thống và công nghệ hiện có

  - *Hệ thống máy chấm công phần cứng độc lập (Standalone Devices)*: Các thiết bị từ Ronald Jack, ZKTeco sử dụng firmware đóng kín, truyền dữ liệu qua giao thức mạng LAN cũ, phụ thuộc phần mềm desktop đóng gói (như Wise Eye, Mitaco) với giao diện lỗi thời và thiếu khả năng mở rộng.
  - *Các giải pháp HRM đám mây tại Việt Nam (MISA AMIS, FastWork, 1Office)*: Đã tích hợp tính năng chấm công Face ID trên ứng dụng di động (Mobile App kèm định vị GPS), tuy nhiên dễ bị gian lận qua các công cụ giả lập vị trí (Fake GPS), đồng thời việc nhân viên phải móc điện thoại ra thao tác không phù hợp với môi trường nhà máy, công xưởng hoặc khi di chuyển theo nhóm đông.
  - *Các giải pháp Face Recognition chuyên dụng (PX1, FaceX, Tinh Hoa)*: Hiệu năng tốt nhưng yêu cầu đầu tư thiết bị phần cứng camera chuyên dụng đắt đỏ, chi phí bản quyền giấy phép (license) định kỳ cao theo số lượng nhân sự, khó tùy biến sâu theo quy trình nội bộ của doanh nghiệp.
- 2.3. Các bên liên quan chính

  - **Nhân viên (Employees)**: Người trực tiếp thực hiện điểm danh hàng ngày; kỳ vọng thao tác diễn ra tức thì, tự nhiên, không phải dừng lại thao tác phức tạp và dữ liệu khuôn mặt được bảo mật an toàn.
  - **Bộ phận Quản lý Nhân sự (HR Department)**: Quản lý danh sách nhân sự, phân ca làm việc, giám sát trực quan tình hình quân số đầu ca qua Live Dashboard, duyệt đơn giải trình công và xuất báo cáo bảng công an toàn.
  - **Cán bộ Bảo vệ Dữ liệu Cá nhân & An toàn Thông tin (DPO / CISO)**: Giám sát tính hợp pháp trong việc thu thập dữ liệu sinh trắc học, kiểm soát quy trình ký Informed Consent, cơ chế mã hóa AES-256-GCM và thực thi xóa vĩnh viễn dữ liệu theo thời hạn pháp luật.
  - **Quản trị viên Hệ thống & Vận hành (System Administrator / DevOps)**: Chịu trách nhiệm cài đặt, giám sát sức khỏe các trạm Kiosk biên, duy trì hạ tầng máy chủ Backend Spring Boot và CSDL PostgreSQL.
  - **Ban Lãnh đạo Doanh nghiệp (Enterprise Leadership / Sponsors)**: Người phê duyệt ngân sách và dự án; kỳ vọng nâng cao kỷ luật lao động, nâng cao hình ảnh chuyên nghiệp và loại trừ rủi ro pháp lý.
- 2.4. Các yếu tố bên ngoài có ảnh hưởng

  - **Yếu tố môi trường vật lý**: Ánh sáng tại khu vực đặt trạm Kiosk thay đổi liên tục theo thời gian trong ngày (ngược sáng cửa kính, bóng râm, ánh nắng chiếu xiên, đèn điện huỳnh quang); bụi bẩn bám dính trên bề mặt ống kính camera USB.
  - **Yếu tố sinh học & ngoại hình người dùng**: Thay đổi kiểu tóc, mọc râu, đeo kính cận/kính râm y tế, đeo khẩu trang, trang điểm hoặc sự lão hóa tự nhiên của khuôn mặt theo thời gian.
  - **Yếu tố hạ tầng mạng viễn thông**: Đường truyền mạng nội bộ (LAN) hoặc Internet có thể gặp sự cố chập chờn, đứt cáp hoặc mất điện đột ngột tại địa điểm văn phòng/nhà máy.
  - **Yếu tố an ninh mạng & mã độc**: Nguy cơ tấn công dò mã (Brute-force PIN/OTP), tấn công chèn mã độc vào file báo cáo bảng tính (CSV/Formula Injection) nhắm vào máy tính kế toán.

---

**3. Điều kiện & Ranh giới ảnh hưởng**

- 3.1. Ràng buộc

  - **Ràng buộc phần cứng**: Bắt buộc thuật toán AI phải suy luận mượt mà trên nền tảng CPU thông dụng (không phụ thuộc vào GPU NVIDIA/CUDA); dung lượng RAM tiêu thụ của tiến trình Kiosk không vượt quá 1.0 GB.
  - **Ràng buộc chi phí thiết bị**: Sử dụng hoàn toàn các dòng webcam quang học USB thương mại có giá thành phổ thông (chuẩn Full HD 1080p), không yêu cầu cảm biến chiều sâu 3D hoặc camera hồng ngoại đắt tiền.
  - **Ràng buộc kiến trúc công nghệ**: Phân định ranh giới rõ ràng giữa 3 phân hệ độc lập tại thư mục `/app`; giao tiếp giữa Kiosk biên và Backend trung tâm qua giao thức chuẩn HTTPS REST API và WebSocket STOMP.
  - **Ràng buộc an ninh dữ liệu**: Tuyệt đối không lưu trữ ảnh chụp thô kích thước đầy đủ; không lưu vector đặc trưng dạng văn bản rõ (Plaintext); không hỗ trợ tải ảnh cá nhân trực tiếp từ Cổng Web (bắt buộc thu thập mẫu trực tiếp tại trạm Kiosk vật lý qua mã OTP).
- 3.2. Giả định

  - Trạm Kiosk được bố trí ở vị trí cố định gần cửa ra vào, có độ rọi sáng môi trường đạt mức tối thiểu từ 300 đến 500 lux.
  - Khoảng cách đứng chấm công của nhân viên nằm trong khoảng tối ưu từ 0.5m đến 1.5m trước camera.
  - Nhân viên có ý thức hợp tác khi điểm danh (nhìn thẳng vào camera, không cố tình đội mũ trùm kín hoặc đeo khẩu trang che khuất toàn bộ khuôn mặt).
  - Hệ thống máy chủ trung tâm được duy trì cấp nguồn liên tục và có thiết lập chính sách sao lưu tự động (Automated Backup) cho cơ sở dữ liệu PostgreSQL.
- 3.3. Phụ thuộc

  - **Thư viện và Framework cốt lõi**:
    - Phân hệ Kiosk: Python 3.10+, PySide6 (giao diện Qt6), OpenCV (xử lý ảnh), ONNX Runtime (engine suy luận mô hình học sâu), SQLite3.
    - Phân hệ Backend: Java 21 LTS, Spring Boot 4.x, Spring Data JPA, Spring WebSocket STOMP, PostgreSQL 16+, Apache POI.
    - Phân hệ Web: NodeJS 20+, ReactJS 18+, Vite, TypeScript 5+, Tailwind CSS, `@stomp/stompjs`.
  - **Bộ trọng số mô hình AI huấn luyện sẵn (Pre-trained Models)**: Mô hình phát hiện khuôn mặt YuNet (OpenCV Zoo), mô hình trích xuất đặc trưng ArcFace MobileFaceNet 512D (ONNX), mô hình kiểm tra thực thể sống MiniFASNet (ONNX).
  - **Trình điều khiển thiết bị (Drivers)**: Phụ thuộc vào hệ thống API chụp hình của hệ điều hành máy trạm (DirectShow trên Windows hoặc Video4Linux2 / V4L2 trên Linux).
- 3.4. Quy định / chính sách / tiêu chuẩn liên quan

  - **Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15** (Quốc hội Việt Nam thông qua ngày 26/06/2025, có hiệu lực từ ngày 01/01/2026):
    - Dữ liệu sinh trắc học khuôn mặt là *dữ liệu cá nhân nhạy cảm*.
    - Bắt buộc phải có văn bản thỏa thuận điện tử có chữ ký thời gian (*Informed Consent*) trước khi thu thập dữ liệu.
    - Thực thi nghĩa vụ tiêu hủy vĩnh viễn dữ liệu sinh trắc học trong thời hạn $\le 20\text{ ngày}$ kể từ khi nhân viên chấm dứt hợp đồng lao động.
  - **Nghị định số 356/2025/NĐ-CP**: Quy định chi tiết các biện pháp thi hành Luật Bảo vệ Dữ liệu Cá nhân và chế tài xử phạt hành chính đối với các vi phạm an toàn dữ liệu nhạy cảm.
  - **Bộ luật Lao động Việt Nam**: Quy định về quản lý ca kíp, thời giờ làm việc, thời giờ nghỉ ngơi và nghĩa vụ lưu trữ dữ liệu nhật ký chấm công tối thiểu 3 năm phục vụ thanh tra lao động.
  - **Tiêu chuẩn Kỹ thuật Quốc tế**:
    - ISO/IEC 30107-3: Tiêu chuẩn quốc tế về đánh giá phát hiện tấn công giả mạo sinh trắc học (Presentation Attack Detection - PAD).
    - FIPS 197: Tiêu chuẩn mã hóa dữ liệu nâng cao Advanced Encryption Standard (AES-256-GCM).
    - RFC 8446 (TLS 1.3): Tiêu chuẩn mã hóa kênh truyền mạng an toàn.
    - WCAG 2.2 Level AA: Tiêu chuẩn khả năng tiếp cận giao diện Web cho người dùng.

---

**4. Nguồn thông tin & Bằng chứng**

- 4.1. Nguồn thông tin

  - Báo cáo phân tích thị trường công nghệ sinh trắc học và quản trị nhân sự từ các tổ chức quốc tế: *MarketsandMarkets*, *Grand View Research*, *Gartner*.
  - Các công trình nghiên cứu khoa học được bình duyệt tại các hội nghị thị giác máy tính hàng đầu (CVPR, ICCV, IEEE Transactions).
  - Cổng thông tin điện tử Chính phủ nước CHXHCN Việt Nam và Bộ Công an về các văn bản quy phạm pháp luật bảo vệ dữ liệu cá nhân.
  - Phỏng vấn chuyên sâu và khảo sát thực tế với các chuyên viên nhân sự (HR) và quản trị viên doanh nghiệp tại Việt Nam.
- 4.2. Bằng chứng / dữ liệu thu thập

  - **Dữ liệu đo lường thị trường**: Quy mô thị trường nhận diện khuôn mặt đạt xấp xỉ 9.5 – 10 tỷ USD (2024–2026) với tốc độ tăng trưởng kép CAGR đạt 16.2%, dự kiến vượt 19 tỷ USD vào năm 2030 (*Nguồn: Grand View Research, MarketsandMarkets*).
  - **Kết quả khảo sát thực tế (Empirical Evidence)**:
    - 78% doanh nghiệp được khảo sát thừa nhận từng gặp tình trạng nhân viên quẹt thẻ hộ (buddy punching).
    - 62% doanh nghiệp sản xuất gặp phàn nàn về việc máy chấm công vân tay khó nhận diện vào mùa đông hoặc khi tay công nhân dính dầu mỡ, bụi bẩn.
    - Thời gian tổng hợp và đối soát bảng chấm công thủ công chiếm trung bình 24 - 36 giờ làm việc của một chuyên viên nhân sự mỗi tháng.
  - **Dữ liệu thực nghiệm kỹ thuật trên phần cứng baseline (Intel Core i5-12450H CPU)**:
    - Thời gian suy luận mô hình phát hiện khuôn mặt YuNet: ~15 - 20 ms/frame.
    - Thời gian kiểm tra thực thể sống MiniFASNet: ~25 - 30 ms/frame.
    - Thời gian trích xuất vector ArcFace MobileFaceNet: ~40 - 50 ms/frame.
    - Tổng thời gian pipeline AI biên: ~80 - 100 ms/frame (đạt tốc độ xử lý thời gian thực $> 10\text{ FPS}$ ngay trên luồng CPU đơn luồng).
    - Mức tiêu thụ bộ nhớ RAM: Khoảng 550 MB đối với ứng dụng Kiosk nạp sẵn bộ đệm 1,000 vector nhân viên trong RAM.
- 4.3. Thời điểm / người cung cấp

  - **Thời điểm thu thập dữ liệu**: Tháng 08/2026 đến Tháng 09/2026.
  - **Người cung cấp**:
    - nvdung (Kỹ sư phát triển độc lập dự án).
- 4.4. Tài liệu tham chiếu

  - Schroff, F., Kalenichenko, D., & Philbin, J. (2015). *FaceNet: A Unified Embedding for Face Recognition and Clustering*. IEEE Conference on Computer Vision and Pattern Recognition (CVPR).
  - Deng, J., Guo, J., Xue, N., & Zafeiriou, S. (2019). *ArcFace: Additive Angular Margin Loss for Deep Face Recognition*. IEEE Conference on Computer Vision and Pattern Recognition (CVPR).
  - Zhang, S., et al. (2021). *MiniFASNet: Lightweight Face Anti-Spoofing Networks for Mobile Devices*.
  - Quốc hội nước CHXHCN Việt Nam. (2025). *Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15*.
  - Chính phủ nước CHXHCN Việt Nam. (2025). *Nghị định số 356/2025/NĐ-CP quy định chi tiết thi hành Luật Bảo vệ Dữ liệu Cá nhân*.
  - ISO/IEC 30107-3:2017. *Information technology — Biometric presentation attack detection — Part 3: Testing and reporting*.
  - NIST. (2024). *Face Recognition Technology Evaluations (FRTE) 1:N Verification Report*.

