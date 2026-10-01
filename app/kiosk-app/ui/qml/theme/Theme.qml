pragma Singleton
import QtQuick 2.15

QtObject {
    // -------------------------------------------------------------------------
    // Bảng màu Catppuccin Mocha chuẩn DDS.md
    // -------------------------------------------------------------------------
    readonly property color baseColor: "#11111B"         // Nền tối chính
    readonly property color mantleColor: "#181825"       // Nền phụ bo viền
    readonly property color crustColor: "#1E1E2E"        // Nền thẻ card
    readonly property color surfaceColor: "#313244"      // Nền nút bấm / thẻ
    readonly property color surfaceVariant: "#45475A"    // Nền nút hover / viền phụ
    readonly property color textPrimary: "#CDD6F4"       // Màu chữ chính
    readonly property color textSecondary: "#BAC2DE"     // Màu chữ phụ
    readonly property color textSubtle: "#A6ADC8"        // Màu chữ mờ
    readonly property color accentColor: "#89B4FA"       // Màu nhấn xanh dương

    // Header màu sáng theo phong cách wireframe
    readonly property color headerBg: "#FFFFFF"          // Nền header sáng
    readonly property color headerText: "#181825"        // Chữ header tối
    readonly property color headerSubtext: "#6C7086"     // Chữ phụ header
    readonly property color headerBorder: "#E6E9EF"      // Viền header sáng

    // -------------------------------------------------------------------------
    // Máy trạng thái 4 màu viền Oval nhận diện sinh trắc học
    // -------------------------------------------------------------------------
    readonly property color ovalIdle: "#6C7086"          // Xám: Chờ người dùng
    readonly property color ovalAligning: "#F9E2AF"      // Vàng: Đang phát hiện & căn chỉnh
    readonly property color ovalSuccess: "#A6E3A1"       // Xanh lá: Điểm danh thành công
    readonly property color ovalError: "#F38BA8"         // Đỏ: Spoofing / Từ chối
}
