---
title: Kiosk App Subsystem Test Plan
version: 2.0
status: Approved
owner: Edge Vision QA Lead & UI QA Lead
type: plan
scope: KSK
updated: 2026-10-08
---

# TEST PLAN — Kế hoạch Kiểm thử Tổng thể Phân hệ Kiosk

## 1. Approach & Frameworks (Công cụ & Phương pháp Kiểm thử)

* **Framework**: `pytest`, `pytest-qt`, `pytest-cov`, `pytest-httpx`.
* **Môi trường giả lập**: Khung hình camera tĩnh (Synthetic Frames), video ghi sẵn phục vụ CI/CD tự động, Mock STOMP Broker và giả lập phản hồi HTTP.
* **Tiêu chuẩn hoàn thành**: 100% ca kiểm thử pass; độ bao phủ dòng lệnh gói cốt lõi $\ge 80\%$.

---

## 2. Core Vision & Inference Test Items (Ca Kiểm thử Chuỗi Thị giác & Logic Cốt lõi)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-013` | Khởi tạo Camera DirectShow & Đo FPS | Kiểm tra đọc khung hình ổn định qua DirectShow với tốc độ $\ge 15\text{ FPS}$. | `FR-KSK-001`, `NFR-KSK-002` | `BLD-KSK-012` | Đọc khung hình ổn định; đạt tốc độ $\ge 15\text{ FPS}$ liên tục trong 30 phút. | Done |
| `TST-KSK-014` | Phát hiện Khuôn mặt YuNet & Đo Góc Euler | Kiểm tra phát hiện khuôn mặt kích thước $\ge 120\times 120\text{ px}$ và lọc góc Euler. | `FR-KSK-001` | `BLD-KSK-013` | Định vị đúng mặt $\ge 120\times 120\text{ px}$; từ chối mặt nghiêng $> 15^\circ$. | Done |
| `TST-KSK-015` | Cổng Căn chỉnh Oval & Giữ Ổn định | Kiểm tra điều kiện lọt khung Oval và ổn định thời gian $0.5 - 1.0\text{ s}$. | `FR-KSK-001`, `UI-KSK-001` | `BLD-KSK-014` | Chỉ kích hoạt nhận diện khi mặt nằm gọn trong Oval và giữ ổn định đúng thời gian. | Done |
| `TST-KSK-016` | Chặn Ảnh In 2D Giả mạo (Print Attack) | Kiểm tra MiniFASNet phát hiện và chặn ảnh chụp in giấy màu A4. | `FR-KSK-002` | `BLD-KSK-015` | Chặn ảnh in màu chân dung giấy A4; điểm $S < 0.85$, viền đỏ cảnh báo. | Done |
| `TST-KSK-017` | Chặn Video Màn hình Điện thoại (Replay Attack) | Kiểm tra MiniFASNet phát hiện và chặn video phát lại trên smartphone/tablet. | `FR-KSK-002` | `BLD-KSK-015` | Chặn video phát lại trên thiết bị di động với độ chính xác $\ge 98\%$. | Done |
| `TST-KSK-018` | Trích xuất ArcFace & Nhân Ma trận Cosine RAM | Kiểm tra trích xuất vector 512D chuẩn hóa L2 và so khớp ma trận RAM 1,000 NV. | `FR-KSK-003`, `NFR-KSK-001` | `BLD-KSK-016` | Vector 512D chuẩn hóa L2; so khớp ma trận 1,000 nhân sự hoàn tất $< 2\text{ ms}$. | Done |
| `TST-KSK-019` | Bộ Đệm Cooldown 120s Chống Quét Dồn dập | Kiểm tra cơ chế chặn quẹt liên tiếp trong 120s của cùng một nhân viên. | `FR-KSK-005` | `BLD-KSK-003` | Quẹt liên tiếp trong 120s bị từ chối; hiển thị thông báo "Đã ghi nhận". | Done |
| `TST-KSK-020` | Hàng đợi Ngoại tuyến SQLite WAL khi Mất mạng | Kiểm tra lưu trữ đệm an toàn vào `offline_punches` khi không có kết nối mạng. | `FR-KSK-006`, `NFR-KSK-003` | `BLD-KSK-017` | Mất mạng ghi bản ghi vào `offline_punches`; tắt máy cưỡng bức không hỏng CSDL. | Done |
| `TST-KSK-021` | Kiểm thử Tự Phục hồi Camera khi Mất Tín hiệu | Kiểm tra vòng lặp tự động kết nối lại camera DirectShow khi bị rút cáp. | `NFR-KSK-005` | `BLD-KSK-012` | Rút camera đột ngột; ứng dụng kích hoạt vòng lặp kết nối lại mỗi 3s không crash. | Done |
| `TST-KSK-022` | Kiểm thử Thẩm định PIN Dự phòng qua Backend | Kiểm tra luồng nhập PIN 6 số gọi `POST /api/v1/kiosks/{id}/verify-pin` và việc chỉ ghi nhận điểm danh khi Backend trả 200. | `FR-KSK-004` | `BLD-KSK-019` | PIN đúng (200) tạo đúng một bản ghi điểm danh; PIN sai (401 `PIN_INVALID`) không tạo bản ghi; khi bị khoá (423 `PIN_LOCKED`) hiển thị đếm ngược theo `lockedUntil`; nhân sự đã rút Consent chỉ điểm danh được bằng PIN; kiosk không so khớp PIN tại chỗ. | Planned |
| `TST-KSK-023` | Kiểm thử Vòng đời Bộ nhớ Khung hình 8 giờ | Chạy ngâm tải 8 giờ liên tục với camera và pipeline suy luận; theo dõi mức tiêu thụ RAM. | `NFR-KSK-004` | `BLD-KSK-019` | Biến thiên RAM $\le 10\%$ sau 8 giờ; không rò rỉ mảng `np.ndarray` khung hình/ảnh crop; cảnh báo xuất hiện khi vượt ngưỡng cấu hình. | Planned |

