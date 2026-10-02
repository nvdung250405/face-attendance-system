# TEST PLAN — Kế hoạch Kiểm thử & Ma trận Nghiệm thu Hệ thống

> **Mã tài liệu:** `PLN-TST-01`  
> **Cấp độ:** Cấp Hệ thống (System-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Xác lập chiến lược kiểm thử, môi trường thử nghiệm, tiêu chuẩn nghiệm thu và ma trận ca kiểm thử toàn diện (`TST-SYS-`) để kiểm chứng trọn vẹn 16 yêu cầu chức năng và các chỉ số chất lượng phi chức năng của hệ thống.

---

## 1. Approach & Test Levels (Chiến lược & Các Mức độ Kiểm thử)

Hệ thống áp dụng mô hình Kim tự tháp kiểm thử đa tầng liên tục:
* **Mức 1 — Unit Testing**: Kiểm thử độc lập từng thuật toán và hàm xử lý (Cosine Similarity, băm mật mã, logic ca kíp).
* **Mức 2 — Component GUI Testing**: Kiểm thử các thành phần giao diện (Khung Oval 4 màu, bàn phím số PIN Pad, Live Dashboard).
* **Mức 3 — Integration Testing**: Kiểm thử tích hợp chuỗi pipeline thị giác máy tính và giao thức truyền thông REST/STOMP.
* **Mức 4 — System & Fault Injection Testing**: Mô phỏng sự cố mạng, cúp điện đột ngột, tấn công giả mạo ảnh in/video 2D.
* **Mức 5 — Soak Testing**: Kiểm thử ngâm tải liên tục 8 giờ làm việc trên máy trạm để phát hiện rò rỉ bộ nhớ.

---

## 2. Test Gates (Điều kiện Đầu vào & Đầu ra Kiểm thử)

* **Entry Gate (Điều kiện Đầu vào)**:
  * Mã nguồn vượt qua kiểm tra tĩnh (Linter: Ruff cho Python, ESLint cho Web) không còn lỗi cú pháp.
  * Toàn bộ 3 tệp trọng số mô hình AI hiện diện đầy đủ và kiểm tra mã băm SHA-256 hợp lệ.
  * Môi trường CSDL PostgreSQL và các tệp migration đã khởi tạo thành công.
* **Exit Gate (Tiêu chí Hoàn thành)**:
  * 100% các ca kiểm thử mức Blocker và Critical vượt qua thành công (Pass rate: 100%).
  * Tỷ lệ bao phủ kiểm thử tự động (Line Coverage) đạt $\ge 80\%$ đối với các khối xử lý cốt lõi.
  * Không còn rò rỉ bộ nhớ RAM sau bài kiểm thử ngâm tải 8 giờ ($\Delta_{\text{RAM}} \le 10\%$).

---

## 3. System Test Items (Ma trận Ca Kiểm thử Toàn diện Hệ thống)

| ID | Tên Ca Kiểm thử (Test Item Title) | Covers Spec | Mức độ Test | Tiêu chí Đạt (Done when / Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-SYS-001` | Kiểm thử Thu nhận Luồng Video Camera & FPS | `FR-SYS-001`, `NFR-SYS-002` | Unit / Component | Đọc khung hình ổn định qua DirectShow; duy trì $\ge 15\text{ FPS}$ liên tục trong 30 phút. | **Passed** |
| `TST-SYS-002` | Kiểm thử Phát hiện Mặt & Góc Quay Euler | `FR-SYS-001`, `NFR-SYS-004` | Unit | YuNet phát hiện đúng khuôn mặt $\ge 120\times 120\text{ px}$; từ chối góc nghiêng $> 15^\circ$. | **Passed** |
| `TST-SYS-003` | Kiểm thử Cổng Căn chỉnh Oval & Ổn định Thời gian | `FR-SYS-001`, `UI-SYS-001` | Functional / UX | Đạt độ lệch tâm $\le 120\text{ px}$, diện tích $25\% - 75\%$; giữ ổn định liên tục $0.5 - 1.0\text{ s}$ mới nhận diện. | **Passed** |
| `TST-SYS-004` | Kiểm thử Chặn Ảnh In 2D Giả mạo (Print Attack) | `FR-SYS-002`, `NFR-SYS-005` | PAD / Security | Đưa ảnh in chân dung giấy A4 trước camera; MiniFASNet từ chối $S < 0.85$, viền đỏ cảnh báo. | **Passed** |
| `TST-SYS-005` | Kiểm thử Chặn Video Phát lại (Replay Attack) | `FR-SYS-002`, `NFR-SYS-005` | PAD / Security | Phát video khuôn mặt qua màn hình điện thoại/iPad; hệ thống chặn đứng với độ chính xác $\ge 98\%$. | **Passed** |
| `TST-SYS-006` | Kiểm thử Trích xuất ArcFace & So khớp RAM | `FR-SYS-003`, `NFR-SYS-001` | Unit / Integration | Vector 512D chuẩn hóa L2 = 1.0; so khớp Cosine ma trận 1,000 nhân sự hoàn tất $< 2\text{ ms}$. | **Passed** |
| `TST-SYS-007` | Kiểm thử Bàn phím Số ảo PIN & Khóa 15 Phút | `FR-SYS-004`, `DATA-SYS-012` | UI / Security | Nhập đúng PIN 6 số ghi nhận thành công; nhập sai quá 5 lần liên tiếp tự khóa 15 phút. | **Passed** |
| `TST-SYS-008` | Kiểm thử Chống Quét Trùng Lặp Cooldown 120s | `FR-SYS-005` | Functional | Quẹt liên tiếp trong 120s bị từ chối và hiển thị thông báo "Đã ghi nhận, vui lòng không quẹt lại". | **Passed** |
| `TST-SYS-009` | Kiểm thử Hàng đợi Ngoại tuyến SQLite WAL | `FR-SYS-006`, `NFR-SYS-006` | Resiliency | Rút dây mạng, quẹt 20 lượt điểm danh; toàn bộ bản ghi lưu vào SQLite; tắt máy cưỡng bức không hỏng CSDL. | **Passed** |
| `TST-SYS-010` | Kiểm thử Tự động Đồng bộ Bù Ngoại tuyến | `FR-SYS-006`, `API-SYS-013` | Integration | Cắm mạng lại; Kiosk tự gom lô tối đa 50 bản ghi gửi `sync-batch`; Backend ghi nhận đủ mốc giờ gốc. | Sẵn sàng |
| `TST-SYS-011` | Kiểm thử Ký Thỏa thuận Informed Consent | `FR-SYS-007`, `DATA-SYS-007` | Compliance / Web | Nhân viên mới tích chọn đồng ý trên Web; lưu vết IP và timestamp vào `consent_audit_logs`. | Sẵn sàng |
| `TST-SYS-012` | Kiểm thử Xác thực Mã Onboarding OTP 48h | `FR-SYS-008`, `DATA-SYS-011` | Security | Nhập đúng OTP mở khóa nạp mặt; nhập OTP sai hoặc quá hạn 48h báo lỗi từ chối rõ ràng. | Sẵn sàng |
| `TST-SYS-013` | Kiểm thử Quy trình Tự Đăng ký In-Viewport | `FR-SYS-009`, `UI-SYS-003` | Functional / UX | Nhập OTP $\rightarrow$ Popup tự ẩn $\rightarrow$ Chụp 3 ảnh chuẩn trên camera chính $\rightarrow$ Mở lại ở Bước 3. | **Passed** |
| `TST-SYS-014` | Kiểm thử Mã hóa Dữ liệu Tĩnh AES-256-GCM | `FR-SYS-010`, `SRS-001` | Security | Cột `template_vector_encrypted` trong PostgreSQL lưu ciphertext BYTEA; giải mã đúng khi nạp Kiosk. | Sẵn sàng |
| `TST-SYS-015` | Kiểm thử Tự động Xóa Dữ liệu sau 20 Ngày | `FR-SYS-011`, `DATA-SYS-013` | Compliance | Nhân viên nghỉ việc quá 20 ngày; cron job quét xóa sạch vector khỏi CSDL và ghi log kiểm toán. | Sẵn sàng |
| `TST-SYS-016` | Kiểm thử Tính Ca kíp & Ân hạn 15 Phút | `FR-SYS-012` | Business Rule | Chấm công trong vòng 15p đầu ca tính đúng giờ (`ON_TIME`); sau 15p tính đi muộn (`LATE`). | Sẵn sàng |
| `TST-SYS-017` | Kiểm thử Phát sóng STOMP lên Live Dashboard | `FR-SYS-013`, `NFR-SYS-003` | Realtime / E2E | Kiosk chấm công thành công; bản ghi xuất hiện trên Dashboard Web trong vòng $\le 200\text{ ms}$. | Sẵn sàng |
| `TST-SYS-018` | Kiểm thử Nạp nóng Vector vào RAM Kiosk | `FR-SYS-014` | Integration | Nhân viên mới đăng ký trên trạm A; trạm B nhận bản tin STOMP nạp vector vào RAM ngay lập tức. | Sẵn sàng |
| `TST-SYS-019` | Kiểm thử Duyệt Giải trình & Xuất Báo cáo | `FR-SYS-016`, `SRS-007` | Functional / Security | HR duyệt đơn giải trình; xuất file Excel bảng công kiểm tra không chứa mã độc Formula Injection. | Sẵn sàng |
| `TST-SYS-020` | Kiểm thử Ngâm tải Bộ nhớ Liên tục 8 Giờ | `NFR-SYS-009`, `KPI-06` | Soak Testing | Chạy ứng dụng Kiosk với camera hoạt động thật liên tục 8h; mức RAM duy trì ổn định $\Delta \le 10\%$. | Sẵn sàng |
