---
title: Metadata & Quy ước Quản trị Bộ tài liệu SDLC
version: 4.1
status: Approved
owner: Lead System Architect
type: meta
scope: PROJECT
updated: 2026-10-12
---

# META — Metadata & Quy ước Quản trị Bộ tài liệu SDLC

Tài liệu này xác lập cấu trúc cây tài liệu thực tế, danh mục đăng ký (Registry), quy ước định danh (Conventions), hệ thống schema chuẩn hóa, quy tắc kiểm tra chất lượng (Quality Gates) và cơ chế truy vết (Traceability) cho toàn bộ hệ thống tài liệu SDLC của dự án **Face Attendance System (FAS)** ở cả hai cấp độ: **System-level** và **Subsystem-level**, tuân thủ chuẩn khung quy định tại [docs/sdlc-docs.md](sdlc-docs.md).

---

## 1. Document Tree (Cây Cấu trúc Tài liệu Thực tế)

```text
docs/
│
├── README.md                                    # Cẩm nang giới thiệu & tra cứu tổng thể hệ thống tài liệu.
├── meta.md                                      # Metadata và quy ước quản trị của toàn bộ bộ tài liệu.
├── sdlc-docs.md                                 # Framework chuẩn khung hướng dẫn SDLC (v3.x).
│
├── system-docs/                                 # [CẤP HỆ THỐNG] Ngữ cảnh, kiến trúc, kế hoạch chung
│   ├── info.md                                  # Kho nghiên cứu, sự thật và bằng chứng về đề tài [RQ-/SRC-/INF-/ANL-/GAP-]
│   ├── pi.md                                    # Khởi tạo dự án: mục tiêu, phạm vi, định hướng và quyết định [PD-]
│   ├── tech-tool-stack.md                       # Công nghệ, framework, runtime, nền tảng và công cụ dự án [STK-]
│   │
│   ├── specs/                                   # SPEC — Yêu cầu & Thiết kế Hệ thống
│   │   └── spec.md                              # Spec Core: Ngữ cảnh (ACT-, EXT-), yêu cầu (SRS-, FR-SYS-, NFR-SYS-), kiến trúc & giải pháp (ARC-, SOL-SYS-), quyết định (DD-SYS-)
│   │
│   └── plans/                                   # PLAN — Kế hoạch Cấp Hệ thống
│       ├── project-plan.md                      # Kế hoạch tổng thể, giai đoạn, mốc (PRJ-), vai trò (ROL-), rủi ro (RSK-)
│       ├── foundation-setup-plan.md             # Kế hoạch chuẩn bị nền tảng chung, mạng Docker nội bộ & điều khiển dịch vụ (FND-SYS-)
│       ├── test-plan.md                         # Kế hoạch kiểm thử tích hợp & nghiệm thu hệ thống (TST-SYS-)
│       └── deploy-plan.md                       # Kế hoạch phát hành, triển khai môi trường và dự phòng (DPL-SYS-)
│
└── subsystem-docs/                              # [CẤP PHÂN HỆ] Ranh giới & trách nhiệm riêng theo chiều dọc
    │
    ├── backend-service/                         # Phân hệ Máy chủ Doanh nghiệp (Java 21, Spring Boot, PostgreSQL)
    │   ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Backend
    │   ├── specs/                               # SPEC — Yêu cầu & Thiết kế Backend
    │   │   ├── spec.md                          # Spec Core: Ngữ cảnh, FR-BE-, NFR-BE-, kiến trúc nội bộ, giải pháp (SOL-BE-), quyết định (DD-BE-)
    │   │   ├── data.md                          # Thực thể CSDL PostgreSQL, lược đồ DDL, toàn vẹn (DATA-BE-, DTD-BE-)
    │   │   └── api.md                           # Ranh giới REST & STOMP, interface, contract (API-BE-, APD-BE-)
    │   └── plans/                               # PLAN — Kế hoạch thi công Backend
    │       ├── foundation-setup-plan.md         # Foundation Setup Plan riêng Backend: Java 21, Docker multi-stage, OpenAPI/Actuator (FND-BE-)
    │       ├── build-plan.md                    # Kế hoạch thi công theo facet (BLD-BE-)
    │       ├── test-plan.md                     # Kế hoạch kiểm thử theo facet (TST-BE-)
    │       └── task-plan.md                     # Kế hoạch phân rã thi công, thứ tự dependency & wave (TASK-BE-)
    │
    ├── kiosk-app/                               # Phân hệ Trạm Điểm danh Cận biên (Python 3, PySide6, OpenCV)
    │   ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Kiosk
    │   ├── specs/                               # SPEC — Yêu cầu & Thiết kế Kiosk
    │   │   ├── spec.md                          # Spec Core: Ngữ cảnh, FR-KSK-, NFR-KSK-, pipeline AI, giải pháp (SOL-KSK-), quyết định (DD-KSK-)
    │   │   ├── data.md                          # SQLite WAL, GalleryMatrix, Key Lifecycle (DATA-KSK-, DTD-KSK-)
    │   │   └── api.md                           # Giao tiếp HTTP Client, offline sync, STOMP (API-KSK-, APD-KSK-)
    │   │   └── ui-ux.md                         # Hành trình tương tác Oval, trạng thái, tokens (UI-KSK-, UXD-KSK-)
    │   └── plans/                               # PLAN — Kế hoạch thi công Kiosk
    │       ├── foundation-setup-plan.md         # Foundation Setup Plan riêng Kiosk: Python venv, ONNX, watchdog biên & MockTransport (FND-KSK-)
    │       ├── build-plan.md                    # Kế hoạch thi công theo facet (BLD-KSK-)
    │       ├── test-plan.md                     # Kế hoạch kiểm thử theo facet (TST-KSK-)
    │       └── task-plan.md                     # Kế hoạch phân rã thi công, thứ tự dependency & wave (TASK-KSK-)
    │
    └── web-portal/                              # Phân hệ Cổng Web Quản trị & Người dùng (React, TypeScript)
        ├── README.md                            # Cẩm nang & Bản đồ định hướng phân hệ Web Portal
        ├── specs/                               # SPEC — Yêu cầu & Thiết kế Web Portal
        │   ├── spec.md                          # Spec Core: Ngữ cảnh, FR-WEB-, NFR-WEB-, kiến trúc SPA, giải pháp (SOL-WEB-), quyết định (DD-WEB-)
        │   ├── data.md                          # Client cache, session, storage adapter (DATA-WEB-, DTD-WEB-)
        │   ├── api.md                           # Axios Client, interceptor, refresh token (API-WEB-, APD-WEB-)
        │   └── ui-ux.md                         # Luồng người dùng, ký cam kết, design system (UI-WEB-, UXD-WEB-)
        └── plans/                               # PLAN — Kế hoạch thi công Web Portal
            ├── foundation-setup-plan.md         # Foundation Setup Plan riêng Web Portal: React SPA, Nginx container, Reverse Proxy CORS (FND-WEB-)
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
| `system-docs/tech-tool-stack.md` | Dùng công nghệ, framework, công cụ và nền tảng nào? | INFO, PI | SPEC (Design), PLAN | Bắt buộc |
| `system-docs/specs/spec.md` | Spec Core: Ngữ cảnh (`ACT-`, `EXT-`), yêu cầu (`SRS-`, `FR-SYS-`, `NFR-SYS-`), kiến trúc & giải pháp (`ARC-`, `SOL-SYS-`), quyết định (`DD-SYS-`) | INFO, PI | Subsystem Specs, Test Plan, Deploy Plan | Bắt buộc |
| `system-docs/plans/project-plan.md` | Khi nào, ai làm, rủi ro nào, theo lifecycle nào? | PI, SPEC | — | Bắt buộc |
| `system-docs/plans/foundation-setup-plan.md` | Chuẩn bị nền tảng chung nào để build bắt đầu? | STACK, `ARC-` | Subsystem FSP / Subsystem Build Plans | Bắt buộc |
| `system-docs/plans/test-plan.md` | Kiểm chứng yêu cầu hệ thống bằng cách nào? | System Specs (trực tiếp) | Quá trình TEST | Bắt buộc |
| `system-docs/plans/deploy-plan.md` | Phát hành và đưa hệ thống vào vận hành thế nào? | `ARC-`, `STK-`, `NFR-` | Quá trình DEPLOY | Bắt buộc |

---

### 2.2. Cấp Phân hệ (Subsystem-Level Registry)

Áp dụng mô hình **Spec Set** và quy tắc phân rã theo facet quy định tại §2, §7, §8 của [sdlc-docs.md](sdlc-docs.md):
Mỗi phân hệ (`subsystem-docs/<subsystem-code>/`) tổ chức thành 2 thư mục con chuẩn: `specs/` và `plans/`:
- `specs/`:
  * `spec.md` (Spec core): Ngữ cảnh phân hệ, yêu cầu chức năng (`FR-`), phi chức năng (`NFR-`), kiến trúc nội bộ, giải pháp thiết kế (`SOL-`) và quyết định thiết kế (`DD-`).
  * `data.md`: Thực thể dữ liệu, mô hình lưu trữ, DDL, toàn vẹn (`DATA-`, `DTD-`) (khi sở hữu dữ liệu).
  * `api.md`: Ranh giới giao tiếp mạng, hợp đồng, endpoint, schema (`API-`, `APD-`) (khi sở hữu/tiêu thụ API).
  * `ui-ux.md`: Luồng tác vụ, màn hình, visual tokens (`UI-`, `UXD-`) (khi có tương tác người dùng).
- `plans/`:
  * `foundation-setup-plan.md`: Chuẩn bị môi trường, scaffolding riêng (`FND-`).
  * `build-plan.md`: Kế hoạch xây dựng theo facet (`BLD-`).
  * `test-plan.md`: Kế hoạch kiểm thử theo facet (`TST-`).
  * `task-plan.md`: Phân rã nhiệm vụ thi công chi tiết, thứ tự dependency và waves (`TASK-`).

| Leaf Type | Đường dẫn Chuẩn | Trách nhiệm Kỹ thuật | Upstream | Downstream |
| :--- | :--- | :--- | :--- | :--- |
| **Spec Core** | `specs/spec.md` | Ngữ cảnh phân hệ, yêu cầu FR/NFR, kiến trúc nội bộ, giải pháp SOL-, quyết định thiết kế DD- | System Specs (`ARC-`) | Subsystem Facets, Plans |
| **Data Spec & Design** | `specs/data.md` | Thực thể dữ liệu, quy tắc toàn vẹn, DDL CSDL, vòng đời dữ liệu | System Specs, `ARC-`, STACK | Build Plan, Test Plan |
| **API Spec & Design** | `specs/api.md` | Ranh giới giao tiếp, REST/STOMP contracts, serialization | System Specs, `ARC-`, STACK | Build Plan, Test Plan |
| **UI/UX Spec & Design** | `specs/ui-ux.md` | Tác vụ người dùng, luồng tương tác, design tokens, layout | System Specs, `ARC-`, STACK | Build Plan, Test Plan |
| **Foundation Setup Plan** | `plans/foundation-setup-plan.md` | Kế hoạch chuẩn bị môi trường, công cụ riêng, chuỗi đóng gói và kiểm thử hợp đồng của phân hệ | System Foundation Plan, STACK, `ARC-` | `task-plan.md` |
| **Build Plan** | `plans/build-plan.md` | Kế hoạch xây dựng phân hệ; phân section theo facet (`BLD-`) | Subsystem Design elements, Foundation | `task-plan.md` / BUILD |
| **Test Plan** | `plans/test-plan.md` | Kế hoạch kiểm thử phân hệ; phân section theo facet (`TST-`) | Subsystem Specs (trực tiếp) | Quá trình TEST |
| **Task Plan** | `plans/task-plan.md` | Phân rã `BLD-`/`FND-` thành `TASK-`, giải quyết dependency và wave | `build-plan.md`, `foundation-setup-plan.md` | Quá trình BUILD (`TASK-`) |

---

## 3. Conventions & Standards (Quy chuẩn Quản lý & Định danh)

### 3.1. Document Control & Front Matter
Mọi tệp tài liệu trong cây SDLC bắt buộc bắt đầu bằng khối YAML Front Matter chuẩn theo §3.1 [sdlc-docs.md](sdlc-docs.md):

```yaml
---
title: <Tên tài liệu>
version: <MAJOR.MINOR>
status: Draft | In Review | Approved | Superseded | Deprecated
owner: <Vai trò chịu trách nhiệm>
type: meta | info | pi | stack | spec | plan
scope: SYS | BE | KSK | WEB | PROJECT
updated: YYYY-MM-DD
---
```

* **Trạng thái vòng đời tài liệu (Document Lifecycle)**: `Draft`, `In Review`, `Approved`, `Superseded`, `Deprecated`.
* **Trạng thái phần tử (Item Status)**:
  * `RQ-` / `GAP-`: `Open`, `In Progress`, `Resolved`, `Closed`.
  * `SRC-`: `Unverified`, `Verified`, `Obsolete`.
  * `INF-` / `ANL-`: `Draft`, `Reviewed`, `Superseded`, `Rejected`.
  * `RSK-`: `Open`, `In Progress`, `Mitigated`, `Closed`.
  * PI Decision (`PD-`): `Draft`, `In Review`, `Approved`, `Superseded`, `Deprecated`.
  * STACK (`STK-`): `Proposed`, `Approved`, `Superseded`, `Deprecated`.
  * Spec / Design / Decision (`DD-`): `Draft`, `In Review`, `Approved`, `Superseded`, `Deprecated`.
  * Plan / Foundation / Build / Task / Deploy: `Planned`, `Ready`, `In Progress`, `Blocked`, `Done`, `Cancelled`.
  * Test (`TST-`): `Planned`, `Ready`, `In Progress`, `Passed`, `Failed`, `Blocked`.
  * Gate: `Planned`, `Ready`, `Passed`, `Failed`, `Waived`.
* **Miễn Front Matter**: `README.md` (leaf điều hướng, không sở hữu item), `sdlc-docs.md` (chuẩn khung) và `meta.md` (metadata document system) được miễn khối front matter chuẩn artifact hoặc áp dụng type `meta`, scope `PROJECT`.

---

### 3.2. Cú pháp Định danh & Danh mục Tiền tố (ID Scheme)

Định dạng chuẩn: `<TYPE>-<SCOPE>-<NNN>` (có scope) hoặc `<TYPE>-<NNN>` (không scope, cấp dự án duy nhất).

| Tiền tố | Phân loại Phần tử | Leaf Sở hữu | Scope Áp dụng |
| :--- | :--- | :--- | :---: |
| `RQ-` | Câu hỏi nghiên cứu khảo sát | `system-docs/info.md` | `SYS` duy nhất (`RQ-001`) |
| `SRC-` | Nguồn khảo sát nghiên cứu | `system-docs/info.md` | `SYS` duy nhất (`SRC-001`) |
| `INF-` | Phát hiện / Sự thật khoa học | `system-docs/info.md` | `SYS` duy nhất (`INF-001`) |
| `ANL-` | Phân tích & Hàm ý nghiên cứu | `system-docs/info.md` | `SYS` duy nhất (`ANL-001`) |
| `GAP-` | Khoảng trống tri thức | `system-docs/info.md` | `SYS` duy nhất (`GAP-001`) |
| `PD-` | Quyết định khởi tạo dự án | `system-docs/pi.md` | `SYS` duy nhất (`PD-001`) |
| `STK-` | Phần tử công nghệ / Công cụ | `system-docs/tech-tool-stack.md` | `SYS` duy nhất (`STK-001`) |
| `ACT-` | Tác nhân người dùng | `system-docs/specs/spec.md` (System-level: `ACT-001`), subsystem reference lại | System-global / Subsystem local |
| `EXT-` | Hệ thống / Phần cứng bên ngoài | `system-docs/specs/spec.md` (System-level: `EXT-001`), subsystem reference lại | System-global / Subsystem local |
| `SRS-` | Yêu cầu hệ thống xuyên suốt | `system-docs/specs/spec.md` | `SYS` duy nhất (`SRS-001`) |
| `FR-` | Yêu cầu chức năng | `*/specs/spec.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `NFR-` | Yêu cầu phi chức năng (Chất lượng) | `*/specs/spec.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `UI-` | Đặc tả tương tác người dùng | `subsystem-docs/*/specs/ui-ux.md` | Có (`KSK`, `WEB`) |
| `API-` | Đặc tả interface / hợp đồng | `subsystem-docs/*/specs/api.md` | Có (`BE`, `KSK`, `WEB`) |
| `DATA-` | Đặc tả thực thể dữ liệu | `subsystem-docs/*/specs/data.md` | Có (`BE`, `KSK`, `WEB`) |
| `ARC-` | Phần tử kiến trúc & Topology | `system-docs/specs/spec.md` | `SYS` duy nhất (`ARC-001`) |
| `SOL-` | Giải pháp thiết kế nghiệp vụ/chất lượng | `*/specs/spec.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `UXD-` | Thiết kế giao diện & tokens | `subsystem-docs/*/specs/ui-ux.md` | Có (`KSK`, `WEB`) |
| `APD-` | Thiết kế API chi tiết | `subsystem-docs/*/specs/api.md` | Có (`BE`, `KSK`, `WEB`) |
| `DTD-` | Thiết kế dữ liệu chi tiết | `subsystem-docs/*/specs/data.md` | Có (`BE`, `KSK`, `WEB`) |
| `DD-` | Quyết định thiết kế (Design Decision) | `*/specs/spec.md` hoặc Spec facet sở hữu Design | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `APC-` | Quyết định tiếp cận (Approach Decision) | `*/plans/<plan>.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `PRJ-` | Giai đoạn / Mốc / Checkpoint dự án | `system-docs/plans/project-plan.md` | `SYS` (`PRJ-001`) |
| `ROL-` | Vai trò dự án | `system-docs/plans/project-plan.md` | `SYS` (`ROL-001`) |
| `RSK-` | Rủi ro dự án | `system-docs/plans/project-plan.md` | `SYS` (`RSK-001`) |
| `FND-` | Công việc chuẩn bị nền tảng | `*/plans/foundation-setup-plan.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `BLD-` | Công việc thi công / Build | `subsystem-docs/*/plans/build-plan.md` | Có (`BE`, `KSK`, `WEB`) |
| `TASK-`| Nhiệm vụ thi công thực tế cấp phân hệ | `subsystem-docs/*/plans/task-plan.md` | Có (`BE`, `KSK`, `WEB`) |
| `TST-` | Ca kiểm thử / Test item | `*/plans/test-plan.md` | Có (`SYS`, `BE`, `KSK`, `WEB`) |
| `DPL-` | Công việc triển khai / Vận hành | `system-docs/plans/deploy-plan.md` | `SYS` duy nhất (`DPL-SYS-`) |

