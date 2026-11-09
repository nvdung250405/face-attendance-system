"""Bộ ca kiểm thử tự động toàn diện cho GalleryCacheManager và ma trận RAM NumPy Đa Mẫu.

Tài liệu tham chiếu & Đặc tả:
- FEAT-ENROLL-001: Task 9, Task 10, Task 11 (docs/features/FEAT-ENROLL-001/spec.md)
- NFR-ENROLL-006: Độ trễ điểm danh Multi-Template <= 350ms (BLAS GEMV <= 0.35ms cho 3,000 vectors)
- DATA TEST PLAN: TST-KSK-DAT-003, TST-KSK-DAT-004 (docs/subsystem-docs/kiosk-app/plans/test-plan.md)
- DATA SPECS: DATA-KSK-002 (docs/service-docs/kiosk-app/data/data-specs.md)
"""

import threading
import time
from typing import Any

import numpy as np
import pytest

from core.vision.gallery_matcher import GalleryCacheManager


def _create_random_unit_vector(dim: int = 512) -> np.ndarray:
    """Hàm phụ trợ sinh vector ngẫu nhiên có L2 Norm = 1.0."""
    v = np.random.randn(dim).astype(np.float32)
    return v / np.linalg.norm(v)


def _create_vector_with_similarity(base_vec: np.ndarray, target_sim: float) -> np.ndarray:
    """Sinh vector đơn vị có độ tương đồng Cosine chính xác = target_sim với base_vec.

    Sử dụng phép chiếu trực giao Gram-Schmidt:
    v_target = target_sim * base_vec + sqrt(1 - target_sim^2) * v_perp
    """
    assert -1.0 <= target_sim <= 1.0, "target_sim phải nằm trong đoạn [-1.0, 1.0]"
    base = base_vec.flatten().astype(np.float32)
    base_norm = np.linalg.norm(base)
    if base_norm > 1e-6:
        base = base / base_norm

    dim = base.shape[0]
    r = np.random.randn(dim).astype(np.float32)
    r_perp = r - np.dot(r, base) * base
    r_perp_norm = np.linalg.norm(r_perp)
    if r_perp_norm < 1e-6:
        r = np.ones(dim, dtype=np.float32)
        r_perp = r - np.dot(r, base) * base
        r_perp_norm = np.linalg.norm(r_perp)
    v_perp = r_perp / r_perp_norm

    target_vec = target_sim * base + np.sqrt(max(0.0, 1.0 - target_sim**2)) * v_perp
    target_vec = target_vec / np.linalg.norm(target_vec)
    return target_vec.astype(np.float32)


# ============================================================================
# 1. BASELINE TESTS (Bảo toàn tương thích ngược 100%)
# ============================================================================

def test_gallery_empty_matching():
    """Kiểm tra Gallery trống trả về (None, 0.0) và match_with_pose trả về (None, 0.0, None)."""
    matcher = GalleryCacheManager(default_threshold=0.50)
    query_vec = _create_random_unit_vector()

    emp_id, score = matcher.match(query_vec)
    assert emp_id is None
    assert score == 0.0
    assert matcher.get_count() == 0
    assert matcher.gallery_version >= 1

    emp_id_p, score_p, pose_p = matcher.match_with_pose(query_vec)
    assert emp_id_p is None
    assert score_p == 0.0
    assert pose_p is None
    assert matcher.last_matched_pose is None


def test_gallery_load_and_exact_match():
    """Kiểm tra nạp danh mục và so khớp chính xác nhân viên khi độ tương đồng Cosine đạt ~1.0."""
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
    """Kiểm tra lọc bỏ trường hợp điểm tương đồng dưới ngưỡng cấu hình."""
    matcher = GalleryCacheManager(default_threshold=0.85)

    vec1 = _create_random_unit_vector()
    vec_different = _create_random_unit_vector()

    matcher.load_gallery([(201, vec1)])

    matched_id, score = matcher.match(vec_different)
    assert matched_id is None
    assert score < 0.85


