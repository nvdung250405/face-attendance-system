import sys
from pathlib import Path

from PySide6.QtCore import QEvent, QMetaObject, Qt, QTimer
from PySide6.QtGui import QGuiApplication, QKeyEvent
from PySide6.QtQml import QQmlApplicationEngine

workspace_root = Path(__file__).resolve().parents[2]
kiosk_root = workspace_root / "app" / "kiosk-app"
src_dir = kiosk_root / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from core.security.pin_security import PinSecurityManager
from presentation.controllers.enrollment_controller import EnrollmentController
from presentation.controllers.pin_controller import PinController
from presentation.providers.video_image_provider import VideoImageProvider
from presentation.viewmodels.kiosk_view_model import KioskViewModel

app = QGuiApplication(sys.argv)
engine = QQmlApplicationEngine()
image_provider = VideoImageProvider()
engine.addImageProvider("camera", image_provider)

is_dev_mode = "--dev" in sys.argv
print(f"[*] Chế độ chụp UI Review: {'[DEVELOPMENT MODE]' if is_dev_mode else '[PRODUCTION CLEAN MODE]'}")

kiosk_vm = KioskViewModel(is_dev_mode=is_dev_mode)
pin_sec = PinSecurityManager(max_attempts=5, lockout_minutes=15)
pin_ctrl = PinController(security_manager=pin_sec)
enroll_ctrl = EnrollmentController(demo_mode=is_dev_mode)

ctx = engine.rootContext()
ctx.setContextProperty("kioskViewModel", kiosk_vm)
ctx.setContextProperty("pinController", pin_ctrl)
ctx.setContextProperty("enrollmentController", enroll_ctrl)

qml_dir = kiosk_root / "resources" / "qml"
engine.addImportPath(str(qml_dir))
engine.load(str(qml_dir / "main.qml"))

root_window = engine.rootObjects()[0]
root_window.show()

output_dir = Path(__file__).resolve().parents[1] / "reports" / "screenshots" / "baselines"
output_dir.mkdir(parents=True, exist_ok=True)


def send_key(key):
    event = QKeyEvent(QEvent.KeyPress, key, Qt.NoModifier)
    QGuiApplication.sendEvent(root_window, event)


def get_dlg(name):
    return root_window.findChild(object, name)


# ---------------------------------------------------------------------------
# Chuỗi các bước kiểm thử giao diện & chụp ảnh 17 trạng thái
# ---------------------------------------------------------------------------

def step01_standby():
    print("[01/17] Chụp màn hình STANDBY Welcome Canvas...")
    kiosk_vm.setStandby(True)
    QTimer.singleShot(600, capture_01)


def capture_01():
    root_window.grabWindow().save(str(output_dir / "01_standby_welcome.png"))
    print("✓ Đã lưu 01_standby_welcome.png")
    step02_active_scanning()


def step02_active_scanning():
    print("[02/17] Chụp màn hình ACTIVE Camera scanning (IDLE #64748B)...")
    kiosk_vm.setStandby(False)
    kiosk_vm.set_state("IDLE", "Vui lòng đứng trước camera để điểm danh")
    QTimer.singleShot(600, capture_02)


def capture_02():
    root_window.grabWindow().save(str(output_dir / "02_active_scanning.png"))
    print("✓ Đã lưu 02_active_scanning.png")
    step03_active_aligning()


def step03_active_aligning():
    print("[03/17] Chụp màn hình ACTIVE Aligning (Căn chỉnh #F59E0B)...")
    kiosk_vm.set_state("ALIGNING", "Vui lòng giữ thẳng mặt và nhìn vào giữa khung hình")
    QTimer.singleShot(600, capture_03)


def capture_03():
    root_window.grabWindow().save(str(output_dir / "03_active_aligning.png"))
    print("✓ Đã lưu 03_active_aligning.png")
    step04_active_success()


