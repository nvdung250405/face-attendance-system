"""Kiểm thử Ma trận Co giãn Tỷ lệ (Responsive & Proportional Scaling Matrix).

Mục tiêu:
- Kiểm tra tính bất biến của công thức scaleRatio: S = min(W / 1080, H / 1920).
- Đảm bảo tỷ lệ khung hình 9:16 không bao giờ bị méo mó (skewed/stretched) trên các độ phân giải:
  1. Full HD Portrait: 1080 x 1920 (S = 1.0)
  2. HD Portrait: 720 x 1280 (S = 0.6667)
  3. 4K UHD Portrait: 2160 x 3840 (S = 2.0)
  4. Non-standard Landscape: 1920 x 1080 (S = 0.5625, có viền đen Bezel đối xứng 2 bên)
  5. Ultrawide: 2560 x 1080 (S = 0.5625)
  6. Square: 1024 x 1024 (S = 0.5333)
  7. Compact Kiosk: 360 x 640 (S = 0.3333)
  8. Laptop Display: 1366 x 768 (S = 0.4000)
- Xác minh ngân sách chiều cao (Layout Budget) cho Header, Viewport, Action Dock.
- Kiểm tra kích thước vùng cảm ứng (Touch Target Size) tuân thủ tiêu chuẩn Kiosk.
"""

import pytest

# Các hằng số hình học từ Theme.qml
OUTER_WIDTH = 1080.0
OUTER_HEIGHT = 1920.0
CANVAS_WIDTH = 1016.0
CANVAS_HEIGHT = 1856.0
HEADER_HEIGHT = 120.0
VIEWPORT_HEIGHT = 1496.0
ACTION_DOCK_HEIGHT = 144.0
CANVAS_PADDING = 24.0
CANVAS_SPACING = 24.0
OVAL_WIDTH = 470.0
OVAL_HEIGHT = 604.0
ACTION_BTN_WIDTH = 301.3
ACTION_BTN_HEIGHT = 112.0
PIN_KEY_WIDTH = 140.0
PIN_KEY_HEIGHT = 88.0

SCALING_MATRIX = [
    # (name, width, height, expected_scale, orientation)
    ("FHD_Portrait", 1080, 1920, 1.0000, "PORTRAIT_PERFECT"),
    ("HD_Portrait", 720, 1280, 720.0 / 1080.0, "PORTRAIT_PERFECT"),
    ("4K_Portrait", 2160, 3840, 2.0000, "PORTRAIT_PERFECT"),
    ("FHD_Landscape", 1920, 1080, 1080.0 / 1920.0, "LANDSCAPE_PILLARBOX"),
    ("Ultrawide_Landscape", 2560, 1080, 1080.0 / 1920.0, "LANDSCAPE_PILLARBOX"),
    ("Square_Display", 1024, 1024, 1024.0 / 1920.0, "SQUARE_PILLARBOX"),
    ("Compact_Portrait", 360, 640, 360.0 / 1080.0, "PORTRAIT_PERFECT"),
    ("Laptop_Display", 1366, 768, 768.0 / 1920.0, "LANDSCAPE_PILLARBOX"),
]


def calculate_scale_ratio(w: float, h: float) -> float:
    """Công thức tính tỷ lệ co giãn bất biến S = min(W / 1080, H / 1920)."""
    return min(w / OUTER_WIDTH, h / OUTER_HEIGHT)


def calculate_content_geometry(window_w: float, window_h: float):
    """Tính toán kích thước Canvas thực tế và viền đối xứng."""
    scale = calculate_scale_ratio(window_w, window_h)
    content_w = OUTER_WIDTH * scale
    content_h = OUTER_HEIGHT * scale
    pillarbox_x = (window_w - content_w) / 2.0
    pillarbox_y = (window_h - content_h) / 2.0
    return scale, content_w, content_h, pillarbox_x, pillarbox_y


@pytest.mark.parametrize("name,width,height,expected_scale,mode", SCALING_MATRIX)
def test_scaling_ratio_invariance(name: str, width: int, height: int, expected_scale: float, mode: str):
    """Xác minh hệ số scaleRatio tính toán chính xác trên toàn bộ ma trận độ phân giải."""
    scale, content_w, content_h, px, py = calculate_content_geometry(width, height)

    assert abs(scale - expected_scale) < 1e-4, f"[{name}] Sai lệch tỷ lệ scale: {scale} != {expected_scale}"
    assert content_w <= width + 1e-3, f"[{name}] Nội dung bị tràn viền ngang: {content_w} > {width}"
    assert content_h <= height + 1e-3, f"[{name}] Nội dung bị tràn viền dọc: {content_h} > {height}"

    aspect_ratio = content_w / content_h
    expected_ratio = 1080.0 / 1920.0
    assert abs(aspect_ratio - expected_ratio) < 1e-4, f"[{name}] Tỷ lệ 9:16 bị biến dạng! Aspect ratio: {aspect_ratio}"

    if mode == "PORTRAIT_PERFECT":
        assert px >= 0 and py >= 0
    elif mode == "LANDSCAPE_PILLARBOX":
        assert px > 0, f"[{name}] Chế độ màn hình ngang phải có viền đen pillarbox hai bên"
        assert abs(py) < 1e-3, f"[{name}] Viền trên dưới phải khớp sát màn hình"


def test_vertical_layout_budget():
    """Xác minh ngân sách chiều cao các thành phần nòng cốt khớp chính xác 100% Canvas."""
    subtotal = (
        CANVAS_PADDING * 2
        + HEADER_HEIGHT
        + CANVAS_SPACING
        + VIEWPORT_HEIGHT
        + CANVAS_SPACING
        + ACTION_DOCK_HEIGHT
    )
    assert subtotal == CANVAS_HEIGHT, f"Ngân sách chiều cao lệch: {subtotal} != {CANVAS_HEIGHT}"


def test_touch_target_size_budget():
    """Kiểm tra kích thước vùng cảm ứng (Touch Target Size) tuân thủ chuẩn Kiosk."""
    # Phím PIN ảo: Kích thước tối thiểu 100x70px
    assert PIN_KEY_WIDTH >= 100.0, f"Phím PIN quá hẹp: {PIN_KEY_WIDTH}px"
    assert PIN_KEY_HEIGHT >= 70.0, f"Phím PIN quá thấp: {PIN_KEY_HEIGHT}px"

    # Nút Hành động đáy (F1, F2): Chiều cao tối thiểu 90px
    assert ACTION_BTN_HEIGHT >= 90.0, f"Nút Action Dock quá thấp: {ACTION_BTN_HEIGHT}px"
    assert ACTION_BTN_WIDTH >= 250.0, f"Nút Action Dock quá hẹp: {ACTION_BTN_WIDTH}px"
