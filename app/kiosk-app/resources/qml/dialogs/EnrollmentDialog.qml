// qmllint disable unqualified
// qmllint disable unresolved-type
// qmllint disable missing-property
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "../theme"
import "../components"

Item {
    id: root
    anchors.fill: parent
    z: 1000
    visible: root.opacity > 0
    opacity: 0.0

    property bool isOpen: false

    function open() {
        if (typeof enrollmentController !== "undefined" && enrollmentController) {
            if (enrollmentController.currentStep === 3 || enrollmentController.currentStep === 2) {
                enrollmentController.reset()
            }
            enrollmentController.setDialogOpen(true)
            enrollmentController.clearOtp()
        }
        isOpen = true
        opacity = 1.0
        cardItem.forceActiveFocus()
    }

    function close() {
        isOpen = false
        opacity = 0.0
        if (typeof enrollmentController !== "undefined" && enrollmentController) {
            enrollmentController.setDialogOpen(false)
            enrollmentController.reset()
        }
    }

    function hideForCapture() {
        isOpen = false
        opacity = 0.0
    }

    function showForCompletion() {
        isOpen = true
        opacity = 1.0
        cardItem.forceActiveFocus()
    }

    Behavior on opacity {
        NumberAnimation { duration: 220; easing.type: Easing.OutCubic }
    }

    Connections {
        target: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController : null

        function onDialogOpenChanged(openState) {
            if (!openState) {
                root.isOpen = false
                root.opacity = 0.0
            }
        }

        function onCurrentStepChanged(step) {
            if (step === 1) {
                if (typeof enrollmentController !== "undefined" && enrollmentController && enrollmentController.isDialogOpen) {
                    root.isOpen = true
                    root.opacity = 1.0
                    cardItem.forceActiveFocus()
                } else {
                    root.isOpen = false
                    root.opacity = 0.0
                }
            } else if (step === 2) {
                root.hideForCapture()
            } else if (step === 3) {
                root.showForCompletion()
            }
        }
    }

    // 1. Lớp phủ nền tối (Backdrop Overlay) 1080x1920
    Rectangle {
        anchors.fill: parent
        color: Qt.rgba(0, 0, 0, 0.65)

        MouseArea {
            anchors.fill: parent
            onClicked: root.close()
        }
    }

    // 2. Thẻ Card Modal chính giữa (Chuẩn Figma: width 800, height 1280)
    Rectangle {
        id: cardItem
        width: 800
        height: 1280
        anchors.centerIn: parent
        radius: 24
        color: "#FFFFFF"
        border.color: "#E5E7EB"
        border.width: 1
        clip: true

        // Hiệu ứng đổ bóng thẻ Card
        Rectangle {
            anchors.fill: parent
            anchors.topMargin: 16
            radius: 24
            color: Qt.rgba(0, 0, 0, 0.20)
            z: -1
        }

        // Bắt sự kiện chuột không lọt ra ngoài nền
        MouseArea {
            anchors.fill: parent
            // Chặn click xuyên qua backdrop
        }

        // Hỗ trợ gõ trực tiếp từ bàn phím vật lý
        focus: true
        Keys.onPressed: function(event) {
            if (event.key >= Qt.Key_0 && event.key <= Qt.Key_9) {
                const digit = String(event.key - Qt.Key_0)
                if (typeof enrollmentController !== "undefined" && enrollmentController) {
                    enrollmentController.appendOtpDigit(digit)
                }
                event.accepted = true
            } else if (event.key === Qt.Key_Backspace) {
                if (typeof enrollmentController !== "undefined" && enrollmentController) {
                    enrollmentController.backspaceOtp()
                }
                event.accepted = true
            } else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) {
                if (typeof enrollmentController !== "undefined" && enrollmentController) {
                    enrollmentController.verifyOtp()
                }
                event.accepted = true
            } else if (event.key === Qt.Key_Escape) {
                root.close()
                event.accepted = true
            }
        }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 40
            spacing: 24

            // ================= 1. HEADER MODAL =================
            RowLayout {
                Layout.fillWidth: true

                Text {
                    text: "Đăng ký khuôn mặt mới"
                    font.family: Theme.fontFamily
                    font.pixelSize: 30
                    font.bold: true
                    color: "#111827"
                }

                Item { Layout.fillWidth: true }

                Rectangle {
                    width: 48
                    height: 48
                    radius: 14
                    color: mouseClose.pressed ? "#E5E7EB" : "#F3F4F6"

                    Text {
                        anchors.centerIn: parent
                        text: "✕"
                        font.pixelSize: 20
                        font.bold: true
                        color: "#6B7280"
                    }

                    MouseArea {
                        id: mouseClose
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.close()
                    }
                }
            }

            // ================= 2. THANH TABS 3 BƯỚC (CHUẨN FIGMA) =================
            RowLayout {
                Layout.fillWidth: true
                spacing: 14

                property int curStep: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep : 1

                // Tab 1: Xác thực
                Rectangle {
                    Layout.fillWidth: true
                    height: 52
                    radius: 12
                    color: parent.curStep === 1 ? "#EEF2FF" : "#F5F6F8"

                    RowLayout {
                        anchors.centerIn: parent
                        spacing: 10

                        Rectangle {
                            width: 28
                            height: 28
                            radius: 14
                            color: parent.parent.parent.curStep === 1 ? Theme.brandPurple : "#D1D5DB"

                            Text {
                                anchors.centerIn: parent
                                text: "1"
                                font.family: Theme.fontFamily
                                font.pixelSize: 15
                                font.bold: true
                                color: parent.parent.parent.parent.curStep === 1 ? "#FFFFFF" : "#111827"
                            }
                        }

                        Text {
                            text: "Xác thực"
                            font.family: Theme.fontFamily
                            font.pixelSize: 18
                            font.bold: parent.parent.parent.curStep === 1
                            color: parent.parent.parent.curStep === 1 ? Theme.brandPurple : "#4B5563"
                        }
                    }
                }

                // Tab 2: Căn chỉnh
                Rectangle {
                    Layout.fillWidth: true
                    height: 52
                    radius: 12
                    color: parent.curStep === 2 ? "#EEF2FF" : "#F5F6F8"

                    RowLayout {
                        anchors.centerIn: parent
                        spacing: 10

                        Rectangle {
                            width: 28
                            height: 28
                            radius: 14
                            color: parent.parent.parent.curStep === 2 ? Theme.brandPurple : "#D1D5DB"

                            Text {
                                anchors.centerIn: parent
                                text: "2"
                                font.family: Theme.fontFamily
                                font.pixelSize: 15
                                font.bold: true
                                color: parent.parent.parent.parent.curStep === 2 ? "#FFFFFF" : "#111827"
                            }
                        }

                        Text {
                            text: "Căn chỉnh"
                            font.family: Theme.fontFamily
                            font.pixelSize: 18
                            font.bold: parent.parent.parent.curStep === 2
                            color: parent.parent.parent.curStep === 2 ? Theme.brandPurple : "#4B5563"
                        }
                    }
                }

                // Tab 3: Hoàn tất
                Rectangle {
                    Layout.fillWidth: true
                    height: 52
                    radius: 12
                    color: parent.curStep === 3 ? "#EEF2FF" : "#F5F6F8"

                    RowLayout {
                        anchors.centerIn: parent
                        spacing: 10

                        Rectangle {
                            width: 28
                            height: 28
                            radius: 14
                            color: parent.parent.parent.curStep === 3 ? Theme.brandPurple : "#D1D5DB"

                            Text {
                                anchors.centerIn: parent
                                text: "3"
                                font.family: Theme.fontFamily
                                font.pixelSize: 15
                                font.bold: true
                                color: parent.parent.parent.parent.curStep === 3 ? "#FFFFFF" : "#111827"
                            }
                        }

                        Text {
                            text: "Hoàn tất"
                            font.family: Theme.fontFamily
                            font.pixelSize: 18
                            font.bold: parent.parent.parent.curStep === 3
                            color: parent.parent.parent.curStep === 3 ? Theme.brandPurple : "#4B5563"
                        }
                    }
                }
            }

            // ================= 3. BƯỚC 1: NHẬP MÃ XÁC THỰC OTP =================
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 20
                visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 1 : true

                // Tiêu đề & Hướng dẫn
                ColumnLayout {
                    spacing: 6
                    Text {
                        text: "Nhập mã xác thực"
                        font.family: Theme.fontFamily
                        font.pixelSize: 22
                        font.bold: true
                        color: "#111827"
                    }

                    Text {
                        text: "Nhập mã kích hoạt OTP gồm 6 chữ số do Cổng Web cung cấp."
                        font.family: Theme.fontFamily
                        font.pixelSize: 16
                        color: "#6B7280"
                    }
                }

                // 6 Ô NHẬP OTP (Tương tác động, hiển thị số thực tế, không dùng ảnh tĩnh)
                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: 14

                    property string rawOtp: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentOtp : ""

                    Repeater {
                        model: 6
                        delegate: Rectangle {
                            id: otpBox
                            width: 96
                            height: 96
                            radius: 16
                            color: "#FFFFFF"

                            property string currentDigit: (parent.rawOtp.length > index) ? parent.rawOtp[index] : ""
                            property bool isActiveBox: (parent.rawOtp.length === index)

                            border.color: isActiveBox ? Theme.brandPurple : (currentDigit.length > 0 ? "#6366F1" : "#E5E7EB")
                            border.width: isActiveBox ? 2.5 : (currentDigit.length > 0 ? 2 : 1.5)

                            // Số OTP nhập vào
                            Text {
                                anchors.centerIn: parent
                                text: otpBox.currentDigit
                                font.family: Theme.fontFamily
                                font.pixelSize: 38
                                font.bold: true
                                color: "#111827"
                                visible: otpBox.currentDigit.length > 0
                            }

                            // Con trỏ nhấp nháy ở ô đang chờ nhập
                            Rectangle {
                                anchors.centerIn: parent
                                width: 2
                                height: 36
                                color: Theme.brandPurple
                                visible: otpBox.isActiveBox && (otpBox.currentDigit.length === 0)

                                SequentialAnimation on opacity {
                                    loops: Animation.Infinite
                                    PropertyAnimation { to: 0.0; duration: 500 }
                                    PropertyAnimation { to: 1.0; duration: 500 }
                                }
                            }

                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: cardItem.forceActiveFocus()
                            }
                        }
                    }
                }

                // BÀN PHÍM SỐ ẢO (VIRTUAL KEYPAD) TÍCH HỢP TRỰC TIẾP
                VirtualKeypad {
                    Layout.fillWidth: true
                    Layout.topMargin: 6
                    onDigitClicked: (digit) => {
                        if (typeof enrollmentController !== "undefined" && enrollmentController) {
                            enrollmentController.appendOtpDigit(digit)
                        }
                    }
                    onBackspaceClicked: {
                        if (typeof enrollmentController !== "undefined" && enrollmentController) {
                            enrollmentController.backspaceOtp()
                        }
                    }
                    onClearClicked: {
                        if (typeof enrollmentController !== "undefined" && enrollmentController) {
                            enrollmentController.clearOtp()
                        }
                    }
                }

                // NÚT XÁC THỰC MÃ
                Rectangle {
                    Layout.fillWidth: true
                    height: 64
                    radius: 14
                    property bool canVerify: (typeof enrollmentController !== "undefined" && enrollmentController) ? (enrollmentController.currentOtp.length === 6) : false
                    color: canVerify ? (mouseVerify.pressed ? Qt.darker(Theme.brandPurple, 1.15) : Theme.brandPurple) : "#E0E7FF"

                    RowLayout {
                        anchors.centerIn: parent
                        spacing: 8

                        Text {
                            text: "Xác thực mã OTP"
                            font.family: Theme.fontFamily
                            font.pixelSize: 20
                            font.bold: true
                            color: parent.parent.canVerify ? "#FFFFFF" : "#6366F1"
                        }
                    }

                    MouseArea {
                        id: mouseVerify
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            if (typeof enrollmentController !== "undefined" && enrollmentController) {
                                const isDev = (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.isDevMode)
                                if (isDev && enrollmentController.currentOtp.length === 0) {
                                    // Tự động điền mã mẫu demo chỉ khi ở Dev Mode
                                    for (let i = 0; i < "482619".length; i++) {
                                        enrollmentController.appendOtpDigit("482619"[i])
                                    }
                                }
                                enrollmentController.verifyOtp()
                            }
                        }
                    }
                }

                // Thông báo trạng thái / Hướng dẫn
                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.statusMessage : ""
                    font.family: Theme.fontFamily
                    font.pixelSize: 15
                    color: text.indexOf("lỗi") >= 0 || text.indexOf("không") >= 0 ? "#EF4444" : "#6B7280"
                }

                // Gợi ý demo nhanh (CHỈ hiển thị trong môi trường Development / Demo, ẩn hoàn toàn ở Production)
                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: 8
                    visible: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.isDevMode : false

                    Text {
                        text: "Mã mẫu thử nghiệm:"
                        font.family: Theme.fontFamily
                        font.pixelSize: 14
                        color: "#9CA3AF"
                    }

                    Rectangle {
                        height: 28
                        width: 80
                        radius: 6
                        color: "#F3F4F6"

                        Text {
                            anchors.centerIn: parent
                            text: "482619"
                            font.family: Theme.fontFamily
                            font.pixelSize: 14
                            font.bold: true
                            color: Theme.brandPurple
                        }

                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                if (typeof enrollmentController !== "undefined" && enrollmentController) {
                                    enrollmentController.clearOtp()
                                    for (let i = 0; i < "482619".length; i++) {
                                        enrollmentController.appendOtpDigit("482619"[i])
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ================= 4. BƯỚC 2: CĂN CHỈNH CAMERA & ĐA TƯ THẾ =================
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 20
                visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 2 : false

                property string curPose: (typeof enrollmentController !== "undefined" && enrollmentController && typeof enrollmentController.currentPose !== "undefined") ? enrollmentController.currentPose : "FRONTAL"
                property real curYaw: (typeof enrollmentController !== "undefined" && enrollmentController && typeof enrollmentController.currentYaw !== "undefined") ? enrollmentController.currentYaw : 0.0
                property bool matched: (typeof enrollmentController !== "undefined" && enrollmentController && typeof enrollmentController.isPoseMatched !== "undefined") ? enrollmentController.isPoseMatched : false
                property real prog: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.progressPercent : 0.0

                // 1. Row 3 Thẻ Tư Thế (3 Pose Cards)
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 12

                    // Card 1: FRONTAL
                    Rectangle {
                        Layout.fillWidth: true
                        height: 58
                        radius: 12
                        color: parent.parent.prog >= 0.33 ? "#DEF7EC" : (parent.parent.curPose === "FRONTAL" ? "#EEF2FF" : "#F5F6F8")
                        border.color: parent.parent.prog >= 0.33 ? "#31C48D" : (parent.parent.curPose === "FRONTAL" ? Theme.brandPurple : "#E5E7EB")
                        border.width: parent.parent.curPose === "FRONTAL" ? 2 : 1

                        RowLayout {
                            anchors.centerIn: parent
                            spacing: 8
                            Text {
                                text: parent.parent.parent.parent.prog >= 0.33 ? "✓" : "1"
                                font.bold: true
                                color: parent.parent.parent.parent.prog >= 0.33 ? "#0E9F6E" : (parent.parent.parent.parent.curPose === "FRONTAL" ? Theme.brandPurple : "#6B7280")
                            }
                            Text {
                                text: "Nhìn thẳng"
                                font.family: Theme.fontFamily
                                font.pixelSize: 14
                                font.bold: parent.parent.parent.parent.curPose === "FRONTAL"
                                color: parent.parent.parent.parent.prog >= 0.33 ? "#0E9F6E" : (parent.parent.parent.parent.curPose === "FRONTAL" ? Theme.brandPurple : "#4B5563")
                            }
                        }
                    }

                    // Card 2: LEFT_TILT
                    Rectangle {
                        Layout.fillWidth: true
                        height: 58
                        radius: 12
                        color: parent.parent.prog >= 0.66 ? "#DEF7EC" : (parent.parent.curPose === "LEFT_TILT" ? "#EEF2FF" : "#F5F6F8")
                        border.color: parent.parent.prog >= 0.66 ? "#31C48D" : (parent.parent.curPose === "LEFT_TILT" ? Theme.brandPurple : "#E5E7EB")
                        border.width: parent.parent.curPose === "LEFT_TILT" ? 2 : 1

                        RowLayout {
                            anchors.centerIn: parent
                            spacing: 8
                            Text {
                                text: parent.parent.parent.parent.prog >= 0.66 ? "✓" : "2"
                                font.bold: true
                                color: parent.parent.parent.parent.prog >= 0.66 ? "#0E9F6E" : (parent.parent.parent.parent.curPose === "LEFT_TILT" ? Theme.brandPurple : "#6B7280")
                            }
                            Text {
                                text: "Nghiêng trái"
                                font.family: Theme.fontFamily
                                font.pixelSize: 14
                                font.bold: parent.parent.parent.parent.curPose === "LEFT_TILT"
                                color: parent.parent.parent.parent.prog >= 0.66 ? "#0E9F6E" : (parent.parent.parent.parent.curPose === "LEFT_TILT" ? Theme.brandPurple : "#4B5563")
                            }
                        }
                    }

                    // Card 3: RIGHT_TILT
                    Rectangle {
                        Layout.fillWidth: true
                        height: 58
                        radius: 12
                        color: parent.parent.prog >= 1.0 ? "#DEF7EC" : (parent.parent.curPose === "RIGHT_TILT" ? "#EEF2FF" : "#F5F6F8")
                        border.color: parent.parent.prog >= 1.0 ? "#31C48D" : (parent.parent.curPose === "RIGHT_TILT" ? Theme.brandPurple : "#E5E7EB")
                        border.width: parent.parent.curPose === "RIGHT_TILT" ? 2 : 1

                        RowLayout {
                            anchors.centerIn: parent
                            spacing: 8
                            Text {
                                text: parent.parent.parent.parent.prog >= 1.0 ? "✓" : "3"
                                font.bold: true
                                color: parent.parent.parent.parent.prog >= 1.0 ? "#0E9F6E" : (parent.parent.parent.parent.curPose === "RIGHT_TILT" ? Theme.brandPurple : "#6B7280")
                            }
                            Text {
                                text: "Nghiêng phải"
                                font.family: Theme.fontFamily
                                font.pixelSize: 14
                                font.bold: parent.parent.parent.parent.curPose === "RIGHT_TILT"
                                color: parent.parent.parent.parent.prog >= 1.0 ? "#0E9F6E" : (parent.parent.parent.parent.curPose === "RIGHT_TILT" ? Theme.brandPurple : "#4B5563")
                            }
                        }
                    }
                }

                // 2. Camera Preview Circle with Directional Turn Cue Overlay
                Item {
                    Layout.alignment: Qt.AlignHCenter
                    width: 200
                    height: 200

                    Rectangle {
                        anchors.centerIn: parent
                        width: 170
                        height: 170
                        radius: 85
                        color: "#EEF2FF"
                        border.color: parent.parent.matched ? Theme.statusSuccess : Theme.brandPurple
                        border.width: 4
                        clip: true

                        Image {
                            anchors.fill: parent
                            fillMode: Image.PreserveAspectCrop
                            source: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? "image://camera?id=" + kioskViewModel.frameTick : ""
                            cache: false
                        }
                    }

                    // Animated Left Turn Arrow
                    Text {
                        anchors.left: parent.left
                        anchors.verticalCenter: parent.verticalCenter
                        text: "◀"
                        font.pixelSize: 30
                        color: Theme.brandPurple
                        visible: parent.parent.curPose === "LEFT_TILT"
                        SequentialAnimation on opacity {
                            loops: Animation.Infinite
                            PropertyAnimation { to: 0.3; duration: 600 }
                            PropertyAnimation { to: 1.0; duration: 600 }
                        }
                    }

                    // Animated Right Turn Arrow
                    Text {
                        anchors.right: parent.right
                        anchors.verticalCenter: parent.verticalCenter
                        text: "▶"
                        font.pixelSize: 30
                        color: Theme.brandPurple
                        visible: parent.parent.curPose === "RIGHT_TILT"
                        SequentialAnimation on opacity {
                            loops: Animation.Infinite
                            PropertyAnimation { to: 0.3; duration: 600 }
                            PropertyAnimation { to: 1.0; duration: 600 }
                        }
                    }
                }

                // 3. Thanh Thước Đo Góc Yaw (Real-Time Yaw Angle Gauge)
                ColumnLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: 6

                    Rectangle {
                        id: yawGauge
                        width: 480
                        height: 28
                        radius: 14
                        color: "#F3F4F6"
                        border.color: "#E5E7EB"
                        border.width: 1
                        clip: true

                        // Chuyển đổi góc Yaw sang tọa độ x trên màn hình:
                        // Hướng TRÁI (Left Tilt, Yaw dương) nằm bên TRÁI thanh đo
                        // Hướng PHẢI (Right Tilt, Yaw âm) nằm bên PHẢI thanh đo
                        function yawToX(yaw) {
                            return Math.min(width, Math.max(0, ((30.0 - yaw) / 60.0) * width))
                        }

                        // Vùng Mục Tiêu Đạt Chuẩn (Target Zone)
                        Rectangle {
                            id: targetZone
                            height: parent.height
                            color: Qt.rgba(0.063, 0.725, 0.506, 0.25)
                            border.color: "#10B981"
                            border.width: 1.5
                            radius: 4

                            property real targetLeftDeg: parent.parent.parent.curPose === "FRONTAL" ? 5.0 : (parent.parent.parent.curPose === "LEFT_TILT" ? 25.0 : -10.0)
                            property real targetRightDeg: parent.parent.parent.curPose === "FRONTAL" ? -5.0 : (parent.parent.parent.curPose === "LEFT_TILT" ? 10.0 : -25.0)

                            x: Math.min(yawGauge.yawToX(targetLeftDeg), yawGauge.yawToX(targetRightDeg))
                            width: Math.max(16, Math.abs(yawGauge.yawToX(targetRightDeg) - yawGauge.yawToX(targetLeftDeg)))
                        }

                        // Vạch 0 độ chính giữa
                        Rectangle {
                            width: 2
                            height: parent.height
                            x: parent.width / 2 - 1
                            color: "#9CA3AF"
                        }

                        // Con trỏ góc Yaw hiện tại (Dynamic Needle)
                        Rectangle {
                            width: 8
                            height: parent.height - 4
                            y: 2
                            radius: 4
                            color: parent.parent.parent.matched ? "#10B981" : (parent.parent.parent.curPose === "FRONTAL" && Math.abs(parent.parent.parent.curYaw) > 10.0 ? "#EF4444" : "#F59E0B")
                            x: Math.min(parent.width - width, Math.max(0, yawGauge.yawToX(parent.parent.parent.curYaw) - width / 2))

                            Behavior on x {
                                NumberAnimation { duration: 60; easing.type: Easing.OutQuad }
                            }
                        }
                    }

                    // Nhãn góc độ
                    RowLayout {
                        Layout.preferredWidth: 480
                        Text { text: "◀ TRÁI (Nghiêng trái)"; font.pixelSize: 11; font.bold: parent.parent.curPose === "LEFT_TILT"; color: parent.parent.curPose === "LEFT_TILT" ? "#10B981" : "#9CA3AF" }
                        Item { Layout.fillWidth: true }
                        Text {
                            text: "Góc Yaw: " + (parent.parent.parent.curYaw >= 0 ? "+" : "") + parent.parent.parent.curYaw.toFixed(1) + "°"
                            font.family: Theme.fontFamily
                            font.pixelSize: 13
                            font.bold: true
                            color: parent.parent.parent.matched ? "#10B981" : "#4B5563"
                        }
                        Item { Layout.fillWidth: true }
                        Text { text: "PHẢI (Nghiêng phải) ▶"; font.pixelSize: 11; font.bold: parent.parent.curPose === "RIGHT_TILT"; color: parent.parent.curPose === "RIGHT_TILT" ? "#10B981" : "#9CA3AF" }
                    }
                }

                // 4. Thông điệp chỉ dẫn tiếng Việt
                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.statusMessage : ""
                    font.family: Theme.fontFamily
                    font.pixelSize: 16
                    font.bold: true
                    color: parent.matched ? Theme.statusSuccess : Theme.textPrimary
                    horizontalAlignment: Text.AlignHCenter
                }

                // 5. Thanh tiến độ thu thập ảnh
                ProgressBar {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.preferredWidth: 480
                    Layout.preferredHeight: 10
                    value: parent.prog
                }

                // Nút mô phỏng hoàn tất ảnh chụp nếu test ngoại tuyến (CHỈ hiển thị ở Dev Mode)
                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.preferredWidth: 320
                    height: 48
                    radius: 12
                    color: "#F3F4F6"
                    visible: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.isDevMode : false

                    Text {
                        anchors.centerIn: parent
                        text: "Bấm để hoàn tất bước chụp ảnh (Demo)"
                        font.family: Theme.fontFamily
                        font.pixelSize: 14
                        font.bold: true
                        color: Theme.brandPurple
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            if (typeof enrollmentController !== "undefined" && enrollmentController) {
                                if (typeof enrollmentController.completeCaptureStep === "function") {
                                    enrollmentController.completeCaptureStep()
                                } else {
                                    enrollmentController.setCurrentStep(3)
                                }
                            }
                        }
                    }
                }
            }

            // ================= 5. BƯỚC 3: HOÀN TẤT ĐĂNG KÝ =================
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 28
                visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 3 : false

                Item { Layout.preferredHeight: 40 }

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 130
                    height: 130
                    radius: 65
                    color: "#DEF7EC"
                    border.color: "#31C48D"
                    border.width: 3

                    Text {
                        anchors.centerIn: parent
                        text: "✓"
                        font.pixelSize: 64
                        font.bold: true
                        color: "#0E9F6E"
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "Đăng ký khuôn mặt thành công!"
                    font.family: Theme.fontFamily
                    font.pixelSize: 26
                    font.bold: true
                    color: "#111827"
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.statusMessage : "Dữ liệu khuôn mặt đã được cập nhật thành công."
                    font.family: Theme.fontFamily
                    font.pixelSize: 17
                    color: "#6B7280"
                }

                Item { Layout.preferredHeight: 20 }

                Rectangle {
                    Layout.fillWidth: true
                    height: 60
                    radius: 14
                    color: Theme.brandPurple

                    Text {
                        anchors.centerIn: parent
                        text: "Hoàn tất & Quay về màn hình chính"
                        font.family: Theme.fontFamily
                        font.pixelSize: 18
                        font.bold: true
                        color: "#FFFFFF"
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.close()
                    }
                }
            }

            Item { Layout.fillHeight: true }

            // ================= 6. FOOTER: HỦY ĐĂNG KÝ =================
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Hủy đăng ký • Esc"
                font.family: Theme.fontFamily
                font.pixelSize: 16
                font.weight: Font.DemiBold
                color: "#6B7280"

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.close()
                }
            }
        }
    }
}
