---
title: Kiosk App Service Build Plan
version: 1.0
status: Approved
owner: Edge Vision Lead & UI Lead
---

# BUILD PLAN — Kế hoạch Xây dựng & Tích hợp Tổng thể Phân hệ Kiosk


## 1. Approach (Chiến lược Thực hiện)

Phân hệ `kiosk-app` áp dụng chiến lược gom nhóm và sắp xếp thứ tự thực thi theo mô hình **Slices to Integration** qua các đợt phát hành (Waves), tuân thủ Mục 9.4 của [docs/sdlc-docs.md](../../sdlc-docs.md).
* **Nguyên tắc Điều phối**: Hoàn thiện nền tảng phần cứng/môi trường (Foundation) và cơ chế lưu trữ đệm ngoại tuyến (Data Facet) trước. Sau đó phát triển song song chuỗi thị giác AI (FR/NFR Facet) và hệ thống giao diện cảm ứng QML (UI/UX Facet). Tiếp theo ghép nối tầng giao tiếp mạng (API Facet) và cuối cùng tích hợp toàn trình luồng chấm công tại biên (Integration).
* **Định nghĩa Hoàn thành Cấp Phân hệ (Definition of Done - DoD)**:
  * Mọi work item (`BLD-`, `FND-`) được chuẩn hóa thành 1 Task độc lập, hoàn thành trọn vẹn trong một Pull Request.
  * Tốc độ suy luận thị giác $\le 70\text{ ms}$, tốc độ đọc camera ổn định $\ge 15\text{ FPS}$.
  * Giao diện QML co giãn động mượt mà, phản hồi chạm $< 50\text{ ms}$, không rò rỉ bộ nhớ sau 8 giờ chạy ngâm tải.
  * Đạt tiêu chí nghiệm thu (`Done when`) kiểm chứng được và vượt qua toàn bộ ca kiểm thử trước khi sáp nhập vào nhánh `develop`.

---

## 2. Build Order (Thứ tự Xây dựng & Điều phối Xuyên Facet)

Bảng điều phối gom nhóm toàn bộ các work item từ các facet build plan (`foundation-setup-plan.md`, `data-build-plan.md`, `fr-nfr-build-plan.md`, `api-build-plan.md`, `ui-ux-build-plan.md`) thành các Wave có thứ tự thực thi tuần tự:

| Wave | Includes | Depends on | Done when |
| :--- | :--- | :--- | :--- |
| **Wave 1: Foundation Setup** | `FND-KSK-001`, `FND-KSK-002`, `FND-KSK-003`, `FND-KSK-004`, `FND-KSK-005` | — | Môi trường ảo Python, thư viện PySide6/OpenCV, kiểm định mã băm 3 mô hình ONNX và driver camera DirectShow hoạt động ổn định. |
| **Wave 2: Local Data Persistence** | `BLD-KSK-001`, `BLD-KSK-002`, `BLD-KSK-003` | Wave 1 | CSDL SQLite WAL cục bộ khởi tạo chuẩn; hàng đợi ngoại tuyến và ma trận NumPy RAM 1,000 vector so khớp $< 2\text{ ms}$. |
| **Wave 3: Vision Pipeline & UI Tokens** | `BLD-KSK-004`, `BLD-KSK-005`, `BLD-KSK-012`, `BLD-KSK-013`, `BLD-KSK-014`, `BLD-KSK-015`, `BLD-KSK-016` | Wave 2 | Camera worker đọc khung hình mượt mà; YuNet, Oval gate, Liveness, ArcFace trích xuất vector chuẩn; QML tokens và bố cục 9:16 sẵn sàng. |
| **Wave 4: UI Interaction & Offline Buffer**| `BLD-KSK-006`, `BLD-KSK-007`, `BLD-KSK-008`, `BLD-KSK-017` | Wave 3 | Khung Oval 4 màu đổi trạng thái nhạy bén; thẻ kết quả kính mờ phát âm thanh; 3 modal (PIN, Đăng ký, Trợ giúp) tích hợp hoàn tất. |
| **Wave 5: Network Communication & Sync** | `BLD-KSK-009`, `BLD-KSK-010`, `BLD-KSK-011` | Wave 4 | HTTP client httpx gửi punch/batch mượt mà; STOMP worker nhận nạp nóng vector mới; Offline sync worker đẩy bù tự động khi có mạng. |
| **Wave 6: Edge Full Integration** | `BLD-KSK-018` | Wave 5 | Luồng toàn trình từ Camera $\rightarrow$ AI $\rightarrow$ SQLite $\rightarrow$ QML $\rightarrow$ API vận hành trơn tru; tổng thời gian nhận diện $\le 100\text{ ms}$. |

