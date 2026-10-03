---
title: Kiosk Foundation Setup Plan
version: 2.0
status: Approved
owner: Edge Vision Lead & DevOps
---

# FSP — Kế hoạch Thiết lập Nền tảng Phân hệ Kiosk (Foundation Setup Plan)

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Chuẩn bị và kiểm định toàn bộ hạ tầng môi trường thực thi, công cụ, cấu hình phần cứng camera và cơ sở dữ liệu cục bộ riêng biệt cho phân hệ Trạm Điểm danh Kiosk Desktop (`app/kiosk-app`).
* **Mục tiêu**:
  * Thiết lập môi trường ảo Python 3.14 nhúng cô lập, cài đặt đầy đủ danh mục dependencies không xung đột hệ thống.
  * Tích hợp và kiểm chứng tính toàn vẹn của bộ 3 mô hình AI ONNX qua mã băm SHA-256.
  * Thiết lập kết nối phần cứng camera độ trễ thấp qua DirectShow (`cv2.CAP_DSHOW`).
  * Khởi tạo CSDL SQLite cục bộ chế độ Write-Ahead Logging (`WAL`) bảo đảm an toàn dữ liệu ngoại tuyến.

---

## 2. Approach Decisions (Quyết định Tiếp cận Nền tảng Kiosk)

| ID | Quyết định Tiếp cận Nền tảng | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-001` | Cô lập môi trường thực thi qua Python Virtualenv (`.venv`). | Ngăn chặn xung đột phiên bản thư viện C++ (PySide6, OpenCV, ONNX Runtime) với môi trường Python toàn cục của hệ điều hành. | `STK-001`, `STK-002` | Accepted |
| `APC-KSK-002` | Sử dụng DirectShow Backend (`cv2.CAP_DSHOW`) trên Windows OS. | Bỏ qua lớp đóng gói MSMF nặng nề, giảm độ trễ khởi tạo camera từ $2.5\text{s}$ xuống $< 0.8\text{s}$, giữ ổn định tốc độ khung hình 30 FPS. | `STK-003`, `RSK-SYS-001` | Accepted |
| `APC-KSK-003` | Cấu hình SQLite WAL cục bộ với `busy_timeout = 5000` và `synchronous = NORMAL`. | Cho phép đọc/ghi song song giữa luồng nhận diện điểm danh và luồng đồng bộ ngầm mà không bị khóa đĩa (`Zero Lock Contention`). | `STK-009`, `DTD-SYS-002` | Accepted |
| `APC-KSK-004` | Quản lý cấu hình tập trung qua Dataclass `KioskConfig` nạp từ file `.env`. | Phân tách rạch ròi giữa mã nguồn và cấu hình tham số phần cứng trạm (Camera Index, Kiosk ID, Secret Token). | `SRS-001`, `FND-SYS-007` | Accepted |

---

## 3. Foundation Work Items (Hạng mục Thiết lập Nền tảng Kiosk)

| ID | Hạng mục Công việc | Mô tả Kỹ thuật Chi tiết | Covers / Uses | Depends on | Tiêu chí Hoàn thành (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-KSK-001` | Khởi tạo Môi trường Ảo Virtualenv | Tạo môi trường ảo tại `app/kiosk-app/.venv` sử dụng Python 3.14.5 64-bit. | `STK-001` | `FND-SYS-001` | Kích hoạt môi trường ảo thành công; `python --version` trả về Python 3.14.x. | **Hoàn thành** |
| `FND-KSK-002` | Cài đặt Thư viện Phụ trợ Kiosk | Khóa phiên bản và cài đặt danh mục dependencies trong `requirements.txt` (PySide6, OpenCV, ONNX Runtime, NumPy, httpx, stomp.py). | `STK-001` đến `STK-004` | `FND-KSK-001` | `pip install -r requirements.txt` không lỗi; import toàn bộ thư viện cốt lõi thành công. | **Hoàn thành** |
| `FND-KSK-003` | Nạp & Kiểm định Mã băm Trọng số AI | Tải và đặt 3 mô hình ONNX vào `resources/assets/models/`; kiểm tra mã băm SHA-256 toàn vẹn dữ liệu. | `STK-005` đến `STK-007`| `FND-KSK-002` | Nạp `onnxruntime.InferenceSession` với tập lệnh vector CPU AVX2 thành công. | **Hoàn thành** |
| `FND-KSK-004` | Cấu hình Driver Camera DirectShow | Thiết lập tham số camera `CAMERA_DEVICE_INDEX=0`, `cv2.CAP_DSHOW`, độ phân giải $1280\times 720\text{ @ 30 FPS}$. | `STK-003`, `EXT-001` | `FND-KSK-002` | Đọc thành công các khung hình liên tiếp với độ trễ thu nhận $< 15\text{ ms}$/frame. | **Hoàn thành** |
| `FND-KSK-005` | Khởi tạo CSDL Cục bộ SQLite WAL | Tạo tệp CSDL `kiosk_local.db`, cấu hình `PRAGMA journal_mode = WAL;` và tạo bảng `offline_punches`. | `STK-009`, `DTD-SYS-002` | `FND-KSK-002` | `PRAGMA journal_mode` trả về `wal`; các tệp `.wal` và `.shm` hoạt động non-blocking. | **Hoàn thành** |

