---
title: Web Portal Client Data Test Plan
version: 1.0
status: Approved
owner: Web QA Lead
---

# DATA TEST PLAN — Kế hoạch Kiểm thử Tầng Dữ liệu Client Web Portal

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Tầng dữ liệu máy trạm của Web Portal bao gồm TypeScript Data Contracts, Safe Storage Adapter (LocalStorage/SessionStorage) và bộ đệm truy vấn TanStack Query.
* **Mục tiêu**:
  * Đảm bảo tính nhất quán dữ liệu phiên đăng nhập trên nhiều tab trình duyệt (Multi-tab Synchronization).
  * Kiểm chứng cơ chế fallback an toàn vào RAM khi trình duyệt chặn LocalStorage (chế độ Private / Incognito).
  * Xác nhận hiệu năng nạp và chèn dữ liệu điểm danh thời gian thực vào TanStack Query Cache mà không gây render lại toàn bộ trang.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Dữ liệu Client)

| ID | Quyết định Tiếp cận Kiểm thử Dữ liệu Client | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-WEB-DAT-01` | Sử dụng Vitest kết hợp jsdom để kiểm thử tương tác Storage APIs. | Giả lập môi trường trình duyệt chuẩn, cho phép kiểm tra chi tiết các sự kiện StorageEvent và serialization. | `STK-015`, `DATA-WEB-001` | Approved |
| `APC-WEB-DAT-02` | Kiểm thử biên (Edge Case Testing) khi LocalStorage bị khóa hoặc đầy dung lượng (QuotaExceededError). | Ngăn chặn hiện tượng ứng dụng bị crash khi người dùng mở web trong chế độ bảo mật nghiêm ngặt. | `DTD-WEB-001`, `NFR-WEB-001` | Approved |

---

## 3. Data Test Items (Danh mục Ca Kiểm thử Dữ liệu Client)

| ID | Tên Ca Kiểm thử | Covers Spec | Mức độ Test | Tiêu chí Đạt (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-DAT-001` | Kiểm thử TypeScript Contracts & Validation | `DATA-WEB-001` đến `DATA-WEB-004` | Unit | Toàn bộ dữ liệu JSON từ API serialize/deserialize chính xác vào các interface TypeScript mà không mất trường. | **Passed** |
| `TST-WEB-DAT-002` | Kiểm thử Safe Storage Adapter & Fallback RAM | `DTD-WEB-001` | Unit / Resiliency | Khi LocalStorage ném lỗi; adapter tự động chuyển sang lưu tạm trong RAM; không làm dừng luồng ứng dụng. | **Passed** |
| `TST-WEB-DAT-003` | Kiểm thử Đồng bộ Trạng thái Phiên Đa Tab | `DTD-WEB-001` | Integration | Kích hoạt sự kiện logout trên Tab 1; Tab 2 tự động xóa token và chuyển hướng về màn hình đăng nhập. | **Passed** |
| `TST-WEB-DAT-004` | Kiểm thử TanStack Query Realtime Injection | `DATA-WEB-004` | Integration / Cache | Nhận sự kiện WebSocket mới; hook tự động chèn bản ghi vào đầu danh sách cache mà không refetch toàn bộ API. | **Passed** |

---

## 4. Defect Management (Quản lý Lỗi Dữ liệu Client)

* Lỗi làm mất phiên đăng nhập đột ngột hoặc hỏng cache khiến người dùng thấy dữ liệu sai lệch được xếp mức **Critical (P1)**.
