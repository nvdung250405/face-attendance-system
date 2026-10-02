# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
> - **Mã tài liệu**: FR-KIOSK-01
> - **Tên tài liệu**: Đặc tả yêu cầu chức năng — Phân hệ Trạm Điểm danh Kiosk (Kiosk Functional Requirements)
> - **Tài liệu cha**: [FR.md](../../../docs/requirements/FR.md) (FR-FAS-01), [SRS.md](../../../docs/requirements/SRS.md) (SRS-FAS-01)
> - **Phiên bản**: 1.1
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: nvdung
> - **Ngày hiệu lực**: 2026-10-01
> - **Tài liệu liên quan**: [BP.md](BP.md), [TP.md](TP.md), [ui-ux.md](ui-ux.md), [DDS.md](../../../docs/design/DDS.md), [FR.md](../../../docs/requirements/FR.md), [SRS.md](../../../docs/requirements/SRS.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-10-01)*: Khởi tạo bản đặc tả yêu cầu chức năng cho phân hệ Kiosk.
>   - *v1.1 (2026-10-01)*: Chuẩn hóa theo chuẩn SDLC thuần túy yêu cầu nghiệp vụ: Loại bỏ hoàn toàn các tham chiếu ngược về chi tiết mã nguồn, tên tệp mã, lớp lập trình và ma trận mã nguồn đã xây dựng.

---

## 1. Tổng quan & Phạm vi phân hệ Kiosk

### 1.1. Mục đích tài liệu
Tài liệu này xác định đầy đủ và chính xác các **Yêu cầu Chức năng (Functional Requirements - FR)** của **Phân hệ Trạm Điểm danh Kiosk (`kiosk-app`)** thuộc Hệ thống Chấm công Khuôn mặt Doanh nghiệp (Face Attendance System - FAS). 

Mục tiêu của tài liệu là định nghĩa rõ:
- Hệ thống Kiosk phải làm gì (What) theo góc nhìn nghiệp vụ và tương tác người dùng, độc lập hoàn toàn với việc hiện thực mã nguồn bên dưới.
- Các quy tắc nghiệp vụ (Business Rules) chi phối luồng xử lý.
- Luồng sự kiện chính, luồng thay thế và ngoại lệ khi người dùng tương tác với trạm Kiosk.
- Dữ liệu đầu vào, kết quả đầu ra và các tiêu chí chấp nhận (Acceptance Criteria) phục vụ nghiệm thu chức năng.

### 1.2. Phạm vi phân hệ Kiosk
Trạm Kiosk là thiết bị đầu cuối thông minh đặt tại cổng hoặc cửa ra vào doanh nghiệp, đóng vai trò là giao diện tiếp xúc trực tiếp hàng ngày giữa nhân viên và hệ thống chấm công:
- **Nhận diện tự động không chạm**: Liên tục thu nhận hình ảnh, phát hiện khuôn mặt, xác thực người thật và nhận diện danh tính nhân viên trong thời gian thực.
- **Phương thức dự phòng an toàn**: Cung cấp bàn phím số ảo nhập mã PIN khi nhân viên không thể điểm danh bằng khuôn mặt.
- **Chống gian lận & Trùng lặp**: Tự động phát hiện các hình thức tấn công giả mạo (ảnh in, màn hình thiết bị số) và ngăn chặn việc chấm công nhiều lần liên tiếp khi nhân viên đứng nán lại trước camera.
- **Tính liên tục & Chịu lỗi ngoại tuyến**: Đảm bảo việc điểm danh diễn ra thông suốt ngay cả khi mất kết nối mạng nội bộ về máy chủ trung tâm; tự động phục hồi và đồng bộ dữ liệu khi mạng hoạt động trở lại.
- **Thu thập mẫu khuôn mặt chuẩn hóa**: Tiếp nhận mã kích hoạt một lần (Onboarding OTP) để hướng dẫn nhân viên mới quét nạp mẫu khuôn mặt đạt tiêu chuẩn chất lượng hình ảnh quy định.

---

## 2. Danh mục yêu cầu chức năng phân hệ Kiosk

| Mã Yêu cầu | Tên chức năng Kiosk | Phân nhóm nghiệp vụ | Mức độ ưu tiên | KPI / SLA Nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: |
| **FR-K01** | Thu nhận luồng hình ảnh & Phát hiện khuôn mặt | Thị giác máy tính biên | **Critical** | $\ge 15\text{ FPS}$, phát hiện trong $\le 25\text{ ms}$ |
| **FR-K02** | Kiểm tra thực thể sống thụ động chống giả mạo | Bảo mật sinh trắc học | **Critical** | Phân loại trong $\le 60\text{ ms}$, APCER $\le 10\%$ |
| **FR-K03** | Định danh khuôn mặt 1:N cục bộ | Xác thực sinh trắc học | **Critical** | Nhận diện trong $\le 100\text{ ms}$, TAR $\ge 95\%$ |
| **FR-K04** | Điểm danh dự phòng bằng bàn phím mã PIN | Xác thực thay thế | **High** | Khóa 15 phút nếu sai 5 lần, phản hồi $\le 1.0\text{ s}$ |
| **FR-K05** | Chống quét trùng lặp trong thời gian Cooldown | Kiểm soát nghiệp vụ | **High** | Cửa sổ 120 giây, loại bỏ 100% bản ghi dư thừa |
| **FR-K06** | Lưu trữ ngoại tuyến & Tự động đồng bộ bù | Độ bền vững hệ thống | **Critical** | Cam kết $\text{RPO} = 0$, đồng bộ theo lô tự động |
| **FR-K07** | Đăng ký & Nạp mẫu khuôn mặt mới tại trạm | Quản lý danh tính | **High** | Xác thực OTP 48h, kiểm chuẩn chất lượng ảnh |
| **FR-K08** | Cập nhật danh mục mẫu & Thu hồi tức thời | Quản lý danh tính | **High** | Đồng bộ thời gian thực $\le 1.0\text{ s}$, thu hồi ngay |
| **FR-K09** | Phản hồi giao diện & Âm thanh trực quan | Trải nghiệm người dùng | **High** | Hiển thị 60 FPS, phản hồi màu sắc & âm thanh |
| **FR-K10** | Quản trị vận hành & Nhật ký hoạt động | Vận hành hệ thống | **Medium** | Tự động xoay vòng nhật ký, phím tắt thao tác nhanh |

