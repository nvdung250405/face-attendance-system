# Bộ tài liệu hướng dẫn SDLC

# 1. Mục đích và phạm vi

## 1.1. Mục đích

Tài liệu này là chuẩn khung (framework) dùng chung cho nhiều dự án. Nó định nghĩa cấu trúc, vai trò, phạm vi sở hữu, schema, quy tắc traceability và cách sử dụng bộ tài liệu SDLC ở hai cấp: **System-level** và **Service-level**.

Bộ tài liệu theo hướng docs-as-code (Markdown, quản lý bằng VCS, review bằng pull request) và đối chiếu với các chuẩn thực tế của ngành (mục 15).

`meta.md` là lớp metadata của bộ tài liệu, không phải artifact trong lifecycle SDLC (mục 3).

## 1.2. Phạm vi

- **Trong phạm vi:** tài liệu nghiên cứu, hoạch định, đặc tả, thiết kế và kế hoạch — là input cho build, kiểm thử và triển khai.
- **Ngoài phạm vi (evidence):** code, kết quả build/test, release record, dữ liệu vận hành, runbook... Chúng sinh ra từ BUILD, TEST, DEPLOY, nằm ở công cụ tương ứng (VCS, CI/CD, quản lý test, hệ thống release/vận hành) và được trace về cây này bằng ID (`FND-`, `BLD-`, `TASK-`, `TST-`, `DPL-`); không có file riêng trong `docs/`.
- **Sau DEPLOY:** không có leaf riêng. Yêu cầu vận hành nằm ở `NFR-` và `ARC-`; việc chuẩn bị vận hành nằm ở Deploy Plan (`Operational Readiness`); thay đổi sau phát hành đi lại chuỗi từ tầng bị ảnh hưởng (mục 14.3).

## 1.3. Chuỗi SDLC chính

```text
INFO
  ↓
PI — Project Initiation
  ↓
SPEC — Requirements (srs/)   ‖   TECH & TOOL STACK     # song song: cùng upstream INFO, PI
  ↓                                   ↓
DESIGN — Design (dds/)  ←─────────────┘
  ↓
PLAN — Plans (plans/ và các plan của service)
  ↓
BUILD
  ↓
TEST
  ↓
DEPLOY
```

SPEC trung lập công nghệ nên STACK không phải upstream của SPEC. Ràng buộc công nghệ bắt buộc do bên ngoài áp đặt được ghi ở PI (`Constraints`) hoặc SPEC (requirement dạng ràng buộc); STACK trích chúng trong `Basis`.

## 1.4. Câu hỏi của từng tầng

Đây là nơi duy nhất định nghĩa câu hỏi mà mỗi tầng chịu trách nhiệm trả lời; các mục sau không lặp lại.

| Tầng  | Trả lời câu hỏi                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------- |
| INFO   | Ta biết gì: sự thật, bằng chứng, nghiên cứu và phân tích?                                      |
| PI     | Làm gì, trong phạm vi nào, theo định hướng và quyết định cấp dự án nào?                   |
| STACK  | Dùng công nghệ, framework, công cụ và nền tảng nào?                                              |
| SPEC   | Hệ thống/service phải làm gì và phải đáp ứng điều gì?                                        |
| DESIGN | Các requirement được hiện thực bằng cấu trúc, behavior và quyết định kỹ thuật nào?        |
| PLAN   | Cần chuẩn bị, build, kiểm thử và triển khai những work item nào, theo dependency và cách nào? |
| BUILD  | Implementation (evidence)                                                                                 |
| TEST   | Verification (evidence)                                                                                   |
| DEPLOY | Release và đưa vào vận hành (evidence)                                                              |

## 1.5. Nguyên tắc xuyên suốt

```text
Correct → Complete → Abstract → Reusable
```

Bốn phép thử chi tiết ở mục 13.1.

---

# 2. Cấu trúc thư mục

```text
# Đọc cây: comment mô tả GIAI ĐOẠN — câu hỏi file trả lời — ID chính và hướng trace.
# NGANG (system-docs): toàn hệ thống đi INFO → PI → (SPEC ‖ STACK) → DESIGN → PLAN.
# DỌC (service-docs): mỗi facet đi SPEC → DESIGN → BUILD PLAN → TEST PLAN;
#                    foundation và task plan là lớp toàn service, hội tụ vào BUILD.
# Prefix trong comment là prefix chính của leaf; `DD-` tồn tại ở mọi design leaf nhưng không lặp lại ở từng dòng.
# BUILD / TEST / DEPLOY là evidence nằm ngoài cây, trace ngược về tài liệu bằng ID.

docs/
│
├── meta.md                                      # Ngoài SDLC — Metadata và quy ước quản lý toàn bộ document system;
│                                                # không phải artifact trong lifecycle.
│
├── system-docs/                                 # NGANG — toàn hệ thống: INFO → PI → (SPEC ‖ STACK) → DESIGN → PLAN.
│   ├── info.md                                  # INFO — Ta biết gì?  [RQ-/SRC-/INF-/ANL-/GAP-]
│   ├── pi.md                                    # PI — Làm gì, phạm vi nào, quyết định gì?  [PD-] Basis INF-/ANL-
│   ├── tech-tool-stack.md                       # STACK — Dùng công nghệ, công cụ nào?  [STK-] Basis PI/INFO
│   │
│   ├── srs/                                     # SPEC — Hệ thống phải làm gì và phải đáp ứng điều gì?
│   │   ├── srs.md                               # System context và cross-cutting requirements.  [ACT-/EXT-/SRS-]
│   │   ├── fr-nfr-specs.md                      # Capability, business rule và quality requirements.  [FR-/NFR-]
│   │   ├── ui-ux-specs.md                       # User task, interaction và experience requirements.  [UI-]
│   │   ├── api-specs.md                         # Interface, operation, contract và constraints.  [API-]
│   │   └── data-specs.md                        # Data entity, rule, lifecycle và protection.  [DATA-]
│   │
│   ├── dds/                                     # DESIGN — Requirement được hiện thực thế nào?
│   │   ├── dds.md                               # Architecture, service boundary và cross-cutting design.  [ARC-]
│   │   ├── fr-nfr-design.md                     # Logic và quality mechanism hiện thực FR/NFR.  [SOL-] Realizes FR-/NFR-
│   │   ├── ui-ux-design.md                      # UI/UX design; cấu trúc hóa quyết định từ UI artifact.  [UXD-] Realizes UI-
│   │   ├── api-design.md                        # Interface, contract và behavior cụ thể để implement.  [APD-] Realizes API-
│   │   └── data-design.md                       # Data model, storage, access và data behavior.  [DTD-] Realizes DATA-
│   │
│   └── plans/                                   # PLAN — Chuẩn bị và tổ chức execution từ system-level.
│       ├── project-plan.md                      # Phase, milestone, role, schedule và risk.  [PRJ-/RSK-]
│       ├── foundation-setup-plan.md             # Foundation chung để build bắt đầu.  [FND-] Covers STK-/ARC-
│       ├── build-plan.md                        # SYSTEM BUILD PLAN — Build work cấp system và integration xuyên service.  [BLD-] Covers Design
│       ├── test-plan.md                         # Kiểm chứng requirement cấp system/xuyên service.  [TST-] Covers Spec
│       └── deploy-plan.md                       # Release, rollout, rollback và operational readiness.  [DPL-]
│
└── service-docs/                                # DỌC — MỘT service; nhân bản cho mỗi service.
    │                                             # Facet: SPEC → DESIGN → BUILD PLAN → TEST PLAN.
    │                                             # Foundation → TASK PLAN → BUILD là luồng execution toàn service.
    │
    ├── fr-nfr/                                  # FACET FR/NFR (luôn có) — capability, business rule, quality.
    │   ├── fr-nfr-specs.md                      # SPEC — Service phải làm gì, đáp ứng quality nào?  [FR-/NFR-]
    │   ├── fr-nfr-design.md                     # DESIGN — Hiện thực bằng logic, component, mechanism nào?  [SOL-]
    │   ├── fr-nfr-build-plan.md                 # BUILD PLAN — Cần build BLD- nào cho FR/NFR; sở hữu Integration xuyên facet.  [BLD-]
    │   └── fr-nfr-test-plan.md                  # TEST PLAN — Kiểm chứng FR/NFR bằng cách nào?  [TST-]
    │
    ├── data/                                    # FACET DATA (có điều kiện) — service sở hữu persistent data/DB.
    │   ├── data-specs.md                        # SPEC — Data nào tồn tại, rule/lifecycle/protection nào?  [DATA-]
    │   ├── data-design.md                       # DESIGN — Data model, storage và access thiết kế thế nào?  [DTD-]
    │   ├── data-build-plan.md                   # BUILD PLAN — Cần build BLD- nào cho data design?  [BLD-]
    │   └── data-test-plan.md                    # TEST PLAN — Kiểm chứng data model, rule và persistence thế nào?  [TST-]
    │
    ├── api/                                     # FACET API (có điều kiện) — service có external interaction boundary.
    │   ├── api-specs.md                         # SPEC — Contract/requirement API mà service sở hữu (tùy ownership upstream).  [API-]
    │   ├── api-design.md                        # DESIGN — Interface, contract và behavior thiết kế thế nào?  [APD-]
    │   ├── api-build-plan.md                    # BUILD PLAN — Cần build BLD- nào cho API/integration?  [BLD-]
    │   └── api-test-plan.md                     # TEST PLAN — Kiểm chứng interface, contract và integration thế nào?  [TST-]
    │
    ├── ui-ux/                                   # FACET UI/UX (có điều kiện) — service có người dùng trực tiếp.
    │   ├── ui-ux-specs.md                       # SPEC — User task, journey, interaction và experience cần gì?  [UI-]
    │   ├── ui-ux-design.md                      # DESIGN — UI/UX được thiết kế thế nào từ UI artifact?  [UXD-]
    │   ├── ui-ux-build-plan.md                  # BUILD PLAN — Cần build BLD- nào cho UI/UX design?  [BLD-]
    │   └── ui-ux-test-plan.md                   # TEST PLAN — Kiểm chứng UI/UX, interaction và accessibility thế nào?  [TST-]
    │
    ├── foundation-setup-plan.md                 # FOUNDATION SETUP (luôn có) — Foundation riêng của service;  [FND-]
    │                                                # phần dùng chung phụ thuộc system foundation.
    │
    └── task-plan.md                             # TASK PLAN (luôn có) — Gom BLD-/FND-, phân rã thành TASK-,
                                                 # xác định dependency và gom TASK thành execution waves.
                                                 # BLD- = đơn vị planning · TASK- = đơn vị thi công · Wave = grouping thứ tự.
```

