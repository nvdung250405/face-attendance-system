# Bộ tài liệu hướng dẫn SDLC

## 1. Mục đích

Framework dùng chung cho nhiều dự án; định nghĩa lifecycle, cấu trúc tài liệu, ownership, schema, ID, traceability và cách dùng ở **System** / **Subsystem**.

`meta.md` là metadata của document system, không phải artifact SDLC.

### 1.1. Lifecycle

```text
INFO → (PI, STACK) → SPEC → DESIGN → PLAN → BUILD → TEST → DEPLOY → MAINTAIN
```

| Tầng | Câu hỏi |
|---|---|
| INFO | Ta biết gì? |
| PI | Làm gì, trong phạm vi và định hướng nào? |
| STACK | Dùng công nghệ/tool/platform nào? |
| SPEC | Phải làm gì và đáp ứng gì? |
| DESIGN | Hiện thực bằng structure, behavior, decisions nào? |
| PLAN | Cần làm work gì và theo dependency nào? |
| BUILD | Implementation | 
| TEST | Verification |
| DEPLOY | Release và vận hành |
| MAINTAIN | Sửa đổi, sự cố, cải tiến sau release |

`PI` và `STACK` cùng nhận input từ `INFO`. `SPEC` trung lập công nghệ; `STACK` ảnh hưởng `DESIGN` và `PLAN`. `project-plan.md` có thể bắt đầu từ PI.

**System:** dùng toàn bộ lifecycle trên.

**Subsystem:** `System SPEC + ARC- → Subsystem SPEC → DESIGN → PLAN → BUILD → TEST`; `DEPLOY` do System quản lý. `MAINTAIN` bắt đầu tại artifact bị ảnh hưởng và đi tiếp downstream trong scope liên quan.

### 1.2. Chất lượng

```text
Correct → Complete → Unambiguous → Verifiable → Consistent → Traceable
```

---

# 2. Cấu trúc thư mục

```text
# LIFECYCLE: INFO → (PI, STACK) → SPEC → DESIGN → PLAN → BUILD → TEST → DEPLOY → MAINTAIN.
# FACET: FR/NFR → DATA → API → UI/UX.
# Tree = reference decomposition, not a mandatory file checklist; BUILD/TEST/DEPLOY/MAINTAIN = evidence.

docs/
│
├── meta.md                              # Metadata — Tree, Registry, Conventions, Traceability, Tailoring.
│
├── system-docs/                         # System — context, architecture, common plans.
│   ├── info.md                          # Research/evidence/analysis. [RQ-/SRC-/INF-/ANL-/GAP-]
│   ├── pi.md                            # Goals/scope/direction/decisions. [PD-]
│   ├── tech-tool-stack.md               # Technology/tool/platform. [STK-]
│   │
│   ├── srs/                             # SPEC — system requirements.
│   │   ├── srs.md                       # Context + cross-cutting requirements. [ACT-/EXT-/SRS-]
│   │   └── fr-nfr-specs.md              # System FR/NFR. [FR-/NFR-]
│   │
│   ├── dds/                             # DESIGN — system architecture/design.
│   │   └── dds.md                       # Boundary/topology/cross-cutting design. [ARC-/DD-]
│   │
│   └── plans/                           # PLAN — system plans.
│       ├── project-plan.md              # Phase/milestone/role/risk. [APC-/PRJ-/ROL-/RSK-]
│       ├── foundation-setup-plan.md     # Common foundation. [FND-]
│       ├── build-plan.md                # System build/integration. [BLD-]
│       ├── test-plan.md                 # System verification. [TST-]
│       └── deploy-plan.md               # Release/rollout/rollback. [DPL-]
│
└── subsystem-docs/                      # Subsystem — boundary + responsibility riêng.
    │
    └── <subsystem-code>/
        │
        ├── srs/                         # SPEC — subsystem requirements.
        │   ├── fr-nfr-specs.md          # FR/NFR. [FR-/NFR-]                 (luôn có)
        │   ├── data-specs.md            # Data. [DATA-]                      (khi sở hữu data)
        │   ├── api-specs.md             # API contract. [API-]               (khi sở hữu API)
        │   └── ui-ux-specs.md           # UI/UX. [UI-]                       (khi có user trực tiếp)
        │
        ├── dds/                         # DESIGN — subsystem design.
        │   ├── fr-nfr-design.md         # FR/NFR design. [SOL-]              (luôn có)
        │   ├── data-design.md           # Data design. [DTD-]                (khi sở hữu data)
        │   ├── api-design.md            # API design. [APD-]                 (khi sở hữu API)
        │   └── ui-ux-design.md          # UI/UX design. [UXD-]               (khi có user trực tiếp)
        │
        └── plans/                       # PLAN — subsystem plans.
            ├── foundation-setup-plan.md # Foundation riêng. [FND-]
            ├── build-plan.md            # Build; section theo facet. [BLD-]
            ├── test-plan.md             # Test; section theo facet. [TST-]
            └── task-plan.md             # Tasks/dependency. [TASK-]
```

