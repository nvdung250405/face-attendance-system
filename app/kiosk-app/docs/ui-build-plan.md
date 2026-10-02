# Kế hoạch Xây dựng Giao diện Màn hình Dọc Kiosk (Kiosk Portrait UI Build Plan)

> **Mã tài liệu**: BP-KIOSK-UI-PORTRAIT-01  
> **Căn cứ thiết kế nguồn**: Figma File `1zfzyFjrjSMrh0i8pc4WCf` (Node `0:1`, Frames Dọc `5:23526` $\rightarrow$ `5:24797`)  
> **Tài liệu tham chiếu**: [ui-specs.md](ui-specs.md), [fr.md](fr.md)  
> **Phiên bản kế hoạch**: 2.0 (Trích xuất & tích hợp 100% thông số vector từ Figma)  
> **Chủ sở hữu**: nvdung  
> **Ngày phê duyệt**: 2026-10-02  
> **Phạm vi**: Hiện thực hóa chuẩn xác từng pixel cho Kiosk giao diện đứng (Portrait $1080 \times 1920\text{ px}$)  

---

## 1. Dữ liệu Trích xuất Chuẩn hóa từ Figma (Extracted Figma Specs)

Dữ liệu được trích xuất trực tiếp từ API Figma qua các Node ID của thiết kế:

### 1.1. Cấu trúc Hình học Khung bao & Canvas chính
- **Khung ngoài cùng (Device Outer Frame)**:
  - Tên Node: `"Điểm danh thành công • Dọc"` (`5:23683`), `"Quét khuôn mặt • Dọc"` (`5:23577`), `"Chờ chào mừng • Dọc"` (`5:23526`).
  - Kích thước: **$1080 \times 1920\text{ px}$** (Tỷ lệ 9:16).
  - Màu nền (`Fills`): Solid `#222222` (`rgba(34, 34, 34, 1.00)`).
  - Khoảng đệm AutoLayout: `paddingTop: 32`, `paddingRight: 32`, `paddingBottom: 32`, `paddingLeft: 32`.
- **Canvas sáng Kiosk (Luminous kiosk canvas)**:
  - Node ID: `5:23684`.
  - Kích thước: **$1016 \times 1856\text{ px}$**.
  - Màu nền: Solid `#F5F6F8` (`rgba(245, 246, 248, 1.00)`).
  - Bo góc (`cornerRadius`): **`20px`**.
  - Khoảng đệm AutoLayout: `paddingTop: 24`, `paddingRight: 24`, `paddingBottom: 24`, `paddingLeft: 24`.
  - Khoảng cách giữa các phần tử con (`itemSpacing`): **`24px`**.

---

### 1.2. Đặc tả Chi tiết Các Thành phần Phân vùng (Section Specs)

#### A. Station Header (Node `5:23685`)
- Kích thước: **$968 \times 120\text{ px}$** (AutoLayout `layoutMode: HORIZONTAL`, `primaryAxisAlignItems: SPACE_BETWEEN`).
- Màu nền: Solid `#FFFFFF`, bo góc `cornerRadius: 18px`.
- Khoảng đệm: `paddingLeft: 24px`, `paddingRight: 24px`.
- Các khối bên trong:
  1. **`Organization identity`** (`195 x 56px`):
     - Logo biểu trưng: Khối `56 x 56px`, bo góc `14px`, nền `#7567FF` 12% opacity (`rgba(117, 103, 255, 0.12)`).
     - Tên công ty: Font Inter SemiBold (600), `fontSize: 26px`, màu `#111827`.
  2. **`Station`** (`192 x 60px`):
     - Mã trạm Kiosk: Font Inter SemiBold (600), `fontSize: 24px`, màu `#111827`.
     - Phụ đề trạng thái: Font Inter Regular (400), `fontSize: 16px`, màu `#666666`.
  3. **`Clock and date`** (`185 x 82px`):
     - Giờ số (hh:mm:ss): Font Inter Bold (700), `fontSize: 34px`, màu `#111827`.
     - Ngày tháng: Font Inter Regular (400), `fontSize: 16px`, màu `#666666`.
  4. **`Network badge`** (`158 x 59px`):
     - Nền: Solid `#EEFAF3` (`rgba(238, 250, 243, 1.00)`), bo góc `cornerRadius: 12px`.
     - Đệm: `padding: 16px`. Chữ màu `#12B76A` Font Inter SemiBold `18px`: "Trực tuyến".

