# Phân Hệ Trạm Điểm Danh Kiosk Desktop (`kiosk-app`)

> **Cấp độ không gian:** Cấp 2 (Service Workspace)  
> **Không gian cha:** [`README.md`](../../README.md) (Thư mục Gốc)  
> **Công nghệ cốt lõi:** Python 3.12, PySide6 (Qt Quick / QML), OpenCV, ONNX Runtime (CPU / DirectML), SQLite WAL.  
> **Mô hình Edge AI:** YuNet (Face Detect), MiniFASNet (Liveness $\ge 0.85$), ArcFace MobileFaceNet (512D Embeddings).

---

## 1. Cấu Trúc Mã Nguồn Nội Bộ (Internal Layout)

| Thư mục / Tệp | Loại tài nguyên | Trách nhiệm chi tiết |
| :--- | :--- | :--- |
| [`main.py`](main.py) | Entrypoint | Khởi tạo QML Engine, kết nối luồng Camera, pipeline AI, hàng đợi SQLite và hiển thị cửa sổ dọc |
| [`src/core/`](src/core/) | Core Logic | Thuật toán AI (`vision/`), Cooldown Tracker (`cooldown/`), Hàng đợi Offline (`offline/`), Mã PIN (`security/`) |
| [`src/presentation/`](src/presentation/) | Presentation | ViewModels (`kiosk_view_model.py`), Controllers (`pin_controller.py`, `enrollment_controller.py`) |
| [`src/network/`](src/network/) | Network Layer | HTTP REST Client (`http_client.py`), WebSocket STOMP Worker (`stomp_worker.py`) |
| [`resources/qml/`](resources/qml/) | QML UI | Giao diện QML đứng 9:16: `main.qml`, `theme/Theme.qml`, `components/`, `dialogs/` |
| [`resources/assets/models/`](resources/assets/models/) | AI Weights | 3 tệp trọng số ONNX: `yunet.onnx`, `minifasnet.onnx`, `arcface_mobilefacenet.onnx` |
| [`tests/`](tests/) | Unit Test Suite | Bộ 200+ Unit tests in-process chạy không cần webcam vật lý |

---

## 2. Bảng Tra Cứu Nghiệp Vụ Kiosk (Domain-to-File Index)

Agent tra cứu trực tiếp file xử lý mà không cần tìm kiếm:

| Nghiệp vụ Kiosk | File xử lý logic chính | Controller / QML View liên quan |
| :--- | :--- | :--- |
| **Nhận diện khuôn mặt & Liveness** | `src/core/vision/face_detector.py` | `src/presentation/viewmodels/kiosk_view_model.py` |
| **Đối sánh Cosine trong RAM** | `src/core/vision/gallery_matcher.py` | `resources/qml/main.qml` |
| **Chống quẹt trùng (Cooldown 120s)** | `src/core/cooldown/cooldown_tracker.py` | `src/presentation/viewmodels/kiosk_view_model.py` |
| **Hàng đợi lưu đệm Offline** | `src/core/offline/sqlite_manager.py` | `src/core/offline/sync_worker.py` |
| **Bàn phím số PIN ảo (Fallback)** | `src/core/security/pin_security.py` | `src/presentation/controllers/pin_controller.py`, `resources/qml/dialogs/PinDialog.qml` |
| **Đăng ký khuôn mặt 3 tư thế (OTP)** | `src/presentation/controllers/enrollment_controller.py` | `resources/qml/dialogs/EnrollmentDialog.qml` |

---

## 3. Lệnh Khởi Chạy & Tham Số Dòng Lệnh

```bash
# 1. Khởi chạy chế độ phát triển (Dev Mode: Bật phím tắt mô phỏng Space, 0, 1)
python app/kiosk-app/main.py --dev

# 2. Khởi chạy không cần camera (Mô phỏng ảnh chụp bằng phím Space)
python app/kiosk-app/main.py --dev --no-camera

# 3. Khởi chạy môi trường sản xuất (Production Clean)
python app/kiosk-app/main.py --prod

# 4. Chạy toàn bộ Unit Tests (Bắt buộc)
cd app/kiosk-app && pytest

# 5. Kiểm tra lỗi cú pháp và lint mã nguồn (Bắt buộc)
cd app/kiosk-app && ruff check .
```

* **Phím tắt nhanh chế độ Dev:** `F1` (Trợ giúp), `F2` (Mở PIN Pad), `F3` (Đăng ký OTP), `Space` (Mô phỏng quét mặt thành công).
