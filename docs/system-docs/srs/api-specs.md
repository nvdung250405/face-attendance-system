---
title: Đặc tả Giao diện & Hợp đồng Truyền thông Hệ thống (API)
version: 1.0
status: Approved
owner: Integration Architect
---

# API SPECS — Đặc tả Giao diện & Hợp đồng Truyền thông Hệ thống

Đặc tả giao diện truyền thông trung lập công nghệ (Interface Contracts) giữa các phân hệ: Trạm Điểm danh Kiosk Desktop, Máy chủ Doanh nghiệp Backend và Cổng Web Quản trị.

---

## 1. Interfaces (Danh mục Giao diện Hệ thống)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `API-SYS-001` | Phân hệ Backend phải cung cấp giao diện tiếp nhận bản ghi điểm danh đơn lẻ thời gian thực từ trạm Kiosk. | Interfaces | Must | `PD-001`, `FR-SYS-001` | Tiếp nhận và phản hồi kết quả xác thực chấm công trong vòng $\le 100\text{ ms}$. | Approved |
| `API-SYS-002` | Phân hệ Backend phải cung cấp giao diện tiếp nhận gói lô dữ liệu điểm danh ngoại tuyến khi trạm Kiosk khôi phục kết nối mạng. | Interfaces | Must | `PD-004`, `FR-SYS-006` | Tiếp nhận gói lô tối đa 50 bản ghi/lần, xử lý theo giao dịch an toàn (atomic batch transaction). | Approved |
| `API-SYS-003` | Phân hệ Backend phải cung cấp giao diện truy vấn toàn bộ danh mục vector đặc trưng khuôn mặt mẫu nhân sự để phục vụ nạp RAM Kiosk. | Interfaces | Must | `PD-002`, `FR-SYS-003` | Trả về danh sách vector 512D chuẩn hóa kèm định danh nhân viên và số phiên bản gallery. | Approved |
| `API-SYS-004` | Phân hệ Backend phải cung cấp giao diện xác thực mã kích hoạt Onboarding OTP 6 số để mở khóa tiến trình quét mặt tại Kiosk. | Interfaces | Must | `PD-007`, `FR-SYS-008` | Xác thực đúng mã băm OTP còn hiệu lực 48 giờ; trả về thông tin nhân viên để mở camera. | Approved |
| `API-SYS-005` | Phân hệ Backend phải cung cấp giao diện tiếp nhận vector đặc trưng 512D mới kèm OTP để mã hóa lưu CSDL và kích hoạt nhân sự. | Interfaces | Must | `PD-005`, `FR-SYS-009` | Tiếp nhận vector 512D, kiểm chuẩn L2 Norm = 1.0, mã hóa AES-256-GCM và kích hoạt hồ sơ. | Approved |
| `API-SYS-006` | Phân hệ Backend phải cung cấp kênh đẩy thông điệp hai chiều để đồng bộ cập nhật danh mục vector mẫu tới mạng lưới các trạm Kiosk. | Interfaces | Must | `PD-006`, `FR-SYS-014` | Phát thông báo nạp nóng vector mới hoặc xóa vector nhân sự thôi việc vào RAM tức thời. | Approved |
| `API-SYS-007` | Phân hệ Backend phải cung cấp kênh phát sóng sự kiện điểm danh thời gian thực tức thì lên Cổng Web Quản trị. | Interfaces | Must | `PD-006`, `FR-SYS-013` | Đẩy sự kiện JSON ngay khi giao dịch điểm danh được chấp nhận; độ trễ truyền phát $\le 200\text{ ms}$. | Approved |
| `API-SYS-008` | Phân hệ Backend phải cung cấp giao diện quản trị danh mục hồ sơ nhân sự, phòng ban, ca kíp và trạng thái công tác cho HR. | Interfaces | Must | `ACT-002`, `FR-SYS-012` | Hỗ trợ phân trang, tìm kiếm đa tiêu chí, tạo mới và cập nhật trạng thái làm việc. | Approved |
| `API-SYS-009` | Phân hệ Backend phải cung cấp giao diện tiếp nhận chữ ký điện tử văn bản thỏa thuận Informed Consent từ nhân viên. | Interfaces | Must | `PD-005`, `FR-SYS-007` | Ghi nhận sự đồng thuận tự nguyện, lưu vết mốc thời gian, IP và User-Agent theo Luật 2025. | Approved |
| `API-SYS-010` | Phân hệ Backend phải cung cấp giao diện truy vấn bảng chấm công, nộp đơn và phê duyệt/từ chối đơn giải trình công. | Interfaces | Must | `ACT-002`, `FR-SYS-016` | Cho phép nhân viên nộp đơn kèm lý do; HR xem xét và duyệt thay đổi dữ liệu công. | Approved |
| `API-SYS-011` | Phân hệ Backend phải cung cấp giao diện kết xuất báo cáo dữ liệu bảng công định dạng file an toàn chống Formula Injection. | Interfaces | Must | `ACT-002`, `SRS-007` | Kết xuất file bảng tính .xlsx đã vô hiệu hóa ký tự macro công thức nguy hiểm. | Approved |

