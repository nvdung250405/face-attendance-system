# Bộ tài liệu hướng dẫn SDLC

## 1. Mục đích

Tài liệu này định nghĩa cấu trúc, vai trò, phạm vi sở hữu, schema, quy tắc traceability và cách sử dụng bộ tài liệu SDLC ở hai cấp: **System-level** và **Service-level**.

`meta.md` là lớp metadata của bộ tài liệu, không phải artifact trong lifecycle SDLC.

Chuỗi SDLC chính:

```text
INFO
  ↓
TECH & TOOL STACK
  ↓
PI — Project Initiation
  ↓
SRS — System Requirements
  ↓
DDS — Detailed Design
  ↓
PLANS
  ↓
BUILD
  ↓
TEST
  ↓
DEPLOY
```

Nguyên tắc xuyên suốt:

```text
Correct → Complete → Non-overlapping → Abstract
```

---

# 2. Cấu trúc thư mục

```text
docs/
│
├── meta.md                                      # Metadata và quy ước quản lý của toàn bộ bộ tài liệu;
│                                                # không phải artifact trong SDLC.
│
├── system-docs/
│   ├── info.md                                  # Kho nghiên cứu và bằng chứng về đề tài.
│   ├── tech-tool-stack.md                       # Công nghệ, framework, runtime, nền tảng và công cụ.
│   ├── pi.md                                    # Khởi tạo dự án: mục tiêu, phạm vi, định hướng và quyết định.
│   │
│   ├── srs/
│   │   ├── srs.md                               # Yêu cầu tổng thể/cross-cutting của hệ thống.
│   │   ├── fr-nfr-specs.md                      # Đặc tả FR/NFR.
│   │   ├── ui-ux-specs.md                       # Đặc tả UI/UX.
│   │   ├── api-specs.md                         # Đặc tả API/interface.
│   │   └── data-specs.md                        # Đặc tả dữ liệu.
│   │
│   ├── dds/
│   │   ├── dds.md                               # Thiết kế tổng thể/cross-cutting của hệ thống.
│   │   ├── fr-nfr-design.md                     # Thiết kế hiện thực FR/NFR.
│   │   ├── ui-ux-design.md                      # Thiết kế UI/UX.
│   │   ├── api-design.md                        # Thiết kế API/integration.
│   │   └── data-design.md                       # Thiết kế dữ liệu.
│   │
│   └── plans/
│       ├── project-plan.md                      # Kế hoạch tổ chức, lịch và phân công toàn dự án.
│       ├── foundation-setup-plan.md             # Kế hoạch chuẩn bị nền tảng chung cho build.
│       ├── build-plan.md                        # Kế hoạch build hệ thống.
│       ├── test-plan.md                         # Kế hoạch kiểm thử hệ thống.
│       └── deploy-plan.md                       # Kế hoạch triển khai hệ thống.
│
└── service-docs/
    ├── core/
    │   ├── fsp.md                               # Foundation setup riêng của service.
    │   ├── fr-nfr-specs.md                      # FR/NFR của service.
    │   ├── fr-nfr-design.md                     # Design FR/NFR của service.
    │   ├── fr-nfr-build-plan.md                 # Build plan FR/NFR của service.
    │   └── test-plan.md                         # Test plan của service.
    │
    ├── ui-ux/                                   # Chỉ dùng nếu service có người dùng trực tiếp.
    │   ├── ui-ux-specs.md                       # Spec UI/UX của service.
    │   ├── ui-ux-design.md                      # Design UI/UX của service.
    │   └── ui-ux-build-plan.md                  # Build plan UI/UX của service.
    │
    ├── api/                                     # Chỉ dùng nếu service có giao tiếp với bên ngoài.
    │   ├── api-specs.md                         # Spec API/interface của service.
    │   ├── api-design.md                        # Design API/integration của service.
    │   └── api-build-plan.md                    # Build plan API/integration của service.
    │
    └── data/                                    # Chỉ dùng nếu service có responsibility về persistent data/DB.
        ├── data-specs.md                        # Spec dữ liệu của service.
        ├── data-design.md                       # Design data model/storage của service.
        └── data-build-plan.md                   # Build plan database/data layer của service.
```

