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
from typing import Any

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
from presentation.providers.video_image_provider import VideoImageProvider

logger = get_logger("kiosk_view_model")


class OvalState(StrEnum):
    """Máy trạng thái 4 màu viền Oval sinh trắc học."""

    IDLE = "IDLE"          # Xám: Chờ người dùng
    ALIGNING = "ALIGNING"  # Vàng: Đang phát hiện & căn chỉnh
    SUCCESS = "SUCCESS"    # Xanh lá: Nhận diện thành công
    ERROR = "ERROR"        # Đỏ: Spoofing hoặc lỗi


def evaluate_face_oval_alignment(
    frame_shape: tuple[int, ...],
    bbox: tuple[int, int, int, int],
) -> tuple[bool, str]:
    """Kiểm tra khuôn mặt có nằm chuẩn xác trong khung Oval trên màn hình Kiosk dọc hay không.

    Quy tắc hiển thị:
    - Màn hình Kiosk hiển thị camera theo tỷ lệ dọc 968 / 1496 (PreserveAspectCrop).
    - Tâm Oval nằm ở (chiều rộng / 2, chiều cao * 0.40).
    - Kích thước Oval tương ứng 470 x 604 px trên màn hình 968 x 1496 px.

    Trả về:
        (is_aligned, message_feedback)
    """
    fh, fw = frame_shape[:2]
    bx, by, bw, bh = bbox
    cx = bx + bw / 2.0
    cy = by + bh / 2.0

    # 1. Tỷ lệ viewport dọc của Kiosk (968 / 1496)
    aspect_vp = 968.0 / 1496.0
    visible_w = fh * aspect_vp
    if visible_w > fw:
        visible_w = float(fw)

    # 2. Tọa độ tâm và bán trục Oval trên khung hình camera gốc
    oval_cx = fw / 2.0
    oval_cy = fh * 0.40

    rx = (visible_w * (470.0 / 968.0)) / 2.0  # Bán trục ngang
    ry = (fh * (604.0 / 1496.0)) / 2.0        # Bán trục dọc

    # 3. Kiểm tra kích thước khuôn mặt (khoảng cách chuẩn 0.5m – 1.2m)
    # Khuôn mặt hợp lệ chiếm khoảng 35% đến 85% chiều cao Oval (2 * ry)
    min_face_h = (2.0 * ry) * 0.35
    max_face_h = (2.0 * ry) * 0.85

    if bh < min_face_h or bw < min_face_h * 0.65:
        return False, "Vui lòng đứng lại gần camera hơn"

    if bh > max_face_h or bw > max_face_h * 0.90:
        return False, "Vui lòng lùi ra xa camera một chút"

    # 4. Kiểm tra tâm khuôn mặt có nằm bên trong hình Oval (dung sai 20% biên)
    dx = (cx - oval_cx) / (rx * 1.20)
    dy = (cy - oval_cy) / (ry * 1.20)
    distance_sq = dx * dx + dy * dy

    if distance_sq > 1.0:
        if dx < -0.4:
            return False, "Vui lòng di chuyển sang phải vào giữa khung Oval"
        elif dx > 0.4:
            return False, "Vui lòng di chuyển sang trái vào giữa khung Oval"
        elif dy < -0.4:
            return False, "Vui lòng hạ tầm mắt vào giữa khung Oval"
        elif dy > 0.4:
            return False, "Vui lòng nâng tầm mắt vào giữa khung Oval"
        return False, "Vui lòng đưa khuôn mặt vào giữa khung Oval"

    return True, "Khuôn mặt đã ở vị trí chuẩn xác"


