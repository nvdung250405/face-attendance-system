import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property real scaleRatio: 1.0

    signal pinClicked()
    signal registerClicked()
    signal helpClicked()

    implicitHeight: Math.max(64, 120 * scaleRatio)
    color: Theme.bgSurface

    RowLayout {
        anchors.fill: parent
        anchors.margins: Math.max(8, Theme.spaceSm * root.scaleRatio)
        spacing: Math.max(8, Theme.spaceSm * root.scaleRatio)

        // Nút 1: Mã PIN Dự phòng
        ButtonBase {
            Layout.fillWidth: true
            Layout.fillHeight: true
            btnText: "Mã PIN"
            btnColor: Theme.bgCard
            scaleRatio: root.scaleRatio
            onClicked: root.pinClicked()
        }

        // Nút 2: Đăng ký Khuôn mặt
        ButtonBase {
            Layout.fillWidth: true
            Layout.fillHeight: true
            btnText: "Đăng ký"
            btnColor: Theme.primary
            scaleRatio: root.scaleRatio
            onClicked: root.registerClicked()
        }

        // Nút 3: Trợ giúp
        ButtonBase {
            Layout.fillWidth: true
            Layout.fillHeight: true
            btnText: "Trợ giúp"
            btnColor: Theme.bgCard
            scaleRatio: root.scaleRatio
            onClicked: root.helpClicked()
        }
    }

    // Inline Component định nghĩa Button Touch chuẩn
    component ButtonBase : Rectangle {
        id: btn
        property string btnText: ""
        property color btnColor: "transparent"
        property real scaleRatio: 1.0
        signal clicked()

        radius: Math.max(8, Theme.radiusMd * scaleRatio)
        color: mouse.pressed ? Qt.darker(btnColor, 1.2) : btnColor

        Behavior on color {
            ColorAnimation { duration: 100 }
        }

        Text {
            anchors.centerIn: parent
            text: btn.btnText
            font.family: Theme.fontFamily
            font.pixelSize: Math.max(13, 16 * btn.scaleRatio)
            font.bold: true
            color: Theme.textPrimary
        }

        MouseArea {
            id: mouse
            anchors.fill: parent
            onClicked: btn.clicked()
        }
    }
}
