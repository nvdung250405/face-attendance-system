"""Bộ kiểm thử đơn vị cho Hộp thoại đăng ký khuôn mặt EnrollmentDialog và kiểm chuẩn chất lượng ảnh.

Tài liệu tham chiếu:
- TP-KIOSK-01 (Mục 6.2 - TC-KIOSK-16, TC-KIOSK-17, TC-KIOSK-18)
- BP-KIOSK-01 (Mục 1.2, 4.3 & FR-09)
- DDS.md (Mục 3.3 - Đăng ký mẫu khuôn mặt qua OTP & ISO/IEC 30107-3)
"""

import base64
from unittest.mock import MagicMock

import httpx
import numpy as np

from core.vision.face_detector import FaceDetectionResult
from ui.views.enrollment_dialog import (
    EnrollmentDialog,
    EnrollmentQualityChecker,
)


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
        assert "đạt chuẩn" in rep_ok.feedback_message.lower()

        # 2. Mặt bị nghiêng quá 10 độ
        rep_tilted = checker.evaluate(
            bbox=(50, 50, 140, 140),
            euler_angles=(12.0, 0.0, 0.0),
            face_crop=sharp_crop,
            liveness_score=0.95,
        )
        assert rep_tilted.is_passed is False
        assert rep_tilted.euler_passed is False
        assert "giữ thẳng mặt" in rep_tilted.feedback_message.lower()

        # 3. Mặt quá nhỏ (< 120px)
        rep_small = checker.evaluate(
            bbox=(50, 50, 90, 90),
            euler_angles=(0.0, 0.0, 0.0),
            face_crop=sharp_crop,
            liveness_score=0.95,
        )
        assert rep_small.is_passed is False
        assert rep_small.size_passed is False
        assert "lại gần camera" in rep_small.feedback_message.lower()

        # 4. Ảnh bị mờ (sharpness < 100)
        flat_crop = np.ones((140, 140, 3), dtype=np.uint8) * 128
        rep_blur = checker.evaluate(
            bbox=(50, 50, 140, 140),
            euler_angles=(0.0, 0.0, 0.0),
            face_crop=flat_crop,
            liveness_score=0.95,
        )
        assert rep_blur.is_passed is False
        assert rep_blur.sharpness_passed is False
        assert "nhòe" in rep_blur.feedback_message.lower() or "mờ" in rep_blur.feedback_message.lower()

        # 5. Điểm liveness thấp (< 0.85)
        rep_fake = checker.evaluate(
            bbox=(50, 50, 140, 140),
            euler_angles=(0.0, 0.0, 0.0),
            face_crop=sharp_crop,
            liveness_score=0.45,
        )
        assert rep_fake.is_passed is False
        assert rep_fake.liveness_passed is False
        assert "thực thể sống" in rep_fake.feedback_message.lower()


