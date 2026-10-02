// qmllint disable unqualified
// qmllint disable unresolved-type
// qmllint disable missing-property
pragma Singleton
import QtQuick

QtObject {
    // =========================================================================
    // 1. KÍCH THƯỚC CHUẨN FIGMA CHO MÀN HÌNH DỌC (PORTRAIT 9:16)
    // =========================================================================
    readonly property real outerWidth: 1080
    readonly property real outerHeight: 1920
    readonly property real outerPadding: 32

    // Canvas sáng Kiosk Luminous
    readonly property real canvasWidth: 1016
    readonly property real canvasHeight: 1856
    readonly property real canvasPadding: 24
    readonly property real canvasSpacing: 24

    // Chiều cao các khối phân vùng chính
    readonly property real headerHeight: 120
    readonly property real mainViewportHeight: 1496
    readonly property real actionDockHeight: 144

    // Khung định vị Oval căn chỉnh mặt (Face Alignment Oval)
    readonly property real ovalWidth: 470
    readonly property real ovalHeight: 604
    readonly property real ovalStrokeWidth: 8

    // Quầng sáng Ambient Halo màn hình chờ
    readonly property real haloSize: 700

    // Kích thước các thẻ con
    readonly property real resultCardWidth: 872
    readonly property real resultCardPadding: 40
    readonly property real actionButtonWidth: 301.3
    readonly property real actionButtonHeight: 112

    // Kích thước Dialog nổi
    readonly property real dialogWidth: 800
    readonly property real dialogPadding: 48

    // =========================================================================
    // 2. BẢNG MÀU CHUẨN THIẾT KẾ FIGMA (COLOR PALETTE)
    // =========================================================================
    // Nền không gian
    readonly property color bgOuter: "#222222"         // Nền đen bao quanh bezel Kiosk
    readonly property color bgCanvas: "#F5F6F8"        // Nền sáng canvas trung tâm
    readonly property color bgCard: "#FFFFFF"          // Nền thẻ Card / Header / Dock
    readonly property color bgCamera: "#17191D"        // Nền tối vùng camera scanning

    // Màu thương hiệu (Brand Iris Purple)
    readonly property color brandPurple: "#7567FF"
    readonly property color brandPurpleSoft: Qt.rgba(0.459, 0.404, 1.0, 0.12)
    readonly property color brandPurpleGlow: Qt.rgba(0.459, 0.404, 1.0, 0.25)

    // Bảng màu chữ
    readonly property color textPrimary: "#111827"      // Chữ chính đậm (tiêu đề, tên NV, đồng hồ)
    readonly property color textSecondary: "#666666"    // Chữ phụ vừa (ngày tháng, ca kíp, phòng ban)
    readonly property color textSubtle: "#777777"       // Chữ mô tả mờ / nhãn phím tắt

    // Màu trạng thái điểm danh & hệ thống
    readonly property color statusSuccess: "#159447"    // Xanh lá thành công
    readonly property color statusSuccessBg: "#EEFAF3"  // Nền nhạt thông báo thành công
    readonly property color statusOnline: "#12B76A"     // Xanh lá huy hiệu mạng trực tuyến
    readonly property color statusAligning: "#D97706"   // Vàng cảnh báo căn chỉnh
    readonly property color statusAligningBg: "#FEFCE8" // Nền nhạt cảnh báo căn chỉnh
    readonly property color statusWarning: "#F79009"    // Cam cảnh báo ngoại tuyến
    readonly property color statusWarningBg: "#FEF6EE"  // Nền cam ngoại tuyến
    readonly property color statusError: "#EF4444"      // Đỏ cảnh báo lỗi / giả mạo
    readonly property color statusErrorBg: "#FEF2F2"    // Nền đỏ cảnh báo

    // =========================================================================
    // 3. BO GÓC CHUẨN FIGMA (CORNER RADII)
    // =========================================================================
    readonly property real radiusSm: 12                 // Badges, ô nhập nhỏ
    readonly property real radiusMd: 16                 // Action buttons, keypad keys
    readonly property real radiusLg: 18                 // Header, Action Dock, instruction strip
    readonly property real radiusXl: 20                 // Canvas chính, Camera canvas, Dialogs
    readonly property real radiusFull: 9999             // Chấm tròn online, avatar tròn

    // =========================================================================
    // 4. KIỂU CHỮ & TYPOGRAPHY
    // =========================================================================
    readonly property string fontFamily: "Inter"
    readonly property string fallbackFontFamily: "Arial"

    // Thang cỡ chữ chuẩn Figma
    readonly property int fontClockGiant: 64            // Giờ số màn hình chờ
    readonly property int fontTitleLg: 38               // Tiêu đề dialog
    readonly property int fontClockHeader: 34           // Giờ số trên header
    readonly property int fontNameResult: 32            // Tên nhân viên kết quả
    readonly property int fontHeading: 26               // Tiêu đề khối / ngày tháng lớn
    readonly property int fontActionBtn: 20             // Chữ trên nút Action Dock
    readonly property int fontBody: 16                  // Văn bản thông thường
    readonly property int fontCaption: 14               // Chú thích nhỏ

    // =========================================================================
    // 5. TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY)
    // =========================================================================
    readonly property color accentPurple: brandPurple
    readonly property color accentPurpleSoft: brandPurpleSoft
    readonly property color accentPurpleGlow: brandPurpleGlow
    readonly property color textDark: textPrimary
    readonly property color textMuted: textSecondary
    readonly property color onlineGreen: statusOnline
    readonly property color successGreen: statusSuccess
    readonly property color successBg: statusSuccessBg
    readonly property color stateError: statusError
    readonly property color stateErrorBg: statusErrorBg
    readonly property color stateAligning: statusAligning
    readonly property color stateAligningBg: statusAligningBg

    readonly property color baseColor: bgCanvas
    readonly property color bgBase: "#F3F4F6"
    readonly property color bgOverlay: Qt.rgba(0.133, 0.133, 0.133, 0.65)
    readonly property color mantleColor: "#F3F4F6"
    readonly property color crustColor: "#E5E7EB"
    readonly property color bgSurface: bgCard
    readonly property color surfaceColor: bgCard
    readonly property color surfaceVariant: "#E5E7EB"
    readonly property color primary: brandPurple
    readonly property color accentColor: brandPurple
    readonly property color ovalIdle: brandPurple
    readonly property color ovalSuccess: statusSuccess
    readonly property color ovalError: statusError
}
