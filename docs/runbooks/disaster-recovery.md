# Operational Runbook: Disaster Recovery & Backup Procedures

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Operational Runbook  
> **Primary Owner Skill:** `observability-and-instrumentation`  
> **Canonical Destination Path:** `docs/runbooks/disaster-recovery.md`  
> **Status:** Active  
> **Last updated:** 2026-11-08  

---

## 1. Mục Tiêu Phục Hồi Thảm Họa (Disaster Recovery Objectives)
- **RPO (Recovery Point Objective):** $\le 1\text{ giờ}$ cho dữ liệu CSDL máy chủ; $\text{RPO} = 0$ cho các trạm Kiosk (đệm SQLite WAL).
- **RTO (Recovery Time Objective):** $\le 30\text{ phút}$ để khôi phục toàn bộ dịch vụ Backend và CSDL.

---

## 2. Quy Trình Sao Lưu & Khôi Phục CSDL PostgreSQL

### 2.1. Sao Lưu Định Kỳ Hàng Ngày
```bash
# Sao lưu toàn bộ CSDL và cấu trúc bảng kèm dữ liệu vector đã mã hóa
docker exec -t fas-postgres pg_dump -U postgres -d fas_attendance -F c -b -v -f /backups/fas_attendance_$(date +%Y%m%d_%H%M%S).dump
```

### 2.2. Khôi Phục Sau Thảm Họa (Restore Procedure)
1. Dừng các dịch vụ ghi dữ liệu: `.\scripts\manage-services.ps1 stop backend`
2. Tạo CSDL sạch và khôi phục từ tệp dump gần nhất:
   ```bash
   docker exec -t fas-postgres dropdb -U postgres fas_attendance
   docker exec -t fas-postgres createdb -U postgres fas_attendance
   docker exec -t fas-postgres pg_restore -U postgres -d fas_attendance -v /backups/fas_attendance_TARGET.dump
   ```
3. Khởi động lại dịch vụ Backend và kiểm tra tính toàn vẹn: `.\scripts\manage-services.ps1 start backend`
4. Kiểm tra endpoint Actuator: `curl -s http://localhost:8080/actuator/health`

---

## 3. Khôi Phục Sự Cố Hỏng CSDL Kiosk (`kiosk_local.db`)

Trong trường hợp hiếm gặp khi đĩa cứng Kiosk bị hỏng logic:
1. Đóng tiến trình Kiosk.
2. Đổi tên tệp CSDL bị hỏng: `Move-Item kiosk_local.db kiosk_local_corrupted.db`.
3. Khởi động lại Kiosk: `python main.py`. Ứng dụng sẽ tự động sinh tệp `kiosk_local.db` mới tinh sạch và nạp lại Gallery từ máy chủ Backend qua lệnh: `POST /api/v1/kiosk/gallery/resync`.