> `ui-ux/`, `api/`, `data/` không bắt buộc ở mọi service. Chúng xuất hiện theo responsibility thực tế của service.

---

# 3. META — Metadata của bộ tài liệu

`META` là thông tin mô tả và quản trị **document system**, không phải tài liệu chính trong SDLC.

```text
META
├── Tree           # Cây tài liệu ở cấp system/service, nhánh nào dùng khi nào
├── Registry       # Mỗi leaf một dòng: mục đích, upstream, ownership, điều kiện áp dụng
├── Conventions    # ID scheme, naming, versioning, status lifecycle, schema chung
├── Traceability   # Hướng trace, quy tắc mỗi nội dung chỉ có một owner
└── Terms          # Thuật ngữ của bộ tài liệu: SRS, DDS, FSP, PI...
```

Các quy tắc chung được định nghĩa một lần tại META thay vì lặp trong từng leaf.

---

# 4. INFO — Research & Information

## 4.1. Vai trò

`info.md` là kho nghiên cứu và bằng chứng về đề tài, không phải trang định danh dự án.

INFO ghi nhận thông tin, sự thật, bằng chứng và phân tích; không ghi quyết định khởi tạo hay requirement.

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

## 4.3. Quy tắc

- Các nhóm con trong `Findings` chỉ là gợi ý, có thể thay đổi theo đề tài.
- Mỗi nguồn có ID `SRC-`.
- Mỗi finding có ID `INF-`.
- PI và Spec tham chiếu `INF-` thay vì sao chép bằng chứng.
- `Analysis & Implications` phân tích ý nghĩa của findings nhưng chưa trở thành quyết định.
- Thuật ngữ của domain nằm ở INFO; thuật ngữ của chính hệ thống nằm ở PI.

---

# 5. PI — Project Initiation

## 5.1. Vai trò

`pi.md` là khởi tạo dự án: mục tiêu, phạm vi, định hướng và quyết định khởi tạo.

PI chuyển từ thông tin/nghiên cứu sang định hướng và quyết định cấp dự án.

## 5.2. Cấu trúc

```text
PI
├── Goals                       # Vấn đề, vision, mục tiêu, success criteria
├── Scope                       # In/out, user, stakeholder và product boundary
├── Direction                   # Hướng tiếp cận, nguyên tắc, ưu tiên
├── Decisions                   # PD-: quyết định khởi tạo, có rationale và Basis
└── Constraints & Assumptions   # Điều kiện và giả định chi phối dự án
```

## 5.3. Boundary với INFO và STACK

- INFO sở hữu facts, evidence và analysis.
- PI sở hữu goals, scope, direction và project decisions.
- STACK sở hữu việc lựa chọn công nghệ/tool cụ thể.
- Nếu PI quyết định một hướng công nghệ, STACK trích `PD-` trong `Basis` thay vì lặp decision.

---

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

Mỗi lựa chọn dùng cùng schema:

```text
ID | Category | Name & Version | Applies to | Role | Basis | Requires | Status
```

ID dùng `STK-`.

## 6.4. Quy tắc

- `Category` là slot trừu tượng, không khóa cứng danh sách layer.
- "Nền tảng" thuộc Tech nếu là nền tảng chạy hệ thống; thuộc Tool nếu là nền tảng phát triển.
- Không tạo section riêng cho Selection Criteria, Alternatives hoặc Compatibility.
- Tiêu chí chọn nằm ở PI/INFO; bằng chứng so sánh nằm ở INFO.
- Compatibility được biểu diễn bằng `Requires`.
- `Applies to` cho biết item áp dụng cho system hay service cụ thể.

## 6.5. Upstream / downstream

```text
Upstream:   INFO, PI
Downstream: DDS, Foundation Setup Plan
```

Nếu Spec/Design phát sinh nhu cầu đổi công nghệ, cập nhật mục `STK-` bằng version/status phù hợp; STACK không chứa trace ngược xuống Design như một requirement mới.

