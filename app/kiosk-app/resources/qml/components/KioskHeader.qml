import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property real scaleRatio: 1.0
    property bool isOnline: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.isOnline : true
    property int offlineQueueCount: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.pendingSyncCount : 0
    property string shiftName: "Ca Sáng (08:00 - 17:00)"

    signal adminTriggered()

    implicitHeight: 140 * scaleRatio
    color: Theme.bgSurface

    property int tapCount: 0

    Timer {
        id: resetTapTimer
        interval: 2000
        onTriggered: root.tapCount = 0
    }

    Timer {
        id: clockTimer
        interval: 1000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: {
            var date = new Date()
            timeText.text = date.toLocaleTimeString(Qt.locale("vi_VN"), "hh:mm:ss")
            dateText.text = date.toLocaleDateString(Qt.locale("vi_VN"), "dd/MM/yyyy - dddd")
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.margins: Theme.spaceSm * root.scaleRatio

        // Khối bên trái: Đồng hồ & Ngày tháng
        ColumnLayout {
            Layout.alignment: Qt.AlignVCenter
            spacing: 2 * root.scaleRatio

            Text {
                id: timeText
                font.family: Theme.fontFamily
                font.pixelSize: Math.max(16, 32 * root.scaleRatio)
                font.bold: true
                color: Theme.textPrimary
            }

            Text {
                id: dateText
                font.family: Theme.fontFamily
                font.pixelSize: Math.max(11, 14 * root.scaleRatio)
                color: Theme.textSecondary
            }
        }

        Item { Layout.fillWidth: true }

        // Khối bên phải: Trạng thái mạng, Bộ đệm offline & Ca làm việc
        ColumnLayout {
            Layout.alignment: Qt.AlignVCenter | Qt.AlignRight
            spacing: 6 * root.scaleRatio

            RowLayout {
                Layout.alignment: Qt.AlignRight
                spacing: 8 * root.scaleRatio

                // Đồng bộ offline indicator
                Rectangle {
                    visible: root.offlineQueueCount > 0
                    width: queueText.implicitWidth + (12 * root.scaleRatio)
                    height: Math.max(18, 22 * root.scaleRatio)
                    radius: Theme.radiusFull
                    color: Qt.rgba(Theme.stateAligning.r, Theme.stateAligning.g, Theme.stateAligning.b, 0.2)
                    border.color: Theme.stateAligning
                    border.width: 1

                    Text {
                        id: queueText
                        anchors.centerIn: parent
                        text: "Chờ đồng bộ: " + root.offlineQueueCount
                        font.family: Theme.fontFamily
                        font.pixelSize: Math.max(9, 11 * root.scaleRatio)
                        font.bold: true
                        color: Theme.stateAligning
                    }
                }

                // Trạng thái Mạng
                Rectangle {
                    width: statusRow.implicitWidth + (16 * root.scaleRatio)
                    height: Math.max(20, 24 * root.scaleRatio)
                    radius: Theme.radiusFull
                    color: Qt.rgba(root.isOnline ? Theme.statusOnline.r : Theme.statusOffline.r,
                                   root.isOnline ? Theme.statusOnline.g : Theme.statusOffline.g,
                                   root.isOnline ? Theme.statusOnline.b : Theme.statusOffline.b, 0.15)
                    border.color: root.isOnline ? Theme.statusOnline : Theme.statusOffline
                    border.width: 1

                    RowLayout {
                        id: statusRow
                        anchors.centerIn: parent
                        spacing: 6 * root.scaleRatio

                        Rectangle {
                            width: Math.max(6, 8 * root.scaleRatio)
                            height: Math.max(6, 8 * root.scaleRatio)
                            radius: Theme.radiusFull
                            color: root.isOnline ? Theme.statusOnline : Theme.statusOffline
                        }

                        Text {
                            text: root.isOnline ? "ONLINE" : "OFFLINE"
                            font.family: Theme.fontFamily
                            font.pixelSize: Math.max(9, 11 * root.scaleRatio)
                            font.bold: true
                            color: root.isOnline ? Theme.statusOnline : Theme.statusOffline
                        }
                    }
                }
            }

            // Tên ca làm việc
            Text {
                Layout.alignment: Qt.AlignRight
                text: root.shiftName
                font.family: Theme.fontFamily
                font.pixelSize: Math.max(10, 13 * root.scaleRatio)
                color: Theme.primaryLight
            }
        }
    }

    // Vùng cảm ứng ẩn mở Admin Mode (Chạm 5 lần liên tục)
    MouseArea {
        anchors.fill: parent
        onClicked: {
            root.tapCount++
            resetTapTimer.restart()
            if (root.tapCount >= 5) {
                root.tapCount = 0
                resetTapTimer.stop()
                root.adminTriggered()
            }
        }
    }

    // Đường vạch phân cách bên dưới
    Rectangle {
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        height: 1
        color: Qt.rgba(1, 1, 1, 0.08)
    }
}
