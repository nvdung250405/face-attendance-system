# Kế Hoạch Chuyển Đổi Tách Biệt Giao Diện Kiosk App (QML / PySide6)

> **Tài liệu tham chiếu:**
> - [DDS.md](file:///d:/workspace/VSCode/nvdung/face-attendance-system/docs/architecture/DDS.md) (Mục 2.1 & Mục 3.5 - Máy trạng thái viền oval 4 màu & kiến trúc Kiosk biên)
> - [BP-KIOSK-01](file:///d:/workspace/VSCode/nvdung/face-attendance-system/app/kiosk-app/docs/planning/BP-KIOSK-01.md) (Quy hoạch phân hệ Kiosk)
> - Mô hình so sánh: **QML (Qt Quick)** tương đương **FXML (JavaFX)** & **XAML (WPF)**.

---

## 1. Mục Tiêu & Lợi Ích Của QML (Qt Quick)

### 1.1. Bối Cảnh Hiện Tại
- Hiện tại, giao diện Kiosk Desktop đang được xây dựng bằng **PySide6 Widgets thuần** (`QWidget`, `QPainter`, `QDialog`, `QVBoxLayout` trong code Python).
- Mã nguồn Python vừa phải đảm nhiệm logic nghiệp vụ (Inference ONNX, REST API, SQLite WAL, Cooldown Tracker) vừa phải kiêm nhiệm layout, font, style, canh tọa độ pixel.

### 1.2. Lợi Ích Khi Tách Sang QML (Tương Tự FXML / JavaFX)
1. **Phân tách rạch ròi 100% UI & Business Logic**:
   - **Frontend UI (`.qml`)**: Khai báo cây phần tử phân cấp trực quan bằng ngôn ngữ QML (kết hợp JSON-like + CSS + JavaScript inline cho visual state). Designer/Front-end có thể chỉnh sửa layout, animation, hiệu ứng bo tròn, màu sắc Catppuccin độc lập.
   - **Backend Service (`.py`)**: Đóng vai trò Controller/ViewModel (`QObject` với các `@Property`, `@Signal`, `@Slot`), chỉ thuần tính toán toán học, thị giác máy tính và giao thức mạng.
2. **Hiệu năng GPU vượt trội (Hardware Acceleration)**:
   - PySide6 Widgets vẽ chủ yếu bằng CPU (`QPainter` phần mềm).
   - QML (Qt Quick 2) dựng hình hoàn toàn qua **Qt Scene Graph (Direct3D 11/12 trên Windows, Metal trên macOS, Vulkan/OpenGL trên Linux)**, giúp viền oval đổi màu, hiệu ứng pulse, camera stream 60 FPS cực mượt mà không làm nghẽn CPU inference AI.
3. **Responsive & Scalable Screen**:
   - Dễ dàng thích ứng từ màn hình Kiosk cảm ứng dạng đứng (Portrait 1080x1920) sang dạng ngang (Landscape 1920x1080) nhờ hệ thống `Anchors`, `Layouts` tương tự Flexbox của Web.

---

## 2. Kiến Trúc Tương Tác QML <-> Python (Mô Hình MVVM)

```
+--------------------------------------------------------------------------------+
|                        TẦNG TRÌNH DIỄN (QML - Qt Quick)                        |
|                                                                                |
|  +---------------------------+  +-------------------+  +--------------------+  |
|  |     LiveCanvas.qml        |  |  PinDialog.qml    |  |EnrollmentDialog.qml|  |
|  |  (Video/Image Provider,   |  | (Bàn phím số ảo,  |  | (Form nạp OTP,     |  |
|  |   Oval Canvas/Shader,     |  |  hiệu ứng bấm)    |  |  hướng dẫn 3 góc)  |  |
|  |   Catppuccin Theme)       |  +-------------------+  +--------------------+  |
|  +---------------------------+                                                 |
+---------------------------------------^----------------------------------------+
                                        | (Signals, Slots, Context Properties)
+---------------------------------------v----------------------------------------+
|                      TẦNG KẾT NỐI PYTHON (QObject / Controllers)               |
|                                                                                |
|  +--------------------------------+       +---------------------------------+  |
|  |       KioskViewModel           |       |      QQuickImageProvider        |  |
|  |  - @Property: ovalState        |       |  (Stream frame camera RGB BGR   |  |
|  |  - @Property: statusMessage    |       |   từ OpenCV sang QML Image mà   |  |
|  |  - @Signal: attendanceSuccess  |       |   không cần copy memory thừa)   |  |
|  |  - @Slot: onPinEntered()       |       +---------------------------------+  |
|  |  - @Slot: onEnrollRequested()  |                                            |
|  +--------------------------------+                                            |
+---------------------------------------^----------------------------------------+
                                        |
+---------------------------------------v----------------------------------------+
|                   TẦNG LÕI NGHIỆP VỤ BIÊN (Pure Python Engine)                |
|  - YuNetFaceDetector (OpenCV DNN)                                              |
|  - MiniFASNetLivenessGate (ONNX Runtime)                                      |
|  - CooldownTracker & SQLiteQueueManager (WAL)                                 |
|  - OfflineSyncWorker (HTTPX REST Sync)                                        |
+--------------------------------------------------------------------------------+
```

---

## 3. Cấu Trúc Thư Mục Mục Tiêu

```
app/kiosk-app/
├── ui/
│   ├── qml/                         # [MỚI] Toàn bộ mã nguồn giao diện tách biệt
│   │   ├── main.qml                 # Cửa sổ chính Kiosk KioskWindow
│   │   ├── components/              # Các UI Component tái sử dụng
│   │   │   ├── LiveCanvas.qml       # Video frame + Viền Oval 4 màu (Canvas/Shader)
│   │   │   ├── OvalOverlay.qml      # Lớp phủ mờ khoét lỗ oval + 4 góc corner guides
│   │   │   ├── StatusBadge.qml      # Thẻ thông báo trạng thái bo góc
│   │   │   └── VirtualKeypad.qml    # Bàn phím số ảo PIN
│   │   ├── dialogs/                 # Các hộp thoại phụ trợ
│   │   │   ├── PinDialog.qml        # Hộp thoại quẹt mã PIN khi rơi vào fallback
│   │   │   └── EnrollmentDialog.qml # Hộp thoại đăng ký nhân viên mới qua OTP
│   │   ├── theme/                   # Bảng màu và phong cách chuẩn
│   │   │   ├── Theme.qml            # Bảng màu Catppuccin Mocha, kích thước font
│   │   │   └── qmldir               # Khai báo module theme
│   ├── controllers/                 # [MỚI] Tầng ViewModel / QObject Controller
│   │   ├── __init__.py
│   │   ├── kiosk_view_model.py      # ViewModel quản lý state, message, cooldown
│   │   ├── pin_controller.py        # Controller bàn phím PIN ảo
│   │   ├── enrollment_controller.py # Controller quy trình Self-Enrollment
│   │   └── video_image_provider.py  # QQuickImageProvider truyền frame camera siêu tốc
│   └── views/                       # (Legacy PySide6 Widgets - duy trì cho đến khi test hoàn tất)
```

---

## 4. Kế Hoạch Triển Khai Từng Giai Đoạn (Phased Roadmap)

| Giai Đoạn | Tên Nhánh Git Dự Kiến | Nhiệm Vụ Chi Tiết | Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria) |
|---|---|---|---|
| **Phase 1** | `feature/kiosk-qml-foundation` | - Xây dựng `QQuickImageProvider` (`video_image_provider.py`) để pipe khung hình OpenCV BGR trực tiếp vào QML mà không suy giảm FPS.<br>- Thiết lập `Theme.qml` với đầy đủ màu sắc Catppuccin Mocha (Base, Surface, Accent Oval 4 màu).<br>- Tạo `LiveCanvas.qml` với cơ chế vẽ Oval động (QML Canvas hoặc Shader Effect). | Luồng camera hiển thị mượt 30 FPS trên QML; viền oval co giãn chuẩn theo tỷ lệ màn hình; đạt 0 lỗi Ruff. |
| **Phase 2** | `feature/kiosk-qml-viewmodel` | - Viết `KioskViewModel` (`QObject`) chứa các `@Property`: `ovalState`, `guideMessage`, `isProcessing`.<br>- Kết nối các pipeline AI (`YuNet`, `MiniFASNet`) đẩy kết quả qua `@Signal` cho QML cập nhật viền oval 4 màu theo đúng máy trạng thái. | Máy trạng thái viền oval phản hồi tức thì (`IDLE` -> `ALIGNING` -> `SUCCESS` / `ERROR`) với thời gian phản hồi < 100ms. |
| **Phase 3** | `feature/kiosk-qml-dialogs` | - Chuyển đổi `VirtualPinDialog` sang `PinDialog.qml` + `VirtualKeypad.qml` với hiệu ứng xúc giác (click animation).<br>- Chuyển đổi `EnrollmentDialog` sang `EnrollmentDialog.qml` với thanh tiến trình bước chụp và ô nhập mã PIN/OTP trực quan. | Bàn phím số phản hồi mượt trên màn hình cảm ứng; form OTP validate theo thời gian thực; đóng mở popup không giật lag. |
| **Phase 4** | `feature/kiosk-qml-integration` | - Thay thế điểm khởi chạy trong `main.py` từ `QApplication` + `MainWindow` sang `QGuiApplication` + `QQmlApplicationEngine`.<br>- Hỗ trợ tham số `--windowed` / `--fullscreen`.<br>- Viết trọn bộ unit tests cho các Controller/ViewModel mới. | 100% test cases (cũ & mới) vượt qua; ứng dụng khởi động trong < 1.5 giây; bộ nhớ RAM ổn định. |

---

## 5. Bản Thiết Kế QML Mẫu Minh Họa (Design Prototype)

### 5.1. `Theme.qml` (Thiết lập màu sắc Catppuccin tập trung)
```qml
pragma Singleton
import QtQuick 2.15

QtObject {
    readonly property color baseColor: "#11111B"
    readonly property color mantleColor: "#181825"
    readonly property color surfaceColor: "#313244"
    readonly property color textPrimary: "#CDD6F4"
    readonly property color textSecondary: "#BAC2DE"
    
    // Oval 4 States
    readonly property color ovalIdle: "#6C7086"       // Xám
    readonly property color ovalAligning: "#F9E2AF"   // Vàng
    readonly property color ovalSuccess: "#A6E3A1"    // Xanh lá
    readonly property color ovalError: "#F38BA8"      // Đỏ hồng
}
```

### 5.2. `LiveCanvas.qml` (Canvas hiển thị video và viền Oval thông minh)
```qml
import QtQuick 2.15
import QtQuick.Shapes 1.15
import "theme"

Item {
    id: root
    property string stateColor: Theme.ovalIdle
    property string instructionText: "Vui lòng nhìn thẳng vào camera"

    // 1. Luồng video từ QQuickImageProvider
    Image {
        id: cameraFeed
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        source: "image://camera/live"
        cache: false
    }

    // 2. Lớp phủ tối mờ khoét lỗ Oval trung tâm
    Canvas {
        id: ovalOverlay
        anchors.fill: parent
        onPaint: {
            var ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);
            
            // Vẽ toàn màn hình màu tối
            ctx.fillStyle = "rgba(17, 17, 27, 0.55)";
            ctx.fillRect(0, 0, width, height);
            
            // Khoét lỗ Oval
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            var cx = width / 2;
            var cy = height * 0.44;
            var rx = Math.min(width * 0.22, 210);
            var ry = Math.min(height * 0.35, 280);
            ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
            ctx.fill();
            
            // Vẽ viền Oval màu trạng thái
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath();
            ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
            ctx.lineWidth = 5;
            ctx.strokeStyle = root.stateColor;
            ctx.stroke();
        }
    }
}
```

---

## 6. Đánh Giá Khả Thi & Rủi Ro (Risk Assessment)

1. **Truyền khung hình Video (High FPS)**:
   - *Rủi ro*: Truyền chuỗi byte qua lại giữa C++/Python và QML có thể gây quá tải bộ nhớ nếu ép kiểu `base64`.
   - *Giải pháp*: Kế thừa `QQuickImageProvider(QQuickImageProvider.Pixmap)` đọc trực tiếp con trỏ vùng nhớ `QImage` không cần serialize chuỗi.
2. **Tính liên tục của dự án**:
   - Kiến trúc module hóa giúp toàn bộ các thư viện lõi AI (`YuNet`, `MiniFASNet`, `SQLite WAL`) hoàn toàn giữ nguyên, chỉ thay đổi lớp hiển thị trên cùng.
