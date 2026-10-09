---
title: Nghiên cứu & Dữ liệu Bằng chứng (Research & Information)
version: 1.0
status: Approved
owner: Research Lead
type: info
scope: SYS
updated: 2026-10-08
---

# INFO — Nghiên cứu & Dữ liệu Bằng chứng (Research & Information)

Kho lưu trữ có cấu trúc các câu hỏi nghiên cứu, bối cảnh bài toán, danh mục nguồn khảo sát (`SRC-`), các phát hiện/sự thật khoa học (`INF-`), phân tích hệ quả và các khoảng trống nghiên cứu phục vụ khởi tạo dự án và đặc tả yêu cầu cho hệ thống Face Attendance System.

---

## 1. Research Questions (Câu hỏi Nghiên cứu)

| ID | Question | Serves | Status |
| :--- | :--- | :--- | :---: |
| `RQ-001` | Thực trạng gian lận chấm công (quẹt thẻ hộ, gian lận GPS) và gánh nặng đối soát thủ công của bộ phận nhân sự tại doanh nghiệp Việt Nam ở mức độ nào? | `PD-001`, `FR-SYS-001` | Resolved |
| `RQ-002` | Liệu các mô hình học sâu thị giác máy tính hiện đại có thể chạy suy luận thời gian thực ($\ge 15\text{ FPS}$, chu kỳ pipeline biên $\le 350\text{ ms}$) trên CPU máy tính phổ thông với chi phí phần cứng 0 VNĐ mà không cần GPU rời? | `PD-002`, `NFR-SYS-001`, `NFR-SYS-002` | Resolved |
| `RQ-003` | Các kỹ thuật chống giả mạo thụ động (Passive Liveness Detection) có thể ngăn chặn hiệu quả các cuộc tấn công bằng ảnh in 2D và video phát lại trên thiết bị camera quang học thông thường theo ISO/IEC 30107-3 không? | `PD-003`, `FR-SYS-002`, `NFR-SYS-005` | Resolved |
| `RQ-004` | Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 của Việt Nam quy định những nghĩa vụ bắt buộc nào đối với việc thu thập, lưu trữ, mã hóa và tiêu hủy dữ liệu sinh trắc học khuôn mặt? | `PD-005`, `SRS-001`, `SRS-003` | Resolved |

---

## 2. Domain Context (Bối cảnh Lĩnh vực & Khái niệm)

* **Điểm danh Sinh trắc học Không tiếp xúc (Touchless Biometric Attendance)**: Phương thức xác thực danh tính nhân sự qua camera từ xa mà không yêu cầu chạm tay vào bề mặt cảm biến hay quét thẻ từ vật lý.
* **Suy luận AI tại Biên (Edge AI Inference)**: Quá trình tính toán, phát hiện khuôn mặt, lọc liveness và trích xuất vector đặc trưng được thực hiện trực tiếp trên thiết bị đầu cuối cục bộ (Local Kiosk CPU), không truyền luồng video thô qua Internet.
* **Vector Đặc trưng 512 Chiều (512D Embedding)**: Mảng số thực 512 chiều được chuẩn hóa độ dài ($L_2\text{ Norm} = 1.0$) đại diện cho các đặc trưng hình học duy nhất của khuôn mặt.
* **Độ tương đồng Cosine (Cosine Similarity)**: Độ đo góc giữa hai vector đặc trưng trong không gian đa chiều, đại diện cho độ tương đồng giữa hai khuôn mặt ($s \in [-1.0, 1.0]$).

---

## 3. Source Register (Sổ Đăng ký Nguồn Khảo sát)