> *Quy tắc Dãy số Thống nhất (§10)*: Mỗi cặp `(TYPE, SCOPE)` có một sequence số duy nhất, tăng dần và **bất biến (Immutable)**. Tuyệt đối không tái sử dụng mã ID sau khi xóa hoặc sửa đổi.

---

### 3.3. Quy định Schema Chuẩn hóa Tách bạch Required / Optional

Tuân thủ nghiêm ngặt quy định tại §3.1 và §4–§8 của `sdlc-docs.md`:

* **Research Questions (`RQ-`)**: `Required: ID, Question, Status; Optional: Serves`
* **Sources (`SRC-`)**: `Required: ID, Citation, Status; Optional: Type, Published, Accessed, Reliability, Location`
* **Findings (`INF-`)**: `Required: ID, Statement, Status; Optional: Type, Topic, Derived from, Confidence, Answers, Implication, Conflicts with`
* **Analysis (`ANL-`)**: `Required: ID, Analysis, Status; Optional: Derived from, Impacts`
* **Research Gaps (`GAP-`)**: `Required: ID, Kind, Missing knowledge, Status; Optional: Refers to, Blocks, Resolution`
* **Decisions (`PD-`, `DD-`, `APC-`)**: `Required: ID, Decision, Rationale, Basis, Status; Optional: Alternatives, Consequences`
* **Stack items (`STK-`)**: `Required: ID, Category, Name, Applies to, Role, Status; Optional: Version, Basis, Requires, Constrained by`
* **Requirements (`SRS-`, `FR-`, `NFR-`, `UI-`, `API-`, `DATA-`)**: `Required: ID, Statement, Category, Priority, Acceptance, Status; Optional: Basis, Applies to`
* **Design elements (`ARC-`, `SOL-`, `UXD-`, `APD-`, `DTD-`)**: `Required: ID, Name, Definition, Status; Optional: Uses, Realizes, Decisions`
* **Plan Work items (`FND-`, `BLD-`, `TST-`, `DPL-`)**: `Required: ID, Name, Covers, Done when, Status; Optional: Description, Depends on`
* **Gate items (`TST-`, `DPL-`)**: `Required: ID, Name, Exit criteria, Owner, Status; Optional: Description, Depends on`
* **Tasks (`TASK-`)**: `Required: ID, Name, Derived from, Wave, Done when, Status; Optional: Description, Depends on`
* **Project Phases / Milestones / Checkpoints (`PRJ-`)**: `Required: ID, Name, Type, Owner, Status; Optional: Includes, Depends on, Target, Estimate, Exit criteria`

