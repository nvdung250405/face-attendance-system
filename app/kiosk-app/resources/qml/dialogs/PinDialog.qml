import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"
import "../components"

Item {
    id: root
    anchors.fill: parent
    z: 1000
    visible: opacity > 0
    opacity: 0.0

    property bool isOpen: false
    property string activeField: "pin" // "empId" or "pin"

    // Mã nhân viên được lưu trong PinController để gửi kèm mã PIN khi xác thực.
    function employeeCodeText() {
        return (typeof pinController !== "undefined" && pinController) ? pinController.employeeCode : ""
    }
    function setEmployeeCodeText(value) {
        if (typeof pinController !== "undefined" && pinController)
            pinController.setEmployeeCode(value)
    }

    function open() {
        isOpen = true
        opacity = 1.0
        if (typeof pinController !== "undefined" && pinController) {
            pinController.clear()
        }
        cardItem.forceActiveFocus()
    }

    function close() {
        isOpen = false
        opacity = 0.0
        if (typeof pinController !== "undefined" && pinController) {
            pinController.clear()
        }
    }

    Behavior on opacity {
        NumberAnimation { duration: 220; easing.type: Easing.OutCubic }
    }

    Connections {
        target: (typeof pinController !== "undefined" && pinController) ? pinController : null

        function onVerificationSucceeded() {
            root.close()
        }
    }

    // 1. Backdrop Overlay tối 1080x1920
    Rectangle {
        anchors.fill: parent
        color: Qt.rgba(0, 0, 0, 0.65)

        MouseArea {
            anchors.fill: parent
            onClicked: root.close()
        }
    }

    // 2. Thẻ Card Dialog chính giữa (Figma: width 800, height 1200)
    Rectangle {
        id: cardItem
        width: 800
        height: 1200
        anchors.centerIn: parent
        radius: 24
        color: "#FFFFFF"
        border.color: "#E5E7EB"
        border.width: 1
        clip: true

        // Đổ bóng nổi bật
        Rectangle {
            anchors.fill: parent
            anchors.topMargin: 16
            radius: 24
            color: Qt.rgba(0, 0, 0, 0.20)
            z: -1
        }

        MouseArea {
            anchors.fill: parent
            // Chặn click xuyên backdrop
        }

        // Hỗ trợ gõ trực tiếp bàn phím máy tính
        focus: true
        Keys.onPressed: function(event) {
            if (event.key >= Qt.Key_0 && event.key <= Qt.Key_9) {
                var digit = String(event.key - Qt.Key_0)
                if (root.activeField === "empId") {
                    root.setEmployeeCodeText(root.employeeCodeText() + digit)
                } else if (typeof pinController !== "undefined" && pinController) {
                    pinController.appendDigit(digit)
                }
                event.accepted = true
            } else if (event.key === Qt.Key_Backspace) {
                if (root.activeField === "empId") {
                    root.setEmployeeCodeText(root.employeeCodeText().slice(0, -1))
                } else if (typeof pinController !== "undefined" && pinController) {
                    pinController.backspace()
                }
                event.accepted = true
            } else if (event.key === Qt.Key_Tab) {
                root.activeField = (root.activeField === "empId") ? "pin" : "empId"
                event.accepted = true
            } else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) {
                if (root.activeField === "empId") {
                    root.activeField = "pin"
                } else if (typeof pinController !== "undefined" && pinController) {
                    pinController.submitPin()
                }
                event.accepted = true
            } else if (event.key === Qt.Key_Escape) {
                root.close()
                event.accepted = true
            }
        }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 40
            spacing: 22

            // ================= 1. HEADER DIALOG =================
            RowLayout {
                Layout.fillWidth: true

                ColumnLayout {
                    spacing: 6
                    Text {
                        text: "Điểm danh bằng PIN"
                        font.family: Theme.fontFamily
                        font.pixelSize: 32
                        font.bold: true
                        color: Theme.textPrimary
                    }
                    Text {
                        text: "Nhập mã số nhân viên và mã PIN cá nhân của bạn."
                        font.family: Theme.fontFamily
                        font.pixelSize: 16
                        color: Theme.textSecondary
                    }
                }

                Item { Layout.fillWidth: true }

                Rectangle {
                    width: 48
                    height: 48
                    radius: 14
                    color: mouseClose.pressed ? "#E5E7EB" : "#F3F4F6"

                    Text {
                        anchors.centerIn: parent
                        text: "✕"
                        font.pixelSize: 20
                        font.bold: true
                        color: Theme.textSecondary
                    }

                    MouseArea {
                        id: mouseClose
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.close()
                    }
                }
            }

            // ================= 2. Ô NHẬP MÃ SỐ NHÂN VIÊN =================
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 8

                Text {
                    text: "Mã số nhân viên"
                    font.family: Theme.fontFamily
                    font.pixelSize: 16
                    font.bold: true
                    color: Theme.textPrimary
                }

                Rectangle {
                    Layout.fillWidth: true
                    height: 64
                    radius: 14
                    color: "#F5F6F8"
                    border.color: root.activeField === "empId" ? Theme.brandPurple : "transparent"
                    border.width: 2

                    Text {
                        anchors.left: parent.left
                        anchors.leftMargin: 20
                        anchors.verticalCenter: parent.verticalCenter
                        text: root.employeeCodeText().length > 0 ? root.employeeCodeText() : "Nhấp để nhập mã số nhân viên"
                        font.family: Theme.fontFamily
                        font.pixelSize: 18
                        font.bold: root.employeeCodeText().length > 0
                        color: root.employeeCodeText().length > 0 ? Theme.textPrimary : "#9CA3AF"
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.activeField = "empId"
                    }
                }
            }

            // ================= 3. Ô NHẬP MÃ PIN CÁ NHÂN =================
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 8

                Text {
                    text: "Mã PIN cá nhân"
                    font.family: Theme.fontFamily
                    font.pixelSize: 16
                    font.bold: true
                    color: Theme.textPrimary
                }

                Rectangle {
                    Layout.fillWidth: true
                    height: 64
                    radius: 14
                    color: "#F5F6F8"
                    border.color: root.activeField === "pin" ? Theme.brandPurple : "transparent"
                    border.width: 2

                    Text {
                        anchors.left: parent.left
                        anchors.leftMargin: 20
                        anchors.verticalCenter: parent.verticalCenter
                        property int pinLen: (typeof pinController !== "undefined" && pinController) ? pinController.currentPin.length : 0
                        text: pinLen > 0 ? "● ".repeat(pinLen).trim() : "Nhấp để nhập 6 chữ số PIN"
                        font.family: Theme.fontFamily
                        font.pixelSize: pinLen > 0 ? 24 : 18
                        font.bold: pinLen > 0
                        color: pinLen > 0 ? Theme.textPrimary : "#9CA3AF"
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.activeField = "pin"
                    }
                }

                Text {
                    property string msg: (typeof pinController !== "undefined" && pinController && pinController.statusMessage) ? pinController.statusMessage : "Mã PIN được bảo mật an toàn để chống truy cập trái phép."
                    property bool isWarning: (typeof pinController !== "undefined" && pinController) ? (pinController.isLocked || msg.indexOf("Sai") !== -1 || msg.indexOf("khóa") !== -1 || msg.indexOf("phải") !== -1) : false
                    text: msg
                    font.family: Theme.fontFamily
                    font.pixelSize: 14
                    font.bold: isWarning
                    color: isWarning ? "#EF4444" : Theme.textSecondary
                }
            }

            // ================= 4. BÀN PHÍM SỐ VIRTUAL KEYPAD =================
            VirtualKeypad {
                Layout.fillWidth: true
                Layout.topMargin: 4
                enabled: (typeof pinController !== "undefined" && pinController) ? !pinController.isLocked : true
                opacity: enabled ? 1.0 : 0.4
                onDigitClicked: (digit) => {
                    if (root.activeField === "empId") {
                        root.setEmployeeCodeText(root.employeeCodeText() + digit)
                    } else if (typeof pinController !== "undefined" && pinController) {
                        pinController.appendDigit(digit)
                    }
                }
                onBackspaceClicked: {
                    if (root.activeField === "empId") {
                        root.setEmployeeCodeText(root.employeeCodeText().slice(0, -1))
                    } else if (typeof pinController !== "undefined" && pinController) {
                        pinController.backspace()
                    }
                }
                onClearClicked: {
                    if (root.activeField === "empId") {
                        root.setEmployeeCodeText("")
                    } else if (typeof pinController !== "undefined" && pinController) {
                        pinController.clear()
                    }
                }
            }

            // ================= 5. NÚT XÁC NHẬN ĐIỂM DANH =================
            Rectangle {
                Layout.fillWidth: true
                height: 64
                radius: 14

                property bool isReady: (typeof pinController !== "undefined" && pinController) ? (!pinController.isLocked && pinController.currentPin.length >= 6) : false
                color: isReady ? (mouseConfirm.pressed ? Qt.darker(Theme.brandPurple, 1.15) : Theme.brandPurple) : "#E0E7FF"

                Text {
                    anchors.centerIn: parent
                    text: "Xác nhận điểm danh"
                    font.family: Theme.fontFamily
                    font.pixelSize: 20
                    font.bold: true
                    color: parent.isReady ? "#FFFFFF" : "#6366F1"
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
                    }
                }
            }

            Item { Layout.fillHeight: true }

            // ================= 6. FOOTER: HỦY =================
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Hủy • Esc"
                font.family: Theme.fontFamily
                font.pixelSize: 16
                font.weight: Font.DemiBold
                color: "#6B7280"

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.close()
                }
            }
        }
    }
}
