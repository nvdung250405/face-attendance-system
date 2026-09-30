import QtQuick 2.15
import "../theme"

Item {
    id: root

    property int frameCounter: 0

    Connections {
        target: (typeof kioskViewModel !== "undefined") ? kioskViewModel : null
        function onFrameReady() {
            root.frameCounter++
        }
    }

    // Khung hình video nhận từ VideoImageProvider
    Image {
        id: cameraFeed
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        source: "image://camera/live_" + root.frameCounter
        cache: false
    }

    // Oval Overlay
    OvalOverlay {
        anchors.fill: parent
    }

    // Badge trạng thái
    StatusBadge {
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: 80
    }
}
