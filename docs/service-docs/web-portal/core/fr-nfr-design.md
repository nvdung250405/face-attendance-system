---
title: Web Portal FR/NFR Detailed Design
version: 1.0
status: Approved
owner: Web Lead & Frontend Architect
---

# FR/NFR DESIGN — Thiết kế Kỹ thuật Phân hệ Web Portal


## 1. Solution Components & Architecture (Thành phần Kỹ thuật Web Portal)

| ID | Thành phần Kỹ thuật Web | Định nghĩa & Trách nhiệm Giải pháp | Công nghệ (Uses) | Hiện thực hóa (Realizes) | Quyết định | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `SOL-WEB-001` | Lớp Quản lý Phiên & Định tuyến Bảo vệ | Quản lý trạng thái xác thực qua Zustand Auth Store, bộ điều hướng React Router phân luồng theo Role. | `STK-016` | `FR-WEB-001` | `DD-SYS-001` | Approved |
| `SOL-WEB-002` | Mô-đun Đăng ký Biometric Consent | Hiển thị điều khoản pháp lý, xử lý chữ ký điện tử, gọi API sinh OTP và lắng nghe WebSocket đóng Modal. | `STK-016`, `STK-017` | `FR-WEB-002` | `DD-SOL-003` | Approved |
| `SOL-WEB-003` | Dịch vụ Lắng nghe Sự kiện STOMP | Tích hợp thư viện `@stomp/stompjs` kết nối WebSocket, đăng ký topic `/topic/live-attendance` và `/topic/enrollment/{otp}`. | `STK-015` | `FR-WEB-003` | `DD-SYS-004` | Approved |
| `SOL-WEB-004` | Bảng Điều khiển Chấm công HR Trực tiếp | Hiển thị bảng dữ liệu nhân sự điểm danh theo thời gian thực với hiệu ứng chuyển động mượt mà khi có dòng mới. | `STK-016`, `STK-017` | `FR-WEB-003`, `FR-WEB-005` | `DD-SYS-001` | Approved |
| `SOL-WEB-005` | Động cơ Kết xuất Báo cáo Excel/PDF | Sử dụng thư viện phía máy trạm (`exceljs` / `jspdf`) tạo file báo cáo xuất dữ liệu tức thì từ dữ liệu bảng. | `STK-015` | `FR-WEB-006` | `DD-SYS-001` | Approved |

---

## 2. Real-time Live Attendance Sequence (Trình tự Cập nhật Chấm công Thời gian thực)

```text
Backend Server ──► [WS STOMP: /topic/live-attendance] ──► [useStompListener Hook]
                                                                   │
                                                                   ▼
[Cập nhật UI mượt mà] ◄── [Highlight dòng mới trong 3s] ◄── [Cập nhật Zustand Store]
```