### Bảng Kiểm Định Toàn Vẹn Tệp Trọng Số Mô Hình AI (ONNX Model Registry)

| Tên Mô hình | Đường dẫn Thực tế | Dung lượng | Mã băm SHA-256 Thực tế | Trạng thái Kiểm định |
| :--- | :--- | :---: | :--- | :---: |
| **YuNet** | `resources/assets/models/yunet.onnx` | $232,589\text{ B}$ | `8F2383E4DD3CFBB4553EA8718107FC0423210DC964F9F4280604804ED2552FA4` | **Verified** |
| **MiniFASNet** | `resources/assets/models/minifasnet.onnx` | $1,743,581\text{ B}$ | `B32929ADC2D9C34B9486F8C4C7BC97C1B69BC0EA9BEFEFC380E4FAAE4E463907` | **Verified** |
| **ArcFace** | `resources/assets/models/arcface_mobilefacenet.onnx` | $13,616,099\text{ B}$ | `9CC6E4A75F0E2BF0B1AED94578F144D15175F357BDC05E815E5C4A02B319EB4F` | **Verified** |

---

## 4. Verification Plan (Kế hoạch Kiểm định Nền tảng Kiosk)

| ID | Hạng mục Kiểm định | Thủ tục & Kịch bản Xác thực | Covers | Kỳ vọng Đạt (Pass Criteria) | Kết quả Thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `VER-KSK-001` | Kiểm định Môi trường Ảo & Package Imports | Thực thi script import: `PySide6`, `cv2`, `onnxruntime`, `numpy`, `httpx`, `stomp`. | `FND-KSK-001`, `FND-KSK-002` | Xuất `ALL_IMPORTED_SUCCESSFULLY`, không có `ImportError` hoặc thiếu DLL C++. | `ALL_IMPORTED_SUCCESSFULLY` | **Passed** |
| `VER-KSK-002` | Kiểm định Nạp Phiên Suy luận ONNX | Nạp cả 3 session mô hình với tensor đầu vào ngẫu nhiên giả lập (dummy tensor). | `FND-KSK-003` | Nạp thành công trong $< 300\text{ms}$; không lỗi tập lệnh AVX2. | Nạp thành công cả 3 mô hình | **Passed** |
| `VER-KSK-003` | Kiểm định Cấu hình Phần cứng Camera | Nạp cấu hình từ `settings.py`, khởi tạo đối tượng `CameraWorker` với `cv2.CAP_DSHOW`. | `FND-KSK-004` | Camera index và độ phân giải khớp cấu hình `.env`; bắt được tín hiệu video. | Đã cấu hình và kết nối DirectShow | **Passed** |
| `VER-KSK-004` | Kiểm định CSDL SQLite WAL Mode | Truy vấn `PRAGMA journal_mode;` trên tệp `kiosk_local.db`. | `FND-KSK-005` | Trả về chuỗi `wal`, bảng `offline_punches` được tạo lập sẵn sàng. | `JOURNAL_MODE: wal`, bảng tồn tại | **Passed** |