---

## 3. Đặc tả chi tiết từng yêu cầu chức năng

---

### [FR-K01] Thu nhận luồng hình ảnh và phát hiện khuôn mặt thời gian thực (Real-Time Video Capture & Face Detection)

#### 3.1.1. Mục tiêu & Mô tả
Hệ thống Kiosk phải liên tục thu nhận tín hiệu hình ảnh trực tiếp từ camera, hiển thị luồng video mượt mà cho người dùng quan sát, đồng thời tự động phát hiện sự xuất hiện của khuôn mặt và xác định vị trí các điểm mốc hình học cơ bản (hai mắt, mũi, hai khóe miệng) để chuẩn bị cho các bước xử lý tiếp theo.

#### 3.1.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K01.1` (Tốc độ khung hình tối thiểu)**: Tốc độ thu nhận hình ảnh phải đạt tối thiểu $15\text{ FPS}$ (khuyến nghị $30\text{ FPS}$) ở độ phân giải tiêu chuẩn từ HD $1280 \times 720$ trở lên.
- **`BR-K01.2` (Kích thước khuôn mặt hợp lệ)**: Vùng khuôn mặt được phát hiện phải có kích thước tối thiểu $120 \times 120\text{ pixels}$ trong khung hình. Các khuôn mặt có kích thước nhỏ hơn sẽ bị hệ thống bỏ qua nhằm tránh việc nhận diện nhầm người đi lại ở hậu cảnh xa.
- **`BR-K01.3` (Dung sai tư thế khuôn mặt)**: Hệ thống chỉ chấp nhận khuôn mặt nằm trong giới hạn góc quay cho phép:
  - Góc quay ngang (Yaw): không lệch quá $\pm 15^\circ$.
  - Góc cúi hoặc ngửa (Pitch): không lệch quá $\pm 15^\circ$.
  - Góc nghiêng vai (Roll): không nghiêng quá $\pm 10^\circ$.
- **`BR-K01.4` (Xử lý khi có nhiều người)**: Trường hợp có nhiều hơn một khuôn mặt xuất hiện đồng thời trong tầm nhìn camera, hệ thống tự động ưu tiên xử lý khuôn mặt có diện tích lớn nhất và có vị trí gần tâm khung hình nhất.
- **`BR-K01.5` (Chế độ chờ tiết kiệm tài nguyên & Bộ lọc chủ đích - Smart Standby)**:
  - Khi không phát hiện khuôn mặt trong tầm nhìn camera liên tục từ 5 đến 10 giây, hệ thống tự động kích hoạt chế độ chờ (Standby Mode), hạ tần suất quét hình ảnh chạy ngầm xuống mức tối ưu ($5 - 8\text{ FPS}$) để tiết kiệm tài nguyên CPU và chống lưu ảnh màn hình.
  - Áp dụng bộ lọc chủ đích (Intention Filter): Người đi lướt ngang qua hành lang ($< 0.5\text{s}$) sẽ bị bỏ qua để tránh chuyển cảnh giật cục. Khi người dùng dừng chân hướng mặt về phía Kiosk và khuôn mặt ổn định trong $0.5 - 0.8\text{ giây}$, hệ thống lập tức đánh thức và thực thi quy trình nhận diện điểm danh tức thì.

#### 3.1.3. Luồng sự kiện chính (Main Flow)
1. Khi chưa có người, Kiosk duy trì chế độ chờ (Standby Mode) với tần suất quét ngầm $5 - 8\text{ FPS}$.
2. Nhân viên bước tới trước trạm Kiosk và dừng lại hướng mặt về phía màn hình.
3. Hệ thống phát hiện khuôn mặt và theo dõi độ ổn định trong $0.5 - 0.8\text{ giây}$ (xác nhận chủ đích điểm danh).
4. Hệ thống lập tức đánh thức, nâng tốc độ xử lý lên chuẩn $15 - 30\text{ FPS}$, trích xuất 5 điểm mốc hình học trong vòng $\le 25\text{ ms}$.
5. Kiểm tra các điều kiện góc nhìn và kích thước (`BR-K01.2`, `BR-K01.3`) và tự động chuyển tiếp sang bước kiểm tra thực thể sống (`FR-K02`).
6. Sau khi điểm danh xong, nếu không có người tiếp theo trong vòng 5 đến 10 giây, Kiosk tự động trượt êm ái trở lại chế độ chờ.

#### 3.1.4. Luồng thay thế & Ngoại lệ (Alternative & Exception Flows)
- *A1 - Người chỉ đi ngang qua hành lang*: Khuôn mặt chỉ lướt qua dưới $0.5\text{s}$, hệ thống nhận diện đây là người đi qua vô tình và giữ nguyên chế độ chờ, không làm xáo trộn màn hình.
- *A2 - Khuôn mặt bị nghiêng hoặc lệch góc*: Khung định vị hiển thị màu cảnh báo vàng và hiển thị thông điệp hướng dẫn: *"Vui lòng nhìn thẳng vào camera"*.
- *E1 - Sự cố mất tín hiệu camera*: Hệ thống hiển thị biểu tượng cảnh báo lỗi thiết bị, thông báo cho nhân viên và tự động cố gắng thiết lập lại kết nối camera định kỳ mỗi 3 giây.