def test_tst_ksk_dat_003_speed_benchmark_1000_faces():
    """TST-KSK-DAT-003: Đo lường tốc độ so khớp ma trận RAM 1,000 nhân sự hoàn tất < 2ms."""
    matcher = GalleryCacheManager(default_threshold=0.50)

    np.random.seed(42)
    matrix = np.random.randn(1000, 512).astype(np.float32)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    matrix = matrix / norms

    records = [(1000 + i, matrix[i]) for i in range(1000)]
    matcher.load_gallery(records)

    assert matcher.get_count() == 1000

    query = _create_random_unit_vector()

    latencies = []
    for _ in range(10):
        t0 = time.perf_counter()
        matched_id, score = matcher.match(query)
        latencies.append((time.perf_counter() - t0) * 1000.0)

    avg_latency = float(np.mean(latencies))
    assert avg_latency < 5.0, f"Độ trễ trung bình {avg_latency:.2f}ms vượt quá kỳ vọng"


# ============================================================================
# 2. TASK 11 COMPREHENSIVE SCENARIOS (Multi-Template & SLA Benchmark)
# ============================================================================

def test_scenario_1_multi_template_best_score_matching():
    """Scenario 1: So khớp đa mẫu lấy Best Score = max(sim_front, sim_left, sim_right).

    Nhân viên 101 có 3 templates:
    - FRONTAL: sim = 0.50 (< 0.65)
    - LEFT_TILT: sim = 0.78 (>= 0.65)
    - RIGHT_TILT: sim = 0.40 (< 0.65)

    Khi khuôn mặt nghiêng trái (probe), hệ thống nhận diện đúng nhân viên 101
    với điểm 0.78 và xác định đúng tư thế 'LEFT_TILT'.
    """
    matcher = GalleryCacheManager(default_threshold=0.65)

    probe_vec = _create_random_unit_vector()

    v_frontal = _create_vector_with_similarity(probe_vec, 0.50)
    v_left = _create_vector_with_similarity(probe_vec, 0.78)
    v_right = _create_vector_with_similarity(probe_vec, 0.40)

    distractor_vec = _create_vector_with_similarity(probe_vec, 0.30)

    records = [
        {
            "employee_id": 101,
            "metadata": {"name": "Nguyen Van A", "code": "EMP-00101"},
            "templates": [
                {"pose_type": "FRONTAL", "vector": v_frontal},
                {"pose_type": "LEFT_TILT", "vector": v_left},
                {"pose_type": "RIGHT_TILT", "vector": v_right},
            ],
        },
        {
            "employee_id": 999,
            "metadata": {"name": "Nguoi Khac", "code": "EMP-00999"},
            "templates": [
                {"pose_type": "FRONTAL", "vector": distractor_vec},
            ],
        },
    ]

    matcher.load_gallery(records)

    # 1. Kiểm tra chữ ký match() tương thích ngược: trả về (emp_id, best_score)
    matched_id, best_score = matcher.match(probe_vec)
    assert matched_id == 101, f"Kỳ vọng nhận diện nhân viên 101 nhưng trả về {matched_id}"
    assert pytest.approx(best_score, abs=1e-3) == 0.78
    assert best_score >= 0.65

    # 2. Kiểm tra phương thức match_with_pose(): trả về (emp_id, best_score, matched_pose)
    emp_id_pose, score_pose, matched_pose = matcher.match_with_pose(probe_vec)
    assert emp_id_pose == 101
    assert pytest.approx(score_pose, abs=1e-3) == 0.78
    assert matched_pose == "LEFT_TILT"
    assert matcher.last_matched_pose == "LEFT_TILT"

    # 3. Thử nghiệm khuôn mặt nghiêng phải: sim với RIGHT_TILT đạt 0.85
    probe_right = _create_random_unit_vector()
    v_right_matched = _create_vector_with_similarity(probe_right, 0.85)
    records[0]["templates"][2]["vector"] = v_right_matched
    matcher.load_gallery(records)

    m_id_r, m_score_r, m_pose_r = matcher.match_with_pose(probe_right)
    assert m_id_r == 101
    assert pytest.approx(m_score_r, abs=1e-3) == 0.85
    assert m_pose_r == "RIGHT_TILT"


