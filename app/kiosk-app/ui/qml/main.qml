import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "theme"
import "components"
import "dialogs"

ApplicationWindow {
    id: window
    visible: true
    width: 1200
    height: 800
    minimumWidth: 960
    minimumHeight: 640
    title: "Trạm Điểm Danh Sinh Trắc Học FAS Kiosk"
    color: Theme.baseColor

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 18
        spacing: 16

        // 1. Thanh Header Bar nằm ngang toàn màn hình (Khớp khung trên wireframe)
        HeaderBar {
            Layout.fillWidth: true
        }

        // 2. Thân chính chia 2 cột (Khớp bố cục Trái - Phải wireframe)
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 16

            // Cột bên trái: Khung hình Camera live kèm vòng Oval định vị và Status badge
            LiveCanvas {
                id: liveCanvas
                Layout.fillHeight: true
                Layout.preferredWidth: parent.width * 0.60
                Layout.minimumWidth: 500
            }

            // Cột bên phải: 2 Card bo tròn xếp chồng theo chiều dọc
            ColumnLayout {
                Layout.fillHeight: true
                Layout.fillWidth: true
                spacing: 16

                // Card 1 (Góc trên phải): Thẻ kết quả điểm danh / Thông tin nhân sự
                AttendanceResultCard {
                    Layout.fillWidth: true
                    Layout.preferredHeight: parent.height * 0.40
                    Layout.minimumHeight: 220
                }

                // Card 2 (Góc dưới phải): Thẻ phương thức xác thực dự phòng & Tiện ích
                ActionPanel {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    onHelpClicked: helpDialog.open()
                }
            }
        }
    }

    // Các hộp thoại Modal chức năng
    PinDialog {
        id: pinDialog
    }

    EnrollmentDialog {
        id: enrollmentDialog
    }

    HelpDialog {
        id: helpDialog
    }

    Connections {
        target: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel : null
        function onOpenPinDialogRequested() {
            pinDialog.open()
        }
        function onOpenEnrollmentDialogRequested() {
            enrollmentDialog.open()
        }
    }
}
