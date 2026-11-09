"""Kiểm thử Ma trận Co giãn Tỷ lệ (Responsive & Proportional Scaling Matrix).

Mục tiêu (Giai đoạn 4):
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
    """Công thức scaleRatio chính thức trong main.qml."""
    return min(w / OUTER_WIDTH, h / OUTER_HEIGHT)


@pytest.mark.parametrize("name, width, height, expected_scale, orientation", SCALING_MATRIX)
def test_scale_ratio_accuracy(name: str, width: int, height: int, expected_scale: float, orientation: str):
    """Xác minh độ chính xác của tỷ lệ co giãn scaleRatio trên từng độ phân giải."""
    scale = calculate_scale_ratio(width, height)
    assert scale == pytest.approx(expected_scale, rel=1e-4), (
        f"Độ phân giải {name} ({width}x{height}) có scale {scale}, kỳ vọng {expected_scale}"
    )


@pytest.mark.parametrize("name, width, height, expected_scale, orientation", SCALING_MATRIX)
def test_canvas_bounds_never_overflow(name: str, width: int, height: int, expected_scale: float, orientation: str):
    """Đảm bảo vùng hiển thị inner container không bao giờ tràn ra ngoài khung cửa sổ."""
    scale = calculate_scale_ratio(width, height)
    inner_w = OUTER_WIDTH * scale
    inner_h = OUTER_HEIGHT * scale

    assert inner_w <= width + 1e-4, f"{name}: Chiều rộng canvas ({inner_w}) vượt quá màn hình ({width})"
    assert inner_h <= height + 1e-4, f"{name}: Chiều cao canvas ({inner_h}) vượt quá màn hình ({height})"


@pytest.mark.parametrize("name, width, height, expected_scale, orientation", SCALING_MATRIX)
def test_aspect_ratio_invariance(name: str, width: int, height: int, expected_scale: float, orientation: str):
    """Đảm bảo tỷ lệ khung hình 9:16 (0.5625) được bảo toàn tuyệt đối không méo mó."""
    scale = calculate_scale_ratio(width, height)
    inner_w = OUTER_WIDTH * scale
    inner_h = OUTER_HEIGHT * scale

    aspect_ratio = inner_w / inner_h
    expected_ratio = 9.0 / 16.0
    assert aspect_ratio == pytest.approx(expected_ratio, rel=1e-5), (
        f"{name}: Tỷ lệ {aspect_ratio} sai lệch so với chuẩn 9:16 ({expected_ratio})"
    )


@pytest.mark.parametrize("name, width, height, expected_scale, orientation", SCALING_MATRIX)
def test_centering_pillarbox_letterbox_offsets(name: str, width: int, height: int, expected_scale: float, orientation: str):
    """Kiểm tra độ cân đối căn giữa (Center-In Parent) và khoảng đệm Bezel đối xứng."""
    scale = calculate_scale_ratio(width, height)
    inner_w = OUTER_WIDTH * scale
    inner_h = OUTER_HEIGHT * scale

    pad_x = (width - inner_w) / 2.0
    pad_y = (height - inner_h) / 2.0

    assert pad_x >= -1e-4, f"{name}: Khoảng đệm ngang âm ({pad_x})"
    assert pad_y >= -1e-4, f"{name}: Khoảng đệm dọc âm ({pad_y})"

    if "LANDSCAPE" in orientation or "SQUARE" in orientation:
        assert pad_x > 0, f"{name}: Cần có viền đen pillarbox đối xứng 2 bên trên màn ngang"
        assert pad_y == pytest.approx(0.0, abs=1e-4), f"{name}: Trục dọc không nên có đệm trên màn ngang"


@pytest.mark.parametrize("name, width, height, expected_scale, orientation", SCALING_MATRIX)
def test_subcomponents_vertical_budget(name: str, width: int, height: int, expected_scale: float, orientation: str):
    """Xác minh ngân sách chiều cao dọc trong Canvas trung tâm bảo toàn 100%."""
    scale = calculate_scale_ratio(width, height)

    s_canvas_h = CANVAS_HEIGHT * scale
    s_header_h = HEADER_HEIGHT * scale
    s_viewport_h = VIEWPORT_HEIGHT * scale
    s_dock_h = ACTION_DOCK_HEIGHT * scale
    s_spacing = CANVAS_SPACING * scale
    s_padding = CANVAS_PADDING * scale

    # Tổng các khối bên trong ColumnLayout + đệm top/bottom + 2 khoảng cách giữa 3 khối
    total_consumed = s_header_h + s_viewport_h + s_dock_h + 2 * s_spacing + 2 * s_padding
    assert total_consumed == pytest.approx(s_canvas_h, rel=1e-4), (
        f"{name}: Ngân sách dọc bị lệch: Tổng khối {total_consumed} != Chiều cao Canvas {s_canvas_h}"
    )


@pytest.mark.parametrize("name, width, height, expected_scale, orientation", SCALING_MATRIX)
def test_biometric_oval_geometry_preservation(name: str, width: int, height: int, expected_scale: float, orientation: str):
    """Đảm bảo Oval căn chỉnh khuôn mặt giữ đúng tỷ lệ hình học chuẩn (470 x 604 px)."""
    scale = calculate_scale_ratio(width, height)
    s_oval_w = OVAL_WIDTH * scale
    s_oval_h = OVAL_HEIGHT * scale

    oval_ratio = s_oval_w / s_oval_h
    expected_oval_ratio = OVAL_WIDTH / OVAL_HEIGHT  # ~0.7781
    assert oval_ratio == pytest.approx(expected_oval_ratio, rel=1e-5), (
        f"{name}: Tỷ lệ Oval ({oval_ratio}) bị méo so với thiết kế gốc ({expected_oval_ratio})"
    )


@pytest.mark.parametrize("name, width, height, expected_scale, orientation", SCALING_MATRIX)
def test_touch_target_accessibility_compliance(name: str, width: int, height: int, expected_scale: float, orientation: str):
    """Kiểm tra diện tích chạm cảm ứng (Touch Target) đạt chuẩn công nghiệp Kiosk."""
    scale = calculate_scale_ratio(width, height)

    btn_w = ACTION_BTN_WIDTH * scale
    btn_h = ACTION_BTN_HEIGHT * scale

    # Với các màn hình Kiosk chuyên dụng đứng khổ dọc (HD Portrait 720x1280 trở lên)
    if width >= 720 and height >= 1280:
        # Chuẩn Kiosk công nghiệp tối thiểu 64x64 px cho các thao tác chính
        assert btn_w >= 64.0, f"{name}: Chiều rộng nút Action Dock ({btn_w:.1f}px) < 64px"
        assert btn_h >= 64.0, f"{name}: Chiều cao nút Action Dock ({btn_h:.1f}px) < 64px"
    elif height >= 1080:
        # Màn hình Full HD ngang (Landscape 1080p): Đạt chuẩn chạm tiêu chuẩn (>= 48x48 px)
        assert btn_w >= 48.0, f"{name}: Chiều rộng nút Action Dock ({btn_w:.1f}px) < 48px"
        assert btn_h >= 48.0, f"{name}: Chiều cao nút Action Dock ({btn_h:.1f}px) < 48px"
    else:
        # Màn hình Compact / Laptop (height < 1080): Đạt chuẩn WCAG 2.2 Target Size (>= 24x24 px)
        assert btn_w >= 48.0, f"{name}: Chiều rộng nút Action Dock ({btn_w:.1f}px) < 48px"
        assert btn_h >= 32.0, f"{name}: Chiều cao nút Action Dock ({btn_h:.1f}px) < 32px"