---

# 7. SPECIFICATION

Specification trả lời **hệ thống/service phải có hoặc phải đáp ứng điều gì**.

## 7.1. Nguyên tắc chung

- `Purpose` và `Scope` không lặp trong từng leaf; Registry và vị trí trong cây đã xác định vai trò/phạm vi.
- `Basis` là trường trên từng dòng, trỏ về `INF-`, `PD-` hoặc ID upstream thích hợp.
- `Requirements / Definitions` là lõi của Spec leaf.
- Ràng buộc là một loại requirement phù hợp với leaf sở hữu nó.
- `Acceptance` nằm trên dòng Spec; Test Plan dùng nó để xây tiêu chí kiểm chứng.
- `Traceability` và `Notes` được quản lý theo META.

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

- `Statement` là câu yêu cầu hoặc phát biểu định nghĩa.
- `Priority` và `Status` được định nghĩa một lần trong META/Conventions.
- `Acceptance` phải kiểm chứng được.
- ID service-level dùng scope, ví dụ `FR-SYS-001`, `FR-ORD-003`.
- ID system-level và service-level không dùng chung một ID; service tạo ID riêng và trace về upstream.

## 7.3. SRS

```text
SRS
├── System Context              # ACT-: actor, EXT-: hệ thống bên ngoài
└── Cross-cutting Requirements  # SRS-: yêu cầu xuyên suốt, policy, compliance, operational constraints
```

`ACT-` và `EXT-` được định nghĩa tại SRS để các leaf khác reference thay vì định nghĩa lại.

## 7.4. FR/NFR Specs

```text
FR/NFR SPECS
├── Functional Requirements       # FR-: nhóm theo capability hoặc actor goal
└── Non-functional Requirements   # NFR-: nhóm theo quality attribute
```

- FR sở hữu capability và business rule.
- NFR sở hữu quality attributes đo được như performance, availability, security, RPO/RTO.
- Usability và accessibility thuộc UI/UX khi chúng mô tả trải nghiệm người dùng.

## 7.5. UI/UX Specs

```text
UI/UX SPECS
├── Tasks & Journeys          # UI-: user task, journey, flow
├── Interface & Interaction   # UI-: thông tin hiển thị, trạng thái, tương tác, phản hồi
└── Experience Qualities      # UI-: usability, accessibility, thiết bị, ngôn ngữ
```

UI/UX không lặp lại capability của FR; nó mô tả cách người dùng trải nghiệm và tương tác với capability đó.

## 7.6. API Specs

```text
API SPECS
├── Interfaces               # API-: provided/consumed interface, bên đối tác, mục đích
├── Operations & Contracts   # API-: input/output, validation, error behavior
└── Interface Constraints    # API-: auth, versioning, rate limit, compatibility
```

Spec API giữ contract ở mức trung lập công nghệ. Quyết định REST/gRPC, URL, schema triển khai cụ thể thuộc API Design. Ngoại lệ: contract bắt buộc do bên ngoài áp đặt có thể nằm trong Spec.

## 7.7. Data Specs

```text
DATA SPECS
├── Data Entities                # DATA-: khái niệm dữ liệu, ý nghĩa, source of truth
├── Data Rules                   # DATA-: toàn vẹn, validation, quan hệ nghiệp vụ
└── Data Lifecycle & Protection  # DATA-: retention, classification, volume, protection requirements
```

- Retention và classification thuộc Data Specs.
- Encryption, RPO/RTO và các quality attribute hệ thống thuộc NFR khi bản chất là quality requirement.

## 7.8. Quy tắc ownership

- Một requirement thuộc leaf cụ thể nhất mà chủ thể của nó nằm trong.
- Chỉ đưa requirement lên SRS nếu không thể đặt gọn vào một leaf chuyên biệt.
- Một nội dung chỉ có một owner; tài liệu khác reference bằng ID.
- Service Spec là refinement/partition của System Spec, không copy nguyên văn.
- Thứ tự trace thực tế khi service boundary được xác định trong DDS:

```text
System Spec → DDS (phân rã service) → Service Spec → Service Design
```

