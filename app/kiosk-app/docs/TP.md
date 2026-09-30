# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
> - **Mã tài liệu**: TP-KIOSK-01
> - **Tên tài liệu**: Kế hoạch kiểm thử — Phân hệ Trạm Điểm danh Kiosk Desktop (Kiosk Test Plan)
> - **Phiên bản**: 1.0
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: nvdung
> - **Ngày hiệu lực**: 2026-09-30
> - **Tài liệu liên quan**: [BP.md](BP.md), [README.md](../../../docs/README.md), [TP.md](../../../docs/testing/TP.md), [DDS.md](../../../docs/design/DDS.md), [FR.md](../../../docs/requirements/FR.md), [SRS.md](../../../docs/requirements/SRS.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-09-30)*: Xây dựng hoàn chỉnh kế hoạch kiểm thử chuyên sâu cho phân hệ Kiosk Desktop App (Pipeline thị giác máy tính YuNet + MiniFASNet + ArcFace, bộ đệm ngoại tuyến SQLite WAL, bàn phím số ảo PIN dự phòng và kiểm soát hiệu năng tại biên).

---

## TP — Kế hoạch kiểm thử

**1. Mục tiêu & Phạm vi kiểm thử**

- 1.1. Mục đích kiểm thử
  - Thiết lập chiến lược, quy trình, tiêu chuẩn kỹ thuật và bộ ca kiểm thử toàn diện cho **Phân hệ Trạm Điểm danh Kiosk Desktop (`app/kiosk-app`)**.
  - Đảm bảo trạm Kiosk vận hành độc lập, chính xác và có khả năng chịu lỗi cao tại thiết bị biên (Edge Hardware); chứng minh phần mềm đáp ứng đầy đủ các tiêu chuẩn nghiệp vụ trong [FR.md](../../../docs/requirements/FR.md) và cam kết chất lượng trong [SRS.md](../../../docs/requirements/SRS.md).
  - Ngăn ngừa sớm các rủi ro kỹ thuật: gian lận bằng ảnh in/video màn hình, rò rỉ bộ nhớ khi chạy camera 24/7, đơ giao diện người dùng chính (GUI freezing) và rớt mất dữ liệu điểm danh khi ngắt mạng đột ngột.

- 1.2. Đối tượng kiểm thử
  - Toàn bộ các module mã nguồn Python cấu thành phân hệ Kiosk:
    - **Pipeline thị giác máy tính (`core.vision`)**: `CameraWorker`, `YuNetFaceDetector`, `MiniFASNetLivenessGate`, `ArcFaceFeatureExtractor`, `GalleryCacheManager`.
    - **Hàng đợi ngoại tuyến & đồng bộ bù (`core.offline`)**: `SQLiteQueueManager`, `OfflineSyncWorker`.
    - **Bộ đệm chống quẹt trùng lặp (`core.cooldown`)**: `CooldownTracker`.
    - **Tầng giao tiếp mạng (`network`)**: `KioskHttpClient`, `KioskStompWorker`.
    - **Tầng giao diện người dùng PySide6 (`ui`)**: `MainWindow`, `LiveCanvasWidget`, `VirtualPinDialog`, `EnrollmentDialog`.
    - **Tầng cấu hình & vận hành (`config`)**: `settings.py`, `logger.py`, `main.py`.

