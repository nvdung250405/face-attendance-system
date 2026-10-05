---
title: Metadata & Quy ước Quản trị Bộ tài liệu SDLC
version: 2.0
status: Approved
owner: Lead System Architect
---

# META — Metadata & Quy ước Quản trị Bộ tài liệu SDLC

Tài liệu này xác lập cấu trúc cây tài liệu thực tế, danh mục đăng ký (Registry), quy ước định danh (Conventions), hệ thống schema chuẩn hóa, quy tắc kiểm tra chất lượng (Quality Gates) và cơ chế truy vết (Traceability) cho toàn bộ hệ thống tài liệu SDLC của dự án **Face Attendance System (FAS)** ở cả hai cấp độ: **System-level** và **Service-level**, tuân thủ chuẩn khung quy định tại [docs/sdlc-docs.md](sdlc-docs.md).

---

## 1. Document Tree (Cây Cấu trúc Tài liệu Thực tế)

```text
docs/
│
├── meta.md                                      # Metadata và quy ước quản trị của toàn bộ bộ tài liệu.
├── sdlc-docs.md                                 # Framework chuẩn khung hướng dẫn SDLC.
│
├── system-docs/                                 # [CẤP HỆ THỐNG] Phát triển theo chiều ngang
│   ├── info.md                                  # Kho nghiên cứu, sự thật và bằng chứng về đề tài
│   ├── tech-tool-stack.md                       # Công nghệ, framework, runtime, nền tảng và công cụ dự án
│   ├── pi.md                                    # Khởi tạo dự án: mục tiêu, phạm vi, định hướng và quyết định
│   │
│   ├── srs/                                     # Phân hệ Đặc tả Yêu cầu Hệ thống
│   │   ├── srs.md                               # Ngữ cảnh hệ thống (ACT-, EXT-) và yêu cầu xuyên suốt (SRS-)
│   │   ├── fr-nfr-specs.md                      # Yêu cầu chức năng (FR-SYS-) và phi chức năng (NFR-SYS-)
│   │   ├── ui-ux-specs.md                       # Đặc tả hành trình người dùng và tương tác cấp hệ thống (UI-SYS-)
│   │   ├── api-specs.md                         # Đặc tả giao diện/interface liên hệ thống trung lập (API-SYS-)
│   │   └── data-specs.md                        # Đặc tả thực thể, tính toàn vẹn và vòng đời dữ liệu (DATA-SYS-)
│   │
│   ├── dds/                                     # Phân hệ Thiết kế Chi tiết Hệ thống
│   │   ├── dds.md                               # Kiến trúc tổng thể, ranh giới phân rã service và topology (ARC-)
│   │   ├── fr-nfr-design.md                     # Thiết kế hiện thực các giải pháp chức năng & chất lượng (SOL-SYS-)
│   │   ├── ui-ux-design.md                      # Thiết kế design system, tokens, bố cục chung (UXD-SYS-)
│   │   ├── api-design.md                        # Thiết kế chi tiết giao thức REST/STOMP, schema liên dịch vụ (APD-SYS-)
│   │   └── data-design.md                       # Thiết kế lược đồ CSDL quan hệ, lưu trữ và luồng đồng bộ (DTD-SYS-)
│   │
│   └── plans/                                   # Phân hệ Kế hoạch Cấp Hệ thống
│       ├── project-plan.md                      # Kế hoạch tổng thể, giai đoạn, mốc (PRJ-) và rủi ro (RSK-)
│       ├── foundation-setup-plan.md             # Kế hoạch chuẩn bị nền tảng chung toàn hệ thống (FND-SYS-)
│       ├── build-plan.md                        # Kế hoạch xây dựng & tích hợp xuyên phân hệ (BLD-SYS-)
│       ├── test-plan.md                         # Kế hoạch kiểm thử tích hợp & nghiệm thu hệ thống (TST-SYS-)
│       └── deploy-plan.md                       # Kế hoạch phát hành, triển khai môi trường và dự phòng (DPL-SYS-)
│
└── service-docs/                                # [CẤP DỊCH VỤ] Phát triển theo chiều dọc (Vertical Slices)
    │
    ├── backend-service/                         # Phân hệ Máy chủ Doanh nghiệp (Java 21, Spring Boot, PostgreSQL)
    │   ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Backend
    │   ├── foundation-setup-plan.md             # Foundation Setup Plan riêng của Backend (FND-BE-)
    │   ├── task-plan.md                         # Kế hoạch phân rã thi công, thứ tự dependency & wave (TASK-BE-)
    │   ├── fr-nfr/                              # [Bắt buộc] Nghiệp vụ máy chủ & Bảo mật
    │   │   ├── fr-nfr-specs.md                  # Yêu cầu nghiệp vụ chấm công, bảo mật (FR-BE-, NFR-BE-)
    │   │   ├── fr-nfr-design.md                 # Thiết kế component, cơ chế mã hóa AES (SOL-BE-)
    │   │   ├── fr-nfr-build-plan.md             # Kế hoạch thi công nghiệp vụ Backend & Integration (BLD-BE-009..017)
    │   │   └── fr-nfr-test-plan.md              # Kế hoạch kiểm thử nghiệp vụ Backend (TST-BE-009..019)
    │   ├── data/                                # [Kích hoạt] Quản lý lưu trữ CSDL trung tâm
    │   │   ├── data-specs.md                    # Thực thể CSDL PostgreSQL, quy tắc toàn vẹn (DATA-BE-)
    │   │   ├── data-design.md                   # Lược đồ DDL PostgreSQL 16 8 bảng, chỉ mục (DTD-BE-)
    │   │   ├── data-build-plan.md               # Kế hoạch migration CSDL và cấu hình cache (BLD-BE-001..004)
    │   │   └── data-test-plan.md                # Kế hoạch kiểm thử CSDL và toàn vẹn dữ liệu (TST-BE-001..004)
    │   └── api/                                 # [Kích hoạt] Cung cấp REST API & STOMP Broker
    │       ├── api-specs.md                     # Đặc tả 11 REST Endpoints & 3 STOMP Topics (API-BE-)
    │       ├── api-design.md                    # Thiết kế chi tiết từng trường payload, Controller (APD-BE-)
    │       ├── api-build-plan.md                # Kế hoạch thi công API Controllers & STOMP (BLD-BE-005..008)
    │       └── api-test-plan.md                 # Kế hoạch kiểm thử hợp đồng API (TST-BE-005..008)
    │
    ├── kiosk-app/                               # Phân hệ Trạm Điểm danh Cận biên (Python 3, PySide6, OpenCV)
    │   ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Kiosk
    │   ├── foundation-setup-plan.md             # Foundation Setup Plan riêng của Kiosk (FND-KSK-)
    │   ├── task-plan.md                         # Kế hoạch phân rã thi công, thứ tự dependency & wave (TASK-KSK-)
    │   ├── fr-nfr/                              # [Bắt buộc] Pipeline Thị giác Máy tính & AI Biên
    │   │   ├── fr-nfr-specs.md                  # Yêu cầu phát hiện mặt, liveness, so khớp (FR-KSK-, NFR-KSK-)
    │   │   ├── fr-nfr-design.md                 # Thiết kế pipeline YuNet, MiniFASNet, ArcFace (SOL-KSK-)
    │   │   ├── fr-nfr-build-plan.md             # Kế hoạch thi công pipeline thị giác biên (BLD-KSK-013..017)
    │   │   └── fr-nfr-test-plan.md              # Kế hoạch kiểm thử thị giác máy tính và AI (TST-KSK-017..021)
    │   ├── data/                                # [Kích hoạt] CSDL ngoại tuyến SQLite WAL & Ma trận RAM
    │   │   ├── data-specs.md                    # Thực thể SQLite offline_punches, GalleryMatrix (DATA-KSK-)
    │   │   ├── data-design.md                   # Lược đồ SQLite WAL, Cosine Matcher, Atomic Swap (DTD-KSK-)
    │   │   ├── data-build-plan.md               # Kế hoạch thi công CSDL cục bộ và RAM matrix (BLD-KSK-001..004)
    │   │   └── data-test-plan.md                # Kế hoạch kiểm thử CSDL cục bộ và ma trận (TST-KSK-001..005)
    │   ├── api/                                 # [Kích hoạt] Tiêu thụ REST API & Lắng nghe STOMP
    │   │   ├── api-specs.md                     # Đặc tả giao diện tiêu thụ và topic lắng nghe (API-KSK-)
    │   │   ├── api-design.md                    # Thiết kế HTTP Client httpx, Offline Sync, STOMP (APD-KSK-)
    │   │   ├── api-build-plan.md                # Kế hoạch thi công tầng mạng và sync worker (BLD-KSK-009..012)
    │   │   └── api-test-plan.md                 # Kế hoạch kiểm thử truyền thông mạng Kiosk (TST-KSK-011..016)
    │   └── ui-ux/                               # [Kích hoạt] Màn hình Cảm ứng Dọc 9:16 (Figma 1080x1920)
    │       ├── ui-ux-specs.md                   # Hành trình điểm danh, máy trạng thái Oval 4 màu (UI-KSK-)
    │       ├── ui-ux-design.md                  # Design Tokens, tỷ lệ co giãn S, hình học vector (UXD-KSK-)
    │       ├── ui-ux-build-plan.md              # Kế hoạch thi công giao diện QML (BLD-KSK-005..008)
    │       └── ui-ux-test-plan.md               # Kế hoạch kiểm thử giao diện và tương tác chạm (TST-KSK-006..010)
    │
    └── web-portal/                              # Phân hệ Cổng Web Quản trị & Người dùng (React, TypeScript)
        ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Web Portal
        ├── foundation-setup-plan.md             # Foundation Setup Plan riêng của Web Portal (FND-WEB-)
        ├── task-plan.md                         # Kế hoạch phân rã thi công, thứ tự dependency & wave (TASK-WEB-)
        ├── fr-nfr/                              # [Bắt buộc] Định tuyến, Phân quyền & Quản lý Phiên
        │   ├── fr-nfr-specs.md                  # Yêu cầu quản trị phân quyền, giám sát (FR-WEB-, NFR-WEB-)
        │   ├── fr-nfr-design.md                 # Thiết kế SPA architecture, Auth guards (SOL-WEB-)
        │   ├── fr-nfr-build-plan.md             # Kế hoạch thi công khung nghiệp vụ client (BLD-WEB-012..016)
        │   └── fr-nfr-test-plan.md              # Kế hoạch kiểm thử nghiệp vụ và định tuyến (TST-WEB-013..018)
        ├── data/                                # [Kích hoạt] Lưu trữ Trình duyệt & TanStack Query Cache
        │   ├── data-specs.md                    # Thực thể Local/SessionStorage, Query Cache (DATA-WEB-)
        │   ├── data-design.md                   # TypeScript contracts, Storage Adapter, Cache keys (DTD-WEB-)
        │   ├── data-build-plan.md               # Kế hoạch thi công tầng dữ liệu máy trạm (BLD-WEB-001..003)
        │   └── data-test-plan.md                # Kế hoạch kiểm thử lưu trữ client và cache (TST-WEB-001..004)
        ├── api/                                 # [Kích hoạt] Tiêu thụ REST API & Lắng nghe STOMP
        │   ├── api-specs.md                     # Đặc tả 6 REST Endpoints & 2 STOMP Topics tiêu thụ (API-WEB-)
        │   ├── api-design.md                    # Thiết kế Axios Client, Mutex Refresh Interceptor (APD-WEB-)
        │   ├── api-build-plan.md                # Kế hoạch thi công Axios client và STOMP hooks (BLD-WEB-009..011)
        │   └── api-test-plan.md                 # Kế hoạch kiểm thử giao tiếp mạng Web (TST-WEB-009..012)
        └── ui-ux/                               # [Kích hoạt] Giao diện Web Responsive Đa màn hình
            ├── ui-ux-specs.md                   # Hành trình người dùng, quy trình ký cam kết OTP (UI-WEB-)
            ├── ui-ux-design.md                  # Tailwind Tokens Indigo SaaS, Admin Shell, Modals (UXD-WEB-)
            ├── ui-ux-build-plan.md              # Kế hoạch thi công giao diện React/Tailwind (BLD-WEB-004..008)
            └── ui-ux-test-plan.md               # Kế hoạch kiểm thử giao diện và độ phản hồi (TST-WEB-005..008)
```