### 2.1. Quy tắc

- **Format:** table chỉ dùng cho dữ liệu ngắn, phẳng và thiên về tra cứu; schema dùng field list; item thực tế dùng record block; dữ liệu lồng/nhiều dòng có thể dùng YAML.
  `Record block:` `### <ID>` rồi `**Field:** value`; không nhét nội dung dài vào table.
- Một nội dung chỉ có một owner.
- System không chứa implementation detail riêng của subsystem.
- Subsystem không copy System; refinement/allocation dùng ID.
- `data`, `api`, `ui-ux` chỉ xuất hiện khi responsibility có mặt.
- Không tạo file/facet chỉ để đủ cây.

System DESIGN chỉ giữ architecture, boundary, topology và cross-cutting design; design chi tiết thuộc Subsystem.

Subsystem là một unit có boundary, owner và lifecycle riêng; có thể là microservice, module, application, library, pipeline, web app hoặc mobile app.

### 2.2. Tailoring

```text
Tailoring record — Fields: Element, Default, Applied, Reason, Impact
```

Ghi tailoring trong `meta.md` khi project thêm/bớt facet, đổi representation hoặc schema. Không được phá vỡ ownership, ID bất biến và trace bằng ID.

---

# 3. META

`meta.md` chỉ ghi phần áp dụng cho project, không chép framework.

```text
META
├── Tree
├── Registry
├── Conventions
├── Traceability
└── Terms
```

### 3.1. Registry

| Artifact | Upstream | Downstream |
|---|---|---|
| `info.md` | `SRC-` | PI, SPEC, STACK |
| `pi.md` | INFO | STACK, SPEC, Project Plan |
| `tech-tool-stack.md` | INFO, PI | DESIGN, PLAN |
| System SRS | INFO, PI, upstream Spec | System DDS, Test |
| System DDS | System Spec, STACK, PI | Subsystem Spec, Plan, Deploy |
| Subsystem Spec | System Spec, `ARC-` | Subsystem DDS, Test |
| Subsystem DDS | Spec, STACK, `ARC-` | Build/Test Plan, Deploy |
| Project Plan | PI | — |
| Foundation Plan | STACK, `ARC-` | Build / Task |
| Build Plan | Design, Foundation | Task / BUILD |
| Test Plan | Spec | TEST |
| Deploy Plan | `ARC-`, `STK-`, `NFR-` | DEPLOY |
| Task Plan | Build / Foundation | BUILD |

---

# 4. INFO

`info.md` sở hữu facts, evidence và analysis; không sở hữu project decision hoặc requirement.

```text
INFO
├── Research Questions
├── Domain Context
├── Source Register
├── Findings
├── Analysis & Implications
└── Gaps & Open Questions
```

```text
RQ- — Fields: ID, Question, Serves, Status
SRC- — Fields: ID, Citation, Type, Published, Accessed, Reliability, Location, Status
INF- — Fields: ID, Statement, Type, Topic, Derived from, Confidence, Answers, Implication, Conflicts with, Status
ANL- — Fields: ID, Analysis, Derived from, Impacts, Status
GAP- — Fields: ID, Kind, Missing knowledge, Refers to, Blocks, Resolution, Status
```

