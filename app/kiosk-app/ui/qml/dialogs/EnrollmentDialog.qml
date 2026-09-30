import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"
import "../components"

Dialog {
    id: enrollDialog
    title: "Đăng ký khuôn mặt mới"
    modal: true
    anchors.centerIn: parent
    width: 440
    height: 520

    ColumnLayout {
        anchors.fill: parent
        spacing: 16

        Label {
            text: (typeof enrollmentController !== "undefined") ? enrollmentController.statusMessage : "Đăng ký"
            Layout.alignment: Qt.AlignHCenter
            font.pixelSize: 14
            color: Theme.textPrimary
        }

        ProgressBar {
            Layout.fillWidth: true
            value: (typeof enrollmentController !== "undefined") ? enrollmentController.progressPercent : 0.0
        }

        Button {
            text: "Đóng"
            Layout.alignment: Qt.AlignHCenter
            onClicked: enrollDialog.close()
        }
    }
}
