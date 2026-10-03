---
title: Web Portal FR/NFR Detailed Design
version: 1.0
status: Approved
owner: Web Lead & Frontend Architect
---

# FR/NFR DESIGN — Thiết kế Kỹ thuật Phân hệ Web Portal


## 1. Solution Components & Architecture (Thành phần Kỹ thuật Web Portal)

| ID | Name | Definition | Uses | Realizes | Decisions | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-WEB-001` | AuthSessionManager | Quản lý trạng thái xác thực qua Zustand Auth Store, bộ điều hướng React Router phân luồng theo Role và lưu trữ an toàn. | `STK-016` | `FR-WEB-001` | `DD-SYS-001` | Accepted |
| `SOL-WEB-002` | ConsentModule | Hiển thị điều khoản pháp lý, xử lý chữ ký điện tử, gọi API sinh OTP và lắng nghe WebSocket đóng Modal. | `STK-016`, `STK-017` | `FR-WEB-002` | `DD-SYS-003` | Accepted |
| `SOL-WEB-003` | StompEventListener | Tích hợp thư viện `@stomp/stompjs` kết nối WebSocket, đăng ký topic `/topic/live-attendance` và `/topic/enrollment/{otp}`. | `STK-015` | `FR-WEB-003`, `NFR-WEB-003` | `DD-SYS-004` | Accepted |
| `SOL-WEB-004` | LiveDashboardController | Hiển thị bảng dữ liệu nhân sự điểm danh theo thời gian thực với hiệu ứng chuyển động mượt mà khi có dòng mới. | `STK-016`, `STK-017` | `FR-WEB-003`, `FR-WEB-005` | `DD-SYS-004` | Accepted |
| `SOL-WEB-005` | ReportExportEngine | Sử dụng thư viện phía máy trạm (`exceljs` / `jspdf`) tạo file báo cáo xuất dữ liệu tức thì từ dữ liệu bảng. | `STK-015` | `FR-WEB-006` | `DD-SYS-001` | Accepted |

---

## 2. Real-time Live Attendance Sequence (Trình tự Cập nhật Chấm công Thời gian thực)

```text
Backend Server ──► [WS STOMP: /topic/live-attendance] ──► [useStompListener Hook]
                                                                   │
                                                                   ▼
[Cập nhật UI mượt mà] ◄── [Highlight dòng mới trong 3s] ◄── [Cập nhật Zustand Store]
```
