# API DESIGN — Thiết kế Giao diện Truyền thông Phân hệ Backend

> **Mã tài liệu:** `DES-API-BE-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `backend-service`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết cấu trúc REST Controllers, DTOs, cơ chế xác thực và Spring STOMP Message Broker của Backend.

---

## 1. API Architecture Components (Thành phần Kiến trúc Giao tiếp)

| ID | Thành phần Kỹ thuật API | Định nghĩa & Trách nhiệm | Uses | Realizes | Quyết định | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APD-BE-001` | Kiosk REST Controller Layer | Đón nhận các request từ trạm Kiosk, kiểm tra Header `X-Kiosk-Id`, xử lý DTO `PunchRequest`, `SyncBatchRequest`. | `STK-011` | `API-BE-002` đến `API-BE-006` | `DD-APD-001` | Approved |
| `APD-BE-002` | Admin & Employee REST Controllers | Cung cấp các endpoint cho Web Portal (Báo cáo, Đăng nhập, Ký cam kết Consent), bảo vệ bằng Spring Security JWT. | `STK-011` | `API-BE-001`, `API-BE-007`, `API-BE-008`| `DD-APD-001` | Approved |
| `APD-BE-003` | Spring STOMP Message Broker Hub | Quản lý kết nối WebSocket `/ws-attendance`, xác thực kết nối qua JWT / Kiosk token, định tuyến tin nhắn tới topic. | `STK-012` | `API-BE-009` đến `API-BE-011` | `DD-SYS-004` | Approved |
| `APD-BE-004` | Global Exception & Validation Handler | Bắt lỗi dữ liệu đầu vào (`MethodArgumentNotValidException`), chuẩn hóa phản hồi lỗi theo chuẩn RFC 7807 (Problem Details). | `STK-011` | Toàn bộ API | `DD-APD-001` | Approved |

---

## 2. API Contract Payloads (Quy cách Cấu trúc Dữ liệu Chuẩn)

### 2.1. Request Tiếp nhận Điểm danh (`PunchRequest`)
```json
{
  "employeeId": 1042,
  "kioskId": "KSK-HN-01",
  "punchTimestamp": "2026-10-02T08:29:45+07:00",
  "punchType": "CHECK_IN",
  "verificationMethod": "VERIFICATION_FACE",
  "confidenceScore": 0.892
}
```

### 2.2. Payload Bản tin STOMP Live Attendance
```json
{
  "eventType": "ATTENDANCE_RECORDED",
  "employeeId": 1042,
  "employeeName": "Nguyễn Văn A",
  "department": "Phòng Kỹ thuật",
  "punchTimestamp": "2026-10-02T08:29:45+07:00",
  "punchType": "CHECK_IN",
  "status": "ON_TIME"
}
```
