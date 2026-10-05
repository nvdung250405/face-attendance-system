---
title: Khởi tạo Dự án (Project Initiation)
version: 1.0
status: Approved
owner: Project Manager
---

# PI — Khởi tạo Dự án (Project Initiation)

Xác lập tầm nhìn chiến lược, mục tiêu định lượng, phạm vi sản phẩm, hướng tiếp cận phát triển, các quyết định khởi tạo mang tính ràng buộc (`PD-`) và thuật ngữ nội tại của Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS).

---

## 1. Goals (Mục tiêu Dự án & Tiêu chí Thành công)

### 1.1. Tầm nhìn & Vấn đề Cốt lõi
* **Vấn đề**: Các hình thức điểm danh truyền thống (thẻ từ RFID, vân tay, quét QR) bộc lộ nhiều lỗ hổng gian lận chấm công hộ (`INF-001`), lỗi thiết bị vân tay khi ngón tay chai sần/dầu mỡ (`INF-002`) và gây gánh nặng đối soát thủ công hàng chục giờ mỗi tháng cho bộ phận nhân sự (`INF-003`).
* **Tầm nhìn**: Xây dựng một Hệ thống Chấm công Tự động bằng Nhận diện Khuôn mặt (Face Attendance System - FAS) không chạm (touchless), tối ưu hóa suy luận AI hoàn toàn tại biên (Edge AI) trên phần cứng máy trạm tiêu chuẩn với chi phí 0 VNĐ, bảo vệ dữ liệu theo Luật 2025 và đồng bộ thời gian thực đa nền tảng.

### 1.2. Tiêu chí Thành công Định lượng (KPIs)
* `KPI-01 (Độ chính xác nhận diện 1:N)`: Đạt tỷ lệ bỏ sót nhận diện sai $\text{FNIR} \le 5.0\%$ (tương đương $\text{TPIR} \ge 95.0\%$) tại mức tỷ lệ chấp nhận sai $\text{FPIR} \le 0.1\%$ (tương đương $\text{FAR} \le 0.01\%$ trên mỗi lượt so khớp) với quy mô danh mục $N = 1,000$ khuôn mặt theo chuẩn ISO/IEC 19795-1 trong điều kiện ánh sáng tiêu chuẩn ($\ge 150\text{ lux}$).
* `KPI-02 (Chống giả mạo Liveness)`: Độ chính xác phân loại thực thể sống $\ge 98\%$, tỷ lệ $\text{APCER} \le 5\%$ theo chuẩn ISO/IEC 30107-3 đối với ảnh in 2D và video phát lại.
* `KPI-03 (Thời gian đáp ứng tại biên)`: Tổng thời gian chu kỳ nhận diện trên CPU thuần $\le 350\text{ ms}$ (Phát hiện + Liveness + Trích xuất 512D + So khớp RAM 1,000 nhân sự).
* `KPI-04 (Bảo toàn dữ liệu ngoại tuyến)`: Không thất thoát bản ghi điểm danh ($\text{RPO} = 0$) khi mất kết nối mạng nhờ hàng đợi SQLite WAL.
* `KPI-05 (Độ trễ truyền thông đẩy)`: Độ trễ phát sóng sự kiện điểm danh từ Kiosk lên Live Dashboard qua WebSocket STOMP $\le 200\text{ ms}$.
* `KPI-06 (Tuân thủ pháp lý 100%)`: Tự động xóa vĩnh viễn dữ liệu sinh trắc học của nhân viên nghỉ việc sau đúng 20 ngày theo Luật số 91/2025/QH15.

---

## 2. Scope (Phạm vi & Ranh giới Sản phẩm)

### 2.1. Trong Phạm vi (In-Scope)
* **Trạm Điểm danh Biên (`kiosk-app`)**:
  * Thu nhận luồng video camera quang học, phát hiện khuôn mặt và góc Euler qua YuNet.
  * Cổng căn chỉnh khuôn mặt vào khung Oval (giữ ổn định $0.5 - 1.0\text{ s}$).
  * Cổng kiểm tra thực thể sống thụ động (MiniFASNet $S_{\text{liveness}} \ge 0.85$).
  * Trích xuất vector đặc trưng 512D (ArcFace MobileFaceNet) và so khớp Cosine ma trận RAM.
  * Bàn phím số ảo PIN dự phòng và khóa 15 phút chống brute-force.
  * Hàng đợi lưu trữ ngoại tuyến SQLite WAL và tự động đồng bộ bù khi có mạng.
  * Luồng tự đăng ký 3 bước In-Viewport tiếp nhận mã OTP kích hoạt.
