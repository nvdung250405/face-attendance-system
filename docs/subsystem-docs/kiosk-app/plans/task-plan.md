---
title: Kiosk App Task Plan
version: 2.0
status: Approved
owner: Edge Vision Lead & UI Lead
type: plan
scope: KSK
updated: 2026-10-08
---

# TASK PLAN — Kế hoạch Thi công Chi tiết Phân hệ Kiosk App

## 1. Approach (Chiến lược Thực hiện)

Tài liệu này là lớp kế hoạch thi công giữa các đơn vị quy hoạch (`BLD-`, `FND-`) trong `foundation-setup-plan.md`, `build-plan.md` và giai đoạn viết mã, tuân thủ Mục 8.7 của [docs/sdlc-docs.md](../../../sdlc-docs.md).
* **Nguyên tắc phân rã**: Mỗi `TASK-KSK-` là một đơn vị thi công hoàn thành trọn vẹn trong một Pull Request và `Derived from` **đúng một** `BLD-`/`FND-` cùng service.
* **Giải quyết phụ thuộc**: Phụ thuộc xuyên facet (ví dụ tầng giao tiếp mạng `api` và luồng AI `spec`) được giải quyết **tại đây** thông qua `Depends on` giữa các `TASK-`, không ghi trong build plan.
* **Cơ chế Wave**: `Wave(task) = 1 + max(Wave(dep))` theo Mục 14.4 của `sdlc-docs.md`; các task trong cùng Wave độc lập và có thể thi công song song.

### Approach Decisions (Quyết định Tiếp cận Thi công Chi tiết)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-011` | Thực thi theo 7 Wave: Foundation → Lưu trữ cục bộ → Pipeline thị giác & Token UI → Giao diện & Bộ đệm → Mạng & Đồng bộ → Tương tác UI → Tích hợp biên | Phân rã 28 hạng mục `FND-`/`BLD-` của Kiosk thành 28 `TASK-` độc lập, giữ đúng thứ tự phần cứng/môi trường trước, AI và UI song song, tích hợp sau cùng. | Big-bang integration hoặc phân công tự do không theo DAG (bị loại vì khó cô lập lỗi trên thiết bị biên) | Mọi dependency xuyên facet bắt buộc giải quyết tại Task Plan; task cùng Wave có thể giao cho nhiều kỹ sư; mỗi task có `Done when` đo được. | `ARC-001`, `STK-001` | Accepted |

---

## 2. Tasks (Danh mục Nhiệm vụ Thi công)