- 1.3. Mục tiêu (KPIs kiểm thử định lượng)
  - **Tốc độ phản hồi chu kỳ AI (Edge AI Latency)**: Tổng thời gian xử lý toàn trình (Phát hiện + Liveness + Trích xuất 512D + So khớp ma trận 1,000 nhân sự) đạt $\le 350\text{ ms}$ trên CPU thuần, không cần GPU.
  - **Độ chính xác nhận diện sinh trắc học**:
    - Tỷ lệ nhận diện đúng (True Accept Rate - TAR): $\ge 95\%$ trong điều kiện khuôn mặt trực diện và ánh sáng văn phòng tiêu chuẩn ($\ge 150\text{ lux}$).
    - Tỷ lệ chấp nhận nhầm (False Accept Rate - FAR): $\le 0.01\%$ khi thiết lập ngưỡng Cosine Similarity $\ge 0.50$.
  - **Khả năng lọc giả mạo thực thể sống (Liveness Anti-Spoofing)**:
    - Độ chính xác phát hiện tấn công giả mạo: $\ge 98\%$.
    - Tỷ lệ phân loại nhầm cuộc tấn công (APCER - Attack Presentation Classification Error Rate): $\le 5\%$ đối với ảnh in màu 2D giấy A4 và video phát lại trên màn hình thiết bị di động theo chuẩn **ISO/IEC 30107-3**.
  - **Độ tin cậy dữ liệu (Zero Data Loss - RPO = 0)**:
    - Tỷ lệ rớt dữ liệu điểm danh: $0\%$ khi mất mạng Internet đột ngột hoặc cúp nguồn cưỡng bức nhờ hàng đợi SQLite chế độ Write-Ahead Logging (WAL).
    - Tỷ lệ đồng bộ bù thành công: $100\%$ ngay khi có kết nối mạng trở lại.
  - **Ổn định tài nguyên & Miễn nhiễm rò rỉ bộ nhớ (Zero Memory Leak)**:
    - Mức tiêu thụ RAM không vượt quá $300\text{ MB}$ cho danh mục 1,000 nhân sự.
    - Biến thiên dung lượng RAM sau 8 giờ hoạt động liên tục (Soak Test): $\Delta_{\text{RAM}} \le 5\%$.
  - **Tỷ lệ bao phủ kiểm thử tự động (Code Coverage)**:
    - Đạt tối thiểu $\ge 80\%$ dòng lệnh đối với toàn bộ các gói nghiệp vụ cốt lõi `core`.

- 1.4. Phạm vi / ngoài phạm vi
  - **Trong phạm vi (In-Scope)**:
    - Kiểm thử thuật toán AI thị giác máy tính chạy cục bộ trên CPU máy trạm (YuNet, MiniFASNet, ArcFace MobileFaceNet).
    - Kiểm thử bộ lọc góc nghiêng Euler (Yaw, Pitch, Roll $\le 15^\circ$) và diện tích mặt ($\ge 120\times 120\text{ px}$).
    - Kiểm thử cơ chế hàng đợi ngoại tuyến SQLite WAL: giao dịch ghi đệm, đọc lô 50 bản ghi, đánh dấu đã đồng bộ.
    - Kiểm thử cơ chế Cooldown 120 giây chặn quẹt dồn dập tại biên.
    - Kiểm thử bàn phím số ảo PIN dự phòng: xác thực mã PIN và khóa cưỡng bức 15 phút sau 5 lần nhập sai.
    - Kiểm thử luồng tiếp nhận OTP 6 số để tự đăng ký khuôn mặt mới tại trạm Kiosk.
    - Kiểm thử khả năng chịu lỗi phần cứng: rút/cắm webcam đột ngột, ngắt kết nối dây mạng LAN/WiFi.
    - Kiểm thử giao diện người dùng: máy trạng thái viền oval 4 màu (Xám, Vàng, Xanh lá, Đỏ), bàn phím cảm ứng ảo.
  - **Ngoài phạm vi (Out-of-Scope)**:
    - Các hình thức tấn công giả mạo 3D bằng mặt nạ silicon y tế chuyên dụng hoặc cảm biến đo chiều sâu hồng ngoại (do phần cứng Kiosk chỉ yêu cầu webcam RGB thông thường).
    - Kiểm thử chịu tải phân tán đồng thời hàng nghìn máy trạm Kiosk kết nối về Backend (nhiệm vụ của bài test tải backend).
    - Kiểm thử các chức năng nghiệp vụ nội bộ của máy chủ trung tâm (chấm công ca kíp, phân quyền tài khoản quản trị Cổng Web).

