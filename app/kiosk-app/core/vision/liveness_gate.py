"""Module kiểm tra thực thể sống (Anti-Spoofing Liveness Gate) qua MiniFASNet.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-02 - MiniFASNetLivenessGate)
- TP-KIOSK-01 (Mục 1.3 & TC-KIOSK-05, TC-KIOSK-06, TC-KIOSK-07)
- DDS.md (Mục 3.2 - Bước 3: Kiểm tra Liveness chống ảnh in/video giả mạo)
- Tuân thủ chuẩn ISO/IEC 30107-3 về đo lường Presentation Attack Detection (PAD).
"""

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

from config.logger import get_logger
from config.settings import settings

logger = get_logger("liveness_gate")


@dataclass(frozen=True)
class LivenessResult:
    """Kết quả kiểm tra thực thể sống chống giả mạo khuôn mặt."""

    is_live: bool  # True nếu liveness_score >= threshold (người thật)
    score: float  # Điểm xác thực thực thể sống (0.0 - 1.0)
    label: str  # "LIVE" nếu là người thật, "SPOOF" nếu là giả mạo
    class_probabilities: dict[str, float]  # Xác suất chi tiết của 3 lớp phân loại

    def __float__(self) -> float:
        return self.score

    def __ge__(self, other: object) -> bool:
        return self.score >= float(other)

    def __gt__(self, other: object) -> bool:
        return self.score > float(other)

    def __le__(self, other: object) -> bool:
        return self.score <= float(other)

    def __lt__(self, other: object) -> bool:
        return self.score < float(other)


