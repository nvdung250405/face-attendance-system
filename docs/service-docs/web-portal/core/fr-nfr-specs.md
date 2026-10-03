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
| `FR-WEB-001` | Cung cấp giao diện đăng nhập bảo mật hỗ trợ lưu trữ token tự động và chuyển hướng theo vai trò (HR vs Nhân viên). | Auth / Routing | P1 | `FR-SYS-007` | Đăng nhập phân quyền chính xác; lưu Access Token trong bộ nhớ và tự gia hạn. | Approved |
| `FR-WEB-002` | Cung cấp luồng ký cam kết Informed Consent điện tử và hiển thị mã kích hoạt OTP 6 số kèm mã QR Code cho nhân viên. | Enrollment / Privacy| P1 | `FR-SYS-008` | Hiển thị đầy đủ điều khoản bảo vệ dữ liệu sinh trắc học; sinh OTP 48h sau khi ký. | Approved |
| `FR-WEB-003` | Cung cấp bảng điều khiển theo dõi chấm công thời gian thực cho HR nhận dữ liệu đẩy từ WebSocket STOMP. | Dashboard / Live | P1 | `FR-SYS-014` | Cập nhật dòng mới tức thì khi có nhân viên quẹt thẻ tại Kiosk mà không cần F5 tải lại. | Approved |
| `FR-WEB-004` | Cho phép nhân sự tra cứu bảng chấm công cá nhân, xem chi tiết giờ vào/ra và số phút đi trễ theo tháng. | Employee Portal | P1 | `FR-SYS-010` | Hiển thị lịch biểu trực quan; phân biệt ngày đúng giờ, đi muộn, nghỉ phép bằng màu sắc. | Approved |
| `FR-WEB-005` | Cung cấp công cụ quản lý hồ sơ nhân viên, trạng thái kích hoạt khuôn mặt và phân ca làm việc cho HR. | HR Management | P1 | `FR-SYS-010` | Thêm, sửa, vô hiệu hóa nhân sự; xem trạng thái kích hoạt khuôn mặt (`ACTIVE` / `PENDING`). | Approved |
| `FR-WEB-006` | Cho phép HR kết xuất báo cáo tổng hợp chấm công toàn công ty ra định dạng tệp Excel (.xlsx) và PDF. | Export / Report | P2 | `FR-SYS-010` | Tải xuống file hoàn chỉnh trong vòng $\le 3\text{ giây}$ cho 1,000 nhân viên. | Approved |

---

## 2. Non-functional Requirements (Yêu cầu Phi chức năng Web Portal)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `NFR-WEB-001` | Thời gian tải trang ban đầu (First Contentful Paint) đạt $\le 1.5\text{ giây}$ trên đường truyền băng thông tiêu chuẩn. | Performance | P1 | `NFR-SYS-001` | Áp dụng kỹ thuật tách mã (Code Splitting), lazy loading cho các trang quản trị. | Approved |
| `NFR-WEB-002` | Giao diện tương thích hoàn hảo (Responsive Design) trên mọi kích thước màn hình máy tính để bàn và máy tính bảng. | Usability | P1 | `NFR-SYS-003` | Hiển thị mượt mà từ độ phân giải $1024\times 768\text{ px}$ đến $4\text{K}$. | Approved |
| `NFR-WEB-003` | Tự động kết nối lại WebSocket STOMP với chiến lược Exponential Backoff khi bị ngắt kết nối mạng. | Reliability | P1 | `NFR-SYS-006` | Thử kết nối lại tự động; hiển thị thông báo trạng thái mạng trực quan cho người dùng. | Approved |
| `NFR-WEB-004` | Bảo mật tuyệt đối phiên làm việc, chống tấn công XSS và không lưu trữ thông tin nhạy cảm trong LocalStorage. | Security | P1 | `NFR-SYS-007` | Tuân thủ chính sách Content Security Policy (CSP); xóa sạch token khi đăng xuất. | Approved |