---

**2. Chiến lược & Cách tiếp cận**

- 2.1. Cách tiếp cận kiểm thử
  - **Kiểm thử dựa trên rủi ro (Risk-Based Testing)**: Ưu tiên cao nhất cho 2 rủi ro sống còn của hệ thống trạm Kiosk:
    1. Gian lận chấm công bằng hình ảnh/video giả mạo (Presentation Attack).
    2. Mất mát lượt điểm danh khi mạng chập chờn vào giờ cao điểm.
  - **Tách biệt và Giả lập Phụ thuộc (Mocking & Isolation)**:
    - Khi kiểm thử nội bộ Kiosk, toàn bộ các lời gọi mạng tới Backend (REST API, WebSocket STOMP) được giả lập thông qua các Mock Client để bảo đảm kiểm thử độc lập và tốc độ chạy cực nhanh.
    - Camera vật lý được giả lập bằng khung hình tĩnh (Synthetic Frames) hoặc chuỗi video ghi hình sẵn trong các ca kiểm thử tự động CI.
  - **Tiếp cận Đa tầng (Layered Testing Approach)**: Áp dụng mô hình Kim tự tháp kiểm thử, tập trung $65\%$ nguồn lực vào Unit Test và $35\%$ cho Integration/Reliability Test.

- 2.2. Mức kiểm thử
  - **Mức 1 — Kiểm thử đơn vị (Unit Testing)**:
    - Kiểm tra độc lập từng lớp, phương thức và hàm toán học: thuật toán tính tích vô hướng Cosine, tính toán góc xoay Euler, logic Cooldown đếm lùi, câu lệnh SQL SQLite WAL.
  - **Mức 2 — Kiểm thử thành phần giao diện (Component GUI Testing)**:
    - Kiểm thử từng Widget PySide6 bằng `pytest` kết hợp `QCoreApplication`: `LiveCanvasWidget`, `VirtualPinDialog`, `HeaderBar`. Đảm bảo các Signal/Slot kết nối chuẩn xác.
  - **Mức 3 — Kiểm thử tích hợp nội bộ (Internal Integration Testing)**:
    - Kiểm tra chuỗi pipeline liên hoàn: `CameraWorker` $\rightarrow$ `FaceDetector` $\rightarrow$ `LivenessGate` $\rightarrow$ `FeatureExtractor` $\rightarrow$ `GalleryMatcher` $\rightarrow$ `SQLiteQueueManager`.
  - **Mức 4 — Kiểm thử hệ thống & Chịu lỗi biên (System & Fault Injection Testing)**:
    - Mô phỏng các tình huống thực tế bất thường: rút dây mạng, rút webcam khi đang chạy, cúp nguồn cưỡng bức khi đang ghi SQLite, giả lập 1,000 lượt chấm công liên tục.
  - **Mức 5 — Kiểm thử tải ngâm dài ngày (Soak Testing)**:
    - Chạy ứng dụng liên tục trong 8 đến 24 giờ với camera hoạt động thật để đo đạc sự ổn định của bộ nhớ heap Python và thư viện C++ OpenCV.

- 2.3. Loại kiểm thử
  - **Kiểm thử chức năng (Functional Testing)**: Bao phủ 100% tiêu chí chấp nhận của các chức năng `FR-01`, `FR-02`, `FR-03`, `FR-04`, `FR-05`, `FR-09`.
  - **Kiểm thử hiệu năng & Độ trễ (Latency/Performance Testing)**: Đo thời gian suy luận của từng mô hình ONNX và tổng chu kỳ nhận diện trên CPU.
  - **Kiểm thử bảo mật sinh trắc học (PAD Security Testing)**: Kiểm thử phòng chống tấn công giả mạo theo tiêu chuẩn ISO/IEC 30107-3.
  - **Kiểm thử độ tin cậy ngoại tuyến (Resiliency Testing)**: Đo đạc tỷ lệ toàn vẹn dữ liệu khi ngắt/mở kết nối mạng lặp đi lặp lại.
  - **Kiểm thử trải nghiệm người dùng (UX Testing)**: Kiểm tra máy trạng thái viền oval phản hồi trực quan theo 4 màu chuẩn thiết kế:
    - *Xám*: Chưa phát hiện người.
    - *Vàng*: Đang kiểm tra liveness và nhận diện.
    - *Xanh lá*: Chấm công thành công (kèm tiếng "Tít").
    - *Đỏ*: Giả mạo, quá góc nghiêng, hoặc không tìm thấy thông tin.

