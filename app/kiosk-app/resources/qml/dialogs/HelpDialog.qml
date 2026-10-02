import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

Dialog {
    id: helpDialog
    modal: true
    anchors.centerIn: parent
    width: 580
    height: 930
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

    contentItem: ColumnLayout {
        spacing: 12
        anchors.fill: parent
        anchors.margins: 28

        // 1. Header: Tiêu đề & Nút đóng
        RowLayout {
            Layout.fillWidth: true

            Text {
                text: "Hướng dẫn sử dụng"
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
                    onClicked: helpDialog.close()
                }
            }
        }

        // 2. Minh họa trực quan: Trạm Kiosk + Khoảng cách 0.5 - 1.2m + Người đứng
        Rectangle {
            Layout.fillWidth: true
            height: 160
            radius: 16
            color: "#EEF2FF"
            clip: true

            Item {
                anchors.fill: parent

                // Minh họa Kiosk bên trái
                Item {
                    x: 60
                    y: 20
                    width: 70
                    height: 140

                    // Khung màn hình Kiosk
                    Rectangle {
                        x: 8
                        y: 0
                        width: 54
                        height: 94
                        radius: 8
                        color: "#FFFFFF"
                        border.color: "#111827"
                        border.width: 4

                        // Chấm camera
                        Rectangle {
                            anchors.horizontalCenter: parent.horizontalCenter
                            y: 8
                            width: 6
                            height: 6
                            radius: 3
                            color: Theme.brandPurple
                        }
                    }

                    // Trụ đứng
                    Rectangle {
                        x: 30
                        y: 94
                        width: 10
                        height: 38
                        color: "#111827"
                    }

                    // Chân đế
                    Rectangle {
                        x: 12
                        y: 130
                        width: 46
                        height: 6
                        radius: 3
                        color: "#111827"
                    }
                }

                // Dòng nét đứt tầm mắt từ camera tới người
                Row {
                    x: 140
                    y: 31
                    spacing: 6
                    Repeater {
                        model: 18
                        Rectangle {
                            width: 6
                            height: 2
                            color: Theme.brandPurple
                        }
                    }
                }

                // Mũi tên và chỉ số khoảng cách "0.5 – 1.2 m"
                Item {
                    x: 140
                    y: 95
                    width: 140
                    height: 30

                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 0
                        text: "0.5 – 1.2 m"
                        font.family: Theme.fontFamily
                        font.pixelSize: 14
                        font.bold: true
                        color: "#111827"
                    }

                    // Đường mũi tên 2 chiều
                    Rectangle {
                        y: 20
                        width: parent.width
                        height: 2
                        color: Theme.brandPurple
                    }
                    Text {
                        x: -4; y: 12
                        text: "◀"
                        font.pixelSize: 12
                        color: Theme.brandPurple
                    }
                    Text {
                        x: parent.width - 8; y: 12
                        text: "▶"
                        font.pixelSize: 12
                        color: Theme.brandPurple
                    }
                }

                // Minh họa người đứng bên phải (Figma: Đầu tròn đen, thân tím)
                Item {
                    x: 310
                    y: 18
                    width: 60
                    height: 146

                    // Đầu người
                    Rectangle {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 0
                        width: 32
                        height: 32
                        radius: 16
                        color: "#111827"
                    }

                    // Thân người tím
                    Rectangle {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 36
                        width: 34
                        height: 64
                        radius: 10
                        color: Theme.brandPurple
                    }

                    // Hai chân tím
                    Rectangle {
                        x: 16
                        y: 94
                        width: 10
                        height: 48
                        radius: 4
                        color: Theme.brandPurple
                    }
                    Rectangle {
                        x: 34
                        y: 94
                        width: 10
                        height: 48
                        radius: 4
                        color: Theme.brandPurple
                    }
                }
            }
        }

        // 3. Tiêu đề trung tâm
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Đứng cách trạm 0.5–1.2 m và nhìn thẳng vào\ncamera."
            font.family: Theme.fontFamily
            font.pixelSize: 18
            font.bold: true
            color: "#111827"
            horizontalAlignment: Text.AlignHCenter
            lineHeight: 1.25
        }

        // 4. Ba mẹo hỗ trợ (thẻ xám nhẹ)
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 8

            // Mẹo 1
            Rectangle {
                Layout.fillWidth: true
                height: 42
                radius: 10
                color: "#F5F6F8"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 14
                    anchors.rightMargin: 14
                    spacing: 12

                    Text {
                        text: "👓"
                        font.pixelSize: 16
                        color: Theme.brandPurple
                    }

                    Text {
                        text: "Tháo kính râm để khuôn mặt rõ hơn."
                        font.family: Theme.fontFamily
                        font.pixelSize: 14
                        color: "#111827"
                        Layout.fillWidth: true
                    }
                }
            }

            // Mẹo 2
            Rectangle {
                Layout.fillWidth: true
                height: 42
                radius: 10
                color: "#F5F6F8"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 14
                    anchors.rightMargin: 14
                    spacing: 12

                    Text {
                        text: "📷"
                        font.pixelSize: 16
                        color: Theme.brandPurple
                    }

                    Text {
                        text: "Lau camera nếu hình ảnh bị mờ."
                        font.family: Theme.fontFamily
                        font.pixelSize: 14
                        color: "#111827"
                        Layout.fillWidth: true
                    }
                }
            }

            // Mẹo 3
            Rectangle {
                Layout.fillWidth: true
                height: 42
                radius: 10
                color: "#F5F6F8"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 14
                    anchors.rightMargin: 14
                    spacing: 12

                    Text {
                        text: "⌨"
                        font.pixelSize: 16
                        color: Theme.brandPurple
                    }

                    Text {
                        text: "Sử dụng mã PIN nếu không thể nhận diện."
                        font.family: Theme.fontFamily
                        font.pixelSize: 14
                        color: "#111827"
                        Layout.fillWidth: true
                    }
                }
            }
        }

        // 5. Mục phím tắt trạm Kiosk
        Text {
            text: "Phím tắt trạm Kiosk"
            font.family: Theme.fontFamily
            font.pixelSize: 17
            font.bold: true
            color: "#111827"
        }

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 8

            ShortcutRow { keyLabel: "F1"; actionText: "Mở / đóng hướng dẫn" }
            ShortcutRow { keyLabel: "F2"; actionText: "Điểm danh bằng PIN" }
            ShortcutRow { keyLabel: "F3"; actionText: "Đăng ký khuôn mặt mới" }
            ShortcutRow { keyLabel: "F11"; actionText: "Bật / tắt toàn màn hình" }
            ShortcutRow { keyLabel: "Esc"; actionText: "Đóng cửa sổ đang mở" }
        }

        // 6. Nút Đóng hướng dẫn
        Rectangle {
            Layout.fillWidth: true
            height: 50
            radius: 12
            color: Theme.brandPurple

            Text {
                anchors.centerIn: parent
                text: "Đóng hướng dẫn"
                font.family: Theme.fontFamily
                font.pixelSize: 16
                font.bold: true
                color: "#FFFFFF"
            }

            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: helpDialog.close()
            }
        }
    }

    // Component dòng phím tắt
    component ShortcutRow : Rectangle {
        id: rowComp
        property string keyLabel: ""
        property string actionText: ""

        Layout.fillWidth: true
        height: 44
        radius: 10
        color: "#F5F6F8"

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 10
            anchors.rightMargin: 14
            spacing: 12

            Rectangle {
                width: 48
                height: 30
                radius: 6
                color: "#FFFFFF"
                border.color: "#E5E7EB"
                border.width: 1

                Text {
                    anchors.centerIn: parent
                    text: rowComp.keyLabel
                    font.family: Theme.fontFamily
                    font.pixelSize: 13
                    font.bold: true
                    color: "#111827"
                }
            }

            Text {
                text: rowComp.actionText
                font.family: Theme.fontFamily
                font.pixelSize: 14
                color: "#111827"
                Layout.fillWidth: true
            }
        }
    }
}
