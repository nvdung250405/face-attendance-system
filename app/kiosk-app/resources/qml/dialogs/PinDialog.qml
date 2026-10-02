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
    height: 860
    padding: 0
    closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside

    background: Rectangle {
        radius: Theme.radiusXl // 20px
        color: Theme.bgCard
        border.color: Theme.bgCanvas
        border.width: 1

        // Drop shadow nền
        Rectangle {
            anchors.fill: parent
            anchors.topMargin: 16
            radius: Theme.radiusXl
            color: Qt.rgba(0.067, 0.094, 0.153, 0.25)
            z: -1
        }
    }

    contentItem: ColumnLayout {
        spacing: 24

        // 1. Tiêu đề Dialog & Nút đóng [X]
        RowLayout {
            Layout.fillWidth: true
            Layout.leftMargin: 36
            Layout.rightMargin: 36
            Layout.topMargin: 32

            ColumnLayout {
                spacing: 4
                Text {
                    text: "Điểm danh bằng PIN"
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontTitleLg // 38px
                    font.weight: Font.DemiBold
                    color: Theme.textPrimary
                }
                Text {
                    text: (typeof pinController !== "undefined" && pinController) ? pinController.statusMessage : "Nhập mã số nhân viên và mã PIN của bạn"
                    font.family: Theme.fontFamily
                    font.pixelSize: 18
                    color: Theme.textSecondary
                }
            }

            Item { Layout.fillWidth: true }

            Rectangle {
                width: 48
                height: 48
                radius: Theme.radiusMd
                color: Theme.bgCanvas

                Text {
                    anchors.centerIn: parent
                    text: "✕"
                    font.pixelSize: 20
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

        // 2. Ô hiển thị mã PIN dạng chấm tròn bảo mật
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 540
            Layout.preferredHeight: 76
            radius: Theme.radiusMd
            color: Theme.bgCanvas

            RowLayout {
                anchors.centerIn: parent
                spacing: 16

                Repeater {
                    model: 6
                    delegate: Rectangle {
                        width: 20
                        height: 20
                        radius: 10
                        color: {
                            var pinLen = (typeof pinController !== "undefined" && pinController) ? pinController.currentPin.length : 0
                            return index < pinLen ? Theme.brandPurple : Qt.rgba(0.459, 0.404, 1.0, 0.20)
                        }
                    }
                }
            }
        }

        // 3. Bàn phím số cảm ứng lớn chuẩn Fitts
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

        // 4. Nút bấm Xác nhận điểm danh toàn chiều rộng
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 540
            Layout.preferredHeight: 64
            Layout.bottomMargin: 32
            radius: Theme.radiusMd

            property bool isReady: (typeof pinController !== "undefined" && pinController) ? (!pinController.isLocked && pinController.currentPin.length >= 4) : false
            color: isReady ? (mouseConfirm.pressed ? Qt.darker(Theme.brandPurple, 1.15) : Theme.brandPurple) : Theme.bgCanvas

            Behavior on color {
                ColorAnimation { duration: 150 }
            }

            Text {
                anchors.centerIn: parent
                text: "Xác nhận điểm danh"
                font.family: Theme.fontFamily
                font.pixelSize: 22
                font.weight: Font.DemiBold
                color: parent.isReady ? "#FFFFFF" : Theme.textSubtle
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
    }
}