> Cây là tập tối đa. `fr-nfr/`, `foundation-setup-plan.md` và `task-plan.md` ở gốc `service-docs/` luôn có; `data/`, `api/`, `ui-ux/` xuất hiện theo responsibility thực tế. `api-specs.md` chỉ có khi service là owner của API requirements/contracts; nếu owner ở upstream thì bỏ leaf này và trace trực tiếp về upstream (mục 10).

## 2.1. Hai hướng phát triển của bộ tài liệu

Cả hai cấp dùng chung một ma trận **giai đoạn × facet**:

| Giai đoạn \ Facet | FR/NFR (`fr-nfr/`)  | Data                | API (`api/`) — Spec optional | UI/UX                |
| ------------------- | --------------------- | ------------------- | ------------------------------- | -------------------- |
| Specs               | `fr-nfr-specs`      | `data-specs`      | `api-specs`                   | `ui-ux-specs`      |
| Design              | `fr-nfr-design`     | `data-design`     | `api-design`                  | `ui-ux-design`     |
| Build plan          | `fr-nfr-build-plan` | `data-build-plan` | `api-build-plan`              | `ui-ux-build-plan` |
| Test plan           | `fr-nfr-test-plan`  | `data-test-plan`  | `api-test-plan`               | `ui-ux-test-plan`  |

- **Cấp hệ thống — phát triển theo chiều ngang.** Mỗi giai đoạn đi qua toàn bộ facet của hệ thống rồi mới chuyển sang giai đoạn kế: `srs/` → `dds/` → system Plans. Build/Test/Deploy cấp system có thể chứa phần xuyên service. Framework mặc định **không có system `task-plan.md`**; `TASK-` là execution layer ở service-level. Nếu một dự án thực sự cần execution decomposition ở cấp system, đó là tailoring và phải được ghi rõ trong `meta.md`.
- **Cấp dịch vụ — phát triển theo chiều dọc.** Mỗi facet đi trọn `specs → design → build-plan → test-plan`; các facet có thể tiến hành song song. `foundation-setup-plan.md` và `task-plan.md` là hai leaf toàn service: foundation chuẩn bị điều kiện build; task plan là lớp hội tụ, gom `BLD-`/`FND-`, phân rã thành `TASK-`, xác định dependency và nhóm task thành waves.
- **Workflow execution của service.**

```text
Facet SPEC ──→ Facet DESIGN ──→ Facet BUILD PLAN ──┐
                                                    ├──→ TASK PLAN ──→ BUILD
Foundation SETUP ───────────────────────────────────┘
Facet SPEC ─────────────────────→ Facet TEST PLAN ───────────────→ TEST
```

- `TASK PLAN` không tạo lại build work và không thay thế facet build plans. Nó chỉ chuẩn hóa work đã có thành execution tasks.
- **Điểm nối.** `dds.md` phân rã hệ thống thành service bằng `ARC-`. Service-level bắt đầu khi `ARC-` của service đó đã Approved; Service Spec trỏ về System Spec hoặc `ARC-` bằng `Basis` (mục 11.4). Phát hiện ở service-level cần đổi upstream thì sửa tại owner ở system-level, không sửa bản sao.

## 2.2. Nhiều service và điều chỉnh theo quy mô

- **Service** trong tài liệu này là _unit_ theo nghĩa rộng: microservice, module, application, library, pipeline... — mọi đơn vị phân rã có ranh giới và trách nhiệm riêng.
- `service-docs/` trong cây là mẫu cho **một** unit. Mỗi unit có một bản riêng, vị trí do `meta.md` quy định (ví dụ `docs/service-docs/<service-code>/` hoặc trong repo của unit). `<service-code>` là SCOPE trong ID (mục 12).
- Điều kiện tồn tại của facet áp dụng như nhau cho system-level và service-level: `ui-ux` khi có người dùng trực tiếp, `api` khi có external interaction boundary, `data` khi sở hữu persistent data; `fr-nfr` luôn có.
- Hệ thống chỉ có một unit vẫn giữ `system-docs/` (ngang) và một `service-docs/` (dọc). Service Spec và Service Design chỉ ghi phần refine thêm; phần còn lại tham chiếu bằng ID, không copy.
- Mọi điều chỉnh (bỏ/thêm leaf, bỏ/thêm facet, đổi schema mặc định) được ghi trong `meta.md` kèm lý do và tác động.

### Tailoring record trong `meta.md`

```text
Element | Default | Applied | Reason | Impact
```

- `Default` tham chiếu cây/schema mặc định trong framework; `Applied` ghi lựa chọn thực tế của dự án.
- Nếu thêm một leaf ngoài cây mặc định, `meta.md` phải nêu rõ owner, upstream/downstream, prefix/ID và trace rules của leaf đó.
- Tailoring không được phá vỡ các bất biến: một owner cho mỗi nội dung, ID bất biến, trace bằng ID, và không biến execution grouping thành một loại work item mới.

---

# 3. META — Metadata của bộ tài liệu

`META` là thông tin mô tả và quản trị **document system**, không phải tài liệu chính trong SDLC.

## 3.1. Quan hệ giữa tài liệu này và `meta.md`

- **Tài liệu này** là chuẩn khung: quy tắc và giá trị mặc định, định nghĩa một lần.
- **`meta.md`** là bản áp dụng cho một dự án: Tree và Registry thực tế (unit nào, facet nào, SCOPE nào), giá trị khác mặc định, thuật ngữ riêng. `meta.md` chỉ ghi phần cụ thể hóa hoặc khác mặc định, không chép lại quy tắc.

```text
META
├── Tree           # Cây tài liệu thực tế: unit nào, facet nào, nhánh nào dùng khi nào
├── Registry       # Mỗi leaf một dòng: mục đích, upstream, ownership, điều kiện áp dụng
├── Conventions    # ID scheme, naming, versioning, status lifecycle, schema chung
├── Traceability   # Hướng trace, quy tắc mỗi nội dung chỉ có một owner
└── Terms          # Thuật ngữ của bộ tài liệu: SRS, DDS, PI...
```

## 3.2. Registry mặc định

Theo mẫu tên file, áp dụng cho cả hai cấp.

| Leaf                                 | Upstream                                         | Downstream                                                              |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `info.md`                          | Nguồn bên ngoài (`SRC-`)                    | PI, SPEC, STACK                                                         |
| `pi.md`                            | INFO                                             | STACK, SPEC,`project-plan.md`                                         |
| `tech-tool-stack.md`               | INFO, PI                                         | DESIGN, các Plan                                                       |
| `srs.md`                           | INFO, PI                                         | Các leaf SPEC khác, DESIGN; Plan/Test thông qua các item dẫn xuất |
| `*-specs.md`                       | INFO, PI; System Spec và`ARC-` (với service) | `*-design.md`, Test Plan                                              |
| `dds.md`                           | SPEC, STACK, PI                                  | `*-design.md`, Service Spec qua `ARC-`, Deploy Plan                 |
| `*-design.md`                      | Spec cùng facet, STACK,`ARC-`                 | `*-build-plan.md`, Deploy Plan                                        |
| `project-plan.md`                  | PI, các Plan                                    | —                                                                      |
| `foundation-setup-plan.md`         | STACK,`ARC-`                                   | Task Plan / Build                                                       |
| `*-build-plan.md`                  | Design cùng facet, Foundation                   | Task Plan                                                               |
| `build-plan.md` (system-docs)      | Design cấp system, Foundation                   | BUILD                                                                   |
| `task-plan.md` (service-docs)      | `*-build-plan.md` và service Foundation       | BUILD                                                                   |
| `test-plan.md`, `*-test-plan.md` | Spec cùng phạm vi                              | TEST                                                                    |
| `deploy-plan.md`                   | `ARC-` topology, `STK-`, `NFR-`            | DEPLOY                                                                  |

## 3.3. Thuật ngữ