---

## 4. Traceability & Ownership (Quy tắc Truy vết & Quyền sở hữu)

### 4.1. Nguyên tắc Đơn sở hữu (Single Ownership)
> **Mỗi nội dung kỹ thuật chỉ có đúng một Leaf làm Owner duy nhất. Mọi tài liệu khác bắt buộc tham chiếu qua mã ID, tuyệt đối không sao chép nội dung.**

### 4.2. Chiều tham chiếu Một chiều & Ma trận Quan hệ
> **Trace lifecycle: downstream → upstream. Tuyệt đối không tạo reference ngược.**

* `Realizes`: Design ➔ Requirement
* `Uses`: Design ➔ Design, `STK-`, `EXT-`
* `Decisions`: Spec / Design ➔ `DD-`
* `Covers`:
  * Foundation Plan ➔ `STK-`, `ARC-`
  * Build Plan ➔ Design elements (`ARC-`, `SOL-`, `DTD-`, `APD-`, `UXD-`)
  * Test Plan ➔ Requirements (`SRS-`, `FR-`, `NFR-`, `UI-`, `API-`, `DATA-`)
  * Deploy Plan ➔ `ARC-`, `STK-`, `NFR-`
* `Derived from`:
  * `INF-` ➔ `SRC-`
  * `ANL-` ➔ `SRC-`, `INF-`
  * `TASK-` ➔ Đúng một `BLD-` hoặc `FND-` cùng scope
