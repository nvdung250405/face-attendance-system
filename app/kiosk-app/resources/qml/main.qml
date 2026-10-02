// qmllint disable unqualified
// qmllint disable unresolved-type
// qmllint disable missing-property
import QtQuick
import QtQuick.Window
import QtQuick.Layouts
import "theme"
import "components"
import "dialogs" as Dialogs

Window {
    id: window

    // =========================================================================
    // 1. KÍCH THƯỚC CHUẨN DỌC FIGMA (PORTRAIT 9:16)
    // =========================================================================
    width: Theme.outerWidth   // 1080
    height: Theme.outerHeight // 1920
    minimumWidth: 360
    minimumHeight: 640
    visible: true
    title: "NVD - Trạm Điểm Danh Kiosk"
    color: Theme.bgOuter      // #222222

    // Tỷ lệ co giãn tự động Proportional Scale Ratio (giữ trọn vẹn bố cục 1080x1920)
    readonly property real scaleRatio: Math.min(width / Theme.outerWidth, height / Theme.outerHeight)

    // Máy trạng thái hiển thị trung tâm: "STANDBY" (Chờ chào mừng) hoặc "ACTIVE" (Quét camera)
    property string viewState: (typeof kioskViewModel !== "undefined" && kioskViewModel && kioskViewModel.isStandby) ? "STANDBY" : "ACTIVE"

    // Khung Canvas chính căn giữa màn hình
    Item {
        id: canvasWrapper
        anchors.centerIn: parent
        width: Theme.outerWidth * window.scaleRatio
        height: Theme.outerHeight * window.scaleRatio

        // Viền đệm 32px ngoài khung bezel Kiosk theo chuẩn Figma
        Rectangle {
            id: outerBezel
            width: Theme.outerWidth
            height: Theme.outerHeight
            scale: window.scaleRatio
            transformOrigin: Item.TopLeft
            color: Theme.bgOuter

            // Luminous Kiosk Canvas (1016 x 1856 px, Radius 20px, Fill #F5F6F8)
            Rectangle {
                id: luminousCanvas
                x: Theme.outerPadding  // 32px
                y: Theme.outerPadding  // 32px
                width: Theme.canvasWidth   // 1016px
                height: Theme.canvasHeight // 1856px
                radius: Theme.radiusXl     // 20px
                color: Theme.bgCanvas      // #F5F6F8
                clip: true

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: Theme.canvasPadding // 24px
                    spacing: Theme.canvasSpacing         // 24px

                    // ================= 1. STATION HEADER (968 x 120) =================
                    PortraitHeaderBar {
                        id: headerBar
                        Layout.fillWidth: true
                        Layout.preferredHeight: Theme.headerHeight // 120px
                    }

                    // ================= 2. MAIN VIEWPORT (968 x 1496) =================
                    Item {
                        id: mainViewport
                        Layout.fillWidth: true
                        Layout.fillHeight: true

                        // Chế độ A: Màn hình Chờ Chào mừng (WelcomeCanvas)
                        WelcomeCanvas {
                            id: welcomeCanvas
                            objectName: "welcomeCanvas"
                            anchors.fill: parent
                            visible: opacity > 0
                            opacity: window.viewState === "STANDBY" ? 1.0 : 0.0

                            Behavior on opacity {
                                NumberAnimation { duration: 300; easing.type: Easing.InOutQuad }
                            }
                        }

                        // Chế độ B: Màn hình Quét Camera Trực tiếp (PortraitCameraPanel)
                        PortraitCameraPanel {
                            id: cameraPanel
                            objectName: "cameraPanel"
                            anchors.fill: parent
                            visible: opacity > 0
                            opacity: window.viewState === "ACTIVE" ? 1.0 : 0.0

                            Behavior on opacity {
                                NumberAnimation { duration: 300; easing.type: Easing.InOutQuad }
                            }
                        }
                    }

                    // ================= 3. ACTION DOCK (968 x 144) =================
                    PortraitActionDock {
                        id: actionDock
                        Layout.fillWidth: true
                        Layout.preferredHeight: Theme.actionDockHeight // 144px

                        onPinClicked: {
                            console.log("[ACTION] Mở bàn phím số PIN dự phòng")
                            pinDialog.open()
                        }

                        onRegisterClicked: {
                            console.log("[ACTION] Mở quy trình đăng ký khuôn mặt mới")
                            enrollmentDialog.open()
                        }

                        onHelpClicked: {
                            console.log("[ACTION] Mở hướng dẫn sử dụng trạm")
                            helpDialog.open()
                        }
                    }
                }
            }

            // ================= MODAL DIALOGS OVERLAYS (NẰM TRONG HỆ TỌA ĐỘ 1080x1920) =================
            Dialogs.PinDialog {
                id: pinDialog
                objectName: "pinDialog"
            }

            Dialogs.EnrollmentDialog {
                id: enrollmentDialog
                objectName: "enrollmentDialog"
            }

            Dialogs.HelpDialog {
                id: helpDialog
                objectName: "helpDialog"
            }
        }
    }

    // ================= KẾT NỐI SỰ KIỆN TỪ BACKEND VIEWMODEL =================
    Connections {
        target: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel : null

        function onIsStandbyChanged(standby) {
            window.viewState = standby ? "STANDBY" : "ACTIVE"
        }

        function onOvalStateChanged(state) {
            // Khi có sự kiện nhận diện, tự động đánh thức về ACTIVE nếu đang ở STANDBY
            if (window.viewState === "STANDBY" && state !== "IDLE") {
                if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                    kioskViewModel.setStandby(false)
                }
                window.viewState = "ACTIVE"
            }
        }

        function onOpenPinDialogRequested() {
            if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                kioskViewModel.setStandby(false)
            }
            window.viewState = "ACTIVE"
            pinDialog.open()
        }

        function onOpenEnrollmentDialogRequested() {
            if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                kioskViewModel.setStandby(false)
            }
            window.viewState = "ACTIVE"
            enrollmentDialog.open()
        }
    }

    // ================= BỘ PHÍM TẮT DEV TESTING & VẬN HÀNH =================
    Item {
        id: shortcutHandler
        focus: true
        Component.onCompleted: forceActiveFocus()

        Keys.onPressed: function(event) {
            if (event.key === Qt.Key_Space) {
                if (typeof enrollmentController !== "undefined" && enrollmentController && enrollmentController.isEnrolling) {
                    console.log("[ENROLL] Phím Space: Chụp nhanh / hoàn tất lấy mẫu đăng ký")
                    enrollmentController.completeCaptureStep()
                    event.accepted = true
                    return
                }
                console.log("[TEST] Giả lập nhận diện thành công")
                if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                    kioskViewModel.setStandby(false)
                    kioskViewModel.simulateSuccess()
                }
                window.viewState = "ACTIVE"
                event.accepted = true
            } else if (event.key === Qt.Key_0) {
                console.log("[TEST] Chuyển viewState -> STANDBY")
                if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                    kioskViewModel.setStandby(true)
                }
                window.viewState = "STANDBY"
                event.accepted = true
            } else if (event.key === Qt.Key_1) {
                console.log("[TEST] Chuyển viewState -> ACTIVE")
                if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                    kioskViewModel.setStandby(false)
                }
                window.viewState = "ACTIVE"
                event.accepted = true
            } else if (event.key === Qt.Key_F1) {
                helpDialog.open()
                event.accepted = true
            } else if (event.key === Qt.Key_F2) {
                pinDialog.open()
                event.accepted = true
            } else if (event.key === Qt.Key_F3) {
                enrollmentDialog.open()
                event.accepted = true
            } else if (event.key === Qt.Key_F11) {
                if (window.visibility === Window.FullScreen) {
                    window.showNormal()
                } else {
                    window.showFullScreen()
                }
                event.accepted = true
            } else if (event.key === Qt.Key_Escape) {
                if (typeof enrollmentController !== "undefined" && enrollmentController && enrollmentController.isEnrolling) {
                    enrollmentController.reset()
                }
                pinDialog.close()
                enrollmentDialog.close()
                helpDialog.close()
                event.accepted = true
            }
        }
    }
}


