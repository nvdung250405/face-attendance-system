"""Điểm khởi động chính của Phân hệ Trạm Điểm danh Kiosk Desktop (FAS Kiosk).

Tuân thủ kiến trúc MVC:
- QML View: ui/qml/main.qml (nạp qua QQmlApplicationEngine)
- Controller: KioskViewModel, PinController, EnrollmentController
- Hardware Acceleration: QQuickImageProvider truyền luồng camera DirectShow/OpenCV vào QML Canvas
- Model: YuNetFaceDetector, MiniFASNetLivenessGate, ArcFace, CooldownTracker, SQLiteQueueManager
"""

import argparse
import platform
import sys
from pathlib import Path

# Thêm thư mục src vào sys.path để hỗ trợ src-layout
src_dir = Path(__file__).resolve().parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

import cv2
import numpy as np
from PySide6.QtCore import QObject, Slot
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlApplicationEngine

from config.logger import get_logger
from config.settings import settings
from core.cooldown.cooldown_tracker import CooldownTracker
from core.offline.sqlite_manager import SQLiteQueueManager
from core.offline.sync_worker import OfflineSyncWorker
from core.vision.camera_worker import CameraWorker
from core.vision.face_detector import YuNetFaceDetector
from core.vision.feature_extractor import ArcFaceFeatureExtractor
from core.vision.gallery_matcher import GalleryCacheManager
from core.vision.liveness_gate import MiniFASNetLivenessGate
from network.http_client import KioskHttpClient, KioskNetworkError, KioskPinError
from network.stomp_worker import KioskStompWorker
from presentation.controllers.enrollment_controller import EnrollmentController
from presentation.controllers.pin_controller import PinController
from presentation.providers.video_image_provider import VideoImageProvider
from presentation.viewmodels.kiosk_view_model import (
    KioskViewModel,
    evaluate_face_oval_alignment,
)

logger = get_logger("main")


def _load_gallery_from_backend(http_client: KioskHttpClient, gallery_matcher: GalleryCacheManager) -> int:
    """Tải danh mục vector ArcFace từ Backend và nạp vào RAM Gallery khi khởi động.

    Trả về số lượng nhân viên đã nạp (0 khi offline hoặc thất bại — không crash khởi động).
    """
    try:
        raw = http_client.fetch_gallery()
        data = raw.get("data", raw) if isinstance(raw, dict) else {}
        items = data.get("items", []) or []
        records = []
        for item in items:
            emp_id = int(item.get("employeeId"))
            vec = np.asarray(item.get("vector512") or [], dtype=np.float32)
            if vec.shape[0] != 512:
                logger.warning("Bỏ qua nhân viên %d trong gallery: vector %dD", emp_id, vec.shape[0])
                continue
            records.append(
                {
                    "employee_id": emp_id,
                    "vector": vec,
                    "name": item.get("fullName", ""),
                    "code": item.get("employeeCode", ""),
                    "dept": item.get("department", ""),
                }
            )
        version = data.get("galleryVersion")
        count = gallery_matcher.load_gallery(records, version=version)
        logger.info("Đã nạp Gallery RAM từ Backend: %d nhân viên (version=%s)", count, version)
        return count
    except Exception as exc:
        logger.warning("Không thể tải gallery từ Backend lúc khởi động (offline?): %s", exc)
        return 0


def _handle_pin_submission(
    http_client: KioskHttpClient,
    pin_controller: PinController,
    kiosk_view_model: KioskViewModel,
    employee_code: str,
    pin: str,
) -> None:
    """Xử lý xác thực PIN dự phòng qua Backend; chỉ ghi nhận điểm danh khi backend xác nhận PIN đúng."""
    try:
        raw = http_client.verify_pin(employee_code, pin)
        data = raw.get("data", raw) if isinstance(raw, dict) else {}
        emp_id = int(data.get("employeeId") or 0)
        if emp_id <= 0:
            pin_controller.set_status_message("Không xác định được nhân viên từ phản hồi máy chủ.")
            return
        pin_controller.on_verification_success()
        kiosk_view_model.recordVerifiedPinPunch(emp_id)
    except KioskPinError as exc:
        pin_controller.on_verification_failure()
        if exc.locked_until:
            pin_controller.set_status_message(f"Mã PIN đang bị khóa đến {exc.locked_until}")
    except KioskNetworkError as exc:
        pin_controller.set_status_message(f"Không thể kết nối máy chủ xác thực PIN: {exc}")
    except Exception as exc:
        logger.warning("Lỗi xử lý xác thực PIN: %s", exc)
        pin_controller.set_status_message("Đã xảy ra lỗi khi xác thực PIN. Vui lòng thử lại.")


