"""Module quản lý bộ nhớ đệm ma trận đặc trưng và so khớp Cosine 1:N cục bộ.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-01 - GalleryCacheManager)
- DDS.md (Mục 3.2 - Bước 5: So khớp đặc trưng 1:N với ma trận RAM)
"""


import numpy as np

from config.logger import get_logger
from config.settings import settings

logger = get_logger("gallery_matcher")


class GalleryCacheManager:
    """Quản lý ma trận vector khuôn mặt trong RAM và thực hiện so khớp Cosine 1:N tốc độ cao."""

    def __init__(self, default_threshold: float | None = None) -> None:
        """Khởi tạo GalleryCacheManager.

        Args:
            default_threshold: Ngưỡng so khớp Cosine tương đồng tối thiểu (mặc định từ settings: 0.50).
        """
        self.threshold: float = (
            default_threshold
            if default_threshold is not None
            else settings.cosine_similarity_threshold
        )
        self._employee_ids: list[int] = []
        # Ma trận RAM kích thước (N, 512) kiểu float32
        self._embeddings_matrix: np.ndarray = np.empty((0, 512), dtype=np.float32)

    def load_gallery(self, records: list[tuple[int, np.ndarray]]) -> int:
        """Tải toàn bộ danh mục nhân sự và vector 512D vào RAM.

        Args:
            records: Danh sách các cặp (employee_id, embedding_512d).

        Returns:
            int: Số lượng nhân sự đã nạp thành công vào bộ nhớ.
        """
        if not records:
            self._employee_ids = []
            self._embeddings_matrix = np.empty((0, 512), dtype=np.float32)
            logger.info("Đã xóa trắng bộ nhớ đệm Gallery (0 nhân sự).")
            return 0

        ids: list[int] = []
        vectors: list[np.ndarray] = []

        for emp_id, vec in records:
            flat_vec = np.asarray(vec, dtype=np.float32).flatten()
            if flat_vec.shape[0] != 512:
                logger.warning(
                    "Bỏ qua nhân viên %d: Vector đặc trưng không đúng 512 chiều (%dD)",
                    emp_id,
                    flat_vec.shape[0],
                )
                continue

            # Đảm bảo vector chuẩn hóa độ dài đơn vị L2 Norm
            norm = float(np.linalg.norm(flat_vec))
            if norm > 1e-6:
                flat_vec = flat_vec / norm

            ids.append(emp_id)
            vectors.append(flat_vec)

        self._employee_ids = ids
        if vectors:
            self._embeddings_matrix = np.ascontiguousarray(
                np.vstack(vectors), dtype=np.float32
            )
        else:
            self._embeddings_matrix = np.empty((0, 512), dtype=np.float32)

        count = len(self._employee_ids)
        mem_mb = self._embeddings_matrix.nbytes / (1024 * 1024)
        logger.info(
            "Đã nạp thành công Gallery RAM: %d nhân viên (Bộ nhớ ma trận: %.2f MB)",
            count,
            mem_mb,
        )
        return count

    def match(
        self,
        query_vector: np.ndarray,
        threshold: float | None = None,
    ) -> tuple[int | None, float]:
        """Thực hiện so khớp Cosine Similarity 1:N bằng tích vô hướng ma trận NumPy.

        Do toàn bộ vector trong ma trận RAM và query_vector đều đã được chuẩn hóa ||v|| = 1.0,
        tích vô hướng s = M . u chính là hệ số tương đồng Cosine chuẩn xác.

        Args:
            query_vector: Vector 512D khuôn mặt quét được từ camera.
            threshold: Ngưỡng chấp nhận (nếu None thì lấy ngưỡng mặc định).

        Returns:
            tuple[Optional[int], float]: (employee_id, max_score) nếu >= threshold,
                                         ngược lại (None, max_score).
        """
        match_thresh = threshold if threshold is not None else self.threshold

        if len(self._employee_ids) == 0 or self._embeddings_matrix.shape[0] == 0:
            return (None, 0.0)

        q = np.asarray(query_vector, dtype=np.float32).flatten()
        if q.shape[0] != 512:
            return (None, 0.0)

        # Đảm bảo query_vector có L2 Norm = 1.0
        q_norm = float(np.linalg.norm(q))
        if q_norm > 1e-6:
            q = q / q_norm

        # Tính tích vô hướng song song đa luồng qua NumPy BLAS: (N, 512) x (512,) -> (N,)
        scores = np.dot(self._embeddings_matrix, q)

        best_idx = int(np.argmax(scores))
        best_score = float(scores[best_idx])

        if best_score >= match_thresh:
            matched_emp_id = self._employee_ids[best_idx]
            return (matched_emp_id, best_score)

        return (None, best_score)

    def add_or_update(self, employee_id: int, vector: np.ndarray) -> None:
        """Thêm mới hoặc cập nhật vector khuôn mặt của nhân viên vào bộ đệm RAM.

        Args:
            employee_id: Mã định danh nhân viên.
            vector: Vector đặc trưng 512D mới.
        """
        v = np.asarray(vector, dtype=np.float32).flatten()
        if v.shape[0] != 512:
            raise ValueError(f"Vector không đúng định dạng 512D (hiện tại: {v.shape[0]}D)")

        norm = float(np.linalg.norm(v))
        if norm > 1e-6:
            v = v / norm

        if employee_id in self._employee_ids:
            idx = self._employee_ids.index(employee_id)
            self._embeddings_matrix[idx] = v
            logger.info("Cập nhật vector khuôn mặt cho nhân viên ID: %d", employee_id)
        else:
            self._employee_ids.append(employee_id)
            if self._embeddings_matrix.shape[0] == 0:
                self._embeddings_matrix = np.ascontiguousarray(
                    v.reshape(1, 512), dtype=np.float32
                )
            else:
                self._embeddings_matrix = np.ascontiguousarray(
                    np.vstack([self._embeddings_matrix, v.reshape(1, 512)]),
                    dtype=np.float32,
                )
            logger.info("Thêm mới nhân viên ID: %d vào Gallery RAM", employee_id)

    def remove(self, employee_id: int) -> bool:
        """Xóa nhân viên khỏi bộ đệm RAM.

        Args:
            employee_id: Mã định danh nhân viên cần xóa.

        Returns:
            bool: True nếu tìm thấy và xóa thành công, False nếu không tồn tại.
        """
        if employee_id not in self._employee_ids:
            return False

        idx = self._employee_ids.index(employee_id)
        self._employee_ids.pop(idx)
        self._embeddings_matrix = np.delete(self._embeddings_matrix, idx, axis=0)
        logger.info("Đã xóa nhân viên ID: %d khỏi Gallery RAM", employee_id)
        return True

    def get_count(self) -> int:
        """Lấy tổng số lượng nhân viên hiện có trong bộ nhớ RAM."""
        return len(self._employee_ids)