class KioskViewModel(QObject):
    """ViewModel điều phối trạng thái hiển thị và hành động của Kiosk QML View."""

    ovalStateChanged = Signal(str)
    messageChanged = Signal(str)
    isProcessingChanged = Signal(bool)
    pendingSyncCountChanged = Signal(int)
    frameReady = Signal()
    openPinDialogRequested = Signal()
    openEnrollmentDialogRequested = Signal()
    lastResultChanged = Signal()
    networkStatusChanged = Signal(bool, str)
    isStandbyChanged = Signal(bool)

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
        stability_threshold: int = 8,
        enrollment_controller: Any = None,
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
        self.enrollment_controller = enrollment_controller
        self._stability_threshold: int = max(1, stability_threshold)
        self._stable_frames: int = 0
        self._frame_tick: int = 0

        self._oval_state: str = OvalState.IDLE
        self._message: str = "Vui lòng nhìn vào khung hình để điểm danh"
        self._is_processing: bool = False
        self._pending_sync_count: int = 0

        # Kết quả lần điểm danh gần nhất
        self._last_emp_id: int | None = None
        self._last_punch_time: str = ""
        self._last_score: float = 0.0

        # Trạng thái mạng Kiosk
        self._is_online: bool = True
        self._network_message: str = "Đang kết nối hệ thống"

        # Khoảng thời gian dừng giữ kết quả thành công/thất bại (Hold duration)
        self._holding_result: bool = False
        self._hold_end_time: float = 0.0

        # Trạng thái Màn hình Chờ Chào mừng (Standby) mặc định khi khởi động
        self._is_standby: bool = True
        self._last_face_time: float = time.time()
        self._standby_timeout: float = 8.0  # 8.0 giây vắng người -> Standby
        self._enrollment_cooldown_until: float = 0.0  # Grace period sau khi nạp mẫu khuôn mặt

        if self.enrollment_controller is not None and hasattr(self.enrollment_controller, "dialogOpenChanged"):
            def _on_enrollment_dialog_open_changed(is_open: bool) -> None:
                if not is_open:
                    self._enrollment_cooldown_until = time.time() + 5.0
                    logger.info("Đã đóng hộp thoại đăng ký -> Kích hoạt Grace Period 5.0s không nhận diện điểm danh")
            self.enrollment_controller.dialogOpenChanged.connect(_on_enrollment_dialog_open_changed)

        if self.sync_worker:
            self.sync_worker.network_status_changed.connect(self._on_network_status_changed)
            self.sync_worker.sync_progress.connect(self._on_sync_progress)

        if self.queue_manager:
            self._update_pending_sync_count()

    def _on_network_status_changed(self, is_online: bool, message: str) -> None:
        """Xử lý tín hiệu cập nhật trạng thái mạng từ OfflineSyncWorker."""
        self._is_online = is_online
        self._network_message = message
        self.networkStatusChanged.emit(is_online, message)

    def _on_sync_progress(self, synced_count: int, pending_count: int) -> None:
        """Xử lý tín hiệu tiến độ đồng bộ từ OfflineSyncWorker."""
        if pending_count != self._pending_sync_count:
            self._pending_sync_count = pending_count
            self.pendingSyncCountChanged.emit(pending_count)

    @Property(str, notify=ovalStateChanged)
    def ovalState(self) -> str:
        """Lấy trạng thái viền oval hiện tại."""
        return self._oval_state

    @Property(int, notify=ovalStateChanged)
    def recognitionState(self) -> int:
        """Lấy mã trạng thái số nguyên: 0: IDLE, 1: ALIGNING, 2: SUCCESS, 3: ERROR."""
        mapping = {
            OvalState.IDLE: 0,
            OvalState.ALIGNING: 1,
            OvalState.SUCCESS: 2,
            OvalState.ERROR: 3,
        }
        return mapping.get(OvalState(self._oval_state), 0)

    @Property(bool, notify=isStandbyChanged)
    def isStandby(self) -> bool:
        """Kiểm tra có đang ở trạng thái Standby (Chờ chào mừng) hay không."""
        return self._is_standby

    @Slot(bool)
    def setStandby(self, standby: bool) -> None:
        """Chuyển đổi thủ công hoặc tự động giữa Standby (Chờ chào mừng) và Active (Quét camera)."""
        if self._is_standby != standby:
            self._is_standby = standby
            self._last_face_time = time.time()
            self.isStandbyChanged.emit(standby)
            if standby:
                self.set_state(OvalState.IDLE, "Trạm đang ở chế độ chờ chào mừng")
            else:
                self.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")

    @Slot()
    def simulateSuccess(self) -> None:
        """Giả lập điểm danh thành công cho dev testing."""
        punch_time = datetime.now().strftime("%H:%M:%S")
        self._last_emp_id = 1001
        self._last_punch_time = punch_time
        self._last_score = 0.98
        self.lastResultChanged.emit()
        self.set_state(
            OvalState.SUCCESS,
            f"Điểm danh thành công lúc {punch_time}!\nMã NV: 1001 (Độ tin cậy: 98%)",
        )
        self._trigger_hold(duration_sec=3.0)

    @Property(int, notify=frameReady)
    def frameTick(self) -> int:
        """Bộ đếm frame tăng dần mỗi khi có khung hình mới để kích hoạt QML reload."""
        return self._frame_tick

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

    @Property(str, notify=lastResultChanged)
    def lastEmployeeId(self) -> str:
        """Mã nhân viên vừa điểm danh thành công gần nhất."""
        return str(self._last_emp_id) if self._last_emp_id is not None else ""

    @Property(str, notify=lastResultChanged)
    def lastPunchTime(self) -> str:
        """Thời gian ghi nhận điểm danh gần nhất."""
        return self._last_punch_time

    @Property(int, notify=lastResultChanged)
    def lastMatchScore(self) -> int:
        """Độ tương đồng Cosine gần nhất (0-100%)."""
        return int(self._last_score * 100)

    @Property(bool, notify=networkStatusChanged)
    def isOnline(self) -> bool:
        """Trạng thái kết nối trực tuyến tới máy chủ trung tâm."""
        return self._is_online

    @Property(str, notify=networkStatusChanged)
    def networkMessage(self) -> str:
        """Thông điệp chi tiết trạng thái kết nối mạng."""
        return self._network_message

    @Property(str, constant=True)
    def kioskId(self) -> str:
        """Mã định danh phần cứng của trạm Kiosk."""
        return settings.kiosk_id

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
            self._frame_tick += 1
            self.frameReady.emit()

        # NẾU ĐANG Ở STANDBY: Quét ngầm để phát hiện người dùng bước tới (Smart Standby & Instant Wake-up)
        detection = None
        if self._is_standby:
            if self.detector is not None:
                detection = self.detector.detect_face(frame)
                if detection is not None:
                    logger.info("Phát hiện người dùng bước tới trạm -> Đánh thức Kiosk (Standby -> Active)")
                    self.setStandby(False)
                else:
                    return
            else:
                return

        current_time = time.time()

        # Nếu đang ở chế độ Đăng ký mẫu khuôn mặt mới (Bước 1, 2, 3) hoặc đang trong Grace Period: Tạm dừng nhận diện điểm danh
        is_dialog_open = False
        if self.enrollment_controller is not None:
            is_dialog_open = getattr(self.enrollment_controller, "isDialogOpen", False) or getattr(self.enrollment_controller, "isEnrolling", False)

        if is_dialog_open or (current_time < self._enrollment_cooldown_until):
            self._last_face_time = current_time
            return

        # 2. Nếu đang giữ màn hình kết quả Success / Error thì tạm dừng phân tích AI
        if self._holding_result:
            self._last_face_time = current_time
            if current_time < self._hold_end_time:
                return
            self._holding_result = False
            self.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")

        # 3. Pipeline Bước 1: Phát hiện khuôn mặt bằng YuNet
        if self.detector is None:
            return

        if detection is None:
            detection = self.detector.detect_face(frame)

        if detection is None:
            self._stable_frames = 0
            self.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")
            # Tự động chuyển về Màn hình Chờ Chào mừng khi không phát hiện người trong 8 giây
            if current_time - self._last_face_time >= self._standby_timeout:
                logger.info("Không phát hiện người dùng trong %.1fs -> Tự động chuyển sang Standby", self._standby_timeout)
                self.setStandby(True)
            return

        # Có khuôn mặt trước camera -> Cập nhật mốc thời gian hoạt động gần nhất
        self._last_face_time = current_time

        # Kiểm tra góc nghiêng Euler
        if detection.is_tilted:
            self._stable_frames = 0
            self.set_state(
                OvalState.ALIGNING,
                "Vui lòng giữ thẳng mặt, nhìn trực diện vào ống kính",
            )
            return

        # Kiểm tra khuôn mặt nằm chuẩn trong khung Oval & khoảng cách camera (quá gần/quá xa/lệch)
        is_aligned, align_msg = evaluate_face_oval_alignment(frame.shape, detection.bbox)
        if not is_aligned:
            self._stable_frames = 0
            self.set_state(OvalState.ALIGNING, align_msg)
            return

        # Yêu cầu khuôn mặt ổn định liên tục trước khi kích hoạt AI
        if self._stability_threshold > 1:
            self._stable_frames += 1
            if self._stable_frames < self._stability_threshold:
                self.set_state(
                    OvalState.ALIGNING,
                    "Đang định vị... Vui lòng giữ yên khuôn mặt",
                )
                return

        self._stable_frames = 0

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
        last_punch = self.queue_manager.get_last_punch_type(emp_id) if self.queue_manager else None
        punch_type = "CHECK_OUT" if last_punch == "CHECK_IN" else "CHECK_IN"

        if self.queue_manager:
            self.queue_manager.enqueue_punch(
                employee_id=emp_id,
                punch_type=punch_type,
                verification_method="VERIFICATION_FACE",
                confidence_score=score,
                kiosk_id=settings.kiosk_id,
            )
            self._update_pending_sync_count()

        self._last_emp_id = emp_id
        self._last_punch_time = punch_time
        self._last_score = score
        self.lastResultChanged.emit()

        # Hiển thị thông báo thành công viền xanh lá
        punch_label = "VÀO CA" if punch_type == "CHECK_IN" else "TAN CA"
        self.set_state(
            OvalState.SUCCESS,
            f"Điểm danh {punch_label} ({punch_type}) thành công lúc {punch_time}!\nMã NV: {emp_id} (Độ tin cậy: {int(score * 100)}%)",
        )
        self._trigger_hold(duration_sec=3.0)
        logger.info(
            "Điểm danh %s THÀNH CÔNG nhân viên %d [score=%.3f, liveness=%.3f]",
            punch_type,
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

    @Slot(str)
    def submitPin(self, pin_code: str) -> None:
        """Xử lý điểm danh bằng mã PIN từ giao diện QML."""
        try:
            emp_id = int(pin_code)
        except ValueError:
            emp_id = 9999

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

        punch_time = datetime.now().strftime("%H:%M:%S")
        last_punch = self.queue_manager.get_last_punch_type(emp_id) if self.queue_manager else None
        punch_type = "CHECK_OUT" if last_punch == "CHECK_IN" else "CHECK_IN"

        if self.queue_manager:
            self.queue_manager.enqueue_punch(
                employee_id=emp_id,
                punch_type=punch_type,
                verification_method="VERIFICATION_PIN",
                confidence_score=1.0,
                kiosk_id=settings.kiosk_id,
            )
            self._update_pending_sync_count()

        self._last_emp_id = emp_id
        self._last_punch_time = punch_time
        self._last_score = 1.0
        self.lastResultChanged.emit()

        punch_label = "VÀO CA" if punch_type == "CHECK_IN" else "TAN CA"
        self.set_state(
            OvalState.SUCCESS,
            f"Điểm danh {punch_label} ({punch_type}) mã PIN thành công lúc {punch_time}!\nMã NV: {emp_id}",
        )
        self._trigger_hold(duration_sec=3.0)
        logger.info("Điểm danh mã PIN %s THÀNH CÔNG cho mã: %s", punch_type, pin_code)