---

#### B. Main Viewport - Chế độ 1: Chờ chào mừng (Welcome Canvas - Node `5:23528`)
- Kích thước: **$968 \times 1496\text{ px}$**.
- Màu nền: Solid `#FFFFFF`, bo góc `cornerRadius: 20px`.
- Khoảng đệm: `paddingTop: 64px`, `paddingBottom: 64px`, `paddingLeft: 64px`, `paddingRight: 64px`.
- Khoảng cách giữa các khối (`itemSpacing`): `64px`.
- Các khối bên trong:
  1. **`Ambient halo`** (`Node 5:23529`):
     - Hình elip kích thước khổng lồ **$700 \times 700\text{ px}$**, tâm căn giữa màn hình.
     - Màu nền: `#7567FF` độ trong suốt 12% (`rgba(117, 103, 255, 0.12)`), hiệu ứng thở (breathing opacity $0.08 \leftrightarrow 0.16$).
  2. **`Welcome and time`** (`Node 5:23530`):
     - Đồng hồ kỹ thuật số khổng lồ: Font Inter Bold (700), `fontSize: 64px`, `lineHeight: 72px`, màu `#111827`.
     - Lịch thứ ngày tháng: Font Inter Regular (400), `fontSize: 26px`, màu `#666666`.
     - Thẻ ca kíp hiện hành: Hộp nền `#F5F6F8`, bo góc `16px`, padding `20px`, chữ "Ca sáng: 08:00 - 12:00" Font Inter SemiBold `22px`.
     - Lời chào đơn vị: Font Inter SemiBold (600), `fontSize: 30px`, màu `#111827`.
  3. **`Approach guidance`** (`Node 5:23545`):
     - Thanh chỉ dẫn tiếp cận kích thước $840 \times 96\text{ px}$.
     - Màu nền: Solid `#7567FF` 12% opacity (`rgba(117, 103, 255, 0.12)`), bo góc `cornerRadius: 18px`, đệm `padding: 32px`.
     - Dòng chữ: "Vui lòng bước tới trước trạm để điểm danh" Font Inter SemiBold (600) `24px`, màu tím `#7567FF`.

---

#### C. Main Viewport - Chế độ 2: Quét camera & Căn chỉnh (Camera Scanning Canvas - Node `5:23702`)
- Kích thước: **$968 \times 1496\text{ px}$**.
- Màu nền: Solid `#17191D` (`rgba(23, 25, 29, 1.00)`), bo góc `cornerRadius: 20px`.
- Lớp phủ ánh sáng: Radial Gradient `#666666` $\rightarrow$ `#17191D`, độ mờ `opacity: 0.45`.
- Các khối bên trong:
  1. **`Camera subject`** (`720 x 1140px`): Vùng hiển thị luồng video OpenCV camera trực tiếp.
  2. **`Face alignment oval`** (`Node 5:23719`):
     - Hình elip định vị: Kích thước **$470 \times 604\text{ px}$**, đặt ở tọa độ tầm mắt tự nhiên ($Y = 160\text{ px}$ từ đỉnh canvas).
     - Viền (`strokes`): Độ dày `strokeWeight: 8px`, `strokeAlign: INSIDE`.
     - Đổi màu động theo trạng thái:
       - Rà soát (Idle): Màu tím `#7567FF`.
       - Căn chỉnh (Aligning): Màu vàng hổ phách `#D97706`.
       - Thành công (Success): Màu xanh lá `#159447`.
       - Giả mạo / Lỗi (Spoof): Màu đỏ `#EF4444`.
  3. **`Instruction strip`** (`Node 5:23720`):
     - Kích thước: **$920 \times 120\text{ px}$**, bo góc `cornerRadius: 18px`.
     - Vị trí: Đặt ở đáy vùng camera, cách mép dưới 24px.
     - Màu nền theo trạng thái: `#EEFAF3` (Xanh nhạt khi chuẩn), `#FEFCE8` (Vàng nhạt khi cần căn chỉnh), `#FEF2F2` (Đỏ nhạt khi lỗi).
     - Chữ thông điệp: Font Inter SemiBold `22px`, hiển thị chỉ dẫn hành động rõ ràng.

---

