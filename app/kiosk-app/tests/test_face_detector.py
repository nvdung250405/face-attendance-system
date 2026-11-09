"""Bộ ca kiểm thử tự động cho YuNetFaceDetector và ước lượng góc Euler (FEAT-ENROLL-001, Task 5).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 4.3 & TC-KIOSK-01, TC-KIOSK-02)
- FEAT-ENROLL-001 spec.md (§2.2, §5.3, Task 5)
"""

import math

import numpy as np
import pytest

from config.settings import settings
from core.vision.face_detector import (
    DetectedFace,
    FaceDetectionResult,
    YuNetFaceDetector,
    estimate_euler_angles,
)


def test_detected_face_alias_identity():
    """Kiểm tra bí danh DetectedFace đồng nhất với FaceDetectionResult theo chuẩn spec.md."""
    assert DetectedFace is FaceDetectionResult


def test_detector_initialization_not_found(tmp_path):
    """Kiểm tra báo lỗi FileNotFoundError khi không tìm thấy tệp trọng số."""
    invalid_path = tmp_path / "non_existent.onnx"
    with pytest.raises(FileNotFoundError):
        YuNetFaceDetector(model_path=invalid_path)


def test_detector_initialization_success():
    """Kiểm tra khởi tạo thành công khi tệp yunet.onnx tồn tại."""
    if not settings.yunet_model_path.exists():
        pytest.skip("Chưa tải tệp yunet.onnx")

    detector = YuNetFaceDetector(model_path=settings.yunet_model_path)
    assert detector is not None
    assert detector.min_face_size == 120
    assert detector.max_angle_deg == 15.0


def test_detect_on_blank_frame():
    """Kiểm tra phát hiện khuôn mặt trên khung hình đen rỗng trả về danh sách rỗng."""
    if not settings.yunet_model_path.exists():
        pytest.skip("Chưa tải tệp yunet.onnx")

    detector = YuNetFaceDetector(model_path=settings.yunet_model_path)
    blank_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    results = detector.detect(blank_frame)

    assert isinstance(results, list)
    assert len(results) == 0


def test_detect_on_empty_input():
    """Kiểm tra xử lý an toàn khi frame đầu vào là None hoặc rỗng."""
    if not settings.yunet_model_path.exists():
        pytest.skip("Chưa tải tệp yunet.onnx")

    detector = YuNetFaceDetector(model_path=settings.yunet_model_path)
    assert detector.detect(None) == []
    assert detector.detect(np.array([], dtype=np.uint8)) == []


def test_euler_angle_estimation_neutral():
    """Kiểm tra tính toán góc Euler cho khuôn mặt nhìn thẳng (neutral pose)."""
    # 5 điểm mốc đối xứng chuẩn (nhìn thẳng)
    neutral_landmarks = np.array([
        [40.0, 50.0],  # Mắt phải
        [80.0, 50.0],  # Mắt trái (ngang hàng)
        [60.0, 70.0],  # Mũi (ở giữa)
        [45.0, 90.0],  # Khóe miệng phải
        [75.0, 90.0],  # Khóe miệng trái
    ], dtype=np.float32)

    yaw, pitch, roll = estimate_euler_angles(neutral_landmarks)

    # Roll phải gần bằng 0 độ
    assert abs(roll) < 1.0
    # Yaw đối xứng phải gần bằng 0 độ
    assert abs(yaw) < 2.0


def test_euler_angle_estimation_roll_crosstalk_mitigation():
    """Kiểm tra thuật toán khử xoay Roll 2D không sinh ra góc Yaw ảo khi mặt chỉ nghiêng Roll."""
    neutral_landmarks = np.array([
        [40.0, 50.0],
        [80.0, 50.0],
        [60.0, 70.0],
        [45.0, 90.0],
        [75.0, 90.0],
    ], dtype=np.float64)

    # Xoay toàn bộ mặt quanh tâm mắt góc +25 độ
    roll_angle = 25.0
    theta = math.radians(roll_angle)
    cx, cy = 60.0, 50.0

    rotated = np.zeros_like(neutral_landmarks)
    for i in range(5):
        vx = neutral_landmarks[i, 0] - cx
        vy = neutral_landmarks[i, 1] - cy
        rotated[i, 0] = cx + (vx * math.cos(theta) - vy * math.sin(theta))
        rotated[i, 1] = cy + (vx * math.sin(theta) + vy * math.cos(theta))

    yaw, pitch, roll = estimate_euler_angles(rotated)

    # Roll thực tế ước lượng phải ~ 25 độ
    assert pytest.approx(roll, abs=1.0) == 25.0
    # Nhờ khử xoay Roll 2D quanh trung điểm mắt, Yaw thực tế không bị nhiễu chéo (> 2 độ)
    assert abs(yaw) < 2.0


def test_euler_angle_estimation_left_and_right_tilt():
    """Kiểm tra ước lượng góc Yaw chuẩn cho tư thế nghiêng trái (LEFT_TILT) và nghiêng phải (RIGHT_TILT)."""
    # Nghiêng trái: Mũi lệch nhẹ về phía mắt trái (x = 64.0 -> yaw = +18.0°)
    left_landmarks = np.array([
        [40.0, 50.0],
        [80.0, 50.0],
        [64.0, 70.0],
        [47.0, 90.0],
        [77.0, 90.0],
    ], dtype=np.float32)
    yaw_left, _, _ = estimate_euler_angles(left_landmarks)
    assert 10.0 <= yaw_left <= 25.0
    assert pytest.approx(yaw_left, abs=0.1) == 18.0

    # Nghiêng phải: Mũi lệch nhẹ về phía mắt phải (x = 56.0 -> yaw = -18.0°)
    right_landmarks = np.array([
        [40.0, 50.0],
        [80.0, 50.0],
        [56.0, 70.0],
        [43.0, 90.0],
        [73.0, 90.0],
    ], dtype=np.float32)
    yaw_right, _, _ = estimate_euler_angles(right_landmarks)
    assert -25.0 <= yaw_right <= -10.0
    assert pytest.approx(yaw_right, abs=0.1) == -18.0


def test_euler_angle_estimation_degenerate_clamping():
    """Kiểm tra giới hạn tỷ lệ [-1.0, 1.0] ngăn ngừa ngoại suy góc Euler phi thực tế."""
    # Điểm mốc cực đoan dị thường
    extreme_landmarks = np.array([
        [40.0, 50.0],
        [80.0, 50.0],
        [500.0, 70.0],  # Mũi trượt rất xa ngoài khuôn mặt
        [40.0, 90.0],
        [80.0, 90.0],
    ], dtype=np.float32)

    yaw, pitch, roll = estimate_euler_angles(extreme_landmarks)
    assert -90.0 <= yaw <= 90.0
    assert -90.0 <= pitch <= 90.0
