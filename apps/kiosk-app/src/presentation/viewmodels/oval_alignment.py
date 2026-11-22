"""Định nghĩa trạng thái viền Oval và thuật toán căn chỉnh khuôn mặt trong khung Oval Kiosk."""

from enum import StrEnum


class OvalState(StrEnum):
    """Máy trạng thái 4 màu viền Oval sinh trắc học."""

    IDLE = "IDLE"  # Xám: Chờ người dùng
    ALIGNING = "ALIGNING"  # Vàng: Đang phát hiện & căn chỉnh
    SUCCESS = "SUCCESS"  # Xanh lá: Nhận diện thành công
    ERROR = "ERROR"  # Đỏ: Spoofing hoặc lỗi


def evaluate_face_oval_alignment(
    frame_shape: tuple[int, ...],
    bbox: tuple[int, int, int, int],
) -> tuple[bool, str]:
    """Kiểm tra khuôn mặt có nằm chuẩn xác trong khung Oval trên màn hình Kiosk dọc hay không.

    Quy tắc hiển thị:
    - Màn hình Kiosk hiển thị camera theo tỷ lệ dọc 968 / 1496 (PreserveAspectCrop).
    - Tâm Oval nằm ở (chiều rộng / 2, chiều cao * 0.40).
    - Kích thước Oval tương ứng 470 x 604 px trên màn hình 968 x 1496 px.

    Trả về:
        (is_aligned, message_feedback)
    """
    fh, fw = frame_shape[:2]
    bx, by, bw, bh = bbox
    cx = bx + bw / 2.0
    cy = by + bh / 2.0

    # 1. Tỷ lệ viewport dọc của Kiosk (968 / 1496)
    aspect_vp = 968.0 / 1496.0
    visible_w = fh * aspect_vp
    if visible_w > fw:
        visible_w = float(fw)

    # 2. Tọa độ tâm và bán trục Oval trên khung hình camera gốc
    oval_cx = fw / 2.0
    oval_cy = fh * 0.40

    rx = (visible_w * (470.0 / 968.0)) / 2.0  # Bán trục ngang
    ry = (fh * (604.0 / 1496.0)) / 2.0  # Bán trục dọc

    # 3. Kiểm tra kích thước khuôn mặt (khoảng cách chuẩn 0.5m – 1.2m)
    # Khuôn mặt hợp lệ chiếm khoảng 35% đến 85% chiều cao Oval (2 * ry)
    min_face_h = (2.0 * ry) * 0.35
    max_face_h = (2.0 * ry) * 0.85

    if bh < min_face_h or bw < min_face_h * 0.65:
        return False, "Vui lòng đứng lại gần camera hơn"

    if bh > max_face_h or bw > max_face_h * 0.90:
        return False, "Vui lòng lùi ra xa camera một chút"

    # 4. Kiểm tra tâm khuôn mặt có nằm bên trong hình Oval (dung sai 20% biên)
    dx = (cx - oval_cx) / (rx * 1.20)
    dy = (cy - oval_cy) / (ry * 1.20)
    distance_sq = dx * dx + dy * dy

    if distance_sq > 1.0:
        if dx < -0.4:
            return False, "Vui lòng di chuyển sang phải vào giữa khung Oval"
        elif dx > 0.4:
            return False, "Vui lòng di chuyển sang trái vào giữa khung Oval"
        elif dy < -0.4:
            return False, "Vui lòng hạ tầm mắt vào giữa khung Oval"
        elif dy > 0.4:
            return False, "Vui lòng nâng tầm mắt vào giữa khung Oval"
        return False, "Vui lòng đưa khuôn mặt vào giữa khung Oval"

    return True, "Khuôn mặt đã ở vị trí chuẩn xác"
