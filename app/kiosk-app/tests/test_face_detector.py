"""Bộ ca kiểm thử tự động cho YuNetFaceDetector và ước lượng góc Euler.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 4.3 & TC-KIOSK-01, TC-KIOSK-02)
"""

import numpy as np
import pytest

from config.settings import settings
from core.vision.face_detector import YuNetFaceDetector


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
    if not settings.yunet_model_path.exists():
        pytest.skip("Chưa tải tệp yunet.onnx")

    detector = YuNetFaceDetector(model_path=settings.yunet_model_path)

    # 5 điểm mốc đối xứng chuẩn (nhìn thẳng)
    neutral_landmarks = np.array([
        [40.0, 50.0],  # Mắt phải
        [80.0, 50.0],  # Mắt trái (ngang hàng)
        [60.0, 70.0],  # Mũi (ở giữa)
        [45.0, 90.0],  # Khóe miệng phải
        [75.0, 90.0],  # Khóe miệng trái
    ], dtype=np.float32)

    yaw, pitch, roll = detector._estimate_euler_angles(neutral_landmarks)

    # Roll phải gần bằng 0 độ
    assert abs(roll) < 1.0
    # Yaw đối xứng phải gần bằng 0 độ
    assert abs(yaw) < 2.0


def test_euler_angle_estimation_tilted():
    """Kiểm tra phát hiện góc nghiêng Roll khi mặt bị nghiêng quá 15 độ."""
    if not settings.yunet_model_path.exists():
        pytest.skip("Chưa tải tệp yunet.onnx")

    detector = YuNetFaceDetector(model_path=settings.yunet_model_path)

    # 2 mắt bị lệch cao độ đáng kể (nghiêng đầu)
    tilted_landmarks = np.array([
        [40.0, 40.0],  # Mắt phải
        [80.0, 70.0],  # Mắt trái bị dốc xuống ~36 độ
        [60.0, 80.0],
        [45.0, 100.0],
        [75.0, 110.0],
    ], dtype=np.float32)

    yaw, pitch, roll = detector._estimate_euler_angles(tilted_landmarks)

    assert abs(roll) > 15.0