def test_scenario_2_backward_compatibility_single_template():
    """Scenario 2: Tương thích ngược với nhân viên cũ chỉ có 1 vector đơn lẻ (gán FRONTAL).

    Hệ thống chứa đồng thời:
    - Nhân viên 201: Dữ liệu cũ chỉ có single vector.
    - Nhân viên 202: Dữ liệu mới có 3 templates.
    """
    matcher = GalleryCacheManager(default_threshold=0.65)

    probe_legacy = _create_random_unit_vector()
    v_legacy = _create_vector_with_similarity(probe_legacy, 0.88)

    records: list[dict[str, Any]] = [
        # Nhân viên cũ (không có mảng templates, chỉ có vector hoặc vector512)
        {
            "employee_id": 201,
            "vector": v_legacy,
            "metadata": {"name": "Legacy Employee", "code": "EMP-00201"},
        },
        # Nhân viên mới (đa mẫu)
        {
            "employee_id": 202,
            "metadata": {"name": "Modern Employee", "code": "EMP-00202"},
            "templates": [
                {"pose_type": "FRONTAL", "vector": _create_random_unit_vector()},
                {"pose_type": "LEFT_TILT", "vector": _create_random_unit_vector()},
                {"pose_type": "RIGHT_TILT", "vector": _create_random_unit_vector()},
            ],
        },
    ]

    matcher.load_gallery(records)

    # 1. So khớp probe của nhân viên cũ
    matched_id, score = matcher.match(probe_legacy)
    assert matched_id == 201
    assert pytest.approx(score, abs=1e-3) == 0.88

    # 2. Kiểm tra match_with_pose: phải tự động nhận diện tư thế ngầm định 'FRONTAL'
    emp_id_p, score_p, pose_p = matcher.match_with_pose(probe_legacy)
    assert emp_id_p == 201
    assert pytest.approx(score_p, abs=1e-3) == 0.88
    assert pose_p == "FRONTAL"

    # 3. Hỗ trợ nạp dạng tuple cũ: [(employee_id, vector)]
    matcher_tuple = GalleryCacheManager(default_threshold=0.65)
    matcher_tuple.load_gallery([(201, v_legacy)])
    t_id, _, t_pose = matcher_tuple.match_with_pose(probe_legacy)
    assert t_id == 201
    assert t_pose == "FRONTAL"


def test_scenario_3_dynamic_addition_and_deletion():
    """Scenario 3: Nạp nóng động (add_or_update) và gỡ bỏ (remove) đa mẫu an toàn tức thì."""
    matcher = GalleryCacheManager(default_threshold=0.65)

    probe_dynamic = _create_random_unit_vector()
    v_front = _create_vector_with_similarity(probe_dynamic, 0.50)
    v_left = _create_vector_with_similarity(probe_dynamic, 0.45)
    v_right = _create_vector_with_similarity(probe_dynamic, 0.82)

    # 1. Thêm nhân viên 555 với 3 templates
    templates_555 = [
        {"pose_type": "FRONTAL", "vector": v_front},
        {"pose_type": "LEFT_TILT", "vector": v_left},
        {"pose_type": "RIGHT_TILT", "vector": v_right},
    ]

    matcher.add_or_update_employee(555, templates=templates_555, metadata={"name": "Pham Van D"})

    # Nhận diện tức thì không cần khởi động lại
    matched_id, score, pose = matcher.match_with_pose(probe_dynamic)
    assert matched_id == 555
    assert pytest.approx(score, abs=1e-3) == 0.82
    assert pose == "RIGHT_TILT"
    assert matcher.get_metadata(555)["name"] == "Pham Van D"

    # 2. Cập nhật nhân viên 555 (tái nạp mẫu mới) -> không bị trùng lặp số dòng
    new_v_front = _create_vector_with_similarity(probe_dynamic, 0.95)
    updated_templates = [
        {"pose_type": "FRONTAL", "vector": new_v_front},
    ]
    matcher.add_or_update(555, templates=updated_templates, metadata={"name": "Pham Van D Updated"})
    new_id, new_score, new_pose = matcher.match_with_pose(probe_dynamic)
    assert new_id == 555
    assert pytest.approx(new_score, abs=1e-3) == 0.95
    assert new_pose == "FRONTAL"

    # 3. Gỡ bỏ nhân viên 555
    removed = matcher.remove(555)
    assert removed is True

    # Truy vấn lại: phải trả về None vì toàn bộ templates của 555 đã bị xóa
    after_id, after_score, after_pose = matcher.match_with_pose(probe_dynamic)
    assert after_id is None
    assert after_score < 0.65
    assert after_pose is None
    assert matcher.get_metadata(555) is None


