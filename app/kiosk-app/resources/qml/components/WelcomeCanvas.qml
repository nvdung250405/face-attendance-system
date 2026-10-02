import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property string organizationGreeting: "Chào mừng bạn đến với FAS Kiosk"
    property string currentShift: "Ca làm việc: 08:00 - 17:30"

    implicitWidth: Theme.canvasWidth - (Theme.canvasPadding * 2) // 968px
    implicitHeight: Theme.mainViewportHeight                     // 1496px
    radius: Theme.radiusXl                                       // 20px
    color: Theme.bgCard                                          // #FFFFFF
    clip: true

    // Đổ bóng mềm thẻ nổi
    Rectangle {
        anchors.fill: parent
        anchors.topMargin: 4
        radius: root.radius
        color: Qt.rgba(0.067, 0.094, 0.153, 0.05)
        z: -1
    }

    Timer {
        id: timeTimer
        interval: 1000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: {
            var d = new Date()
            giantClock.text = Qt.formatTime(d, "hh:mm:ss")
            giantDate.text = Qt.formatDate(d, "dddd, dd 'tháng' MM 'năm' yyyy")
        }
    }

    // 1. Quầng trang trí góc trên phải theo chuẩn Figma (Top-right ambient blob)
    Rectangle {
        width: 650
        height: 650
        radius: 325
        x: parent.width - 320
        y: -180
        color: "#EEF2FF"
        opacity: 0.8
    }

    // 2. Nội dung chính trung tâm theo đúng Figma Frame 5:23526
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 48
        spacing: 28

        Item { Layout.fillHeight: true }

        // Logo thương hiệu AI vuông bo góc tím đậm
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: 96
            height: 96
            radius: 24
            color: Theme.brandPurple

            Text {
                anchors.centerIn: parent
                text: "AI"
                font.family: Theme.fontFamily
                font.pixelSize: 44
                font.bold: true
                color: "#FFFFFF"
            }
        }

        // Tên thương hiệu NVD • TRẠM ĐIỂM DANH
        ColumnLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 4

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "NVD"
                font.family: Theme.fontFamily
                font.pixelSize: 28
                font.bold: true
                color: Theme.textPrimary
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "TRẠM ĐIỂM DANH"
                font.family: Theme.fontFamily
                font.pixelSize: 13
                font.weight: Font.DemiBold
                color: Theme.textSecondary
            }
        }

        // Lời chào mừng 2 dòng
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Chào mừng bạn đến với cơ quan\n/ doanh nghiệp"
            font.family: Theme.fontFamily
            font.pixelSize: 34
            font.bold: true
            color: Theme.textPrimary
            horizontalAlignment: Text.AlignHCenter
            lineHeight: 1.25
        }

        // Vị trí trạm
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "NVD • Sảnh chính"
            font.family: Theme.fontFamily
            font.pixelSize: 18
            color: Theme.textSecondary
        }

        // Đồng hồ số khổng lồ (Giant Clock 72px)
        ColumnLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 8

            Text {
                id: giantClock
                Layout.alignment: Qt.AlignHCenter
                text: "07:58:32"
                font.family: Theme.fontFamily
                font.pixelSize: 72
                font.bold: true
                color: Theme.textPrimary
                horizontalAlignment: Text.AlignHCenter
            }

            Text {
                id: giantDate
                Layout.alignment: Qt.AlignHCenter
                text: "Thứ Năm, ngày 01 tháng 10 năm 2026"
                font.family: Theme.fontFamily
                font.pixelSize: 18
                color: Theme.textSecondary
                horizontalAlignment: Text.AlignHCenter
            }
        }

        // Thẻ ca kíp sáng: 08:00 – 12:00
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: Math.max(380, shiftRow.implicitWidth + 48)
            height: 64
            radius: 16
            color: "#F8F9FA"
            border.color: "#E5E7EB"
            border.width: 1

            RowLayout {
                id: shiftRow
                anchors.centerIn: parent
                spacing: 12

                Text {
                    text: "☼"
                    font.pixelSize: 22
                    color: Theme.brandPurple
                }

                Text {
                    text: "Ca sáng: 08:00 – 12:00"
                    font.family: Theme.fontFamily
                    font.pixelSize: 19
                    font.bold: true
                    color: Theme.textPrimary
                }
            }
        }

        Item { Layout.fillHeight: true }

        // 3. Dải chỉ dẫn bước tới trạm (Footsteps Pill)
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.fillWidth: true
            height: 84
            radius: 16
            color: "#EEF2FF"

            RowLayout {
                anchors.centerIn: parent
                spacing: 16

                Text {
                    text: "👣"
                    font.pixelSize: 24
                }

                Text {
                    text: "Vui lòng bước tới trước trạm để điểm danh"
                    font.family: Theme.fontFamily
                    font.pixelSize: 20
                    font.bold: true
                    color: Theme.textPrimary
                }
            }
        }
    }
}
