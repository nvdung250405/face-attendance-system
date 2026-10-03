---
title: Backend Service Documentation Hub
version: 2.0
status: Approved
owner: Backend Technical Lead
---

# TÀI LIỆU CẤP DỊCH VỤ — PHÂN HỆ MÁY CHỦ DOANH NGHIỆP (`backend-service`)


## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Máy chủ Doanh nghiệp** (`backend-service`) là trung tâm điều phối nghiệp vụ, xử lý dữ liệu và bảo mật toàn hệ thống. Được xây dựng trên nền tảng Java 21 LTS và Spring Boot, phân hệ cung cấp các dịch vụ REST API tốc độ cao, quản lý kết nối thời gian thực WebSocket STOMP, bảo vệ dữ liệu sinh trắc học và kiểm toán bất biến.

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Xác thực & Phân quyền (Security & RBAC)**: Xác thực không trạng thái qua JWT, phân quyền đa vai trò (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`) và xác thực máy trạm Kiosk.
* **Xử lý Nghiệp vụ Điểm danh (Core Attendance)**: Tiếp nhận chấm công trực tiếp và đồng bộ bù ngoại tuyến, đối chiếu ca kíp, tính toán đi trễ/về sớm.
* **Bảo vệ Dữ liệu Sinh trắc (Biometric Crypto)**: Quản lý mã hóa AES-256-GCM cho vector ArcFace, điều phối chu trình đăng ký khuôn mặt OTP 6 chữ số có hạn 48 giờ.
* **Truyền thông Thời gian thực (Real-time STOMP)**: Đẩy sự kiện chấm công lên Web Dashboard và phát sóng nạp nóng vector mới về trạm Kiosk.
* **Lưu trữ CSDL Trung tâm (Database & Migration)**: Quản lý CSDL PostgreSQL 16 qua Flyway Migration, hỗ trợ ghi log kiểm toán bất biến (Audit Trail).

---

## 2. Bản đồ Cấu trúc & Quy trình Kỹ nghệ Chuẩn hóa (Data $\rightarrow$ API)

Tuân thủ nghiêm ngặt quy trình kỹ nghệ dữ liệu làm gốc (**Data-First $\rightarrow$ API Contract $\rightarrow$ Implementation**) được quy định trong [docs/sdlc-docs.md](../../sdlc-docs.md):

```text
docs/service-docs/backend-service/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ Backend
├── foundation-setup-plan.md       # Thiết lập môi trường Java 21, Maven toolchain & cấu hình (FND-BE-)
├── build-plan.md                  # Kế hoạch xây dựng & tích hợp tổng thể phân hệ Backend (Aggregate, BLD-BE-)
│
├── data/                          # [BƯỚC 1: DATA] Mô hình thực thể, DDL PostgreSQL & Caching
│   ├── data-specs.md              # Đặc tả thực thể CSDL chi tiết từng trường & Enums (DATA-BE-)
│   ├── data-design.md             # Thiết kế DDL PostgreSQL 16, Indexing & Caffeine Cache (DTD-BE-)
│   ├── data-build-plan.md         # Kế hoạch thi công Flyway scripts & JPA Repositories (BLD-BE-)
│   └── data-test-plan.md          # Kế hoạch kiểm thử tính toàn vẹn CSDL & Migration (TST-BE-)
│
├── api/                           # [BƯỚC 2: API] Hợp đồng dữ liệu chi tiết từng trường REST & STOMP
│   ├── api-specs.md               # Đặc tả 11 REST endpoints & 3 STOMP topics (API-BE-)
│   ├── api-design.md              # Hợp đồng API chi tiết từng trường, validation & lỗi (APD-BE-)
│   ├── api-build-plan.md          # Kế hoạch thi công API Controllers & STOMP Broker (BLD-BE-)
│   └── api-test-plan.md           # Kế hoạch kiểm thử hợp đồng REST API & STOMP (TST-BE-)
│
├── fr-nfr/                        # [NGHIỆP VỤ CỐT LÕI] Logic điểm danh, bảo mật & mã hóa
│   ├── fr-nfr-specs.md            # Yêu cầu chức năng (FR-BE-) & phi chức năng (NFR-BE-)
│   ├── fr-nfr-design.md           # Thiết kế giải pháp nghiệp vụ & mã hóa sinh trắc (SOL-BE-)
│   ├── fr-nfr-build-plan.md       # Kế hoạch thi công module cốt lõi (BLD-BE-)
│   └── fr-nfr-test-plan.md        # Kế hoạch kiểm thử nghiệp vụ cốt lõi (TST-BE-)
│
└── [ui-ux/]                       # [KHÔNG ÁP DỤNG] Phân hệ Backend là headless service phi giao diện
```

> **Nguyên tắc kích hoạt Facet UI/UX**: Theo Mục 10 của `sdlc-docs.md`, nhánh `ui-ux/` chỉ được tạo khi service có giao diện tương tác trực tiếp với người dùng. Phân hệ `backend-service` là máy chủ cung cấp API (Headless API Provider), do đó nhánh `ui-ux/` không được kích hoạt. Toàn bộ trải nghiệm người dùng được quản lý độc lập tại `docs/service-docs/web-portal/ui-ux/` và `docs/service-docs/kiosk-app/ui-ux/`.

---

## 3. Danh mục Chi tiết Tập tin & Ma trận Truy vết (Traceability Matrix)

| Nhánh Facet | Tập tin Tài liệu | Mã Leaf | ID Prefix Sở hữu | Nguồn Tham chiếu Upstream |
| :--- | :--- | :---: | :---: | :--- |
| **Trang chủ** | [README.md](README.md) | `BE-HUB` | — | `docs/meta.md`, `system-docs/dds/dds.md` (`ARC-002`) |
| **Toàn Service** | [foundation-setup-plan.md](foundation-setup-plan.md) | `SVC-FSP` | `FND-BE-` | `system-docs/plans/foundation-setup-plan.md`, `tech-tool-stack.md` |
| **Toàn Service** | [build-plan.md](build-plan.md) | `SVC-BLD` | `BLD-BE-` | `data-build-plan.md`, `fr-nfr-build-plan.md`, `api-build-plan.md`, `foundation-setup-plan.md` |
| **Data (Bước 1)**| [data/data-specs.md](data/data-specs.md) | `SVC-SPEC`| `DATA-BE-` | `system-docs/srs/data-specs.md` (`DATA-SYS-001..015`) |
| **Data (Bước 1)**| [data/data-design.md](data/data-design.md) | `SVC-DES` | `DTD-BE-` | `data/data-specs.md`, `system-docs/dds/data-design.md` |
| **Data (Bước 1)**| [data/data-build-plan.md](data/data-build-plan.md) | `SVC-BLD` | `BLD-BE-` | `data/data-design.md` (`DTD-BE-001..004`) |
| **Data (Bước 1)**| [data/data-test-plan.md](data/data-test-plan.md) | `SVC-TST` | `TST-BE-` | `data/data-specs.md` (trực tiếp) |
| **API (Bước 2)** | [api/api-specs.md](api/api-specs.md) | `SVC-SPEC`| `API-BE-` | `system-docs/srs/api-specs.md` (`API-SYS-001..016`) |
| **API (Bước 2)** | [api/api-design.md](api/api-design.md) | `SVC-DES` | `APD-BE-` | `api/api-specs.md`, `data/data-design.md`, `system-docs/dds/api-design.md` |
| **API (Bước 2)** | [api/api-build-plan.md](api/api-build-plan.md) | `SVC-BLD` | `BLD-BE-` | `api/api-design.md` (`APD-BE-001..004`) |
| **API (Bước 2)** | [api/api-test-plan.md](api/api-test-plan.md) | `SVC-TST` | `TST-BE-` | `api/api-specs.md` (trực tiếp) |
| **FR/NFR** | [fr-nfr/fr-nfr-specs.md](fr-nfr/fr-nfr-specs.md) | `SVC-SPEC`| `FR-BE-`, `NFR-BE-` | `system-docs/srs/fr-nfr-specs.md` (`FR-SYS-`, `NFR-SYS-`) |
| **FR/NFR** | [fr-nfr/fr-nfr-design.md](fr-nfr/fr-nfr-design.md) | `SVC-DES` | `SOL-BE-` | `fr-nfr/fr-nfr-specs.md`, `system-docs/dds/fr-nfr-design.md` |
| **FR/NFR** | [fr-nfr/fr-nfr-build-plan.md](fr-nfr/fr-nfr-build-plan.md) | `SVC-BLD` | `BLD-BE-` | `fr-nfr/fr-nfr-design.md` (`SOL-BE-001..007`) |
| **FR/NFR** | [fr-nfr/fr-nfr-test-plan.md](fr-nfr/fr-nfr-test-plan.md) | `SVC-TST` | `TST-BE-` | `fr-nfr/fr-nfr-specs.md` (trực tiếp) |
