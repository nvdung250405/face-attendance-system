# FR/NFR DESIGN — Thiết kế Kỹ thuật Phân hệ Backend

> **Mã tài liệu:** `DES-FR-BE-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `backend-service`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết các thành phần giải pháp kỹ thuật (`SOL-BE-`), luồng xử lý điểm danh và cơ chế bảo vệ dữ liệu sinh trắc học của Backend.

---

## 1. Solution Components & Architecture (Thành phần Kỹ thuật Backend)

| ID | Thành phần Kỹ thuật Backend | Định nghĩa & Trách nhiệm Giải pháp | Công nghệ (Uses) | Hiện thực hóa (Realizes) | Quyết định | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-BE-001` | Bộ Lọc Bảo mật & Xác thực JWT | Quản lý chuỗi lọc Security, phân tích Header `Authorization: Bearer <token>`, trích xuất Claims người dùng và gán SecurityContext. | `STK-011` | `FR-BE-001` | `DD-SYS-001` | Approved |
| `SOL-BE-002` | Dịch vụ Xử lý Điểm danh Cốt lõi | Tiếp nhận bản ghi từ Kiosk, thẩm định ca làm việc, tính toán trạng thái (On-time, Late, Early Leave) và lưu CSDL. | `STK-011`, `STK-013` | `FR-BE-002`, `NFR-BE-001` | `DD-SYS-001` | Approved |
| `SOL-BE-003` | Dịch vụ Đồng bộ Bù Ngoại tuyến | Xử lý giao dịch hàng loạt (Batch Processing) cho gói tối đa 50 bản ghi, sử dụng `UPSERT` / `ON CONFLICT DO NOTHING` chống trùng lặp. | `STK-013` | `FR-BE-003` | `DD-SYS-002` | Approved |
| `SOL-BE-004` | Dịch vụ Mã hóa Sinh trắc học | Đóng gói thuật toán AES-256-GCM với IV ngẫu nhiên 12-byte; mã hóa trước khi ghi và giải mã khi Kiosk tải gallery. | `STK-010` | `FR-BE-004`, `FR-BE-006` | `DD-SYS-003` | Approved |
| `SOL-BE-005` | Quản lý Vòng đời Đăng ký OTP | Sinh mã ngẫu nhiên 6 số, băm BCrypt lưu CSDL với hạn 48h; đối soát khi Kiosk gửi yêu cầu và phát sự kiện hoàn tất. | `STK-011` | `FR-BE-005`, `FR-BE-006` | `DD-SOL-003` | Approved |
| `SOL-BE-006` | Bộ Phát sóng Sự kiện STOMP | Tích hợp `SimpMessagingTemplate`, phát thông điệp tới topic tương ứng khi có điểm danh mới hoặc cập nhật khuôn mặt. | `STK-012` | `FR-BE-007` | `DD-SYS-004` | Approved |
| `SOL-BE-007` | Hệ thống Ghi vết Kiểm toán Bất biến | Spring AOP Interceptor tự động bắt các sự kiện thay đổi dữ liệu bảng nhạy cảm, lưu vào bảng `audit_logs`. | `STK-011`, `STK-013` | `FR-BE-008`, `NFR-BE-005` | `DD-SYS-001` | Approved |

---

## 2. Core Attendance Processing Flow (Luồng Xử lý Điểm danh Thời gian thực)

```text
Trạm Kiosk ──► [POST /api/v1/kiosk/punch] ──► [KioskAuthFilter (X-Kiosk-Id + Token)]
                                                         │
                                                         ▼
                                             [AttendanceService.processPunch()]
                                                         │
                 ┌───────────────────────────────────────┴───────────────────────────────────────┐
                 ▼                                                                               ▼
       [Truy vấn Ca làm việc]                                                          [Kiểm tra Khóa Trùng lặp]
                 │                                                                               │
                 ▼                                                                               ▼
     [Tính toán: Đi muộn / Về sớm]                                                   [Lưu bảng attendance_logs]
                 │                                                                               │
                 └───────────────────────────────────────┬───────────────────────────────────────┘
                                                         │
                                                         ▼
                                           [SimpMessagingTemplate.convertAndSend]
                                                         │
                                 ┌───────────────────────┴───────────────────────┐
                                 ▼                                               ▼
               [/topic/live-attendance (Web HR)]               [HTTP 200 OK phản hồi Kiosk (<=100ms)]
```
