# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
> - **Mã tài liệu**: UI-KIOSK-01
> - **Tên tài liệu**: Đặc tả thiết kế giao diện & Trải nghiệm người dùng — Phân hệ Trạm Điểm danh Kiosk (Kiosk UI/UX Specifications)
> - **Tài liệu cha**: [fr.md](fr.md) (FR-KIOSK-01), [SRS.md](../../../docs/requirements/SRS.md) (SRS-FAS-01)
> - **Phiên bản**: 1.1
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: nvdung
> - **Ngày hiệu lực**: 2026-10-01
> - **Tài liệu liên quan**: [fr.md](fr.md), [BP.md](BP.md), [TP.md](TP.md), [DDS.md](../../../docs/design/DDS.md), [FR.md](../../../docs/requirements/FR.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-10-01)*: Khởi tạo đặc tả giao diện và trải nghiệm người dùng trạm Kiosk.
>   - *v1.1 (2026-10-01)*: Chuẩn hóa toàn diện theo nguyên tắc SDLC thuần túy: Loại bỏ 100% mọi tham chiếu ngược về mã nguồn (không sử dụng tên biến mã nguồn, tên thuộc tính code, tên tệp mã, tên lớp thành phần giao diện hoặc tên tệp tài nguyên trên đĩa).

---

## 1. UX Goals (Mục tiêu trải nghiệm người dùng)

### 1.1. Người dùng cần đạt được gì trên UI
Trạm Kiosk là điểm tiếp xúc trực tiếp hàng ngày của nhân viên tại cửa ra vào cơ quan, doanh nghiệp. Giao diện người dùng được thiết kế nhằm phục vụ các mục tiêu trải nghiệm cốt lõi sau:

1. **Điểm danh không chạm tức thì (Touchless Attendance under 1s)**:
   - Nhân viên chỉ cần bước tới trước trạm Kiosk ở khoảng cách tự nhiên ($0.5 - 1.2\text{ m}$), hướng mặt về phía màn hình và nhận được phản hồi kết quả ghi nhận thành công trong thời gian dưới 1 giây mà không phải chạm vào bất kỳ thiết bị hay phím bấm nào.
2. **Nhận thức trạng thái trực giác tức thời (Zero-Cognitive Ambiguity)**:
   - Ngay trong tích tắc đầu tiên, người dùng nhận biết chính xác trạng thái xử lý của trạm thông qua sự chuyển đổi đồng bộ giữa màu sắc khung định vị và âm thanh phản hồi:
     - *Đang rà soát*: Khung màu tím chủ đạo quét nhẹ nhàng, tạo cảm giác hệ thống đang lắng nghe.
     - *Cần điều chỉnh*: Khung màu vàng kèm chỉ dẫn bằng văn bản rõ ràng khi đứng quá xa hoặc lệch góc mặt.
     - *Thành công*: Khung xanh lá cây rực rỡ kèm lời chào họ tên, phòng ban và giờ công chuẩn xác.
     - *Cảnh báo*: Khung màu đỏ tức khắc khi phát hiện hình ảnh giả mạo.
3. **Thao tác dự phòng nhanh chóng khi gặp sự cố**:
   - Khi khuôn mặt bị che khuất vì lý do y tế (băng bó, chấn thương), nhân viên có thể chuyển đổi nhanh sang bàn phím số ảo để nhập mã định danh và mã số cá nhân, hoàn tất điểm danh dưới 5 giây.
4. **An tâm tuyệt đối về việc ghi nhận giờ công**:
   - Trong tình huống mạng nội bộ gặp sự cố, giao diện vẫn hiển thị xác nhận đã chấm công thành công kèm thông báo rõ ràng về trạng thái lưu trữ ngoại tuyến để nhân viên yên tâm vào ca làm việc mà không lo bị mất dữ liệu.
5. **Tự thực hiện đăng ký mẫu khuôn mặt dễ dàng**:
   - Nhân viên mới có thể tự thao tác nạp mẫu khuôn mặt tại trạm thông qua hướng dẫn trực quan từng bước với mã kích hoạt dùng một lần, được hỗ trợ bởi các chỉ báo chất lượng hình ảnh trực tiếp theo thời gian thực.
6. **Trải nghiệm Màn hình Chờ Chào mừng & Đánh thức tức thì (Smart Standby & Instant Wake-up)**:
   - Khi không có người trong 5 đến 10 giây, Kiosk tự động ẩn khung camera và chuyển sang màn hình chào mừng trang nhã hiển thị đồng hồ số cỡ lớn, ngày giờ, thông tin ca kíp hiện tại và logo công ty; khi có người bước tới dừng lại, trạm tự động đánh thức và điểm danh hoàn tất dưới 1.5 giây.

### 1.2. Các nguyên tắc UX quan trọng (Core UX Principles)