- 2.4. Tự động hóa / thủ công
  - **Kiểm thử tự động (85%)**:
    - Sử dụng `pytest` kết hợp `pytest-cov`, `ruff` chạy tự động trên môi trường phát triển cục bộ và pipeline CI GitHub Actions (`kiosk-app-ci`).
    - Toàn bộ ca kiểm thử thuật toán AI, ma trận RAM, CSDL SQLite WAL và client mạng đều được tự động hóa 100%.
  - **Kiểm thử thủ công (15%)**:
    - Kiểm thử tương tác vật lý trực tiếp: đứng trước máy trạm Kiosk thực tế với các điều kiện ánh sáng khác nhau (ngược sáng, thiếu sáng, ánh sáng đèn tuýp).
    - Thao tác ngón tay chạm trên màn hình cảm ứng vật lý với Bàn phím số ảo PIN Pad.
    - Đưa ảnh chụp chân dung in trên giấy A4 hoặc màn hình iPad trước webcam để đánh giá phản ứng thực tế của bộ lọc liveness.

---

**3. Điều kiện & Môi trường**

- 3.1. Điều kiện đầu vào (Entry Criteria)
  - Mã nguồn phân hệ Kiosk đã vượt qua bước kiểm tra cú pháp và quy chuẩn linter `ruff check .` không có lỗi.
  - Môi trường ảo Python 3.14.x trên Windows (`app/kiosk-app/.venv`) đã cài đặt đầy đủ dependencies trong `requirements.txt` và `requirements-dev.txt`.
  - Bộ 3 tệp trọng số mô hình AI ONNX (`yunet.onnx`, `minifasnet.onnx`, `arcface_mobilefacenet.onnx`) đã hiện diện trong `assets/models/` và xác nhận dung lượng hợp lệ.
  - Tệp biến môi trường `.env` đã được cấu hình với các giá trị ngưỡng chuẩn mực.

- 3.2. Môi trường kiểm thử
  - **Môi trường Trạm Kiosk Cục bộ (Local Hardware Testbed)**:
    - Hệ điều hành: Windows 11 64-bit (Build 22631+).
    - CPU: Tối thiểu 4 nhân vật lý (Intel Core i5-1135G7 / AMD Ryzen 5 5500U hoặc tương đương).
    - RAM: 8 GB DDR4 trở lên.
    - Camera: Webcam chuẩn UVC độ phân giải $1280 \times 720\text{ @ 30 FPS}$, hỗ trợ driver DirectShow.
    - Màn hình: Độ phân giải $1920 \times 1080$ (tỷ lệ 16:9), có hỗ trợ cảm ứng điện dung.
  - **Môi trường Kiểm thử Tự động Headless (CI Testbed)**:
    - GitHub Actions Runner: `ubuntu-latest`.
    - Biến môi trường đồ họa: `QT_QPA_PLATFORM=offscreen` (chạy Qt không cần máy chủ X11/màn hình).
    - Python: 3.11+.

