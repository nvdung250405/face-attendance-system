---
title: Web Portal Core Test Plan
version: 1.0
status: Approved
owner: Web QA Lead
---

# FR/NFR TEST PLAN — Kế hoạch Kiểm thử Nội bộ Phân hệ Web Portal

## 1. Approach & Frameworks (Công cụ & Phương pháp Kiểm thử)

* **Framework**: Vitest, React Testing Library, Playwright (E2E Browser Testing).
* **Tiêu chuẩn hoàn thành**: 100% ca kiểm thử pass; độ bao phủ các component nghiệp vụ $\ge 80\%$.

---

## 2. Core Test Items (Danh mục Ca Kiểm thử Web Portal)

| ID | Name | Covers | Level | Pass Criteria | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-013` | Đăng nhập & Định tuyến Phân quyền RBAC | `FR-WEB-001` | Component / Flow | Đăng nhập tài khoản HR mở trang HR; tài khoản NV mở trang cá nhân. | Done |
| `TST-WEB-014` | Quy trình Ký Cam kết Consent & Hiển thị OTP | `FR-WEB-002` | Flow / Integration | Ký cam kết thành công sinh ra đúng mã OTP 6 số và mã QR tương ứng. | Done |
| `TST-WEB-015` | Tiếp nhận Sự kiện Điểm danh Đẩy qua STOMP | `FR-WEB-003` | Integration | Giả lập Backend bắn tin STOMP; bảng Live Dashboard xuất hiện dòng mới ngay lập tức. | Done |
| `TST-WEB-016` | Tra cứu Lịch sử Chấm công Cá nhân | `FR-WEB-004` | Component | Hiển thị chính xác số ngày công, số phút đi trễ theo từng tháng. | Done |
| `TST-WEB-017` | Xuất Báo cáo Điểm danh Ra File Excel | `FR-WEB-006` | Functional | File Excel tải xuống mở được, đúng định dạng cột và số liệu tính toán. | Done |
| `TST-WEB-018` | Kiểm tra Tương thích Giao diện Responsive | `NFR-WEB-002` | Visual / E2E | Hiển thị tốt trên màn hình tablet ($1024\times 768$) và desktop ($1920\times 1080$). | Done |
| `TST-WEB-019` | Kiểm thử Vòng đời Hồ sơ Nhân sự | `FR-WEB-007`, `API-WEB-009`, `API-WEB-010` | Flow / Integration | Tạo hồ sơ hiển thị mật khẩu tạm đúng một lần và cảnh báo không xem lại; sửa/vô hiệu hóa yêu cầu xác nhận; cấp lại mật khẩu tạm thông báo phiên cũ đã bị thu hồi. | Planned |
| `TST-WEB-020` | Kiểm thử Quản lý Ca kíp & Phân ca | `FR-WEB-008`, `API-WEB-011` | Flow / Integration | Tạo/sửa/vô hiệu hóa ca thành công; phân ca chồng khoảng hiển thị lỗi 409 kèm khoảng trống gợi ý; lịch tuần cập nhật ngay sau khi lưu. | Planned |
| `TST-WEB-021` | Kiểm thử Đổi Mật khẩu Tự nguyện & Quản lý PIN | `FR-WEB-009`, `API-WEB-012` | Flow / Security | Người dùng còn dùng mật khẩu tạm vào được mọi màn hình (không có chặn điều hướng); đổi mật khẩu từ menu thành công và thông báo thu hồi phiên cũ; thiết lập PIN yêu cầu nhập lại; đặt lại PIN yêu cầu mật khẩu hiện tại. | Planned |
| `TST-WEB-022` | Kiểm thử Chốt Kỳ công & Lan toả Cờ Khoá | `FR-WEB-010`, `API-WEB-013` | Flow / Integration | Sau khi chốt kỳ, nhãn "Đã chốt" xuất hiện và nút duyệt đơn/điều chỉnh công bị vô hiệu hoá trên mọi màn hình; ADMIN mở lại bắt buộc nhập lý do. | Planned |
| `TST-WEB-023` | Kiểm thử Rút Consent & Yêu cầu Dữ liệu Cá nhân | `FR-WEB-011`, `API-WEB-014` | Flow / Compliance | Cảnh báo hệ quả hiển thị trước khi rút; rút thành công hiển thị hạn tiêu huỷ 7 ngày; yêu cầu dữ liệu cá nhân hiển thị trạng thái xử lý và role `DPO` xử lý được. | Planned |
| `TST-WEB-024` | Kiểm thử Đăng xuất & Xử lý Phiên Hết hạn | `FR-WEB-012`, `API-WEB-015` | Flow / Integration | Đăng xuất gọi API thu hồi token, xoá storage và đăng xuất mọi tab; khi refresh token thất bại tự chuyển về trang đăng nhập kèm thông báo lý do. | Planned |
| `TST-WEB-025` | Kiểm thử Trung tâm Thông báo Trong ứng dụng | `FR-WEB-013`, `API-WEB-016` | Component / Integration | Badge số chưa đọc đúng; đánh dấu đã đọc cập nhật tức thời; thông báo chỉ thuộc người đang đăng nhập và bị xoá khi đăng xuất. | Planned |
| `TST-WEB-026` | Kiểm thử Quản trị Trạm Kiosk & Tra cứu Tuân thủ | `FR-WEB-014`, `API-WEB-017` | Flow / Security | Secret Token chỉ hiển thị một lần và **không** xuất hiện trong LocalStorage/SessionStorage; trạm quá 5 phút không ping có cảnh báo; role `DPO` không thấy thao tác ghi. | Planned |
