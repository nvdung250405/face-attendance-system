import sys
from pathlib import Path

from PySide6.QtCore import QEvent, Qt, QTimer
from PySide6.QtGui import QGuiApplication, QKeyEvent
from PySide6.QtQml import QQmlApplicationEngine

app_root = Path(__file__).resolve().parent.parent
src_dir = app_root / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from presentation.controllers.enrollment_controller import EnrollmentController
from presentation.controllers.pin_controller import PinController
from presentation.providers.video_image_provider import VideoImageProvider
from presentation.viewmodels.kiosk_view_model import KioskViewModel

app = QGuiApplication(sys.argv)
engine = QQmlApplicationEngine()
image_provider = VideoImageProvider()
engine.addImageProvider("camera", image_provider)

kiosk_vm = KioskViewModel()
pin_ctrl = PinController()
enroll_ctrl = EnrollmentController()

ctx = engine.rootContext()
ctx.setContextProperty("kioskViewModel", kiosk_vm)
ctx.setContextProperty("pinController", pin_ctrl)
ctx.setContextProperty("enrollmentController", enroll_ctrl)

qml_dir = app_root / "resources" / "qml"
engine.addImportPath(str(qml_dir))
engine.load(str(qml_dir / "main.qml"))

root_window = engine.rootObjects()[0]
root_window.show()

output_dir = app_root / "docs" / "screenshots"
output_dir.mkdir(parents=True, exist_ok=True)


def send_key(key):
    event = QKeyEvent(QEvent.KeyPress, key, Qt.NoModifier)
    QGuiApplication.sendEvent(root_window, event)


def step1_standby():
    print("[1/6] Capturing STANDBY Welcome screen via Key 0...")
    send_key(Qt.Key_0)
    QTimer.singleShot(700, capture_standby)


def capture_standby():
    img = root_window.grabWindow()
    img.save(str(output_dir / "01_standby_welcome.png"))
    print("Saved 01_standby_welcome.png")
    step2_active()


def step2_active():
    print("[2/6] Capturing ACTIVE Camera scanning screen via Key 1...")
    send_key(Qt.Key_1)
    QTimer.singleShot(700, capture_active)


def capture_active():
    img = root_window.grabWindow()
    img.save(str(output_dir / "02_active_scanning.png"))
    print("Saved 02_active_scanning.png")
    step3_success()


def step3_success():
    print("[3/6] Capturing SUCCESS Result Card screen via Key Space...")
    send_key(Qt.Key_Space)
    QTimer.singleShot(800, capture_success)


def capture_success():
    img = root_window.grabWindow()
    img.save(str(output_dir / "03_active_success_card.png"))
    print("Saved 03_active_success_card.png")
    step4_pin()


from PySide6.QtCore import QMetaObject


def step4_pin():
    print("[4/6] Opening and capturing PIN Dialog...")
    pin_dlg = root_window.findChild(object, "pinDialog")
    if pin_dlg:
        QMetaObject.invokeMethod(pin_dlg, "open")
    else:
        send_key(Qt.Key_F2)
    QTimer.singleShot(800, capture_pin)


def capture_pin():
    img = root_window.grabWindow()
    img.save(str(output_dir / "04_pin_dialog.png"))
    print("Saved 04_pin_dialog.png")
    pin_dlg = root_window.findChild(object, "pinDialog")
    if pin_dlg:
        QMetaObject.invokeMethod(pin_dlg, "close")
    step5_enroll()


def step5_enroll():
    print("[5/6] Opening and capturing Enrollment Dialog...")
    enroll_dlg = root_window.findChild(object, "enrollmentDialog")
    if enroll_dlg:
        QMetaObject.invokeMethod(enroll_dlg, "open")
    else:
        send_key(Qt.Key_F3)
    QTimer.singleShot(800, capture_enroll)


def capture_enroll():
    img = root_window.grabWindow()
    img.save(str(output_dir / "05_enrollment_dialog.png"))
    print("Saved 05_enrollment_dialog.png")
    enroll_dlg = root_window.findChild(object, "enrollmentDialog")
    if enroll_dlg:
        QMetaObject.invokeMethod(enroll_dlg, "close")
    step6_help()


def step6_help():
    print("[6/6] Opening and capturing Help Dialog...")
    help_dlg = root_window.findChild(object, "helpDialog")
    if help_dlg:
        QMetaObject.invokeMethod(help_dlg, "open")
    else:
        send_key(Qt.Key_F1)
    QTimer.singleShot(800, capture_help)


def capture_help():
    img = root_window.grabWindow()
    img.save(str(output_dir / "06_help_dialog.png"))
    print("Saved 06_help_dialog.png")
    help_dlg = root_window.findChild(object, "helpDialog")
    if help_dlg:
        QMetaObject.invokeMethod(help_dlg, "close")
    print("=== All 6 UI reviews completed successfully! ===")
    app.quit()


QTimer.singleShot(1500, step1_standby)
sys.exit(app.exec())
