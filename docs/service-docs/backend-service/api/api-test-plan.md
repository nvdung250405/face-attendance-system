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

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-BE-003` | Sử dụng MockMvc kết hợp RestAssured để kiểm thử tự động hợp đồng API. | Cho phép kiểm tra toàn diện cả tầng Web MVC (Validation, Serialization) và tích hợp HTTP thực thụ. | `STK-011`, `API-BE-001` | Accepted |
| `APC-BE-004` | Tích hợp kiểm thử tải mô phỏng Kiosk gửi punch đồng thời với Gatling. | Phát hiện sớm hiện tượng nghẽn luồng xử lý hoặc chậm trễ trên kênh WebSocket. | `NFR-BE-001`, `NFR-BE-002` | Accepted |

---

## 3. API Test Items (Danh mục Ca Kiểm thử Hợp đồng API)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-005` | Kiểm thử Xác thực Đăng nhập & Refresh Token | Kiểm tra xác thực `POST /auth/login` và cấp phát Access Token/Refresh Token. | `API-BE-001`, `API-BE-002` | `BLD-BE-005`, `BLD-BE-007` | Đăng nhập đúng trả về 200 kèm JWT; đăng nhập sai trả về 401; refresh token hợp lệ cấp access token mới. | Done |
| `TST-BE-006` | Kiểm thử Điểm danh Đơn lẻ & Gói Lô Kiosk | Kiểm tra tiếp nhận `POST /kiosk/punch` và `POST /kiosk/sync-batch`. | `API-BE-003`, `API-BE-004` | `BLD-BE-006` | Header `X-Kiosk-Id` hợp lệ trả về HTTP 200 trong $\le 100\text{ ms}$; thiếu header trả về 401. | Done |
| `TST-BE-007` | Kiểm thử Tải Gallery & Đăng ký Mặt Mới | Kiểm tra `GET /kiosk/gallery`, `/kiosk/verify-otp` và `POST /kiosk/enroll-face`. | `API-BE-005`, `API-BE-006`, `API-BE-007` | `BLD-BE-006` | `/kiosk/gallery` trả về danh sách vector 512D chuẩn; `/kiosk/enroll-face` lưu vector mã hóa thành công. | Done |
| `TST-BE-008` | Kiểm thử Kênh STOMP Broker & Topic Broadcasting | Kiểm tra đẩy tin tức thời qua `/topic/live-attendance` và `/topic/kiosk-gallery`. | `API-BE-012`, `API-BE-013`, `API-BE-014` | `BLD-BE-008` | Client subscribe `/topic/live-attendance` nhận được bản tin JSON điểm danh ngay lập tức ($\le 50\text{ ms}$). | Done |

---

## 4. Defect Management (Quản lý Lỗi Giao diện API)

* Sai lệch cấu trúc trường JSON (Schema Mismatch) hoặc mã lỗi sai được xếp loại **Critical (P1)** và phải được chỉnh sửa đồng bộ giữa Backend và Client.
