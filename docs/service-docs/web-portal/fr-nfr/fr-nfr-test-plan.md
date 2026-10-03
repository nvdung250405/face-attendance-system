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