---

## 2. Document Registry (Sổ Đăng ký Tài liệu Toàn hệ thống)

### 2.1. Cấp Hệ thống (System-Level Registry)

| Leaf Document | Trả lời Câu hỏi | Upstream | Downstream | Điều kiện Áp dụng |
| :--- | :--- | :--- | :--- | :---: |
| `system-docs/info.md` | Ta biết gì: sự thật, bằng chứng và phân tích? | Nguồn khảo sát ngoài (`SRC-`) | PI, SRS, Specs | Bắt buộc |
| `system-docs/pi.md` | Làm gì, trong phạm vi nào, quyết định cấp dự án gì? | INFO | STACK, SRS, Project Plan | Bắt buộc |
| `system-docs/tech-tool-stack.md` | Dùng công nghệ, framework, công cụ và nền tảng nào? | INFO, PI | DDS, FSP, Plans | Bắt buộc |
| `system-docs/srs/srs.md` | Ngữ cảnh hệ thống và yêu cầu xuyên suốt? | PI, INFO | Specs, DDS | Bắt buộc |
| `system-docs/srs/fr-nfr-specs.md` | Hệ thống phải làm gì (FR) và đạt mức chất lượng nào (NFR)? | SRS, PI | DDS, Test Plan | Bắt buộc |
| `system-docs/srs/ui-ux-specs.md` | Người dùng trải nghiệm và tương tác với hệ thống thế nào? | SRS, FR-NFR | UI Design, Test Plan | Có UI |
| `system-docs/srs/api-specs.md` | Hệ thống giao tiếp qua các ranh giới/interface nào? | SRS, FR-NFR | API Design, Test Plan | Có API |
| `system-docs/srs/data-specs.md` | Thực thể dữ liệu, toàn vẹn và vòng đời dữ liệu ra sao? | SRS, FR-NFR | Data Design, Test Plan| Có dữ liệu |
| `system-docs/dds/dds.md` | Kiến trúc tổng thể, ranh giới phân rã service thế nào? | SPEC, STACK, PI | Service Docs, Plans | Bắt buộc |
| `system-docs/dds/fr-nfr-design.md` | Các requirement FR/NFR được hiện thực bằng giải pháp nào? | SPEC, DDS | Build Plan | Bắt buộc |
| `system-docs/dds/ui-ux-design.md` | Hệ thống giao diện được hiện thực bằng cấu trúc/token nào? | UI Spec, DDS | Build Plan | Có UI |
| `system-docs/dds/api-design.md` | Các interface được hiện thực bằng giao thức/schema nào? | API Spec, DDS | Build Plan | Có API |
| `system-docs/dds/data-design.md` | Mô hình dữ liệu được hiện thực bằng cấu trúc lưu trữ nào? | Data Spec, DDS | Build Plan | Có CSDL |
| `system-docs/plans/project-plan.md` | Khi nào, ai làm, rủi ro nào, theo lifecycle nào? | PI, các Plan | — | Bắt buộc |
| `system-docs/plans/foundation-setup-plan.md` | Chuẩn bị nền tảng chung nào để build bắt đầu? | STACK, DDS | Build Plan, Service FSP| Bắt buộc |
| `system-docs/plans/build-plan.md` | Xây dựng và tích hợp hệ thống theo thứ tự nào? | DDS, Design leaves | Quá trình Build | Bắt buộc |
| `system-docs/plans/test-plan.md` | Kiểm chứng yêu cầu hệ thống bằng cách nào? | Specs (trực tiếp) | Quá trình Test | Bắt buộc |
| `system-docs/plans/deploy-plan.md` | Phát hành và đưa hệ thống vào vận hành thế nào? | DDS (Topology), STACK | Quá trình Deploy | Bắt buộc |

