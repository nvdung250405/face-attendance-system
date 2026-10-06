---
title: Web Portal UI/UX Specifications
version: 2.0
status: Approved
owner: Product Designer & UI/UX Specialist
---

# UI/UX SPECS — Đặc tả Giao diện & Trải nghiệm Phân hệ Web Portal


## 1. Specification Schema (Đặc tả Yêu cầu Giao diện & Trải nghiệm Web)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `UI-WEB-001` | Giao diện đăng nhập và điều hướng phân quyền theo Role (`HR_MANAGER`, `EMPLOYEE`, `ADMIN`). | Auth / Routing | Must | `SRS-003`, `ARC-003` | Điều hướng chuẩn xác theo vai trò; hiển thị spinner nạp dữ liệu trên nút đăng nhập. | Approved |
| `UI-WEB-002` | Quy trình ký cam kết điện tử Informed Consent và hiển thị mã OTP 6 số kích hoạt kèm QR Code. | Consent / OTP | Must | `SRS-001`, `SRS-003` | Khóa backdrop; cuộn hết văn bản mới cho ký; tự đóng modal khi quét mặt thành công tại Kiosk. | Approved |
| `UI-WEB-003` | Bảng điều khiển giám sát chấm công trực tiếp cho HR nhận dữ liệu qua STOMP WebSocket. | Dashboard / Live | Must | `SRS-003`, `ARC-003` | Thẻ KPI tự nhảy số; hàng mới chèn lên đầu bảng có hiệu ứng đổi màu nổi bật trong 1.5s. | Approved |
| `UI-WEB-004` | Tra cứu lịch sử điểm danh đa tiêu chí và hỗ trợ kết xuất báo cáo Excel (.xlsx) / PDF. | History / Report | Should | `SRS-003` | Bộ lọc đa chiều; phân trang mượt mà; xuất file chuẩn định dạng và màu sắc. | Approved |
| `UI-WEB-005` | Bảng công và lịch chấm công cá nhân theo tháng cho nhân viên. | Employee Portal | Should | `SRS-003` | Giao diện lịch trực quan; tô màu theo trạng thái; nhấp chuột xem Drawer chi tiết ngày tức thời. | Approved |
| `UI-WEB-006` | Màn hình quản lý hồ sơ nhân sự: danh sách có lọc, form tạo/sửa, xác nhận vô hiệu hóa và hộp thoại hiển thị mật khẩu tạm một lần. | HR Management | Must | `FR-SYS-017`, `API-SYS-008` | Mật khẩu tạm hiển thị trong hộp thoại có nút sao chép và cảnh báo đóng là không xem lại được; trường trùng mã/email báo lỗi ngay tại ô nhập. | Approved |
| `UI-WEB-007` | Màn hình quản lý ca làm việc và phân ca theo khoảng ngày, có xem trước lịch phân ca theo tuần. | HR Management | Must | `FR-SYS-018` | Tạo/sửa ca và phân ca ngay trên lịch; khi chồng lấn hiển thị cảnh báo kèm khoảng trống gợi ý. | Approved |
| `UI-WEB-008` | Màn hình đổi mật khẩu bắt buộc (chặn điều hướng) và màn hình thiết lập/đặt lại mã PIN 6 số. | Auth / Security | Must | `FR-SYS-017`, `FR-SYS-022` | Không thể rời màn hình đổi mật khẩu bắt buộc bằng điều hướng; PIN nhập bằng lưới số ảo, có bước nhập lại khi thiết lập. | Approved |
| `UI-WEB-009` | Màn hình chốt kỳ công theo tháng kèm nhãn trạng thái và hộp thoại mở lại yêu cầu lý do. | HR Management | Must | `FR-SYS-024` | Kỳ đã chốt hiển thị nhãn "Đã chốt"; các nút duyệt đơn/điều chỉnh công bị vô hiệu hóa kèm tooltip giải thích. | Approved |
| `UI-WEB-010` | Màn hình rút Informed Consent (cảnh báo hệ quả, xác nhận hai bước) và màn hình yêu cầu dữ liệu cá nhân. | Compliance | Must | `FR-SYS-025` | Cảnh báo nêu rõ điểm danh chỉ còn PIN và dữ liệu sinh trắc tiêu huỷ trong 7 ngày; danh sách yêu cầu hiển thị trạng thái xử lý. | Approved |
| `UI-WEB-011` | Trung tâm thông báo trong ứng dụng: biểu tượng chuông kèm badge số chưa đọc và danh sách phân loại theo sự kiện. | Notification | Should | `FR-SYS-027` | Badge cập nhật tức thời; đánh dấu đã đọc không cần tải lại trang; thông báo liên kết tới đối tượng liên quan. | Approved |
| `UI-WEB-012` | Màn hình quản lý trạm Kiosk và màn hình tra cứu kiểm toán/tuân thủ ở chế độ chỉ đọc. | Admin / Compliance | Must | `FR-SYS-019`, `FR-SYS-020` | Secret Token hiển thị một lần trong hộp thoại và không lưu lại; trạm không ping quá 5 phút có cảnh báo; role `DPO` không thấy thao tác ghi. | Approved |

