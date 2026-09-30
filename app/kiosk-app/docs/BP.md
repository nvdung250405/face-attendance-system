# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
> - **Mã tài liệu**: BP-KIOSK-01
> - **Tên tài liệu**: Kế hoạch xây dựng phần mềm — Phân hệ Trạm Điểm danh Kiosk Desktop (Kiosk Build Plan)
> - **Phiên bản**: 1.0
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: nvdung
> - **Ngày hiệu lực**: 2026-09-30
> - **Tài liệu liên quan**: [README.md](../../../docs/README.md), [BP.md](../../../docs/planning/BP.md), [DDS.md](../../../docs/design/DDS.md), [FR.md](../../../docs/requirements/FR.md), [SRS.md](../../../docs/requirements/SRS.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-09-30)*: Xây dựng hoàn chỉnh kế hoạch xây dựng chi tiết cho phân hệ Kiosk Desktop App (Pipeline thị giác máy tính YuNet + MiniFASNet + ArcFace, cơ chế hàng đợi ngoại tuyến SQLite WAL, giao diện PySide6 và quy trình đóng gói file thực thi độc lập).

---

## BP — Kế hoạch xây dựng phần mềm

**1. Cơ sở & Phạm vi xây dựng**

- 1.1. Phạm vi xây dựng
  - Kế hoạch này xác định toàn bộ nhiệm vụ kỹ thuật, cấu trúc phân rã module, quy chuẩn lập trình, quy trình kiểm thử và chiến lược đóng gói phần mềm cho phân hệ **Trạm Điểm danh Kiosk Desktop (`app/kiosk-app`)**.
  - Phân hệ Kiosk vận hành dưới dạng ứng dụng máy trạm (Desktop Client) độc lập chạy trực tiếp trên thiết bị biên (Edge Hardware), kết nối với camera vật lý và thực hiện tính toán AI cục bộ trên CPU.
  - Phạm vi bao phủ trực tiếp 6 yêu cầu chức năng cốt lõi được đặc tả trong [FR.md](../../../docs/requirements/FR.md):
    - `FR-01` (Điểm danh Nhận diện Khuôn mặt): Pipeline nhận diện thời gian thực qua OpenCV, YuNet, ArcFace và ma trận so khớp Cosine NumPy.
    - `FR-02` (Kiểm tra Thực thể sống Liveness): Lọc ảnh giả mạo (Presentation Attack) thụ động qua MiniFASNet với ngưỡng chặn $S_{\text{liveness}} \ge 0.85$.
    - `FR-03` (Chống Quẹt Trùng Lặp Cooldown): Bộ đệm ghi nhớ mốc thời gian quét tại biên, từ chối lượt quẹt dồn dập trong vòng 120 giây.
    - `FR-04` (Điểm danh Dự phòng bằng Mã PIN): Bàn phím số ảo PIN Pad trên màn hình cảm ứng, tự động khóa 15 phút nếu nhập sai quá 5 lần.
    - `FR-05` (Điểm danh Ngoại tuyến & Đồng bộ Bù): Hàng đợi dữ liệu bền vững trên SQLite chế độ Write-Ahead Logging (WAL), tự động đồng bộ bù khi có mạng.
    - `FR-09` (Đăng ký Khuôn mặt Mới tại Trạm): Tiếp nhận mã OTP 6 số từ Cổng Web, kiểm chuẩn chất lượng hình ảnh và trích xuất vector 512D gửi về Backend.

- 1.2. Thành phần / module cần xây dựng
  - Bảng tổng hợp chi tiết các lớp và module cấu thành mã nguồn `app/kiosk-app`:

| Gói Mã nguồn (Package) | Tên Tệp (File) | Tên Lớp / Thành phần (Class/Component) | Trách nhiệm Kỹ thuật Cụ thể |
| :--- | :--- | :--- | :--- |
| **`core.vision`** | `camera_worker.py` | `CameraWorker (QThread)` | Đọc luồng video từ webcam qua OpenCV DirectShow, phát tín hiệu `frame_ready(np.ndarray)` với tốc độ $\ge 15\text{ FPS}$. |
| | `face_detector.py` | `YuNetFaceDetector` | Nạp mô hình ONNX YuNet, phát hiện khuôn mặt, lọc diện tích $\ge 120\times 120\text{ px}$, tính góc quay Euler (Yaw, Pitch, Roll $\le 15^\circ$). |
| | `liveness_gate.py` | `MiniFASNetLivenessGate` | Nạp mô hình ONNX MiniFASNet, crop vùng mặt tỷ lệ 1.5x, tính xác suất thực thể sống $S_{\text{liveness}} \in [0.0, 1.0]$. |
| | `feature_extractor.py` | `ArcFaceFeatureExtractor` | Nạp mô hình ONNX ArcFace MobileFaceNet, căn chỉnh Affine 5 điểm mốc về $112\times 112\text{ px}$, trích xuất vector 512D chuẩn hóa L2 Norm. |
| | `gallery_matcher.py` | `GalleryCacheManager` | Duy trì ma trận RAM $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32`, tính tích vô hướng Cosine $\vec{s} = \vec{u} \cdot \mathbf{M}^T$, xác định nhân viên khớp ngưỡng $\ge 0.50$. |
| **`core.offline`** | `sqlite_manager.py` | `SQLiteQueueManager` | Quản lý kết nối `kiosk_local.db` chế độ WAL, thực thi `enqueue_punch()`, `get_unsynced_punches()`, `mark_as_synced()`. |
| | `sync_worker.py` | `OfflineSyncWorker (QThread)` | Luồng ngầm định kỳ 10s ping máy chủ; khi có mạng, đọc lô 50 bản ghi ngoại tuyến gửi lên REST API `/api/v1/kiosk/sync-batch`. |
| **`network`** | `http_client.py` | `KioskHttpClient` | Đóng gói thư viện `httpx` gửi các request REST API (`/punch`, `/sync-batch`, `/verify-otp`, `/enroll-face`) đính kèm token xác thực. |
| | `stomp_subscriber.py`| `KioskStompWorker (QThread)` | Kết nối WebSocket STOMP tới Backend qua `stomp.py`, lắng nghe topic `/topic/kiosk-gallery` để nạp nóng vector mới vào RAM. |
| **`ui`** | `main_window.py` | `MainWindow (QMainWindow)` | Cửa sổ ứng dụng chính, quản lý bố cục Video Canvas, Header (logo, đồng hồ), Footer (nút F2/F3), thanh trạng thái kết nối mạng. |
| | `widgets/live_canvas.py`| `LiveCanvasWidget (QWidget)` | Vẽ luồng video trực tiếp, vẽ viền oval định vị động đổi 4 màu theo trạng thái (Xám, Vàng, Xanh lá, Đỏ). |
| | `views/pin_dialog.py` | `VirtualPinDialog (QDialog)` | Bàn phím số ảo cảm ứng phục vụ điểm danh mã PIN dự phòng, cơ chế khóa 15 phút chống brute-force. |
| | `views/enrollment_dialog.py`| `EnrollmentDialog (QDialog)` | Hộp thoại tiếp nhận mã OTP 6 số, hướng dẫn người dùng giữ thẳng mặt và hiển thị tiến trình quét mặt chuẩn hóa. |
| **`config`** | `settings.py` | `KioskConfig` | Đọc cấu hình từ biến môi trường `.env`, định nghĩa các hằng số ngưỡng AI và đường dẫn tệp trọng số mô hình. |

- 1.3. Cơ sở thiết kế
  - Kế hoạch xây dựng phân hệ Kiosk kế thừa trực tiếp từ:
    - [DDS.md](../../../docs/design/DDS.md): Kiến trúc tầng biên (Mục 2.1), quy trình pipeline thị giác 5 bước (Mục 3.2), sơ đồ sequence điểm danh trực tuyến và ngoại tuyến (Mục 3.3), thiết kế giao diện PySide6 và máy trạng thái viền oval 4 màu (Mục 3.5), quyết định `DEC-02` (AI CPU-only), `DEC-04` (SQLite WAL).
    - [FR.md](../../../docs/requirements/FR.md): Đặc tả tiêu chí chấp nhận cho 6 yêu cầu `FR-01`, `FR-02`, `FR-03`, `FR-04`, `FR-05`, `FR-09`.
    - [SRS.md](../../../docs/requirements/SRS.md): Cam kết hiệu năng thời gian đáp ứng $\le 350\text{ ms}$, RPO = 0, tỷ lệ liveness $\ge 98\%$.
    - [BP.md](../../../docs/planning/BP.md): Kế hoạch xây dựng Monorepo cấp dự án.

- 1.4. Yêu cầu kỹ thuật cần tuân thủ
  - **Giới hạn Tài nguyên & Hiệu năng**:
    - Tốc độ xử lý hình ảnh camera đạt tối thiểu **15 FPS** (khuyến nghị 30 FPS).
    - Tổng thời gian hoàn tất chu kỳ nhận diện (Phát hiện + Liveness + Trích xuất + So khớp RAM) đạt **$\le 350\text{ ms}$ trên CPU thuần**, không bắt buộc card đồ họa rời GPU.
    - Bộ nhớ RAM ứng dụng tiêu thụ không vượt quá **300 MB** cho danh mục 1,000 nhân sự.
  - **Miễn nhiễm Rò rỉ Bộ nhớ (Zero Memory Leak)**:
    - Giải phóng hoàn toàn các mảng NumPy khung hình ảnh camera và ma trận điểm ảnh khuôn mặt ngay sau mỗi chu kỳ suy luận; không tích lũy frame trong RAM.
  - **Tách biệt Luồng Giao diện (GUI Thread Isolation)**:
    - Toàn bộ tác vụ nặng (đọc camera, suy luận ONNX, đọc/ghi SQLite, gọi mạng HTTP/STOMP) bắt buộc chạy trong các luồng riêng biệt (`QThread`), tuyệt đối không được làm đơ hay giật lag luồng giao diện người dùng chính (`Main GUI Thread`).
  - **Chi phí Phần mềm**: 0 VNĐ, sử dụng 100% mã nguồn mở.

---

**2. Môi trường & Mã nguồn**

- 2.1. Repository & cấu trúc source code
  - Cấu trúc thư mục mã nguồn chi tiết của phân hệ `app/kiosk-app`:

```text
app/kiosk-app/
├── assets/                                # Tài nguyên tĩnh
│   ├── icons/                             # Biểu tượng trạng thái mạng, nút bấm, logo
│   │   ├── logo.png
│   │   ├── online.png
│   │   └── offline.png
│   ├── models/                            # Tệp trọng số mô hình ONNX (Git ignored nếu dung lượng lớn)
│   │   ├── yunet.onnx                     # Mô hình phát hiện khuôn mặt (~230 KB)
│   │   ├── minifasnet.onnx                # Mô hình kiểm tra liveness (~1.8 MB)
│   │   └── arcface_mobilefacenet.onnx     # Mô hình trích xuất vector 512D (~4.8 MB)
│   └── sounds/                            # Âm thanh phản hồi tương tác
│       ├── beep_success.wav               # Tiếng "Tít" thành công
│       └── beep_error.wav                 # Tiếng bíp cảnh báo lỗi
├── core/                                  # Nghiệp vụ xử lý cốt lõi
│   ├── __init__.py
│   ├── vision/                            # Pipeline thị giác máy tính
│   │   ├── __init__.py
│   │   ├── camera_worker.py               # QThread đọc khung hình OpenCV DirectShow
│   │   ├── face_detector.py               # Lớp YuNetFaceDetector (ONNX)
│   │   ├── liveness_gate.py               # Lớp MiniFASNetLivenessGate (ONNX)
│   │   ├── feature_extractor.py           # Lớp ArcFaceFeatureExtractor (ONNX)
│   │   └── gallery_matcher.py             # Lớp GalleryCacheManager (NumPy Cosine)
│   ├── offline/                           # Lưu trữ đệm ngoại tuyến
│   │   ├── __init__.py
│   │   ├── sqlite_manager.py              # Quản lý SQLite WAL kiosk_local.db
│   │   └── sync_worker.py                 # QThread đồng bộ dữ liệu bù định kỳ 10s
│   └── cooldown/                          # Quản lý chống quẹt lặp
│       ├── __init__.py
│       └── cooldown_tracker.py            # Bộ nhớ đệm Cooldown 120s tại biên
├── network/                               # Tầng giao tiếp mạng
│   ├── __init__.py
│   ├── http_client.py                     # Client gửi REST API (httpx)
│   └── stomp_subscriber.py                # QThread nhận sự kiện nạp vector WebSocket STOMP
├── ui/                                    # Tầng giao diện người dùng PySide6
│   ├── __init__.py
│   ├── main_window.py                     # Cửa sổ chính MainWindow
│   ├── widgets/                           # Custom Widgets
│   │   ├── __init__.py
│   │   ├── live_canvas.py                 # LiveCanvasWidget viền oval đổi 4 màu
│   │   └── header_bar.py                  # Thanh tiêu đề: Logo, đồng hồ, network status
│   └── views/                             # Các hộp thoại chức năng
│       ├── __init__.py
│       ├── pin_dialog.py                  # Bàn phím số ảo điểm danh mã PIN dự phòng
│       └── enrollment_dialog.py           # Hộp thoại hướng dẫn đăng ký mặt bằng OTP
├── config/                                # Cấu hình ứng dụng
│   ├── __init__.py
│   └── settings.py                        # Đọc biến môi trường và thiết lập hằng số
├── tests/                                 # Bộ kiểm thử tự động
│   ├── __init__.py
│   ├── test_face_detector.py              # Test phát hiện khuôn mặt & góc quay
│   ├── test_liveness_gate.py              # Test phát hiện giả mạo
│   ├── test_gallery_matcher.py            # Test so khớp ma trận NumPy Cosine
│   └── test_sqlite_manager.py             # Test ghi đệm và đồng bộ SQLite WAL
├── docs/                                  # Tài liệu chuyên sâu phân hệ Kiosk
│   ├── BD.md                              # Kế hoạch xây dựng chi tiết Kiosk (Tài liệu này)
│   └── TP.md                              # Kế hoạch & Bộ ca kiểm thử chi tiết Kiosk
├── .venv/                                 # Môi trường ảo Python (Git ignored)
├── requirements.txt                       # Danh mục 20 thư viện Python ghim phiên bản
└── main.py                                # Điểm khởi động ứng dụng Kiosk
```

- 2.2. Môi trường phát triển
  - **Python Runtime**: Python 3.14.3 (Bản cài đặt Windows CPython 64-bit chuẩn `win_amd64` điều phối qua `py` launcher).
  - **Môi trường ảo (Virtualenv)**: Được khởi tạo tại thư mục `app/kiosk-app/.venv` sử dụng cấu trúc Windows (`Include`, `Lib`, `Scripts\Activate.ps1`).
  - **Phần cứng Camera**: Webcam tích hợp trên máy trạm hoặc camera USB chuẩn UVC, độ phân giải khuyến nghị $1280 \times 720\text{ @ 30 FPS}$.
  - **Trình điều khiển nền tảng**: Sử dụng backend `cv2.CAP_DSHOW` (DirectShow) trên Windows để giảm độ trễ đệm khung hình xuống mức tối thiểu ($< 15\text{ ms}$).

- 2.3. Công cụ & dependency
  - Danh mục 20 thư viện Python chuẩn mực được khóa phiên bản trong `requirements.txt`:
    - `PySide6==6.11.2`, `PySide6_Addons==6.11.2`, `PySide6_Essentials==6.11.2`, `shiboken6==6.11.2`: Khung giao diện đồ họa GUI Qt6.
    - `opencv-python-headless==5.0.0.93`: Xử lý ảnh số, đọc camera, biến đổi hình học Affine.
    - `onnxruntime==1.30.0`: Công cụ thực thi suy luận mô hình AI tối ưu hóa CPU với tập lệnh AVX2.
    - `numpy==2.5.3`: Tính toán ma trận số học và tích vô hướng Cosine Similarity 1:N.
    - `httpx==0.28.1`, `httpcore==1.0.9`, `anyio==4.15.1`, `certifi==2026.7.22`, `h11==0.16.0`, `idna==3.20`: Thư viện gửi HTTP REST API.
    - `stomp.py==9.0.0`, `websocket-client==1.9.2`, `docopt-ng==0.9.0`: Client giao tiếp WebSocket STOMP.
    - `flatbuffers==25.12.19`, `packaging==26.3`, `protobuf==7.36.2`, `typing_extensions==4.16.0`: Thư viện phụ trợ serialization.
  - **Danh mục Tệp Trọng số Mô hình AI (`assets/models/`)**:
    - `yunet.onnx`: Trọng số mô hình phát hiện khuôn mặt YuNet (OpenCV Zoo).
    - `minifasnet.onnx`: Trọng số mô hình kiểm tra thực thể sống MiniFASNet (Silent-Face-Anti-Spoofing).
    - `arcface_mobilefacenet.onnx`: Trọng số mô hình trích xuất đặc trưng ArcFace MobileFaceNet.

- 2.4. Cấu hình môi trường
  - Phân hệ Kiosk tự động nạp cấu hình từ tệp `.env` tại thư mục gốc monorepo (thông qua `config/settings.py`):
```python
# Cấu hình tham số Kiosk trong config/settings.py
KIOSK_ID = os.getenv("KIOSK_ID", "KIOSK-LOBBY-01")
BACKEND_URL = os.getenv("VITE_API_BASE_URL", "http://localhost:8080/api/v1")
STOMP_WS_URL = os.getenv("VITE_WS_BASE_URL", "ws://localhost:8080/ws")
KIOSK_SECRET_TOKEN = os.getenv("KIOSK_SECRET_TOKEN", "Kiosk_Internal_Secret_Token_2026")

