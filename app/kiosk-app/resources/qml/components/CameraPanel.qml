// qmllint disable unqualified
// qmllint disable unresolved-type
// qmllint disable missing-property
import QtQuick
import "../theme"

Rectangle {
    id: root

    property int recognitionState: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.recognitionState : 0
    property string statusMessage: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.message) ? kioskViewModel.message : "Vui lòng nhìn thẳng vào camera"

    implicitWidth: 650
    implicitHeight: 440
    radius: Theme.radiusXl
    color: Theme.bgCamera
    clip: true

    function getFrameColor() {
        switch(root.recognitionState) {
            case 1: return Theme.stateAligning;
            case 2: return Theme.successGreen;
            case 3: return Theme.stateError;
            default: return Theme.accentPurple;
        }
    }

    function getGlowColor(alpha) {
        var base = root.getFrameColor();
        return Qt.rgba(base.r, base.g, base.b, alpha);
    }

    // Giả lập Camera Background (Radial Gradient)
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#3C4048" }
            GradientStop { position: 0.35; color: "#24272D" }
            GradientStop { position: 0.75; color: "#15171B" }
        }
    }

    // Luồng video Camera thật từ VideoImageProvider
    Image {
        id: liveFeed
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        cache: false
        asynchronous: false
        source: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? ("image://camera/live_" + kioskViewModel.frameTick) : ""
    }

    // Nhãn CAMERA LIVE góc trên trái
    Text {
        x: 22
        y: 20
        text: "CAMERA LIVE"
        font.family: Theme.fontFamily
        font.pixelSize: 14
        font.bold: true
        color: "#FFFFFF"
        opacity: 0.85
    }

    // Khung định vị khuôn mặt Face Detection Oval
    Item {
        id: ovalWrapper
        width: 270
        height: 340
        anchors.centerIn: parent

        // Vòng Outer Glow 1 (30px blur)
        Rectangle {
            anchors.centerIn: parent
            width: parent.width + 24
            height: parent.height + 24
            radius: width / 2
            color: "transparent"
            border.color: root.getGlowColor(0.25)
            border.width: 12

            Behavior on border.color {
                ColorAnimation { duration: 200 }
            }
        }

        // Vòng Outer Glow 2 (8px offset)
        Rectangle {
            anchors.centerIn: parent
            width: parent.width + 10
            height: parent.height + 10
            radius: width / 2
            color: "transparent"
            border.color: root.getGlowColor(0.15)
            border.width: 5

            Behavior on border.color {
                ColorAnimation { duration: 200 }
            }
        }

        // Viền Oval chính 5px solid #7567ff
        Rectangle {
            id: mainOval
            anchors.fill: parent
            radius: width / 2
            color: "transparent"
            border.color: root.getFrameColor()
            border.width: 5

            Behavior on border.color {
                ColorAnimation { duration: 200 }
            }

            // Vạch định vị đỉnh (top notch ::before width 55px height 5px)
            Rectangle {
                anchors.top: parent.top
                anchors.topMargin: -4
                anchors.horizontalCenter: parent.horizontalCenter
                width: 55
                height: 6
                radius: 3
                color: root.getFrameColor()

                Behavior on color {
                    ColorAnimation { duration: 200 }
                }
            }
        }
    }

    // Dòng chữ chỉ dẫn hành động (scan-text) ở đáy camera
    Text {
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 24
        anchors.horizontalCenter: parent.horizontalCenter
        text: root.statusMessage
        font.family: Theme.fontFamily
        font.pixelSize: 18
        font.bold: true
        color: "#FFFFFF"
        horizontalAlignment: Text.AlignHCenter
        style: Text.Raised
        styleColor: Qt.rgba(0, 0, 0, 0.7)
    }
}