#### 3.1.5. Dữ liệu đầu vào & Đầu ra
- **Đầu vào**: Tín hiệu luồng video quang học từ camera vật lý tại trạm.
- **Đầu ra**: Khung hình hiển thị cho người dùng, tọa độ vùng bao khuôn mặt, tọa độ 5 điểm mốc hình học và ảnh cắt vùng mặt đã căn chỉnh.

#### 3.1.6. Tiêu chí chấp nhận (Acceptance Criteria)
- Hình ảnh hiển thị trên giao diện chuyển động mượt mà, không bị giật hoặc đơ cứng.
- Bộ lọc chủ đích lọc chính xác người đi lướt qua dưới $0.5\text{s}$, không kích hoạt nhầm.
- Thời gian từ khi nhân viên bước vào vị trí chuẩn đến khi phát hiện được khuôn mặt $\le 25\text{ ms}$.

---

### [FR-K02] Kiểm tra thực thể sống thụ động chống giả mạo (Passive Presentation Attack Detection - PAD)

#### 3.2.1. Mục tiêu & Mô tả
Trạm Kiosk phải tự động thẩm định và xác thực khuôn mặt trước camera là của người thật đang hiện diện sống, ngăn chặn triệt để mọi hành vi gian lận chấm công hộ bằng hình ảnh in màu 2D, ảnh trên màn hình điện thoại/máy tính bảng hoặc video phát lại.

#### 3.2.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K02.1` (Ngưỡng điểm thực thể sống)**: Mức độ tin cậy thực thể sống ($S_{\text{liveness}}$) phải đạt giá trị từ $0.70$ trở lên (trên thang đo $[0.0, 1.0]$) mới được xem là người thật hợp lệ.
- **`BR-K02.2` (Xử lý giả mạo)**: Mọi trường hợp có điểm $S_{\text{liveness}} < 0.70$ đều bị phân loại là hành vi giả mạo (Presentation Attack) và bị từ chối chấm công ngay lập tức.
- **`BR-K02.3` (Thụ động, không phiền hà)**: Quá trình xác thực là hoàn toàn thụ động (Passive), tuyệt đối không yêu cầu nhân viên phải thực hiện các cử chỉ gượng gạo (chớp mắt, quay đầu, há miệng).

#### 3.2.3. Luồng sự kiện chính (Main Flow)
1. Tiếp nhận vùng ảnh khuôn mặt hợp lệ từ chức năng `FR-K01`.
2. Hệ thống phân tích đặc tính quang phổ bề mặt, kết cấu vân da và phản chiếu ánh sáng tự nhiên trong thời gian $\le 60\text{ ms}$.
3. Xác định chỉ số thực thể sống $S_{\text{liveness}} \ge 0.70$.
4. Hệ thống xác nhận người thật thành công và chuyển sang bước định danh khuôn mặt `FR-K03`.

#### 3.2.4. Luồng thay thế & Ngoại lệ (Alternative & Exception Flows)
- *A1 - Phát hiện dấu hiệu giả mạo*:
  1. Khung định vị trên màn hình lập tức chuyển sang viền màu đỏ cảnh báo.
  2. Hệ thống phát âm thanh cảnh báo từ chối.
  3. Màn hình hiển thị thông báo: *"Phát hiện khuôn mặt không hợp lệ! Vui lòng không sử dụng hình ảnh giả mạo"*.
  4. Ghi nhận sự kiện cảnh báo an ninh vào nhật ký nội bộ của trạm.
  5. Tạm dừng quét đối với đối tượng này trong 3 giây trước khi quay lại trạng thái chờ.

#### 3.2.5. Dữ liệu đầu vào & Đầu ra
- **Đầu vào**: Vùng ảnh khuôn mặt mở rộng trích xuất từ `FR-K01`.
- **Đầu ra**: Điểm số thực thể sống ($S_{\text{liveness}}$) và trạng thái phân loại (Người thật / Giả mạo).

#### 3.2.6. Tiêu chí chấp nhận (Acceptance Criteria)
- Đạt tiêu chuẩn kiểm định quốc tế ISO/IEC 30107-3: Tỷ lệ chấp nhận tấn công giả mạo (APCER) $\le 10\%$, tỷ lệ từ chối sai người thật (BPCER) $\le 2\%$.
- Thời gian phân tích thực thể sống hoàn tất trong không quá $60\text{ ms}$.

---

### [FR-K03] Trích xuất đặc trưng & Định danh khuôn mặt 1:N cục bộ (Local 1:N Face Recognition)

#### 3.3.1. Mục tiêu & Mô tả
Trạm Kiosk thực hiện chuyển đổi ảnh khuôn mặt người thật thành vector đặc trưng toán học và so khớp trực tiếp với toàn bộ danh mục mẫu nhân viên đang lưu sẵn trong bộ nhớ của trạm (so khớp 1:N cục bộ), cho phép định danh chính xác danh tính nhân viên mà không gửi hình ảnh về máy chủ.

#### 3.3.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K03.1` (Thước đo tương đồng Cosine)**: Mức độ tương đồng danh tính giữa khuôn mặt quét được và khuôn mặt mẫu trong hệ thống được tính bằng độ tương đồng Cosine (Cosine Similarity) trên không gian vector chuẩn hóa:
  $$\text{Score} = \text{CosineSimilarity}(\vec{u}, \vec{v}) \in [-1.0, 1.0]$$