| ID | Name | Description | Derived from | Depends on | Wave | Done when | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| `TASK-KSK-001` | Khởi tạo Môi trường Ảo Python | Tạo môi trường ảo `app/kiosk-app/.venv` với Python 3.14.x 64-bit. | `FND-KSK-001` | — | Wave 1 | `python --version` trả về 3.14.x trong môi trường ảo đã kích hoạt. | Ready |
| `TASK-KSK-002` | Cài đặt Thư viện Phụ trợ | Khóa phiên bản và cài `requirements.txt` (PySide6, OpenCV, ONNX Runtime, NumPy, httpx, stomp.py). | `FND-KSK-002` | `TASK-KSK-001` | Wave 2 | `pip install -r requirements.txt` không lỗi; import được toàn bộ thư viện cốt lõi. | Ready |
| `TASK-KSK-003` | Nạp & Kiểm định Mô hình ONNX | Đặt 3 mô hình ONNX vào `resources/assets/models/` và kiểm tra mã băm SHA-256. | `FND-KSK-003` | `TASK-KSK-002` | Wave 3 | `onnxruntime.InferenceSession` nạp thành công cả 3 mô hình với tập lệnh CPU AVX2. | Ready |
| `TASK-KSK-004` | Cấu hình Driver Camera DirectShow | Thiết lập `CAMERA_DEVICE_INDEX=0`, `cv2.CAP_DSHOW`, độ phân giải 1280x720 @ 30 FPS. | `FND-KSK-004` | `TASK-KSK-002` | Wave 3 | Đọc liên tiếp khung hình với độ trễ thu nhận < 15 ms/frame. | Ready |
| `TASK-KSK-005` | Khởi tạo SQLite WAL Cục bộ | Tạo `kiosk_local.db`, bật `PRAGMA journal_mode = WAL` và bảng `offline_punches`. | `FND-KSK-005` | `TASK-KSK-002` | Wave 3 | `PRAGMA journal_mode` trả về `wal`; tệp `.wal`/`.shm` hoạt động non-blocking. | Ready |
| `TASK-KSK-006` | Smoke Test Import Thư viện | Chạy script import toàn bộ thư viện cốt lõi. | `FND-KSK-006` | `TASK-KSK-002` | Wave 3 | In ra `ALL_IMPORTED_SUCCESSFULLY`, không có `ImportError` hay thiếu DLL C++. | Ready |
| `TASK-KSK-007` | Smoke Test Phiên Suy luận ONNX | Nạp 3 session với tensor giả lập. | `FND-KSK-007` | `TASK-KSK-003` | Wave 4 | Nạp thành công trong < 300 ms, không lỗi tập lệnh AVX2. | Ready |
| `TASK-KSK-008` | Smoke Test Cấu hình Camera | Nạp cấu hình từ `settings.py` và khởi tạo `CameraWorker`. | `FND-KSK-008` | `TASK-KSK-004` | Wave 4 | Camera index/độ phân giải khớp `.env`; bắt được tín hiệu video. | Ready |
| `TASK-KSK-009` | Smoke Test SQLite WAL | Truy vấn `PRAGMA journal_mode` trên `kiosk_local.db`. | `FND-KSK-009` | `TASK-KSK-005` | Wave 4 | Trả về `wal`; bảng `offline_punches` sẵn sàng. | Ready |
| `TASK-KSK-010` | Khởi tạo Lược đồ SQLite & Chỉ mục | Tạo bảng `offline_punches` cùng chỉ mục `idx_offline_sync`, `idx_offline_timestamp`, PRAGMA `synchronous=NORMAL`. | `BLD-KSK-001` | `TASK-KSK-002` | Wave 3 | CSDL khởi tạo tại `kiosk_local.db`; `PRAGMA journal_mode` trả về `wal`. | Ready |
| `TASK-KSK-011` | Hàng đợi Ngoại tuyến (enqueue/fetch/mark) | Xây dựng `enqueue_punch()`, `fetch_pending_batch(limit=50)`, `mark_synced(local_ids)`. | `BLD-KSK-002` | `TASK-KSK-010` | Wave 4 | Ghi đệm ngoại tuyến < 5 ms; bốc lô tối đa 50 bản ghi tuần tự. | Ready |
| `TASK-KSK-012` | Ma trận Gallery RAM & Cooldown 120s | Quản lý ma trận NumPy $N \times 512$, tính Cosine, nạp nóng Atomic Swap và Cooldown Cache 120s. | `BLD-KSK-003` | `TASK-KSK-002` | Wave 3 | Tích vô hướng < 2 ms với $N = 1000$; nạp nóng không giật khung hình camera. | Ready |
| `TASK-KSK-013` | Design Tokens & Theme QML | Định nghĩa bảng màu Dark Glassmorphism, font Inter, bán kính bo góc dùng chung. | `BLD-KSK-004` | `TASK-KSK-002` | Wave 3 | Mọi thành phần QML dùng token tập trung, không có giá trị màu/kích thước cứng. | Ready |
| `TASK-KSK-014` | Bố cục Khung nhìn 9:16 | Lắp HeaderBar, PortraitCameraPanel, ActionDock trong canvas 1080x1920. | `BLD-KSK-005` | `TASK-KSK-013` | Wave 4 | Bố cục 9:16 cân đối, co giãn mượt từ 720p đến 4K. | Ready |
| `TASK-KSK-015` | Khung Oval 4 màu & Pulse Scan | Vẽ khung Oval vector và máy trạng thái 4 màu kèm dải quét Laser Pulse Scan. | `BLD-KSK-006` | `TASK-KSK-014` | Wave 5 | Đổi màu tức thì theo tín hiệu AI; viền mượt không răng cưa. | Ready |
| `TASK-KSK-016` | Thẻ Kết quả Nổi & Âm thanh | Thẻ kết quả kính mờ trượt lên trong 2.5 s kèm âm thanh 880 Hz / 300 Hz. | `BLD-KSK-007` | `TASK-KSK-015` | Wave 6 | Card xuất hiện mượt sau khi nhận diện; âm thanh đồng bộ với visual. | Ready |
| `TASK-KSK-017` | Ba Modal (PIN, Đăng ký, Trợ giúp) | Bàn phím số ảo PIN Pad, Modal Đăng ký 3 bước tự ẩn in-viewport, Modal Trợ giúp. | `BLD-KSK-008` | `TASK-KSK-015` | Wave 6 | Phím cảm ứng nhạy; popup tự ẩn nhường camera ở Bước 2. | Ready |
| `TASK-KSK-018` | HTTP Client Wrapper | Đóng gói `httpx.Client` với `send_punch`, `sync_batch`, `fetch_gallery`, `verify_otp`, `enroll_face` và tự tiêm header xác thực. | `BLD-KSK-009` | `TASK-KSK-002` | Wave 3 | Gọi API thành công; timeout 3.0 s; kích hoạt fallback ngoại tuyến khi rớt mạng. | Ready |
| `TASK-KSK-019` | STOMP Subscriber Worker | `KioskStompWorker (QThread)` nhận `/topic/kiosk-gallery` và nạp nóng/xoá vector trên RAM. | `BLD-KSK-010` | `TASK-KSK-018` | Wave 4 | Tự kết nối lại (Exponential Backoff); ADD_VECTOR/DELETE_VECTOR tức thời không lock camera stream. | Ready |
| `TASK-KSK-020` | Offline Sync Worker | Luồng ngầm 10 s quét `offline_punches`, gửi lô ≤ 50 bản ghi qua `POST /sync-batch`, cập nhật `is_synced = 1`. | `BLD-KSK-011` | `TASK-KSK-018` | Wave 4 | Đồng bộ bù tự động khi mạng phục hồi mà không nghẽn UI event loop. | Ready |
| `TASK-KSK-021` | Luồng Đọc Camera ≥ 15 FPS | Worker đọc khung hình OpenCV DirectShow, phát `frame_ready(frame)`. | `BLD-KSK-012` | `TASK-KSK-004` | Wave 4 | Đọc ổn định ≥ 15 FPS; tự kết nối lại sau 3 s khi mất camera. | Ready |
| `TASK-KSK-022` | Bộ Phát hiện Mặt YuNet | Nạp ONNX YuNet, phát hiện mặt ≥ 120 px, tính góc Euler và 5 điểm mốc. | `BLD-KSK-013` | `TASK-KSK-021` | Wave 5 | Bounding box chính xác; lọc mặt nghiêng > 15°. | Ready |
| `TASK-KSK-023` | Cổng Căn chỉnh Oval | Kiểm chuẩn hình học và độ ổn định 0.5–1.0 s trước khi kích hoạt nhận diện. | `BLD-KSK-014` | `TASK-KSK-022` | Wave 6 | Chỉ mở cổng khi giữ ổn định đủ thời gian; phát thông điệp điều hướng màu vàng. | Ready |
| `TASK-KSK-024` | Lọc Liveness MiniFASNet | Nạp ONNX MiniFASNet, crop vùng mặt 1.5x, tính xác suất $S \ge 0.85$. | `BLD-KSK-015` | `TASK-KSK-022` | Wave 6 | Chặn ảnh in 2D và video màn hình; suy luận ≤ 50 ms. | Ready |
| `TASK-KSK-025` | Trích xuất ArcFace & RAM Matcher | Căn chỉnh Affine 112x112, trích vector 512D chuẩn hoá L2, so khớp Cosine bằng NumPy. | `BLD-KSK-016` | `TASK-KSK-024` | Wave 7 | So khớp 1,000 nhân sự < 2 ms; ngưỡng Cosine ≥ 0.50. | Ready |
| `TASK-KSK-026` | Hàng đợi SQLite WAL cho Đồng bộ | Quản lý `kiosk_local.db` chế độ WAL với `enqueue_punch()`, `fetch_unsynced_batch()`, `mark_synced()`. | `BLD-KSK-017` | `TASK-KSK-005` | Wave 4 | Ghi đệm an toàn khi mất mạng; đọc non-blocking song song. | Ready |
| `TASK-KSK-027` | Tích hợp Toàn trình Luồng Điểm danh Biên | Ghép camera, máy trạng thái Oval, pipeline AI, ghi đệm SQLite WAL và đồng bộ HTTP/STOMP. | `BLD-KSK-018` | `TASK-KSK-017`, `TASK-KSK-020` | Wave 7 | Điểm danh thành công hiển thị thẻ xanh < 100 ms; tự lưu SQLite khi mất mạng và đồng bộ bù khi có mạng. | Ready |
| `TASK-KSK-028` | Lập trình Thẩm định PIN Dự phòng, Vòng đời Bộ nhớ & Cấu hình Trạm | Xây dựng luồng `verify-pin` với ánh xạ lỗi 401/423 sang UI, bộ quản lý cấp phát/giải phóng mảng khung hình, vòng lặp tự phục hồi camera và `KioskConfig` nạp từ `.env`. | `BLD-KSK-019` | `TASK-KSK-017`, `TASK-KSK-018` | Wave 7 | PIN chỉ được chấp nhận khi Backend trả 200 và không tạo bản ghi khi thất bại; PIN bị khoá hiển thị đếm ngược theo `lockedUntil`; RAM biến thiên ≤ 10% sau 8 giờ; camera tự phục hồi ≤ 3 s; thiếu biến cấu hình bắt buộc thì khởi động thất bại kèm thông báo rõ. | Ready |

