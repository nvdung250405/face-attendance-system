"""Cấu hình tham số hoạt động cho Phân hệ Kiosk Desktop.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 2.4 - Cấu hình môi trường)
- DDS.md (Mục 2.1 & Quyết định DEC-02, DEC-04)
"""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Xác định đường dẫn thư mục gốc của kiosk-app và monorepo
KIOSK_DIR = Path(__file__).resolve().parent.parent.parent
MONOREPO_ROOT = KIOSK_DIR.parent.parent

# Tự động nạp biến môi trường từ .env của kiosk-app hoặc monorepo root
local_env = KIOSK_DIR / ".env"
root_env = MONOREPO_ROOT / ".env"

if local_env.exists():
    load_dotenv(local_env)
elif root_env.exists():
    load_dotenv(root_env)
else:
    load_dotenv()


@dataclass(frozen=True)
class KioskConfig:
    """Tập hợp các tham số cấu hình tĩnh và động của trạm Kiosk."""

    # 0. Môi trường vận hành ('production' hoặc 'development')
    app_env: str = os.getenv("APP_ENV", os.getenv("KIOSK_ENV", "production")).strip().lower()

    # 1. Định danh & Kết nối máy chủ
    kiosk_id: str = os.getenv("KIOSK_ID", "KIOSK-LOBBY-01")
    backend_url: str = os.getenv("VITE_API_BASE_URL", "http://localhost:8080/api/v1")
    stomp_ws_url: str = os.getenv("VITE_WS_BASE_URL", "ws://localhost:8080/ws")
    DEFAULT_SECRET_TOKEN: str = "Kiosk_Internal_Secret_Token_2026"
    kiosk_secret_token: str = os.getenv(
        "KIOSK_SECRET_TOKEN", "Kiosk_Internal_Secret_Token_2026"
    )

    # 2. Cấu hình Camera vật lý
    camera_device_index: int = int(os.getenv("CAMERA_DEVICE_INDEX", "0"))
    camera_frame_width: int = int(os.getenv("CAMERA_FRAME_WIDTH", "1280"))
    camera_frame_height: int = int(os.getenv("CAMERA_FRAME_HEIGHT", "720"))
    camera_fps: int = int(os.getenv("CAMERA_FPS", "30"))

    # 3. Ngưỡng AI & Nghiệp vụ điểm danh
    liveness_threshold: float = float(os.getenv("LIVENESS_THRESHOLD", "0.85"))
    cosine_similarity_threshold: float = float(
        os.getenv("COSINE_SIMILARITY_THRESHOLD", "0.65")
    )
    stability_seconds: float = float(os.getenv("STABILITY_SECONDS", "0.60"))
    cooldown_seconds: int = int(os.getenv("COOLDOWN_SECONDS", "120"))
    max_pin_attempts: int = int(os.getenv("MAX_PIN_ATTEMPTS", "5"))
    pin_lockout_minutes: int = int(os.getenv("PIN_LOCKOUT_MINUTES", "15"))

    # 4. Lưu trữ SQLite ngoại tuyến
    db_path: Path = KIOSK_DIR / "kiosk_local.db"
    sync_batch_size: int = int(os.getenv("SYNC_BATCH_SIZE", "50"))
    sync_interval_seconds: int = int(os.getenv("SYNC_INTERVAL_SECONDS", "10"))

    # 5. Đường dẫn thư mục tài nguyên & mô hình AI
    resources_dir: Path = KIOSK_DIR / "resources"
    assets_dir: Path = KIOSK_DIR / "resources" / "assets"
    models_dir: Path = KIOSK_DIR / "resources" / "assets" / "models"
    icons_dir: Path = KIOSK_DIR / "resources" / "assets" / "icons"
    sounds_dir: Path = KIOSK_DIR / "resources" / "assets" / "sounds"
    qml_dir: Path = KIOSK_DIR / "resources" / "qml"
    logs_dir: Path = MONOREPO_ROOT / "logs" / "kiosk"

    # 6. Đường dẫn tệp trọng số mô hình ONNX
    yunet_model_path: Path = (
        (KIOSK_DIR / "resources" / "assets" / "models" / "yunet.onnx")
        if (KIOSK_DIR / "resources" / "assets" / "models" / "yunet.onnx").exists()
        else (KIOSK_DIR / "assets" / "models" / "yunet.onnx")
    )
    minifasnet_model_path: Path = (
        (KIOSK_DIR / "resources" / "assets" / "models" / "minifasnet.onnx")
        if (KIOSK_DIR / "resources" / "assets" / "models" / "minifasnet.onnx").exists()
        else (KIOSK_DIR / "assets" / "models" / "minifasnet.onnx")
    )
    arcface_model_path: Path = (
        (KIOSK_DIR / "resources" / "assets" / "models" / "arcface_mobilefacenet.onnx")
        if (KIOSK_DIR / "resources" / "assets" / "models" / "arcface_mobilefacenet.onnx").exists()
        else (KIOSK_DIR / "assets" / "models" / "arcface_mobilefacenet.onnx")
    )

    # 7. Đường dẫn âm thanh phản hồi
    beep_success_path: Path = KIOSK_DIR / "resources" / "assets" / "sounds" / "beep_success.wav"
    beep_error_path: Path = KIOSK_DIR / "resources" / "assets" / "sounds" / "beep_error.wav"

    # 8. Đường dẫn biểu tượng giao diện
    logo_path: Path = KIOSK_DIR / "resources" / "assets" / "icons" / "logo.png"
    online_icon_path: Path = KIOSK_DIR / "resources" / "assets" / "icons" / "online.png"
    offline_icon_path: Path = KIOSK_DIR / "resources" / "assets" / "icons" / "offline.png"

    @property
    def is_default_secret(self) -> bool:
        """Kiểm tra trạm có đang dùng token bí mật mặc định hay không."""
        return self.kiosk_secret_token == self.DEFAULT_SECRET_TOKEN

    @property
    def is_production(self) -> bool:
        """Kiểm tra môi trường hiện tại có phải là Production chuẩn hay không."""
        return self.app_env in ("production", "prod")

    @property
    def is_development(self) -> bool:
        """Kiểm tra môi trường hiện tại có phải là Development / Thử nghiệm hay không."""
        return not self.is_production


# Biến cấu hình toàn cục dùng trực tiếp
settings = KioskConfig()


def get_settings() -> KioskConfig:
    """Lấy đối tượng cấu hình KioskConfig hiện hành.

    Returns:
        KioskConfig: Đối tượng cấu hình chứa đầy đủ tham số hệ thống.
    """
    return settings