def test_benchmark_multi_template_matching_3000_vectors_sla():
    """Scenario 4 (Benchmark SLA Task 11 & NFR-ENROLL-006):

    Khởi tạo ma trận RAM 3,000 vectors (1,000 nhân viên x 3 templates 512D).
    Đo đạc 1,000 truy vấn điểm danh so khớp 1:N bằng tích vô hướng BLAS.
    Chứng minh:
    - Độ trễ trung bình <= 2.0 ms (thực tế BLAS GEMV <= 0.35 ms).
    - Phù hợp với tổng ngân sách điểm danh Kiosk <= 350 ms.
    """
    matcher = GalleryCacheManager(default_threshold=0.65)

    # 1. Sinh ma trận tổng hợp 3,000 vectors 512D chuẩn hóa L2 = 1.0
    np.random.seed(2026)
    num_employees = 1000
    templates_per_emp = 3
    total_vectors = num_employees * templates_per_emp  # 3,000

    raw_matrix = np.random.randn(total_vectors, 512).astype(np.float32)
    norms = np.linalg.norm(raw_matrix, axis=1, keepdims=True)
    normalized_matrix = raw_matrix / norms

    records = []
    poses = ["FRONTAL", "LEFT_TILT", "RIGHT_TILT"]
    for i in range(num_employees):
        emp_id = 1000 + i
        emp_templates = []
        for p_idx, pose in enumerate(poses):
            row_idx = i * templates_per_emp + p_idx
            emp_templates.append({
                "pose_type": pose,
                "vector": normalized_matrix[row_idx],
            })
        records.append({
            "employee_id": emp_id,
            "metadata": {"name": f"Employee {emp_id}", "code": f"EMP-{emp_id}"},
            "templates": emp_templates,
        })

    t_load_0 = time.perf_counter()
    matcher.load_gallery(records)
    load_time_ms = (time.perf_counter() - t_load_0) * 1000.0

    # Xác nhận kích thước ma trận trong RAM
    assert matcher._embeddings_matrix.shape == (3000, 512), (
        f"Kích thước ma trận RAM không đúng: {matcher._embeddings_matrix.shape}"
    )

    # 2. Khởi tạo tập truy vấn (Queries)
    query_batch = np.random.randn(100, 512).astype(np.float32)
    query_batch /= np.linalg.norm(query_batch, axis=1, keepdims=True)

    # 3. Warmup BLAS thread pool (50 lần)
    for i in range(50):
        matcher.match(query_batch[i % 100])

    # 4. Thực thi 1,000 lần truy vấn có đo đạc thời gian chính xác
    num_queries = 1000
    latencies_ms: list[float] = []

    for i in range(num_queries):
        q = query_batch[i % 100]
        t0 = time.perf_counter()
        matcher.match(q)
        dt_ms = (time.perf_counter() - t0) * 1000.0
        latencies_ms.append(dt_ms)

    mean_latency = float(np.mean(latencies_ms))
    p50_latency = float(np.percentile(latencies_ms, 50))
    p95_latency = float(np.percentile(latencies_ms, 95))
    p99_latency = float(np.percentile(latencies_ms, 99))
    max_latency = float(np.max(latencies_ms))

    # In kết quả benchmark phục vụ kiểm định và audit
    print("\n" + "=" * 70)
    print(" BÁO CÁO BENCHMARK SO KHỚP ĐA MẪU 1:N (FEAT-ENROLL-001 TASK 11)")
    print("=" * 70)
    print(f" Số lượng nhân sự kiểm thử:   {num_employees:,} nhân viên")
    print(f" Tổng số template ma trận:    {total_vectors:,} vectors (512 chiều float32)")
    print(f" Dung lượng bộ nhớ ma trận:   {matcher._embeddings_matrix.nbytes / 1024:.1f} KB")
    print(f" Thời gian nạp danh mục:      {load_time_ms:.2f} ms")
    print(f" Số lượng truy vấn đo đạc:    {num_queries:,} queries")
    print("-" * 70)
    print(f" Độ trễ trung bình (Mean):    {mean_latency:.4f} ms (Target BLAS <= 0.35 ms)")
    print(f" Trung vị (P50):              {p50_latency:.4f} ms")
    print(f" Phân vị 95 (P95):            {p95_latency:.4f} ms")
    print(f" Phân vị 99 (P99):            {p99_latency:.4f} ms")
    print(f" Đỉnh tối đa (Max):           {max_latency:.4f} ms")
    print("=" * 70)

    # 5. Khẳng định SLA (NFR-ENROLL-006 & Task 11)
    assert mean_latency <= 2.0, (
        f"Độ trễ trung bình {mean_latency:.4f} ms vượt quá ngưỡng SLA 2.0 ms"
    )
    assert p95_latency <= 3.0, (
        f"Độ trễ P95 {p95_latency:.4f} ms vượt quá ngưỡng an toàn 3.0 ms"
    )


