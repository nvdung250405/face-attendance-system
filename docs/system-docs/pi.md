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
* `KPI-01 (Độ chính xác chuẩn)`: Tỷ lệ nhận diện đúng $\text{TAR} \ge 95\%$ tại tỷ lệ chấp nhận nhầm $\text{FAR} \le 0.01\%$ trong điều kiện ánh sáng tiêu chuẩn ($\ge 150\text{ lux}$).
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

| ID | Quyết định Khởi tạo (Project Decision) | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `PD-001` | Áp dụng mô hình Kiến trúc Phân tán 3 Phân hệ độc lập trong Monorepo (`kiosk-app`, `backend-service`, `web-portal`). | Tách biệt hoàn toàn trách nhiệm giữa tính toán AI biên, máy chủ nghiệp vụ tập trung và giao diện quản trị người dùng. | `INF-004`, `INF-006` | Approved |
| `PD-002` | Thực thi suy luận AI hoàn toàn trên CPU máy trạm phổ thông với tập lệnh vector (AVX2), không bắt buộc GPU rời. | Giảm chi phí đầu tư thiết bị của doanh nghiệp xuống 0 VNĐ bằng cách tái sử dụng máy tính và camera USB sẵn có. | `INF-006`, `INF-007` | Approved |
| `PD-003` | Áp dụng bắt buộc Cổng kiểm tra Thực thể sống Thụ động MiniFASNet với ngưỡng chặn $S_{\text{liveness}} \ge 0.85$. | Ngăn chặn triệt để gian lận bằng ảnh in màu 2D và video phát lại màn hình theo chuẩn ISO/IEC 30107-3 mà không đòi hỏi thao tác chớp mắt phức tạp. | `INF-008` | Approved |
| `PD-004` | Sử dụng hàng đợi lưu trữ cục bộ SQLite chế độ Write-Ahead Logging (WAL) tại trạm Kiosk. | Bảo đảm độ bền vững dữ liệu khi mất điện hoặc mất mạng đột ngột ($\text{RPO} = 0$), hỗ trợ đọc/ghi đồng thời non-blocking. | `INF-011` | Approved |
| `PD-005` | Mã hóa đối xứng AES-256-GCM ở trạng thái tĩnh cho toàn bộ vector sinh trắc học và xóa dữ liệu sau 20 ngày thôi việc. | Tuân thủ tuyệt đối quy định pháp lý bắt buộc của Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 của Việt Nam. | `INF-009`, `INF-010` | Approved |
| `PD-006` | Sử dụng giao thức WebSocket STOMP để truyền thông đẩy sự kiện điểm danh và cập nhật danh mục khuôn mặt. | Thay thế hoàn toàn HTTP Polling định kỳ, giảm tải CPU máy chủ và giảm độ trễ hiển thị Dashboard xuống dưới 200 ms. | `INF-003` | Approved |
| `PD-007` | Bắt buộc quy trình thu nhận mẫu khuôn mặt trực tiếp tại trạm Kiosk thông qua mã OTP 6 số (Không cho tải ảnh tùy tiện từ Web). | Đảm bảo tính pháp lý, chất lượng góc mặt chuẩn hóa và ngăn ngừa việc nạp ảnh của người khác vào hồ sơ. | `INF-009` | Approved |

---

## 5. Constraints & Assumptions (Ràng buộc & Giả định)

### 5.1. Ràng buộc (Constraints)
* **Phần cứng**: Phải vận hành mượt mà trên cấu hình phần cứng baseline máy trạm CPU 4 nhân, 8GB-16GB RAM, webcam chuẩn UVC.
* **Thời gian đáp ứng**: Tổng chu kỳ nhận diện tại biên $\le 350\text{ ms}$, độ trễ phát sóng STOMP $\le 200\text{ ms}$.
* **Pháp lý**: Bắt buộc có thỏa thuận điện tử Informed Consent và tự động xóa vector sau 20 ngày nghỉ việc.

### 5.2. Giả định (Assumptions)
* Trạm Kiosk được đặt cố định tại sảnh/cửa ra vào với ánh sáng môi trường tiêu chuẩn $\ge 150\text{ lux}$.
* Khoảng cách đứng chấm công của nhân viên nằm trong khoảng tối ưu từ $0.5\text{ m}$ đến $1.2\text{ m}$ trước camera.
* Nhân viên nhìn thẳng vào camera trong khung Oval định vị trong khoảng $0.5 - 1.0\text{ s}$ khi điểm danh.

---

## 6. Glossary (Thuật ngữ Nội tại Hệ thống)

| Thuật ngữ (Term) | Định nghĩa (Definition) |
| :--- | :--- |
| **FAS (Face Attendance System)** | Hệ thống quản trị và tự động hóa điểm danh nhân sự ứng dụng công nghệ nhận diện khuôn mặt và thị giác máy tính. |
| **Kiosk Station** | Thiết bị máy trạm vật lý đặt tại cửa ra vào, tích hợp camera quang học và màn hình cảm ứng để phục vụ nhân viên điểm danh. |
| **Gallery RAM Matrix** | Ma trận bộ nhớ đệm lưu trữ danh mục vector đặc trưng khuôn mặt của toàn bộ nhân viên hoạt động tại Kiosk để tính toán so khớp song song. |
| **Informed Consent** | Văn bản thỏa thuận số có hiệu lực pháp lý xác nhận sự đồng thuận tự nguyện của nhân viên đối với việc thu thập và xử lý dữ liệu sinh trắc học. |
| **Presentation Attack (PAD)** | Hành vi tấn công giả mạo nhận diện sinh trắc học bằng vật phẩm nhân tạo (ảnh in màu giấy, ảnh kỹ thuật số, video phát lại, mặt nạ silicon). |
| **Cooldown Window** | Cửa sổ thời gian 120 giây ngăn chặn việc một nhân viên bị ghi nhận điểm danh nhiều lần liên tiếp do vô tình nấn ná trước ống kính camera. |
