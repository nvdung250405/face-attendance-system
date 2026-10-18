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
            enrollmentController.setDialogOpen(true)
            if (enrollmentController.currentStep === 3 || enrollmentController.currentStep === 2) {
                enrollmentController.reset()
            }
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

        function onCurrentStepChanged(step) {
            if (step === 2 || step === 3) {
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
                                if (enrollmentController.currentOtp.length === 0) {
                                    // Tự động điền mã mẫu Figma để demo nhanh nếu người dùng chưa nhập
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

                // Gợi ý demo nhanh
                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: 8

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

            // ================= 4. BƯỚC 2: CĂN CHỈNH CAMERA =================
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 28
                visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 2 : false

                Item { Layout.preferredHeight: 20 }

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 160
                    height: 160
                    radius: 80
                    color: "#EEF2FF"
                    border.color: Theme.brandPurple
                    border.width: 4
                    clip: true

                    Image {
                        anchors.fill: parent
                        fillMode: Image.PreserveAspectCrop
                        source: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? "image://camera?id=" + kioskViewModel.frameTick : ""
                        cache: false
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "Giữ thẳng đầu và nhìn trực diện vào camera"
                    font.family: Theme.fontFamily
                    font.pixelSize: 22
                    font.bold: true
                    color: "#111827"
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.statusMessage : ""
                    font.family: Theme.fontFamily
                    font.pixelSize: 16
                    color: "#6B7280"
                }

                ProgressBar {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.preferredWidth: 500
                    Layout.preferredHeight: 12
                    value: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.progressPercent : 0.0
                }

                // Nút mô phỏng hoàn tất ảnh chụp nếu test ngoại tuyến
                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.preferredWidth: 320
                    height: 52
                    radius: 12
                    color: "#F3F4F6"

                    Text {
                        anchors.centerIn: parent
                        text: "Bấm để hoàn tất bước chụp ảnh"
                        font.family: Theme.fontFamily
                        font.pixelSize: 15
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
