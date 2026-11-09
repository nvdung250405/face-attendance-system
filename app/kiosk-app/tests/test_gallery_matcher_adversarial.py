"""Adversarial stress-test harness for GalleryCacheManager (FEAT-ENROLL-001 M4).

Challenger: m4_challenger_1
Focus areas:
1. Best Score Selection across 3 poses
2. Ambiguous Distractors (distractor vs target pose)
3. Boundary Threshold (0.6499 vs 0.6501 and exact 0.65)
4. Hybrid Coexistence (single-template & multi-template mix)
5. Dirty Inputs (non-512D, un-normalized, None, NaN, Inf, zero vector)
6. Atomic Removal (multi-pose removal integrity across internal structures)
"""

import numpy as np
import pytest

from core.vision.gallery_matcher import GalleryCacheManager


def _create_unit_vector(dim: int = 512, seed: int | None = None) -> np.ndarray:
    if seed is not None:
        np.random.seed(seed)
    v = np.random.randn(dim).astype(np.float32)
    return v / np.linalg.norm(v)


def _create_vector_with_exact_similarity(base_vec: np.ndarray, target_sim: float, seed: int | None = None) -> np.ndarray:
    """Creates a unit vector with exact cosine similarity to base_vec using Gram-Schmidt."""
    if seed is not None:
        np.random.seed(seed)
    base = base_vec.flatten().astype(np.float32)
    base = base / np.linalg.norm(base)
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
# CHALLENGE 1: Best Score Selection
# ============================================================================

def test_challenge_1_best_score_selection_left_tilt():
    """Probe matches LEFT_TILT with 0.82, FRONTAL with 0.52, RIGHT_TILT with 0.45.

    Must strictly select employee 101, score 0.82, and pose LEFT_TILT.
    """
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=101)

    v_frontal = _create_vector_with_exact_similarity(probe, 0.52, seed=102)
    v_left = _create_vector_with_exact_similarity(probe, 0.82, seed=103)
    v_right = _create_vector_with_exact_similarity(probe, 0.45, seed=104)

    records = [
        {
            "employee_id": 101,
            "metadata": {"name": "Target Employee", "code": "EMP-101"},
            "templates": [
                {"pose_type": "FRONTAL", "vector": v_frontal},
                {"pose_type": "LEFT_TILT", "vector": v_left},
                {"pose_type": "RIGHT_TILT", "vector": v_right},
            ],
        }
    ]
    matcher.load_gallery(records)

    # 1. match() returns (101, 0.82)
    matched_id, score = matcher.match(probe)
    assert matched_id == 101
    assert pytest.approx(score, abs=1e-3) == 0.82

    # 2. match_with_pose() returns (101, 0.82, 'LEFT_TILT')
    p_id, p_score, p_pose = matcher.match_with_pose(probe)
    assert p_id == 101
    assert pytest.approx(p_score, abs=1e-3) == 0.82
    assert p_pose == "LEFT_TILT"
    assert matcher.last_matched_pose == "LEFT_TILT"