---

### 2.2. Cấp Dịch vụ (Service-Level Registry)

Áp dụng quy tắc ma trận **chiều dọc** quy định tại Mục 2.1 & Mục 10 của `sdlc-docs.md`: Mỗi facet khi tồn tại **bắt buộc phải có đủ bộ tứ 4 leaf** (`specs → design → build-plan → test-plan`). Ở gốc mỗi `service-docs/` có thêm hai leaf toàn service: `foundation-setup-plan.md` và `task-plan.md`.

| Leaf Type | Tên Tệp Chuẩn | Trách nhiệm Kỹ thuật | Upstream | Downstream |
| :--- | :--- | :--- | :--- | :--- |
| **Foundation (Toàn service)** | `foundation-setup-plan.md` | Kế hoạch chuẩn bị môi trường, công cụ riêng của service | System Foundation Plan, STACK | Task Plan |
| **Task Plan (Toàn service)** | `task-plan.md` | Gom BLD-/FND-, phân rã thành TASK-, giải quyết dependency xuyên facet và nhóm wave thực thi | Các facet build plan, Foundation | Quá trình Build (TASK-) |
| **FR/NFR Specs** | `fr-nfr/fr-nfr-specs.md` | Năng lực nghiệp vụ và chất lượng thuộc trách nhiệm service | System Specs, ARC- | FR/NFR Design, Test Plan |
| **FR/NFR Design** | `fr-nfr/fr-nfr-design.md` | Cấu trúc component, logic và cơ chế chất lượng service | FR/NFR Specs, STACK | FR/NFR Build Plan |
| **FR/NFR Build** | `fr-nfr/fr-nfr-build-plan.md` | Kế hoạch thi công nghiệp vụ service & sở hữu Integration xuyên facet | FR/NFR Design, Foundation | Task Plan |
| **FR/NFR Test** | `fr-nfr/fr-nfr-test-plan.md` | Kế hoạch kiểm thử nghiệp vụ cốt lõi của service | FR/NFR Specs | Quá trình Test |
| **Data Specs** | `data/data-specs.md` | Thực thể dữ liệu, quy tắc toàn vẹn, vòng đời của service | System Data Spec, ARC- | Data Design, Data Test |
| **Data Design** | `data/data-design.md` | Lược đồ CSDL, cấu trúc bảng, chỉ mục, migration của service | Data Specs, STACK | Data Build Plan |
| **Data Build** | `data/data-build-plan.md` | Kế hoạch khởi tạo CSDL, migration và lưu trữ của service | Data Design, Foundation | Task Plan |
| **Data Test** | `data/data-test-plan.md` | Kế hoạch kiểm thử tầng dữ liệu và lưu trữ của service | Data Specs | Quá trình Test |
| **API Specs** | `api/api-specs.md` | Ranh giới giao tiếp, interface cung cấp/tiêu thụ của service | System API Spec, ARC- | API Design, API Test |
| **API Design** | `api/api-design.md` | Endpoint, schema dữ liệu, client wrapper, sequence của service | API Specs, STACK | API Build Plan |
| **API Build** | `api/api-build-plan.md` | Kế hoạch thi công các client/controller giao tiếp của service | API Design, Foundation | Task Plan |
| **API Test** | `api/api-test-plan.md` | Kế hoạch kiểm thử hợp đồng giao tiếp của service | API Specs | Quá trình Test |
| **UI/UX Specs** | `ui-ux/ui-ux-specs.md` | Tác vụ người dùng, luồng tương tác, phản hồi của service | System UI Spec, ARC- | UI Design, UI Test |
| **UI/UX Design**| `ui-ux/ui-ux-design.md` | Design tokens, layout, tỷ lệ co giãn, hình học của service | UI Specs, STACK | UI Build Plan |
| **UI/UX Build** | `ui-ux/ui-ux-build-plan.md` | Kế hoạch thi công giao diện của service | UI Design, Foundation | Task Plan |
| **UI/UX Test** | `ui-ux/ui-ux-test-plan.md` | Kế hoạch kiểm thử giao diện và tương tác người dùng | UI Specs | Quá trình Test |