---

## 3. Work Items (Hạng mục Tích hợp Phân hệ)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `BLD-KSK-018` | Tích hợp Toàn trình Luồng Điểm danh Biên | Ghép nối luồng video camera, máy trạng thái Oval QML, pipeline suy luận AI (YuNet + MiniFASNet + ArcFace), ghi đệm SQLite WAL và đồng bộ HTTP/STOMP. | `ARC-001`, `SOL-KSK-001`, `UXD-KSK-001`, `APD-KSK-001`, `DTD-KSK-001` | `BLD-KSK-008`, `BLD-KSK-011` | Điểm danh thành công hiển thị thẻ kết quả xanh trong $< 100\text{ ms}$; tự động lưu SQLite khi mất mạng và đồng bộ bù khi có mạng. | Planned |

---
title: Kiosk Core Build Plan
version: 1.0
status: Approved
owner: Edge Vision Lead
---

# FR/NFR BUILD PLAN — Kế hoạch Thi công Cốt lõi Phân hệ Kiosk


## 1. Approach & Sequencing (Chiến lược Thi công)

Xây dựng các module xử lý độc lập và tích hợp theo chuỗi tín hiệu bất đồng bộ:
$$\text{Camera Ingestion} \rightarrow \text{YuNet \& Oval Gate} \rightarrow \text{Liveness Gate} \rightarrow \text{ArcFace Extractor} \rightarrow \text{RAM Matcher} \rightarrow \text{SQLite WAL Queue}$$

---

## 2. Core Build Work Items (Danh mục Hạng mục Thi công Cốt lõi)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-KSK-012` | Lập trình Luồng Đọc Camera | Xây dựng worker đọc khung hình qua OpenCV DirectShow, phát tín hiệu `frame_ready(frame)` tốc độ $\ge 15\text{ FPS}$. | `SOL-KSK-001` | `FND-KSK-004` | Đọc video ổn định; tự kết nối lại sau 3s khi mất camera. | Done |
| `BLD-KSK-013` | Tích hợp Bộ Phát hiện Mặt YuNet | Nạp mô hình ONNX YuNet, phát hiện mặt $\ge 120\text{ px}$, tính góc quay Euler và 5 điểm mốc. | `SOL-KSK-002` | `BLD-KSK-012` | Trả về bounding box chính xác; lọc mặt nghiêng $> 15^\circ$. | Done |
| `BLD-KSK-014` | Lập trình Cổng Căn chỉnh Oval | Xây dựng bộ kiểm chuẩn hình học và độ ổn định thời gian $0.5 - 1.0\text{ s}$ trước khi kích hoạt nhận diện. | `SOL-KSK-003` | `BLD-KSK-013` | Giữ ổn định đúng thời gian mới mở cổng; phát thông điệp điều hướng màu Vàng. | Done |
| `BLD-KSK-015` | Tích hợp Lọc Liveness MiniFASNet | Nạp mô hình ONNX MiniFASNet, crop vùng mặt 1.5x, tính xác suất $S \ge 0.85$. | `SOL-KSK-004` | `BLD-KSK-013` | Chặn ảnh in 2D và video màn hình; thời gian suy luận $\le 50\text{ ms}$. | Done |
| `BLD-KSK-016` | Tích hợp Trích xuất ArcFace & RAM Matcher | Căn chỉnh Affine $112\times 112\text{ px}$, trích xuất vector 512D chuẩn hóa L2, nhân ma trận Cosine qua NumPy. | `SOL-KSK-005`, `SOL-KSK-006` | `BLD-KSK-015` | So khớp ma trận 1,000 nhân sự $< 2\text{ ms}$; ngưỡng Cosine $\ge 0.50$. | Done |
| `BLD-KSK-019` | Lập trình Thẩm định PIN Dự phòng, Vòng đời Bộ nhớ & Cấu hình Trạm | Xây dựng luồng gọi `verify-pin` và ánh xạ lỗi PIN (401/423) sang UI, bộ quản lý cấp phát/giải phóng mảng khung hình, vòng lặp tự phục hồi camera và `KioskConfig` nạp từ `.env`. Phụ thuộc client HTTP thuộc facet `api` được giải quyết tại `TASK-KSK-028` (Mục 13.2). | `SOL-KSK-007`, `SOL-KSK-008`, `SOL-KSK-009`, `DTD-KSK-005` | `FND-KSK-002` | PIN chỉ được chấp nhận khi Backend trả 200 và không tạo bản ghi khi thất bại; RAM biến thiên $\le 10\%$ sau 8 giờ; camera tự phục hồi $\le 3\text{ s}$; thiếu biến cấu hình bắt buộc thì khởi động thất bại kèm thông báo rõ. | Planned |
| `BLD-KSK-017` | Lập trình Hàng đợi SQLite WAL | Quản lý CSDL `kiosk_local.db` chế độ WAL, hàm `enqueue_punch()`, `fetch_unsynced_batch()`, `mark_synced()`. | `SOL-KSK-008` | `FND-KSK-005` | Ghi đệm an toàn khi mất mạng; đọc non-blocking song song. | Done |