Service Spec có thể `Basis` từ `ARC-` của DDS bên cạnh System Spec ID.

---

# 8. DESIGN — Detailed Design

Design trả lời **các requirement được hiện thực bằng cấu trúc, behavior và các quyết định kỹ thuật như thế nào**.

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

- `Definition`: trách nhiệm của Structure hoặc diễn biến của Behavior.
- Sơ đồ là một cách biểu diễn trong `Definition`, không phải section riêng.
- `Uses` trỏ tới phần tử khác, `STK-` hoặc `EXT-`.
- `Realizes` trỏ về ID của Spec.
- `Decisions` trỏ về các `DD-` chi phối phần tử.

Schema decision:

```text
ID | Decision | Rationale | Basis | Status
```

`Rationale` phải ghi lý do, phương án đã loại và trade-off khi có.

`Basis` có thể trỏ tới Spec, `STK-`, `INF-` hoặc `PD-`.

## 8.2. DDS

```text
DDS
├── Structure
│   ├── System Architecture    # ARC-: service, boundary, responsibility, topology
│   └── Cross-cutting Design   # ARC-: security, logging, error handling, configuration...
├── Behavior                   # ARC-: end-to-end flow xuyên nhiều service
└── Decisions                  # DD-SYS-
```

`System Architecture` gồm cả deployment topology (service chạy ở đâu, ranh giới môi trường) dưới dạng `ARC-`, vì Deploy Plan cần phần tử design để trace tới.

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
│   ├── Interface Structure    # APD-: protocol, resource, operations, naming, versioning
│   └── Contracts              # APD-: request/response schema, error model
├── Behavior                   # APD-: sequence, auth, async/webhook, retry/idempotency
└── Decisions                  # DD-
```

## 8.6. Data Design

```text
DATA DESIGN
├── Structure
│   ├── Data Model             # DTD-: entity, table/collection, relationship, constraint, index
│   └── Storage & Access       # DTD-: partitioning, access pattern, migration, backup
├── Behavior                   # DTD-: data flow, transformation, synchronization, lifecycle jobs
└── Decisions                  # DD-
```

## 8.7. Quy tắc ownership và trace

- Mỗi Design element phải `Realizes` ít nhất một Spec ID.
- Mỗi Spec ID phải được ít nhất một Design element thực hiện.
- Design không tạo requirement ngầm. Nếu cần requirement mới, bổ sung vào Spec trước.
- Design là nơi gắn với công nghệ cụ thể bằng `STK-`.
- Decision đặt ở leaf có chủ thể của nó; decision xuyên nhiều leaf/service lên DDS.
- Phạm vi cụ thể nhất được ưu tiên; phần xuyên service nằm ở system-level.

---

# 9. PLAN

Plan trả lời **cần làm gì, theo cách nào và theo dependency nào để tạo ra kết quả đã được đặc tả/thiết kế**.

## 9.1. Template chung

```text
PLAN LEAF
├── Approach                     # APC-, quyết định về cách làm
├── Work Items                   # Nhóm theo Category của leaf
└── Assumptions & Open Issues    # Chỉ khi cần
```

Schema work item:

```text
ID | Name | Description | Covers | Depends on | Done when | Status
```

Quy tắc:

- `Covers` bắt buộc với work item, trừ `Gate`.
- `Depends on` tạo ra thứ tự thực hiện; không viết lịch riêng trong leaf plan.
- `Done when` là điều kiện hoàn thành công việc.
- Ngày, người phụ trách, ước lượng thuộc Project Plan.
- Plan không tạo requirement, design hay technology choice mới.

## 9.2. Project Plan

```text
PROJECT PLAN
├── Approach                    # APC-SYS-: lifecycle, phương pháp, change management
├── Phases & Milestones         # PRJ-: phase, milestone, gate; có Target
├── Roles & Responsibilities    # PRJ-: role, responsibility
└── Risks                       # RSK-: risk, impact, response, owner
```

Project Plan là nơi duy nhất quản lý ngày/lịch tổng thể.

## 9.3. Foundation Setup Plan

```text
FOUNDATION SETUP PLAN
├── Approach
└── Work Items                  # FND-: Environment, Toolchain, Repository & Scaffolding,
                                #       Access & Configuration