---

## 3. Conventions & Standards (Quy chuẩn Quản lý & Định danh)

### 3.1. Document Control & Front Matter
Mọi tệp tài liệu trong cây SDLC bắt buộc bắt đầu bằng khối YAML Front Matter chuẩn:

```yaml
---
title: <tên leaf>
version: <MAJOR.MINOR>
status: Draft | In Review | Approved | Baselined | Deprecated
owner: <vai trò chịu trách nhiệm>
---
```
* **Lịch sử thay đổi**: Quản lý hoàn toàn qua Git VCS; không chèn bảng Revision History thủ công trong file.
* **Quy tắc tăng phiên bản**: `MINOR` tăng khi cập nhật, làm rõ; `MAJOR` tăng khi thay đổi lớn về ngữ nghĩa của tài liệu đã Approved.

---

### 3.2. Cú pháp Định danh & Danh mục Tiền tố (ID Scheme)

Định dạng chuẩn: `<TYPE>-<SCOPE>-<NNN>` (có scope) hoặc `<TYPE>-<NNN>` (không scope, cấp dự án duy nhất).

| Tiền tố | Phân loại Phần tử | Leaf Sở hữu | Scope |
| :--- | :--- | :--- | :---: |
| `RQ-` | Câu hỏi nghiên cứu khảo sát | `system-docs/info.md` | Không |
| `SRC-` | Nguồn khảo sát nghiên cứu | `system-docs/info.md` | Không |
| `INF-` | Phát hiện / Sự thật khoa học | `system-docs/info.md` | Không |
| `ANL-` | Phân tích & Hàm ý nghiên cứu | `system-docs/info.md` | Không |
| `GAP-` | Khoảng trống tri thức | `system-docs/info.md` | Không |
| `PD-` | Quyết định khởi tạo dự án | `system-docs/pi.md` | Không |
| `STK-` | Phần tử công nghệ / Công cụ | `system-docs/tech-tool-stack.md` | Không (`Applies to`) |
| `ACT-` | Tác nhân người dùng | `system-docs/srs/srs.md` | Không |
| `EXT-` | Hệ thống / Phần cứng bên ngoài | `system-docs/srs/srs.md` | Không |
| `SRS-` | Yêu cầu hệ thống xuyên suốt | `system-docs/srs/srs.md` | Không |
| `FR-` | Yêu cầu chức năng | `*/fr-nfr-specs.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `NFR-` | Yêu cầu phi chức năng (Chất lượng) | `*/fr-nfr-specs.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `UI-` | Đặc tả tương tác người dùng | `*/ui-ux-specs.md` | Có (`SYS`, `KSK`, `WEB`) |
| `API-` | Đặc tả interface / hợp đồng | `*/api-specs.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `DATA-` | Đặc tả dữ liệu | `*/data-specs.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `ARC-` | Phần tử kiến trúc & Topology | `system-docs/dds/dds.md` | Không |
| `SOL-` | Giải pháp thiết kế nghiệp vụ | `*/fr-nfr-design.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `UXD-` | Thiết kế giao diện & tokens | `*/ui-ux-design.md` | Có (`SYS`, `KSK`, `WEB`) |
| `APD-` | Thiết kế API chi tiết | `*/api-design.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `DTD-` | Thiết kế dữ liệu chi tiết | `*/data-design.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `DD-` | Quyết định thiết kế (Design Decision) | Mọi leaf design | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `APC-` | Quyết định cách tiếp cận (Approach) | Mọi leaf plan | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `PRJ-` | Giai đoạn / Mốc / Cổng dự án | `system-docs/plans/project-plan.md` | Không |
| `ROL-` | Vai trò dự án | `system-docs/plans/project-plan.md` | Không |
| `RSK-` | Rủi ro dự án | `system-docs/plans/project-plan.md` | Không |
| `FND-` | Công việc chuẩn bị nền tảng | `*/foundation-setup-plan.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `BLD-` | Công việc thi công / Build | `system-docs/plans/build-plan.md`, `*-build-plan.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `TASK-`| Nhiệm vụ thi công thực tế cấp service | `*/task-plan.md` | Có (`BE`, `KSK`, `WEB`) |
| `TST-` | Ca kiểm thử / Test item | `*/test-plan.md`, `*-test-plan.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `DPL-` | Công việc triển khai / Vận hành | `system-docs/plans/deploy-plan.md` | Có (`SYS` only, `DPL-SYS-`) |

