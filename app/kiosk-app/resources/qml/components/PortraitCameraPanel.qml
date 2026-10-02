import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    implicitWidth: Theme.canvasWidth - (Theme.canvasPadding * 2) // 968px
    implicitHeight: Theme.mainViewportHeight                     // 1496px
    radius: Theme.radiusXl                                       // 20px
    color: Theme.bgCamera                                        // #17191D
    clip: true

    property int frameCounter: 0
    property string recognitionState: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.ovalState : "IDLE"
    property string instructionMessage: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.message : "Vui lòng đứng trước camera để điểm danh"

    Connections {
        target: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel : null
        function onFrameReady() {
            root.frameCounter++
        }
    }

    // 0. Huy hiệu định danh luồng Camera góc trên trái (Figma: CAMERA • AH-K01)
    RowLayout {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.margins: 24
        spacing: 8
        z: 2

        Text {
            text: "📷"
            font.pixelSize: 15
            opacity: 0.8
        }

        Text {
            text: "CAMERA • AH-K01"
            font.family: Theme.fontFamily
            font.pixelSize: 14
            font.weight: Font.DemiBold
            color: "#FFFFFF"
            opacity: 0.85
        }
    }

    // 1. Luồng video camera trực tiếp (PreserveAspectCrop)
    Image {
        id: cameraFeed
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        source: "image://camera/live_" + root.frameCounter
        cache: false
    }

    // Component Canvas vẽ lớp tối nhẹ + khung Oval trung tâm theo chuẩn Figma (470 x 604 px)
    Canvas {
        id: ovalCanvas
        anchors.fill: parent

        property color strokeColor: {
            switch (root.recognitionState) {
                case "ALIGNING": return Theme.statusAligning
                case "SUCCESS": return Theme.statusSuccess
                case "ERROR": return Theme.statusError
                default: return Theme.brandPurple
            }
        }

        onStrokeColorChanged: requestPaint()
        onWidthChanged: requestPaint()
        onHeightChanged: requestPaint()

        onPaint: {
            var ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);

            // 1. Phủ mờ không gian camera ngoài khung Oval nhẹ nhàng
            ctx.fillStyle = "rgba(23, 25, 29, 0.35)";
            ctx.fillRect(0, 0, width, height);

            // 2. Khoét rỗng khung Oval (470 x 604px) căn đúng tầm mắt người đứng
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            var cx = width / 2;
            var cy = height * 0.40; // Tầm mắt tự nhiên
            var rx = Theme.ovalWidth / 2;  // 235px
            var ry = Theme.ovalHeight / 2; // 302px
            ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
            ctx.fill();

            // 3. Vẽ viền Oval thanh thoát 4px chuẩn Figma (không có vạch phụ)
            ctx.globalCompositeOperation = "source-over";
            ctx.beginPath();
            ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = ovalCanvas.strokeColor;
            ctx.stroke();
        }
    }

    // Tia quét ánh sáng tím di chuyển tuần hoàn từ trên xuống dưới
    Rectangle {
        id: scanBeam
        width: Theme.ovalWidth - 32
        height: 3
        anchors.horizontalCenter: parent.horizontalCenter
        radius: 1.5
        color: Theme.brandPurple
        opacity: root.recognitionState === "IDLE" || root.recognitionState === "ALIGNING" ? 0.8 : 0

        SequentialAnimation on y {
            running: scanBeam.opacity > 0
            loops: Animation.Infinite
            NumberAnimation {
                from: root.height * 0.40 - (Theme.ovalHeight / 2) + 20
                to: root.height * 0.40 + (Theme.ovalHeight / 2) - 20
                duration: 2000
                easing.type: Easing.InOutSine
            }
            NumberAnimation {
                from: root.height * 0.40 + (Theme.ovalHeight / 2) - 20
                to: root.height * 0.40 - (Theme.ovalHeight / 2) + 20
                duration: 2000
                easing.type: Easing.InOutSine
            }
        }
    }

    // 2. Dải chỉ dẫn trạng thái đáy (Instruction strip - Node 5:23720: 920 x 120 px)
    Rectangle {
        id: instructionStrip
        width: Math.min(920, parent.width - 48)
        height: 110
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 28
        radius: 18

        color: {
            switch (root.recognitionState) {
                case "ALIGNING": return Theme.statusAligningBg
                case "SUCCESS": return "#E8F7ED" // Figma green card
                case "ERROR": return Theme.statusErrorBg
                default: return "#FFFFFF"        // Figma white card
            }
        }

        RowLayout {
            anchors.centerIn: parent
            spacing: 16

            Text {
                text: {
                    switch (root.recognitionState) {
                        case "ALIGNING": return "⚠"
                        case "SUCCESS": return "✓"
                        case "ERROR": return "✕"
                        default: return "⛶"
                    }
                }
                font.pixelSize: 28
                font.bold: true
                color: {
                    switch (root.recognitionState) {
                        case "ALIGNING": return Theme.statusAligning
                        case "SUCCESS": return Theme.statusSuccess
                        case "ERROR": return Theme.statusError
                        default: return Theme.brandPurple
                    }
                }
            }

            Text {
                text: {
                    if (root.recognitionState === "SUCCESS") {
                        return "Điểm danh thành công"
                    }
                    if (root.recognitionState === "IDLE") {
                        return "Vui lòng đứng trước camera để điểm danh"
                    }
                    return root.instructionMessage
                }
                font.family: Theme.fontFamily
                font.pixelSize: 22
                font.bold: true
                color: Theme.textPrimary
            }
        }
    }

    // 3. Thiệp kết quả điểm danh nổi bật (Bật nổi khi SUCCESS)
    PortraitResultCard {
        id: resultCard
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: instructionStrip.top
        anchors.bottomMargin: 16
        visible: root.recognitionState === "SUCCESS"
        opacity: visible ? 1.0 : 0.0

        Behavior on opacity {
            NumberAnimation { duration: 250; easing.type: Easing.OutQuad }
        }
    }
}
