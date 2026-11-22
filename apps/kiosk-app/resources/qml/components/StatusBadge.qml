import QtQuick 2.15
import QtQuick.Controls 2.15
import "../theme"

Rectangle {
    id: badge
    width: Math.min(parent ? parent.width - 40 : 400, 480)
    height: 56
    radius: 12
    color: "#D9181825"
    border.color: {
        if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
            switch (kioskViewModel.ovalState) {
                case "ALIGNING": return Theme.ovalAligning
                case "SUCCESS": return Theme.ovalSuccess
                case "ERROR": return Theme.ovalError
                default: return Theme.ovalIdle
            }
        }
        return Theme.ovalIdle
    }
    border.width: 2

    Label {
        anchors.centerIn: parent
        width: parent.width - 24
        wrapMode: Text.WordWrap
        horizontalAlignment: Text.AlignHCenter
        font.pixelSize: 14
        font.bold: true
        color: badge.border.color
        text: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.message : "Vui lòng nhìn vào khung hình..."
    }
}
