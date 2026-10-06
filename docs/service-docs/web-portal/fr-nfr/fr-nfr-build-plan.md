---
title: Web Portal Core Build Plan
version: 1.0
status: Approved
owner: Web Lead
---

# FR/NFR BUILD PLAN — Kế hoạch Thi công Cốt lõi Phân hệ Web Portal


## 1. Approach & Sequencing (Chiến lược Thi công Web Cốt lõi)

$$\text{Auth Store \& Router} \rightarrow \text{Consent \& OTP Module} \rightarrow \text{STOMP Realtime Client} \rightarrow \text{Live Attendance Dashboard} \rightarrow \text{Report Exporter}$$

---

## 2. Core Build Work Items (Danh mục Hạng mục Thi công Cốt lõi)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-WEB-012` | Lập trình Auth Store & Protected Routes | Xây dựng Zustand store quản lý user, token, và React Router bọc Auth Guard kiểm tra Role. | `SOL-WEB-001` | `FND-WEB-001` | Chặn truy cập trái phép; tự động điều hướng đúng trang HR hoặc Employee. | Done |
| `BLD-WEB-013` | Lập trình Luồng Ký Cam kết Informed Consent | Xây dựng Modal điều khoản pháp lý, xử lý nút ký, gọi API và hiển thị OTP 6 số kèm mã QR. | `SOL-WEB-002` | `BLD-WEB-012` | Hiển thị mã QR và OTP rõ ràng; tự động đóng modal khi nhận được tín hiệu WebSocket. | Done |
| `BLD-WEB-014` | Lập trình Dịch vụ Kết nối STOMP Client | Xây dựng Hook `useStompClient` kết nối tới `/ws-attendance`, tự động kết nối lại khi rớt mạng. Phụ thuộc dịch vụ STOMP thuộc facet `api` được giải quyết tại `TASK-WEB-018` (Mục 13.2). | `SOL-WEB-003` | `FND-WEB-001` | Nhận tin nhắn ổn định; cập nhật trạng thái kết nối trực tuyến/ngoại tuyến. | Done |
| `BLD-WEB-015` | Lập trình Bảng Chấm công HR Trực tiếp | Xây dựng bảng hiển thị sự kiện điểm danh thời gian thực, tự động thêm dòng mới vào đầu bảng. | `SOL-WEB-004` | `BLD-WEB-014` | Dòng mới chèn lên đầu kèm hiệu ứng ánh sáng nhẹ trong 3s; không giật lag. | Done |
| `BLD-WEB-016` | Lập trình Module Xuất Báo cáo Excel/PDF | Xây dựng dịch vụ trích xuất bảng dữ liệu và tải xuống file Excel/PDF định dạng chuẩn. | `SOL-WEB-005` | `BLD-WEB-015` | Xuất file đầy đủ định dạng tiêu đề, thời gian, tên công ty và số liệu chấm công. | Done |
| `BLD-WEB-018` | Lập trình Module Vòng đời Tài khoản & Phiên | Xây dựng luồng tạo/sửa/vô hiệu hóa hồ sơ nhân sự, hộp thoại mật khẩu tạm một lần, luồng đổi mật khẩu tự nguyện và đăng xuất thu hồi phiên. | `SOL-WEB-006`, `SOL-WEB-010` | `BLD-WEB-012` | Mật khẩu tạm chỉ hiển thị một lần; không có luồng chặn điều hướng theo trạng thái mật khẩu; đăng xuất gọi API thu hồi token trước khi xoá storage và đồng bộ đa tab. | Planned |
| `BLD-WEB-019` | Lập trình Module Ca kíp & Kỳ công | Xây dựng màn hình CRUD ca, phân ca theo khoảng ngày kèm gợi ý khi chồng lấn, và màn hình chốt/mở lại kỳ công có lan toả cờ khoá điều chỉnh. | `SOL-WEB-007`, `SOL-WEB-008` | `BLD-WEB-012` | Phân ca chồng khoảng hiển thị lỗi kèm khoảng trống gợi ý; kỳ đã chốt vô hiệu hoá nút duyệt đơn/điều chỉnh trên toàn bộ giao diện. | Planned |
| `BLD-WEB-020` | Lập trình Module Rút Consent & Trung tâm Thông báo | Xây dựng luồng rút Informed Consent có cảnh báo hệ quả và xác nhận hai bước, màn hình yêu cầu dữ liệu cá nhân, và trung tâm thông báo trong ứng dụng. | `SOL-WEB-009`, `SOL-WEB-011` | `BLD-WEB-012` | Cảnh báo nêu rõ hệ quả trước khi rút; yêu cầu dữ liệu cá nhân hiển thị trạng thái xử lý; badge thông báo chưa đọc cập nhật tức thời. | Planned |
| `BLD-WEB-021` | Lập trình Module Quản trị Trạm Kiosk & Tuân thủ | Xây dựng màn hình đăng ký/đổi token/vô hiệu hóa trạm Kiosk (token chỉ giữ trong RAM), cảnh báo ping quá hạn, và màn hình tra cứu audit/tuân thủ chỉ đọc cho `ADMIN`/`DPO`. | `SOL-WEB-012` | `BLD-WEB-012` | Secret Token không được ghi vào LocalStorage/SessionStorage; trạm không ping quá 5 phút có cảnh báo; role `DPO` không thấy thao tác ghi. | Planned |