- **`BR-K03.2` (Ngưỡng định danh thành công)**: Điểm tương đồng phải đạt tối thiểu từ $0.50$ trở lên mới được công nhận là cùng một người (ngưỡng bảo đảm tỷ lệ nhận diện nhầm $\text{FAR} \le 0.1\%$).
- **`BR-K03.3` (Xác định danh tính trùng khớp nhất)**: Hệ thống so khớp đồng thời với tất cả các nhân viên trong danh mục và chọn ra nhân viên có điểm tương đồng cao nhất vượt ngưỡng.
- **`BR-K03.4` (Khuôn mặt chưa đăng ký / Người lạ)**: Trường hợp điểm tương đồng cao nhất đạt được $< 0.50$, hệ thống phân loại là người chưa đăng ký thông tin hoặc người lạ.

#### 3.3.3. Luồng sự kiện chính (Main Flow)
1. Nhận ảnh khuôn mặt người thật đã căn chuẩn từ bước `FR-K02`.
2. Hệ thống trích xuất vector đặc trưng sinh trắc học chuẩn hóa trong thời gian $\le 70\text{ ms}$.
3. Thực hiện so khớp nhanh với danh mục mẫu nhân viên đang lưu trữ tại bộ nhớ trạm.
4. Tìm thấy nhân viên khớp danh tính với điểm tương đồng $\ge 0.50$:
   - Trích xuất thông tin: Mã nhân viên, Họ và tên, Phòng ban.
   - Chuyển tiếp thông tin sang bước kiểm tra chống quẹt trùng Cooldown (`FR-K05`).
   - Màn hình Kiosk chuyển sang viền màu xanh lá cây rực rỡ, hiển thị thông tin chúc mừng điểm danh thành công kèm thời gian chính xác.
   - Phát âm thanh phản hồi thành công dịu nhẹ.

#### 3.3.4. Luồng thay thế & Ngoại lệ (Alternative & Exception Flows)
- *A1 - Không nhận diện được danh tính (Người lạ hoặc điểm < 0.50)*:
  - Khung viền chuyển màu vàng cảnh báo.
  - Hiển thị thông báo: *"Không nhận diện được nhân viên. Vui lòng thử lại hoặc bấm [F2] để điểm danh bằng mã PIN"*.
  - Không tạo bất kỳ lượt chấm công nào.

#### 3.3.5. Dữ liệu đầu vào & Đầu ra
- **Đầu vào**: Vùng ảnh khuôn mặt chuẩn hóa và danh mục vector mẫu nhân viên lưu sẵn tại trạm.
- **Đầu ra**: Mã số nhân viên (`employee_id`), họ tên, phòng ban và điểm số tương đồng xác thực.

#### 3.3.6. Tiêu chí chấp nhận (Acceptance Criteria)
- Tỷ lệ nhận diện đúng (TAR) $\ge 95\%$ trong điều kiện chiếu sáng thông thường của văn phòng ($300 - 500\text{ lux}$).
- Tổng thời gian trích xuất và so khớp với danh mục 1,000 nhân viên $\le 100\text{ ms}$.

---

### [FR-K04] Điểm danh dự phòng bằng bàn phím số ảo PIN (Fallback Virtual PIN Pad)

#### 3.4.1. Mục tiêu & Mô tả
Cung cấp phương thức điểm danh thay thế thông qua bàn phím số ảo cảm ứng trên màn hình trạm Kiosk, cho phép nhân viên tự xác thực bằng Mã số nhân viên và Mã PIN cá nhân khi gặp các trường hợp đặc biệt không thể nhận diện khuôn mặt (chấn thương, băng bó y tế, hoặc sự cố quang học tạm thời).

#### 3.4.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K04.1` (Thông tin xác thực bắt buộc)**: Nhân viên phải nhập chính xác hai trường thông tin: Mã số nhân viên (dãy ký tự định danh) và Mã số PIN cá nhân (từ 4 đến 6 chữ số bí mật).
- **`BR-K04.2` (Ghi nhận phương thức xác thực)**: Bản ghi chấm công phát sinh từ phương thức này bắt buộc phải được đánh dấu rõ ràng là phương thức xác thực bằng mã PIN (`VERIFICATION_PIN`) để phục vụ kiểm toán và báo cáo nhân sự.
- **`BR-K04.3` (Chống dò mã bừa bãi - Brute-Force Protection)**: 
  - Nếu nhập sai mã PIN quá **5 lần liên tiếp** đối với một mã nhân viên, hệ thống tự động khóa tính năng điểm danh bằng mã PIN của tài khoản đó trong vòng **15 phút**.
  - Hiển thị đồng hồ đếm ngược thời gian mở khóa trên màn hình.

#### 3.4.3. Luồng sự kiện chính (Main Flow)
1. Nhân viên nhấn nút chức năng *"Điểm danh bằng mã PIN"* trên màn hình cảm ứng hoặc nhấn phím tắt `F2`.
2. Hộp thoại bàn phím số ảo xuất hiện trên màn hình với các phím bấm lớn, dễ chạm.
3. Nhân viên nhập Mã nhân viên và dãy mã số PIN cá nhân (mã PIN được che bằng ký tự chấm đen `●`).
4. Nhân viên nhấn nút *"Xác nhận điểm danh"*.
5. Trạm Kiosk gửi yêu cầu xác thực về dịch vụ máy chủ trung tâm.
6. Máy chủ xác thực tính hợp lệ của mã PIN và phản hồi kết quả thành công.
7. Màn hình Kiosk hiển thị lời chào chúc mừng, thông báo giờ điểm danh được ghi nhận và tự động đóng hộp thoại sau 2.5 giây.

