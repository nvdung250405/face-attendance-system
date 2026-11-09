# Kho Báo cáo Thực thi & Vết Kiểm toán (`reports/`)

> **Mã phân vùng:** `WORKSPACE-REPORTS`  
> **Cấp độ không gian:** Parent Artifacts Hub  
> **Đường dẫn:** `reports/`  
> **Không gian cha:** [`README.md`](../README.md) (Thư mục Gốc)  
> **Trách nhiệm cốt lõi (Single Responsibility):** Quản lý tập trung toàn bộ dữ liệu đầu ra sinh ra trong quá trình kiểm thử, bao gồm kho ảnh mẫu giao diện (Golden Baselines), ảnh vết thực thi E2E tự động, báo cáo kiểm toán trợ năng (FlaUI UIA3 Audit), và kết quả đo độ phủ mã nguồn (Coverage).

---

## 1. Mục đích & Vai trò Kho Lưu trữ

Thư mục `reports/` là ranh giới cô lập giữa **Mã nguồn (`app/`)**, **Tài liệu (`docs/`)** và **Kết quả Thực thi (`reports/`)**:
* Trả lại cho `docs/` sự tinh gọn (chỉ chứa văn bản, đặc tả, biểu đồ kiến trúc; không bị phình to bởi tệp nhị phân).
* Trả lại cho `app/` sự trong sạch (chỉ chứa mã nguồn ứng dụng và unit tests; không chứa báo cáo tự động).

---

## 2. Bản đồ Cấu trúc Nội bộ (Internal Layout)

| Thư mục / Tệp | Loại tài nguyên | Trách nhiệm chi tiết | Nguồn sinh ra |
|:---|:---|:---|:---|
| [**`screenshots/baselines/`**](screenshots/baselines/) | PNG Images (17 files) | Kho ảnh chụp giao diện chuẩn FHD dọc 9:16 ($1080 \times 1920\text{ px}$) làm thước đo so sánh hồi quy | Sinh ra bởi `tests/visual/run_ui_review.py` |
| [**`screenshots/e2e/`**](screenshots/e2e/) | PNG Images (4 files) | Ảnh chụp màn hình làm bằng chứng nghiệm thu các bước điều khiển hệ điều hành tự động qua FlaUI | Sinh ra bởi `tests/e2e/desktop/run_flaui_e2e.py` |
| [**`audit/flaui_audit_report.json`**](audit/flaui_audit_report.json) | JSON Report | Báo cáo kiểm toán chất lượng selector, cây UI AutomationId và tiêu chuẩn trợ năng Windows | Sinh ra bởi lệnh `flaui audit` |
| [**`test-results/`**](test-results/) | XML / HTML / JSON | Thư mục đầu ra cho báo cáo kiểm thử tự động JUnit XML, lcov/html coverage reports | Sinh ra bởi `pytest --junitxml` / `mvn test` |

---

## 3. Chính sách Dữ liệu & Quy tắc Git (Data & Git Policy)

* **Tài nguyên theo dõi (Tracked)**:
  - Bộ 17 ảnh mẫu chuẩn tại `reports/screenshots/baselines/` (đóng vai trò Golden Baseline để CI/CD so sánh pixel diff).
  - Tệp báo cáo kiểm toán `reports/audit/flaui_audit_report.json` làm chứng chỉ nghiệm thu chất lượng UI.
* **Tài nguyên bỏ qua (Ignored 100%)**:
  - Thư mục ảnh sai lệch tạm thời: `reports/screenshots/diffs/`.
  - Kết quả kiểm thử động tạm thời: `reports/test-results/` (được `.gitignore` tự động bỏ qua để không gây xung đột git khi chạy test cục bộ).
