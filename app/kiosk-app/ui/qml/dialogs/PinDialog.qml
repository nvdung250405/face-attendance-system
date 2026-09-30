import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"
import "../components"

Dialog {
    id: pinDialog
    title: "Nhập mã PIN xác thực"
    modal: true
    anchors.centerIn: parent
    width: 360
    height: 480

    ColumnLayout {
        anchors.fill: parent
        spacing: 16

        Label {
            text: (typeof pinController !== "undefined" && pinController) ? pinController.statusMessage : "Nhập PIN"
            Layout.alignment: Qt.AlignHCenter
            font.pixelSize: 13
            color: Theme.textSecondary
        }

        TextField {
            id: pinField
            Layout.fillWidth: true
            echoMode: TextInput.Password
            readOnly: true
            horizontalAlignment: TextInput.AlignHCenter
            font.pixelSize: 22
            text: (typeof pinController !== "undefined" && pinController) ? pinController.currentPin : ""
        }

        VirtualKeypad {
            Layout.alignment: Qt.AlignHCenter
            onDigitClicked: (digit) => {
                if (typeof pinController !== "undefined" && pinController) {
                    pinController.appendDigit(digit)
                }
            }
            onBackspaceClicked: {
                if (typeof pinController !== "undefined" && pinController) {
                    pinController.backspace()
                }
            }
            onClearClicked: {
                if (typeof pinController !== "undefined" && pinController) {
                    pinController.clear()
                }
            }
        }

        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 12

            Button {
                text: "Hủy bỏ"
                onClicked: {
                    if (typeof pinController !== "undefined" && pinController) {
                        pinController.clear()
                    }
                    pinDialog.close()
                }
            }

            Button {
                text: "Xác nhận"
                enabled: (typeof pinController !== "undefined" && pinController) ? (!pinController.isLocked && pinController.currentPin.length >= 4) : false
                onClicked: {
                    if (typeof pinController !== "undefined" && pinController) {
                        pinController.submitPin()
                    }
                }
            }
        }
    }
}