def step04_active_success():
    print("[04/17] Chụp màn hình SUCCESS Result Card (#10B981 + PortraitResultCard)...")
    punch_time = "07:58:32"
    kiosk_vm._last_emp_id = 1001
    kiosk_vm._last_punch_time = punch_time
    kiosk_vm._last_score = 0.98
    kiosk_vm.lastResultChanged.emit()
    kiosk_vm.set_state(
        "SUCCESS",
        f"Điểm danh thành công lúc {punch_time}!\nMã NV: 1001 (Độ tin cậy: 98%)",
    )
    QTimer.singleShot(700, capture_04)


def capture_04():
    root_window.grabWindow().save(str(output_dir / "04_active_success_card.png"))
    print("✓ Đã lưu 04_active_success_card.png")
    step05_active_rejected()


def step05_active_rejected():
    print("[05/17] Chụp màn hình ACTIVE Rejected / Error (#EF4444)...")
    kiosk_vm.set_state("ERROR", "Khuôn mặt không hợp lệ hoặc cảnh báo giả mạo!")
    QTimer.singleShot(600, capture_05)


def capture_05():
    root_window.grabWindow().save(str(output_dir / "05_active_rejected.png"))
    print("✓ Đã lưu 05_active_rejected.png")
    step06_active_offline()


def step06_active_offline():
    print("[06/17] Chụp trạng thái Ngoại tuyến trên HeaderBar (Chờ đồng bộ)...")
    kiosk_vm.set_state("IDLE", "Chế độ ngoại tuyến - Điểm danh lưu tạm")
    kiosk_vm._on_network_status_changed(False, "Ngoại tuyến")
    kiosk_vm._on_sync_progress(0, 5)
    QTimer.singleShot(600, capture_06)


def capture_06():
    root_window.grabWindow().save(str(output_dir / "06_active_offline_header.png"))
    print("✓ Đã lưu 06_active_offline_header.png")
    # Khôi phục mạng trực tuyến
    kiosk_vm._on_network_status_changed(True, "Trực tuyến")
    kiosk_vm._on_sync_progress(5, 0)
    step07_pin_default()


def step07_pin_default():
    print("[07/17] Mở và chụp PIN Dialog mặc định...")
    pin_dlg = get_dlg("pinDialog")
    if pin_dlg:
        QMetaObject.invokeMethod(pin_dlg, "open")
    QTimer.singleShot(600, capture_07)


def capture_07():
    root_window.grabWindow().save(str(output_dir / "07_pin_dialog_default.png"))
    print("✓ Đã lưu 07_pin_dialog_default.png")
    step08_pin_emp_code()


def step08_pin_emp_code():
    print("[08/17] Chụp PIN Dialog với mã nhân viên đã nhập...")
    pin_dlg = get_dlg("pinDialog")
    if pin_dlg:
        pin_dlg.setProperty("activeField", "empId")
    pin_ctrl.set_employee_code("NV-1008")
    QTimer.singleShot(500, capture_08)


def capture_08():
    root_window.grabWindow().save(str(output_dir / "08_pin_dialog_employee_code.png"))
    print("✓ Đã lưu 08_pin_dialog_employee_code.png")
    step09_pin_entered()


def step09_pin_entered():
    print("[09/17] Chụp PIN Dialog với 6 chữ số PIN đã nhập (Sẵn sàng)...")
    pin_dlg = get_dlg("pinDialog")
    if pin_dlg:
        pin_dlg.setProperty("activeField", "pin")
    pin_ctrl.clear()
    for d in "123456":
        pin_ctrl.appendDigit(d)
    QTimer.singleShot(500, capture_09)


def capture_09():
    root_window.grabWindow().save(str(output_dir / "09_pin_dialog_pin_entered.png"))
    print("✓ Đã lưu 09_pin_dialog_pin_entered.png")
    step10_pin_locked()


