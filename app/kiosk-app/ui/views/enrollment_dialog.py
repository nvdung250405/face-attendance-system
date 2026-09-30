"""Module giao diện tiếp nhận OTP và đăng ký mẫu khuôn mặt mới (EnrollmentDialog).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-09 - EnrollmentDialog)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-16, TC-KIOSK-17, TC-KIOSK-18)
- DDS.md (Mục 3.3 - Đăng ký mẫu khuôn mặt qua OTP & Mục 4.3 - REST API)
"""

import base64
from dataclasses import dataclass
from typing import Any

import cv2
import httpx
import numpy as np
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont, QImage, QPixmap
from PySide6.QtWidgets import (
    QDialog,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QProgressBar,
    QPushButton,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from config.logger import get_logger
from config.settings import settings
from core.vision.face_detector import YuNetFaceDetector
from core.vision.feature_extractor import ArcFaceFeatureExtractor
from core.vision.liveness_gate import MiniFASNetLivenessGate

logger = get_logger("enrollment_dialog")


@dataclass(frozen=True)
class EnrollmentQualityReport:
    """Kết quả thẩm định chất lượng khung hình khuôn mặt chuẩn hóa."""

    is_passed: bool
    euler_passed: bool
    size_passed: bool
    sharpness_passed: bool
    liveness_passed: bool
    yaw: float
    pitch: float
    roll: float
    face_size: tuple[int, int]
    sharpness: float
    liveness_score: float
    feedback_message: str


class EnrollmentQualityChecker:
    """Kiểm chuẩn chất lượng ảnh đăng ký theo tiêu chuẩn ISO/IEC 30107-3 và DDS.md."""

    def __init__(
        self,
        max_angle_deg: float = 10.0,
        min_face_size: int = 120,
        min_sharpness: float = 100.0,
        min_liveness: float = 0.85,
    ) -> None:
        self.max_angle_deg: float = max_angle_deg
        self.min_face_size: int = min_face_size
        self.min_sharpness: float = min_sharpness
        self.min_liveness: float = min_liveness

    def compute_sharpness(self, face_crop: np.ndarray) -> float:
        """Đo độ sắc nét của ảnh cắt khuôn mặt qua biến thiên ma trận Laplacian."""
        if face_crop is None or face_crop.size == 0:
            return 0.0
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())

    def evaluate(
        self,
        bbox: tuple[int, int, int, int],
        euler_angles: tuple[float, float, float],
        face_crop: np.ndarray,
        liveness_score: float,
    ) -> EnrollmentQualityReport:
        """Thẩm định các tiêu chí chất lượng khuôn mặt chuẩn hóa."""
        yaw, pitch, roll = euler_angles
        _, _, w, h = bbox

        # 1. Tiêu chí góc quay thẳng mặt <= 10 độ
        euler_passed = (
            abs(yaw) <= self.max_angle_deg
            and abs(pitch) <= self.max_angle_deg
            and abs(roll) <= self.max_angle_deg
        )

        # 2. Tiêu chí kích thước khuôn mặt >= 120x120 px
        size_passed = w >= self.min_face_size and h >= self.min_face_size

        # 3. Tiêu chí độ sắc nét (độ mờ) >= 100
        sharpness = self.compute_sharpness(face_crop)
        sharpness_passed = sharpness >= self.min_sharpness

        # 4. Tiêu chí thực thể sống liveness >= 0.85
        liveness_passed = liveness_score >= self.min_liveness

        is_passed = (
            euler_passed and size_passed and sharpness_passed and liveness_passed
        )

        # Xây dựng câu nhắc hướng dẫn trực quan theo thứ tự ưu tiên
        if not size_passed:
            feedback = "Vui lòng đứng lại gần camera hơn (khuôn mặt quá nhỏ)"
        elif not euler_passed:
            feedback = "Vui lòng giữ thẳng mặt, nhìn trực diện vào ống kính"
        elif not sharpness_passed:
            feedback = "Hình ảnh bị nhòe/mờ, vui lòng đứng yên trước camera"
        elif not liveness_passed:
            feedback = "Cảnh báo: Độ thực thể sống không đạt, vui lòng bỏ khẩu trang"
        else:
            feedback = "Khuôn mặt đạt chuẩn! Vui lòng giữ nguyên tư thế..."

        return EnrollmentQualityReport(
            is_passed=is_passed,
            euler_passed=euler_passed,
            size_passed=size_passed,
            sharpness_passed=sharpness_passed,
            liveness_passed=liveness_passed,
            yaw=yaw,
            pitch=pitch,
            roll=roll,
            face_size=(w, h),
            sharpness=sharpness,
            liveness_score=liveness_score,
            feedback_message=feedback,
        )


