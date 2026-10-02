# API SPECS — Đặc tả Giao diện & Hợp đồng Truyền thông Hệ thống

> **Mã tài liệu:** `SPEC-API-01`  
> **Cấp độ:** Cấp Hệ thống (System-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả giao diện truyền thông trung lập công nghệ (Interface Contracts) giữa các phân hệ: Trạm Điểm danh Kiosk Desktop, Máy chủ Doanh nghiệp Backend và Cổng Web Quản trị.

---

## 1. Interface Register (Sổ Đăng ký Giao diện Hệ thống)

| ID | Giao diện Truyền thông | Bên Cung cấp (Provider) | Bên Tiêu thụ (Consumer) | Mục đích Kỹ thuật & Nghiệp vụ | Giao thức Khuyến nghị |
| :--- | :--- | :---: | :---: | :--- | :---: |
| `API-SYS-001` | Giao diện Điểm danh Trực tiếp | `backend-service` | `kiosk-app` | Tiếp nhận bản ghi điểm danh đơn lẻ thời gian thực từ trạm Kiosk. | HTTPS REST (POST) |
| `API-SYS-002` | Giao diện Đồng bộ Bù Ngoại tuyến | `backend-service` | `kiosk-app` | Tiếp nhận lô dữ liệu điểm danh ngoại tuyến khi trạm Kiosk khôi phục mạng. | HTTPS REST (POST) |
| `API-SYS-003` | Giao diện Tải Danh mục Vector Mẫu | `backend-service` | `kiosk-app` | Cung cấp toàn bộ danh mục vector đặc trưng nhân sự để nạp RAM Kiosk. | HTTPS REST (GET) |
| `API-SYS-004` | Giao diện Kích hoạt OTP Đăng ký | `backend-service` | `kiosk-app` | Xác thực mã OTP 6 số để mở khóa tiến trình quét mặt tại Kiosk. | HTTPS REST (POST) |
| `API-SYS-005` | Giao diện Nạp Vector Khuôn mặt Mới | `backend-service` | `kiosk-app` | Tiếp nhận vector 512D mới kèm OTP để Backend mã hóa lưu CSDL. | HTTPS REST (POST) |
| `API-SYS-006` | Kênh Đẩy Cập nhật Danh mục Mẫu | `backend-service` | `kiosk-app` | Phát thông điệp nạp nóng vector mới hoặc xóa vector nhân sự thôi việc vào RAM. | WebSocket STOMP (Topic) |
| `API-SYS-007` | Kênh Phát sóng Điểm danh Thời gian thực | `backend-service` | `web-portal` | Đẩy sự kiện điểm danh tức thời từ Kiosk lên Live Dashboard trên Web. | WebSocket STOMP (Topic) |
| `API-SYS-008` | Giao diện Quản trị Nhân sự & Ca kíp | `backend-service` | `web-portal` | Quản lý hồ sơ nhân viên, phân ca làm việc và đổi trạng thái thôi việc. | HTTPS REST (CRUD) |
| `API-SYS-009` | Giao diện Ký Cam kết Informed Consent | `backend-service` | `web-portal` | Ghi nhận văn bản thỏa thuận xử lý dữ liệu sinh trắc học theo Luật 2025. | HTTPS REST (POST) |
| `API-SYS-010` | Giao diện Bảng công & Duyệt Giải trình | `backend-service` | `web-portal` | Truy vấn bảng chấm công, nộp và duyệt đơn giải trình đi muộn/về sớm. | HTTPS REST (GET/POST/PUT) |
| `API-SYS-011` | Giao diện Kết xuất Báo cáo Bảng công | `backend-service` | `web-portal` | Kết xuất dữ liệu bảng công ra file Excel/CSV an toàn chống Formula Injection. | HTTPS REST (GET stream) |

---

## 2. Operations & Contract Specifications (Hợp đồng Thao tác & Ràng buộc Dữ liệu)

| ID | Thao tác Nghiệp vụ | Dữ liệu Đầu vào Bắt buộc (Inputs) | Dữ liệu Trả về Kỳ vọng (Outputs) | Hành vi Xử lý Lỗi / Ngoại lệ |
| :--- | :--- | :--- | :--- | :--- |
| `API-SYS-012` | Ghi nhận Điểm danh (`punch`) | `employeeId` (int), `punchTimestamp` (ISO-8601), `verificationMethod` (FACE/PIN), `confidenceScore` (float), `kioskId` (string). | Trạng thái chấp thuận `PUNCH_ACCEPTED`, mã bản ghi `recordId`, thời gian thực `punchTime`, trạng thái công `ON_TIME / LATE`. | Trả về `COOLDOWN_REJECTED` nếu quẹt dồn trong 120s; `EMPLOYEE_NOT_FOUND` nếu không tồn tại; `SHIFT_UNASSIGNED` nếu chưa gán ca. |
| `API-SYS-013` | Đồng bộ Bù Ngoại tuyến (`sync-batch`) | Danh sách mảng tối đa 50 phần tử chứa các bản ghi điểm danh ngoại tuyến có cấu trúc giống thao tác `punch`. | Số lượng bản ghi nạp thành công `syncedCount`, danh sách mã bản ghi đã ghi nhận để Kiosk cập nhật trạng thái `is_synced = 1`. | Bỏ qua các bản ghi trùng lặp thời gian; xử lý theo giao dịch an toàn (Atomic Batch Transaction). |
| `API-SYS-014` | Xác minh OTP Đăng ký (`verify-otp`) | Chuỗi mã số `otp` (6 chữ số). | Trạng thái hợp lệ `is_valid`, thông tin nhân viên (`employeeId`, `fullName`, `empCode`). | Trả về `OTP_INVALID` nếu sai mã; `OTP_EXPIRED` nếu quá hạn 48 giờ; `OTP_ALREADY_USED` nếu đã từng sử dụng. |
| `API-SYS-015` | Nạp Vector Mới (`enroll-face`) | `otp` (chuỗi 6 số), `faceVector` (mảng 512 số thực `float32`), `kioskId` (string). | Trạng thái `ENROLL_SUCCESS`, mã định danh mẫu `templateId`. | Từ chối `INVALID_VECTOR_DIMENSION` nếu không đúng 512 chiều; từ chối nếu độ chuẩn hóa $L_2\text{ Norm} \neq 1.0 \pm 10^{-4}$. |
| `API-SYS-016` | Ký Cam kết Đồng thuận (`consent`) | `agreed` (boolean, bắt buộc true), `consentVersion` (chuỗi phiên bản chính sách). | Trạng thái `CONSENT_RECORDED`, mốc thời gian ký nhận điện tử `agreedAt`. | Tự động bắt địa chỉ IP và User-Agent từ request header; từ chối nếu `agreed == false`. |

---

## 3. Interface Constraints (Ràng buộc Giao diện Toàn cục)

* **Chuẩn Định dạng**: 100% nội dung trao đổi qua REST API sử dụng định dạng JSON mã hóa UTF-8.
* **Chuẩn Định dạng Thời gian**: Toàn bộ mốc thời gian bắt buộc tuân thủ chuẩn ISO-8601 có múi giờ cụ thể (Ví dụ: `2026-10-02T08:00:00.123+07:00`).
* **Bảo vệ và Xác thực**:
  * Giao tiếp Kiosk $\rightarrow$ Backend: Bắt buộc đính kèm header `X-Kiosk-Id` và Bearer Secret Token trong header `Authorization`.
  * Giao tiếp Web Portal $\rightarrow$ Backend: Bắt buộc đính kèm mã thông báo Bearer JWT Token được cấp phát sau khi đăng nhập.
* **Cơ chế Giới hạn Tần suất (Rate Limiting)**: Áp dụng giới hạn tối đa 60 requests/phút đối với các endpoint công khai (Login, OTP verification) để ngăn chặn tấn công dò quét brute-force.
