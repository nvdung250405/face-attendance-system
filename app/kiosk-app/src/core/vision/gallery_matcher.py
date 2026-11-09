"""Module quản lý bộ nhớ đệm ma trận đặc trưng và so khớp Cosine 1:N cục bộ đa mẫu (Multi-Template).

Tài liệu tham chiếu:
- FEAT-ENROLL-001: Multi-Template Storage & Matching Model (docs/features/FEAT-ENROLL-001/spec.md Tasks 9, 10, 11)
- DATA-KSK-002: GalleryMatrix entity & architecture (docs/service-docs/kiosk-app/data/data-specs.md)
- DATA DESIGN: Mục 2 - In-Memory NumPy Gallery Matrix Architecture (docs/service-docs/kiosk-app/data/data-design.md)
- NFR-ENROLL-006: So khớp 1:N Best Score <= 350ms (BLAS <= 0.35ms cho 3,000 templates)
"""

import threading
from typing import Any

import numpy as np

from config.logger import get_logger
from config.settings import settings

logger = get_logger("gallery_matcher")


class GalleryCacheManager:
    """Quản lý ma trận vector khuôn mặt đa mẫu (Multi-Template) trong RAM và so khớp Cosine 1:N tốc độ cao."""

    def __init__(self, default_threshold: float | None = None) -> None:
        """Khởi tạo GalleryCacheManager.

        Args:
            default_threshold: Ngưỡng so khớp Cosine tương đồng tối thiểu (mặc định từ settings: 0.65).
        """
        self.threshold: float = (
            default_threshold
            if default_threshold is not None
            else settings.cosine_similarity_threshold
        )
        self._lock = threading.Lock()
        # Ánh xạ chỉ số dòng với employee_id kiểu int64 (M phần tử)
        self._id_map: np.ndarray = np.empty((0,), dtype=np.int64)
        # Ánh xạ chỉ số dòng với pose_type ('FRONTAL', 'LEFT_TILT', 'RIGHT_TILT') (M phần tử)
        self._pose_map: np.ndarray = np.empty((0,), dtype="<U20")
        # Ma trận RAM kích thước (M, 512) kiểu float32
        self._embeddings_matrix: np.ndarray = np.empty((0, 512), dtype=np.float32)
        # Bảng tra cứu metadata nhân sự: {emp_id: {"name": ..., "code": ..., "dept": ...}}
        self._metadata_registry: dict[int, dict[str, Any]] = {}
        # Số phiên bản của danh mục vector
        self._gallery_version: int = 1
        # Nhãn tư thế của lần so khớp thành công gần nhất
        self._last_matched_pose: str | None = None

    @property
    def gallery_version(self) -> int:
        """Lấy phiên bản hiện tại của bộ đệm Gallery RAM."""
        with self._lock:
            return self._gallery_version

    @property
    def last_matched_pose(self) -> str | None:
        """Lấy nhãn tư thế khuôn mặt ('FRONTAL', 'LEFT_TILT', 'RIGHT_TILT') của kết quả khớp gần nhất."""
        with self._lock:
            return self._last_matched_pose

    def _normalize_vector(self, vec: Any) -> np.ndarray | None:
        """Chuẩn hóa vector 512D về độ dài đơn vị L2 Norm (||u||_2 = 1.0)."""
        if vec is None:
            return None
        try:
            flat_vec = np.asarray(vec, dtype=np.float32).flatten()
        except (ValueError, TypeError):
            return None
        if flat_vec.shape[0] != 512:
            return None
        if not np.all(np.isfinite(flat_vec)):
            return None
        norm = float(np.linalg.norm(flat_vec))
        if norm <= 1e-6 or not np.isfinite(norm):
            return None
        return (flat_vec / norm).astype(np.float32)

    def load_gallery(
        self,
        records: list[tuple[int, np.ndarray]] | list[dict[str, Any]],
        version: int | None = None,
    ) -> int:
        """Tải toàn bộ danh mục nhân sự và vector 512D (đa mẫu hoặc đơn mẫu) vào RAM an toàn đa luồng.

        Hỗ trợ:
        - Tuple (employee_id, vector_512d) hoặc (employee_id, vector_512d, pose_type)
        - Dict chứa "templates": [{"poseType": ..., "vector512": ...}]
        - Dict phẳng với trường "poseType" và "vector512" (từ GET /api/v1/kiosk/gallery)
        - Dict đơn mẫu cũ với trường "vector" hoặc "embedding"

        Args:
            records: Danh sách các bản ghi mẫu khuôn mặt.
            version: Phiên bản danh mục mới từ backend (nếu có).

        Returns:
            int: Số lượng nhân sự duy nhất đã nạp thành công vào bộ nhớ.
        """
        with self._lock:
            if not records:
                self._id_map = np.empty((0,), dtype=np.int64)
                self._pose_map = np.empty((0,), dtype="<U20")
                self._embeddings_matrix = np.empty((0, 512), dtype=np.float32)
                self._metadata_registry.clear()
                self._last_matched_pose = None
                self._gallery_version = version if version is not None else (self._gallery_version + 1)
                logger.info("Đã xóa trắng bộ nhớ đệm Gallery (0 nhân sự).")
                return 0

            ids: list[int] = []
            poses: list[str] = []
            vectors: list[np.ndarray] = []
            metadata_map: dict[int, dict[str, Any]] = {}

            for item in records:
                if isinstance(item, tuple):
                    if len(item) == 2:
                        emp_id, raw_vec = item
                        pose_type = "FRONTAL"
                    elif len(item) >= 3:
                        emp_id, raw_vec, pose_type = item[0], item[1], str(item[2])
                    else:
                        continue

                    norm_vec = self._normalize_vector(raw_vec)
                    if norm_vec is None:
                        continue
                    emp_id_int = int(emp_id)
                    ids.append(emp_id_int)
                    poses.append(pose_type.upper())
                    vectors.append(norm_vec)
                    if emp_id_int not in metadata_map:
                        metadata_map[emp_id_int] = {
                            "name": "",
                            "code": f"NV-{emp_id_int}",
                            "dept": "",
                        }
                    continue

                if not isinstance(item, dict):
                    continue

                raw_id = item.get("employee_id")
                if raw_id is None:
                    raw_id = item.get("employeeId")
                if raw_id is None:
                    raw_id = item.get("id", 0)
                emp_id = int(raw_id)

                meta = item.get("metadata") or {
                    "name": item.get("name") or item.get("fullName", ""),
                    "code": item.get("code") or item.get("employeeCode", f"NV-{emp_id}"),
                    "dept": item.get("dept") or item.get("department", ""),
                }
                metadata_map[emp_id] = meta

                # Kiểm tra cấu trúc đa mẫu "templates"
                templates = item.get("templates")
                if templates and isinstance(templates, list):
                    for tmpl in templates:
                        if not isinstance(tmpl, dict):
                            continue
                        t_vec = tmpl.get("vector512")
                        if t_vec is None:
                            t_vec = tmpl.get("vector")
                        if t_vec is None:
                            t_vec = tmpl.get("embedding")
                        norm_vec = self._normalize_vector(t_vec)
                        if norm_vec is None:
                            continue
                        p_type = str(tmpl.get("poseType") or tmpl.get("pose_type") or "FRONTAL").upper()
                        ids.append(emp_id)
                        poses.append(p_type)
                        vectors.append(norm_vec)
                    continue

                # Cấu trúc vector đơn hoặc bản ghi phẳng (GalleryItem)
                raw_vec = item.get("vector512")
                if raw_vec is None:
                    raw_vec = item.get("vector")
                if raw_vec is None:
                    raw_vec = item.get("embedding")

                norm_vec = self._normalize_vector(raw_vec)
                if norm_vec is None:
                    continue

                p_type = str(item.get("poseType") or item.get("pose_type") or "FRONTAL").upper()
                ids.append(emp_id)
                poses.append(p_type)
                vectors.append(norm_vec)

            if vectors:
                self._embeddings_matrix = np.ascontiguousarray(
                    np.vstack(vectors), dtype=np.float32
                )
                self._id_map = np.array(ids, dtype=np.int64)
                self._pose_map = np.array(poses, dtype="<U20")
                valid_ids = set(ids)
                self._metadata_registry = {
                    k: v for k, v in metadata_map.items() if k in valid_ids
                }
            else:
                self._embeddings_matrix = np.empty((0, 512), dtype=np.float32)
                self._id_map = np.empty((0,), dtype=np.int64)
                self._pose_map = np.empty((0,), dtype="<U20")
                self._metadata_registry.clear()

            self._last_matched_pose = None
            if version is not None:
                self._gallery_version = version
            else:
                self._gallery_version += 1

            emp_count = len(self._metadata_registry) if self._metadata_registry else (
                len(np.unique(self._id_map)) if len(self._id_map) > 0 else 0
            )
            template_count = len(self._id_map)
            mem_mb = self._embeddings_matrix.nbytes / (1024 * 1024)
            logger.info(
                "Đã nạp thành công Gallery RAM: %d nhân viên (%d templates, Bộ nhớ: %.2f MB, version=%d)",
                emp_count,
                template_count,
                mem_mb,
                self._gallery_version,
            )
            return emp_count

    def match(
        self,
        query_vector: np.ndarray,
        threshold: float | None = None,
    ) -> tuple[int | None, float]:
        """Thực hiện so khớp Cosine 1:N đa mẫu tìm Best Score = max(sim_front, sim_left, sim_right).

        Tuân thủ FEAT-ENROLL-001 & TST-KSK-DAT-003: Phép tính hoàn tất < 0.35ms cho 3,000 templates.

        Args:
            query_vector: Vector 512D khuôn mặt quét được từ camera.
            threshold: Ngưỡng chấp nhận (nếu None thì lấy ngưỡng mặc định: 0.65).

        Returns:
            tuple[int | None, float]: (employee_id, best_score) nếu >= threshold,
                                      ngược lại (None, best_score).
        """
        emp_id, score, _ = self.match_with_pose(query_vector, threshold=threshold)
        return (emp_id, score)

    def match_with_pose(
        self,
        query_vector: np.ndarray,
        threshold: float | None = None,
    ) -> tuple[int | None, float, str | None]:
        """Thực hiện so khớp Cosine 1:N trả về kèm nhãn tư thế khớp tốt nhất.

        Args:
            query_vector: Vector 512D khuôn mặt quét được từ camera.
            threshold: Ngưỡng chấp nhận.

        Returns:
            tuple[int | None, float, str | None]: (employee_id, best_score, matched_pose_type)
        """
        match_thresh = threshold if threshold is not None else self.threshold

        with self._lock:
            if len(self._id_map) == 0 or self._embeddings_matrix.shape[0] == 0:
                self._last_matched_pose = None
                return (None, 0.0, None)

            q = self._normalize_vector(query_vector)
            if q is None:
                self._last_matched_pose = None
                return (None, 0.0, None)

            # Tích vô hướng vector hóa song song qua BLAS: (M, 512) x (512,) -> (M,)
            scores = np.dot(self._embeddings_matrix, q)
            best_idx = int(np.argmax(scores))
            best_score = float(scores[best_idx])
            matched_pose = str(self._pose_map[best_idx]) if len(self._pose_map) > best_idx else "FRONTAL"

            if not np.isfinite(best_score):
                self._last_matched_pose = None
                return (None, 0.0, None)

            if best_score >= match_thresh:
                matched_emp_id = int(self._id_map[best_idx])
                self._last_matched_pose = matched_pose
                return (matched_emp_id, best_score, matched_pose)

            self._last_matched_pose = None
            return (None, best_score, None)

    def add_or_update(
        self,
        employee_id: int,
        vector: np.ndarray | None = None,
        pose_type: str | dict[str, Any] = "FRONTAL",
        metadata: dict[str, Any] | None = None,
        templates: list[dict[str, Any]] | None = None,
    ) -> None:
        """Cơ chế nạp nóng từng mẫu khuôn mặt (hỗ trợ chỉ định tư thế và tương thích ngược).

        Args:
            employee_id: Mã định danh nhân viên.
            vector: Vector đặc trưng 512D mới (hoặc list templates).
            pose_type: Nhãn tư thế ('FRONTAL', 'LEFT_TILT', 'RIGHT_TILT') hoặc dict metadata nếu gọi kiểu cũ.
            metadata: Thông tin hồ sơ đệm ({code, name, dept}).
            templates: Danh sách các template nếu truyền qua tham số này.
        """
        # Hỗ trợ truyền templates qua keyword argument
        if templates is not None:
            self.add_or_update_employee(employee_id, templates, metadata=metadata)
            return

        # Hỗ trợ truyền templates qua tham số vector
        if isinstance(vector, (list, tuple)) and len(vector) > 0 and isinstance(vector[0], dict):
            self.add_or_update_employee(employee_id, templates=vector, metadata=metadata)
            return

        v = self._normalize_vector(vector)
        if v is None:
            raise ValueError("Vector không đúng định dạng 512D")

        # Xử lý trường hợp tham số vị trí thứ 3 là metadata (tương thích ngược)
        if isinstance(pose_type, dict) and metadata is None:
            metadata = pose_type
            actual_pose = "FRONTAL"
        else:
            actual_pose = str(pose_type).upper() if pose_type else "FRONTAL"

        with self._lock:
            idx = np.where((self._id_map == employee_id) & (self._pose_map == actual_pose))[0]
            if len(idx) > 0:
                self._embeddings_matrix[idx[0]] = v
                logger.info(
                    "Cập nhật vector khuôn mặt [%s] cho nhân viên ID: %d",
                    actual_pose,
                    employee_id,
                )
            else:
                if self._embeddings_matrix.shape[0] == 0:
                    self._embeddings_matrix = np.ascontiguousarray(
                        v.reshape(1, 512), dtype=np.float32
                    )
                    self._id_map = np.array([employee_id], dtype=np.int64)
                    self._pose_map = np.array([actual_pose], dtype="<U20")
                else:
                    self._embeddings_matrix = np.ascontiguousarray(
                        np.vstack([self._embeddings_matrix, v.reshape(1, 512)]),
                        dtype=np.float32,
                    )
                    self._id_map = np.append(self._id_map, employee_id)
                    self._pose_map = np.append(self._pose_map, actual_pose)
                logger.info(
                    "Thêm mới vector [%s] nhân viên ID: %d vào Gallery RAM",
                    actual_pose,
                    employee_id,
                )

            if metadata is not None:
                self._metadata_registry[employee_id] = metadata
            elif employee_id not in self._metadata_registry:
                self._metadata_registry[employee_id] = {
                    "name": "",
                    "code": f"NV-{employee_id}",
                    "dept": "",
                }

            self._gallery_version += 1

    def add_or_update_employee(
        self,
        employee_id: int,
        templates: list[dict[str, Any]] | np.ndarray,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Nạp nóng toàn bộ bộ mẫu đa tư thế hoặc vector đơn cho nhân viên.

        Args:
            employee_id: Mã định danh nhân viên.
            templates: Danh sách mẫu [{"poseType": ..., "vector512": ...}] hoặc vector NumPy đơn.
            metadata: Thông tin hồ sơ đệm.
        """
        if isinstance(templates, (list, tuple)):
            if len(templates) == 0:
                raise ValueError("Vector không đúng định dạng 512D")

            if isinstance(templates[0], dict):
                # Tiền kiểm tra và chuẩn hóa toàn bộ templates trước khi thay đổi trạng thái RAM
                new_vecs: list[np.ndarray] = []
                new_ids: list[int] = []
                new_poses: list[str] = []
                for tmpl in templates:
                    if not isinstance(tmpl, dict):
                        continue
                    t_vec = tmpl.get("vector512")
                    if t_vec is None:
                        t_vec = tmpl.get("vector")
                    if t_vec is None:
                        t_vec = tmpl.get("embedding")
                    norm_vec = self._normalize_vector(t_vec)
                    if norm_vec is None:
                        continue
                    p_type = str(tmpl.get("poseType") or tmpl.get("pose_type") or "FRONTAL").upper()
                    new_vecs.append(norm_vec)
                    new_ids.append(employee_id)
                    new_poses.append(p_type)

                if not new_vecs:
                    raise ValueError("Vector không đúng định dạng 512D")

                with self._lock:
                    # Xóa sạch các mẫu cũ của nhân viên này CHỈ KHI đã xác thực có mẫu mới hợp lệ
                    old_idx = np.where(self._id_map == employee_id)[0]
                    if len(old_idx) > 0:
                        self._embeddings_matrix = np.ascontiguousarray(
                            np.delete(self._embeddings_matrix, old_idx, axis=0),
                            dtype=np.float32,
                        )
                        self._id_map = np.delete(self._id_map, old_idx)
                        self._pose_map = np.delete(self._pose_map, old_idx)

                    if self._embeddings_matrix.shape[0] == 0:
                        self._embeddings_matrix = np.ascontiguousarray(
                            np.vstack(new_vecs), dtype=np.float32
                        )
                        self._id_map = np.array(new_ids, dtype=np.int64)
                        self._pose_map = np.array(new_poses, dtype="<U20")
                    else:
                        self._embeddings_matrix = np.ascontiguousarray(
                            np.vstack([self._embeddings_matrix, np.vstack(new_vecs)]),
                            dtype=np.float32,
                        )
                        self._id_map = np.concatenate([self._id_map, np.array(new_ids, dtype=np.int64)])
                        self._pose_map = np.concatenate([self._pose_map, np.array(new_poses, dtype="<U20")])

                    if metadata is not None:
                        self._metadata_registry[employee_id] = metadata
                    elif employee_id not in self._metadata_registry:
                        self._metadata_registry[employee_id] = {
                            "name": "",
                            "code": f"NV-{employee_id}",
                            "dept": "",
                        }

                    self._gallery_version += 1
                    logger.info(
                        "Đã nạp nóng bộ đa mẫu (%d templates) cho nhân viên ID: %d [version=%d]",
                        len(new_vecs),
                        employee_id,
                        self._gallery_version,
                    )
                return

        self.add_or_update(employee_id, vector=templates, metadata=metadata)

    def remove(self, employee_id: int) -> bool:
        """Xóa toàn bộ các mẫu (mọi tư thế) của nhân sự khỏi bộ đệm RAM.

        Args:
            employee_id: Mã định danh nhân viên cần xóa.

        Returns:
            bool: True nếu tìm thấy và xóa thành công, False nếu không tồn tại.
        """
        with self._lock:
            idx = np.where(self._id_map == employee_id)[0]
            had_metadata = employee_id in self._metadata_registry
            if len(idx) == 0 and not had_metadata:
                return False

            if len(idx) > 0:
                self._embeddings_matrix = np.ascontiguousarray(
                    np.delete(self._embeddings_matrix, idx, axis=0),
                    dtype=np.float32,
                )
                self._id_map = np.delete(self._id_map, idx)
                self._pose_map = np.delete(self._pose_map, idx)

            self._metadata_registry.pop(employee_id, None)
            self._gallery_version += 1
            logger.info(
                "Đã xóa %d templates của nhân viên ID: %d khỏi Gallery RAM (version=%d)",
                len(idx),
                employee_id,
                self._gallery_version,
            )
            return True

    def remove_employee(self, employee_id: int) -> bool:
        """Bí danh tương thích cho remove."""
        return self.remove(employee_id)

    def get_metadata(self, employee_id: int) -> dict[str, Any] | None:
        """Tra cứu thông tin nhân sự nhanh từ hashmap metadata_registry."""
        with self._lock:
            return self._metadata_registry.get(employee_id)

    def get_count(self) -> int:
        """Lấy tổng số lượng nhân viên duy nhất hiện có trong bộ nhớ RAM."""
        with self._lock:
            if self._metadata_registry:
                return len(self._metadata_registry)
            return len(np.unique(self._id_map)) if len(self._id_map) > 0 else 0

    def get_template_count(self) -> int:
        """Lấy tổng số lượng template vector hiện có trong bộ nhớ RAM."""
        with self._lock:
            return len(self._id_map)

    def get_all_ids(self) -> list[int]:
        """Lấy danh sách tất cả employee_id duy nhất trong danh mục."""
        with self._lock:
            if self._metadata_registry:
                return [int(x) for x in self._metadata_registry.keys()]
            return [int(x) for x in np.unique(self._id_map)]