---

## 2. Hành trình Người dùng & Nhiệm vụ Trực quan (User Tasks & Journeys)

### `UI-WEB-001` — Đăng nhập & Điều hướng Phân quyền (Authentication & Role Guard)
* **Đối tượng**: Cán bộ nhân viên (`EMPLOYEE`), Quản lý Nhân sự (`HR_MANAGER`), Quản trị viên (`ADMIN`).
* **Luồng tương tác**:
  1. Người dùng truy cập URL gốc `/login`. Màn hình hiển thị form đăng nhập với nền chia đôi (Split Screen): Bên trái là đồ họa nhận diện thương hiệu FAS, bên phải là form đăng nhập.
  2. Người dùng nhập Email doanh nghiệp và Mật khẩu. Hỗ trợ nút bật/tắt hiển thị mật khẩu.
  3. Bấm nút "Đăng nhập" $\rightarrow$ Hiển thị Spinner trạng thái nạp dữ liệu trên nút.
  4. Sau khi xác thực thành công:
     * Nếu người dùng có `status === 'PENDING_CONSENT'`: Tự động chuyển hướng và kích hoạt ngay Modal Cam kết Sinh trắc (`UI-WEB-002`).
     * Nếu có Role `HR_MANAGER` hoặc `ADMIN`: Điều hướng về `/admin/dashboard`.
     * Nếu có Role `EMPLOYEE` đã kích hoạt: Điều hướng về `/employee/profile`.

---

### `UI-WEB-002` — Ký Cam kết Sinh trắc & Cấp Mã OTP Kích hoạt (Informed Consent Flow)
* **Đối tượng**: Nhân viên mới đăng nhập lần đầu hoặc chưa kích hoạt sinh trắc.
* **Mục tiêu Pháp lý**: Đảm bảo tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.
* **Luồng tương tác**:
  1. Hộp thoại Cam kết bật lên ở trung tâm màn hình, khóa hoàn toàn nền sau (Backdrop Lock).
  2. Khung văn bản điều khoản pháp lý có thanh cuộn riêng: Quy định mục đích thu thập mẫu khuôn mặt, thời hạn lưu trữ vector đặc trưng và quyền yêu cầu hủy bỏ.
  3. **Ràng buộc Tương tác**: Nút "Tôi đồng ý và Ký cam kết" bị vô hiệu hóa (`disabled`) cho đến khi người dùng cuộn chuột đọc hết $100\%$ chiều dài văn bản.
  4. Người dùng bấm "Tôi đồng ý và Ký cam kết" $\rightarrow$ Web gọi `POST /api/v1/employee/consent`.
  5. Modal chuyển sang bước hiển thị thông tin kích hoạt:
     * Mã OTP 6 chữ số hiển thị cỡ lớn (Font $48\text{ px}$, Bold), kèm nút bấm "Sao chép mã".
     * Mã QR Code ($200 \times 200\text{ px}$) chứa dữ liệu kích hoạt nhanh.
     * Hướng dẫn trực quan: "Vui lòng đến trạm Kiosk gần nhất tại sảnh văn phòng để hoàn tất quét mặt".
  6. **Kênh Đồng bộ Tự động**: Web ngầm đăng ký STOMP topic `/topic/enrollment/{otp}`. Khi nhân viên vừa hoàn tất quét mặt tại Kiosk, Modal trên Web tự động phát hiệu ứng pháo hoa chúc mừng (Confetti) và chuyển sang trạng thái tài khoản `ACTIVE`.

---