```

Foundation Setup chuẩn bị nền tảng để build bắt đầu: environment, toolchain, repository/scaffolding, access/configuration và các thành phần tương ứng.

Ở cấp service, foundation chỉ chứa phần riêng của service; phần dùng chung phụ thuộc vào system Foundation Setup Plan.

## 9.4. Build Plan

```text
BUILD PLAN
├── Approach                    # APC-: increment, integration, branching, versioning
└── Work Items                  # Category: Implementation, Integration
```

- System-level `Build Plan` cover các phần tử Design cấp system và integration xuyên service.
- Service-level build plan cover Design element của facet tương ứng.

## 9.5. Test Plan

```text
TEST PLAN
├── Approach                    # APC-: test levels, environment, data, tools, defect handling
└── Test Items                  # TST-: Category = test level, cộng Gate cho entry/exit
```

- `Covers` trỏ trực tiếp tới Spec.
- `Done when` là pass criteria cụ thể hóa `Acceptance` của Spec.
- `Gate` biểu diễn điều kiện entry/exit của test level.
- Test Plan trace trực tiếp về Spec, không cần đi qua Design.

## 9.6. Deploy Plan

```text
DEPLOY PLAN
├── Approach                    # APC-: release, rollout, rollback
└── Work Items                  # DPL-: Environment Provisioning, Release & Rollout,
                                #       Rollback, Operational Readiness, Gate
```

`Covers` có thể trỏ tới `ARC-` topology, `STK-` và `NFR-` về availability/RPO/RTO.

Ranh giới môi trường:

- Environment dùng để build/test thuộc Foundation Setup.
- Environment hệ thống được phát hành lên (staging, production...) thuộc Deploy Plan.

---

# 10. Service-level Documentation

Service-level sử dụng cùng semantic structure với system-level nhưng đi sâu theo responsibility của service.

## 10.1. Core

```text
core/
├── fsp.md                      # Foundation setup riêng của service.
├── fr-nfr-specs.md             # FR/NFR thuộc trách nhiệm service.
├── fr-nfr-design.md            # Thiết kế cách service hiện thực FR/NFR.
├── fr-nfr-build-plan.md        # Kế hoạch build phần FR/NFR.
└── test-plan.md                # Kiểm thử riêng service.
```

`FSP` là foundation plan của service; system Foundation Setup Plan là foundation dùng chung ở cấp system.

## 10.2. UI/UX

Chỉ có khi service có người dùng trực tiếp.

```text
ui-ux/
├── ui-ux-specs.md              # User tasks, journeys, interface, interaction, experience qualities.
├── ui-ux-design.md             # Thiết kế chi tiết UI/UX.
└── ui-ux-build-plan.md         # Kế hoạch triển khai UI/UX.
```

## 10.3. API

Có khi service có giao tiếp với service/system/component bên ngoài qua interface.

```text
api/
├── api-specs.md                # API/interface mà service cung cấp hoặc sử dụng.
├── api-design.md               # Thiết kế interface, contract và behavior.
└── api-build-plan.md           # Kế hoạch triển khai API/integration.
```

Nếu service có UI và UI giao tiếp với service thì API vẫn cần được mô tả; điều kiện API không chỉ là BE mà là **external interaction boundary**.

## 10.4. Data

Có khi service có responsibility với persistent data/database.

```text
data/
├── data-specs.md               # Data entities, rules, lifecycle/protection.
├── data-design.md              # Data model, storage/access, data flow.
└── data-build-plan.md          # Kế hoạch triển khai database/data layer.
```

Chỉ đọc/consume data qua API của service khác không tự động tạo `data/`; responsibility sở hữu/quản lý persistent data mới là điều kiện.

---

# 11. Traceability và ownership

## 11.1. Quy tắc cốt lõi

> **Mỗi nội dung chỉ có một owner; các tài liệu khác reference bằng ID, không copy.**

## 11.2. Các hướng trace chính

```text
INFO
  ↓ INF-
