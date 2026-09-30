# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
> - **Mã tài liệu**: FR-FAS-01
> - **Tên tài liệu**: Đặc tả chi tiết yêu cầu chức năng (Functional Requirements - FR)
> - **Tài liệu cha**: [SRS.md](SRS.md) (Mục 3: Yêu cầu chức năng)
> - **Phiên bản**: 1.0
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: nvdung
> - **Ngày hiệu lực**: 2026-09-29
> - **Tài liệu liên quan**: [README.md](../README.md), [PC.md](../initiation/PC.md), [PI.md](../initiation/PI.md), [TS.md](../initiation/TS.md), [PP.md](../planning/PP.md), [SRS.md](SRS.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-09-29)*: Tách và đặc tả chi tiết toàn diện 16 Yêu cầu chức năng (FR-01 đến FR-16) theo chuẩn cấu trúc SDLC.

---

## 3. Yêu cầu chức năng (Functional Requirements)

**3.1. Nhóm chức năng**

Toàn bộ 16 yêu cầu chức năng của hệ thống được phân rã thành 4 nhóm nghiệp vụ chính:
1. **Nhóm A: Thị giác máy tính & Điểm danh tại Kiosk (Edge AI & Attendance Terminal)**:
   - FR-01: Đọc video và phát hiện khuôn mặt thời gian thực (Video Stream & Face Detection).
   - FR-02: Kiểm tra thực thể sống thụ động chống giả mạo (Passive Liveness Detection - PAD).
   - FR-03: So khớp định danh khuôn mặt 1:N cục bộ (Local 1:N Face Recognition).
   - FR-04: Điểm danh dự phòng bằng bàn phím số ảo PIN (Fallback Virtual PIN Pad Punch).
   - FR-05: Chống quét trùng lặp trong thời gian Cooldown (Cooldown Deduplication).
   - FR-06: Lưu trữ ngoại tuyến SQLite WAL và tự động đồng bộ phục hồi (Offline Resilient Queue & Sync).
2. **Nhóm B: Đăng ký & Quản lý danh tính sinh trắc học (Enrollment & Identity Lifecycle)**:
   - FR-07: Ký thỏa thuận số đồng thuận xử lý dữ liệu (Informed Consent Digital Signature).
   - FR-08: Cấp phát và xác thực mã kích hoạt Onboarding OTP (Onboarding OTP Enrollment).
   - FR-09: Đăng ký và nạp mẫu khuôn mặt chuẩn hóa tại Kiosk (Standardized Kiosk Scanner Enrollment).
   - FR-10: Mã hóa an toàn vector đặc trưng khuôn mặt (AES-256-GCM Biometric Vector Encryption).
   - FR-11: Tiêu hủy vĩnh viễn dữ liệu sinh trắc học sau 20 ngày theo Luật 2025 (Automated 20-Day Biometric Erasure).
3. **Nhóm C: Máy chủ nghiệp vụ & Thời gian thực (Enterprise Backend & Real-Time Broadcast)**:
   - FR-12: Quản lý ca làm việc và tính toán giờ công (Shift Scheduling & Work Hour Calculation).
   - FR-13: Phát sóng sự kiện chấm công tức thời qua WebSocket STOMP (Real-Time Attendance STOMP Broadcast).
   - FR-14: Đồng bộ danh mục vector mẫu hai chiều xuống mạng lưới Kiosk (Bi-directional Gallery Synchronization).
4. **Nhóm D: Cổng thông tin Web quản trị & Tự phục vụ (Web Management Portal & Self-Service)**:
   - FR-15: Bảng điều khiển giám sát sĩ số trực tiếp (Live Monitoring Dashboard).
   - FR-16: Quản lý đơn giải trình công và kết xuất báo cáo an toàn (Timesheet Adjustment & Anti-Injection Export).

---

### Bảng tổng hợp ánh xạ yêu cầu chức năng

| Mã Yêu cầu | Tên chức năng | Phân hệ chính | Độ ưu tiên | KPI Liên quan |
| :---: | :--- | :--- | :---: | :---: |
| **FR-01** | Đọc video & phát hiện khuôn mặt | app/kiosk-app | Critical | KPI-01, KPI-02 |
| **FR-02** | Kiểm tra thực thể sống thụ động | app/kiosk-app | Critical | KPI-03 |
| **FR-03** | So khớp định danh khuôn mặt 1:N | app/kiosk-app | Critical | KPI-01, KPI-02 |
| **FR-04** | Điểm danh dự phòng bằng PIN | app/kiosk-app | High | KPI-06 |
| **FR-05** | Chống quét trùng Cooldown | app/kiosk-app, app/backend-service | High | KPI-04 |
| **FR-06** | Lưu trữ ngoại tuyến & Sync bù | app/kiosk-app, app/backend-service | Critical | KPI-06 |
| **FR-07** | Ký cam kết Informed Consent | app/web-portal | Critical | Tuân thủ Luật 2025 |
| **FR-08** | Cấp phát & kiểm tra mã OTP | app/backend-service, app/web-portal | High | Bảo mật đăng ký |
| **FR-09** | Quét nạp mẫu mặt tại Kiosk | app/kiosk-app | High | KPI-01 |
| **FR-10** | Mã hóa vector AES-256-GCM | app/backend-service | Critical | Tuân thủ Luật 2025 |
| **FR-11** | Tiêu hủy dữ liệu sau 20 ngày | app/backend-service | Critical | Tuân thủ Luật 2025 |
| **FR-12** | Quản lý ca kíp & tính giờ công | app/backend-service | High | Nghiệp vụ HR |
| **FR-13** | Phát sóng WebSocket STOMP | app/backend-service, app/web-portal | High | KPI-04 |
| **FR-14** | Đồng bộ Gallery hai chiều | app/backend-service, app/kiosk-app | High | KPI-05 |
| **FR-15** | Live Dashboard trực tiếp | app/web-portal | High | KPI-04 |
| **FR-16** | Duyệt giải trình & Xuất Excel | app/web-portal, app/backend-service | High | Chống mã độc |

