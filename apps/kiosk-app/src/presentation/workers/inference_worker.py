"""InferenceWorker: QThread độc lập xử lý nhận diện AI và ghi nhận điểm danh ngoại tuyến.

Tài liệu tham chiếu:
- ARCH-K-01: Tách rời tải tính toán AI (YuNet, MiniFASNet, ArcFace) và I/O SQLite WAL
  khỏi Main GUI Thread (UI QML) để đảm bảo tốc độ khung hình 60 FPS mượt mà.
- DDS.md: Pipeline thị giác máy tính biên (Edge AI Vision Pipeline).
- Hàng đợi xoay vòng (Circular Queue maxsize=2) loại bỏ khung hình cũ khi hệ thống bận.
"""

import queue
import time
from datetime import datetime

import numpy as np
from PySide6.QtCore import QObject, QThread, Signal, Slot

from config.logger import get_logger
from config.settings import settings
from core.cooldown.cooldown_tracker import CooldownTracker
from core.offline.sqlite_manager import SQLiteQueueManager
from core.vision.face_detector import YuNetFaceDetector
from core.vision.feature_extractor import ArcFaceFeatureExtractor
from core.vision.gallery_matcher import GalleryCacheManager
from core.vision.liveness_gate import MiniFASNetLivenessGate
from presentation.viewmodels.oval_alignment import (
    OvalState,
    evaluate_face_oval_alignment,
)

logger = get_logger("inference_worker")


