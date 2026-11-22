# Kịch bản Vận hành & Công cụ Tự động hóa (`scripts/`)

> **Mã phân vùng:** `WORKSPACE-SCRIPTS`  
> **Cấp độ không gian:** Parent Automation Hub  
> **Đường dẫn:** `scripts/`  
> **Không gian cha:** [`README.md`](../README.md) (Thư mục Gốc)  
> **Trách nhiệm cốt lõi (Single Responsibility):** Quản lý các công cụ tự động hóa hạ tầng (DevOps), kịch bản tải và xác thực mô hình AI ONNX cho Edge Kiosk.

---

## 1. Mục đích & Vai trò Công cụ

Thư mục `scripts/` chứa các kịch bản phụ trợ phục vụ môi trường phát triển và chuẩn bị tài nguyên nhị phân. Các tác vụ quản trị cụm container được thực hiện trực tiếp qua lệnh Docker Compose tiêu chuẩn.

---

## 2. Bản đồ Cấu trúc Nội bộ (Internal Layout)

| Kịch bản / Công cụ | Loại tệp | Trách nhiệm chi tiết | Lệnh thực thi mẫu |
|:---|:---|:---|:---|
| [**`setup/download_kiosk_models.py`**](setup/download_kiosk_models.py) | Python Downloader | Tải bộ 3 trọng số mô hình AI ONNX (YuNet, MiniFASNet, ArcFace) và xác thực checksum SHA-256 | `python scripts/setup/download_kiosk_models.py` |
| [**`verify_contracts.py`**](verify_contracts.py) | Contract Verifier | Kiểm định tính toàn vẹn và cú pháp của toàn bộ hợp đồng API, STOMP và JSON Schema | `python scripts/verify_contracts.py --dir contracts` |
| [**`check_sdlc_docs.py`**](check_sdlc_docs.py) | SDLC Doc Gate | Kiểm định tính toàn vẹn liên kết tài liệu, ma trận truy vết SRS-RTM, 8 feature specs và hợp đồng máy | `python scripts/check_sdlc_docs.py` |

> [!NOTE]
> **Tài nguyên Cơ sở Dữ liệu:** Toàn bộ tệp nạp dữ liệu mẫu (`seed-e2e-data.sql`) và kịch bản làm sạch (`clean-db-data.sql`) được quản lý tập trung tại [**`database/`**](../database/README.md).

---

## 3. Lệnh Vận Hành Hạ Tầng Chuẩn Quốc Tế (Docker Compose)

Toàn bộ dịch vụ được điều phối trực tiếp qua Docker Compose chuẩn (chạy thống nhất trên Windows, macOS, Linux):

```bash
# 1. Khởi động toàn bộ cụm dịch vụ (PostgreSQL, Backend Spring Boot, Web Portal)
docker compose up -d --build

# 2. Kiểm tra trạng thái các containers
docker compose ps

# 3. Theo dõi nhật ký log trực tiếp
docker compose logs -f --tail=100

# 4. Dừng toàn bộ hệ thống
docker compose stop

# 5. Dừng và giải phóng toàn bộ containers + volumes
docker compose down -v
```

---

## 4. Chính sách Dữ liệu & Quy tắc Git

* **Tài nguyên theo dõi (Tracked)**: Toàn bộ kịch bản mã nguồn `.py` trong thư mục này.
* **Tài nguyên bỏ qua (Ignored 100%)**: Các tệp trọng số nhị phân `*.onnx` (được lưu tại `apps/kiosk-app/resources/assets/models/`).
