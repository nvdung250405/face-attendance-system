"""Bộ ca kiểm thử tự động cho GalleryCacheManager và thuật toán so khớp Cosine 1:N.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 4.3 & TC-KIOSK-01)
- DDS.md (Mục 3.2 - Bước 5)
"""

import numpy as np
import pytest

from core.vision.gallery_matcher import GalleryCacheManager


def _create_random_unit_vector(dim: int = 512) -> np.ndarray:
    """Hàm phụ trợ sinh vector ngẫu nhiên có L2 Norm = 1.0."""
    v = np.random.randn(dim).astype(np.float32)
    return v / np.linalg.norm(v)


def test_gallery_empty_matching():
    """Kiểm tra Gallery trống trả về (None, 0.0)."""
    matcher = GalleryCacheManager(default_threshold=0.50)
    query_vec = _create_random_unit_vector()

    emp_id, score = matcher.match(query_vec)
    assert emp_id is None
    assert score == 0.0
    assert matcher.get_count() == 0


def test_gallery_load_and_exact_match():
    """Kiểm tra so khớp chính xác nhân viên khi độ tương đồng Cosine đạt ~1.0."""
    matcher = GalleryCacheManager(default_threshold=0.50)

    vec1 = _create_random_unit_vector()
    vec2 = _create_random_unit_vector()
    vec3 = _create_random_unit_vector()

    records = [
        (101, vec1),
        (102, vec2),
        (103, vec3),
    ]

    loaded_count = matcher.load_gallery(records)
    assert loaded_count == 3
    assert matcher.get_count() == 3

    # Truy vấn với chính vec2 -> phải tìm ra nhân viên 102 với điểm ~1.0
    matched_id, score = matcher.match(vec2)
    assert matched_id == 102
    assert pytest.approx(score, abs=1e-4) == 1.0


def test_gallery_threshold_filtering():
    """Kiểm tra lọc bỏ trường hợp điểm tương đồng dưới ngưỡng (ví dụ < 0.50)."""
    matcher = GalleryCacheManager(default_threshold=0.85)

    vec1 = _create_random_unit_vector()
    # Tạo vector trực giao (Cosine = 0) hoặc vector khác biệt cao
    vec_different = _create_random_unit_vector()

    matcher.load_gallery([(201, vec1)])

    # Truy vấn với vector khác biệt
    matched_id, score = matcher.match(vec_different)
    assert matched_id is None
    assert score < 0.85


def test_gallery_add_update_remove():
    """Kiểm tra các thao tác động: Thêm mới, Cập nhật và Xóa nhân viên khỏi RAM."""
    matcher = GalleryCacheManager(default_threshold=0.50)

    vec_a = _create_random_unit_vector()
    vec_b = _create_random_unit_vector()

    # 1. Thêm nhân viên 501
    matcher.add_or_update(501, vec_a)
    assert matcher.get_count() == 1
    m_id, _ = matcher.match(vec_a)
    assert m_id == 501

    # 2. Cập nhật nhân viên 501 sang vector mới
    matcher.add_or_update(501, vec_b)
    assert matcher.get_count() == 1
    m_id_b, score_b = matcher.match(vec_b)
    assert m_id_b == 501
    assert pytest.approx(score_b, abs=1e-4) == 1.0

    # 3. Xóa nhân viên 501
    removed = matcher.remove(501)
    assert removed is True
    assert matcher.get_count() == 0

    # 4. Xóa nhân viên không tồn tại
    assert matcher.remove(999) is False
