---
title: Web Portal Client Data Specifications
version: 2.0
status: Approved
owner: Web Lead & Frontend Architect
---

# DATA SPECS — Đặc tả Lưu trữ & Trạng thái Dữ liệu Cục bộ Web Portal


## 1. Danh mục Thực thể Lưu trữ Phía Client (Client Storage Entities)

| ID Thực thể | Tên Vùng Dữ liệu | Cơ chế Lưu trữ | Mục đích Nghiệp vụ & Kỹ thuật | Thời gian Tồn tại (TTL) |
| :--- | :--- | :--- | :--- | :--- |
| `DATA-WEB-001` | Phiên Xác thực (`auth_session`) | Browser `LocalStorage` | Lưu trữ cặp khóa `accessToken`, `refreshToken`, mốc hết hạn `expiresAt` và thông tin rút gọn người dùng (`user`). | Tồn tại cho đến khi Logout hoặc Refresh Token bị vô hiệu hóa. |
| `DATA-WEB-002` | Tùy chọn Giao diện (`ui_preferences`) | Browser `LocalStorage` | Lưu trữ trạng thái đóng/mở thanh Sidebar (`sidebarCollapsed: boolean`) và bộ lọc bảng mặc định. | Vĩnh viễn (hoặc khi người dùng xóa cache trình duyệt). |
| `DATA-WEB-003` | Trạng thái Ký Cam kết Tạm (`consent_flow`) | Browser `SessionStorage` | Lưu trạng thái các bước trong quy trình ký cam kết điện tử của nhân viên (`hasReadPolicy`, `otpCode`, `sessionExpiry`). | Xóa bỏ ngay khi đóng tab hoặc hoàn tất quy trình kích hoạt. |
| `DATA-WEB-004` | Bộ nhớ đệm Truy vấn (`query_cache`) | In-Memory (TanStack Query) | Bộ đệm RAM trình duyệt lưu trữ kết quả các API: Danh sách chấm công, Thống kê Dashboard, Hồ sơ nhân viên. | Cấu hình theo từng khóa truy vấn ($0\text{ s}$ đến $300\text{ s}$). |

---

## 2. Đặc tả Chi tiết Cấu trúc Thực thể (Entity Structures)

### 2.1. `DATA-WEB-001` — Cấu trúc Lưu trữ `auth_session`
* **Khóa lưu trữ trong LocalStorage**: `fas_auth_session`
* **Kiểu dữ liệu**: Chuỗi JSON mã hóa UTF-8.
* **Cấu trúc các trường**:
  | Tên Trường | Kiểu Dữ liệu | Bắt buộc | Mô tả & Ví dụ |
  | :--- | :--- | :---: | :--- |
  | `accessToken` | `string` | Có | Chuỗi JWT hợp lệ cấp quyền gọi API (`eyJhbGci...`). |
  | `refreshToken` | `string` | Có | Chuỗi UUID Refresh Token (`d8f4c2e1-...`). |
  | `tokenType` | `string` | Có | Cố định là `Bearer`. |
  | `expiresAt` | `number` | Có | Mốc Unix Timestamp (milliseconds) thời điểm hết hạn access token. |
  | `user` | `object` | Có | Thông tin định danh: `id` (`int64`), `employeeCode` (`string`), `fullName` (`string`), `email` (`string`), `role` (`HR_MANAGER` \| `EMPLOYEE` \| `ADMIN`), `status` (`PENDING_CONSENT` \| `ACTIVE` \| `INACTIVE`), `department` (`string`). |

---

### 2.2. `DATA-WEB-002` — Cấu trúc Lưu trữ `ui_preferences`
* **Khóa lưu trữ**: `fas_ui_prefs`
* **Cấu trúc các trường**:
  * `sidebarCollapsed` (`boolean`, mặc định `false`): Thu gọn/mở rộng menu trái.
  * `defaultPageSize` (`number`, mặc định `20`): Số dòng hiển thị mặc định trên bảng.
  * `soundNotification` (`boolean`, mặc định `true`): Bật/tắt âm báo khi có lượt quẹt mới trên Live Table.

---

### 2.3. `DATA-WEB-003` — Cấu trúc Lưu trữ `consent_flow`
* **Khóa lưu trữ trong SessionStorage**: `fas_consent_session`
* **Cấu trúc các trường**:
  * `consentSigned` (`boolean`): Đã bấm xác nhận đồng ý điều khoản.
  * `otp` (`string`): Mã OTP 6 chữ số (`839201`).
  * `qrCodeData` (`string`): Chuỗi dữ liệu QR Code để hiển thị (`otp:839201;emp:NV-1042;exp:...`).
  * `expiresAt` (`string`): Thời điểm ISO-8601 hết hạn của mã OTP.
  * `kioskTargetHint` (`string`): Gợi ý vị trí trạm Kiosk đặt tại văn phòng.

---

## 3. Đặc tả Chính sách Bộ nhớ Đệm Truy vấn (Query Cache Policies)

| Query Key | Phạm vi Dữ liệu | `staleTime` | `gcTime` (Garbage Collection) | Quy tắc Làm mới (Refetch / Invalidation) |
| :--- | :--- | :---: | :---: | :--- |
| `['attendance', 'live']` | Danh sách quẹt thẻ trực tiếp trên Dashboard | $0\text{ ms}$ (Luôn mới) | $5\text{ phút}$ | Cập nhật cục bộ tức thời khi nhận frame STOMP `/topic/live-attendance`. |
| `['attendance', 'history', params]` | Bảng tra cứu lịch sử chấm công HR | $60\text{ s}$ | $10\text{ phút}$ | Tự động invalidate khi chuyển trang hoặc thay đổi bộ lọc ngày/phòng ban. |
| `['attendance', 'personal', month, year]` | Bảng công cá nhân của nhân viên | $120\text{ s}$ | $15\text{ phút}$ | Invalidate khi nhận thông báo nạp thẻ thành công hoặc đổi tháng. |
| `['employees', params]` | Danh mục nhân sự và trạng thái kích hoạt | $300\text{ s}$ | $30\text{ phút}$ | Invalidate khi tạo mới, cập nhật nhân viên hoặc kích hoạt sinh trắc. |