---

### Chi tiết Đặc tả từng Yêu cầu Chức năng (Mục 3.2 đến 3.7)

---

#### [FR-01] Đọc video và phát hiện khuôn mặt thời gian thực (Video Stream & Face Detection)
- **3.2. Đặc tả yêu cầu**:
  - Hệ thống Kiosk phải thu nhận liên tục luồng khung hình RGB từ camera/webcam tích hợp với độ phân giải tối thiểu HD 720p / Full HD 1080p ở tốc độ >= 15 FPS.
  - Thực thi mô hình phát hiện khuôn mặt YuNet để xác định tọa độ Bounding Box và 5 điểm mốc đặc trưng (mắt trái, mắt phải, đỉnh mũi, khóe miệng trái, khóe miệng phải) trong thời gian <= 20 ms/frame trên CPU.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-01.1`: Chỉ kích hoạt xử lý khi kích thước khuôn mặt chiếm tối thiểu 120 x 120 pixels trong khung hình.
  - `BR-01.2`: Chỉ chấp nhận góc quay khuôn mặt trong giới hạn dung sai: Góc quay ngang (Yaw) <= +-15 độ, góc cúi/ngửa (Pitch) <= +-15 độ, góc nghiêng vai (Roll) <= +-10 độ.
  - `BR-01.3`: Nếu phát hiện nhiều khuôn mặt cùng lúc (Crowd), hệ thống chọn khuôn mặt có diện tích Bounding Box lớn nhất và gần tâm màn hình nhất để xử lý điểm danh.
- **3.4. Luồng chính**:
  1. Camera Worker đọc luồng khung hình từ camera qua OpenCV và đẩy vào hàng đợi frame buffer.
  2. Kiosk UI hiển thị luồng video mượt mà trên khung hình preview PySide6.
  3. AI Inference Worker lấy frame mới nhất, chạy mô hình YuNet phát hiện khuôn mặt.
  4. Hệ thống vẽ khung định vị (Bounding Box hình oval) bao quanh khuôn mặt người dùng trên màn hình.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Khuôn mặt bị lệch góc hoặc che khuất*: Khung oval hiển thị viền vàng và thông báo "Vui lòng nhìn thẳng vào camera".
  - *Không tìm thấy khuôn mặt trong 10 giây*: Camera tiếp tục duy trì trạng thái chờ (Idle) với mức tiêu thụ CPU tối thiểu.
  - *Sự cố mất kết nối camera*: Hệ thống hiển thị biểu tượng camera lỗi và phát âm thanh cảnh báo lỗi thiết bị.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Tín hiệu video thô từ webcam laptop hoặc USB camera qua driver DirectShow/V4L2.
  - *Đầu ra*: Tọa độ Bounding Box, 5 tọa độ điểm mốc và ảnh cắt vùng khuôn mặt (Crop Face ROI).
- **3.7. Tiêu chí chấp nhận**:
  - Tốc độ hiển thị hình ảnh camera duy trì ổn định >= 15 FPS.
  - Thời gian phát hiện khuôn mặt và điểm mốc <= 25 ms trên CPU Laptop Intel Core i5.

---

#### [FR-02] Kiểm tra thực thể sống thụ động chống giả mạo (Passive Liveness Detection)
- **3.2. Đặc tả yêu cầu**:
  - Trước khi nhận diện danh tính, hệ thống Kiosk phải đưa vùng ảnh khuôn mặt qua mô hình kiểm tra thực thể sống MiniFASNet để xác thực đây là người thật đang đứng trước camera, không phải ảnh chụp in màu, màn hình kỹ thuật số hay mặt nạ 3D.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-02.1`: Ngưỡng điểm thực thể sống (Liveness Score) để xác định người thật là S_liveness >= 0.85.
  - `BR-02.2`: Mọi khuôn mặt có điểm S_liveness < 0.85 đều bị phân loại là tấn công giả mạo (Spoof Attack) và bị từ chối điểm danh ngay lập tức.
  - `BR-02.3`: Không yêu cầu người dùng phải thực hiện các cử chỉ phức tạp như chớp mắt, quay đầu hay há miệng (Passive Liveness thuần túy).
- **3.4. Luồng chính**:
  1. Sau khi phát hiện khuôn mặt từ `FR-01`, hệ thống trích xuất vùng ảnh mở rộng khuôn mặt đưa vào mô hình MiniFASNet.
  2. Mô hình tính toán điểm xác suất thực thể sống S_liveness trong thời gian <= 50 ms.
  3. Nếu S_liveness >= 0.85, hệ thống chuyển sang bước so khớp đặc trưng `FR-03`.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Phát hiện tấn công giả mạo (ảnh in/màn hình điện thoại)*: Hệ thống đổi viền khung oval sang màu đỏ, phát âm thanh cảnh báo từ chối ("Bíp bíp"), hiển thị thông báo "Phát hiện khuôn mặt không hợp lệ" và ghi nhật ký cảnh báo an ninh.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Ảnh cắt vùng khuôn mặt đã căn chỉnh từ `FR-01`.
  - *Đầu ra*: Điểm số thực thể sống thực S_liveness thuộc đoạn [0.0, 1.0] và cờ boolean `isLive`.
- **3.7. Tiêu chí chấp nhận**:
  - Đạt tiêu chuẩn ISO/IEC 30107-3: Tỷ lệ chấp nhận tấn công giả mạo APCER <= 10% và tỷ lệ từ chối người thật sai BPCER <= 2%.
  - Thời gian suy luận mô hình Liveness <= 60 ms trên CPU Laptop.

---

