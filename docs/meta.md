---
title: Metadata & Quy ước Quản trị Bộ tài liệu SDLC
version: 3.0
status: Approved
owner: Lead System Architect
---

# META — Metadata & Quy ước Quản trị Bộ tài liệu SDLC

Tài liệu này xác lập cấu trúc cây tài liệu thực tế, danh mục đăng ký (Registry), quy ước định danh (Conventions), hệ thống schema chuẩn hóa, quy tắc kiểm tra chất lượng (Quality Gates) và cơ chế truy vết (Traceability) cho toàn bộ hệ thống tài liệu SDLC của dự án **Face Attendance System (FAS)** ở cả hai cấp độ: **System-level** và **Subsystem-level**, tuân thủ chuẩn khung quy định tại [docs/sdlc-docs.md](sdlc-docs.md).

---

## 1. Document Tree (Cây Cấu trúc Tài liệu Thực tế)

```text
docs/
│
├── meta.md                                      # Metadata và quy ước quản trị của toàn bộ bộ tài liệu.
├── sdlc-docs.md                                 # Framework chuẩn khung hướng dẫn SDLC.
│
├── system-docs/                                 # [CẤP HỆ THỐNG] Ngữ cảnh, kiến trúc, kế hoạch chung
│   ├── info.md                                  # Kho nghiên cứu, sự thật và bằng chứng về đề tài [RQ-/SRC-/INF-/ANL-/GAP-]
│   ├── pi.md                                    # Khởi tạo dự án: mục tiêu, phạm vi, định hướng và quyết định [PD-]
│   ├── tech-tool-stack.md                       # Công nghệ, framework, runtime, nền tảng và công cụ dự án [STK-]
│   │
│   ├── srs/                                     # Phân hệ Đặc tả Yêu cầu Hệ thống
│   │   ├── srs.md                               # Ngữ cảnh hệ thống (ACT-, EXT-) và yêu cầu xuyên suốt (SRS-)
│   │   └── fr-nfr-specs.md                      # Yêu cầu chức năng (FR-SYS-) và phi chức năng (NFR-SYS-)
│   │
│   ├── dds/                                     # Phân hệ Thiết kế Chi tiết Hệ thống
│   │   └── dds.md                               # Kiến trúc tổng thể, ranh giới phân rã subsystem và topology (ARC-, DD-SYS-)
│   │
│   └── plans/                                   # Phân hệ Kế hoạch Cấp Hệ thống
│       ├── project-plan.md                      # Kế hoạch tổng thể, giai đoạn, mốc (PRJ-), vai trò (ROL-), rủi ro (RSK-)
│       ├── foundation-setup-plan.md             # Kế hoạch chuẩn bị nền tảng chung toàn hệ thống (FND-SYS-)
│       ├── build-plan.md                        # Kế hoạch xây dựng & tích hợp xuyên phân hệ (BLD-SYS-)
│       ├── test-plan.md                         # Kế hoạch kiểm thử tích hợp & nghiệm thu hệ thống (TST-SYS-)
│       └── deploy-plan.md                       # Kế hoạch phát hành, triển khai môi trường và dự phòng (DPL-SYS-)
│
└── subsystem-docs/                              # [CẤP PHÂN HỆ] Ranh giới & trách nhiệm riêng theo chiều dọc
    │
    ├── backend-service/                         # Phân hệ Máy chủ Doanh nghiệp (Java 21, Spring Boot, PostgreSQL)
    │   ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Backend
    │   ├── srs/                                 # Đặc tả yêu cầu Backend
    │   │   ├── fr-nfr-specs.md                  # Yêu cầu nghiệp vụ chấm công, bảo mật (FR-BE-, NFR-BE-)
    │   │   ├── data-specs.md                    # Thực thể CSDL PostgreSQL, quy tắc toàn vẹn (DATA-BE-)
    │   │   └── api-specs.md                     # Đặc tả REST Endpoints & STOMP Topics cung cấp (API-BE-)
    │   ├── dds/                                 # Thiết kế chi tiết Backend
    │   │   ├── fr-nfr-design.md                 # Thiết kế component, cơ chế mã hóa AES (SOL-BE-, DD-BE-)
    │   │   ├── data-design.md                   # Lược đồ DDL PostgreSQL 16 8 bảng, chỉ mục (DTD-BE-)
    │   │   └── api-design.md                    # Thiết kế chi tiết payload, Controller, STOMP (APD-BE-)
    │   └── plans/                               # Kế hoạch thi công Backend
    │       ├── foundation-setup-plan.md         # Foundation Setup Plan riêng của Backend (FND-BE-)
    │       ├── build-plan.md                    # Kế hoạch thi công theo facet (BLD-BE-)
    │       ├── test-plan.md                     # Kế hoạch kiểm thử theo facet (TST-BE-)
    │       └── task-plan.md                     # Kế hoạch phân rã thi công, thứ tự dependency & wave (TASK-BE-)
    │
    ├── kiosk-app/                               # Phân hệ Trạm Điểm danh Cận biên (Python 3, PySide6, OpenCV)
    │   ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Kiosk
    │   ├── srs/                                 # Đặc tả yêu cầu Kiosk
    │   │   ├── fr-nfr-specs.md                  # Yêu cầu phát hiện mặt, liveness, so khớp (FR-KSK-, NFR-KSK-)
    │   │   ├── data-specs.md                    # Thực thể SQLite offline_punches, GalleryMatrix (DATA-KSK-)
    │   │   ├── api-specs.md                     # Đặc tả giao diện tiêu thụ và topic lắng nghe (API-KSK-)
    │   │   └── ui-ux-specs.md                   # Hành trình điểm danh, máy trạng thái Oval 4 màu (UI-KSK-)
    │   ├── dds/                                 # Thiết kế chi tiết Kiosk
    │   │   ├── fr-nfr-design.md                 # Thiết kế pipeline YuNet, MiniFASNet, ArcFace (SOL-KSK-, DD-KSK-)
    │   │   ├── data-design.md                   # Lược đồ SQLite WAL, Cosine Matcher, Atomic Swap (DTD-KSK-)
    │   │   ├── api-design.md                    # Thiết kế HTTP Client httpx, Offline Sync, STOMP (APD-KSK-)
    │   │   └── ui-ux-design.md                  # Design Tokens, tỷ lệ co giãn, hình học vector (UXD-KSK-)
    │   └── plans/                               # Kế hoạch thi công Kiosk
    │       ├── foundation-setup-plan.md         # Foundation Setup Plan riêng của Kiosk (FND-KSK-)
    │       ├── build-plan.md                    # Kế hoạch thi công theo facet (BLD-KSK-)
    │       ├── test-plan.md                     # Kế hoạch kiểm thử theo facet (TST-KSK-)
    │       └── task-plan.md                     # Kế hoạch phân rã thi công, thứ tự dependency & wave (TASK-KSK-)
    │
    └── web-portal/                              # Phân hệ Cổng Web Quản trị & Người dùng (React, TypeScript)
        ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Web Portal
        ├── srs/                                 # Đặc tả yêu cầu Web Portal
        │   ├── fr-nfr-specs.md                  # Yêu cầu quản trị phân quyền, giám sát (FR-WEB-, NFR-WEB-)
        │   ├── data-specs.md                    # Thực thể Local/SessionStorage, Query Cache (DATA-WEB-)
        │   ├── api-specs.md                     # Đặc tả REST Endpoints & STOMP Topics tiêu thụ (API-WEB-)
        │   └── ui-ux-specs.md                   # Hành trình người dùng, quy trình ký cam kết OTP (UI-WEB-)
        ├── dds/                                 # Thiết kế chi tiết Web Portal
        │   ├── fr-nfr-design.md                 # Thiết kế SPA architecture, Auth guards (SOL-WEB-, DD-WEB-)
        │   ├── data-design.md                   # TypeScript contracts, Storage Adapter, Cache keys (DTD-WEB-)
        │   ├── api-design.md                    # Thiết kế Axios Client, Mutex Refresh Interceptor (APD-WEB-)
        │   └── ui-ux-design.md                  # Tailwind Tokens Indigo SaaS, Admin Shell, Modals (UXD-WEB-)
        └── plans/                               # Kế hoạch thi công Web Portal
            ├── foundation-setup-plan.md         # Foundation Setup Plan riêng của Web Portal (FND-WEB-)
            ├── build-plan.md                    # Kế hoạch thi công theo facet (BLD-WEB-)
            ├── test-plan.md                     # Kế hoạch kiểm thử theo facet (TST-WEB-)
            └── task-plan.md                     # Kế hoạch phân rã thi công, thứ tự dependency & wave (TASK-WEB-)
```

