---
title: Kiosk Core Test Plan
version: 1.0
status: Approved
owner: Edge Vision QA Lead
---

# FR/NFR TEST PLAN — Kế hoạch Kiểm thử Nội bộ Phân hệ Kiosk

## 1. Approach & Frameworks (Công cụ & Phương pháp Kiểm thử)

* **Framework**: `pytest`, `pytest-qt`, `pytest-cov`.
* **Môi trường giả lập**: Khung hình camera tĩnh (Synthetic Frames) và video ghi sẵn phục vụ chạy tự động trong CI/CD.
* **Tiêu chuẩn hoàn thành**: 100% ca kiểm thử pass; độ bao phủ dòng lệnh gói cốt lõi $\ge 80\%$.

---

## 2. Core Test Items (Danh mục Ca Kiểm thử Kiosk)

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
| `TST-KSK-022` | Kiểm thử Thẩm định PIN Dự phòng qua Backend | Kiểm tra luồng nhập PIN 6 số gọi `POST /api/v1/kiosk/verify-pin` và việc chỉ ghi nhận điểm danh khi Backend trả 200. | `FR-KSK-004` | `BLD-KSK-019` | PIN đúng (200) tạo đúng một bản ghi điểm danh; PIN sai (401 `PIN_INVALID`) **không** tạo bản ghi; khi bị khoá (423 `PIN_LOCKED`) hiển thị đếm ngược theo `lockedUntil`; nhân sự đã rút Consent chỉ điểm danh được bằng PIN; kiosk không so khớp PIN tại chỗ. | Planned |
| `TST-KSK-023` | Kiểm thử Vòng đời Bộ nhớ Khung hình 8 giờ | Chạy ngâm tải 8 giờ liên tục với camera và pipeline suy luận; theo dõi mức tiêu thụ RAM. | `NFR-KSK-004` | `BLD-KSK-019` | Biến thiên RAM $\le 10\%$ sau 8 giờ; không rò rỉ mảng `np.ndarray` khung hình/ảnh crop; cảnh báo xuất hiện khi vượt ngưỡng cấu hình. | Planned |

---
title: Kiosk Local Data Test Plan
version: 1.0
status: Approved
owner: Edge Vision QA Lead
---

# DATA TEST PLAN — Kế hoạch Kiểm thử Dữ liệu Cục bộ Kiosk

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ hệ thống lưu trữ dữ liệu tại biên của Kiosk gồm CSDL cục bộ SQLite WAL (`kiosk_local.db`), ma trận bộ nhớ RAM NumPy và cơ chế Atomic Swap khi nạp nóng vector.
* **Mục tiêu**:
  * Đảm bảo không xảy ra khóa tranh chấp (Zero Lock Contention) giữa luồng ghi điểm danh và luồng đọc đồng bộ ngầm.
  * Xác nhận ma trận RAM 1,000 nhân sự so khớp Cosine Similarity $< 2\text{ms}$.
  * Kiểm chứng tính bền vững dữ liệu ngoại tuyến ($\text{RPO} = 0$) kể cả khi ứng dụng bị tắt cưỡng bức.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Dữ liệu Kiosk)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-005` | Kiểm thử đa tiến trình đồng thời (Concurrent Read/Write Testing) trên SQLite WAL. | Xác nhận cơ chế WAL cho phép luồng nhận diện ghi điểm danh ngay cả khi worker đồng bộ đang đọc dữ liệu đệm. | `DTD-KSK-001`, `STK-005` | Accepted |
| `APC-KSK-006` | Đo lường hiệu năng vector hóa với ma trận NumPy kích thước lớn ($N = 2,000$). | Đảm bảo hệ thống vẫn giữ được tốc độ phản hồi tức thì khi quy mô doanh nghiệp tăng gấp đôi. | `DATA-KSK-002`, `NFR-KSK-001` | Accepted |

---

## 3. Data Test Items (Danh mục Ca Kiểm thử Dữ liệu Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-001` | Kiểm thử Khởi tạo & Cấu hình PRAGMA WAL | Kiểm tra khởi tạo file CSDL và cấu hình nhật ký ghi trước. | `DTD-KSK-001` | `BLD-KSK-001` | `PRAGMA journal_mode` trả về `wal`; sinh các file `.wal` và `.shm` phụ trợ chính xác. | Done |
| `TST-KSK-002` | Kiểm thử Ghi Hàng đợi Ngoại tuyến & Đọc Lô 50 | Kiểm tra ghi đệm và bốc lô 50 bản ghi tuần tự khi mất mạng. | `DATA-KSK-001`, `DATA-KSK-006` | `BLD-KSK-002` | Ghi đệm bản ghi hoàn tất $< 5\text{ ms}$; lấy danh sách chưa đồng bộ trả về tối đa 50 bản ghi. | Done |
| `TST-KSK-003` | Kiểm thử Tốc độ So khớp Ma trận RAM NumPy | Kiểm tra phép nhân ma trận Cosine Similarity 1,000 nhân sự. | `DATA-KSK-002`, `DTD-KSK-002` | `BLD-KSK-003` | Ma trận $1,000 \times 512$ thực hiện nhân vector hoàn tất $< 2\text{ ms}$; trả về đúng top 1 similarity. | Done |
| `TST-KSK-004` | Kiểm thử Nạp Nóng Vector (Atomic Swap) | Kiểm tra cập nhật vector mới vào RAM mà không làm giật luồng camera. | `DATA-KSK-002`, `DTD-KSK-002` | `BLD-KSK-003` | Cập nhật ma trận vector mới trong RAM trong khi luồng đọc camera đang chạy không gây crash hoặc giật lag. | Done |
| `TST-KSK-024` | Kiểm thử Cấu hình Vận hành Trạm & Bộ đệm Cooldown Biên | Nạp `KioskConfig` từ `.env` và kiểm tra bộ đệm cooldown biên 120s cùng cơ chế dọn mục sau 300s. | `DATA-KSK-003`, `DATA-KSK-004` | `BLD-KSK-019` | Nạp đúng `KIOSK_ID`, `BACKEND_URL`, `CAMERA_DEVICE_INDEX` và các ngưỡng AI; thiếu biến bắt buộc thì khởi động thất bại kèm thông báo rõ; Secret Token không xuất hiện trong log; cooldown chặn đúng 120s và tự dọn sau 300s. | Planned |
| `TST-KSK-025` | Kiểm thử Không Lưu Ảnh Thô tại Biên | Theo dõi thư mục làm việc và bộ nhớ trong suốt chu kỳ suy luận để xác nhận không có ảnh nào được ghi đĩa. | `DATA-KSK-005` | `BLD-KSK-019` | Không tạo bất kỳ tệp ảnh nào trên đĩa; mọi `np.ndarray` khung hình/ảnh crop được giải phóng trong cùng chu kỳ (< 350 ms). | Planned |