---

## 3. Local Data Test Items (Ca Kiểm thử Dữ liệu Cục bộ Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-001` | Kiểm thử Khởi tạo & Cấu hình PRAGMA WAL | Kiểm tra khởi tạo file CSDL và cấu hình nhật ký ghi trước. | `DTD-KSK-001` | `BLD-KSK-001` | `PRAGMA journal_mode` trả về `wal`; sinh các file `.wal` và `.shm` phụ trợ chính xác. | Done |
| `TST-KSK-002` | Kiểm thử Ghi Hàng đợi Ngoại tuyến & Đọc Lô 50 | Kiểm tra ghi đệm và bốc lô 50 bản ghi tuần tự khi mất mạng. | `DATA-KSK-001`, `DATA-KSK-006` | `BLD-KSK-002` | Ghi đệm bản ghi hoàn tất $< 5\text{ ms}$; lấy danh sách chưa đồng bộ trả về tối đa 50 bản ghi. | Done |
| `TST-KSK-003` | Kiểm thử Tốc độ So khớp Ma trận RAM NumPy | Kiểm tra phép nhân ma trận Cosine Similarity 1,000 nhân sự và nạp phục hồi từ snapshot. | `DATA-KSK-002`, `DTD-KSK-002`, `DATA-KSK-007` | `BLD-KSK-003` | Ma trận $1,000 \times 512$ thực hiện nhân vector hoàn tất $< 2\text{ ms}$; trả về đúng top 1 similarity; nạp phục hồi snapshot thành công. | Done |
| `TST-KSK-004` | Kiểm thử Nạp Nóng Vector (Atomic Swap) | Kiểm tra cập nhật vector mới vào RAM mà không làm giật luồng camera. | `DATA-KSK-002`, `DTD-KSK-002` | `BLD-KSK-003` | Cập nhật ma trận vector mới trong RAM trong khi luồng đọc camera đang chạy không gây crash hoặc giật lag. | Done |
| `TST-KSK-024` | Kiểm thử Cấu hình Vận hành Trạm & Bộ đệm Cooldown Biên | Nạp `KioskConfig` từ `.env` và kiểm tra bộ đệm cooldown biên 120s cùng cơ chế dọn mục sau 300s. | `DATA-KSK-003`, `DATA-KSK-004` | `BLD-KSK-019` | Nạp đúng `KIOSK_ID`, `BACKEND_URL`, `CAMERA_DEVICE_INDEX` và các ngưỡng AI; thiếu biến bắt buộc thì khởi động thất bại kèm thông báo rõ; Secret Token không xuất hiện trong log; cooldown chặn đúng 120s và tự dọn sau 300s. | Planned |
| `TST-KSK-025` | Kiểm thử Không Lưu Ảnh Thô tại Biên | Theo dõi thư mục làm việc và bộ nhớ trong suốt chu kỳ suy luận để xác nhận không có ảnh nào được ghi đĩa. | `DATA-KSK-005` | `BLD-KSK-019` | Không tạo bất kỳ tệp ảnh nào trên đĩa; mọi `np.ndarray` khung hình/ảnh crop được giải phóng trong cùng chu kỳ (< 350 ms). | Planned |

---