class DemoEnrollHandler(QObject):
    """QObject sống ở main thread để xử lý --demo-enroll qua queued connection.

    Tránh gọi đồng thời detector/extractor ONNX từ camera thread (race).
    """

    def __init__(
        self,
        detector: YuNetFaceDetector,
        extractor: ArcFaceFeatureExtractor,
        gallery_matcher: GalleryCacheManager,
        employee_id: int,
        parent: QObject | None = None,
    ) -> None:
        super().__init__(parent)
        self._detector = detector
        self._extractor = extractor
        self._gallery_matcher = gallery_matcher
        self._employee_id = employee_id
        self._done = False
        self._stable_count = 0
        self._target_frames = 8
        self._best_aligned = None
        self._best_sharpness = 0.0

    @Slot(object)
    def handle_frame(self, frame: np.ndarray | None) -> None:
        """Xử lý một khung hình camera để tự động ghi nhận khuôn mặt demo."""
        if self._done or frame is None or frame.size == 0:
            return
        try:
            det = self._detector.detect_face(frame)
            if det is None or det.is_tilted or not det.is_valid_size:
                self._stable_count = 0
                return

            is_aligned, _ = evaluate_face_oval_alignment(frame.shape, det.bbox)
            if not is_aligned:
                self._stable_count = 0
                return

            fh, fw = frame.shape[:2]
            x, y, w, h = det.bbox
            roi = frame[max(0, y):min(fh, y + h), max(0, x):min(fw, x + w)]
            if roi.size > 0:
                gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                sharpness = float(cv2.Laplacian(gray_roi, cv2.CV_64F).var())
            else:
                sharpness = 0.0

            aligned = self._extractor.align_face(frame, det.landmarks)
            self._stable_count += 1
            cnt = self._stable_count

            if sharpness > self._best_sharpness:
                self._best_sharpness = sharpness
                self._best_aligned = aligned

            if cnt % 3 == 0 and cnt < self._target_frames:
                logger.info(
                    "⏳ [DEMO-ENROLL] Đang giữ yên khuôn mặt để lấy nét... (%d/%d frames)",
                    cnt,
                    self._target_frames,
                )

            if cnt >= self._target_frames:
                best_crop = (
                    self._best_aligned if self._best_aligned is not None else aligned
                )
                vec = self._extractor.extract_vector(best_crop)
                self._gallery_matcher.add_or_update_employee(self._employee_id, vec)
                self._done = True
                logger.info(
                    "✅ [DEMO-ENROLL] Đã lấy nét thành công! Đã lưu khuôn mặt vào RAM Gallery cho Mã NV: %d!",
                    self._employee_id,
                )
        except Exception as exc:
            logger.warning("Lỗi trong quá trình demo-enroll: %s", exc)


def parse_arguments() -> argparse.Namespace:
    """Xử lý các đối số dòng lệnh khi khởi chạy trạm Kiosk."""
    parser = argparse.ArgumentParser(description="Hệ thống Trạm Điểm danh Kiosk Desktop (FAS)")
    parser.add_argument(
        "--windowed",
        action="store_true",
        help="Khởi chạy ở chế độ cửa sổ thay vì chế độ toàn màn hình (Full-screen)",
    )
    parser.add_argument(
        "--no-camera",
        action="store_true",
        help="Không khởi chạy luồng camera vật lý (dùng để kiểm thử giao diện)",
    )
    parser.add_argument(
        "--demo-enroll",
        type=int,
        default=None,
        metavar="EMP_ID",
        help="Tự động ghi nhận khuôn mặt hiện tại của bạn vào RAM Gallery với mã nhân viên EMP_ID (ví dụ: --demo-enroll 1001) để kiểm thử điểm danh trực tiếp",
    )
    parser.add_argument(
        "--no-liveness",
        action="store_true",
        help="Bỏ qua kiểm tra thực thể sống Liveness (chỉ dùng để test nhanh tại máy phát triển)",
    )
    parser.add_argument(
        "--liveness-threshold",
        type=float,
        default=None,
        metavar="FLOAT",
        help="Ngưỡng đánh giá thực thể sống Liveness (mặc định: 0.85)",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Khởi chạy ở Chế độ Demo phát triển (tắt kiểm tra liveness nghiêm ngặt, cho phép test mô phỏng nhanh)",
    )
    return parser.parse_args()


