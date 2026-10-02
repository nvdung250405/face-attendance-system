import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property string organizationName: "NVD"
    property string stationTitle: "Trạm sảnh chính"
    property string stationSubtitle: "NVD-K01 • Tầng 1"
    property bool isOnline: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.isOnline : true
    property int offlineCount: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.pendingSyncCount : 0

    implicitWidth: Theme.canvasWidth - (Theme.canvasPadding * 2) // 968px
    implicitHeight: Theme.headerHeight                           // 120px
    radius: Theme.radiusLg                                       // 18px
    color: Theme.bgCard                                          // #FFFFFF

    // Đổ bóng mềm Drop shadow theo chuẩn Figma
    Rectangle {
        anchors.fill: parent
        anchors.topMargin: 4
        radius: root.radius
        color: Qt.rgba(0.067, 0.094, 0.153, 0.06)
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
            clockText.text = Qt.formatTime(date, "hh:mm:ss")
            dateText.text = Qt.formatDate(date, "dddd, dd/MM/yyyy")
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 24
        anchors.rightMargin: 24
        spacing: 0

        // 1. Nhận diện tổ chức (AI Logo + AN HÒA • TRẠM ĐIỂM DANH)
        RowLayout {
            Layout.alignment: Qt.AlignVCenter
            spacing: 16

            Rectangle {
                width: 56
                height: 56
                radius: 14
                color: Theme.brandPurple // Solid #7567FF

                Text {
                    anchors.centerIn: parent
                    text: "AI"
                    font.family: Theme.fontFamily
                    font.pixelSize: 26
                    font.bold: true
                    color: "#FFFFFF"
                }
            }

            ColumnLayout {
                spacing: 2
                Text {
                    text: root.organizationName
                    font.family: Theme.fontFamily
                    font.pixelSize: 24
                    font.bold: true
                    color: Theme.textPrimary
                }
                Text {
                    text: "TRẠM ĐIỂM DANH"
                    font.family: Theme.fontFamily
                    font.pixelSize: 12
                    font.weight: Font.DemiBold
                    color: Theme.textSecondary
                }
            }
        }

        Item {
            Layout.fillWidth: true
        }

        // 2. Trạm Kiosk (Trạm sảnh chính • AH-K01 • Tầng 1)
        ColumnLayout {
            Layout.alignment: Qt.AlignVCenter
            spacing: 2

            Text {
                text: root.stationTitle
                font.family: Theme.fontFamily
                font.pixelSize: 22
                font.bold: true
                color: Theme.textPrimary
            }

            Text {
                text: root.stationSubtitle
                font.family: Theme.fontFamily
                font.pixelSize: 14
                color: Theme.textSecondary
            }
        }

        Item {
            Layout.fillWidth: true
        }

        // 3. Đồng hồ số và Lịch ngày (Clock and date)
        ColumnLayout {
            Layout.alignment: Qt.AlignVCenter
            spacing: 4

            Text {
                id: clockText
                text: "08:42:15"
                font.family: Theme.fontFamily
                font.pixelSize: Theme.fontClockHeader // 34px
                font.bold: true
                color: Theme.textPrimary
            }

            Text {
                id: dateText
                text: "Thứ Hai, 26/09/2026"
                font.family: Theme.fontFamily
                font.pixelSize: 16
                color: Theme.textSecondary
            }
        }

        Item {
            Layout.fillWidth: true
        }

        // 4. Huy hiệu mạng (Network badge)
        Rectangle {
            Layout.alignment: Qt.AlignVCenter
            width: Math.max(140, networkContent.implicitWidth + 28)
            height: 48
            radius: 24 // Full pill shape
            color: root.isOnline ? "#E8F7ED" : (root.offlineCount > 0 ? Theme.statusWarningBg : Theme.statusErrorBg)

            RowLayout {
                id: networkContent
                anchors.centerIn: parent
                spacing: 8

                Rectangle {
                    width: 8
                    height: 8
                    radius: 4
                    color: root.isOnline ? "#20A464" : (root.offlineCount > 0 ? Theme.statusWarning : Theme.statusError)
                }

                Text {
                    text: root.isOnline ? "Trực tuyến" : (root.offlineCount > 0 ? "Chờ đồng bộ: " + root.offlineCount : "Ngoại tuyến")
                    font.family: Theme.fontFamily
                    font.pixelSize: 15
                    font.bold: true
                    color: root.isOnline ? "#159447" : (root.offlineCount > 0 ? Theme.statusWarning : Theme.statusError)
                }
            }
        }
    }
}
