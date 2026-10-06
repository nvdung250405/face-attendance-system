---
title: Đặc tả Yêu cầu Dữ liệu Hệ thống (Data Specs)
version: 1.0
status: Approved
owner: Data Architect
---

# DATA SPECS — Đặc tả Yêu cầu Dữ liệu Hệ thống

Đặc tả các thực thể dữ liệu nghiệp vụ (`DATA-SYS-`), quy tắc toàn vẹn dữ liệu và chính sách bảo vệ vòng đời dữ liệu sinh trắc học theo Luật 2025 trên toàn hệ thống.

---

## 1. Data Entities (Thực thể Dữ liệu Nghiệp vụ)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATA-SYS-001` | Quản lý thực thể Nhân viên (`Employee`) gồm định danh `emp_code`, họ tên, email, phòng ban, vai trò, trạng thái, hash mã PIN và hạn khóa PIN. | Entity | Must | `PD-001`, `INF-001` | CSDL lưu trữ đầy đủ các trường, `emp_code` và `email` không trùng lặp, nhập liệu từ Web Portal. | Approved |
| `DATA-SYS-002` | Quản lý thực thể Ca làm việc (`Shift`) gồm mã ca, tên ca, giờ bắt đầu, giờ kết thúc, thời gian ân hạn đi muộn (15 phút) và cờ kích hoạt. | Entity | Must | `PD-001`, `INF-002` | Hỗ trợ ca làm việc cố định và ca gãy, cấu hình thời gian ân hạn linh hoạt từ HR Web Portal. | Approved |
| `DATA-SYS-003` | Quản lý thực thể Phân ca (`EmployeeShift`) ánh xạ nhân viên với ca làm việc cụ thể theo khoảng thời gian hiệu lực `effective_from` đến `effective_to`. | Entity | Must | `PD-001`, `INF-002` | Không cho phép phân trùng ca cùng thời điểm cho 1 nhân viên; tự động áp dụng ca khi điểm danh. | Approved |
| `DATA-SYS-004` | Quản lý thực thể Lượt điểm danh (`AttendanceRecord`) gồm mã nhân viên, ngày điểm danh, giờ bấm, loại bấm (IN/OUT), phương thức xác thực, trạng thái và cờ sync offline. | Entity | Must | `PD-001`, `PD-002`, `INF-003` | Ghi nhận chính xác nguồn điểm danh (Kiosk khuôn mặt / PIN), tự động tính số phút đi muộn/về sớm. | Approved |
| `DATA-SYS-005` | Quản lý thực thể Mẫu sinh trắc học (`BiometricTemplate`) gồm vector đặc trưng 512D đã mã hóa AES-256-GCM, IV, Auth Tag, phiên bản model và trạng thái kích hoạt. | Entity | Must | `PD-005`, `PD-006`, `INF-004` | Vector mã hóa lưu dạng BYTEA, mỗi bản ghi kèm IV 12 bytes và Auth Tag 16 bytes riêng biệt, không lưu ảnh gốc. | Approved |
| `DATA-SYS-006` | Quản lý thực thể Mã kích hoạt OTP (`EnrollmentOtp`) gồm mã nhân viên, chuỗi băm OTP (HMAC-SHA-256 kèm pepper), thời điểm hết hạn (48h) và cờ đánh dấu đã sử dụng. | Entity | Must | `PD-003`, `INF-008` | Mỗi mã chỉ kích hoạt 1 lần duy nhất; tự động hết hiệu lực sau đúng 48 giờ kể từ lúc sinh; tra cứu được theo index mã băm. | Approved |
| `DATA-SYS-007` | Quản lý thực thể Nhật ký cam kết (`ConsentAuditLog`) lưu vết pháp lý văn bản thỏa thuận Informed Consent điện tử (phiên bản, thời điểm ký, IP, User Agent). | Entity | Must | `PD-005`, `INF-009` | Lưu trữ bất biến phục vụ kiểm toán tuân thủ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15. | Approved |
| `DATA-SYS-008` | Quản lý thực thể Đơn giải trình công (`ExcuseRequest`) gồm mã nhân viên, ngày điểm danh, lý do, đường dẫn minh chứng, trạng thái duyệt và phản hồi của HR. | Entity | Must | `PD-004`, `INF-011` | Cập nhật luồng PENDING -> APPROVED/REJECTED; tự động điều chỉnh bản ghi công khi được duyệt. | Approved |
| `DATA-SYS-016` | Quản lý trạng thái vòng đời thông tin xác thực của tài khoản nhân sự (`CredentialState`): cờ buộc đổi mật khẩu ở lần đăng nhập đầu tiên, mật khẩu băm một chiều, mã PIN dự phòng băm một chiều và mốc khóa PIN sau 5 lần nhập sai. | Entity | Must | `SRS-005`, `FR-SYS-017`, `DATA-SYS-012` | Cờ buộc đổi mật khẩu được bật khi HR khởi tạo tài khoản và tắt sau khi đổi mật khẩu thành công; `password_hash` và `pin_hash` không bao giờ lưu văn bản rõ; `pin_locked_until` được đặt bằng thời điểm hiện tại cộng 15 phút sau lần nhập sai thứ 5 liên tiếp. | Approved |