#### D. Main Viewport - Chế độ 3: Thiệp kết quả điểm danh (Attendance Result Card - Node `5:23723`)
- Xuất hiện bật nổi phía trên luồng camera khi nhận diện thành công:
  - Kích thước: **$872 \times 385\text{ px}$** (AutoLayout `layoutMode: VERTICAL`, `itemSpacing: 24px`).
  - Màu nền: Solid `#FFFFFF`, bo góc `cornerRadius: 20px`.
  - Khoảng đệm: `paddingTop: 40px`, `paddingRight: 40px`, `paddingBottom: 40px`, `paddingLeft: 40px`.
  - Hiệu ứng đổ bóng (`effects: DROP_SHADOW`): Màu `#111827` 25% opacity (`rgba(17, 24, 39, 0.25)`), `offset: {x: 0, y: 16}`, độ nhòe `radius: 48px`.
  - Nội dung bên trong:
    - Biểu tượng dấu tích xanh tròn lớn $64 \times 64\text{ px}$ (`#159447`).
    - Lời chào: "Xin chào, [Họ và tên nhân viên]!" Font Inter Bold (700) `32px`, màu `#111827`.
    - Thông tin định danh: "Mã NV: [Mã số] • [Phòng ban]" Font Inter Regular `22px`, màu `#666666`.
    - Mốc thời gian: "Điểm danh lúc: [hh:mm:ss]" Font Inter SemiBold `24px`, màu `#159447`.
    - Huy hiệu phụ (khi ngoại tuyến): Badge cam "Đã lưu ngoại tuyến (Offline)" nền `#FEF6EE`, chữ `#F79009`.

---

#### E. Action Dock (Node `5:23742`)
- Kích thước: **$968 \times 144\text{ px}$** (AutoLayout `layoutMode: HORIZONTAL`, `itemSpacing: 16px`).
- Màu nền: Solid `#FFFFFF`, bo góc `cornerRadius: 18px`.
- Khoảng đệm: `padding: 16px`.
- 3 nút bấm hành động xúc giác lớn:
  1. **Nút 1: Điểm danh PIN (`Node 5:23743`)**:
     - Kích thước: **$301.3 \times 112\text{ px}$**, bo góc `cornerRadius: 16px`.
     - Màu nền: Solid `#7567FF` 12% opacity (`rgba(117, 103, 255, 0.12)`).
     - Nội dung: Biểu tượng bàn phím số $32\text{ px}$ + Dòng chữ "Mã PIN [F2]" Font Inter SemiBold `20px`, màu `#7567FF`.
  2. **Nút 2: Đăng ký khuôn mặt mới (`Node 5:23746`)**:
     - Kích thước: **$301.3 \times 112\text{ px}$**, bo góc `cornerRadius: 16px`.
     - Màu nền: Solid `#7567FF` 12% opacity (`rgba(117, 103, 255, 0.12)`).
     - Nội dung: Biểu tượng người dùng $32\text{ px}$ + Dòng chữ "Đăng ký [F3]" Font Inter SemiBold `20px`, màu `#7567FF`.
  3. **Nút 3: Hướng dẫn sử dụng (`Node 5:23749`)**:
     - Kích thước: **$301.3 \times 112\text{ px}$**, bo góc `cornerRadius: 16px`.
     - Màu nền: Solid `#7567FF` 12% opacity (`rgba(117, 103, 255, 0.12)`).
     - Nội dung: Biểu tượng trợ giúp $32\text{ px}$ + Dòng chữ "Trợ giúp [F1]" Font Inter SemiBold `20px`, màu `#7567FF`.

---

#### F. Cửa sổ Bật nổi Điểm danh PIN (Virtual PIN Dialog - Node `5:24007`)
- Lớp kính mờ nền (`Dimmed blurred scanner backdrop` - Node `5:24006`): Kích thước $1080 \times 1920\text{ px}$, màu `#222222` $65\%$ opacity, `BACKGROUND_BLUR: 12px`.
- Hộp thoại trung tâm (`Functional dialog`):
  - Kích thước: **$800 \times 1392\text{ px}$**, bo góc `cornerRadius: 20px`, nền `#FFFFFF`, bóng mờ radius `48px`.
  - Đệm: `padding: 48px`, khoảng cách khối `itemSpacing: 32px`.
  - Tiêu đề: "Điểm danh bằng PIN" Font Inter SemiBold (600) `38px`, màu `#111827`.
  - Nút đóng (`Close dialog`): Hộp vuông $60 \times 60\text{ px}$, bo góc `16px`, nền `#F5F6F8`.
  - Ô nhập liệu: Ô nhập Mã nhân viên & Ô nhập mã PIN dạng chấm tròn đen `●`.
  - Bàn phím số ảo (`Numeric keypad` - $704 \times 496\text{ px}$): Grid 3 cột $\times$ 4 hàng, các nút tròn $96 \times 96\text{ px}$, bo góc `16px`, phông chữ số `32px`.
  - Nút xác nhận: Kích thước $704 \times 72\text{ px}$, bo góc `16px`, nền `#7567FF`, chữ trắng SemiBold `24px`.

