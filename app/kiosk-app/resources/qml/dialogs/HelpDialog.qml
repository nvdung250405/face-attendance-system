import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

Dialog {
    id: helpDialog
    modal: true
    anchors.centerIn: parent
    width: 640
    height: 820
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

        // 1. Tiêu đề
        RowLayout {
            Layout.fillWidth: true
            Layout.leftMargin: 36
            Layout.rightMargin: 36
            Layout.topMargin: 32

            ColumnLayout {
                spacing: 4
                Text {
                    text: "Hướng dẫn sử dụng Kiosk"
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontTitleLg // 38px
                    font.weight: Font.DemiBold
                    color: Theme.textPrimary
                }
                Text {
                    text: "Quy trình điểm danh không chạm và hỗ trợ kỹ thuật"
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
                    onClicked: helpDialog.close()
                }
            }
        }

        // 2. Nội dung các bước hướng dẫn
        ColumnLayout {
            Layout.fillWidth: true
            Layout.leftMargin: 36
            Layout.rightMargin: 36
            spacing: 16

            InstructionRow {
                stepNum: "1"
                stepTitle: "Khoảng cách đứng chuẩn"
                stepDesc: "Đứng cách màn hình Kiosk khoảng 0.5m – 1.0m, ngang tầm mắt tự nhiên."
            }

            InstructionRow {
                stepNum: "2"
                stepTitle: "Căn chỉnh khuôn mặt"
                stepDesc: "Nhìn thẳng vào khung Oval trung tâm. Tránh nghiêng đầu hoặc nhìn lệch hướng."
            }

            InstructionRow {
                stepNum: "3"
                stepTitle: "Bỏ vật cản che khuất"
                stepDesc: "Tạm tháo kính râm hoặc khẩu trang y tế để hệ thống nhận diện nhanh dưới 1s."
            }

            InstructionRow {
                stepNum: "4"
                stepTitle: "Điểm danh dự phòng"
                stepDesc: "Nếu gặp sự cố quang học, bấm phím tắt [F2] để điểm danh bằng mã PIN cá nhân."
            }
        }

        Item { Layout.fillHeight: true }

        // 3. Khối thông tin hỗ trợ Hotline
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 560
            Layout.preferredHeight: 88
            radius: Theme.radiusMd
            color: Theme.bgCanvas

            RowLayout {
                anchors.centerIn: parent
                spacing: 16

                Text {
                    text: "📞"
                    font.pixelSize: 32
                }

                ColumnLayout {
                    spacing: 2
                    Text {
                        text: "Hotline Hỗ trợ Kỹ thuật IT"
                        font.family: Theme.fontFamily
                        font.pixelSize: 15
                        color: Theme.textSecondary
                    }
                    Text {
                        text: "1900-8888 (Nhánh 102) • support@fas.vn"
                        font.family: Theme.fontFamily
                        font.pixelSize: 18
                        font.weight: Font.DemiBold
                        color: Theme.brandPurple
                    }
                }
            }
        }

        // 4. Nút Đã hiểu & Đóng
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 560
            Layout.preferredHeight: 60
            Layout.bottomMargin: 32
            radius: Theme.radiusMd
            color: Theme.brandPurple

            Text {
                anchors.centerIn: parent
                text: "Đã hiểu & Đóng"
                font.family: Theme.fontFamily
                font.pixelSize: 20
                font.weight: Font.DemiBold
                color: "#FFFFFF"
            }

            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: helpDialog.close()
            }
        }
    }

    // Component dòng chỉ dẫn
    component InstructionRow : RowLayout {
        id: row
        property string stepNum: ""
        property string stepTitle: ""
        property string stepDesc: ""
        spacing: 16

        Rectangle {
            width: 44
            height: 44
            radius: 22
            color: Theme.brandPurpleSoft
            Layout.alignment: Qt.AlignTop

            Text {
                anchors.centerIn: parent
                text: row.stepNum
                font.family: Theme.fontFamily
                font.pixelSize: 20
                font.bold: true
                color: Theme.brandPurple
            }
        }

        ColumnLayout {
            spacing: 2
            Layout.fillWidth: true

            Text {
                text: row.stepTitle
                font.family: Theme.fontFamily
                font.pixelSize: 20
                font.bold: true
                color: Theme.textPrimary
            }

            Text {
                text: row.stepDesc
                font.family: Theme.fontFamily
                font.pixelSize: 16
                color: Theme.textSecondary
                wrapMode: Text.WordWrap
                Layout.fillWidth: true
            }
        }
    }
}