def test_challenge_1_best_score_selection_permutations():
    """Verify best score selection when FRONTAL or RIGHT_TILT has the highest score."""
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=201)

    # Case A: FRONTAL is best (0.88), LEFT is 0.60, RIGHT is 0.50
    v_f_high = _create_vector_with_exact_similarity(probe, 0.88, seed=202)
    v_l_mid = _create_vector_with_exact_similarity(probe, 0.60, seed=203)
    v_r_low = _create_vector_with_exact_similarity(probe, 0.50, seed=204)

    matcher.load_gallery([
        {
            "employee_id": 201,
            "templates": [
                {"pose_type": "FRONTAL", "vector": v_f_high},
                {"pose_type": "LEFT_TILT", "vector": v_l_mid},
                {"pose_type": "RIGHT_TILT", "vector": v_r_low},
            ],
        }
    ])
    matched_id, score, pose = matcher.match_with_pose(probe)
    assert matched_id == 201
    assert pytest.approx(score, abs=1e-3) == 0.88
    assert pose == "FRONTAL"

    # Case B: RIGHT_TILT is best (0.84), FRONTAL is 0.40, LEFT is 0.42
    v_f_low = _create_vector_with_exact_similarity(probe, 0.40, seed=205)
    v_l_low = _create_vector_with_exact_similarity(probe, 0.42, seed=206)
    v_r_high = _create_vector_with_exact_similarity(probe, 0.84, seed=207)

    matcher.load_gallery([
        {
            "employee_id": 202,
            "templates": [
                {"pose_type": "FRONTAL", "vector": v_f_low},
                {"pose_type": "LEFT_TILT", "vector": v_l_low},
                {"pose_type": "RIGHT_TILT", "vector": v_r_high},
            ],
        }
    ])
    matched_id, score, pose = matcher.match_with_pose(probe)
    assert matched_id == 202
    assert pytest.approx(score, abs=1e-3) == 0.84
    assert pose == "RIGHT_TILT"


# ============================================================================
# CHALLENGE 2: Ambiguous Distractors
# ============================================================================

def test_challenge_2_ambiguous_distractor_target_wins():
    """Distractor employee 999 has similarity 0.75, target employee 101 has best 0.78.

    Target 101 must strictly win.
    """
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=301)

    v_target_front = _create_vector_with_exact_similarity(probe, 0.50, seed=302)
    v_target_left = _create_vector_with_exact_similarity(probe, 0.78, seed=303)
    v_target_right = _create_vector_with_exact_similarity(probe, 0.40, seed=304)

    v_distractor_front = _create_vector_with_exact_similarity(probe, 0.75, seed=305)
    v_distractor_left = _create_vector_with_exact_similarity(probe, 0.60, seed=306)

    # Order 1: Distractor first, Target second
    records_1 = [
        {
            "employee_id": 999,
            "templates": [
                {"pose_type": "FRONTAL", "vector": v_distractor_front},
                {"pose_type": "LEFT_TILT", "vector": v_distractor_left},
            ],
        },
        {
            "employee_id": 101,
            "templates": [
                {"pose_type": "FRONTAL", "vector": v_target_front},
                {"pose_type": "LEFT_TILT", "vector": v_target_left},
                {"pose_type": "RIGHT_TILT", "vector": v_target_right},
            ],
        },
    ]
    matcher.load_gallery(records_1)
    matched_id, score, pose = matcher.match_with_pose(probe)
    assert matched_id == 101, f"Expected target 101 to win, got {matched_id}"
    assert pytest.approx(score, abs=1e-3) == 0.78
    assert pose == "LEFT_TILT"

    # Order 2: Target first, Distractor second
    records_2 = [records_1[1], records_1[0]]
    matcher.load_gallery(records_2)
    matched_id, score, pose = matcher.match_with_pose(probe)
    assert matched_id == 101
    assert pytest.approx(score, abs=1e-3) == 0.78
    assert pose == "LEFT_TILT"


def test_challenge_2_ambiguous_distractor_distractor_wins():
    """Distractor employee 999 has similarity 0.79, target employee 101 has best 0.77.

    Distractor 999 must strictly win.
    """
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=401)

    v_target_front = _create_vector_with_exact_similarity(probe, 0.50, seed=402)
    v_target_left = _create_vector_with_exact_similarity(probe, 0.77, seed=403)
    v_target_right = _create_vector_with_exact_similarity(probe, 0.40, seed=404)

    v_distractor = _create_vector_with_exact_similarity(probe, 0.79, seed=405)

    records = [
        {
            "employee_id": 101,
            "templates": [
                {"pose_type": "FRONTAL", "vector": v_target_front},
                {"pose_type": "LEFT_TILT", "vector": v_target_left},
                {"pose_type": "RIGHT_TILT", "vector": v_target_right},
            ],
        },
        {
            "employee_id": 999,
            "templates": [
                {"pose_type": "FRONTAL", "vector": v_distractor},
            ],
        },
    ]
    matcher.load_gallery(records)
    matched_id, score, pose = matcher.match_with_pose(probe)
    assert matched_id == 999
    assert pytest.approx(score, abs=1e-3) == 0.79
    assert pose == "FRONTAL"


