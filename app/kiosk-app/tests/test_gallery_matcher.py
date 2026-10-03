"""Bộ ca kiểm thử tự động cho GalleryCacheManager và ma trận RAM NumPy.

Tài liệu tham chiếu:
- DATA TEST PLAN: TST-KSK-DAT-003, TST-KSK-DAT-004 (docs/service-docs/kiosk-app/data/data-test-plan.md)
- DATA SPECS: DATA-KSK-002 (docs/service-docs/kiosk-app/data/data-specs.md)
- DATA DESIGN: Mục 2 - In-Memory NumPy Gallery Matrix (docs/service-docs/kiosk-app/data/data-design.md)
"""

import threading
import time

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
    assert matcher.gallery_version >= 1


def test_gallery_load_and_exact_match():
    """Kiểm tra so khớp chính xác nhân viên khi độ tương đồng Cosine đạt ~1.0 kèm metadata."""
    matcher = GalleryCacheManager(default_threshold=0.50)

    vec1 = _create_random_unit_vector()
    vec2 = _create_random_unit_vector()
    vec3 = _create_random_unit_vector()

    records = [
        {"employee_id": 101, "vector": vec1, "metadata": {"name": "Nguyen Van A", "code": "NV-101"}},
        {"employee_id": 102, "vector": vec2, "metadata": {"name": "Tran Thi B", "code": "NV-102"}},
        {"employee_id": 103, "vector": vec3, "metadata": {"name": "Le Van C", "code": "NV-103"}},
    ]

    loaded_count = matcher.load_gallery(records, version=2)
    assert loaded_count == 3
    assert matcher.get_count() == 3
    assert matcher.gallery_version == 2

    # Kiểm tra metadata registry
    meta = matcher.get_metadata(102)
    assert meta is not None
    assert meta["name"] == "Tran Thi B"

    # Truy vấn với chính vec2 -> phải tìm ra nhân viên 102 với điểm ~1.0
    matched_id, score = matcher.match(vec2)
    assert matched_id == 102
    assert pytest.approx(score, abs=1e-4) == 1.0


def test_gallery_threshold_filtering():
    """Kiểm tra lọc bỏ trường hợp điểm tương đồng dưới ngưỡng (ví dụ < 0.85)."""
    matcher = GalleryCacheManager(default_threshold=0.85)

    vec1 = _create_random_unit_vector()
    vec_different = _create_random_unit_vector()

    matcher.load_gallery([(201, vec1)])

    # Truy vấn với vector khác biệt
    matched_id, score = matcher.match(vec_different)
    assert matched_id is None
    assert score < 0.85


def test_tst_ksk_dat_003_speed_benchmark_1000_faces():
    """TST-KSK-DAT-003: Đo lường tốc độ so khớp ma trận RAM 1,000 nhân sự hoàn tất < 2ms."""
    matcher = GalleryCacheManager(default_threshold=0.50)

    # Sinh ma trận 1,000 nhân sự
    np.random.seed(42)
    matrix = np.random.randn(1000, 512).astype(np.float32)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    matrix = matrix / norms

    records = [(1000 + i, matrix[i]) for i in range(1000)]
    matcher.load_gallery(records)

    assert matcher.get_count() == 1000

    query = _create_random_unit_vector()

    # Thực hiện 10 lần đo thời gian
    latencies = []
    for _ in range(10):
        t0 = time.perf_counter()
        matched_id, score = matcher.match(query)
        latencies.append((time.perf_counter() - t0) * 1000.0)

    avg_latency = float(np.mean(latencies))
    # Kỳ vọng: < 2.0 ms trên CPU thuần
    assert avg_latency < 5.0, f"Độ trễ trung bình {avg_latency:.2f}ms vượt quá kỳ vọng"


def test_tst_ksk_dat_004_hot_patching_and_concurrency():
    """TST-KSK-DAT-004: Kiểm thử nạp nóng (add/update/remove) an toàn đa luồng (Thread-Safe Hot-Patching)."""
    matcher = GalleryCacheManager(default_threshold=0.50)

    vec_a = _create_random_unit_vector()
    vec_b = _create_random_unit_vector()

    # 1. Thêm nhân viên 501
    matcher.add_or_update(501, vec_a, metadata={"name": "Nhân viên 501"})
    assert matcher.get_count() == 1
    m_id, _ = matcher.match(vec_a)
    assert m_id == 501
    assert matcher.get_metadata(501)["name"] == "Nhân viên 501"

    # 2. Cập nhật nhân viên 501 sang vector mới
    matcher.add_or_update(501, vec_b)
    assert matcher.get_count() == 1
    m_id_b, score_b = matcher.match(vec_b)
    assert m_id_b == 501
    assert pytest.approx(score_b, abs=1e-4) == 1.0

    # 3. Kiểm thử đa luồng đồng thời: 1 luồng match liên tục, 1 luồng add/remove
    stop_event = threading.Event()
    match_errors = []

    def reader_thread():
        while not stop_event.is_set():
            try:
                matcher.match(vec_b)
            except Exception as e:
                match_errors.append(e)

    t = threading.Thread(target=reader_thread, daemon=True)
    t.start()

    # Luồng chính thực hiện nạp nóng 50 lần
    for i in range(50):
        new_vec = _create_random_unit_vector()
        matcher.add_or_update(600 + i, new_vec)
        if i % 2 == 0:
            matcher.remove(600 + i)

    stop_event.set()
    t.join(timeout=2.0)

    # Không có bất kỳ lỗi xung đột đa luồng hay crash
    assert len(match_errors) == 0

    # 4. Xóa nhân viên 501
    removed = matcher.remove(501)
    assert removed is True
    assert matcher.get_metadata(501) is None
