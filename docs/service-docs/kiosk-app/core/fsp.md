# FSP — Kế hoạch Thiết lập Nền tảng Phân hệ Kiosk (Foundation Setup Plan)

> **Mã tài liệu:** `FSP-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả các hạng mục thiết lập môi trường thực thi, chuỗi công cụ (toolchain) và cấu hình nền tảng (`FND-KSK-`) riêng biệt cho phân hệ Trạm Điểm danh Kiosk Desktop trước khi xây dựng mã nguồn.

---

## 1. Mục tiêu & Phạm vi (Objectives & Scope)

* **Mục tiêu**: Chuẩn bị hoàn chỉnh môi trường thực thi Python 3.14 nhúng tại biên, thiết lập giao diện Qt/PySide6, nạp và kiểm định 3 tệp trọng số mô hình AI ONNX, cấu hình kết nối phần cứng camera và cơ sở dữ liệu cục bộ SQLite WAL.
* **Phạm vi**: Giới hạn trong phân hệ `app/kiosk-app`, kế thừa từ kế hoạch nền tảng hệ thống `PLN-FND-01` (`FND-SYS-002`, `FND-SYS-003`).

---

## 2. Hiện trạng & Yêu cầu Kỹ thuật (Prerequisites & Constraints)

* **Hệ thống đã cung cấp**: Kho mã nguồn Monorepo, cấu trúc thư mục `app/kiosk-app`, file biến môi trường gốc `.env`.
* **Ràng buộc tuân thủ**:
  * Python runtime tương thích $\ge 3.10$ (môi trường máy: Python 3.14.3 64-bit).
  * 100% thư viện phụ trợ cài đặt trong môi trường ảo cục bộ `.venv`.
  * Bộ 3 mô hình AI ONNX (`yunet.onnx`, `minifasnet.onnx`, `arcface_mobilefacenet.onnx`) đặt tại `assets/models/`.
  * Camera vật lý kết nối qua giao thức độ trễ thấp DirectShow (`cv2.CAP_DSHOW`).

---

## 3. Foundation Work Items (Hạng mục Thiết lập Nền tảng Kiosk)

| ID | Hạng mục Công việc | Mô tả Kỹ thuật Chi tiết | Covers / Uses | Depends on | Tiêu chí Hoàn thành (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-KSK-001` | Khởi tạo Môi trường Ảo Virtualenv | Tạo môi trường ảo tại `app/kiosk-app/.venv` sử dụng Python 3.14.3. | `STK-001` | `FND-SYS-001` | Lệnh kích hoạt `.\.venv\Scripts\Activate.ps1` thành công; `pip list` sạch. | **Hoàn thành** |
| `FND-KSK-002` | Cài đặt Thư viện Phụ trợ Kiosk | Khóa phiên bản và cài đặt 20 thư viện chuẩn trong `requirements.txt` (PySide6, OpenCV, ONNX Runtime, NumPy, httpx, stomp.py). | `STK-001` đến `STK-004` | `FND-KSK-001` | `pip install -r requirements.txt` không có lỗi; import toàn bộ thư viện thành công. | **Hoàn thành** |
| `FND-KSK-003` | Nạp & Kiểm định Mã băm Trọng số AI | Tải và đặt 3 mô hình ONNX vào `assets/models/`; kiểm tra mã băm SHA-256 toàn vẹn dữ liệu. | `STK-005` đến `STK-007`| `FND-KSK-002` | Khởi tạo `onnxruntime.InferenceSession` với tập lệnh AVX2 CPU thành công. | **Hoàn thành** |
| `FND-KSK-004` | Cấu hình Driver Camera DirectShow | Thiết lập tham số camera `CAMERA_DEVICE_INDEX=0`, `cv2.CAP_DSHOW`, độ phân giải $1280\times 720\text{ @ 30 FPS}$. | `STK-003`, `EXT-001` | `FND-KSK-002` | Đọc thành công 10 khung hình thử nghiệm liên tiếp với thời gian trễ $< 15\text{ ms}$/frame. | **Hoàn thành** |
| `FND-KSK-005` | Khởi tạo CSDL Cục bộ SQLite WAL | Tạo tệp CSDL `kiosk_local.db`, cấu hình `PRAGMA journal_mode = WAL;` và tạo bảng `offline_punches`. | `STK-009`, `DTD-SYS-002` | `FND-KSK-002` | Tệp `kiosk_local.db-wal` sinh ra khi ghi thử nghiệm; đọc non-blocking thành công. | **Hoàn thành** |
