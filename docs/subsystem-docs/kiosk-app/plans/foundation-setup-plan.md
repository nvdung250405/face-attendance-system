---
title: Kiosk Foundation Setup Plan
version: 3.0
status: Approved
owner: Edge Vision Lead & DevOps
type: plan
scope: KSK
updated: 2026-10-12
---

# FOUNDATION SETUP PLAN — Kế hoạch Thiết lập Nền tảng Phân hệ Kiosk

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Chuẩn bị và kiểm định toàn bộ hạ tầng môi trường thực thi, công cụ, cấu hình phần cứng camera, cơ sở dữ liệu cục bộ riêng biệt, cơ chế sẵn sàng tích hợp và bộ khung kiểm thử hợp đồng cho phân hệ Trạm Điểm danh Kiosk Desktop (`app/kiosk-app`), kế thừa từ kế hoạch nền tảng hệ thống (`FND-SYS-001`, `FND-SYS-007`, `FND-SYS-008`).
* **Mục tiêu**:
  * Thiết lập môi trường ảo Python 3.14 nhúng cô lập, cài đặt đầy đủ danh mục dependencies không xung đột hệ thống.
  * Tích hợp và kiểm chứng tính toàn vẹn của bộ 3 mô hình AI ONNX qua mã băm SHA-256.
  * Thiết lập kết nối phần cứng camera độ trễ thấp qua DirectShow (`cv2.CAP_DSHOW`).
  * Khởi tạo CSDL SQLite cục bộ chế độ Write-Ahead Logging (`WAL`) bảo đảm an toàn dữ liệu ngoại tuyến.
  * Thiết lập cơ chế sẵn sàng tích hợp mạng biên: health check ping tới backend, tự phát hiện mạng phục hồi và kích hoạt đồng bộ ngoại tuyến.
  * Xây dựng bộ khung kiểm thử hợp đồng (Contract Testing Harness) qua `httpx.MockTransport` và fixtures SQLite cô lập.

---

## 2. Approach Decisions (Quyết định Tiếp cận Nền tảng Kiosk)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-001` | Cô lập môi trường thực thi qua Python Virtualenv (`.venv`). | Ngăn chặn xung đột phiên bản thư viện C++ (PySide6, OpenCV, ONNX Runtime) với môi trường Python toàn cục của hệ điều hành. | `STK-001`, `STK-002` | Accepted |
| `APC-KSK-002` | Sử dụng DirectShow Backend (`cv2.CAP_DSHOW`) trên Windows OS. | Bỏ qua lớp đóng gói MSMF nặng nề, giảm độ trễ khởi tạo camera từ $2.5\text{s}$ xuống $< 0.8\text{s}$, giữ ổn định tốc độ khung hình 30 FPS. | `STK-002`, `RSK-001` | Accepted |
| `APC-KSK-003` | Cấu hình SQLite WAL cục bộ với `busy_timeout = 5000` và `synchronous = NORMAL`. | Cho phép đọc/ghi song song giữa luồng nhận diện điểm danh và luồng đồng bộ ngầm mà không bị khóa đĩa (`Zero Lock Contention`). | `STK-005`, `STK-009` | Accepted |
| `APC-KSK-004` | Quản lý cấu hình tập trung qua Dataclass `KioskConfig` nạp từ file `.env`. | Phân tách rạch ròi giữa mã nguồn và cấu hình tham số phần cứng trạm (Camera Index, Kiosk ID, Secret Token). | `SRS-001`, `FND-SYS-007` | Accepted |
| `APC-KSK-005` | Tách bạch kiểm thử hợp đồng mạng bằng MockTransport không phụ thuộc mạng vật lý. | Cho phép kiểm định 100% hợp đồng schema gửi/nhận (`send_punch`, `sync-batch`) trong môi trường CI/CD không có kết nối internet hoặc backend server thật. | `PD-001`, `STK-025` | Accepted |

---

