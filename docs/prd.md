---
title: Product Requirements Document (PRD) — Hệ Thống Chấm Công Nhận Diện Khuôn Mặt (FAS)
version: 1.0
status: Approved
owner: Lead Product Manager
type: prd
scope: SYS
updated: 2026-11-02
compliance: Luật Bảo vệ dữ liệu cá nhân 2025 (Luật số 91/2025/QH15) & Nghị định 356/2025/NĐ-CP
---

# Product Requirements Document (PRD)
## Hệ Thống Chấm Công Doanh Nghiệp Bằng Nhận Diện Khuôn Mặt (Enterprise Face Attendance System — FAS)

---

## Document Control

- **PRD ID**: `PRD-SYS-001`
- **Tình trạng (Status)**: Approved
- **Tên Sản phẩm / Dự án**: Enterprise Face Attendance System (FAS)
- **Chủ sở hữu (Owner)**: Lead Product Manager & System Architect
- **Các bên liên quan & Đánh giá (Reviewers)**:
  - Lead System Architect
  - Lead Quality Engineer & Security Review Team
  - Data Protection Officer (DPO)
  - HR Operations Representative
- **Ngày cập nhật**: 2026-11-08
- **Tài liệu căn cứ & Liên kết**:
  - [Cẩm nang Điều hướng Toàn hệ thống](README.md)
  - [Bản Đề xuất Cơ hội & Khám phá Sản phẩm](discovery/opportunity-brief.md)
  - [Tổng quan Kiến trúc Hệ thống Toàn diện](architecture.md)
  - [Đặc tả Yêu cầu Kỹ thuật Phần mềm (SRS)](specs/SRS.md)
  - [Ma trận Truy vết Yêu cầu (RTM)](specs/RTM.md)
  - [Hợp đồng Giao tiếp Máy đọc Tập trung](../contracts/README.md)
  - [Chỉ mục 8 Tính năng Cốt lõi](features/README.md)

---

## 1. Executive Summary

Hệ thống Chấm công Doanh nghiệp Bằng Nhận Diện Khuôn Mặt (**Face Attendance System — FAS**) là giải pháp điểm danh tự động, không chạm (**touchless**), tích hợp toàn diện chu trình vận hành nhân sự từ trạm thiết bị biên (**Edge Kiosk Desktop**), máy chủ trung tâm (**Central Backend Service**) đến cổng web quản trị & tự phục vụ (**Web Portal**).

Hệ thống giải quyết triệt để 3 vấn nạn nhức nhối của các phương thức điểm danh truyền thống (thẻ từ RFID, vân tay, quét mã QR):
1. **Nạn quẹt thẻ hộ (buddy punching)** làm thất thoát quỹ lương và xói mòn kỷ luật lao động.
2. **Lỗi nhận diện vân tay** do tay người lao động chai sần, dính dầu mỡ, ẩm ướt gây ùn tắc nghiêm trọng đầu ca sản xuất.
3. **Gánh nặng đối soát thủ công** hàng chục giờ công mỗi tháng của bộ phận nhân sự (HR) từ các máy chấm công rời rạc.

Điểm đột phá của FAS là **suy luận trí tuệ nhân tạo thuần tại biên (Edge AI on pure CPU)** với chi phí phần cứng 0 VNĐ cho GPU, bảo vệ dữ liệu theo nguyên tắc **Zero Raw Image Upload** (không tải hay lưu bất kỳ ảnh chụp khuôn mặt nào lên máy chủ) và tuân thủ tuyệt đối **Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15** cùng **Nghị định 356/2025/NĐ-CP** thông qua cơ chế mã hóa AES-256-GCM và tự động tiêu hủy sinh trắc học sau 20 ngày kể từ khi nhân viên thôi việc.

---

## 2. Problem Statement and Evidence

### 2.1. Vấn Đề Nghiệp Vụ (Problem Statement)

Tại các doanh nghiệp sản xuất và văn phòng quy mô vừa và lớn tại Việt Nam:
- **Tổn thất tài chính do chấm công hộ**: Thẻ từ RFID và mã PIN dễ dàng chuyển giao cho đồng nghiệp quẹt hộ khi đi muộn hoặc vắng mặt; mã QR tĩnh/chụp màn hình dễ bị chia sẻ qua ứng dụng nhắn tin.
- **Tắc nghẽn tại cửa ra vào đầu ca**: Công nhân nhà xưởng cơ khí, may mặc, chế biến thực phẩm có vân tay bị mòn, dính bụi bẩn dẫn đến tỷ lệ từ chối sai (FRR) của máy vân tay quang học truyền thống rất cao, gây bức xúc và chậm giờ vào ca.
- **Rời rạc dữ liệu và đối soát chậm trễ**: Dữ liệu máy chấm công độc lập thường chỉ được trút thủ công vào cuối tuần hoặc cuối tháng; HR không có dữ liệu sĩ số thực tế đầu ca để kịp thời điều chuyển nhân lực cho các dây chuyền thiếu hụt.
- **Rủi ro pháp lý về quyền riêng tư**: Các hệ thống camera nhận diện khuôn mặt thương mại trôi nổi thường xuyên lưu trữ ảnh chụp thô chân dung nhân viên trên đám mây công cộng không mã hóa, vi phạm nghiêm trọng Luật Bảo vệ Dữ liệu Cá nhân 2025 với mức phạt chế tài lên tới 5% doanh thu.

### 2.2. Bằng Chứng Thực Nghiệm & Căn Cứ Dữ Liệu (Evidence)