def test_challenge_2_multiple_distractors_stress():
    """Multiple distractors (50 employees) with scores from 0.60 to 0.76. Target has 0.78."""
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=501)

    records = []
    # 50 distractors
    for i in range(50):
        sim = 0.60 + (i % 16) * 0.01  # up to 0.75
        vec = _create_vector_with_exact_similarity(probe, sim, seed=1000 + i)
        records.append({
            "employee_id": 2000 + i,
            "templates": [{"pose_type": "FRONTAL", "vector": vec}],
        })

    # Target employee in the middle
    v_target_left = _create_vector_with_exact_similarity(probe, 0.78, seed=502)
    records.insert(25, {
        "employee_id": 101,
        "templates": [
            {"pose_type": "LEFT_TILT", "vector": v_target_left},
        ],
    })

    matcher.load_gallery(records)
    matched_id, score, pose = matcher.match_with_pose(probe)
    assert matched_id == 101
    assert pytest.approx(score, abs=1e-3) == 0.78
    assert pose == "LEFT_TILT"


# ============================================================================
# CHALLENGE 3: Boundary Threshold (0.6499 vs 0.6501)
# ============================================================================

def test_challenge_3_boundary_threshold_rejection():
    """Similarity 0.6499 (< 0.6500) must strictly be rejected."""
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=601)

    v_below = _create_vector_with_exact_similarity(probe, 0.6499, seed=602)
    matcher.load_gallery([{"employee_id": 101, "vector": v_below}])

    matched_id, score = matcher.match(probe)
    assert matched_id is None, f"Expected None for score {score:.4f} < 0.65, got {matched_id}"
    assert pytest.approx(score, abs=1e-4) == 0.6499

    p_id, p_score, p_pose = matcher.match_with_pose(probe)
    assert p_id is None
    assert pytest.approx(p_score, abs=1e-4) == 0.6499
    assert p_pose is None
    assert matcher.last_matched_pose is None


def test_challenge_3_boundary_threshold_acceptance():
    """Similarity 0.6501 (>= 0.6500) must strictly be accepted."""
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=701)

    v_above = _create_vector_with_exact_similarity(probe, 0.6501, seed=702)
    matcher.load_gallery([
        {
            "employee_id": 101,
            "templates": [{"pose_type": "FRONTAL", "vector": v_above}],
        }
    ])

    matched_id, score = matcher.match(probe)
    assert matched_id == 101, f"Expected 101 for score {score:.4f} >= 0.65, got {matched_id}"
    assert pytest.approx(score, abs=1e-4) == 0.6501

    p_id, p_score, p_pose = matcher.match_with_pose(probe)
    assert p_id == 101
    assert pytest.approx(p_score, abs=1e-4) == 0.6501
    assert p_pose == "FRONTAL"
    assert matcher.last_matched_pose == "FRONTAL"


def test_challenge_3_boundary_threshold_override():
    """Verify runtime threshold argument overrides default threshold."""
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=801)

    v_test = _create_vector_with_exact_similarity(probe, 0.70, seed=802)
    matcher.load_gallery([{"employee_id": 101, "vector": v_test}])

    # With higher threshold 0.75: rejected
    m_id, s = matcher.match(probe, threshold=0.75)
    assert m_id is None
    assert pytest.approx(s, abs=1e-3) == 0.70

    # With lower threshold 0.60: accepted
    m_id, s = matcher.match(probe, threshold=0.60)
    assert m_id == 101
    assert pytest.approx(s, abs=1e-3) == 0.70


# ============================================================================
# CHALLENGE 4: Hybrid Coexistence
# ============================================================================