## 3. Foundation Work Items (Hạng mục Thiết lập Nền tảng Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-KSK-001` | Khởi tạo Môi trường Ảo Virtualenv | Tạo môi trường ảo tại `app/kiosk-app/.venv` sử dụng Python 3.14.x 64-bit. | `STK-001` | `FND-SYS-001` | Kích hoạt môi trường ảo thành công; `python --version` trả về Python 3.14.x. | Done |
| `FND-KSK-002` | Cài đặt Thư viện Phụ trợ Kiosk | Khóa phiên bản và cài đặt danh mục dependencies trong `requirements.txt` (PySide6, OpenCV, ONNX Runtime, NumPy, httpx, stomp.py). | `STK-001`, `STK-002`, `STK-003`, `STK-004` | `FND-KSK-001` | `pip install -r requirements.txt` không lỗi; import toàn bộ thư viện cốt lõi thành công. | Done |
| `FND-KSK-003` | Nạp & Kiểm định Mã băm Trọng số AI | Tải và đặt 3 mô hình ONNX vào `resources/assets/models/`; kiểm tra mã băm SHA-256 toàn vẹn dữ liệu. | `STK-006` | `FND-KSK-002` | Nạp `onnxruntime.InferenceSession` với tập lệnh vector CPU AVX2 thành công. | Done |
| `FND-KSK-004` | Cấu hình Driver Camera DirectShow | Thiết lập tham số camera `CAMERA_DEVICE_INDEX=0`, `cv2.CAP_DSHOW`, độ phân giải $1280\times 720\text{ @ 30 FPS}$. | `STK-002`, `EXT-001` | `FND-KSK-002` | Đọc thành công các khung hình liên tiếp với độ trễ thu nhận $< 15\text{ ms}$/frame. | Done |
| `FND-KSK-005` | Khởi tạo CSDL Cục bộ SQLite WAL | Tạo tệp CSDL `kiosk_local.db`, cấu hình `PRAGMA journal_mode = WAL;` và tạo bảng `offline_punches`. | `STK-005`, `STK-009` | `FND-KSK-002` | `PRAGMA journal_mode` trả về `wal`; các tệp `.wal` và `.shm` hoạt động non-blocking. | Done |
| `FND-KSK-010` | Sẵn sàng Tích hợp & Giám sát Kết nối Mạng Biên | Xây dựng cơ chế thăm dò sức khỏe kết nối mạng máy chủ trung tâm (`check_health()`), tự động phát tín hiệu chuyển đổi trạng thái mạng (`network_status_changed`), kích hoạt đồng bộ ngoại tuyến và tự phục hồi kết nối camera USB. | `ARC-001`, `ARC-012`, `STK-030` | `FND-KSK-002`, `FND-KSK-005` | Kiosk tự động phát hiện `is_online = True/False` trong $\le 3\text{s}$, kích hoạt đồng bộ bù khi có mạng lại và tự kết nối lại camera sau 3s khi mất tín hiệu. | Done |
| `FND-KSK-011` | Bộ Khung Kiểm thử Hợp đồng & Giả lập Mạng | Thiết lập bộ khung kiểm thử hợp đồng HTTP/STOMP sử dụng `httpx.MockTransport` kiểm định hợp đồng payload gửi nhận (`send_punch`, `sync-batch`, `fetch_gallery`) độc lập với mạng vật lý. | `STK-025`, `ARC-001` | `FND-KSK-002` | Bộ unit test `test_network.py` và `test_sqlite_manager.py` chạy qua 100% mock handlers mà không gửi request ra internet, phát hiện tức thì sai lệch schema payload. | Done |
| `FND-KSK-012` | Cơ chế Khởi tạo Dữ liệu & Fixtures Kiểm thử Cục bộ | Xây dựng bộ test fixtures (pytest temp_db, mock embeddings 512D) và cơ chế khởi tạo cấu trúc bảng SQLite `kiosk_local.db` sạch phục vụ kiểm thử đơn vị và kiểm thử hồi quy cục bộ. | `STK-009`, `ARC-001` | `FND-KSK-005` | Mọi ca kiểm thử tạo môi trường SQLite WAL cô lập trong thư mục tạm, tự động dọn dẹp sau khi chạy, không gây ô nhiễm CSDL vận hành thật. | Done |

### Bảng Kiểm Định Toàn Vẹn Tệp Trọng Số Mô Hình AI (ONNX Model Registry)

| Tên Mô hình | Đường dẫn Thực tế | Dung lượng | Mã băm SHA-256 Thực tế | Trạng thái Kiểm định |
| :--- | :--- | :---: | :--- | :---: |
| **YuNet** | `resources/assets/models/yunet.onnx` | $232,589\text{ B}$ | `8F2383E4DD3CFBB4553EA8718107FC0423210DC964F9F4280604804ED2552FA4` | Verified |
| **MiniFASNet** | `resources/assets/models/minifasnet.onnx` | $1,743,581\text{ B}$ | `B32929ADC2D9C34B9486F8C4C7BC97C1B69BC0EA9BEFEFC380E4FAAE4E463907` | Verified |
| **ArcFace** | `resources/assets/models/arcface_mobilefacenet.onnx` | $13,616,099\text{ B}$ | `9CC6E4A75F0E2BF0B1AED94578F144D15175F357BDC05E815E5C4A02B319EB4F` | Verified |

---

## 4. Verification Items (Danh mục Hạng mục Kiểm định Nền tảng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-KSK-006` | Kiểm định Môi trường Ảo & Package Imports | Thực thi script import: `PySide6`, `cv2`, `onnxruntime`, `numpy`, `httpx`, `stomp`. | `FND-KSK-001`, `FND-KSK-002` | `FND-KSK-002` | Xuất `ALL_IMPORTED_SUCCESSFULLY`, không có `ImportError` hoặc thiếu DLL C++. | Done |
| `FND-KSK-007` | Kiểm định Nạp Phiên Suy luận ONNX | Nạp cả 3 session mô hình với tensor đầu vào ngẫu nhiên giả lập (dummy tensor). | `FND-KSK-003` | `FND-KSK-003` | Nạp thành công trong $< 300\text{ms}$; không lỗi tập lệnh AVX2. | Done |
| `FND-KSK-008` | Kiểm định Cấu hình Phần cứng Camera | Nạp cấu hình từ `settings.py`, khởi tạo đối tượng `CameraWorker` với `cv2.CAP_DSHOW`. | `FND-KSK-004` | `FND-KSK-004` | Camera index và độ phân giải khớp cấu hình `.env`; bắt được tín hiệu video. | Done |
| `FND-KSK-009` | Kiểm định CSDL SQLite WAL Mode | Truy vấn `PRAGMA journal_mode;` trên tệp `kiosk_local.db`. | `FND-KSK-005` | `FND-KSK-005` | Trả về chuỗi `wal`, bảng `offline_punches` được tạo lập sẵn sàng. | Done |
