import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property string kioskId: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.kioskId) ? kioskViewModel.kioskId : "KIOSK-LOBBY-01"
    property bool isOnline: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.isOnline : true
    property int offlineCount: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.pendingSyncCount : 0

    implicitHeight: 90
    radius: Theme.radiusMd
    color: Theme.bgCard

    // Đổ bóng mềm nhẹ giống CSS box-shadow: 0 2px 8px rgba(0,0,0,.08)
    Rectangle {
        anchors.fill: parent
        anchors.topMargin: 2
        radius: root.radius
        color: Qt.rgba(0, 0, 0, 0.06)
        z: -1
    }

    Timer {
        id: clockTimer
        interval: 1000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: {
            var date = new Date()
            clockText.text = date.toLocaleTimeString(Qt.locale("vi_VN"), "hh:mm:ss")
            dateText.text = date.toLocaleDateString(Qt.locale("vi_VN"), "dddd, dd/MM/yyyy")
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 28
        anchors.rightMargin: 28
        anchors.topMargin: 12
        anchors.bottomMargin: 12

        // Khối bên trái: Đồng hồ to và Thứ ngày tháng
        ColumnLayout {
            Layout.alignment: Qt.AlignVCenter
            spacing: 4

            Text {
                id: clockText
                text: "08:42:15"
                font.family: Theme.fontFamily
                font.pixelSize: 34
                font.bold: true
                color: Theme.textDark
            }

            Text {
                id: dateText
                text: "Thứ Hai, 26/09/2026"
                font.family: Theme.fontFamily
                font.pixelSize: 16
                color: Theme.textMuted
            }
        }

        Item {
            Layout.fillWidth: true
        }

        // Khối bên phải: Mã Kiosk & Trạng thái kết nối
        ColumnLayout {
            Layout.alignment: Qt.AlignVCenter | Qt.AlignRight
            spacing: 6

            Text {
                Layout.alignment: Qt.AlignRight
                text: root.kioskId
                font.family: Theme.fontFamily
                font.pixelSize: 14
                font.bold: true
                color: Theme.textSubtle
            }

            RowLayout {
                Layout.alignment: Qt.AlignRight
                spacing: 8

                // Badge chờ đồng bộ offline nếu có
                Rectangle {
                    visible: root.offlineCount > 0
                    width: offlineText.implicitWidth + 12
                    height: 20
                    radius: Theme.radiusFull
                    color: Theme.stateAligningBg
                    border.color: Theme.stateAligning

                    Text {
                        id: offlineText
                        anchors.centerIn: parent
                        text: "Chờ đồng bộ: " + root.offlineCount
                        font.family: Theme.fontFamily
                        font.pixelSize: 11
                        font.bold: true
                        color: Theme.stateAligning
                    }
                }

                Text {
                    text: root.isOnline ? "● Online" : "● Offline"
                    font.family: Theme.fontFamily
                    font.pixelSize: 14
                    font.bold: true
                    color: root.isOnline ? Theme.onlineGreen : Theme.stateError
                }
            }
        }
    }
}