---

## 2. Operations & Contracts (Hợp đồng Thao tác & Ràng buộc Dữ liệu)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `API-SYS-012` | Thao tác ghi nhận điểm danh (`punch`) phải tiếp nhận dữ liệu định danh, mốc thời gian, phương thức và trả về trạng thái chấp thuận cùng giờ tính công. | Operations & Contracts | Must | `API-SYS-001` | Đầu vào: employeeId, timestamp, method (FACE/PIN), score, kioskId. Trả về: PUNCH_ACCEPTED, recordId, punchTime, status. Trả về lỗi nếu vi phạm Cooldown 120s hoặc chưa gán ca. | Approved |
| `API-SYS-013` | Thao tác đồng bộ bù ngoại tuyến (`sync-batch`) phải tiếp nhận mảng danh sách tối đa 50 bản ghi ngoại tuyến và xác nhận các bản ghi đã nạp thành công. | Operations & Contracts | Must | `API-SYS-002` | Xử lý nguyên khối (atomic batch); bỏ qua trùng lặp mốc thời gian; trả về số lượng nạp thành công để Kiosk đánh dấu is_synced = 1. | Approved |
| `API-SYS-014` | Thao tác xác minh mã kích hoạt OTP (`verify-otp`) phải thẩm định mã 6 số và trả về trạng thái hợp lệ cùng thông tin nhân viên. | Operations & Contracts | Must | `API-SYS-004` | Kiểm tra đúng mã hash SHA-256; từ chối nếu mã sai, đã sử dụng hoặc hết hạn 48 giờ. | Approved |
| `API-SYS-015` | Thao tác nạp vector mới (`enroll-face`) phải tiếp nhận mã OTP và mảng số thực 512 chiều, thực hiện lưu trữ bảo mật và kích hoạt tài khoản. | Operations & Contracts | Must | `API-SYS-005` | Từ chối nếu vector sai kích thước 512D hoặc độ dài L2 Norm sai lệch $> 10^{-4}$; trả về templateId sau khi lưu CSDL thành công. | Approved |
| `API-SYS-016` | Thao tác ký cam kết đồng thuận (`consent`) phải ghi nhận sự đồng ý hợp pháp của nhân viên và tự động sinh mã OTP 48 giờ. | Operations & Contracts | Must | `API-SYS-009` | Yêu cầu trường agreed = true; tự động bóc tách IP, User-Agent từ request; sinh mã OTP 6 số ngẫu nhiên. | Approved |

---

## 3. Interface Constraints (Ràng buộc Giao diện Toàn cục)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `API-SYS-017` | Toàn bộ giao diện trao đổi dữ liệu phải sử dụng định dạng tiêu chuẩn JSON được mã hóa ký tự UTF-8. | Interface Constraints | Must | `PD-001` | 100% request và response body là JSON hợp lệ; Content-Type: application/json; charset=UTF-8. | Approved |
| `API-SYS-018` | Toàn bộ các trường mốc thời gian trao đổi qua giao diện phải tuân thủ chuẩn ISO-8601 kèm múi giờ rõ ràng. | Interface Constraints | Must | `SRS-008` | Định dạng chuỗi: `YYYY-MM-DDTHH:mm:ss.sss+07:00`; không dùng timestamp số nguyên thiếu ngữ cảnh múi giờ. | Approved |
| `API-SYS-019` | Mọi giao diện truyền thông phải áp dụng cơ chế xác thực danh tính bắt buộc theo vai trò và kênh kết nối. | Interface Constraints | Must | `SRS-002`, `SRS-006` | Trạm Kiosk sử dụng Secret Token và X-Kiosk-Id; Cổng Web sử dụng Bearer JWT Token thời hạn $\le 8\text{ giờ}$. | Approved |
| `API-SYS-020` | Các giao diện tiếp nhận dữ liệu công khai phải áp dụng cơ chế giới hạn tần suất (Rate Limiting) để chống tấn công brute-force. | Interface Constraints | Must | `SRS-005` | Giới hạn tối đa 60 requests/phút trên mỗi địa chỉ IP đối với các thao tác đăng nhập và xác minh OTP. | Approved |
