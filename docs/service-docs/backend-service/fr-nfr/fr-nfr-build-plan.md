---
title: Backend Core Build Plan
version: 1.0
status: Approved
owner: Backend Lead
---

# FR/NFR BUILD PLAN — Kế hoạch Thi công Cốt lõi Phân hệ Backend

## 1. Approach Decisions (Quyết định Phương pháp Thi công)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-005` | Chiến lược Thi công Nghiệp vụ & Definition of Done Phân hệ Backend | Triển khai theo nguyên tắc Dependency Inversion: Bảo mật & Mã hóa $\rightarrow$ Động cơ Điểm danh & Cooldown $\rightarrow$ Đồng bộ Bù Ngoại tuyến $\rightarrow$ Chu trình Đăng ký OTP $\rightarrow$ Phát sóng Sự kiện STOMP $\rightarrow$ Kiểm toán & Tác vụ Tiêu hủy Dữ liệu. | Triển khai Controller-first hoặc Big-bang integration (bị loại vì khó cô lập lỗi). | 100% mã nguồn có kiểm thử tự động, tuân thủ Clean Code và không vi phạm bảo mật. | `ARC-002`, `STK-011` | Accepted |

---

## 2. Core Build Work Items (Danh mục Hạng mục Thi công Cốt lõi)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-BE-009` | Lập trình Security Filter & JWT Provider | Xây dựng bộ phát hành token RSA-256 hoặc HMAC-SHA256, filter chặn và phân quyền theo Role (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`). | `SOL-BE-001` | `FND-BE-004` | Cấp phát token hợp lệ; từ chối token hết hạn; phân quyền URL chính xác; trả về 403 Forbidden khi trái quyền. | Done |
| `BLD-BE-010` | Lập trình Dịch vụ Mã hóa AES-256-GCM | Xây dựng `BiometricCryptoService` mã hóa mảng byte vector ArcFace với khóa bí mật từ biến môi trường. | `SOL-BE-004` | `FND-BE-001` | Mã hóa và giải mã bảo toàn 100% dữ liệu gốc vector 512D; sinh mới IV ngẫu nhiên 12-byte mỗi lần mã hóa; không lưu plaintext. | Planned |
| `BLD-BE-011` | Lập trình Động cơ Xử lý Điểm danh & Cooldown | Xây dựng `AttendanceService` đối chiếu ca kíp, tính toán số phút trễ/về sớm, tích hợp kiểm tra Cooldown 120s qua Caffeine và lưu PostgreSQL. | `SOL-BE-002`, `SOL-BE-009`, `SOL-BE-010` | `BLD-BE-009` | Phản hồi trong $\le 100\text{ ms}$; phân loại trạng thái điểm danh chuẩn xác; chặn quẹt trùng lặp trong 120s từ bộ nhớ đệm. | Planned |
| `BLD-BE-012` | Lập trình Xử lý Gói lô Đồng bộ Bù | Xây dựng dịch vụ tiếp nhận mảng 50 bản ghi, thực thi batch insert có bắt ngoại lệ bản ghi trùng qua khóa tự nhiên. | `SOL-BE-003` | `BLD-BE-011` | Lưu trọn vẹn gói lô không lỗi giao dịch; bỏ qua bản ghi trùng lặp và trả về danh sách ID thành công. | Planned |
| `BLD-BE-013` | Lập trình Quản lý Đăng ký & OTP | Xây dựng logic kiểm tra điều kiện Informed Consent, sinh mã OTP 6 số, kiểm tra thời hạn 48 giờ và kích hoạt nhân sự. | `SOL-BE-005` | `BLD-BE-010` | Nhân viên ký cam kết mới được sinh OTP; OTP hết hạn không cho kích hoạt; nạp vector thành công chuyển trạng thái `ACTIVE`. | Planned |
| `BLD-BE-014` | Tích hợp Bộ Phát sóng STOMP | Tích hợp `SimpMessagingTemplate` bắn sự kiện điểm danh lên `/topic/live-attendance` và gallery lên `/topic/kiosk-gallery`. | `SOL-BE-006` | `FND-BE-005` | Kiosk và Web Portal nhận được JSON payload ngay khi Backend hoàn tất lưu CSDL với độ trễ $\le 50\text{ ms}$. | Planned |
| `BLD-BE-015` | Lập trình Aspect Kiểm toán Bất biến | Xây dựng Spring AOP ghi log các thao tác cập nhật dữ liệu của người dùng vào bảng `audit_logs`. | `SOL-BE-007` | `BLD-BE-009` | Mọi thay đổi giờ công hoặc thông tin nhân viên đều tự động có bản ghi audit chi tiết lưu ngữ cảnh người sửa. | Planned |
| `BLD-BE-016` | Tích hợp Toàn trình Luồng Điểm danh & STOMP | Ghép nối luồng tiếp nhận punch từ Kiosk qua REST API, kiểm tra cooldown qua Caffeine Cache, ghi nhận PostgreSQL và phát sóng sự kiện qua STOMP. | `ARC-002`, `SOL-BE-002`, `SOL-BE-006` | `BLD-BE-011`, `BLD-BE-014` | Giao dịch điểm danh hoàn tất trong $\le 100\text{ ms}$, đồng thời đẩy tin nhắn JSON hợp lệ lên topic `/topic/live-attendance`. | Planned |
| `BLD-BE-017` | Lập trình Tác vụ Tiêu hủy Dữ liệu Định kỳ 20 Ngày | Xây dựng Spring `@Scheduled` cron job 01:00 hàng ngày quét CSDL và tiêu hủy vĩnh viễn vector sinh trắc học nhân viên thôi việc quá 20 ngày. | `SOL-BE-008` | `BLD-BE-010` | Tự động xóa cứng bản ghi `biometric_templates` của nhân viên có `terminated_date <= CurrentDate - 20 days`; không ảnh hưởng hiệu năng hệ thống. | Planned |
| `BLD-BE-019` | Lập trình Dịch vụ Quản lý Tài khoản & Vòng đời Mật khẩu | Xây dựng `AccountManagementService` (tạo hồ sơ kèm tài khoản và mật khẩu tạm dùng một lần, cập nhật hồ sơ, vô hiệu hóa nhân sự kèm audit) và bộ chặn nghiệp vụ khi tài khoản còn cờ buộc đổi mật khẩu. | `SOL-BE-014`, `SOL-BE-015` | `BLD-BE-009` | Tạo hồ sơ trả mật khẩu tạm đúng một lần; mọi endpoint nghiệp vụ trả 403 `PASSWORD_CHANGE_REQUIRED` cho tới khi đổi mật khẩu; vô hiệu hóa nhân sự đặt `terminated_date` và ghi audit. | Planned |
| `BLD-BE-020` | Lập trình Dịch vụ Mã PIN & Thẩm định PIN | Xây dựng `PinService` (thiết lập/đổi mã PIN 6 số, băm một chiều) và luồng thẩm định PIN cho trạm Kiosk kèm khóa 15 phút sau 5 lần nhập sai. | `SOL-BE-016` | `BLD-BE-009` | PIN đúng trả về định danh nhân viên; PIN sai trả 401 `PIN_INVALID`; sai 5 lần liên tiếp trả 423 `PIN_LOCKED`; không tạo bản ghi điểm danh khi thẩm định thất bại. | Planned |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Phụ thuộc Nền tảng Biên dịch Maven**: Quá trình thi công và đóng gói mã nguồn phụ thuộc vào Java 21 LTS và Maven Wrapper (`./mvnw`) có sẵn trong repo. Mã nguồn phân tách theo package: `com.fas.api` (DTO, validation, xử lý lỗi), `com.fas.data` (entity, enum, repository, cache), `com.fas.security` (JWT, SecurityConfig) và `com.fas.config`; các tầng `service` và `controller` sẽ được bổ sung tại Wave 4–5 theo `task-plan.md`.
* **Cấu hình Biến Môi trường Local**: Các tham số bảo mật (`JWT_SECRET`, `ENCRYPTION_MASTER_KEY`) được nạp qua biến môi trường hoặc file `.env` thông qua placeholder `${...}` trong `src/main/resources/application.yml`. Bộ kiểm thử tự động ghi đè bằng `src/test/resources/application.yml` ở profile `test` (H2 in-memory chế độ PostgreSQL), không cần Docker daemon.