> *Quy tắc Dãy số Thống nhất (Section 12, line 1015)*: Mỗi cặp `(TYPE, SCOPE)` có một dãy số duy nhất, dùng chung giữa các leaf cùng prefix. Ví dụ: toàn bộ work item thi công trong các build plan facet của phân hệ Backend sử dụng chung một dãy thống nhất `BLD-BE-001..`, toàn bộ task thi công sử dụng `TASK-BE-001..`, tương tự cho `TST-BE-001..`, `BLD-KSK-001..`, `TASK-KSK-001..`, `TST-KSK-001..`. Không đặt tiền tố tùy tiện theo facet.

---

### 3.3. Các Bảng Schema Chuẩn hóa Toàn Hệ thống

* **Research Questions Schema (`info.md`)**:
  ```text
  ID | Question | Serves | Status
  ```
* **Source Register Schema (`info.md`)**:
  ```text
  ID | Citation | Type | Published | Accessed | Reliability | Location | Status
  ```
* **Findings Schema (`info.md`)**:
  ```text
  ID | Statement | Type | Topic | Derived from | Confidence | Answers | Implication | Conflicts with | Status
  ```
* **Analysis Schema (`info.md`)**:
  ```text
  ID | Analysis | Derived from | Impacts | Status
  ```
* **Research Gaps Schema (`info.md`)**:
  ```text
  ID | Kind | Missing knowledge | Refers to | Blocks | Resolution | Status
  ```
