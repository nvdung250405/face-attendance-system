// qmllint disable unqualified
// qmllint disable unresolved-type
// qmllint disable missing-property
import QtQuick 2.15
import "../theme"

Canvas {
    id: overlay
    anchors.fill: parent

    property color currentOvalColor: {
        if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
            switch (kioskViewModel.ovalState) {
                case "ALIGNING": return Theme.ovalAligning
                case "SUCCESS": return Theme.ovalSuccess
                case "ERROR": return Theme.ovalRejected
                default: return Theme.ovalStandby
            }
        }
        return Theme.ovalStandby
    }

    onCurrentOvalColorChanged: requestPaint()
    onWidthChanged: requestPaint()
    onHeightChanged: requestPaint()

    onPaint: {
        var ctx = getContext("2d");
        ctx.clearRect(0, 0, width, height);

        // 1. Phủ mờ toàn màn hình
        ctx.fillStyle = "rgba(17, 17, 27, 0.55)";
        ctx.fillRect(0, 0, width, height);

        // 2. Khoét lỗ Oval trung tâm
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        var cx = width / 2;
        var cy = height * 0.44;
        var rx = Math.min(width * 0.28, 175);
        var ry = Math.min(height * 0.38, 250);
        ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
        ctx.fill();

        // 3. Vẽ viền Oval màu trạng thái Catppuccin
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
        ctx.lineWidth = 5;
        ctx.strokeStyle = overlay.currentOvalColor;
        ctx.stroke();

        // 4. Vẽ 4 vạch định vị góc quanh viền Oval (Corner brackets)
        var guideLen = 22;
        ctx.lineWidth = 3;
        ctx.lineCap = "square";
        ctx.beginPath();
        // Đỉnh trên
        ctx.moveTo(cx, cy - ry - 8);
        ctx.lineTo(cx, cy - ry - 8 + guideLen);
        // Đáy dưới
        ctx.moveTo(cx, cy + ry + 8);
        ctx.lineTo(cx, cy + ry + 8 - guideLen);
        // Cạnh trái
        ctx.moveTo(cx - rx - 8, cy);
        ctx.lineTo(cx - rx - 8 + guideLen, cy);
        // Cạnh phải
        ctx.moveTo(cx + rx + 8, cy);
        ctx.lineTo(cx + rx + 8 - guideLen, cy);
        ctx.stroke();
    }
}