CAMERA_DEVICE_INDEX = int(os.getenv("CAMERA_DEVICE_INDEX", "0"))
CAMERA_FRAME_WIDTH = int(os.getenv("CAMERA_FRAME_WIDTH", "1280"))
CAMERA_FRAME_HEIGHT = int(os.getenv("CAMERA_FRAME_HEIGHT", "720"))

LIVENESS_THRESHOLD = float(os.getenv("LIVENESS_THRESHOLD", "0.85"))
COSINE_SIMILARITY_THRESHOLD = float(os.getenv("COSINE_SIMILARITY_THRESHOLD", "0.50"))
COOLDOWN_SECONDS = int(os.getenv("COOLDOWN_SECONDS", "120"))
```

- 2.5. Khởi tạo & chạy dự án
  - Mở terminal PowerShell tại thư mục `app/kiosk-app`:
    ```powershell
    # 1. Kích hoạt môi trường ảo
    .\.venv\Scripts\Activate.ps1

    # 2. Khởi chạy ứng dụng Kiosk Desktop
    python main.py
    ```

---

**3. Quy trình phát triển**

- 3.1. Branching
  - Chiến lược rẽ nhánh tính năng cho Kiosk từ nhánh `develop`:
    - `feature/kiosk-FR-01-core-vision`: Xây dựng CameraWorker, YuNet và ArcFace extractor.
    - `feature/kiosk-FR-02-liveness`: Tích hợp MiniFASNet anti-spoofing filter.
    - `feature/kiosk-FR-03-cooldown`: Xây dựng module CooldownTracker tại biên.
    - `feature/kiosk-FR-04-pin-fallback`: Xây dựng VirtualPinDialog bàn phím số ảo.
    - `feature/kiosk-FR-05-offline-wal`: Xây dựng SQLiteQueueManager và OfflineSyncWorker.
    - `feature/kiosk-FR-09-self-enrollment`: Xây dựng EnrollmentDialog tiếp nhận OTP.
    - `feature/kiosk-ui-integration`: Tích hợp hoàn chỉnh MainWindow, LiveCanvasWidget viền oval 4 màu, pipeline thị giác và khởi động ứng dụng.

- 3.2. Commit
  - Áp dụng Conventional Commits chuẩn hóa:
    - `feat(kiosk): implement camera worker with directshow backend #FR-01`
    - `feat(kiosk): integrate minifasnet liveness inference with 0.85 threshold #FR-02`
    - `feat(kiosk): implement sqlite wal offline punch queue #FR-05`
    - `fix(kiosk): fix memory leak on opencv frame buffer #FR-01`
    - `test(kiosk): add unit test for cosine similarity matrix matcher #FR-01`

