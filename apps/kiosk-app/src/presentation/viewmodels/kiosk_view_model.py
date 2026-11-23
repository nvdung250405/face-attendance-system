"""KioskViewModel: Lớp ViewModel trung gian kết nối lõi AI/Camera với giao diện QML.

Tuân thủ mô hình MVC/MVVM:
- Kế thừa QObject
- Cung cấp @Property kèm Signal notify để QML tự động cập nhật viền oval, thông điệp
- Điều phối pipeline nhận diện khuôn mặt AI: YuNet -> MiniFASNet -> ArcFace -> Gallery -> Cooldown -> SQLite WAL
- Tách rời tính toán AI nặng và SQLite WAL sang InferenceWorker QThread ngầm
- Cung cấp @Slot để QML gọi các hành động nghiệp vụ
"""

import time
from datetime import datetime
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
from presentation.viewmodels.oval_alignment import (
    OvalState,
    evaluate_face_oval_alignment,
)

logger = get_logger("kiosk_view_model")

__all__ = ["KioskViewModel", "OvalState", "evaluate_face_oval_alignment"]


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
        pin_controller: Any = None,
        is_dev_mode: bool | None = None,
        inference_worker: Any = None,
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo KioskViewModel."""
        super().__init__(parent)
        self._is_dev_mode: bool = (
            is_dev_mode if is_dev_mode is not None else settings.is_development
        )
        self.image_provider = image_provider
        self.detector = detector
        self.liveness_gate = liveness_gate
        self.extractor = extractor
        self.gallery_matcher = gallery_matcher
        self.cooldown_tracker = cooldown_tracker
        self.queue_manager = queue_manager
        self.sync_worker = sync_worker
        self.enrollment_controller = enrollment_controller
        self.pin_controller = pin_controller
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

        # Gắn kết InferenceWorker nếu được truyền vào
        self._inference_worker: Any = None
        if inference_worker is not None:
            self.set_inference_worker(inference_worker)

        if self.enrollment_controller is not None:
            if hasattr(self.enrollment_controller, "dialogOpenChanged"):

                def _on_enrollment_dialog_open_changed(is_open: bool) -> None:
                    self._last_face_time = time.time()
                    if is_open:
                        self.setStandby(False)
                    if self._inference_worker is not None:
                        self._inference_worker.set_enrollment_active(is_open)
                    if not is_open:
                        cooldown_until = time.time() + 5.0
                        self._enrollment_cooldown_until = cooldown_until
                        if self._inference_worker is not None:
                            self._inference_worker.set_enrollment_cooldown(cooldown_until)
                        logger.info(
                            "Đã đóng hộp thoại đăng ký -> Kích hoạt Grace Period 5.0s không nhận diện điểm danh"
                        )

                self.enrollment_controller.dialogOpenChanged.connect(
                    _on_enrollment_dialog_open_changed
                )

            if hasattr(self.enrollment_controller, "currentStepChanged"):
                self.enrollment_controller.currentStepChanged.connect(
                    lambda _step: self.reset_activity()
                )
            if hasattr(self.enrollment_controller, "yawChanged"):
                self.enrollment_controller.yawChanged.connect(lambda _yaw: self.reset_activity())

        if self.pin_controller is not None:
            if hasattr(self.pin_controller, "pinChanged"):
                self.pin_controller.pinChanged.connect(lambda _p: self.reset_activity())
            if hasattr(self.pin_controller, "employeeCodeChanged"):
                self.pin_controller.employeeCodeChanged.connect(lambda _c: self.reset_activity())

        if self.sync_worker:
            self.sync_worker.network_status_changed.connect(self._on_network_status_changed)
            self.sync_worker.sync_progress.connect(self._on_sync_progress)

        if self.queue_manager:
            self._update_pending_sync_count()

    def set_inference_worker(self, worker: Any) -> None:
        """Gắn kết InferenceWorker chạy nền và kết nối các tín hiệu sang Main Thread."""
        if self._inference_worker is not None:
            try:
                self._inference_worker.status_updated.disconnect(self._on_worker_status_updated)
                self._inference_worker.punch_recorded.disconnect(self._on_worker_punch_recorded)
                self._inference_worker.standby_wake_requested.disconnect(
                    self._on_worker_standby_wake
                )
                self._inference_worker.face_detected.disconnect(self._on_worker_face_detected)
            except Exception as exc:
                logger.debug("Không thể ngắt kết nối tín hiệu inference_worker cũ: %s", exc)

        self._inference_worker = worker
        if self._inference_worker is not None:
            self._inference_worker.status_updated.connect(self._on_worker_status_updated)
            self._inference_worker.punch_recorded.connect(self._on_worker_punch_recorded)
            self._inference_worker.standby_wake_requested.connect(self._on_worker_standby_wake)
            self._inference_worker.face_detected.connect(self._on_worker_face_detected)
            self._inference_worker.set_standby(self._is_standby)

    @property
    def inference_worker(self) -> Any:
        """Lấy đối tượng InferenceWorker đang gắn kết."""
        return self._inference_worker

    @Slot(str, str)
    def _on_worker_status_updated(self, state: str, message: str) -> None:
        """Xử lý tín hiệu cập nhật trạng thái viền oval và thông báo từ InferenceWorker."""
        self.set_state(state, message)

    @Slot(int, str, float, str)
    def _on_worker_punch_recorded(
        self, emp_id: int, punch_time: str, score: float, punch_type: str
    ) -> None:
        """Xử lý tín hiệu điểm danh thành công từ InferenceWorker."""
        self._last_emp_id = emp_id
        self._last_punch_time = punch_time
        self._last_score = score
        self.lastResultChanged.emit()
        self._update_pending_sync_count()

    @Slot()
    def _on_worker_standby_wake(self) -> None:
        """Đánh thức Kiosk từ Chế độ Chờ khi Worker phát hiện khuôn mặt."""
        self.setStandby(False)

    @Slot(object)
    def _on_worker_face_detected(self, detection: Any) -> None:
        """Cập nhật thời gian phát hiện khuôn mặt gần nhất."""
        if detection is not None:
            self._last_face_time = time.time()

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
            if self._inference_worker is not None:
                self._inference_worker.set_standby(standby)
            if standby:
                self.set_state(OvalState.IDLE, "Trạm đang ở chế độ chờ chào mừng")
            else:
                self.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")

    @Property(bool, constant=True)
    def isDevMode(self) -> bool:
        """Kiểm tra có đang ở chế độ phát triển/thử nghiệm hay không."""
        return self._is_dev_mode

    @Property(bool, constant=True)
    def isProduction(self) -> bool:
        """Kiểm tra có đang ở chế độ sản xuất chính thức hay không."""
        return not self._is_dev_mode

    @Slot()
    def simulateSuccess(self) -> None:
        """Giả lập điểm danh thành công cho dev testing (bị chặn ở Production)."""
        if not self._is_dev_mode:
            logger.warning("Bỏ qua simulateSuccess vì Kiosk đang chạy ở môi trường Production!")
            return
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
            logger.debug(
                "Trạng thái oval cập nhật: state=%s, message=%s", self._oval_state, self._message
            )

    def _trigger_hold(self, duration_sec: float = 2.5) -> None:
        """Kích hoạt khoảng thời gian giữ kết quả trước khi tiếp tục quét."""
        self._holding_result = True
        self._hold_end_time = time.time() + duration_sec

    @Slot()
    def reset_activity(self) -> None:
        """Làm mới mốc thời gian hoạt động để tránh nhảy về Standby khi người dùng đang thao tác."""
        self._last_face_time = time.time()

    def _is_user_interacting(self, current_time: float) -> bool:
        """Kiểm tra người dùng có đang thao tác chủ động (Đăng ký, PIN, hoặc căn chỉnh khuôn mặt)."""
        if self.enrollment_controller is not None:
            if (
                getattr(self.enrollment_controller, "isDialogOpen", False)
                or getattr(self.enrollment_controller, "isEnrolling", False)
                or getattr(self.enrollment_controller, "currentStep", 0) > 0
            ):
                return True
        if self.pin_controller is not None:
            if getattr(self.pin_controller, "isDialogOpen", False) or bool(
                getattr(self.pin_controller, "currentPin", "")
            ):
                return True
        if self._oval_state != OvalState.IDLE or self._holding_result:
            return True
        if current_time < self._enrollment_cooldown_until:
            return True
        return False

    @Slot(object)
    def process_camera_frame(self, frame: np.ndarray | None) -> None:
        """Nhận khung hình từ CameraWorker, cấp cho VideoImageProvider và kích hoạt pipeline AI."""
        if frame is None or frame.size == 0:
            return

        # 1. Cập nhật khung hình cho VideoImageProvider QML (chạy trên Main Thread, cực nhanh 60 FPS)
        if self.image_provider:
            self.image_provider.update_frame(frame)
            self._frame_tick += 1
            self.frameReady.emit()

        current_time = time.time()

        # 2. Asynchronous Path: nếu có InferenceWorker đang chạy, gửi sang worker và return ngay lập tức
        if self._inference_worker is not None and self._inference_worker.isRunning():
            if self._is_user_interacting(current_time):
                self._last_face_time = current_time
            elif not self._is_standby and (
                current_time - self._last_face_time >= self._standby_timeout
            ):
                logger.info(
                    "Không phát hiện người dùng trong %.1fs -> Tự động chuyển sang Standby",
                    self._standby_timeout,
                )
                self.setStandby(True)
            self._inference_worker.enqueue_frame(frame)
            return

        # 3. Synchronous Fallback Path: chạy trực tiếp (hỗ trợ kiểm thử đơn vị đồng bộ)
        detection = None
        if self._is_standby:
            if self.detector is not None:
                detection = self.detector.detect_face(frame)
                if detection is not None:
                    logger.info(
                        "Phát hiện người dùng bước tới trạm -> Đánh thức Kiosk (Standby -> Active)"
                    )
                    self.setStandby(False)
                else:
                    return
            else:
                return

        # Nếu đang thao tác chủ động hoặc đang trong Grace Period: Tạm dừng nhận diện điểm danh tự động
        if self._is_user_interacting(current_time):
            self._last_face_time = current_time
            is_enroll_active = False
            if self.enrollment_controller is not None:
                is_enroll_active = getattr(
                    self.enrollment_controller, "isDialogOpen", False
                ) or getattr(self.enrollment_controller, "isEnrolling", False)
            if is_enroll_active or (current_time < self._enrollment_cooldown_until):
                return

        # Nếu đang giữ màn hình kết quả Success / Error thì tạm dừng phân tích AI
        if self._holding_result:
            self._last_face_time = current_time
            if current_time < self._hold_end_time:
                return
            self._holding_result = False
            self.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")

        # Pipeline Bước 1: Phát hiện khuôn mặt bằng YuNet
        if self.detector is None:
            return

        if detection is None:
            detection = self.detector.detect_face(frame)

        if detection is None:
            self._stable_frames = 0
            self.set_state(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")
            # Tự động chuyển về Màn hình Chờ Chào mừng khi không phát hiện người trong 8 giây
            if current_time - self._last_face_time >= self._standby_timeout:
                logger.info(
                    "Không phát hiện người dùng trong %.1fs -> Tự động chuyển sang Standby",
                    self._standby_timeout,
                )
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

        # Kiểm tra khuôn mặt nằm chuẩn trong khung Oval & khoảng cách camera
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

        # Pipeline Bước 2: Kiểm tra thực thể sống Liveness chống giả mạo (MiniFASNet)
        if self.liveness_gate is not None:
            liveness_score = float(self.liveness_gate.predict(frame, detection.bbox))
            gate_threshold = getattr(self.liveness_gate, "threshold", None)
            if not isinstance(gate_threshold, (int, float)):
                gate_threshold = settings.liveness_threshold
            if liveness_score < gate_threshold:
                self.set_state(
                    OvalState.ERROR,
                    "CẢNH BÁO: PHÁT HIỆN KHUÔN MẶT KHÔNG HỢP LỆ!",
                )
                self._trigger_hold(duration_sec=2.5)
                logger.warning("Từ chối điểm danh: Liveness không đạt (score=%.3f)", liveness_score)
                return
        else:
            liveness_score = 1.0

        # Pipeline Bước 3: Căn chỉnh và trích xuất vector 512D ArcFace
        if self.extractor is None or self.gallery_matcher is None:
            return

        aligned_face = self.extractor.align_face(frame, detection.landmarks)
        vector = self.extractor.extract_vector(aligned_face)

        # Pipeline Bước 4: So khớp 1:N với ma trận RAM Gallery
        emp_id, score = self.gallery_matcher.match(vector)
        if emp_id is None:
            self.set_state(
                OvalState.ERROR,
                "Khuôn mặt chưa được đăng ký trong hệ thống",
            )
            self._trigger_hold(duration_sec=2.5)
            logger.info("Không tìm thấy nhân viên khớp ngưỡng (score tối đa=%.3f)", score)
            return

        # Pipeline Bước 5: Kiểm tra Cooldown chống quẹt trùng lặp trong 120s
        if self.cooldown_tracker:
            status = self.cooldown_tracker.check_cooldown(emp_id)
            if status.is_in_cooldown:
                self.set_state(
                    OvalState.ERROR,
                    f"Bạn vừa điểm danh rồi! Vui lòng chờ {status.remaining_seconds}s",
                )
                self._trigger_hold(duration_sec=2.5)
                return

        # Điểm danh thành công! Lưu vào SQLite WAL ngoại tuyến
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

        if self.cooldown_tracker:
            self.cooldown_tracker.record_punch(emp_id)

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

    @Slot(int)
    def recordVerifiedPinPunch(self, employee_id: int) -> None:
        """Ghi nhận điểm danh PIN cho nhân viên ĐÃ được backend xác thực thành công."""
        emp_id = int(employee_id)

        if self.cooldown_tracker:
            status = self.cooldown_tracker.check_cooldown(emp_id)
            if status.is_in_cooldown:
                self.set_state(
                    OvalState.ERROR,
                    f"Bạn vừa điểm danh rồi! Vui lòng chờ {status.remaining_seconds}s",
                )
                self._trigger_hold(duration_sec=2.5)
                return

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

        if self.cooldown_tracker:
            self.cooldown_tracker.record_punch(emp_id)

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
        logger.info("Điểm danh mã PIN %s THÀNH CÔNG cho emp_id=%d", punch_type, emp_id)
