"""Bộ kiểm thử đơn vị cho EnrollmentQualityChecker (Kiểm chuẩn chất lượng hình học và sinh trắc học - TC-KIOSK-17).

Tài liệu tham chiếu:
- TP-KIOSK-01 (Mục 6.2 - TC-KIOSK-17)
- BP-KIOSK-01 (Mục 1.2, 4.3 & FR-09)
- DDS.md (Mục 3.3 - Đăng ký mẫu khuôn mặt qua OTP & ISO/IEC 30107-3)
"""

import numpy as np
from core.vision.quality_checker import EnrollmentQualityChecker


class TestEnrollmentQualityChecker:
    """Kiểm thử bộ kiểm chuẩn chất lượng hình học và sinh trắc học."""

    def test_sharpness_computation(self):
        """Kiểm tra tính toán biến thiên Laplacian cho ảnh sắc nét và ảnh mờ."""
        checker = EnrollmentQualityChecker()

        # Ảnh rỗng hoặc None
        assert checker.compute_sharpness(None) == 0.0
        assert checker.compute_sharpness(np.zeros((0, 0, 3), dtype=np.uint8)) == 0.0

        # Ảnh sắc nét (nhiều cạnh/kết cấu)
        sharp_img = np.random.randint(0, 256, (150, 150, 3), dtype=np.uint8)
        assert checker.compute_sharpness(sharp_img) > 100.0

        # Ảnh mờ (đồng màu)
        flat_img = np.ones((150, 150, 3), dtype=np.uint8) * 128
        assert checker.compute_sharpness(flat_img) == 0.0

    def test_tc_kiosk_17_quality_evaluation_criteria(self):
        """TC-KIOSK-17: Kiểm thử toàn diện 4 tiêu chí kiểm chuẩn căn chỉnh khuôn mặt."""
        checker = EnrollmentQualityChecker(
            max_angle_deg=10.0,
            min_face_size=120,
            min_sharpness=100.0,
            min_liveness=0.85,
        )

        sharp_crop = np.random.randint(0, 256, (140, 140, 3), dtype=np.uint8)

        # 1. Mặt chuẩn thẳng góc, kích thước lớn, sắc nét, liveness cao
        rep_ok = checker.evaluate(
            bbox=(50, 50, 140, 140),
            euler_angles=(2.0, -3.0, 1.5),
            face_crop=sharp_crop,
            liveness_score=0.95,
        )
        assert rep_ok.is_passed is True
        assert rep_ok.euler_passed is True
        assert rep_ok.size_passed is True
        assert rep_ok.sharpness_passed is True
        assert rep_ok.liveness_passed is True

        # 2. Mặt quá nghiêng (Pitch = 25 độ > 10 độ)
        rep_tilt = checker.evaluate(
            bbox=(50, 50, 140, 140),
            euler_angles=(25.0, 0.0, 0.0),
            face_crop=sharp_crop,
            liveness_score=0.95,
        )
        assert rep_tilt.is_passed is False
        assert rep_tilt.euler_passed is False
        assert "thẳng mặt" in rep_tilt.feedback_message

        # 3. Kích thước mặt quá nhỏ (Bbox width = 80 < 120)
        rep_small = checker.evaluate(
            bbox=(50, 50, 80, 80),
            euler_angles=(0.0, 0.0, 0.0),
            face_crop=sharp_crop,
            liveness_score=0.95,
        )
        assert rep_small.is_passed is False
        assert rep_small.size_passed is False
        assert "gần" in rep_small.feedback_message

        # 4. Ảnh mờ (Sharpness thấp)
        flat_crop = np.ones((140, 140, 3), dtype=np.uint8) * 100
        rep_blur = checker.evaluate(
            bbox=(50, 50, 140, 140),
            euler_angles=(0.0, 0.0, 0.0),
            face_crop=flat_crop,
            liveness_score=0.95,
        )
        assert rep_blur.is_passed is False
        assert rep_blur.sharpness_passed is False
        assert "nhòe/mờ" in rep_blur.feedback_message

        # 5. Điểm liveness thấp (0.4 < 0.85)
        rep_spoof = checker.evaluate(
            bbox=(50, 50, 140, 140),
            euler_angles=(0.0, 0.0, 0.0),
            face_crop=sharp_crop,
            liveness_score=0.40,
        )
        assert rep_spoof.is_passed is False
        assert rep_spoof.liveness_passed is False
        assert "sống" in rep_spoof.feedback_message
