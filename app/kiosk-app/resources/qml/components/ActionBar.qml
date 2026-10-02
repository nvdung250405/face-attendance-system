import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Item {
    id: root

    implicitHeight: 180

    signal pinClicked()
    signal registerClicked()
    signal helpClicked()

    RowLayout {
        anchors.fill: parent
        spacing: 35

        // Button 1: Chấm công bằng PIN
        ActionCard {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconText: "⌨"
            cardTitle: "Chấm công bằng PIN"
            cardDescription: "Phương thức dự phòng"
            onClicked: root.pinClicked()
        }

        // Button 2: Đăng ký khuôn mặt
        ActionCard {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconText: "◉"
            cardTitle: "Đăng ký khuôn mặt"
            cardDescription: "Dành cho nhân viên mới"
            onClicked: root.registerClicked()
        }

        // Button 3: Trợ giúp
        ActionCard {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconText: "?"
            cardTitle: "Trợ giúp"
            cardDescription: "Hướng dẫn sử dụng"
            onClicked: root.helpClicked()
        }
    }

    // Component Action Card chuẩn Touch Kiosk
    component ActionCard : Rectangle {
        id: card
        property string iconText: ""
        property string cardTitle: ""
        property string cardDescription: ""
        signal clicked()

        radius: Theme.radiusLg
        color: Theme.bgCard

        // Đổ bóng mềm nhẹ box-shadow: 0 2px 8px rgba(0,0,0,.08)
        Rectangle {
            anchors.fill: parent
            anchors.topMargin: mouse.pressed ? 1 : (mouse.containsMouse ? 4 : 2)
            radius: card.radius
            color: mouse.pressed ? Qt.rgba(0, 0, 0, 0.04) : (mouse.containsMouse ? Qt.rgba(0, 0, 0, 0.12) : Qt.rgba(0, 0, 0, 0.08))
            z: -1
        }

        // Hiệu ứng nhấc nhẹ translateY(-2px) khi hover và nhấn chạm
        y: mouse.pressed ? 1 : (mouse.containsMouse ? -2 : 0)
        Behavior on y {
            NumberAnimation { duration: 120 }
        }

        ColumnLayout {
            anchors.centerIn: parent
            spacing: 0

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: card.iconText
                font.pixelSize: 38
                color: Theme.textDark
            }

            Item {
                Layout.preferredHeight: 14
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: card.cardTitle
                font.family: Theme.fontFamily
                font.pixelSize: 18
                font.bold: true
                color: Theme.textDark
            }

            Item {
                Layout.preferredHeight: 6
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: card.cardDescription
                font.family: Theme.fontFamily
                font.pixelSize: 13
                color: Theme.textSubtle
            }
        }

        MouseArea {
            id: mouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: card.clicked()
        }
    }
}