#### [FR-03] So khớp định danh khuôn mặt 1:N cục bộ (Local 1:N Face Recognition)
- **3.2. Đặc tả yêu cầu**:
  - Với khuôn mặt người thật đã qua `FR-02`, Kiosk trích xuất vector đặc trưng 512 chiều (sử dụng ArcFace MobileFaceNet) và so khớp trực tiếp với toàn bộ danh mục vector nhân viên đang lưu trữ trên bộ nhớ RAM (Gallery Cache).
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-03.1`: Thuật toán so khớp sử dụng khoảng cách Cosine Similarity giữa vector quét được u và vector mẫu v:
    Cosine(u, v) = (u . v) / (||u|| * ||v||)
  - `BR-03.2`: Ngưỡng định danh thành công (Match Threshold) được thiết lập cố định ở mức >= 0.50 (đảm bảo tỷ lệ nhận diện nhầm FAR <= 0.1%).
  - `BR-03.3`: Chỉ lấy ứng viên có độ tương đồng cao nhất vượt ngưỡng. Nếu ứng viên cao nhất < 0.50, hệ thống coi là người lạ (Unknown).
- **3.4. Luồng chính**:
  1. Mô hình ArcFace trích xuất vector chuẩn hóa 512 số thực float32 trong <= 70 ms.
  2. Module so khớp thực hiện nhân ma trận với ma trận RAM Gallery (N x 512) bằng thư viện NumPy.
  3. Tìm được nhân viên trùng khớp với điểm tương đồng cao nhất >= 0.50.
  4. Giao diện Kiosk hiển thị khung xanh lá cây, phát âm thanh "Tít" thành công, hiển thị tên và mã số nhân viên trên màn hình.
  5. Kiosk chuyển thông tin sang kiểm tra Cooldown (`FR-05`) để gửi lượt chấm công về Backend.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Khuôn mặt người lạ hoặc độ tương đồng < 0.50*: Màn hình hiển thị viền vàng và thông báo "Không nhận diện được nhân viên. Vui lòng thử lại hoặc sử dụng mã PIN".
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Ảnh khuôn mặt người thật và danh mục ma trận vector trong RAM Kiosk.
  - *Đầu ra*: Mã nhân viên (`employeeId`), họ tên, điểm tương đồng Cosine.
- **3.7. Tiêu chí chấp nhận**:
  - Tỷ lệ nhận diện đúng TAR >= 95% trong điều kiện ánh sáng chuẩn (300 - 500 lux).
  - Tổng thời gian trích xuất và so khớp 1:N với 100 nhân viên <= 100 ms.

---

#### [FR-04] Điểm danh dự phòng bằng bàn phím số ảo PIN (Fallback Virtual PIN Pad)
- **3.2. Đặc tả yêu cầu**:
  - Kiosk phải cung cấp một bàn phím số ảo trực quan (Virtual Numpad) trên màn hình cảm ứng / giao diện chuột để nhân viên điểm danh thủ công khi không thể nhận diện khuôn mặt (bị thương tật, đeo kính râm y tế hoặc camera hỏng).
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-04.1`: Nhân viên điểm danh bằng cách nhập: `Mã nhân viên` (chuỗi ký tự) và `Mã PIN bí mật` (mã số 6 chữ số).
  - `BR-04.2`: Bản ghi điểm danh qua PIN phải được đánh dấu phương thức xác thực là `VERIFICATION_PIN` trong CSDL.
  - `BR-04.3`: Cơ chế chống tấn công Brute-force: Nếu nhập sai mã PIN quá 5 lần liên tiếp đối với một mã nhân viên, hệ thống tự động khóa tính năng nhập PIN của tài khoản đó trong 15 phút.
- **3.4. Luồng chính**:
  1. Nhân viên nhấn nút "Điểm danh bằng mã PIN" trên màn hình Kiosk (hoặc phím tắt `F2`).
  2. Hộp thoại bàn phím số ảo xuất hiện trên màn hình.
  3. Nhân viên thao tác nhập Mã nhân viên và 6 số PIN cá nhân -> Nhấn "Xác nhận".
  4. Kiosk gửi yêu cầu xác thực về Backend Service.
  5. Backend kiểm tra mã băm PIN (Argon2id/BCrypt), trả về kết quả thành công.
  6. Kiosk hiển thị lời chào, ghi nhận giờ điểm danh và tự động đóng hộp thoại sau 3 giây.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Nhập sai mã PIN*: Kiosk báo đỏ "Mã PIN không chính xác (Còn lại X lần thử)".
  - *Tài khoản bị khóa do vượt quá số lần nhập sai*: Kiosk từ chối thao tác và báo "Tài khoản bị tạm khóa 15 phút. Vui lòng liên hệ HR".
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Chuỗi `employeeId` và `pinCode` (6 số) nhập từ bàn phím ảo.
  - *Đầu ra*: Bản ghi điểm danh với cờ `method = VERIFICATION_PIN`.
- **3.7. Tiêu chí chấp nhận**:
  - Bàn phím số ảo phản hồi mượt mà, bàn phím tự động xáo trộn vị trí số (tùy chọn bảo mật) để tránh lộ dấu vân tay trên màn hình cảm ứng.

---

