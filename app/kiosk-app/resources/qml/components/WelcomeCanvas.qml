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

    // 1. Quầng sáng Ambient Halo thở nhẹ nhàng (Figma 700x700px, 12% opacity)
    Item {
        id: haloContainer
        anchors.centerIn: parent
        width: Theme.haloSize
        height: Theme.haloSize

        Rectangle {
            id: haloCircle
            anchors.fill: parent
            radius: Theme.radiusFull
            color: Theme.brandPurple
            opacity: 0.12

            SequentialAnimation on opacity {
                loops: Animation.Infinite
                running: true
                NumberAnimation { to: 0.18; duration: 2500; easing.type: Easing.InOutQuad }
                NumberAnimation { to: 0.08; duration: 2500; easing.type: Easing.InOutQuad }
            }

            SequentialAnimation on scale {
                loops: Animation.Infinite
                running: true
                NumberAnimation { to: 1.05; duration: 3000; easing.type: Easing.InOutQuad }
                NumberAnimation { to: 0.95; duration: 3000; easing.type: Easing.InOutQuad }
            }
        }
    }

    // 2. Nội dung chính trung tâm (Padding 64px, Spacing 64px)
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 64
        spacing: 48

        Item { Layout.fillHeight: true }

        // Biểu tượng Logo đơn vị cỡ lớn
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: 120
            height: 120
            radius: 30
            color: Theme.brandPurpleSoft

            Text {
                anchors.centerIn: parent
                text: "⬡"
                font.family: Theme.fontFamily
                font.pixelSize: 60
                color: Theme.brandPurple
            }
        }

        // Lời chào mừng
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: root.organizationGreeting
            font.family: Theme.fontFamily
            font.pixelSize: 30
            font.weight: Font.DemiBold
            color: Theme.textPrimary
            horizontalAlignment: Text.AlignHCenter
        }

        // Đồng hồ số khổng lồ (Giant Clock 64px)
        ColumnLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 12

            Text {
                id: giantClock
                Layout.alignment: Qt.AlignHCenter
                text: "08:42:15"
                font.family: Theme.fontFamily
                font.pixelSize: Theme.fontClockGiant // 64px
                font.bold: true
                color: Theme.textPrimary
                horizontalAlignment: Text.AlignHCenter
            }

            Text {
                id: giantDate
                Layout.alignment: Qt.AlignHCenter
                text: "Thứ Hai, 26 tháng 09 năm 2026"
                font.family: Theme.fontFamily
                font.pixelSize: Theme.fontHeading // 26px
                color: Theme.textSecondary
                horizontalAlignment: Text.AlignHCenter
            }
        }

        // Thẻ ca kíp làm việc hiện tại
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: shiftRow.implicitWidth + 48
            height: 60
            radius: Theme.radiusMd
            color: Theme.bgCanvas

            RowLayout {
                id: shiftRow
                anchors.centerIn: parent
                spacing: 12

                Text {
                    text: "⏰"
                    font.pixelSize: 22
                }

                Text {
                    text: root.currentShift
                    font.family: Theme.fontFamily
                    font.pixelSize: 20
                    font.weight: Font.DemiBold
                    color: Theme.textPrimary
                }
            }
        }

        Item { Layout.fillHeight: true }

        // 3. Thanh hướng dẫn bước tới trạm (Approach Guidance)
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.fillWidth: true
            height: 96
            radius: Theme.radiusLg // 18px
            color: Theme.brandPurpleSoft

            RowLayout {
                anchors.centerIn: parent
                spacing: 16

                Text {
                    text: "👋"
                    font.pixelSize: 28
                }

                Text {
                    text: "Vui lòng bước tới trước trạm để điểm danh"
                    font.family: Theme.fontFamily
                    font.pixelSize: 24
                    font.weight: Font.DemiBold
                    color: Theme.brandPurple
                }
            }
        }
    }
}