- 3.3. Code → Review → Merge
  - **Self-Review Checklist bắt buộc cho Kiosk**:
    - [ ] Không rò rỉ bộ nhớ (Frame OpenCV được giải phóng ngay sau khi xử lý).
    - [ ] Luồng giao diện chính không bị block (Tất cả tính toán AI chạy trong QThread).
    - [ ] Ngưỡng Liveness được cố định ở mức an toàn $\ge 0.85$.
    - [ ] Đã xử lý trường hợp rút giắc webcam đột ngột (`CAMERA_DISCONNECTED` recovery loop).
    - [ ] Hàng đợi SQLite WAL được commit giao dịch an toàn khi mất mạng.

- 3.4. Coding convention
  - **Python PEP 8**: Thụt lề 4 dấu cách, giới hạn độ dài dòng tối đa 100 ký tự.
  - **Type Hints bắt buộc**: 100% các hàm và phương thức phải có chú thích kiểu dữ liệu:
    ```python
    def match_face(self, query_vector: np.ndarray) -> tuple[Optional[int], float]:
        ...
    ```
  - **Docstrings**: Sử dụng định dạng Google Style Docstrings cho tất cả các lớp và phương thức công khai.

- 3.5. Error handling / logging
  - Sử dụng module chuẩn `logging` kết hợp `RotatingFileHandler`:
    - Tệp log: `logs/kiosk/kiosk_runtime.log`.
    - Giới hạn: Tối đa 10 MB/tệp, lưu xoay vòng tối đa 5 tệp sao lưu (`backupCount=5`).
    - Tuyệt đối cấm sử dụng lệnh `print()` trong mã nguồn hoàn thiện.
    - Cơ chế phục hồi kết nối camera: Khi `cap.read()` trả về `False` liên tiếp 10 lần, tự động kích hoạt vòng lặp `reconnect_camera()` mỗi 3 giây mà không làm sập ứng dụng.

