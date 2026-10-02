# TÀI LIỆU CẤP DỊCH VỤ — PHÂN HỆ CỔNG WEB QUẢN TRỊ & NGƯỜI DÙNG (`web-portal`)

> **Mã phân hệ:** `SVC-WEB`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved / Canonical  
> **Hệ thống chủ quản:** [face-attendance-system](../../system-docs/dds/dds.md)  
> **Định vị kiến trúc:** `ARC-SYS-003` (Cổng Thông tin Kép — Dual Web Portal)

---

## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Cổng Web Quản trị & Người dùng** (`web-portal`) là ứng dụng web hiện đại (Single Page Application - SPA) được phát triển bằng React 18/19, TypeScript và Tailwind CSS. Phân hệ cung cấp không gian làm việc số cho hai nhóm đối tượng: Quản lý Nhân sự (HR Manager) và Cán bộ Nhân viên Doanh nghiệp (Employee).

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Cổng Thông tin Kép (Dual-Role Portal)**: Phân quyền điều hướng tự động dựa trên JWT Claims giữa giao diện Quản trị Chấm công (HR) và Không gian Cá nhân (Nhân viên).
* **Quản lý Trạng thái & Lưu trữ Client (Data Facet)**: Quản lý phiên xác thực bền vững qua LocalStorage, lưu trữ tiến trình ký cam kết qua SessionStorage và bộ đệm truy vấn hiệu năng cao qua TanStack Query Cache.
* **Giao tiếp Hai chiều (API Facet)**: Kết nối REST API qua Axios Client tích hợp bộ chặn tự động làm mới Token chống Race Condition và kết nối WebSocket STOMP nhận thông báo trực tiếp.
* **Trải nghiệm Người dùng Hiện đại (UI/UX Facet)**: Thiết kế Tailwind Tokens Indigo SaaS, bảng chấm công thời gian thực có hiệu ứng chớp sáng, quy trình ký cam kết pháp lý (Nghị định 13/2023) cấp mã OTP/QR và lịch biểu công cá nhân.

---

## 2. Bản đồ 4 Nhánh Facet Tài liệu Phân hệ Web Portal

Tuân thủ cấu trúc tài liệu cấp dịch vụ quy định tại [docs/sdlc-docs.md](../../sdlc-docs.md) và triển khai theo quy trình phụ thuộc kỹ nghệ **DATA $\rightarrow$ API $\rightarrow$ UI/UX**:

```text
docs/service-docs/web-portal/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ Web Portal
│
├── core/                          # [Bắt buộc] Khối quản lý trạng thái, routing & nghiệp vụ client
│   ├── fsp.md                     # Thiết lập môi trường Node.js, Vite & TypeScript
│   ├── fr-nfr-specs.md            # Yêu cầu chức năng (FR-WEB-) & phi chức năng (NFR-WEB-)
│   ├── fr-nfr-design.md           # Thiết kế kiến trúc SPA & quản lý phiên (SOL-WEB-)
│   ├── fr-nfr-build-plan.md       # Kế hoạch thi công module cốt lõi (CBL-WEB-)
│   └── test-plan.md               # Kế hoạch kiểm thử nội bộ phân hệ (TST-WEB-)
│
├── data/                          # [Bước 1: DATA] Lưu trữ Client Storage & TanStack Query Cache
│   ├── data-specs.md              # Đặc tả thực thể lưu trữ Local/Session & Query Cache (DATA-WEB-)
│   ├── data-design.md             # Thiết kế TypeScript contracts, Storage Adapter & Cache keys (DTD-WEB-)
│   └── data-build-plan.md         # Kế hoạch thi công tầng dữ liệu client (DBL-WEB-)
│
├── api/                           # [Bước 2: API] Giao tiếp REST API & WebSocket STOMP
│   ├── api-specs.md               # Đặc tả các interface tiêu thụ & STOMP topics (API-WEB-)
│   ├── api-design.md              # Thiết kế chi tiết từng trường, Refresh Interceptor & Hooks (APD-WEB-)
│   └── api-build-plan.md          # Kế hoạch thi công tầng truyền thông (ABL-WEB-)
│
└── ui-ux/                         # [Bước 3: UI/UX] Giao diện người dùng Web Responsive & Design Tokens
    ├── ui-ux-specs.md             # Đặc tả hành trình người dùng & tương tác Web (UI-WEB-)
    ├── ui-ux-design.md            # Thiết kế Design Tokens Tailwind, layout components & modals (UXD-WEB-)
    └── ui-ux-build-plan.md        # Kế hoạch thi công giao diện React (UBL-WEB-)
```

