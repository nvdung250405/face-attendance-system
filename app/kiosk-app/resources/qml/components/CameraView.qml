import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Item {
    id: root

    property real scaleRatio: 1.0

    // Trạng thái: 0: Idle, 1: Aligning, 2: Success, 3: Error
    property int recognitionState: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.recognitionState : 0

    // Lấy màu tương ứng với trạng thái
    function getStateColor() {
        switch(root.recognitionState) {
            case 1: return Theme.stateAligning;
            case 2: return Theme.stateSuccess;
            case 3: return Theme.stateError;
            default: return Theme.stateIdle;
        }
    }

    function getStatusInstruction() {
        if (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.message) {
            return kioskViewModel.message;
        }
        switch(root.recognitionState) {
            case 1: return "Đang căn chỉnh... Giữ yên khuôn mặt";
            case 2: return "Nhận diện thành công!";
            case 3: return "Thất bại. Vui lòng thử lại";
            default: return "Vui lòng đưa khuôn mặt vào khung hình";
        }
    }

    // Camera Stream Background
    Rectangle {
        anchors.fill: parent
        color: "#050B14"

        // Hoạt ảnh Giả lập Camera Feed Grid (hiển thị khi chưa có feed hoặc background)
        Repeater {
            model: 8
            Rectangle {
                x: 0
                y: index * (root.height / 8)
                width: root.width
                height: 1
                color: Qt.rgba(1, 1, 1, 0.03)
            }
        }
    }

    // Luồng hiển thị video camera thời gian thực từ QQuickImageProvider
    Image {
        id: liveVideo
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        cache: false
        asynchronous: false
        source: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? ("image://camera/live_" + kioskViewModel.frameTick) : ""
    }

    // Khung Oval Định vị Sinh trắc học
    Item {
        id: ovalContainer
        width: Math.min(parent.width * 0.80, 420 * Math.max(0.6, root.scaleRatio))
        height: Math.min(parent.height * 0.60, 560 * Math.max(0.6, root.scaleRatio))
        anchors.centerIn: parent

        // Viền Oval
        Rectangle {
            anchors.fill: parent
            radius: width / 2
            color: "transparent"
            border.color: root.getStateColor()
            border.width: Math.max(2, 3 * root.scaleRatio)

            Behavior on border.color {
                ColorAnimation { duration: 250 }
            }
        }

        // 4 vạch góc Brackets trang trí
        Repeater {
            model: 4
            Item {
                width: Math.max(18, 30 * root.scaleRatio)
                height: Math.max(18, 30 * root.scaleRatio)
                anchors.left: (index % 2 === 0) ? parent.left : undefined
                anchors.right: (index % 2 !== 0) ? parent.right : undefined
                anchors.top: (index < 2) ? parent.top : undefined
                anchors.bottom: (index >= 2) ? parent.bottom : undefined

                Rectangle {
                    anchors.fill: parent
                    color: "transparent"
                    border.color: root.getStateColor()
                    border.width: Math.max(2, 4 * root.scaleRatio)

                    Behavior on border.color {
                        ColorAnimation { duration: 250 }
                    }
                }
            }
        }

        // Vùng Laser Scan Chuyển động
        Item {
            id: scanRegion
            anchors.fill: parent
            clip: true

            Rectangle {
                id: scanLine
                width: parent.width
                height: Math.max(2, 4 * root.scaleRatio)
                color: root.getStateColor()

                // Hiệu ứng Gradient Laser
                Rectangle {
                    anchors.bottom: scanLine.top
                    width: parent.width
                    height: Math.max(20, 40 * root.scaleRatio)
                    gradient: Gradient {
                        GradientStop { position: 0.0; color: "transparent" }
                        GradientStop {
                            position: 1.0;
                            color: Qt.rgba(scanLine.color.r, scanLine.color.g, scanLine.color.b, 0.3)
                        }
                    }
                }

                SequentialAnimation on y {
                    running: root.recognitionState === 0 || root.recognitionState === 1
                    loops: Animation.Infinite
                    NumberAnimation {
                        from: 10
                        to: Math.max(20, ovalContainer.height - 20)
                        duration: 2000
                        easing.type: Easing.InOutQuad
                    }
                    NumberAnimation {
                        from: Math.max(20, ovalContainer.height - 20)
                        to: 10
                        duration: 2000
                        easing.type: Easing.InOutQuad
                    }
                }
            }
        }
    }

    // Status Badge Hướng dẫn Hành vi
    Rectangle {
        anchors.top: ovalContainer.bottom
        anchors.topMargin: Math.max(12, Theme.spaceLg * root.scaleRatio)
        anchors.horizontalCenter: parent.horizontalCenter
        width: Math.min(parent.width * 0.90, instructionText.implicitWidth + (40 * root.scaleRatio))
        height: Math.max(38, 50 * root.scaleRatio)
        radius: Theme.radiusFull
        color: Qt.rgba(Theme.bgSurface.r, Theme.bgSurface.g, Theme.bgSurface.b, 0.92)
        border.color: root.getStateColor()
        border.width: 1.5

        Behavior on border.color {
            ColorAnimation { duration: 250 }
        }

        RowLayout {
            anchors.centerIn: parent
            spacing: Math.max(6, 10 * root.scaleRatio)

            Rectangle {
                width: Math.max(8, 10 * root.scaleRatio)
                height: Math.max(8, 10 * root.scaleRatio)
                radius: Theme.radiusFull
                color: root.getStateColor()

                Behavior on color {
                    ColorAnimation { duration: 250 }
                }
            }

            Text {
                id: instructionText
                text: root.getStatusInstruction()
                font.family: Theme.fontFamily
                font.pixelSize: Math.max(12, 16 * root.scaleRatio)
                font.bold: true
                color: Theme.textPrimary
                elide: Text.ElideRight
            }
        }
    }
}