---
title: Kiosk Local Data Build Plan
version: 2.0
status: Approved
owner: Edge Vision Lead
---

# DATA BUILD PLAN — Kế hoạch Thi công Tầng Dữ liệu Cục bộ Kiosk


## 1. Approach & Sequencing (Chiến lược Thi công Dữ liệu Cục bộ)

$$\text{SQLite WAL Database Setup} \rightarrow \text{Offline Queue Operations} \rightarrow \text{NumPy RAM Matrix \& Cooldown Handler}$$

---

## 2. Data Build Work Items (Danh mục Hạng mục Thi công Dữ liệu)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-KSK-001` | Khởi tạo CSDL SQLite WAL | Tạo bảng `offline_punches`, chỉ mục `idx_offline_sync`, `idx_offline_timestamp` và áp dụng PRAGMA WAL, synchronous=NORMAL. | `DTD-KSK-001` | `FND-KSK-002` | CSDL khởi tạo tại `kiosk_local.db`; `PRAGMA journal_mode` trả về `wal`. | Done |
| `BLD-KSK-002` | Lập trình Thao tác Hàng đợi Ngoại tuyến | Xây dựng các hàm `enqueue_punch()`, `fetch_pending_batch(limit=50)`, `mark_synced(local_ids)`. | `DATA-KSK-001`, `DATA-KSK-006` | `BLD-KSK-001` | Ghi đệm giao dịch ngoại tuyến $< 5\text{ ms}$; bốc lô tối đa 50 bản ghi tuần tự. | Done |
| `BLD-KSK-003` | Lập trình Ma trận Gallery RAM & Cooldown | Xây dựng bộ quản lý ma trận NumPy $\mathbf{M} \in \mathbb{R}^{N \times 512}$, tính Cosine $\vec{s} = \mathbf{M} \cdot \vec{u}^T$, nạp nóng Atomic Swap và Cooldown Cache 120s. | `DATA-KSK-002`, `DATA-KSK-003`, `DTD-KSK-002`, `DTD-KSK-003` | `FND-KSK-002` | Tính tích vô hướng $< 2\text{ ms}$ cho $N = 1000$; nạp nóng vector mới vào RAM mà không làm giật khung hình camera. | Done |

---
title: Kiosk API Build Plan
version: 2.0
status: Approved
owner: Edge Vision Lead
---

# API BUILD PLAN — Kế hoạch Thi công Tầng Mạng Phân hệ Kiosk


## 1. Approach & Sequencing (Chiến lược Thi công Tầng Mạng)