* **Máy chủ Doanh nghiệp (`backend-service`)**:
  * Quản lý hồ sơ nhân sự, phân ca làm việc, tính toán đi muộn/về sớm.
  * Cơ chế chống quẹt trùng lặp Cooldown 120 giây.
  * Mã hóa an toàn vector đặc trưng khuôn mặt chuẩn AES-256-GCM ở trạng thái lưu trữ.
  * Kênh thông điệp đẩy thời gian thực WebSocket STOMP.
  * Tác vụ định kỳ quét xóa vĩnh viễn dữ liệu sinh trắc học sau 20 ngày kể từ khi thôi việc.
* **Cổng Quản trị & Tự phục vụ (`web-portal`)**:
  * Màn hình giám sát trực quan Live Monitoring Dashboard.
  * Quản lý nhân viên, phân ca làm việc, duyệt đơn giải trình công.
  * Cổng tự phục vụ: Ký thỏa thuận số Informed Consent và sinh mã OTP đăng ký khuôn mặt 48 giờ.
  * Kết xuất báo cáo bảng công định dạng Excel (.xlsx) an toàn chống Formula Injection.

### 2.2. Ngoài Phạm vi (Out-of-Scope)
* Không tích hợp phân hệ tính lương chi tiết (Payroll, thuế TNCN, BHXH).
* Không phát hiện và nhận diện đám đông từ xa qua camera an ninh CCTV diện rộng.
* Không tích hợp điều khiển cơ điện tử rào chắn tự động (Turnstile / Access Control Relays) trong phiên bản này.
* Không phát triển ứng dụng di động native độc lập cho iOS / Android (sử dụng giao diện Web Responsive).

---

## 3. Direction (Hướng Tiếp cận & Nguyên tắc Thực hiện)

* **Edge-First Computing**: Xử lý toàn bộ pipeline AI trực tiếp tại biên, không truyền luồng video thô về máy chủ nhằm tiết kiệm tối đa băng thông và bảo đảm quyền riêng tư (`INF-006`).
* **Offline-First Resiliency**: Máy trạm Kiosk duy trì khả năng nhận diện và chấm công bình thường ngay cả khi mất mạng nội bộ hoàn toàn (`INF-011`).
* **Zero-Cost Software Engineering**: Khai thác 100% hệ sinh thái mã nguồn mở và tận dụng phần cứng máy trạm tiêu chuẩn sẵn có mà không phát sinh chi phí bản quyền hay phần cứng chuyên dụng.
* **Spec-Driven & Upstream-First**: Mọi yêu cầu và quyết định kỹ thuật phải được chuẩn hóa trên hệ thống tài liệu đặc tả trước khi lập trình mã nguồn.

---