#### [FR-05] Chống quét trùng lặp trong thời gian Cooldown (Cooldown Deduplication)
- **3.2. Đặc tả yêu cầu**:
  - Hệ thống phải tự động ngăn chặn việc ghi nhận nhiều lần liên tiếp khi một nhân viên đứng nán lại trước camera Kiosk sau khi đã điểm danh thành công.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-05.1`: Chu kỳ chống quét trùng (Cooldown Window) có giá trị mặc định là 120 giây (có thể cấu hình từ 30 đến 300 giây bởi HR).
  - `BR-05.2`: Nếu nhân viên A tiếp tục được nhận diện thành công tại Kiosk trong khoảng thời gian < 120 giây kể từ lượt quét thành công gần nhất:
    - Kiosk vẫn hiển thị giao diện chào hỏi ("Bạn đã điểm danh lúc HH:mm:ss").
    - Kiosk KHÔNG tạo bản ghi chấm công mới và KHÔNG gửi dữ liệu về Backend.
  - `BR-05.3`: Backend duy trì lớp phòng vệ thứ hai bằng bộ nhớ đệm Caffeine Cache (TTL 120s) để loại bỏ mọi gói tin gửi trùng lặp từ mạng.
- **3.4. Luồng chính**:
  1. Sau khi nhận diện thành công nhân viên A tại `FR-03`, Kiosk kiểm tra bộ nhớ đệm Cooldown cục bộ dạng `<employeeId, lastPunchTime>`.
  2. Nếu chênh lệch thời gian >= 120 giây (hoặc là lần đầu quét trong ngày): Kiosk cập nhật `lastPunchTime = Now()` và phát lệnh gửi dữ liệu về Backend.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Quét lại trong vòng 120 giây*: Kiosk giữ viền xanh lá, hiển thị dòng trạng thái màu xanh dương: "Đã ghi nhận điểm danh. Vui lòng di chuyển qua cửa" và kết thúc luồng.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: `employeeId`, thời điểm quét hiện tại.
  - *Đầu ra*: Quyết định ghi nhận (Cho phép tạo bản ghi mới hoặc Bỏ qua).
- **3.7. Tiêu chí chấp nhận**:
  - Loại bỏ 100% các bản ghi chấm công rác phát sinh do nhân viên đứng nói chuyện hoặc di chuyển chậm trước camera.

---

#### [FR-06] Lưu trữ ngoại tuyến SQLite WAL và tự động đồng bộ phục hồi (Offline Resilient Queue)
- **3.2. Đặc tả yêu cầu**:
  - Khi đứt kết nối mạng nội bộ giữa Kiosk và Backend, Kiosk phải tự động chuyển sang chế độ hoạt động ngoại tuyến, lưu trữ an toàn các lượt chấm công vào CSDL cục bộ và tự động đồng bộ bù đủ 100% dữ liệu khi mạng phục hồi mà không cần can thiệp thủ công.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-06.1`: Cơ sở dữ liệu ngoại tuyến cục bộ tại Kiosk là SQLite 3 kích hoạt chế độ Write-Ahead Logging (`PRAGMA journal_mode=WAL;`).
  - `BR-06.2`: Thời gian ghi nhận điểm danh của bản ghi ngoại tuyến bắt buộc phải là thời điểm quét thực tế tại biên (Actual Punch Timestamp), không được sử dụng thời điểm đồng bộ về máy chủ.
  - `BR-06.3`: Luồng ngầm định kỳ 10 giây thực hiện kiểm tra kết nối (Ping Heartbeat) đến Backend. Khi phát hiện mạng kết nối lại, lập tức gửi toàn bộ các bản ghi chưa đồng bộ (`is_synced = 0`) theo lô (tối đa 50 bản ghi/lô).
  - `BR-06.4`: Cam kết toàn vẹn dữ liệu: Mục tiêu điểm phục hồi dữ liệu RPO = 0 (không thất thoát bản ghi nào).
- **3.4. Luồng chính**:
  1. Kiosk gửi request điểm danh qua REST API Backend nhưng gặp lỗi timeout/network error.
  2. Kiosk kích hoạt cờ trạng thái `OFFLINE_MODE`, hiển thị biểu tượng mất mạng trên thanh trạng thái.
  3. Kiosk ghi toàn bộ thông tin lượt điểm danh vào bảng `offline_punches` trong SQLite WAL cục bộ với `is_synced = 0`.
  4. Màn hình Kiosk vẫn phản hồi "Điểm danh ngoại tuyến thành công" để nhân viên an tâm vào làm việc.
  5. Khi mạng có lại, Sync Worker quét SQLite, lấy các bản ghi chưa đồng bộ đóng gói thành Batch Request gửi lên Backend.
  6. Backend tiếp nhận lô, lưu thành công vào PostgreSQL và trả mã phản hồi 200 OK.
  7. Sync Worker cập nhật `is_synced = 1` trong SQLite.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Mạng tiếp tục chập chờn khi đang đồng bộ*: Sync Worker tự động thử lại (Retry) với cơ chế lùi theo hàm mũ (Exponential Backoff: 5s, 10s, 20s).
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Dữ liệu lượt chấm công phát sinh trong lúc mất mạng.
  - *Đầu ra*: Bản ghi đồng bộ trọn vẹn vào CSDL PostgreSQL của Backend với mốc giờ gốc chính xác.
- **3.7. Tiêu chí chấp nhận**:
  - Thử nghiệm ngắt mạng trên Kiosk, thực hiện 50 lượt điểm danh ngoại tuyến, kết nối lại mạng: Toàn bộ 50 bản ghi được đồng bộ về Backend trong vòng < 30 giây, sai lệch thời gian 0 giây.

---

