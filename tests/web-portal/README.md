# Phân Hệ Kiểm Thử Cổng Web Portal (`tests/web-portal/`)

> **Mã phân vùng:** `TESTS-WEB-PORTAL`  
> **Cấp độ không gian:** Testing Sub-Hub  
> **Đường dẫn:** `tests/web-portal/`  
> **Ứng dụng mục tiêu:** `app/web-portal` (ReactJS / Vite / Tailwind / Playwright)  
> **Trách nhiệm cốt lõi:** Quản lý và điều phối toàn bộ các kịch bản kiểm thử tự động hóa đầu-cuối (E2E Functional Testing) và kiểm thử hồi quy thị giác đa thiết bị (Visual Regression & Responsive Testing).

---

## 1. Cấu Trúc Nội Bộ

```text
web-portal/
├── README.md                      # Hướng dẫn chi tiết phân hệ
├── playwright.config.ts           # Cấu hình Playwright cho Functional E2E
├── playwright.visual.config.ts    # Cấu hình Playwright cho Visual Regression
├── e2e/                           # Kịch bản kiểm thử luồng chức năng E2E
│   ├── 01-auth-rbac.spec.ts       # Xác thực & phân quyền (RBAC)
│   ├── 02-consent-onboarding.spec.ts # Ký cam kết bảo mật & cấp OTP
│   ├── 03-live-dashboard.spec.ts  # Bảng điều khiển WebSocket trực tiếp
│   ├── 04-shift-management.spec.ts # Phân ca & lịch làm việc
│   └── 05-excuse-and-payroll.spec.ts # Quản lý giải trình & bảng công
├── visual/                        # Pipeline kiểm thử giao diện trực quan & Gallery
│   ├── visual-responsive.spec.ts  # Playwright spec duyệt 67 màn hình / trạng thái
│   ├── runner.mjs                 # Trình điều phối chạy toàn diện (start server -> crawl -> gallery)
│   ├── server-manager.mjs         # Quản lý vòng đời Vite server cổng 5199
│   ├── crawler.mjs                # Bộ thực thi crawl chụp ảnh theo manifest
│   └── gallery-builder.mjs        # Trình sinh báo cáo HTML Visual Gallery trực quan
├── fixtures/
│   ├── mockApi.ts                 # Mock mạng & dữ liệu phiên đăng nhập
│   └── screens.manifest.json      # Bản kê 67 màn hình kiểm định
└── helpers/
    └── inTestAudit.ts             # Bộ đo kiểm Accessibility (WCAG), Layout & Token Audit
```

---

## 2. Lệnh Thực Thi

Các lệnh được liên kết trực tiếp trong `app/web-portal/package.json`:

```powershell
# Chuyển vào thư mục web-portal
cd app/web-portal

# 1. Chạy toàn bộ kịch bản E2E chức năng (Playwright)
npm run test:e2e

# 2. Chạy toàn bộ chu trình Visual Regression Pipeline (Server -> Crawl -> Gallery)
npm run test:ui

# 3. Chạy nhanh một màn hình hoặc nhóm cụ thể (VD: modal)
npm run test:ui:quick -- modal

# 4. Xuất lại báo cáo Visual Gallery HTML từ dữ liệu chụp hiện tại
npm run test:ui:gallery
```

---

## 3. Chính Sách Dữ Liệu & Báo Cáo (Local-Only)
- Mọi hình ảnh chụp, diffs so sánh, tệp `raw_results.json`, `audit_results.json` và `visual_gallery.html` được sinh ra tự động tại `tests/reports/web-portal/`.
- Tuân thủ nguyên tắc **Local-Only**: Toàn bộ kết quả kiểm thử chỉ lưu cục bộ, không đưa lên Git.