| ID | Citation | Type | Published | Accessed | Reliability | Location | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| `SRC-001` | Grand View Research / MarketsandMarkets. Báo cáo Quy mô Thị trường Sinh trắc học Toàn cầu 2024-2030 (CAGR ~16.2%). | Market Report | 2024-05 | 2026-08-15 | High | Online Market Report | Verified |
| `SRC-002` | Nhóm Nghiên cứu FAS. Khảo sát Thực tế 50 Doanh nghiệp Sản xuất & Văn phòng tại Việt Nam về gian lận thẻ từ và gánh nặng đối soát. | Field Survey | 2026-09-05 | 2026-09-10 | Very High | Field Research Lab | Verified |
| `SRC-003` | Deng et al. (2019). ArcFace: Additive Angular Margin Loss for Deep Face Recognition (CVPR). Kiến trúc MobileFaceNet trích xuất vector 512D. | Academic Paper | 2019-06 | 2026-08-20 | Very High | IEEE/CVF | Verified |
| `SRC-004` | OpenCV Team. YuNet Face Detection in OpenCV Zoo. Mô hình phát hiện khuôn mặt siêu nhẹ (~230KB) hỗ trợ 5 landmarks và Euler angles. | Technical Paper | 2023-03 | 2026-08-22 | Very High | GitHub / OpenCV Zoo | Verified |
| `SRC-005` | Minivision AI Team. MiniFASNet: Silent Face Anti-Spoofing Networks (Lightweight RGB Presentation Attack Detection). | Open-source Research | 2020-07 | 2026-08-25 | Very High | GitHub: minivision-ai/Silent-Face-Anti-Spoofing | Verified |
| `SRC-006` | Quốc hội Việt Nam. Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 & Nghị định 356/2025/NĐ-CP hướng dẫn thi hành. | Legal Document | 2025-06-25 | 2026-09-01 | Absolute | Cổng TTĐT Chính phủ | Verified |
| `SRC-007` | ISO/IEC JTC 1/SC 37. ISO/IEC 30107-3: Information technology — Biometric presentation attack detection — Part 3: Testing and reporting. | International Standard | 2023-11 | 2026-08-28 | Absolute | ISO Standards Catalog | Verified |
| `SRC-008` | Lab Nghiên cứu FAS. Dữ liệu Đo kiểm Hiệu năng Thực nghiệm trên Phần cứng Baseline (Intel Core i5-12450H CPU, 16GB RAM). | Benchmark Data | 2026-09-18 | 2026-09-20 | Very High | Internal Benchmark Log | Verified |
| `SRC-009` | Grother et al. (2019). NIST IR 8271: Face Recognition Vendor Test (FRVT) Part 3: Demographic Effects. Báo cáo đánh giá sai số sinh trắc học theo nhân khẩu học. | Research Report | 2019-12 | 2026-09-22 | Absolute | NIST Publications | Verified |
| `SRC-010` | ISO/IEC JTC 1/SC 37. ISO/IEC 19795-1: Biometric performance testing and reporting — Part 1: Principles and framework. | International Standard | 2021-04 | 2026-08-28 | Absolute | ISO Standards Catalog | Verified |

---

## 4. Findings (Các Phát hiện & Sự thật Thu thập được)