---

## 3. Danh mục Chi tiết Tập tin & Ma trận Truy vết (Traceability Matrix)

| Nhánh Facet | Tập tin Tài liệu | Mã Leaf | ID Prefix Sở hữu | Nguồn Tham chiếu Upstream |
| :--- | :--- | :---: | :---: | :--- |
| **Trang chủ** | [README.md](README.md) | `WEB-HUB` | — | `docs/meta.md`, `system-docs/dds/dds.md` (`ARC-SYS-003`) |
| **Core** | [core/fsp.md](core/fsp.md) | `SVC-FSP` | `FND-WEB-` | `system-docs/plans/foundation-setup-plan.md`, `tech-tool-stack.md` |
| **Core** | [core/fr-nfr-specs.md](core/fr-nfr-specs.md) | `SVC-SPEC`| `FR-WEB-`, `NFR-WEB-` | `system-docs/srs/fr-nfr-specs.md` (`FR-SYS-001..006`) |
| **Core** | [core/fr-nfr-design.md](core/fr-nfr-design.md) | `SVC-DES` | `SOL-WEB-` | `core/fr-nfr-specs.md`, `system-docs/dds/fr-nfr-design.md` |
| **Core** | [core/fr-nfr-build-plan.md](core/fr-nfr-build-plan.md) | `SVC-BLD` | `CBL-WEB-` | `core/fr-nfr-design.md` (`SOL-WEB-001..006`) |
| **Core** | [core/test-plan.md](core/test-plan.md) | `SVC-TST` | `TST-WEB-` | `core/fr-nfr-specs.md` (trực tiếp) |
| **Data** | [data/data-specs.md](data/data-specs.md) | `SVC-SPEC`| `DATA-WEB-` | `system-docs/srs/data-specs.md` (`DATA-SYS-001..003`) |
| **Data** | [data/data-design.md](data/data-design.md) | `SVC-DES` | `DTD-WEB-` | `data/data-specs.md`, `system-docs/dds/data-design.md` |
| **Data** | [data/data-build-plan.md](data/data-build-plan.md) | `SVC-BLD` | `DBL-WEB-` | `data/data-design.md` (`DTD-WEB-001..003`) |
| **API** | [api/api-specs.md](api/api-specs.md) | `SVC-SPEC`| `API-WEB-` | `system-docs/srs/api-specs.md` (`API-SYS-001..003`) |
| **API** | [api/api-design.md](api/api-design.md) | `SVC-DES` | `APD-WEB-` | `api/api-specs.md`, `system-docs/dds/api-design.md` |
| **API** | [api/api-build-plan.md](api/api-build-plan.md) | `SVC-BLD` | `ABL-WEB-` | `api/api-design.md` (`APD-WEB-001..003`) |
| **UI/UX** | [ui-ux/ui-ux-specs.md](ui-ux/ui-ux-specs.md) | `SVC-SPEC`| `UI-WEB-` | `system-docs/srs/ui-ux-specs.md` (`UI-SYS-001..003`) |
| **UI/UX** | [ui-ux/ui-ux-design.md](ui-ux/ui-ux-design.md) | `SVC-DES` | `UXD-WEB-` | `ui-ux/ui-ux-specs.md`, `system-docs/dds/ui-ux-design.md` |
| **UI/UX** | [ui-ux/ui-ux-build-plan.md](ui-ux/ui-ux-build-plan.md) | `SVC-BLD` | `UBL-WEB-` | `ui-ux/ui-ux-design.md` (`UXD-WEB-001..005`) |