def step10_pin_locked():
    print("[10/17] Chụp PIN Dialog trạng thái Khóa 15 phút (Lockout)...")
    for _ in range(5):
        pin_ctrl.on_verification_failure()
    QTimer.singleShot(600, capture_10)


def capture_10():
    root_window.grabWindow().save(str(output_dir / "10_pin_dialog_locked.png"))
    print("✓ Đã lưu 10_pin_dialog_locked.png")
    pin_dlg = get_dlg("pinDialog")
    if pin_dlg:
        QMetaObject.invokeMethod(pin_dlg, "close")
    step11_enroll_step1()


def step11_enroll_step1():
    print("[11/17] Mở và chụp Enrollment Dialog Bước 1 (OTP Input)...")
    enroll_dlg = get_dlg("enrollmentDialog")
    if enroll_dlg:
        QMetaObject.invokeMethod(enroll_dlg, "open")
    QTimer.singleShot(600, capture_11)


def capture_11():
    root_window.grabWindow().save(str(output_dir / "11_enrollment_step1_otp_default.png"))
    print("✓ Đã lưu 11_enrollment_step1_otp_default.png")
    step12_enroll_step1_entered()


def step12_enroll_step1_entered():
    print("[12/17] Chụp Enrollment Dialog Bước 1 với OTP 482619 đã nhập...")
    enroll_ctrl.clearOtp()
    for d in "482619":
        enroll_ctrl.appendOtpDigit(d)
    QTimer.singleShot(500, capture_12)


def capture_12():
    root_window.grabWindow().save(str(output_dir / "12_enrollment_step1_otp_entered.png"))
    print("✓ Đã lưu 12_enrollment_step1_otp_entered.png")
    step13_enroll_step2_frontal()


def step13_enroll_step2_frontal():
    print("[13/17] Chụp Bước 2 In-Viewport: Tư thế 1 Nhìn thẳng (HUD cards & Thước Yaw 0°)...")
    enroll_ctrl._is_dialog_open = True
    enroll_ctrl._employee_name = "Trần Văn Bình"
    enroll_ctrl._employee_id = 1009
    enroll_ctrl._current_step = 2
    enroll_ctrl._current_pose_index = 0
    enroll_ctrl._current_yaw = 0.0
    enroll_ctrl._is_pose_valid = True
    enroll_ctrl._progress_percent = 0.0
    enroll_ctrl._status_message = "Bước 1/3: Giữ thẳng mặt, nhìn trực diện camera"

    enroll_ctrl.dialogOpenChanged.emit(True)
    enroll_ctrl.currentStepChanged.emit(2)
    enroll_ctrl.currentPoseChanged.emit("FRONTAL")
    enroll_ctrl.poseIndexChanged.emit(0)
    enroll_ctrl.yawChanged.emit(0.0)
    enroll_ctrl.poseValidityChanged.emit(True)
    enroll_ctrl.progressPercentChanged.emit(0.0)
    enroll_ctrl.statusMessageChanged.emit(enroll_ctrl._status_message)

    QTimer.singleShot(700, capture_13)


def capture_13():
    root_window.grabWindow().save(str(output_dir / "13_enrollment_step2_pose_frontal.png"))
    print("✓ Đã lưu 13_enrollment_step2_pose_frontal.png")
    step14_enroll_step2_left()


def step14_enroll_step2_left():
    print("[14/17] Chụp Bước 2 In-Viewport: Tư thế 2 Nghiêng trái (Mũi tên ◀ TRÁI & Thước Yaw +18°)...")
    enroll_ctrl._current_pose_index = 1
    enroll_ctrl._current_yaw = 18.0
    enroll_ctrl._is_pose_valid = True
    enroll_ctrl._progress_percent = 0.33
    enroll_ctrl._status_message = "Bước 2/3: Nghiêng nhẹ mặt sang TRÁI (10° - 25°)"

    enroll_ctrl.currentPoseChanged.emit("LEFT_TILT")
    enroll_ctrl.poseIndexChanged.emit(1)
    enroll_ctrl.yawChanged.emit(18.0)
    enroll_ctrl.poseValidityChanged.emit(True)
    enroll_ctrl.progressPercentChanged.emit(0.33)
    enroll_ctrl.statusMessageChanged.emit(enroll_ctrl._status_message)

    QTimer.singleShot(700, capture_14)


