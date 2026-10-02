import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: header
    height: 72
    color: Theme.headerBg
    radius: 14
    border.color: Theme.headerBorder
    border.width: 1

    property string currentTimeString: "00:00:00"
    property string currentDateString: "Đang tải..."

    function updateDateTime() {
        var now = new Date()
        var h = ("0" + now.getHours()).slice(-2)
        var m = ("0" + now.getMinutes()).slice(-2)
        var s = ("0" + now.getSeconds()).slice(-2)
        currentTimeString = h + ":" + m + ":" + s

        var dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
        var dName = dayNames[now.getDay()]
        var d = ("0" + now.getDate()).slice(-2)
        var mo = ("0" + (now.getMonth() + 1)).slice(-2)
        var y = now.getFullYear()
        currentDateString = dName + ", " + d + "/" + mo + "/" + y
    }

    Timer {
        interval: 1000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: header.updateDateTime()
    }

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 20
        anchors.rightMargin: 20
        spacing: 16

        // 1. Bên trái: Logo và tiêu đề hệ thống
        RowLayout {
            spacing: 12
            Layout.alignment: Qt.AlignVCenter

            Rectangle {
                width: 44
                height: 44
                radius: 10
                color: Theme.mantleColor

                Text {
                    anchors.centerIn: parent
                    text: "📷"
                    font.pixelSize: 22
                }
            }

            ColumnLayout {
                spacing: 2
                Text {
                    text: "MÁY CHẤM CÔNG KIOSK"
                    font.pixelSize: 18
                    font.bold: true
                    color: Theme.headerText
                }
                Text {
                    text: "HỆ THỐNG XÁC THỰC SINH TRẮC HỌC FAS"
                    font.pixelSize: 11
                    font.letterSpacing: 0.5
                    color: Theme.headerSubtext
                }
            }
        }

        Item { Layout.fillWidth: true }

        // 2. Ở giữa: Đồng hồ thời gian thực cỡ lớn
        RowLayout {
            spacing: 8
            Layout.alignment: Qt.AlignVCenter

            Text {
                text: header.currentTimeString
                font.pixelSize: 24
                font.bold: true
                color: Theme.headerText
            }

            Text {
                text: "•"
                font.pixelSize: 20
                color: Theme.headerSubtext
            }

            Text {
                text: header.currentDateString
                font.pixelSize: 16
                font.bold: true
                color: Theme.headerSubtext
            }
        }

        Item { Layout.fillWidth: true }

        // 3. Bên phải: Trạng thái máy & Mạng
        RowLayout {
            spacing: 10
            Layout.alignment: Qt.AlignVCenter

            // Chip định danh Kiosk
            Rectangle {
                height: 36
                width: kioskText.width + 20
                radius: 8
                color: "#F0F2F6"
                border.color: "#DCE0E8"
                border.width: 1

                Text {
                    id: kioskText
                    anchors.centerIn: parent
                    text: "Thiết bị: " + ((typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.kioskId : "KIOSK-01")
                    font.pixelSize: 13
                    font.bold: true
                    color: Theme.headerText
                }
            }

            // Chip trạng thái mạng Online / Offline
            Rectangle {
                height: 36
                width: statusRow.width + 20
                radius: 8
                property bool isOnline: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.isOnline : true
                color: isOnline ? "#E8F8EE" : "#FFF4E5"
                border.color: isOnline ? "#A6E3A1" : "#F9E2AF"
                border.width: 1

                RowLayout {
                    id: statusRow
                    anchors.centerIn: parent
                    spacing: 6

                    Rectangle {
                        width: 8
                        height: 8
                        radius: 4
                        color: parent.parent.isOnline ? "#40A02B" : "#DF8E1D"
                    }

                    Text {
                        text: parent.parent.isOnline ? "Trực tuyến" : "Ngoại tuyến"
                        font.pixelSize: 13
                        font.bold: true
                        color: parent.parent.isOnline ? "#40A02B" : "#DF8E1D"
                    }
                }
            }

            // Chip hiển thị số bản ghi chờ đồng bộ (nếu có)
            Rectangle {
                height: 36
                width: syncRow.width + 16
                radius: 8
                visible: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.pendingSyncCount > 0 : false
                color: "#FFF4E5"
                border.color: "#F9E2AF"
                border.width: 1

                RowLayout {
                    id: syncRow
                    anchors.centerIn: parent
                    spacing: 6

                    Text {
                        text: "🔄 Chờ gửi: " + ((typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.pendingSyncCount : 0)
                        font.pixelSize: 12
                        font.bold: true
                        color: "#DF8E1D"
                    }
                }
            }
        }
    }
}
