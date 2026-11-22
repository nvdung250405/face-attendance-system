# Chuẩn Thiết Kế Giao Tiếp API Toàn Cục (Global API Architecture)

> **Cấp độ:** Toàn cục (Global)  
> **Mã tài liệu:** `DOC-DESIGN-API`  
> **Trạng thái:** [APPROVED]  
> **Quy chuẩn tuân thủ:** RESTful API, RFC 9457 (Problem Details for HTTP APIs), STOMP over WebSocket.

---

## 1. Nguyên Tắc Định Danh & Phiên Bản Hóa (URI Versioning)

- **Cấu trúc Base URL:** `/api/v1/<resource>`
- **Quy ước Danh từ số nhiều:** Sử dụng danh từ số nhiều ở dạng kebab-case cho resources (ví dụ: `/api/v1/attendance-logs`, `/api/v1/employee-shifts`, `/api/v1/data-subject-requests`).
- **Phân tách Ranh giới Actor:**
  - `/api/v1/admin/*`: Các endpoint quản trị yêu cầu quyền `ROLE_ADMIN` hoặc `ROLE_HR`.
  - `/api/v1/employee/*`: Các endpoint tự phục vụ cho nhân viên (`ROLE_EMPLOYEE`).
  - `/api/v1/kiosk/*`: Các endpoint dành riêng cho trạm Kiosk với cơ chế xác thực thiết bị.
  - `/api/v1/auth/*`: Các endpoint công khai (Login, Refresh, Logout, Recovery).

---

## 2. Chuẩn Bao Gói Phản Hồi & Xử Lý Lỗi (RFC 9457)

### A. Phản Hồi Thành Công Chuẩn (Standard Success Envelope)
Áp dụng lớp bọc `ApiResponse<T>` nhất quán:
```json
{
  "code": "ATTENDANCE_PUNCH_RECORDED",
  "message": "Ghi nhận điểm danh thành công",
  "data": { ... },
  "timestamp": "2026-11-22T19:20:00Z"
}
```

### B. Chuẩn Báo Lỗi RFC 9457 `ProblemDetails`
Mọi ngoại lệ hệ thống và validation bắt buộc đi qua `@RestControllerAdvice` trả về `ProblemDetails`:
```json
{
  "type": "https://fas.local/errors/validation-failed",
  "title": "Dữ liệu đầu vào không hợp lệ",
  "status": 400,
  "detail": "Trường periodYear không được để trống",
  "instance": "/api/v1/admin/payroll-periods",
  "invalidParams": [
    {
      "name": "periodYear",
      "reason": "Phải là năm hợp lệ từ 2020 trở đi"
    }
  ]
}
```

---

## 3. Xác Thực & Kiểm Soát Truy Cập (Authentication & RBAC)

- **Truyền Token:** Chuẩn `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
- **Cơ chế Token Kiosk:** Mã bí mật Kiosk Secret Token chỉ lưu trong RAM trạm Kiosk và cache backend, không truyền lộ lọt ra client web.
- **Phân quyền tại Service/Controller:** Sử dụng `@PreAuthorize("hasRole('ADMIN')")` hoặc `@PreAuthorize("hasAnyRole('ADMIN', 'HR')")` trên 100% endpoint nhạy cảm.

---

## 4. Giao Thức WebSocket STOMP (Realtime Event Feed)

- **Broker Endpoint:** `/ws-attendance` với giao thức STOMP SockJS fallback.
- **Các Channel Đăng Ký:**
  - `/topic/live-attendance`: Phát sóng sự kiện điểm danh thời gian thực tới HR Dashboard ($\le 200\text{ ms}$).
  - `/topic/enrollment/{otp}`: Phát tín hiệu đăng ký mẫu khuôn mặt thành công tới Kiosk trạm.
  - `/topic/kiosk-gallery`: Đồng bộ danh mục mẫu khuôn mặt RAM tới các trạm Kiosk.
- **Bảo mật Frame:** STOMP CONNECT frame bắt buộc kèm header `Authorization: Bearer <token>`.

---

## 5. Rào Chắn Chống Tấn Công Lặp & Tải Đỉnh (Rate Limiting & Cooldown)

- **Buffer Cooldown 120 giây:** Trạm Kiosk và Backend phối hợp từ chối các lượt quẹt liên tiếp của cùng một nhân viên trong vòng 120s (`DUPLICATE_PUNCH_IGNORED`).
- **Giới hạn số lần thử PIN:** Khóa trạm 15 phút nếu nhập sai mã PIN 5 lần liên tiếp (chống tấn công Brute-force theo ADR-005, NFR-SYS-008).