| Mã Bằng Chứng | Nguồn & Quan sát Thực tế | Bối cảnh Khảo sát | Mức Tin cậy | Ý nghĩa Kỹ thuật / Nghiệp vụ |
| :--- | :--- | :--- | :---: | :--- |
| **EVD-001** | `SRC-002` / `INF-001`: Khảo sát 50 doanh nghiệp sản xuất và văn phòng tại Việt Nam. | 78% doanh nghiệp thừa nhận xảy ra tình trạng quẹt thẻ hộ khi dùng thẻ từ RFID hoặc mã PIN. | Rất cao | Bắt buộc chuyển đổi sang sinh trắc học khuôn mặt không thể chuyển giao. |
| **EVD-002** | `SRC-002` / `INF-002`: Khảo sát tại các nhà máy sản xuất linh kiện, da giày và may mặc. | 62% doanh nghiệp phàn nàn về thiết bị vân tay do tay công nhân chai sần, dính dầu mỡ gây ùn tắc. | Rất cao | Bắt buộc áp dụng công nghệ nhận diện không tiếp xúc (Touchless Video Stream). |
| **EVD-003** | `SRC-002` / `INF-003`: Phỏng vấn sâu 20 trưởng phòng nhân sự doanh nghiệp quy mô 300 - 2,000 nhân sự. | HR mất trung bình 24 - 36 giờ làm việc/tháng để đối soát dữ liệu máy chấm công rời rạc và tổng hợp bảng công. | Rất cao | Cần luồng phát sóng dữ liệu trực tiếp thời gian thực (Real-time Live Stream) và tự động tính toán ca kíp. |
| **EVD-004** | `SRC-006` / `INF-005`: Quốc hội ban hành Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 & NĐ 356/2025/NĐ-CP. | Quy định nghiêm ngặt về Informed Consent, mã hóa vector sinh trắc học và tiêu hủy sau 20 ngày thôi việc. | Tuyệt đối | Kiến trúc hệ thống phải thỏa mãn 100% các điều khoản bảo vệ dữ liệu cá nhân. |
| **EVD-005** | `SRC-008` / `INF-007`: Đo kiểm thực nghiệm phần cứng CPU máy trạm phổ thông (Intel Core i5-12450H, 16GB RAM). | YuNet (18ms) + MiniFASNet (28ms) + ArcFace 512D (35ms) + Matrix 1:N 1000 users (0.12ms) = 81.12ms $\le 350\text{ ms}$. | Rất cao | Khẳng định tính khả thi vượt trội khi suy luận Edge AI thuần CPU, chi phí phần cứng bổ sung 0 VNĐ. |

---

## 3. Target Users and Context

Hệ thống được thiết kế xoay quanh 4 nhóm tác nhân người dùng với các vai trò, nhu cầu và hành trình tương tác chuyên biệt:

| Tác nhân | Vai trò Hệ thống | Nhu Cầu & Mục Tiêu Nghiệp Vụ (Jobs to be Done) | Khó Khăn Hiện Tại (Current Pain Points) | Kết Quả Mong Đợi (Desired Outcomes) |
| :--- | :--- | :--- | :--- | :--- |
| **Nhân viên (Employee)** `ACT-001` | Role `EMPLOYEE` | - Điểm danh vào/ra ca nhanh chóng, chính xác.<br>- Sử dụng mã PIN dự phòng khi sự cố sinh trắc.<br>- Tra cứu bảng công cá nhân, nộp đơn giải trình công trực tuyến.<br>- Chủ động quản lý quyền riêng tư sinh trắc học. | - Xếp hàng chờ máy vân tay lâu đầu ca.<br>- Quên thẻ từ bị phạt hoặc trừ công.<br>- Thủ tục giải trình công giấy tờ phiền hà.<br>- Lo ngại lộ lọt ảnh chân dung cá nhân. | - Nhận diện khuôn mặt touchless dưới 1 giây.<br>- Không cần mang theo bất kỳ thẻ vật lý nào.<br>- Nộp đơn giải trình trên Web duyệt trong ngày.<br>- Yên tâm vì hệ thống không lưu giữ ảnh thô. |
| **Chuyên viên Nhân sự (HR Specialist)** `ACT-002` | Role `HR_MANAGER` | - Giám sát sĩ số công nhân/nhân viên trực tiếp đầu ca.<br>- Cấu hình danh mục ca làm việc, phân ca linh hoạt.<br>- Xét duyệt đơn giải trình công có minh chứng.<br>- Chốt bảng công và xuất báo cáo Excel an toàn. | - Mất hàng chục giờ đối soát số liệu cuối tháng.<br>- Thiếu hụt công nhân đầu ca không biết trước để bố trí bù dây chuyền.<br>- File Excel bị lỗi công thức hoặc rủi ro macro/Formula Injection. | - Live Dashboard cập nhật từng lượt quẹt $\le 200\text{ ms}$.<br>- Tự động phân loại đi muộn, về sớm theo ân hạn 15 phút.<br>- Xuất bảng công Excel chuẩn chỉ sau 1 click. |
| **Quản trị viên Hệ thống (System Admin)** `ACT-003` | Role `ADMIN` | - Cấp phát tài khoản, phân quyền RBAC an toàn.<br>- Đăng ký và quản lý mạng lưới các trạm Kiosk.<br>- Giám sát nhật ký kiểm toán (Audit Logs), phiên đăng nhập và nhịp tim Kiosk.<br>- Khôi phục sự cố và mở khóa kỳ công khi có phê duyệt. | - Nguy cơ lộ lọt tài khoản quản trị mặc định.<br>- Khó phát hiện trạm Kiosk bị ngắt kết nối mạng.<br>- Thiếu nhật ký truy vết khi xảy ra tranh chấp dữ liệu chấm công. | - Khởi tạo an toàn (Bootstrap) không mật khẩu mặc định.<br>- Giám sát trực quan trạng thái kết nối mạng Kiosk.<br>- Nhật ký audit log bất biến ghi vết 100% giao dịch. |
| **Cán bộ Bảo vệ Dữ liệu (DPO)** `ACT-004` | Role `DPO` | - Giám sát tính hợp pháp của việc thu thập sinh trắc.<br>- Kiểm tra chữ ký thỏa thuận số Informed Consent.<br>- Tiếp nhận và xử lý yêu cầu rút thỏa thuận của nhân sự.<br>- Kiểm tra định kỳ tác vụ xóa vĩnh viễn vector 20 ngày thôi việc và 7 ngày rút consent. | - Rủi ro bị cơ quan chức năng xử phạt vi phạm Luật 2025.<br>- Thiếu công cụ chứng minh việc xóa dữ liệu đã thực hiện.<br>- Dữ liệu sinh trắc bị lưu trữ văn bản rõ (plaintext). | - Báo cáo tuân thủ tự động theo Luật 91/2025/QH15.<br>- Bằng chứng mã hóa AES-256-GCM cho 100% vector.<br>- Cron job xóa cứng tự động có log xác thực. |

