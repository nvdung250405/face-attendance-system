"""EnrollmentWorker: Luồng xử lý nền tách biệt tải suy luận AI và giao tiếp mạng cho Đăng ký khuôn mặt.

Tuân thủ:
- ARCH-K-01 & ISO 25010: Tách rời tải tính toán AI (YuNet, MiniFASNet, ArcFace) và I/O mạng
  khỏi Qt Main GUI Thread để đảm bảo giao diện 60 FPS không bị đóng băng khi ghi danh (PERF-01, PERF-02, PERF-03).
"""

import queue
import threading
from dataclasses import dataclass
from typing import Any

import httpx
import numpy as np
from PySide6.QtCore import QObject, QThread, Signal

from config.logger import get_logger
from core.vision.face_detector import FaceDetectionResult, YuNetFaceDetector
from core.vision.feature_extractor import ArcFaceFeatureExtractor
from core.vision.liveness_gate import MiniFASNetLivenessGate
from core.vision.quality_checker import EnrollmentQualityChecker, EnrollmentQualityReport, PoseType
from presentation.viewmodels.oval_alignment import evaluate_face_oval_alignment

logger = get_logger("enrollment_worker")


@dataclass
class EnrollmentFrameResult:
    """Kết quả xử lý khung hình đăng ký từ EnrollmentWorker."""

    detection: FaceDetectionResult | None = None
    is_aligned: bool = False
    align_message: str = ""
    liveness_score: float = 0.0
    quality_report: EnrollmentQualityReport | None = None
    aligned_face: np.ndarray | None = None
    vector: np.ndarray | None = None
    error_message: str = ""