def test_challenge_4_hybrid_coexistence():
    """Mix of single-template employees and multi-template employees."""
    matcher = GalleryCacheManager(default_threshold=0.65)
    probe = _create_unit_vector(seed=901)

    # Emp 1: Legacy single-template dict
    v1 = _create_vector_with_exact_similarity(probe, 0.40, seed=902)
    # Emp 2: Modern 3-template dict
    v2_f = _create_vector_with_exact_similarity(probe, 0.50, seed=903)
    v2_l = _create_vector_with_exact_similarity(probe, 0.85, seed=904)
    v2_r = _create_vector_with_exact_similarity(probe, 0.45, seed=905)
    # Emp 3: Partial 2-template dict
    v3_f = _create_vector_with_exact_similarity(probe, 0.48, seed=906)
    v3_r = _create_vector_with_exact_similarity(probe, 0.55, seed=907)
    # Emp 4: Backend flat record
    v4 = _create_vector_with_exact_similarity(probe, 0.42, seed=908)

    records = [
        {"employee_id": 1, "vector": v1},
        {
            "employee_id": 2,
            "templates": [
                {"pose_type": "FRONTAL", "vector": v2_f},
                {"pose_type": "LEFT_TILT", "vector": v2_l},
                {"pose_type": "RIGHT_TILT", "vector": v2_r},
            ],
        },
        {
            "employee_id": 3,
            "templates": [
                {"pose_type": "FRONTAL", "vector": v3_f},
                {"pose_type": "RIGHT_TILT", "vector": v3_r},
            ],
        },
        {"employee_id": 4, "vector512": v4, "pose_type": "FRONTAL"},
    ]
    emp_count = matcher.load_gallery(records)

    # 4 unique employees, 1 + 3 + 2 + 1 = 7 templates
    assert emp_count == 4
    assert matcher.get_count() == 4
    assert matcher.get_template_count() == 7

    # Add Emp 5 via add_or_update with single template
    v5 = _create_vector_with_exact_similarity(probe, 0.35, seed=909)
    matcher.add_or_update(5, vector=v5, pose_type="RIGHT_TILT")

    assert matcher.get_count() == 5
    assert matcher.get_template_count() == 8

    # Match probe: Emp 2 at LEFT_TILT should win with 0.85
    m_id, score, pose = matcher.match_with_pose(probe)
    assert m_id == 2
    assert pytest.approx(score, abs=1e-3) == 0.85
    assert pose == "LEFT_TILT"

    # Match probe specifically for legacy Emp 1
    probe_emp1 = _create_vector_with_exact_similarity(v1, 0.90, seed=910)
    m_id1, score1, pose1 = matcher.match_with_pose(probe_emp1)
    assert m_id1 == 1
    assert pose1 == "FRONTAL"

    # Match probe specifically for Emp 5 (which was added with RIGHT_TILT)
    probe_emp5 = _create_vector_with_exact_similarity(v5, 0.92, seed=911)
    m_id5, score5, pose5 = matcher.match_with_pose(probe_emp5)
    assert m_id5 == 5
    assert pose5 == "RIGHT_TILT"


# ============================================================================
# CHALLENGE 5: Dirty Inputs & Robustness
# ============================================================================

