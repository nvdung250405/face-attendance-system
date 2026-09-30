import QtQuick 2.15
import "../theme"

Canvas {
    id: overlay
    anchors.fill: parent

    property color currentOvalColor: {
        if (typeof kioskViewModel !== "undefined") {
            switch (kioskViewModel.ovalState) {
                case "ALIGNING": return Theme.ovalAligning
                case "SUCCESS": return Theme.ovalSuccess
                case "ERROR": return Theme.ovalError
                default: return Theme.ovalIdle
            }
        }
        return Theme.ovalIdle
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
        var cy = height * 0.42;
        var rx = Math.min(width * 0.22, 210);
        var ry = Math.min(height * 0.35, 280);
        ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
        ctx.fill();

        // 3. Vẽ viền Oval màu trạng thái Catppuccin
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.ellipse(cx - rx, cy - ry, rx * 2, ry * 2);
        ctx.lineWidth = 5;
        ctx.strokeStyle = overlay.currentOvalColor;
        ctx.stroke();
    }
}