#### [FR-07] Ký thỏa thuận số đồng thuận xử lý dữ liệu (Informed Consent Digital Signature)
- **3.2. Đặc tả yêu cầu**:
  - Cổng Web phải bắt buộc nhân viên mới ký thỏa thuận đồng thuận số (Informed Consent) trước khi hệ thống cho phép kích hoạt quy trình thu thập và xử lý khuôn mặt, tuân thủ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-07.1`: Thỏa thuận phải nêu rõ: Mục đích xử lý (chấm công nội bộ), phạm vi dữ liệu (vector đặc trưng hình học 512D, không lưu ảnh thô vĩnh viễn), thời hạn lưu trữ (tối đa 20 ngày sau khi thôi việc) và quyền của chủ thể dữ liệu (quyền rút lại sự đồng thuận, yêu cầu xóa dữ liệu).
  - `BR-07.2`: Nhân viên ký xác nhận bằng cách tích chọn checkbox pháp lý và nhấn nút "Xác nhận & Ký điện tử" sau khi đăng nhập tài khoản cá nhân.
  - `BR-07.3`: Hệ thống phải ghi vết nhật ký kiểm toán (Audit Trail) bất biến gồm: `employeeId`, `consentVersion`, `ipAddress`, `userAgent`, `timestamp` và lưu vào bảng `consent_audit_logs`.
- **3.4. Luồng chính**:
  1. Nhân viên mới đăng nhập Cổng Web lần đầu. Hệ thống phát hiện tài khoản ở trạng thái `CONSENT_PENDING`.
  2. Màn hình tự động hiển thị Modal toàn văn bản thỏa thuận Informed Consent.
  3. Nhân viên đọc nội dung, tích chọn cam kết và nhấn "Ký điện tử".
  4. Backend xác thực, lưu vết nhật ký đồng thuận vào CSDL, chuyển trạng thái tài khoản sang `ENROLLMENT_PENDING` và chuyển sang `FR-08`.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Nhân viên từ chối ký*: Hệ thống hiển thị thông báo giải thích và duy trì phương thức điểm danh thay thế bằng thẻ từ/PIN, không thu thập bất kỳ dữ liệu khuôn mặt nào.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Thao tác xác nhận ký điện tử của nhân viên trên Cổng Web.
  - *Đầu ra*: Bản ghi nhật ký kiểm toán pháp lý trong CSDL PostgreSQL.
- **3.7. Tiêu chí chấp nhận**:
  - Không thể kích hoạt bất kỳ luồng đăng ký khuôn mặt nào nếu thiếu bản ghi Consent hợp lệ tương ứng trong CSDL.

---

#### [FR-08] Cấp phát và xác thực mã kích hoạt Onboarding OTP (Onboarding OTP Enrollment)
- **3.2. Đặc tả yêu cầu**:
  - Sau khi nhân viên ký thỏa thuận Consent, hệ thống phải sinh một mã OTP kích hoạt gồm 6 chữ số ngẫu nhiên kèm mã QR hiển thị trên Cổng Web của nhân viên để sử dụng quét mặt tại trạm Kiosk.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-08.1`: Mã OTP gồm 6 chữ số ngẫu nhiên được sinh bằng bộ sinh số ngẫu nhiên bảo mật (`SecureRandom`).
  - `BR-08.2`: Thời hạn hiệu lực của mã OTP là đúng 48 giờ kể từ thời điểm sinh.
  - `BR-08.3`: Mã OTP là loại dùng một lần duy nhất (Single-Use Token). Ngay sau khi Kiosk nạp mẫu mặt thành công, mã OTP lập tức bị vô hiệu hóa (`is_used = true`).
  - `BR-08.4`: Trong CSDL, mã OTP chỉ được lưu dưới dạng băm an toàn SHA-256 kèm muối (Salt), không lưu chuỗi số rõ (Plaintext).
- **3.4. Luồng chính**:
  1. Sau khi hoàn thành `FR-07`, Backend sinh mã 6 số OTP, băm SHA-256 lưu CSDL kèm hạn 48h.
  2. Cổng Web hiển thị mã 6 số cỡ lớn và mã hình ảnh QR kèm đồng hồ đếm ngược 48 giờ.
  3. Nhân viên mang mã OTP ra trạm Kiosk để đăng ký khuôn mặt.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Mã OTP quá hạn 48 giờ*: Cổng Web hiển thị thông báo hết hạn và cung cấp nút "Tạo lại mã OTP mới".
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Yêu cầu cấp mã đăng ký từ tài khoản nhân viên đã ký Consent.
  - *Đầu ra*: Mã OTP 6 chữ số, mã hình ảnh QR Code, thời gian hết hạn `expires_at`.
- **3.7. Tiêu chí chấp nhận**:
  - Mã OTP tuyệt đối không thể tái sử dụng lần thứ hai; kiểm tra băm bảo mật ngăn chặn rò rỉ CSDL.

---

#### [FR-09] Đăng ký và nạp mẫu khuôn mặt chuẩn hóa tại Kiosk (Standardized Kiosk Scanner)
- **3.2. Đặc tả yêu cầu**:
  - Trạm Kiosk cung cấp chế độ "Đăng ký khuôn mặt mới". Nhân viên nhập OTP/quét QR để mở camera chụp mẫu khuôn mặt chuẩn hóa dưới các tiêu chuẩn kiểm định khắt khe.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-09.1`: Tiêu chuẩn kiểm tra chất lượng ảnh khuôn mặt khi đăng ký (Enrollment Quality Gate):
    - Điểm thực thể sống MiniFASNet S_liveness >= 0.85.
    - Độ sắc nét (Laplacian Variance) >= 100.0 (không mờ nhòe).
    - Độ sáng vùng mặt: Đạt từ 300 - 500 lux (không quá tối, không lóa sáng).
    - Góc nghiêng: Góc quay ngang, gật đầu <= +-10 độ.
  - `BR-09.2`: Sau khi ảnh đạt chuẩn, Kiosk trích xuất vector 512D và gửi gói tin đăng ký lên Backend.
  - `BR-09.3`: Hình ảnh chụp thô chỉ lưu tạm trên RAM Kiosk trong vài giây để trích xuất vector, sau đó lập tức bị xóa khỏi bộ nhớ (Zero Storage of Raw Images at Terminal).
- **3.4. Luồng chính**:
  1. Nhân viên bấm "Đăng ký khuôn mặt" trên màn hình Kiosk -> Nhập mã 6 số OTP (hoặc đưa mã QR trước camera).
  2. Kiosk gửi mã OTP lên Backend xác thực -> Backend phản hồi OTP hợp lệ kèm họ tên nhân viên.
  3. Kiosk hướng dẫn nhân viên đứng thẳng nhìn vào camera, khung oval hiển thị màu xanh hướng dẫn.
  4. Khi các chỉ số chất lượng đạt chuẩn, Kiosk tự động chụp và trích xuất vector 512D.
  5. Kiosk gửi vector kèm mã OTP về Backend. Backend kích hoạt tài khoản thành `ACTIVE`.
  6. Backend phát thông báo WebSocket về màn hình Web của nhân viên và gửi vector mới nạp vào RAM các Kiosk.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Ảnh không đạt chuẩn (quá tối, nghiêng mặt, mờ)*: Kiosk phát giọng nói/chữ hướng dẫn: "Vui lòng nhìn thẳng và giữ yên khuôn mặt".
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Mã OTP hợp lệ và hình ảnh khuôn mặt đạt chuẩn trước camera Kiosk.
  - *Đầu ra*: Mảng vector 512 chiều được gửi thành công lên Backend.
- **3.7. Tiêu chí chấp nhận**:
  - Toàn bộ quy trình quét và kích hoạt tại Kiosk hoàn tất trong vòng <= 5 giây.

---

#### [FR-10] Mã hóa an toàn vector đặc trưng khuôn mặt (AES-256-GCM Biometric Vector Encryption)
- **3.2. Đặc tả yêu cầu**:
  - Toàn bộ vector đặc trưng sinh trắc học 512 chiều khi lưu trữ ở trạng thái tĩnh (At-Rest) trong CSDL PostgreSQL của Backend phải được mã hóa đối xứng bằng thuật toán mã hóa khối xác thực AES-256-GCM chuẩn FIPS.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-10.1`: Thuật toán mã hóa: AES ở chế độ Galois/Counter Mode (AES-256-GCM).
  - `BR-10.2`: Mỗi lần mã hóa một vector, hệ thống phải sinh một vector khởi tạo ngẫu nhiên (Initialization Vector - IV) duy nhất có độ dài 12 bytes (96-bit IV). Tuyệt đối không tái sử dụng IV.
  - `BR-10.3`: Bản mã hóa bao gồm thẻ xác thực toàn vẹn 16 bytes (128-bit Authentication Tag) để chống lại các cuộc tấn công can thiệp sửa đổi bản mã.
  - `BR-10.4`: Khóa Master Key 256-bit được quản lý độc lập ngoài CSDL qua biến môi trường hệ thống (`ENCRYPTION_MASTER_KEY`).