- 3.6. Dependency / configuration management
  - Mọi thư viện mới phải được kiểm tra tính tương thích với Python 3.14 Windows và được ghim chính xác phiên bản vào `requirements.txt`.
  - Trọng số mô hình AI (`.onnx`) được kiểm tra mã băm SHA-256 trước khi tải vào bộ nhớ để đảm bảo tính toàn vẹn.

---

**4. Build & Kiểm soát chất lượng**

- 4.1. Quy trình build
  - **Bước 1 (Kiểm tra cú pháp & Linter)**:
    ```powershell
    ruff check .
    ```
  - **Bước 2 (Chạy bộ kiểm thử tự động)**:
    ```powershell
    pytest tests/ -v
    ```
  - **Bước 3 (Đóng gói tệp thực thi độc lập .exe qua PyInstaller)**:
    ```powershell
    pyinstaller --noconsole --name=FAS_Kiosk --icon=assets/icons/logo.ico --add-data "assets;assets" main.py
    ```

- 4.2. Lint / static analysis
  - Sử dụng `Ruff` để kiểm tra các lỗi cú pháp, biến không sử dụng, lỗi logic và định dạng mã nguồn theo tiêu chuẩn PEP 8.

- 4.3. Unit test
  - Bộ kiểm thử `tests/` bao gồm:
    - `test_face_detector.py`: Kiểm thử khả năng phát hiện khuôn mặt trên ảnh tĩnh mẫu và tính toán góc nghiêng Euler.
    - `test_liveness_gate.py`: Kiểm thử phân loại ảnh thật vs ảnh in/màn hình điện thoại qua MiniFASNet.
    - `test_gallery_matcher.py`: Kiểm thử tính toán tích vô hướng Cosine ma trận $1000 \times 512$, đo đạc thời gian so khớp $< 2\text{ ms}$.
    - `test_sqlite_manager.py`: Kiểm thử ghi nhận lượt chấm khi mất mạng, đọc theo lô 50 bản ghi và cập nhật trạng thái `is_synced`.

