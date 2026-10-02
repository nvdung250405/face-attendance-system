# INFO — Nghiên cứu & Dữ liệu Bằng chứng (Research & Information)

> **Mã tài liệu:** `INFO-FAS-01`  
> **Cấp độ:** Cấp Hệ thống (System-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Kho lưu trữ có cấu trúc các câu hỏi nghiên cứu, bối cảnh bài toán, danh mục nguồn khảo sát (`SRC-`), các phát hiện/sự thật khoa học (`INF-`), phân tích hệ quả và các khoảng trống nghiên cứu phục vụ khởi tạo dự án và đặc tả yêu cầu.

---

## 1. Research Questions (Câu hỏi Nghiên cứu)

1. **RQ-01 (Nghiệp vụ)**: Thực trạng gian lận chấm công (quẹt thẻ hộ, gian lận vị trí GPS) và gánh nặng đối soát thủ công của bộ phận nhân sự tại các doanh nghiệp Việt Nam diễn ra ở mức độ nào?
2. **RQ-02 (Kỹ thuật Biên)**: Liệu các mô hình học sâu thị giác máy tính hiện đại có thể chạy suy luận thời gian thực ($\ge 15\text{ FPS}$, độ trễ $\le 350\text{ ms}$) trên CPU máy tính phổ thông với chi phí phần cứng 0 VNĐ mà không cần GPU rời hay không?
3. **RQ-03 (Bảo mật Sinh trắc)**: Các kỹ thuật chống giả mạo thụ động (Passive Liveness Detection) có thể ngăn chặn hiệu quả các cuộc tấn công bằng ảnh in 2D và video phát lại trên thiết bị camera quang học thông thường theo tiêu chuẩn ISO/IEC 30107-3 không?
4. **RQ-04 (Pháp lý & Quyền riêng tư)**: Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 của Việt Nam quy định những nghĩa vụ bắt buộc nào đối với việc thu thập, lưu trữ, mã hóa và tiêu hủy dữ liệu sinh trắc học khuôn mặt?

---

## 2. Domain Context (Bối cảnh Lĩnh vực & Khái niệm)

* **Điểm danh Sinh trắc học Không tiếp xúc (Touchless Biometric Attendance)**: Phương thức xác thực danh tính nhân sự qua camera từ xa mà không yêu cầu chạm tay vào bề mặt cảm biến hay quét thẻ từ vật lý.
* **Suy luận AI tại Biên (Edge AI Inference)**: Quá trình tính toán, phát hiện khuôn mặt, lọc liveness và trích xuất vector đặc trưng được thực hiện trực tiếp trên thiết bị đầu cuối cục bộ (Local Kiosk CPU), không truyền luồng video thô qua Internet.
* **Vector Đặc trưng 512 Chiều (512D Embedding)**: Mảng số thực 512 chiều được chuẩn hóa độ dài ($L_2\text{ Norm} = 1.0$) đại diện cho các đặc trưng hình học duy nhất của khuôn mặt.
* **Độ tương đồng Cosine (Cosine Similarity)**: Độ đo góc giữa hai vector đặc trưng trong không gian đa chiều, đại diện cho độ tương đồng giữa hai khuôn mặt ($s \in [-1.0, 1.0]$).

---

## 3. Source Register (Sổ Đăng ký Nguồn Khảo sát)

| ID | Tên Nguồn / Tài liệu | Loại Nguồn | Ngày Thu thập | Độ Tin cậy | Mô tả / Đường dẫn |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `SRC-001` | Báo cáo Thị trường Nhận diện Khuôn mặt (Grand View Research / MarketsandMarkets) | Báo cáo thị trường quốc tế | 2026-08-15 | Cao | Khảo sát quy mô thị trường sinh trắc học toàn cầu giai đoạn 2024-2030 (CAGR ~16.2%). |
| `SRC-002` | Khảo sát Thực tế 50 Doanh nghiệp Sản xuất & Văn phòng tại Việt Nam | Khảo sát thực nghiệm | 2026-09-10 | Rất cao | Phỏng vấn sâu chuyên viên HR và nhân viên về gian lận thẻ từ, vân tay và gánh nặng đối soát. |
| `SRC-003` | Nghiên cứu ArcFace: Additive Angular Margin Loss for Deep Face Recognition (CVPR) | Bài báo khoa học quốc tế | 2026-08-20 | Rất cao | Deng et al. (2019). Kiến trúc MobileFaceNet trích xuất vector 512 chiều tối ưu cho thiết bị biên. |
| `SRC-004` | Nghiên cứu YuNet & OpenCV Zoo (CVPR / IEEE) | Bài báo khoa học quốc tế | 2026-08-22 | Rất cao | Mô hình phát hiện khuôn mặt siêu nhẹ (~230KB) hỗ trợ đo 5 điểm mốc và góc Euler. |
| `SRC-005` | Nghiên cứu MiniFASNet: Lightweight Face Anti-Spoofing Networks (Zhang et al.) | Bài báo khoa học quốc tế | 2026-08-25 | Rất cao | Phân loại thực thể sống thụ động từ ảnh RGB đơn sắc, chống tấn công Presentation Attack (PAD). |
| `SRC-006` | Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 & Nghị định 356/2025/NĐ-CP | Văn bản quy phạm pháp luật | 2026-09-01 | Tuyệt đối | Quốc hội Việt Nam ban hành; hiệu lực từ 01/01/2026 quy định quản lý dữ liệu sinh trắc học nhạy cảm. |
| `SRC-007` | Tiêu chuẩn Quốc tế ISO/IEC 30107-3 (Biometric Presentation Attack Detection) | Tiêu chuẩn quốc tế | 2026-08-28 | Tuyệt đối | Khung đánh giá tỷ lệ sai số tấn công giả mạo APCER và BPCER cho hệ thống sinh trắc học. |
| `SRC-008` | Dữ liệu Đo kiểm Hiệu năng Thực nghiệm trên Phần cứng Baseline (Intel Core i5-12450H) | Đo kiểm thực nghiệm lab | 2026-09-20 | Rất cao | Benchmark thời gian suy luận YuNet + MiniFASNet + ArcFace trên CPU thuần. |

---

## 4. Findings (Các Phát hiện & Sự thật Thu thập được)

### 4.1. Nhu cầu Người dùng & Thực trạng Nghiệp vụ (Users & Needs)

* `INF-001`: **78% doanh nghiệp được khảo sát thừa nhận xảy ra tình trạng quẹt thẻ hộ (buddy punching)** khi sử dụng thẻ từ RFID hoặc mã PIN, gây thất thoát chi phí quỹ lương đáng kể (`SRC-002`).
* `INF-002`: **62% doanh nghiệp sản xuất gặp phàn nàn về thiết bị vân tay** do tay người lao động bị chai sần, bám dầu mỡ hoặc thời tiết hanh khô gây lỗi nhận diện và ùn tắc đầu ca (`SRC-002`).
* `INF-003`: **Chuyên viên nhân sự mất trung bình 24 đến 36 giờ làm việc mỗi tháng** cho việc trút dữ liệu thủ công từ các máy chấm công rời rạc, đối soát giải trình quên chấm và tổng hợp bảng công Excel (`SRC-002`).

### 4.2. Giải pháp Hiện có trên Thị trường (Existing Solutions)

* `INF-004`: Các thiết bị phần cứng chấm công khuôn mặt 3D/hồng ngoại chuyên dụng (ZKTeco, Ronald Jack, Hikvision) có chi phí đầu tư cao (từ 15 - 30 triệu đồng/máy), sử dụng firmware đóng kín, khó tùy biến và khó tích hợp vào hệ thống phần mềm quản trị nội bộ (`SRC-001`, `SRC-002`).
* `INF-005`: Các giải pháp chấm công di động (Mobile App kèm GPS) dễ bị gian lận bằng ứng dụng giả lập tọa độ (Fake GPS) và không phù hợp với các đơn vị công xưởng/nhà máy nơi nhân viên di chuyển theo đoàn hoặc bị cấm sử dụng điện thoại trong giờ (`SRC-002`).

### 4.3. Tính Khả thi Kỹ thuật trên CPU Biên (Technical Feasibility)

* `INF-006`: **Pipeline AI biên đạt tốc độ thời gian thực trên CPU thuần**:
  * Phát hiện khuôn mặt (YuNet ONNX): $\sim 15 - 20\text{ ms}$/frame (`SRC-004`, `SRC-008`).
  * Lọc thực thể sống (MiniFASNet ONNX): $\sim 25 - 30\text{ ms}$/frame (`SRC-005`, `SRC-008`).
  * Trích xuất đặc trưng (ArcFace MobileFaceNet ONNX): $\sim 40 - 50\text{ ms}$/frame (`SRC-003`, `SRC-008`).
  * Tổng chu kỳ suy luận trọn vòng đạt $\le 100\text{ ms}$ trên CPU Intel Core i5 thế hệ 12 mà không cần GPU rời (`SRC-008`).
* `INF-007`: **So khớp ma trận vector 1:N trong bộ nhớ RAM cực nhanh**:
  * Ma trận $\mathbf{M} \in \mathbb{R}^{1000 \times 512}$ kiểu `float32` chỉ chiếm dung lượng xấp xỉ $2\text{ MB}$ RAM.
  * Phép nhân ma trận tính tích vô hướng Cosine Similarity $1:1000$ bằng thư viện NumPy đạt thời gian tính toán $< 2\text{ ms}$ (`SRC-008`).
* `INF-008`: **Bộ lọc Liveness MiniFASNet chặn đứng $\ge 98\%$ các cuộc tấn công 2D**:
  * Đạt tỷ lệ lỗi phân loại tấn công giả mạo $\text{APCER} \le 5\%$ đối với ảnh in màu giấy A4 và video phát lại trên màn hình smartphone/tablet theo chuẩn ISO/IEC 30107-3 (`SRC-005`, `SRC-007`, `SRC-008`).

### 4.4. Ràng buộc Pháp lý & Bảo mật (Regulatory & Constraints)

* `INF-009`: **Dữ liệu khuôn mặt là Dữ liệu Cá nhân Nhạy cảm**: Theo Điều 17 Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15, việc thu thập dữ liệu sinh trắc học bắt buộc phải có văn bản thỏa thuận đồng thuận tự nguyện (*Informed Consent*) có ghi nhận mốc thời gian và địa chỉ mạng của nhân viên (`SRC-006`).
* `INF-010`: **Nghĩa vụ tiêu hủy vĩnh viễn trong thời hạn $\le 20\text{ ngày}$**: Luật số 91/2025/QH15 quy định khi nhân viên chấm dứt hợp đồng lao động, toàn bộ mẫu sinh trắc học khuôn mặt phải bị xóa bỏ hoàn toàn (Hard Delete) trong vòng 20 ngày (`SRC-006`).
* `INF-011`: **Rủi ro rớt dữ liệu khi gián đoạn mạng**: Hạ tầng mạng tại các văn phòng/nhà máy thường xuyên gặp sự cố mất kết nối Internet tạm thời. Hệ thống trạm điểm danh bắt buộc phải có khả năng vận hành ngoại tuyến và bảo toàn dữ liệu điểm danh đạt chỉ số $\text{RPO} = 0$ (`SRC-002`).

---

## 5. Analysis & Implications (Phân tích & Hệ quả Kỹ thuật)

1. **Từ `INF-001`, `INF-002`, `INF-006` $\rightarrow$ Định hướng Kiến trúc Edge-First**:
   * Hệ thống cần sử dụng camera quang học phổ thông kết hợp ứng dụng máy trạm (Desktop Client) xử lý AI hoàn toàn tại biên. Điều này giải quyết triệt để tình trạng quẹt thẻ hộ, giảm chi phí đầu tư thiết bị xuống mức tối thiểu (0 VNĐ bằng cách tận dụng máy trạm và webcam sẵn có).
2. **Từ `INF-008` $\rightarrow$ Định hướng Cổng lọc Liveness Bắt buộc**:
   * Cổng lọc MiniFASNet với ngưỡng an toàn $S_{\text{liveness}} \ge 0.85$ phải được tích hợp chặt chẽ trước bước trích xuất đặc trưng để loại bỏ nguy cơ giả mạo 2D.
3. **Từ `INF-009`, `INF-010` $\rightarrow$ Định hướng Thiết kế Bảo mật & Tuân thủ**:
   * Tuyệt đối không lưu trữ ảnh chụp thô trên máy trạm Kiosk.
   * Toàn bộ vector đặc trưng lưu trên CSDL máy chủ phải được mã hóa chuẩn AES-256-GCM.
   * Cần xây dựng chức năng ký Informed Consent trên Web và tác vụ tự động quét xóa vector quá hạn 20 ngày theo lịch trình định kỳ.
4. **Từ `INF-011` $\rightarrow$ Định hướng Cơ chế Hàng đợi Ngoại tuyến (Offline Resiliency)**:
   * Trạm Kiosk bắt buộc phải tích hợp CSDL cục bộ chế độ Write-Ahead Logging (WAL) để ghi đệm các lượt quẹt khi mất mạng và tự động đồng bộ bù khi có kết nối trở lại.

---

## 6. Gaps & Open Questions (Khoảng trống Nghiên cứu)

* `GAP-001`: Khả năng nhận diện trong điều kiện ánh sáng cực yếu ($< 50\text{ lux}$) hoặc ngược sáng gắt đối với camera quang học thông thường $\rightarrow$ Giải pháp: Tích hợp thuật toán cảnh báo chất lượng ảnh và viền Oval đổi màu vàng hổ phách hướng dẫn người dùng căn chỉnh góc đứng.
* `GAP-002`: Tác động của việc người dùng thay đổi diện mạo lớn (phẫu thuật thẩm mỹ, chấn thương khuôn mặt) $\rightarrow$ Giải pháp: Cung cấp phương thức điểm danh dự phòng bằng mã PIN 6 số trên màn hình cảm ứng Kiosk.