def capture_14():
    root_window.grabWindow().save(str(output_dir / "14_enrollment_step2_pose_left_tilt.png"))
    print("✓ Đã lưu 14_enrollment_step2_pose_left_tilt.png")
    step15_enroll_step2_right()


def step15_enroll_step2_right():
    print("[15/17] Chụp Bước 2 In-Viewport: Tư thế 3 Nghiêng phải (Mũi tên ▶ PHẢI & Thước Yaw -18°)...")
    enroll_ctrl._current_pose_index = 2
    enroll_ctrl._current_yaw = -18.0
    enroll_ctrl._is_pose_valid = True
    enroll_ctrl._progress_percent = 0.66
    enroll_ctrl._status_message = "Bước 3/3: Nghiêng nhẹ mặt sang PHẢI (10° - 25°)"

    enroll_ctrl.currentPoseChanged.emit("RIGHT_TILT")
    enroll_ctrl.poseIndexChanged.emit(2)
    enroll_ctrl.yawChanged.emit(-18.0)
    enroll_ctrl.poseValidityChanged.emit(True)
    enroll_ctrl.progressPercentChanged.emit(0.66)
    enroll_ctrl.statusMessageChanged.emit(enroll_ctrl._status_message)

    QTimer.singleShot(700, capture_15)


def capture_15():
    root_window.grabWindow().save(str(output_dir / "15_enrollment_step2_pose_right_tilt.png"))
    print("✓ Đã lưu 15_enrollment_step2_pose_right_tilt.png")
    step16_enroll_step3_success()


def step16_enroll_step3_success():
    print("[16/17] Chụp Enrollment Dialog Bước 3: Hoàn tất đăng ký thành công...")
    enroll_ctrl._current_step = 3
    enroll_ctrl._progress_percent = 1.0
    enroll_ctrl._status_message = "Chúc mừng! Đăng ký khuôn mặt thành công."
    enroll_ctrl.currentStepChanged.emit(3)
    enroll_ctrl.progressPercentChanged.emit(1.0)
    enroll_ctrl.statusMessageChanged.emit(enroll_ctrl._status_message)
    QTimer.singleShot(700, capture_16)


def capture_16():
    root_window.grabWindow().save(str(output_dir / "16_enrollment_step3_success.png"))
    print("✓ Đã lưu 16_enrollment_step3_success.png")
    enroll_dlg = get_dlg("enrollmentDialog")
    if enroll_dlg:
        QMetaObject.invokeMethod(enroll_dlg, "close")
    step17_help()


def step17_help():
    print("[17/17] Mở và chụp Help Dialog Hướng dẫn F1...")
    help_dlg = get_dlg("helpDialog")
    if help_dlg:
        QMetaObject.invokeMethod(help_dlg, "open")
    else:
        send_key(Qt.Key_F1)
    QTimer.singleShot(700, capture_17)


def capture_17():
    root_window.grabWindow().save(str(output_dir / "17_help_dialog.png"))
    print("✓ Đã lưu 17_help_dialog.png")
    help_dlg = get_dlg("helpDialog")
    if help_dlg:
        QMetaObject.invokeMethod(help_dlg, "close")
    print("\n=======================================================")
    print("🎉 TOÀN BỘ 17 TRẠNG THÁI GIAO DIỆN KIOSK ĐÃ ĐƯỢC CHỤP THÀNH CÔNG!")
    print(f"📁 Thư mục ảnh: {output_dir}")
    print("=======================================================\n")
    app.quit()


QTimer.singleShot(1200, step01_standby)
sys.exit(app.exec())
