---
title: Web Portal Client Data Specifications
version: 2.0
status: Approved
owner: Web Lead & Frontend Architect
---

# DATA SPECS — Đặc tả Lưu trữ & Trạng thái Dữ liệu Cục bộ Web Portal


## 1. Danh mục Thực thể Lưu trữ Phía Client (Client Storage Entities)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `DATA-WEB-001` | Quản lý phiên xác thực `auth_session` trong Browser `LocalStorage` bao gồm cặp token, mốc hết hạn và hồ sơ người dùng. | Storage | Must | `SRS-001`, `ARC-003` | Token & user info lưu an toàn, tự xóa khi logout hoặc vô hiệu hóa. | Approved |
| `DATA-WEB-002` | Quản lý tùy chọn giao diện `ui_preferences` trong Browser `LocalStorage` bao gồm trạng thái sidebar và kích thước trang. | Storage | Should | `SRS-003` | Trạng thái thu gọn menu và bộ lọc bảng lưu bền vững qua các phiên. | Approved |
| `DATA-WEB-003` | Quản lý trạng thái ký cam kết tạm `consent_flow` trong Browser `SessionStorage` bao gồm điều khoản, OTP và mã QR. | Storage | Must | `SRS-001`, `ARC-003` | Dữ liệu phiên ký cam kết tự động xóa ngay khi đóng tab hoặc kích hoạt xong. | Approved |
| `DATA-WEB-004` | Quản lý bộ nhớ đệm truy vấn `query_cache` qua In-Memory TanStack Query với chính sách staleTime và invalidation linh hoạt. | Cache | Must | `SRS-003`, `ARC-003` | Dữ liệu live staleTime 0ms, cache tự động cập nhật khi có STOMP event. | Approved |

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
