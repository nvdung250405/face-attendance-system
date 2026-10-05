---
title: Metadata & Quy ước Quản trị Bộ tài liệu SDLC
version: 3.0
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
    │   │   ├── fr-nfr-build-plan.md             # Kế hoạch thi công pipeline thị giác biên (BLD-KSK-012..017)
    │   │   └── fr-nfr-test-plan.md              # Kế hoạch kiểm thử thị giác máy tính và AI (TST-KSK-013..021)
    │   ├── data/                                # [Kích hoạt] CSDL ngoại tuyến SQLite WAL & Ma trận RAM
    │   │   ├── data-specs.md                    # Thực thể SQLite offline_punches, GalleryMatrix (DATA-KSK-)
    │   │   ├── data-design.md                   # Lược đồ SQLite WAL, Cosine Matcher, Atomic Swap (DTD-KSK-)
    │   │   ├── data-build-plan.md               # Kế hoạch thi công CSDL cục bộ và RAM matrix (BLD-KSK-001..003)
    │   │   └── data-test-plan.md                # Kế hoạch kiểm thử CSDL cục bộ và ma trận (TST-KSK-001..004)
    │   ├── api/                                 # [Kích hoạt] Tiêu thụ REST API & Lắng nghe STOMP
    │   │   ├── api-specs.md                     # Đặc tả giao diện tiêu thụ và topic lắng nghe (API-KSK-)
    │   │   ├── api-design.md                    # Thiết kế HTTP Client httpx, Offline Sync, STOMP (APD-KSK-)
    │   │   ├── api-build-plan.md                # Kế hoạch thi công tầng mạng và sync worker (BLD-KSK-009..011)
    │   │   └── api-test-plan.md                 # Kế hoạch kiểm thử truyền thông mạng Kiosk (TST-KSK-009..012)
    │   └── ui-ux/                               # [Kích hoạt] Màn hình Cảm ứng Dọc 9:16 (Figma 1080x1920)
    │       ├── ui-ux-specs.md                   # Hành trình điểm danh, máy trạng thái Oval 4 màu (UI-KSK-)
    │       ├── ui-ux-design.md                  # Design Tokens, tỷ lệ co giãn S, hình học vector (UXD-KSK-)
    │       ├── ui-ux-build-plan.md              # Kế hoạch thi công giao diện QML (BLD-KSK-004..008)
    │       └── ui-ux-test-plan.md               # Kế hoạch kiểm thử giao diện và tương tác chạm (TST-KSK-005..008)
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
* **Trạng thái của item**: kế thừa nguyên trạng §3.4 của [sdlc-docs.md](sdlc-docs.md) theo từng loại item; dự án không định nghĩa thêm giá trị trạng thái nào.
* **Miễn Front Matter**: `README.md` (leaf điều hướng, không sở hữu item) và `sdlc-docs.md` (chuẩn khung, không phải artifact SDLC) không phải leaf theo §3.3 nên miễn khối front matter; ghi nhận tại §5.

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
  ID | Role | Responsibility | Assignee
  ```
* **Project Risk Schema (`project-plan.md`)**:
  ```text
  ID | Risk | Probability | Impact | Response | Owner | Basis | Status
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
  ID | Name | Description | Covers | Depends on | Category | Done when | Status
  ```

  > Khác biệt duy nhất so với §9.1 L660 của `sdlc-docs.md` là cột `Category` (test level hoặc `Gate`) theo yêu cầu của §9.5 L814; ghi nhận tại §5 Tailoring.
* **Stack Schema (`tech-tool-stack.md`)**:
  ```text
  ID | Category | Name | Version | Applies to | Role | Basis | Requires | Status
  ```

### 3.4. Quality Gate Tự động cho Bộ tài liệu

Nguồn quy định: §14.4 của [sdlc-docs.md](sdlc-docs.md). Gate phải kiểm sáu hạng mục cấu trúc:

| # | Hạng mục kiểm tra | Trạng thái cài đặt |
| :--- | :--- | :--- |
| 1 | Front matter hợp lệ (`title`, `version` MAJOR.MINOR, `status`, `owner`) | **Đã cài** (`tools/docs-check/check_docs.py`) |
| 2 | ID đúng scheme (§3.2) và không trùng | Chưa cài |
| 3 | Mọi `Basis`, `Realizes`, `Covers`, `Uses`, `Requires`, `Derived from`, `Depends on` trỏ tới ID tồn tại | Chưa cài |
| 4 | Ràng buộc `Wave`: Là số tự nhiên ($\ge 1$); wave của một task lớn hơn wave của mọi task mà nó `Depends on` | Chưa cài |
| 5 | Coverage/orphan theo §4.3 | Chưa cài |
| 6 | Sinh ma trận traceability từ ID | Chưa cài |

Công cụ gate nằm ngoài `docs/` (`tools/docs-check/`) nên không thuộc phạm vi chỉnh sửa của giai đoạn chuẩn hoá tài liệu; các hạng mục 2–6 là điều kiện bắt buộc trước khi bật gate ở chế độ strict.

> **Lưu ý về phạm vi của Gate (§14.4)**: Sáu phép thử chất lượng tại §13.1 của [sdlc-docs.md](sdlc-docs.md) là **tiêu chí human review** trong quy trình Pull Request. Công cụ gate chỉ tự động hoá kiểm tra tính hợp lệ về mặt cấu trúc (structural / syntax / schema / model); CI xanh không thay thế việc thẩm định chiều sâu nội dung kỹ thuật.

**Khoảng trống đã biết (theo dõi tại issue #21):**

| Khoảng trống | Ảnh hưởng | Xử lý dự kiến |
| :--- | :--- | :--- |
| `service-docs/kiosk-app/task-plan.md` và `service-docs/web-portal/task-plan.md` chưa tồn tại | 48 `BLD-`/`FND-` chưa có `TASK-`; vi phạm §4.3 | Tạo tại W2 |
| `service-docs/kiosk-app/build-plan.md` và `service-docs/web-portal/build-plan.md` nằm ngoài cây mặc định | Trùng vai trò với `task-plan.md`; vi phạm §2 L139-141 | Xoá tại W2 |
| 8 ID định nghĩa hai lần, 31 dòng Decision thiếu `Alternatives`/`Consequences`, 18 dòng Test Item sai schema | Vi phạm §3.3 | Sửa tại W3 |
| 81/193 Requirement chưa có Test Item cover | Vi phạm §4.3 | Bổ sung tại W7 |

---

## 4. Traceability & Ownership (Quy tắc Truy vết & Quyền sở hữu)

### 4.1. Nguyên tắc Đơn sở hữu (Single Ownership)
> **Mỗi nội dung kỹ thuật chỉ có đúng một Leaf làm Owner duy nhất. Mọi tài liệu khác bắt buộc tham chiếu qua mã ID, tuyệt đối không sao chép nội dung.**

### 4.2. Từ điển Trường Quan hệ Truy vết (Trace Fields)

Định nghĩa gốc của mọi trường trace và tập target hợp lệ theo từng loại item nằm tại §11.2 của [sdlc-docs.md](sdlc-docs.md) và được áp dụng nguyên trạng, không có ngoại lệ, trường bổ sung hay target mở rộng.

Phần cụ thể hoá của dự án:
* Tập SCOPE hợp lệ chỉ gồm `SYS`, `BE`, `KSK`, `WEB` (§3.2).
* Mọi trường xuất hiện trong bảng item của dự án phải là trường đã định nghĩa tại §11.2, hoặc là phần định nghĩa của schema item tương ứng tại §3.3.
* `Wave` là thuộc tính thực thi của `TASK-` (task attribute), không phải là trace field (§11.2, §14.4).

### 4.3. Quy tắc Không mồ côi & Quản trị Phụ thuộc (Zero Orphan & Dependency Governance)

Quy tắc gốc nằm tại §13.2 của [sdlc-docs.md](sdlc-docs.md) và được áp dụng nguyên trạng. Phần cụ thể hoá của dự án:
* Mọi `FND-` và `BLD-` của ba service phải được phân rã thành `TASK-` tại `service-docs/<service-code>/task-plan.md`; ngoại lệ `No TASK decomposition` phải có Tailoring record theo từng ID tại §5.
* `BLD-SYS-*` execution-bearing (công việc tích hợp xuyên service hoặc cấu hình hệ thống thực sự không thuộc service nào) có thể tự chịu trách nhiệm thực thi tại System Build Plan nếu có `Done when`, owner và evidence rõ ràng; trường hợp này không tạo `TASK-` riêng và không cần tailoring record từng ID.
* Phụ thuộc xuyên facet chỉ được giải quyết tại `task-plan.md` bằng `TASK-`; facet build plan chỉ được `Depends on` item cùng facet hoặc `FND-`.
* Khoảng trống hiện tại so với hai quy tắc trên được theo dõi tại §3.4.

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
| `Test Items Schema` | `ID \| Name \| Description \| Covers \| Depends on \| Done when \| Status` (§9.1 L660) | Thêm cột `Category` | §9.5 L814 yêu cầu `Category` = test level hoặc `Gate` nhưng schema §9.1 L660 không có cột này | 11 test plan phải có cột `Category`; chỉnh tại W3 |
| `docs/README.md` và 3 `service-docs/*/README.md` | Không thuộc cây mặc định | Tồn tại như leaf điều hướng | Điểm vào tra cứu cho người và AI (§14.5); không sở hữu ID item nào | Không tạo và không dùng ID; mọi nội dung kỹ thuật vẫn thuộc leaf tương ứng |
| Front matter cho `sdlc-docs.md` và các `README.md` | Mọi leaf bắt buộc có front matter (§3.4 L250) | Miễn | Đây là chuẩn khung và leaf điều hướng, không phải artifact SDLC | Gate bỏ qua hai loại tệp này khi kiểm front matter |
| `meta.md` §7 Decision Register | META gồm Tree, Registry, Conventions, Traceability, Terms (§3.1 L202-207) | Bổ sung mục theo dõi quyết định đang chờ | Nhiều mâu thuẫn nội dung chỉ giải quyết được sau khi chốt quyết định; cần một nơi theo dõi trạng thái | Chỉ theo dõi trạng thái; giá trị đã chốt vẫn phải ghi thành item `PD-`/`DD-`/`APC-` tại leaf sở hữu |

---

## 6. Terms (Thuật ngữ của Bộ tài liệu)

Thuật ngữ của chuẩn khung đã được định nghĩa tại §3.3 của [sdlc-docs.md](sdlc-docs.md); dưới đây chỉ ghi các thuật ngữ dự án dùng trong vận hành bộ tài liệu này.

| Thuật ngữ | Nghĩa trong dự án |
| :--- | :--- |
| Leaf | Một tệp tài liệu trong cây; mỗi leaf có một owner nội dung. |
| Item | Một dòng có ID trong bảng của leaf (requirement, definition, design element, work item, task, test item). |
| SCOPE | Mã phạm vi trong ID: `SYS` (cấp hệ thống), `BE`, `KSK`, `WEB` (cấp service). |
| Facet | Góc trách nhiệm của service: `fr-nfr`, `data`, `api`, `ui-ux`. |
| Trace field | Trường liên kết quan hệ giữa các item: `Basis`, `Uses`, `Realizes`, `Decisions`, `Covers`, `Derived from`, `Depends on`, `Requires`, `Applies to`. |
| Task Attribute | Các thuộc tính thực thi của `TASK-`: `Wave` (số tự nhiên $\ge 1$ biểu diễn thứ tự thực thi, projection từ đồ thị phụ thuộc), `Done when`, `Status`. |
| Evidence | Sản phẩm của BUILD/TEST/DEPLOY nằm ngoài cây tài liệu (mã nguồn, kết quả test, release record). |
| W0–W8 | Các đợt chuẩn hoá tài liệu của dự án, theo dõi tại issue #21. |

---

## 7. Decision Register (Quyết định đang chờ chốt)

Các quyết định dưới đây phải được chốt **tại leaf sở hữu** trước khi bộ tài liệu đạt trạng thái nhất quán (theo dõi tại issue #21). Cột "Số" chỉ là nhãn theo dõi, **không phải ID item**; giá trị đã chốt phải được ghi thành item `PD-`/`DD-`/`APC-` tại leaf sở hữu, không ghi tại đây.

| Số | Nội dung cần chốt | Leaf sở hữu | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | Mô hình token: một token 8 giờ, hay Access 1 giờ + Refresh 7 ngày kèm bảng refresh token | `system-docs/srs/srs.md` (`SRS-006`) và `service-docs/backend-service/fr-nfr/fr-nfr-specs.md` | Chưa chốt |
| 2 | Thuật toán băm OTP: HMAC-SHA-256 kèm pepper (tra cứu được theo index) hay BCrypt | `service-docs/backend-service/data/data-design.md` và `fr-nfr/fr-nfr-design.md` | Chưa chốt |
| 3 | Ngưỡng cosine của bộ so khớp (0.40 / 0.50 / 0.65) và chỉ số liveness (APCER mục tiêu, mức chặn tuyên bố) | `system-docs/srs/fr-nfr-specs.md` (`NFR-KSK-001`, `NFR-SYS-005`) | Chưa chốt |
| 4 | Chu kỳ nhận diện chuẩn: 350 ms cho pipeline và 1,2 s cho face-to-dashboard (bỏ các mức 100 ms và 1,5 s) | `system-docs/srs/fr-nfr-specs.md` (`NFR-SYS-003`) và `system-docs/info.md` (`INF-006`) | Chưa chốt |
| 5 | Chỉ số 1:N dùng FPIR/FNIR thay TAR@FAR, FAR mục tiêu và quy mô gallery (1.000 hay 10.000) | `system-docs/pi.md` (`KPI-01`) | Chưa chốt |
| 6 | Endpoint và topic WebSocket chuẩn (raw `/ws` cho Kiosk, SockJS cho Web), tên topic, cơ chế xác thực kênh | `system-docs/dds/api-design.md` | Chưa chốt |
| 7 | Mô hình dữ liệu chuẩn: Flyway là nguồn tên bảng/cột; có thêm cột `auth_tag`, `key_id`, `user_agent`, `attempt_count` và bảng consent riêng hay không | `system-docs/dds/data-design.md` và `service-docs/backend-service/data/data-design.md` | Chưa chốt |
| 8 | Mục tiêu availability và RTO thực tế; phạm vi runbook backup/restore | `system-docs/plans/deploy-plan.md` | Chưa chốt |
| 9 | Tải mục tiêu (giữ 500 RPS hay hạ về ngưỡng thực) và công cụ đo | `service-docs/backend-service/fr-nfr/fr-nfr-specs.md` (`NFR-BE-002`) | Chưa chốt |
| 10 | Phạm vi TLS/WSS và rate-limit: nằm trong phạm vi build hay chuyển thành `Deferred` | `system-docs/srs/srs.md` (`SRS-002`) và `system-docs/srs/api-specs.md` (`API-SYS-020`) | Chưa chốt |

