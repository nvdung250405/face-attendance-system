"""KioskViewModel: Lớp ViewModel trung gian kết nối lõi AI/Camera với giao diện QML.

Tuân thủ mô hình MVC/MVVM:
- Kế thừa QObject
- Cung cấp @Property kèm Signal notify để QML tự động cập nhật viền oval, thông điệp
- Điều phối pipeline nhận diện khuôn mặt AI: YuNet -> MiniFASNet -> ArcFace -> Gallery -> Cooldown -> SQLite WAL
- Cung cấp @Slot để QML gọi các hành động nghiệp vụ
"""

import time
from datetime import datetime
from enum import StrEnum

import numpy as np
from PySide6.QtCore import Property, QObject, Signal, Slot

from config.logger import get_logger
from config.settings import settings
from core.cooldown.cooldown_tracker import CooldownTracker
from core.offline.sqlite_manager import SQLiteQueueManager
from core.offline.sync_worker import OfflineSyncWorker
from core.vision.face_detector import YuNetFaceDetector
from core.vision.feature_extractor import ArcFaceFeatureExtractor
from core.vision.gallery_matcher import GalleryCacheManager
from core.vision.liveness_gate import MiniFASNetLivenessGate
from ui.controllers.video_image_provider import VideoImageProvider

logger = get_logger("kiosk_view_model")


class OvalState(StrEnum):
    """Máy trạng thái 4 màu viền Oval sinh trắc học."""

    IDLE = "IDLE"          # Xám: Chờ người dùng
    ALIGNING = "ALIGNING"  # Vàng: Đang phát hiện & căn chỉnh
    SUCCESS = "SUCCESS"    # Xanh lá: Nhận diện thành công
    ERROR = "ERROR"        # Đỏ: Spoofing hoặc lỗi


