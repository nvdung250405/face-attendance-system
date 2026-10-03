---
title: Backend API Test Plan
version: 1.0
status: Approved
owner: Backend QA & API Lead
---

# API TEST PLAN — Kế hoạch Kiểm thử Giao diện & Hợp đồng API Backend

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ các endpoint RESTful API và kênh truyền WebSocket STOMP do phân hệ Backend cung cấp cho Kiosk Desktop và Web Portal.
* **Mục tiêu**:
  * Đảm bảo hợp đồng dữ liệu (JSON Schema, Status code, Error Response) khớp 100% với tài liệu thiết kế chi tiết `api-design.md`.
  * Xác thực cơ chế phân quyền bảo mật (Public, Kiosk Secret, JWT Bearer Token).
  * Kiểm chứng tốc độ phản hồi API ($\le 100\text{ms}$ cho punch, $\le 50\text{ms}$ cho STOMP message broadcast).

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử API)

| ID | Quyết định Tiếp cận Kiểm thử API | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-BE-API-01` | Sử dụng MockMvc kết hợp RestAssured để kiểm thử tự động hợp đồng API. | Cho phép kiểm tra toàn diện cả tầng Web MVC (Validation, Serialization) và tích hợp HTTP thực thụ. | `STK-011`, `API-BE-001` | Approved |
| `APC-BE-API-02` | Tích hợp kiểm thử tải mô phỏng Kiosk gửi punch đồng thời với Gatling. | Phát hiện sớm hiện tượng nghẽn luồng xử lý hoặc chậm trễ trên kênh WebSocket. | `NFR-BE-001`, `NFR-BE-002` | Approved |

---

## 3. API Test Items (Danh mục Ca Kiểm thử Hợp đồng API)

| ID | Tên Ca Kiểm thử | Covers Spec | Mức độ Test | Tiêu chí Đạt (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-API-001` | Kiểm thử Xác thực Đăng nhập & Refresh Token | `API-BE-001`, `API-BE-002` | Integration / Security | Đăng nhập đúng trả về 200 kèm JWT; đăng nhập sai trả về 401; refresh token hợp lệ cấp access token mới. | **Passed** |
| `TST-BE-API-002` | Kiểm thử Điểm danh Đơn lẻ & Gói Lô Kiosk | `API-BE-003`, `API-BE-004` | Contract / Integration | Gọi `/kiosk/punch` có `X-Kiosk-Id` hợp lệ trả về mã 200 trong $\le 100\text{ms}$; gọi không có header trả về 401. | **Passed** |
| `TST-BE-API-003` | Kiểm thử Tải Gallery & Đăng ký Mặt Mới | `API-BE-005` đến `API-BE-007` | Integration / Crypto | `/kiosk/gallery` trả về danh sách vector 512D chuẩn; `/kiosk/enroll-face` lưu vector mã hóa thành công. | **Passed** |
| `TST-BE-API-004` | Kiểm thử Kênh STOMP Broker & Topic Broadcasting | `API-BE-011` đến `API-BE-013` | Realtime / E2E | Client subscribe `/topic/live-attendance` nhận được bản tin JSON điểm danh ngay lập tức ($\le 50\text{ms}$). | **Passed** |

---

## 4. Defect Management (Quản lý Lỗi Giao diện API)

* Sai lệch cấu trúc trường JSON (Schema Mismatch) hoặc mã lỗi sai được xếp loại **Critical (P1)** và phải được chỉnh sửa đồng bộ giữa Backend và Client.
