---
name: Báo cáo sự cố (Bug Report)
about: Tạo báo cáo lỗi kỹ thuật hoặc nghiệp vụ để sửa chữa và hoàn thiện hệ thống FAS
title: '[BUG]: '
labels: ['bug']
assignees: ['nvdung250405']
---

### 1. Phân hệ phát sinh lỗi
- [ ] `app/kiosk-app` (Trạm Kiosk / AI Camera / PySide6 / SQLite)
- [ ] `app/backend-service` (Máy chủ Spring Boot / PostgreSQL / WebSocket STOMP)
- [ ] `app/web-portal` (Cổng Web ReactJS / Dashboard / Timesheets)
- [ ] `infrastructure` (Docker Compose, Network, Nginx, CSDL)

### 2. Mô tả sự cố
Mô tả ngắn gọn, rõ ràng về hiện tượng lỗi phát sinh.

### 3. Các bước tái hiện (Steps to Reproduce)
1. Mở phân hệ '...'
2. Thực hiện thao tác '...'
3. Nhập dữ liệu '...'
4. Quan sát lỗi xảy ra tại bước '...'

### 4. Hành vi thực tế vs Hành vi kỳ vọng
- **Hành vi thực tế (Actual Behavior)**: Điều gì đã xảy ra (ví dụ: ứng dụng văng lỗi, không nhận diện được mặt, API trả về 500...).
- **Hành vi kỳ vọng (Expected Behavior)**: Hệ thống nên hoạt động như thế nào theo đặc tả [DDS.md](../../docs/design/DDS.md) hoặc [FR.md](../../docs/requirements/FR.md).

### 5. Dữ liệu lỗi & Nhật ký (Logs / Screenshots)
- Đính kèm ảnh chụp màn hình, video ngắn hoặc mã lỗi hiển thị (nếu có).
- Đoạn trích nhật ký lỗi liên quan (từ `application.log`, `kiosk_runtime.log` hoặc console trình duyệt):
```text
(Dán nội dung log lỗi vào đây)
```

### 6. Môi trường phát sinh
- Hệ điều hành: Windows 11 / Ubuntu 22.04
- Phiên bản Runtime: Java 21 / Python 3.14 / Node.js 24
- Thiết bị camera (đối với Kiosk): Webcam tích hợp / Camera USB UVC
- Trình duyệt (đối với Web Portal): Chrome / Edge / Firefox

### 7. Mức độ nghiêm trọng
- [ ] **Blocker**: Chặn hoàn toàn tiến trình phát triển hoặc vận hành hệ thống.
- [ ] **Critical**: Lỗi bảo mật, mất mát dữ liệu hoặc sai lệch thuật toán sinh trắc học.
- [ ] **Major**: Tính năng chính không hoạt động nhưng có giải pháp dự phòng tạm thời.
- [ ] **Minor**: Lỗi giao diện nhỏ, lỗi hiển thị câu chữ không ảnh hưởng logic.