---

## 3. Dependency Structure (Cấu trúc Phụ thuộc)

```text
[Foundation Layer]
TASK-KSK-001 (Virtualenv)
    └── TASK-KSK-002 (Dependencies)
            ├── TASK-KSK-003 (ONNX Models)      ──→ TASK-KSK-007 (ONNX Smoke Test)
            ├── TASK-KSK-004 (Camera Driver)    ──→ TASK-KSK-008 (Camera Smoke Test)
            │                                        └──→ TASK-KSK-021 (Camera Reader) ──→ TASK-KSK-022 (YuNet)
            │                                                                                  ├── TASK-KSK-023 (Oval Gate)
            │                                                                                  └── TASK-KSK-024 (Liveness) ──→ TASK-KSK-025 (ArcFace & Matcher)
            ├── TASK-KSK-005 (SQLite WAL Init)  ──→ TASK-KSK-009 (WAL Smoke Test), TASK-KSK-026 (WAL Queue)
            ├── TASK-KSK-006 (Import Smoke Test)
            ├── TASK-KSK-010 (SQLite Schema)    ──→ TASK-KSK-011 (Offline Queue)
            ├── TASK-KSK-012 (RAM Gallery & Cooldown)
            ├── TASK-KSK-013 (QML Tokens)       ──→ TASK-KSK-014 (9:16 Layout) ──→ TASK-KSK-015 (Oval UI)
            │                                                                        ├── TASK-KSK-016 (Result Card)
            │                                                                        └── TASK-KSK-017 (Three Modals)
            └── TASK-KSK-018 (HTTP Client)      ──→ TASK-KSK-019 (STOMP Worker)
                                                └──→ TASK-KSK-020 (Offline Sync Worker)

[Integration Layer]
TASK-KSK-017 + TASK-KSK-020 ──→ TASK-KSK-027 (Edge Full Integration) ──→ BUILD
```