---

## 4. Defect Management (Quản lý Lỗi Dữ liệu Biên)

* Lỗi xung đột khóa đĩa `sqlite3.OperationalError: database is locked` được xếp mức **Critical (P1)** và bắt buộc kiểm tra lại cấu hình timeout 5.0s và WAL journal.

---
title: Kiosk API Test Plan
version: 1.0
status: Approved
owner: Edge Vision QA Lead
---

# API TEST PLAN — Kế hoạch Kiểm thử Tầng Mạng Phân hệ Kiosk

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ các giao tiếp mạng giữa ứng dụng Kiosk Desktop với Backend thông qua HTTP REST Client (`httpx`) và WebSocket STOMP Subscriber (`stomp.py`).
* **Mục tiêu**:
  * Đảm bảo cơ chế tự động chuyển tiếp ngoại tuyến (Offline Fallback) kích hoạt chính xác khi mất kết nối mạng.
  * Xác nhận luồng đồng bộ ngầm định kỳ 10s gom lô tối đa 50 bản ghi gửi bù thành công 100%.
  * Kiểm chứng việc tiếp nhận bản tin STOMP `/topic/kiosk-gallery` và nạp nóng vector vào RAM không làm gián đoạn luồng camera.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Mạng Kiosk)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-009` | Giả lập máy chủ Backend bằng `pytest-httpx` và Mock STOMP Broker. | Cho phép chạy kiểm thử tự động cô lập trong CI mà không phụ thuộc hạ tầng mạng thật. | `STK-007`, `API-KSK-001` | Accepted |
| `APC-KSK-010` | Kiểm thử tiêm lỗi ngắt kết nối mạng (Network Chaos Testing). | Xác thực tính ổn định của vòng lặp kết nối lại (Exponential Backoff) và lưu đệm dữ liệu. | `NFR-KSK-003`, `RSK-001` | Accepted |

---

## 3. API Test Items (Danh mục Ca Kiểm thử Mạng Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-009` | Gửi Điểm danh Trực tiếp & Header Xác thực | Kiểm tra gọi `POST /kiosk/punch` có đủ header `X-Kiosk-Id` và Bearer token. | `API-KSK-001`, `APD-KSK-001` | `BLD-KSK-009` | Gửi request có đủ header; nhận phản hồi 200 trong $\le 500\text{ ms}$. | Done |
| `TST-KSK-010` | Chuyển tiếp Ngoại tuyến khi Lỗi Mạng | Kiểm tra tự động ghi SQLite khi ngắt mạng hoặc timeout 3.0s. | `API-KSK-001`, `FR-KSK-006` | `BLD-KSK-009` | Client tự động bắt lỗi timeout 3s, ghi vào `offline_punches` và báo thành công cục bộ. | Done |
| `TST-KSK-011` | Đồng bộ Bù Gói Lô (Offline Sync Worker) | Kiểm tra worker ngầm 10s bốc lô 50 bản ghi gửi `sync-batch`. | `API-KSK-002`, `APD-KSK-003` | `BLD-KSK-011` | Khôi phục mạng; worker tự động gom lô 50 bản ghi gửi `sync-batch` và cập nhật `is_synced = 1`. | Done |
| `TST-KSK-012` | Lắng nghe STOMP & Nạp Nóng Vector | Kiểm tra subscribe `/topic/kiosk-gallery` và Atomic Swap RAM. | `API-KSK-006`, `APD-KSK-002` | `BLD-KSK-010` | Nhận bản tin STOMP thêm nhân viên; ma trận RAM cập nhật vector mới ngay tức thì. | Done |

