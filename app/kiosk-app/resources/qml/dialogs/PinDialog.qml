import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"
import "../components"

Dialog {
    id: pinDialog
    modal: true
    anchors.centerIn: parent
    width: 640
    height: 960
    padding: 0
    closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside

    property string activeField: "pin" // "empId" or "pin"
    property string employeeIdInput: "1001"

    background: Rectangle {
        radius: 20
        color: Theme.bgCard
        border.color: "#E5E7EB"
        border.width: 1

        Rectangle {
            anchors.fill: parent
            anchors.topMargin: 16
            radius: 20
            color: Qt.rgba(0.067, 0.094, 0.153, 0.25)
            z: -1
        }
    }

    contentItem: ColumnLayout {
        spacing: 16
        anchors.fill: parent
        anchors.margins: 36

        // 1. Tiêu đề Dialog & Nút đóng [X]
        RowLayout {
            Layout.fillWidth: true

            ColumnLayout {
                spacing: 6
                Text {
                    text: "Điểm danh bằng PIN"
                    font.family: Theme.fontFamily
                    font.pixelSize: 30
                    font.bold: true
                    color: Theme.textPrimary
                }
                Text {
                    text: "Nhập mã số nhân viên và mã PIN cá nhân của bạn."
                    font.family: Theme.fontFamily
                    font.pixelSize: 15
                    color: Theme.textSecondary
                }
            }

            Item { Layout.fillWidth: true }

            Rectangle {
                width: 44
                height: 44
                radius: 12
                color: "#F5F6F8"

                Text {
                    anchors.centerIn: parent
                    text: "✕"
                    font.pixelSize: 18
                    color: Theme.textSecondary
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        if (typeof pinController !== "undefined" && pinController) {
                            pinController.clear()
                        }
                        pinDialog.close()
                    }
                }
            }
        }

        // 2. Ô nhập Mã số nhân viên
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 6

            Text {
                text: "Mã số nhân viên"
                font.family: Theme.fontFamily
                font.pixelSize: 15
                font.bold: true
                color: Theme.textPrimary
            }

            Rectangle {
                Layout.fillWidth: true
                height: 54
                radius: 12
                color: "#F5F6F8"
                border.color: pinDialog.activeField === "empId" ? Theme.brandPurple : "transparent"
                border.width: 1.5

                Text {
                    anchors.left: parent.left
                    anchors.leftMargin: 18
                    anchors.verticalCenter: parent.verticalCenter
                    text: pinDialog.employeeIdInput.length > 0 ? pinDialog.employeeIdInput : "Nhập mã số nhân viên"
                    font.family: Theme.fontFamily
                    font.pixelSize: 16
                    font.bold: pinDialog.employeeIdInput.length > 0
                    color: pinDialog.employeeIdInput.length > 0 ? Theme.textPrimary : "#9CA3AF"
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: pinDialog.activeField = "empId"
                }
            }
        }

        // 3. Ô nhập Mã PIN cá nhân (active border tím)
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 6

            Text {
                text: "Mã PIN cá nhân"
                font.family: Theme.fontFamily
                font.pixelSize: 15
                font.bold: true
                color: Theme.textPrimary
            }

            Rectangle {
                Layout.fillWidth: true
                height: 54
                radius: 12
                color: "#F5F6F8"
                border.color: pinDialog.activeField === "pin" ? Theme.brandPurple : "transparent"
                border.width: 1.5

                Text {
                    anchors.left: parent.left
                    anchors.leftMargin: 18
                    anchors.verticalCenter: parent.verticalCenter
                    property int pinLen: (typeof pinController !== "undefined" && pinController) ? pinController.currentPin.length : 0
                    text: pinLen > 0 ? "● ".repeat(pinLen).trim() : "Nhập 4–6 chữ số"
                    font.family: Theme.fontFamily
                    font.pixelSize: pinLen > 0 ? 20 : 16
                    font.bold: pinLen > 0
                    color: pinLen > 0 ? Theme.textPrimary : "#9CA3AF"
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: pinDialog.activeField = "pin"
                }
            }

            Text {
                text: "Mã PIN được ẩn để bảo vệ thông tin của bạn."
                font.family: Theme.fontFamily
                font.pixelSize: 13
                color: Theme.textSecondary
            }
        }

        // 4. Bàn phím số chuẩn Figma
        VirtualKeypad {
            Layout.fillWidth: true
            onDigitClicked: (digit) => {
                if (pinDialog.activeField === "empId") {
                    pinDialog.employeeIdInput += digit
                } else if (typeof pinController !== "undefined" && pinController) {
                    pinController.appendDigit(digit)
                }
            }
            onBackspaceClicked: {
                if (pinDialog.activeField === "empId") {
                    pinDialog.employeeIdInput = pinDialog.employeeIdInput.slice(0, -1)
                } else if (typeof pinController !== "undefined" && pinController) {
                    pinController.backspace()
                }
            }
            onClearClicked: {
                if (pinDialog.activeField === "empId") {
                    pinDialog.employeeIdInput = ""
                } else if (typeof pinController !== "undefined" && pinController) {
                    pinController.clear()
                }
            }
        }

        // 5. Nút bấm Xác nhận điểm danh
        Rectangle {
            Layout.fillWidth: true
            height: 56
            radius: 12

            property bool isReady: (typeof pinController !== "undefined" && pinController) ? (!pinController.isLocked && pinController.currentPin.length >= 4) : false
            color: isReady ? (mouseConfirm.pressed ? Qt.darker(Theme.brandPurple, 1.15) : Theme.brandPurple) : "#F5F6F8"

            Text {
                anchors.centerIn: parent
                text: "Xác nhận điểm danh"
                font.family: Theme.fontFamily
                font.pixelSize: 18
                font.bold: true
                color: parent.isReady ? "#FFFFFF" : "#6B7280"
            }

            MouseArea {
                id: mouseConfirm
                anchors.fill: parent
                enabled: parent.isReady
                cursorShape: parent.isReady ? Qt.PointingHandCursor : Qt.ArrowCursor
                onClicked: {
                    if (typeof pinController !== "undefined" && pinController) {
                        pinController.submitPin()
                    }
                    pinDialog.close()
                }
            }
        }

        // 6. Link Hủy • Esc
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Hủy • Esc"
            font.family: Theme.fontFamily
            font.pixelSize: 16
            font.weight: Font.DemiBold
            color: "#4B5563"

            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    if (typeof pinController !== "undefined" && pinController) {
                        pinController.clear()
                    }
                    pinDialog.close()
                }
            }
        }
    }
}