#### 3.4.4. Luồng thay thế & Ngoại lệ (Alternative & Exception Flows)
- *A1 - Nhập sai mã PIN*: Màn hình rung cảnh báo, hiển thị thông báo lỗi: *"Mã PIN không chính xác! (Còn lại X lần thử)"*.
- *A2 - Tài khoản bị khóa do vượt quá 5 lần sai*: Màn hình thông báo: *"Tài khoản bị tạm khóa 15 phút do nhập sai quá số lần quy định. Vui lòng liên hệ bộ phận Nhân sự"*.
- *A3 - Mất kết nối mạng khi nhập PIN*: Trạm Kiosk thông báo: *"Tính năng xác thực PIN yêu cầu kết nối mạng máy chủ để bảo đảm an toàn. Vui lòng thử lại sau hoặc báo quản trị viên"*.

#### 3.4.5. Dữ liệu đầu vào & Đầu ra
- **Đầu vào**: Mã số nhân viên và mã PIN (chuỗi 4 - 6 số).
- **Đầu ra**: Lượt chấm công được ghi nhận hợp lệ với phương thức `VERIFICATION_PIN`.

#### 3.4.6. Tiêu chí chấp nhận (Acceptance Criteria)
- Bàn phím số phản hồi thao tác chạm nhạy bén dưới $50\text{ ms}$.
- Khóa tài khoản chính xác sau 5 lần nhập sai liên tiếp.

---

### [FR-K05] Chống quét trùng lặp trong thời gian Cooldown (Edge Cooldown Deduplication)

#### 3.5.1. Mục tiêu & Mô tả
Hệ thống Kiosk phải tự động loại bỏ các lượt chấm công dư thừa khi nhân viên đứng nán lại trò chuyện hoặc di chuyển chậm trước camera sau khi đã được xác nhận điểm danh thành công.

#### 3.5.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K05.1` (Cửa sổ thời gian Cooldown)**: Khoảng thời gian giãn cách tối thiểu giữa hai lượt điểm danh được tính là mới của cùng một nhân viên là **120 giây** (có thể cấu hình linh hoạt từ 30 đến 300 giây).
- **`BR-K05.2` (Hành vi khi quét lặp trong khoảng Cooldown)**:
  - Trạm Kiosk **KHÔNG** tạo thêm bản ghi chấm công mới vào cơ sở dữ liệu.
  - Trạm Kiosk **KHÔNG** gửi yêu cầu dư thừa qua đường truyền mạng.
  - Màn hình Kiosk vẫn phản hồi thân thiện: *"Bạn đã điểm danh lúc HH:mm:ss. Vui lòng di chuyển qua cửa!"*.
- **`BR-K05.3` (Dọn dẹp bộ nhớ tự động)**: Các mốc thời gian quét cũ hơn thời hạn quy định sẽ được tự động giải phóng để bảo đảm hiệu năng hoạt động liên tục.

#### 3.5.3. Luồng sự kiện chính (Main Flow)
1. Nhân viên được nhận diện thành công tại bước `FR-K03`.
2. Hệ thống đối chiếu thời điểm quét hiện tại với mốc thời gian quét thành công gần nhất của nhân viên đó.
3. Nếu khoảng cách thời gian $\ge 120\text{ giây}$ (hoặc là lượt quét đầu tiên):
   - Ghi nhận mốc thời gian quét mới.
   - Cho phép tạo bản ghi chấm công chính thức và gửi đồng bộ về hệ thống.
4. Nếu khoảng cách thời gian $< 120\text{ giây}$:
   - Bỏ qua việc tạo bản ghi mới.
   - Hiển thị thông điệp thông báo nhân viên đã điểm danh rồi để người dùng an tâm di chuyển.

#### 3.5.4. Tiêu chí chấp nhận (Acceptance Criteria)
- Loại bỏ triệt để 100% các bản ghi chấm công rác phát sinh do đứng lâu trước camera.
- Không gây nghẽn mạng hay quá tải máy chủ trong các khung giờ cao điểm có đông người qua lại.

---

### [FR-K06] Lưu trữ ngoại tuyến và tự động đồng bộ phục hồi (Offline Resilient Queue & Sync)

#### 3.6.1. Mục tiêu & Mô tả
Trạm Kiosk phải bảo đảm việc điểm danh vẫn diễn ra liên tục, bình thường ngay cả khi mất toàn bộ kết nối mạng tới máy chủ; lưu trữ an toàn mọi lượt chấm công tại chỗ và tự động gửi bù toàn bộ dữ liệu lên máy chủ ngay khi mạng được phục hồi mà không làm mất mát thông tin.

#### 3.6.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K06.1` (Bền vững dữ liệu tại chỗ)**: Cơ sở dữ liệu lưu trữ ngoại tuyến tại trạm Kiosk phải có cơ chế ghi nhật ký giao dịch an toàn (chống hỏng tệp khi mất nguồn điện đột ngột), tốc độ ghi dữ liệu tức thời $\le 5\text{ ms}$.
- **`BR-K06.2` (Bảo toàn mốc thời gian thực tế tại biên)**: Mốc thời gian của lượt chấm công được ghi nhận bắt buộc phải là **thời điểm quét thực tế tại trạm Kiosk** theo giờ chuẩn hệ thống, tuyệt đối không lấy thời điểm lúc gửi đồng bộ về máy chủ.
- **`BR-K06.3` (Đồng bộ tự động theo lô)**: Ngay khi phát hiện có mạng trở lại, hệ thống tự động gom các bản ghi chưa đồng bộ gửi theo lô (tối đa **50 bản ghi/lô**) để tối ưu hóa lưu lượng truyền dẫn.
- **`BR-K06.4` (Cam kết toàn vẹn dữ liệu)**: Cam kết chỉ số mất mát dữ liệu $\text{RPO} = 0$ — không bị mất bất kỳ bản ghi nào trong mọi tình huống sự cố mạng.

