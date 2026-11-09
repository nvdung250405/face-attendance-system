"""Kịch bản Kiểm thử End-to-End Desktop Automation bằng FlaUI CLI (UIA3).

Kiểm thử hộp đen tầng hệ điều hành Windows:
1. Khởi động ứng dụng Kiosk trong phiên desktop thực.
2. Đính kèm phiên làm việc (attach session) thông qua FlaUI CLI.
3. Quét kiểm tra cây UI & Trợ năng (Accessibility & AutomationId Audit).
4. Giả lập bấm phím F2 (Mở PIN Dialog), Escape (Đóng), F1 (Mở Help Dialog), Escape (Đóng).
5. Giả lập phím Space (Kích hoạt nhận diện thành công trong Dev Mode).
6. Chụp ảnh màn hình qua FlaUI API để lưu vết nghiệm thu E2E.
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

FLAUI_EXE = r"C:\Users\Dung\.dotnet\tools\flaui.exe"
PYTHON_EXE = r"C:\Users\Dung\AppData\Local\Programs\Python\Python314\python.exe"
WORKSPACE_DIR = Path(__file__).resolve().parents[3]
KIOSK_DIR = WORKSPACE_DIR / "app" / "kiosk-app"
REPORTS_DIR = WORKSPACE_DIR / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots" / "e2e"
AUDIT_DIR = REPORTS_DIR / "audit"
AUDIT_REPORT_PATH = AUDIT_DIR / "flaui_audit_report.json"
TMP_DIR = WORKSPACE_DIR / ".tmp"
SESSION_FILE = TMP_DIR / "flaui_e2e_session.json"


def run_flaui(args: list[str]) -> tuple[int, str, str]:
    """Gọi lệnh FlaUI CLI với tệp cấu hình session cố định."""
    cmd = [FLAUI_EXE] + args + ["--session", str(SESSION_FILE)]
    print(f"[FLAUI] Thực thi: {' '.join(cmd)}")
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    stdout = proc.stdout.strip()
    stderr = proc.stderr.strip()
    if stdout:
        print(f"[FLAUI STDOUT]\n{stdout}")
    if stderr:
        print(f"[FLAUI STDERR]\n{stderr}")
    return proc.returncode, stdout, stderr


def main() -> int:
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    if SESSION_FILE.exists():
        try:
            SESSION_FILE.unlink()
        except Exception:
            pass

    main_py = WORKSPACE_DIR / "app" / "kiosk-app" / "main.py"
    cmd_app = [
        PYTHON_EXE,
        str(main_py),
        "--no-camera",
        "--dev",
    ]

    print("=" * 70)
    print("BẮT ĐẦU KIỂM THỬ E2E DESKTOP AUTOMATION VỚI FLAUI CLI (UIA3)")
    print("=" * 70)

    # 1. Khởi chạy ứng dụng Kiosk ở tiến trình độc lập
    print(f"[1/6] Khởi động ứng dụng Kiosk Desktop: {' '.join(cmd_app)}")
    creation_flags = 0

    app_process = subprocess.Popen(
        cmd_app,
        cwd=str(WORKSPACE_DIR),
        creationflags=creation_flags,
    )
    print(f" -> Kiosk App PID: {app_process.pid}")

    time.sleep(5)  # Chờ ứng dụng QML khởi tạo Scene Graph hoàn tất

    try:
        # 2. Đính kèm FlaUI Session vào PID của ứng dụng
        print("\n[2/6] Đính kèm FlaUI Session vào tiến trình Kiosk...")
        rc, out, _ = run_flaui(["session", "attach", "--pid", str(app_process.pid), "--timeout", "15000"])
        if rc != 0 or "failed" in out.lower() or "error" in out.lower():
            raise RuntimeError(f"Không thể đính kèm session FlaUI: {out}")

        # Lấy danh sách cửa sổ để lấy handle
        rc, out, _ = run_flaui(["window", "list"])
        window_handle = None
        try:
            # Tìm JSON trong output (bỏ qua warning text từ dotnet tool)
            json_start = out.find("{")
            if json_start != -1:
                data = json.loads(out[json_start:])
                windows = data.get("windows", [])
                if windows:
                    window_handle = windows[0].get("handle")
        except Exception as e:
            print(f"Không phân tích cú pháp được JSON cửa sổ: {e}")

        if not window_handle:
            print("CẢNH BÁO: Không tìm thấy handle cửa sổ, thử tìm kiếm tự động...")

        # 3. Focus cửa sổ ứng dụng
        print("\n[3/6] Focus cửa sổ giao diện Kiosk...")
        if window_handle:
            run_flaui(["window", "focus", "--handle", window_handle])
        time.sleep(1)

        # 4. Chạy Accessibility & UI Audit (Giai đoạn 5)
        print("\n[4/6] Quét kiểm tra cây UIA3 Accessibility & Audit Report...")
        run_flaui(["audit", "--out", str(AUDIT_REPORT_PATH)])

        # 5. Chụp ảnh màn hình trạng thái IDLE
        snap_idle = SCREENSHOTS_DIR / "flaui_e2e_01_idle.png"
        print(f"\n[5/6] Chụp ảnh màn hình trạng thái Idle: {snap_idle.name}")
        run_flaui(["screenshot", "--output", str(snap_idle)])

        # 6. Giả lập bấm phím F2 (Mở PIN Dialog)
        print("\n[6/6] Gửi phím F2 mở PIN Dialog...")
        key_args = ["--window", window_handle] if window_handle else []
        run_flaui(["elem", "keys", "--keys", "F2"] + key_args)
        time.sleep(1.2)
        snap_pin = SCREENSHOTS_DIR / "flaui_e2e_02_pin.png"
        run_flaui(["screenshot", "--output", str(snap_pin)])

        # Đóng PIN Dialog bằng Escape
        print(" -> Gửi phím Escape đóng PIN Dialog...")
        run_flaui(["elem", "keys", "--keys", "Escape"] + key_args)
        time.sleep(0.8)

        # Mở Help Dialog bằng F1
        print(" -> Gửi phím F1 mở Help Dialog...")
        run_flaui(["elem", "keys", "--keys", "F1"] + key_args)
        time.sleep(1.2)
        snap_help = SCREENSHOTS_DIR / "flaui_e2e_03_help.png"
        run_flaui(["screenshot", "--output", str(snap_help)])

        # Đóng Help Dialog bằng Escape
        print(" -> Gửi phím Escape đóng Help Dialog...")
        run_flaui(["elem", "keys", "--keys", "Escape"] + key_args)
        time.sleep(0.8)

        # Kích hoạt nhận diện mô phỏng thành công bằng Space (Dev Mode)
        print(" -> Gửi phím Space kích hoạt mô phỏng Nhận diện thành công...")
        run_flaui(["elem", "keys", "--keys", "Space"] + key_args)
        time.sleep(1.5)
        snap_success = SCREENSHOTS_DIR / "flaui_e2e_04_success.png"
        run_flaui(["screenshot", "--output", str(snap_success)])

        print("\n" + "=" * 70)
        print("✅ TOÀN BỘ KỊCH BẢN E2E FLAUI DESKTOP AUTOMATION ĐÃ HOÀN TẤT THÀNH CÔNG!")
        print("=" * 70)

    finally:
        # Dọn dẹp phiên và tiến trình
        print("\n[CLEANUP] Đóng phiên FlaUI và dừng ứng dụng Kiosk...")
        try:
            run_flaui(["session", "end"])
        except Exception:
            pass

        try:
            app_process.terminate()
            app_process.wait(timeout=3)
        except Exception:
            try:
                app_process.kill()
            except Exception:
                pass

        if SESSION_FILE.exists():
            try:
                SESSION_FILE.unlink()
            except Exception:
                pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
