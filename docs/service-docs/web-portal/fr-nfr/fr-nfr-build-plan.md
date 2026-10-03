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
| `BLD-WEB-014` | Lập trình Dịch vụ Kết nối STOMP Client | Xây dựng Hook `useStompClient` kết nối tới `/ws-attendance`, tự động kết nối lại khi rớt mạng. | `SOL-WEB-003` | `BLD-WEB-011` | Nhận tin nhắn ổn định; cập nhật trạng thái kết nối trực tuyến/ngoại tuyến. | Done |
| `BLD-WEB-015` | Lập trình Bảng Chấm công HR Trực tiếp | Xây dựng bảng hiển thị sự kiện điểm danh thời gian thực, tự động thêm dòng mới vào đầu bảng. | `SOL-WEB-004` | `BLD-WEB-014` | Dòng mới chèn lên đầu kèm hiệu ứng ánh sáng nhẹ trong 3s; không giật lag. | Done |
| `BLD-WEB-016` | Lập trình Module Xuất Báo cáo Excel/PDF | Xây dựng dịch vụ trích xuất bảng dữ liệu và tải xuống file Excel/PDF định dạng chuẩn. | `SOL-WEB-005` | `BLD-WEB-015` | Xuất file đầy đủ định dạng tiêu đề, thời gian, tên công ty và số liệu chấm công. | Done |