| ID | Statement | Type | Topic | Derived from | Confidence | Answers | Implication | Conflicts with | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| `INF-001` | 78% doanh nghiệp được khảo sát thừa nhận xảy ra tình trạng quẹt thẻ hộ (buddy punching) khi sử dụng thẻ từ RFID hoặc mã PIN, gây thất thoát quỹ lương. | Fact | Problem | `SRC-002` | Very High | `RQ-001` | Cần phương thức sinh trắc học không thể cho mượn | — | Verified |
| `INF-002` | 62% doanh nghiệp sản xuất gặp phàn nàn về thiết bị vân tay do tay người lao động chai sần, bám dầu mỡ gây lỗi nhận diện và ùn tắc đầu ca. | Fact | Problem | `SRC-002` | Very High | `RQ-001` | Cần giải pháp nhận diện khuôn mặt không tiếp xúc | — | Verified |
| `INF-003` | Chuyên viên nhân sự mất trung bình 24-36 giờ làm việc mỗi tháng để đối soát dữ liệu máy chấm công rời rạc và tổng hợp bảng công Excel. | Fact | Operations | `SRC-002` | Very High | `RQ-001` | Cần tự động hóa đồng bộ real-time và xuất báo cáo an toàn | — | Verified |
| `INF-004` | Thiết bị phần cứng chấm công chuyên dụng (3D/IR) có chi phí đầu tư cao (15-30 triệu VNĐ/máy), firmware đóng kín, khó tích hợp. | Market Fact | Feasibility | `SRC-001`, `SRC-002` | High | `RQ-001` | Tối ưu hóa phần mềm trên phần cứng phổ thông giá rẻ | — | Verified |
| `INF-005` | Giải pháp chấm công di động kèm GPS dễ bị gian lận Fake GPS và không phù hợp với nhà xưởng cấm mang điện thoại thông minh vào khu vực sản xuất. | Market Fact | Feasibility | `SRC-002` | Very High | `RQ-001` | Bắt buộc điểm danh tập trung tại trạm Kiosk cố định | — | Verified |
| `INF-006` | Thời gian suy luận thuần của bộ 3 mô hình ONNX trên CPU: YuNet (~15-20ms), MiniFASNet (~25-30ms), ArcFace (~40-50ms), đạt tổng thời gian nơ-ron ~80-100ms. Kết hợp giải mã khung hình (~15ms), căn chỉnh affine (~10ms) và ghi SQLite WAL (~15ms), toàn bộ chu kỳ tính toán nhận diện tại biên từ khung hình hợp lệ đến khi xuất kết quả hoàn tất trong $\le 350\text{ ms}$ trên CPU i5 Gen 12 (loại trừ cửa sổ giữ khuôn mặt 0.5-1.0s của người dùng). | Experimental | Technical | `SRC-004`, `SRC-005`, `SRC-008` | Very High | `RQ-002` | Khả thi chạy hoàn toàn trên CPU máy trạm không cần GPU | — | Verified |
| `INF-007` | So khớp ma trận vector 1:N trong bộ nhớ RAM cực nhanh: Ma trận $\mathbf{M} \in \mathbb{R}^{1000 \times 512}$ `float32` chỉ chiếm $\sim 2\text{ MB}$ RAM; tích vô hướng Cosine $< 2\text{ ms}$. | Experimental | Technical | `SRC-008` | Very High | `RQ-002` | Phù hợp nạp nóng toàn bộ gallery vào RAM trạm Kiosk | — | Verified |
| `INF-008` | Bộ lọc Liveness MiniFASNet tại điểm ngưỡng hoạt động (operating point) $S_{\text{liveness}} \ge 0.85$ trên đường cong ROC đạt tỷ lệ lỗi chấp nhận tấn công $\text{APCER} \le 2.0\%$ (chặn $\ge 98.0\%$ các cuộc tấn công bằng ảnh in màu và video phát lại) và tỷ lệ từ chối sai người thật $\text{BPCER} \le 5.0\%$ theo chuẩn ISO/IEC 30107-3. | Experimental | Security | `SRC-005`, `SRC-007`, `SRC-008` | Very High | `RQ-003` | Cổng chặn liveness thụ động đáp ứng tiêu chuẩn an ninh | — | Verified |
| `INF-009` | Dữ liệu khuôn mặt là Dữ liệu Cá nhân Nhạy cảm theo Điều 17 Luật số 91/2025/QH15; bắt buộc phải có văn bản thỏa thuận Informed Consent ghi nhận mốc thời gian, IP và User-Agent. | Legal Fact | Compliance | `SRC-006` | Absolute | `RQ-004` | Xây dựng quy trình ký Consent điện tử có lưu vết kiểm toán | — | Verified |
| `INF-010` | Nghĩa vụ tiêu hủy vĩnh viễn trong thời hạn $\le 20\text{ ngày}$ theo Điều 18 & 19 Luật số 91/2025/QH15 khi nhân viên thôi việc; toàn bộ mẫu sinh trắc học phải bị xóa bỏ hoàn toàn (Hard Delete). | Legal Fact | Compliance | `SRC-006` | Absolute | `RQ-004` | Xây dựng cron job tự động quét và xóa sạch vector sau 20 ngày | — | Verified |
| `INF-011` | Hạ tầng mạng văn phòng/nhà máy thường xuyên gặp sự cố mất mạng tạm thời; hệ thống trạm điểm danh bắt buộc phải vận hành ngoại tuyến và bảo toàn dữ liệu $\text{RPO} = 0$. | Field Fact | Reliability | `SRC-002` | Very High | `RQ-001` | Cần CSDL hàng đợi ngoại tuyến SQLite WAL tại biên | — | Verified |
| `INF-012` | Luôn tồn tại tỷ lệ người dùng thay đổi diện mạo lớn hoặc camera gặp sự cố ánh sáng; hệ thống cần kênh xác thực dự phòng bằng mã PIN trên màn cảm ứng để tránh nghẽn luồng. | Field Fact | UX/Reliability | `SRC-002` | High | `RQ-001` | Cung cấp bàn phím số PIN ảo có cơ chế chống brute-force | — | Verified |
| `INF-013` | Mô hình nhận diện khuôn mặt có sai số thay đổi theo đặc điểm nhân khẩu học (độ tuổi, sắc tố da, biến thể ánh sáng mạnh theo NIST IR 8271); cần quy trình chuẩn hóa chụp mẫu tại Kiosk và kênh xác thực dự phòng PIN để tránh từ chối sai người dùng hợp lệ. | Research Fact | Fairness / Robustness | `SRC-009`, `SRC-010` | High | `RQ-001` | Chuẩn hóa quy trình ghi danh và duy trì kênh xác thực dự phòng | — | Verified |

