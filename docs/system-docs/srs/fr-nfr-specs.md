---
title: Đặc tả Yêu cầu Chức năng & Phi chức năng Hệ thống (FR/NFR)
version: 1.0
status: Approved
owner: Requirements Lead
---

# FR/NFR SPECS — Đặc tả Yêu cầu Chức năng & Phi chức năng Hệ thống

Đặc tả danh mục 16 yêu cầu chức năng cốt lõi (`FR-SYS-`) và các yêu cầu phi chức năng đo lường được (`NFR-SYS-`) của toàn bộ hệ thống Monorepo, có gắn tiêu chí nghiệm thu định lượng (Acceptance Criteria).

---

## 1. Functional Requirements (Yêu cầu Chức năng Hệ thống)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-SYS-001` | Hệ thống phải thu nhận luồng video liên tục từ camera quang học và phát hiện khuôn mặt thời gian thực bằng mô hình nhẹ YuNet. | Vision / Kiosk | Must | `PD-002` | Tốc độ xử lý $\ge 15\text{ FPS}$; phát hiện khuôn mặt kích thước $\ge 120\times 120\text{ px}$; trả về tọa độ hộp bao và 5 điểm mốc giải phẫu. | Approved |
| `FR-SYS-002` | Hệ thống phải kiểm tra thực thể sống thụ động (Passive Liveness) bằng mô hình MiniFASNet để loại bỏ ảnh in 2D và video phát lại. | Vision / Security | Must | `PD-003` | Điểm số liveness $S_{\text{liveness}} \ge 0.85$; tỷ lệ phát hiện tấn công giả mạo đạt $\ge 98\%$; thời gian suy luận $\le 50\text{ ms}$. | Approved |
| `FR-SYS-003` | Hệ thống phải trích xuất vector đặc trưng 512 chiều chuẩn hóa L2 Norm qua ArcFace và so khớp Cosine 1:N với ma trận RAM tại trạm Kiosk. | Vision / Identity | Must | `PD-002` | Ngưỡng Cosine Similarity $\ge 0.50$; thời gian so khớp ma trận 1,000 nhân sự $< 2\text{ ms}$; tỷ lệ $\text{TAR} \ge 95\%$, $\text{FAR} \le 0.01\%$. | Approved |
| `FR-SYS-004` | Hệ thống phải cung cấp bàn phím số ảo PIN dự phòng trên màn hình cảm ứng để nhân viên điểm danh khi gặp sự cố sinh trắc học. | Fallback / UX | Should | `PD-008`, `INF-012` | Nhập mã PIN 6 số; xác thực đúng ghi nhận điểm danh `VERIFICATION_PIN`; tự động khóa bàn phím 15 phút nếu nhập sai quá 5 lần. | Approved |
| `FR-SYS-005` | Hệ thống phải áp dụng cơ chế Cooldown chống quét trùng lặp trong khoảng thời gian 120 giây cho cùng một nhân viên. | Business Rule | Should | `INF-001` | Từ chối ghi nhận lượt quẹt tiếp theo của cùng 1 nhân viên trong vòng 120 giây kể từ lần chấm công thành công trước đó; thông báo "Đã ghi nhận". | Approved |
| `FR-SYS-006` | Hệ thống phải lưu trữ đệm các lượt quẹt vào CSDL cục bộ SQLite chế độ WAL khi mất mạng và tự động đồng bộ bù khi có mạng lại. | Resiliency | Must | `PD-004` | Cam kết không mất mát dữ liệu ($\text{RPO} = 0$); khi có mạng, gửi bù theo lô tối đa 50 bản ghi/request về Backend thành công 100%. | Approved |
| `FR-SYS-007` | Hệ thống phải cung cấp quy trình ký văn bản thỏa thuận Informed Consent điện tử trước khi cho phép thu thập và kích hoạt dữ liệu khuôn mặt. | Compliance | Must | `PD-005` | Nhân viên phải tích chọn đồng ý điều khoản Luật 2025 trên Web; lưu vết mốc thời gian, IP và User-Agent vào bảng `consent_audit_logs`. | Approved |
| `FR-SYS-008` | Hệ thống phải sinh mã kích hoạt Onboarding OTP 6 chữ số có hiệu lực giới hạn 48 giờ để nhân viên mang ra trạm Kiosk tự nạp khuôn mặt. | Enrollment | Must | `PD-007` | Mã OTP gồm 6 chữ số ngẫu nhiên; mã băm SHA-256 lưu trong bảng `enrollment_otps`; tự hủy sau 48 giờ hoặc ngay sau khi nạp mặt thành công. | Approved |
| `FR-SYS-009` | Hệ thống phải thực hiện quy trình tự nạp mẫu khuôn mặt 3 bước trực tiếp trên camera Kiosk: kiểm chuẩn ảnh, chụp liên tiếp 3 ảnh đạt chuẩn và nạp vector. | Enrollment / UX | Must | `PD-007` | Bước 1 xác minh OTP; Bước 2 tự ẩn popup chụp 3 ảnh chuẩn (Laplacian $\ge 30$, liveness $\ge 0.60$, góc $\le 15^\circ$); Bước 3 nạp nóng vector vào RAM. | Approved |
| `FR-SYS-010` | Hệ thống phải mã hóa đối xứng AES-256-GCM ở trạng thái tĩnh cho toàn bộ vector đặc trưng khuôn mặt trước khi lưu vào CSDL PostgreSQL. | Security | Must | `PD-005` | Bản ghi vector trong CSDL có dạng BYTEA kèm IV 12 bytes và Auth Tag 16 bytes; giải mã thành công trong bộ nhớ Backend khi cấp phát. | Approved |
| `FR-SYS-011` | Hệ thống phải tự động tiêu hủy vĩnh viễn (Hard Delete) toàn bộ dữ liệu sinh trắc học của nhân viên đã thôi việc sau đúng 20 ngày. | Compliance | Must | `PD-005` | Cron job chạy định kỳ 01:00 hàng ngày; xóa sạch bản ghi `biometric_templates` của nhân viên có `terminated_date <= CurrentDate - 20 days`. | Approved |
| `FR-SYS-012` | Hệ thống phải quản lý ca làm việc linh hoạt, hỗ trợ thời gian ân hạn 15 phút và tự động phân loại đi muộn / về sớm. | Business Rule | Must | `ACT-002` | Tự động tính số phút đi muộn (nếu check-in sau giờ bắt đầu + 15 phút) và về sớm; gán nhãn trạng thái chính xác trong bảng công. | Approved |
| `FR-SYS-013` | Hệ thống phải phát sóng sự kiện điểm danh thời gian thực tức thì từ Backend lên Cổng Web qua kênh WebSocket STOMP. | Realtime | Must | `PD-006` | Đẩy thông điệp JSON tới topic `/topic/live-attendance`; Web Portal nhận và hiển thị lên Live Dashboard trong vòng $\le 200\text{ ms}$. | Approved |
| `FR-SYS-014` | Hệ thống phải đồng bộ danh mục vector khuôn mặt mẫu hai chiều giữa Backend và mạng lưới các trạm Kiosk qua WebSocket STOMP. | Realtime Sync | Must | `PD-006` | Khi có nhân viên mới đăng ký, Backend đẩy vector tới `/topic/kiosk-gallery`; các trạm Kiosk nạp nóng vào RAM mà không cần restart. | Approved |
| `FR-SYS-015` | Hệ thống phải cung cấp màn hình Live Monitoring Dashboard hiển thị sĩ số trực quan, biểu đồ tỷ lệ đúng giờ và nhật ký quẹt thẻ thời gian thực. | Web UX | Must | `ACT-002` | Tự động cập nhật không cần reload trang; hiển thị ảnh đại diện, họ tên, giờ chấm, trạng thái đúng giờ/đi muộn với độ trễ $< 200\text{ ms}$. | Approved |
| `FR-SYS-016` | Hệ thống phải hỗ trợ gửi/duyệt đơn giải trình công trực tuyến và kết xuất báo cáo Excel bảng công có cơ chế chống Formula Injection. | HR Management | Must | `ACT-002` | Nhân viên nộp đơn kèm lý do; HR duyệt/từ chối; xuất file Excel (.xlsx) tự động vô hiệu hóa ký tự đặc biệt (`=`, `+`, `-`, `@`). | Approved |

