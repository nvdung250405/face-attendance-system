import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property string stateValue: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.ovalState : "SUCCESS"
    property string employeeName: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastEmployeeId) ? ("Nhân viên " + kioskViewModel.lastEmployeeId) : "Nguyễn Minh Anh"
    property string employeeId: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastEmployeeId) ? ("Mã NV: " + kioskViewModel.lastEmployeeId + " • Phòng Vận hành") : "Mã NV: NVD0128 • Phòng Vận hành"
    property string punchTime: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastPunchTime) ? kioskViewModel.lastPunchTime : "07:58:32"

    width: Math.min(860, parent.width - 48)
    implicitHeight: cardContent.implicitHeight + 48
    radius: 20
    color: "#FFFFFF"

    // Đổ bóng nổi Drop shadow chuẩn Figma
    Rectangle {
        anchors.fill: parent
        anchors.topMargin: 12
        radius: root.radius
        color: Qt.rgba(0.067, 0.094, 0.153, 0.20)
        z: -1
    }

    ColumnLayout {
        id: cardContent
        anchors.fill: parent
        anchors.margins: 24
        spacing: 18

        // 1. Hàng thông tin nhân viên: Avatar + Tên + Huy hiệu checkmark
        RowLayout {
            Layout.fillWidth: true
            spacing: 20

            // Avatar tròn có hình minh họa
            Rectangle {
                width: 72
                height: 72
                radius: 36
                color: "#F3F4F6"
                border.color: "#E5E7EB"
                border.width: 1
                clip: true

                // Minh họa khuôn mặt tối giản
                Item {
                    anchors.centerIn: parent
                    width: 48
                    height: 48

                    // Tóc
                    Rectangle {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 4
                        width: 32
                        height: 20
                        radius: 8
                        color: "#1F2937"
                    }
                    // Mặt
                    Rectangle {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 12
                        width: 28
                        height: 26
                        radius: 14
                        color: "#FFFFFF"
                    }
                    // Mắt
                    Rectangle { x: 16; y: 22; width: 3; height: 3; radius: 1.5; color: "#1F2937" }
                    Rectangle { x: 29; y: 22; width: 3; height: 3; radius: 1.5; color: "#1F2937" }
                    // Cười
                    Rectangle {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 28
                        width: 10
                        height: 4
                        radius: 2
                        color: "transparent"
                        border.color: "#1F2937"
                        border.width: 1
                    }
                }
            }

            // Tên và thông tin
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 2

                Text {
                    text: "Xin chào,"
                    font.family: Theme.fontFamily
                    font.pixelSize: 18
                    font.weight: Font.DemiBold
                    color: "#111827"
                }

                Text {
                    text: root.employeeName + "!"
                    font.family: Theme.fontFamily
                    font.pixelSize: 22
                    font.bold: true
                    color: "#111827"
                }

                Text {
                    text: root.employeeId
                    font.family: Theme.fontFamily
                    font.pixelSize: 14
                    color: "#6B7280"
                }
            }

            // Vòng tròn checkmark viền xanh mảnh bên phải
            Rectangle {
                width: 44
                height: 44
                radius: 22
                color: "transparent"
                border.color: "#20A464"
                border.width: 1.5

                Text {
                    anchors.centerIn: parent
                    text: "✓"
                    font.family: Theme.fontFamily
                    font.pixelSize: 22
                    font.bold: true
                    color: "#20A464"
                }
            }
        }

        // 2. Khung ghi nhận thời gian xanh nhạt
        Rectangle {
            Layout.fillWidth: true
            height: 72
            radius: 14
            color: "#E8F7ED"

            ColumnLayout {
                anchors.fill: parent
                anchors.leftMargin: 20
                anchors.rightMargin: 20
                anchors.topMargin: 12
                anchors.bottomMargin: 12
                spacing: 2

                Text {
                    text: "Điểm danh lúc: " + root.punchTime
                    font.family: Theme.fontFamily
                    font.pixelSize: 17
                    font.bold: true
                    color: "#111827"
                }

                Text {
                    text: "Đã ghi nhận điểm danh thành công"
                    font.family: Theme.fontFamily
                    font.pixelSize: 13
                    color: "#4B5563"
                }
            }
        }
    }
}