class TestEnrollmentDialog:
    """Kiểm thử chức năng của hộp thoại EnrollmentDialog."""

    def test_keypad_typing_and_editing(self, qapp):
        """Kiểm tra nhập số, xóa lùi và xóa trắng trên bàn phím ảo OTP."""
        dialog = EnrollmentDialog()

        assert dialog.otp_code == ""
        assert dialog.otp_display.text() == ""

        # Gõ 6 chữ số
        for char in "839201":
            dialog._handle_digit(char)

        assert dialog.otp_code == "839201"
        assert dialog.otp_display.text() == "839201"

        # Gõ thêm không vượt quá 6 số
        dialog._handle_digit("9")
        assert dialog.otp_code == "839201"

        # Xóa lùi
        dialog._handle_backspace()
        assert dialog.otp_code == "83920"

        # Xóa trắng
        dialog._handle_clear()
        assert dialog.otp_code == ""
        assert dialog.otp_display.text() == ""

    def test_tc_kiosk_16_verify_otp_success_and_failure(self, qapp):
        """TC-KIOSK-16: Tiếp nhận mã kích hoạt OTP 6 số và xác thực qua Backend API."""
        # Trường hợp 1: Mã OTP chưa đủ 6 số
        dialog = EnrollmentDialog()
        dialog.otp_code = "123"
        assert dialog.verify_otp() is False
        assert "6 chữ số" in dialog.otp_error_banner.text()

        # Trường hợp 2: Backend từ chối OTP sai hoặc hết hạn (400)
        def mock_err_handler(request: httpx.Request):
            return httpx.Response(
                400,
                json={"success": False, "message": "Mã OTP không hợp lệ hoặc đã hết hạn"},
            )

        mock_err_client = httpx.Client(transport=httpx.MockTransport(mock_err_handler))
        dialog_err = EnrollmentDialog(client=mock_err_client)
        dialog_err.otp_code = "000000"
        assert dialog_err.verify_otp() is False
        assert "không hợp lệ" in dialog_err.otp_error_banner.text()
        assert dialog_err.stacked_widget.currentIndex() == 0  # Vẫn ở trang OTP

        # Trường hợp 3: Backend xác nhận OTP hợp lệ (200 OK)
        def mock_ok_handler(request: httpx.Request):
            assert request.url.path.endswith("/kiosk/verify-otp")
            return httpx.Response(
                200,
                json={
                    "success": True,
                    "code": "OTP_VERIFIED",
                    "data": {
                        "employeeId": 1090,
                        "fullName": "Trần Thị Lan",
                        "department": "Khối Công nghệ Thông tin",
                    },
                },
            )

        mock_ok_client = httpx.Client(transport=httpx.MockTransport(mock_ok_handler))
        dialog_ok = EnrollmentDialog(client=mock_ok_client)
        dialog_ok.otp_code = "839201"

        assert dialog_ok.verify_otp() is True
        assert dialog_ok.stacked_widget.currentIndex() == 1  # Chuyển sang trang Quét khuôn mặt
        assert "Trần Thị Lan" in dialog_ok.emp_info_label.text()
        assert "1090" in dialog_ok.emp_info_label.text()

    def test_tc_kiosk_17_process_frame_progress(self, qapp):
        """TC-KIOSK-17: Hướng dẫn người dùng căn chỉnh và hiển thị tiến trình quét."""
        # Giả lập FaceDetector
        mock_detector = MagicMock()
        sharp_crop = np.random.randint(0, 256, (140, 140, 3), dtype=np.uint8)

        mock_detector.detect_face.return_value = FaceDetectionResult(
            bbox=(50, 50, 140, 140),
            landmarks=np.zeros((5, 2), dtype=np.float32),
            score=0.98,
            euler_angles=(1.0, 0.0, 0.0),
            is_valid_size=True,
            is_tilted=False,
        )

        mock_extractor = MagicMock()
        mock_extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
        mock_extractor.extract_vector.return_value = np.ones(512, dtype=np.float32)

        dialog = EnrollmentDialog(
            detector=mock_detector,
            extractor=mock_extractor,
        )
        dialog.otp_code = "839201"
        dialog.employee_info = {"employeeId": 1090, "fullName": "Trần Thị Lan"}

        # Xử lý 1 khung hình đạt chuẩn
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        frame[50:190, 50:190] = sharp_crop

        report = dialog.process_frame(frame)
        assert report is not None
        assert report.is_passed is True
        assert dialog.consecutive_passed_frames == 1
        assert dialog.progress_bar.value() == 20  # 1/5 frames = 20%

        # Xử lý khung hình rỗng / không có mặt
        mock_detector.detect_face.return_value = None
        rep_none = dialog.process_frame(frame)
        assert rep_none is None
        assert dialog.consecutive_passed_frames == 0
        assert dialog.progress_bar.value() == 0  # Bị reset vì mất dấu khuôn mặt

    def test_tc_kiosk_18_submit_enrollment_success(self, qapp):
        """TC-KIOSK-18: Trích xuất vector 512D chuẩn và gửi API đăng ký lên Backend."""
        sent_requests = []

        def mock_enroll_handler(request: httpx.Request):
            if request.url.path.endswith("/kiosk/enroll-face"):
                import json
                body = json.loads(request.content)
                sent_requests.append(body)
                return httpx.Response(
                    200,
                    json={
                        "success": True,
                        "code": "ENROLLMENT_COMPLETED",
                        "message": "Đăng ký khuôn mặt mẫu thành công",
                        "data": {
                            "employeeId": 1090,
                            "fullName": "Trần Thị Lan",
                            "status": "ACTIVE",
                        },
                    },
                )
            return httpx.Response(404)

        transport = httpx.MockTransport(mock_enroll_handler)
        mock_client = httpx.Client(transport=transport)

        dialog = EnrollmentDialog(
            client=mock_client,
            kiosk_id="KIOSK-LOBBY-01",
        )
        dialog.otp_code = "839201"
        dialog.employee_info = {"employeeId": 1090, "fullName": "Trần Thị Lan"}

        # Chuẩn bị vector 512D mẫu
        test_vector = np.full(512, 0.5, dtype=np.float32)

        completion_events = []
        dialog.enrollment_completed.connect(lambda data: completion_events.append(data))

        # Gửi đăng ký
        success = dialog.submit_enrollment(test_vector)

        # Xác thực kết quả
        assert success is True
        assert len(sent_requests) == 1
        req_data = sent_requests[0]
        assert req_data["otp"] == "839201"
        assert req_data["kioskId"] == "KIOSK-LOBBY-01"
        assert req_data["modelVersion"] == "ArcFace-MobileFaceNet-v1"

        # Giải mã chuỗi Base64 để kiểm tra vector đúng 2048 bytes (512 float32 * 4 bytes)
        decoded_bytes = base64.b64decode(req_data["embeddingVectorBase64"])
        assert len(decoded_bytes) == 2048
        recovered_vector = np.frombuffer(decoded_bytes, dtype=np.float32)
        assert np.allclose(recovered_vector, test_vector)

        # Kiểm tra chuyển sang trang 3 (Trang thành công)
        assert dialog.stacked_widget.currentIndex() == 2
        assert "Trần Thị Lan" in dialog.success_detail_label.text()
        assert len(completion_events) == 1

    def test_cancel_and_reset_navigation(self, qapp):
        """Kiểm thử hủy đăng ký và quay lại các bước trước."""
        dialog = EnrollmentDialog()

        cancel_signals = []
        dialog.enrollment_cancelled.connect(lambda: cancel_signals.append(True))

        dialog._handle_cancel()
        assert len(cancel_signals) == 1

        # Chuyển trang và reset
        dialog.stacked_widget.setCurrentIndex(1)
        dialog.consecutive_passed_frames = 3
        dialog._reset_to_otp_page()

        assert dialog.stacked_widget.currentIndex() == 0
        assert dialog.consecutive_passed_frames == 0
        assert dialog.progress_bar.value() == 0
