# Phân Hệ Kiểm Thử Kiosk Desktop (`tests/desktop-kiosk/`)

> **Mã phân vùng:** `TESTS-DESKTOP-KIOSK`  
> **Cấp độ không gian:** Testing Sub-Hub  
> **Đường dẫn:** `tests/desktop-kiosk/`  
> **Ứng dụng mục tiêu:** `app/kiosk-app` (PySide6 / QML / Windows UIA3)  
> **Trách nhiệm cốt lõi:** Quản lý và thực thi toàn bộ các bài kiểm thử tự động hóa giao diện Kiosk (FlaUI UIA3) và kiểm thử hồi quy thị giác (Visual Snapshot & Scaling Matrix).

---

## 1. Cấu Trúc Nội Bộ

```text
desktop-kiosk/
├── config.py                  # Nhận diện động FlaUI CLI, Python Interpreter, thư mục báo cáo
├── automation/
│   └── run_flaui_e2e.py       # Kiểm thử hộp đen UIA3 bằng FlaUI (F1, F2, Space, Audit)
├── visual/
│   ├── run_snapshot_review.py # Trình tự động kết xuất 17 ảnh chuẩn Golden Baselines
│   ├── test_scaling_matrix.py # Kiểm định co giãn tỷ lệ trên 8 độ phân giải (FHD, 4K, Tablet)
│   └── test_visual_regression.py # So khớp ảnh và Zero-Leak Production Gate
└── README.md                  # Tài liệu hướng dẫn phân hệ
```

---

## 2. Hướng Dẫn Thực Thi

### Kiểm thử Hồi quy Thị giác (Visual Regression & Scaling Matrix):
```powershell
# 1. Chạy ma trận co giãn tỷ lệ (Scaling Matrix)
pytest tests/desktop-kiosk/visual/test_scaling_matrix.py -v

# 2. Kết xuất lại 17 ảnh chuẩn Golden Baselines (Local-Only)
python tests/desktop-kiosk/visual/run_snapshot_review.py

# 3. Kiểm định tính toàn vẹn và Zero-Leak Gate của các ảnh chuẩn
pytest tests/desktop-kiosk/visual/test_visual_regression.py -v
```

### Kiểm thử Tự động hóa Giao diện Windows (FlaUI UIA3 E2E):
```powershell
python tests/desktop-kiosk/automation/run_flaui_e2e.py
```

---

## 3. Chính Sách Dữ Liệu & Báo Cáo (Local-Only)
- Toàn bộ ảnh kết xuất và tệp báo cáo audit sinh ra đều được lưu cục bộ tại `tests/reports/desktop-kiosk/`.
- Tuân thủ nguyên tắc **Local-Only**: 100% nội dung sinh ra không đưa lên Git repository.
