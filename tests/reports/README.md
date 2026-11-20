# Kho Báo Cáo Kiểm Thử & Dấu Vết Thực Thi (`tests/reports/`)

> **Mã phân vùng:** `WORKSPACE-TESTS-REPORTS`  
> **Cấp độ không gian:** Local Artifacts Hub  
> **Đường dẫn:** `tests/reports/`  
> **Không gian cha:** [`tests/README.md`](../README.md) (Testing Hub)  
> **Nguyên tắc cốt lõi:** **100% Local-Only**. Kho lưu trữ này chỉ phục vụ việc lưu trữ cục bộ các kết quả kiểm thử, ảnh chụp giao diện và báo cáo HTML trực quan trên máy developer. Tuyệt đối không commit tệp báo cáo hoặc ảnh chụp lên Git repository.

---

## 1. Cấu Trúc Báo Cáo Phân Hệ

Mọi tiến trình kiểm thử tự động đều xuất kết quả vào phân mục tương ứng:

```text
reports/
├── .gitkeep                   # Tệp duy nhất được Git theo dõi để giữ khung thư mục
├── README.md                  # Hướng dẫn quy ước lưu trữ
├── desktop-kiosk/             # Đầu ra của phân hệ Trạm Kiosk Desktop
│   ├── audit/
│   │   └── flaui_audit_report.json # Báo cáo kiểm toán trợ năng FlaUI UIA3
│   └── screenshots/
│       ├── baselines/         # 17 ảnh chụp giao diện chuẩn FHD dọc 9:16
│       ├── e2e/               # 4 ảnh minh chứng các bước điều khiển FlaUI
│       └── diffs/             # Ảnh sai lệch kết xuất khi test visual thất bại
├── web-portal/                # Đầu ra của phân hệ Cổng Web Portal
│   ├── audit_results.json     # Báo cáo đo kiểm chất lượng WCAG & token
│   ├── raw_results.json       # Kết quả thô từ Playwright runner
│   ├── visual_gallery.html    # Báo cáo Visual Gallery trực quan (mở bằng trình duyệt)
│   ├── baselines/             # Ảnh chuẩn màn hình Web Portal
│   ├── screenshots/           # Ảnh kết xuất của lần chạy hiện tại
│   ├── diffs/                 # Ảnh sai lệch pixel diffs
│   └── test-results/          # Traces & video ghi hình khi test fail
└── system-api/                # Đầu ra của phân hệ Kiểm thử Tích hợp Cấp Hệ thống
    └── test-results.json      # Báo cáo kết quả chi tiết 34 kịch bản kiểm thử API
```

---

## 2. Hướng Dẫn Xem Báo Cáo Trực Quan (Local Dev)

- **Xem Web Visual Gallery**:
  Mở trực tiếp tệp HTML bằng trình duyệt:
  ```powershell
  # Windows PowerShell
  Start-Process tests/reports/web-portal/visual_gallery.html
  ```
- **Xem Báo cáo Trợ năng Kiosk**:
  Đọc file JSON tại `tests/reports/desktop-kiosk/audit/flaui_audit_report.json`.
- **Xem Kết quả API System**:
  Đọc file JSON tại `tests/reports/system-api/test-results.json`.
