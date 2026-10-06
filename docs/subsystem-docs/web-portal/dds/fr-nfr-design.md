---
title: Web Portal FR/NFR Detailed Design
version: 1.0
status: Approved
owner: Web Lead & Frontend Architect
---

# FR/NFR DESIGN — Thiết kế Kỹ thuật Phân hệ Web Portal


## 1. Solution Components & Architecture (Thành phần Kỹ thuật Web Portal)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-WEB-001` | AuthSessionManager | Quản lý trạng thái xác thực qua Zustand Auth Store, bộ điều hướng React Router phân luồng theo Role và lưu trữ an toàn. | `STK-016` | `FR-WEB-001` | `DD-SYS-001` | Accepted |
| `SOL-WEB-002` | ConsentModule | Hiển thị điều khoản pháp lý, xử lý chữ ký điện tử, gọi API sinh OTP và lắng nghe WebSocket đóng Modal. | `STK-016`, `STK-017` | `FR-WEB-002` | `DD-SYS-003` | Accepted |
| `SOL-WEB-003` | StompEventListener | Tích hợp thư viện `@stomp/stompjs` kết nối WebSocket, đăng ký topic `/topic/live-attendance` và `/topic/enrollment/{otp}`. | `STK-015` | `FR-WEB-003`, `NFR-WEB-003` | `DD-SYS-004` | Accepted |
| `SOL-WEB-004` | LiveDashboardController | Hiển thị bảng dữ liệu nhân sự điểm danh theo thời gian thực với hiệu ứng chuyển động mượt mà khi có dòng mới. | `STK-016`, `STK-017` | `FR-WEB-003`, `FR-WEB-005` | `DD-SYS-004` | Accepted |
| `SOL-WEB-005` | ReportExportEngine | Sử dụng thư viện phía máy trạm (`exceljs` / `jspdf`) tạo file báo cáo xuất dữ liệu tức thì từ dữ liệu bảng. | `STK-015` | `FR-WEB-006` | `DD-SYS-001` | Accepted |
| `SOL-WEB-006` | AccountLifecycleModule | Quản lý form tạo/sửa/vô hiệu hóa hồ sơ nhân sự, hiển thị mật khẩu tạm đúng một lần kèm cảnh báo, luồng cấp lại mật khẩu tạm, cùng màn hình blocking đổi mật khẩu bắt buộc và thiết lập/đặt lại PIN; chặn rời màn hình khi chưa xác nhận đã lưu mật khẩu tạm. | `STK-016`, `STK-017` | `FR-WEB-007`, `FR-WEB-009` | `DD-SYS-001` | Accepted |
| `SOL-WEB-007` | ShiftAssignmentModule | Màn hình CRUD ca và phân ca theo khoảng ngày, kiểm tra chồng lấn phía client trước khi gọi API và diễn giải lỗi 409 thành gợi ý khoảng trống. | `STK-016` | `FR-WEB-008` | `DD-SYS-001` | Accepted |
| `SOL-WEB-008` | PayrollLockModule | Màn hình chốt/mở lại kỳ công và cơ chế lan toả cờ khoá điều chỉnh tới mọi giao diện nghiệp vụ qua bộ nhớ đệm truy vấn. | `STK-016`, `STK-017` | `FR-WEB-010` | `DD-SYS-004` | Accepted |
| `SOL-WEB-009` | ConsentWithdrawalModule | Luồng rút Informed Consent có cảnh báo hệ quả và xác nhận hai bước, cùng màn hình gửi/theo dõi yêu cầu dữ liệu cá nhân. | `STK-016` | `FR-WEB-011` | `DD-SYS-003` | Accepted |
| `SOL-WEB-010` | SessionLifecycleModule | Xử lý đăng xuất (gọi API thu hồi token trước khi xoá storage), đồng bộ đăng xuất đa tab và điều hướng về trang đăng nhập khi refresh token thất bại. | `STK-016` | `FR-WEB-012` | `DD-SYS-003` | Accepted |
| `SOL-WEB-011` | NotificationCenterModule | Trung tâm thông báo trong ứng dụng: badge số chưa đọc, danh sách theo sự kiện vòng đời và đánh dấu đã đọc tức thời. | `STK-016`, `STK-017` | `FR-WEB-013` | `DD-SYS-004` | Accepted |
| `SOL-WEB-012` | AdminComplianceModule | Màn hình quản lý trạm Kiosk (token một lần, cảnh báo ping) và màn hình tra cứu kiểm toán/tuân thủ chỉ đọc với phân quyền `ADMIN`/`DPO`. | `STK-016` | `FR-WEB-014` | `DD-SYS-001` | Accepted |

---

## 2. Real-time Live Attendance Sequence (Trình tự Cập nhật Chấm công Thời gian thực)

```text
Backend Server ──► [WS STOMP: /topic/live-attendance] ──► [useStompListener Hook]
                                                                   │
                                                                   ▼
[Cập nhật UI mượt mà] ◄── [Highlight dòng mới trong 3s] ◄── [Cập nhật Zustand Store]
```
