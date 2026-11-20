# Phân Hệ Kiểm Thử Tích Hợp Cấp Hệ Thống (`tests/system-api/`)

> **Mã phân vùng:** `TESTS-SYSTEM-API`  
> **Cấp độ không gian:** Testing Sub-Hub  
> **Đường dẫn:** `tests/system-api/`  
> **Trách nhiệm cốt lõi:** Quản lý và thực thi toàn bộ kịch bản kiểm thử tích hợp liên dịch vụ (Cross-service Integration), kiểm tra hợp đồng REST API, WebSocket STOMP, cơ chế phân quyền RBAC và luồng nghiệp vụ 3 tầng (Web $\leftrightarrow$ Backend $\leftrightarrow$ PostgreSQL $\leftrightarrow$ Kiosk).

---

## 1. Cấu Trúc Nội Bộ

```text
system-api/
├── README.md              # Hướng dẫn chi tiết phân hệ
├── run_system_e2e.py      # Kịch bản kiểm thử thực tế toàn diện 34 test cases (TST-SYS-001..034)
└── fixtures/              # Dữ liệu mẫu (JSON mocks, seed payloads)
```

---

## 2. Hướng Dẫn Thực Thi

Yêu cầu cụm dịch vụ Backend và PostgreSQL đang chạy (qua Docker Compose hoặc `manage-services.ps1`):

```powershell
# 1. Đảm bảo hạ tầng đang chạy
.\scripts\manage-services.ps1 start
.\scripts\manage-services.ps1 seed

# 2. Thực thi kiểm thử tích hợp hệ thống
python tests/system-api/run_system_e2e.py
```

---

## 3. Chính Sách Dữ Liệu & Báo Cáo (Local-Only)
- Sau khi chạy, kết quả kiểm thử được tự động xuất ra `tests/reports/system-api/test-results.json`.
- Tuân thủ nguyên tắc **Local-Only**: Tệp kết quả chỉ lưu cục bộ, không đưa lên Git.