* `Constrained by`: `STK-` ➔ `SRS-`, `NFR-` (Ràng buộc kỹ thuật, không phải lifecycle basis)

---

## 5. Bảng Điều chỉnh Dự án (Project Tailoring)

Tuân thủ Mục 2.2 của `sdlc-docs.md`, dự án Face Attendance System thực hiện các điều chỉnh tailoring chính thức sau:

| Element | Default | Applied | Reason | Impact |
| :--- | :--- | :--- | :--- | :--- |
| `backend-service/ui-ux` | Active facet | Bỏ qua (Tailored Out) | Phân hệ chạy chế độ headless daemon / REST API service; không có giao diện tương tác người dùng trực tiếp. | Không tạo `specs/ui-ux.md` và section UI/UX trong các plan của Backend; không có `UXD-BE-` hay `TASK-BE-` về UI. |
| `backend-service/data` | Optional facet | Kích hoạt (Active) | Sở hữu và quản lý lưu trữ bền vững CSDL PostgreSQL 16 trung tâm và Caffeine Cache. | Tạo `specs/data.md`, cùng section Data trong build-plan và test-plan. |
| `backend-service/api` | Optional facet | Kích hoạt (Active) | Cung cấp ranh giới giao tiếp REST API và STOMP Broker cho toàn bộ Kiosk và Web. | Tạo `specs/api.md`, cùng section API trong build-plan và test-plan. |
| `kiosk-app/data` | Optional facet | Kích hoạt (Active) | Sở hữu và quản lý hàng đợi ngoại tuyến SQLite WAL cục bộ và Ma trận bộ nhớ RAM. | Tạo `specs/data.md`, cùng section Data trong build-plan và test-plan. |
| `kiosk-app/api` | Optional facet | Kích hoạt (Active) | Có ranh giới truyền thông mạng tiêu thụ REST API và lắng nghe STOMP. | Tạo `specs/api.md`, cùng section API trong build-plan và test-plan. |
| `kiosk-app/ui-ux` | Optional facet | Kích hoạt (Active) | Màn hình cảm ứng dọc 9:16 tương tác trực tiếp với cán bộ nhân viên điểm danh. | Tạo `specs/ui-ux.md`, cùng section UI/UX trong build-plan và test-plan. |
| `web-portal/data` | Optional facet | Kích hoạt (Active) | Quản lý lưu trữ trạng thái phiên xác thực (LocalStorage), tiến trình ký cam kết và bộ đệm TanStack Query. | Tạo `specs/data.md`, cùng section Data trong build-plan và test-plan. |
| `web-portal/api` | Optional facet | Kích hoạt (Active) | Có ranh giới truyền thông mạng tiêu thụ REST API và lắng nghe STOMP. | Tạo `specs/api.md`, cùng section API trong build-plan và test-plan. |
| `web-portal/ui-ux` | Optional facet | Kích hoạt (Active) | Giao diện Single Page Application tương tác trực tiếp với Quản lý HR và Nhân viên. | Tạo `specs/ui-ux.md`, cùng section UI/UX trong build-plan và test-plan. |
| `System Build Plan` | Bắt buộc ở v2.0 | **Loại bỏ (Tailored Out)** | Tuân thủ bất biến §8.4 `sdlc-docs.md v3.x`: Build cấp system là tổng hợp execution của các subsystem; không tạo `BLD-SYS-*`. | Xóa `system-docs/plans/build-plan.md`; điều phối phát hành chuyển sang `deploy-plan.md` và `project-plan.md`. |
| `docs/README.md` & các `subsystem-docs/*/README.md` | Không thuộc cây mặc định | Tồn tại như leaf điều hướng | Điểm vào tra cứu cho người và AI (§12.5); không sở hữu ID item nào. | Không tạo và không dùng ID; mọi nội dung kỹ thuật vẫn thuộc leaf tương ứng. |
| Front matter cho `sdlc-docs.md` & các `README.md` | Mọi leaf bắt buộc có front matter | Miễn | Đây là chuẩn khung và leaf điều hướng, không phải artifact SDLC. | Gate bỏ qua các tệp này khi kiểm tra front matter. |