| Thuật ngữ              | Nghĩa                                                                                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layer (tầng)            | INFO, PI, STACK, SPEC, DESIGN, PLAN (mục 1.4)                                                                                                                                                                                                              |
| Leaf                     | Một file tài liệu trong cây; mỗi leaf có một owner nội dung                                                                                                                                                                                         |
| Facet                    | Một góc trách nhiệm: FR/NFR (`fr-nfr`), Data, API, UI/UX                                                                                                                                                                                              |
| Unit / Service           | Đơn vị phân rã có ranh giới và trách nhiệm riêng (mục 2.2)                                                                                                                                                                                      |
| Scope                    | `SYS` ở system-level, mã service ở service-level; dùng trong ID                                                                                                                                                                                       |
| SRS                      | Requirements Specification. Thư mục`srs/` là tầng SPEC; `srs.md` là System Context và Cross-cutting Requirements                                                                                                                                  |
| DDS                      | Detailed Design Specification. Thư mục`dds/` là tầng DESIGN; `dds.md` là System Architecture và Cross-cutting Design                                                                                                                              |
| PI                       | Project Initiation                                                                                                                                                                                                                                          |
| Task                     | Đơn vị thực thi`TASK-` ở service-level, được phân rã từ đúng một `BLD-` hoặc `FND-`; đủ nhỏ để tập trung, thực hiện và kiểm tra trong một thay đổi; có `Depends on`, `Wave`, `Done when` và `Status` rõ ràng. |
| Wave                     | Nhãn grouping cục bộ của các`TASK-` theo thứ tự thực hiện; là **projection/denormalized view của dependency graph**, không phải work item và không phải execution unit.                                                             |
| Requirement / Definition | Requirement: điều phải thực hiện/đáp ứng. Definition: khái niệm cần thống nhất (`ACT-`, `EXT-`, Data Entities)                                                                                                                             |
| Baseline                 | Trạng thái leaf đã Approved và được gắn tag trong VCS                                                                                                                                                                                              |
| Evidence                 | Sản phẩm thực thi của BUILD, TEST, DEPLOY, nằm ngoài cây (mục 1.2)                                                                                                                                                                                  |

## 3.4. Conventions mặc định

**Document control.** Mọi leaf bắt đầu bằng front matter:

```yaml
---
title: <tên leaf>
version: <MAJOR.MINOR>
status: Draft | In Review | Approved | Baselined | Deprecated
owner: <vai trò chịu trách nhiệm>
---
```

- Lịch sử thay đổi là lịch sử VCS (commit, pull request); không giữ bảng revision history trong file.
- `Baselined` = tag trong VCS. Sau baseline, mọi thay đổi đi qua change request (pull request kèm impact analysis dựa trên trace, mục 14.3).
- `MINOR` tăng khi bổ sung hoặc làm rõ; `MAJOR` tăng khi đổi ý nghĩa của item đã Approved.

**Status của item** (theo loại item):

| Loại item                                                        | Giá trị                                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `RQ-`, `GAP-`                                                 | Draft · Open · In progress · Resolved · Closed · Obsolete       |
| `ANL-`                                                          | Draft · Reviewed · Accepted · Superseded by`<ID>` · Deprecated |
| `SRC-`, `INF-`                                                | Unverified · Verified · Obsolete                                   |
| Decision (`PD-`, `DD-`, `APC-`)                             | Proposed · Accepted · Superseded by`<ID>` · Deprecated          |
| `STK-`                                                          | Proposed · Adopted · Superseded by`<ID>` · Deprecated           |
| Spec item                                                         | Draft · Approved · Implemented · Verified · Deferred · Rejected |
| Design element (`ARC-`, `SOL-`, `UXD-`, `APD-`, `DTD-`) | Proposed · Accepted · Implemented · Deprecated                    |
| Work item (`FND-`, `BLD-`, `TST-`, `DPL-`, `PRJ-`)      | Planned · In progress · Blocked · Done · Cancelled               |
| Task (`TASK-`)                                                  | Ready · In progress · Blocked · Done · Cancelled                 |
| `RSK-`                                                          | Open · Mitigating · Accepted · Closed                             |

`Implemented` và `Verified` của Spec item phản ánh evidence từ BUILD và TEST. CI chỉ có thể tự động suy ra/cập nhật các trạng thái này khi project đã cấu hình mapping evidence → ID; mặc định framework không giả định CI tự động cập nhật trạng thái tài liệu.

**Priority:** MoSCoW — Must · Should · Could · Won't (cho đợt phát hành hiện tại).

**Statement và Acceptance.**

- `Statement` một ý, đơn nghĩa, kiểm chứng được; khuyến nghị dạng "shall" (ISO/IEC/IEEE 29148) hoặc mẫu EARS.
- `Acceptance` là ngưỡng đo được hoặc kịch bản Given/When/Then, kèm cách kiểm chứng: test, inspection, analysis hoặc demonstration.

**Decision schema** (định nghĩa một lần, dùng cho `PD-`, `DD-`, `APC-`):

```text
ID | Decision | Rationale | Alternatives | Consequences | Basis | Status
```

- `Alternatives` ghi các phương án đã cân nhắc khi có.
- `Consequences` ghi trade-off, tác động và điều kiện chấp nhận.
- `Basis` ghi nguồn/đầu vào làm căn cứ; với `APC-` dùng chung, có thể trỏ tới `APC-` ở plan upstream thay vì định nghĩa lại.
- Schema tương đương Architecture Decision Record nhưng vẫn giữ semantics riêng của framework.

**ID.** Bất biến: không đổi, không tái sử dụng. Item bỏ đi chuyển Status (Deprecated, Rejected, Superseded...) chứ không xóa số. Tham chiếu bằng ID, không bằng số dòng hay tiêu đề (mục 12).

---

# 4. INFO — Research & Information

## 4.1. Vai trò

`info.md` là kho nghiên cứu và bằng chứng về đề tài, không phải trang định danh dự án. INFO ghi nhận thông tin, sự thật, bằng chứng và phân tích; không ghi quyết định khởi tạo hay requirement.

## 4.2. Cấu trúc

```text
INFO
├── Research Questions           # Cần biết gì để phục vụ các quyết định phía sau
├── Domain Context               # Tổng quan domain, khái niệm, thuật ngữ và bối cảnh liên quan
├── Source Register              # SRC-: loại nguồn, ngày, độ tin cậy, link
├── Findings                     # INF-: phát hiện/sự thật thu thập được
│   ├── Users & Needs            # Nhóm finding gợi ý; có thể thay đổi theo đề tài
│   ├── Existing Solutions
│   ├── Technical Feasibility
│   └── Regulatory / Constraints
├── Analysis & Implications      # Ý nghĩa/hệ quả của findings đối với PI/Spec
└── Gaps & Open Questions        # Điều chưa biết hoặc cần nghiên cứu thêm
```

## 4.3. Schema

```text
RQ:  ID | Question | Serves | Status
SRC: ID | Citation | Type | Published | Accessed | Reliability | Location | Status
INF: ID | Statement | Type | Topic | Derived from | Confidence | Answers | Implication | Conflicts with | Status
ANL: ID | Analysis | Derived from | Impacts | Status
GAP: ID | Kind | Missing knowledge | Refers to | Blocks | Resolution | Status
```

- `RQ-` là research question; `Serves` trỏ tới `PD-`, Spec hoặc mục đích nghiên cứu tương ứng.
- `SRC-` là nguồn bằng chứng; `Published`/`Accessed` dùng khi có ý nghĩa với loại nguồn.
- `INF-` là finding đã thu thập; `Derived from` trỏ tới `SRC-` hoặc `RQ-`; `Answers`, `Implication`, `Conflicts with` chỉ điền khi có.
- `ANL-` là kết luận phân tích chưa trở thành quyết định; nếu đã trở thành quyết định, quyết định được sở hữu ở PI/Design/Plan và trỏ `Basis` về `ANL-`.
- Status của `ANL-` phản ánh vòng đời của sản phẩm phân tích (`Draft → Reviewed → Accepted → Superseded/Deprecated`); `Accepted` không biến `ANL-` thành Decision.
- `GAP-` ghi phần chưa biết hoặc mâu thuẫn cần giải quyết.

## 4.4. Quy tắc

- Các nhóm con trong `Findings` chỉ là gợi ý, có thể thay đổi theo đề tài.
- PI và Spec tham chiếu `INF-` hoặc `ANL-` thay vì sao chép bằng chứng.
- `Analysis & Implications` là nội dung có ID `ANL-`; không dùng prose vô danh cho kết luận mà downstream cần trace.
- Thuật ngữ của domain nằm ở INFO; thuật ngữ của chính hệ thống nằm ở PI (`Glossary`); thuật ngữ của bộ tài liệu nằm ở META.

# 5. PI — Project Initiation

## 5.1. Vai trò

`pi.md` là khởi tạo dự án: mục tiêu, phạm vi, định hướng và quyết định khởi tạo. PI chuyển từ thông tin/nghiên cứu sang định hướng và quyết định cấp dự án.

## 5.2. Cấu trúc

```text
PI
├── Goals                       # Vấn đề, vision, mục tiêu, success criteria (đo được)
├── Scope                       # In/out, user, stakeholder và product boundary
├── Direction                   # Hướng tiếp cận, nguyên tắc, ưu tiên
├── Decisions                   # PD-: quyết định khởi tạo (Decision schema, mục 3.4)
├── Constraints & Assumptions   # Điều kiện và giả định chi phối dự án, kể cả ràng buộc công nghệ bắt buộc
└── Glossary                    # Thuật ngữ của chính hệ thống: Term | Definition
```

## 5.3. Boundary với INFO và STACK

