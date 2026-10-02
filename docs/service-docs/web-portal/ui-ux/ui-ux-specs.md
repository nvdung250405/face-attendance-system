# UI/UX SPECS — Đặc tả Giao diện & Trải nghiệm Phân hệ Web Portal

> **Mã tài liệu:** `SPEC-UI-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả hành trình người dùng (`UI-WEB-`) và các tương tác trải nghiệm trên giao diện Web Portal.

---

## 1. User Tasks & Journeys (Nhiệm vụ Người dùng trên Web)

| ID | Nhiệm vụ / Hành trình | Luồng Tương tác Trực quan | Tiêu chí Nghiệm thu |
| :--- | :--- | :--- | :--- |
| `UI-WEB-001` | Đăng nhập & Điều hướng Phân quyền | Nhập email và mật khẩu $\rightarrow$ Xác thực thành công $\rightarrow$ Điều hướng tức thời về Dashboard tương ứng vai trò. | Giao diện rõ ràng, hiển thị thông báo lỗi khi sai tài khoản. |
| `UI-WEB-002` | Nhân viên Ký Cam kết Sinh trắc & Nhận OTP | Đăng nhập lần đầu $\rightarrow$ Modal Cam kết bật lên $\rightarrow$ Đọc điều khoản và bấm "Ký xác nhận" $\rightarrow$ Hiển thị mã 6 số + QR Code. | Nút ký chỉ sáng khi đã cuộn hết văn bản cam kết; mã OTP to rõ. |
| `UI-WEB-003` | HR Theo dõi Bảng Chấm công Trực tiếp | Truy cập Dashboard $\rightarrow$ Xem thẻ thống kê (Tổng quân số, Đã đến, Đi muộn, Chưa đến) $\rightarrow$ Xem bảng sự kiện nhảy thời gian thực. | Thống kê cập nhật tức thời; dòng mới xuất hiện có hiệu ứng highlight. |
| `UI-WEB-004` | Tra cứu & Xuất Báo cáo Điểm danh | Chọn khoảng ngày và phòng ban $\rightarrow$ Xem bảng dữ liệu tổng hợp $\rightarrow$ Nhấn nút "Xuất Excel" hoặc "Xuất PDF". | Báo cáo trực quan; thời gian tải xuống tức thì. |
