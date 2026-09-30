"""Bộ ca kiểm thử tự động cho MiniFASNetLivenessGate.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-02)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-05, TC-KIOSK-06, TC-KIOSK-07)
"""

import numpy as np
import pytest

from config.settings import settings
from core.vision.liveness_gate import LivenessResult, MiniFASNetLivenessGate


def test_liveness_gate_initialization_not_found(tmp_path):
    """Kiểm tra báo lỗi FileNotFoundError khi không tìm thấy tệp minifasnet.onnx."""
    invalid_path = tmp_path / "non_existent_minifasnet.onnx"
    with pytest.raises(FileNotFoundError):
        MiniFASNetLivenessGate(model_path=invalid_path)


def test_liveness_gate_initialization_success():
    """Kiểm tra khởi tạo thành công khi tệp minifasnet.onnx tồn tại."""
    if not settings.minifasnet_model_path.exists():
        pytest.skip("Chưa tải tệp minifasnet.onnx")

    gate = MiniFASNetLivenessGate(model_path=settings.minifasnet_model_path)
    assert gate is not None
    assert gate.threshold == 0.85
    assert gate.scale_factor == 2.7
    assert gate.target_size == (80, 80)


def test_crop_face_context_dimension_and_padding():
    """Kiểm tra phép cắt vùng mặt 2.7x kèm padding biên trả về ảnh chuẩn (80, 80, 3)."""
    if not settings.minifasnet_model_path.exists():
        pytest.skip("Chưa tải tệp minifasnet.onnx")

    gate = MiniFASNetLivenessGate(model_path=settings.minifasnet_model_path)

    # Giả lập khung hình 720x1280
    frame = np.ones((720, 1280, 3), dtype=np.uint8) * 100

    # 1. Khuôn mặt ở giữa khung hình
    bbox_center = (500, 300, 200, 200)
    crop_center = gate.crop_face_context(frame, bbox_center)
    assert crop_center.shape == (80, 80, 3)
    assert crop_center.dtype == np.uint8

    # 2. Khuôn mặt sát mép trên cùng bên trái (cần padding)
    bbox_corner = (10, 10, 150, 150)
    crop_corner = gate.crop_face_context(frame, bbox_corner)
    assert crop_corner.shape == (80, 80, 3)
    assert crop_corner.dtype == np.uint8


def test_predict_on_empty_or_none():
    """Kiểm tra xử lý an toàn khi đầu vào rỗng, mặc định từ chối (SPOOF)."""
    if not settings.minifasnet_model_path.exists():
        pytest.skip("Chưa tải tệp minifasnet.onnx")

    gate = MiniFASNetLivenessGate(model_path=settings.minifasnet_model_path)

    res_none = gate.predict(None)
    assert isinstance(res_none, LivenessResult)
    assert res_none.is_live is False
    assert res_none.label == "SPOOF"
    assert res_none.score == 0.0

    res_empty = gate.predict(np.array([], dtype=np.uint8))
    assert res_empty.is_live is False


def test_predict_softmax_probability_distribution():
    """Kiểm tra đầu ra suy luận MiniFASNet có tổng xác suất Softmax bằng 1.0 (TC-KIOSK-05)."""
    if not settings.minifasnet_model_path.exists():
        pytest.skip("Chưa tải tệp minifasnet.onnx")

    gate = MiniFASNetLivenessGate(model_path=settings.minifasnet_model_path)

    # Ảnh mẫu BGR 80x80
    dummy_crop = np.random.randint(0, 256, (80, 80, 3), dtype=np.uint8)
    res = gate.predict(dummy_crop)

    assert isinstance(res, LivenessResult)
    assert 0.0 <= res.score <= 1.0
    assert res.label in ("LIVE", "SPOOF")

    probs = res.class_probabilities
    assert "fake_2d" in probs
    assert "real" in probs
    assert "fake_replay" in probs

    total_prob = sum(probs.values())
    assert pytest.approx(total_prob, abs=1e-5) == 1.0


def test_reject_flat_color_fake_image():
    """Kiểm tra chặn ảnh đơn sắc phẳng hoặc nhiễu không có cấu trúc khuôn mặt người thật (TC-KIOSK-06, TC-KIOSK-07)."""
    if not settings.minifasnet_model_path.exists():
        pytest.skip("Chưa tải tệp minifasnet.onnx")

    gate = MiniFASNetLivenessGate(model_path=settings.minifasnet_model_path, threshold=0.85)

    # 1. Ảnh trắng tinh (mô phỏng nền giấy in không có texture mặt)
    white_crop = np.ones((80, 80, 3), dtype=np.uint8) * 255
    res_white = gate.predict(white_crop)
    # Ảnh trắng tinh không thể là người thật
    assert res_white.score < 0.85
    assert res_white.is_live is False
    assert res_white.label == "SPOOF"

    # 2. Ảnh đen kịt
    black_crop = np.zeros((80, 80, 3), dtype=np.uint8)
    res_black = gate.predict(black_crop)
    assert res_black.score < 0.85
    assert res_black.is_live is False
    assert res_black.label == "SPOOF"


def test_check_liveness_convenience_method():
    """Kiểm tra hàm tiện ích check_liveness tích hợp cắt bối cảnh và suy luận."""
    if not settings.minifasnet_model_path.exists():
        pytest.skip("Chưa tải tệp minifasnet.onnx")

    gate = MiniFASNetLivenessGate(model_path=settings.minifasnet_model_path)
    dummy_frame = np.ones((480, 640, 3), dtype=np.uint8) * 150
    bbox = (200, 150, 120, 120)

    result = gate.check_liveness(dummy_frame, bbox)
    assert isinstance(result, LivenessResult)
    assert result.label in ("LIVE", "SPOOF")