---

## 4. Execution Waves (Các Lớp Thực thi Song song)

* **Wave 1: Foundation Toolchain**: `TASK-KSK-001`.
* **Wave 2: Dependencies & Requirements**: `TASK-KSK-002`.
* **Wave 3: AI Models, Camera, SQLite, HTTP & Design Tokens**: `TASK-KSK-003`, `TASK-KSK-004`, `TASK-KSK-005`, `TASK-KSK-006`, `TASK-KSK-010`, `TASK-KSK-012`, `TASK-KSK-013`, `TASK-KSK-018`.
* **Wave 4: Environment Smoke Tests, Layout, Offline Queue & Sync**: `TASK-KSK-007`, `TASK-KSK-008`, `TASK-KSK-009`, `TASK-KSK-011`, `TASK-KSK-014`, `TASK-KSK-019`, `TASK-KSK-020`, `TASK-KSK-021`, `TASK-KSK-026`.
* **Wave 5: Vision Detection & Oval UI State Machine**: `TASK-KSK-015`, `TASK-KSK-022`.
* **Wave 6: Liveness, Result Card & Modals**: `TASK-KSK-016`, `TASK-KSK-017`, `TASK-KSK-023`, `TASK-KSK-024`.
* **Wave 7: ArcFace Matcher, Edge Integration & PIN Fallback**: `TASK-KSK-025`, `TASK-KSK-027`, `TASK-KSK-028`.

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Thiết bị Kiểm thử**: Các task từ Wave 2 trở đi yêu cầu máy trạm có camera UVC và quyền truy cập thiết bị; kiểm thử tự động chỉ chạy được phần logic thuần (không có phần cứng) nên `Done when` của các task thị giác phải được xác nhận thủ công tại hiện trường.
* **Độc lập Pull Request theo Task**: Mỗi `TASK-KSK-` thi công trên một nhánh riêng và tích hợp qua Pull Request sau khi vượt qua kiểm thử cục bộ; các task cùng Wave không phụ thuộc nhau nên có thể giao song song.
* **Đồng bộ với Tài liệu Hệ thống**: `TASK-KSK-027` phải chạy lại sau khi Backend hoàn tất `TASK-BE-022` (tích hợp STOMP toàn trình) để kiểm chứng luồng biên ↔ máy chủ.
