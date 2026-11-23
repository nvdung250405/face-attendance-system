"""Bộ ca kiểm thử tự động cho ArcFaceFeatureExtractor.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 4.3 & TC-KIOSK-01)
- DDS.md (Mục 3.2 - Bước 4)
"""

from unittest.mock import MagicMock

import numpy as np
import onnxruntime as ort
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


def test_feature_extractor_exception_handling():
    """Kiểm tra xử lý ngoại lệ ort.OrtException trả về vector zeros an toàn (FIND-AI-003)."""
    extractor = ArcFaceFeatureExtractor.__new__(ArcFaceFeatureExtractor)
    extractor._input_name = "input"
    extractor._output_name = "output"
    mock_session = MagicMock()
    mock_session.run.side_effect = ort.OrtException("Inference failure")
    extractor._session = mock_session

    dummy_face = np.zeros((112, 112, 3), dtype=np.uint8)
    embedding = extractor.extract(dummy_face)
    assert isinstance(embedding, np.ndarray)
    assert embedding.shape == (512,)
    assert np.all(embedding == 0.0)


def test_feature_extractor_dynamic_providers(monkeypatch, tmp_path):
    """Kiểm tra phát hiện providers tăng tốc phần cứng khả dụng linh hoạt (FIND-AI-003)."""
    model_file = tmp_path / "model.onnx"
    model_file.write_text("dummy")

    captured_providers = []

    def mock_session_init(path, sess_options=None, providers=None):
        captured_providers.extend(providers)
        mock = MagicMock()
        mock.get_inputs.return_value = [MagicMock(name="input")]
        mock.get_outputs.return_value = [MagicMock(name="output")]
        return mock

    monkeypatch.setattr(ort, "InferenceSession", mock_session_init)
    monkeypatch.setattr(
        ort,
        "get_available_providers",
        lambda: ["CPUExecutionProvider", "CUDAExecutionProvider"],
    )

    ArcFaceFeatureExtractor(model_path=model_file)
    assert "CUDAExecutionProvider" in captured_providers
    assert "CPUExecutionProvider" in captured_providers