---

## 2. Document Registry (Sổ Đăng ký Tài liệu Toàn hệ thống)

### 2.1. Cấp Hệ thống (System-Level Registry)

| Leaf Document | Trả lời Câu hỏi | Upstream | Downstream | Điều kiện Áp dụng |
| :--- | :--- | :--- | :--- | :---: |
| `system-docs/info.md` | Ta biết gì: sự thật, bằng chứng và phân tích? | Nguồn khảo sát ngoài (`SRC-`) | PI, SPEC, STACK | Bắt buộc |
| `system-docs/pi.md` | Làm gì, trong phạm vi nào, quyết định cấp dự án gì? | INFO | STACK, SPEC, Project Plan | Bắt buộc |
| `system-docs/tech-tool-stack.md` | Dùng công nghệ, framework, công cụ và nền tảng nào? | INFO, PI | DESIGN, PLAN | Bắt buộc |
| `system-docs/srs/srs.md` | Ngữ cảnh hệ thống và yêu cầu xuyên suốt? | INFO, PI | System DDS, Test | Bắt buộc |
| `system-docs/srs/fr-nfr-specs.md` | Hệ thống phải làm gì (FR) và đạt mức chất lượng nào (NFR)? | INFO, PI, upstream Spec | System DDS, Test | Bắt buộc |
| `system-docs/dds/dds.md` | Kiến trúc tổng thể, ranh giới phân rã subsystem và topology? | System Spec, STACK, PI | Subsystem Spec, Plan, Deploy | Bắt buộc |
| `system-docs/plans/project-plan.md` | Khi nào, ai làm, rủi ro nào, theo lifecycle nào? | PI | — | Bắt buộc |
| `system-docs/plans/foundation-setup-plan.md` | Chuẩn bị nền tảng chung nào để build bắt đầu? | STACK, `ARC-` | Build Plan, Subsystem FSP / Task | Bắt buộc |
| `system-docs/plans/build-plan.md` | Xây dựng và tích hợp hệ thống theo thứ tự nào? | DDS (`ARC-`) | Quá trình BUILD / Task | Bắt buộc |
| `system-docs/plans/test-plan.md` | Kiểm chứng yêu cầu hệ thống bằng cách nào? | System Specs (trực tiếp) | Quá trình TEST | Bắt buộc |
| `system-docs/plans/deploy-plan.md` | Phát hành và đưa hệ thống vào vận hành thế nào? | `ARC-`, `STK-`, `NFR-` | Quá trình DEPLOY | Bắt buộc |

