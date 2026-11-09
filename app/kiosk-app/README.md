# Phân hệ Trạm Điểm danh Kiosk Desktop (`kiosk-app`)

> **Mã phân hệ:** `SVC-KSK`  
> **Cấp độ không gian:** Child Service Workspace  
> **Đường dẫn:** `app/kiosk-app`  
> **Không gian cha:** [`app/README.md`](../README.md)  
> **Trách nhiệm cốt lõi (Single Responsibility):** Điểm danh khuôn mặt không chạm thời gian thực (FPS $\ge 15$), chống giả mạo Liveness, đối sánh vector ArcFace trong RAM Gallery ($\le 350\text{ ms}$), hỗ trợ bàn phím PIN ảo và lưu đệm SQLite ngoại tuyến khi mất mạng.

---

## 1. Mục đích & Vai trò Kỹ thuật

Trạm Kiosk là ứng dụng máy tính để bàn (Desktop Application) chạy độc lập tại sảnh cơ quan/doanh nghiệp:
* **Hiển thị giao diện**: PySide6 (Qt Quick / QML Scene Graph) theo chuẩn màn hình đứng Portrait 9:16 ($1080 \times 1920\text{ px}$), tự động cố định kích thước cửa sổ theo màn hình.
* **Pipeline Thị giác Biên (Edge AI)**:
  1. Phát hiện khuôn mặt: **YuNet ONNX** (OpenCV Zoo 2023).
  2. Cổng chống giả mạo: **MiniFASNet Liveness Gate ONNX** (ngưỡng $\ge 0.85$).
  3. Trích xuất đặc trưng: **ArcFace MobileFaceNet ONNX** (vector 512D chuẩn hóa L2).
  4. Đối sánh Cosine Similarity trên bộ nhớ đệm RAM (`GalleryCacheManager`).
* **Đệm ngoại tuyến**: Hàng đợi **SQLite WAL** (`offline_punches`), đảm bảo điểm danh trơn tru ngay cả khi đứt cáp mạng LAN, tự động đồng bộ bù qua STOMP / REST khi phục hồi.

---

## 2. Bản đồ Cấu trúc Nội bộ (Internal Layout)

| Thư mục / Tệp | Loại tài nguyên | Trách nhiệm chi tiết |
|:---|:---|:---|
| [`main.py`](main.py) | Python Entrypoint | Khởi tạo Qt QML Engine, kết nối luồng Camera, AI models, SQLite và hiển thị cửa sổ cố định |
| [`src/core/`](src/core/) | Core Logic | Thuật toán AI (`vision/`), Cooldown Tracker (`cooldown/`), CSDL SQLite (`offline/`), Mã PIN (`security/`) |
| [`src/presentation/`](src/presentation/) | MVC Presentation | ViewModels (`kiosk_view_model.py`), Controllers (`pin_controller.py`, `enrollment_controller.py`) |
| [`src/network/`](src/network/) | Network Layer | HTTP REST Client (`http_client.py`), WebSocket STOMP Worker (`stomp_worker.py`) |
| [`resources/qml/`](resources/qml/) | QML UI | Toàn bộ giao diện QML: `main.qml`, `theme/Theme.qml`, `components/`, `dialogs/` |
| [`resources/assets/`](resources/assets/) | Assets & Models | Nơi lưu trữ 3 mô hình ONNX (`models/`), âm thanh phản hồi (`sounds/`), icons (`icons/`) |
| [`tests/`](tests/) | Unit Test Suite | 207 Unit tests và State machine tests in-process của Kiosk (chạy độc lập không cần webcam) |

---

## 3. Hướng dẫn Khởi chạy & Tham số Dòng lệnh (Running Guide)

Kiosk App luôn mặc định khởi chạy ở **chế độ cửa sổ cố định chuẩn tỷ lệ dọc 9:16** (khóa `min_size == max_size` để không bị kéo dãn méo hình).

```bash
python app/kiosk-app/main.py [CÁC CỜ TÙY CHỌN]
```

