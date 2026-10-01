import QtQuick 2.15
import "../theme"

Rectangle {
    id: root
    color: Theme.crustColor
    radius: 14
    border.color: Theme.surfaceColor
    border.width: 1
    clip: true

    property int frameCounter: 0

    Connections {
        target: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel : null
        function onFrameReady() {
            root.frameCounter++
        }
    }

    // 1. Khung hình video nhận từ VideoImageProvider
    Image {
        id: cameraFeed
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        source: "image://camera/live_" + root.frameCounter
        cache: false
    }

    // 2. Oval Overlay định vị sinh trắc học
    OvalOverlay {
        anchors.fill: parent
    }

    // 3. Badge chỉ dẫn trạng thái đặt phía dưới khung hình
    StatusBadge {
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: 24
    }
}
