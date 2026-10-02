"""Core Vision: Thẩm định chất lượng khuôn mặt đăng ký mẫu (ISO/IEC 30107-3)."""

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass(frozen=True)
class EnrollmentQualityReport:
    """Kết quả thẩm định chất lượng khung hình khuôn mặt chuẩn hóa."""

    is_passed: bool
    euler_passed: bool
    size_passed: bool
    sharpness_passed: bool
    liveness_passed: bool
    yaw: float
    pitch: float
    roll: float
    face_size: tuple[int, int]
    sharpness: float
    liveness_score: float
    feedback_message: str


class EnrollmentQualityChecker:
    """Kiểm chuẩn chất lượng ảnh đăng ký theo tiêu chuẩn ISO/IEC 30107-3 và DDS.md."""

    def __init__(
        self,
        max_angle_deg: float = 10.0,
        min_face_size: int = 120,
        min_sharpness: float = 100.0,
        min_liveness: float = 0.85,
    ) -> None:
        self.max_angle_deg: float = max_angle_deg
        self.min_face_size: int = min_face_size
        self.min_sharpness: float = min_sharpness
        self.min_liveness: float = min_liveness

    def compute_sharpness(self, face_crop: np.ndarray) -> float:
        """Đo độ sắc nét của ảnh cắt khuôn mặt qua biến thiên ma trận Laplacian."""
        if face_crop is None or face_crop.size == 0:
            return 0.0
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())

    def evaluate(
        self,
        bbox: tuple[int, int, int, int],
        euler_angles: tuple[float, float, float],
        face_crop: np.ndarray,
        liveness_score: float,
    ) -> EnrollmentQualityReport:
        """Thẩm định các tiêu chí chất lượng khuôn mặt chuẩn hóa."""
        yaw, pitch, roll = euler_angles
        _, _, w, h = bbox

        # 1. Tiêu chí góc quay thẳng mặt <= 10 độ
        euler_passed = (
            abs(yaw) <= self.max_angle_deg
            and abs(pitch) <= self.max_angle_deg
            and abs(roll) <= self.max_angle_deg
        )

        # 2. Tiêu chí kích thước khuôn mặt >= 120x120 px
        size_passed = w >= self.min_face_size and h >= self.min_face_size

        # 3. Tiêu chí độ sắc nét (độ mờ) >= 100
        sharpness = self.compute_sharpness(face_crop)
        sharpness_passed = sharpness >= self.min_sharpness

        # 4. Tiêu chí thực thể sống liveness >= 0.85
        liveness_passed = liveness_score >= self.min_liveness

        is_passed = (
            euler_passed and size_passed and sharpness_passed and liveness_passed
        )

        # Xây dựng câu nhắc hướng dẫn trực quan theo thứ tự ưu tiên
        if not size_passed:
            feedback = "Vui lòng đứng lại gần camera hơn (khuôn mặt quá nhỏ)"
        elif not euler_passed:
            feedback = "Vui lòng giữ thẳng mặt, nhìn trực diện vào ống kính"
        elif not sharpness_passed:
            feedback = "Hình ảnh bị nhòe/mờ, vui lòng đứng yên trước camera"
        elif not liveness_passed:
            feedback = "Cảnh báo: Độ thực thể sống không đạt, vui lòng bỏ khẩu trang"
        else:
            feedback = "Khuôn mặt đạt chuẩn! Vui lòng giữ nguyên tư thế..."

        return EnrollmentQualityReport(
            is_passed=is_passed,
            euler_passed=euler_passed,
            size_passed=size_passed,
            sharpness_passed=sharpness_passed,
            liveness_passed=liveness_passed,
            yaw=yaw,
            pitch=pitch,
            roll=roll,
            face_size=(w, h),
            sharpness=sharpness,
            liveness_score=liveness_score,
            feedback_message=feedback,
        )