* **Spec Schema (`*-specs.md`)**:
  ```text
  ID | Statement | Category | Priority | Basis | Acceptance | Status
  ```
* **Design Elements Schema (`*-design.md`)**:
  ```text
  ID | Name | Definition | Uses | Realizes | Decisions | Status
  ```
* **Decisions Schema (`PD-`, `DD-`, `APC-`)**:
  ```text
  ID | Decision | Rationale | Alternatives | Consequences | Basis | Status
  ```
* **Project Phase / Milestone / Gate Schema (`project-plan.md`)**:
  ```text
  ID | Name | Type | Includes | Depends on | Target | Estimate | Owner | Exit criteria | Status
  ```
* **Project Role Schema (`project-plan.md`)**:
  ```text
  ID | Role | Responsibilities | Required Skills | Assigned To / Staffing | Allocation | Status
  ```
* **Project Risk Schema (`project-plan.md`)**:
  ```text
  ID | Risk Statement | Probability | Impact | Severity | Mitigation Strategy | Contingency Plan | Owner | Status
  ```
* **Work Items Schema (`system-docs/plans/build-plan.md`, `*-build-plan.md`, `foundation-setup-plan.md`, `deploy-plan.md`)**:
  ```text
  ID | Name | Description | Covers | Depends on | Done when | Status
  ```