#### 3.6.3. Luồng sự kiện chính (Main Flow)
1. Nhân viên điểm danh thành công tại Kiosk.
2. Hệ thống lưu ngay thông tin lượt chấm công vào bộ lưu trữ cục bộ với trạng thái chưa đồng bộ.
3. Kiosk cố gắng gửi lượt chấm công về máy chủ qua mạng.
4. Nếu đường truyền mạng bị ngắt:
   - Kiosk tự động kích hoạt cờ trạng thái "Ngoại tuyến" (Offline).
   - Thanh trạng thái hiển thị biểu tượng mất mạng kèm số lượng bản ghi đang chờ gửi.
   - Màn hình vẫn thông báo kết quả điểm danh thành công bình thường để nhân viên an tâm vào ca.
5. Tiến trình kiểm tra kết nối chạy ngầm định kỳ mỗi 10 giây để phát hiện mạng phục hồi.
6. Khi mạng kết nối trở lại:
   - Hệ thống tự động đóng gói các bản ghi đang chờ thành từng lô 50 bản ghi gửi lên máy chủ.
   - Máy chủ xác nhận tiếp nhận thành công $\rightarrow$ Kiosk cập nhật trạng thái đã đồng bộ xong.
   - Thanh trạng thái chuyển về màu xanh "Trực tuyến" (Online), số lượng chờ gửi trở về 0.

#### 3.6.4. Luồng thay thế & Ngoại lệ (Alternative & Exception Flows)
- *A1 - Mạng chập chờn khi đang gửi dữ liệu*: Hệ thống tự động áp dụng khoảng lùi thời gian tăng dần (5s $\rightarrow$ 10s $\rightarrow$ 20s) trước khi thử lại để tránh làm cạn kiệt tài nguyên xử lý.

#### 3.6.5. Tiêu chí chấp nhận (Acceptance Criteria)
- Kiểm thử thực tế rút hoàn toàn dây mạng, thực hiện 50 lượt điểm danh, sau đó cắm lại dây mạng: Toàn bộ 50 lượt chấm công được đồng bộ đầy đủ về máy chủ trong thời gian dưới **30 giây**, mốc giờ chấm công chính xác 100%.

---

### [FR-K07] Đăng ký và nạp mẫu khuôn mặt chuẩn hóa tại trạm (Standardized Kiosk Scanner Enrollment)

#### 3.7.1. Mục tiêu & Mô tả
Cung cấp quy trình quét thu thập mẫu khuôn mặt chuẩn hóa cho nhân viên mới ngay tại trạm Kiosk dựa trên mã kích hoạt Onboarding OTP nhận từ Cổng thông tin Web, áp dụng các tiêu chí kiểm tra chất lượng hình ảnh khắt khe trước khi chấp thuận nạp mẫu.

#### 3.7.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K07.1` (Tiêu chuẩn kiểm soát chất lượng ảnh nạp mẫu - Quality Gate)**:
  Ảnh khuôn mặt chỉ được chấp thuận nạp mẫu khi thỏa mãn đồng thời 4 tiêu chí:
  1. *Thực thể sống*: Chỉ số tin cậy người thật $S_{\text{liveness}} \ge 0.70$ (người thật trực tiếp).
  2. *Độ sắc nét*: Chỉ số độ nét đạt tiêu chuẩn, tuyệt đối không bị mờ nhòe do chuyển động hoặc rung lắc.
  3. *Độ sáng khuôn mặt*: Ánh sáng trên khuôn mặt đồng đều, không bị tối đen hoặc chói lóa.
  4. *Góc nhìn trực diện*: Góc lệch nghiêng hoặc cúi ngửa không quá $\pm 10^\circ$ (nhìn thẳng tuyệt đối).
- **`BR-K07.2` (Nguyên tắc không lưu ảnh thô tại biên - Zero Raw Image Storage)**:
  Ngay sau khi trích xuất xong vector đặc trưng, ảnh chụp thô tại trạm Kiosk lập tức bị xóa bỏ hoàn toàn khỏi bộ nhớ; **tuyệt đối không lưu bất kỳ tệp ảnh nào trên ổ cứng của trạm Kiosk**, bảo đảm tuân thủ nghiêm ngặt Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15.
- **`BR-K07.3` (Mã kích hoạt dùng một lần)**: Mã OTP 6 chữ số có thời hạn hiệu lực tối đa 48 giờ và chỉ được sử dụng đúng một lần duy nhất. Sau khi đăng ký thành công, mã lập tức bị vô hiệu hóa.

#### 3.7.3. Luồng sự kiện chính (Main Flow)
1. Nhân viên nhấn nút *"Đăng ký khuôn mặt mới"* trên màn hình Kiosk hoặc nhấn phím tắt `F3`.
2. Hộp thoại đăng ký xuất hiện, yêu cầu nhân viên nhập mã kích hoạt OTP gồm 6 chữ số (hoặc đưa mã QR trước camera).
3. Trạm Kiosk gửi mã xác thực về máy chủ $\rightarrow$ Máy chủ xác nhận mã hợp lệ và phản hồi tên nhân viên.
4. Màn hình chuyển sang bước hướng dẫn căn chỉnh khuôn mặt với khung oval hỗ trợ định vị.
5. Hệ thống liên tục kiểm tra các tiêu chuẩn chất lượng (`BR-K07.1`). Khi tất cả các tiêu chí đều đạt chuẩn:
   - Hệ thống tự động đếm ngược 3 giây và lưu lại khung hình tối ưu nhất.
   - Chuyển đổi thành vector đặc trưng và gửi gói tin đăng ký về máy chủ trung tâm.
6. Máy chủ xác nhận nạp mẫu thành công, kích hoạt tài khoản nhân viên sang trạng thái hoạt động chính thức.
7. Trạm Kiosk cập nhật mẫu mới vào danh mục nội bộ, thông báo thành công và tự động đóng hộp thoại sau 3 giây.