- INFO sở hữu facts, evidence và analysis.
- PI sở hữu goals, scope, direction và project decisions.
- STACK sở hữu việc lựa chọn công nghệ/tool cụ thể.
- Goals, Scope và Direction là nội dung cấp document; framework không bắt buộc cấp ID riêng cho từng dòng. Khi một nội dung PI cần downstream trace riêng, đưa nó vào `PD-` và dùng `Basis` trỏ tới `INF-`/`ANL-` thích hợp.
- `PD-` là điểm trace item-level chính của PI; vì vậy quy tắc `Basis` áp dụng cho **Decision trong PI**, không ngầm áp dụng cho mọi prose của `pi.md`.
- Nếu PI quyết định một hướng công nghệ, STACK trích `PD-` trong `Basis` thay vì lặp decision.

# 6. TECH & TOOL STACK

## 6.1. Vai trò

`tech-tool-stack.md` trả lời câu hỏi: **hệ thống dùng công nghệ, framework, công cụ và nền tảng nào?**

- **Tech:** cái hệ thống được xây trên và chạy trên.
- **Tool:** cái dùng để xây, kiểm thử, đưa lên và vận hành.

## 6.2. Cấu trúc

```text
STACK
├── Tech Stack                 # Ngôn ngữ, runtime, framework, library, data store, nền tảng chạy
├── Tool Stack                 # VCS, build, CI/CD, test, quản lý dự án, nền tảng phát triển
└── Assumptions & Open Issues  # Chỉ khi cần
```

## 6.3. Schema

```text
ID | Category | Name | Version | Applies to | Role | Basis | Requires | Status
```

ID dùng `STK-`.

## 6.4. Quy tắc

- `Category` là slot trừu tượng, không khóa cứng danh sách layer.
- "Nền tảng" thuộc Tech nếu là nền tảng chạy hệ thống; thuộc Tool nếu là nền tảng phát triển.
- Không tạo section riêng cho Selection Criteria, Alternatives hoặc Compatibility.
- Tiêu chí chọn nằm ở PI/INFO; bằng chứng so sánh nằm ở INFO.
- Compatibility giữa các stack item được biểu diễn bằng `Requires`; `Requires` **chỉ trỏ tới `STK-`**, không trỏ tới Spec, Design hay Plan.
- Các căn cứ khác cho lựa chọn stack dùng `Basis`.
- `Applies to` cho biết item áp dụng cho system hay service cụ thể.

## 6.5. Upstream / downstream

```text
Upstream:   INFO, PI
Downstream: DESIGN (Uses), Foundation Setup Plan, Build/Test/Deploy Plan (công cụ, nền tảng)
```

SPEC không phải downstream của STACK (Spec trung lập công nghệ, mục 7.1). Nếu Spec/Design phát sinh nhu cầu đổi công nghệ, cập nhật mục `STK-` bằng version/status phù hợp; STACK không chứa trace ngược xuống Design như một requirement mới.

---

# 7. SPEC — Requirements Specification (`srs/`)

## 7.1. Nguyên tắc chung

- `Purpose` và `Scope` không lặp trong từng leaf; Registry (mục 3.2) và vị trí trong cây đã xác định vai trò/phạm vi.
- `Basis` là trường trên từng dòng, trỏ về `INF-`, `PD-` hoặc ID upstream thích hợp (mục 11.2).
- `Requirements / Definitions` là lõi của Spec leaf. Item là _Requirement_ (điều phải thực hiện/đáp ứng) hoặc _Definition_ (khái niệm cần thống nhất).
- Ràng buộc là một loại requirement phù hợp với leaf sở hữu nó, kể cả ràng buộc thiết kế/công nghệ bắt buộc do bên ngoài áp đặt.
- `Acceptance` nằm trên dòng Spec; Test Plan dùng nó để xây tiêu chí kiểm chứng.
- Spec trung lập công nghệ: công nghệ cụ thể xuất hiện ở Design thông qua `STK-`.

## 7.2. Template chung của Spec leaf

```text
SPEC LEAF
├── Requirements / Definitions
└── Assumptions & Open Issues    # Chỉ khi cần
```

Schema item:

```text
ID | Statement | Category | Priority | Basis | Acceptance | Status
```

Quy ước:

- `Statement`, `Acceptance`, `Priority`, `Status`: xem mục 3.4.
- Mỗi leaf chia `Requirements / Definitions` thành các nhóm theo mục 7.3–7.7.
- ID system-level và service-level không dùng chung một ID; service tạo ID riêng (SCOPE khác) và trace về upstream (mục 12).

## 7.3. SRS (`srs.md`)

```text
SRS
├── System Context              # ACT-: actor, EXT-: hệ thống bên ngoài
└── Cross-cutting Requirements  # SRS-: yêu cầu xuyên suốt, policy, compliance, operational constraints
```

- `ACT-` và `EXT-` là **Definition**, không phải Requirement; chúng được định nghĩa tại SRS để các leaf khác reference thay vì định nghĩa lại.
- `EXT-` mô tả external system/dependency ở mức khái niệm; Design có thể `Uses` `EXT-` để chỉ ra dependency, nhưng không biến `EXT-` thành requirement.
- `SRS-` chỉ nhận yêu cầu xuyên suốt không đặt gọn được vào leaf chuyên biệt. Khi một `SRS-` kéo theo yêu cầu đo được hoặc yêu cầu dữ liệu cụ thể, tách thành `NFR-` hoặc `DATA-` và trỏ `Basis` về `SRS-`.

## 7.4. FR/NFR Specs

```text
FR/NFR SPECS
├── Functional Requirements       # FR-: nhóm theo capability hoặc actor goal
└── Non-functional Requirements   # NFR-: nhóm theo quality attribute
```

- FR sở hữu capability và business rule.
- NFR sở hữu quality attribute có ngưỡng đo và điều kiện đo (tải, môi trường), nhóm theo đặc tính chất lượng của ISO/IEC 25010 như performance efficiency, reliability, security, compatibility, maintainability, portability; ví dụ RPO/RTO.
- Usability và accessibility thuộc UI/UX khi chúng mô tả trải nghiệm người dùng.

## 7.5. UI/UX Specs

```text
UI/UX SPECS
├── Tasks & Journeys          # UI-: user task, journey, flow
├── Interface & Interaction   # UI-: thông tin hiển thị, trạng thái, tương tác, phản hồi
└── Experience Qualities      # UI-: usability, accessibility (mức tuân thủ), thiết bị, ngôn ngữ
```

UI/UX không lặp lại capability của FR; nó mô tả cách người dùng trải nghiệm và tương tác với capability đó.

## 7.6. API Specs

```text
API SPECS
├── Interfaces               # API-: provided/consumed interface, bên đối tác, mục đích
├── Operations & Contracts   # API-: input/output, validation, error behavior
└── Interface Constraints    # API-: ràng buộc thuộc contract của interface (auth, versioning, rate limit, compatibility)
```

- Spec API giữ contract ở mức trung lập công nghệ. Quyết định kiểu giao thức, URL, schema triển khai cụ thể thuộc API Design.
- Contract bắt buộc do bên ngoài áp đặt: Spec trích tham chiếu đến contract đó thay vì chép lại.
- Mức chất lượng của toàn hệ thống (mức bảo mật, throughput) thuộc NFR; `Interface Constraints` trích bằng `Basis`.

## 7.7. Data Specs

```text
DATA SPECS
├── Data Entities                # DATA-: khái niệm dữ liệu, ý nghĩa, source of truth
├── Data Rules                   # DATA-: toàn vẹn, validation, quan hệ nghiệp vụ
└── Data Lifecycle & Protection  # DATA-: retention, classification, volume, protection requirements
```

- Retention và classification thuộc Data Specs.
- Encryption, RPO/RTO và các quality attribute hệ thống thuộc NFR; Data Specs trích bằng `Basis` khi cần.

## 7.8. Quy tắc ownership

Một requirement thuộc leaf cụ thể nhất mà chủ thể của nó nằm trong. Xét chủ thể theo thứ tự:

1. Người dùng trực tiếp thấy hoặc tương tác → UI/UX.
2. Ranh giới tương tác với bên ngoài (interface cung cấp/sử dụng) → API.
3. Thuộc tính của dữ liệu (ý nghĩa, toàn vẹn, retention, classification) → Data.
4. Mức chất lượng đo được của hệ thống → NFR.
5. Capability hoặc business rule → FR.
6. Không đặt gọn vào leaf nào ở trên (policy, compliance, ràng buộc vận hành) → SRS.

Khi một yêu cầu chạm nhiều leaf, tách thành nhiều item, mỗi leaf một chủ thể, nối bằng `Basis`. Ví dụ: "tuân thủ quy định bảo vệ dữ liệu" ở `SRS-`, thời hạn lưu trữ ở `DATA-`, mã hóa ở `NFR-`.

Service Spec là refinement/phân bổ của System Spec, không copy nguyên văn (mục 11.4). Service Spec có thể `Basis` từ `ARC-` của DDS bên cạnh System Spec ID.

---

# 8. DESIGN — Detailed Design (`dds/`)

## 8.1. Template chung

```text
DESIGN LEAF
├── Structure
├── Behavior
├── Decisions
└── Assumptions & Open Issues    # Chỉ khi cần
```

Schema phần tử của `Structure` và `Behavior`:

```text
ID | Name | Definition | Uses | Realizes | Decisions | Status
```

