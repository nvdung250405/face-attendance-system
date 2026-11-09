"""Core Vision: Thẩm định chất lượng khuôn mặt đăng ký mẫu (ISO/IEC 30107-3 và FEAT-ENROLL-001)."""

from dataclasses import dataclass
from enum import StrEnum

import cv2
import numpy as np


class PoseType(StrEnum):
    """Định danh 3 tư thế chuẩn thu nạp theo FEAT-ENROLL-001."""

    FRONTAL = "FRONTAL"
    LEFT_TILT = "LEFT_TILT"
    RIGHT_TILT = "RIGHT_TILT"


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
    target_pose: PoseType = PoseType.FRONTAL


class EnrollmentQualityChecker:
    """Kiểm chuẩn chất lượng ảnh đăng ký theo tiêu chuẩn ISO/IEC 30107-3 và FEAT-ENROLL-001."""

    def __init__(
        self,
        max_angle_deg: float = 5.0,
        max_pitch_deg: float = 15.0,
        max_roll_deg: float = 15.0,
        min_face_size: int = 120,
        min_sharpness: float = 30.0,
        min_liveness: float = 0.90,
        left_tilt_min_yaw: float = 10.0,
        left_tilt_max_yaw: float = 25.0,
        right_tilt_min_yaw: float = -25.0,
        right_tilt_max_yaw: float = -10.0,
    ) -> None:
        self.max_angle_deg: float = max_angle_deg
        self.max_pitch_deg: float = max_pitch_deg
        self.max_roll_deg: float = max_roll_deg
        self.min_face_size: int = min_face_size
        self.min_sharpness: float = min_sharpness
        self.min_liveness: float = min_liveness
        self.left_tilt_min_yaw: float = left_tilt_min_yaw
        self.left_tilt_max_yaw: float = left_tilt_max_yaw
        self.right_tilt_min_yaw: float = right_tilt_min_yaw
        self.right_tilt_max_yaw: float = right_tilt_max_yaw

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
        target_pose: PoseType = PoseType.FRONTAL,
    ) -> EnrollmentQualityReport:
        """Thẩm định các tiêu chí chất lượng khuôn mặt theo từng tư thế chỉ định."""
        yaw, pitch, roll = euler_angles
        _, _, w, h = bbox

        # 1. Kiểm tra góc Pitch và Roll chung (|Pitch| <= 15°, |Roll| <= 15°)
        pitch_roll_passed = (
            abs(pitch) <= self.max_pitch_deg and abs(roll) <= self.max_roll_deg
        )

        # 2. Kiểm tra góc Yaw theo từng tư thế cụ thể
        yaw_passed = False
        yaw_feedback = ""

        if target_pose == PoseType.FRONTAL:
            # Nhìn thẳng: |Yaw| <= max_angle_deg (mặc định 5.0°)
            yaw_passed = abs(yaw) <= self.max_angle_deg
            if not yaw_passed:
                if yaw < -self.max_angle_deg:
                    yaw_feedback = "Vui lòng giữ thẳng mặt, quay mặt sang trái một chút"
                else:
                    yaw_feedback = "Vui lòng giữ thẳng mặt, quay mặt sang phải một chút"
            elif not pitch_roll_passed:
                yaw_feedback = "Vui lòng giữ thẳng mặt, nhìn trực diện vào ống kính"

        elif target_pose == PoseType.LEFT_TILT:
            # Nghiêng trái: 10° <= Yaw <= 25°
            yaw_passed = self.left_tilt_min_yaw <= yaw <= self.left_tilt_max_yaw
            if not yaw_passed:
                if yaw < self.left_tilt_min_yaw:
                    yaw_feedback = "Vui lòng nghiêng mặt thêm sang trái (10° - 25°)"
                else:
                    yaw_feedback = "Bạn đang nghiêng quá nhiều sang trái, hãy quay lại một chút"
            elif not pitch_roll_passed:
                yaw_feedback = "Vui lòng giữ đầu cân bằng, chỉ nghiêng mặt sang trái"

        elif target_pose == PoseType.RIGHT_TILT:
            # Nghiêng phải: -25° <= Yaw <= -10°
            yaw_passed = self.right_tilt_min_yaw <= yaw <= self.right_tilt_max_yaw
            if not yaw_passed:
                if yaw > self.right_tilt_max_yaw:
                    yaw_feedback = "Vui lòng nghiêng mặt thêm sang phải (10° - 25°)"
                else:
                    yaw_feedback = "Bạn đang nghiêng quá nhiều sang phải, hãy quay lại một chút"
            elif not pitch_roll_passed:
                yaw_feedback = "Vui lòng giữ đầu cân bằng, chỉ nghiêng mặt sang phải"

        euler_passed = yaw_passed and pitch_roll_passed

        # 3. Tiêu chí kích thước khuôn mặt >= min_face_size px
        size_passed = w >= self.min_face_size and h >= self.min_face_size

        # 4. Tiêu chí độ sắc nét (Laplacian) >= min_sharpness
        sharpness = self.compute_sharpness(face_crop)
        sharpness_passed = sharpness >= self.min_sharpness

        # 5. Tiêu chí thực thể sống liveness >= min_liveness
        liveness_passed = liveness_score >= self.min_liveness

        is_passed = (
            euler_passed and size_passed and sharpness_passed and liveness_passed
        )

        # Xây dựng câu nhắc hướng dẫn trực quan theo thứ tự ưu tiên
        if not size_passed:
            feedback = "Vui lòng đứng lại gần camera hơn (khuôn mặt quá nhỏ)"
        elif not euler_passed:
            feedback = yaw_feedback or "Vui lòng giữ đúng tư thế theo hướng dẫn"
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
            target_pose=target_pose,
        )