def init_ai_pipeline(
    enable_liveness: bool = True,
    liveness_threshold: float | None = None,
) -> tuple[
    YuNetFaceDetector | None,
    MiniFASNetLivenessGate | None,
    ArcFaceFeatureExtractor | None,
]:
    """Khởi tạo bộ 3 mô hình AI nếu tệp trọng số ONNX đã sẵn sàng."""
    detector = None
    liveness_gate = None
    extractor = None

    if settings.yunet_model_path.exists():
        try:
            detector = YuNetFaceDetector(settings.yunet_model_path)
            logger.info("Mô hình AI: YuNet Face Detector        -> [SẴN SÀNG]")
        except Exception as exc:
            logger.warning("Không thể nạp YuNet: %s", exc)
    else:
        logger.warning("Chưa có tệp trọng số YuNet tại %s", settings.yunet_model_path)

    if not enable_liveness:
        logger.info("Mô hình AI: MiniFASNet Liveness Gate   -> [ĐÃ TẮT BẰNG CỜ --no-liveness]")
    elif settings.minifasnet_model_path.exists():
        try:
            liveness_gate = MiniFASNetLivenessGate(
                settings.minifasnet_model_path,
                threshold=liveness_threshold,
            )
            logger.info(
                "Mô hình AI: MiniFASNet Liveness Gate   -> [SẴN SÀNG] (threshold=%.2f)",
                liveness_gate.threshold,
            )
        except Exception as exc:
            logger.warning("Không thể nạp MiniFASNet: %s", exc)
    else:
        logger.warning("Chưa có tệp trọng số MiniFASNet tại %s", settings.minifasnet_model_path)

    if settings.arcface_model_path.exists():
        try:
            extractor = ArcFaceFeatureExtractor(settings.arcface_model_path)
            logger.info("Mô hình AI: ArcFace MobileFaceNet      -> [SẴN SÀNG]")
        except Exception as exc:
            logger.warning("Không thể nạp ArcFace: %s", exc)
    else:
        logger.warning("Chưa có tệp trọng số ArcFace tại %s", settings.arcface_model_path)

    return detector, liveness_gate, extractor


