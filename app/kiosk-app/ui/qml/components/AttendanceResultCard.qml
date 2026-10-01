import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "../theme"

Rectangle {
    id: card
    color: Theme.crustColor
    radius: 14
    border.color: Theme.surfaceColor
    border.width: 1

    property string stateValue: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.ovalState : "IDLE"
    property string messageValue: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.message : "Sẵn sàng"
    property string empIdValue: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.lastEmployeeId : ""
    property string punchTimeValue: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.lastPunchTime : ""
    property int matchScoreValue: (typeof kioskViewModel !== "undefined" && kioskViewModel) ? kioskViewModel.lastMatchScore : 0

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 12

        // Tiêu đề Card
        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            Rectangle {
                width: 4
                height: 16
                radius: 2
                color: {
                    switch (card.stateValue) {
                        case "SUCCESS": return Theme.ovalSuccess
                        case "ERROR": return Theme.ovalError
                        case "ALIGNING": return Theme.ovalAligning
                        default: return Theme.accentColor
                    }
                }
            }

            Text {
                text: "THÔNG TIN ĐIỂM DANH"
                font.pixelSize: 13
                font.bold: true
                color: Theme.textSecondary
                font.letterSpacing: 0.5
            }

            Item { Layout.fillWidth: true }

            Rectangle {
                height: 24
                width: stateText.width + 16
                radius: 12
                color: {
                    switch (card.stateValue) {
                        case "SUCCESS": return "#1C3524"
                        case "ERROR": return "#3A1B24"
                        case "ALIGNING": return "#382D1B"
                        default: return Theme.surfaceColor
                    }
                }

                Text {
                    id: stateText
                    anchors.centerIn: parent
                    font.pixelSize: 11
                    font.bold: true
                    color: {
                        switch (card.stateValue) {
                            case "SUCCESS": return Theme.ovalSuccess
                            case "ERROR": return Theme.ovalError
                            case "ALIGNING": return Theme.ovalAligning
                            default: return Theme.textSecondary
                        }
                    }
                    text: {
                        switch (card.stateValue) {
                            case "SUCCESS": return "THÀNH CÔNG"
                            case "ERROR": return "CẢNH BÁO"
                            case "ALIGNING": return "ĐANG XỬ LÝ"
                            default: return "SẴN SÀNG"
                        }
                    }
                }
            }
        }

        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: Theme.surfaceColor
        }

        // Nội dung hiển thị theo máy trạng thái
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true

            // 1. Trạng thái THÀNH CÔNG (SUCCESS)
            ColumnLayout {
                anchors.centerIn: parent
                spacing: 10
                visible: card.stateValue === "SUCCESS"
                width: parent.width

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 56
                    height: 56
                    radius: 28
                    color: "#234D30"
                    border.color: Theme.ovalSuccess
                    border.width: 2

                    Text {
                        anchors.centerIn: parent
                        text: "✓"
                        font.pixelSize: 30
                        font.bold: true
                        color: Theme.ovalSuccess
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "XÁC THỰC THÀNH CÔNG"
                    font.pixelSize: 18
                    font.bold: true
                    color: Theme.ovalSuccess
                }

                ColumnLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: 4

                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: "Mã NV: " + (card.empIdValue ? card.empIdValue : "1001")
                        font.pixelSize: 16
                        font.bold: true
                        color: Theme.textPrimary
                    }

                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: "Thời gian: " + (card.punchTimeValue ? card.punchTimeValue : "--:--:--")
                        font.pixelSize: 13
                        color: Theme.textSecondary
                    }

                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: "Độ tin cậy: " + (card.matchScoreValue > 0 ? card.matchScoreValue + "%" : "98%")
                        font.pixelSize: 12
                        color: Theme.textSubtle
                    }
                }
            }

            // 2. Trạng thái TỪ CHỐI / LỖI (ERROR)
            ColumnLayout {
                anchors.centerIn: parent
                spacing: 10
                visible: card.stateValue === "ERROR"
                width: parent.width

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 56
                    height: 56
                    radius: 28
                    color: "#4A1E29"
                    border.color: Theme.ovalError
                    border.width: 2

                    Text {
                        anchors.centerIn: parent
                        text: "!"
                        font.pixelSize: 32
                        font.bold: true
                        color: Theme.ovalError
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "TỪ CHỐI ĐIỂM DANH"
                    font.pixelSize: 17
                    font.bold: true
                    color: Theme.ovalError
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.fillWidth: true
                    horizontalAlignment: Text.AlignHCenter
                    wrapMode: Text.WordWrap
                    text: card.messageValue
                    font.pixelSize: 13
                    color: Theme.textSecondary
                }
            }

            // 3. Trạng thái ĐANG CĂN CHỈNH / ĐỊNH VỊ (ALIGNING)
            ColumnLayout {
                anchors.centerIn: parent
                spacing: 10
                visible: card.stateValue === "ALIGNING"
                width: parent.width

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 56
                    height: 56
                    radius: 28
                    color: "#46361C"
                    border.color: Theme.ovalAligning
                    border.width: 2

                    Text {
                        anchors.centerIn: parent
                        text: "🔍"
                        font.pixelSize: 26
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "ĐANG NHẬN DIỆN..."
                    font.pixelSize: 17
                    font.bold: true
                    color: Theme.ovalAligning
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.fillWidth: true
                    horizontalAlignment: Text.AlignHCenter
                    wrapMode: Text.WordWrap
                    text: card.messageValue
                    font.pixelSize: 13
                    color: Theme.textSecondary
                }
            }

            // 4. Trạng thái CHỜ (IDLE)
            ColumnLayout {
                anchors.centerIn: parent
                spacing: 10
                visible: card.stateValue === "IDLE"
                width: parent.width

                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 56
                    height: 56
                    radius: 28
                    color: Theme.surfaceColor
                    border.color: Theme.surfaceVariant
                    border.width: 1

                    Text {
                        anchors.centerIn: parent
                        text: "👤"
                        font.pixelSize: 26
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "SẴN SÀNG QUÉT"
                    font.pixelSize: 17
                    font.bold: true
                    color: Theme.textPrimary
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.fillWidth: true
                    horizontalAlignment: Text.AlignHCenter
                    wrapMode: Text.WordWrap
                    text: "Vui lòng nhìn vào khung Oval để điểm danh tự động"
                    font.pixelSize: 13
                    color: Theme.textSecondary
                }
            }
        }
    }
}