#### 3.7.4. Luồng thay thế & Ngoại lệ (Alternative & Exception Flows)
- *A1 - Ảnh chụp chưa đạt tiêu chuẩn*: Hệ thống không thu nhận và hiển thị chỉ dẫn bằng văn bản:
  - *"Vui lòng nhìn thẳng vào camera"* (khi mặt bị nghiêng).
  - *"Khuôn mặt bị mờ, vui lòng giữ yên khuôn mặt"* (khi ảnh nhòe).
  - *"Ánh sáng chưa đủ, vui lòng đứng lại gần hơn"* (khi quá tối).
- *A2 - Mã OTP không đúng hoặc đã hết hạn*: Màn hình báo lỗi: *"Mã kích hoạt không hợp lệ hoặc đã hết hạn. Vui lòng tạo mã mới trên Cổng Web"*.

#### 3.7.5. Tiêu chí chấp nhận (Acceptance Criteria)
- Toàn bộ quá trình kiểm chuẩn chất lượng và nạp mẫu tại Kiosk hoàn tất trong thời gian dưới **5 giây**.
- Nhân viên có thể thực hiện điểm danh bình thường ngay sau khi hoàn tất đăng ký.

---

### [FR-K08] Cập nhật danh mục mẫu hai chiều và thu hồi tức thời (Bi-directional Gallery Sync & Hot-Reload)

#### 3.8.1. Mục tiêu & Mô tả
Trạm Kiosk phải tự động tải toàn bộ danh mục vector khuôn mặt của các nhân viên đang làm việc khi khởi động, đồng thời duy trì kênh thông tin thời gian thực với máy chủ để tự động nạp thêm mẫu mới hoặc thu hồi ngay lập tức quyền điểm danh khi có nhân viên nghỉ việc.

#### 3.8.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K08.1` (Nạp dữ liệu khi khởi động)**: Khi mở ứng dụng Kiosk, hệ thống tự động kết nối máy chủ để tải toàn bộ danh mục mẫu của những nhân viên đang ở trạng thái hoạt động (`ACTIVE`) và lưu vào bộ nhớ làm việc.
- **`BR-K08.2` (Nạp nóng thời gian thực - Hot-Reload)**: Khi có nhân viên mới đăng ký thành công tại bất kỳ trạm nào trong mạng lưới doanh nghiệp, trạm Kiosk này phải nhận được dữ liệu mẫu mới qua kênh đẩy thời gian thực và nạp ngay vào bộ nhớ mà không cần khởi động lại ứng dụng.
- **`BR-K08.3` (Thu hồi quyền tức thì khi thôi việc)**: Khi một nhân viên chấm dứt hợp đồng lao động (`TERMINATED`), máy chủ lập tức phát lệnh thu hồi. Trạm Kiosk xóa ngay lập tức dữ liệu mẫu của người này khỏi bộ nhớ, chấm dứt quyền điểm danh ra vào ngay tức khắc.

#### 3.8.3. Luồng sự kiện chính (Main Flow)
1. Trạm Kiosk duy trì kết nối kênh thời gian thực hai chiều với máy chủ trung tâm.
2. Khi nhận được thông báo bổ sung nhân sự mới:
   - Hệ thống nạp thêm vector đặc trưng của nhân sự mới vào danh mục so khớp.
   - Ghi nhận nhật ký cập nhật danh mục.
3. Khi nhận được thông báo thu hồi nhân sự thôi việc:
   - Hệ thống loại bỏ hoàn toàn dữ liệu mẫu của nhân viên đó khỏi bộ nhớ trạm.
   - Nếu nhân viên đó cố tình chấm công, hệ thống sẽ coi là người lạ và từ chối.

#### 3.8.4. Tiêu chí chấp nhận (Acceptance Criteria)
- Thời gian từ khi máy chủ phát lệnh cập nhật hoặc thu hồi đến khi trạm Kiosk hoàn tất thay đổi trong bộ nhớ $\le 1.0\text{ giây}$.

---

### [FR-K09] Giao diện Kiosk chuyên dụng và phản hồi trực quan không chạm (Kiosk UI/UX Experience)

#### 3.9.1. Mục tiêu & Mô tả
Cung cấp giao diện đồ họa chuyên dụng hiện đại, tối ưu hóa cho màn hình trạm Kiosk cảm ứng dạng đứng (Portrait) và hỗ trợ tự động căn chỉnh tỷ lệ (Dynamic Scaling) trên các kích thước màn hình khác nhau, kết hợp hài hòa giữa hình ảnh động và âm thanh phản hồi để tạo trải nghiệm điểm danh không chạm thoải mái, dễ chịu.

#### 3.9.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K09.1` (Hệ thống màu sắc trạng thái khung định vị)**:
  - *Màu tím thương hiệu*: Trạng thái rà soát, tìm kiếm khuôn mặt (chờ quét).
  - *Màu vàng cảnh báo*: Trạng thái nhắc nhở người dùng cần điều chỉnh lại góc mặt hoặc cự ly đứng.
  - *Màu xanh lá cây*: Trạng thái điểm danh thành công rực rỡ, rõ ràng.
  - *Màu đỏ cảnh báo*: Trạng thái từ chối giả mạo hoặc báo lỗi hệ thống.
- **`BR-K09.2` (Hệ thống âm thanh phản hồi đa trạng thái)**:
  - Điểm danh thành công: Phát âm thanh xác nhận ngắn gọn, trong trẻo.
  - Từ chối giả mạo hoặc lỗi: Phát âm thanh cảnh báo ngắt quãng.
