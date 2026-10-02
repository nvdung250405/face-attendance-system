import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property string employeeName: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastEmployeeId) ? ("Nhân viên " + kioskViewModel.lastEmployeeId) : "Nguyễn Văn A"
    property string employeeId: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastEmployeeId) ? ("NV-" + kioskViewModel.lastEmployeeId) : "NV-1001"
    property string punchTime: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastPunchTime) ? kioskViewModel.lastPunchTime : "08:42:15"
    property int recognitionState: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.recognitionState : 0

    implicitWidth: 330
    implicitHeight: 440
    radius: Theme.radiusXl
    color: Theme.bgCard

    // Đổ bóng mềm nhẹ giống CSS box-shadow: 0 2px 8px rgba(0,0,0,.08)
    Rectangle {
        anchors.fill: parent
        anchors.topMargin: 2
        radius: root.radius
        color: Qt.rgba(0, 0, 0, 0.06)
        z: -1
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 24
        spacing: 0

        // Tiêu đề card
        Text {
            text: "Kết quả chấm công"
            font.family: Theme.fontFamily
            font.pixelSize: 18
            font.bold: true
            color: Theme.textDark
            Layout.alignment: Qt.AlignLeft
        }

        Item {
            Layout.preferredHeight: 18
        }

        // Avatar tròn to 110px
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: 110
            height: 110
            radius: 55
            color: "#E5E7EB"

            Text {
                anchors.centerIn: parent
                text: "👤"
                font.pixelSize: 42
                color: "#888888"
            }
        }

        Item {
            Layout.preferredHeight: 14
        }

        // Họ tên nhân viên
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: root.employeeName
            font.family: Theme.fontFamily
            font.pixelSize: 23
            font.bold: true
            color: Theme.textDark
            elide: Text.ElideRight
            Layout.maximumWidth: parent.width - 20
        }

        Item {
            Layout.preferredHeight: 6
        }

        // Mã nhân viên
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: root.employeeId
            font.family: Theme.fontFamily
            font.pixelSize: 15
            color: Theme.textSubtle
        }

        Item {
            Layout.fillHeight: true
        }

        // Khung thông tin kết quả (result box)
        Rectangle {
            Layout.fillWidth: true
            implicitHeight: 78
            radius: Theme.radiusSm

            color: {
                if (root.recognitionState === 2) return Theme.successBg;
                if (root.recognitionState === 3) return Theme.stateErrorBg;
                return Theme.successBg; // Mặc định hiển thị mẫu thành công chuẩn HTML
            }

            ColumnLayout {
                anchors.centerIn: parent
                spacing: 4

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: {
                        if (root.recognitionState === 3) return "✕ Nhận diện thất bại";
                        return "✓ Điểm danh thành công";
                    }
                    font.family: Theme.fontFamily
                    font.pixelSize: 18
                    font.bold: true
                    color: {
                        if (root.recognitionState === 3) return Theme.stateError;
                        return Theme.successGreen;
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: root.punchTime + " · Vào ca"
                    font.family: Theme.fontFamily
                    font.pixelSize: 14
                    color: "#555555"
                }
            }
        }
    }
}