---

## 4. Goals and Success Measures

### 4.1. Mục Tiêu Chiến Lược (Goals)

- **G-001**: Xây dựng trải nghiệm điểm danh không chạm hoàn toàn tại biên đạt thời gian đáp ứng tổng thể $\le 350\text{ ms}$ trên CPU phổ thông, không phụ thuộc GPU.
- **G-002**: Đảm bảo độ chính xác nhận diện sinh trắc học cấp doanh nghiệp đạt tỷ lệ nhận diện đúng $\text{TPIR} \ge 95.0\%$ với quy mô $N = 1,000$ nhân viên trong điều kiện ánh sáng tiêu chuẩn ($\ge 150\text{ lux}$).
- **G-003**: Miễn nhiễm với các hình thức tấn công giả mạo 2D (Presentation Attacks qua ảnh in, màn hình tablet/smartphone) với tỷ lệ chặn $\ge 98.0\%$.
- **G-004**: Đảm bảo tính liên tục vận hành và khả năng chịu lỗi ngoại tuyến (Offline-First Resiliency) với cam kết không thất thoát bản ghi điểm danh ($\text{RPO} = 0$).
- **G-005**: Tự động hóa giám sát thời gian thực, truyền thông sự kiện điểm danh lên Web Dashboard trong vòng $\le 200\text{ ms}$, cắt giảm $\ge 85\%$ thời gian tổng hợp đối soát công hàng tháng của bộ phận nhân sự.
- **G-006**: Tuân thủ 100% các quy định bắt buộc của Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP.

### 4.2. Chỉ Số Đo Lường Thành Công (Success Metrics)

| Mã Chỉ Số | Tên Chỉ Số & Định Nghĩa Kỹ Thuật | Giá Trị Hiện Tại (Baseline) | Mục Tiêu Nghiệm Thu (Target) | Phương Pháp & Chu Kỳ Đo Lường | Chủ Trì (Owner) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MET-001** | **Thời gian chu kỳ nhận diện biên (Inference Latency)**: Thời gian từ khi định vị mặt chuẩn trong Oval đến khi hiển thị kết quả. | ~1,200 ms (hệ thống cloud/server cũ) | $\le 350\text{ ms}$ (CPU pure) | Benchmark đo trực tiếp tại Kiosk qua `Internal Benchmark Log` | Edge AI Lead |
| **MET-002** | **Độ chính xác sinh trắc học 1:N**: Tỷ lệ bỏ sót nhận diện sai ($\text{FNIR}$) tại ngưỡng $\text{FPIR} \le 0.1\%$ với $N = 1,000$ khuôn mặt (ISO/IEC 19795-1). | FNIR ~12% (1 template cũ) | $\text{FNIR} \le 5.0\%$ ($\text{TPIR} \ge 95.0\%$) | Kiểm thử trên bộ dữ liệu kiểm chuẩn ánh sáng $\ge 150\text{ lux}$ | AI Lead |
| **MET-003** | **Khả năng chống giả mạo (Anti-Spoofing APCER)**: Tỷ lệ chấp nhận tấn công mẫu in/video giả mạo 2D (ISO/IEC 30107-3). | APCER ~15% (không liveness) | $\text{APCER} \le 2.0\%$ (tại $S_{\text{liveness}} \ge 0.85$) | Test suite giả mạo màn hình, ảnh in màu theo ISO 30107-3 | Vision QA Lead |
| **MET-004** | **Bảo toàn dữ liệu ngoại tuyến (RPO)**: Số lượng bản ghi quẹt công bị mất khi mất điện hoặc mất mạng đột ngột. | RPO = 1 - 5 bản ghi | $\text{RPO} = 0$ (Không mất dữ liệu) | Crash simulation test suite trên SQLite WAL | Kiosk Eng Lead |
| **MET-005** | **Độ trễ phát sóng thời gian thực**: Thời gian từ khi Kiosk gửi punch đến khi Web Dashboard cập nhật dòng điểm danh. | Không có (chỉ import Excel) | $\le 200\text{ ms}$ (mạng LAN tiêu chuẩn) | Đo kiểm thời gian gói tin WebSocket STOMP + DOM Render | Fullstack Lead |
| **MET-006** | **Tỷ lệ tuân thủ tiêu hủy dữ liệu**: Tỷ lệ bản ghi sinh trắc của nhân viên thôi việc quá 20 ngày được xóa sạch. | 0% (lưu trữ vĩnh viễn) | 100% (Xóa cứng tự động) | Audit log kiểm tra tác vụ Scheduled Cron 01:00 AM hàng ngày | DPO & Backend Lead |
| **MET-007** | **Thời gian đối soát bảng công của HR**: Số giờ làm việc HR cần để tổng hợp và hoàn tất kỳ công tháng. | 24 - 36 giờ/tháng | $\le 4$ giờ/tháng (giảm $\ge 85\%$) | Khảo sát thực tế bộ phận nhân sự sau 2 chu kỳ tính lương | HR Operations Lead |