PI
  ↓ PD-
STACK
  ↓ STK-
SRS / Specs
  ↓
DDS / Design
  ↓
Build Plans
  ↓
BUILD
```

Test trace trực tiếp:

```text
Specs
  ↓
Test Plan
  ↓
TEST
```

Deploy trace từ Design/Stack/NFR:

```text
DDS / STK / NFR
  ↓
Deploy Plan
  ↓
DEPLOY
```

## 11.3. Service refinement

```text
System Spec
    ↓
DDS phân rã service bằng ARC-
    ↓
Service Spec
    ↓
Service Design
    ↓
Service Build Plan
    ↓
Implementation
```

Service-level không copy nguyên văn system-level; mỗi dòng là refinement/phân bổ từ upstream qua `Basis`/`Realizes`/`Covers` tùy loại artifact.

---

# 12. Prefix và ID

Các prefix chính:

```text
SRC-      Source
INF-      Finding
PD-       Project Decision
STK-      Stack item
ACT-      Actor
EXT-      External system / external dependency
SRS-      System cross-cutting requirement
FR-       Functional Requirement
NFR-      Non-functional Requirement
UI-       UI/UX specification item
API-      API specification item
DATA-     Data specification item
ARC-      Architecture design item
SOL-      Solution / FR-NFR design item
UXD-      UI/UX design item
APD-      API design item
DTD-      Data design item
DD-       Design Decision
APC-      Approach Decision
PRJ-      Project plan item
RSK-      Risk
FND-      Foundation setup item
BLD-      System build item
CBL-      Core service build item
UBL-      UI/UX service build item
ABL-      API service build item
DBL-      Data service build item
TST-      Test item
DPL-      Deploy item
```

ID requirement/design/spec ở system và service dùng scope:

```text
<TYPE>-<SCOPE>-<NNN>
```

Ví dụ:

```text
FR-SYS-001
FR-ORD-003
```

ID chỉ có một file ở cấp dự án như `SRC-`, `INF-`, `PD-`, `STK-`, `ACT-`, `EXT-`, `SRS-` không cần scope thêm nếu META quy định chúng có một owner duy nhất.

---

# 13. Các quy tắc kiểm tra tài liệu

Mỗi section chỉ được giữ nếu vượt qua đủ bốn phép thử:

1. **Correct** — có trả lời đúng câu hỏi mà document/section chịu trách nhiệm trả lời không?
2. **Complete** — bỏ section này đi thì câu hỏi đó còn được trả lời trọn vẹn không?
3. **Non-overlapping** — nội dung có owner ở leaf khác chưa?
4. **Abstract** — structure mô tả loại nội dung, không chứa nội dung của một dự án cụ thể không?

Ngoài ra:

- Không tạo requirement từ Design.
- Không tạo design từ Plan.
- Không chọn technology trong Build Plan.
- Không kiểm chứng Design thay cho Spec trong Test Plan.
- Không copy requirement giữa System và Service.
- Không để Design element hoặc Plan item mồ côi.
- Không tạo document branch nếu service không có responsibility tương ứng.

---

# 14. Nguyên tắc tổng quát của bộ tài liệu

```text
INFO
→ sự thật, bằng chứng, nghiên cứu và phân tích

PI
→ mục tiêu, phạm vi, định hướng và quyết định dự án

STACK
→ technology/tool baseline được chọn

SPEC
→ hệ thống/service phải làm gì và phải đáp ứng điều gì

DESIGN
→ được hiện thực bằng cấu trúc, behavior và quyết định kỹ thuật nào

PLAN
→ cần thực hiện những work item nào, theo dependency nào

BUILD
→ implementation

TEST
→ verification

DEPLOY
→ release và đưa vào vận hành
```

Mục tiêu của framework là tạo một chuỗi tài liệu có **ownership rõ, traceability rõ, không trùng nội dung, có thể refine từ system xuống service và đủ cấu trúc để AI sử dụng làm input cho việc lập kế hoạch và triển khai**.