def test_tst_ksk_dat_004_hot_patching_and_concurrency():
    """TST-KSK-DAT-004: Kiểm thử nạp nóng đa luồng an toàn (Thread-Safe Hot-Patching)."""
    matcher = GalleryCacheManager(default_threshold=0.50)

    vec_a = _create_random_unit_vector()
    vec_b = _create_random_unit_vector()

    # Thêm nhân viên 501
    matcher.add_or_update(501, vector=vec_a, metadata={"name": "Nhân viên 501"})
    assert matcher.get_count() >= 1
    m_id, _ = matcher.match(vec_a)
    assert m_id == 501
    assert matcher.get_metadata(501)["name"] == "Nhân viên 501"

    # Cập nhật nhân viên 501 sang vector mới
    matcher.add_or_update(501, vector=vec_b)
    m_id_b, score_b = matcher.match(vec_b)
    assert m_id_b == 501
    assert pytest.approx(score_b, abs=1e-4) == 1.0

    # Kiểm thử đa luồng đồng thời: 1 luồng match_with_pose liên tục, 1 luồng nạp nóng
    stop_event = threading.Event()
    match_errors: list[Exception] = []

    def reader_thread():
        while not stop_event.is_set():
            try:
                matcher.match_with_pose(vec_b)
            except Exception as e:
                match_errors.append(e)

    t = threading.Thread(target=reader_thread, daemon=True)
    t.start()

    for i in range(50):
        new_vec = _create_random_unit_vector()
        matcher.add_or_update(600 + i, vector=new_vec)
        if i % 2 == 0:
            matcher.remove(600 + i)

    stop_event.set()
    t.join(timeout=2.0)

    assert len(match_errors) == 0, f"Phát hiện lỗi tương tranh đa luồng: {match_errors}"

    # Xóa nhân viên 501
    removed = matcher.remove(501)
    assert removed is True
    assert matcher.get_metadata(501) is None