- `Definition`: trách nhiệm của Structure hoặc diễn biến của Behavior. Sơ đồ (ví dụ C4, sequence, state, ERD) là một cách biểu diễn trong `Definition`, không phải section riêng.
- `Uses` trỏ tới phần tử khác, `STK-` hoặc `EXT-`.
- `EXT-` có thể được tham chiếu như Definition đã sở hữu ở `srs.md`; Design không định nghĩa lại và không tạo `EXT-` mới.
- `Realizes` trỏ về ID của Spec.
- `Decisions` trỏ về các `DD-` chi phối phần tử.
- `Decisions` dùng Decision schema (mục 3.4); `Basis` có thể trỏ tới Spec, `STK-`, `INF-` hoặc `PD-`.

## 8.2. DDS (`dds.md`)

```text
DDS
├── Structure
│   ├── System Architecture    # ARC-: service, boundary, responsibility, topology
│   └── Cross-cutting Design   # ARC-: security, logging, error handling, configuration...
├── Behavior                   # ARC-: end-to-end flow xuyên nhiều service
└── Decisions                  # DD-
```

`System Architecture` gồm cả deployment topology (service chạy ở đâu, ranh giới môi trường) dưới dạng `ARC-`, vì Deploy Plan cần phần tử design để trace tới. `ARC-` phân rã hệ thống thành service là điểm nối sang service-level (mục 2.1).

## 8.3. FR/NFR Design

```text
FR/NFR DESIGN
├── Structure
│   ├── Components & Logic     # SOL-: component, responsibility, mapping business rule
│   └── Quality Mechanisms     # SOL-: cache, retry, scaling, resilience...
├── Behavior                   # SOL-: processing flow, lifecycle, state
└── Decisions                  # DD-
```

## 8.4. UI/UX Design

```text
UI/UX DESIGN
├── Structure
│   ├── Information Architecture & Navigation   # UXD-
│   ├── Screens & Components                    # UXD-
│   └── Visual & Content Language               # UXD-: token, typography, color, microcopy, accessibility mechanisms
├── Behavior                                    # UXD-: interaction, state, feedback
└── Decisions                                   # DD-
```

## 8.5. API Design

```text
API DESIGN
├── Structure
│   ├── Interface
│   │   ├── Protocol               # APD-: protocol/transport
│   │   ├── Endpoint / Resource    # APD-: resource, endpoint/boundary
│   │   ├── Operation              # APD-: operation semantics
│   │   ├── Naming                 # APD-: naming convention
│   │   └── Versioning             # APD-: versioning strategy
│   └── Contract
│       ├── Request                # APD-: path, query, headers, body
│       ├── Response               # APD-: status, headers, body
│       ├── Error                  # APD-: error types, codes, response shape
│       └── Schema                 # APD-: data types, fields, constraints
├── Behavior
│   ├── Validation                 # APD-: request/response validation
│   ├── Authentication & Authorization
│   ├── Idempotency
│   ├── Retry & Timeout            # APD-: interface contract; quality mechanism stays in FR/NFR Design
│   ├── Async / Webhook
│   └── Sequence
└── Decisions                     # DD-
```

- API Design gắn các chi tiết triển khai cụ thể vào `STK-` nhưng không tạo requirement mới.
- Retry ở mức quality mechanism thuộc FR/NFR Design; API Design chỉ ghi retry/timeout/idempotency ở mức contract hoặc behavior của interface.
- Khi `api-specs.md` bị bỏ do API requirement/contract có owner upstream, mọi `APD-` vẫn phải `Realizes` upstream `API-`/requirement tương ứng.

## 8.6. Data Design

```text
DATA DESIGN
├── Structure
│   ├── Data Model             # DTD-: entity, cấu trúc lưu trữ, relationship, constraint, index
│   └── Storage & Access       # DTD-: partitioning, access pattern, migration, backup
├── Behavior                   # DTD-: data flow, transformation, synchronization, lifecycle jobs
└── Decisions                  # DD-
```

## 8.7. Quy tắc ownership và trace

- Mỗi Design element phải `Realizes` ít nhất một Spec ID.
- Mỗi Requirement phải được thực hiện bởi ít nhất một Design element, hoặc được phân bổ xuống Service Spec (mục 11.4). Item loại Definition được miễn.
- Design không tạo requirement ngầm. Nếu cần requirement mới, bổ sung vào Spec trước.
- Design là nơi gắn với công nghệ cụ thể bằng `STK-`.
- Decision đặt ở leaf có chủ thể của nó; decision xuyên nhiều leaf/service lên `dds.md`.
- System-level `*-design.md` thực hiện các System Spec item không phân bổ xuống service (xuyên service). Thiết kế riêng của một service nằm ở Service Design.
- Phạm vi cụ thể nhất được ưu tiên; phần xuyên service nằm ở system-level.

---

# 9. PLAN

## 9.1. Template chung

```text
PLAN LEAF
├── Approach                     # APC-: quyết định về cách làm, gồm Definition of Done chung
├── Work Items                   # Nhóm theo Category của leaf
└── Assumptions & Open Issues    # Chỉ khi cần
```

Schema work item chung:

```text
ID | Name | Description | Covers | Depends on | Done when | Status
```

Áp dụng cho các Plan leaf sau:

| Plan leaf                        | ID       | `Covers` trỏ tới                  | Category mặc định                                                                  |
| -------------------------------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| `foundation-setup-plan`        | `FND-` | `STK-`, `ARC-`                    | Environment, Toolchain, Repository & Scaffolding, Access & Configuration              |
| `build-plan`, `*-build-plan` | `BLD-` | Design element                        | Implementation, Integration                                                           |
| `test-plan`, `*-test-plan`   | `TST-` | Spec item (Requirement)               | Test level hoặc loại kiểm thử;`Gate`                                            |
| `deploy-plan`                  | `DPL-` | `ARC-` topology, `STK-`, `NFR-` | Environment Provisioning, Release & Rollout, Rollback, Operational Readiness;`Gate` |

Ngoại lệ:

- **Project Plan** có schema riêng ở mục 9.2.
- **Task Plan** có schema riêng ở mục 9.4.1 và **không dùng `Covers`**; task dùng `Derived from` để chỉ upstream `BLD-`/`FND-`.

Quy tắc:

- `Covers` bắt buộc với work item của các Plan áp dụng schema chung, trừ `Gate`.
- `Depends on` tạo ra thứ tự thực hiện; không viết lịch riêng trong leaf plan. Mặc định dependency ở cùng execution scope; ngoại lệ phải được định nghĩa tại leaf tương ứng (điển hình `DPL-SYS-*` có thể phụ thuộc item service-level đã nêu ở mục 9.6).
- `Done when` là điều kiện hoàn thành riêng của item; Definition of Done chung của leaf nằm ở `Approach`.
- Ngày, người phụ trách, ước lượng thuộc Project Plan, tham chiếu work item bằng ID.
- Plan không tạo requirement, design hay technology choice mới; khi nhắc công cụ, `Approach` trích `STK-`.
- `APC-` mặc định là **local decision của plan leaf đang sở hữu nó**. Nếu một approach dùng chung cho nhiều plan, định nghĩa `APC-` tại plan gần nhất có scope chung (thường Project Plan cho governance toàn dự án; System/Service Plan cho execution tương ứng) và các plan thấp hơn reference nó thay vì định nghĩa lại.
- Category mặc định có thể mở rộng qua `meta.md`; `Gate` là loại cố định.

## 9.2. Project Plan

```text
PROJECT PLAN
├── Approach                    # APC-: lifecycle, phương pháp, change và configuration management
├── Phases & Milestones         # PRJ-: phase, milestone, gate; có Target
├── Roles & Responsibilities    # ROL-: role, responsibility
└── Risks                       # RSK-: risk register
```

Schema:

```text
Phase/Milestone/Gate: ID | Name | Type | Includes | Depends on | Target | Estimate | Owner | Exit criteria | Status
Role:                 ID | Role | Responsibility | Assignee
Risk:                 ID | Risk | Probability | Impact | Response | Owner | Basis | Status
```

- `Includes` trỏ tới work item (`FND-`, `BLD-`, `TASK-`, `TST-`, `DPL-`) hoặc leaf thuộc phase/milestone đó.
- Project Plan là nơi duy nhất quản lý ngày, lịch tổng thể và phân công.
- `Basis` của `RSK-` trỏ tới `INF-`, `PD-` hoặc ID là nguồn của rủi ro.

## 9.3. Foundation Setup Plan

```text
FOUNDATION SETUP PLAN
├── Approach
└── Work Items                  # FND-: Environment, Toolchain, Repository & Scaffolding,
                                #       Access & Configuration
```

Foundation Setup chuẩn bị nền tảng để build bắt đầu; Category là mặc định, mở rộng theo dự án (mục 9.1).

Ở cấp service, `service-docs/foundation-setup-plan.md` nằm ở gốc `service-docs/` (phủ toàn service, không thuộc facet nào), chỉ chứa phần riêng của service; phần dùng chung phụ thuộc vào system Foundation Setup Plan.

## 9.4. Build Plan và Task Plan

```text
BUILD PLAN
├── Approach                    # APC-: increment, integration, branching, versioning, Definition of Done
└── Work Items                  # BLD-: Implementation, Integration
```

