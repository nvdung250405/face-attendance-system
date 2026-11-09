# Kịch bản Vận hành & Công cụ Tự động hóa (`scripts/`)

> **Mã phân vùng:** `WORKSPACE-SCRIPTS`  
> **Cấp độ không gian:** Parent Automation Hub  
> **Đường dẫn:** `scripts/`  
> **Không gian cha:** [`README.md`](../README.md) (Thư mục Gốc)  
> **Trách nhiệm cốt lõi (Single Responsibility):** Quản lý toàn bộ kịch bản tự động hóa hạ tầng (DevOps), điều phối vòng đời dịch vụ qua Docker Compose, khởi tạo dữ liệu mẫu (Seeding), dọn dẹp cơ sở dữ liệu và tải trọng số mô hình AI.

---

## 1. Mục đích & Vai trò Công cụ

Thư mục `scripts/` đóng vai trò là "trạm điều khiển kỹ thuật" (Ops Control Panel) của dự án, giúp kỹ sư khởi chạy, nạp dữ liệu và kiểm tra hệ thống chỉ bằng các câu lệnh đơn giản mà không cần gõ các lệnh Docker phức tạp.

---

## 2. Bản đồ Cấu trúc Nội bộ (Internal Layout)

| Kịch bản / Công cụ | Loại tệp | Trách nhiệm chi tiết | Lệnh thực thi mẫu |
|:---|:---|:---|:---|
| [**`manage-services.ps1`**](manage-services.ps1) | PowerShell Orchestrator | Điều phối vòng đời hạ tầng Docker (Postgres, Backend, Web): `start`, `stop`, `status`, `logs`, `seed`, `down` | `.\scripts\manage-services.ps1 start` |
| [**`seed-e2e-data.sql`**](seed-e2e-data.sql) | SQL Fixtures | Bơm dữ liệu mẫu kiểm thử: 10 nhân viên, 3 ca làm việc chuẩn, danh mục trạm Kiosk và quyền quản trị | Tự động kích hoạt qua `manage-services.ps1 seed` |
| [**`clean-db-data.sql`**](clean-db-data.sql) | SQL Cleanup | Dọn sạch dữ liệu chấm công và bảng điểm danh phát sinh trong khi test, bảo toàn nguyên vẹn lược đồ bảng | Tự động kích hoạt qua `manage-services.ps1 clean-data` |
| [**`setup/download_kiosk_models.py`**](setup/download_kiosk_models.py) | Python Downloader | Tải bộ 3 trọng số mô hình AI ONNX (YuNet, MiniFASNet, ArcFace) và xác thực checksum | `python scripts/setup/download_kiosk_models.py` |

---

## 3. Cẩm nang Sử dụng PowerShell Script (`manage-services.ps1`)

```powershell
# 1. Khởi động toàn bộ cụm dịch vụ qua Docker (Postgres, Backend Spring Boot, Web Portal)
.\scripts\manage-services.ps1 start

# 2. Khởi động không cần build lại Docker images (chạy nhanh)
.\scripts\manage-services.ps1 start -NoBuild

# 3. Nạp dữ liệu mẫu thử nghiệm vào CSDL
.\scripts\manage-services.ps1 seed

# 4. Kiểm tra trạng thái sức khỏe các containers
.\scripts\manage-services.ps1 status

# 5. Theo dõi nhật ký log trực tiếp
.\scripts\manage-services.ps1 logs -Service backend
.\scripts\manage-services.ps1 logs -Service web

# 6. Dọn dẹp dữ liệu kiểm thử
.\scripts\manage-services.ps1 clean-data

# 7. Dừng toàn bộ hệ thống
.\scripts\manage-services.ps1 stop

# 8. Xóa sạch containers và toàn bộ volumes dữ liệu (Dọn sạch hoàn toàn)
.\scripts\manage-services.ps1 down -Volumes
```

---

## 4. Chính sách Dữ liệu & Quy tắc Git

* **Tài nguyên theo dõi (Tracked)**: Toàn bộ kịch bản `.ps1`, `.sql`, và `.py` trong thư mục này.
* **Tài nguyên bỏ qua (Ignored 100%)**: Các tệp trọng số nhị phân `*.onnx` (được lưu tại `app/kiosk-app/resources/assets/models/`).
