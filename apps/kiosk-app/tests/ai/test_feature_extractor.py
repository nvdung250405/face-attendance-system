"""Bộ ca kiểm thử tự động cho ArcFaceFeatureExtractor.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 4.3 & TC-KIOSK-01)
- DDS.md (Mục 3.2 - Bước 4)
"""

import numpy as np
import pytest

from config.settings import settings
from core.vision.feature_extractor import REFERENCE_FACIAL_POINTS, ArcFaceFeatureExtractor


def test_extractor_initialization_not_found(tmp_path):
    """Kiểm tra báo lỗi FileNotFoundError khi không tìm thấy tệp arcface_mobilefacenet.onnx."""
    invalid_path = tmp_path / "non_existent_arcface.onnx"
    with pytest.raises(FileNotFoundError):
        ArcFaceFeatureExtractor(model_path=invalid_path)


def test_extractor_initialization_success():
    """Kiểm tra khởi tạo thành công khi tệp arcface_mobilefacenet.onnx tồn tại."""
    if not settings.arcface_model_path.exists():
        pytest.skip("Chưa tải tệp arcface_mobilefacenet.onnx")

    extractor = ArcFaceFeatureExtractor(model_path=settings.arcface_model_path)
    assert extractor is not None
    assert extractor._input_name is not None
    assert extractor._output_name is not None


def test_align_face_shape_and_type():
    """Kiểm tra phép căn chỉnh khuôn mặt Affine trả về đúng ảnh (112, 112, 3) uint8."""
    if not settings.arcface_model_path.exists():
        pytest.skip("Chưa tải tệp arcface_mobilefacenet.onnx")

    extractor = ArcFaceFeatureExtractor(model_path=settings.arcface_model_path)

    dummy_frame = np.ones((480, 640, 3), dtype=np.uint8) * 128
    # Sử dụng đúng tọa độ landmarks mẫu chuẩn hóa
    landmarks = REFERENCE_FACIAL_POINTS.copy()

    aligned = extractor.align_face(dummy_frame, landmarks)
    assert aligned is not None
    assert aligned.shape == (112, 112, 3)
    assert aligned.dtype == np.uint8


def test_extract_vector_dimension_and_l2_norm():
    """Kiểm tra vector trích xuất có đúng 512 chiều float32 và đạt L2 Norm = 1.0."""
    if not settings.arcface_model_path.exists():
        pytest.skip("Chưa tải tệp arcface_mobilefacenet.onnx")

    extractor = ArcFaceFeatureExtractor(model_path=settings.arcface_model_path)

    # Tạo ảnh mặt giả lập 112x112
    dummy_face = np.random.randint(0, 256, (112, 112, 3), dtype=np.uint8)

    embedding = extractor.extract(dummy_face)

    assert isinstance(embedding, np.ndarray)
    assert embedding.shape == (512,)
    assert embedding.dtype == np.float32

    # Kiểm tra độ dài chuẩn L2 Norm: ||v|| = 1.0 (sai số < 1e-4)
    norm = float(np.linalg.norm(embedding))
    assert pytest.approx(norm, rel=1e-4) == 1.0
