import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

Dialog {
    id: enrollDialog
    modal: true
    anchors.centerIn: parent
    width: 580
    height: 680
    scale: (typeof window !== "undefined" && window) ? window.scaleRatio : 1.0
    transformOrigin: Item.Center
    padding: 0
    closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside

    background: Rectangle {
        radius: 20
        color: "#FFFFFF"
        border.color: "#E5E7EB"
        border.width: 1

        Rectangle {
            anchors.fill: parent
            anchors.topMargin: 12
            radius: 20
            color: Qt.rgba(0.067, 0.094, 0.153, 0.18)
            z: -1
        }
    }

    // Keyboard support for typing OTP directly
    focus: true
    Keys.onPressed: function(event) {
        if (event.key >= Qt.Key_0 && event.key <= Qt.Key_9) {
            var digit = String(event.key - Qt.Key_0)
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
            enrollDialog.close()
            event.accepted = true
        }
    }

    contentItem: ColumnLayout {
        spacing: 20
        anchors.fill: parent
        anchors.margins: 28

        // 1. Header: Tiêu đề & Nút đóng [✕]
        RowLayout {
            Layout.fillWidth: true

            Text {
                text: "Đăng ký khuôn mặt mới"
                font.family: Theme.fontFamily
                font.pixelSize: 24
                font.bold: true
                color: "#111827"
            }

            Item { Layout.fillWidth: true }

            Rectangle {
                width: 38
                height: 38
                radius: 10
                color: "#F5F6F8"

                Text {
                    anchors.centerIn: parent
                    text: "✕"
                    font.pixelSize: 16
                    color: "#6B7280"
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

        // 2. Thanh Tabs 3 bước chuẩn Figma
        RowLayout {
            Layout.fillWidth: true
            spacing: 10

            property int curStep: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep : 1

            // Tab 1: Xác thực
            Rectangle {
                Layout.fillWidth: true
                height: 42
                radius: 10
                color: parent.curStep === 1 ? "#EEF2FF" : "#F5F6F8"

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 8

                    Rectangle {
                        width: 22
                        height: 22
                        radius: 11
                        color: parent.parent.parent.curStep === 1 ? Theme.brandPurple : "transparent"

                        Text {
                            anchors.centerIn: parent
                            text: "1"
                            font.family: Theme.fontFamily
                            font.pixelSize: 13
                            font.bold: true
                            color: parent.parent.parent.parent.curStep === 1 ? "#FFFFFF" : "#111827"
                        }
                    }

                    Text {
                        text: "Xác thực"
                        font.family: Theme.fontFamily
                        font.pixelSize: 15
                        font.weight: Font.DemiBold
                        color: "#111827"
                    }
                }
            }

            // Tab 2: Căn chỉnh
            Rectangle {
                Layout.fillWidth: true
                height: 42
                radius: 10
                color: parent.curStep === 2 ? "#EEF2FF" : "#F5F6F8"

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 8

                    Rectangle {
                        width: 22
                        height: 22
                        radius: 11
                        color: parent.parent.parent.curStep === 2 ? Theme.brandPurple : "transparent"

                        Text {
                            anchors.centerIn: parent
                            text: "2"
                            font.family: Theme.fontFamily
                            font.pixelSize: 13
                            font.bold: true
                            color: parent.parent.parent.parent.curStep === 2 ? "#FFFFFF" : "#111827"
                        }
                    }

                    Text {
                        text: "Căn chỉnh"
                        font.family: Theme.fontFamily
                        font.pixelSize: 15
                        font.weight: Font.DemiBold
                        color: "#111827"
                    }
                }
            }

            // Tab 3: Hoàn tất
            Rectangle {
                Layout.fillWidth: true
                height: 42
                radius: 10
                color: parent.curStep === 3 ? "#EEF2FF" : "#F5F6F8"

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 8

                    Rectangle {
                        width: 22
                        height: 22
                        radius: 11
                        color: parent.parent.parent.curStep === 3 ? Theme.brandPurple : "transparent"

                        Text {
                            anchors.centerIn: parent
                            text: "3"
                            font.family: Theme.fontFamily
                            font.pixelSize: 13
                            font.bold: true
                            color: parent.parent.parent.parent.curStep === 3 ? "#FFFFFF" : "#111827"
                        }
                    }

                    Text {
                        text: "Hoàn tất"
                        font.family: Theme.fontFamily
                        font.pixelSize: 15
                        font.weight: Font.DemiBold
                        color: "#111827"
                    }
                }
            }
        }

        // ================= STEP 1: NHẬP MÃ XÁC THỰC =================
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 16
            visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 1 : true

            // Tiêu đề phụ & Hướng dẫn
            ColumnLayout {
                spacing: 4
                Text {
                    text: "Nhập mã xác thực"
                    font.family: Theme.fontFamily
                    font.pixelSize: 19
                    font.bold: true
                    color: "#111827"
                }

                Text {
                    text: "Nhập mã kích hoạt OTP gồm 6 chữ số do Cổng Web\ncung cấp."
                    font.family: Theme.fontFamily
                    font.pixelSize: 14
                    color: "#6B7280"
                    lineHeight: 1.2
                }
            }

            // 6 ô số OTP (Figma: 4 8 2 6 1 9 hoặc từ controller)
            RowLayout {
                Layout.alignment: Qt.AlignHCenter
                spacing: 10

                Repeater {
                    model: 6
                    delegate: Rectangle {
                        width: 74
                        height: 78
                        radius: 12
                        color: "#FFFFFF"
                        border.color: Theme.brandPurple
                        border.width: 1.5

                        property string otpStr: {
                            if (typeof enrollmentController !== "undefined" && enrollmentController && enrollmentController.currentOtp.length > 0) {
                                return enrollmentController.currentOtp
                            }
                            return "482619" // Chuẩn Figma mockup mặc định
                        }

                        Text {
                            anchors.centerIn: parent
                            text: index < parent.otpStr.length ? parent.otpStr[index] : ""
                            font.family: Theme.fontFamily
                            font.pixelSize: 30
                            font.bold: true
                            color: "#111827"
                        }
                    }
                }
            }

            // Nút Xác thực mã
            Rectangle {
                Layout.fillWidth: true
                height: 50
                radius: 12
                color: Theme.brandPurple

                Text {
                    anchors.centerIn: parent
                    text: "Xác thực mã"
                    font.family: Theme.fontFamily
                    font.pixelSize: 16
                    font.bold: true
                    color: "#FFFFFF"
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        if (typeof enrollmentController !== "undefined" && enrollmentController) {
                            enrollmentController.verifyOtp()
                        }
                    }
                }
            }

            // Dòng ngăn cách: hoặc sử dụng mã QR
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "hoặc sử dụng mã QR"
                font.family: Theme.fontFamily
                font.pixelSize: 14
                color: "#6B7280"
            }

            // Thẻ quét mã QR
            Rectangle {
                Layout.fillWidth: true
                height: 84
                radius: 14
                color: "#EEF2FF"

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 14
                    spacing: 16

                    // Khung icon QR
                    Rectangle {
                        width: 56
                        height: 56
                        radius: 10
                        color: "#FFFFFF"

                        // Minh họa icon QR vector
                        Item {
                            anchors.centerIn: parent
                            width: 32
                            height: 32

                            // 4 góc QR
                            Rectangle { x: 2; y: 2; width: 10; height: 10; radius: 3; color: "transparent"; border.color: "#111827"; border.width: 2 }
                            Rectangle { x: 20; y: 2; width: 10; height: 10; radius: 3; color: "transparent"; border.color: "#111827"; border.width: 2 }
                            Rectangle { x: 2; y: 20; width: 10; height: 10; radius: 3; color: "transparent"; border.color: "#111827"; border.width: 2 }
                            Rectangle { x: 20; y: 20; width: 8; height: 8; radius: 2; color: "#111827" }
                        }
                    }

                    ColumnLayout {
                        spacing: 2
                        Layout.fillWidth: true

                        Text {
                            text: "Đưa mã QR trước camera"
                            font.family: Theme.fontFamily
                            font.pixelSize: 16
                            font.bold: true
                            color: "#111827"
                        }

                        Text {
                            text: "Sử dụng mã QR được cấp trên Cổng\nWeb để xác thực."
                            font.family: Theme.fontFamily
                            font.pixelSize: 13
                            color: "#6B7280"
                        }
                    }
                }
            }

            // Thẻ thông báo hỗ trợ
            Rectangle {
                Layout.fillWidth: true
                height: 58
                radius: 10
                color: "#F5F6F8"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 16
                    anchors.rightMargin: 16
                    spacing: 12

                    Text {
                        text: "ⓘ"
                        font.pixelSize: 18
                        color: Theme.brandPurple
                    }

                    Text {
                        text: "Nếu chưa có mã kích hoạt, vui lòng liên hệ bộ phận\nquản lý nhân sự."
                        font.family: Theme.fontFamily
                        font.pixelSize: 13
                        color: "#6B7280"
                        Layout.fillWidth: true
                    }
                }
            }
        }

        // ================= STEP 2: CĂN CHỈNH CAMERA =================
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 20
            visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 2 : false

            Rectangle {
                Layout.alignment: Qt.AlignHCenter
                width: 100
                height: 100
                radius: 50
                color: "#EEF2FF"

                Text {
                    anchors.centerIn: parent
                    text: "📷"
                    font.pixelSize: 44
                }
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Giữ thẳng đầu và nhìn trực diện vào camera"
                font.family: Theme.fontFamily
                font.pixelSize: 18
                font.bold: true
                color: "#111827"
            }

            ProgressBar {
                Layout.alignment: Qt.AlignHCenter
                Layout.preferredWidth: 360
                value: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.progressPercent : 0.5
            }
        }

        // ================= STEP 3: HOÀN TẤT =================
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 20
            visible: (typeof enrollmentController !== "undefined" && enrollmentController) ? enrollmentController.currentStep === 3 : false

            Rectangle {
                Layout.alignment: Qt.AlignHCenter
                width: 100
                height: 100
                radius: 50
                color: "#E8F7ED"

                Text {
                    anchors.centerIn: parent
                    text: "✓"
                    font.family: Theme.fontFamily
                    font.pixelSize: 50
                    font.bold: true
                    color: "#20A464"
                }
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Đăng ký khuôn mặt thành công!"
                font.family: Theme.fontFamily
                font.pixelSize: 22
                font.bold: true
                color: "#20A464"
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Dữ liệu sinh trắc học đã được kích hoạt trên hệ thống"
                font.family: Theme.fontFamily
                font.pixelSize: 15
                color: "#6B7280"
            }
        }

        // 4. Footer link: Hủy đăng ký • Esc
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Hủy đăng ký • Esc"
            font.family: Theme.fontFamily
            font.pixelSize: 14
            font.weight: Font.DemiBold
            color: "#6B7280"

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
}