`INF-` trace nguồn bằng `Derived from`; `ANL-` là analysis; `GAP-` là phần chưa biết/mâu thuẫn cần resolve.

---

# 5. PI

`pi.md` sở hữu goals, scope, direction, decisions và constraints.

```text
PI
├── Goals
├── Scope
├── Direction
├── Decisions
├── Constraints
├── Assumptions & Open Issues
└── Glossary
```

Decision schema:

```text
Decision item — Fields: ID, Decision, Rationale, Alternatives, Consequences, Basis, Status
```

`PD-` là decision item-level. Constraint công nghệ bắt buộc thuộc PI; lựa chọn cụ thể thuộc STACK.

---

# 6. STACK

`tech-tool-stack.md` sở hữu technology, framework, tool và platform.

```text
STACK
├── Tech Stack
├── Tool Stack
└── Assumptions & Open Issues
```

```text
Stack item — Fields: ID, Category, Name, Version, Applies to, Role, Basis, Requires, Status
```

`Requires` chỉ trỏ `STK-`; tiêu chí/evidence lựa chọn nằm ở INFO/PI; Design/Plan reference `STK-`.

---

# 7. SPEC

SPEC trả lời **phải làm gì và phải đáp ứng gì**. Requirement có `Basis`, `Acceptance`, `Status`.

### 7.1. System SRS

```text
SRS
├── System Context
└── Cross-cutting Requirements
```

- `ACT-`: actor.
- `EXT-`: external system/dependency.
- `SRS-`: requirement xuyên subsystem, policy, compliance, operational constraint.
- System capability/quality nằm ở `fr-nfr-specs.md`.
- System SRS chỉ giữ context, cross-cutting requirements và system FR/NFR. Chi tiết `data`, `api`, `ui-ux` được sở hữu ở Subsystem khi concern thuộc một Subsystem cụ thể.

### 7.2. Subsystem Specs

```text
FR/NFR → DATA → API → UI/UX
```

| Facet | Owner |
|---|---|
| FR/NFR | capability, business rule, measurable quality |
| Data | entity, meaning, integrity, lifecycle, protection |
| API | interface, operation, contract, interface constraint |
| UI/UX | task, journey, interaction, experience quality |

### 7.3. Ownership rule

1. User interaction → UI/UX
2. External interface → API
3. Data meaning/integrity/retention/classification → Data
4. Measurable quality → NFR
5. Capability/business rule → FR
6. Cross-cutting policy/compliance/operational constraint → System SRS

Một requirement chạm nhiều owner thì tách thành các item và nối bằng `Basis`. UI/UX không lặp capability của FR; API Spec giữ contract technology-neutral.

---

# 8. DESIGN

DESIGN trả lời **hiện thực SPEC bằng structure, behavior và decisions nào**.

Element schema:

```text
Design element — Fields: ID, Name, Definition, Uses, Realizes, Decisions, Status
```

`Realizes` → Spec; `Uses` → Design / `STK-` / `EXT-`; `Decisions` → `DD-`.

### 8.1. System DDS

```text
DDS
├── Structure
│   ├── Subsystem Architecture    # ARC-: boundary, responsibility, topology
│   └── Cross-cutting Design      # ARC-: security, logging, error handling, configuration
├── Behavior                      # ARC-: end-to-end flow xuyên subsystem
└── Decisions                     # DD-
```

`ARC-` là điểm nối System → Subsystem.

### 8.2. Subsystem Design

Facet của Subsystem theo thứ tự định nghĩa ở §2.

Mỗi Design leaf:

```text
DESIGN LEAF
├── Structure
├── Behavior
├── Decisions
└── Assumptions & Open Issues   # khi cần
```

### 8.3. FR/NFR Design

```text
Structure: Components & Logic; Quality Mechanisms
Behavior: Processing flow, lifecycle, state
Decisions: DD-
```

### 8.4. UI/UX Design

```text
Structure: Information Architecture & Navigation; Screens & Components; Visual & Content Language
Behavior: Interaction, state, feedback
Decisions: DD-
```

### 8.5. API Design

