import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    signal pinClicked()
    signal registerClicked()
    signal helpClicked()

    implicitWidth: Theme.canvasWidth - (Theme.canvasPadding * 2) // 968px
    implicitHeight: Theme.actionDockHeight                       // 144px
    radius: Theme.radiusLg                                       // 18px
    color: Theme.bgCard                                          // #FFFFFF

    // Đổ bóng nổi nhẹ theo chuẩn Figma
    Rectangle {
        anchors.fill: parent
        anchors.topMargin: 4
        radius: root.radius
        color: Qt.rgba(0.067, 0.094, 0.153, 0.06)
        z: -1
    }

    RowLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16

        // 1. Nút 1: Điểm danh bằng PIN
        DockButton {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconChar: "⌨"
            titleText: "Điểm danh bằng\nPIN"
            onClicked: root.pinClicked()
        }

        // 2. Nút 2: Đăng ký mới
        DockButton {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconChar: "👤⁺"
            titleText: "Đăng ký mới"
            onClicked: root.registerClicked()
        }

        // 3. Nút 3: Hướng dẫn
        DockButton {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconChar: "❓"
            titleText: "Hướng dẫn"
            onClicked: root.helpClicked()
        }
    }

    // Component nút bấm cảm ứng chuẩn Figma (#EEF2FF nền, chữ #111827)
    component DockButton : Rectangle {
        id: btn
        property string iconChar: ""
        property string titleText: ""
        signal clicked()

        radius: 16
        color: mouse.pressed ? "#E0E7FF" : "#EEF2FF"

        Behavior on color {
            ColorAnimation { duration: 150 }
        }

        RowLayout {
            anchors.centerIn: parent
            spacing: 14

            Text {
                text: btn.iconChar
                font.pixelSize: 26
                color: "#4B5563"
                Layout.alignment: Qt.AlignVCenter
            }

            Text {
                text: btn.titleText
                font.family: Theme.fontFamily
                font.pixelSize: 18
                font.bold: true
                color: Theme.textPrimary
                lineHeight: 1.15
                Layout.alignment: Qt.AlignVCenter
            }
        }

        MouseArea {
            id: mouse
            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            onClicked: btn.clicked()
        }
    }
}