$$\text{HTTP Client Wrapper (httpx)} \rightarrow \text{STOMP Subscriber Worker (stomp.py)} \rightarrow \text{Offline Sync Worker (SQLite WAL)}$$

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công Tầng Mạng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-KSK-009` | Lập trình HTTP Client Wrapper | Xây dựng module đóng gói `httpx.Client` với các phương thức `send_punch()`, `sync_batch()`, `fetch_gallery()`, `verify_otp()`, `enroll_face()`, tự động tiêm header xác thực. | `APD-KSK-001`, `APD-KSK-004` | `FND-KSK-002` | Gọi API thành công; tự động bắt ngoại lệ timeout sau 3.0s; kích hoạt fallback ngoại tuyến khi rớt mạng. | Done |
| `BLD-KSK-010` | Lập trình STOMP Subscriber Worker | Xây dựng `KioskStompWorker (QThread)` duy trì kết nối WebSocket STOMP tới Backend, nhận bản tin `/topic/kiosk-gallery`. | `APD-KSK-002` | `BLD-KSK-009` | Tự động kết nối lại (Exponential Backoff); nạp nóng (`ADD_VECTOR`) và xóa (`DELETE_VECTOR`) trên ma trận RAM tức thời mà không lock Camera Stream. | Done |
| `BLD-KSK-011` | Lập trình Offline Sync Worker | Xây dựng luồng ngầm định kỳ 10s quét bảng `offline_punches`; gom lô tối đa 50 bản ghi gửi `POST /sync-batch` và cập nhật `is_synced = 1`. | `APD-KSK-003` | `BLD-KSK-009` | Tự động đồng bộ bù khi mạng phục hồi mà không làm nghẽn UI Event Loop. | Done |

---
title: Kiosk UI/UX Build Plan
version: 2.0
status: Approved
owner: Edge Vision Lead & UI Engineer
---

# UI/UX BUILD PLAN — Kế hoạch Thi công Giao diện Phân hệ Kiosk


## 1. Approach & Sequencing (Chiến lược Thi công Giao diện)

Xây dựng giao diện QML theo 5 giai đoạn liên tục:
$$\text{Design Tokens} \rightarrow \text{Viewport Layouts (9:16)} \rightarrow \text{Proportional Scaling} \rightarrow \text{Modals \& Dialogs} \rightarrow \text{Animation \& Sounds}$$

---

## 2. UI Build Work Items (Danh mục Hạng mục Thi công Giao diện)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-KSK-004` | Khởi tạo Design Tokens & Theme | Định nghĩa bảng màu Dark Glassmorphism, kích thước phông chữ Inter, bán kính bo góc và các biến dùng chung trong QML. | `UXD-KSK-005` | `FND-KSK-002` | Mọi thành phần QML đều sử dụng token tập trung, không dùng giá trị màu hoặc kích thước cứng. | Done |
| `BLD-KSK-005` | Xây dựng Bố cục Khung nhìn 9:16 | Lắp ráp HeaderBar ($968\times 120\text{ px}$), PortraitCameraPanel ($968\times 1496\text{ px}$) và ActionDock ($968\times 144\text{ px}$) trong khung nhìn canvas $1080\times 1920\text{ px}$. | `UXD-KSK-005` | `BLD-KSK-004` | Bố cục tỷ lệ dọc 9:16 cân đối; co giãn tỷ lệ động mượt mà từ HD 720p đến 4K qua công thức $S$. | Done |
| `BLD-KSK-006` | Lập trình Khung Oval & Pulse Scan | Vẽ khung Oval hình elip vector $470 \times 604\text{ px}$, máy trạng thái 4 màu (Standby, Aligning, Success, Rejected) và dải sóng quét Laser Pulse Scan. | `UXD-KSK-001` | `BLD-KSK-005` | Chuyển đổi màu sắc tức thì khi nhận tín hiệu từ AI; đường nét viền mượt mà không răng cưa. | Done |
| `BLD-KSK-007` | Xây dựng Thẻ Kết quả Nổi & Âm thanh | Thẻ card kết quả bo góc $20\text{ px}$, kính mờ Glassmorphism trượt lên trong $2.5\text{ s}$ kèm phát file âm thanh "Tít" ($880\text{ Hz}$) hoặc "Bíp" ($300\text{ Hz}$). | `UXD-KSK-002` | `BLD-KSK-006` | Card xuất hiện mượt mà sau khi nhận diện thành công; âm thanh phát rõ ràng đồng bộ với visual. | Done |
| `BLD-KSK-008` | Xây dựng 3 Hộp thoại Modals | Thiết kế bàn phím số ảo PIN Pad $720\times 880\text{ px}$, Modal Đăng ký 3 bước tự ẩn in-viewport $800\times 960\text{ px}$, và Modal Hướng dẫn Trợ giúp. | `UXD-KSK-003`, `UXD-KSK-004` | `BLD-KSK-006` | Phím bấm cảm ứng nhạy bén; popup tự ẩn nhường trọn camera chính ở Bước 2. | Done |
