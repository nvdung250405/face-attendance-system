# BUILD PLAN — Kế hoạch Xây dựng & Tích hợp Hệ thống

> **Mã tài liệu:** `PLN-BLD-01`  
> **Cấp độ:** Cấp Hệ thống (System-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công phần mềm cấp hệ thống (`BLD-SYS-`), thứ tự thực hiện và phụ thuộc kỹ thuật để xây dựng và tích hợp hoàn chỉnh giải pháp Monorepo.

---

## 1. Approach & Sequencing (Chiến lược & Trình tự Xây dựng)

Chuỗi trình tự thi công được thiết kế theo nguyên tắc "Từ Biên đến Trung tâm rồi ra Trình diễn":
$$\text{Edge Vision \& Kiosk Core} \longrightarrow \text{Backend Service \& Database} \longrightarrow \text{Web Management Portal} \longrightarrow \text{End-to-End Integration}$$

* **Giai đoạn 1**: Hoàn thiện lõi AI thị giác máy tính và giao diện trạm Kiosk độc lập tại biên.
* **Giai đoạn 2**: Xây dựng CSDL trung tâm, nghiệp vụ chấm công, mã hóa AES-256-GCM và kênh truyền STOMP.
* **Giai đoạn 3**: Phát triển Cổng thông tin Web Portal và tích hợp kênh nhận dữ liệu đẩy thời gian thực.
* **Giai đoạn 4**: Tích hợp luồng dữ liệu toàn trình giữa 3 phân hệ và đóng gói hoàn chỉnh.

---

## 2. System Build Work Items (Danh mục Hạng mục Thi công Hệ thống)

| ID | Hạng mục Thi công (Work Item) | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-SYS-001` | Xây dựng Pipeline AI Biên cho Kiosk | Hiện thực hóa module đọc camera đa luồng, tích hợp YuNet, MiniFASNet, ArcFace và ma trận RAM NumPy. | `SOL-SYS-001` đến `SOL-SYS-006` | `FND-SYS-002`, `FND-SYS-003` | Chu kỳ nhận diện hoàn tất $\le 350\text{ ms}$; nhận diện đúng $\ge 95\%$, chặn giả mạo $\ge 98\%$. | **Hoàn thành** |
| `BLD-SYS-002` | Xây dựng Giao diện Kiosk & PIN Pad | Thiết kế UI PySide6 tỷ lệ 9:16, máy trạng thái viền oval 4 màu, bàn phím số ảo PIN dự phòng và quy trình đăng ký In-Viewport. | `UXD-SYS-001` đến `UXD-SYS-004` | `BLD-SYS-001` | Màn hình phản hồi tức thì $\le 50\text{ ms}$; bàn phím khóa 15p sau 5 lần sai; popup tự ẩn ở Bước 2. | **Hoàn thành** |
| `BLD-SYS-003` | Xây dựng Hàng đợi Ngoại tuyến SQLite WAL | Quản lý kết nối `kiosk_local.db` chế độ WAL, lưu đệm lượt quẹt khi mất mạng và luồng đồng bộ ngầm định kỳ 10s. | `SOL-SYS-008`, `DTD-SYS-002` | `BLD-SYS-001` | Ngắt mạng điểm danh bình thường; khi có mạng gửi bù lô tối đa 50 bản ghi thành công 100%. | **Hoàn thành** |
| `BLD-SYS-004` | Xây dựng CSDL Quan hệ PostgreSQL | Tạo các bảng theo lược đồ DDL, thiết lập khóa ngoại và chỉ mục hiệu năng cao bằng Flyway Migration. | `DTD-SYS-001` đến `DTD-SYS-009` | `FND-SYS-006` | Toàn bộ 9 bảng CSDL được khởi tạo chính xác; migration tự động chạy khi khởi động Spring Boot. | Sẵn sàng |
| `BLD-SYS-005` | Xây dựng Lõi Nghiệp vụ & Bảo mật Backend | Xử lý ca kíp, ân hạn 15p, bộ đệm Cooldown 120s Caffeine, mã hóa AES-256-GCM và cron job tiêu hủy sau 20 ngày. | `SOL-SYS-007`, `SOL-SYS-009` đến `SOL-SYS-011` | `BLD-SYS-004` | Chống quẹt lặp 120s; vector được mã hóa ciphertext; tự động xóa dữ liệu thôi việc quá 20 ngày. | Sẵn sàng |
| `BLD-SYS-006` | Xây dựng Hệ thống REST API & STOMP Broker | Phát triển các endpoint RESTful và cấu hình Spring WebSocket Message Broker phát sóng các topic thời gian thực. | `APD-SYS-001` đến `APD-SYS-009`, `SOL-SYS-012` | `BLD-SYS-005` | Kiosk gọi API thành công; thông điệp điểm danh đẩy tới topic trong vòng $\le 200\text{ ms}$. | Sẵn sàng |
| `BLD-SYS-007` | Xây dựng Màn hình Live Dashboard trên Web | Thiết kế giao diện ReactJS nhận tin STOMP, hiển thị thẻ sĩ số trực quan và bảng danh sách lượt chấm cuộn mượt. | `UXD-SYS-005`, `FR-SYS-015` | `BLD-SYS-006` | Dashboard tự cập nhật tức thời khi có người chấm công mà không cần tải lại trang Web. | Kế hoạch |
| `BLD-SYS-008` | Xây dựng Quản trị Nhân sự & Cổng Tự phục vụ | Phát triển giao diện quản lý nhân viên, phân ca, modal ký cam kết Informed Consent, cấp mã OTP và xuất file Excel. | `UXD-SYS-006`, `FR-SYS-007`, `FR-SYS-016` | `BLD-SYS-006` | Nhân viên ký Consent số; mã OTP sinh đúng hạn 48h; file Excel xuất ra sạch mã độc công thức. | Kế hoạch |
| `BLD-SYS-009` | Tích hợp Toàn trình & Đóng gói Docker Compose | Kết nối đồng bộ toàn bộ luồng dữ liệu 3 phân hệ, viết cấu hình `docker-compose.yml` điều phối toàn bộ cụm dịch vụ. | `ARC-SYS-001` đến `ARC-SYS-004` | `BLD-SYS-001` đến `BLD-SYS-008` | Chạy 1 lệnh `docker compose up -d` khởi động toàn bộ môi trường; kiểm thử E2E thông suốt. | Kế hoạch |
