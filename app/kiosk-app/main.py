"""Điểm khởi động chính của Phân hệ Trạm Điểm danh Kiosk Desktop (FAS Kiosk).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 2.5 - Khởi tạo & chạy dự án)
- DDS.md (Mục 2.1 & 3.5 - Giao diện người dùng Kiosk)
"""

import argparse
import platform
import sys

from PySide6.QtWidgets import QApplication

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
from ui.views.main_window import MainWindow

logger = get_logger("main")


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
    return parser.parse_args()


def init_ai_pipeline() -> tuple[
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

    if settings.minifasnet_model_path.exists():
        try:
            liveness_gate = MiniFASNetLivenessGate(settings.minifasnet_model_path)
            logger.info("Mô hình AI: MiniFASNet Liveness Gate   -> [SẴN SÀNG]")
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
    logger.info("KHỞI ĐỘNG PHÂN HỆ TRẠM ĐIỂM DANH KIOSK DESKTOP (FAS)")
    logger.info("=" * 60)
    logger.info("Phiên bản Python: %s (%s)", platform.python_version(), platform.platform())
    logger.info("Kiosk ID:        %s", settings.kiosk_id)
    logger.info("Backend REST:    %s", settings.backend_url)
    logger.info("WebSocket STOMP: %s", settings.stomp_ws_url)
    logger.info(
        "Camera Index:    %d (%dx%d @ %d FPS)",
        settings.camera_device_index,
        settings.camera_frame_width,
        settings.camera_frame_height,
        settings.camera_fps,
    )
    logger.info("Ngưỡng Liveness: %.2f", settings.liveness_threshold)
    logger.info("Ngưỡng Cosine:   %.2f", settings.cosine_similarity_threshold)
    logger.info("Thời gian chờ:   %d giây (Cooldown)", settings.cooldown_seconds)

    # 1. Khởi tạo ứng dụng đồ họa PySide6
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)

    app.setApplicationName("FAS Kiosk Desktop")
    app.setOrganizationName("FaceAttendanceSystem")

    # 2. Khởi tạo CSDL SQLite WAL và hàng đợi ngoại tuyến
    queue_manager = SQLiteQueueManager(settings.db_path)

    # 3. Khởi tạo Bộ nhớ đệm Cooldown và Gallery RAM Matcher
    cooldown_tracker = CooldownTracker(settings.cooldown_seconds)
    gallery_matcher = GalleryCacheManager(settings.cosine_similarity_threshold)

    # 4. Nạp bộ 3 mô hình AI ONNX
    detector, liveness_gate, extractor = init_ai_pipeline()

    # 5. Khởi tạo tiến trình nền đồng bộ bù ngoại tuyến
    sync_worker = OfflineSyncWorker(
        queue_manager=queue_manager,
        backend_url=settings.backend_url,
        kiosk_id=settings.kiosk_id,
        secret_token=settings.kiosk_secret_token,
    )
    sync_worker.start()

    # 6. Khởi tạo luồng đọc camera nếu không tắt qua flag
    camera_worker = None
    if not args.no_camera:
        try:
            camera_worker = CameraWorker(
                device_index=settings.camera_device_index,
                width=settings.camera_frame_width,
                height=settings.camera_frame_height,
                target_fps=settings.camera_fps,
            )
            camera_worker.start()
            logger.info("Luồng camera DirectShow đã khởi động thành công.")
        except Exception as exc:
            logger.warning("Không thể mở webcam vật lý: %s. Chuyển sang chế độ không camera.", exc)

    # 7. Khởi tạo cửa sổ chính MainWindow
    window = MainWindow(
        camera_worker=camera_worker,
        detector=detector,
        liveness_gate=liveness_gate,
        extractor=extractor,
        gallery_matcher=gallery_matcher,
        cooldown_tracker=cooldown_tracker,
        queue_manager=queue_manager,
        sync_worker=sync_worker,
    )

    if args.windowed:
        window.resize(1024, 768)
        window.show()
    else:
        window.showFullScreen()

    logger.info("-" * 60)
    logger.info("Giao diện Kiosk Desktop đã hiển thị lên màn hình. Nhấn [Esc] để thu nhỏ.")
    logger.info("=" * 60)

    # 8. Bắt đầu vòng lặp sự kiện đồ họa Qt
    exit_code = app.exec()

    # 9. Dọn dẹp tài nguyên khi thoát
    if camera_worker is not None and camera_worker.isRunning():
        camera_worker.stop()
    if sync_worker.isRunning():
        sync_worker.stop()

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
