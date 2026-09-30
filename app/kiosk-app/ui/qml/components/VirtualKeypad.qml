import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

GridLayout {
    id: keypad
    columns: 3
    rowSpacing: 12
    columnSpacing: 12

    signal digitClicked(string digit)
    signal backspaceClicked()
    signal clearClicked()

    Repeater {
        model: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"]
        delegate: Button {
            Layout.preferredWidth: 70
            Layout.preferredHeight: 70
            text: modelData
            font.pixelSize: 20
            font.bold: true
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
