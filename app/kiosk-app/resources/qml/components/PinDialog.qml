import QtQuick 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: root

    property real scaleRatio: 1.0
    property string pinCode: ""

    signal submitted(string code)
    signal canceled()

    anchors.fill: parent
    color: Theme.bgOverlay
    visible: opacity > 0
    opacity: 0

    Behavior on opacity {
        NumberAnimation { duration: 200 }
    }

    function open() {
        root.pinCode = ""
        root.opacity = 1.0
    }

    function close() {
        root.opacity = 0.0
        root.canceled()
    }

    // Nền modal
    Rectangle {
        width: Math.min(parent.width * 0.90, 440 * Math.max(0.7, root.scaleRatio))
        height: Math.min(parent.height * 0.85, 620 * Math.max(0.7, root.scaleRatio))
        anchors.centerIn: parent
        radius: Math.max(16, Theme.radiusLg * root.scaleRatio)
        color: Theme.bgSurface
        border.color: Qt.rgba(1, 1, 1, 0.1)
        border.width: 1

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: Math.max(16, Theme.spaceLg * root.scaleRatio)
            spacing: Math.max(12, Theme.spaceMd * root.scaleRatio)

            // Header Hộp thoại
            RowLayout {
                Layout.fillWidth: true
                Text {
                    Layout.fillWidth: true
                    text: "NHẬP MÃ MÁY CHẤM CÔNG"
                    font.family: Theme.fontFamily
                    font.pixelSize: Math.max(15, 18 * root.scaleRatio)
                    font.bold: true
                    color: Theme.textPrimary
                    horizontalAlignment: Text.AlignHCenter
                }
                Rectangle {
                    width: 32 * Math.max(0.7, root.scaleRatio)
                    height: 32 * Math.max(0.7, root.scaleRatio)
                    radius: Theme.radiusFull
                    color: Theme.bgCard
                    Text {
                        anchors.centerIn: parent
                        text: "✕"
                        color: Theme.textSecondary
                        font.pixelSize: Math.max(12, 14 * root.scaleRatio)
                    }
                    MouseArea {
                        anchors.fill: parent
                        onClicked: root.close()
                    }
                }
            }

            // Màn hình hiển thị chuỗi PIN 6 chấm
            Rectangle {
                Layout.fillWidth: true
                height: Math.max(40, 50 * root.scaleRatio)
                radius: Math.max(6, Theme.radiusSm * root.scaleRatio)
                color: Theme.bgBase

                RowLayout {
                    anchors.centerIn: parent
                    spacing: Math.max(8, 12 * root.scaleRatio)

                    Repeater {
                        model: 6
                        Rectangle {
                            width: Math.max(10, 14 * root.scaleRatio)
                            height: Math.max(10, 14 * root.scaleRatio)
                            radius: Theme.radiusFull
                            color: index < root.pinCode.length ? Theme.primary : Theme.bgCard

                            Behavior on color {
                                ColorAnimation { duration: 150 }
                            }
                        }
                    }
                }
            }

            // Grid Bàn phím số 3x4
            GridLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                columns: 3
                rowSpacing: Math.max(8, 12 * root.scaleRatio)
                columnSpacing: Math.max(8, 12 * root.scaleRatio)

                Repeater {
                    model: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Xóa", "0", "OK"]

                    Rectangle {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        implicitHeight: Math.max(46, 65 * root.scaleRatio)
                        radius: Math.max(8, Theme.radiusMd * root.scaleRatio)
                        color: modelData === "OK" ? Theme.primary : (modelData === "Xóa" ? Theme.stateError : Theme.bgCard)

                        Text {
                            anchors.centerIn: parent
                            text: modelData
                            font.family: Theme.fontFamily
                            font.pixelSize: Math.max(16, 20 * root.scaleRatio)
                            font.bold: true
                            color: Theme.textPrimary
                        }

                        MouseArea {
                            anchors.fill: parent
                            onClicked: {
                                var val = modelData
                                if (val === "Xóa") {
                                    if (root.pinCode.length > 0)
                                        root.pinCode = root.pinCode.substring(0, root.pinCode.length - 1)
                                } else if (val === "OK") {
                                    if (root.pinCode.length > 0) {
                                        var code = root.pinCode
                                        root.submitted(code)
                                        if (typeof kioskViewModel !== "undefined" && kioskViewModel) {
                                            kioskViewModel.submitPin(code)
                                        }
                                        root.close()
                                    }
                                } else {
                                    if (root.pinCode.length < 6)
                                        root.pinCode += val
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