---

## 5. Non-Goals (Ngoài Phạm Vi Sản Phẩm)

Để duy trì tính tập trung cao độ vào kiến trúc cốt lõi và tối ưu hóa hiệu năng, các tính năng sau đây được xác định rõ ràng là **ngoài phạm vi (Out-of-Scope)** của hệ thống FAS:

- **NG-001: Không xây dựng phân hệ tính lương chi tiết (Detailed Payroll Engine)**: Hệ thống chỉ quản lý và kết xuất bảng chấm công tổng hợp chuẩn xác (giờ làm, đi muộn, về sớm, vắng, giải trình). Việc tính toán tiền lương, bậc thuế TNCN, đóng góp BHXH sẽ được kết nối với phần mềm kế toán/tiền lương chuyên dụng qua định dạng Excel/REST API.
- **NG-002: Không hỗ trợ nhận diện đám đông tầm xa qua camera an ninh CCTV (Crowd Surveillance)**: Hệ thống tập trung giải quyết bài toán điểm danh tự phục vụ 1:1 tương tác trong vùng thị trường kiểm soát ($0.4 - 0.8\text{ m}$) với luồng kiểm chuẩn góc mặt và liveness nghiêm ngặt, không phục vụ mục đích giám sát an ninh diện rộng.
- **NG-003: Không tích hợp điều khiển cơ điện tử rào chắn tự động (Turnstile / Access Control Hardware Relays)** trong phiên bản hiện tại. Các trạm Kiosk hoạt động như trạm xác thực điểm danh độc lập.
- **NG-004: Không phát triển ứng dụng di động bản địa riêng (Native Mobile Apps for iOS / Android)**: Mọi chức năng tự phục vụ của nhân viên và quản trị nhân sự được tối ưu hóa hiển thị trên giao diện Web Responsive của Cổng Web Portal.
- **NG-005: Tuyệt đối không lưu trữ hoặc tải ảnh chụp khuôn mặt thô (Zero Photo Upload Invariant)**: Không xây dựng bất kỳ tính năng tải tệp ảnh chân dung (`.jpg`, `.png`) hay lưu trữ ảnh khuôn mặt dạng base64/binary lên máy chủ nhằm bảo vệ quyền riêng tư tuyệt đối theo quy định pháp luật.

---

## 6. Scope and Candidate Capabilities

### 6.1. Trong Phạm Vi (In-Scope Capabilities)

Hệ thống bao gồm 3 phân hệ cấu thành hoàn chỉnh:

1. **Phân hệ Trạm Điểm danh Kiosk Cận biên (`kiosk-app`)**:
   - Ứng dụng desktop đồ họa PySide6/QML tối ưu cho màn hình cảm ứng tỷ lệ 9:16 dọc (Portrait Viewport).
   - Camera quang học USB UVC với tốc độ hiển thị preview mượt mà $\ge 15\text{ FPS}$.
   - Khung Oval hướng dẫn tương tác với 4 trạng thái phản hồi màu trực quan (Xanh dương, Vàng, Xanh lá, Đỏ).
   - Pipeline AI biên 4 tầng: Phát hiện khuôn mặt & góc Euler (YuNet) $\rightarrow$ Cổng căn chỉnh Oval $\rightarrow$ Kiểm tra thực thể sống (MiniFASNet $S_{\text{liveness}} \ge 0.85$) $\rightarrow$ Trích xuất vector 512D ArcFace ($L_2 = 1.0$) và so khớp Cosine 1:N với ma trận bộ nhớ RAM.
   - Bàn phím số ảo PIN dự phòng với cơ chế khóa 15 phút chống tấn công vét cạn (brute-force).
   - Bộ đệm lưu trữ ngoại tuyến bền vững SQLite chế độ WAL, tự động phát hiện mạng và gửi bù theo lô tối đa 50 bản ghi/lần khi kết nối phục hồi.
   - Luồng tự đăng ký mẫu khuôn mặt Guided Multi-Pose 3 tư thế (Chính diện, Nghiêng trái, Nghiêng phải) tiếp nhận OTP kích hoạt tại chỗ.

2. **Phân hệ Máy chủ Doanh nghiệp (`backend-service`)**:
   - Máy chủ REST API & WebSocket STOMP xây dựng trên Java 21 LTS và Spring Boot.
   - Quản lý hồ sơ nhân sự, danh mục ca làm việc (ca chuẩn, ca gãy, thời gian ân hạn 15 phút), tự động đánh giá trạng thái công (`ON_TIME`, `LATE`, `EARLY_LEAVE`, `ANOMALOUS`).
   - Bộ đệm chống quét trùng lặp Cooldown 120 giây hai tầng (Caffeine Cache in RAM + kiểm tra mốc thời gian CSDL PostgreSQL).
   - Mã hóa đối xứng AES-256-GCM với Master Key nạp độc lập từ biến môi trường cho 100% vector sinh trắc học ở trạng thái lưu trữ tĩnh (`biometric_templates`).
   - Kênh thông điệp đẩy thời gian thực WebSocket STOMP phân phối tức thì sự kiện điểm danh và cập nhật mẫu khuôn mặt.
   - Tác vụ ngầm định kỳ hàng ngày quét xóa vĩnh viễn dữ liệu sinh trắc học sau 20 ngày kể từ ngày nhân viên thôi việc và sau 7 ngày kể từ khi rút thỏa thuận Consent.

