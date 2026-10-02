import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: panel
    color: Theme.crustColor
    radius: 14
    border.color: Theme.surfaceColor
    border.width: 1

    signal pinClicked()
    signal enrollClicked()
    signal helpClicked()

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 14

        // Tiêu đề Card
        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            Rectangle {
                width: 4
                height: 16
                radius: 2
                color: Theme.accentColor
            }

            Text {
                text: "PHƯƠNG THỨC XÁC THỰC & TIỆN ÍCH"
                font.pixelSize: 13
                font.bold: true
                color: Theme.textSecondary
                font.letterSpacing: 0.5
            }
        }

        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: Theme.surfaceColor
        }

        // Danh sách 3 nút bấm cảm ứng lớn
        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 12

            // Nút 1: Chấm công bằng mã PIN
            Rectangle {
                id: pinBtn
                Layout.fillWidth: true
                Layout.fillHeight: true
                radius: 12
                color: pinMouse.pressed ? Theme.surfaceVariant : (pinMouse.containsMouse ? "#3A3C52" : Theme.surfaceColor)
                border.color: pinMouse.containsMouse ? Theme.accentColor : Theme.surfaceVariant
                border.width: 1

                Behavior on color { ColorAnimation { duration: 150 } }

                MouseArea {
                    id: pinMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                            kioskViewModel.requestPinFallback()
                        }
                        panel.pinClicked()
                    }
                }

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 16
                    anchors.rightMargin: 16
                    spacing: 16

                    Rectangle {
                        width: 44
                        height: 44
                        radius: 10
                        color: Theme.mantleColor

                        Text {
                            anchors.centerIn: parent
                            text: "🔢"
                            font.pixelSize: 22
                        }
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 3

                        Text {
                            text: "Xác thực bằng mã PIN"
                            font.pixelSize: 15
                            font.bold: true
                            color: Theme.textPrimary
                        }

                        Text {
                            text: "Dự phòng khi camera lỗi hoặc đeo khẩu trang"
                            font.pixelSize: 11
                            color: Theme.textSubtle
                        }
                    }

                    Text {
                        text: "➔"
                        font.pixelSize: 16
                        color: Theme.textSecondary
                    }
                }
            }

            // Nút 2: Đăng ký nhân viên mới (OTP)
            Rectangle {
                id: enrollBtn
                Layout.fillWidth: true
                Layout.fillHeight: true
                radius: 12
                color: enrollMouse.pressed ? Theme.surfaceVariant : (enrollMouse.containsMouse ? "#3A3C52" : Theme.surfaceColor)
                border.color: enrollMouse.containsMouse ? Theme.accentColor : Theme.surfaceVariant
                border.width: 1

                Behavior on color { ColorAnimation { duration: 150 } }

                MouseArea {
                    id: enrollMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                            kioskViewModel.requestEnrollment()
                        }
                        panel.enrollClicked()
                    }
                }

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 16
                    anchors.rightMargin: 16
                    spacing: 16

                    Rectangle {
                        width: 44
                        height: 44
                        radius: 10
                        color: Theme.mantleColor

                        Text {
                            anchors.centerIn: parent
                            text: "👤+"
                            font.pixelSize: 20
                            color: Theme.accentColor
                            font.bold: true
                        }
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 3

                        Text {
                            text: "Đăng ký khuôn mặt mới"
                            font.pixelSize: 15
                            font.bold: true
                            color: Theme.textPrimary
                        }

                        Text {
                            text: "Nhập mã OTP 6 số kích hoạt do HR cung cấp"
                            font.pixelSize: 11
                            color: Theme.textSubtle
                        }
                    }

                    Text {
                        text: "➔"
                        font.pixelSize: 16
                        color: Theme.textSecondary
                    }
                }
            }

            // Nút 3: Trợ giúp / Báo sự cố
            Rectangle {
                id: helpBtn
                Layout.fillWidth: true
                Layout.fillHeight: true
                radius: 12
                color: helpMouse.pressed ? Theme.surfaceVariant : (helpMouse.containsMouse ? "#3A3C52" : Theme.surfaceColor)
                border.color: helpMouse.containsMouse ? Theme.accentColor : Theme.surfaceVariant
                border.width: 1

                Behavior on color { ColorAnimation { duration: 150 } }

                MouseArea {
                    id: helpMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: panel.helpClicked()
                }

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 16
                    anchors.rightMargin: 16
                    spacing: 16

                    Rectangle {
                        width: 44
                        height: 44
                        radius: 10
                        color: Theme.mantleColor

                        Text {
                            anchors.centerIn: parent
                            text: "❓"
                            font.pixelSize: 22
                        }
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 3

                        Text {
                            text: "Hướng dẫn & Trợ giúp"
                            font.pixelSize: 15
                            font.bold: true
                            color: Theme.textPrimary
                        }

                        Text {
                            text: "Cách đứng quét chuẩn hoặc liên hệ IT hỗ trợ"
                            font.pixelSize: 11
                            color: Theme.textSubtle
                        }
                    }

                    Text {
                        text: "➔"
                        font.pixelSize: 16
                        color: Theme.textSecondary
                    }
                }
            }
        }

        // Thông tin dưới chân Card
        RowLayout {
            Layout.fillWidth: true
            spacing: 6

            Text {
                text: "🔒"
                font.pixelSize: 11
            }

            Text {
                text: "Dữ liệu được lưu trữ ngoại tuyến qua SQLite WAL an toàn"
                font.pixelSize: 11
                color: Theme.textSubtle
            }
        }
    }
}