---

## 6. Terms (Thuật ngữ của Bộ tài liệu)

| Thuật ngữ | Nghĩa trong dự án |
| :--- | :--- |
| Leaf | Một tệp tài liệu trong cây; mỗi leaf có một owner nội dung. |
| Item | Một dòng có ID trong bảng của leaf (requirement, definition, design element, work item, task, test item). |
| Spec set | Toàn bộ các file trong thư mục `specs/` của một scope (`spec.md` + các Spec facets). |
| Spec core | Tệp `spec.md`; giữ context, requirements (FR-/NFR-), architecture/internal architecture, solutions (SOL-) và decisions của scope. |
| Spec facet | Spec file theo góc trách nhiệm chuyên biệt (`data.md`, `api.md`, `ui-ux.md`). |
| Execution-bearing | Work item đủ nhỏ để thực hiện trực tiếp mà không cần phân rã `TASK-` con. |
| SCOPE | Mã phạm vi trong ID: `SYS` (cấp hệ thống), `BE`, `KSK`, `WEB` (cấp phân hệ / subsystem). |
| Facet | Góc trách nhiệm chuyên biệt của phân hệ: `data`, `api`, `ui-ux`. |
| Trace field | Trường liên kết quan hệ giữa các item: `Basis`, `Uses`, `Realizes`, `Decisions`, `Covers`, `Derived from`, `Depends on`, `Requires`, `Constrained by`, `Applies to`. |
| Task Attribute | Các thuộc tính thực thi của `TASK-`: `Wave` (số tự nhiên $\ge 1$ biểu diễn thứ tự thực thi), `Done when`, `Status`. |
| Evidence | Sản phẩm của BUILD/TEST/DEPLOY nằm ngoài cây tài liệu (mã nguồn, kết quả test, release record). |

