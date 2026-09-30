# Kế Hoạch Tái Thiết Lập Môi Trường & Chuyển Đổi QML (Foundation Refactoring)

> **Tài liệu tham chiếu:**
>
> - [DDS.md](file:///d:/workspace/VSCode/nvdung/face-attendance-system/docs/architecture/DDS.md) (Mục 2.1 & 3.5 - Máy trạng thái viền oval 4 màu & kiến trúc Kiosk biên)
> - [BP-KIOSK-01](file:///d:/workspace/VSCode/nvdung/face-attendance-system/app/kiosk-app/docs/planning/BP-KIOSK-01.md) (Quy hoạch phân hệ Kiosk)
> - **Mô hình kiến trúc tương đương 1:1 với JavaFX**:
>   - **View Layer**: `QML (.qml)` $\Leftrightarrow$ `FXML (.fxml)` + CSS (`.css`)
>   - **Controller Layer**: `QObject Python` (`@Property`, `@Signal`, `@Slot`) $\Leftrightarrow$ `@FXML Controller Java`
>   - **Model Layer**: Core Vision Engine, Cooldown, SQLite WAL $\Leftrightarrow$ Service & Business Logic

---

## 1. Mục Tiêu Tái Thiết Lập Nền Tảng (Foundation Refactoring)

Chuyển đổi từ cơ chế vẽ tĩnh CPU Widgets (`QWidget`, `QPainter`) sang kiến trúc hiện đại **Declarative QML + Python Controller + Hardware Accelerated Scene Graph**:

1. **Phân tách rạch ròi 100% UI & Business Logic**:
   - `ui/qml/` (View): Chỉ thuần túy layout, CSS/Catppuccin styling, visual animation.
   - `ui/controllers/` (Controller): Đóng vai trò ViewModel / Controller trung chuyển dữ liệu giữa UI và Model.
   - `core/`, `network/`, `config/` (Model): Không dính líu đến bất kỳ thư viện UI nào.
2. **Hiệu năng GPU**: Khung hình camera và viền oval được render trực tiếp qua Direct3D/OpenGL Scene Graph, giải phóng CPU tập trung cho AI inference (YuNet + MiniFASNet).
3. **Đóng gói tài nguyên (Resource Compilation)**: Sử dụng file `resources.qrc` và `pyside6-rcc` để đóng gói toàn bộ file `.qml`, theme, icon vào nhị phân.

---

## 2. Cấu Trúc Thư Mục Chuẩn Hóa Toàn Diện

```text
app/kiosk-app/
├── assets/                          # [MỚI] Icon, âm thanh hiệu ứng (Success/Error chime), model ONNX
├── config/                          # Cấu hình KioskConfig, logger
├── core/                            # Vision pipeline, CooldownTracker
├── network/                         # SQLiteQueueManager (WAL), OfflineSyncWorker
│
├── ui/                              # [TÁI CẤU TRÚC HOÀN TOÀN]
│   ├── qml/                         # TOÀN BỘ MÃ NGUỒN GIAO DIỆN KHAI BÁO (VIEW)
│   │   ├── main.qml                 # Cửa sổ chính Kiosk
│   │   ├── components/              # Các UI Component tái sử dụng
│   │   │   ├── LiveCanvas.qml       # Camera stream & Oval 4 màu
│   │   │   ├── OvalOverlay.qml      # Lớp phủ mờ khoét lỗ Oval + Corner brackets
│   │   │   ├── StatusBadge.qml      # Thẻ thông báo trạng thái bo góc
│   │   │   └── VirtualKeypad.qml    # Bàn phím số cảm ứng
│   │   ├── dialogs/                 # Các màn hình popup / dialog QML
│   │   │   ├── PinDialog.qml        # Giao diện quẹt mã PIN
│   │   │   └── EnrollmentDialog.qml # Giao diện Self-Enrollment
│   │   ├── theme/                   # Bảng màu Catppuccin & Font chung
│   │   │   ├── Theme.qml            # Biến màu sắc toàn cục (Base, Surface, Oval colors)
│   │   │   └── qmldir               # Khai báo module Singleton cho Theme
│   │   └── assets/                  # Assets dành riêng cho QML (icons, svgs)
│   │
│   ├── controllers/                 # TẦNG CONTROLLER / VIEWMODEL (PYTHON QOBJECT)
│   │   ├── __init__.py
│   │   ├── kiosk_view_model.py      # ViewModel phát tín hiệu (Signals/Properties) cho QML
│   │   ├── pin_controller.py        # Controller xử lý logic nhập PIN
│   │   ├── enrollment_controller.py # Controller xử lý đăng ký OTP
│   │   └── video_image_provider.py  # Provider truyền frame camera tốc độ cao sang QML
│   │
│   └── views/                       # (Legacy Widgets - loại bỏ sau khi QML hoàn tất)
│
├── resources.qrc                    # File định nghĩa tài nguyên QML đóng gói
├── main.py                          # Điểm khởi chạy QQmlApplicationEngine
├── pyproject.toml                   # Cấu hình Ruff, Pytest, offscreen runner
├── requirements.txt                 # PySide6 và các gói AI biên
└── tests/                           # Unit tests Controller / ViewModel không phụ thuộc màn hình
```

---

## 3. Cập Nhật Thư Viện, Công Cụ & Môi Trường

### 3.1. Thư viện & Module PySide6

- Đảm bảo đầy đủ `PySide6-Essentials` và `PySide6-Addons` (đặc biệt: `PySide6.QtQuick`, `PySide6.QtQml`, `PySide6.QtQuickControls2`).
- Công cụ Resource Compiler: `pyside6-rcc` để biên dịch `resources.qrc` sang `resources_rc.py` khi đóng gói production.

### 3.2. Cấu hình Pytest & Headless CI

- Thiết lập `QT_QPA_PLATFORM=offscreen` trong `pyproject.toml` để chạy test trơn tru trên mọi môi trường (Windows dev máy bàn và Ubuntu CI runner) mà không cần mở cửa sổ đồ họa.

---

## 4. Lộ Trình Triển Khai Chi Tiết (Phased Execution)

| Giai Đoạn                          | Tên Nhánh Git                   | Nhiệm Vụ Trọng Tâm                                                                                                                                                                                                                                                                            | Tiêu Chí Nghiệm Thu                                                                   |
| ---------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Phase 0 (Environment)**          | `develop`                       | - Khởi tạo đầy đủ cây thư mục`ui/qml/{components,dialogs,theme,assets}` và `ui/controllers/`.- Tạo `resources.qrc` mẫu và cấu hình `pyproject.toml`.- Khởi tạo nền tảng `Theme.qml`, `VideoImageProvider`, `KioskViewModel` stub.- Thiết lập fixture `qapp` offscreen cho toàn bộ test suite. | Môi trường sạch 100%, tất cả test pass, cấu trúc thư mục hoàn chỉnh.                  |
| **Phase 1 (Live Canvas)**          | `feature/kiosk-qml-foundation`  | - Hoàn thiện`VideoImageProvider` stream OpenCV BGR sang QML với zero memory leak.- Xây dựng `LiveCanvas.qml` + `OvalOverlay.qml` với 4 trạng thái viền Catppuccin.- Viết Unit Test cho `VideoImageProvider`.                                                                                  | Hiển thị stream camera trên QML Canvas đạt 30-60 FPS; viền oval đổi màu mượt.         |
| **Phase 2 (Kiosk Controller)**     | `feature/kiosk-qml-viewmodel`   | - Hoàn thiện`KioskViewModel` (`kiosk_view_model.py`) kết nối `CameraWorker`, `YuNetFaceDetector`, `MiniFASNetLivenessGate`.- Tích hợp Cooldown và máy trạng thái viền oval.- Viết Unit Test cho `KioskViewModel`.                                                                             | Nhận diện mặt và cập nhật trạng thái viền oval hoàn toàn tự động qua Signals.         |
| **Phase 3 (Virtual Dialogs)**      | `feature/kiosk-qml-dialogs`     | - Xây dựng`VirtualKeypad.qml` + `PinDialog.qml` kết nối `PinController`.- Xây dựng `EnrollmentDialog.qml` kết nối `EnrollmentController`.- Viết Unit Test cho `PinController` và `EnrollmentController`.                                                                                      | Bàn phím số phản hồi nhạy trên cảm ứng; quy trình OTP 3 bước hoạt động chuẩn.         |
| **Phase 4 (App Assembly & Clean)** | `feature/kiosk-qml-integration` | - Chuyển đổi`main.py` sang `QQmlApplicationEngine` nạp `ui/qml/main.qml`.- Dọn dẹp toàn bộ legacy widgets trong `ui/views/` và `ui/widgets/`.- Chạy toàn bộ test suite và xác nhận CI/CD xanh 100%.                                                                                           | Kiosk App khởi động thuần QML < 1.5s; 0 cảnh báo ruff; code gọn gàng, đúng chuẩn MVC. |
