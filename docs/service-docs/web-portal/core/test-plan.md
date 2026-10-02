# TEST PLAN — Kế hoạch Kiểm thử Nội bộ Phân hệ Web Portal

> **Mã tài liệu:** `PLN-TST-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục ca kiểm thử chức năng và trải nghiệm nội bộ (`TST-WEB-`) của Cổng Web Portal.

---

## 1. Approach & Frameworks (Công cụ & Phương pháp Kiểm thử)

* **Framework**: Vitest, React Testing Library, Playwright (E2E Browser Testing).
* **Tiêu chuẩn hoàn thành**: 100% ca kiểm thử pass; độ bao phủ các component nghiệp vụ $\ge 80\%$.

---

## 2. Web Portal Test Items (Danh mục Ca Kiểm thử Web Portal)

| ID | Tên Ca Kiểm thử | Covers Spec | Mức độ Test | Tiêu chí Đạt (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-001` | Đăng nhập & Định tuyến Phân quyền RBAC | `FR-WEB-001` | Component / Flow | Đăng nhập tài khoản HR mở trang HR; tài khoản NV mở trang cá nhân. | **Passed** |
| `TST-WEB-002` | Quy trình Ký Cam kết Consent & Hiển thị OTP | `FR-WEB-002` | Flow / Integration | Ký cam kết thành công sinh ra đúng mã OTP 6 số và mã QR tương ứng. | **Passed** |
| `TST-WEB-003` | Tiếp nhận Sự kiện Điểm danh Đẩy qua STOMP | `FR-WEB-003` | Integration | Giả lập Backend bắn tin STOMP; bảng Live Dashboard xuất hiện dòng mới ngay lập tức. | **Passed** |
| `TST-WEB-004` | Tra cứu Lịch sử Chấm công Cá nhân | `FR-WEB-004` | Component | Hiển thị chính xác số ngày công, số phút đi trễ theo từng tháng. | **Passed** |
| `TST-WEB-005` | Xuất Báo cáo Điểm danh Ra File Excel | `FR-WEB-006` | Functional | File Excel tải xuống mở được, đúng định dạng cột và số liệu tính toán. | **Passed** |
| `TST-WEB-006` | Kiểm tra Tương thích Giao diện Responsive | `NFR-WEB-002` | Visual / E2E | Hiển thị tốt trên màn hình tablet ($1024\times 768$) và desktop ($1920\times 1080$). | **Passed** |
