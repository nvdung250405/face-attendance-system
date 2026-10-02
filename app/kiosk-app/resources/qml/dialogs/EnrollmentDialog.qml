import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"
import "../components"

Dialog {
    id: enrollDialog
    modal: true
    anchors.centerIn: parent
    width: 680
    height: 920
    padding: 0
    closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside

    background: Rectangle {
        radius: Theme.radiusXl // 20px
        color: Theme.bgCard
        border.color: Theme.bgCanvas
        border.width: 1

        Rectangle {
            anchors.fill: parent
            anchors.topMargin: 16
            radius: Theme.radiusXl
            color: Qt.rgba(0.067, 0.094, 0.153, 0.25)
            z: -1
        }
    }

    contentItem: ColumnLayout {
        spacing: 24

        // 1. Tiêu đề Dialog & Nút đóng
        RowLayout {
            Layout.fillWidth: true
            Layout.leftMargin: 36
            Layout.rightMargin: 36
            Layout.topMargin: 32

            ColumnLayout {
                spacing: 4
                Text {
                    text: "Đăng ký khuôn mặt mới"
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontTitleLg // 38px
                    font.weight: Font.DemiBold
                    color: Theme.textPrimary
                }
                Text {
                    text: "Nhập mã kích hoạt OTP do Cổng Web cung cấp"
                    font.family: Theme.fontFamily
                    font.pixelSize: 18
                    color: Theme.textSecondary
                }
            }

            Item { Layout.fillWidth: true }

            Rectangle {
                width: 48
                height: 48
                radius: Theme.radiusMd
                color: Theme.bgCanvas

                Text {
                    anchors.centerIn: parent
                    text: "✕"
                    font.pixelSize: 20
                    color: Theme.textSecondary
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        if (typeof enrollmentController !== "undefined" && enrollmentController) {
                            enrollmentController.reset()
                        }
                        enrollDialog.close()
                    }
                }
            }
        }

        // 2. Thanh tiến trình 3 bước chuẩn Figma (Enrollment progress)
        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 600
            spacing: 12

            Repeater {
                model: [
                    { step: 1, title: "1. Nhập OTP" },
                    { step: 2, title: "2. Căn chỉnh" },
                    { step: 3, title: "3. Hoàn tất" }
                ]
                delegate: Rectangle {
                    Layout.fillWidth: true
                    height: 52
                    radius: Theme.radiusSm // 12px
                    property int curStep: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep : 1
                    color: modelData.step === curStep ? Theme.brandPurpleSoft : (modelData.step < curStep ? Theme.statusSuccessBg : Theme.bgCanvas)

                    Text {
                        anchors.centerIn: parent
                        text: modelData.title
                        font.family: Theme.fontFamily
                        font.pixelSize: 16
                        font.weight: Font.DemiBold
                        color: modelData.step === curStep ? Theme.brandPurple : (modelData.step < curStep ? Theme.statusSuccess : Theme.textSubtle)
                    }
                }
            }
        }

        // 3. Nội dung hiển thị theo 3 bước
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true

            // Bước 1: 6 ô nhập mã OTP & Bàn phím số
            ColumnLayout {
                anchors.fill: parent
                visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 1 : true
                spacing: 20

                // 6 ô số OTP
                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: 12

                    Repeater {
                        model: 6
                        delegate: Rectangle {
                            width: 68
                            height: 76
                            radius: Theme.radiusMd
                            color: Theme.bgCanvas
                            border.color: {
                                var otpStr = (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentOtp : ""
                                return index === otpStr.length ? Theme.brandPurple : "transparent"
                            }
                            border.width: 2

                            Text {
                                anchors.centerIn: parent
                                text: {
                                    var otpStr = (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentOtp : ""
                                    return index < otpStr.length ? otpStr[index] : ""
                                }
                                font.family: Theme.fontFamily
                                font.pixelSize: 32
                                font.bold: true
                                color: Theme.textPrimary
                            }
                        }
                    }
                }

                VirtualKeypad {
                    Layout.alignment: Qt.AlignHCenter
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

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.preferredWidth: 540
                    Layout.preferredHeight: 60
                    radius: Theme.radiusMd

                    property bool isReady: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentOtp.length === 6 : false
                    color: isReady ? Theme.brandPurple : Theme.bgCanvas

                    Text {
                        anchors.centerIn: parent
                        text: "Xác thực mã OTP"
                        font.family: Theme.fontFamily
                        font.pixelSize: 20
                        font.weight: Font.DemiBold
                        color: parent.isReady ? "#FFFFFF" : Theme.textSubtle
                    }

                    MouseArea {
                        anchors.fill: parent
                        enabled: parent.isReady
                        cursorShape: parent.isReady ? Qt.PointingHandCursor : Qt.ArrowCursor
                        onClicked: {
                            if (typeof enrollmentController !== "undefined" && enrollmentController) {
                                enrollmentController.verifyOtp()
                            }
                        }
                    }
                }
            }

            // Bước 2: Hướng dẫn căn chỉnh & chụp tự động
            ColumnLayout {
                anchors.centerIn: parent
                visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 2 : false
                spacing: 24

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 100
                    height: 100
                    radius: 50
                    color: Theme.brandPurpleSoft

                    Text {
                        anchors.centerIn: parent
                        text: "📷"
                        font.pixelSize: 48
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "Giữ thẳng đầu và nhìn trực diện vào camera"
                    font.family: Theme.fontFamily
                    font.pixelSize: 22
                    font.bold: true
                    color: Theme.textPrimary
                }

                ProgressBar {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.preferredWidth: 400
                    value: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.progressPercent : 0.5
                }
            }

            // Bước 3: Đăng ký thành công
            ColumnLayout {
                anchors.centerIn: parent
                visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 3 : false
                spacing: 20

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 100
                    height: 100
                    radius: 50
                    color: Theme.statusSuccessBg

                    Text {
                        anchors.centerIn: parent
                        text: "✓"
                        font.family: Theme.fontFamily
                        font.pixelSize: 52
                        font.bold: true
                        color: Theme.statusSuccess
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "Đăng ký khuôn mặt thành công!"
                    font.family: Theme.fontFamily
                    font.pixelSize: 24
                    font.bold: true
                    color: Theme.statusSuccess
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "Dữ liệu sinh trắc học đã được kích hoạt trên hệ thống"
                    font.family: Theme.fontFamily
                    font.pixelSize: 18
                    color: Theme.textSecondary
                }
            }
        }
    }
}