```text
API DESIGN
├── Structure
│   ├── Interface: Protocol, Endpoint / Resource, Operation, Naming, Versioning
│   └── Contract: Request, Response, Error, Schema
├── Behavior: Validation, Authentication & Authorization, Idempotency,
│             Retry & Timeout, Async / Webhook, Sequence
└── Decisions
```

API Design gắn chi tiết triển khai vào `STK-`; không tạo requirement mới.

### 8.6. Data Design

```text
Structure: Data Model; Storage & Access
Behavior: Data flow, transformation, synchronization, lifecycle jobs
Decisions: DD-
```

---

# 9. PLAN

`PLAN` là execution planning; `project-plan.md` là project governance/schedule.

### 9.1. Plan schema

```text
PLAN LEAF
├── Approach
├── Work Items
└── Assumptions & Open Issues
```

```text
Work item — Fields: ID, Name, Description, Covers, Depends on, Done when, Status
```

| Plan | Prefix | `Covers` |
|---|---|---|
| Foundation | `FND-` | `STK-`, `ARC-` |
| Build | `BLD-` | Design |
| Test | `TST-` | Spec |
| Deploy | `DPL-` | `ARC-`, `STK-`, `NFR-` |

`Gate` không cần `Covers`; `TASK-` dùng schema riêng. Plan không tạo requirement/design/technology choice mới.

### 9.2. Project Plan

```text
PROJECT PLAN
├── Approach
├── Phases & Milestones
├── Roles & Responsibilities
└── Risks
```

```text
Phase / Milestone / Gate — Fields: ID, Name, Type, Includes, Depends on, Target, Estimate, Owner, Exit criteria, Status
Role — Fields: ID, Role, Responsibility, Assignee
Risk — Fields: ID, Risk, Probability, Impact, Response, Owner, Basis, Status
```

Project Plan là nơi duy nhất quản lý schedule, target, estimate và assignment.

### 9.3. Foundation Setup Plan

Chuẩn bị environment, toolchain, repository/scaffolding, access và configuration.

- System: foundation dùng chung.
- Subsystem: foundation riêng; có thể phụ thuộc `FND-SYS-*`.

### 9.4. Build Plan

```text
BUILD PLAN
├── Approach
└── Work Items                  # BLD-
```

`build-plan.md` phân section theo thứ tự facet ở §2.

- System: build/integration xuyên subsystem.
- Subsystem: build work của subsystem.
- `BLD-` là planning unit; Integration có một owner.

### 9.5. Task Plan

```text
TASK PLAN
├── Approach
├── Tasks
├── Dependency Structure
├── Execution Waves
└── Assumptions & Open Issues
```

```text
Task — Fields: ID, Name, Description, Derived from, Depends on, Wave, Done when, Status
```

- `Derived from` → đúng một `BLD-` hoặc `FND-` cùng scope.
- `Depends on` → `TASK-` cùng execution scope.
- `TASK-` là execution unit; đủ nhỏ để thực hiện và kiểm tra trong một change.
- `Wave` là projection của dependency graph, không phải work item.
- Build Work chưa đủ rõ → sửa Build Plan.
- `BLD-SYS-*` có thể execution-bearing khi work không thuộc subsystem nào; khi đó không cần `TASK-` nhưng phải có owner, `Done when`, evidence.

### 9.6. Test Plan

```text
TEST PLAN
├── Approach
└── Test Items                  # TST-
```

`Covers` → Spec trực tiếp; section theo thứ tự facet ở §2; `Done when` cụ thể hóa `Acceptance`.

### 9.7. Deploy Plan

`DPL-` mặc định scope `SYS`, tại `system-docs/plans/deploy-plan.md`.

```text
DEPLOY PLAN
├── Approach
└── Work Items                  # DPL-
```

`Covers` → `ARC-`, `STK-`, `NFR-`; có thể `Depends on` Foundation/Build/Test khi release phụ thuộc trực tiếp.

---

# 10. Traceability và ownership

> **Mỗi nội dung một owner; tài liệu khác reference bằng ID, không copy.**

### 10.1. Trace fields