- **3.4. Luồng chính**:
  1. Backend nhận mảng vector float32 (2048 bytes) từ Kiosk qua kênh HTTPS.
  2. `BiometricCryptoService` sinh IV ngẫu nhiên 12 bytes bằng `SecureRandom`.
  3. Thực hiện mã hóa AES-256-GCM, thu được bản mã (Ciphertext) và Authentication Tag.
  4. Lưu trữ bản mã, IV và Tag vào bảng `biometric_templates` trong PostgreSQL dưới định dạng cột nhị phân `BYTEA`.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Giải mã thất bại hoặc Tag bị sai lệch (dấu hiệu can thiệp dữ liệu)*: Hệ thống ném ngoại lệ `AEADBadTagException`, từ chối nạp vector và ghi nhật ký cảnh báo vi phạm an toàn dữ liệu nghiêm trọng.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Mảng float32 vector 512 chiều rõ.
  - *Đầu ra*: Bản ghi nhị phân mã hóa an toàn gồm Ciphertext + IV + Tag.
- **3.7. Tiêu chí chấp nhận**:
  - Dữ liệu trong CSDL PostgreSQL hoàn toàn là chuỗi nhị phân mã hóa ngẫu nhiên, không thể khôi phục nếu không có Master Key độc lập.

---

#### [FR-11] Tiêu hủy vĩnh viễn dữ liệu sinh trắc học sau 20 ngày theo Luật 2025 (Automated 20-Day Biometric Erasure)
- **3.2. Đặc tả yêu cầu**:
  - Backend phải tự động hóa hoàn toàn quy trình tiêu hủy vĩnh viễn (Hard Delete) toàn bộ dữ liệu mẫu sinh trắc học của nhân viên đã thôi việc sau đúng 20 ngày, tuân thủ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-11.1`: Khi nhân viên chuyển trạng thái thành `TERMINATED`, hệ thống lưu ngày thôi việc `terminated_date = CurrentDate()`.
  - `BR-11.2`: Ngay khi thôi việc (T = 0), Backend gửi lệnh thu hồi vector qua WebSocket để loại bỏ vector của nhân sự đó khỏi bộ nhớ RAM của toàn bộ các Kiosk ngay tức khắc (chặn quyền ra vào).
  - `BR-11.3`: Tiến trình ngầm `@Scheduled` chạy tự động vào lúc 00:00:00 hàng ngày quét CSDL tìm các nhân viên có:
    CurrentDate() - terminated_date >= 20 ngày
  - `BR-11.4`: Thực hiện lệnh Hard Delete xóa sạch bản ghi trong bảng `biometric_templates` và `enrollment_otps`.
  - `BR-11.5`: Dữ liệu bảng công lịch sử (Attendance Logs) được giữ lại để đối soát tiền lương theo luật lao động nhưng bị hủy liên kết sinh trắc học.
- **3.4. Luồng chính**:
  1. Cron Job thức giấc lúc 00:00:00 mỗi đêm.
  2. Truy vấn danh sách nhân viên thôi việc quá 20 ngày.
  3. Xóa vĩnh viễn các bản ghi vector sinh trắc học liên quan.
  4. Ghi nhật ký kiểm toán bất biến vào bảng `compliance_audit_logs` (Mã nhân sự, thời điểm xóa, căn cứ pháp lý Luật 2025).
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Nhân viên được phục hồi làm việc trong vòng 20 ngày*: Trạng thái được chuyển lại `ACTIVE`, hủy tiến trình đếm ngược xóa dữ liệu.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Danh sách nhân viên thôi việc trong CSDL.
  - *Đầu ra*: Bản ghi vector bị xóa triệt để khỏi đĩa cứng, kèm biên bản kiểm toán số.
- **3.7. Tiêu chí chấp nhận**:
  - Đúng ngày thứ 21, dữ liệu sinh trắc học không còn tồn tại trong bất kỳ bảng CSDL nào; có biên bản kiểm toán chứng minh việc tuân thủ pháp lý.

---

#### [FR-12] Quản lý ca làm việc và tính toán giờ công (Shift Scheduling & Work Hour Calculation)
- **3.2. Đặc tả yêu cầu**:
  - Backend Service chịu trách nhiệm cấu hình các ca làm việc, tự động gán lượt quẹt thẻ thành Check-in hoặc Check-out và tính toán số phút đi muộn, về sớm của nhân viên.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-12.1`: Cấu hình ca làm việc tiêu chuẩn: Giờ bắt đầu ca (T_start), Giờ kết thúc ca (T_end), Thời gian ân hạn cho phép (T_grace, mặc định 15 phút).
  - `BR-12.2`: Lượt quét hợp lệ đầu tiên trong ngày là `CHECK_IN`; lượt quét hợp lệ cuối cùng trong ca là `CHECK_OUT`.
  - `BR-12.3`: Công thức tính số phút đi muộn:
    LateMinutes = max(0, T_punch - (T_start + T_grace))
  - `BR-12.4`: Công thức tính số phút về sớm:
    EarlyMinutes = max(0, T_end - T_punch)
  - `BR-12.5`: Trạng thái bản ghi công tự động gắn cờ: `ON_TIME` (Đúng giờ), `LATE` (Đi muộn), `EARLY_LEAVE` (Về sớm), `ABSENT` (Vắng mặt nếu không có lượt quẹt nào).
