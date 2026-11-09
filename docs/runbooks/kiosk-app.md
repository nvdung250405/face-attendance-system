# Operational Runbook: Edge Kiosk Desktop (`kiosk-app`)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Operational Runbook  
> **Primary Owner Skill:** `observability-and-instrumentation`  
> **Canonical Destination Path:** `docs/runbooks/kiosk-app.md`  
> **Status:** Active  
> **Last updated:** 2026-11-08  

---

## 1. Service Overview & Health Signals
- **Tiến trình:** `python main.py` (PySide6 Desktop Application).
- **Cấu hình phần cứng tối thiểu:** CPU Intel Core i5/Ryzen 5 x64, 8GB RAM, Camera USB góc rộng $1080\text{p}$, Màn hình cảm ứng $1080\times 1920\text{ px}$.
- **Tệp CSDL cục bộ:** `kiosk_local.db` (SQLite WAL).
- **File nhật ký (Logs):** `logs/kiosk_app.log`.

---

## 2. Common Incidents & Diagnostic Triage

### Sự cố 1: Camera bị mất tín hiệu (Camera Disconnection / Frame Freeze)
- **Triệu chứng:** Khung Oval HUD hiển thị màu xám, camera không cập nhật hình ảnh.
- **Nguyên nhân:** Lỏng cáp USB camera hoặc cổng USB bị sleep do tính năng tiết kiệm điện của OS.
- **Các bước xử lý:**
  1. Kiểm tra kết nối vật lý của cáp USB camera.
  2. Xem log ứng dụng: `Get-Content logs/kiosk_app.log -Tail 50 | Select-String "Camera"`.
  3. Khởi động lại luồng camera nội bộ bằng phím tắt `Ctrl + R` (hoặc restart tiến trình Kiosk qua lệnh: `python main.py`).
  4. Vô hiệu hóa chế độ "USB selective suspend" trong Power Options của Windows.

### Sự cố 2: Đệm ngoại tuyến quá lớn do mất mạng kéo dài
- **Triệu chứng:** Biểu tượng mạng trên Kiosk hiển thị gạch đỏ (Offline), số lượng bản ghi đệm tăng cao.
- **Nguyên nhân:** Cáp mạng LAN bị rút hoặc switch tầng bị mất điện.
- **Các bước xử lý:**
  1. Kiểm tra kết nối mạng bằng lệnh: `Test-NetConnection -ComputerName 127.0.0.1 -Port 8080`.
  2. Kiosk vẫn cho phép điểm danh bình thường ($\text{RPO} = 0$).
  3. Khi mạng khôi phục, kiểm tra log đồng bộ bù: `Select-String "BatchSyncWorker" logs/kiosk_app.log`.
  4. Xác nhận số lượng bản ghi `PENDING` giảm về 0: `sqlite3 kiosk_local.db "SELECT count(*) FROM offline_punches WHERE status='PENDING';"`

### Sự cố 3: Bộ nhớ RAM Kiosk vượt quá 1.2 GB
- **Triệu chứng:** Giao diện có hiện tượng giật khung hình ($< 15\text{ fps}$).
- **Các bước xử lý:**
  1. Khởi động lại ứng dụng Kiosk để giải phóng RAM leak của OpenCV VideoCapture.
  2. Đảm bảo Kiosk được cấu hình tác vụ Task Scheduler tự động restart vào 03:00 AM hàng ngày.