---

## 2. Non-functional Requirements (Yêu cầu Phi chức năng Hệ thống)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-SYS-001` | Tổng thời gian chu kỳ nhận diện toàn trình tại trạm Kiosk (Phát hiện + Liveness + Trích xuất 512D + So khớp RAM) phải đạt $\le 350\text{ ms}$ trên CPU thuần. | Performance | Must | `INF-006`, `PD-002` | Đo kiểm thực tế trên CPU Intel Core i5 / AMD Ryzen 5 phổ thông; p95 $\le 350\text{ ms}$. | Approved |
| `NFR-SYS-002` | Giao diện Kiosk phải duy trì tốc độ hiển thị luồng video từ camera đạt $\ge 15\text{ FPS}$ (khuyến nghị $30\text{ FPS}$) liên tục, không giật lag màn hình. | Performance | Must | `INF-006` | Khung hình QML/PySide6 không bị nghẽn bởi các tác vụ AI nhờ chạy đa luồng bất đồng bộ. | Approved |
| `NFR-SYS-003` | Tổng thời gian từ khi khuôn mặt xuất hiện trước camera đến khi sự kiện chấm công hiển thị trên Web Dashboard phải đạt $\le 1.2\text{ giây}$ (p95). | Performance | Must | `PD-001`, `PD-006` | Chuỗi pipeline liên hoàn: Kiosk nhận diện $\rightarrow$ REST POST $\rightarrow$ Backend xử lý $\rightarrow$ STOMP Broadcast $\rightarrow$ Web render $\le 1.2\text{ s}$. | Approved |
| `NFR-SYS-004` | Độ chính xác nhận diện sinh trắc học khuôn mặt phải đạt $\text{TAR} \ge 95\%$ tại ngưỡng $\text{FAR} \le 0.01\%$ trong điều kiện ánh sáng văn phòng chuẩn. | Biometric PAD | Must | `INF-007`, `PD-002` | Kiểm thử trên tập dữ liệu chuẩn 1,000 nhân viên với ngưỡng Cosine Similarity $\ge 0.50$. | Approved |
| `NFR-SYS-005` | Khả năng phòng chống tấn công giả mạo (PAD) phải đạt tỷ lệ sai số $\text{APCER} \le 5\%$ theo tiêu chuẩn ISO/IEC 30107-3 đối với ảnh in 2D và video phát lại. | Biometric PAD | Must | `INF-008`, `PD-003` | Bộ lọc MiniFASNet từ chối $\ge 98\%$ các mẫu tấn công giả mạo với ngưỡng $S_{\text{liveness}} \ge 0.85$. | Approved |
| `NFR-SYS-006` | Hệ thống cam kết không thất thoát bất kỳ bản ghi điểm danh nào ($\text{RPO} = 0$) trong tình huống mất kết nối mạng hoặc cúp điện đột ngột. | Reliability | Must | `INF-011`, `PD-004` | Hàng đợi SQLite WAL bảo toàn giao dịch; 100% bản ghi ngoại tuyến được gửi bù lên máy chủ khi có mạng lại. | Approved |
| `NFR-SYS-007` | Toàn bộ vector sinh trắc học 512D lưu trữ phải được mã hóa chuẩn FIPS AES-256-GCM; không lưu ảnh thô trên bất kỳ thiết bị đĩa nào. | Security | Must | `SRS-001` | Master Key nạp độc lập từ biến môi trường; không lưu trữ plaintext hay file ảnh camera. | Approved |
| `NFR-SYS-008` | Độ sẵn sàng dịch vụ (High Availability) của máy chủ Backend phải đạt tối thiểu $99.9\%$ trong giờ làm việc hành chính (07:00 - 19:00). | Availability | Must | `SRS-009` | Endpoint `/actuator/health` trả về UP; hệ thống tự phục hồi kết nối CSDL và camera khi gặp sự cố tạm thời. | Approved |
| `NFR-SYS-009` | Ứng dụng Kiosk phải vận hành bền bỉ liên tục 8 giờ làm việc với độ biến thiên dung lượng RAM tiêu thụ không vượt quá $10\%$ (Zero Memory Leak). | Reliability | Must | `PD-002`, `INF-006` | Bộ nhớ đệm khung hình NumPy và QImage được giải phóng triệt để ngay sau mỗi chu kỳ suy luận. | Approved |
| `NFR-SYS-010` | Giao diện Web Portal phải tuân thủ chuẩn Web Content Accessibility Guidelines (WCAG 2.2 Level AA) và thiết kế Responsive đa kích thước màn hình. | Usability | Should | `INF-003` | Hỗ trợ hiển thị tối ưu trên màn hình desktop, laptop và thiết bị di động với chế độ Dark/Light mode. | Approved |
