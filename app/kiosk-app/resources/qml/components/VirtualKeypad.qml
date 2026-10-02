import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

GridLayout {
    id: keypad
    columns: 3
    rowSpacing: 16
    columnSpacing: 16

    signal digitClicked(string digit)
    signal backspaceClicked()
    signal clearClicked()

    Repeater {
        model: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"]
        delegate: Rectangle {
            id: keyBtn
            Layout.preferredWidth: 96
            Layout.preferredHeight: 96
            radius: Theme.radiusMd // 16px
            color: mouseKey.pressed ? Qt.rgba(0.459, 0.404, 1.0, 0.25) : (modelData === "C" || modelData === "⌫" ? Theme.bgCanvas : Theme.brandPurpleSoft)

            Behavior on color {
                ColorAnimation { duration: 100 }
            }

            Text {
                anchors.centerIn: parent
                text: modelData
                font.family: Theme.fontFamily
                font.pixelSize: 32
                font.bold: true
                color: (modelData === "C" || modelData === "⌫") ? Theme.textSecondary : Theme.brandPurple
            }

            MouseArea {
                id: mouseKey
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    if (modelData === "C") {
                        keypad.clearClicked()
                    } else if (modelData === "⌫") {
                        keypad.backspaceClicked()
                    } else {
                        keypad.digitClicked(modelData)
                    }
                }
            }
        }
    }
}
