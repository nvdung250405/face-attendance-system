---
title: Web Portal FR/NFR Specifications
version: 1.0
status: Approved
owner: Web Lead & Requirements Analyst
---

# FR/NFR SPECS — Đặc tả Yêu cầu Chức năng & Phi chức năng Phân hệ Web Portal


## 1. Functional Requirements (Yêu cầu Chức năng Web Portal)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `FR-WEB-001` | Cung cấp giao diện đăng nhập bảo mật hỗ trợ lưu trữ token tự động và chuyển hướng theo vai trò (HR vs Nhân viên). | Auth / Routing | Must | `FR-SYS-007` | Đăng nhập phân quyền chính xác; lưu Access Token trong bộ nhớ và tự gia hạn. | Approved |
| `FR-WEB-002` | Cung cấp luồng ký cam kết Informed Consent điện tử và hiển thị mã kích hoạt OTP 6 số kèm mã QR Code cho nhân viên. | Enrollment / Privacy| Must | `FR-SYS-008` | Hiển thị đầy đủ điều khoản bảo vệ dữ liệu sinh trắc học; sinh OTP 48h sau khi ký. | Approved |
| `FR-WEB-003` | Cung cấp bảng điều khiển theo dõi chấm công thời gian thực cho HR nhận dữ liệu đẩy từ WebSocket STOMP. | Dashboard / Live | Must | `FR-SYS-014` | Cập nhật dòng mới tức thì khi có nhân viên quẹt thẻ tại Kiosk mà không cần F5 tải lại. | Approved |
| `FR-WEB-004` | Cho phép nhân sự tra cứu bảng chấm công cá nhân, xem chi tiết giờ vào/ra và số phút đi trễ theo tháng. | Employee Portal | Must | `FR-SYS-010` | Hiển thị lịch biểu trực quan; phân biệt ngày đúng giờ, đi muộn, nghỉ phép bằng màu sắc. | Approved |
| `FR-WEB-005` | Cung cấp công cụ quản lý hồ sơ nhân viên, trạng thái kích hoạt khuôn mặt và phân ca làm việc cho HR. | HR Management | Must | `FR-SYS-010` | Thêm, sửa, vô hiệu hóa nhân sự; xem trạng thái kích hoạt khuôn mặt (`ACTIVE` / `PENDING`). | Approved |
| `FR-WEB-006` | Cho phép HR kết xuất báo cáo tổng hợp chấm công toàn công ty ra định dạng tệp Excel (.xlsx) và PDF. | Export / Report | Should | `FR-SYS-010` | Tải xuống file hoàn chỉnh trong vòng $\le 3\text{ giây}$ cho 1,000 nhân viên. | Approved |
| `FR-WEB-007` | Cung cấp màn hình quản lý vòng đời hồ sơ nhân sự: tạo hồ sơ kèm mật khẩu tạm hiển thị một lần, cập nhật hồ sơ, vô hiệu hóa nhân sự và cấp lại mật khẩu tạm khi nhân viên quên. | HR Management | Must | `FR-SYS-017`, `FR-SYS-022`, `API-SYS-008` | Mật khẩu tạm hiển thị đúng một lần kèm nút sao chép và cảnh báo không xem lại được; sửa hồ sơ và vô hiệu hóa yêu cầu xác nhận hai bước; cấp lại mật khẩu tạm thông báo rõ phiên cũ đã bị thu hồi. | Approved |
| `FR-WEB-008` | Cung cấp màn hình quản lý danh mục ca làm việc và phân ca cho nhân sự theo khoảng ngày hiệu lực. | HR Management | Must | `FR-SYS-018`, `API-SYS-024`, `API-SYS-025` | Tạo/sửa/vô hiệu hóa ca; phân ca theo khoảng ngày; khi chồng lấn hiển thị lỗi 409 kèm khoảng trống gần nhất gợi ý cho HR. | Approved |
| `FR-WEB-009` | Cung cấp luồng đổi mật khẩu bắt buộc ở lần đăng nhập đầu tiên và luồng thiết lập/đặt lại mã PIN dự phòng. | Auth / Security | Must | `FR-SYS-017`, `FR-SYS-022` | Khi Backend trả HTTP 403 `PASSWORD_CHANGE_REQUIRED`, toàn bộ điều hướng bị chặn và người dùng được đưa thẳng tới màn hình đổi mật khẩu; thiết lập PIN yêu cầu nhập lại; đặt lại PIN yêu cầu mật khẩu hiện tại. | Approved |
| `FR-WEB-010` | Cung cấp màn hình chốt kỳ công theo tháng và phản ánh trạng thái khoá điều chỉnh trên toàn bộ giao diện nghiệp vụ. | HR Management | Must | `FR-SYS-024`, `API-SYS-031` | Chốt kỳ yêu cầu xác nhận; kỳ đã chốt hiển thị nhãn "Đã chốt" và vô hiệu hóa nút duyệt đơn/điều chỉnh công; ADMIN mở lại bắt buộc nhập lý do. | Approved |
| `FR-WEB-011` | Cung cấp luồng rút lại Informed Consent và gửi, theo dõi yêu cầu về dữ liệu cá nhân. | Compliance | Must | `FR-SYS-025`, `API-SYS-032` | Trước khi rút hiển thị cảnh báo hệ quả (điểm danh chỉ còn PIN, dữ liệu sinh trắc tiêu huỷ trong 7 ngày) và yêu cầu xác nhận hai bước; yêu cầu truy cập/chỉnh sửa dữ liệu cá nhân hiển thị được trạng thái xử lý. | Approved |
| `FR-WEB-012` | Cung cấp luồng đăng xuất thu hồi refresh token và xử lý phiên hết hạn trên toàn bộ tab. | Auth / Security | Must | `FR-SYS-023`, `API-SYS-030` | Đăng xuất gọi API thu hồi token trước khi xoá storage và đồng bộ sang các tab khác; khi refresh token thất bại tự chuyển về trang đăng nhập kèm thông báo lý do. | Approved |
| `FR-WEB-013` | Cung cấp trung tâm thông báo trong ứng dụng theo các sự kiện vòng đời. | Notification | Should | `FR-SYS-027`, `API-SYS-034` | Biểu tượng chuông hiển thị số chưa đọc; danh sách phân loại theo sự kiện (tài khoản được tạo, phiên bị thu hồi, PIN bị khoá, đơn được xử lý, Consent bị rút, kỳ công đã chốt); đánh dấu đã đọc tức thời; không có kênh email/SMS. | Approved |
| `FR-WEB-014` | Cung cấp màn hình quản lý trạm Kiosk và màn hình tra cứu kiểm toán/tuân thủ ở chế độ chỉ đọc cho ADMIN và DPO. | Admin / Compliance | Must | `FR-SYS-019`, `FR-SYS-020`, `API-SYS-026`, `API-SYS-028` | ADMIN đăng ký trạm và nhận Secret Token hiển thị một lần; xem `last_ping_at` kèm cảnh báo khi trạm không ping quá 5 phút; ADMIN tra cứu được audit log; role `DPO` chỉ thấy màn hình tuân thủ và không có thao tác ghi. | Approved |

