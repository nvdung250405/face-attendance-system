"""Module Cửa sổ giao diện chính của Phân hệ Trạm Điểm danh Kiosk Desktop (MainWindow).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2, 4.3 & M6 - MainWindow)
- TP-KIOSK-01 (Mục 4.3 - M6: GUI & Soak Testing)
- DDS.md (Mục 2.1, 3.2 & 3.5 - Pipeline thị giác toàn trình và giao diện người dùng)
"""

import time
from datetime import datetime

import numpy as np
from PySide6.QtCore import QDateTime, Qt, QTimer
from PySide6.QtGui import QFont, QKeySequence, QShortcut
from PySide6.QtWidgets import (
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

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
from ui.views.enrollment_dialog import EnrollmentDialog
from ui.views.pin_dialog import VirtualPinDialog
from ui.widgets.live_canvas import LiveCanvasWidget, OvalState

logger = get_logger("main_window")


class MainWindow(QMainWindow):
    """Cửa sổ ứng dụng chính của Trạm Kiosk, quản lý giao diện full-screen và pipeline AI 5 bước."""

    def __init__(
        self,
        camera_worker: CameraWorker | None = None,
        detector: YuNetFaceDetector | None = None,
        liveness_gate: MiniFASNetLivenessGate | None = None,
        extractor: ArcFaceFeatureExtractor | None = None,
        gallery_matcher: GalleryCacheManager | None = None,
        cooldown_tracker: CooldownTracker | None = None,
        queue_manager: SQLiteQueueManager | None = None,
        sync_worker: OfflineSyncWorker | None = None,
        parent: QWidget | None = None,
    ) -> None:
        """Khởi tạo MainWindow."""
        super().__init__(parent)

        # 1. Các module dịch vụ (Hỗ trợ Dependency Injection phục vụ kiểm thử)
        self.camera_worker = camera_worker
        self.detector = detector
        self.liveness_gate = liveness_gate
        self.extractor = extractor
        self.gallery_matcher = gallery_matcher or GalleryCacheManager()
        self.cooldown_tracker = cooldown_tracker or CooldownTracker()
        self.queue_manager = queue_manager or SQLiteQueueManager()
        self.sync_worker = sync_worker

        # 2. Trạng thái giữ kết quả hiển thị (Hold result duration)
        self._holding_result: bool = False
        self._hold_end_time: float = 0.0
        self._hold_duration_sec: float = 2.5
        self._is_online: bool = True

        # 3. Thiết lập thuộc tính cửa sổ
        self.setWindowTitle("Hệ thống Điểm danh Sinh trắc học FAS - Kiosk")
        self.setStyleSheet("background-color: #11111B; color: #CDD6F4;")
        self.setMinimumSize(800, 600)

        self._init_ui()
        self._setup_shortcuts()
        self._setup_timers()
        self._connect_signals()

    def _init_ui(self) -> None:
        """Xây dựng bố cục 3 vùng: Header -> LiveCanvasWidget -> Footer."""
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)

        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(16, 12, 16, 12)
        main_layout.setSpacing(10)

        # 1. HeaderBar
        self.header_bar = self._create_header_bar()
        main_layout.addWidget(self.header_bar)

        # 2. LiveCanvasWidget (Khu vực trọng tâm)
        self.canvas = LiveCanvasWidget(self)
        main_layout.addWidget(self.canvas, stretch=1)

        # 3. FooterBar
        self.footer_bar = self._create_footer_bar()
        main_layout.addWidget(self.footer_bar)

    def _create_header_bar(self) -> QWidget:
        """Tạo thanh tiêu đề Kiosk với logo, đồng hồ số thời gian thực và trạng thái mạng."""
        header = QWidget(self)
        header.setFixedHeight(64)
        header.setStyleSheet("""
            QWidget {
                background-color: #1E1E2E;
                border-radius: 10px;
                padding: 4px 12px;
            }
        """)

        layout = QHBoxLayout(header)
        layout.setContentsMargins(14, 6, 14, 6)

        # Logo & Tên hệ thống
        left_box = QVBoxLayout()
        left_box.setSpacing(2)
        title_label = QLabel("FAS | ĐIỂM DANH SINH TRẮC HỌC", header)
        title_label.setFont(QFont("Segoe UI", 15, QFont.Bold))
        title_label.setStyleSheet("color: #89B4FA;")
        left_box.addWidget(title_label)

        sub_title = QLabel(f"Trạm: {settings.kiosk_id}", header)
        sub_title.setFont(QFont("Segoe UI", 10))
        sub_title.setStyleSheet("color: #A6ADC8;")
        left_box.addWidget(sub_title)
        layout.addLayout(left_box)

        layout.addStretch()

        # Đồng hồ số trung tâm
        self.clock_label = QLabel(header)
        self.clock_label.setAlignment(Qt.AlignCenter)
        self.clock_label.setFont(QFont("Segoe UI", 18, QFont.Bold))
        self.clock_label.setStyleSheet("color: #CDD6F4;")
        self._update_clock()
        layout.addWidget(self.clock_label)

        layout.addStretch()

        # Chỉ báo trạng thái mạng & CSDL ngoại tuyến
        right_box = QVBoxLayout()
        right_box.setSpacing(2)
        right_box.setAlignment(Qt.AlignRight)

        self.network_badge = QLabel("● TRỰC TUYẾN", header)
        self.network_badge.setAlignment(Qt.AlignRight)
        self.network_badge.setFont(QFont("Segoe UI", 11, QFont.Bold))
        self.network_badge.setStyleSheet("color: #A6E3A1;")
        right_box.addWidget(self.network_badge)

        self.queue_badge = QLabel("Hàng đợi: 0 bản ghi", header)
        self.queue_badge.setAlignment(Qt.AlignRight)
        self.queue_badge.setFont(QFont("Segoe UI", 10))
        self.queue_badge.setStyleSheet("color: #A6ADC8;")
        self._update_queue_badge()
        right_box.addWidget(self.queue_badge)

        layout.addLayout(right_box)
        return header

    def _create_footer_bar(self) -> QWidget:
        """Tạo thanh điều khiển dưới cùng với các phím tắt cảm ứng mở hộp thoại chức năng."""
        footer = QWidget(self)
        footer.setFixedHeight(68)
        footer.setStyleSheet("""
            QWidget {
                background-color: #1E1E2E;
                border-radius: 10px;
                padding: 6px 12px;
            }
        """)

        layout = QHBoxLayout(footer)
        layout.setContentsMargins(14, 8, 14, 8)
        layout.setSpacing(16)

        # Nút F2: Điểm danh bằng PIN
        self.btn_pin = QPushButton("🔑 [F2] Điểm danh bằng PIN Dự phòng", footer)
        self.btn_pin.setFixedHeight(46)
        self.btn_pin.setFont(QFont("Segoe UI", 12, QFont.Bold))
        self.btn_pin.setStyleSheet("""
            QPushButton {
                background-color: #313244;
                color: #89B4FA;
                border: 1px solid #45475A;
                border-radius: 8px;
                padding: 0 16px;
            }
            QPushButton:hover { background-color: #45475A; color: #B4BEFE; }
            QPushButton:pressed { background-color: #585B70; }
        """)
        self.btn_pin.clicked.connect(self.open_pin_dialog)
        layout.addWidget(self.btn_pin)

        # Nút F3: Đăng ký khuôn mặt mới
        self.btn_enroll = QPushButton("👤 [F3] Đăng ký Khuôn mặt Mới (OTP)", footer)
        self.btn_enroll.setFixedHeight(46)
        self.btn_enroll.setFont(QFont("Segoe UI", 12, QFont.Bold))
        self.btn_enroll.setStyleSheet("""
            QPushButton {
                background-color: #313244;
                color: #A6E3A1;
                border: 1px solid #45475A;
                border-radius: 8px;
                padding: 0 16px;
            }
            QPushButton:hover { background-color: #45475A; color: #94E2D5; }
            QPushButton:pressed { background-color: #585B70; }
        """)
        self.btn_enroll.clicked.connect(self.open_enrollment_dialog)
        layout.addWidget(self.btn_enroll)

        layout.addStretch()

        # Thông tin hướng dẫn phím tắt
        hint_label = QLabel("Nhấn [Esc] / [F11] để thu nhỏ màn hình", footer)
        hint_label.setFont(QFont("Segoe UI", 10))
        hint_label.setStyleSheet("color: #6C7086;")
        layout.addWidget(hint_label)

        return footer

    def _setup_shortcuts(self) -> None:
        """Đăng ký các phím tắt bàn phím vật lý cho Kiosk."""
        QShortcut(QKeySequence(Qt.Key_F2), self, self.open_pin_dialog)
        QShortcut(QKeySequence(Qt.Key_F3), self, self.open_enrollment_dialog)
        QShortcut(QKeySequence(Qt.Key_F11), self, self.toggle_fullscreen)
        QShortcut(QKeySequence(Qt.Key_Escape), self, self.exit_fullscreen)

    def _setup_timers(self) -> None:
        """Khởi tạo các bộ đếm thời gian cập nhật đồng hồ và hàng đợi ngoại tuyến."""
        self.clock_timer = QTimer(self)
        self.clock_timer.setInterval(500)
        self.clock_timer.timeout.connect(self._update_clock)
        self.clock_timer.start()

        self.queue_timer = QTimer(self)
        self.queue_timer.setInterval(5000)
        self.queue_timer.timeout.connect(self._update_queue_badge)
        self.queue_timer.start()

    def _connect_signals(self) -> None:
        """Kết nối tín hiệu từ luồng Camera và Worker đồng bộ mạng."""
        if self.camera_worker is not None:
            self.camera_worker.frame_ready.connect(self.process_camera_frame)

        if self.sync_worker is not None:
            self.sync_worker.network_status_changed.connect(self.on_network_status_changed)
            self.sync_worker.sync_progress.connect(self.on_sync_progress)

    def _update_clock(self) -> None:
        """Cập nhật giờ hiện tại trên thanh Header."""
        now = QDateTime.currentDateTime()
        self.clock_label.setText(now.toString("hh:mm:ss  |  dd/MM/yyyy"))

    def _update_queue_badge(self) -> None:
        """Cập nhật số lượng bản ghi chưa đồng bộ trên thanh trạng thái."""
        try:
            count = self.queue_manager.get_unsynced_count()
            self.queue_badge.setText(f"Hàng đợi: {count} bản ghi")
        except Exception:
            pass

    def on_network_status_changed(self, is_online: bool, message: str) -> None:
        """Xử lý sự kiện thay đổi trạng thái kết nối mạng từ SyncWorker."""
        self._is_online = is_online
        if is_online:
            self.network_badge.setText("● TRỰC TUYẾN")
            self.network_badge.setStyleSheet("color: #A6E3A1;")
        else:
            self.network_badge.setText("○ NGOẠI TUYẾN")
            self.network_badge.setStyleSheet("color: #FAB387;")

    def on_sync_progress(self, synced_count: int, remaining: int) -> None:
        """Cập nhật tiến trình đồng bộ bù ngoại tuyến."""
        self.queue_badge.setText(f"Hàng đợi: {remaining} bản ghi")

    def toggle_fullscreen(self) -> None:
        """Chuyển đổi qua lại giữa chế độ toàn màn hình và cửa sổ bình thường."""
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()

    def exit_fullscreen(self) -> None:
        """Thu nhỏ cửa sổ khi nhấn Esc."""
        if self.isFullScreen():
            self.showNormal()

    # =========================================================================
    # Pipeline Thị giác Máy tính 5 bước thời gian thực (DDS.md Mục 3.2)
    # =========================================================================

    def process_camera_frame(self, frame: np.ndarray) -> None:
        """Tiếp nhận khung hình từ CameraWorker và xử lý toàn trình nhận diện."""
        if frame is None or frame.size == 0:
            return

        # Nạp hình ảnh lên Canvas
        self.canvas.set_frame(frame)

        # Kiểm tra xem có đang trong thời gian giữ kết quả (Success/Error) không
        now = time.time()
        if self._holding_result:
            if now < self._hold_end_time:
                return
            # Đã hết thời gian giữ kết quả -> Trở về trạng thái IDLE
            self._holding_result = False
            self.canvas.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")

        # Bước 1: Phát hiện khuôn mặt bằng YuNet
        if self.detector is None:
            return

        detection = self.detector.detect_face(frame)
        if detection is None:
            self.canvas.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")
            return

        # Kiểm tra góc nghiêng Euler
        if detection.is_tilted:
            self.canvas.set_state(
                OvalState.ALIGNING,
                "Vui lòng giữ thẳng mặt, nhìn trực diện vào ống kính",
            )
            return

        # Kiểm tra kích thước khuôn mặt
        if not detection.is_valid_size:
            self.canvas.set_state(
                OvalState.ALIGNING,
                "Vui lòng đứng lại gần camera hơn (khuôn mặt quá nhỏ)",
            )
            return

        # Bước 2: Kiểm tra thực thể sống Liveness chống giả mạo (MiniFASNet)
        if self.liveness_gate is not None:
            liveness_score = float(self.liveness_gate.predict(frame, detection.bbox))
            if liveness_score < settings.liveness_threshold:
                self.canvas.set_state(
                    OvalState.ERROR,
                    "CẢNH BÁO: PHÁT HIỆN KHUÔN MẶT KHÔNG HỢP LỆ!",
                )
                self._trigger_hold(duration_sec=2.5)
                logger.warning("Từ chối điểm danh: Liveness không đạt (score=%.3f)", liveness_score)
                return
        else:
            liveness_score = 1.0

        # Bước 3: Căn chỉnh và Trích xuất vector 512D ArcFace
        if self.extractor is None:
            return

        aligned_face = self.extractor.align_face(frame, detection.landmarks)
        vector = self.extractor.extract_vector(aligned_face)

        # Bước 4: So khớp 1:N với ma trận RAM Gallery
        emp_id, score = self.gallery_matcher.match(vector)
        if emp_id is None:
            self.canvas.set_state(
                OvalState.ERROR,
                "Khuôn mặt chưa được đăng ký trong hệ thống",
            )
            self._trigger_hold(duration_sec=2.5)
            logger.info("Không tìm thấy nhân viên khớp ngưỡng (score tối đa=%.3f)", score)
            return

        # Bước 5: Kiểm tra Cooldown chống quẹt trùng lặp trong 120s
        status = self.cooldown_tracker.check_cooldown(emp_id)
        if status.is_in_cooldown:
            self.canvas.set_state(
                OvalState.ERROR,
                f"Bạn vừa điểm danh rồi! Vui lòng chờ {status.remaining_seconds}s",
            )
            self._trigger_hold(duration_sec=2.5)
            return

        # Điểm danh thành công! Ghi nhận Cooldown
        self.cooldown_tracker.record_punch(emp_id)

        # Lưu lượt quẹt an toàn vào SQLite WAL ngoại tuyến
        punch_time = datetime.now().strftime("%H:%M:%S")
        self.queue_manager.enqueue_punch(
            employee_id=emp_id,
            punch_type="FACE",
            similarity_score=score,
            liveness_score=liveness_score,
            kiosk_id=settings.kiosk_id,
        )
        self._update_queue_badge()

        # Hiển thị thông báo thành công viền xanh lá
        self.canvas.set_state(
            OvalState.SUCCESS,
            f"Điểm danh thành công lúc {punch_time}!\nMã NV: {emp_id} (Độ tin cậy: {int(score * 100)}%)",
        )
        self._trigger_hold(duration_sec=3.0)
        logger.info("Điểm danh THÀNH CÔNG nhân viên %d [score=%.3f, liveness=%.3f]", emp_id, score, liveness_score)

    def _trigger_hold(self, duration_sec: float = 2.5) -> None:
        """Kích hoạt khoảng thời gian giữ kết quả Success/Error trước khi quay lại quét tiếp."""
        self._holding_result = True
        self._hold_end_time = time.time() + duration_sec

    # =========================================================================
    # Mở các Hộp thoại chức năng ngoại vi
    # =========================================================================

    def open_pin_dialog(self) -> None:
        """Mở hộp thoại bàn phím số ảo nhập PIN dự phòng."""
        logger.info("Mở bàn phím số ảo PIN dự phòng")
        dialog = VirtualPinDialog(parent=self)
        dialog.pin_submitted.connect(self._handle_pin_submission)
        dialog.exec()

    def _handle_pin_submission(self, emp_id: int, pin: str) -> None:
        """Xử lý xác thực điểm danh bằng mã PIN dự phòng."""
        # Kiểm tra cooldown trước
        status = self.cooldown_tracker.check_cooldown(emp_id)
        if status.is_in_cooldown:
            logger.warning("Nhập PIN nhưng nhân viên %d đang trong thời gian chờ cooldown", emp_id)
            return

        self.cooldown_tracker.record_punch(emp_id)
        punch_time = datetime.now().strftime("%H:%M:%S")

        # Lưu SQLite WAL
        self.queue_manager.enqueue_punch(
            employee_id=emp_id,
            punch_type="PIN",
            similarity_score=0.0,
            liveness_score=0.0,
            kiosk_id=settings.kiosk_id,
        )
        self._update_queue_badge()

        self.canvas.set_state(
            OvalState.SUCCESS,
            f"Điểm danh mã PIN thành công lúc {punch_time}!\nMã NV: {emp_id}",
        )
        self._trigger_hold(duration_sec=3.0)
        logger.info("Điểm danh mã PIN THÀNH CÔNG nhân viên %d", emp_id)

    def open_enrollment_dialog(self) -> None:
        """Mở hộp thoại đăng ký mẫu khuôn mặt mới bằng OTP."""
        logger.info("Mở hộp thoại đăng ký mẫu khuôn mặt OTP")
        dialog = EnrollmentDialog(
            detector=self.detector,
            extractor=self.extractor,
            liveness_gate=self.liveness_gate,
            kiosk_id=settings.kiosk_id,
            parent=self,
        )
        dialog.enrollment_completed.connect(self._handle_enrollment_completed)
        dialog.exec()

    def _handle_enrollment_completed(self, data: dict) -> None:
        """Nạp nóng vector khuôn mặt mới vừa đăng ký vào ma trận Gallery RAM."""
        emp_id = data.get("employeeId") or data.get("data", {}).get("employeeId")
        logger.info("Tiếp nhận đăng ký hoàn tất cho nhân viên %s", emp_id)
        self._update_queue_badge()

    def closeEvent(self, event) -> None:
        """Dừng các luồng ngầm an toàn khi đóng ứng dụng."""
        logger.info("Đang đóng MainWindow và dừng các dịch vụ...")
        if self.camera_worker is not None and self.camera_worker.isRunning():
            self.camera_worker.stop()
        if self.sync_worker is not None and self.sync_worker.isRunning():
            self.sync_worker.stop()
        super().closeEvent(event)