### `UI-WEB-003` — HR Giám sát Chấm công Trực tiếp (Live Monitoring Dashboard)
* **Đối tượng**: Quản lý Nhân sự (HR).
* **Luồng tương tác**:
  1. Trang Dashboard tải hàng 4 Thẻ chỉ số tổng quan (KPI Cards): Tổng quân số, Đã chấm công, Đi muộn, Chưa đến.
  2. Bảng Live Table hiển thị danh sách các lượt chấm công trong ngày.
  3. Khi có lượt quẹt thành công tại trạm Kiosk:
     * Dòng mới tự động chèn lên đỉnh bảng với hiệu ứng đổi màu nổi bật (Green Highlight Flash) trong $1.5\text{ s}$.
     * Bộ đếm trên các thẻ KPI tự động nhảy số theo thời gian thực mà không cần tải lại trang.
     * Thanh trạng thái hiển thị chấm tròn xanh nhấp nháy: "Đang kết nối trực tiếp với 2 trạm Kiosk".

---

### `UI-WEB-004` — Tra cứu & Xuất Báo cáo Điểm danh (History & Export)
* **Đối tượng**: Quản lý Nhân sự.
* **Luồng tương tác**:
  1. Thanh công cụ lọc đa chiều: Bộ chọn khoảng ngày (Date Range Picker), Bộ chọn Phòng ban (Dropdown), Bộ chọn Trạng thái (`Tất cả`, `Đúng giờ`, `Đi muộn`), và Ô tìm kiếm theo tên/mã nhân viên.
  2. Bảng kết quả hiển thị phân trang (Pagination: 20, 50, 100 bản ghi/trang).
  3. Nút bấm tác vụ:
     * "Xuất Excel" (.xlsx): Tải xuống bảng tính đầy đủ cột dữ liệu và định dạng chuẩn màu sắc.
     * "In Báo cáo" (.pdf): Sinh bản in xem trước sẵn sàng xuất ra máy in.

---

### `UI-WEB-005` — Bảng Công Cá nhân Nhân viên (Employee Attendance Calendar)
* **Đối tượng**: Nhân viên theo dõi công chuẩn của chính mình.
* **Luồng tương tác**:
  1. Nhân viên xem tổng kết tháng: Số ngày làm việc thực tế, Số ngày đúng giờ, Số lần đi muộn.
  2. Chế độ xem Lịch tháng (Calendar View): Mỗi ô ngày được tô màu theo kết quả (Xanh lá: Đúng giờ, Vàng: Đi muộn, Xám: Nghỉ phép / Cuối tuần).
  3. Nhấp chuột vào một ngày cụ thể: Hiển thị Drawer chi tiết mốc giờ Check-in, Check-out, trạm Kiosk đã quẹt và số giờ làm việc trong ngày.

---

## 2. Đặc tả Phản hồi Trực quan & Trạng thái Hệ thống (Visual Feedback & States)

| Trạng thái | Yêu cầu Kỹ thuật Trực quan | Trải nghiệm Người dùng |
| :--- | :--- | :--- |
| **Đang tải (Loading)** | Áp dụng khung xương lướt sáng (Skeleton Shimmer) trên toàn bộ thẻ KPI và các hàng của bảng. | Tránh hiện tượng giật layout (Layout Shift) khi API đang phản hồi. |
| **Thành công (Toast)** | Toast thông báo nền xanh lá đậm, bo góc $8\text{ px}$, tự động biến mất sau $3.0\text{ s}$ ở góc trên bên phải màn hình. | Xác nhận hoàn tất tác vụ (Lưu cam kết, Xuất báo cáo, v.v.). |
| **Báo lỗi (Error)** | Hộp thoại cảnh báo hoặc Toast đỏ với thông điệp rõ ràng theo chuẩn RFC 7807 `title` & `detail`. | Chỉ rõ nguyên nhân lỗi và hành động gợi ý khắc phục. |
| **Rỗng (Empty State)** | Hình minh họa đồ họa vector nhẹ nhàng kèm dòng chữ "Không tìm thấy dữ liệu phù hợp với bộ lọc". | Cung cấp nút "Đặt lại bộ lọc" để người dùng thao tác nhanh. |
| **Mất kết nối STOMP** | Thanh cảnh báo màu hổ phách ở đỉnh Dashboard: "Mất kết nối thời gian thực - Hệ thống đang tự động thử lại...". | Thông báo trung thực về trạng thái kết nối mạng cho HR. |
