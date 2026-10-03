"""Module quản lý bộ nhớ đệm ma trận đặc trưng và so khớp Cosine 1:N cục bộ.

Tài liệu tham chiếu:
- DATA-KSK-002: GalleryMatrix entity & architecture (docs/service-docs/kiosk-app/data/data-specs.md)
- DATA DESIGN: Mục 2 - In-Memory NumPy Gallery Matrix Architecture (docs/service-docs/kiosk-app/data/data-design.md)
- DATA BUILD PLAN: DBL-KSK-003 - NumPy RAM Matrix & Thread-safe Hot-Patching (docs/service-docs/kiosk-app/data/data-build-plan.md)
- DATA TEST PLAN: TST-KSK-DAT-003, TST-KSK-DAT-004 (docs/service-docs/kiosk-app/data/data-test-plan.md)
"""

import threading
from typing import Any

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
        self._lock = threading.Lock()
        # Ánh xạ chỉ số dòng với employee_id kiểu int64 (DATA-KSK-002)
        self._id_map: np.ndarray = np.empty((0,), dtype=np.int64)
        # Ma trận RAM kích thước (N, 512) kiểu float32
        self._embeddings_matrix: np.ndarray = np.empty((0, 512), dtype=np.float32)
        # Bảng tra cứu thông tin nhanh metadata_registry: {emp_id: {"name": ..., "code": ..., "dept": ...}}
        self._metadata_registry: dict[int, dict[str, Any]] = {}
        # Số phiên bản của danh mục vector
        self._gallery_version: int = 1

    @property
    def gallery_version(self) -> int:
        """Lấy phiên bản hiện tại của bộ đệm Gallery RAM."""
        with self._lock:
            return self._gallery_version

    def load_gallery(
        self,
        records: list[tuple[int, np.ndarray]] | list[dict[str, Any]],
        version: int | None = None,
    ) -> int:
        """Tải toàn bộ danh mục nhân sự và vector 512D vào RAM an toàn đa luồng.

        Args:
            records: Danh sách các tuple (employee_id, vector_512d) hoặc dict danh mục.
            version: Phiên bản danh mục mới từ backend (nếu có).

        Returns:
            int: Số lượng nhân sự đã nạp thành công vào bộ nhớ.
        """
        with self._lock:
            if not records:
                self._id_map = np.empty((0,), dtype=np.int64)
                self._embeddings_matrix = np.empty((0, 512), dtype=np.float32)
                self._metadata_registry.clear()
                self._gallery_version = version if version is not None else (self._gallery_version + 1)
                logger.info("Đã xóa trắng bộ nhớ đệm Gallery (0 nhân sự).")
                return 0

            ids: list[int] = []
            vectors: list[np.ndarray] = []
            metadata_map: dict[int, dict[str, Any]] = {}

            for item in records:
                if isinstance(item, tuple):
                    emp_id, vec = item
                    meta = {}
                elif isinstance(item, dict):
                    emp_id = int(item.get("employee_id") if item.get("employee_id") is not None else item.get("id", 0))
                    vec = item.get("vector")
                    if vec is None:
                        vec = item.get("embedding")
                    meta = item.get("metadata") or {
                        "name": item.get("name", ""),
                        "code": item.get("code", f"NV-{emp_id}"),
                        "dept": item.get("dept", ""),
                    }
                else:
                    continue

                if vec is None:
                    continue

                flat_vec = np.asarray(vec, dtype=np.float32).flatten()
                if flat_vec.shape[0] != 512:
                    logger.warning(
                        "Bỏ qua nhân viên %d: Vector đặc trưng không đúng 512 chiều (%dD)",
                        emp_id,
                        flat_vec.shape[0],
                    )
                    continue

                # Chuẩn hóa độ dài đơn vị L2 Norm (||u||_2 = 1.0)
                norm = float(np.linalg.norm(flat_vec))
                if norm > 1e-6:
                    flat_vec = flat_vec / norm

                ids.append(emp_id)
                vectors.append(flat_vec)
                metadata_map[emp_id] = meta

            if vectors:
                self._embeddings_matrix = np.ascontiguousarray(
                    np.vstack(vectors), dtype=np.float32
                )
                self._id_map = np.array(ids, dtype=np.int64)
                self._metadata_registry = metadata_map
            else:
                self._embeddings_matrix = np.empty((0, 512), dtype=np.float32)
                self._id_map = np.empty((0,), dtype=np.int64)
                self._metadata_registry.clear()

            if version is not None:
                self._gallery_version = version
            else:
                self._gallery_version += 1

            count = len(self._id_map)
            mem_mb = self._embeddings_matrix.nbytes / (1024 * 1024)
            logger.info(
                "Đã nạp thành công Gallery RAM: %d nhân viên (Bộ nhớ ma trận: %.2f MB, version=%d)",
                count,
                mem_mb,
                self._gallery_version,
            )
            return count

    def match(
        self,
        query_vector: np.ndarray,
        threshold: float | None = None,
    ) -> tuple[int | None, float]:
        """Thực hiện so khớp Cosine Similarity 1:N bằng tích vô hướng ma trận NumPy (s = M . u^T).

        Tuân thủ DATA-KSK-002 & TST-KSK-DAT-003: Phép tính hoàn tất < 2ms cho 1,000 nhân sự.

        Args:
            query_vector: Vector 512D khuôn mặt quét được từ camera.
            threshold: Ngưỡng chấp nhận (nếu None thì lấy ngưỡng mặc định).

        Returns:
            tuple[int | None, float]: (employee_id, max_score) nếu >= threshold,
                                      ngược lại (None, max_score).
        """
        match_thresh = threshold if threshold is not None else self.threshold

        with self._lock:
            if len(self._id_map) == 0 or self._embeddings_matrix.shape[0] == 0:
                return (None, 0.0)

            q = np.asarray(query_vector, dtype=np.float32).flatten()
            if q.shape[0] != 512:
                return (None, 0.0)

            # Chuẩn hóa L2 Norm = 1.0
            q_norm = float(np.linalg.norm(q))
            if q_norm > 1e-6:
                q = q / q_norm

            # Tính tích vô hướng song song vector hóa qua NumPy BLAS: (N, 512) x (512,) -> (N,)
            scores = np.dot(self._embeddings_matrix, q)
            best_idx = int(np.argmax(scores))
            best_score = float(scores[best_idx])

            if best_score >= match_thresh:
                matched_emp_id = int(self._id_map[best_idx])
                return (matched_emp_id, best_score)

            return (None, best_score)

    def add_or_update(
        self,
        employee_id: int,
        vector: np.ndarray,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Cơ chế nạp nóng không khóa dừng (Thread-Safe Hot-Patching) theo chuẩn data-design.md.

        Args:
            employee_id: Mã định danh nhân viên.
            vector: Vector đặc trưng 512D mới.
            metadata: Thông tin hồ sơ đệm ({code, name, dept}).
        """
        v = np.asarray(vector, dtype=np.float32).flatten()
        if v.shape[0] != 512:
            raise ValueError(f"Vector không đúng định dạng 512D (hiện tại: {v.shape[0]}D)")

        norm = float(np.linalg.norm(v))
        if norm > 1e-6:
            v = v / norm

        with self._lock:
            idx = np.where(self._id_map == employee_id)[0]
            if len(idx) > 0:
                self._embeddings_matrix[idx[0]] = v
                logger.info("Cập nhật vector khuôn mặt cho nhân viên ID: %d", employee_id)
            else:
                if self._embeddings_matrix.shape[0] == 0:
                    self._embeddings_matrix = np.ascontiguousarray(
                        v.reshape(1, 512), dtype=np.float32
                    )
                    self._id_map = np.array([employee_id], dtype=np.int64)
                else:
                    self._embeddings_matrix = np.ascontiguousarray(
                        np.vstack([self._embeddings_matrix, v.reshape(1, 512)]),
                        dtype=np.float32,
                    )
                    self._id_map = np.append(self._id_map, employee_id)
                logger.info("Thêm mới nhân viên ID: %d vào Gallery RAM", employee_id)

            if metadata is not None:
                self._metadata_registry[employee_id] = metadata

            self._gallery_version += 1

    def add_or_update_employee(
        self,
        employee_id: int,
        vector: np.ndarray,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Bí danh tương thích cho add_or_update."""
        self.add_or_update(employee_id, vector, metadata=metadata)

    def remove(self, employee_id: int) -> bool:
        """Xóa nhân sự khỏi bộ đệm RAM an toàn theo chuẩn data-design.md Mục 2.3.

        Args:
            employee_id: Mã định danh nhân viên cần xóa.

        Returns:
            bool: True nếu tìm thấy và xóa thành công, False nếu không tồn tại.
        """
        with self._lock:
            idx = np.where(self._id_map == employee_id)[0]
            if len(idx) == 0:
                return False

            self._embeddings_matrix = np.delete(self._embeddings_matrix, idx[0], axis=0)
            self._id_map = np.delete(self._id_map, idx[0])
            self._metadata_registry.pop(employee_id, None)
            self._gallery_version += 1
            logger.info("Đã xóa nhân viên ID: %d khỏi Gallery RAM (version=%d)", employee_id, self._gallery_version)
            return True

    def get_metadata(self, employee_id: int) -> dict[str, Any] | None:
        """Tra cứu thông tin nhân sự nhanh từ hashmap metadata_registry."""
        with self._lock:
            return self._metadata_registry.get(employee_id)

    def get_count(self) -> int:
        """Lấy tổng số lượng nhân viên hiện có trong bộ nhớ RAM."""
        with self._lock:
            return len(self._id_map)

    def get_all_ids(self) -> list[int]:
        """Lấy danh sách tất cả employee_id trong danh mục."""
        with self._lock:
            return [int(x) for x in self._id_map]