def test_challenge_5_dirty_query_vector():
    """Adversarial query vectors: None, wrong dimensions, empty, un-normalized, NaN, Inf."""
    matcher = GalleryCacheManager(default_threshold=0.65)
    v_norm = _create_unit_vector(seed=1001)
    matcher.load_gallery([{"employee_id": 101, "vector": v_norm}])

    # 1. Query vector is None
    m_id, score = matcher.match(None)  # type: ignore
    assert m_id is None
    assert score == 0.0

    p_id, p_score, p_pose = matcher.match_with_pose(None)  # type: ignore
    assert p_id is None
    assert p_score == 0.0
    assert p_pose is None

    # 2. Query vector wrong dimension (511D and 513D)
    m_id, score = matcher.match(np.ones(511, dtype=np.float32))
    assert m_id is None
    assert score == 0.0

    m_id, score = matcher.match(np.ones(513, dtype=np.float32))
    assert m_id is None
    assert score == 0.0

    # 3. Query vector empty
    m_id, score = matcher.match(np.array([], dtype=np.float32))
    assert m_id is None
    assert score == 0.0

    # 4. Query vector un-normalized (scale = 50.0)
    scaled_v = v_norm * 50.0
    m_id, score = matcher.match(scaled_v)
    assert m_id == 101
    assert pytest.approx(score, abs=1e-4) == 1.0

    # 5. Query vector all zeros
    zero_v = np.zeros(512, dtype=np.float32)
    m_id, score = matcher.match(zero_v)
    assert m_id is None
    assert score == 0.0

    # 6. Query vector containing NaN
    nan_v = np.copy(v_norm)
    nan_v[0] = np.nan
    m_id, score = matcher.match(nan_v)
    assert m_id is None

    # 7. Query vector containing Inf
    inf_v = np.copy(v_norm)
    inf_v[0] = np.inf
    m_id, score = matcher.match(inf_v)
    assert m_id is None


def test_challenge_5_dirty_enrollment_inputs():
    """Adversarial template inputs to load_gallery and add_or_update."""
    matcher = GalleryCacheManager(default_threshold=0.65)

    # 1. load_gallery with invalid records: None, wrong dims, malformed
    records = [
        {"employee_id": 1, "vector": None},  # skipped
        {"employee_id": 2, "vector": np.ones(100)},  # skipped
        {"employee_id": 3, "templates": [{"vector512": None}]},  # skipped
        {"employee_id": 4, "templates": "not-a-list"},  # skipped
        "invalid-string-record",  # skipped
        (5,),  # tuple with length < 2, skipped
        {"employee_id": 6, "vector": _create_unit_vector(seed=1002)},  # VALID
    ]
    count = matcher.load_gallery(records)
    assert count == 1
    assert matcher.get_count() == 1
    assert matcher.get_all_ids() == [6]

    # 2. add_or_update with invalid vector
    with pytest.raises(ValueError, match="512D"):
        matcher.add_or_update(7, vector=None)

    with pytest.raises(ValueError, match="512D"):
        matcher.add_or_update(7, vector=np.ones(128))

    # 3. add_or_update with un-normalized vector (should auto-normalize)
    raw_unnorm = np.ones(512, dtype=np.float32) * 10.0
    matcher.add_or_update(7, vector=raw_unnorm, pose_type="LEFT_TILT")
    # Verify stored row has unit norm
    idx = np.where(matcher._id_map == 7)[0][0]
    stored_norm = np.linalg.norm(matcher._embeddings_matrix[idx])
    assert pytest.approx(stored_norm, abs=1e-4) == 1.0


def test_challenge_5_nan_matrix_poisoning_denial_of_service():
    """Vulnerability: Adding a template with NaN or Inf vectors must be rejected.

    If accepted, it poisons _embeddings_matrix so that np.argmax(scores) always picks
    the NaN row, causing ALL subsequent queries for valid employees to return (None, nan).
    """
    matcher = GalleryCacheManager(default_threshold=0.65)
    valid_v = _create_unit_vector(seed=1201)
    matcher.add_or_update(101, valid_v, metadata={"name": "Valid Emp 101"})

    # Attempt to enroll employee 202 with NaN-poisoned vector
    nan_v = np.copy(valid_v)
    nan_v[0] = np.nan

    # Must raise ValueError or reject invalid vector
    with pytest.raises(ValueError, match="512D"):
        matcher.add_or_update(202, nan_v)

    # Valid employee 101 must still match successfully
    m_id, score = matcher.match(valid_v)
    assert m_id == 101
    assert pytest.approx(score, abs=1e-4) == 1.0



# ============================================================================
# CHALLENGE 6: Atomic Removal
# ============================================================================

