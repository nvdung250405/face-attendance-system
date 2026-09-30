import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "theme"
import "components"
import "dialogs"

ApplicationWindow {
    id: window
    visible: true
    width: 1024
    height: 768
    minimumWidth: 800
    minimumHeight: 600
    title: "Trạm Điểm Danh Sinh Trắc Học FAS Kiosk"
    color: Theme.baseColor

    // LiveCanvas hiển thị camera và viền Oval
    LiveCanvas {
        id: liveCanvas
        anchors.fill: parent
    }

    // Nút bấm tiện ích phía dưới
    RowLayout {
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: 30
        spacing: 20

        Button {
            text: "Quẹt mã PIN"
            font.pixelSize: 14
            onClicked: {
                if (typeof kioskViewModel !== "undefined") {
                    kioskViewModel.requestPinFallback()
                }
            }
        }

        Button {
            text: "Đăng ký mới"
            font.pixelSize: 14
            onClicked: {
                if (typeof kioskViewModel !== "undefined") {
                    kioskViewModel.requestEnrollment()
                }
            }
        }
    }

    // Hộp thoại quẹt PIN khẩn cấp
    PinDialog {
        id: pinDialog
    }

    // Hộp thoại tự đăng ký nhân viên mới
    EnrollmentDialog {
        id: enrollmentDialog
    }

    Connections {
        target: (typeof kioskViewModel !== "undefined") ? kioskViewModel : null
        function onOpenPinDialogRequested() {
            pinDialog.open()
        }
        function onOpenEnrollmentDialogRequested() {
            enrollmentDialog.open()
        }
    }
}