---

## 2. Data Rules & Validation (Quy tắc Dữ liệu & Tính Toàn vẹn)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATA-SYS-009` | Duy nhất định danh nhân sự: trường `emp_code` và `email` bắt buộc phải là duy nhất trên toàn hệ thống (`UNIQUE, NOT NULL`). | Constraint | Must | `PD-001`, `INF-001` | Báo lỗi vi phạm ràng buộc toàn vẹn khi tạo mới hoặc cập nhật trùng lặp mã nhân viên hoặc email. | Approved |
| `DATA-SYS-010` | Chuẩn hóa Vector sinh trắc học: mảng đặc trưng khuôn mặt phải có đúng 512 phần tử float32 và đạt chuẩn độ dài hình học $L_2\text{ Norm} = 1.0 \pm 10^{-4}$. | Constraint | Must | `PD-006`, `INF-004` | Từ chối nạp mẫu khuôn mặt vào hệ thống nếu sai kích thước 512D hoặc chưa chuẩn hóa độ dài hình học. | Approved |
| `DATA-SYS-011` | Hiệu lực mã kích hoạt OTP: mã OTP chỉ sử dụng đúng 1 lần (`is_used = true`) và tự động hết hiệu lực sau đúng 48 giờ kể từ khi sinh mã. | Constraint | Must | `PD-003`, `INF-008` | Từ chối kích hoạt và trả về mã lỗi thích hợp khi OTP đã dùng hoặc quá hạn 48 giờ. | Approved |
| `DATA-SYS-012` | Bảo vệ mã PIN chống Brute-force: khóa tài khoản điểm danh bằng PIN 15 phút nếu nhập sai mã PIN quá 5 lần liên tiếp. | Constraint | Must | `PD-008`, `INF-012` | Bàn phím Kiosk từ chối thao tác nhập PIN và hiển thị thời gian đếm lùi mở khóa cho nhân viên. | Approved |
| `DATA-SYS-017` | Không chồng lấn lịch phân ca: với mỗi nhân viên, các khoảng hiệu lực `[effective_from, effective_to]` trong `employee_shifts` không được giao nhau (`effective_to` NULL nghĩa là vô hạn). | Constraint | Must | `DATA-SYS-003`, `FR-SYS-018` | Mọi thao tác tạo/sửa phân ca kiểm tra giao khoảng trước khi ghi; vi phạm trả HTTP 409 và không ghi bản ghi; phân ca liền kề (`effective_to` = `effective_from` kế tiếp) được chấp nhận. | Approved |

---

## 3. Data Lifecycle & Protection (Vòng đời & Bảo vệ Dữ liệu)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATA-SYS-013` | Tiêu hủy dữ liệu sinh trắc học sau 20 ngày: tự động xóa vĩnh viễn (Hard Delete) toàn bộ bản ghi mẫu khuôn mặt khi nhân viên nghỉ việc quá 20 ngày. | Retention | Must | `PD-005`, `INF-009` | Cronjob xóa sạch bản ghi `biometric_templates` của nhân viên `TERMINATED` có `terminated_date <= CurrentDate - 20 days` và ghi audit log. | Approved |
| `DATA-SYS-014` | Lưu trữ lịch sử điểm danh tối thiểu 3 năm: dữ liệu chấm công và nhật ký kiểm toán không bị xóa tự động, phục vụ thanh tra lao động. | Retention | Must | `PD-001`, `INF-003` | CSDL trung tâm bảo lưu toàn vẹn dữ liệu `attendance_records` và `audit_logs` tối thiểu 3 năm theo Luật Lao động. | Approved |
| `DATA-SYS-015` | Mã hóa đối xứng AES-256-GCM dữ liệu tĩnh: vector đặc trưng sinh trắc học bắt buộc mã hóa AES-256-GCM trước khi lưu trữ vào CSDL PostgreSQL. | Privacy | Must | `PD-005`, `INF-004` | Vector lưu dưới dạng nhị phân mã hóa kèm IV 96-bit ngẫu nhiên và khóa Master tách biệt trong biến môi trường. | Approved |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Nguồn Sự thật cho Lược đồ CSDL (Decision 7)**: Mã kịch bản di chuyển dữ liệu Flyway (`db/migration/V*.sql`) trong phân hệ Backend là nguồn sự thật duy nhất (Single Source of Truth) cho cấu trúc bảng, tên cột và kiểu dữ liệu PostgreSQL. Mọi tài liệu thiết kế dữ liệu (`data-design.md`) phải ánh xạ chính xác theo lược đồ này.
* **Thuật toán Băm OTP Onboarding (Decision 2)**: Sử dụng HMAC-SHA-256 kết hợp server pepper nạp từ biến môi trường. Phương án này bảo đảm tính một chiều, an toàn trước dò vét bảng cầu vồng (rainbow tables) và cho phép đánh chỉ mục B-tree trên cột `otp_hash` để tra cứu $O(1)$ khi trạm Kiosk gửi OTP lên xác thực. Điều kiện resolve: quy định chi tiết tại `service-docs/backend-service/data/data-design.md`.