class KioskViewModel(QObject):
    """ViewModel điều phối trạng thái hiển thị và hành động của Kiosk QML View."""

    ovalStateChanged = Signal(str)
    messageChanged = Signal(str)
    isProcessingChanged = Signal(bool)
    pendingSyncCountChanged = Signal(int)
    openPinDialogRequested = Signal()
    openEnrollmentDialogRequested = Signal()

    def __init__(
        self,
        image_provider: VideoImageProvider | None = None,
        detector: YuNetFaceDetector | None = None,
        liveness_gate: MiniFASNetLivenessGate | None = None,
        extractor: ArcFaceFeatureExtractor | None = None,
        gallery_matcher: GalleryCacheManager | None = None,
        cooldown_tracker: CooldownTracker | None = None,
        queue_manager: SQLiteQueueManager | None = None,
        sync_worker: OfflineSyncWorker | None = None,
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo KioskViewModel."""
        super().__init__(parent)
        self.image_provider = image_provider
        self.detector = detector
        self.liveness_gate = liveness_gate
        self.extractor = extractor
        self.gallery_matcher = gallery_matcher
        self.cooldown_tracker = cooldown_tracker
        self.queue_manager = queue_manager
        self.sync_worker = sync_worker

        self._oval_state: str = OvalState.IDLE
        self._message: str = "Vui lòng nhìn vào khung hình để điểm danh"
        self._is_processing: bool = False
        self._pending_sync_count: int = 0

        # Khoảng thời gian dừng giữ kết quả thành công/thất bại (Hold duration)
        self._holding_result: bool = False
        self._hold_end_time: float = 0.0

        if self.queue_manager:
            self._update_pending_sync_count()

    @Property(str, notify=ovalStateChanged)
    def ovalState(self) -> str:
        """Lấy trạng thái viền oval hiện tại."""
        return self._oval_state

    @Property(str, notify=messageChanged)
    def message(self) -> str:
        """Lấy thông điệp tương tác hiện tại."""
        return self._message

    @Property(bool, notify=isProcessingChanged)
    def isProcessing(self) -> bool:
        """Kiểm tra có đang bận xử lý điểm danh hay không."""
        return self._is_processing

    @Property(int, notify=pendingSyncCountChanged)
    def pendingSyncCount(self) -> int:
        """Số lượng bản ghi điểm danh ngoại tuyến chưa đồng bộ."""
        return self._pending_sync_count

    def _update_pending_sync_count(self) -> None:
        """Cập nhật số bản ghi chưa đồng bộ từ SQLite WAL."""
        if self.queue_manager:
            try:
                cnt = self.queue_manager.get_unsynced_count()
                if cnt != self._pending_sync_count:
                    self._pending_sync_count = cnt
                    self.pendingSyncCountChanged.emit(cnt)
            except Exception as exc:
                logger.warning("Lỗi truy vấn số bản ghi chờ đồng bộ: %s", exc)

    def set_state(self, state: OvalState | str, message: str = "") -> None:
        """Cập nhật trạng thái màu viền oval và thông điệp cho QML."""
        state_str = str(state)
        changed = False
        if self._oval_state != state_str:
            self._oval_state = state_str
            self.ovalStateChanged.emit(state_str)
            changed = True
        if message and self._message != message:
            self._message = message
            self.messageChanged.emit(message)
            changed = True
        if changed:
            pass

    def _trigger_hold(self, duration_sec: float = 2.5) -> None:
        """Kích hoạt khoảng thời gian giữ kết quả trước khi tiếp tục quét."""
        self._holding_result = True
        self._hold_end_time = time.time() + duration_sec

    @Slot(object)
    def process_camera_frame(self, frame: np.ndarray | None) -> None:
        """Nhận khung hình từ CameraWorker, cấp cho VideoImageProvider và kích hoạt pipeline AI."""
        if frame is None or frame.size == 0:
            return

        # 1. Cập nhật khung hình cho VideoImageProvider QML
        if self.image_provider:
            self.image_provider.update_frame(frame)

        # 2. Nếu đang giữ màn hình kết quả Success / Error thì tạm dừng phân tích AI
        if self._holding_result:
            if time.time() < self._hold_end_time:
                return
            self._holding_result = False
            self.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")

        # 3. Pipeline Bước 1: Phát hiện khuôn mặt bằng YuNet
        if self.detector is None:
            return

        detection = self.detector.detect_face(frame)
        if detection is None:
            self.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")
            return

        # Kiểm tra góc nghiêng Euler
        if detection.is_tilted:
            self.set_state(
                OvalState.ALIGNING,
                "Vui lòng giữ thẳng mặt, nhìn trực diện vào ống kính",
            )
            return

        # Kiểm tra kích thước khuôn mặt
        if not detection.is_valid_size:
            self.set_state(
                OvalState.ALIGNING,
                "Vui lòng đứng lại gần camera hơn (khuôn mặt quá nhỏ)",
            )
            return

        # 4. Pipeline Bước 2: Kiểm tra thực thể sống Liveness chống giả mạo (MiniFASNet)
        if self.liveness_gate is not None:
            liveness_score = float(self.liveness_gate.predict(frame, detection.bbox))
            if liveness_score < settings.liveness_threshold:
                self.set_state(
                    OvalState.ERROR,
                    "CẢNH BÁO: PHÁT HIỆN KHUÔN MẶT KHÔNG HỢP LỆ!",
                )
                self._trigger_hold(duration_sec=2.5)
                logger.warning("Từ chối điểm danh: Liveness không đạt (score=%.3f)", liveness_score)
                return
        else:
            liveness_score = 1.0

        # 5. Pipeline Bước 3: Căn chỉnh và trích xuất vector 512D ArcFace
        if self.extractor is None or self.gallery_matcher is None:
            return

        aligned_face = self.extractor.align_face(frame, detection.landmarks)
        vector = self.extractor.extract_vector(aligned_face)

        # 6. Pipeline Bước 4: So khớp 1:N với ma trận RAM Gallery
        emp_id, score = self.gallery_matcher.match(vector)
        if emp_id is None:
            self.set_state(
                OvalState.ERROR,
                "Khuôn mặt chưa được đăng ký trong hệ thống",
            )
            self._trigger_hold(duration_sec=2.5)
            logger.info("Không tìm thấy nhân viên khớp ngưỡng (score tối đa=%.3f)", score)
            return

        # 7. Pipeline Bước 5: Kiểm tra Cooldown chống quẹt trùng lặp trong 120s
        if self.cooldown_tracker:
            status = self.cooldown_tracker.check_cooldown(emp_id)
            if status.is_in_cooldown:
                self.set_state(
                    OvalState.ERROR,
                    f"Bạn vừa điểm danh rồi! Vui lòng chờ {status.remaining_seconds}s",
                )
                self._trigger_hold(duration_sec=2.5)
                return
            self.cooldown_tracker.record_punch(emp_id)

        # 8. Điểm danh thành công! Lưu vào SQLite WAL ngoại tuyến
        punch_time = datetime.now().strftime("%H:%M:%S")
        if self.queue_manager:
            self.queue_manager.enqueue_punch(
                employee_id=emp_id,
                punch_type="FACE",
                similarity_score=score,
                liveness_score=liveness_score,
                kiosk_id=settings.kiosk_id,
            )
            self._update_pending_sync_count()

        # Hiển thị thông báo thành công viền xanh lá
        self.set_state(
            OvalState.SUCCESS,
            f"Điểm danh thành công lúc {punch_time}!\nMã NV: {emp_id} (Độ tin cậy: {int(score * 100)}%)",
        )
        self._trigger_hold(duration_sec=3.0)
        logger.info(
            "Điểm danh THÀNH CÔNG nhân viên %d [score=%.3f, liveness=%.3f]",
            emp_id,
            score,
            liveness_score,
        )

    @Slot()
    def requestPinFallback(self) -> None:
        """Slot được gọi từ QML khi người dùng bấm nút Quẹt PIN dự phòng."""
        self.set_state(OvalState.ALIGNING, "Vui lòng nhập mã PIN trên bàn phím ảo...")
        self.openPinDialogRequested.emit()

    @Slot()
    def requestEnrollment(self) -> None:
        """Slot được gọi từ QML khi người dùng bấm Đăng ký nhân viên mới."""
        self.set_state(OvalState.ALIGNING, "Vui lòng nhập mã OTP để tiếp tục đăng ký...")
        self.openEnrollmentDialogRequested.emit()
