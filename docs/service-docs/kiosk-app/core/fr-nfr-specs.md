# FR/NFR SPECS — Đặc tả Yêu cầu Chức năng & Phi chức năng Phân hệ Kiosk

> **Mã tài liệu:** `SPEC-FR-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục yêu cầu chức năng (`FR-KSK-`) và phi chức năng (`NFR-KSK-`) cụ thể hóa (refinement) từ System Specs thuộc phạm vi trách nhiệm của trạm Kiosk Desktop.

---

## 1. Functional Requirements (Yêu cầu Chức năng Kiosk)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-KSK-001` | Trạm Kiosk phải thu nhận khung hình video $\ge 15\text{ FPS}$ và phát hiện khuôn mặt thời gian thực qua YuNet. | Vision | P1 | `FR-SYS-001` | Phát hiện mặt $\ge 120\times 120\text{ px}$; trả về bounding box và 5 điểm mốc; góc Euler Yaw, Pitch, Roll $\le 15^\circ$. | Approved |
| `FR-KSK-002` | Trạm Kiosk phải kiểm tra thực thể sống thụ động qua MiniFASNet để chặn đứng ảnh in 2D và video. | Vision / PAD | P1 | `FR-SYS-002` | Điểm số liveness $S \ge 0.85$; thời gian suy luận $\le 50\text{ ms}$; chặn ảnh in và video đạt $\ge 98\%$. | Approved |
| `FR-KSK-003` | Trạm Kiosk phải trích xuất vector 512D chuẩn hóa L2 Norm qua ArcFace và so khớp Cosine 1:N trong RAM. | Vision / Identity | P1 | `FR-SYS-003` | Ngưỡng Cosine $\ge 0.50$; thời gian so khớp ma trận RAM 1,000 nhân sự $< 2\text{ ms}$; $\text{TAR} \ge 95\%$. | Approved |
| `FR-KSK-004` | Trạm Kiosk phải cung cấp bàn phím số ảo PIN dự phòng trên màn hình cảm ứng khi gặp sự cố sinh trắc. | Fallback / UI | P2 | `FR-SYS-004` | Bàn phím số $3\times 4$; phím $\ge 60\times 60\text{ px}$; nhập đúng PIN 6 số ghi nhận điểm danh; khóa 15p sau 5 lần sai. | Approved |
| `FR-KSK-005` | Trạm Kiosk phải áp dụng bộ đệm Cooldown 120 giây tại biên để chặn quẹt dồn dập. | Business Rule | P2 | `FR-SYS-005` | Ghi nhớ mốc thời gian quẹt thành công trong RAM; từ chối quẹt tiếp trong 120s; hiển thị thông báo "Đã ghi nhận". | Approved |
| `FR-KSK-006` | Trạm Kiosk phải lưu trữ đệm vào SQLite WAL khi mất mạng và tự động đồng bộ bù khi có mạng lại. | Resiliency | P1 | `FR-SYS-006` | Cam kết không mất dữ liệu ($\text{RPO} = 0$); khi có mạng, gom lô tối đa 50 bản ghi gửi bù thành công 100%. | Approved |
| `FR-KSK-007` | Trạm Kiosk phải thực hiện quy trình tự đăng ký In-Viewport 3 bước tiếp nhận mã OTP từ Cổng Web. | Enrollment / UX | P1 | `FR-SYS-009` | Bước 1 xác minh OTP; Bước 2 tự ẩn popup chụp 3 ảnh chuẩn trên camera chính; Bước 3 nạp nóng vector vào RAM. | Approved |
| `FR-KSK-008` | Trạm Kiosk phải lắng nghe kênh STOMP `/topic/kiosk-gallery` để nạp nóng vector mới vào RAM. | Realtime Sync | P1 | `FR-SYS-014` | Cập nhật ma trận RAM tức thời mà không cần khởi động lại ứng dụng; hỗ trợ cả thao tác ADD và DELETE vector. | Approved |

---

## 2. Non-functional Requirements (Yêu cầu Phi chức năng Kiosk)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-KSK-001` | Tổng thời gian chu kỳ nhận diện trọn vòng (Phát hiện + Liveness + Trích xuất 512D + So khớp RAM) đạt $\le 350\text{ ms}$. | Performance | P1 | `NFR-SYS-001` | Đo kiểm trên CPU Intel Core i5 / AMD Ryzen 5 phổ thông với tập lệnh AVX2. | Approved |
| `NFR-KSK-002` | Luồng hiển thị video QML/PySide6 duy trì tốc độ $\ge 15\text{ FPS}$ (khuyến nghị $30\text{ FPS}$) liên tục, không nghẽn luồng. | Performance | P1 | `NFR-SYS-002` | Luồng đọc camera và suy luận AI chạy trong `QThread` độc lập với luồng giao diện chính. | Approved |
| `NFR-KSK-003` | Tỷ lệ mất mát bản ghi điểm danh ngoại tuyến khi mất mạng hoặc cúp điện đột ngột là $0\%$ ($\text{RPO} = 0$). | Reliability | P1 | `NFR-SYS-006` | Chế độ ghi trước nhật ký SQLite WAL bảo toàn dữ liệu 100%; tự phục hồi khi mở lại app. | Approved |
| `NFR-KSK-004` | Ứng dụng Kiosk vận hành liên tục 8 giờ với độ biến thiên bộ nhớ RAM không quá $10\%$ (Zero Memory Leak). | Reliability | P1 | `NFR-SYS-009` | Mọi mảng khung hình `np.ndarray` được giải phóng sau mỗi chu kỳ; RAM duy trì $\le 600\text{ MB}$. | Approved |
| `NFR-KSK-005` | Tự động phục hồi kết nối camera vật lý trong vòng $\le 3\text{ giây}$ khi bị lỏng giắc hoặc ngắt tín hiệu. | Robustness | P1 | `SRS-009` | Vòng lặp `reconnect loop` tự thử lại mỗi 3s mà không làm treo hoặc sập ứng dụng. | Approved |
