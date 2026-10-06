---
title: Web Portal UI/UX Build Plan
version: 2.0
status: Approved
owner: Web Lead & UI Engineer
---

# UI/UX BUILD PLAN — Kế hoạch Thi công Giao diện Phân hệ Web Portal


## 1. Approach & Sequencing (Chiến lược Thi công Giao diện)

Xây dựng giao diện React / Tailwind CSS theo 5 giai đoạn liên tục:
$$\text{Design Tokens \& Theme} \rightarrow \text{Admin Shell Layout} \rightarrow \text{Live Monitoring Dashboard} \rightarrow \text{Consent \& OTP Modals} \rightarrow \text{Employee Attendance Calendar}$$

---

## 2. UI Build Work Items (Danh mục Hạng mục Thi công Giao diện)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-WEB-004` | Cấu hình Tailwind Design Tokens & Theme | Thiết lập `tailwind.config.js` với bảng màu Indigo, phông chữ Inter và các lớp tiện ích dùng chung. | `UXD-WEB-001` | `FND-WEB-002` | Toàn bộ giao diện áp dụng token tập trung, không dùng giá trị màu sắc hay khoảng cách tùy tiện. | Done |
| `BLD-WEB-005` | Xây dựng Khung Bố cục Quản trị (Admin Shell) | Lắp ráp Sidebar $260\text{ px}$ (hỗ trợ thu gọn $72\text{ px}$), TopHeader $64\text{ px}$ và Main Viewport Responsive. | `UXD-WEB-001` | `BLD-WEB-004` | Bố cục co giãn mượt mà; hiển thị hoàn hảo từ Mobile $< 768\text{ px}$ đến màn hình lớn $\ge 1440\text{ px}$. | Done |
| `BLD-WEB-006` | Lập trình Bảng Chấm công Trực tiếp & Thẻ KPI | Xây dựng lưới 4 thẻ KPI nhảy số thời gian thực và bảng Live Table có hiệu ứng chớp sáng khi nhận tin nhắn STOMP. | `UXD-WEB-003`, `UXD-WEB-004` | `BLD-WEB-005` | Dòng mới chèn lên đầu bảng mượt mà; số đếm KPI tăng tự động theo thời gian thực. | Done |
| `BLD-WEB-007` | Xây dựng Hộp thoại Cam kết & Hiển thị OTP | Thiết kế Modal 2 bước: Bước 1 khóa nút gửi đến khi cuộn hết văn bản; Bước 2 hiển thị mã OTP to rõ + QR Code + hiệu ứng Confetti khi hoàn tất. | `UXD-WEB-002` | `BLD-WEB-005` | Ràng buộc cuộn hoạt động chính xác; modal tự động đóng khi nhận sự kiện quét mặt từ Kiosk. | Done |
| `BLD-WEB-008` | Xây dựng Lịch Chấm công Cá nhân & Xuất File | Phát triển Calendar Grid 7 cột hiển thị giờ chấm công của nhân viên; tích hợp chức năng xuất báo cáo Excel/PDF. | `UXD-WEB-005` | `BLD-WEB-005` | Tải xuống file Excel chuẩn định dạng; nhấp chuột xem Drawer chi tiết ngày tức thời. | Done |
| `BLD-WEB-023` | Xây dựng Màn hình Quản trị Danh mục & Kỳ công | Phát triển màn hình hồ sơ nhân sự (kèm hộp thoại mật khẩu tạm), màn hình ca/phân ca trên lịch tuần và màn hình chốt kỳ công theo bố cục `UXD-WEB-006`. | `UXD-WEB-006` | `BLD-WEB-005` | Form nhập liệu trong Drawer hoạt động đúng; cảnh báo nghiệp vụ (trùng mã, chồng ca, kỳ đã chốt) hiển thị trên đầu bảng; kỳ đã chốt vô hiệu hoá nút điều chỉnh. | Planned |
| `BLD-WEB-024` | Xây dựng Màn hình Đổi mật khẩu Bắt buộc, Consent & Tuân thủ | Phát triển màn hình blocking đổi mật khẩu, luồng rút Consent/yêu cầu dữ liệu cá nhân, trung tâm thông báo và màn hình quản trị trạm Kiosk/tuân thủ theo `UXD-WEB-007`/`UXD-WEB-008`. | `UXD-WEB-007`, `UXD-WEB-008`, `UI-WEB-006`, `UI-WEB-008`, `UI-WEB-010`, `UI-WEB-011`, `UI-WEB-012` | `BLD-WEB-005` | Không thể rời màn hình đổi mật khẩu bắt buộc bằng điều hướng; Secret Token chỉ hiển thị một lần và không lưu lại; role `DPO` không thấy thao tác ghi. | Planned |
