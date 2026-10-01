import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

Dialog {
    id: helpDialog
    title: "Hướng dẫn điểm danh & Hỗ trợ kỹ thuật"
    modal: true
    anchors.centerIn: parent
    width: 440
    height: 480

    ColumnLayout {
        anchors.fill: parent
        spacing: 16

        Text {
            text: "CÁCH ĐIỂM DANH ĐẠT CHUẨN"
            font.pixelSize: 15
            font.bold: true
            color: Theme.accentColor
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: Theme.surfaceColor
        }

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 12

            RowLayout {
                spacing: 12
                Text { text: "1."; font.bold: true; color: Theme.accentColor; font.pixelSize: 14 }
                Text {
                    text: "Đứng cách ống kính camera khoảng 0.5m - 0.8m."
                    font.pixelSize: 13; color: Theme.textPrimary; wrapMode: Text.WordWrap; Layout.fillWidth: true
                }
            }

            RowLayout {
                spacing: 12
                Text { text: "2."; font.bold: true; color: Theme.accentColor; font.pixelSize: 14 }
                Text {
                    text: "Đưa khuôn mặt vào giữa khung tròn Oval và nhìn thẳng trong 0.5s."
                    font.pixelSize: 13; color: Theme.textPrimary; wrapMode: Text.WordWrap; Layout.fillWidth: true
                }
            }

            RowLayout {
                spacing: 12
                Text { text: "3."; font.bold: true; color: Theme.accentColor; font.pixelSize: 14 }
                Text {
                    text: "Tháo kính râm, khẩu trang hoặc mũ che khuất mắt/mũi nếu có."
                    font.pixelSize: 13; color: Theme.textPrimary; wrapMode: Text.WordWrap; Layout.fillWidth: true
                }
            }

            RowLayout {
                spacing: 12
                Text { text: "4."; font.bold: true; color: Theme.accentColor; font.pixelSize: 14 }
                Text {
                    text: "Nếu gặp sự cố nhận diện, bấm 'Xác thực bằng mã PIN' để điểm danh dự phòng."
                    font.pixelSize: 13; color: Theme.textPrimary; wrapMode: Text.WordWrap; Layout.fillWidth: true
                }
            }
        }

        Item { Layout.fillHeight: true }

        Rectangle {
            Layout.fillWidth: true
            height: 70
            radius: 10
            color: Theme.mantleColor
            border.color: Theme.surfaceColor

            ColumnLayout {
                anchors.centerIn: parent
                spacing: 4
                Text {
                    text: "📞 HOTLINE IT HELPDESK"
                    font.pixelSize: 11; font.bold: true; color: Theme.textSecondary
                    Layout.alignment: Qt.AlignHCenter
                }
                Text {
                    text: "1900-8888 (Nhánh 102) • support@fas.vn"
                    font.pixelSize: 13; font.bold: true; color: Theme.textPrimary
                    Layout.alignment: Qt.AlignHCenter
                }
            }
        }

        Button {
            text: "Đã hiểu & Đóng"
            Layout.alignment: Qt.AlignHCenter
            onClicked: helpDialog.close()
        }
    }
}