* **Tasks Schema (`service-docs/task-plan.md`)**:
  ```text
  ID | Name | Description | Derived from | Depends on | Wave | Done when | Status
  ```
* **Test Items Schema (`*-test-plan.md`)**:
  ```text
  ID | Name | Description | Covers | Level / Category | Done when | Status
  ```
* **Stack Schema (`tech-tool-stack.md`)**:
  ```text
  ID | Category | Name | Version | Applies to | Role | Basis | Requires | Status
  ```

---

## 4. Traceability & Ownership (Quy tắc Truy vết & Quyền sở hữu)

### 4.1. Nguyên tắc Đơn sở hữu (Single Ownership)
> **Mỗi nội dung kỹ thuật chỉ có đúng một Leaf làm Owner duy nhất. Mọi tài liệu khác bắt buộc tham chiếu qua mã ID, tuyệt đối không sao chép nội dung.**

### 4.2. Từ điển Trường Quan hệ Truy vết (Trace Fields)
* `Basis`: Căn cứ upstream của Spec, Decision, STACK, Risk. Trỏ tới `INF-`, `ANL-`, `PD-`, Spec/`ARC-` upstream.
* `Uses`: Mối quan hệ sử dụng trong Design. Trỏ tới Design element khác, `STK-`, `EXT-`.
* `Realizes`: Mối quan hệ hiện thực hóa trong Design. Trỏ tới Spec item (Requirement).
* `Decisions`: Trỏ tới các quyết định thiết kế `DD-` chi phối phần tử.
* `Covers`: Mối quan hệ bao phủ trong Plan. Foundation Setup Plan trỏ tới `STK-` và `ARC-`; Build Plan trỏ tới Design Element (`SOL-`, `UXD-`, `APD-`, `DTD-`, `ARC-`); Test Plan trỏ trực tiếp tới Spec Item (`FR-`, `NFR-`, `UI-`, `API-`, `DATA-`, `SRS-`); Deploy Plan trỏ tới `ARC-` topology, `STK-`, `NFR-`.
* `Derived from`: Căn cứ trích xuất trực tiếp. Findings trỏ tới `SRC-`; Analysis trỏ tới `INF-`; Task (`TASK-`) trỏ tới đúng một `BLD-` hoặc `FND-`.
* `Wave`: Nhãn nhóm thứ tự thực thi cục bộ của `TASK-` (projection của dependency graph), không phải work item.
* `Depends on`: Mối quan hệ phụ thuộc thứ tự thực thi giữa các work items cùng phạm vi.
* `Requires`: Ràng buộc điều kiện tiên quyết trong `tech-tool-stack.md` (chỉ trỏ tới `STK-` khác hoặc `—`).
* `Applies to`: Phạm vi áp dụng của phần tử công nghệ (System hoặc mã Service).