---

## 2. Non-functional Requirements (Yêu cầu Phi chức năng Web Portal)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-WEB-001` | Thời gian tải trang ban đầu (First Contentful Paint) đạt $\le 1.5\text{ giây}$ trên đường truyền băng thông tiêu chuẩn. | Performance | Must | `NFR-SYS-001` | Áp dụng kỹ thuật tách mã (Code Splitting), lazy loading cho các trang quản trị. | Approved |
| `NFR-WEB-002` | Giao diện tương thích hoàn hảo (Responsive Design) trên mọi kích thước màn hình máy tính để bàn và máy tính bảng. | Usability | Must | `NFR-SYS-003` | Hiển thị mượt mà từ độ phân giải $1024\times 768\text{ px}$ đến $4\text{K}$. | Approved |
| `NFR-WEB-003` | Tự động kết nối lại WebSocket STOMP với chiến lược Exponential Backoff khi bị ngắt kết nối mạng. | Reliability | Must | `NFR-SYS-006` | Thử kết nối lại tự động; hiển thị thông báo trạng thái mạng trực quan cho người dùng. | Approved |
| `NFR-WEB-004` | Bảo mật tuyệt đối phiên làm việc, chống tấn công XSS và không lưu trữ thông tin nhạy cảm trong LocalStorage. | Security | Must | `NFR-SYS-007` | Tuân thủ chính sách Content Security Policy (CSP); xóa sạch token khi đăng xuất. | Approved |
