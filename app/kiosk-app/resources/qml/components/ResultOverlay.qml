import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property real scaleRatio: 1.0
    property bool isSuccess: true
    property string employeeName: "Nhân viên"
    property string employeeId: "NV-0000"
    property string department: "Nhân sự"
    property string timestamp: "08:00:00"
    property string checkType: "VÀO CA"

    signal dismissed()

    anchors.fill: parent
    color: Theme.bgOverlay
    visible: opacity > 0
    opacity: 0

    Behavior on opacity {
        NumberAnimation { duration: 200 }
    }

    Timer {
        id: autoHideTimer
        interval: 2500
        repeat: false
        onTriggered: root.hide()
    }

    function show() {
        root.opacity = 1.0
        autoHideTimer.restart()
    }

    function hide() {
        root.opacity = 0.0
        root.dismissed()
    }

    // Card Nội dung chính
    Rectangle {
        width: Math.min(parent.width * 0.90, 480 * Math.max(0.65, root.scaleRatio))
        height: Math.min(parent.height * 0.80, 520 * Math.max(0.65, root.scaleRatio))
        anchors.centerIn: parent
        radius: Math.max(16, Theme.radiusLg * root.scaleRatio)
        color: Theme.bgSurface
        border.color: root.isSuccess ? Theme.stateSuccess : Theme.stateError
        border.width: 2

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: Math.max(14, Theme.spaceLg * root.scaleRatio)
            spacing: Math.max(8, Theme.spaceSm * root.scaleRatio)

            // Icon Trạng thái
            Rectangle {
                Layout.alignment: Qt.AlignHCenter
                width: Math.max(48, 64 * root.scaleRatio)
                height: Math.max(48, 64 * root.scaleRatio)
                radius: Theme.radiusFull
                color: root.isSuccess ? Theme.stateSuccess : Theme.stateError

                Text {
                    anchors.centerIn: parent
                    text: root.isSuccess ? "✓" : "✕"
                    font.pixelSize: Math.max(24, 32 * root.scaleRatio)
                    font.bold: true
                    color: Theme.textPrimary
                }
            }

            // Avatar Nhân viên
            Rectangle {
                Layout.alignment: Qt.AlignHCenter
                width: Math.max(80, 110 * root.scaleRatio)
                height: Math.max(80, 110 * root.scaleRatio)
                radius: Theme.radiusFull
                color: Theme.bgCard
                border.color: Theme.primary
                border.width: Math.max(1.5, 2 * root.scaleRatio)

                Text {
                    anchors.centerIn: parent
                    text: "AVATAR"
                    font.family: Theme.fontFamily
                    font.pixelSize: Math.max(10, 12 * root.scaleRatio)
                    font.bold: true
                    color: Theme.textMuted
                }
            }

            // Thông tin Nhân viên
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: root.employeeName
                font.family: Theme.fontFamily
                font.pixelSize: Math.max(16, 22 * root.scaleRatio)
                font.bold: true
                color: Theme.textPrimary
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: root.employeeId + " | " + root.department
                font.family: Theme.fontFamily
                font.pixelSize: Math.max(12, 14 * root.scaleRatio)
                color: Theme.textSecondary
            }

            // Vạch phân cách
            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: Qt.rgba(1, 1, 1, 0.1)
            }

            // Thời gian & Loại ghi nhận
            RowLayout {
                Layout.fillWidth: true

                ColumnLayout {
                    spacing: 2
                    Text {
                        text: "Thời gian ghi nhận"
                        font.family: Theme.fontFamily
                        font.pixelSize: Math.max(10, 12 * root.scaleRatio)
                        color: Theme.textMuted
                    }
                    Text {
                        text: root.timestamp
                        font.family: Theme.fontFamily
                        font.pixelSize: Math.max(14, 18 * root.scaleRatio)
                        font.bold: true
                        color: Theme.textPrimary
                    }
                }

                Item { Layout.fillWidth: true }

                Rectangle {
                    width: checkTypeText.implicitWidth + (20 * root.scaleRatio)
                    height: Math.max(28, 36 * root.scaleRatio)
                    radius: Math.max(6, Theme.radiusSm * root.scaleRatio)
                    color: Qt.rgba(Theme.primary.r, Theme.primary.g, Theme.primary.b, 0.2)

                    Text {
                        id: checkTypeText
                        anchors.centerIn: parent
                        text: root.checkType
                        font.family: Theme.fontFamily
                        font.pixelSize: Math.max(11, 14 * root.scaleRatio)
                        font.bold: true
                        color: Theme.primaryLight
                    }
                }
            }
        }
    }

    MouseArea {
        anchors.fill: parent
        onClicked: root.hide()
    }
}
