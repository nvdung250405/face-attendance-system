import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property string stateValue: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.ovalState : "SUCCESS"
    property string employeeName: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastEmployeeId) ? ("Nhân viên " + kioskViewModel.lastEmployeeId) : "Nguyễn Văn A"
    property string employeeId: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastEmployeeId) ? ("NV-" + kioskViewModel.lastEmployeeId) : "NV-1001"
    property string department: "Phòng Công nghệ"
    property string punchTime: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.lastPunchTime) ? kioskViewModel.lastPunchTime : "08:42:15"
    property bool isOffline: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? !kioskViewModel.isOnline : false
    property bool isCooldown: false

    width: Theme.resultCardWidth // 872px
    height: cardContent.implicitHeight + 80 // Tự co giãn theo nội dung (~385px)
    radius: Theme.radiusXl // 20px
    color: Theme.bgCard // #FFFFFF

    // Đổ bóng nổi Drop shadow chuẩn Figma: y: 16px, blur: 48px, color: rgba(17, 24, 39, 0.25)
    Rectangle {
        anchors.fill: parent
        anchors.topMargin: 16
        radius: root.radius
        color: Qt.rgba(0.067, 0.094, 0.153, 0.25)
        z: -1
    }

    ColumnLayout {
        id: cardContent
        anchors.fill: parent
        anchors.margins: Theme.resultCardPadding // 40px
        spacing: 24

        // 1. Biểu tượng trạng thái thành công cỡ lớn (64x64px)
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: 64
            height: 64
            radius: 32
            color: root.isCooldown ? Theme.brandPurpleSoft : Theme.statusSuccessBg

            Text {
                anchors.centerIn: parent
                text: root.isCooldown ? "ℹ" : "✓"
                font.family: Theme.fontFamily
                font.pixelSize: 36
                font.bold: true
                color: root.isCooldown ? Theme.brandPurple : Theme.statusSuccess
            }
        }

        // 2. Lời chào chúc mừng & Tên nhân viên
        ColumnLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 6

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: root.isCooldown ? "Bạn đã điểm danh rồi!" : ("Xin chào, " + root.employeeName + "!")
                font.family: Theme.fontFamily
                font.pixelSize: Theme.fontNameResult // 32px
                font.bold: true
                color: Theme.textPrimary
                horizontalAlignment: Text.AlignHCenter
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Mã NV: " + root.employeeId + " • " + root.department
                font.family: Theme.fontFamily
                font.pixelSize: 22
                color: Theme.textSecondary
                horizontalAlignment: Text.AlignHCenter
            }
        }

        // 3. Mốc thời gian điểm danh chính xác
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: timeRow.implicitWidth + 32
            height: 48
            radius: Theme.radiusMd
            color: Theme.bgCanvas

            RowLayout {
                id: timeRow
                anchors.centerIn: parent
                spacing: 8

                Text {
                    text: "⏱"
                    font.pixelSize: 18
                }

                Text {
                    text: "Điểm danh lúc: " + root.punchTime
                    font.family: Theme.fontFamily
                    font.pixelSize: 20
                    font.weight: Font.DemiBold
                    color: Theme.statusSuccess
                }
            }
        }

        // 4. Huy hiệu ngoại tuyến (nếu mất mạng khi điểm danh)
        Rectangle {
            visible: root.isOffline
            Layout.alignment: Qt.AlignHCenter
            width: offlineBadgeRow.implicitWidth + 24
            height: 36
            radius: Theme.radiusSm
            color: Theme.statusWarningBg

            RowLayout {
                id: offlineBadgeRow
                anchors.centerIn: parent
                spacing: 6

                Text {
                    text: "⚠"
                    font.pixelSize: 14
                    color: Theme.statusWarning
                }

                Text {
                    text: "Đã lưu ngoại tuyến (Sẽ tự đồng bộ khi có mạng)"
                    font.family: Theme.fontFamily
                    font.pixelSize: 15
                    font.weight: Font.DemiBold
                    color: Theme.statusWarning
                }
            }
        }
    }
}