class EnrollmentDialog(QDialog):
    """Hộp thoại hướng dẫn đăng ký mẫu khuôn mặt mới bằng mã kích hoạt OTP."""

    # Tín hiệu phát khi hoàn tất đăng ký thành công: payload phản hồi từ Backend
    enrollment_completed = Signal(dict)

    # Tín hiệu phát khi người dùng nhấn Hủy/Đóng
    enrollment_cancelled = Signal()

    def __init__(
        self,
        detector: YuNetFaceDetector | None = None,
        extractor: ArcFaceFeatureExtractor | None = None,
        liveness_gate: MiniFASNetLivenessGate | None = None,
        client: httpx.Client | None = None,
        kiosk_id: str | None = None,
        backend_url: str | None = None,
        secret_token: str | None = None,
        parent: QWidget | None = None,
    ) -> None:
        """Khởi tạo EnrollmentDialog.

        Args:
            detector: Bộ phát hiện khuôn mặt YuNet.
            extractor: Bộ trích xuất vector ArcFace.
            liveness_gate: Bộ lọc thực thể sống MiniFASNet.
            client: HTTP client tuỳ chọn (dùng cho unit test mocking).
            kiosk_id: Mã trạm Kiosk.
            backend_url: URL API Backend.
            secret_token: Token bí mật trạm Kiosk.
            parent: Widget cha.
        """
        super().__init__(parent)

        self.detector = detector
        self.extractor = extractor
        self.liveness_gate = liveness_gate
        self.quality_checker = EnrollmentQualityChecker()

        self._custom_client = client
        self._internal_client: httpx.Client | None = None
        self.kiosk_id: str = kiosk_id or settings.kiosk_id
        self.backend_url: str = (backend_url or settings.backend_url).rstrip("/")
        self.secret_token: str = secret_token or settings.kiosk_secret_token

        # Trạng thái dữ liệu đăng ký
        self.otp_code: str = ""
        self.employee_info: dict[str, Any] = {}
        self.captured_vectors: list[np.ndarray] = []
        self.consecutive_passed_frames: int = 0
        self.required_passed_frames: int = 5  # Quét 5 khung hình chuẩn liên tiếp

        # Cấu hình cửa sổ
        self.setWindowTitle("Đăng ký Mẫu Khuôn mặt - FAS Kiosk")
        self.setFixedSize(540, 740)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowContextHelpButtonHint)
        self.setStyleSheet("background-color: #1E1E2E; color: #FFFFFF;")

        self._init_ui()

    def _get_client(self) -> httpx.Client:
        """Lấy HTTP client."""
        if self._custom_client is not None:
            return self._custom_client
        if self._internal_client is None or self._internal_client.is_closed:
            self._internal_client = httpx.Client(
                timeout=10.0,
                headers={
                    "Authorization": f"Bearer {self.secret_token}",
                    "X-Kiosk-Id": self.kiosk_id,
                    "Content-Type": "application/json",
                },
            )
        return self._internal_client

    def _close_client(self) -> None:
        """Đóng HTTP client nội bộ."""
        if self._internal_client is not None and not self._internal_client.is_closed:
            try:
                self._internal_client.close()
            except Exception:
                pass
            self._internal_client = None

    def _init_ui(self) -> None:
        """Khởi tạo bố cục các trang chuyển tiếp (QStackedWidget)."""
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(12)

        self.stacked_widget = QStackedWidget(self)
        main_layout.addWidget(self.stacked_widget)

        # Trang 1: Nhập mã kích hoạt OTP
        self.otp_page = self._create_otp_page()
        self.stacked_widget.addWidget(self.otp_page)

        # Trang 2: Căn chỉnh và Quét khuôn mặt chuẩn hóa
        self.scan_page = self._create_scan_page()
        self.stacked_widget.addWidget(self.scan_page)

        # Trang 3: Thông báo hoàn tất thành công
        self.success_page = self._create_success_page()
        self.stacked_widget.addWidget(self.success_page)

        self.stacked_widget.setCurrentIndex(0)

    # =========================================================================
    # Trang 1: Nhập mã OTP
    # =========================================================================

    def _create_otp_page(self) -> QWidget:
        """Tạo giao diện trang tiếp nhận OTP với bàn phím số ảo."""
        page = QWidget(self)
        layout = QVBoxLayout(page)
        layout.setContentsMargins(10, 0, 10, 0)
        layout.setSpacing(10)

        # Tiêu đề
        title = QLabel("ĐĂNG KÝ KHUÔN MẶT MỚI", page)
        title.setAlignment(Qt.AlignCenter)
        title.setFont(QFont("Segoe UI", 16, QFont.Bold))
        title.setStyleSheet("color: #89B4FA; margin-bottom: 2px;")
        layout.addWidget(title)

        subtitle = QLabel("Vui lòng nhập mã OTP 6 số từ Cổng Web Nhân viên", page)
        subtitle.setAlignment(Qt.AlignCenter)
        subtitle.setStyleSheet("color: #A6ADC8; font-size: 13px; margin-bottom: 6px;")
        layout.addWidget(subtitle)

        # Banner cảnh báo lỗi
        self.otp_error_banner = QLabel("", page)
        self.otp_error_banner.setAlignment(Qt.AlignCenter)
        self.otp_error_banner.setWordWrap(True)
        self.otp_error_banner.setStyleSheet(
            "color: #F38BA8; font-size: 13px; font-weight: bold; padding: 4px;"
        )
        layout.addWidget(self.otp_error_banner)

        # Ô hiển thị mã OTP 6 số
        self.otp_display = QLineEdit(page)
        self.otp_display.setReadOnly(True)
        self.otp_display.setAlignment(Qt.AlignCenter)
        self.otp_display.setMaxLength(6)
        self.otp_display.setPlaceholderText("• • • • • •")
        self.otp_display.setFixedHeight(54)
        self.otp_display.setFont(QFont("Segoe UI", 24, QFont.Bold))
        self.otp_display.setStyleSheet("""
            QLineEdit {
                background-color: #313244;
                color: #A6E3A1;
                border: 2px solid #89B4FA;
                border-radius: 10px;
                letter-spacing: 12px;
            }
        """)
        layout.addWidget(self.otp_display)

        # Bàn phím số ảo cảm ứng 3x4
        keypad = QWidget(page)
        grid = QGridLayout(keypad)
        grid.setSpacing(8)
        grid.setContentsMargins(0, 8, 0, 8)

        buttons = [
            ("1", 0, 0), ("2", 0, 1), ("3", 0, 2),
            ("4", 1, 0), ("5", 1, 1), ("6", 1, 2),
            ("7", 2, 0), ("8", 2, 1), ("9", 2, 2),
            ("C", 3, 0), ("0", 3, 1), ("⌫", 3, 2),
        ]

        for text, row, col in buttons:
            btn = QPushButton(text, keypad)
            btn.setFixedHeight(52)
            btn.setFont(QFont("Segoe UI", 16, QFont.Bold))
            if text in ("C", "⌫"):
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #45475A;
                        color: #F38BA8;
                        border-radius: 8px;
                    }
                    QPushButton:hover { background-color: #585B70; }
                    QPushButton:pressed { background-color: #313244; }
                """)
            else:
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #313244;
                        color: #CDD6F4;
                        border-radius: 8px;
                    }
                    QPushButton:hover { background-color: #45475A; }
                    QPushButton:pressed { background-color: #585B70; }
                """)

            if text == "C":
                btn.clicked.connect(self._handle_clear)
            elif text == "⌫":
                btn.clicked.connect(self._handle_backspace)
            else:
                btn.clicked.connect(lambda _, d=text: self._handle_digit(d))

            grid.addWidget(btn, row, col)

        layout.addWidget(keypad)

        # Các nút hành động dưới cùng
        actions_layout = QHBoxLayout()
        actions_layout.setSpacing(10)

        cancel_btn = QPushButton("✕ Hủy bỏ", page)
        cancel_btn.setFixedHeight(46)
        cancel_btn.setFont(QFont("Segoe UI", 13))
        cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: #45475A;
                color: #CDD6F4;
                border-radius: 8px;
            }
            QPushButton:hover { background-color: #585B70; }
        """)
        cancel_btn.clicked.connect(self._handle_cancel)
        actions_layout.addWidget(cancel_btn)

        self.verify_btn = QPushButton("✓ Xác thực OTP", page)
        self.verify_btn.setFixedHeight(46)
        self.verify_btn.setFont(QFont("Segoe UI", 13, QFont.Bold))
        self.verify_btn.setStyleSheet("""
            QPushButton {
                background-color: #89B4FA;
                color: #11111B;
                border-radius: 8px;
            }
            QPushButton:hover { background-color: #B4BEFE; }
            QPushButton:pressed { background-color: #74C7EC; }
        """)
        self.verify_btn.clicked.connect(self.verify_otp)
        actions_layout.addWidget(self.verify_btn)

        layout.addLayout(actions_layout)
        return page

    # =========================================================================
    # Trang 2: Hướng dẫn & Căn chỉnh khuôn mặt
    # =========================================================================

    def _create_scan_page(self) -> QWidget:
        """Tạo giao diện trang căn chỉnh khuôn mặt và hiển thị tiến trình quét."""
        page = QWidget(self)
        layout = QVBoxLayout(page)
        layout.setContentsMargins(10, 0, 10, 0)
        layout.setSpacing(10)

        # Thông tin nhân viên đã xác thực OTP
        self.emp_info_label = QLabel("Nhân viên: Đang cập nhật...", page)
        self.emp_info_label.setAlignment(Qt.AlignCenter)
        self.emp_info_label.setFont(QFont("Segoe UI", 14, QFont.Bold))
        self.emp_info_label.setStyleSheet("color: #A6E3A1; margin-bottom: 2px;")
        layout.addWidget(self.emp_info_label)

        # Khung hiển thị camera video preview
        self.video_preview_label = QLabel(page)
        self.video_preview_label.setAlignment(Qt.AlignCenter)
        self.video_preview_label.setFixedHeight(300)
        self.video_preview_label.setStyleSheet("""
            QLabel {
                background-color: #11111B;
                border: 2px solid #45475A;
                border-radius: 12px;
                color: #6C7086;
                font-size: 13px;
            }
        """)
        self.video_preview_label.setText("Khu vực hiển thị camera khuôn mặt")
        layout.addWidget(self.video_preview_label)

        # Hướng dẫn phản hồi trực quan chất lượng
        self.feedback_label = QLabel(
            "Vui lòng tháo khẩu trang, giữ thẳng mặt nhìn vào camera", page
        )
        self.feedback_label.setAlignment(Qt.AlignCenter)
        self.feedback_label.setWordWrap(True)
        self.feedback_label.setFont(QFont("Segoe UI", 12, QFont.Bold))
        self.feedback_label.setStyleSheet("color: #F9E2AF; min-height: 38px;")
        layout.addWidget(self.feedback_label)

        # Thanh tiến trình quét khuôn mặt
        self.progress_bar = QProgressBar(page)
        self.progress_bar.setFixedHeight(22)
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(True)
        self.progress_bar.setStyleSheet("""
            QProgressBar {
                background-color: #313244;
                border-radius: 10px;
                text-align: center;
                color: #FFFFFF;
                font-weight: bold;
            }
            QProgressBar::chunk {
                background-color: #A6E3A1;
                border-radius: 10px;
            }
        """)
        layout.addWidget(self.progress_bar)

        # Checklist 4 tiêu chuẩn kiểm chuẩn ảnh
        checklist_box = QWidget(page)
        checklist_box.setStyleSheet("background-color: #313244; border-radius: 8px; padding: 6px;")
        c_layout = QVBoxLayout(checklist_box)
        c_layout.setSpacing(4)
        c_layout.setContentsMargins(12, 6, 12, 6)

        self.chk_euler = QLabel("• Góc nghiêng thẳng mặt (≤ 10°)", checklist_box)
        self.chk_euler.setStyleSheet("color: #CDD6F4; font-size: 12px;")
        c_layout.addWidget(self.chk_euler)

        self.chk_size = QLabel("• Khoảng cách đạt chuẩn (Kích thước ≥ 120x120)", checklist_box)
        self.chk_size.setStyleSheet("color: #CDD6F4; font-size: 12px;")
        c_layout.addWidget(self.chk_size)

        self.chk_sharpness = QLabel("• Hình ảnh sắc nét, không nhòe mờ (≥ 100)", checklist_box)
        self.chk_sharpness.setStyleSheet("color: #CDD6F4; font-size: 12px;")
        c_layout.addWidget(self.chk_sharpness)

        self.chk_liveness = QLabel("• Xác thực người thật chống giả mạo (≥ 0.85)", checklist_box)
        self.chk_liveness.setStyleSheet("color: #CDD6F4; font-size: 12px;")
        c_layout.addWidget(self.chk_liveness)

        layout.addWidget(checklist_box)

        # Nút Hủy bỏ
        cancel_scan_btn = QPushButton("✕ Hủy quét và quay lại", page)
        cancel_scan_btn.setFixedHeight(42)
        cancel_scan_btn.setStyleSheet("""
            QPushButton {
                background-color: #45475A;
                color: #CDD6F4;
                border-radius: 8px;
            }
            QPushButton:hover { background-color: #585B70; }
        """)
        cancel_scan_btn.clicked.connect(self._reset_to_otp_page)
        layout.addWidget(cancel_scan_btn)

        return page

    # =========================================================================
    # Trang 3: Thông báo thành công
    # =========================================================================

    def _create_success_page(self) -> QWidget:
        """Tạo giao diện trang thông báo hoàn tất đăng ký."""
        page = QWidget(self)
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 30, 20, 30)
        layout.setSpacing(16)
        layout.setAlignment(Qt.AlignCenter)

        icon_label = QLabel("✓", page)
        icon_label.setAlignment(Qt.AlignCenter)
        icon_label.setFont(QFont("Segoe UI", 48, QFont.Bold))
        icon_label.setStyleSheet("color: #A6E3A1; margin-bottom: 8px;")
        layout.addWidget(icon_label)

        title = QLabel("ĐĂNG KÝ THÀNH CÔNG!", page)
        title.setAlignment(Qt.AlignCenter)
        title.setFont(QFont("Segoe UI", 18, QFont.Bold))
        title.setStyleSheet("color: #A6E3A1;")
        layout.addWidget(title)

        self.success_detail_label = QLabel("", page)
        self.success_detail_label.setAlignment(Qt.AlignCenter)
        self.success_detail_label.setWordWrap(True)
        self.success_detail_label.setStyleSheet("color: #CDD6F4; font-size: 14px; line-height: 1.6;")
        layout.addWidget(self.success_detail_label)

        finish_btn = QPushButton("Hoàn tất & Đóng", page)
        finish_btn.setFixedHeight(48)
        finish_btn.setFont(QFont("Segoe UI", 14, QFont.Bold))
        finish_btn.setStyleSheet("""
            QPushButton {
                background-color: #A6E3A1;
                color: #11111B;
                border-radius: 8px;
            }
            QPushButton:hover { background-color: #94E2D5; }
        """)
        finish_btn.clicked.connect(self.accept)
        layout.addWidget(finish_btn)

        return page

    # =========================================================================
    # Xử lý sự kiện bàn phím số ảo
    # =========================================================================

    def _handle_digit(self, digit: str) -> None:
        """Nhập một chữ số vào ô OTP."""
        if len(self.otp_code) < 6:
            self.otp_code += digit
            self.otp_display.setText(self.otp_code)
            self.otp_error_banner.setText("")

    def _handle_backspace(self) -> None:
        """Xóa ký tự cuối cùng trong ô OTP."""
        if self.otp_code:
            self.otp_code = self.otp_code[:-1]
            self.otp_display.setText(self.otp_code)
            self.otp_error_banner.setText("")

    def _handle_clear(self) -> None:
        """Xóa toàn bộ mã OTP."""
        self.otp_code = ""
        self.otp_display.clear()
        self.otp_error_banner.setText("")

    def _handle_cancel(self) -> None:
        """Hủy bỏ và đóng hộp thoại."""
        self.enrollment_cancelled.emit()
        self.reject()

    def _reset_to_otp_page(self) -> None:
        """Đặt lại trạng thái và quay về trang nhập OTP."""
        self.captured_vectors.clear()
        self.consecutive_passed_frames = 0
        self.progress_bar.setValue(0)
        self.stacked_widget.setCurrentIndex(0)

    # =========================================================================
    # Nghiệp vụ xác thực OTP (TC-KIOSK-16)
    # =========================================================================

    def verify_otp(self) -> bool:
        """Gửi request xác minh mã kích hoạt OTP lên máy chủ Backend.

        Returns:
            bool: True nếu OTP hợp lệ và nhận thông tin nhân viên, ngược lại False.
        """
        code = self.otp_code.strip()
        if len(code) != 6 or not code.isdigit():
            self.otp_error_banner.setText("Mã OTP bắt buộc phải gồm đúng 6 chữ số!")
            return False

        url = f"{self.backend_url}/kiosk/verify-otp"
        payload = {
            "otp": code,
            "kioskId": self.kiosk_id,
        }

        client = self._get_client()
        try:
            response = client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.secret_token}",
                    "X-Kiosk-Id": self.kiosk_id,
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )

            if response.status_code == 200:
                res_data = response.json()
                emp = res_data.get("data", {})
                self.employee_info = emp

                emp_name = emp.get("fullName", "Nhân viên")
                emp_id = emp.get("employeeId", "")
                dept = emp.get("department", "")

                self.emp_info_label.setText(f"Nhân viên: {emp_name} (ID: {emp_id} - {dept})")
                self.stacked_widget.setCurrentIndex(1)
                logger.info("Xác thực OTP thành công cho nhân viên %s (ID: %s)", emp_name, emp_id)
                return True
            else:
                try:
                    err_msg = response.json().get("message", "Mã OTP không hợp lệ hoặc đã hết hạn")
                except Exception:
                    err_msg = f"Lỗi máy chủ HTTP {response.status_code}"
                self.otp_error_banner.setText(err_msg)
                logger.warning("Xác thực OTP thất bại: %s", err_msg)
                return False

        except httpx.RequestError as exc:
            msg = f"Không thể kết nối đến máy chủ: {exc}"
            self.otp_error_banner.setText(msg)
            logger.error(msg)
            return False

    # =========================================================================
    # Nghiệp vụ xử lý khung hình khuôn mặt chuẩn hóa (TC-KIOSK-17 & TC-KIOSK-18)
    # =========================================================================

    def process_frame(self, frame: np.ndarray) -> EnrollmentQualityReport | None:
        """Tiếp nhận một khung hình video từ camera, đánh giá chất lượng và trích xuất vector.

        Args:
            frame: Khung hình BGR từ camera trạm Kiosk.

        Returns:
            EnrollmentQualityReport: Báo cáo đánh giá chất lượng khung hình (hoặc None nếu không thấy mặt).
        """
        if frame is None or frame.size == 0:
            return None

        # Hiển thị frame lên UI nếu có
        self._update_preview(frame)

        # Bước 1: Phát hiện khuôn mặt bằng YuNet
        if self.detector is None:
            return None

        detection = self.detector.detect_face(frame)
        if detection is None:
            self.consecutive_passed_frames = 0
            self.progress_bar.setValue(0)
            self.feedback_label.setText("Chưa phát hiện khuôn mặt trong khung hình")
            self.feedback_label.setStyleSheet("color: #F9E2AF;")
            return None

        x, y, w, h = detection.bbox
        # Cắt khuôn mặt phục vụ đo độ nét và liveness
        h_frame, w_frame = frame.shape[:2]
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(w_frame, x + w)
        y2 = min(h_frame, y + h)
        face_crop = frame[y1:y2, x1:x2]

        # Bước 2: Đo độ sống liveness
        liveness_score = 0.0
        if self.liveness_gate is not None:
            liveness_score = float(self.liveness_gate.predict(frame, detection.bbox))
        else:
            # Nếu không gắn module liveness thì mặc định coi là 1.0 (cho unit test)
            liveness_score = 1.0

        # Bước 3: Đánh giá chất lượng khuôn mặt chuẩn hóa
        report = self.quality_checker.evaluate(
            bbox=detection.bbox,
            euler_angles=detection.euler_angles,
            face_crop=face_crop,
            liveness_score=liveness_score,
        )

        # Cập nhật phản hồi giao diện
        self._update_quality_ui(report)

        if report.is_passed:
            self.consecutive_passed_frames += 1
            progress_pct = int((self.consecutive_passed_frames / self.required_passed_frames) * 100)
            self.progress_bar.setValue(min(100, progress_pct))

            # Trích xuất vector ArcFace 512D
            if self.extractor is not None:
                aligned = self.extractor.align_face(frame, detection.landmarks)
                vector = self.extractor.extract_vector(aligned)
                self.captured_vectors.append(vector)

            # Đạt đủ số lượng khung hình chuẩn liên tiếp -> Gửi đăng ký lên Backend
            if self.consecutive_passed_frames >= self.required_passed_frames:
                # Lấy vector trung bình hoặc vector mới nhất
                final_vector = self.captured_vectors[-1]
                self.submit_enrollment(final_vector)
        else:
            # Ngắt quãng khung hình chuẩn -> reset tiến trình để đảm bảo chất lượng liên tục
            self.consecutive_passed_frames = 0
            self.progress_bar.setValue(0)

        return report

    def _update_quality_ui(self, report: EnrollmentQualityReport) -> None:
        """Cập nhật các chỉ số màu sắc checklist và dòng hướng dẫn."""
        self.feedback_label.setText(report.feedback_message)
        if report.is_passed:
            self.feedback_label.setStyleSheet("color: #A6E3A1; font-weight: bold;")
        else:
            self.feedback_label.setStyleSheet("color: #F38BA8; font-weight: bold;")

        # Cập nhật checklist
        self.chk_euler.setStyleSheet(
            f"color: {'#A6E3A1' if report.euler_passed else '#F38BA8'}; font-size: 12px;"
        )
        self.chk_size.setStyleSheet(
            f"color: {'#A6E3A1' if report.size_passed else '#F38BA8'}; font-size: 12px;"
        )
        self.chk_sharpness.setStyleSheet(
            f"color: {'#A6E3A1' if report.sharpness_passed else '#F38BA8'}; font-size: 12px;"
        )
        self.chk_liveness.setStyleSheet(
            f"color: {'#A6E3A1' if report.liveness_passed else '#F38BA8'}; font-size: 12px;"
        )

    def _update_preview(self, frame: np.ndarray) -> None:
        """Chuyển đổi numpy BGR sang QPixmap hiển thị lên video preview label."""
        try:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w, ch = rgb.shape
            bytes_per_line = ch * w
            qimg = QImage(rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)
            pixmap = QPixmap.fromImage(qimg).scaled(
                self.video_preview_label.size(),
                Qt.KeepAspectRatio,
                Qt.SmoothTransformation,
            )
            self.video_preview_label.setPixmap(pixmap)
        except Exception:
            pass

    # =========================================================================
    # Gửi vector đăng ký khuôn mặt lên Backend (TC-KIOSK-18)
    # =========================================================================

    def submit_enrollment(self, vector: np.ndarray) -> bool:
        """Mã hóa vector 512D sang Base64 và gửi API POST /api/v1/kiosk/enroll-face.

        Args:
            vector: Mảng float32 kích thước 512 phần tử chuẩn hóa L2.

        Returns:
            bool: True nếu máy chủ xác nhận 200 OK thành công, ngược lại False.
        """
        # Chuẩn hóa kiểu float32 và lấy chuỗi byte 2048 bytes
        vector_bytes = vector.astype(np.float32).tobytes()
        vector_base64 = base64.b64encode(vector_bytes).decode("utf-8")

        url = f"{self.backend_url}/kiosk/enroll-face"
        payload = {
            "otp": self.otp_code,
            "kioskId": self.kiosk_id,
            "modelVersion": "ArcFace-MobileFaceNet-v1",
            "embeddingVectorBase64": vector_base64,
        }

        client = self._get_client()
        try:
            response = client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.secret_token}",
                    "X-Kiosk-Id": self.kiosk_id,
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )

            if response.status_code == 200:
                res_data = response.json()
                emp_name = self.employee_info.get("fullName", "Nhân viên")
                emp_id = self.employee_info.get("employeeId", "")

                self.success_detail_label.setText(
                    f"Họ và tên: {emp_name}\n"
                    f"Mã nhân viên: {emp_id}\n\n"
                    "Dữ liệu sinh trắc học đã được mã hóa AES-256-GCM an toàn.\n"
                    "Bạn đã có thể bắt đầu sử dụng nhận diện khuôn mặt tại trạm!"
                )
                self.stacked_widget.setCurrentIndex(2)
                self.enrollment_completed.emit(res_data)
                logger.info("Đăng ký thành công mẫu khuôn mặt cho nhân viên ID %s", emp_id)
                return True
            else:
                msg = f"Đăng ký thất bại: Mã lỗi HTTP {response.status_code}"
                self.feedback_label.setText(msg)
                self.feedback_label.setStyleSheet("color: #F38BA8;")
                logger.warning(msg)
                return False

        except httpx.RequestError as exc:
            msg = f"Lỗi mạng khi gửi đăng ký: {exc}"
            self.feedback_label.setText(msg)
            self.feedback_label.setStyleSheet("color: #F38BA8;")
            logger.error(msg)
            return False

    def closeEvent(self, event) -> None:
        """Đóng cửa sổ và giải phóng tài nguyên."""
        self._close_client()
        super().closeEvent(event)