- 4.4. Quality gate / coverage
  - Ngưỡng bao phủ kiểm thử (Line Coverage) đạt **$\ge 80\%$** cho các gói cốt lõi `core.vision` và `core.offline`.
  - 100% các ca kiểm thử trong `tests/` phải vượt qua thành công (Pass rate: 100%).

- 4.5. Build artifact
  - Đầu ra đóng gói là thư mục `dist/FAS_Kiosk/` chứa tệp thực thi độc lập `FAS_Kiosk.exe` cùng toàn bộ runtime Python nhúng và các tệp trọng số ONNX, sẵn sàng để cài đặt trực tiếp trên các máy trạm Kiosk Windows mà không cần cài sẵn môi trường Python trên máy đích.

- 4.6. CI pipeline
  - Được tích hợp trực tiếp vào kịch bản GitHub Actions chung của Monorepo tại `.github/workflows/ci.yml` (Job `kiosk-app-ci`), tự động cài đặt dependency, kiểm tra import và chạy test tự động khi có Pull Request.

---

**5. Bảo trì & Thay đổi mã nguồn**

- 5.1. Versioning mã nguồn
  - Phân hệ Kiosk tuân thủ chuẩn **Semantic Versioning 2.0.0 (SemVer)**:
    - Phiên bản ban đầu: `v1.0.0`.
    - Nâng cấp `PATCH`: Sửa lỗi giao diện, tối ưu thuật toán căn chỉnh mặt.
    - Nâng cấp `MINOR`: Bổ sung thêm tính năng mới (ví dụ: hỗ trợ thêm camera cảm biến nhiệt độ/quét QR).
    - Nâng cấp `MAJOR`: Thay đổi toàn bộ mô hình trích xuất đặc trưng AI (ví dụ: chuyển từ 512D sang 1024D).