- 3.3. Dữ liệu / cấu hình
  - **Bộ dữ liệu kiểm thử hình ảnh (Test Datasets)**:
    - `dataset_live_faces`: 50 ảnh chân dung người thật với đa dạng góc quay (thẳng, nghiêng $10^\circ$, nghiêng $25^\circ$), biểu cảm và đeo kính trắng.
    - `dataset_spoof_printed`: 30 ảnh chân dung in màu trên giấy A4 bóng và giấy văn phòng thường.
    - `dataset_spoof_replay`: 20 đoạn video quay sẵn phát lại qua màn hình điện thoại iPhone/Samsung và iPad.
  - **Bộ dữ liệu ma trận nhân sự giả lập (Synthetic Gallery)**:
    - 1,000 vector đặc trưng 512 chiều kiểu `float32` được chuẩn hóa L2 Norm = 1.0.
    - 10 vector của nhân viên thử nghiệm có độ tương đồng Cosine thực tế.
  - **Cấu hình tham số kiểm thử**:
    - `LIVENESS_THRESHOLD = 0.85`
    - `COSINE_SIMILARITY_THRESHOLD = 0.50`
    - `COOLDOWN_SECONDS = 120`
    - `MIN_FACE_SIZE = 120`
    - `MAX_ANGLE_DEG = 15.0`

- 3.4. Điều kiện kết thúc (Exit Criteria)
  - **Tỷ lệ Pass**: Đạt $100\%$ đối với toàn bộ các ca kiểm thử mức độ nghiêm trọng Blocker và Critical; đạt $\ge 95\%$ đối với ca kiểm thử mức Major.
  - **Defect còn tồn đọng**: Không còn bất kỳ lỗi nào ở mức độ Blocker hoặc Critical chưa được khắc phục; các lỗi Minor (nếu có) phải có phương án xử lý được phê duyệt.
  - **Chỉ số Code Coverage**: Độ bao phủ mã nguồn gói `core` đạt tối thiểu $\ge 80\%$.
  - **Pipeline CI**: Luồng `kiosk-app-ci` trên GitHub Actions chạy thành công và báo trạng thái Xanh (Green).

---

**4. Tổ chức & Thực hiện**

- 4.1. Vai trò & trách nhiệm
  - **Chủ sở hữu & Phê duyệt (Owner/Approver - nvdung)**:
    - Phê duyệt kế hoạch kiểm thử, bộ tiêu chí chấp nhận và kết quả nghiệm thu phân hệ.
  - **Kỹ sư Phát triển Kiosk (Kiosk Developer)**:
    - Xây dựng mã nguồn, viết Unit Test cho từng chức năng, sửa chữa triệt để các defect được phát hiện.
  - **Kỹ sư Đảm bảo Chất lượng (QA/Test Engineer)**:
    - Thiết kế kịch bản kiểm thử, chuẩn bị dữ liệu hình ảnh giả lập và tấn công liveness, thực thi kiểm thử tích hợp và kiểm thử ngâm tải.

- 4.2. Nguồn lực & công cụ
  - **Framework kiểm thử**: `pytest>=9.1.1`, `pytest-cov>=7.1.0`.
  - **Kiểm tra cú pháp & quy chuẩn**: `ruff>=0.16.9` (PEP 8, import sorting).
  - **Động cơ thị giác & AI**: `opencv-python-headless>=4.9.0`, `onnxruntime>=1.17.0`, `numpy>=1.26.0`.
  - **Mô phỏng mạng & CSDL**: `sqlite3`, `httpx` (Mock Transport).
  - **Tự động hóa CI/CD**: GitHub Actions (`.github/workflows/ci.yml`), `gh` CLI.

- 4.3. Lịch trình & mốc kiểm thử
  - Bảng tiến độ kiểm thử tương ứng theo từng giai đoạn hoàn thiện nhánh tính năng:

| Mốc Kiểm thử (Milestone) | Nội dung Kiểm thử Trọng tâm | Nhánh Tính năng | Thời lượng | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| **M1: Core Vision & Gallery** | Kiểm thử CameraWorker, YuNet FaceDetector, ArcFace Extractor và Gallery RAM Matcher | `feature/kiosk-FR-01-core-vision` | 1 ngày | **Đạt (Passed)** |
| **M2: Liveness Gate** | Kiểm thử mô hình MiniFASNet, ngưỡng chặn 0.85, phân loại ảnh in 2D và video replay | `feature/kiosk-FR-02-liveness` | 1 ngày | Sẵn sàng |
| **M3: Cooldown & PIN Pad** | Kiểm thử bộ đệm Cooldown 120s, bàn phím số ảo PIN dự phòng và khóa 15p brute-force | `feature/kiosk-FR-03-cooldown`<br/>`feature/kiosk-FR-04-pin-fallback` | 1 ngày | Kế hoạch |
| **M4: Offline Queue & Sync** | Kiểm thử lưu trữ SQLite WAL, rút dây mạng, tự động đồng bộ bù lô 50 bản ghi khi có mạng | `feature/kiosk-FR-05-offline-wal` | 1 ngày | Kế hoạch |
| **M5: Self-Enrollment OTP** | Kiểm thử tiếp nhận OTP 6 số, hướng dẫn giữ thẳng mặt và gửi vector đăng ký mới | `feature/kiosk-FR-09-self-enrollment` | 1 ngày | Kế hoạch |
| **M6: GUI & Soak Testing** | Kiểm thử máy trạng thái viền oval 4 màu, đo độ trễ toàn trình $\le 350\text{ ms}$, test ngâm 8h | `feature/kiosk-ui-integration` | 2 ngày | Kế hoạch |

- 4.4. Các phụ thuộc chính
  - Sự sẵn sàng và tính tương thích của bộ 3 mô hình ONNX trên kiến trúc CPU x86-64.
  - Tính ổn định của hệ điều hành Windows DirectShow driver khi mở camera liên tục nhiều giờ.
  - Sự phối hợp của Backend Mock API để kiểm thử luồng đồng bộ bù ngoại tuyến.

- 4.5. Test deliverables (Sản phẩm bàn giao kiểm thử)
  - Kế hoạch kiểm thử chi tiết phân hệ Kiosk: `app/kiosk-app/docs/TP.md`.
  - Bộ kịch bản kiểm thử tự động: `app/kiosk-app/tests/test_*.py`.
  - Báo cáo kết quả kiểm thử tự động và tỷ lệ bao phủ mã nguồn (Coverage Report).
  - Biên bản đánh giá an toàn chống giả mạo khuôn mặt ISO/IEC 30107-3.

---

**5. Theo dõi & Kiểm soát**

- 5.1. Tiêu chí theo dõi (Test Metrics)
  - **Tỷ lệ vượt qua (Test Pass Rate)**: $\frac{\text{Số test passed}}{\text{Tổng số test}} \times 100\%$.
  - **Tỷ lệ bao phủ dòng lệnh (Line Coverage)**: Mục tiêu $\ge 80\%$, không có module core nào dưới $70\%$.
  - **Độ trễ trung bình chu kỳ nhận diện (Mean Latency)**: Đo thời gian hoàn tất mỗi lượt chấm công, mục tiêu p50 $\le 100\text{ ms}$, p95 $\le 350\text{ ms}$.
  - **Độ biến thiên dung lượng RAM (Memory Delta)**: Giám sát RAM ứng dụng sau 10,000 khung hình video, đảm bảo không tăng quá 15 MB.

- 5.2. Báo cáo
  - **Báo cáo kiểm thử tự động CI**: Được sinh tự động trên GitHub Actions sau mỗi lần đẩy mã nguồn lên Pull Request hoặc nhánh `develop`.
  - **Nhật ký vận hành Kiosk**: Tệp log xoay vòng `logs/kiosk/kiosk_runtime.log` ghi lại chi tiết các sự kiện, mốc thời gian suy luận và cảnh báo lỗi.