| Field | Dùng ở | Target |
|---|---|---|
| `Basis` | Spec, STACK, Decision, Risk | upstream hợp lệ |
| `Uses` | Design | Design, `STK-`, `EXT-` |
| `Realizes` | Design | Spec |
| `Decisions` | Design | `DD-` |
| `Covers` | Plan | target theo Plan type |
| `Derived from` | Task | một `BLD-`/`FND-` |
| `Depends on` | Plan / Project / Task | execution dependency |
| `Requires` | STACK | `STK-` |
| `Applies to` | STACK | System / Subsystem |

### 10.2. Reference direction

> **Lifecycle trace: downstream → upstream. Do not create reverse references.**

`Includes` và `Depends on` là quan hệ có semantics riêng; chúng có thể đi ngang hoặc ngược hướng lifecycle mà không tạo ownership/dependency ngược.

### 10.3. `Basis` targets

| Item | Target |
|---|---|
| `STK-` | `INF-`, `ANL-`, `PD-` |
| Spec | `SRC-`, `INF-`, `ANL-`, `PD-`, upstream Spec, `ARC-` khi phù hợp |
| `PD-` | research/direction upstream |
| `DD-` | Spec, STACK, INFO, PI và nguồn upstream phù hợp |
| `APC-` | upstream decision/source |
| `RSK-` | risk source upstream |

### 10.4. Trace chính

```text
Build:      INFO → (PI, STACK) → SPEC → DESIGN → PLAN → BUILD
Test:       SPEC → TEST
Deploy:     DESIGN · STACK · NFR → DEPLOY
Maintain:   affected artifact → downstream trong scope liên quan → BUILD/TEST/DEPLOY
Subsystem:  System Spec → ARC- → Subsystem Spec → Design → Plan → TASK → BUILD
```

- Concern riêng subsystem do Subsystem owner; concern xuyên subsystem do System owner.
- Không copy System → Subsystem.
- Task truy ngược được tới đúng một Build/Foundation item.

---

# 11. Prefix và ID

| Prefix | Ý nghĩa | Owner |
|---|---|---|
| `RQ-` | Research Question | INFO |
| `SRC-` | Source | INFO |
| `INF-` | Finding | INFO |
| `ANL-` | Analysis | INFO |
| `GAP-` | Research Gap | INFO |
| `PD-` | Project Decision | PI |
| `STK-` | Stack item | STACK |
| `ACT-` | Actor | System `srs/srs.md` |
| `EXT-` | External system/dependency | System `srs/srs.md` |
| `SRS-` | Cross-cutting system requirement | System `srs/srs.md` |
| `FR-` / `NFR-` | Functional / Non-functional Requirement | `srs/fr-nfr-specs.md` |
| `UI-` | UI/UX Spec | `srs/ui-ux-specs.md` |
| `API-` | API Spec | `srs/api-specs.md` |
| `DATA-` | Data Spec | `srs/data-specs.md` |
| `ARC-` | Architecture | System `dds/dds.md` |
| `SOL-` | FR/NFR Design | `dds/fr-nfr-design.md` |
| `UXD-` | UI/UX Design | `dds/ui-ux-design.md` |
| `APD-` | API Design | `dds/api-design.md` |
| `DTD-` | Data Design | `dds/data-design.md` |
| `DD-` | Design Decision | Design leaf |
| `APC-` | Approach Decision | Plan leaf |
| `PRJ-` | Project plan item | `plans/project-plan.md` |
| `ROL-` | Project role | `plans/project-plan.md` |
| `RSK-` | Risk | `plans/project-plan.md` |
| `FND-` | Foundation item | System/Subsystem `plans/foundation-setup-plan.md` |
| `BLD-` | Build planning item | System/Subsystem `plans/build-plan.md` |
| `TASK-` | Execution task | Subsystem `plans/task-plan.md` |
| `TST-` | Test item | System/Subsystem `plans/test-plan.md` |
| `DPL-` | Deploy item | System `plans/deploy-plan.md` (`SYS`) |

```text
<TYPE>-<SCOPE>-<NNN>
<TYPE>-<NNN>        # khi không có scope
```

