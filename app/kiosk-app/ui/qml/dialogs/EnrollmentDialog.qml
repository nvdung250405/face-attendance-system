import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"
import "../components"

Dialog {
    id: enrollDialog
    title: "Đăng ký khuôn mặt nhân viên mới"
    modal: true
    anchors.centerIn: parent
    width: 460
    height: 560

    ColumnLayout {
        anchors.fill: parent
        spacing: 16

        // 1. Tiêu đề hướng dẫn
        Label {
            text: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.statusMessage : "Đăng ký"
            Layout.fillWidth: true
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            font.pixelSize: 14
            color: Theme.textPrimary
        }

        // 2. Bước 1: Nhập mã OTP
        ColumnLayout {
            Layout.fillWidth: true
            visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 1 : true
            spacing: 12

            TextField {
                id: otpField
                Layout.fillWidth: true
                readOnly: true
                horizontalAlignment: TextInput.AlignHCenter
                font.pixelSize: 24
                font.bold: true
                placeholderText: "Nhập mã OTP 6 số"
                text: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentOtp : ""
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

            Button {
                text: "Xác thực OTP"
                Layout.alignment: Qt.AlignHCenter
                enabled: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentOtp.length === 6 : false
                onClicked: {
                    if (typeof enrollmentController !== "undefined" && enrollmentController) {
                        enrollmentController.verifyOtp()
                    }
                }
            }
        }

        // 3. Bước 2: Thanh tiến trình chụp ảnh
        ColumnLayout {
            Layout.fillWidth: true
            visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 2 : false
            spacing: 12

            Label {
                text: "Tiến trình thu thập 3 góc ảnh chuẩn hóa:"
                font.pixelSize: 13
                color: Theme.textSecondary
            }

            ProgressBar {
                Layout.fillWidth: true
                value: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.progressPercent : 0.0
            }
        }

        // 4. Bước 3: Hoàn tất
        ColumnLayout {
            Layout.fillWidth: true
            visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 3 : false
            spacing: 12

            Label {
                text: "✅ Đăng ký mẫu sinh trắc học thành công!"
                font.pixelSize: 16
                font.bold: true
                color: Theme.ovalSuccess
                Layout.alignment: Qt.AlignHCenter
            }
        }

        Item { Layout.fillHeight: true }

        // Nút Hủy / Đóng
        Button {
            text: "Hủy bỏ / Đóng"
            Layout.alignment: Qt.AlignHCenter
            onClicked: {
                if (typeof enrollmentController !== "undefined" && enrollmentController) {
                    enrollmentController.reset()
                }
                enrollDialog.close()
            }
        }
    }
}