3. **Phân hệ Cổng Web Quản trị & Tự phục vụ (`web-portal`)**:
   - Giao diện SPA hiện đại xây dựng trên React 19, TypeScript, Vite và Tailwind CSS.
   - Màn hình giám sát trực tiếp Live Attendance Dashboard cập nhật theo thời gian thực không cần tải lại trang.
   - Quản lý nhân sự, phân ca làm việc tránh chồng lấn, quản lý danh mục trạm Kiosk.
   - Quy trình tự phục vụ nhân viên: Đọc và ký cam kết điện tử Informed Consent (bắt buộc cuộn hết nội dung điều khoản), sinh mã OTP đăng ký khuôn mặt thời hạn 48 giờ, thiết lập/đổi mã PIN dự phòng, tra cứu lịch sử chấm công cá nhân, nộp đơn giải trình công trực tuyến.
   - Chốt kỳ công hàng tháng và kết xuất bảng công Excel (.xlsx) có cơ chế vô hiệu hóa mã độc Formula Injection.

---

### 6.2. Phân Rã Danh Mục Epics (Epic Breakdown)

| Mã Epic | Tên Epic & Năng Lực Cốt Lõi | Giá Trị & Kết Quả Nghiệp Vụ Mang Lại | Mức Ưu Tiên | Phân Hệ Liên Quan |
| :--- | :--- | :--- | :---: | :--- |
| **EPIC-001** | **Core Biometric Edge Pipeline** | Nhận diện khuôn mặt touchless siêu tốc $\le 350\text{ ms}$, chống giả mạo 2D MiniFASNet và so khớp ma trận RAM $N \times 512$. | Must | `kiosk-app` |
| **EPIC-002** | **Guided Multi-Pose Enrollment (`FEAT-ENROLL-001`)** | Tự đăng ký mẫu khuôn mặt 3 tư thế (Frontal, Left Tilt, Right Tilt) đạt chuẩn chất lượng với mã OTP 48 giờ, nâng cao nhận diện góc nghiêng. | Must | `kiosk-app`, `backend-service`, `web-portal` |
| **EPIC-003** | **Offline-First Resiliency & Sync** | Đảm bảo Kiosk hoạt động liên tục khi mất mạng, ghi đệm SQLite WAL và tự động đồng bộ bù khi kết nối phục hồi ($\text{RPO} = 0$). | Must | `kiosk-app`, `backend-service` |
| **EPIC-004** | **Shift & Attendance Evaluation** | Cấu hình ca kíp, thời gian ân hạn 15 phút, tự động phân loại đúng giờ/đi muộn/về sớm và chống quẹt trùng Cooldown 120 giây. | Must | `backend-service` |
| **EPIC-005** | **Real-time Live Monitoring Dashboard** | Hiển thị tức thì sĩ số trực tiếp, danh sách quẹt thẻ và cảnh báo bất thường lên màn hình giám sát Web qua WebSocket STOMP $\le 200\text{ ms}$. | Must | `backend-service`, `web-portal` |
| **EPIC-006** | **Legal Compliance & Data Privacy** | Ký cam kết Informed Consent điện tử, mã hóa AES-256-GCM độc lập cho vector, tự động tiêu hủy sinh trắc học sau 20 ngày thôi việc và 7 ngày rút consent theo Luật 2025. | Must | `backend-service`, `web-portal` |
| **EPIC-007** | **HR Operations & Secure Reporting** | Xử lý đơn giải trình công trực tuyến, chốt kỳ công tháng và xuất báo cáo bảng công Excel an toàn chống Formula Injection. | Must | `web-portal`, `backend-service` |
| **EPIC-008** | **System Security, Auditing & Administration** | Phân quyền RBAC qua JWT/Refresh token, khởi tạo Bootstrap an toàn, cấp phát Secret Token cho Kiosk, ghi nhật ký kiểm toán bất biến. | Must | `backend-service`, `web-portal`, `kiosk-app` |

---

## 7. High-Level Requirements and User Experience

### 7.1. Hành Trình Người Dùng Chính (Primary User Journeys)

#### 1. Hành trình Tiếp nhận & Kích hoạt (Onboarding & Activation Flow)
```
[Web Portal] Nhân viên đăng nhập lần đầu
     ↓
Đọc văn bản Thỏa thuận Informed Consent (Bắt buộc cuộn 100% nội dung)
     ↓
Tích chọn cam kết & Xác nhận ký → Ghi nhận Audit Log (IP, User-Agent, Thời gian)
     ↓
Hệ thống sinh mã Onboarding OTP 6 chữ số (Hiệu lực 48 giờ)
     ↓
[Kiosk App] Nhân viên đến trạm Kiosk, chọn "Đăng ký khuôn mặt"
     ↓
Nhập mã OTP 6 số → Xác thực thành công → Nhận Session Token 15 phút
     ↓
Luồng hướng dẫn chụp 3 tư thế (Guided Multi-Pose):
  - Tư thế 1: Chính diện (FRONTAL, |Yaw| ≤ 5°) → Giữ 0.25s → Chụp
  - Tư thế 2: Nghiêng trái (LEFT_TILT, Yaw ∈ [10°, 25°]) → Giữ 0.25s → Chụp
  - Tư thế 3: Nghiêng phải (RIGHT_TILT, Yaw ∈ [-25°, -10°]) → Giữ 0.25s → Chụp
     ↓
Trích xuất 3 vector ArcFace 512D ($L_2 = 1.0$) → Gửi lên Backend
     ↓
Backend mã hóa độc lập 3 vector bằng AES-256-GCM → Kích hoạt ACTIVE → Broadcast STOMP
     ↓
Kiosk hoàn tất trong 3 giây → Tự động nạp vector vào RAM cho điểm danh ngay lập tức
```