- **System Build Plan (`system-docs/plans/build-plan.md`):** sở hữu build work cấp system và integration xuyên service; `BLD-SYS-*` cover Design element cấp system. `BLD-SYS-*` **không sinh `TASK-` trực tiếp**. Nếu một phần execution phải được thực hiện bên trong một service, phần execution đó phải có `BLD-<SERVICE>-*` do service facet sở hữu; service `BLD-` sau đó mới được phân rã thành `TASK-`. Quan hệ giữa system coordination và service execution được theo dõi qua cùng Design/`ARC-` và Project Plan `Includes`, không biến `BLD-SYS-*` thành service task.
- **Facet Build Plan (`service-docs/<service>/.../*-build-plan.md`):** mỗi leaf cover Design element của đúng facet; `BLD-<SERVICE>-*` là planning unit của service. `Depends on` trong facet build plan chỉ trỏ tới item cùng facet hoặc `FND-`; không khai báo dependency xuyên facet ở đây.
- `BLD-` là **đơn vị lập kế hoạch build**, chưa phải execution task. Một `BLD-` có thể được phân rã thành nhiều `TASK-`.
- `BLD-` loại `Integration` chạm nhiều facet nhưng vẫn phải có một owner. Integration thực hiện một capability của service thuộc `fr-nfr-build-plan.md`; integration xuyên service thuộc system `build-plan.md`.

## 9.4.1. Task Plan

`task-plan.md` của **service** là lớp execution planning giữa Build Plans/Foundation của service và BUILD. Nó không thay thế bất kỳ facet Build Plan nào và không tạo lại requirement/design/build work. Framework mặc định không có system `task-plan.md`; system build work được theo dõi ở System Build Plan và Project Plan.

```text
TASK PLAN
├── Approach
├── Tasks
├── Dependency Structure
├── Execution Waves
└── Assumptions & Open Issues    # Chỉ khi cần
```

### Tasks

Schema:

```text
ID | Name | Description | Derived from | Depends on | Wave | Done when | Status
```

Quy tắc:

- `TASK-` là đơn vị thi công thực tế: đủ nhỏ để tập trung, thực hiện và kiểm tra trong một thay đổi; mặc định có thể hoàn thành trong một pull request nhưng dự án có thể tailor kích thước.
- `Derived from` bắt buộc trỏ tới đúng **một** `BLD-` hoặc `FND-` của cùng service/scope. Một build work item có thể sinh nhiều task; không gộp nhiều build work item vào một task. Nếu cần gộp, hợp nhất ở upstream Build Plan.
- `BLD-SYS-*` không phải upstream trực tiếp của `TASK-`; execution trong service phải đi qua `BLD-<SERVICE>-*` của service đó.
- Task không copy `Description` của `BLD-`/`FND-`; chỉ giữ phần cụ thể hóa cho execution.
- `Depends on` chỉ trỏ tới `TASK-` khác trong cùng execution scope.
- `Done when` là điều kiện hoàn thành của task; không tạo requirement mới và không thay thế `Acceptance` của Spec.
- `Wave` là nhãn grouping cục bộ. Wave không có ID riêng, không có `Done when`, owner hay status riêng.
- `Status` của task phục vụ execution tracking; lịch, estimate và phân công tổ chức tổng thể vẫn thuộc công cụ/project management theo Project Plan.

### Dependency Structure

Dependency là quan hệ giữa **TASK-**, là nguồn sự thật duy nhất cho thứ tự thực thi. Dependency xuyên facet được giải quyết tại Task Plan sau khi các facet Build Plans đã hoàn tất.

```text
BLD-DATA-* ──┐
BLD-FR-*   ──┼──→ TASK- ──Depends on──→ TASK- ──→ BUILD
BLD-API-*  ──┤
BLD-UI-*   ──┘
FND-*      ────→ TASK-
```

Task Plan phải giữ dependency đủ rõ để xác định task nào có thể thực hiện song song mà không biến dependency thành lịch cứng.

### Execution Waves

Wave là **denormalized view / projection của dependency graph** để nhóm các task có thứ tự thực hiện tương đương. Dependency graph là nguồn sự thật; `Wave` chỉ là dữ liệu suy ra và có thể tái tạo.

```text
Wave 1 → TASK-001, TASK-002
Wave 2 → TASK-003, TASK-004
Wave 3 → TASK-005
```

- Task trong cùng wave không được có dependency trực tiếp lẫn nhau.
- Wave không phải execution unit và không phải work item; người thực thi nhận **TASK-**, không nhận “một wave”.
- Wave có thể thay đổi khi dependency hoặc decomposition thay đổi mà không tạo một loại item mới.
- Task Plan không dùng wave để quản lý lịch, deadline hoặc assignment.

### Ownership và trace

```text
System/Service Design ──Covers──→ BLD-
TASK- ──Derived from──→ BLD-/FND- ──→ BUILD
STACK / ARC- ───────────Covers──→ FND-

`BLD-SYS-*` thuộc System Build Plan; `BLD-<SERVICE>-*` thuộc Facet Build Plan. `TASK-` mặc định chỉ được tạo trong Service Task Plan.
Spec ─────────────────────────────Covers────────→ Test Plan ──→ TEST
```

Task Plan chỉ aggregate và normalize; nếu Build Work chưa đủ rõ để phân rã thành task thì sửa tại owner của Build Plan, không tạo nội dung mới trong Task Plan.

## 9.5. Test Plan

```text
TEST PLAN
├── Approach                    # APC-: test levels, loại kiểm thử, yêu cầu environment, data, công cụ (trích STK-), defect handling
└── Test Items                  # TST-: Category = test level hoặc loại kiểm thử, cộng Gate cho entry/exit
```

- `Covers` trỏ trực tiếp tới Spec. Test Plan trace trực tiếp về Spec, không cần đi qua Design; Design element chỉ là thông tin định vị khi cần.
- Mỗi Requirement phải có ít nhất một Test Item cover, kể cả khi cách kiểm chứng là inspection, analysis hoặc demonstration.
- `Done when` là pass criteria cụ thể hóa `Acceptance` của Spec.
- `Gate` biểu diễn điều kiện entry/exit của test level.
- `Description` có thể nêu Design element đang được kiểm thử để định vị, nhưng pass criteria bám `Acceptance` của Spec.
- `Approach` chỉ nêu _yêu cầu_ environment; việc dựng environment là `FND-`.
- System-level Test Plan là một leaf, cover Spec cấp system và kiểm thử xuyên service.
- Service-level: mỗi facet có Test Plan riêng, cover Spec của đúng facet đó. Kiểm thử capability (FR) xuyên facet nằm ở `fr-nfr-test-plan.md`.

## 9.6. Deploy Plan

```text
DEPLOY PLAN
├── Approach                    # APC-: release, rollout, rollback
└── Work Items                  # DPL-: Environment Provisioning, Release & Rollout,
                                #       Rollback, Operational Readiness, Gate
```

`DPL-` mặc định có **system scope** (`DPL-SYS-*`) và được sở hữu tại `system-docs/plans/deploy-plan.md`. Một deploy/release item có thể target một service hoặc một nhóm service, nhưng vẫn nằm trong system Deploy Plan và vẫn giữ scope `SYS`; service code được thể hiện trong Description/Applies to, không tạo `DPL-<SERVICE>-*`. `Covers` có thể trỏ tới `ARC-` topology, `STK-` và `NFR-` về availability/RPO/RTO. `Depends on` của `DPL-SYS-*` là ngoại lệ được phép cross-scope: có thể tham chiếu `FND-`, `BLD-` hoặc `TST-` của service/system khi release phụ thuộc trực tiếp vào foundation, build hoặc verification đó.

Ranh giới môi trường:

- Environment dùng để build/test thuộc Foundation Setup.
- Environment hệ thống được phát hành lên thuộc Deploy Plan.
- Service-specific release/rollout vẫn trace về `DPL-SYS-*`; không tạo service deploy plan mặc định.

`Operational Readiness` có thể sinh evidence nằm ngoài cây (cấu hình giám sát, cảnh báo, runbook, kiểm tra backup/restore); chúng được trace bằng `DPL-`.

---

# 10. Service-level Documentation

Service-level sử dụng cùng semantic structure với system-level nhưng phát triển theo **chiều dọc**. Mỗi facet có vòng đời riêng `specs → design → build-plan → test-plan`; hai leaf ở gốc service xử lý phần execution toàn service.

