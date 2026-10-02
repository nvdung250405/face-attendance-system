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

        // 1. Nút 1: Điểm danh PIN (Figma: 301.3 x 112 px, nền tím nhạt 12%, bo góc 16px)
        DockButton {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconChar: "🔢"
            titleText: "Điểm danh PIN"
            shortcutText: "Phím tắt [F2]"
            onClicked: root.pinClicked()
        }

        // 2. Nút 2: Đăng ký khuôn mặt mới
        DockButton {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconChar: "👤"
            titleText: "Đăng ký mới"
            shortcutText: "Phím tắt [F3]"
            onClicked: root.registerClicked()
        }

        // 3. Nút 3: Hướng dẫn sử dụng
        DockButton {
            Layout.fillWidth: true
            Layout.fillHeight: true
            iconChar: "❓"
            titleText: "Hướng dẫn"
            shortcutText: "Phím tắt [F1]"
            onClicked: root.helpClicked()
        }
    }

    // Component nút bấm cảm ứng chuẩn Figma
    component DockButton : Rectangle {
        id: btn
        property string iconChar: ""
        property string titleText: ""
        property string shortcutText: ""
        signal clicked()

        radius: Theme.radiusMd // 16px
        color: mouse.pressed ? Qt.rgba(0.459, 0.404, 1.0, 0.22) : Theme.brandPurpleSoft

        Behavior on color {
            ColorAnimation { duration: 150 }
        }

        RowLayout {
            anchors.centerIn: parent
            spacing: 16

            Text {
                text: btn.iconChar
                font.pixelSize: 32
                Layout.alignment: Qt.AlignVCenter
            }

            ColumnLayout {
                spacing: 2
                Layout.alignment: Qt.AlignVCenter

                Text {
                    text: btn.titleText
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontActionBtn // 20px
                    font.weight: Font.DemiBold
                    color: Theme.brandPurple
                }

                Text {
                    text: btn.shortcutText
                    font.family: Theme.fontFamily
                    font.pixelSize: 13
                    color: Theme.textSubtle
                }
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
