---
title: Kiosk API Specifications
version: 2.0
status: Approved
owner: Edge Vision Lead & Network Engineer
---

# API SPECS — Đặc tả Giao diện Truyền thông Phân hệ Kiosk

Đặc tả các giao diện lập trình ứng dụng RESTful API và kênh truyền thông thời gian thực WebSocket STOMP do máy trạm Kiosk tiêu thụ từ phân hệ Backend.

---

## 1. Consumed Interfaces Specifications (Đặc tả Giao diện Tiêu thụ)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `API-KSK-001` | Tiêu thụ giao diện `POST /api/v1/kiosk/punch`: Gửi sự kiện điểm danh trực tuyến ngay sau khi xác thực thành công. | REST | Must | `API-SYS-005`, `FR-KSK-001` | Header `X-Kiosk-Id`, timeout 3.0s, phản hồi $\le 500\text{ ms}$; khi lỗi mạng tự động chuyển ghi SQLite WAL. | Approved |
| `API-KSK-002` | Tiêu thụ giao diện `POST /api/v1/kiosk/sync-batch`: Đẩy gói lô tối đa 50 bản ghi điểm danh ngoại tuyến khi mạng phục hồi. | REST | Must | `API-SYS-006`, `FR-KSK-006` | Phản hồi $\le 2000\text{ ms}$; nhận danh sách ID đã lưu; cập nhật `is_synced = 1` trong SQLite cục bộ. | Approved |
| `API-KSK-003` | Tiêu thụ giao diện `GET /api/v1/kiosk/gallery`: Tải toàn bộ danh mục vector 512D của nhân sự `ACTIVE` khi Kiosk khởi động. | REST | Must | `API-SYS-007`, `FR-KSK-003` | Phản hồi $\le 3000\text{ ms}$; nạp đủ $N$ vector vào RAM; fallback nạp từ snapshot SQLite cục bộ nếu mất mạng. | Approved |
| `API-KSK-004` | Tiêu thụ giao diện `POST /api/v1/kiosk/verify-otp`: Xác thực mã OTP 6 số nhân viên nhập tại Kiosk để mở khóa quét mặt. | REST | Must | `API-SYS-009`, `FR-KSK-007` | Phản hồi $\le 1000\text{ ms}$; nhận thông tin nhân viên khi OTP hợp lệ; hiển thị thông báo lỗi khi OTP sai/hết hạn. | Approved |
| `API-KSK-005` | Tiêu thụ giao diện `POST /api/v1/kiosk/enroll-face`: Gửi vector đặc trưng 512D mới kèm mã OTP để lưu CSDL và kích hoạt hồ sơ. | REST | Must | `API-SYS-010`, `FR-KSK-007` | Phản hồi $\le 1500\text{ ms}$; nhận xác nhận HTTP 200; cập nhật tức thì vector mới vào Gallery RAM Kiosk. | Approved |
| `API-KSK-006` | Lắng nghe kênh STOMP Topic `/topic/kiosk-gallery`: Đón nhận thông điệp nạp nóng vector mới hoặc xóa nhân sự thôi việc. | WebSocket | Must | `API-SYS-015`, `FR-KSK-008` | Cập nhật ma trận RAM tức thời qua Atomic Swap mà không làm giật khung hình camera; tự kết nối lại khi đứt mạng. | Approved |

---

## 2. Đặc tả Tham số & Biên Dữ liệu (Interface Input/Output Specifications)

### 2.1. `API-KSK-001` — `POST /api/v1/kiosk/punch`
* **Mục đích**: Gửi giao dịch chấm công trực tuyến tức thời.
* **Payload đầu vào (Request)**:
  * `employeeId` (`int64`, bắt buộc): Mã ID nhân viên khớp từ Gallery RAM (`> 0`).
  * `punchTimestamp` (`string`, bắt buộc): Chuỗi ISO-8601 kèm múi giờ lấy từ đồng hồ hệ thống Kiosk (Ví dụ: `2026-10-03T08:29:45.120+07:00`).
  * `verificationMethod` (`string`, bắt buộc): `VERIFICATION_FACE` hoặc `VERIFICATION_PIN`.
  * `confidenceScore` (`float`, không bắt buộc): Điểm cosine ($0.0 \le score \le 1.0$), `null` nếu xác thực bằng PIN.
  * `kioskId` (`string`, bắt buộc): Khớp với `kiosk_id` trong cấu hình.
* **Payload thành công (Response 200 OK)**:
  * Trả về thông tin chấm công đã chuẩn hóa: `recordId`, `employeeCode`, `fullName`, `punchType` (`CHECK_IN`/`CHECK_OUT`), `status` (`ON_TIME`/`LATE`), `lateMinutes`, `department`.
* **Xử lý Biên & Mã Lỗi**:
  * `409 Conflict` (`COOLDOWN_ACTIVE`): Kiosk bỏ qua, không ghi offline, hiển thị thông báo đã quẹt trước đó.
