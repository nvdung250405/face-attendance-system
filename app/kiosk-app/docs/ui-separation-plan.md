# Kế Hoạch Tách Biệt Giao Diện Kiosk App Theo Mô Hình MVC (QML / PySide6)

> **Tài liệu tham chiếu:**
> - [DDS.md](file:///d:/workspace/VSCode/nvdung/face-attendance-system/docs/architecture/DDS.md) (Mục 2.1 & Mục 3.5 - Máy trạng thái viền oval 4 màu & kiến trúc Kiosk biên)
> - [BP-KIOSK-01](file:///d:/workspace/VSCode/nvdung/face-attendance-system/app/kiosk-app/docs/planning/BP-KIOSK-01.md) (Quy hoạch phân hệ Kiosk)
> - **Mô hình ánh xạ tương đương 1:1 với JavaFX**:
>   - **View**: `QML (.qml)` $\Leftrightarrow$ `FXML (.fxml)` + CSS
>   - **Controller**: `QObject Python` (`@Property`, `@Signal`, `@Slot`) $\Leftrightarrow$ `@FXML Controller Java`
>   - **Model**: Python Data Classes, SQLite WAL, ONNX Inference $\Leftrightarrow$ Model POJO & Services

---

## 1. Kiến Trúc MVC / MVVM Tách Rời Tuyệt Đối

```
+---------------------------------------------------------------------------------------+
|                            VIEW LAYER (QML / Qt Quick)                                |
|                        (Khai báo UI thuần túy, 0 logic code)                          |
|                                                                                       |
|   ui/qml/                                                                             |
|   ├── main.qml                     -> Cửa sổ ứng dụng chính                           |
|   ├── theme/Theme.qml              -> Bảng màu Catppuccin Mocha, kích thước font      |
|   ├── components/LiveCanvas.qml    -> Khung hình camera, viền oval động, lớp mờ        |
|   ├── components/VirtualKeypad.qml -> Bàn phím số ảo cảm ứng                          |
|   ├── dialogs/PinDialog.qml        -> Popup quẹt mã PIN khẩn cấp                      |
|   └── dialogs/EnrollmentDialog.qml -> Popup tự đăng ký khuôn mặt                      |
+-------------------------------------------^-------------------------------------------+
                                            | (Data Binding: @Property, Signals, Slots)
+-------------------------------------------v-------------------------------------------+
|                          CONTROLLER LAYER (Python QObject)                            |
|             (Điều phối luồng dữ liệu giữa View và Model, tương tự JavaFX)             |
|                                                                                       |
|   ui/controllers/                                                                     |
|   ├── kiosk_controller.py      -> Quản lý trạng thái Oval, thông điệp, đếm ngược      |
|   ├── pin_controller.py        -> Điều phối xác thực mã PIN, lockout                  |
|   ├── enrollment_controller.py -> Điều phối 3 bước chụp ảnh OTP                       |
|   └── video_image_provider.py  -> Pipeline đẩy khung hình OpenCV sang QML Image       |
+-------------------------------------------^-------------------------------------------+
                                            |
+-------------------------------------------v-------------------------------------------+
|                             MODEL & CORE ENGINE LAYER                                 |
|                       (Toàn bộ nghiệp vụ biên, độc lập 100% với UI)                   |
|                                                                                       |
|   core/vision/                 -> YuNet, MiniFASNet, MobileFaceNet                    |
|   core/cooldown/               -> CooldownTracker (chống quẹt đúp)                    |
|   network/                     -> SQLiteQueueManager (WAL), OfflineSyncWorker         |
|   config/                      -> KioskConfig, Logger                                 |
+---------------------------------------------------------------------------------------+
```

---

## 2. Quy Chuẩn Tổ Chức Thư Mục `/kiosk-app`

```
app/kiosk-app/
├── config/                      # Cấu hình ngưỡng AI, camera, logger
├── core/                        # Thuật toán AI, trích xuất đặc trưng, liveness
├── network/                     # SQLite WAL và worker đồng bộ ngầm
├── ui/
│   ├── controllers/             # [MỚI - CONTROLLER] Các class QObject xử lý tương tác
│   │   ├── __init__.py
│   │   ├── kiosk_controller.py
│   │   ├── pin_controller.py
│   │   ├── enrollment_controller.py
│   │   └── video_image_provider.py
│   │
│   └── qml/                     # [MỚI - VIEW] Toàn bộ mã nguồn giao diện khai báo
│       ├── main.qml
│       ├── theme/
│       │   ├── Theme.qml        # Singleton chứa màu sắc, font chữ Catppuccin
│       │   └── qmldir           # Khai báo module theme
│       ├── components/
│       │   ├── LiveCanvas.qml   # Stream camera + viền oval 4 màu
│       │   ├── OvalOverlay.qml  # Lớp phủ mờ khoét lỗ oval + 4 góc corner guides
│       │   ├── StatusBadge.qml  # Badge thông báo kết quả
│       │   └── VirtualKeypad.qml# Bàn phím số ảo
│       └── dialogs/
│           ├── PinDialog.qml
│           └── EnrollmentDialog.qml
│
├── tests/                       # Unit & Integration Tests (Offscreen headless)
├── main.py                      # Điểm khởi chạy QQmlApplicationEngine
├── pyproject.toml               # Cấu hình ruff, pytest, đường dẫn QML
└── requirements.txt             # PySide6 và các gói AI biên
```

---

## 3. Lộ Trình Triển Khai (Phased Roadmap)

| Giai Đoạn | Nhánh Git | Nội Dung Công Việc | Tiêu Chí Hoàn Thành |
|---|---|---|---|
| **Phase 0 (Environment)** | `develop` | - Khởi tạo cấu trúc thư mục `ui/qml/`, `ui/controllers/`.<br>- Khởi tạo `Theme.qml`, `qmldir`, `video_image_provider.py` nền tảng.<br>- Bổ sung cấu hình QML vào test suite và kiểm tra môi trường. | Môi trường sạch, 100% test pass, sẵn sàng code Phase 1. |
| **Phase 1 (Foundation)** | `feature/kiosk-qml-foundation` | - Hoàn thiện `VideoImageProvider` (OpenCV sang QML Pixmap stream zero-copy).<br>- Hoàn thiện `LiveCanvas.qml` vẽ viền Oval 4 màu động qua Canvas.<br>- `KioskController` phát tín hiệu thay đổi màu viền (`IDLE`, `ALIGNING`, `SUCCESS`, `ERROR`). | Video camera hiển thị mượt trên QML; viền oval đổi màu chuẩn xác; không lỗi ruff. |
| **Phase 2 (Controller Integration)** | `feature/kiosk-qml-viewmodel` | - Kết nối `KioskController` với `CameraWorker`, `YuNetFaceDetector`, `MiniFASNetLivenessGate`.<br>- Bổ sung cơ chế Cooldown và tự động nhận diện mặt theo luồng. | Luồng điểm danh tự động hoạt động mượt mà qua QML; độ trễ < 100ms. |
| **Phase 3 (Dialogs)** | `feature/kiosk-qml-dialogs` | - Xây dựng `VirtualKeypad.qml` và `PinDialog.qml` kết nối `PinController`.<br>- Xây dựng `EnrollmentDialog.qml` kết nối `EnrollmentController`. | Bàn phím số nhập mượt; luồng Self-Enrollment 3 bước hoàn chỉnh. |
| **Phase 4 (Final Assembly)** | `feature/kiosk-qml-integration` | - Cập nhật `main.py` chạy qua `QQmlApplicationEngine`.<br>- Dọn dẹp mã nguồn cũ trong `ui/views/` và `ui/widgets/`.<br>- Viết trọn bộ Controller Unit Tests. | Toàn bộ hệ thống Kiosk chạy thuần QML/MVC; CI/CD đạt 100% xanh. |