---

#### G. Cửa sổ Bật nổi Đăng ký Khuôn mặt Mới (Enrollment Dialog - Node `5:24427`)
- Kích thước: **$800 \times 1280\text{ px}$**, bo góc `cornerRadius: 20px`, nền `#FFFFFF`, bóng mờ radius `48px`.
- Thanh tiến trình 3 bước (`Enrollment progress` - Node `5:24432`):
  - 3 thanh bước kích thước $224 \times 68\text{ px}$, bo góc `12px`.
  - Bước hiện tại nền tím nhạt `#7567FF` $12\%$, bước chưa tới nền `#F5F6F8`.
- Luồng 3 bước hiển thị:
  - *Bước 1 (Node `5:24445`)*: "Nhập mã xác thực" - 6 ô nhập mã OTP kích thước $104 \times 104\text{ px}$ bo góc `16px`, nền `#F5F6F8`, số đậm `40px`.
  - *Bước 2 (Node `5:24477`)*: "Căn chỉnh chất lượng" - Khung camera mẫu kèm 4 chỉ báo đạt chuẩn (Ánh sáng, Sắc nét, Nhìn thẳng, Người thật).
  - *Bước 3 (Node `5:24589`)*: "Tự chụp trong 3 giây" - Vòng đếm ngược $3.. 2.. 1..$ tự động chụp và nạp vector.

---

## 2. Bảng Mã Thông báo Thiết kế (Tokens Mapping)

```qml
// Chuẩn hóa vào resources/qml/theme/Theme.qml
QtObject {
    // 1. Kích thước hệ thống Dọc (Portrait Dimensions)
    readonly property real outerWidth: 1080
    readonly property real outerHeight: 1920
    readonly property real canvasWidth: 1016
    readonly property real canvasHeight: 1856
    readonly property real headerHeight: 120
    readonly property real mainViewportHeight: 1496
    readonly property real actionDockHeight: 144

    // 2. Bảng màu chuẩn Figma
    readonly property color bgOuter: "#222222"
    readonly property color bgCanvas: "#F5F6F8"
    readonly property color bgCard: "#FFFFFF"
    readonly property color bgCamera: "#17191D"

    readonly property color brandPurple: "#7567FF"
    readonly property color brandPurpleSoft: Qt.rgba(0.459, 0.404, 1.0, 0.12)
    readonly property color brandPurpleGlow: Qt.rgba(0.459, 0.404, 1.0, 0.25)

    readonly property color statusSuccess: "#159447"
    readonly property color statusSuccessBg: "#EEFAF3"
    readonly property color statusAligning: "#D97706"
    readonly property color statusAligningBg: "#FEFCE8"
    readonly property color statusError: "#EF4444"
    readonly property color statusErrorBg: "#FEF2F2"

    readonly property color textPrimary: "#111827"
    readonly property color textSecondary: "#666666"
    readonly property color textSubtle: "#777777"

    // 3. Bo góc chuẩn Figma
    readonly property real radiusSm: 12
    readonly property real radiusMd: 16
    readonly property real radiusLg: 18
    readonly property real radiusXl: 20
    readonly property real radiusFull: 9999
}
```

---

## 3. Kế hoạch Lộ trình Triển khai Code (Step-by-Step Execution Plan)

### Bước 1: Cập nhật & Mở rộng Tokens trong `Theme.qml`
- **File**: `app/kiosk-app/resources/qml/theme/Theme.qml`
- Bổ sung toàn bộ hằng số kích thước, màu sắc và typography trích xuất từ Figma.
- Đảm bảo tương thích ngược 100% với các component cũ.