#### 2. Hành trình Điểm danh Thường nhật (Daily Attendance Flow)
```
Nhân viên bước vào trước trạm Kiosk (Khoảng cách 0.4 - 0.8m)
     ↓
Camera bắt diện mạo → YuNet định vị bounding box & 5 điểm mốc (Euler Angles)
     ↓
Gương mặt lọt vào khung Oval → Khung chuyển màu Vàng (Holding 0.5s - 1.0s)
     ↓
MiniFASNet kiểm tra liveness (Ngưỡng S_liveness ≥ 0.85)
  ├─ Nếu Giả mạo (Ảnh in/Video) → Khung Oval đỏ, phát âm thanh cảnh báo, từ chối
  └─ Nếu Người thật (Live) → Chuyển tiếp trích xuất ArcFace 512D
         ↓
So khớp Cosine 1:N với ma trận RAM (Threshold ≥ 0.65)
  ├─ Tìm thấy khớp tốt nhất (Best Match) → Kiểm tra Cooldown 120s
  │     ├─ Nếu trùng trong 120s → Báo "Bạn đã điểm danh, vui lòng không quẹt lại"
  │     └─ Nếu hợp lệ → Khung Oval xanh lá, hiển thị Tên, Mã NV, Giờ quẹt
  │           ├─ Có mạng: Gửi POST /api/v1/kiosk/attendance → Broadcast STOMP lên Web
  │           └─ Mất mạng: Ghi đệm SQLite WAL → Worker tự gửi bù khi có mạng
  └─ Không khớp / Mờ / Sự cố sinh trắc → Chuyển sang bàn phím ảo PIN dự phòng
```

### 7.2. Quy Tắc Nghiệp Vụ Cốt Lõi (Key Business Rules)

- **BR-001 (Quy tắc Cooldown 120s)**: Một nhân viên chỉ được ghi nhận 1 lượt quẹt điểm danh hợp lệ trong mỗi cửa sổ 120 giây để loại trừ quẹt trùng lặp vô ý do đứng trước camera quá lâu.
- **BR-002 (Thời gian Ân hạn Đi muộn)**: Ca làm việc hỗ trợ cấu hình thời gian ân hạn (Grace Period, mặc định 15 phút). Check-in trong khoảng `[Start_Time, Start_Time + Grace_Period]` được tính là `ON_TIME`. Check-in sau mốc này tính là `LATE` kèm số phút trễ chính xác.
- **BR-003 (Khóa Brute-force Bàn phím PIN & OTP)**: Nhập sai mã PIN hoặc mã OTP liên tiếp 5 lần sẽ kích hoạt khóa trạm 15 phút tại Kiosk và khóa tài khoản phía Backend (HTTP 423 `OTP_LOCKED` / `PIN_LOCKED`) nhằm ngăn chặn vét cạn mã số.
- **BR-004 (An toàn Xuất Báo cáo Excel)**: Mọi trường dữ liệu văn bản khi xuất file Excel/CSV bắt đầu bằng các ký tự nguy hiểm (`=`, `+`, `-`, `@`) bắt buộc phải được tự động chèn ký tự nháy đơn (`'`) ở đầu chuỗi nhằm ngăn chặn tấn công Formula Injection (CWE-1236).

### 7.3. Ràng Buộc Pháp Lý & Quyền Riêng Tư (Privacy & Legal Governance)

- **PRV-001 (Zero Raw Photo Retention)**: Không có bất kỳ hình ảnh chân dung thô nào của người lao động được ghi vào ổ cứng trạm Kiosk hay máy chủ trung tâm. Hình ảnh camera chỉ tồn tại tạm thời trong RAM của Kiosk trong suốt chu kỳ tính toán và bị hủy ngay lập tức.
- **PRV-002 (Mã hóa Vector Tĩnh AES-256-GCM)**: 100% vector sinh trắc học lưu trữ trong bảng `biometric_templates` phải được mã hóa dạng BYTEA (2048 bytes vector + 16 bytes auth tag) kèm IV 12 bytes ngẫu nhiên độc nhất cho từng bản ghi.
- **PRV-003 (Tự động Tiêu hủy Sau 20 Ngày)**: Tác vụ định kỳ quét và xóa vĩnh viễn (Hard Delete) toàn bộ các bản ghi vector của nhân viên có ngày thôi việc quá 20 ngày theo Điều 18 & 19 Luật số 91/2025/QH15.
- **PRV-004 (Rút Thỏa thuận Consent)**: Khi nhân viên rút Informed Consent, quyền sử dụng sinh trắc học bị vô hiệu hóa tức thì, chuyển hoàn toàn sang mã PIN và toàn bộ vector bị xóa vĩnh viễn trong vòng 7 ngày.

---