- **3.4. Luồng chính**:
  1. Backend nhận lượt chấm công từ Kiosk.
  2. Tìm kiếm lịch ca làm việc của nhân viên trong ngày.
  3. Áp dụng công thức tính toán `LateMinutes`, `EarlyMinutes` và xác định trạng thái công.
  4. Lưu bản ghi vào bảng `attendance_records` trong PostgreSQL.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Nhân viên chấm công ngoài khung giờ ca (quá sớm hoặc quá muộn)*: Hệ thống vẫn ghi nhận giờ thực tế và gắn cờ `OUT_OF_SHIFT` để HR rà soát.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Thời điểm quét thực tế và cấu hình ca làm việc của nhân viên.
  - *Đầu ra*: Bản ghi công với đầy đủ số phút đi muộn, về sớm và trạng thái chuẩn hóa.
- **3.7. Tiêu chí chấp nhận**:
  - Tính toán số phút đi muộn/về sớm chính xác 100% theo từng phút; tự động áp dụng thời gian ân hạn 15 phút.

---

#### [FR-13] Phát sóng sự kiện chấm công tức thời qua WebSocket STOMP (Real-Time Attendance STOMP Broadcast)
- **3.2. Đặc tả yêu cầu**:
  - Ngay khi ghi nhận một lượt chấm công thành công, Backend Service phải lập tức phát sóng gói tin sự kiện đến toàn bộ các client Web đang mở thông qua giao thức WebSocket STOMP.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-13.1`: Kênh phát sóng sự kiện chấm công trực tiếp là topic `/topic/live-attendance`.
  - `BR-13.2`: Nội dung gói tin phát sóng (JSON Payload) bao gồm: `recordId`, `employeeId`, `fullName`, `department`, `punchTime`, `actionType` (IN/OUT), `status` (ON_TIME/LATE), `kioskId`.
  - `BR-13.3`: Độ trễ phát sóng từ Backend tới Web Client phải đạt <= 200 ms.
- **3.4. Luồng chính**:
  1. Backend xử lý xong lượt chấm công tại `FR-12`.
  2. `StompEventDispatcher` đóng gói thông tin lượt chấm thành bản tin JSON.
  3. Phát tán bản tin đến hàng đợi `/topic/live-attendance` qua Spring WebSocket STOMP Broker.
  4. Giao diện Web Portal nhận được gói tin, cập nhật tức thì lên hàng đầu của bảng Dashboard mà không cần F5 tải lại trang.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Mất kết nối WebSocket*: Web Client tự động kích hoạt tiến trình kết nối lại (Auto-reconnect) sau mỗi 5 giây qua SockJS.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Sự kiện chấm công thành công tại Backend.
  - *Đầu ra*: Bản tin JSON được đẩy tức thì xuống các trình duyệt Web đang kết nối.
- **3.7. Tiêu chí chấp nhận**:
  - Màn hình Web cập nhật bảng điểm danh trong vòng <= 0.5 giây kể từ lúc nhân viên nghe tiếng "Tít" tại Kiosk.

---

#### [FR-14] Đồng bộ danh mục vector mẫu hai chiều xuống mạng lưới Kiosk (Bi-directional Gallery Synchronization)
- **3.2. Đặc tả yêu cầu**:
  - Khi khởi động, Kiosk phải tự động tải toàn bộ danh mục vector mẫu từ Backend về nạp vào RAM. Khi có nhân viên mới đăng ký hoặc bị khóa tài khoản, Backend phải phát sóng lệnh cập nhật tức thời xuống Kiosk.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-14.1`: Kênh phát sóng cập nhật thư viện mẫu là topic `/topic/kiosk-gallery`.
  - `BR-14.2`: Khi Kiosk khởi động: Gửi request `GET /api/v1/kiosk/gallery` kèm mã xác thực của Kiosk để tải toàn bộ vector giải mã về nạp vào RAM.
  - `BR-14.3`: Khi có thay đổi trong ngày (nhân viên mới nạp mẫu, nhân viên thôi việc): Backend phát bản tin chứa `<employeeId, vector, action=ADD/REMOVE>`. Kiosk nhận tin và cập nhật ma trận RAM tức thời mà không cần khởi động lại ứng dụng.