---

### 2.2. Cấp Phân hệ (Subsystem-Level Registry)

Áp dụng quy tắc phân rã theo facet và cấu trúc thư mục quy định tại Mục 2, Mục 7–10 của `sdlc-docs.md`:
Mỗi phân hệ (`subsystem-docs/<subsystem-code>/`) tổ chức thành 3 thư mục con chuẩn: `srs/`, `dds/`, `plans/`.
- `srs/`: `fr-nfr-specs.md` (luôn có), cùng các facet specs `data-specs.md`, `api-specs.md`, `ui-ux-specs.md` khi phân hệ sở hữu trách nhiệm tương ứng.
- `dds/`: `fr-nfr-design.md` (luôn có), cùng các facet design `data-design.md`, `api-design.md`, `ui-ux-design.md` tương ứng.
- `plans/`: gồm 4 kế hoạch chuẩn: `foundation-setup-plan.md` (chuẩn bị nền tảng), `build-plan.md` (kế hoạch thi công phân section theo facet), `test-plan.md` (kế hoạch kiểm thử phân section theo facet), `task-plan.md` (phân rã nhiệm vụ thi công, quản lý dependency và wave).

| Leaf Type | Đường dẫn Chuẩn | Trách nhiệm Kỹ thuật | Upstream | Downstream |
| :--- | :--- | :--- | :--- | :--- |
| **Foundation (Toàn phân hệ)** | `plans/foundation-setup-plan.md` | Kế hoạch chuẩn bị môi trường, công cụ riêng của phân hệ | System Foundation Plan, STACK, `ARC-` | `task-plan.md` |
| **Build Plan (Toàn phân hệ)** | `plans/build-plan.md` | Kế hoạch xây dựng phân hệ; phân section theo facet (`BLD-`) | Subsystem Design leaves, Foundation | `task-plan.md` / Quá trình BUILD |
| **Test Plan (Toàn phân hệ)** | `plans/test-plan.md` | Kế hoạch kiểm thử phân hệ; phân section theo facet (`TST-`) | Subsystem Specs (trực tiếp) | Quá trình TEST |
| **Task Plan (Toàn phân hệ)** | `plans/task-plan.md` | Gom `BLD-`/`FND-`, phân rã thành `TASK-`, giải quyết dependency và nhóm wave thực thi | `build-plan.md`, `foundation-setup-plan.md` | Quá trình BUILD (`TASK-`) |
| **FR/NFR Specs** | `srs/fr-nfr-specs.md` | Năng lực nghiệp vụ và chất lượng thuộc trách nhiệm phân hệ | System Specs, `ARC-` | FR/NFR Design, Test Plan |
| **FR/NFR Design** | `dds/fr-nfr-design.md` | Cấu trúc component, logic và cơ chế chất lượng phân hệ | FR/NFR Specs, STACK | Build Plan |
| **Data Specs** | `srs/data-specs.md` | Thực thể dữ liệu, quy tắc toàn vẹn, vòng đời của phân hệ | System Specs, `ARC-` | Data Design, Test Plan |
| **Data Design** | `dds/data-design.md` | Lược đồ CSDL, cấu trúc bảng, chỉ mục, migration của phân hệ | Data Specs, STACK | Build Plan |
| **API Specs** | `srs/api-specs.md` | Ranh giới giao tiếp, interface cung cấp/tiêu thụ của phân hệ | System Specs, `ARC-` | API Design, Test Plan |
| **API Design** | `dds/api-design.md` | Endpoint, schema dữ liệu, client wrapper, sequence của phân hệ | API Specs, STACK | Build Plan |
| **UI/UX Specs** | `srs/ui-ux-specs.md` | Tác vụ người dùng, luồng tương tác, phản hồi của phân hệ | System Specs, `ARC-` | UI/UX Design, Test Plan |
| **UI/UX Design** | `dds/ui-ux-design.md` | Design tokens, layout, tỷ lệ co giãn, hình học của phân hệ | UI/UX Specs, STACK | Build Plan |

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
* **Trạng thái của item**: kế thừa nguyên trạng theo từng loại item quy định trong framework; dự án không định nghĩa thêm giá trị trạng thái nào.
* **Miễn Front Matter**: `README.md` (leaf điều hướng, không sở hữu item), `sdlc-docs.md` (chuẩn khung) và `meta.md` (metadata của document system) không phải artifact SDLC nên được miễn khối front matter hoặc áp dụng quy chuẩn quản trị riêng; ghi nhận tại §5.

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
| `FR-` | Yêu cầu chức năng | `*/srs/fr-nfr-specs.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `NFR-` | Yêu cầu phi chức năng (Chất lượng) | `*/srs/fr-nfr-specs.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `UI-` | Đặc tả tương tác người dùng | `subsystem-docs/*/srs/ui-ux-specs.md` | Có (`KSK`, `WEB`) |
| `API-` | Đặc tả interface / hợp đồng | `subsystem-docs/*/srs/api-specs.md` | Có (`BE`, `KSK`, `WEB`) |
| `DATA-` | Đặc tả dữ liệu | `subsystem-docs/*/srs/data-specs.md` | Có (`BE`, `KSK`, `WEB`) |
| `ARC-` | Phần tử kiến trúc & Topology | `system-docs/dds/dds.md` | Không |
| `SOL-` | Giải pháp thiết kế nghiệp vụ | `subsystem-docs/*/dds/fr-nfr-design.md` | Có (`BE`, `KSK`, `WEB`) |
| `UXD-` | Thiết kế giao diện & tokens | `subsystem-docs/*/dds/ui-ux-design.md` | Có (`KSK`, `WEB`) |
| `APD-` | Thiết kế API chi tiết | `subsystem-docs/*/dds/api-design.md` | Có (`BE`, `KSK`, `WEB`) |
| `DTD-` | Thiết kế dữ liệu chi tiết | `subsystem-docs/*/dds/data-design.md` | Có (`BE`, `KSK`, `WEB`) |
| `DD-` | Quyết định thiết kế (Design Decision) | Mọi leaf design | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `APC-` | Quyết định cách tiếp cận (Approach) | Mọi leaf plan | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `PRJ-` | Giai đoạn / Mốc / Cổng dự án | `system-docs/plans/project-plan.md` | Không |
| `ROL-` | Vai trò dự án | `system-docs/plans/project-plan.md` | Không |
| `RSK-` | Rủi ro dự án | `system-docs/plans/project-plan.md` | Không |
| `FND-` | Công việc chuẩn bị nền tảng | `*/plans/foundation-setup-plan.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `BLD-` | Công việc thi công / Build | `system-docs/plans/build-plan.md`, `subsystem-docs/*/plans/build-plan.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `TASK-`| Nhiệm vụ thi công thực tế cấp phân hệ | `subsystem-docs/*/plans/task-plan.md` | Có (`BE`, `KSK`, `WEB`) |
| `TST-` | Ca kiểm thử / Test item | `system-docs/plans/test-plan.md`, `subsystem-docs/*/plans/test-plan.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `DPL-` | Công việc triển khai / Vận hành | `system-docs/plans/deploy-plan.md` | Có (`SYS` only, `DPL-SYS-`) |

> *Quy tắc Dãy số Thống nhất (§11)*: Mỗi cặp `(TYPE, SCOPE)` có một dãy số duy nhất, dùng chung giữa các leaf cùng prefix. Ví dụ: toàn bộ work item thi công trong build plan của phân hệ Backend sử dụng chung một dãy thống nhất `BLD-BE-001..`, toàn bộ task thi công sử dụng `TASK-BE-001..`, tương tự cho `TST-BE-001..`, `BLD-KSK-001..`, `TASK-KSK-001..`, `TST-KSK-001..`. Không đặt tiền tố tùy tiện theo facet.

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
* **Work Items Schema (`system-docs/plans/build-plan.md`, `subsystem-docs/*/plans/build-plan.md`, `foundation-setup-plan.md`, `deploy-plan.md`)**:
  ```text
  ID | Name | Description | Covers | Depends on | Done when | Status
  ```
* **Tasks Schema (`subsystem-docs/*/plans/task-plan.md`)**:
  ```text
  ID | Name | Description | Derived from | Depends on | Wave | Done when | Status
  ```
* **Test Items Schema (`*-test-plan.md`)**:
  ```text
  ID | Name | Description | Covers | Depends on | Done when | Status
  ```
* **Stack Schema (`tech-tool-stack.md`)**:
  ```text
  ID | Category | Name | Version | Applies to | Role | Basis | Requires | Status
  ```

---

### 3.4. Quality Gate Tự động cho Bộ tài liệu

Nguồn quy định: §12 và §13.4 của [sdlc-docs.md](sdlc-docs.md). Gate phải kiểm tra các hạng mục cấu trúc:

| # | Hạng mục kiểm tra | Trạng thái cài đặt |
| :--- | :--- | :--- |
| 1 | Front matter hợp lệ (`title`, `version` MAJOR.MINOR, `status`, `owner`) | **Đã cài** (`tools/docs-check/check_docs.py`) |
| 2 | ID đúng scheme (§3.2) và không trùng lặp | **Đã cài** |
| 3 | Mọi `Basis`, `Realizes`, `Covers`, `Uses`, `Requires`, `Derived from`, `Depends on` trỏ tới ID tồn tại | **Đã cài** |
| 4 | Ràng buộc `Wave`: Là số tự nhiên ($\ge 1$); wave của một task lớn hơn wave của mọi task mà nó `Depends on` | **Đã cài** |
| 5 | Coverage/orphan theo §12.2 | **Đã cài** (có allowlist baseline) |
| 6 | Sinh ma trận traceability từ ID | **Đã cài** (`--matrix`) |

> **Lưu ý về phạm vi của Gate (§12 & §13.4)**: Sáu phép thử chất lượng tại §12.1 của [sdlc-docs.md](sdlc-docs.md) là **tiêu chí human review** trong quy trình Pull Request. Công cụ gate chỉ tự động hoá kiểm tra tính hợp lệ về mặt cấu trúc (structural / syntax / schema / model); CI xanh không thay thế việc thẩm định chiều sâu nội dung kỹ thuật.

**Khoảng trống đã biết (theo dõi tại issue #35):**
Được quản lý thông qua allowlist có thời hạn tại `tools/docs-check/known-gaps.json`. Các ngoại lệ hết hạn sẽ làm docs-check thất bại, bắt buộc giải quyết triệt để theo từng đợt cập nhật.

---

## 4. Traceability & Ownership (Quy tắc Truy vết & Quyền sở hữu)

### 4.1. Nguyên tắc Đơn sở hữu (Single Ownership)
> **Mỗi nội dung kỹ thuật chỉ có đúng một Leaf làm Owner duy nhất. Mọi tài liệu khác bắt buộc tham chiếu qua mã ID, tuyệt đối không sao chép nội dung.**

### 4.2. Từ điển Trường Quan hệ Truy vết (Trace Fields)

Định nghĩa gốc của mọi trường trace và tập target hợp lệ theo từng loại item nằm tại §10.1 của [sdlc-docs.md](sdlc-docs.md) và được áp dụng nguyên trạng, không có ngoại lệ, trường bổ sung hay target mở rộng.

Phần cụ thể hoá của dự án:
* Tập SCOPE hợp lệ chỉ gồm `SYS`, `BE`, `KSK`, `WEB` (§3.2).
* Mọi trường xuất hiện trong bảng item của dự án phải là trường đã định nghĩa tại §10.1, hoặc là phần định nghĩa của schema item tương ứng tại §3.3.
* `Wave` là thuộc tính thực thi của `TASK-` (task attribute), không phải là trace field (§10.1, §13.4).

### 4.3. Quy tắc Không mồ côi & Quản trị Phụ thuộc (Zero Orphan & Dependency Governance)

Quy tắc gốc nằm tại §12.2 của [sdlc-docs.md](sdlc-docs.md) và được áp dụng nguyên trạng. Phần cụ thể hoá của dự án:
* Mọi `FND-` và `BLD-` của ba phân hệ phải được phân rã thành `TASK-` tại `subsystem-docs/<subsystem-code>/plans/task-plan.md`; ngoại lệ `No TASK decomposition` phải có Tailoring record theo từng ID tại §5.
* `BLD-SYS-*` execution-bearing (công việc tích hợp xuyên phân hệ hoặc cấu hình hệ thống thực sự không thuộc phân hệ nào) có thể tự chịu trách nhiệm thực thi tại System Build Plan nếu có `Done when`, owner và evidence rõ ràng; trường hợp này không tạo `TASK-` riêng và không cần tailoring record từng ID.
* Phụ thuộc xuyên facet chỉ được giải quyết tại `task-plan.md` bằng `TASK-`; trong `build-plan.md`, các work item chỉ được `Depends on` item nội bộ phân hệ hoặc `FND-`.

---

## 5. Bảng Điều chỉnh Dự án (Project Tailoring)

Tuân thủ Mục 2.2 của `sdlc-docs.md`, dự án Face Attendance System thực hiện các điều chỉnh tailoring sau:

| Element | Default | Applied | Reason | Impact |
| :--- | :--- | :--- | :--- | :--- |
| `backend-service/ui-ux` | Active facet | Bỏ qua (Tailored Out) | Phân hệ chạy chế độ headless daemon / REST API service; không có giao diện tương tác người dùng trực tiếp. | Không tạo `srs/ui-ux-specs.md`, `dds/ui-ux-design.md` và section UI/UX trong các plan của Backend; không có `UXD-BE-` hay `TASK-BE-` về UI. |
| `backend-service/data` | Optional facet | Kích hoạt (Active) | Sở hữu và quản lý lưu trữ bền vững CSDL PostgreSQL 16 trung tâm và Caffeine Cache. | Tạo `srs/data-specs.md`, `dds/data-design.md`, cùng section Data trong build-plan và test-plan. |
| `backend-service/api` | Optional facet | Kích hoạt (Active) | Cung cấp ranh giới giao tiếp REST API và STOMP Broker cho toàn bộ Kiosk và Web. | Tạo `srs/api-specs.md`, `dds/api-design.md`, cùng section API trong build-plan và test-plan. |
| `kiosk-app/data` | Optional facet | Kích hoạt (Active) | Sở hữu và quản lý hàng đợi ngoại tuyến SQLite WAL cục bộ và Ma trận bộ nhớ RAM. | Tạo `srs/data-specs.md`, `dds/data-design.md`, cùng section Data trong build-plan và test-plan. |
| `kiosk-app/api` | Optional facet | Kích hoạt (Active) | Có ranh giới truyền thông mạng tiêu thụ REST API và lắng nghe STOMP. | Tạo `srs/api-specs.md`, `dds/api-design.md`, cùng section API trong build-plan và test-plan. |
| `kiosk-app/ui-ux` | Optional facet | Kích hoạt (Active) | Màn hình cảm ứng dọc 9:16 tương tác trực tiếp với cán bộ nhân viên điểm danh. | Tạo `srs/ui-ux-specs.md`, `dds/ui-ux-design.md`, cùng section UI/UX trong build-plan và test-plan. |
| `web-portal/data` | Optional facet | Kích hoạt (Active) | Quản lý lưu trữ trạng thái phiên xác thực (LocalStorage), tiến trình ký cam kết và bộ đệm TanStack Query. | Tạo `srs/data-specs.md`, `dds/data-design.md`, cùng section Data trong build-plan và test-plan. |
| `web-portal/api` | Optional facet | Kích hoạt (Active) | Có ranh giới truyền thông mạng tiêu thụ REST API và lắng nghe STOMP. | Tạo `srs/api-specs.md`, `dds/api-design.md`, cùng section API trong build-plan và test-plan. |
| `web-portal/ui-ux` | Optional facet | Kích hoạt (Active) | Giao diện Single Page Application tương tác trực tiếp với Quản lý HR và Nhân viên. | Tạo `srs/ui-ux-specs.md`, `dds/ui-ux-design.md`, cùng section UI/UX trong build-plan và test-plan. |
| `docs/README.md` và 3 `subsystem-docs/*/README.md` | Không thuộc cây mặc định | Tồn tại như leaf điều hướng | Điểm vào tra cứu cho người và AI (§13.5); không sở hữu ID item nào | Không tạo và không dùng ID; mọi nội dung kỹ thuật vẫn thuộc leaf tương ứng |
| Front matter cho `sdlc-docs.md` và các `README.md` | Mọi leaf bắt buộc có front matter | Miễn | Đây là chuẩn khung và leaf điều hướng, không phải artifact SDLC | Gate bỏ qua các tệp này khi kiểm front matter |
| `meta.md` §7 Decision Register | META gồm Tree, Registry, Conventions, Traceability, Terms (§3 sdlc-docs.md) | Bổ sung mục theo dõi quyết định đang chờ | Nhiều mâu thuẫn nội dung chỉ giải quyết được sau khi chốt quyết định; cần một nơi theo dõi trạng thái | Chỉ theo dõi trạng thái; giá trị đã chốt vẫn phải ghi thành item `PD-`/`DD-`/`APC-` tại leaf sở hữu |

---

## 6. Terms (Thuật ngữ của Bộ tài liệu)

Thuật ngữ của chuẩn khung đã được định nghĩa tại §1, §2 & §11 của [sdlc-docs.md](sdlc-docs.md); dưới đây chỉ ghi các thuật ngữ dự án dùng trong vận hành bộ tài liệu này.

| Thuật ngữ | Nghĩa trong dự án |
| :--- | :--- |
| Leaf | Một tệp tài liệu trong cây; mỗi leaf có một owner nội dung. |
| Item | Một dòng có ID trong bảng của leaf (requirement, definition, design element, work item, task, test item). |
| SCOPE | Mã phạm vi trong ID: `SYS` (cấp hệ thống), `BE`, `KSK`, `WEB` (cấp phân hệ / subsystem). |
| Facet | Góc trách nhiệm của phân hệ: `fr-nfr`, `data`, `api`, `ui-ux`. |
| Trace field | Trường liên kết quan hệ giữa các item: `Basis`, `Uses`, `Realizes`, `Decisions`, `Covers`, `Derived from`, `Depends on`, `Requires`, `Applies to`. |
| Task Attribute | Các thuộc tính thực thi của `TASK-`: `Wave` (số tự nhiên $\ge 1$ biểu diễn thứ tự thực thi, projection từ đồ thị phụ thuộc), `Done when`, `Status`. |
| Evidence | Sản phẩm của BUILD/TEST/DEPLOY nằm ngoài cây tài liệu (mã nguồn, kết quả test, release record). |

---

## 7. Decision Register (Quyết định đang chờ chốt)

Các quyết định dưới đây phải được chốt **tại leaf sở hữu** trước khi bộ tài liệu đạt trạng thái nhất quán (theo dõi tại issue #21 / #35). Cột "Số" chỉ là nhãn theo dõi, **không phải ID item**; giá trị đã chốt phải được ghi thành item `PD-`/`DD-`/`APC-` tại leaf sở hữu, không ghi tại đây.

| Số | Nội dung cần chốt | Leaf sở hữu | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | Mô hình token: một token 8 giờ, hay Access 1 giờ + Refresh 7 ngày kèm bảng refresh token | `system-docs/srs/srs.md` (`SRS-006`) và `subsystem-docs/backend-service/srs/fr-nfr-specs.md` | Chưa chốt |
| 2 | Thuật toán băm OTP: HMAC-SHA-256 kèm pepper (tra cứu được theo index) hay BCrypt | `subsystem-docs/backend-service/dds/data-design.md` và `subsystem-docs/backend-service/dds/fr-nfr-design.md` | Chưa chốt |
| 3 | Ngưỡng cosine của bộ so khớp (0.40 / 0.50 / 0.65) và chỉ số liveness (APCER mục tiêu, mức chặn tuyên bố) | `system-docs/srs/fr-nfr-specs.md` (`NFR-KSK-001`, `NFR-SYS-005`) | Chưa chốt |
| 4 | Chu kỳ nhận diện chuẩn: 350 ms cho pipeline và 1,2 s cho face-to-dashboard (bỏ các mức 100 ms và 1,5 s) | `system-docs/srs/fr-nfr-specs.md` (`NFR-SYS-003`) và `system-docs/info.md` (`INF-006`) | Chưa chốt |
| 5 | Chỉ số 1:N dùng FPIR/FNIR thay TAR@FAR, FAR mục tiêu và quy mô gallery (1.000 hay 10.000) | `system-docs/pi.md` (`KPI-01`) | Chưa chốt |
| 6 | Endpoint và topic WebSocket chuẩn (raw `/ws` cho Kiosk, SockJS cho Web), tên topic, cơ chế xác thực kênh | `system-docs/dds/dds.md` và `subsystem-docs/backend-service/dds/api-design.md` | Chưa chốt |
| 7 | Mô hình dữ liệu chuẩn: Flyway là nguồn tên bảng/cột; có thêm cột `auth_tag`, `key_id`, `user_agent`, `attempt_count` và bảng consent riêng hay không | `system-docs/dds/dds.md` và `subsystem-docs/backend-service/dds/data-design.md` | Chưa chốt |
| 8 | Mục tiêu availability và RTO thực tế; phạm vi runbook backup/restore | `system-docs/plans/deploy-plan.md` | Chưa chốt |
| 9 | Tải mục tiêu (giữ 500 RPS hay hạ về ngưỡng thực) và công cụ đo | `subsystem-docs/backend-service/srs/fr-nfr-specs.md` (`NFR-BE-002`) | Chưa chốt |
| 10 | Phạm vi TLS/WSS và rate-limit: nằm trong phạm vi build hay chuyển thành `Deferred` | `system-docs/srs/srs.md` (`SRS-002`) và `subsystem-docs/backend-service/srs/api-specs.md` | Chưa chốt |