## 8. Constraints, Assumptions, Dependencies, and Risks

### 8.1. Ràng Buộc Kỹ Thuật & Môi Trường (Constraints)

| Mã Ràng Buộc | Nội Dung Ràng Buộc | Nguồn Gốc / Căn Cứ | Mức Độ Tác Động |
| :--- | :--- | :--- | :--- |
| **CON-001** | **Chạy trên CPU thuần không có GPU rời**: Trạm Kiosk biên phải vận hành mượt mà trên phần cứng máy tính để bàn thông thường (Intel Core i5 Gen 8+, 8GB RAM). | Ngân sách và chiến lược triển khai chi phí thấp (`PD-002`). | Kiến trúc AI phải chọn lọc mô hình siêu nhẹ (YuNet, MiniFASNet, ArcFace MobileFaceNet). |
| **CON-002** | **Zero Raw Image Upload**: Tuyệt đối không truyền tải hoặc lưu trữ tệp ảnh thô qua mạng. | Luật Bảo vệ dữ liệu cá nhân 2025 (`PD-005`). | Toàn bộ trích xuất vector phải hoàn tất tại Kiosk; Backend chỉ nhận vector số thực 512 chiều. |
| **CON-003** | **Đồng bộ thời gian chuẩn NTP**: Sai lệch đồng hồ hệ thống giữa Kiosk và Backend không vượt quá 50 ms. | Toàn vẹn mốc thời gian điểm danh và Cooldown (`EXT-003`). | Các máy trạm Kiosk và máy chủ phải đồng bộ định kỳ với máy chủ NTP nội bộ. |

### 8.2. Giả Định Hệ Thống (Assumptions)

| Mã Giả Định | Nội Dung Giả Định | Mức Tin Cậy | Phương Pháp Xác Minh & Kiểm Thử |
| :--- | :--- | :---: | :--- |
| **ASM-001** | Trạm Kiosk được lắp đặt tại khu vực có độ rọi ánh sáng tiêu chuẩn văn phòng/nhà xưởng ($\ge 150\text{ lux}$), không bị ngược sáng mặt trời trực tiếp gay gắt. | Cao | Đo kiểm thực địa môi trường lắp đặt Kiosk bằng máy đo quang thông (Lux meter). |
| **ASM-002** | Mạng nội bộ (LAN) tại doanh nghiệp duy trì độ trễ gói tin $\le 50\text{ ms}$ trong điều kiện bình thường. | Cao | Kiểm tra nhịp tim ping định kỳ giữa Kiosk và Backend; kích hoạt SQLite WAL tự động khi mất mạng. |
| **ASM-003** | Quy mô nhân sự trên mỗi trạm Kiosk biên phục vụ tối đa 1,000 nhân viên hoạt động. | Cao | Đo kiểm thời gian so khớp ma trận 3,000 vector (1,000 nhân sự × 3 pose) đạt $0.117\text{ ms} \ll 350\text{ ms}$. |

### 8.3. Rủi Ro Hệ Thống & Biện Pháp Giảm Thiểu (Dependencies & Risks)

| Mã Rủi Ro | Phân Loại | Mô Tả Rủi Ro Kỹ Thuật / Vận Hành | Mức Khả Năng / Tác Động | Biện Pháp Giảm Thiểu (Mitigation Action) | Chủ Trì (Owner) |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **RSK-001** | Rủi ro Vận hành | Mất kết nối mạng nội bộ giữa Kiosk và máy chủ vào đúng giờ cao điểm đầu ca làm việc. | Trung bình / Cao | Kiosk tự động chuyển sang chế độ đệm ngoại tuyến SQLite WAL, điểm danh bình thường ($\text{RPO}=0$) và tự gửi bù khi có mạng. | Kiosk Lead |
| **RSK-002** | Rủi ro Sinh trắc | Nhân viên bị chấn thương mặt, phẫu thuật, đeo kính râm hoặc điều kiện ánh sáng cực đoan gây lỗi nhận diện mặt. | Thấp / Trung bình | Bàn phím số ảo PIN dự phòng 6 chữ số cá nhân sẵn sàng trên màn hình cảm ứng để điểm danh thay thế. | UX & Backend Lead |
| **RSK-003** | Rủi ro An ninh | Kẻ tấn công cố tình quét liên tục các mã OTP hoặc mã PIN ngẫu nhiên để đánh cắp danh tính hoặc chiếm quyền trạm. | Trung bình / Cao | Khóa tạm thời 15 phút sau đúng 5 lần nhập sai liên tiếp per-device tại Kiosk và per-account tại máy chủ Backend. | Security Lead |
| **RSK-004** | Rủi ro Dữ liệu | Bảng công bị can thiệp chỉnh sửa tùy tiện sau khi đã được chốt sổ cuối tháng dẫn đến sai lệch bảng lương. | Thấp / Nghiêm trọng | Khóa cứng kỳ công sau khi HR chốt (`LOCKED`); chỉ Quản trị viên hệ thống có thẩm quyền mở khóa kèm nhật ký kiểm toán. | Backend Lead |
| **RSK-005** | Rủi ro Mã độc | Nhân sự vô tình hoặc cố ý nhập tên/mã chứa mã macro để tấn công máy tính HR khi xuất file báo cáo Excel. | Thấp / Cao | Tự động làm sạch dữ liệu văn bản, chèn dấu nháy đơn (`'`) trước các ký tự kích hoạt công thức Excel (Anti-Formula Injection). | Fullstack Lead |

---

## 9. Rollout and Operational Considerations

### 9.1. Mô Hình Triển Khai & Đóng Gói (Deployment Topology)

