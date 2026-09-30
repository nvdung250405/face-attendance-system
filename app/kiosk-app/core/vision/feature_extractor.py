"""Module căn chỉnh khuôn mặt và trích xuất vector đặc trưng 512D ArcFace.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-01 - ArcFaceFeatureExtractor)
- DDS.md (Mục 3.2 - Bước 4: Trích xuất vector đặc trưng 512D)
"""

from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

from config.logger import get_logger
from config.settings import settings

logger = get_logger("feature_extractor")

# Tọa độ 5 điểm mốc chuẩn hóa không gian 112x112 theo chuẩn công nghiệp InsightFace
REFERENCE_FACIAL_POINTS = np.array(
    [
        [38.2946, 51.6963],  # Mắt phải (Right eye)
        [73.5318, 51.5014],  # Mắt trái (Left eye)
        [56.0252, 71.7366],  # Đỉnh mũi (Nose tip)
        [41.5493, 92.3655],  # Khóe miệng phải (Right mouth corner)
        [70.7299, 92.2041],  # Khóe miệng trái (Left mouth corner)
    ],
    dtype=np.float32,
)


class ArcFaceFeatureExtractor:
    """Bộ trích xuất vector 512D sử dụng mô hình mạng ArcFace MobileFaceNet ONNX."""

    def __init__(
        self,
        model_path: Path | None = None,
        num_threads: int = 4,
    ) -> None:
        """Khởi tạo ArcFaceFeatureExtractor.

        Args:
            model_path: Đường dẫn tệp trọng số ONNX của ArcFace.
            num_threads: Số luồng CPU sử dụng cho ONNX Runtime.
        """
        self.model_path: Path = model_path or settings.arcface_model_path
        self.num_threads: int = num_threads

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Không tìm thấy tệp trọng số ArcFace tại {self.model_path}. "
                "Vui lòng chạy 'python scripts/download_models.py' để nạp mô hình."
            )

        # Cấu hình ONNX Runtime Session tối ưu CPU
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = self.num_threads
        sess_options.inter_op_num_threads = 1
        sess_options.graph_optimization_level = (
            ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        )

        self._session = ort.InferenceSession(
            str(self.model_path),
            sess_options=sess_options,
            providers=["CPUExecutionProvider"],
        )

        self._input_name: str = self._session.get_inputs()[0].name
        self._output_name: str = self._session.get_outputs()[0].name

        logger.info(
            "ArcFaceFeatureExtractor đã sẵn sàng [model=%s, input=%s, output=%s]",
            self.model_path.name,
            self._input_name,
            self._output_name,
        )

    def align_face(
        self,
        frame: np.ndarray,
        landmarks: np.ndarray,
        output_size: tuple[int, int] = (112, 112),
    ) -> np.ndarray:
        """Thực hiện căn chỉnh Affine 2D dựa trên 5 điểm mốc để đưa mặt về chuẩn 112x112.

        Args:
            frame: Khung hình gốc chứa khuôn mặt (BGR numpy array).
            landmarks: Mảng tọa độ (5, 2) 5 điểm mốc khuôn mặt.
            output_size: Kích thước đầu ra chuẩn (mặc định 112x112).

        Returns:
            np.ndarray: Ảnh khuôn mặt sau khi căn chỉnh chuẩn hóa (112, 112, 3).
        """
        if frame is None or landmarks is None:
            return np.zeros((output_size[1], output_size[0], 3), dtype=np.uint8)

        src_pts = landmarks.astype(np.float32)
        dst_pts = REFERENCE_FACIAL_POINTS

        # Ước lượng ma trận biến đổi affine tương đồng (Similarity Transform)
        transform_matrix, _ = cv2.estimateAffinePartial2D(src_pts, dst_pts)

        if transform_matrix is None:
            # Fallback nếu ma trận suy biến: cắt crop bounding box đơn giản
            min_x = max(0, int(np.min(src_pts[:, 0])))
            min_y = max(0, int(np.min(src_pts[:, 1])))
            max_x = min(frame.shape[1], int(np.max(src_pts[:, 0])))
            max_y = min(frame.shape[0], int(np.max(src_pts[:, 1])))
            crop = frame[min_y:max_y, min_x:max_x]
            if crop.size > 0:
                return cv2.resize(crop, output_size, interpolation=cv2.INTER_LINEAR)
            return cv2.resize(frame, output_size, interpolation=cv2.INTER_LINEAR)

        # Áp dụng phép biến đổi Affine đưa khuôn mặt về chuẩn hóa
        aligned = cv2.warpAffine(
            frame,
            transform_matrix,
            output_size,
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(0, 0, 0),
        )
        return aligned

    def extract(self, aligned_face: np.ndarray) -> np.ndarray:
        """Trích xuất vector đặc trưng 512D chuẩn hóa L2 Norm từ khuôn mặt đã căn chỉnh.

        Args:
            aligned_face: Ảnh mặt đã căn chỉnh chuẩn 112x112 (BGR uint8).

        Returns:
            np.ndarray: Vector đặc trưng 512 chiều kiểu float32 có độ dài ||v|| = 1.0.
        """
        if aligned_face is None or aligned_face.size == 0:
            return np.zeros(512, dtype=np.float32)

        # Đảm bảo đúng kích thước 112x112
        if aligned_face.shape[:2] != (112, 112):
            aligned_face = cv2.resize(
                aligned_face, (112, 112), interpolation=cv2.INTER_LINEAR
            )

        # Chuyển đổi không gian màu BGR sang RGB
        rgb_face = cv2.cvtColor(aligned_face, cv2.COLOR_BGR2RGB)

        # Chuẩn hóa giá trị điểm ảnh [-1.0, 1.0]
        normalized = (rgb_face.astype(np.float32) - 127.5) / 128.0

        # Chuyển đổi định dạng HWC sang CHW và bổ sung chiều batch: (1, 3, 112, 112)
        blob = np.transpose(normalized, (2, 0, 1))
        blob = np.expand_dims(blob, axis=0)

        # Suy luận qua ONNX Runtime
        outputs = self._session.run([self._output_name], {self._input_name: blob})
        raw_embedding = outputs[0].flatten().astype(np.float32)

        # Chuẩn hóa L2 Norm: ||v|| = 1.0 phục vụ tính tích vô hướng Cosine trực tiếp
        norm = float(np.linalg.norm(raw_embedding))
        if norm > 1e-6:
            unit_embedding = raw_embedding / norm
        else:
            unit_embedding = raw_embedding

        return unit_embedding

    def extract_vector(self, aligned_face: np.ndarray) -> np.ndarray:
        """Trích xuất vector đặc trưng 512D chuẩn hóa L2 Norm từ khuôn mặt đã căn chỉnh.

        Bí danh (alias) tương thích với pipeline kiosk_view_model và enrollment_controller.

        Args:
            aligned_face: Ảnh mặt đã căn chỉnh chuẩn 112x112 (BGR uint8).

        Returns:
            np.ndarray: Vector đặc trưng 512 chiều kiểu float32 có độ dài ||v|| = 1.0.
        """
        return self.extract(aligned_face)