---

## 4. Defect Management (Quản lý Lỗi Giao tiếp Mạng)

* Sự cố mất gói tin điểm danh không lưu đệm được xếp loại **Blocker (P0)** và cần được kiểm tra với cơ chế khóa SQLite WAL.

---
title: Kiosk UI/UX Test Plan
version: 1.0
status: Approved
owner: Product Designer & QA Lead
---

# UI/UX TEST PLAN — Kế hoạch Kiểm thử Giao diện & Trải nghiệm Phân hệ Kiosk

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ các thành phần giao diện người dùng PySide6/QML, tỷ lệ co giãn $S$ trên màn hình dọc 9:16, máy trạng thái viền Oval, bàn phím số ảo PIN Pad và các modal tự phục vụ.
* **Mục tiêu**:
  * Đảm bảo thời gian phản hồi giao diện tức thì $\le 50\text{ms}$ khi máy trạng thái chuyển đổi.
  * Xác thực kích thước vùng chạm phím bấm tối thiểu $60 \times 60\text{px}$ thuận tiện thao tác một chạm trên màn hình cảm ứng.
  * Kiểm chứng luồng tự đăng ký khuôn mặt 3 bước tự ẩn/hiện popup theo đúng tài liệu thiết kế Figma.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Giao diện)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-007` | Sử dụng `pytest-qt` kiểm thử tự động tương tác chạm và tín hiệu QML. | Mô phỏng chính xác sự kiện chạm màn hình, gõ phím ảo và kiểm tra trạng thái hiển thị của các thành phần đồ họa. | `STK-003`, `UI-KSK-001` | Accepted |
| `APC-KSK-008` | Kiểm định hiển thị trực quan đa độ phân giải (Visual Regression: 720x1280, 1080x1920, 2160x3840). | Bảo đảm công thức tỷ lệ co giãn $S = \min(W/1080, H/1920)$ không làm biến dạng hình học vector và phông chữ. | `UXD-KSK-005`, `NFR-KSK-002` | Accepted |

---

## 3. UI/UX Test Items (Danh mục Ca Kiểm thử Giao diện Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-005` | Kiểm thử Máy trạng thái Khung Oval 4 Màu | Kiểm tra chuyển đổi 4 trạng thái thị giác: Standby $\rightarrow$ Aligning $\rightarrow$ Success $\rightarrow$ Rejected. | `UI-KSK-001`, `UXD-KSK-001` | `BLD-KSK-006` | Chuyển đổi chính xác 4 màu; hiệu ứng Pulse Scan và Shake hoạt động trơn tru. | Done |
| `TST-KSK-006` | Kiểm thử Co giãn Tỷ lệ Động $S$ (Scaling Test) | Kiểm tra công thức $S = \min(W/1080, H/1920)$ trên các độ phân giải HD, Full HD và 4K. | `UXD-KSK-005`, `UI-KSK-008` | `BLD-KSK-005` | Tỷ lệ 9:16 giữ nguyên không bị méo; phông chữ co giãn mượt mà; không tràn viền. | Done |
| `TST-KSK-007` | Kiểm thử Bàn phím Ảo PIN Pad & Khóa 15 Phút | Kiểm tra tương tác bàn phím số cảm ứng $88\times 88\text{ px}$ và cơ chế khóa 15 phút. | `UI-KSK-002`, `UXD-KSK-003` | `BLD-KSK-008` | Bấm số phản hồi âm thanh; nhập sai 5 lần hiện đếm ngược khóa 15 phút, vô hiệu hóa phím bấm. | Done |
| `TST-KSK-008` | Kiểm thử Luồng Tự Đăng ký In-Viewport | Kiểm tra quy trình 3 bước tự ẩn dialog nhường trọn camera chính ở Bước 2. | `UI-KSK-003`, `UXD-KSK-004` | `BLD-KSK-008` | Nhập OTP hợp lệ $\rightarrow$ Dialog tự ẩn để lộ camera chính $\rightarrow$ Chụp 3 ảnh chuẩn $\rightarrow$ Hiện lại dialog thành công. | Done |

---

## 4. Defect Management (Quản lý Lỗi Giao diện Kiosk)

* Lỗi làm vỡ giao diện (Layout Broken) hoặc kẹt máy trạng thái Oval (Freeze State) được xếp mức **Critical (P1)** và phải khắc phục ngay lập tức.