- **Cụm Dịch vụ Trung tâm (Central Server Cluster)**: Đóng gói chuẩn hóa qua Docker Compose gồm 3 container độc lập:
  - `fas-postgres`: Cơ sở dữ liệu PostgreSQL 16 LTS với volume lưu trữ bền vững.
  - `fas-backend`: Dịch vụ Java 21 LTS / Spring Boot 4 chạy với người dùng non-root, exposing port 8080.
  - `fas-web`: Ứng dụng Web Portal biên dịch tĩnh được phục vụ qua Nginx Alpine reverse proxy, exposing port 3000.
- **Trạm Kiosk Cận biên (Edge Kiosk Desktop)**: Cài đặt trực tiếp trên hệ điều hành Windows 10/11 Enterprise 64-bit dưới dạng ứng dụng Python desktop chạy trong môi trường ảo `.venv` độc lập kèm script tự khởi động cùng hệ thống.

### 9.2. Giám Sát Sức Khỏe & Vận Hành (Health Checks & Observability)

- Endpoint giám sát sức khỏe dịch vụ trung tâm: `GET /actuator/health` phản hồi trạng thái kết nối CSDL và STOMP broker trong $\le 200\text{ ms}$.
- Nhịp tim Kiosk (Heartbeat Ping): Mỗi trạm Kiosk định kỳ gửi tín hiệu nhịp tim `POST /api/v1/kiosk/ping` mỗi 60 giây. Backend tự động cảnh báo `OFFLINE` nếu quá 180 giây không nhận được tín hiệu.
- Vòng lặp tự phục hồi luồng camera: Nếu luồng camera bị ngắt do lỏng cáp USB hoặc xung đột driver, `kiosk-app` có cơ chế tự động thử kết nối lại mỗi 2 giây mà không cần tắt ứng dụng.

---

## 10. Open Questions and Architectural Decisions

Toàn bộ các quyết định kỹ thuật trọng yếu của hệ thống đã được thẩm định và ghi nhận chính thức trong [Tổng quan Kiến trúc Hệ thống](architecture.md), [Kho Bản ghi Quyết định Kiến trúc (ADR)](adr/README.md) và [FEAT-ENROLL-001 Spec v2.0](features/FEAT-ENROLL-001/spec.md):

| Mã Quyết Định | Nội Dung Quyết Định Thiết Kế | Trạng Thái | Lý Do & Căn Cứ Lựa Chọn |
| :--- | :--- | :---: | :--- |
| **DD-PRD-001** | Áp dụng lưu trữ Multi-Template (3 vector ArcFace 512D) kết hợp Guided Multi-Pose (Chính diện, Nghiêng trái, Nghiêng phải) cho quy trình nạp mẫu khuôn mặt. | Approved | Đảm bảo tỷ lệ nhận diện góc nghiêng thực tế cao vượt trội so với mẫu đơn, đạt tốc độ khớp 3,000 vector trong $0.117\text{ ms}$. |
| **DD-PRD-002** | Mã hóa độc lập từng vector sinh trắc học bằng AES-256-GCM với IV 12 bytes riêng biệt. | Approved | Thỏa mãn tính độc lập mật mã (Cryptographic Independence); rò rỉ 1 vector không làm ảnh hưởng các vector còn lại. |
| **DD-PRD-003** | Khóa brute-force sau đúng 5 lần nhập sai liên tiếp cho cả OTP và mã PIN dự phòng. | Approved | Cân bằng hoàn hảo giữa tính thuận tiện cho người dùng và khả năng triệt tiêu nguy cơ vét cạn mã số từ xa. |
| **DD-PRD-004** | Áp dụng cơ chế Cooldown 120 giây hai tầng (Caffeine RAM tại Kiosk & Backend + kiểm tra CSDL). | Approved | Triệt tiêu 100% hiện tượng nhân viên đứng nói chuyện trước camera làm phát sinh hàng loạt bản ghi quẹt trùng lặp. |

---

## 11. Readiness & Approval Gate

Tài liệu này đã được rà soát và đối chiếu toàn diện với các tiêu chuẩn chất lượng tài liệu SDLC:

- [x] Vấn đề nghiệp vụ và nhóm tác nhân người dùng được định nghĩa rõ ràng, có đầy đủ bằng chứng thực tế (`INF-`, `SRC-`).
- [x] Mục tiêu định lượng và chỉ số đo lường thành công có tiêu chí nghiệm thu rõ ràng, không ước đoán thông số.
- [x] Ranh giới trong phạm vi (In-Scope) và ngoài phạm vi (Non-Goals) được phân định dứt khoát.
- [x] Danh mục Epics và luồng trải nghiệm người dùng được phân rã chi tiết, có mã định danh ổn định.
- [x] Các ràng buộc về bảo vệ dữ liệu cá nhân theo Luật 2025 và giải pháp an ninh thông tin được tích hợp làm yêu cầu cốt lõi.
- [x] Kế hoạch triển khai, vận hành và quản trị rủi ro sẵn sàng cho giai đoạn phát hành và nghiệm thu thực tế.

**Quyết định Phê duyệt (Approval Decision)**: **PROCEED (ĐÃ NGHIỆM THU CHÍNH THỨC)**  
- **Đại diện Phê duyệt**: Lead Product Manager & Lead System Architect  
- **Ngày Phê duyệt**: 2026-11-02  
- **Trạng thái**: Tài liệu thiết lập nền tảng đặc tả yêu cầu sản phẩm chuẩn mực cho toàn bộ hệ thống FAS.

