import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

Item {
    id: root
    anchors.fill: parent
    z: 1000
    visible: opacity > 0
    opacity: 0.0

    property bool isOpen: false

    function open() {
        isOpen = true
        opacity = 1.0
        cardItem.forceActiveFocus()
    }

    function close() {
        isOpen = false
        opacity = 0.0
    }

    Behavior on opacity {
        NumberAnimation { duration: 220; easing.type: Easing.OutCubic }
    }

    // 1. Backdrop Overlay tối 1080x1920
    Rectangle {
        anchors.fill: parent
        color: Qt.rgba(0, 0, 0, 0.65)

        MouseArea {
            anchors.fill: parent
            onClicked: root.close()
        }
    }

    // 2. Thẻ Card Dialog chính giữa (Figma: width 800, height 1400)
    Rectangle {
        id: cardItem
        width: 800
        height: 1400
        anchors.centerIn: parent
        radius: 24
        color: "#FFFFFF"
        border.color: "#E5E7EB"
        border.width: 1
        clip: true

        // Hiệu ứng đổ bóng
        Rectangle {
            anchors.fill: parent
            anchors.topMargin: 16
            radius: 24
            color: Qt.rgba(0, 0, 0, 0.20)
            z: -1
        }

        MouseArea {
            anchors.fill: parent
            // Chặn click xuyên backdrop
        }

        focus: true
        Keys.onPressed: function(event) {
            if (event.key === Qt.Key_Escape || event.key === Qt.Key_F1) {
                root.close()
                event.accepted = true
            }
        }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 40
            spacing: 24

            // ================= 1. HEADER DIALOG =================
            RowLayout {
                Layout.fillWidth: true

                Text {
                    text: "Hướng dẫn sử dụng"
                    font.family: Theme.fontFamily
                    font.pixelSize: 32
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

            // ================= 2. MINH HỌA TRỰC QUAN KHOẢNG CÁCH (FIGMA) =================
            Rectangle {
                Layout.fillWidth: true
                height: 220
                radius: 18
                color: "#EEF2FF"
                clip: true

                Item {
                    anchors.fill: parent

                    // Minh họa Kiosk bên trái
                    Item {
                        x: 80
                        y: 30
                        width: 90
                        height: 160

                        Rectangle {
                            x: 10
                            y: 0
                            width: 70
                            height: 120
                            radius: 10
                            color: "#FFFFFF"
                            border.color: "#111827"
                            border.width: 4

                            Rectangle {
                                anchors.centerIn: parent
                                width: 50
                                height: 90
                                radius: 6
                                color: "#EEF2FF"

                                Rectangle {
                                    anchors.centerIn: parent
                                    width: 32
                                    height: 44
                                    radius: 16
                                    color: "transparent"
                                    border.color: Theme.brandPurple
                                    border.width: 2.5
                                }
                            }
                        }

                        // Chân đứng Kiosk
                        Rectangle {
                            x: 40
                            y: 120
                            width: 10
                            height: 35
                            color: "#9CA3AF"
                        }
                        Rectangle {
                            x: 25
                            y: 155
                            width: 40
                            height: 6
                            radius: 3
                            color: "#6B7280"
                        }
                    }

                    // Vùng sóng quét AI
                    Item {
                        x: 180
                        y: 40
                        width: 340
                        height: 140

                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            y: 20
                            text: "Khoảng cách chuẩn: 0.5m – 1.2m"
                            font.family: Theme.fontFamily
                            font.pixelSize: 15
                            font.bold: true
                            color: Theme.brandPurple
                        }

                        // Mũi tên 2 chiều
                        Rectangle {
                            anchors.horizontalCenter: parent.horizontalCenter
                            y: 54
                            width: 300
                            height: 3
                            color: Theme.brandPurple
                        }
                        Text {
                            x: 15
                            y: 44
                            text: "◀"
                            font.pixelSize: 16
                            color: Theme.brandPurple
                        }
                        Text {
                            x: 310
                            y: 44
                            text: "▶"
                            font.pixelSize: 16
                            color: Theme.brandPurple
                        }
                    }

                    // Minh họa người đứng bên phải
                    Item {
                        x: 540
                        y: 35
                        width: 80
                        height: 160

                        // Đầu
                        Rectangle {
                            x: 22
                            y: 0
                            width: 36
                            height: 36
                            radius: 18
                            color: "#111827"
                        }
                        // Thân
                        Rectangle {
                            x: 10
                            y: 42
                            width: 60
                            height: 80
                            radius: 12
                            color: "#374151"
                        }
                        // Chân
                        Rectangle {
                            x: 18
                            y: 122
                            width: 14
                            height: 36
                            radius: 4
                            color: "#111827"
                        }
                        Rectangle {
                            x: 48
                            y: 122
                            width: 14
                            height: 36
                            radius: 4
                            color: "#111827"
                        }
                    }
                }
            }

            // ================= 3. DANH SÁCH 3 BƯỚC HƯỚNG DẪN =================
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 20

                // Bước 1
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 16

                    Rectangle {
                        width: 48
                        height: 48
                        radius: 24
                        color: "#EEF2FF"

                        Text {
                            anchors.centerIn: parent
                            text: "1"
                            font.family: Theme.fontFamily
                            font.pixelSize: 20
                            font.bold: true
                            color: Theme.brandPurple
                        }
                    }

                    ColumnLayout {
                        spacing: 4
                        Text {
                            text: "Đứng đối diện camera"
                            font.family: Theme.fontFamily
                            font.pixelSize: 18
                            font.bold: true
                            color: "#111827"
                        }
                        Text {
                            text: "Giữ khoảng cách từ 0.5 đến 1.2 mét. Bỏ khẩu trang, kính râm và mũ để hệ thống nhận diện nhanh chóng."
                            font.family: Theme.fontFamily
                            font.pixelSize: 15
                            color: "#6B7280"
                            Layout.fillWidth: true
                            wrapMode: Text.WordWrap
                        }
                    }
                }

                // Bước 2
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 16

                    Rectangle {
                        width: 48
                        height: 48
                        radius: 24
                        color: "#EEF2FF"

                        Text {
                            anchors.centerIn: parent
                            text: "2"
                            font.family: Theme.fontFamily
                            font.pixelSize: 20
                            font.bold: true
                            color: Theme.brandPurple
                        }
                    }

                    ColumnLayout {
                        spacing: 4
                        Text {
                            text: "Căn chỉnh khuôn mặt vào khung Oval"
                            font.family: Theme.fontFamily
                            font.pixelSize: 18
                            font.bold: true
                            color: "#111827"
                        }
                        Text {
                            text: "Nhìn thẳng trực tiếp vào ống kính camera. Khung quét sẽ chuyển từ tím sang xanh lá khi nhận diện thành công."
                            font.family: Theme.fontFamily
                            font.pixelSize: 15
                            color: "#6B7280"
                            Layout.fillWidth: true
                            wrapMode: Text.WordWrap
                        }
                    }
                }

                // Bước 3
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 16

                    Rectangle {
                        width: 48
                        height: 48
                        radius: 24
                        color: "#EEF2FF"

                        Text {
                            anchors.centerIn: parent
                            text: "3"
                            font.family: Theme.fontFamily
                            font.pixelSize: 20
                            font.bold: true
                            color: Theme.brandPurple
                        }
                    }

                    ColumnLayout {
                        spacing: 4
                        Text {
                            text: "Phương thức dự phòng & Đăng ký"
                            font.family: Theme.fontFamily
                            font.pixelSize: 18
                            font.bold: true
                            color: "#111827"
                        }
                        Text {
                            text: "Nếu không thể nhận diện khuôn mặt, chọn 'Điểm danh PIN' ở thanh công cụ dưới. Nhân viên mới chọn 'Đăng ký mới' để kích hoạt."
                            font.family: Theme.fontFamily
                            font.pixelSize: 15
                            color: "#6B7280"
                            Layout.fillWidth: true
                            wrapMode: Text.WordWrap
                        }
                    }
                }
            }

            // ================= 4. KHỐI THÔNG TIN HỖ TRỢ =================
            Rectangle {
                Layout.fillWidth: true
                height: 84
                radius: 14
                color: "#F5F6F8"

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 18
                    spacing: 16

                    Text {
                        text: "ⓘ"
                        font.pixelSize: 24
                        color: Theme.brandPurple
                    }

                    ColumnLayout {
                        spacing: 2
                        Layout.fillWidth: true

                        Text {
                            text: "Cần trợ giúp thêm?"
                            font.family: Theme.fontFamily
                            font.pixelSize: 16
                            font.bold: true
                            color: "#111827"
                        }
                        Text {
                            text: "Vui lòng liên hệ Phòng IT / Ban Quản trị tại quầy lễ tân."
                            font.family: Theme.fontFamily
                            font.pixelSize: 14
                            color: "#6B7280"
                        }
                    }
                }
            }

            Item { Layout.fillHeight: true }

            // ================= 5. NÚT ĐÃ HIỂU & ĐÓNG =================
            Rectangle {
                Layout.fillWidth: true
                height: 64
                radius: 14
                color: mouseGotIt.pressed ? Qt.darker(Theme.brandPurple, 1.15) : Theme.brandPurple

                Text {
                    anchors.centerIn: parent
                    text: "Đã hiểu & Quay lại"
                    font.family: Theme.fontFamily
                    font.pixelSize: 20
                    font.bold: true
                    color: "#FFFFFF"
                }

                MouseArea {
                    id: mouseGotIt
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.close()
                }
            }
        }
    }
}