class MiniFASNetLivenessGate:
    """Bộ lọc kiểm tra thực thể sống thụ động (Passive Liveness) bằng Silent-Face MiniFASNet ONNX."""

    def __init__(
        self,
        model_path: Path | None = None,
        threshold: float | None = None,
        scale_factor: float = 2.7,
        num_threads: int = 2,
    ) -> None:
        """Khởi tạo MiniFASNetLivenessGate.

        Args:
            model_path: Đường dẫn tệp trọng số ONNX của MiniFASNet (mặc định từ settings).
            threshold: Ngưỡng chặn xác suất thực thể sống tối thiểu (mặc định 0.85).
            scale_factor: Hệ số phóng đại vùng cắt khuôn mặt (chuẩn 2.7x bao gồm bối cảnh).
            num_threads: Số luồng CPU sử dụng cho ONNX Runtime.
        """
        self.model_path: Path = model_path or settings.minifasnet_model_path
        self.threshold: float = (
            threshold if threshold is not None else settings.liveness_threshold
        )
        self.scale_factor: float = scale_factor
        self.num_threads: int = num_threads
        self.target_size: tuple[int, int] = (80, 80)

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Không tìm thấy tệp trọng số MiniFASNet tại {self.model_path}. "
                "Vui lòng chạy 'python scripts/download_models.py' để nạp mô hình."
            )

        # Cấu hình ONNX Runtime Session tối ưu CPU
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = self.num_threads
        sess_options.inter_op_num_threads = 1
        sess_options.graph_optimization_level = (
            ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        )

        self._session = ort.InferenceSession(
            str(self.model_path),
            sess_options=sess_options,
            providers=["CPUExecutionProvider"],
        )

        self._input_name: str = self._session.get_inputs()[0].name
        self._output_name: str = self._session.get_outputs()[0].name

        logger.info(
            "MiniFASNetLivenessGate đã sẵn sàng [model=%s, threshold=%.2f, scale=%.1fx]",
            self.model_path.name,
            self.threshold,
            self.scale_factor,
        )

    def crop_face_context(
        self,
        frame: np.ndarray,
        bbox: tuple[int, int, int, int],
    ) -> np.ndarray:
        """Cắt vùng khuôn mặt mở rộng theo tỷ lệ scale_factor (2.7x) và resize về 80x80.

        Việc mở rộng 2.7x lấy thêm vùng trán, tai, cằm và bối cảnh lân cận là yếu tố
        then chốt giúp mạng nơ-ron nhận diện viền giấy in và độ chói phản xạ màn hình.

        Args:
            frame: Khung hình camera gốc (BGR numpy array).
            bbox: Tọa độ bounding box (x, y, w, h).

        Returns:
            np.ndarray: Ảnh vùng mặt mở rộng kích thước (80, 80, 3) định dạng BGR.
        """
        if frame is None or frame.size == 0:
            return np.zeros((self.target_size[1], self.target_size[0], 3), dtype=np.uint8)

        x, y, w, h = bbox
        if w <= 0 or h <= 0:
            return np.zeros((self.target_size[1], self.target_size[0], 3), dtype=np.uint8)

        frame_h, frame_w = frame.shape[:2]

        scale = min(
            (frame_h - 1) / max(1, h),
            (frame_w - 1) / max(1, w),
            self.scale_factor,
        )
        new_w = w * scale
        new_h = h * scale

        center_x = x + w / 2.0
        center_y = y + h / 2.0

        x1 = max(0, int(round(center_x - new_w / 2.0)))
        y1 = max(0, int(round(center_y - new_h / 2.0)))
        x2 = min(frame_w - 1, int(round(center_x + new_w / 2.0)))
        y2 = min(frame_h - 1, int(round(center_y + new_h / 2.0)))

        crop = frame[y1 : y2 + 1, x1 : x2 + 1]

        if crop.size == 0 or crop.shape[0] == 0 or crop.shape[1] == 0:
            return np.zeros((self.target_size[1], self.target_size[0], 3), dtype=np.uint8)

        # Resize về kích thước chuẩn 80x80 của MiniFASNet
        resized = cv2.resize(
            crop, self.target_size, interpolation=cv2.INTER_LINEAR
        )
        return resized

    def predict(
        self,
        crop_or_frame: np.ndarray,
        bbox: tuple[int, int, int, int] | None = None,
    ) -> LivenessResult:
        """Thực thi suy luận ONNX và phân loại xác suất thực thể sống.

        Args:
            crop_or_frame: Ảnh khuôn mặt kích thước 80x80 hoặc khung hình gốc (kèm bbox).
            bbox: Bounding box khuôn mặt nếu truyền vào cả khung hình.

        Returns:
            LivenessResult: Kết quả đánh giá tính xác thực của khuôn mặt.
        """
        if crop_or_frame is None or crop_or_frame.size == 0:
            return LivenessResult(
                is_live=False,
                score=0.0,
                label="SPOOF",
                class_probabilities={"fake_2d": 1.0, "real": 0.0, "fake_replay": 0.0},
            )

        if bbox is not None:
            crop_bgr = self.crop_face_context(crop_or_frame, bbox)
        else:
            crop_bgr = crop_or_frame

        if crop_bgr.shape[:2] != self.target_size:
            crop_bgr = cv2.resize(
                crop_bgr, self.target_size, interpolation=cv2.INTER_LINEAR
            )

        # Chuyển đổi sang float32 theo quy chuẩn MiniFASNet (giữ nguyên dải [0, 255])
        face_float = crop_bgr.astype(np.float32)

        # Chuyển định dạng từ HWC (80, 80, 3) sang NCHW (1, 3, 80, 80)
        blob = np.transpose(face_float, (2, 0, 1))
        blob = np.expand_dims(blob, axis=0)

        # Suy luận qua ONNX Runtime
        outputs = self._session.run([self._output_name], {self._input_name: blob})
        logits = outputs[0].flatten().astype(np.float32)

        # Tính hàm Softmax: P(c) = exp(z_c) / sum(exp(z))
        exp_logits = np.exp(logits - np.max(logits))
        probabilities = exp_logits / np.sum(exp_logits)

        # Silent-Face-Anti-Spoofing MiniFASNet quy ước chuẩn:
        # Index 0: Tấn công ảnh in 2D (Print Attack / Fake 2D)
        # Index 1: Người thật (Real / Live)
        # Index 2: Tấn công màn hình / Mặt nạ 3D (Replay Attack / Fake Replay)
        prob_fake_2d = float(probabilities[0])
        prob_real = float(probabilities[1])
        prob_fake_replay = float(probabilities[2])

        is_live = prob_real >= self.threshold
        label = "LIVE" if is_live else "SPOOF"

        return LivenessResult(
            is_live=is_live,
            score=prob_real,
            label=label,
            class_probabilities={
                "fake_2d": prob_fake_2d,
                "real": prob_real,
                "fake_replay": prob_fake_replay,
            },
        )

    def check_liveness(
        self,
        frame: np.ndarray,
        bbox: tuple[int, int, int, int],
    ) -> LivenessResult:
        """Phương thức tiện ích: Cắt bối cảnh khuôn mặt và kiểm tra liveness trực tiếp.

        Args:
            frame: Khung hình gốc từ camera (BGR).
            bbox: Tọa độ bounding box (x, y, w, h).

        Returns:
            LivenessResult: Kết quả xác thực liveness.
        """
        crop_context = self.crop_face_context(frame, bbox)
        return self.predict(crop_context)