- 5.3. Quản lý vấn đề / defect
  - Phân loại mức độ nghiêm trọng của lỗi phát sinh:
    - **Blocker (Chặn đứng)**: Ứng dụng Kiosk bị sập (crash), camera không khởi động được, rớt dữ liệu SQLite khi mất điện. Khắc phục ngay lập tức trong vòng 4 giờ.
    - **Critical (Nghiêm trọng)**: Lọt ảnh giả mạo 2D với tỷ lệ $> 5\%$, nhận diện sai nhân viên khi ngưỡng Cosine $\ge 0.50$, thời gian suy luận vượt quá $500\text{ ms}$. Khắc phục trong vòng 24 giờ.
    - **Major (Lớn)**: Bàn phím PIN không tự khóa sau 5 lần sai, hàng đợi ngoại tuyến đồng bộ sót bản ghi, rò rỉ RAM nhẹ. Khắc phục trước khi merge nhánh tính năng.
    - **Minor (Nhỏ)**: Lỗi căn lề giao diện, câu chữ thông báo chưa tối ưu. Khắc phục trong đợt hoàn thiện cuối.

- 5.4. Rủi ro & ứng phó
  - Bảng phân tích rủi ro kiểm thử và giải pháp phòng ngừa:

| Rủi ro Kiểm thử | Xác suất | Mức độ ảnh hưởng | Giải pháp Ứng phó & Phòng ngừa |
| :--- | :---: | :---: | :--- |
| **Mất kết nối camera vật lý đột ngột** | Trung bình | Rất cao | Xây dựng vòng lặp tự động kết nối lại (`reconnect loop`) mỗi 3s trong `CameraWorker`, không để sập ứng dụng. |
| **Khóa cơ sở dữ liệu SQLite khi đọc/ghi đồng thời** | Cao | Cao | Bắt buộc bật chế độ Write-Ahead Logging (`PRAGMA journal_mode=WAL;`), đặt timeout mở kết nối 5.0 giây. |
| **Mô hình AI suy luận chậm trên máy cấu hình yếu** | Thấp | Cao | Lọc khuôn mặt kích thước nhỏ ngay từ đầu; tối ưu hóa số luồng ONNX Runtime (`intra_op_num_threads=4`). |
| **Ánh sáng môi trường Kiosk quá tối hoặc ngược sáng** | Cao | Trung bình | Tích hợp thuật toán kiểm tra độ sáng trung bình khung hình; hướng dẫn người dùng qua viền màu oval. |

---

**6. Truy xuất kiểm thử**

- 6.1. Cơ sở kiểm thử
  - [FR.md](../../../docs/requirements/FR.md): Đặc tả 6 yêu cầu nghiệp vụ của Kiosk (`FR-01`, `FR-02`, `FR-03`, `FR-04`, `FR-05`, `FR-09`).
  - [SRS.md](../../../docs/requirements/SRS.md): Yêu cầu phi chức năng về hiệu năng ($\le 350\text{ ms}$), an toàn sinh trắc học và tính toàn vẹn dữ liệu ngoại tuyến.
  - [DDS.md](../../../docs/design/DDS.md): Kiến trúc pipeline 5 bước thị giác máy tính, thiết kế SQLite WAL và máy trạng thái viền oval.
  - [BP.md](BP.md): Kế hoạch xây dựng chi tiết phân hệ Kiosk Desktop.

- 6.2. Ma trận Truy xuất Requirement $\rightarrow$ Test Cases (RTM)
  - Bảng tổng hợp chi tiết 18 ca kiểm thử cốt lõi cho phân hệ Kiosk Desktop:

| Mã Yêu cầu | Tên Chức năng / Yêu cầu Nghiệp vụ | Mã Ca Kiểm thử | Tên Ca Kiểm thử (Test Case Title) | Mức độ | Loại Test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **FR-01** | Điểm danh Nhận diện Khuôn mặt | `TC-KIOSK-01` | Kiểm thử khởi tạo và đọc luồng video từ webcam qua DirectShow | Critical | Unit / Component |
| | | `TC-KIOSK-02` | Kiểm thử phát hiện khuôn mặt và lọc diện tích $\ge 120\times 120\text{ px}$ qua YuNet | Critical | Unit |
| | | `TC-KIOSK-03` | Kiểm thử tính góc quay Euler và từ chối mặt nghiêng $> 15^\circ$ | High | Unit |
| | | `TC-KIOSK-04` | Kiểm thử trích xuất vector 512D ArcFace và so khớp Cosine 1:N trong RAM | Critical | Unit / Integration |
| **FR-02** | Kiểm tra Thực thể sống Liveness | `TC-KIOSK-05` | Kiểm thử xác thực người thật qua MiniFASNet đạt điểm $S_{\text{liveness}} \ge 0.85$ | Critical | Unit / PAD |
| | | `TC-KIOSK-06` | Kiểm thử chặn ảnh in màu 2D (Print Attack) hiển thị viền đỏ cảnh báo | Critical | PAD / Security |
| | | `TC-KIOSK-07` | Kiểm thử chặn video phát lại trên màn hình di động (Replay Attack) | Critical | PAD / Security |
| **FR-03** | Chống Quẹt Trùng Lặp Cooldown | `TC-KIOSK-08` | Kiểm thử ghi nhận mốc thời gian quẹt đầu tiên thành công | High | Unit |
| | | `TC-KIOSK-09` | Kiểm thử từ chối và hiển thị cảnh báo khi quẹt lặp trong vòng 120 giây | High | Functional |
| **FR-04** | Điểm danh Dự phòng bằng Mã PIN | `TC-KIOSK-10` | Kiểm thử mở bàn phím ảo VirtualPinDialog và nhập PIN 6 số | High | UI / Functional |
| | | `TC-KIOSK-11` | Kiểm thử xác thực mã PIN hợp lệ và ghi nhận điểm danh dự phòng | High | Functional |
| | | `TC-KIOSK-12` | Kiểm thử khóa bàn phím cưỡng bức 15 phút sau 5 lần nhập sai mã PIN | Critical | Security |
| **FR-05** | Điểm danh Ngoại tuyến & Đồng bộ Bù | `TC-KIOSK-13` | Kiểm thử ghi đệm lượt quẹt vào SQLite WAL `kiosk_local.db` khi mất mạng | Critical | Resiliency |
| | | `TC-KIOSK-14` | Kiểm thử bảo toàn dữ liệu hàng đợi khi ứng dụng bị tắt cưỡng bức | Critical | Reliability |
| | | `TC-KIOSK-15` | Kiểm thử tự động đọc lô 50 bản ghi đồng bộ bù lên máy chủ khi có mạng lại | Critical | Integration |
| **FR-09** | Đăng ký Khuôn mặt Mới tại Trạm | `TC-KIOSK-16` | Kiểm thử tiếp nhận mã kích hoạt OTP 6 số từ Cổng Web | High | UI / Functional |
| | | `TC-KIOSK-17` | Kiểm thử hướng dẫn người dùng căn chỉnh khuôn mặt chuẩn hóa tại Kiosk | Medium | UI / UX |
| | | `TC-KIOSK-18` | Kiểm thử trích xuất vector 512D chuẩn và gửi API đăng ký lên Backend | High | Integration |

- 6.3. Phạm vi bao phủ kiểm thử
  - **Bao phủ Yêu cầu Chức năng**: Đạt $100\%$ (Toàn bộ 6/6 yêu cầu `FR-01`, `FR-02`, `FR-03`, `FR-04`, `FR-05`, `FR-09` đều có ít nhất 2 ca kiểm thử chuyên biệt).
  - **Bao phủ Phi Chức năng (NFR)**: Bao phủ toàn diện các cam kết hiệu năng thời gian đáp ứng $\le 350\text{ ms}$, RPO = 0, tiêu chuẩn chống giả mạo ISO/IEC 30107-3 và kiểm soát rò rỉ RAM khi vận hành 24/7.