### Bước 2: Xây dựng các Component Dọc Chuyên dụng
1. **`PortraitHeaderBar.qml`** (`resources/qml/components/PortraitHeaderBar.qml`):
   - Kích thước $968 \times 120\text{ px}$, nền trắng, bo góc `18px`.
   - Chứa Logo đơn vị, Tên trạm, Đồng hồ số điện tử và Huy hiệu trực tuyến/ngoại tuyến.
2. **`WelcomeCanvas.qml`** (`resources/qml/components/WelcomeCanvas.qml`):
   - Kích thước $968 \times 1496\text{ px}$, nền trắng, bo góc `20px`.
   - Quầng sáng `Ambient halo` hình elip $700 \times 700\text{ px}$ với hiệu ứng thở (breathing opacity animation).
   - Đồng hồ số lớn `64px`, thẻ ca kíp làm việc và thanh chỉ dẫn tiếp cận "Vui lòng bước tới trước trạm".
3. **`PortraitCameraPanel.qml`** (`resources/qml/components/PortraitCameraPanel.qml`):
   - Kích thước $968 \times 1496\text{ px}$, nền tối `#17191D`, bo góc `20px`.
   - Kết nối `LiveCanvas` (luồng video OpenCV).
   - Khung Oval định vị chuẩn Figma $470 \times 604\text{ px}$, độ dày viền 8px, đổi 4 màu theo trạng thái.
   - Thanh chỉ dẫn trạng thái đáy $920 \times 120\text{ px}$, bo góc `18px`.
4. **`PortraitResultCard.qml`** (`resources/qml/components/PortraitResultCard.qml`):
   - Kích thước $872 \times 385\text{ px}$, nền trắng, bo góc `20px`, bóng đổ radius `48px`.
   - Tự động bật nổi khi điểm danh thành công và tự mờ dần sau $2.5\text{ s}$.
5. **`PortraitActionDock.qml`** (`resources/qml/components/PortraitActionDock.qml`):
   - Kích thước $968 \times 144\text{ px}$, nền trắng, bo góc `18px`.
   - 3 nút bấm $301.3 \times 112\text{ px}$, nền tím nhạt 12% opacity, bo góc `16px`.

### Bước 3: Tái cấu trúc Cửa sổ Chính `main.qml` theo Chuẩn Dọc $1080 \times 1920$
- **File**: `app/kiosk-app/resources/qml/main.qml`
- Cài đặt kích thước mặc định $1080 \times 1920$, `minimumWidth: 540`, `minimumHeight: 960`.
- Thiết lập cơ chế tỷ lệ tự động: `scaleRatio = Math.min(width / 1080.0, height / 1920.0)`.
- Tổ chức Canvas trung tâm $1016 \times 1856\text{ px}$ căn giữa màn hình:
  - Khối 1: `PortraitHeaderBar` (120px)
  - Khối 2: Viewport Stack (1496px) - chuyển đổi giữa `WelcomeCanvas` và `PortraitCameraPanel` bằng hiệu ứng chuyển mờ `NumberAnimation` ($300\text{ ms}$).
  - Khối 3: `PortraitActionDock` (144px)
- Bổ sung bộ phím tắt giả lập kiểm thử trực tiếp (`Space`, `0`, `1`, `2`, `3`, `4`, `5`, `F1`, `F2`, `F3`, `F11`).

### Bước 4: Tinh chỉnh các Dialog Modal cho Màn hình Dọc
1. **`PinDialog.qml`**: Hộp thoại $800 \times 1392\text{ px}$, bo góc `20px`, đệm `48px`, bàn phím số ảo $704 \times 496\text{ px}$ phím tròn $96\text{ px}$.
2. **`EnrollmentDialog.qml`**: Hộp thoại $800 \times 1280\text{ px}$, thanh tiến trình 3 bước $224 \times 68\text{ px}$, 6 ô nhập OTP $104 \times 104\text{ px}$.
3. **`HelpDialog.qml`**: Hướng dẫn tư thế đứng và bảng phím tắt trạm Kiosk.

### Bước 5: Cập nhật Resource File & Kiểm thử Toàn diện
- Cập nhật danh mục file QML vào `app/kiosk-app/resources.qrc`.
- Chạy ứng dụng kiểm tra:
  - Hiển thị cửa sổ dọc sắc nét.
  - Chuyển đổi giữa chế độ Chờ (Standby) và chế độ Quét trực tiếp.
  - Phản hồi bàn phím ảo PIN và Đăng ký.
  - Kiểm tra khả năng co giãn trên các kích cỡ cửa sổ khác nhau.
