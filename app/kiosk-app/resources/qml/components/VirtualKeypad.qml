import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

GridLayout {
    id: keypad
    columns: 3
    rowSpacing: 14
    columnSpacing: 14

    signal digitClicked(string digit)
    signal backspaceClicked()
    signal clearClicked()

    Repeater {
        model: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Xóa trắng", "0", "Xóa lùi"]
        delegate: Rectangle {
            id: keyBtn
            Layout.fillWidth: true
            Layout.preferredHeight: 72
            radius: 14
            color: mouseKey.pressed ? "#E5E7EB" : "#F5F6F8"

            Behavior on color {
                ColorAnimation { duration: 100 }
            }

            Text {
                anchors.centerIn: parent
                text: modelData
                font.family: Theme.fontFamily
                font.pixelSize: (modelData === "Xóa trắng" || modelData === "Xóa lùi") ? 15 : 28
                font.bold: true
                color: Theme.textPrimary
            }

            MouseArea {
                id: mouseKey
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    if (modelData === "Xóa trắng") {
                        keypad.clearClicked()
                    } else if (modelData === "Xóa lùi") {
                        keypad.backspaceClicked()
                    } else {
                        keypad.digitClicked(modelData)
                    }
                }
            }
        }
    }
}