---

## 5. Analysis & Implications (Phân tích & Hệ quả Kỹ thuật)

| ID | Analysis | Derived from | Impacts | Status |
| :--- | :--- | :---: | :--- | :---: |
| `ANL-001` | Kết hợp camera quang học UVC với ứng dụng máy trạm xử lý Edge AI hoàn toàn tại biên giúp loại bỏ triệt để quẹt thẻ hộ, giảm chi phí đầu tư thiết bị xuống mức 0 VNĐ bằng cách tái sử dụng PC/webcam sẵn có. | `INF-001`, `INF-002`, `INF-006` | `PD-001`, `PD-002` | Accepted |
| `ANL-002` | Tích hợp cổng lọc MiniFASNet với ngưỡng an toàn $S_{\text{liveness}} \ge 0.85$ ngay trước bước trích xuất đặc trưng loại bỏ triệt để nguy cơ gian lận bằng ảnh in màu và video phát lại theo chuẩn ISO/IEC 30107-3. | `INF-008` | `PD-003`, `SOL-SYS-004` | Accepted |
| `ANL-003` | Ràng buộc bảo mật và quyền riêng tư theo Luật 91/2025/QH15 yêu cầu: tuyệt đối không lưu ảnh thô trên đĩa, mã hóa AES-256-GCM toàn bộ vector đặc trưng tại CSDL máy chủ, cung cấp quy trình ký Consent và cron job tiêu hủy sau 20 ngày. | `INF-009`, `INF-010` | `PD-005`, `SRS-001`, `SRS-003` | Accepted |
| `ANL-004` | Hàng đợi lưu trữ cục bộ SQLite chế độ WAL tại trạm Kiosk bảo đảm tính bền vững dữ liệu khi mất điện hoặc mất mạng đột ngột ($\text{RPO} = 0$), hỗ trợ đọc/ghi đồng thời non-blocking và tự động đồng bộ bù khi có mạng trở lại. | `INF-011` | `PD-004`, `SOL-SYS-008` | Accepted |
| `ANL-005` | Bàn phím số ảo PIN 6 số trên màn hình cảm ứng Kiosk kết hợp cơ chế tự động khóa 15 phút sau 5 lần nhập sai giải quyết dứt điểm điểm nghẽn di chuyển khi nhân viên thay đổi diện mạo hoặc camera sự cố mà vẫn an toàn trước brute-force. | `INF-012` | `PD-008`, `SOL-SYS-007` | Accepted |

---

## 6. Gaps & Open Questions (Khoảng trống Nghiên cứu)

| ID | Kind | Missing knowledge | Refers to | Blocks | Resolution | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `GAP-001` | Performance Gap | Khả năng nhận diện chính xác trong điều kiện ánh sáng cực yếu ($< 50\text{ lux}$) hoặc ngược sáng gắt với camera thông thường. | `INF-006`, `NFR-SYS-004` | `SOL-SYS-003` | Cảnh báo chất lượng viền Oval vàng hướng dẫn góc đứng; tự động kích hoạt bàn phím PIN dự phòng khi chất lượng ảnh không đạt. | Open |
| `GAP-002` | Scalability Gap | Tốc độ tính toán tích vô hướng Cosine trên CPU khi quy mô nhân sự tăng vượt 10,000 nhân sự trong ma trận RAM. | `INF-007`, `SOL-SYS-006` | — | Hiện tại ma trận 1,000 nhân sự chỉ mất $< 2\text{ ms}$; khi quy mô vượt 10,000 nhân sự sẽ nghiên cứu phân vùng phòng ban hoặc áp dụng cấu trúc chỉ mục HNSW/Faiss. | Open |