def test_challenge_6_atomic_removal_multi_pose():
    """Enroll employee with 3 poses, call remove(), verify 100% atomic purge across all structures."""
    matcher = GalleryCacheManager(default_threshold=0.65)

    probe_101 = _create_unit_vector(seed=1101)
    probe_102 = _create_unit_vector(seed=1102)

    v101_f = _create_vector_with_exact_similarity(probe_101, 0.85, seed=1103)
    v101_l = _create_vector_with_exact_similarity(probe_101, 0.82, seed=1104)
    v101_r = _create_vector_with_exact_similarity(probe_101, 0.80, seed=1105)

    v102_f = _create_vector_with_exact_similarity(probe_102, 0.88, seed=1106)
    v102_l = _create_vector_with_exact_similarity(probe_102, 0.84, seed=1107)
    v102_r = _create_vector_with_exact_similarity(probe_102, 0.81, seed=1108)

    records = [
        {
            "employee_id": 101,
            "metadata": {"name": "Employee 101", "code": "EMP-101", "dept": "IT"},
            "templates": [
                {"pose_type": "FRONTAL", "vector": v101_f},
                {"pose_type": "LEFT_TILT", "vector": v101_l},
                {"pose_type": "RIGHT_TILT", "vector": v101_r},
            ],
        },
        {
            "employee_id": 102,
            "metadata": {"name": "Employee 102", "code": "EMP-102", "dept": "HR"},
            "templates": [
                {"pose_type": "FRONTAL", "vector": v102_f},
                {"pose_type": "LEFT_TILT", "vector": v102_l},
                {"pose_type": "RIGHT_TILT", "vector": v102_r},
            ],
        },
    ]

    matcher.load_gallery(records)
    assert matcher.get_count() == 2
    assert matcher.get_template_count() == 6
    assert matcher._embeddings_matrix.shape == (6, 512)
    assert len(matcher._id_map) == 6
    assert len(matcher._pose_map) == 6

    # Verify both match initially
    assert matcher.match(probe_101)[0] == 101
    assert matcher.match(probe_102)[0] == 102

    version_before = matcher.gallery_version

    # Call remove(101)
    removed = matcher.remove(101)
    assert removed is True
    assert matcher.gallery_version > version_before

    # Verify atomic removal across all internal structures:
    # 1. Zero rows for 101 remain in _id_map
    assert 101 not in matcher._id_map
    assert np.all(matcher._id_map == 102)

    # 2. Dimensions decreased by exactly 3
    assert matcher._embeddings_matrix.shape == (3, 512)
    assert len(matcher._id_map) == 3
    assert len(matcher._pose_map) == 3
    assert matcher.get_count() == 1
    assert matcher.get_template_count() == 3

    # 3. Metadata for 101 purged
    assert matcher.get_metadata(101) is None
    assert matcher.get_metadata(102) is not None
    assert matcher.get_all_ids() == [102]

    # 4. Probes for 101 now return None
    assert matcher.match(probe_101)[0] is None
    m_id, _, pose = matcher.match_with_pose(probe_101)
    assert m_id is None
    assert pose is None

    # 5. Probes for 102 still match perfectly with all 3 poses
    m_id_102, score_102, pose_102 = matcher.match_with_pose(probe_102)
    assert m_id_102 == 102
    assert pytest.approx(score_102, abs=1e-3) == 0.88
    assert pose_102 == "FRONTAL"

    # 6. Second remove returns False
    assert matcher.remove(101) is False
    assert matcher.remove(99999) is False

    # 7. Remove 102 -> Gallery becomes empty
    assert matcher.remove(102) is True
    assert matcher.get_count() == 0
    assert matcher.get_template_count() == 0
    assert matcher._embeddings_matrix.shape == (0, 512)
    assert len(matcher._id_map) == 0
    assert len(matcher._pose_map) == 0

    # 8. Query on now-empty gallery returns (None, 0.0)
    assert matcher.match(probe_102) == (None, 0.0)