class EnrollmentWorker(QThread):
    """Worker QThread tiếp nhận frame đăng ký và thực thi tác vụ AI & mạng ngầm."""

    # Tín hiệu phát khi hoàn tất suy luận một frame camera
    frame_processed = Signal(object)

    # Tín hiệu phát khi hoàn tất xác thực OTP (success: bool, status_code: int, data: dict, error_msg: str)
    otp_completed = Signal(bool, int, dict, str)

    # Tín hiệu phát khi hoàn tất gửi gói nạp biometric lên backend (success: bool, status_code: int, event_payload: dict, error_msg: str)
    submission_completed = Signal(bool, int, dict, str)

    def __init__(
        self,
        detector: YuNetFaceDetector | None = None,
        extractor: ArcFaceFeatureExtractor | None = None,
        liveness_gate: MiniFASNetLivenessGate | None = None,
        quality_checker: EnrollmentQualityChecker | None = None,
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo EnrollmentWorker."""
        super().__init__(parent)
        self.detector: YuNetFaceDetector | None = detector
        self.extractor: ArcFaceFeatureExtractor | None = extractor
        self.liveness_gate: MiniFASNetLivenessGate | None = liveness_gate
        self.quality_checker: EnrollmentQualityChecker = (
            quality_checker or EnrollmentQualityChecker()
        )

        self._frame_queue: queue.Queue[tuple[np.ndarray, PoseType, float]] = queue.Queue(maxsize=1)
        self._is_running: bool = False

    def enqueue_frame(self, frame: np.ndarray, target_pose: PoseType, min_liveness: float) -> None:
        """Đẩy frame vào hàng đợi nền (loại bỏ frame cũ nếu worker đang bận tính toán)."""
        if frame is None or frame.size == 0:
            return
        try:
            # Nếu hàng đợi đã có frame cũ đang chờ, xóa bỏ để luôn lấy frame mới nhất
            self._frame_queue.get_nowait()
        except queue.Empty:
            pass
        try:
            self._frame_queue.put_nowait((frame, target_pose, min_liveness))
        except queue.Full:
            pass

    def process_frame(
        self,
        frame: np.ndarray | None,
        target_pose: PoseType,
        min_liveness: float,
        quality_checker: EnrollmentQualityChecker | None = None,
    ) -> EnrollmentFrameResult:
        """Thực thi pipeline xử lý AI cho 1 frame (YuNet -> Oval -> Liveness -> Quality -> ArcFace)."""
        if frame is None or frame.size == 0 or self.detector is None:
            return EnrollmentFrameResult(align_message="Vui lòng nhìn vào khung hình camera...")

        qc = quality_checker or self.quality_checker

        # 1. Phát hiện khuôn mặt
        detection = self.detector.detect_face(frame)
        if detection is None:
            return EnrollmentFrameResult(align_message="Vui lòng nhìn vào khung hình camera...")

        # 2. Kiểm tra căn chỉnh Oval
        is_aligned, align_msg = evaluate_face_oval_alignment(frame.shape, detection.bbox)
        if not is_aligned:
            return EnrollmentFrameResult(
                detection=detection,
                is_aligned=False,
                align_message=align_msg,
            )

        # 3. Đánh giá thực thể sống (PAD)
        liveness_score = 1.0
        if self.liveness_gate is not None:
            try:
                res = self.liveness_gate.predict(frame, detection.bbox)
                liveness_score = float(res.score) if hasattr(res, "score") else float(res)
            except Exception as exc:
                logger.warning("Lỗi suy luận liveness trong EnrollmentWorker: %s", exc)
                liveness_score = 0.0

        # Cắt face_crop cho quality checker
        fh, fw = frame.shape[:2]
        x, y, w, h = detection.bbox
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(fw, max(0, x + w))
        y2 = min(fh, max(0, y + h))
        face_crop = frame[y1:y2, x1:x2]

        # 4. Thẩm định chất lượng hình học & tư thế
        report = qc.evaluate(
            bbox=detection.bbox,
            euler_angles=detection.euler_angles,
            face_crop=face_crop,
            liveness_score=liveness_score,
            target_pose=target_pose,
        )

        aligned_face = None
        vector = None

        # 5. Nếu đạt chuẩn chất lượng, trích xuất đặc trưng ArcFace
        if report.is_passed and self.extractor is not None:
            try:
                aligned_face = self.extractor.align_face(frame, detection.landmarks)
                vector = self.extractor.extract_vector(aligned_face)
            except Exception as exc:
                logger.warning("Lỗi trích xuất vector ArcFace trong EnrollmentWorker: %s", exc)

        return EnrollmentFrameResult(
            detection=detection,
            is_aligned=is_aligned,
            align_message=report.feedback_message,
            liveness_score=liveness_score,
            quality_report=report,
            aligned_face=aligned_face,
            vector=vector,
        )

    def execute_otp_post(
        self,
        client: httpx.Client,
        url: str,
        payload: dict[str, Any],
        headers: dict[str, str],
        timeout: float = 10.0,
    ) -> tuple[bool, int, dict[str, Any], str]:
        """Thực thi POST xác thực OTP lên backend (PERF-01)."""
        try:
            resp = client.post(url, json=payload, headers=headers, timeout=timeout)
            status_code = resp.status_code
            if status_code == 200:
                raw = resp.json()
                data = raw.get("data", raw) if isinstance(raw, dict) else {}
                return True, status_code, data, ""
            else:
                err_body = resp.json() if resp.text else {}
                err_msg = (
                    err_body.get("message")
                    or f"Mã OTP không chính xác hoặc đã hết hạn (HTTP {status_code})!"
                )
                return False, status_code, {}, err_msg
        except Exception as exc:
            logger.warning("Lỗi kết nối khi gọi verify-otp: %s", exc)
            return False, 0, {}, str(exc)

    def verify_otp_async(
        self,
        client: httpx.Client,
        url: str,
        payload: dict[str, Any],
        headers: dict[str, str],
    ) -> None:
        """Thực thi xác thực OTP bất đồng bộ trong luồng nền (PERF-01)."""

        def _run() -> None:
            ok, status, data, msg = self.execute_otp_post(client, url, payload, headers)
            self.otp_completed.emit(ok, status, data, msg)

        threading.Thread(target=_run, daemon=True).start()

    def execute_submission_post(
        self,
        client: httpx.Client,
        url: str,
        payload: dict[str, Any],
        headers: dict[str, str],
        event_payload: dict[str, Any],
        timeout: float = 10.0,
    ) -> tuple[bool, int, dict[str, Any], str]:
        """Thực thi POST nạp gói mẫu sinh trắc học lên backend (PERF-02)."""
        try:
            resp = client.post(url, json=payload, headers=headers, timeout=timeout)
            status_code = resp.status_code
            if status_code in (200, 201):
                return True, status_code, event_payload, ""
            else:
                err_body = resp.json() if resp.text else {}
                err_msg = (
                    err_body.get("message") or f"Backend từ chối nạp khuôn mặt (HTTP {status_code})"
                )
                return False, status_code, event_payload, err_msg
        except Exception as exc:
            logger.warning("Lỗi kết nối khi gửi đăng ký biometric: %s", exc)
            return False, 0, event_payload, str(exc)

    def submit_enrollment_async(
        self,
        client: httpx.Client,
        url: str,
        payload: dict[str, Any],
        headers: dict[str, str],
        event_payload: dict[str, Any],
    ) -> None:
        """Thực thi gửi biometric bất đồng bộ trong luồng nền (PERF-02)."""

        def _run() -> None:
            ok, status, ep, msg = self.execute_submission_post(
                client, url, payload, headers, event_payload
            )
            self.submission_completed.emit(ok, status, ep, msg)

        threading.Thread(target=_run, daemon=True).start()

    def run(self) -> None:
        """Vòng lặp QThread tiếp nhận và xử lý frame từ camera."""
        self._is_running = True
        logger.info("EnrollmentWorker bắt đầu chạy trong nền.")
        while self._is_running:
            try:
                frame, target_pose, min_liveness = self._frame_queue.get(timeout=0.2)
                res = self.process_frame(frame, target_pose, min_liveness)
                self.frame_processed.emit(res)
            except queue.Empty:
                continue
            except Exception as exc:
                logger.error("Lỗi ngoại lệ trong EnrollmentWorker.run: %s", exc)

        logger.info("EnrollmentWorker đã dừng an toàn.")

    def stop(self) -> None:
        """Dừng worker an toàn."""
        self._is_running = False
        self.wait(1000)