- **`BR-K09.3` (Thanh trạng thái hệ thống)**:
  - Đồng hồ kỹ thuật số hiển thị giờ, phút, giây và ngày tháng năm, tự động cập nhật liên tục từng giây.
  - Đèn chỉ báo trạng thái kết nối mạng: Chấm tròn xanh lá (Trực tuyến) hoặc Chấm tròn cam/đỏ kèm số lượng bản ghi chờ đồng bộ (Ngoại tuyến).
- **`BR-K09.4` (Màn hình Chờ Chào mừng & Chuyển cảnh tức thì - Welcome Screen & Instant Transition)**:
  - Khi kích hoạt chế độ chờ (sau 5 - 10s vắng người), giao diện tự động ẩn khung hiển thị video camera trực tiếp và chuyển sang hiển thị Màn hình Chờ trang nhã (đồng hồ kích thước lớn, thứ ngày tháng, ca kíp làm việc hiện tại, logo công ty và lời chào trân trọng).
  - Khi phát hiện người dùng dừng chân hướng mặt về camera ($\ge 0.5\text{s}$), giao diện chuyển cảnh mượt mà trong vòng không quá $300\text{ ms}$ sang màn hình kết quả điểm danh tức thì, tổng thời gian từ khi người dùng bước tới đến khi hoàn tất điểm danh không vượt quá $1.5\text{ giây}$.

#### 3.9.3. Tiêu chí chấp nhận (Acceptance Criteria)
- Tốc độ hiển thị giao diện đạt $60\text{ FPS}$ ổn định, không giật lag.
- Giao diện tự động co giãn sắc nét trên cả màn hình ngang và màn hình dọc, không bị vỡ bố cục hay tràn chữ.
- Màn hình Chờ tự động hiển thị sau 5–10s vắng người và chuyển cảnh đánh thức mượt mà $\le 300\text{ ms}$.

---

### [FR-K10] Quản trị vận hành cục bộ và nhật ký chẩn đoán (Local Configuration & Diagnostics)

#### 3.10.1. Mục tiêu & Mô tả
Cung cấp cơ chế thiết lập cấu hình linh hoạt cho trạm Kiosk theo nhiều tầng ưu tiên và tự động duy trì nhật ký hoạt động có kiểm soát dung lượng để phục vụ công tác giám sát, bảo trì kỹ thuật tại chỗ mà không làm đầy bộ nhớ đĩa cứng.

#### 3.10.2. Quy tắc nghiệp vụ (Business Rules)
- **`BR-K10.1` (Thứ tự ưu tiên cấu hình)**:
  1. Tham số dòng lệnh khi khởi chạy ứng dụng (Ưu tiên cao nhất).
  2. Biến môi trường hệ điều hành.
  3. Tệp cấu hình cục bộ của trạm Kiosk.
  4. Giá trị mặc định tiêu chuẩn của hệ thống (Ưu tiên thấp nhất).
- **`BR-K10.2` (Xoay vòng nhật ký hoạt động)**:
  - Nhật ký hoạt động được lưu tại tệp quy định của trạm.
  - Dung lượng mỗi tệp nhật ký tối đa là **10 MB**.
  - Tự động duy trì tối đa **5 tệp lưu trữ xoay vòng**; các tệp cũ hơn sẽ tự động bị xóa, bảo đảm tổng dung lượng nhật ký không vượt quá 50 MB.
- **`BR-K10.3` (Hệ thống phím tắt thao tác nhanh)**:
  - Phím `F1`: Mở hoặc đóng cửa sổ Hướng dẫn sử dụng / Trợ giúp.
  - Phím `F2`: Mở nhanh cửa sổ Bàn phím số ảo nhập mã PIN.
  - Phím `F3`: Mở nhanh cửa sổ Đăng ký mẫu khuôn mặt mới.
  - Phím `F11`: Bật hoặc tắt chế độ hiển thị toàn màn hình (Fullscreen).
  - Phím `Esc`: Đóng nhanh các cửa sổ hộp thoại đang mở để quay về màn hình điểm danh chính.

#### 3.10.3. Tiêu chí chấp nhận (Acceptance Criteria)
- Thời gian khởi động ứng dụng trạm Kiosk $\le 3\text{ giây}$.
- Dung lượng nhật ký hoạt động trên ổ đĩa luôn được kiểm soát chặt chẽ dưới 50 MB.

---

## 4. Ràng buộc bảo mật & Tuân thủ pháp lý

Toàn bộ các yêu cầu chức năng của phân hệ Kiosk được thiết kế tuân thủ nghiêm ngặt các quy định pháp luật và tiêu chuẩn kỹ thuật:
1. **Tuân thủ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15**:
   - Áp dụng nguyên tắc **Không lưu trữ ảnh thô tại thiết bị biên (Zero Storage of Raw Images at Terminal)**: Trạm Kiosk chỉ lưu giữ vector đặc trưng sinh trắc học đã trừu tượng hóa, không thể dịch ngược lại thành khuôn mặt người.
   - Cơ chế thu hồi dữ liệu tức thì: Xóa ngay lập tức dữ liệu mẫu trong bộ nhớ trạm khi nhân sự nghỉ việc.
2. **Tiêu chuẩn chống giả mạo sinh trắc học ISO/IEC 30107-3**:
   - Ngăn chặn các hình thức tấn công bằng ảnh in 2D, video phát lại và màn hình thiết bị số với tỷ lệ chấp nhận tấn công giả mạo $\text{APCER} \le 10\%$.
3. **An toàn kết nối mạng trạm Kiosk**:
   - Mọi kết nối gửi dữ liệu về máy chủ đều phải có thông tin xác thực định danh của trạm Kiosk (`kiosk_id`) và mã bí mật nội bộ (`kiosk_secret_token`).
