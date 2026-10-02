// qmllint disable unqualified
// qmllint disable unresolved-type
// qmllint disable missing-property
import QtQuick
import QtQuick.Layouts
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
    property bool isEnrolling: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.isEnrolling : false
    property string enrollmentStatus: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.statusMessage : ""
    property real enrollmentProgress: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.progressPercent : 0.0

    Connections {
        target: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel : null
        function onFrameReady() {
            root.frameCounter++
        }
    }

    Connections {
        target: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController : null
        function onCurrentStepChanged() {
            root.isEnrolling = (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.isEnrolling : false
            ovalCanvas.requestPaint()
        }
        function onStatusMessageChanged(msg) {
            root.enrollmentStatus = msg
            ovalCanvas.requestPaint()
        }
        function onProgressPercentChanged(val) {
            root.enrollmentProgress = val
            ovalCanvas.requestPaint()
        }
    }

    // 0. Huy hiệu định danh luồng Camera hoặc Chế độ Đăng ký mới
    Rectangle {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.margins: 24
        height: 38
        radius: 19
        color: root.isEnrolling ? Theme.brandPurple : "transparent"
        z: 2

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: root.isEnrolling ? 14 : 0
            anchors.rightMargin: root.isEnrolling ? 14 : 0
            spacing: 8

            Text {
                text: root.isEnrolling ? "👤⁺" : "📷"
                font.pixelSize: 15
                opacity: 0.9
            }

            Text {
                text: {
                    if (root.isEnrolling && typeof enrollmentController !== "undefined" && enrollmentController) {
                        const name = enrollmentController.employeeName ? enrollmentController.employeeName : ("ID: " + enrollmentController.employeeId)
                        return "ĐĂNG KÝ MẪU KHUÔN MẶT • " + name
                    }
                    return "CAMERA • NVD-K01"
                }
                font.family: Theme.fontFamily
                font.pixelSize: 14
                font.weight: Font.DemiBold
                color: "#FFFFFF"
                opacity: 0.95
            }
        }
    }

    // Nút Hủy đăng ký khi đang trong chế độ thu thập khuôn mặt (Bước 2)
    Rectangle {
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.margins: 24
        height: 38
        width: 140
        radius: 19
        color: Qt.rgba(0, 0, 0, 0.45)
        border.color: Qt.rgba(1.0, 1.0, 1.0, 0.3)
        border.width: 1
        z: 2
        visible: root.isEnrolling

        RowLayout {
            anchors.centerIn: parent
            spacing: 6

            Text {
                text: "✕"
                font.pixelSize: 13
                color: "#FFFFFF"
                font.bold: true
            }

            Text {
                text: "Hủy [ESC]"
                font.family: Theme.fontFamily
                font.pixelSize: 13
                font.bold: true
                color: "#FFFFFF"
            }
        }

        MouseArea {
            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            onClicked: {
                if (typeof enrollmentController !== "undefined" && enrollmentController) {
                    enrollmentController.reset()
                }
            }
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
            if (root.isEnrolling) {
                if (root.enrollmentProgress >= 1.0) return Theme.statusSuccess
                if (root.enrollmentStatus.indexOf("Khuôn mặt đạt chuẩn") !== -1 || root.enrollmentProgress > 0) {
                    return "#8B5CF6"
                }
                if (root.enrollmentStatus.indexOf("Vui lòng") !== -1 && root.enrollmentStatus.indexOf("nhìn vào khung") === -1) {
                    return Theme.statusAligning
                }
                return Theme.brandPurple
            }
            switch (root.recognitionState) {
                case "ALIGNING": return Theme.statusAligning
                case "SUCCESS": return Theme.statusSuccess
                case "ERROR": return Theme.statusError
                default: return Theme.brandPurple
            }
        }

        Connections {
            target: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController : null
            function onCurrentStepChanged() { ovalCanvas.requestPaint() }
            function onProgressPercentChanged() { ovalCanvas.requestPaint() }
        }

        onStrokeColorChanged: requestPaint()
        onWidthChanged: requestPaint()
        onHeightChanged: requestPaint()

        onPaint: {
            const ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);

            // 1. Phủ mờ không gian camera ngoài khung Oval nhẹ nhàng
            ctx.fillStyle = "rgba(23, 25, 29, 0.35)";
            ctx.fillRect(0, 0, width, height);

            // 2. Khoét rỗng khung Oval (470 x 604px) căn đúng tầm mắt người đứng
            ctx.globalCompositeOperation = "destination-out";
            const cx = width / 2;
            const cy = height * 0.40; // Tầm mắt tự nhiên
            const rx = Theme.ovalWidth / 2;  // 235px
            const ry = Theme.ovalHeight / 2; // 302px
            ctx.beginPath();
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
        opacity: {
            if (root.isEnrolling) {
                return 0.8
            }
            return (root.recognitionState === "IDLE" || root.recognitionState === "ALIGNING") ? 0.8 : 0
        }

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
        height: root.isEnrolling ? 130 : 110
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 28
        radius: 18

        color: {
            if (root.isEnrolling) {
                if (root.enrollmentStatus.indexOf("Vui lòng") !== -1 && root.enrollmentStatus.indexOf("nhìn vào khung") === -1) {
                    return Theme.statusAligningBg
                }
                return "#EEF2FF"
            }
            switch (root.recognitionState) {
                case "ALIGNING": return Theme.statusAligningBg
                case "SUCCESS": return "#E8F7ED" // Figma green card
                case "ERROR": return Theme.statusErrorBg
                default: return "#FFFFFF"        // Figma white card
            }
        }

        Column {
            anchors.centerIn: parent
            spacing: 10
            width: parent.width - 48

            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 14

                Text {
                    anchors.verticalCenter: parent.verticalCenter
                    text: {
                        if (root.isEnrolling) {
                            if (root.enrollmentProgress >= 1.0) return "✓"
                            if (root.enrollmentStatus.indexOf("Vui lòng") !== -1 && root.enrollmentStatus.indexOf("nhìn vào khung") === -1) return "⚠"
                            return "👤⁺"
                        }
                        switch (root.recognitionState) {
                            case "ALIGNING": return "⚠"
                            case "SUCCESS": return "✓"
                            case "ERROR": return "✕"
                            default: return "⛶"
                        }
                    }
                    font.pixelSize: 26
                    font.bold: true
                    color: {
                        if (root.isEnrolling) {
                            if (root.enrollmentProgress >= 1.0) return Theme.statusSuccess
                            if (root.enrollmentStatus.indexOf("Vui lòng") !== -1 && root.enrollmentStatus.indexOf("nhìn vào khung") === -1) return Theme.statusAligning
                            return Theme.brandPurple
                        }
                        switch (root.recognitionState) {
                            case "ALIGNING": return Theme.statusAligning
                            case "SUCCESS": return Theme.statusSuccess
                            case "ERROR": return Theme.statusError
                            default: return Theme.brandPurple
                        }
                    }
                }

                Text {
                    anchors.verticalCenter: parent.verticalCenter
                    text: {
                        if (root.isEnrolling) {
                            return root.enrollmentStatus ? root.enrollmentStatus : "Vui lòng nhìn vào khung hình camera..."
                        }
                        if (root.recognitionState === "SUCCESS") {
                            return "Điểm danh thành công"
                        }
                        if (root.recognitionState === "IDLE") {
                            return "Vui lòng đứng trước camera để điểm danh"
                        }
                        return root.instructionMessage
                    }
                    font.family: Theme.fontFamily
                    font.pixelSize: 20
                    font.bold: true
                    color: Theme.textPrimary
                    elide: Text.ElideRight
                }
            }

            // Thanh tiến độ thu thập ảnh mẫu khi đăng ký
            Rectangle {
                anchors.horizontalCenter: parent.horizontalCenter
                width: 420
                height: 8
                radius: 4
                color: Qt.rgba(0, 0, 0, 0.08)
                visible: root.isEnrolling

                Rectangle {
                    height: parent.height
                    width: parent.width * Math.min(1.0, Math.max(0.0, root.enrollmentProgress))
                    radius: 4
                    color: Theme.brandPurple

                    Behavior on width {
                        NumberAnimation { duration: 200 }
                    }
                }
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