### Ma trận Tham số Dòng lệnh Chi tiết:
| Tham số | Ý nghĩa & Hành vi hệ thống | Tình huống sử dụng |
|:---|:---|:---|
| **`--prod`** | **Chế độ Sản xuất (Production Clean)**: Giao diện sạch sẽ, kiểm soát Liveness thực ($\ge 0.85$), khóa toàn bộ phím tắt mô phỏng | Chạy trên trạm Kiosk thực tế cho nhân viên điểm danh |
| **`--dev`** | **Chế độ Phát triển (Dev Mode)**: Bật phím tắt mô phỏng (`Space`, `0`, `1`), hiển thị mã OTP mẫu `482619` | Lập trình viên kiểm thử tính năng |
| **`--no-camera`** | Không kết nối webcam vật lý (dùng ảnh đen + phím `Space` mô phỏng) | Máy tính không có camera hoặc đang bận camera |
| **`--no-liveness`** | Bỏ qua AI chống giả mạo `MiniFASNet` | Cho phép test nhận diện nhanh bằng ảnh chụp điện thoại / video |
| **`--liveness-threshold <FLOAT>`** | Tùy chỉnh ngưỡng đánh giá người thật (ví dụ: `--liveness-threshold 0.70`, mặc định: `0.85`) | Kiểm thử trong điều kiện ánh sáng yếu hoặc camera mờ |
| **`--demo-enroll <EMP_ID>`** | Tự động quét mặt người đang ngồi trước camera và nạp ngay vào RAM với mã NV chỉ định | Đăng ký nhanh khuôn mặt để thử điểm danh ngay |
| **`--demo`** | Cờ gộp: Tự động kích hoạt đồng thời `--dev` và `--no-liveness` | Trình diễn demo tính năng cho khách hàng xem |

### Bảng Phím tắt Thao tác Nhanh trên Giao diện Kiosk:
| Phím tắt | Chức năng | Chế độ khả dụng |
|:---:|:---|:---:|
| **`F1`** | Mở Hộp thoại Hướng dẫn sử dụng trạm (`HelpDialog`) | Mọi chế độ |
| **`F2`** | Mở Bàn phím số PIN dự phòng (`PinDialog`) | Mọi chế độ |
| **`F3`** | Mở Quy trình 3 bước Đăng ký khuôn mặt mới (`EnrollmentDialog`) | Mọi chế độ |
| **`Esc`** | Đóng toàn bộ Dialogs đang mở và hủy quy trình đăng ký dở dang | Mọi chế độ |
| **`Space`** | **Giả lập quét mặt thành công** (hoặc chụp pose tiếp theo khi đăng ký) | **Chỉ Dev Mode** |
| **`0`** | Chuyển máy trạng thái giao diện về màn hình chờ chào mừng (`STANDBY`) | **Chỉ Dev Mode** |
| **`1`** | Chuyển máy trạng thái giao diện sang chế độ quét camera (`ACTIVE`) | **Chỉ Dev Mode** |

---

## 4. Kiểm thử & Đảm bảo Chất lượng (Testing)

Thư mục `tests/` bên trong phân hệ này chỉ lưu trữ **Unit Tests & Component State Machine**:

```bash
# Chạy toàn bộ 207 Unit Tests của Kiosk (thời gian ~6 giây)
cd app/kiosk-app && python -m pytest tests/ -v

# Chạy riêng kiểm thử máy trạng thái Oval 4 màu & PIN Lockout 15 phút
python -m pytest tests/test_ui_ux.py -v
```

> **Lưu ý kiểm thử cấp hệ thống:** Các bài kiểm thử trực quan và tự động hóa hệ điều hành được quy tụ tại thư mục gốc:
> * Kiểm thử Hồi quy thị giác & Ma trận tỷ lệ (76 tests): [`tests/visual/`](../../tests/visual/)
> * Tự động hóa E2E Desktop UIA3 (FlaUI CLI): [`tests/e2e/desktop/`](../../tests/e2e/desktop/)
> * Báo cáo và kho ảnh kết xuất: [`reports/`](../../reports/)

---

## 5. Chính sách Dữ liệu & Quy tắc Git (Data & Git Policy)

* **Tài nguyên theo dõi (Tracked)**: Mã nguồn Python `src/`, mã nguồn QML `resources/qml/`, các test cases `tests/`, và cấu hình `pyproject.toml`.
* **Tài nguyên bỏ qua (Ignored 100%)**:
  * Trọng số mô hình AI: `resources/assets/models/*.onnx` (tải qua `scripts/setup/download_kiosk_models.py`).
  * CSDL runtime: `*.db`, `*.db-wal`, `*.db-shm` (lưu tại `data/`).
  * Cache & môi trường ảo: `.venv/`, `__pycache__/`, `.pytest_cache/`, `.coverage`.
