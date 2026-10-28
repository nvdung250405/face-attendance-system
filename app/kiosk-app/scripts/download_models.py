"""Script tự động tải và kiểm tra bộ 3 trọng số mô hình AI ONNX cho Trạm Kiosk.

Các mô hình bao gồm:
1. YuNet (Face Detection - OpenCV Zoo)
2. MiniFASNet (Silent-Face Anti-Spoofing Liveness)
3. ArcFace MobileFaceNet (512D Feature Extraction)

Tuân thủ:
- BP-KIOSK-01 Mục 2.1 & 2.3
"""

import argparse
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Đường dẫn thư mục models
CURRENT_DIR = Path(__file__).resolve().parent
MODELS_DIR = CURRENT_DIR.parent / "resources" / "assets" / "models"

# Danh mục nguồn tải tin cậy cho các mô hình
MODEL_REGISTRY = {
    "yunet.onnx": {
        "url": "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "description": "YuNet Face Detector (OpenCV Zoo 2023)",
        "expected_min_bytes": 200_000,  # ~230 KB
    },
    "minifasnet.onnx": {
        "url": "https://github.com/yakhyo/face-anti-spoofing/releases/download/weights/MiniFASNetV2.onnx",
        "description": "MiniFASNet Liveness Gate (Silent-Face-Anti-Spoofing)",
        "expected_min_bytes": 1_000_000,  # ~1.7 MB
    },
    "arcface_mobilefacenet.onnx": {
        "url": "https://github.com/yakhyo/face-reidentification/releases/download/v0.0.1/w600k_mbf.onnx",
        "description": "ArcFace MobileFaceNet 512D Feature Extractor",
        "expected_min_bytes": 4_000_000,  # ~13 MB
    },
}


def download_file(url: str, dest_path: Path, description: str) -> bool:
    """Tải tệp từ URL về đường dẫn chỉ định với thanh tiến trình đơn giản.

    Args:
        url: Đường dẫn tải trực tiếp.
        dest_path: Đường dẫn lưu tệp trên đĩa.
        description: Mô tả thông tin mô hình.

    Returns:
        bool: True nếu tải thành công, False nếu thất bại.
    """
    print(f"[*] Đang tải: {description}...")
    print(f"    Nguồn: {url}")
    print(f"    Đích:  {dest_path}")

    # Kiểm tra giao thức URL bảo mật (chỉ cho phép HTTPS)
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme.lower() != "https":
        print(f"[-] Lỗi bảo mật: Chỉ cho phép tải qua giao thức HTTPS an toàn, URL nhận được: {url}")
        return False

    temp_path = dest_path.with_suffix(".tmp")
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "FAS-Kiosk-Downloader/1.0"},
        )
        # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
        with urllib.request.urlopen(req, timeout=30) as response, open(temp_path, "wb") as out_file:
            content_length = response.headers.get("Content-Length")
            total_size = int(content_length) if content_length else 0
            downloaded = 0
            chunk_size = 65536

            while True:
                chunk = response.read(chunk_size)
                if not chunk:
                    break
                out_file.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    percent = (downloaded / total_size) * 100
                    print(
                        f"\r    Tiến trình: {downloaded / 1024 / 1024:.2f} MB / {total_size / 1024 / 1024:.2f} MB ({percent:.1f}%)",
                        end="",
                        flush=True,
                    )

            print()

        if temp_path.exists():
            temp_path.replace(dest_path)
            print(f"[+] Hoàn tất: {dest_path.name} ({dest_path.stat().st_size:,} bytes)\n")
            return True
    except (urllib.error.URLError, TimeoutError, Exception) as exc:
        print(f"\n[-] Lỗi khi tải {dest_path.name}: {exc}")
        if temp_path.exists():
            temp_path.unlink()
        return False
    return False


def verify_models(models_dir: Path) -> dict[str, bool]:
    """Kiểm tra sự tồn tại và tính hợp lệ dung lượng của các mô hình ONNX.

    Args:
        models_dir: Đường dẫn thư mục chứa mô hình.

    Returns:
        dict[str, bool]: Bảng trạng thái hợp lệ của từng mô hình.
    """
    results = {}
    print(f"\n{'='*60}")
    print("KIỂM TRA BỘ TRỌNG SỐ MÔ HÌNH AI ONNX TẠI:", models_dir)
    print(f"{'='*60}")

    for filename, meta in MODEL_REGISTRY.items():
        file_path = models_dir / filename
        if not file_path.exists():
            print(f"[MISSING] {filename:<28} - Chưa tồn tại")
            results[filename] = False
            continue

        size = file_path.stat().st_size
        min_bytes = meta["expected_min_bytes"]
        if size < min_bytes:
            print(
                f"[INVALID] {filename:<28} - Dung lượng quá nhỏ ({size:,} B < {min_bytes:,} B)"
            )
            results[filename] = False
        else:
            print(f"[READY]   {filename:<28} - Đã sẵn sàng ({size / 1024 / 1024:.2f} MB)")
            results[filename] = True

    print(f"{'='*60}\n")
    return results


def main() -> int:
    """Điểm điều phối tải và kiểm tra mô hình."""
    parser = argparse.ArgumentParser(description="Công cụ quản lý trọng số mô hình AI Kiosk.")
    parser.add_argument("--check-only", action="store_true", help="Chỉ kiểm tra mà không tải")
    parser.add_argument("--force", action="store_true", help="Bắt buộc tải lại dù đã có")
    args = parser.parse_args()

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if args.check_only:
        results = verify_models(MODELS_DIR)
        return 0 if all(results.values()) else 1

    print("\n--- BẮT ĐẦU CHUẨN BỊ BỘ TRỌNG SỐ AI ONNX CHO KIOSK ---")
    results = verify_models(MODELS_DIR)

    for filename, meta in MODEL_REGISTRY.items():
        dest_path = MODELS_DIR / filename
        if results.get(filename, False) and not args.force:
            print(f"[i] Bỏ qua {filename} (đã sẵn sàng). Dùng --force nếu muốn nạp lại.")
            continue

        success = download_file(meta["url"], dest_path, meta["description"])
        if not success and "fallback_url" in meta:
            print(f"[!] Thử nguồn dự phòng cho {filename}...")
            download_file(meta["fallback_url"], dest_path, meta["description"])

    final_results = verify_models(MODELS_DIR)
    return 0 if all(final_results.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