---

## 7. Decision Register (Quyết định Kiến trúc & Vận hành Chờ chốt)

Các quyết định dưới đây phải được chốt **tại leaf sở hữu** trước khi bộ tài liệu đạt trạng thái nhất quán. Cột "Số" chỉ là nhãn theo dõi, **không phải ID item**; giá trị đã chốt phải được ghi thành item `PD-`/`DD-`/`APC-` tại leaf sở hữu.

| Số | Nội dung cần chốt | Leaf sở hữu | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | Mô hình token: Access Token 1 giờ + Refresh Token 7 ngày dạng băm một chiều trong CSDL PostgreSQL (`DD-SYS-026`) | `system-docs/specs/spec.md` (`SRS-006`) và `subsystem-docs/backend-service/specs/spec.md` (`FR-BE-001`, `DD-BE-001`) | **Đã chốt** (v1.1) |
| 2 | Thuật toán băm OTP: HMAC-SHA-256 kèm pepper bảo mật phục vụ tra cứu tức thì | `subsystem-docs/backend-service/specs/data.md` và `subsystem-docs/backend-service/specs/spec.md` (`FR-BE-005`) | **Đã chốt** (v1.1) |
| 3 | Ngưỡng Cosine similarity (0.50) và Liveness (0.85 vận hành, 0.90 enrollment +5% margin) | `system-docs/specs/spec.md` (`FR-SYS-002`, `FR-SYS-009`, `DD-SYS-027`) | **Đã chốt** (v1.5) |
| 4 | Chu kỳ tính toán nhận diện toàn trình tại trạm biên: $\le 350\text{ ms}$ trên CPU cho danh mục 1,000 NV | `system-docs/specs/spec.md` (`NFR-SYS-001`, `NFR-SYS-003`) và `kiosk-app/specs/spec.md` (`NFR-KSK-001`) | **Đã chốt** (v1.5) |
| 5 | Chỉ số nhận diện sinh trắc học 1:N: FNIR $\le 5.0\%$ tại FPIR $\le 0.1\%$ trên tập 1,000 NV | `system-docs/pi.md` và `kiosk-app/specs/spec.md` (`NFR-KSK-006`) | **Đã chốt** (v1.5) |
| 6 | Giao thức thời gian thực: Kiosk dùng raw WebSocket STOMP (`/ws`), Web Portal dùng SockJS (`/ws-sockjs`) | `system-docs/specs/spec.md` (`ARC-002`) và `backend-service/specs/api.md` | **Đã chốt** (v1.1) |
| 7 | Mã hóa tĩnh vector sinh trắc học: Bắt buộc AES-256-GCM đối xứng (IV 12B, Tag 16B) kèm Master Key độc lập | `system-docs/specs/spec.md` (`ARC-005`, `DD-SYS-028`) và `backend-service/specs/data.md` | **Đã chốt** (v1.1) |
| 8 | Mục tiêu độ sẵn sàng hệ thống: $\ge 99.9\%$ giờ hành chính; RPO = 0 cho offline punch; RTO $\le 30$ phút | `system-docs/plans/deploy-plan.md` và `kiosk-app/specs/data.md` | **Đã chốt** (v2.6) |
| 9 | Tải mục tiêu Backend: Đỉnh $\ge 200\text{ RPS}$ cho xác thực điểm danh, $\le 300\text{ ms}$ thời gian phản hồi | `subsystem-docs/backend-service/specs/spec.md` (`NFR-BE-002`) | **Đã chốt** (v1.1) |
| 10 | Bắt buộc TLS 1.3 và Rate Limiting $\le 5\text{ req/min}$ trên các endpoint xác thực nhạy cảm | `system-docs/specs/spec.md` (`SRS-002`, `ARC-013`) | **Đã chốt** (v1.1) |