- **3.4. Luồng chính**:
  1. Nhân viên mới hoàn thành quét mặt tại `FR-09`.
  2. Backend phát sóng bản tin nạp vector mới lên topic `/topic/kiosk-gallery`.
  3. Toàn bộ các trạm Kiosk đang chạy nhận gói tin, thêm vector vào danh mục bộ nhớ RAM.
  4. Nhân viên có thể sang trạm Kiosk khác chấm công ngay lập tức.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Kiosk mất mạng lúc phát sóng*: Khi có mạng lại, Kiosk thực hiện đối chiếu mã băm phiên bản thư viện (Gallery Version Hash). Nếu lệch phiên bản, Kiosk tự động tải lại toàn bộ danh mục mới nhất.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Sự kiện thêm/xóa mẫu khuôn mặt tại máy chủ trung tâm.
  - *Đầu ra*: Bộ nhớ RAM Gallery trên các trạm Kiosk biên luôn đồng nhất 100% với CSDL.
- **3.7. Tiêu chí chấp nhận**:
  - Đồng bộ toàn bộ 100 vector mẫu khi khởi động Kiosk hoàn tất trong <= 3.0 giây.

---

#### [FR-15] Bảng điều khiển giám sát sĩ số trực tiếp (Live Monitoring Dashboard)
- **3.2. Đặc tả yêu cầu**:
  - Cổng Web cung cấp màn hình Live Dashboard cho HR theo dõi trực quan tình hình đi làm đầu ca, biểu đồ sĩ số và danh sách 5 - 10 lượt quẹt gần nhất được cập nhật tự động.
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-15.1`: Thống kê sĩ số thời gian thực: Tổng số nhân sự, Số người đã có mặt (Present), Số người đi muộn (Late), Số người chưa đến (Absent).
  - `BR-15.2`: Bảng danh sách lượt quẹt gần nhất hiển thị: Ảnh đại diện/Icon, Mã nhân viên, Họ và tên, Phòng ban, Giờ chấm công chính xác, Trạng thái (Đúng giờ: Xanh lá, Đi muộn: Vàng cam).
  - `BR-15.3`: Bảng điều khiển phải hiển thị tình trạng trực tuyến/ngoại tuyến của các trạm Kiosk trong mạng lưới.
- **3.4. Luồng chính**:
  1. HR đăng nhập Cổng Web, mở trang "Live Dashboard".
  2. Hệ thống tải dữ liệu tổng hợp đầu ca và thiết lập kênh WebSocket STOMP.
  3. Mỗi khi có lượt quét mới tại bất kỳ Kiosk nào, dòng thông tin mới trượt mượt mà vào đầu bảng, các chỉ số quân số tự động nhảy số theo thời gian thực.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *Trình duyệt mất mạng*: Hiển thị banner màu vàng cảnh báo "Mất kết nối thời gian thực. Đang kết nối lại...".
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Luồng dữ liệu sự kiện từ WebSocket `/topic/live-attendance`.
  - *Đầu ra*: Giao diện bảng điều khiển trực quan, sinh động, phản hồi tức thời.
- **3.7. Tiêu chí chấp nhận**:
  - Giao diện mượt mà, cập nhật tức thì dưới 1 giây, bố cục hiển thị tốt trên cả màn hình máy tính và máy tính bảng.

---

#### [FR-16] Quản lý đơn giải trình công và kết xuất báo cáo an toàn (Timesheet Adjustment & Anti-Injection Export)
- **3.2. Đặc tả yêu cầu**:
  - Cổng Web cho phép nhân viên nộp đơn giải trình công khi quên chấm/gặp sự cố; HR thực hiện duyệt/từ chối đơn; và hỗ trợ xuất dữ liệu bảng công ra file Excel (.xlsx) / CSV với cơ chế phòng chống mã độc công thức (Formula Injection).
- **3.3. Quy tắc nghiệp vụ**:
  - `BR-16.1`: Nhân viên chỉ được nộp đơn giải trình cho các ngày công trong tháng hiện tại và trước ngày chốt công định kỳ.
  - `BR-16.2`: Khi HR duyệt đơn (`APPROVED`), trạng thái ngày công đó được chuyển thành `EXCUSED` (Có lý do chính đáng) và tính đủ giờ công tiêu chuẩn.
  - `BR-16.3`: Phòng chống lỗ hổng bảo mật Formula Injection (CWE-1236): Khi xuất file Excel/CSV, toàn bộ các ô dữ liệu chứa ký tự bắt đầu là `=`, `+`, `-`, `@` phải được tự động chèn thêm dấu nháy đơn (`'`) ở đầu chuỗi để phần mềm bảng tính chỉ đọc dưới dạng văn bản tĩnh thuần túy.
- **3.4. Luồng chính**:
  1. Nhân viên vào Cổng tự phục vụ -> Chọn ngày cần giải trình -> Điền lý do và gửi đơn.
  2. HR nhận thông báo đơn mới -> Kiểm tra thông tin -> Nhấn "Phê duyệt".
  3. Cuối tháng, HR chọn khoảng ngày và phòng ban -> Nhấn "Xuất file Excel".
  4. Backend xử lý dữ liệu, áp dụng cơ chế lọc chống Formula Injection, đóng gói file `.xlsx` qua Apache POI và trả về trình duyệt tải xuống.
- **3.5. Luồng thay thế / ngoại lệ**:
  - *HR từ chối đơn*: Trạng thái chuyển thành `REJECTED`, nhân viên nhận thông báo lý do từ chối trên cổng tự phục vụ.
- **3.6. Điều kiện đầu vào / đầu ra**:
  - *Đầu vào*: Đơn giải trình công từ nhân viên hoặc yêu cầu xuất file báo cáo từ HR.
  - *Đầu ra*: Trạng thái bảng công được điều chỉnh chính xác; file Excel bảng công an toàn tuyệt đối.
- **3.7. Tiêu chí chấp nhận**:
  - File Excel tải về mở an toàn trên Microsoft Excel, không kích hoạt bất kỳ cảnh báo bảo mật hay thực thi lệnh mã độc nào.