| Facet       | Có khi                                    | Nội dung                                                                                                                                                                                            |
| ----------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fr-nfr/` | Luôn có                                  | FR/NFR Specs, Design, Build Plan và Test Plan cho capability/business rule/quality của service                                                                                                     |
| `data/`   | Service sở hữu/quản lý persistent data | Data Specs, Design, Build Plan và Test Plan cho data layer                                                                                                                                          |
| `api/`    | Service có external interaction boundary  | API Design/Build/Test luôn có;`api-specs.md` chỉ có khi service là owner của API requirements/contracts; nếu owner ở upstream, service trace trực tiếp về upstream requirement/contract |
| `ui-ux/`  | Service có người dùng trực tiếp      | UI/UX Specs, Design, Build Plan và Test Plan                                                                                                                                                        |

| Leaf toàn service           | Vai trò                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `foundation-setup-plan.md` | Chuẩn bị foundation riêng của service; phụ thuộc system foundation và`STACK`/`ARC-` liên quan                   |
| `task-plan.md`             | Gom`BLD-`/`FND-`, phân rã thành `TASK-`, giải quyết dependency giữa facet và nhóm task thành execution waves |

- `foundation-setup-plan.md` nằm ở gốc `service-docs/`, không thuộc facet nào.
- `task-plan.md` nằm ở gốc `service-docs/` vì nó có scope toàn service và là owner duy nhất của `TASK-`.
- `fr-nfr-build-plan.md` là owner của `BLD-` Integration xuyên các facet trong cùng service khi integration đó hiện thực capability của service; integration xuyên service thuộc system Build Plan.
- `task-plan.md` không định nghĩa lại `BLD-`/`FND-`; nó chỉ tạo `TASK-` từ các item đó.
- `TASK-` không thay thế `TST-` hoặc `DPL-`; Test và Deploy đã có execution model riêng.
- `data/`, `api/`, `ui-ux/` không tồn tại chỉ vì service có thể gọi/được gọi; điều kiện là responsibility thực tế của service.
- Với mọi facet đã chọn, `design`, `build-plan` và `test-plan` là bắt buộc. `spec` cũng là bắt buộc **trừ API facet** khi API requirement/contract đã có owner upstream; trong exception đó, `api-specs.md` được bỏ và service trace trực tiếp về upstream API requirement/contract.

# 11. Traceability và ownership

## 11.1. Quy tắc cốt lõi

> **Mỗi nội dung chỉ có một owner; các tài liệu khác reference bằng ID, không copy.**

Trace hai chiều: forward (từ Spec đến Design, Plan, Test) và backward (từ item về `Basis`). Ma trận traceability được sinh từ ID bằng công cụ, không viết tay (mục 14.4).

## 11.2. Trace field

Định nghĩa một lần; các mục trước chỉ dùng lại.

| Trường         | Dùng ở                       | Trỏ tới                                                                      |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `Basis`        | Spec, STACK, Decision,`RSK-` | Target hợp lệ phụ thuộc loại item; xem bảng dưới                       |
| `Uses`         | Design                         | Phần tử Design khác,`STK-`, `EXT-`                                      |
| `Realizes`     | Design                         | Spec item (Requirement)                                                        |
| `Decisions`    | Design                         | `DD-`                                                                        |
| `Covers`       | Plan                           | Tùy loại Plan (mục 9.1)                                                     |
| `Derived from` | Task Plan                      | Đúng một`BLD-` hoặc `FND-` upstream                                    |
| `Depends on`   | Plan, Project Plan, TASK-Plan  | Mặc định cùng execution scope; có ngoại lệ được nêu theo từng Plan |
| `Wave`         | Task Plan / TASK-              | Nhãn grouping cục bộ của execution                                         |
| `Requires`     | STACK                          | Chỉ`STK-` khác                                                             |
| `Applies to`   | STACK                          | System hoặc service (SCOPE)                                                   |

**Target của `Basis` theo loại item:**

| Item                                                             | Target hợp lệ cho`Basis`                                                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `STK-`                                                         | `INF-`, `PD-`                                                                                                             |
| Spec (`SRS-`, `FR-`, `NFR-`, `UI-`, `API-`, `DATA-`) | `INF-`, `ANL-`, `PD-`, upstream Spec, `ARC-` khi phù hợp                                                            |
| Decision (`PD-`, `DD-`, `APC-`)                            | Nguồn upstream phù hợp; thường`INF-`, `ANL-`, `PD-`, Spec, `STK-`; `APC-` có thể reference `APC-` upstream |
| `RSK-`                                                         | `INF-`, `PD-`                                                                                                             |

`Basis` là field dùng chung nhưng **không có một target set duy nhất cho mọi prefix**; rule cụ thể của leaf/item type có ưu tiên hơn bảng tổng quát. `EXT-` trong Design chỉ là reference tới Definition đã có owner ở SRS.

## 11.3. Các hướng trace chính

Build:

```text
INFO ─INF-→ PI ─PD-→ SPEC ─Realizes→ DESIGN ─Covers→ Build Plans → BUILD
```

Stack:

```text
PI ─PD-→ STACK ─STK-→ DESIGN (Uses) · Foundation / Build / Test / Deploy Plan
```

Test trace trực tiếp:

```text
SPEC ─Covers→ Test Plan → TEST
```

Deploy trace từ Design, Stack, NFR:

```text
DESIGN (ARC-) · STACK (STK-) · SPEC (NFR-) ─Covers→ Deploy Plan → DEPLOY
```

## 11.4. Service refinement

```text
System Spec
    ↓
DDS phân rã service bằng ARC-
    ↓
Service Spec ─────────────────────────────┐
    ↓                                     ↓
Service Design                    Service Test Plan → TEST
    ↓
Facet Build Plans
    ↓
Task Plan ←──────── Foundation Setup Plan (service)
    ↓
TASK-
    ↓