- **`UX-P01` (Dễ đọc lướt - Glanceable & High Contrast)**:
  - Bố cục thông tin được phân cấp thị giác rõ ràng với độ tương phản cao. Chữ to, sắc nét; thông tin đồng hồ và tên nhân viên có thể đọc rõ ràng từ khoảng cách $1.5\text{ m}$.
- **`UX-P02` (Thân thiện với màn hình cảm ứng - Fitts's Law for Touch)**:
  - Mọi nút bấm tương tác (các phím số của bàn phím ảo, nút xác nhận, nút chuyển chế độ) có diện tích tiếp xúc ngón tay tối thiểu $60 \times 60\text{ dp}$, khoảng cách an toàn giữa các phím $\ge 12\text{ dp}$ nhằm loại bỏ hoàn toàn hiện tượng chạm nhầm.
- **`UX-P03` (Tính liên tục của hình ảnh - Continuous Visual Continuity)**:
  - Luồng video hiển thị trực tiếp từ camera phải đạt tốc độ tối thiểu 24–30 FPS chuyển động mượt mà, không bị giật lag, không có hiện tượng chớp đen khi chuyển trạng thái hoặc sau khi nhận diện xong.
- **`UX-P04` (Chỉ dẫn phản hồi tích cực - Graceful Fallback & Feedback)**:
  - Khi phát hiện hình ảnh không hợp lệ hoặc góc nhìn chưa chuẩn, hệ thống luôn đi kèm chỉ dẫn hành động tích cực cho người dùng (*"Vui lòng nhìn thẳng vào camera"*, *"Thử lại hoặc bấm phím tắt để nhập mã PIN"*).
- **`UX-P05` (Xử lý chống quẹt trùng lịch sự - Non-intrusive Cooldown)**:
  - Khi nhân viên đã chấm công thành công nhưng vẫn đứng nán lại trò chuyện trước camera, hệ thống vẫn hiển thị lời chào lịch sự kèm mốc thời gian đã điểm danh, tuyệt đối không rung chuông báo lỗi hay từ chối thô bạo.
- **`UX-P06` (Chờ thông minh & Chuyển cảnh êm dịu - Smart Standby & Seamless Transition)**:
  - Tuyệt đối không bật chuyển màn hình đột ngột khi có người chỉ đi lướt ngang qua hành lang ($< 0.5\text{s}$). Chỉ đánh thức khi người dùng có chủ đích dừng chân ($\ge 0.5\text{s}$); hiệu ứng chuyển cảnh mượt mà trong 300ms, không gây chói mắt hay giật hình.

---

## 2. Layout (Cấu trúc bố cục không gian)

### 2.1. Cấu trúc cửa sổ & Khả năng thích ứng (Responsive Window Structure)
Giao diện trạm Kiosk được thiết kế theo mô hình **Khung thẻ nổi hiện đại (Modern Light Card Canvas)** đặt trên nền tối sang trọng:

- **Tỷ lệ hiển thị mục tiêu**:
  1. *Trạm Kiosk đứng chuyên dụng (Portrait 9:16)*: Tỷ lệ $1080 \times 1920\text{ px}$.
  2. *Trạm Kiosk ngang / Màn hình máy tính để bàn (Landscape 4:3 & 16:9)*: Tỷ lệ $1080 \times 810\text{ px}$ hoặc $1280 \times 720\text{ px}$ / $1920 \times 1080\text{ px}$.
- **Cơ chế co giãn tự động (Dynamic Proportional Scaling)**:
  - Kích thước khung, cỡ chữ và bán kính bo góc tự động điều chỉnh theo tỷ lệ khung hình cửa sổ thực tế, bảo đảm giao diện luôn giữ nguyên tỷ lệ thẩm mỹ, không bị méo hình, tràn viền hoặc co cụm trên các thiết bị hiển thị khác nhau.
  - Hỗ trợ chuyển đổi linh hoạt giữa chế độ cửa sổ và chế độ toàn màn hình không viền.

### 2.2. Điều hướng giao diện (Navigation Model)
- Giao diện Kiosk vận hành theo mô hình **Một màn hình chính thường trực (Single-Screen Kiosk)**:
  - Khung quét camera luôn là tâm điểm thị giác xuyên suốt.
  - Các chức năng phụ trợ (Nhập mã PIN dự phòng, Đăng ký mẫu khuôn mặt mới, Hướng dẫn sử dụng) xuất hiện dưới dạng **Cửa sổ đối thoại bật nổi (Modal Dialog Overlays)** nằm trên lớp kính làm mờ hậu cảnh (Backdrop Blur), tạm thời khóa tương tác nền để người dùng tập trung hoàn thành thao tác.
  - Khi thao tác hoàn tất hoặc khi người dùng hủy bỏ, hộp thoại tự động đóng và màn hình lập tức trở về trạng thái quét chính.

### 2.3. Các phân vùng chính trên màn hình (Main Screen Regions)

```
+-------------------------------------------------------------------------+
| [1] THANH ĐIỀU HƯỚNG ĐỈNH: Logo | Tên trạm | Đồng hồ số | Trạng thái mạng |
+-------------------------------------------------------------------------+
|                                                                         |
|                                                                         |
| [2] VÙNG QUÉT THỊ GIÁC TRUNG TÂM:                                       |
|     - Khung hiển thị luồng Camera trực tiếp                              |
|     - Khung định vị khuôn mặt hình Oval đa trạng thái                   |
|     - Hiệu ứng tia quét phát sáng chuyển động                            |
|     - Dòng trạng thái / Thông điệp chỉ dẫn căn chỉnh trực quan           |
|                                                                         |
|                                                                         |
| [3] THIỆP KẾT QUẢ ĐIỂM DANH (Bật nổi khi hoàn tất xác thực)              |
+-------------------------------------------------------------------------+
| [4] THANH CÔNG CỤ THAO TÁC ĐÁY:                                         |
|     [ Điểm danh bằng PIN ]    [ Đăng ký mới ]    [ Hướng dẫn ]          |
+-------------------------------------------------------------------------+
```

1. **Phân vùng 1: Thanh điều hướng đỉnh (Header Bar)**:
   - Chiều cao quy chuẩn: $90\text{ px}$.
   - Chứa logo biểu trưng, tên định danh của trạm Kiosk, đồng hồ kỹ thuật số kích thước lớn hiển thị ngày giờ thực tế và huy hiệu chỉ báo trạng thái kết nối mạng (Trực tuyến hoặc Ngoại tuyến kèm số lượng bản ghi chờ đồng bộ).
2. **Phân vùng 2: Vùng quét thị giác trung tâm (Main Scanning Canvas)**:
   - Chiếm diện tích trung tâm lớn nhất, được bo góc mềm mại với độ tương phản cao so với nền ngoài.
   - Hiển thị trực tiếp luồng hình ảnh từ camera.
   - Ở vị trí trung tâm là **Khung định vị hình Oval** bao quanh khuôn mặt, tự động đổi màu theo từng trạng thái xác thực.
3. **Phân vùng 3: Thiệp kết quả điểm danh (Floating Result Card)**:
   - Xuất hiện nổi bật phía trên khung camera ngay khi hoàn tất nhận diện, hiển thị ảnh đại diện, họ tên, mã số nhân viên, phòng ban, mốc giờ chấm công và biểu tượng trạng thái lớn.
4. **Phân vùng 4: Thanh công cụ thao tác đáy (Bottom Action Dock)**:
   - Chứa các nút chức năng hỗ trợ cảm ứng cỡ lớn: Nút mở bàn phím PIN, Nút mở luồng đăng ký nhân viên mới, Nút hướng dẫn sử dụng.

### 2.4. Quy tắc bố cục (Layout Rules)
- **Căn giữa tầm mắt tự nhiên (Optical Centering)**: Khung oval định vị nằm ở nửa trên của vùng quét, trùng với tầm mắt tự nhiên của người đứng thẳng trước trạm ($1.4 - 1.7\text{ m}$ so với mặt đất).
- **Phân cấp tầng hiển thị (Z-Index Layering)**:
  - *Tầng 0 (Đáy)*: Nền không gian tối bao quanh.
  - *Tầng 1*: Nền canvas trung tâm màu sáng.
  - *Tầng 2*: Thanh điều hướng đỉnh, Khung hiển thị camera và Thanh công cụ đáy.
  - *Tầng 3*: Khung Oval định vị và hiệu ứng đường quét phát sáng.
  - *Tầng 4*: Thiệp thông báo kết quả điểm danh bật nổi.
  - *Tầng 5 (Đỉnh cao nhất)*: Lớp kính phủ mờ hậu cảnh và các Cửa sổ đối thoại chức năng (Nhập PIN, Đăng ký mới, Trợ giúp).

---

## 3. Visual (Hệ thống thị giác & Thiết kế)

### 3.1. Phong cách thiết kế (Design Style)
Áp dụng phong cách **Modern Neo-Brutalist Light Card kết hợp Dark Ambient**:
- Khung nền tổng thể màu xám tối trầm tĩnh giúp tôn vinh khung canvas màu sáng thanh lịch, hạn chế ánh sáng chói mắt cho người dùng khi đứng trước màn hình Kiosk trong thời gian dài.
- Các phần tử nội dung sử dụng góc bo tròn lớn, đường viền phân cách siêu mảnh và đổ bóng mềm tạo chiều sâu không gian ba chiều rõ nét.

### 3.2. Bảng màu quy chuẩn thiết kế (Color Palette & Semantic Design Roles)

| Nhóm màu | Tên vai trò thiết kế | Giá trị màu sắc quy chuẩn | Ý nghĩa & Vị trí ứng dụng |
| :--- | :--- | :---: | :--- |
| **Nền không gian** | Nền ngoài cùng bao quanh | `#222222` | Tạo không gian tối tương phản bao quanh trạm Kiosk |
| | Nền canvas trung tâm | `#F5F6F8` | Nền sáng thanh lịch chứa toàn bộ bố cục chính |
| | Nền thẻ và hộp thoại | `#FFFFFF` | Nền trắng của Header, Action Dock và các cửa sổ nổi |
| | Nền khung hiển thị camera | `#17191D` | Nền tối sâu tạo độ tương phản tối đa cho luồng video |
| **Màu thương hiệu** | Màu tím chủ đạo (Brand Accent) | `#7567FF` | Màu nhận diện thương hiệu; trạng thái chờ rà soát |
| | Ánh sáng tia quét (Glow Beam) | `rgba(117, 103, 255, 0.25)` | Hiệu ứng vầng sáng quét chuyển động |
| | Nền tím nhạt phụ trợ | `rgba(117, 103, 255, 0.12)` | Nền phụ của các nút bấm và huy hiệu thương hiệu |
| **Màu trạng thái** | Màu xanh lá thành công | `#159447` | Màu viền khung và chữ khi điểm danh thành công |
| | Nền thông báo thành công | `#EEFAF3` | Nền nhạt của huy hiệu và thiệp kết quả thành công |
| | Màu vàng cảnh báo căn chỉnh | `#D97706` | Màu viền khung khi cần điều chỉnh cự ly hoặc góc mặt |
| | Nền thông báo căn chỉnh | `#FEFCE8` | Nền nhạt của dải chỉ dẫn căn chỉnh khuôn mặt |
| | Màu đỏ cảnh báo giả mạo | `#EF4444` | Màu viền khung báo động tấn công giả mạo hoặc lỗi |
| | Nền thông báo cảnh báo lỗi | `#FEF2F2` | Nền nhạt của thông điệp từ chối |
| | Màu xanh chỉ báo trực tuyến | `#20A464` | Chấm tròn thể hiện kết nối mạng máy chủ thông suốt |
| **Màu chữ** | Chữ chính tiêu đề | `#111827` | Chữ đậm cho tiêu đề, tên nhân viên, số đồng hồ |
| | Chữ phụ nội dung | `#666666` | Chữ vừa cho thông tin phòng ban, ngày tháng năm |
| | Chữ chú thích mờ | `#777777` | Chữ nhỏ cho dòng mô tả hướng dẫn, nhãn phím tắt |

### 3.3. Kiểu chữ (Typography)
- **Họ phông chữ quy chuẩn**: Phông chữ không chân chuẩn hiển thị hệ thống (`Arial`, `Segoe UI`, `Inter`, `Roboto`).
- **Thang phân cấp cỡ chữ**:
  - *Đồng hồ kỹ thuật số*: $34 - 40\text{ sp}$, Độ đậm: Đậm (`Bold 700`).
  - *Tên nhân viên trên thiệp kết quả*: $26 - 28\text{ sp}$, Độ đậm: Đậm (`Bold 700`).
  - *Tiêu đề cửa sổ đối thoại / Tiêu đề khối*: $20 - 22\text{ sp}$, Độ đậm: Bán đậm (`SemiBold 600`).
  - *Chỉ dẫn trạng thái khung quét*: $16 - 18\text{ sp}$, Độ đậm: Trung bình (`Medium 500`).
  - *Nhãn nút bấm / Ký tự bàn phím số*: $20 - 24\text{ sp}$, Độ đậm: Đậm (`Bold 700`).
  - *Văn bản mô tả phụ / Ngày tháng*: $14 - 15\text{ sp}$, Độ đậm: Thường (`Normal 400`).

### 3.4. Quy chuẩn khoảng cách & Bo góc (Spacing & Corner Radius)
- **Khoảng cách bố cục (Spacing)**:
  - Cực nhỏ: $4\text{ px}$ | Nhỏ: $8\text{ px}$ | Tiêu chuẩn: $16\text{ px}$ | Lớn: $24\text{ px}$ | Cực lớn: $32\text{ px}$
- **Bán kính bo tròn góc (Corner Radius)**:
  - Bo nhỏ ($12\text{ px}$): Huy hiệu trạng thái, ô nhập liệu văn bản.
  - Bo vừa ($16\text{ px}$): Nút bấm chức năng, phím số bàn phím ảo.
  - Bo lớn ($18\text{ px}$): Khung thanh điều hướng đỉnh, các khối thông tin phụ.
  - Bo cực lớn ($20\text{ px}$): Khung hiển thị camera chính, các cửa sổ đối thoại nổi.
  - Bo tròn hoàn toàn: Chấm chỉ báo trạng thái mạng, các huy hiệu dạng con nhộng.

### 3.5. Quy chuẩn biểu tượng (Iconography)
- Phong cách biểu tượng phẳng hiện đại với đường nét rõ ràng, kích thước chuẩn $24 \times 24\text{ px}$ hoặc $32 \times 32\text{ px}$:
  - *Biểu tượng Camera*: Thể hiện tình trạng hoạt động của cảm biến quang học.
  - *Biểu tượng Trạng thái mạng*: Chấm tròn xanh (Trực tuyến), chấm tròn cam/đỏ (Mất mạng kèm số lượng chờ đồng bộ).
  - *Biểu tượng Dấu tích tròn*: Biểu thị kết quả xác thực thành công.
  - *Biểu tượng Dấu nhân tròn*: Biểu thị cảnh báo giả mạo hoặc lỗi xác thực.
  - *Biểu tượng Bàn phím số*: Nút mở chức năng điểm danh bằng mã PIN.
  - *Biểu tượng Người dùng thêm mới*: Nút mở chức năng đăng ký mẫu khuôn mặt mới.
  - *Biểu tượng Dấu hỏi trợ giúp*: Nút mở hướng dẫn sử dụng trạm.

---

## 4. Screens & Interactions (Màn hình & Tương tác chi tiết)

### 4.1. Danh mục các trạng thái màn hình (Screen States Overview)

| Tên Trạng thái / Màn hình | Dạng thức hiển thị | Tương tác & Hành vi người dùng | Trạng thái chuyển tiếp |
| :--- | :---: | :--- | :--- |
| **Màn hình Chờ Chào mừng (Standby)** | Màn hình chính (Ẩn camera) | Không có người; hiển thị đồng hồ, ca kíp | Có người dừng chân $\rightarrow$ Đánh thức tức thì |
| **Màn hình Quét Camera (Active)** | Màn hình chính (Hiện camera)| Đứng trước camera, căn chỉnh khuôn mặt | Thành công, Cảnh báo hoặc về Chờ |
| **Trạng thái Căn chỉnh (Aligning)** | Màn hình chính | Nhìn thẳng, điều chỉnh khoảng cách | Thành công hoặc Cảnh báo |
| **Trạng thái Thành công (Success)** | Thiệp nổi bật | Nhìn thấy thông tin, nghe tiếng bíp | Tự đóng sau 2.5s về Quét hoặc Chờ |
| **Trạng thái Quét trùng Cooldown** | Thiệp nổi bật | Nhận thông báo đã điểm danh rồi | Tự đóng sau 2.0s về Quét hoặc Chờ |
| **Trạng thái Cảnh báo Giả mạo (Spoof)**| Màn hình chính | Nghe tiếng cảnh báo, đọc lý do | Đóng băng 3.0s về Quét hoặc Chờ |
| **Cửa sổ Điểm danh bằng PIN** | Đối thoại nổi | Chạm bàn phím số ảo, nhập mã | Thành công $\rightarrow$ Ghi nhận & Đóng |
| **Cửa sổ Đăng ký Khuôn mặt mới** | Đối thoại nổi | Nhập OTP $\rightarrow$ Chụp chuẩn $\rightarrow$ Xong | Hoàn tất $\rightarrow$ Kích hoạt & Đóng |
| **Cửa sổ Hướng dẫn sử dụng** | Đối thoại nổi | Đọc hướng dẫn tư thế và phím tắt | Bấm Đóng hoặc phím Hủy |

---

### 4.2. Chi tiết tương tác các màn hình & Trạng thái

#### 4.2.1. Màn hình Chờ Chào mừng (Standby / Welcome Screen)
- **Kịch bản kích hoạt**:
  - Khi không phát hiện bất kỳ khuôn mặt nào trước camera liên tục trong vòng **5 đến 10 giây**, giao diện trạm Kiosk tự động chuyển sang Màn hình Chờ Chào mừng.
- **Thành phần hiển thị**:
  - **Ẩn hoàn toàn khung video camera**: Giúp tiết kiệm tài nguyên hiển thị, chống lưu ảnh màn hình và tạo sự riêng tư, thanh lịch cho không gian văn phòng.
  - **Đồng hồ kỹ thuật số kích thước siêu lớn** ($48 - 60\text{ sp}$): Hiển thị giờ:phút:giây và thứ ngày tháng năm rõ nét, có thể quan sát từ khoảng cách xa trên 3 mét.
  - **Khối thông tin ca kíp hiện hành**: Hiển thị tên ca và khung giờ quy định (ví dụ: *"Ca sáng: 08:00 - 12:00"* hoặc *"Ca chiều: 13:30 - 17:30"*).
  - **Logo biểu trưng & Thông điệp chào đón**: Logo công ty kích thước lớn, dòng chữ chào đón trang trọng: *"Chào mừng bạn đến với cơ quan / doanh nghiệp"*.
  - **Dòng chỉ dẫn người dùng**: *"Vui lòng bước tới trước trạm để điểm danh"*.
- **Bộ lọc chủ đích (Intention Filter)**:
  - Hệ thống duy trì việc rà soát hình ảnh chạy ngầm ở mức tối ưu ($5 - 8\text{ FPS}$) để phát hiện có người hay không.
  - Người chỉ đi lướt ngang qua hành lang ($< 0.5\text{s}$): Hệ thống bỏ qua, giữ nguyên Màn hình Chờ.
  - Người có chủ đích điểm danh (bước tới và khuôn mặt ổn định trong $0.5 - 0.8\text{ giây}$): Hệ thống lập tức kích hoạt đánh thức.
- **Hiệu ứng chuyển cảnh đánh thức (Instant Wake-up)**:
  - Giao diện chuyển cảnh mượt mà trong vòng không quá **$300\text{ ms}$** sang màn hình quét và điểm danh tức thì.
  - Tổng thời gian từ khi người dùng bước tới đến khi nghe tiếng bíp xác nhận thành công chỉ từ **$1.0$ đến $1.5\text{ giây}$**.

#### 4.2.2. Màn hình Quét Camera & Căn chỉnh (Active Scanning & Alignment)
- **Thành phần hiển thị**:
  - Luồng video camera trực tiếp với hiệu ứng đường quét phát sáng di chuyển tuần hoàn từ trên xuống dưới.
  - Khung Oval hướng dẫn định vị khuôn mặt đặt ở vị trí trung tâm tầm mắt.
  - Dải huy hiệu trạng thái nằm phía dưới khung hiển thị camera.
- **Tương tác thị giác**:
  - *Khi chưa có người*: Khung oval có viền màu tím chủ đạo nét mảnh. Dải trạng thái hiển thị thông điệp: *"Vui lòng đứng trước camera để điểm danh"*.
  - *Khi phát hiện khuôn mặt nhưng bị nghiêng góc hoặc đứng quá xa*: Khung oval lập tức đổi sang viền màu vàng hổ phách, dải trạng thái đổi sang nền vàng nhạt kèm thông báo: *"Vui lòng nhìn thẳng vào camera"*.
  - Hiệu ứng chuyển màu viền oval diễn ra mượt mà trong thời gian $250\text{ ms}$, không gây chớp nháy đột ngột.

#### 4.2.3. Trạng thái Điểm danh Thành công (Success Attendance Feedback)
- **Thành phần hiển thị**:
  - Khung oval lập tức chuyển sang viền màu xanh lá cây rực rỡ, độ dày viền tăng lên để tạo điểm nhấn thị giác rõ ràng.
  - Thiệp thông báo kết quả điểm danh bật nổi lên phía trên với hiệu ứng chuyển động mượt mà:
    - Biểu tượng dấu tích tròn màu xanh lá cây cỡ lớn.
    - Dòng chữ chúc mừng nổi bật: *"Xin chào, [Họ và tên nhân viên]!"*.
    - Dòng thông tin định danh: *"Mã NV: [Mã số] • [Tên phòng ban]"*.
    - Dòng mốc thời gian ghi nhận: *"Điểm danh lúc: [Giờ:Phút:Giây]"*.
- **Phản hồi âm thanh**: Trạm Kiosk phát đồng thời âm thanh phản hồi xác nhận thành công (tiếng bíp đơn ngắn, âm vực cao dịu).
- **Thời gian hiển thị tự động**: Thiệp kết quả duy trì hiển thị trên màn hình trong đúng **2.5 giây**, sau đó mờ dần trong $300\text{ ms}$ và đưa trạm trở về trạng thái chờ sẵn sàng phục vụ người tiếp theo. Nếu sau đó vắng người trong 5–10s, hệ thống tự động quay lại Màn hình Chờ Chào mừng.

#### 4.2.4. Tương tác Chống quẹt trùng Cooldown (Deduplication Feedback)
- **Hành vi hiển thị**:
  - Khi nhân viên đã điểm danh thành công nhưng tiếp tục đứng trước camera trong vòng 120 giây:
  - Khung oval duy trì màu xanh lá/xanh dương dịu.
  - Thiệp thông báo hiển thị lời nhắc lịch sự: *"Bạn đã điểm danh lúc [Thời gian trước]! Vui lòng di chuyển qua cửa"*.
  - Không phát âm thanh gây ồn ào; thiệp tự động biến mất sau 2.0 giây.

#### 4.2.5. Trạng thái Cảnh báo Tấn công Giả mạo (Spoofing Alert)
- **Hành vi hiển thị**:
  - Khi phát hiện hình ảnh in 2D, màn hình điện thoại hoặc video phát lại trước camera:
  - Khung oval lập tức chuyển sang viền màu đỏ rực, phát âm thanh cảnh báo lỗi (tiếng bíp đôi ngắt quãng).
  - Màn hình hiển thị thông báo lỗi: *"Phát hiện khuôn mặt không hợp lệ! Vui lòng không sử dụng hình ảnh giả mạo"*.
  - Khung hình đóng băng cảnh báo trong 3.0 giây trước khi quay lại trạng thái rà soát.

#### 4.2.6. Cửa sổ Điểm danh bằng Mã PIN (Fallback PIN Pad Dialog)
- **Thành phần hiển thị**:
  - Cửa sổ nổi bật chính giữa màn hình với nền trắng sang trọng, kích thước lớn tối ưu cho thao tác chạm tay.
  - Ô hiển thị Mã số nhân viên (cho phép nhập từ bàn phím hoặc chọn nhanh).
  - Ô hiển thị Mã số PIN cá nhân với các ký tự dấu chấm đen bảo mật `●`.
  - Bàn phím số cảm ứng kích thước lớn gồm các số từ `0` đến `9`, phím `Xóa trắng` và phím `Xóa lùi`.
  - Nút bấm *"Xác nhận điểm danh"* lớn trải dài toàn bộ chiều ngang hộp thoại.
- **Tương tác cảm ứng**:
  - Khi chạm vào từng phím số: Phím có hiệu ứng lún nhẹ xuống và đổi màu nền tức thời kèm âm thanh gõ nhẹ.
  - Nút Xác nhận chỉ sáng màu kích hoạt khi nhân viên đã nhập đủ từ 4 đến 6 chữ số.
  - *Trường hợp nhập sai*: Ô nhập rung lắc nhẹ theo phương ngang, xuất hiện thông báo lỗi màu đỏ: *"Mã PIN không chính xác! (Còn lại X lần thử)"*.
  - *Trường hợp sai 5 lần liên tiếp*: Bàn phím số bị làm mờ và vô hiệu hóa, xuất hiện đồng hồ đếm ngược: *"Tài khoản tạm khóa. Thử lại sau: 14:59"*.

#### 4.2.7. Cửa sổ Đăng ký Khuôn mặt mới (Enrollment Flow Dialog)
- **Quy trình 3 bước hướng dẫn trực quan**:
  1. *Bước 1 - Nhập mã xác thực*: Nhân viên nhập mã kích hoạt OTP gồm 6 chữ số do Cổng Web cung cấp (hoặc đưa mã QR trước camera).
  2. *Bước 2 - Căn chỉnh chất lượng hình ảnh*: Màn hình mở khung camera hướng dẫn kèm thanh đo 4 tiêu chí đạt chuẩn theo thời gian thực (Độ sáng, Độ sắc nét, Góc nhìn thẳng, Thực thể sống người thật).
  3. *Bước 3 - Hoàn tất*: Khi cả 4 tiêu chuẩn đều đạt màu xanh, đồng hồ đếm ngược $3.. 2.. 1..$ kích hoạt, hệ thống tự động ghi nhận mẫu; màn hình hiển thị lời chúc mừng tài khoản đã được kích hoạt thành công.

#### 4.2.8. Cửa sổ Hướng dẫn sử dụng (Help Dialog)
- **Nội dung hiển thị**:
  - Hình minh họa tư thế đứng chuẩn ($0.5 - 1.2\text{ m}$, thẳng góc mắt).
  - Hướng dẫn xử lý khi nhận diện thất bại (tháo kính râm, lau camera, hoặc sử dụng mã PIN).
  - Bảng tra cứu danh mục phím tắt trạm Kiosk (`F1`, `F2`, `F3`, `F11`, `Esc`).

---

## 5. UI Acceptance (Tiêu chuẩn thẩm định & Nghiệm thu giao diện)

Mọi phiên bản phần mềm trạm Kiosk bắt buộc phải vượt qua toàn bộ các tiêu chí nghiệm thu giao diện dưới đây trước khi bàn giao đưa vào vận hành thực tế:

### 5.1. Tiêu chí bắt buộc đạt về hiệu năng giao diện (UI Performance Criteria)
- **Tốc độ khung hình (Frame Rate)**:
  - Tốc độ hiển thị giao diện đồ họa duy trì ổn định ở mức **$60\text{ FPS}$**.
  - Luồng video camera hiển thị mượt mà liên tục, đạt tối thiểu **$\ge 24\text{ FPS}$**.
- **Độ trễ phản hồi tương tác (Touch Latency)**:
  - Độ trễ phản hồi từ khi chạm ngón tay vào màn hình cảm ứng đến khi xuất hiện hiệu ứng thị giác $\le 50\text{ ms}$.
- **Thời gian hiển thị kết quả xác thực**:
  - Thời gian bật nổi thiệp kết quả sau khi hoàn tất nhận diện $\le 200\text{ ms}$.

### 5.2. Nhất quán thị giác (Visual Consistency Verification)
- **Quy chuẩn màu sắc & Độ tương phản**:
  - Toàn bộ màu sắc hiển thị trên giao diện bắt buộc phải tuân thủ đúng bảng màu quy chuẩn tại Mục 3.2. Tuyệt đối không sử dụng các mã màu tùy tiện ngoài bảng quy chuẩn.
  - Tỷ lệ tương phản chữ trên nền (Contrast Ratio) đạt tối thiểu chuẩn **WCAG 2.1 AA** ($\ge 4.5:1$ đối với văn bản thông thường và $\ge 3:1$ đối với văn bản kích thước lớn).
- **Tính đồng nhất bo góc**:
  - Tất cả các nút bấm chức năng đồng bộ bo góc $16\text{ px}$.
  - Toàn bộ khung hiển thị camera và các cửa sổ đối thoại đồng bộ bo góc $20\text{ px}$.
- **Khả năng hiển thị đa độ phân giải**:
  - Kiểm thử trực tiếp trên cả chế độ màn hình ngang (tỷ lệ 4:3) và màn hình dọc (tỷ lệ 9:16): Chữ, nút bấm và khung oval định vị tự động co giãn sắc nét, không bị méo hình, không bị chồng chéo hay tràn nội dung ra ngoài màn hình.

### 5.3. Tính chính xác trong tương tác (Interaction Correctness)
- **Kiểm tra bàn phím số ảo PIN**:
  - Thao tác gõ từng phím số phản ánh chính xác số ký tự dấu chấm `●`.
  - Phím Xóa lùi xóa đúng ký tự cuối cùng; phím Xóa trắng xóa toàn bộ chuỗi ký tự.
  - Cơ chế tự động khóa bàn phím kích hoạt chính xác sau đúng 5 lần nhập sai liên tiếp.
- **Kiểm tra hệ thống phím tắt Kiosk**:
  - Phím `F1`: Mở và đóng cửa sổ Hướng dẫn sử dụng chính xác.
  - Phím `F2`: Mở và đóng cửa sổ Bàn phím số PIN chính xác.
  - Phím `F3`: Mở và đóng quy trình Đăng ký khuôn mặt mới chính xác.
  - Phím `F11`: Chuyển đổi qua lại giữa chế độ cửa sổ và chế độ toàn màn hình mượt mà.
  - Phím `Esc`: Đóng ngay cửa sổ đang mở để quay lại màn hình điểm danh chính.

### 5.4. Xử lý toàn diện các trạng thái đặc biệt (State Handling Verification)
- **Trạng thái Màn hình Chờ Chào mừng & Chuyển cảnh đánh thức**:
  - Không có người trước camera trong vòng 5 đến 10 giây: Giao diện tự động ẩn khung video camera và hiển thị Màn hình Chờ trang nhã (đồng hồ số lớn, thứ ngày tháng, ca kíp hiện hành, logo công ty).
  - Người chỉ đi lướt ngang qua hành lang ($< 0.5\text{s}$): Giữ nguyên Màn hình Chờ, không bị giật hay chuyển cảnh nhầm.
  - Người dừng chân hướng mặt về camera ($\ge 0.5\text{s}$): Chuyển cảnh mượt mà trong $\le 300\text{ ms}$ và hoàn tất ghi nhận điểm danh trong tổng thời gian $\le 1.5\text{ giây}$.
- **Trạng thái Ngoại tuyến khi mất mạng**:
  - Khi ngắt kết nối mạng: Huy hiệu trên thanh điều hướng đỉnh lập tức chuyển sang màu cam "Ngoại tuyến", hiển thị đúng số lượng bản ghi đang chờ gửi; màn hình vẫn thông báo kết quả điểm danh thành công bình thường để nhân viên an tâm.
- **Trạng thái Phát hiện Tấn công Giả mạo**:
  - Đưa ảnh in hoặc video trước camera: Khung viền lập tức chuyển sang màu đỏ rực, phát âm thanh cảnh báo lỗi, tuyệt đối không tạo bản ghi điểm danh.
- **Trạng thái Quét lặp Cooldown**:
  - Đứng yên trước camera sau khi đã điểm danh xong: Hệ thống hiển thị thiệp thông báo đã chấm công lúc mấy giờ, không gửi bản ghi trùng lặp lên hệ thống.

---

## 6. Phê duyệt & Ký nhận (Sign-off)

Tài liệu này là căn cứ đặc tả kỹ thuật giao diện duy nhất phục vụ công tác thiết kế, thẩm định và nghiệm thu trải nghiệm người dùng trạm Kiosk. Mọi thay đổi về bố cục, màu sắc, âm thanh hay luồng tương tác bắt buộc phải được đệ trình và phê duyệt chính thức theo quy trình quản lý thay đổi SDLC của dự án.