IDs immutable, không đổi hoặc tái sử dụng. Mỗi (`TYPE`, `SCOPE`) có một sequence duy nhất.

---

# 12. Quy tắc chất lượng

## 12.1. Sáu phép thử

Áp dụng cho `meta.md`, `system-docs/`, `subsystem-docs/`.

| Test | Câu hỏi |
|---|---|
| Correct | Đúng vai trò và owner? |
| Complete | Downstream làm việc được mà không phải đoán/phát minh phần quan trọng; scope nhỏ vẫn phải đủ substance? |
| Unambiguous | Known cụ thể; unknown được đánh dấu và có cách resolve? |
| Verifiable | Có cách kiểm chứng phù hợp? |
| Consistent | Không mâu thuẫn, copy hoặc redefine owner khác? |
| Traceable | Relation đúng ID; reference không thay substance? |

Unknown → `Open` / `TBD` / Assumption`; INFO dùng `GAP-`. `N/A` chỉ dùng khi bản chất không áp dụng và phải nêu lý do. Không biến suy luận chưa được chấp nhận thành fact/requirement/decision/design.

Sáu phép thử là human review; CI chỉ kiểm structural rules.

## 12.2. Structural rules

- Mỗi Design element có `Realizes`.
- Plan dùng schema chung → work item có `Covers`, trừ `Gate`.
- `TASK-` có `Derived from` đúng một `BLD-`/`FND-`.
- Mỗi Requirement có Design và Test coverage phù hợp.
- `BLD-SYS-*` execution-bearing không cần Task.
- Dependency xuyên facet resolve ở Task Plan.
- ID đúng scheme, immutable, không reuse.

---

# 13. Cách sử dụng

### 13.1. Khởi tạo

1. Tạo `meta.md`, chọn SCOPE và tailoring.
2. Xây INFO → PI/STACK → SPEC → DESIGN.
3. Tạo Project Plan khi cần governance/schedule; tạo execution plans theo work thực tế.
4. Thêm subsystem bằng `ARC-`; tạo đúng artifact cần thiết.
5. Tạo Task Plan khi cần decomposition/dependency execution.

### 13.2. Thêm subsystem

1. Thêm `ARC-` trong System DDS.
2. Chọn SCOPE và responsibility.
3. Tạo Spec/Design/Plan tương ứng và trace về System/ARC.
4. Cập nhật Tree/Registry trong `meta.md` nếu representation thay mặc định.

### 13.3. Thay đổi

1. Sửa tại owner.
2. Impact analysis bằng trace.
3. Cập nhật downstream bị ảnh hưởng.
4. Sau baseline, change đi qua pull request kèm impact analysis; sau release cũng quay lại artifact bị ảnh hưởng và đi tiếp downstream cần thiết.

### 13.4. CI

Kiểm:
- front matter;
- ID format/uniqueness;
- reference tồn tại: `Basis`, `Realizes`, `Covers`, `Uses`, `Requires`, `Derived from`, `Depends on`;
- orphan/coverage;
- Task `Wave` là số tự nhiên và lớn hơn wave của dependency;
- trace matrix.

CI xanh không thay thế sáu phép thử nội dung.

### 13.5. AI

- Bắt đầu từ Tree/Registry để chọn artifact cần đọc.
- Nạp theo ID; mở rộng theo trace khi cần.
- Không tạo nội dung ngoài owner; unknown không phải fact.
- Reference không thay substance.
- Task Plan chỉ phân rã `BLD-`/`FND-` đã có thành `TASK-`; không tạo requirement/design/BLD mới.

---

# 14. Đối chiếu thực tế

Chỉ ghi mapping không hiển nhiên; không phải tuyên bố tuân thủ.

| Thành phần | Tham chiếu |
|---|---|
| System Design / Architecture | ISO/IEC/IEEE 42010:2022; C4; arc42 |
| Design Description | IEEE 1016 |
| Decisions | ADR (Nygard) |
| Task planning | PMBOK work breakdown/activity sequencing; agile delivery practices |
| Traceability | ISO/IEC/IEEE 29148; ISO/IEC/IEEE 12207 |