## 4. Decisions (Các Quyết định Khởi tạo Dự án)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `PD-001` | Áp dụng mô hình Kiến trúc Phân tán 3 Phân hệ độc lập trong Monorepo (`kiosk-app`, `backend-service`, `web-portal`). | Tách biệt hoàn toàn trách nhiệm giữa tính toán AI biên, máy chủ nghiệp vụ tập trung và giao diện quản trị người dùng. | Monolith đơn khối, Multi-repo phân tán | Cần chuẩn hóa hợp đồng API/STOMP liên phân hệ và quy chuẩn commit chung. | `INF-004`, `INF-006` | Accepted |
| `PD-002` | Thực thi suy luận AI hoàn toàn trên CPU máy trạm phổ thông với tập lệnh vector (AVX2), không bắt buộc GPU rời. | Giảm chi phí đầu tư thiết bị của doanh nghiệp xuống 0 VNĐ bằng cách tái sử dụng máy tính và camera USB sẵn có. | Yêu cầu GPU rời (Nvidia CUDA), Điện toán đám mây Cloud API | Phải chọn lọc mô hình siêu nhẹ (YuNet, MiniFASNet, ArcFace) và tối ưu hóa luồng CPU. | `INF-006`, `INF-007` | Accepted |
| `PD-003` | Áp dụng bắt buộc Cổng kiểm tra Thực thể sống Thụ động MiniFASNet với ngưỡng chặn $S_{\text{liveness}} \ge 0.85$. | Ngăn chặn triệt để gian lận bằng ảnh in màu 2D và video phát lại màn hình theo chuẩn ISO/IEC 30107-3 mà không đòi hỏi thao tác chớp mắt phức tạp. | Liveness chủ động (chớp mắt/quay đầu), Camera 3D hồng ngoại chuyên dụng | Tăng thêm $\sim 25-30\text{ ms}$ xử lý trong chu kỳ suy luận nhưng đảm bảo an ninh sinh trắc học. | `INF-008` | Accepted |
| `PD-004` | Sử dụng hàng đợi lưu trữ cục bộ SQLite chế độ Write-Ahead Logging (WAL) tại trạm Kiosk. | Bảo đảm độ bền vững dữ liệu khi mất điện hoặc mất mạng đột ngột ($\text{RPO} = 0$), hỗ trợ đọc/ghi đồng thời non-blocking. | Bộ nhớ tạm RAM thuần túy, File phẳng JSON/CSV cục bộ | Cần quản lý vòng đời kết nối SQLite và tiến trình đồng bộ ngầm định kỳ khi có mạng. | `INF-011` | Accepted |
| `PD-005` | Mã hóa đối xứng AES-256-GCM ở trạng thái tĩnh cho toàn bộ vector sinh trắc học và xóa dữ liệu sau 20 ngày thôi việc. | Tuân thủ tuyệt đối quy định pháp lý bắt buộc của Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 của Việt Nam. | Lưu vector số thực thô trong CSDL, Lưu trữ vĩnh viễn không thời hạn | Tốn thêm chu kỳ CPU giải mã khi nạp gallery lên Kiosk; cần quản trị khóa Master Key an toàn. | `INF-009`, `INF-010` | Accepted |
| `PD-006` | Sử dụng giao thức WebSocket STOMP để truyền thông đẩy sự kiện điểm danh và cập nhật danh mục khuôn mặt. | Thay thế hoàn toàn HTTP Polling định kỳ, giảm tải CPU máy chủ và giảm độ trễ hiển thị Dashboard xuống dưới 200 ms. | HTTP Polling ngắn hạn định kỳ, Server-Sent Events (SSE) một chiều | Cần quản lý cơ chế duy trì kết nối Heartbeat và tự động kết nối lại khi đứt mạng. | `INF-003` | Accepted |
| `PD-007` | Bắt buộc quy trình thu nhận mẫu khuôn mặt trực tiếp tại trạm Kiosk thông qua mã OTP 6 số (Không cho tải ảnh tùy tiện từ Web). | Đảm bảo tính pháp lý, chất lượng góc mặt chuẩn hóa và ngăn ngừa việc nạp ảnh của người khác vào hồ sơ. | Tải ảnh chân dung tùy tiện qua Web Portal, Quản trị viên nạp ảnh thủ công | Nhân viên phải ra trực tiếp trạm Kiosk để hoàn tất đăng ký khuôn mặt trong vòng 48h. | `INF-009` | Accepted |
| `PD-008` | Cung cấp bàn phím số ảo PIN 6 số trên màn hình cảm ứng Kiosk làm phương án xác thực dự phòng khi gặp sự cố sinh trắc học hoặc diện mạo thay đổi lớn. | Đảm bảo luồng điểm danh không bị tắc nghẽn khi camera, ánh sáng hoặc người dùng không thể nhận diện khuôn mặt; tự động khóa 15 phút nếu nhập sai quá 5 lần. | Điểm danh thủ công qua giấy/bảo vệ, Yêu cầu quét thẻ từ vật lý | Cần thiết kế giao diện cảm ứng lớn và kiểm soát chặt chẽ brute-force. | `INF-012` | Accepted |

---

## 5. Constraints (Ràng buộc Bắt buộc)

Các ràng buộc kỹ thuật bắt buộc dưới đây được sở hữu bởi các quyết định khởi tạo dự án (`PD-`), làm căn cứ bắt buộc cho các phân hệ downstream:

* **Ràng buộc Phần cứng & Nền tảng thực thi**: Ứng dụng Kiosk phải vận hành hoàn toàn trên CPU máy trạm 4 nhân x86_64 hỗ trợ AVX2, RAM 8GB-16GB, webcam UVC chuẩn, không đòi hỏi GPU rời (Owner: `PD-002`).
* **Ràng buộc Lưu trữ Bền vững Ngoại tuyến**: Trạm Kiosk bắt buộc sử dụng SQLite WAL cục bộ để đảm bảo $\text{RPO} = 0$ khi mất mạng đột ngột (Owner: `PD-004`).
* **Ràng buộc Pháp lý & Bảo mật Sinh trắc học**: Toàn bộ vector đặc trưng phải được mã hóa đối xứng AES-256-GCM ở trạng thái tĩnh; bắt buộc có Informed Consent điện tử trước khi thu nhận mẫu và tự động quét xóa vĩnh viễn dữ liệu sau 20 ngày thôi việc theo Luật số 91/2025/QH15 (Owner: `PD-005`).
* **Ràng buộc Truyền thông Thời gian thực**: Đồng bộ sự kiện điểm danh và cập nhật danh mục khuôn mặt bắt buộc sử dụng giao thức WebSocket STOMP với độ trễ phát sóng $\le 200\text{ ms}$ (Owner: `PD-006`).
* **Ràng buộc Ngân sách Thời gian Chu kỳ**: Tổng chu kỳ nhận diện tại biên từ khi có khung hình đến khi hiển thị kết quả không vượt quá $350\text{ ms}$ (Owner: `PD-002`, `PD-003`).

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

### 6.1. Giả định Môi trường (Assumptions)
* **Vị trí và Chiếu sáng**: Trạm Kiosk được lắp đặt cố định tại sảnh hoặc cửa ra vào với cường độ ánh sáng môi trường tiêu chuẩn $\ge 150\text{ lux}$, tránh hướng chiếu trực diện của ánh nắng mặt trời gắt gây loá cảm biến.
* **Tương tác Người dùng**: Nhân viên đứng trong khoảng cách từ $0.5\text{ m}$ đến $1.2\text{ m}$ trước camera và hướng mặt vào khung Oval nhận diện trong khoảng $0.5 - 1.0\text{ s}$.
* **Hạ tầng Mạng**: Mạng LAN nội bộ hoặc Wi-Fi văn phòng có thể gián đoạn cục bộ nhưng phục hồi định kỳ để đồng bộ dữ liệu điểm danh về máy chủ trung tâm.

### 6.2. Vấn đề Chưa giải quyết (Open Issues)
* **Quy mô Danh mục Vượt ngưỡng 10,000 nhân sự**: Ma trận RAM $1,000$ nhân sự chỉ chiếm $\sim 2\text{ MB}$ và tính toán Cosine $< 2\text{ ms}$ (`INF-007`). Khi quy mô nhân sự tại một địa điểm vượt $10,000$ nhân sự, cần kích hoạt phương án phân vùng theo phòng ban/ca làm việc hoặc áp dụng chỉ mục HNSW/Faiss (Kế thừa từ `GAP-002`, điều kiện resolve: khi triển khai site có quy mô $> 10,000$ nhân sự).
* **Môi trường Ánh sáng Yếu ($< 50\text{ lux}$)**: Độ chính xác phát hiện và liveness giảm khi ánh sáng quá yếu. Điều kiện resolve: kích hoạt thuật toán cảnh báo chất lượng ảnh và hiển thị viền Oval vàng hướng dẫn nhân viên điều chỉnh góc đứng hoặc bật đèn hỗ trợ (Kế thừa từ `GAP-001`).

---

## 7. Glossary (Thuật ngữ Nội tại Hệ thống)

| Thuật ngữ (Term) | Định nghĩa (Definition) |
| :--- | :--- |
| **FAS (Face Attendance System)** | Hệ thống quản trị và tự động hóa điểm danh nhân sự ứng dụng công nghệ nhận diện khuôn mặt và thị giác máy tính. |
| **Kiosk Station** | Thiết bị máy trạm vật lý đặt tại cửa ra vào, tích hợp camera quang học và màn hình cảm ứng để phục vụ nhân viên điểm danh. |
| **Gallery RAM Matrix** | Ma trận bộ nhớ đệm lưu trữ danh mục vector đặc trưng khuôn mặt của toàn bộ nhân viên hoạt động tại Kiosk để tính toán so khớp song song. |
| **Informed Consent** | Văn bản thỏa thuận số có hiệu lực pháp lý xác nhận sự đồng thuận tự nguyện của nhân viên đối với việc thu thập và xử lý dữ liệu sinh trắc học. |
| **Presentation Attack (PAD)** | Hành vi tấn công giả mạo nhận diện sinh trắc học bằng vật phẩm nhân tạo (ảnh in màu giấy, ảnh kỹ thuật số, video phát lại, mặt nạ silicon). |
| **Cooldown Window** | Cửa sổ thời gian 120 giây ngăn chặn việc một nhân viên bị ghi nhận điểm danh nhiều lần liên tiếp do vô tình nấn ná trước ống kính camera. |