## 4. API & Network Test Items (Ca Kiểm thử Giao tiếp Mạng Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-009` | Gửi Điểm danh Trực tiếp & Header Xác thực | Kiểm tra gọi `POST /kiosk/punch` có đủ header `X-Kiosk-Id` và Bearer token; kiểm thử xác thực PIN trực tuyến `verify-pin` và heartbeat định kỳ `heartbeat`. | `API-KSK-001`, `APD-KSK-001`, `API-KSK-007`, `API-KSK-008` | `BLD-KSK-009` | Gửi request có đủ header; nhận phản hồi 200 trong $\le 500\text{ ms}$; thẩm định mã PIN hợp lệ hoặc bắt lỗi 401/423 chính xác; heartbeat phản hồi cập nhật `last_ping_at`. | Done |
| `TST-KSK-010` | Chuyển tiếp Ngoại tuyến khi Lỗi Mạng | Kiểm tra tự động ghi SQLite khi ngắt mạng hoặc timeout 3.0s. | `API-KSK-001`, `FR-KSK-006` | `BLD-KSK-009` | Client tự động bắt lỗi timeout 3s, ghi vào `offline_punches` và báo thành công cục bộ. | Done |
| `TST-KSK-011` | Đồng bộ Bù Gói Lô (Offline Sync Worker) | Kiểm tra worker ngầm 10s bốc lô 50 bản ghi gửi `sync-batch`. | `API-KSK-002`, `APD-KSK-003` | `BLD-KSK-011` | Khôi phục mạng; worker tự động gom lô 50 bản ghi gửi `sync-batch` và cập nhật `is_synced = 1`. | Done |
| `TST-KSK-012` | Lắng nghe STOMP & Nạp Nóng Vector | Kiểm tra subscribe `/topic/kiosk-gallery` và Atomic Swap RAM. | `API-KSK-006`, `APD-KSK-002` | `BLD-KSK-010` | Nhận bản tin STOMP thêm nhân viên; ma trận RAM cập nhật vector mới ngay tức thì. | Done |

---

## 5. UI/UX Test Items (Ca Kiểm thử Giao diện & Trải nghiệm Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-005` | Kiểm thử Máy trạng thái Khung Oval 4 Màu | Kiểm tra chuyển đổi 4 trạng thái thị giác: Standby $\rightarrow$ Aligning $\rightarrow$ Success $\rightarrow$ Rejected. | `UI-KSK-001`, `UXD-KSK-001` | `BLD-KSK-006` | Chuyển đổi chính xác 4 màu; hiệu ứng Pulse Scan và Shake hoạt động trơn tru. | Done |
| `TST-KSK-006` | Kiểm thử Co giãn Tỷ lệ Động $S$ (Scaling Test) | Kiểm tra công thức $S = \min(W/1080, H/1920)$ trên các độ phân giải HD, Full HD và 4K. | `UXD-KSK-005`, `UI-KSK-008` | `BLD-KSK-005` | Tỷ lệ 9:16 giữ nguyên không bị méo; phông chữ co giãn mượt mà; không tràn viền. | Done |
| `TST-KSK-007` | Kiểm thử Bàn phím Ảo PIN Pad & Khóa 15 Phút | Kiểm tra tương tác bàn phím số cảm ứng $88\times 88\text{ px}$ và cơ chế khóa 15 phút. | `UI-KSK-002`, `UXD-KSK-003` | `BLD-KSK-008` | Bấm số phản hồi âm thanh; nhập sai 5 lần hiện đếm ngược khóa 15 phút, vô hiệu hóa phím bấm. | Done |
| `TST-KSK-008` | Kiểm thử Luồng Tự Đăng ký In-Viewport | Kiểm tra quy trình 3 bước tự ẩn dialog nhường trọn camera chính ở Bước 2. | `UI-KSK-003`, `UXD-KSK-004` | `BLD-KSK-008` | Nhập OTP hợp lệ $\rightarrow$ Dialog tự ẩn để lộ camera chính $\rightarrow$ Chụp 3 ảnh chuẩn $\rightarrow$ Hiện lại dialog thành công. | Done |

---

## 6. Defect Management & Severity (Quản lý Lỗi Phân hệ)

* **Blocker (P0)**: Mất mát giao dịch điểm danh ngoại tuyến, rò rỉ hình ảnh thô ra đĩa cứng, sập ứng dụng khi camera đứt kết nối.
* **Critical (P1)**: Xung đột khóa SQLite `database is locked`, vỡ bố cục giao diện khi co giãn độ phân giải, treo máy trạng thái Oval.
* **Major (P2)**: Quá thời gian phản hồi nhận diện (> 1.0s end-to-end), rò rỉ RAM nhỏ (< 15% sau 8 giờ).
