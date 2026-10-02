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

    // 1. Luồng video camera trực tiếp (PreserveAspectCrop)
    Image {
        id: cameraFeed
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        source: "image://camera/live_" + root.frameCounter
        cache: false
    }

    // Component Canvas vẽ lớp mờ + khung Oval trung tâm theo chuẩn Figma (470 x 604 px)
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

            // 1. Phủ mờ không gian camera ngoài khung Oval
            ctx.fillStyle = "rgba(23, 25, 29, 0.45)";
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

            // 3. Vẽ viền nét đanh 8px chuẩn Figma
            ctx.globalCompositeOperation = "source-over";
            ctx.beginPath();
            ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
            ctx.lineWidth = Theme.ovalStrokeWidth; // 8px
            ctx.strokeStyle = ovalCanvas.strokeColor;
            ctx.stroke();

            // 4. Vẽ 4 góc định vị sinh trắc học
            var bracket = 24;
            ctx.lineWidth = 4;
            ctx.strokeStyle = ovalCanvas.strokeColor;
            ctx.beginPath();
            // Đỉnh trên
            ctx.moveTo(cx, cy - ry - 12);
            ctx.lineTo(cx, cy - ry - 12 + bracket);
            // Đáy dưới
            ctx.moveTo(cx, cy + ry + 12);
            ctx.lineTo(cx, cy + ry + 12 - bracket);
            // Cạnh trái
            ctx.moveTo(cx - rx - 12, cy);
            ctx.lineTo(cx - rx - 12 + bracket, cy);
            // Cạnh phải
            ctx.moveTo(cx + rx + 12, cy);
            ctx.lineTo(cx + rx + 12 - bracket, cy);
            ctx.stroke();
        }
    }

    // Tia quét ánh sáng tím di chuyển tuần hoàn từ trên xuống dưới
    Rectangle {
        id: scanBeam
        width: Theme.ovalWidth - 32
        height: 4
        anchors.horizontalCenter: parent.horizontalCenter
        radius: 2
        color: Theme.brandPurple
        opacity: root.recognitionState === "IDLE" || root.recognitionState === "ALIGNING" ? 0.75 : 0

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
        height: 120
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 32
        radius: Theme.radiusLg // 18px

        color: {
            switch (root.recognitionState) {
                case "ALIGNING": return Theme.statusAligningBg
                case "SUCCESS": return Theme.statusSuccessBg
                case "ERROR": return Theme.statusErrorBg
                default: return "#EEF2FF"
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
                        default: return "👤"
                    }
                }
                font.pixelSize: 32
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
                text: root.instructionMessage
                font.family: Theme.fontFamily
                font.pixelSize: 22
                font.weight: Font.DemiBold
                color: {
                    switch (root.recognitionState) {
                        case "ALIGNING": return Theme.statusAligning
                        case "SUCCESS": return Theme.statusSuccess
                        case "ERROR": return Theme.statusError
                        default: return Theme.textPrimary
                    }
                }
            }
        }
    }

    // 3. Thiệp kết quả điểm danh nổi bật (Bật nổi khi SUCCESS)
    PortraitResultCard {
        id: resultCard
        anchors.centerIn: parent
        visible: root.recognitionState === "SUCCESS"
        opacity: visible ? 1.0 : 0.0

        Behavior on opacity {
            NumberAnimation { duration: 250; easing.type: Easing.OutQuad }
        }
    }
}
