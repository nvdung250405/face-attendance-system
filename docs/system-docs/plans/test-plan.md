---
title: System Test Plan
version: 1.1
status: Approved
owner: QA Lead
---

# TEST PLAN — Kế hoạch Kiểm thử & Ma trận Nghiệm thu Hệ thống

Kế hoạch kiểm thử toàn diện, phương pháp luận nghiệm thu và ma trận ca kiểm thử tích hợp cho toàn bộ Hệ thống Chấm công bằng Nhận diện Khuôn mặt (FAS) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §9.6).

---

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi kiểm thử**: Toàn bộ các chức năng và chỉ tiêu chất lượng của hệ thống bao gồm: AI Vision Pipeline, GUI Kiosk, Offline SQLite WAL, REST API, WebSocket STOMP, Web Dashboard, và tuân thủ an toàn thông tin dữ liệu sinh trắc học theo Luật 91/2025/QH15.
* **Mục tiêu kiểm thử**:
  * Xác thực độ chính xác nhận diện sinh trắc học ($\ge 95\%$, $\text{FPIR} \le 0.1\%$), chặn giả mạo ($\ge 98\%$, $\text{APCER} \le 2.0\%$, $\text{BPCER} \le 5.0\%$), chu kỳ pipeline biên $\le 350\text{ ms}$, tổng thời gian face-to-dashboard $\le 1.2\text{ s}$.
  * Kiểm chứng khả năng chịu lỗi ngoại tuyến (Fault Tolerance, $\text{RPO} = 0$) và cơ chế tự động gửi bù đồng bộ theo lô.
  * Đạt tỷ lệ bao phủ kiểm thử (Test Coverage) $\ge 80\%$ cho các thành phần nghiệp vụ cốt lõi qua 34 ca kiểm thử toàn diện (`TST-SYS-001..034`).

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
| `TST-SYS-003` | Kiểm thử Cổng Căn chỉnh Oval & Ổn định Thời gian | Đạt độ lệch tâm $\le 120\text{ px}$, diện tích $25\% - 75\%$; giữ ổn định liên tục $0.5 - 1.0\text{ s}$ mới nhận diện. | `FR-SYS-001`, `NFR-SYS-001` | `BLD-SYS-002` | Chuyển trạng thái Oval chính xác sau thời gian giữ ổn định. | Done |
| `TST-SYS-004` | Kiểm thử Chặn Ảnh In 2D Giả mạo (Print Attack) | Đưa ảnh in chân dung giấy A4 trước camera; MiniFASNet từ chối $S < 0.85$, viền đỏ cảnh báo. | `FR-SYS-002`, `NFR-SYS-005` | `BLD-SYS-001` | Điểm liveness < 0.85, hiển thị viền đỏ và từ chối chấm công. | Done |
| `TST-SYS-005` | Kiểm thử Chặn Video Phát lại (Replay Attack) | Phát video khuôn mặt qua màn hình điện thoại/iPad; hệ thống chặn đứng với độ chính xác $\ge 98\%$. | `FR-SYS-002`, `NFR-SYS-005` | `BLD-SYS-001` | Chặn video phát lại đạt độ chính xác $\ge 98\%$, $\text{APCER} \le 2.0\%$. | Done |
| `TST-SYS-006` | Kiểm thử Trích xuất ArcFace & So khớp RAM | Vector 512D chuẩn hóa L2 = 1.0; so khớp Cosine ma trận 1,000 nhân sự hoàn tất $< 2\text{ ms}$. | `FR-SYS-003`, `NFR-SYS-001`, `NFR-SYS-004` | `BLD-SYS-001` | Tính toán Cosine similarity ma trận RAM $< 2\text{ ms}$; độ chính xác thỏa mãn $\text{FPIR} \le 0.1\%$. | Done |
| `TST-SYS-007` | Kiểm thử Bàn phím Số ảo PIN & Khóa 15 Phút | Nhập PIN 6 số $\rightarrow$ Backend xác thực thành công mới ghi nhận điểm danh; nhập sai quá 5 lần liên tiếp khóa 15 phút. | `FR-SYS-004`, `FR-SYS-017` | `BLD-SYS-002`, `BLD-SYS-006` | PIN đúng mới tạo bản ghi điểm danh; PIN sai không tạo bản ghi; khóa 15 phút per-account và per-device sau 5 lần nhập sai liên tiếp. | Planned |
| `TST-SYS-008` | Kiểm thử Hợp đồng Điểm danh & Chống Quét Trùng Lặp Cooldown 120s | Kiểm tra phản hồi hợp đồng điểm danh (`PUNCH_ACCEPTED`, `recordId`, `punchTime`, `status`) và việc quẹt liên tiếp trong 120s bị từ chối kèm thông báo rõ ràng. | `FR-SYS-005`, `NFR-SYS-003` | `BLD-SYS-001`, `BLD-SYS-006` | Lượt điểm danh hợp lệ trả kết quả tính theo ca; lượt quét thứ hai trong 120 giây bị từ chối tức thì. | Done |
| `TST-SYS-009` | Kiểm thử Hàng đợi Ngoại tuyến SQLite WAL | Rút dây mạng, quẹt 20 lượt điểm danh; toàn bộ bản ghi lưu vào SQLite với `PRAGMA synchronous = FULL`; tắt máy cưỡng bức không hỏng CSDL. | `FR-SYS-006`, `NFR-SYS-006`, `SRS-008` | `BLD-SYS-003` | RPO = 0, toàn bộ bản ghi còn nguyên vẹn trong SQLite WAL sau sự cố mất điện. | Done |
| `TST-SYS-010` | Kiểm thử Tự động Đồng bộ Bù Ngoại tuyến & Đồng thời Đa Trạm | Cắm mạng lại; Kiosk tự gom lô tối đa 50 bản ghi gửi `sync-batch`; Backend ghi nhận đủ mốc giờ gốc; kiểm tra xử lý đồng thời (concurrency) khi nhiều Kiosk đồng bộ cùng lúc không phát sinh deadlock CSDL; `/actuator/health` đạt độ sẵn sàng 99.9%. | `FR-SYS-006`, `NFR-SYS-006`, `NFR-SYS-008`, `SRS-009` | `BLD-SYS-003`, `BLD-SYS-006` | Đồng bộ 100% bản ghi với mốc giờ gốc không sai lệch; giao dịch CSDL an toàn không sinh xung đột; endpoint health phản hồi $\le 200\text{ ms}$. | Planned |
| `TST-SYS-011` | Kiểm thử Ký Thỏa thuận Informed Consent | Nhân viên mới tích chọn đồng ý trên Web; lưu vết IP và timestamp vào `audit_logs`. | `FR-SYS-007`, `SRS-004`, `SRS-010` | `BLD-SYS-008` | Ghi nhận văn bản thỏa thuận bất biến trong audit logs. | Planned |
| `TST-SYS-012` | Kiểm thử Xác thực Mã Onboarding OTP 48h | Nhập đúng OTP mở khóa nạp mặt; nhập OTP sai hoặc quá hạn 48h báo lỗi từ chối rõ ràng; mã OTP lưu dạng HMAC-SHA-256 kèm pepper. | `FR-SYS-008` | `BLD-SYS-006` | OTP dùng đúng 1 lần và từ chối khi hết hạn 48h; khóa tạm thời sau 5 lần nhập sai. | Planned |
| `TST-SYS-013` | Kiểm thử Quy trình Tự Đăng ký In-Viewport | Nhập OTP $\rightarrow$ Popup tự ẩn $\rightarrow$ Chụp 3 ảnh chuẩn trên camera chính đạt $S_{\text{liveness}} \ge 0.85$ $\rightarrow$ Nạp vector thành công. | `FR-SYS-009` | `BLD-SYS-002` | Luồng tự đăng ký 3 bước hoạt động trơn tru; mẫu khuôn mặt nạp vào đạt chuẩn điểm sống vận hành $S_{\text{liveness}} \ge 0.85$. | Done |
| `TST-SYS-014` | Kiểm thử Mã hóa Dữ liệu Tĩnh AES-256-GCM, TLS 1.3 & Sao lưu Mã hóa | Cột `template_vector_encrypted` trong PostgreSQL lưu ciphertext BYTEA; giải mã đúng khi nạp Kiosk; kết nối HTTPS/WSS yêu cầu chứng chỉ hợp lệ và TLS 1.3; kiểm tra bản sao lưu CSDL `pg_dump` được mã hóa trước khi ghi đĩa. | `FR-SYS-010`, `SRS-001`, `SRS-002`, `NFR-SYS-007` | `BLD-SYS-005` | Dữ liệu tĩnh được mã hóa kèm IV và Auth Tag đầy đủ; kênh truyền từ chối TLS < 1.3; tệp sao lưu trên đĩa ở dạng ciphertext an toàn. | Planned |
| `TST-SYS-015` | Kiểm thử Tự động Xóa Dữ liệu sau 20 Ngày | Nhân viên nghỉ việc quá 20 ngày; cron job quét xóa sạch vector khỏi CSDL và ghi log kiểm toán. | `FR-SYS-011`, `SRS-003` | `BLD-SYS-005` | Xóa sạch vector sau 20 ngày kể từ ngày chấm dứt hợp đồng. | Planned |
| `TST-SYS-016` | Kiểm thử Tính Ca kíp & Ân hạn 15 Phút | Chấm công trong vòng 15p đầu ca tính đúng giờ (`ON_TIME`); sau 15p tính đi muộn (`LATE`). | `FR-SYS-012` | `BLD-SYS-005` | Tính toán số phút đi muộn chính xác theo ca làm việc. | Planned |
| `TST-SYS-017` | Kiểm thử Phát sóng STOMP lên Live Dashboard | Kiosk chấm công thành công; bản ghi xuất hiện trên Dashboard Web trong vòng $\le 200\text{ ms}$; tổng thời gian face-to-dashboard $\le 1.2\text{ s}$. | `FR-SYS-013`, `NFR-SYS-003` | `BLD-SYS-006`, `BLD-SYS-007` | Dashboard cập nhật dòng mới trong vòng $\le 200\text{ ms}$ từ khi Backend xử lý xong. | Planned |
| `TST-SYS-018` | Kiểm thử Nạp nóng Vector vào RAM Kiosk | Nhân viên mới đăng ký trên trạm A; trạm B nhận bản tin STOMP nạp vector vào RAM ngay lập tức và ghi đệm vào cache cục bộ. | `FR-SYS-014` | `BLD-SYS-006` | Trạm Kiosk nạp nóng vector vào RAM ma trận tức thì mà không cần khởi động lại. | Planned |
| `TST-SYS-019` | Kiểm thử Duyệt Giải trình & Xuất Báo cáo | HR duyệt đơn giải trình; xuất file Excel bảng công kiểm tra không chứa mã độc Formula Injection. | `FR-SYS-015`, `FR-SYS-016`, `SRS-007` | `BLD-SYS-008` | File Excel xuất ra được chèn dấu escape `'` trước ký tự nguy hiểm `=`, `+`, `-`, `@`. | Planned |
| `TST-SYS-020` | Kiểm thử Ngâm tải Bộ nhớ Liên tục 8 Giờ với Vòng lặp AI | Kích hoạt luồng đọc camera và vòng lặp suy luận AI (YuNet, MiniFASNet, ArcFace) liên tục trong 8 giờ trên máy trạm Kiosk CPU AVX2; giám sát bộ nhớ qua psutil. | `NFR-SYS-009` | `BLD-SYS-001` | Sau 8 giờ chạy vòng lặp AI liên tục, mức tăng RAM $\Delta_{\text{RAM}} \le 10\%$, tổng RAM duy trì $< 800\text{ MB}$, không phát sinh rò rỉ mảng NumPy hay bộ đệm khung hình. | Planned |
| `TST-SYS-021` | Kiểm thử Khởi tạo Tài khoản Nhân sự & Đổi Mật khẩu Tự nguyện | HR tạo hồ sơ nhân sự mới; hệ thống trả mật khẩu tạm hiển thị đúng một lần; đăng nhập bằng mật khẩu tạm và dùng ngay được mọi chức năng; đổi mật khẩu khi tự nguyện. | `FR-SYS-017`, `SRS-005` | `BLD-SYS-006`, `BLD-SYS-008` | Tạo hồ sơ trả mật khẩu tạm một lần; tài khoản dùng mật khẩu tạm không bị chặn nghiệp vụ; sau khi đổi mật khẩu thành công, phiên cũ bị thu hồi. | Planned |
| `TST-SYS-022` | Kiểm thử Thiết lập & Xác thực Mã PIN Dự phòng | Nhân viên tự thiết lập PIN trên Web Portal; Kiosk xác thực PIN qua Backend trước khi ghi nhận điểm danh; kiểm tra các nhánh sai PIN và khóa brute-force. | `FR-SYS-017`, `SRS-005` | `BLD-SYS-006`, `BLD-SYS-008` | PIN đúng ghi nhận điểm danh `VERIFICATION_PIN`; PIN sai trả 401 `PIN_INVALID`; sai 5 lần liên tiếp trả 423 `PIN_LOCKED` trong 15 phút. | Planned |
| `TST-SYS-023` | Kiểm thử Vô hiệu hóa Nhân sự & Kích hoạt Tiêu hủy Sinh trắc | HR vô hiệu hóa nhân sự; kiểm tra trạng thái công tác, bản ghi audit và việc cron job 20 ngày tiêu hủy vector sinh trắc. | `FR-SYS-011`, `FR-SYS-017`, `SRS-003` | `BLD-SYS-005`, `BLD-SYS-008` | Vô hiệu hóa đặt trạng thái `TERMINATED` kèm `terminated_date` và ghi audit log; sau 20 ngày, cron job xóa sạch vector sinh trắc của nhân sự đó. | Planned |
| `TST-SYS-024` | Kiểm thử Tạo Ca, Phân ca & Áp dụng Ca khi Chấm công | HR tạo ca (thường và ca gãy), phân ca cho nhân viên theo khoảng hiệu lực; kiểm tra ca đang hiệu lực được áp dụng khi tính đi muộn/về sớm. | `FR-SYS-018` | `BLD-SYS-006`, `BLD-SYS-008` | Ca 08:00-17:30 ân hạn 15 phút: chấm lúc 08:20 tính `LATE` 5 phút; nhân viên chưa phân ca nhận trạng thái `ANOMALOUS`. | Planned |
| `TST-SYS-025` | Kiểm thử Chống Chồng lấn Lịch Phân ca | Tạo/sửa phân ca sao cho khoảng hiệu lực giao nhau của cùng nhân viên; kiểm tra phản hồi 409 và tính toàn vẹn dữ liệu. | `FR-SYS-018` | `BLD-SYS-006` | Phân ca chồng khoảng trả HTTP 409 và không ghi bản ghi; phân ca liền kề được chấp nhận; hai yêu cầu đồng thời không tạo được cặp chồng lấn. | Planned |
| `TST-SYS-026` | Kiểm thử Tra cứu Kiểm toán & Tuân thủ Dữ liệu | ADMIN tra cứu nhật ký kiểm toán theo khoảng thời gian/tác nhân/hành vi; DPO tra cứu chữ ký Consent và lịch trình tiêu hủy; kiểm tra chặn ghi/sửa với các role này. | `FR-SYS-019`, `SRS-010` | `BLD-SYS-006` | ADMIN lọc được `audit_logs` và nhận 403 khi không đủ quyền; role `DPO` chỉ đọc được Consent/retention; không tồn tại đường sửa/xoá `audit_logs`. | Planned |
| `TST-SYS-027` | Kiểm thử Vòng đời Trạm Kiosk | Đăng ký trạm mới, dùng Secret Token gọi giao diện Kiosk, đổi token và vô hiệu hóa trạm; kiểm tra cập nhật `last_ping_at`. | `FR-SYS-020`, `SRS-006` | `BLD-SYS-006` | Token chỉ hiển thị một lần và lưu dạng băm; token cũ bị từ chối ngay sau khi đổi; trạm `INACTIVE` nhận 401 ở mọi giao diện Kiosk. | Planned |
| `TST-SYS-028` | Kiểm thử Luồng Đơn Giải trình Công | Nhân viên nộp đơn cho một lượt chấm sai; HR duyệt và kiểm tra bản ghi công được điều chỉnh kèm audit; kiểm tra nhánh từ chối và đơn đã xử lý. | `FR-SYS-016`, `SRS-010` | `BLD-SYS-006`, `BLD-SYS-008` | Đơn được duyệt cập nhật đúng bản ghi điểm danh và sinh đúng một bản ghi audit có giá trị trước/sau; đơn đã duyệt/từ chối không đổi được trạng thái lần hai. | Planned |
| `TST-SYS-029` | Kiểm thử Khởi tạo Hệ thống An toàn (Bootstrap Admin) | Chạy bootstrap trên CSDL trống để tạo tài khoản quản trị đầu tiên; kiểm tra mật khẩu phức tạp $\ge 12$ ký tự, tính idempotent và không có mật khẩu mặc định. | `FR-SYS-021`, `SRS-005` | `BLD-SYS-006` | Bootstrap tạo đúng một tài khoản `ADMIN`; đăng nhập dùng được ngay; gọi lại bootstrap không tạo thêm tài khoản; không tồn tại mật khẩu mặc định. | Planned |
| `TST-SYS-030` | Kiểm thử Khôi phục Thông tin Xác thực & Vòng đời Phiên | HR cấp lại mật khẩu tạm cho nhân viên quên mật khẩu; nhân viên đặt lại PIN; kiểm tra đăng xuất và thu hồi refresh token khi đổi mật khẩu hoặc vô hiệu hóa tài khoản. | `FR-SYS-022`, `FR-SYS-023`, `SRS-006` | `BLD-SYS-006` | Mật khẩu tạm cũ hết hiệu lực và mọi phiên cũ bị thu hồi ngay; refresh token đã thu hồi trả HTTP 401; thao tác cấp lại mật khẩu ghi audit. | Planned |
| `TST-SYS-031` | Kiểm thử Chốt Kỳ công & Khoá Điều chỉnh | HR chốt kỳ công tháng; thử nộp/duyệt đơn và điều chỉnh công thuộc kỳ đã chốt; ADMIN mở lại kèm lý do. | `FR-SYS-024`, `SRS-010` | `BLD-SYS-006` | Mọi điều chỉnh công và đơn giải trình thuộc kỳ `LOCKED` trả HTTP 409; mở lại yêu cầu lý do, ghi audit và cho phép điều chỉnh trở lại. | Planned |
| `TST-SYS-032` | Kiểm thử Rút Consent & Quyền Chủ thể Dữ liệu | Nhân viên rút Informed Consent; kiểm tra vô hiệu hóa điểm danh khuôn mặt, hạn tiêu hủy 7 ngày, vết bất biến và phản hồi yêu cầu dữ liệu cá nhân qua DPO. | `FR-SYS-025`, `SRS-003` | `BLD-SYS-006` | Sau khi rút Consent, điểm danh khuôn mặt bị từ chối và chỉ còn PIN; dữ liệu sinh trắc bị tiêu hủy trong 7 ngày theo Nghị định 356/2025/NĐ-CP kèm audit log. | Planned |
| `TST-SYS-033` | Kiểm thử Vòng đời Quyền, Thông báo & Trợ năng Web (WCAG 2.2 AA) | ADMIN gán/thu hồi role; kiểm tra chặn hạ cấp tài khoản ADMIN cuối cùng; kiểm tra thông báo trong ứng dụng; kiểm chuẩn trợ năng WCAG 2.2 AA trên toàn bộ các trang chính. | `FR-SYS-026`, `FR-SYS-027`, `FR-SYS-028`, `NFR-SYS-010` | `BLD-SYS-006` | Thay đổi role ghi audit; thu hồi role ADMIN cuối cùng trả HTTP 409; 0 vi phạm Critical/Serious trên Axe Core; 100% phần tử điều hướng được qua bàn phím và tỷ lệ tương phản $\ge 4.5:1$. | Planned |
| `TST-SYS-034` | Kiểm thử Quét Đĩa Xác nhận Không Lưu Ảnh Thô (Zero Raw Image Retention) | Quét tự động toàn bộ phân vùng đĩa cứng máy trạm Kiosk và container Backend sau chuỗi 1,000 lượt chấm công thử nghiệm. | `SRS-004`, `SRS-001`, `NFR-SYS-007` | `BLD-SYS-001`, `BLD-SYS-006` | Phát hiện 0 tệp định dạng `.jpg`, `.png`, `.bmp` hay thư mục ảnh tạm trên đĩa; xác nhận 100% hình ảnh chỉ tồn tại dưới dạng tensor trong RAM và được giải phóng tức thời. | Planned |

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