def main() -> int:
    """Hàm khởi động chính của ứng dụng Kiosk Desktop."""
    args = parse_arguments()

    logger.info("=" * 60)
    logger.info("KHỞI ĐỘNG PHÂN HỆ TRẠM ĐIỂM DANH KIOSK DESKTOP (FAS - QML MVC)")
    logger.info("=" * 60)
    logger.info("Phiên bản Python: %s (%s)", platform.python_version(), platform.platform())
    logger.info("Kiosk ID:        %s", settings.kiosk_id)
    logger.info("Backend REST:    %s", settings.backend_url)
    logger.info("WebSocket STOMP: %s", settings.stomp_ws_url)
    if settings.is_default_secret:
        logger.warning(
            "CẢNH BÁO BẢO MẬT: Trạm Kiosk đang dùng KIOSK_SECRET_TOKEN mặc định! "
            "Trong môi trường Production, bắt buộc cấu hình token riêng biệt qua biến môi trường."
        )
    logger.info(
        "Camera Index:    %d (%dx%d @ %d FPS)",
        settings.camera_device_index,
        settings.camera_frame_width,
        settings.camera_frame_height,
        settings.camera_fps,
    )
    if args.demo:
        args.no_liveness = True
        logger.info("Chế độ vận hành: [DEMO DEV] (Tự động bật --no-liveness để kiểm thử linh hoạt)")
    elif args.no_liveness:
        logger.info("Chế độ vận hành: [NO-LIVENESS DEV] (Đã tắt kiểm tra thực thể sống Liveness)")
    else:
        logger.info("Chế độ vận hành: [PRODUCTION CLEAN] (Dữ liệu thực, kiểm soát sinh trắc chuẩn)")

    if args.no_liveness:
        logger.info("Ngưỡng Liveness: [ĐÃ BỎ QUA (--no-liveness)]")
    else:
        logger.info("Ngưỡng Liveness: %.2f", settings.liveness_threshold)
    logger.info("Ngưỡng Cosine:   %.2f", settings.cosine_similarity_threshold)
    logger.info("Thời gian chờ:   %d giây (Cooldown)", settings.cooldown_seconds)

    # 1. Khởi tạo QGuiApplication
    app = QGuiApplication.instance()
    if app is None:
        app = QGuiApplication(sys.argv)

    app.setApplicationName("FAS Kiosk Desktop")
    app.setOrganizationName("FaceAttendanceSystem")

    # 2. Khởi tạo CSDL SQLite WAL và hàng đợi ngoại tuyến
    queue_manager = SQLiteQueueManager(settings.db_path)

    # 3. Khởi tạo Bộ nhớ đệm Cooldown và Gallery RAM Matcher
    cooldown_tracker = CooldownTracker(settings.cooldown_seconds)
    gallery_matcher = GalleryCacheManager(settings.cosine_similarity_threshold)

    # 4. Nạp bộ 3 mô hình AI ONNX
    detector, liveness_gate, extractor = init_ai_pipeline(
        enable_liveness=not args.no_liveness,
        liveness_threshold=args.liveness_threshold,
    )

    # 5. Khởi tạo tiến trình nền đồng bộ bù ngoại tuyến (chưa start — start SAU khi các signal
    #    của KioskViewModel đã được kết nối để không mất sự kiện trạng thái mạng ban đầu)
    sync_worker = OfflineSyncWorker(
        queue_manager=queue_manager,
        backend_url=settings.backend_url,
        kiosk_id=settings.kiosk_id,
        secret_token=settings.kiosk_secret_token,
    )

    # 6. Khởi tạo VideoImageProvider & Controllers
    image_provider = VideoImageProvider()
    pin_controller = PinController()
    enrollment_controller = EnrollmentController(
        detector=detector,
        extractor=extractor,
        liveness_gate=liveness_gate,
        demo_mode=args.demo,
    )
    kiosk_view_model = KioskViewModel(
        image_provider=image_provider,
        detector=detector,
        liveness_gate=liveness_gate,
        extractor=extractor,
        gallery_matcher=gallery_matcher,
        cooldown_tracker=cooldown_tracker,
        queue_manager=queue_manager,
        sync_worker=sync_worker,
        stability_threshold=8,
        enrollment_controller=enrollment_controller,
    )

    # 6b. Nạp danh mục vector khuôn mặt từ Backend vào RAM Gallery khi khởi động
    http_client = KioskHttpClient(
        base_url=settings.backend_url,
        kiosk_id=settings.kiosk_id,
        secret_token=settings.kiosk_secret_token,
    )
    _load_gallery_from_backend(http_client, gallery_matcher)

    # 6c. Khởi động luồng STOMP nạp nóng gallery (ADD/DELETE vector thời gian thực)
    stomp_worker = KioskStompWorker(gallery_matcher=gallery_matcher)
    stomp_worker.start()

    # 6d. Kết nối luồng xác thực mã PIN dự phòng qua Backend (không bao giờ coi PIN là mã nhân viên)
    pin_controller.pinSubmitted.connect(
        lambda employee_code, pin: _handle_pin_submission(
            http_client, pin_controller, kiosk_view_model, employee_code, pin
        )
    )

    # 7. Khởi động luồng nền đồng bộ offline SAU khi view model đã kết nối signal
    sync_worker.start()

    # 7. Khởi tạo luồng đọc camera nếu không tắt qua flag
    camera_worker = None
    if not args.no_camera:
        try:
            camera_worker = CameraWorker(
                device_index=settings.camera_device_index,
                width=settings.camera_frame_width,
                height=settings.camera_frame_height,
                target_fps=settings.camera_fps,
            )
            # Nếu có cờ --demo-enroll, tự động đăng ký khuôn mặt người ngồi trước camera vào Gallery
            # (xử lý trên MAIN thread qua queued connection để tránh đua ONNX inference)
            demo_enroll_handler = None
            if args.demo_enroll is not None and extractor is not None and detector is not None:
                demo_enroll_handler = DemoEnrollHandler(detector, extractor, gallery_matcher, args.demo_enroll)
                camera_worker.frame_ready.connect(demo_enroll_handler.handle_frame)

            # Kết nối frame camera trực tiếp vào KioskViewModel và EnrollmentController
            camera_worker.frame_ready.connect(kiosk_view_model.process_camera_frame)
            camera_worker.frame_ready.connect(enrollment_controller.process_capture_frame)
            camera_worker.start()
            logger.info("Luồng camera DirectShow đã khởi động thành công.")
        except Exception as exc:
            logger.warning("Không thể mở webcam vật lý: %s. Chuyển sang chế độ không camera.", exc)

    # Đăng ký callback khi nhân viên hoàn tất đăng ký khuôn mặt mới -> Nạp vào RAM Gallery
    def _on_enrollment_completed(payload: dict) -> None:
        try:
            emp_id = payload.get("employeeId")
            embs = payload.get("faceEmbeddings", [])
            if emp_id and embs and gallery_matcher is not None:
                mean_vec = np.mean(np.array(embs, dtype=np.float32), axis=0)
                norm = float(np.linalg.norm(mean_vec))
                if norm > 1e-6:
                    mean_vec = mean_vec / norm
                gallery_matcher.add_or_update_employee(int(emp_id), mean_vec)
                logger.info(
                    "✅ Đã tự động cập nhật nhân viên ID %d vào Gallery RAM sau khi hoàn tất đăng ký!",
                    int(emp_id),
                )
        except Exception as exc:
            logger.warning("Không thể lưu nhân viên mới vào Gallery RAM: %s", exc)

    enrollment_controller.enrollmentCompleted.connect(_on_enrollment_completed)

    # 8. Khởi tạo QQmlApplicationEngine và đăng ký Controllers / Providers
    engine = QQmlApplicationEngine()
    engine.addImageProvider("camera", image_provider)

    context = engine.rootContext()
    context.setContextProperty("kioskViewModel", kiosk_view_model)
    context.setContextProperty("pinController", pin_controller)
    context.setContextProperty("enrollmentController", enrollment_controller)

    # Thêm đường dẫn tìm kiếm QML modules từ resources/qml
    qml_dir = Path(__file__).resolve().parent / "resources" / "qml"
    engine.addImportPath(str(qml_dir))

    main_qml_path = qml_dir / "main.qml"
    engine.load(str(main_qml_path))

    if not engine.rootObjects():
        logger.error("Không thể nạp tệp giao diện QML tại %s", main_qml_path)
        return -1

    # Điều chỉnh kích thước toàn màn hình nếu không có cờ --windowed
    root_window = engine.rootObjects()[0]
    if not args.windowed:
        root_window.showFullScreen()
    else:
        # Cấu hình cửa sổ chế độ windowed chuẩn tỷ lệ 9:16 vừa vặn màn hình desktop
        primary_screen = app.primaryScreen()
        if primary_screen:
            avail = primary_screen.availableGeometry()
            # Chiều cao app chiếm ~90% không gian khả dụng (để vừa vặn thanh taskbar)
            target_h = min(1920, int(avail.height() * 0.90))
            # Chiều rộng app bằng đúng tỷ lệ 9:16 tương ứng với chiều cao màn hình chính
            target_w = int(target_h * (1080 / 1920))
            # Căn giữa cửa sổ ứng dụng ngay trung tâm màn hình desktop
            pos_x = avail.x() + (avail.width() - target_w) // 2
            pos_y = avail.y() + (avail.height() - target_h) // 2
            root_window.setGeometry(pos_x, pos_y, target_w, target_h)
        root_window.show()

    logger.info("-" * 60)
    logger.info("Giao diện Kiosk QML Desktop đã hiển thị thành công qua Scene Graph.")
    logger.info("=" * 60)

    # 9. Bắt đầu vòng lặp sự kiện đồ họa Qt
    exit_code = app.exec()

    # 10. Dọn dẹp tài nguyên khi thoát
    if camera_worker is not None and camera_worker.isRunning():
        camera_worker.stop()
    if stomp_worker.isRunning():
        stomp_worker.stop()
    if sync_worker.isRunning():
        sync_worker.stop()
    http_client.close()

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
