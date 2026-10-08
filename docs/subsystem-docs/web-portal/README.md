---
title: Web Portal Documentation Hub
version: 3.0
status: Approved
owner: Web Technical Lead & Frontend Architect
type: hub
scope: WEB
updated: 2026-10-08
---

# TÀI LIỆU CẤP PHÂN HỆ — PHÂN HỆ CỔNG WEB QUẢN TRỊ & NGƯỜI DÙNG (`web-portal`)

## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Cổng Web Quản trị & Người dùng** (`web-portal`) là ứng dụng web hiện đại (Single Page Application - SPA) được phát triển bằng React 19, TypeScript và Tailwind CSS 4 trên nền tảng Vite 8. Phân hệ cung cấp không gian làm việc số tập trung cho hai nhóm đối tượng: Quản lý Nhân sự (HR Manager) / Quản trị viên (ADMIN) và Cán bộ Nhân viên Doanh nghiệp (Employee).

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Cổng Thông tin Kép (Dual-Role Portal & Role Guards)**: Phân quyền điều hướng tự động dựa trên JWT Claims giữa giao diện Quản trị Chấm công (HR/ADMIN) và Không gian Cá nhân (Nhân viên), bảo vệ toàn bộ các tuyến đường (Protected Routes).
* **Quản lý Trạng thái & Lưu trữ Client (Data Facet)**: Quản lý phiên xác thực an toàn qua `SafeLocalStorage` (`fas_auth_session`), cô lập tiến trình ký cam kết pháp lý trong `SafeSessionStorage` (`fas_consent_session`), đồng bộ phiên đa tab qua sự kiện `storage`, và bộ đệm truy vấn hiệu năng cao qua TanStack Query Cache.
* **Giao tiếp Hai chiều (API Facet)**: Kết nối RESTful API qua Axios Client tích hợp bộ chặn tự động làm mới Token chống Race Condition (Mutex Refresh Queue) khi gặp HTTP 401; duy trì kết nối WebSocket STOMP (`/topic/live-attendance`, `/topic/enrollment/{otp}`) nhận thông báo trực tiếp.
* **Trải nghiệm Người dùng Hiện đại (UI/UX Facet)**: Hệ thống Design Tokens phong cách Indigo Clean SaaS, bảng chấm công thời gian thực có hiệu ứng chớp sáng (Green Flash 1.5s), quy trình ký cam kết pháp lý (Nghị định 13/2023/NĐ-CP) cấp mã OTP 6 số hạn 48 giờ kèm mã QR, và lịch biểu công cá nhân dạng Calendar Grid.

---

## 2. Bản đồ Tài liệu Phân hệ Web Portal (sdlc-docs.md v3.x)

Tuân thủ cấu trúc tài liệu hợp nhất theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §3 & §7), cấu trúc thư mục của phân hệ `web-portal` được chuẩn hóa thành 2 thư mục cốt lõi `specs/` và `plans/`:

```text
docs/subsystem-docs/web-portal/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ Web Portal
│
├── specs/                         # Bộ tài liệu đặc tả & thiết kế kỹ thuật hợp nhất
│   ├── spec.md                    # Kiến trúc lõi, SPA React 19, Vite 8, layered model & quyết định kỹ thuật DD-WEB-
│   ├── fr-nfr.md                  # Nghiệp vụ chức năng (FR-WEB-), phi chức năng (NFR-WEB-), giải pháp (SOL-WEB-)
│   ├── data.md                    # Lưu trữ client, Safe Storage, TypeScript contracts & TanStack Query (DATA-WEB-, DTD-WEB-)
│   ├── api.md                     # Hợp đồng RESTful API & STOMP Broker, Mutex Refresh Queue (API-WEB-, APD-WEB-)
│   └── ui-ux.md                   # Trải nghiệm Indigo Clean SaaS, Admin Shell, Consent Modal & Tokens (UI-WEB-, UXD-WEB-)
│
└── plans/                         # Kế hoạch thực thi kỹ thuật & kiểm thử phân hệ
    ├── foundation-setup-plan.md   # Thiết lập môi trường Node.js 24, Vite 8, React 19 & TypeScript (FND-WEB-)
    ├── build-plan.md              # Kế hoạch xây dựng & tích hợp tổng thể phân hệ Web Portal (BLD-WEB-)
    ├── task-plan.md               # Kế hoạch thi công chi tiết từng Task theo DAG và Waves (TASK-WEB-)
    └── test-plan.md               # Kế hoạch kiểm thử tổng thể phân hệ Web Portal (TST-WEB-)
```

---

## 3. Danh mục Chi tiết Tập tin & Ma trận Truy vết (Traceability Matrix)

| Nhánh Tài liệu | Tập tin | Mã Leaf | ID Prefix Sở hữu | Nguồn Tham chiếu Upstream |
| :--- | :--- | :---: | :---: | :--- |
| **Trang chủ** | [README.md](README.md) | `WEB-HUB` | — | `docs/meta.md`, `system-docs/specs/spec.md` (`ARC-003`) |
| **Lõi Phân hệ** | [specs/spec.md](specs/spec.md) | `WEB-SPEC` | `DD-WEB-` | `system-docs/specs/spec.md` (`ARC-003`, `DD-SYS-001..028`) |
| **FR/NFR Facet** | [specs/fr-nfr.md](specs/fr-nfr.md) | `WEB-FRNFR`| `FR-WEB-`, `NFR-WEB-`, `SOL-WEB-` | `system-docs/specs/fr-nfr.md` (`FR-SYS-`, `NFR-SYS-`, `SOL-SYS-`) |
| **Data Facet** | [specs/data.md](specs/data.md) | `WEB-DATA` | `DATA-WEB-`, `DTD-WEB-` | `system-docs/specs/spec.md` (`DD-SYS-003`, `DD-SYS-004`) |
| **API Facet** | [specs/api.md](specs/api.md) | `WEB-API` | `API-WEB-`, `APD-WEB-` | `system-docs/specs/spec.md` (`DD-SYS-001`, `DD-SYS-004`) |
| **UI/UX Facet** | [specs/ui-ux.md](specs/ui-ux.md) | `WEB-UIUX` | `UI-WEB-`, `UXD-WEB-` | `system-docs/specs/spec.md` (`DD-SYS-003`, `DD-SYS-004`) |
| **Kế hoạch Nền tảng** | [plans/foundation-setup-plan.md](plans/foundation-setup-plan.md) | `WEB-FSP` | `FND-WEB-` | `system-docs/plans/foundation-setup-plan.md` |
| **Kế hoạch Xây dựng** | [plans/build-plan.md](plans/build-plan.md) | `WEB-BLD` | `BLD-WEB-` | `plans/foundation-setup-plan.md`, `specs/spec.md` |
| **Kế hoạch Task** | [plans/task-plan.md](plans/task-plan.md) | `WEB-TSK` | `TASK-WEB-` | `plans/build-plan.md` |
| **Kế hoạch Kiểm thử** | [plans/test-plan.md](plans/test-plan.md) | `WEB-TST` | `TST-WEB-` | `specs/fr-nfr.md`, `specs/data.md`, `specs/api.md`, `specs/ui-ux.md` |