### 4.3. Quy tắc Không mồ côi & Quản trị Phụ thuộc (Zero Orphan & Dependency Governance)
* Mọi Design element bắt buộc có `Realizes` trỏ về Spec item hợp lệ.
* Mọi Work item trong Build Plan bắt buộc có `Covers` trỏ về Design element hợp lệ (trừ `Gate`).
* Mọi Requirement trong Spec bắt buộc có Design element hiện thực (hoặc được phân bổ xuống Service qua `Basis`) và **bắt buộc có ít nhất một Test item cover**.
* **Phụ thuộc nội bộ Facet**: Work item trong một facet build plan (`*-build-plan.md`) chỉ được phép `Depends on` các item cùng facet hoặc `FND-`; tuyệt đối không trỏ chéo sang facet khác.
* **Điều phối tổng thể**: Mọi work item `FND-` và `BLD-` của service bắt buộc phải được phân rã thành các `TASK-` và sắp xếp trong các Wave thực thi tại `service-docs/<service-code>/task-plan.md`. Quan hệ phụ thuộc xuyên facet chỉ được giải quyết duy nhất tại đây bằng `TASK-`.

---

## 5. Bảng Điều chỉnh Dự án (Project Tailoring)

Tuân thủ Mục 2.2 của `sdlc-docs.md`, dự án Face Attendance System thực hiện các điều chỉnh tailoring sau:

| Element | Default | Applied | Reason | Impact |
| :--- | :--- | :--- | :--- | :--- |
| `backend-service/ui-ux` | Active facet | Bỏ qua (Tailored Out) | Phân hệ chạy chế độ headless daemon / REST API service; không có giao diện tương tác người dùng trực tiếp. | Không tạo thư mục `ui-ux/` và các leaf `ui-ux-*` cho Backend; không có `UXD-BE-` hay `TASK-BE-` về UI. |
| `backend-service/data` | Optional facet | Kích hoạt (Active) | Sở hữu và quản lý lưu trữ bền vững CSDL PostgreSQL 16 trung tâm và Caffeine Cache. | Tạo đầy đủ nhánh `data/` với `data-specs`, `data-design`, `data-build-plan`, `data-test-plan`. |
| `backend-service/api` | Optional facet | Kích hoạt (Active) | Cung cấp ranh giới giao tiếp REST API và STOMP Broker cho toàn bộ Kiosk và Web. | Tạo đầy đủ nhánh `api/` với `api-specs`, `api-design`, `api-build-plan`, `api-test-plan`. |
| `kiosk-app/data` | Optional facet | Kích hoạt (Active) | Sở hữu và quản lý hàng đợi ngoại tuyến SQLite WAL cục bộ và Ma trận bộ nhớ RAM. | Quản lý dữ liệu offline edge và cache khuôn mặt cục bộ. |
| `kiosk-app/api` | Optional facet | Kích hoạt (Active) | Có ranh giới truyền thông mạng tiêu thụ REST API và lắng nghe STOMP. | Giao tiếp đồng bộ dữ liệu chấm công và trạng thái thiết bị. |
| `kiosk-app/ui-ux` | Optional facet | Kích hoạt (Active) | Màn hình cảm ứng dọc 9:16 tương tác trực tiếp với cán bộ nhân viên điểm danh. | Thiết kế UX kiosk chuyên dụng toàn màn hình. |
| `web-portal/data` | Optional facet | Kích hoạt (Active) | Quản lý lưu trữ trạng thái phiên xác thực (LocalStorage), tiến trình ký cam kết và bộ đệm TanStack Query. | Quản lý state trình duyệt client-side. |
| `web-portal/api` | Optional facet | Kích hoạt (Active) | Có ranh giới truyền thông mạng tiêu thụ REST API và lắng nghe STOMP. | Giao tiếp dịch vụ nghiệp vụ quản trị và nhận thông báo real-time. |
| `web-portal/ui-ux` | Optional facet | Kích hoạt (Active) | Giao diện Single Page Application tương tác trực tiếp với Quản lý HR và Nhân viên. | Thiết kế dashboard portal quản trị responsive web. |

