"""Module phát hiện khuôn mặt và ước lượng góc quay tư thế bằng mô hình YuNet.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-01 - YuNetFaceDetector)
- DDS.md (Mục 3.2 - Bước 2: Phát hiện khuôn mặt & kiểm tra góc Euler)
"""

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from config.logger import get_logger
from config.settings import settings

logger = get_logger("face_detector")


@dataclass(frozen=True)
class FaceDetectionResult:
    """Kết quả phát hiện khuôn mặt và đánh giá chất lượng hình học ban đầu."""

    bbox: tuple[int, int, int, int]  # (x, y, width, height)
    landmarks: np.ndarray  # shape (5, 2): [right_eye, left_eye, nose, mouth_right, mouth_left]
    score: float  # Độ tin cậy phát hiện (0.0 - 1.0)
    euler_angles: tuple[float, float, float]  # (yaw, pitch, roll) tính theo độ (degrees)
    is_valid_size: bool  # True nếu diện tích đạt tối thiểu 120x120 px
    is_tilted: bool  # True nếu bất kỳ góc yaw, pitch, roll nào vượt quá 15 độ


class YuNetFaceDetector:
    """Bộ phát hiện khuôn mặt thời gian thực sử dụng mạng nơ-ron YuNet qua OpenCV DNN."""

    def __init__(
        self,
        model_path: Path | None = None,
        score_threshold: float = 0.60,
        nms_threshold: float = 0.30,
        top_k: int = 5000,
        min_face_size: int = 120,
        max_angle_deg: float = 15.0,
    ) -> None:
        """Khởi tạo YuNetFaceDetector.

        Args:
            model_path: Đường dẫn tệp trọng số ONNX của YuNet.
            score_threshold: Ngưỡng lọc độ tin cậy phát hiện (mặc định 0.60).
            nms_threshold: Ngưỡng loại trừ cực đại không liên tục NMS (mặc định 0.30).
            top_k: Số lượng khuôn mặt tối đa giữ lại trước NMS.
            min_face_size: Kích thước cạnh tối thiểu của bounding box (mặc định 120 px).
            max_angle_deg: Góc nghiêng tối đa cho phép của từng trục Euler (mặc định 15.0 độ).
        """
        self.model_path: Path = model_path or settings.yunet_model_path
        self.score_threshold: float = score_threshold
        self.nms_threshold: float = nms_threshold
        self.top_k: int = top_k
        self.min_face_size: int = min_face_size
        self.max_angle_deg: float = max_angle_deg

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Không tìm thấy tệp trọng số YuNet tại {self.model_path}. "
                "Vui lòng chạy 'python scripts/download_models.py' để nạp mô hình."
            )

        # Khởi tạo FaceDetectorYN với kích thước đầu vào tạm thời (320, 320)
        self._current_input_size: tuple[int, int] = (320, 320)
        self._detector = cv2.FaceDetectorYN.create(
            model=str(self.model_path),
            config="",
            input_size=self._current_input_size,
            score_threshold=self.score_threshold,
            nms_threshold=self.nms_threshold,
            top_k=self.top_k,
            backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
            target_id=cv2.dnn.DNN_TARGET_CPU,
        )
        logger.info(
            "YuNetFaceDetector đã sẵn sàng [model=%s, min_size=%d, max_angle=%.1f°]",
            self.model_path.name,
            self.min_face_size,
            self.max_angle_deg,
        )

    def _estimate_euler_angles(self, landmarks: np.ndarray) -> tuple[float, float, float]:
        """Ước lượng sơ bộ góc Euler (Yaw, Pitch, Roll) từ 5 điểm mốc đặc trưng.

        Args:
            landmarks: Mảng (5, 2) tọa độ [mắt phải, mắt trái, mũi, miệng phải, miệng trái].

        Returns:
            tuple[float, float, float]: (yaw, pitch, roll) tính theo độ.
        """
        right_eye = landmarks[0]
        left_eye = landmarks[1]
        nose = landmarks[2]
        mouth_right = landmarks[3]
        mouth_left = landmarks[4]

        # 1. Roll: Góc nghiêng đầu sang trái/phải dựa trên đường nối 2 mắt
        dx_eye = float(left_eye[0] - right_eye[0])
        dy_eye = float(left_eye[1] - right_eye[1])
        roll = float(np.degrees(np.arctan2(dy_eye, max(1e-5, dx_eye))))

        # 2. Yaw: Tỷ lệ lệch trục ngang của mũi so với trung điểm 2 mắt
        dist_right = float(nose[0] - right_eye[0])
        dist_left = float(left_eye[0] - nose[0])
        total_span = dist_right + dist_left
        if total_span > 1e-5:
            yaw_ratio = (dist_right - dist_left) / total_span
            yaw = float(yaw_ratio * 90.0)
        else:
            yaw = 0.0

        # 3. Pitch: Tỷ lệ khoảng cách mắt-mũi so với mũi-miệng
        eye_center_y = float((right_eye[1] + left_eye[1]) / 2.0)
        mouth_center_y = float((mouth_right[1] + mouth_left[1]) / 2.0)

        eye_nose_dist = float(nose[1] - eye_center_y)
        nose_mouth_dist = float(mouth_center_y - nose[1])
        total_vert = eye_nose_dist + nose_mouth_dist
        if total_vert > 1e-5:
            pitch_ratio = (eye_nose_dist - nose_mouth_dist) / total_vert
            pitch = float(pitch_ratio * 90.0)
        else:
            pitch = 0.0

        return (yaw, pitch, roll)

    def detect(self, frame: np.ndarray) -> list[FaceDetectionResult]:
        """Thực hiện phát hiện khuôn mặt trên khung hình camera.

        Args:
            frame: Khung hình đầu vào (BGR numpy array).

        Returns:
            list[FaceDetectionResult]: Danh sách khuôn mặt phát hiện được cùng thông số hình học.
        """
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]

        # Cập nhật input_size động nếu kích thước khung hình thay đổi
        if self._current_input_size != (w, h):
            self._current_input_size = (w, h)
            self._detector.setInputSize((w, h))

        # Thực thi suy luận phát hiện khuôn mặt qua YuNet
        _, raw_faces = self._detector.detect(frame)

        if raw_faces is None or len(raw_faces) == 0:
            return []

        results: list[FaceDetectionResult] = []

        for face_data in raw_faces:
            # face_data gồm 15 phần tử: [x, y, w, h, x1, y1, ..., x5, y5, score]
            x, y, bw, bh = (
                int(face_data[0]),
                int(face_data[1]),
                int(face_data[2]),
                int(face_data[3]),
            )
            score = float(face_data[14])

            # Trích xuất 5 điểm mốc đặc trưng (landmarks)
            landmarks = face_data[4:14].reshape((5, 2)).astype(np.float32)

            # Ước lượng góc xoay Euler
            angles = self._estimate_euler_angles(landmarks)
            yaw, pitch, roll = angles

            # Kiểm chuẩn kích thước diện tích >= 120x120 px
            is_valid_size = (bw >= self.min_face_size) and (bh >= self.min_face_size)

            # Kiểm chuẩn góc quay <= 15 độ
            is_tilted = (
                abs(yaw) > self.max_angle_deg
                or abs(pitch) > self.max_angle_deg
                or abs(roll) > self.max_angle_deg
            )

            results.append(
                FaceDetectionResult(
                    bbox=(x, y, bw, bh),
                    landmarks=landmarks,
                    score=score,
                    euler_angles=(yaw, pitch, roll),
                    is_valid_size=is_valid_size,
                    is_tilted=is_tilted,
                )
            )

        return results

    def detect_face(self, frame: np.ndarray) -> FaceDetectionResult | None:
        """Phát hiện và trả về khuôn mặt nổi bật nhất (diện tích lớn nhất) trong khung hình.

        Args:
            frame: Khung hình đầu vào (BGR numpy array).

        Returns:
            FaceDetectionResult | None: Khuôn mặt lớn nhất trong khung hình hoặc None nếu không phát hiện.
        """
        results = self.detect(frame)
        if not results:
            return None
        # Ưu tiên khuôn mặt có diện tích lớn nhất (gần camera nhất)
        return max(results, key=lambda r: r.bbox[2] * r.bbox[3])