- 5.2. Quản lý thay đổi
  - **Quy trình Thay thế Mô hình AI (Model Swap Procedure)**:
    - Thiết kế phân tách kiến trúc cho phép nâng cấp phiên bản mô hình AI (Ví dụ: cập nhật bản nâng cấp của ArcFace hoặc MiniFASNet) một cách độc lập:
      1. Đặt tệp trọng số mới vào `assets/models/`.
      2. Cập nhật đường dẫn tệp trong `config/settings.py`.
      3. Chạy lại bộ kiểm thử `tests/test_feature_extractor.py` để xác thực độ chuẩn hóa $L_2$ Norm và độ dài vector.
      4. Tuyệt đối không cần chỉnh sửa mã nguồn tầng giao diện hay tầng lưu trữ SQLite.

- 5.3. Cập nhật tài liệu khi code thay đổi
  - Khi có bất kỳ thay đổi nào liên quan đến API giao tiếp với Backend (`/punch`, `/sync-batch`), phải cập nhật đồng thời [DDS.md](../../../docs/design/DDS.md) (Mục 4.3) và [FR.md](../../../docs/requirements/FR.md).
  - Khi thay đổi cấu trúc bảng SQLite cục bộ `offline_punches`, phải cập nhật cả `DDS.md` (Mục 4.2) và tài liệu này (`BD.md`).

- 5.4. Refactoring & technical debt
  - Định kỳ tối ưu hóa bộ nhớ đệm khung hình video: Đảm bảo sử dụng cơ chế chia sẻ bộ nhớ (Memory Buffer) trực tiếp giữa OpenCV và PySide6 `QImage` thông qua định dạng `QImage.Format_RGB888` để tránh sao chép dữ liệu mảng byte (Zero-copy optimization), duy trì hiệu năng cao và CPU mát mẻ khi máy trạm hoạt động liên tục 24/7.