class InferenceWorker(QThread):
    """Worker QThread tiếp nhận frame qua hàng đợi xoay vòng và thực thi AI pipeline ngầm."""

    # Tín hiệu phát hiện khuôn mặt (FaceDetectionResult hoặc None)
    face_detected = Signal(object)

    # Tín hiệu cập nhật trạng thái viền oval và thông điệp (oval_state: str, message: str)
    status_updated = Signal(str, str)

    # Tín hiệu so khớp nhân viên thành công (employee_id: int, score: float)
    employee_matched = Signal(int, float)

    # Tín hiệu ghi nhận điểm danh thành công (emp_id: int, punch_time: str, score: float, punch_type: str)
    punch_recorded = Signal(int, str, float, str)

    # Tín hiệu yêu cầu đánh thức trạm từ chế độ Chờ (Standby) khi phát hiện người
    standby_wake_requested = Signal()

    # Tín hiệu tổng hợp kết quả suy luận hoàn tất
    inference_completed = Signal(dict)

    def __init__(
        self,
        detector: YuNetFaceDetector | None = None,
        liveness_gate: MiniFASNetLivenessGate | None = None,
        extractor: ArcFaceFeatureExtractor | None = None,
        gallery_matcher: GalleryCacheManager | None = None,
        cooldown_tracker: CooldownTracker | None = None,
        queue_manager: SQLiteQueueManager | None = None,
        stability_threshold: int = 8,
        kiosk_id: str | None = None,
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo InferenceWorker."""
        super().__init__(parent)
        self.detector = detector
        self.liveness_gate = liveness_gate
        self.extractor = extractor
        self.gallery_matcher = gallery_matcher
        self.cooldown_tracker = cooldown_tracker
        self.queue_manager = queue_manager
        self.stability_threshold = max(1, stability_threshold)
        self.kiosk_id = kiosk_id or settings.kiosk_id

        # Hàng đợi xoay vòng với kích thước tối đa 2 (Circular Queue maxsize=2)
        self._queue: queue.Queue[np.ndarray] = queue.Queue(maxsize=2)
        self._is_running: bool = False

        # Các cờ điều khiển luồng
        self._is_standby: bool = True
        self._is_paused: bool = False
        self._enrollment_active: bool = False
        self._enrollment_cooldown_until: float = 0.0

        # Bộ đếm khung hình ổn định
        self._stable_frames: int = 0

        # Cơ chế giữ màn hình kết quả (Hold duration)
        self._is_holding: bool = False
        self._hold_end_time: float = 0.0

    @property
    def is_running(self) -> bool:
        """Kiểm tra trạng thái đang hoạt động của worker."""
        return self._is_running

    @property
    def queue_size(self) -> int:
        """Số lượng khung hình đang chờ trong hàng đợi."""
        return self._queue.qsize()

    @Slot(object)
    def enqueue_frame(self, frame: np.ndarray | None) -> bool:
        """Nhận khung hình từ Camera và đưa vào hàng đợi xoay vòng.

        Nếu hàng đợi đầy (worker đang bận suy luận AI), tự động loại bỏ
        khung hình cũ nhất để chống trễ tích lũy và giữ độ trễ tối thiểu.

        Returns:
            bool: True nếu đưa frame vào hàng đợi thành công, False nếu bị bỏ qua.
        """
        if frame is None or frame.size == 0 or not self._is_running:
            return False

        # Nếu hàng đợi đầy, loại bỏ khung hình cũ nhất (Drop stale frame)
        while self._queue.full():
            try:
                self._queue.get_nowait()
            except queue.Empty:
                break

        try:
            self._queue.put_nowait(frame)
            return True
        except queue.Full:
            return False

    def set_standby(self, standby: bool) -> None:
        """Cập nhật chế độ Standby cho worker."""
        self._is_standby = standby
        if standby:
            self._stable_frames = 0

    def set_enrollment_active(self, active: bool) -> None:
        """Cập nhật cờ tạm dừng nhận diện khi đang mở dialog đăng ký."""
        self._enrollment_active = active
        if active:
            self._stable_frames = 0

    def set_enrollment_cooldown(self, until_timestamp: float) -> None:
        """Thiết lập thời điểm kết thúc thời gian chờ sau đăng ký."""
        self._enrollment_cooldown_until = until_timestamp

    def set_paused(self, paused: bool) -> None:
        """Tạm dừng hoặc tiếp tục suy luận AI."""
        self._is_paused = paused

    def trigger_hold(self, duration_sec: float = 2.5) -> None:
        """Kích hoạt thời gian giữ kết quả nhận diện."""
        self._is_holding = True
        self._hold_end_time = time.time() + duration_sec

    def stop(self) -> None:
        """Dừng luồng an toàn và dọn sạch hàng đợi."""
        self._is_running = False
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
            except queue.Empty:
                break
        self.wait(1000)

    def run(self) -> None:
        """Vòng lặp chính xử lý suy luận AI trong QThread riêng biệt."""
        self._is_running = True
        logger.info("InferenceWorker QThread đã khởi động (Tách biệt hoàn toàn khỏi GUI Thread).")

        while self._is_running:
            try:
                frame = self._queue.get(timeout=0.05)
            except queue.Empty:
                continue

            if not self._is_running:
                break

            try:
                self._process_frame(frame)
            except Exception as exc:
                logger.warning("Lỗi ngoài dự kiến trong InferenceWorker._process_frame: %s", exc)

        logger.info("InferenceWorker QThread đã dừng an toàn.")

    def _process_frame(self, frame: np.ndarray) -> None:
        """Thực thi pipeline AI và ghi SQLite WAL trong worker thread."""
        current_time = time.time()

        # 1. Kiểm tra trạng thái giữ màn hình kết quả (Hold duration)
        if self._is_holding:
            if current_time < self._hold_end_time:
                return
            self._is_holding = False
            self.status_updated.emit(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")

        # 2. Kiểm tra chế độ đăng ký khuôn mặt hoặc tạm dừng
        if self._is_paused or self._enrollment_active:
            return

        if current_time < self._enrollment_cooldown_until:
            return

        # 3. Quét phát hiện khuôn mặt (YuNet)
        if self.detector is None:
            return

        detection = self.detector.detect_face(frame)

        # 4. Nếu đang ở Standby: Đánh thức tức thì khi có người bước tới
        if self._is_standby:
            if detection is not None:
                logger.info(
                    "InferenceWorker: Phát hiện người dùng -> Đánh thức Kiosk (Standby -> Active)"
                )
                self._is_standby = False
                self.standby_wake_requested.emit()
                self.face_detected.emit(detection)
            else:
                return
        else:
            self.face_detected.emit(detection)

        if detection is None:
            self._stable_frames = 0
            self.status_updated.emit(OvalState.IDLE, "Vui lòng nhìn vào khung hình để điểm danh")
            return

        # 5. Kiểm tra góc nghiêng Euler
        if detection.is_tilted:
            self._stable_frames = 0
            self.status_updated.emit(
                OvalState.ALIGNING,
                "Vui lòng giữ thẳng mặt, nhìn trực diện vào ống kính",
            )
            return

        # 6. Kiểm tra căn chỉnh Oval và khoảng cách
        is_aligned, align_msg = evaluate_face_oval_alignment(frame.shape, detection.bbox)
        if not is_aligned:
            self._stable_frames = 0
            self.status_updated.emit(OvalState.ALIGNING, align_msg)
            return

        # 7. Bộ đếm ổn định liên tục trước khi suy luận nặng
        if self.stability_threshold > 1:
            self._stable_frames += 1
            if self._stable_frames < self.stability_threshold:
                self.status_updated.emit(
                    OvalState.ALIGNING,
                    "Đang định vị... Vui lòng giữ yên khuôn mặt",
                )
                return

        self._stable_frames = 0

        # 8. Kiểm tra thực thể sống Liveness chống giả mạo (MiniFASNet)
        if self.liveness_gate is not None:
            liveness_score = float(self.liveness_gate.predict(frame, detection.bbox))
            gate_threshold = getattr(self.liveness_gate, "threshold", None)
            if not isinstance(gate_threshold, (int, float)):
                gate_threshold = settings.liveness_threshold

            if liveness_score < gate_threshold:
                self.status_updated.emit(
                    OvalState.ERROR,
                    "CẢNH BÁO: PHÁT HIỆN KHUÔN MẶT KHÔNG HỢP LỆ!",
                )
                self.trigger_hold(duration_sec=2.5)
                logger.warning(
                    "InferenceWorker: Liveness bị từ chối (score=%.3f < threshold=%.3f)",
                    liveness_score,
                    gate_threshold,
                )
                return
        else:
            liveness_score = 1.0

        # 9. Trích xuất vector ArcFace và so khớp Gallery RAM
        if self.extractor is None or self.gallery_matcher is None:
            return

        aligned_face = self.extractor.align_face(frame, detection.landmarks)
        vector = self.extractor.extract_vector(aligned_face)

        emp_id, score = self.gallery_matcher.match(vector)
        if emp_id is None:
            self.status_updated.emit(
                OvalState.ERROR,
                "Khuôn mặt chưa được đăng ký trong hệ thống",
            )
            self.trigger_hold(duration_sec=2.5)
            logger.info("InferenceWorker: Không khớp Gallery (max score=%.3f)", score)
            return

        self.employee_matched.emit(emp_id, score)

        # 10. Kiểm tra Cooldown chống quẹt trùng lặp trong 120s
        if self.cooldown_tracker:
            status = self.cooldown_tracker.check_cooldown(emp_id)
            if status.is_in_cooldown:
                self.status_updated.emit(
                    OvalState.ERROR,
                    f"Bạn vừa điểm danh rồi! Vui lòng chờ {status.remaining_seconds}s",
                )
                self.trigger_hold(duration_sec=2.5)
                return

        # 11. Ghi nhận điểm danh thành công vào SQLite WAL ngoại tuyến (ngoài GUI Thread)
        punch_time = datetime.now().strftime("%H:%M:%S")
        last_punch = self.queue_manager.get_last_punch_type(emp_id) if self.queue_manager else None
        punch_type = "CHECK_OUT" if last_punch == "CHECK_IN" else "CHECK_IN"

        if self.queue_manager:
            self.queue_manager.enqueue_punch(
                employee_id=emp_id,
                punch_type=punch_type,
                verification_method="VERIFICATION_FACE",
                confidence_score=score,
                kiosk_id=self.kiosk_id,
            )

        if self.cooldown_tracker:
            self.cooldown_tracker.record_punch(emp_id)

        punch_label = "VÀO CA" if punch_type == "CHECK_IN" else "TAN CA"
        success_message = (
            f"Điểm danh {punch_label} ({punch_type}) thành công lúc {punch_time}!\n"
            f"Mã NV: {emp_id} (Độ tin cậy: {int(score * 100)}%)"
        )

        # Phát tín hiệu điểm danh hoàn tất về Main Thread
        self.punch_recorded.emit(emp_id, punch_time, score, punch_type)
        self.status_updated.emit(OvalState.SUCCESS, success_message)
        self.trigger_hold(duration_sec=3.0)

        result_payload = {
            "employee_id": emp_id,
            "punch_time": punch_time,
            "punch_type": punch_type,
            "score": score,
            "liveness_score": liveness_score,
            "bbox": detection.bbox,
        }
        self.inference_completed.emit(result_payload)

        logger.info(
            "InferenceWorker: Điểm danh %s THÀNH CÔNG nhân viên %d [score=%.3f, liveness=%.3f]",
            punch_type,
            emp_id,
            score,
            liveness_score,
        )
