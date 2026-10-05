---
title: System Test Plan
version: 1.0
status: Approved
owner: QA Lead
---

# TEST PLAN — Kế hoạch Kiểm thử & Ma trận Nghiệm thu Hệ thống

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi kiểm thử**: Toàn bộ các chức năng và chỉ tiêu chất lượng của hệ thống bao gồm: AI Vision Pipeline, GUI Kiosk, Offline SQLite, REST API, WebSocket/STOMP, Web Dashboard, và tuân thủ an toàn thông tin dữ liệu sinh trắc học.
* **Mục tiêu kiểm thử**:
  * Xác thực độ chính xác nhận diện sinh trắc học ($\ge 95\%$), chặn giả mạo ($\ge 98\%$), độ trễ phản hồi ($\le 1.5\text{s}$).
  * Kiểm chứng khả năng chịu lỗi ngoại tuyến (Fault Tolerance) và cơ chế tự động bù đồng bộ.
  * Đạt tỷ lệ bao phủ kiểm thử (Test Coverage) $\ge 80\%$ cho các thành phần nghiệp vụ cốt lõi.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-SYS-010` | Kim tự tháp kiểm thử đa tầng liên tục (Unit $\rightarrow$ Component $\rightarrow$ Integration $\rightarrow$ System $\rightarrow$ Soak). | Đảm bảo phát hiện lỗi sớm ở tầng dưới, tối ưu chi phí sửa đổi và bảo đảm độ ổn định hệ thống. | Chỉ kiểm thử E2E thủ công, Không theo kim tự tháp | Cần duy trì bộ test script tự động đồ sộ (Pytest, JUnit 5, Vitest) và mock hợp đồng. | `APC-SYS-002`, `NFR-SYS-001` | Accepted |
| `APC-SYS-011` | Kiểm thử tiêm lỗi cưỡng bức (Fault Injection Testing: ngắt mạng, mất camera, cúp điện). | Hệ thống chạy tại biên trong môi trường văn phòng/nhà xưởng có ngoại cảnh bất định, bắt buộc phải tự phục hồi. | Chỉ kiểm thử luồng thuận lợi (Happy Path) | Phải thiết lập kịch bản test rút dây mạng, ngắt tiến trình và giả lập timeout. | `NFR-SYS-006`, `RSK-001` | Accepted |
| `APC-SYS-012` | Kiểm thử ngâm tải bộ nhớ 8 giờ liên tục (Soak Testing) với luồng camera thật. | Phát hiện triệt để rò rỉ bộ nhớ (Memory Leak) từ các khung hình OpenCV/NumPy trước khi bàn giao vận hành. | Chỉ chạy unit test ngắn hạn dưới 5 phút | Cần máy trạm lab chạy ngâm tải 8 tiếng liên tục trước mỗi cột mốc release. | `NFR-SYS-009`, `PD-002` | Accepted |

---

## 3. Test Scope & Types (Phạm vi & Cấp độ Kiểm thử)

* **Unit Testing**: Kiểm thử độc lập các hàm toán học (Cosine Similarity, L2 normalization), logic ca kíp và mã hóa AES-256-GCM.
* **Component / GUI Testing**: Kiểm thử máy trạng thái viền oval 4 màu, bàn phím ảo PIN Pad và các modal tự phục vụ.
* **Integration Testing**: Kiểm định luồng tích hợp Kiosk $\leftrightarrow$ Backend qua REST API và Backend $\leftrightarrow$ Web qua STOMP.
* **Security & PAD Testing**: Kiểm thử phát hiện tấn công giả mạo (Print/Replay Attack), băm mật khẩu OTP và chống Formula Injection.
* **Entry & Exit Gates**:
  * *Entry Gate*: Linting thông qua, mã băm mô hình AI khớp 100%, schema PostgreSQL đã migrate.
  * *Exit Gate*: 100% test Blocker/Critical pass, coverage $\ge 80\%$, kiểm thử ngâm tải 8h có độ tăng RAM $\Delta_{\text{RAM}} \le 10\%$.

---

## 4. System Test Items (Ma trận Ca Kiểm thử Toàn diện Hệ thống)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-SYS-001` | Kiểm thử Thu nhận Luồng Video Camera & FPS | Đọc khung hình ổn định qua DirectShow; duy trì $\ge 15\text{ FPS}$ liên tục trong 30 phút. | `FR-SYS-001`, `NFR-SYS-002` | `BLD-SYS-001` | Không giật lag khung hình; FPS trung bình $\ge 15$. | Done |
| `TST-SYS-002` | Kiểm thử Phát hiện Mặt & Góc Quay Euler | YuNet phát hiện đúng khuôn mặt $\ge 120\times 120\text{ px}$; từ chối góc nghiêng $> 15^\circ$. | `FR-SYS-001`, `NFR-SYS-004` | `BLD-SYS-001` | Phát hiện mặt chuẩn xác; từ chối khi vượt ngưỡng Euler. | Done |
| `TST-SYS-003` | Kiểm thử Cổng Căn chỉnh Oval & Ổn định Thời gian | Đạt độ lệch tâm $\le 120\text{ px}$, diện tích $25\% - 75\%$; giữ ổn định liên tục $0.5 - 1.0\text{ s}$ mới nhận diện. | `FR-SYS-001`, `UI-SYS-001` | `BLD-SYS-002` | Chuyển trạng thái Oval chính xác sau thời gian giữ ổn định. | Done |
| `TST-SYS-004` | Kiểm thử Chặn Ảnh In 2D Giả mạo (Print Attack) | Đưa ảnh in chân dung giấy A4 trước camera; MiniFASNet từ chối $S < 0.85$, viền đỏ cảnh báo. | `FR-SYS-002`, `NFR-SYS-005` | `BLD-SYS-001` | Điểm liveness < 0.85, hiển thị viền đỏ và từ chối chấm công. | Done |
| `TST-SYS-005` | Kiểm thử Chặn Video Phát lại (Replay Attack) | Phát video khuôn mặt qua màn hình điện thoại/iPad; hệ thống chặn đứng với độ chính xác $\ge 98\%$. | `FR-SYS-002`, `NFR-SYS-005` | `BLD-SYS-001` | Chặn video phát lại đạt độ chính xác $\ge 98\%$. | Done |
| `TST-SYS-006` | Kiểm thử Trích xuất ArcFace & So khớp RAM | Vector 512D chuẩn hóa L2 = 1.0; so khớp Cosine ma trận 1,000 nhân sự hoàn tất $< 2\text{ ms}$. | `FR-SYS-003`, `NFR-SYS-001` | `BLD-SYS-001` | Tính toán Cosine similarity ma trận RAM $< 2\text{ ms}$. | Done |
| `TST-SYS-007` | Kiểm thử Bàn phím Số ảo PIN & Khóa 15 Phút | Nhập PIN 6 số $\rightarrow$ Backend xác thực thành công mới ghi nhận điểm danh; nhập sai quá 5 lần liên tiếp khóa 15 phút. *(Đợt kiểm thử trước chỉ phủ logic đếm khóa phía client, chưa phủ hành vi xác thực thật — xem defect #31.)* | `FR-SYS-004`, `DATA-SYS-012`, `API-SYS-023` | `BLD-SYS-002`, `BLD-SYS-006` | PIN đúng mới tạo bản ghi điểm danh; PIN sai không tạo bản ghi; khóa 15 phút sau 5 lần nhập sai liên tiếp. | Planned |
| `TST-SYS-008` | Kiểm thử Chống Quét Trùng Lặp Cooldown 120s | Quẹt liên tiếp trong 120s bị từ chối và hiển thị thông báo "Đã ghi nhận, vui lòng không quẹt lại". | `FR-SYS-005` | `BLD-SYS-001` | Từ chối lượt quét thứ hai trong 120 giây. | Done |
| `TST-SYS-009` | Kiểm thử Hàng đợi Ngoại tuyến SQLite WAL | Rút dây mạng, quẹt 20 lượt điểm danh; toàn bộ bản ghi lưu vào SQLite; tắt máy cưỡng bức không hỏng CSDL. | `FR-SYS-006`, `NFR-SYS-006` | `BLD-SYS-003` | RPO = 0, toàn bộ bản ghi còn nguyên vẹn trong SQLite WAL. | Done |
| `TST-SYS-010` | Kiểm thử Tự động Đồng bộ Bù Ngoại tuyến | Cắm mạng lại; Kiosk tự gom lô tối đa 50 bản ghi gửi `sync-batch`; Backend ghi nhận đủ mốc giờ gốc. | `FR-SYS-006`, `API-SYS-013` | `BLD-SYS-003`, `BLD-SYS-006` | Đồng bộ 100% bản ghi với mốc giờ gốc không sai lệch. | Planned |
| `TST-SYS-011` | Kiểm thử Ký Thỏa thuận Informed Consent | Nhân viên mới tích chọn đồng ý trên Web; lưu vết IP và timestamp vào `consent_audit_logs`. | `FR-SYS-007`, `DATA-SYS-007` | `BLD-SYS-008` | Ghi nhận văn bản thỏa thuận bất biến trong audit logs. | Planned |
| `TST-SYS-012` | Kiểm thử Xác thực Mã Onboarding OTP 48h | Nhập đúng OTP mở khóa nạp mặt; nhập OTP sai hoặc quá hạn 48h báo lỗi từ chối rõ ràng. | `FR-SYS-008`, `DATA-SYS-011` | `BLD-SYS-006` | OTP dùng đúng 1 lần và từ chối khi hết hạn 48h. | Planned |
| `TST-SYS-013` | Kiểm thử Quy trình Tự Đăng ký In-Viewport | Nhập OTP $\rightarrow$ Popup tự ẩn $\rightarrow$ Chụp 3 ảnh chuẩn trên camera chính $\rightarrow$ Mở lại ở Bước 3. | `FR-SYS-009`, `UI-SYS-003` | `BLD-SYS-002` | Luồng tự đăng ký 3 bước hoạt động trơn tru. | Done |
| `TST-SYS-014` | Kiểm thử Mã hóa Dữ liệu Tĩnh AES-256-GCM | Cột `template_vector_encrypted` trong PostgreSQL lưu ciphertext BYTEA; giải mã đúng khi nạp Kiosk. | `FR-SYS-010`, `SRS-001` | `BLD-SYS-005` | Dữ liệu tĩnh được mã hóa kèm IV và Auth Tag đầy đủ. | Planned |
| `TST-SYS-015` | Kiểm thử Tự động Xóa Dữ liệu sau 20 Ngày | Nhân viên nghỉ việc quá 20 ngày; cron job quét xóa sạch vector khỏi CSDL và ghi log kiểm toán. | `FR-SYS-011`, `DATA-SYS-013` | `BLD-SYS-005` | Xóa sạch vector sau 20 ngày kể từ ngày chấm dứt hợp đồng. | Planned |
| `TST-SYS-016` | Kiểm thử Tính Ca kíp & Ân hạn 15 Phút | Chấm công trong vòng 15p đầu ca tính đúng giờ (`ON_TIME`); sau 15p tính đi muộn (`LATE`). | `FR-SYS-012` | `BLD-SYS-005` | Tính toán số phút đi muộn chính xác theo ca làm việc. | Planned |
| `TST-SYS-017` | Kiểm thử Phát sóng STOMP lên Live Dashboard | Kiosk chấm công thành công; bản ghi xuất hiện trên Dashboard Web trong vòng $\le 200\text{ ms}$. | `FR-SYS-013`, `NFR-SYS-003` | `BLD-SYS-006`, `BLD-SYS-007` | Dashboard cập nhật dòng mới trong vòng $\le 200\text{ ms}$. | Planned |
| `TST-SYS-018` | Kiểm thử Nạp nóng Vector vào RAM Kiosk | Nhân viên mới đăng ký trên trạm A; trạm B nhận bản tin STOMP nạp vector vào RAM ngay lập tức. | `FR-SYS-014` | `BLD-SYS-006` | Trạm Kiosk nạp nóng vector vào RAM ma trận tức thì. | Planned |
| `TST-SYS-019` | Kiểm thử Duyệt Giải trình & Xuất Báo cáo | HR duyệt đơn giải trình; xuất file Excel bảng công kiểm tra không chứa mã độc Formula Injection. | `FR-SYS-016`, `SRS-007` | `BLD-SYS-008` | File Excel xuất ra được chèn dấu escape trước ký tự nguy hiểm. | Planned |
| `TST-SYS-020` | Kiểm thử Ngâm tải Bộ nhớ Liên tục 8 Giờ | Chạy ứng dụng Kiosk với camera hoạt động thật liên tục 8h; mức RAM duy trì ổn định $\Delta \le 10\%$. | `NFR-SYS-009` | `BLD-SYS-001` | Sau 8 giờ chạy liên tục, dung lượng RAM Kiosk tăng $\le 10\%$. | Planned |
| `TST-SYS-021` | Kiểm thử Khởi tạo Tài khoản Nhân sự & Buộc đổi Mật khẩu | HR tạo hồ sơ nhân sự mới; hệ thống trả mật khẩu tạm hiển thị đúng một lần; đăng nhập bằng mật khẩu tạm và kiểm tra chặn nghiệp vụ cho tới khi đổi mật khẩu. | `FR-SYS-017`, `API-SYS-021`, `API-SYS-008`, `DATA-SYS-016` | `BLD-SYS-006`, `BLD-SYS-008` | Tạo hồ sơ trả mật khẩu tạm một lần; mọi endpoint nghiệp vụ trả 403 `PASSWORD_CHANGE_REQUIRED` khi còn cờ buộc đổi; sau khi đổi mật khẩu, đăng nhập lại bằng mật khẩu mới thành công và mật khẩu tạm hết hiệu lực. | Planned |
| `TST-SYS-022` | Kiểm thử Thiết lập & Xác thực Mã PIN Dự phòng | Nhân viên tự thiết lập PIN trên Web Portal; Kiosk xác thực PIN qua Backend trước khi ghi nhận điểm danh; kiểm tra các nhánh sai PIN và khóa brute-force. | `FR-SYS-017`, `API-SYS-022`, `API-SYS-023`, `DATA-SYS-012` | `BLD-SYS-006`, `BLD-SYS-008` | PIN đúng ghi nhận điểm danh `VERIFICATION_PIN`; PIN sai trả 401 `PIN_INVALID` và **không** tạo bản ghi; sai 5 lần liên tiếp trả 423 `PIN_LOCKED` trong 15 phút. | Planned |
| `TST-SYS-023` | Kiểm thử Vô hiệu hóa Nhân sự & Kích hoạt Tiêu hủy Sinh trắc | HR vô hiệu hóa nhân sự; kiểm tra trạng thái công tác, bản ghi audit và việc cron job 20 ngày tiêu hủy vector sinh trắc. | `API-SYS-008`, `FR-SYS-017`, `DATA-SYS-013` | `BLD-SYS-005`, `BLD-SYS-008` | Vô hiệu hóa đặt trạng thái `TERMINATED` kèm `terminated_date` và ghi audit log; sau 20 ngày, cron job xóa sạch `biometric_templates` của nhân sự đó. | Planned |

---

## 5. Defect Management (Quy trình Quản lý Lỗi)

* **Phân loại Mức độ Nghiêm trọng (Severity Levels)**:
  * **Blocker (P0)**: Sập ứng dụng, mất dữ liệu điểm danh, rò rỉ khóa mã hóa. Phải xử lý ngay lập tức trong vòng 4 giờ.
  * **Critical (P1)**: Sai lệch kết quả nhận diện, lỗi đồng bộ ngoại tuyến, không đăng ký được nhân viên. Xử lý trong vòng 24 giờ.
  * **Major (P2)**: Lỗi giao diện người dùng, thông điệp hiển thị chậm nhưng không ảnh hưởng tính toàn vẹn dữ liệu. Xử lý trước đợt release tiếp theo.
  * **Minor (P3)**: Lỗi căn chỉnh văn bản, sai sót nhỏ về định dạng ngày tháng hiển thị.
* **Vòng đời Lỗi (Defect Lifecycle)**:
  $$\text{New} \longrightarrow \text{Assigned} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved} \longrightarrow \text{Re-tested} \longrightarrow \text{Closed}$$

---

## 6. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Thiết bị Kiểm thử Phần cứng Thật**: Kiểm thử thu nhận video và góc quay Euler yêu cầu camera UVC vật lý tối thiểu 720p@30fps; trên môi trường CI/CD GitHub Actions không có camera vật lý, kịch bản kiểm thử sử dụng mock video frames và dummy image provider.
* **Thời gian Chạy Ngâm tải (Soak Testing)**: Bài kiểm thử ngâm tải 8 giờ (`TST-SYS-020`) được thực thi định kỳ trước mỗi cột mốc Release chính trên máy trạm thực nghiệm riêng biệt, không chạy trong các lượt build PR thường ngày để tối ưu thời gian phản hồi kiểm thử.