BUILD
```

- Service-level không copy nguyên văn system-level; mỗi item là refinement/phân bổ từ upstream qua `Basis`, `Realizes`, `Covers` hoặc `Derived from` tùy loại artifact.
- Facet Build Plan chỉ cover Design của facet mình.
- Task Plan aggregate các `BLD-`/`FND-`, tạo `TASK-`, giải quyết dependency xuyên facet và nhóm task thành waves.
- Một `TASK-` phải `Derived from` đúng một `BLD-` hoặc `FND-`; một `BLD-`/`FND-` có thể sinh nhiều `TASK-`.
- Một System Spec item được phân bổ xuống service (allocated) coi là đã được thực hiện và kiểm chứng khi mọi Service Spec item dẫn xuất từ nó đã có `Realizes` và `Covers`.
- System Spec item không phân bổ xuống service (xuyên service) được thực hiện bởi System Design/System Build Plan và kiểm chứng bởi System Test Plan.

---

# 12. Prefix và ID

| Prefix            | Ý nghĩa                               | Leaf sở hữu                          | Scope                        |
| ----------------- | --------------------------------------- | -------------------------------------- | ---------------------------- |
| `RQ-`           | Research Question                       | `info.md`                            | không                       |
| `SRC-`          | Source                                  | `info.md`                            | không                       |
| `INF-`          | Finding                                 | `info.md`                            | không                       |
| `ANL-`          | Analysis                                | `info.md`                            | không                       |
| `GAP-`          | Research Gap                            | `info.md`                            | không                       |
| `PD-`           | Project Decision                        | `pi.md`                              | không                       |
| `STK-`          | Stack item                              | `tech-tool-stack.md`                 | không (dùng`Applies to`) |
| `ACT-`          | Actor                                   | `srs.md`                             | không                       |
| `EXT-`          | External system / dependency            | `srs.md`                             | không                       |
| `SRS-`          | System cross-cutting requirement        | `srs.md`                             | không                       |
| `FR-`, `NFR-` | Functional / Non-functional Requirement | `fr-nfr-specs.md`                    | có                          |
| `UI-`           | UI/UX specification item                | `ui-ux-specs.md`                     | có                          |
| `API-`          | API specification item                  | `api-specs.md`                       | có                          |
| `DATA-`         | Data specification item                 | `data-specs.md`                      | có                          |
| `ARC-`          | Architecture design item                | `dds.md`                             | không                       |
| `SOL-`          | Solution / FR-NFR design item           | `fr-nfr-design.md`                   | có                          |
| `UXD-`          | UI/UX design item                       | `ui-ux-design.md`                    | có                          |
| `APD-`          | API design item                         | `api-design.md`                      | có                          |
| `DTD-`          | Data design item                        | `data-design.md`                     | có                          |
| `DD-`           | Design Decision                         | Mọi leaf design                       | có                          |
| `APC-`          | Approach Decision                       | Mọi leaf plan                         | có                          |
| `PRJ-`          | Project plan item                       | `project-plan.md`                    | không                       |
| `ROL-`          | Project role                            | `project-plan.md`                    | không                       |
| `RSK-`          | Risk                                    | `project-plan.md`                    | không                       |
| `FND-`          | Foundation setup item                   | `foundation-setup-plan.md`           | có                          |
| `BLD-`          | Build planning work item                | `build-plan.md`, `*-build-plan.md` | có                          |
| `TASK-`         | Service execution task                  | `task-plan.md`                       | có (service)                |
| `TST-`          | Test item                               | `test-plan.md`, `*-test-plan.md`   | có                          |
| `DPL-`          | System deploy item                      | `deploy-plan.md`                     | `SYS` only                 |

Định dạng:

```text
<TYPE>-<SCOPE>-<NNN>     # prefix có scope
<TYPE>-<NNN>             # prefix không scope: chỉ một leaf sở hữu ở cấp dự án
```

Ví dụ:

```text
FR-SYS-001
FR-ORD-003
DD-SYS-004
TST-ORD-012
STK-007
```

- `SCOPE` là `SYS` ở system-level, mã service ở service-level; riêng `DPL-` mặc định luôn dùng `SYS`.
- `PD-` của PI là item-level decision; Goals/Scope/Direction không bắt buộc ID riêng.
- Mỗi cặp (`TYPE`, `SCOPE`) có một dãy số duy nhất, dùng chung giữa các leaf cùng prefix. Ví dụ mọi `TST-ORD-` trong các test plan facet của service ORD chung một dãy; mọi `BLD-ORD-` trong các build plans của service ORD chung một dãy; mọi `TASK-ORD-` trong `task-plan.md` của service ORD chung một dãy. Facet/nguồn upstream được xác định bằng file chứa item và trường `Covers`/`Derived from`.
- ID bất biến (mục 3.4).

---

# 13. Các quy tắc kiểm tra tài liệu

## 13.1. Bốn phép thử

Mỗi leaf và mỗi section chỉ được giữ nếu vượt qua đủ bốn phép thử:

| Phép thử                                            | Câu hỏi                                                                                                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Correct** — đúng với tên                 | Tên (file, section, prefix) có khớp nội dung không? Nội dung có trả lời đúng câu hỏi mà tầng/leaf chịu trách nhiệm (mục 1.4) không?                                                                                          |
| **Complete** — đủ nội dung                  | Nội dung có đủ để trả lời trọn vẹn câu hỏi đó, và để tầng sau lấy được input cần dùng không? Ngược lại, bỏ section này đi thì câu hỏi có còn được trả lời trọn vẹn không (nếu còn, section thừa)? |
| **Abstract** — trừu tượng ở mức chi tiết | Structure có mô tả*loại* nội dung ở mức áp dụng được cho mọi dự án không? Có chứa nội dung của một dự án cụ thể không? Danh sách trong comment/ví dụ chỉ là minh họa, không khóa cứng.                      |
| **Reusable** — tái sử dụng                  | Nội dung đã có owner ở leaf khác chưa (non-overlapping)? Template, schema, ID scheme có dùng lại được giữa các dự án và giữa các service không?                                                                             |

## 13.2. Quy tắc bổ sung

- Không tạo requirement từ Design.
- Không tạo design từ Plan.
- Không chọn technology trong Plan; trích `STK-`.
- Không kiểm chứng Design thay cho Spec trong Test Plan.
- Không copy requirement giữa System và Service.
- Không để orphan: mỗi Design element có `Realizes`; mỗi work item dùng schema Plan chung có `Covers` (trừ `Gate`); `TASK-` dùng `Derived from`; mỗi Requirement có Design thực hiện (hoặc được phân bổ) và có Test Item cover; mặc định mỗi service `BLD-`/`FND-` phải được phân rã thành ít nhất một `TASK-` trong `task-plan.md`. Ngoại lệ `No TASK decomposition` chỉ hợp lệ khi **từng `BLD-`/`FND-` cụ thể** có một Tailoring record trong `meta.md` với `Element=<ID>`, `Default=Requires TASK decomposition`, `Applied=No TASK decomposition`, `Reason` và `Impact` được ghi rõ.
- Không tạo document branch nếu service không có responsibility tương ứng. Với facet đã chọn: `design`, `build-plan`, `test-plan` luôn phải có; `spec` bắt buộc trừ API exception đã nêu tại mục 10.
- Không để `BLD-` của một facet `Depends on` item của facet khác; dependency xuyên facet chỉ được giải quyết tại `task-plan.md` bằng `TASK-`.
- Không dùng ID ngoài scheme (mục 12); không đổi hoặc tái sử dụng ID.

---

# 14. Cách sử dụng

## 14.1. Khởi tạo dự án mới

1. Tạo `meta.md` từ mặc định (mục 3): đặt SCOPE, ghi tailoring (mục 2.2).
2. **Chiều ngang (`system-docs/`):** INFO → PI → (STACK ‖ SPEC) → DESIGN (`dds.md`: phân rã service bằng `ARC-`) → Plans (Project, Foundation, Build, Test, Deploy). Không tạo system `task-plan.md` theo mặc định.
3. Baseline system-level đến mức service-level bắt đầu được: ít nhất `ARC-` của service đã Approved. Foundation Setup Plan có thể được soạn sau STACK/ARC và trước BUILD; execution của Foundation phải hoàn tất trước các TASK phụ thuộc.
4. **Chiều dọc (`service-docs/`):** với mỗi service, tạo `fr-nfr/` và các facet theo responsibility; đi `specs → design → build-plan → test-plan` trong từng facet, tạo `foundation-setup-plan.md`, sau đó tạo `task-plan.md` để aggregate `BLD-/FND-` thành `TASK-`, resolve dependency và group thành waves.

## 14.2. Thêm service mới

1. Bổ sung `ARC-` của service trong `dds.md` (qua quy trình thay đổi, mục 14.3).
2. Chọn SCOPE; tạo `fr-nfr/`, các facet theo điều kiện, cùng `foundation-setup-plan.md` và `task-plan.md` ở gốc `service-docs/` (mục 10).
3. Service Spec `Basis` về System Spec hoặc `ARC-`; `foundation-setup-plan.md` của service chỉ ghi phần riêng, phụ thuộc system Foundation Setup Plan.
4. Cập nhật Tree và Registry trong `meta.md`.

## 14.3. Xử lý thay đổi

1. Xác định owner của nội dung cần đổi (mục 7.8, 11.1) và sửa tại owner.
2. Impact analysis bằng trace: tìm mọi item có `Basis`, `Realizes`, `Covers`, `Uses`, `Derived from`, `Depends on`, `Requires` trỏ tới hoặc phụ thuộc vào ID thay đổi.
3. Cập nhật downstream theo thứ tự tầng và đặt Status phù hợp.
4. Với item đã Baselined: change request (pull request kèm impact analysis), tăng version; item thay thế dùng ID mới và status `Superseded by <ID>`.
5. Thay đổi sau phát hành: bắt đầu từ tầng bị ảnh hưởng, đi lại phần chuỗi downstream.

## 14.4. Kiểm tra tự động

Trong CI cho repo tài liệu:

- Front matter hợp lệ.
- ID đúng scheme, không trùng.
- Mọi `Basis`, `Realizes`, `Covers`, `Uses`, `Requires`, `Derived from`, `Depends on` trỏ tới ID tồn tại; `Wave` chỉ trỏ tới `TASK-` tồn tại.
- Coverage theo mục 13.2 (orphan).
- Ma trận traceability sinh từ ID.

## 14.5. Cho AI sử dụng

- Bắt đầu từ Registry (mục 3.2) để biết leaf nào trả lời câu hỏi nào.
- Nạp theo ID, không nạp cả cây: leaf cần làm việc cộng các item được trỏ bởi `Basis`, `Realizes`, `Covers`, `Uses`, `Derived from`, `Requires` (một bước upstream); mở rộng khi cần.
- ID là handle ổn định; không suy nội dung từ số thứ tự.
- Không tự tạo nội dung thuộc owner khác; nếu thiếu upstream, ghi vào `Assumptions & Open Issues` hoặc đề xuất thay đổi tại owner.
- Khi lập `task-plan.md`, không tạo requirement/design/BLD mới; chỉ phân rã `BLD-`/`FND-` thành `TASK-`, giữ dependency rõ và không biến Wave thành execution unit.
- Task decomposition phải giữ một nguồn sự thật: `TASK-` là execution item, `Wave` chỉ là projection/grouping của các task.

Mục tiêu của framework là tạo một chuỗi tài liệu có **ownership rõ, traceability rõ, không trùng nội dung, có thể refine từ system xuống service và đủ cấu trúc để AI sử dụng làm input cho việc lập kế hoạch và triển khai**.

---

# 15. Đối chiếu với tiêu chuẩn thực tế

Bảng dưới là ánh xạ cấu trúc, không phải tuyên bố tuân thủ. Khi hợp đồng hoặc cơ quan quản lý yêu cầu tuân thủ chính thức, bổ sung ánh xạ chi tiết trong `meta.md`.

| Thành phần                           | Artifact tương ứng trong thực tế                                | Chuẩn / thực hành tham chiếu                                         |
| -------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Toàn bộ vòng đời, tailoring       | Quy trình vòng đời phần mềm                                    | ISO/IEC/IEEE 12207:2026; ISO/IEC/IEEE 15289 (information items)          |
| INFO                                   | Discovery, feasibility và market research, evidence log             | Elicitation và analysis theo BABOK                                      |
| PI                                     | Project charter, Vision & Scope                                      | PMBOK (project charter), ISO 21502                                       |
| STACK                                  | Technology baseline, tooling inventory                               | Tech radar; ADR cho lựa chọn công nghệ                               |
| SPEC                                   | Requirements engineering / specification                             | ISO/IEC/IEEE 29148:2018 (current; DIS 3 under development); EARS; MoSCoW |
| NFR                                    | Quality requirements                                                 | ISO/IEC 25010                                                            |
| UI/UX                                  | UX spec, flows, design system                                        | ISO 9241-210 (human-centred design); WCAG                                |
| API                                    | API contract                                                         | OpenAPI, AsyncAPI                                                        |
| `dds.md`                             | Architecture description                                             | ISO/IEC/IEEE 42010:2022; C4 model; arc42                                 |
| `*-design.md`                        | Software design description                                          | IEEE 1016                                                                |
| Decisions (`PD-`, `DD-`, `APC-`) | Architecture Decision Record                                         | ADR (Nygard)                                                             |
| Project Plan                           | Project management plan, milestone plan, RACI, risk register         | PMBOK, ISO 21502                                                         |
| Foundation, Build Plan                 | Dev environment setup và build work planning                        | ISO/IEC/IEEE 12207:2026; configuration management practices              |
| Task Plan                              | Work breakdown, activity dependency và execution task decomposition | PMBOK work breakdown/activity sequencing; agile delivery practices       |
| Test Plan                              | Master test plan, level test plan                                    | ISO/IEC/IEEE 29119 (phần test documentation); ISTQB test levels         |
| Deploy Plan                            | Release và deployment plan, rollback, operational readiness         | ITIL 4 (release management, change enablement)                           |
| Traceability                           | Requirements Traceability Matrix hai chiều                          | ISO/IEC/IEEE 29148, 12207                                                |
| Document control                       | Docs-as-code, baseline, change control                               | VCS và pull request; ISO/IEC/IEEE 12207 (configuration management)      |
