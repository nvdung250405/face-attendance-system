# Bộ tài liệu hướng dẫn SDLC

# 1. Mục đích

Framework dùng chung cho nhiều dự án; định nghĩa lifecycle, cấu trúc tài liệu, ownership, schema, ID, traceability và cách dùng ở **System** / **Subsystem**.

`meta.md` là metadata của document system, không phải artifact SDLC.

## 1.1. Lifecycle

```text
INFO → PI → (Requirements ‖ STACK) → Design → PLAN → BUILD → TEST → DEPLOY → MAINTAIN
```

| Semantic activity / layer | Câu hỏi |
|---|---|
| INFO | Ta biết gì? |
| PI | Làm gì, trong phạm vi và định hướng nào? |
| Requirements | Phải làm gì và đáp ứng gì? |
| STACK | Dùng công nghệ/tool/platform nào? |
| Design | Hiện thực Requirements bằng structure, behavior, decisions nào? |
| SPEC | Tầng lifecycle chứa Requirements + Design trong một Spec set | 
| PLAN | Cần làm work gì và theo dependency nào? |
| BUILD | Implementation |
| TEST | Verification |
| DEPLOY | Release và vận hành |
| MAINTAIN | Sửa đổi, sự cố, cải tiến sau release |

`Requirements` và `STACK` là hai input song song cho `Design`. **DESIGN là semantic activity trong SPEC (xem §3.3).** `MAINTAIN` là process ngoài document tree; framework chỉ nhận feedback qua change request/review. `project-plan.md` có thể bắt đầu từ PI.

**System:** `INFO → PI → (Requirements ‖ STACK) → Design → PLAN → BUILD → TEST → DEPLOY → MAINTAIN`.

**Subsystem:** `System Requirements/Design + ARC- → Subsystem Requirements/Design → PLAN → BUILD → TEST`; `DEPLOY` do System quản lý và release subsystem trace về `DPL-SYS-*`. `MAINTAIN` là process ngoài document tree; feedback đi vào framework qua change request/review và trace về artifact bị ảnh hưởng khi cần thay đổi tài liệu.

## 1.2. Quality model

Framework self-quality:
`Correct → Complete → Abstract → Reusable → Minimal`

Project artifact quality:
`Correct → Complete → Unambiguous → Verifiable → Consistent → Traceable`

Chi tiết và cách áp dụng hai bộ tiêu chí ở §11.1–§11.2.

---

# 2. Cấu trúc thư mục

```text
# LIFECYCLE: INFO → PI → (Requirements ‖ STACK) → Design → PLAN → BUILD → TEST → DEPLOY → MAINTAIN.
# FACET: FR/NFR → DATA → API → UI/UX.
# Tree = phân rã tham chiếu, không phải checklist file bắt buộc; BUILD/TEST/DEPLOY = execution evidence; MAINTAIN = process ngoài document tree.

docs/
│
├── meta.md                              # Metadata — Tree, Conventions, Traceability, Terms, Tailoring.
│
├── system-docs/                         # System — context, specification, architecture, common plans.
│   ├── info.md                          # Research/evidence/analysis. [RQ-/SRC-/INF-/ANL-/GAP-]
│   ├── pi.md                            # Goals/scope/direction/decisions. [PD-]
│   ├── tech-tool-stack.md               # Technology/tool/platform. [STK-]
│   │
│   ├── specs/                           # SPEC — requirements + design.
│   │   ├── spec.md                      # System context + cross-cutting + architecture/design + decisions.
│   │   │                                   # [ACT-/EXT-/SRS-/ARC-/DD-]
│   │   └── fr-nfr.md                    # System FR/NFR requirements + design. [FR-/NFR-/SOL-]
│   │
│   └── plans/                           # PLAN — system plans.
│       ├── project-plan.md              # Phase/milestone/role/risk. [APC-/PRJ-/ROL-/RSK-]
│       ├── foundation-setup-plan.md     # Common foundation. [FND-]
│       ├── test-plan.md                 # System verification. [TST-]
│       └── deploy-plan.md               # Release/rollout/rollback. [DPL-]
│
└── subsystem-docs/                      # Subsystem — boundary + responsibility riêng.
    │
    └── <subsystem-code>/
        │
        ├── specs/                       # SPEC — context, requirements + design.
        │   ├── spec.md                  # Subsystem context + internal architecture + decisions.
        │   │                               # [ACT-/EXT-/DD-]
        │   ├── fr-nfr.md                # FR/NFR requirements + design. [FR-/NFR-/SOL-] (luôn có)
        │   ├── data.md                  # Data requirements + design. [DATA-/DTD-] (khi sở hữu data)
        │   ├── api.md                   # API requirements + design. [API-/APD-] (khi sở hữu API)
        │   └── ui-ux.md                 # UI/UX requirements + design. [UI-/UXD-] (khi có user trực tiếp)
        │
        └── plans/                       # PLAN — subsystem plans.
            ├── foundation-setup-plan.md # Foundation riêng. [FND-]
            ├── build-plan.md            # Build; section theo facet. [BLD-]
            ├── test-plan.md             # Test; section theo facet. [TST-]
            └── task-plan.md             # Tasks/dependency. [TASK-]
```

## 2.1. Quy tắc

- **Format:** table chỉ dùng cho dữ liệu ngắn, phẳng và thiên về tra cứu; schema dùng field list; item thực tế dùng record block; dữ liệu lồng/nhiều dòng có thể dùng YAML.
  `Record block:` `### <ID>` rồi `**Field:** value`; không nhét nội dung dài vào table.
- Một nội dung chỉ có một owner.
- System không chứa implementation detail riêng của subsystem.
- Subsystem không copy System; refinement/allocation dùng ID.
- `data`, `api`, `ui-ux` chỉ xuất hiện khi responsibility có mặt.
- Không tạo file/facet chỉ để đủ cây.

Phân bổ nội dung giữa Spec core và Spec facet theo scope/responsibility; xem §7.1–§7.2.

Subsystem là một unit có boundary, owner và lifecycle riêng; có thể là microservice, module, application, library, pipeline, web app hoặc mobile app.

## 2.2. Tailoring

```text
Tailoring record — Required: Element, Default, Applied, Reason; Optional: Impact
```

Ghi tailoring trong `meta.md` khi project thêm/bớt facet, đổi representation hoặc schema. Core framework không định nghĩa Lightweight Profile; nếu sau này cần profile riêng, phải đưa vào Tailoring với rule và CI contract tương ứng. Không được phá vỡ ownership, ID bất biến và trace bằng ID.

---

# 3. META

`meta.md` chỉ ghi phần áp dụng cho project, không chép framework.

```text
META
├── Tree
├── Conventions
├── Traceability
└── Terms
```

## 3.1. Conventions

**Front matter của document:**

```text
Required: type, scope, status, owner, version, updated
Optional: id, created, baseline
```

- `type` = một trong `meta`, `info`, `pi`, `stack`, `spec`, `plan`.
- `id` là document identifier tùy chọn, không phải record ID; khi không có `id`, document được định danh bằng path + scope + type.
- `version` = revision identifier của document; format do project/convention chọn. `baseline` tham chiếu revision đã được phê duyệt.
- `scope` = `SYS`, mã subsystem, hoặc `PROJECT` đối với `meta.md`.
- `owner` = owner thực tế; không mặc định suy ra từ path nếu project đã tailoring.
- Front matter `status` là **document lifecycle**: `Draft`, `In Review`, `Approved`, `Superseded`, `Deprecated`.
- Item `Status` dùng theo nhóm:
  - `RQ-` / `GAP-`: `Open`, `In Progress`, `Resolved`, `Closed`.
  - `SRC-`: `Unverified`, `Verified`, `Obsolete`.
  - `INF-` / `ANL-`: `Draft`, `Reviewed`, `Superseded`, `Rejected`.
  - `RSK-`: `Open`, `In Progress`, `Mitigated`, `Closed`.
  - PI Decision: `Draft`, `In Review`, `Approved`, `Superseded`, `Deprecated`.
  - STACK: `Proposed`, `Approved`, `Superseded`, `Deprecated`.
  - Spec / Design / Design Decision: `Draft`, `In Review`, `Approved`, `Superseded`, `Deprecated`.
  - Plan / Foundation / Build / Task / Deploy: `Planned`, `Ready`, `In Progress`, `Blocked`, `Done`, `Cancelled`.
  - Test: `Planned`, `Ready`, `In Progress`, `Passed`, `Failed`, `Blocked`.
  - Gate: `Planned`, `Ready`, `Passed`, `Failed`, `Waived`.
- `Priority` dùng cho Requirement: `Must`, `Should`, `Could`, `Deferred`.
- Mọi schema phải tách rõ `Required` và `Optional`; CI chỉ coi `Required` là bắt buộc. Không dùng giá trị rỗng để biểu thị optional. Một field `Optional` có thể trở thành **bắt buộc có điều kiện** khi rule của item áp dụng; CI phải kiểm các điều kiện này.
- `Gate` là technical checkpoint; chỉ dùng trong `test-plan.md` và `deploy-plan.md`. Gate dùng prefix của plan (`TST-` hoặc `DPL-`), phải có `Exit criteria` và `Owner`, không có `Covers`. Project Plan dùng `Phase` / `Milestone` / `Checkpoint`, không dùng Gate semantic này.
- `baseline` là snapshot đã được phê duyệt của phần **definition** trong một Spec/Plan document tại một version/revision xác định. Baseline không khóa `Status` thực thi của Plan/Test/Build; thay đổi nội dung định nghĩa sau baseline phải qua change control và impact analysis.

## 3.2. Traceability

`meta.md` chỉ ghi trace override hoặc tailoring-specific mapping của project; semantic rule mặc định nằm ở §9. Không copy trace graph vào `meta.md` nếu không có deviation.

## 3.3. Terms

- **Spec set:** toàn bộ Spec file trong `specs/` của một scope.
- **Spec file:** một file Markdown trong Spec set; có thể là `spec.md` hoặc một Spec facet như `fr-nfr.md`, `data.md`, `api.md`, `ui-ux.md`.
- **Spec core:** `spec.md`; giữ context, architecture/internal architecture và cross-facet decisions của scope.
- **Spec facet:** Spec file theo responsibility (`fr-nfr.md`, `data.md`, `api.md`, `ui-ux.md`).
- **Design:** semantic activity trong Spec, không phải document family riêng.
- **execution-bearing:** Work item đủ nhỏ để thực hiện trực tiếp mà không cần `TASK-` con. `BLD-` và `FND-` ở Subsystem có thể execution-bearing hoặc được phân rã thành `TASK-`; `FND-` ở System được thực hiện trực tiếp vì System không có Task Plan. Quyết định decomposition thuộc owner của Build/Foundation Plan; nếu work cần nhiều execution unit độc lập thì phân rã tại Task Plan.

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
RQ- — Required: ID, Question, Status; Optional: Serves
SRC- — Required: ID, Citation, Status; Optional: Type, Published, Accessed, Reliability, Location
INF- — Required: ID, Statement, Status; Optional: Type, Topic, Derived from, Confidence, Answers, Implication, Conflicts with
ANL- — Required: ID, Analysis, Status; Optional: Derived from, Impacts
GAP- — Required: ID, Kind, Missing knowledge, Status; Optional: Refers to, Blocks, Resolution
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
Decision item — Required: ID, Decision, Rationale, Basis, Status; Optional: Alternatives, Consequences
```

`PD-` là decision item-level. Constraint công nghệ bắt buộc thuộc PI và được ghi thành `PD-`; lựa chọn cụ thể thuộc STACK.

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
Stack item — Required: ID, Category, Name, Applies to, Role, Status; Optional: Version, Basis, Requires, Constrained by
```

`Requires` chỉ trỏ `STK-`; tiêu chí/evidence lựa chọn nằm ở INFO/PI; Design/Plan reference `STK-`.
`Constrained by` có thể trỏ `SRS-`/`NFR-` phù hợp với scope áp dụng của Stack item khi yêu cầu chất lượng hoặc chính sách ràng buộc lựa chọn công nghệ; đây là constraint relation, không phải lifecycle `Basis` và không được dùng để tạo upstream cycle.

---

# 7. SPEC

SPEC là lifecycle layer của **Requirements + Design** trong scope của mình. Requirements trả lời _what_; Design trả lời _how_. Một Spec set gồm một hoặc nhiều Spec file; trong mỗi Spec file, Requirements và Design có thể cùng tồn tại nhưng không được trộn semantics.

Template chung của Spec file:

```text
SPEC FILE
├── Requirements
├── Design
├── Decisions
└── Assumptions & Open Issues
```

Quy tắc item chung:

```text
Requirement — Required: ID, Statement, Category, Priority, Acceptance, Status; Optional: Basis, Applies to
Design element — Required: ID, Name, Definition, Status; Optional: Uses, Realizes, Decisions
```

- Requirement phải trung lập công nghệ; Design có thể reference `STK-`.
- `Realizes` nối Design với Requirement; `Uses` nối dependency của Design; `Decisions` nối `DD-`.
- `Basis` là bắt buộc với Requirement là refinement/allocation; `Applies to` là bắt buộc với System Requirement khi có allocation xuống subsystem; `Realizes` là bắt buộc với Design, trừ `ARC-` chỉ mô tả boundary/topology.
- `Applies to` vắng mặt nghĩa là Requirement không có allocation downstream; với System Requirement, scope mặc định là `SYS`. Khi có allocation, `Applies to` liệt kê đầy đủ các scope được phân bổ; coverage đầy đủ khi mỗi scope có realization/verification cần thiết và `Acceptance` được phủ đầy đủ.
- Priority của Requirement phản ánh priority trong scope hiện tại; refinement local có thể dùng priority khác nhưng không được làm mất nghĩa vụ hoặc Acceptance của upstream Requirement.
- Không tạo requirement mới từ Design.
- Subsystem Requirement/Design là refinement hoặc allocation của System item khi có nguồn System tương ứng; dùng ID upstream.
- Subsystem Design có thể `Realizes` trực tiếp System Requirement; Subsystem Test có thể `Covers` trực tiếp System Requirement, không bắt buộc phải tạo Subsystem Requirement trung gian.
- Item local mới chỉ tạo khi có semantics mới và phải có acceptance riêng.

## 7.1. System Spec set

```text
Spec core
├── System Context
│   ├── ACT- — actor
│   └── EXT- — external system/dependency
├── Requirements
│   ├── Cross-cutting Requirements   # SRS-
│   └── FR/NFR Requirements          # FR-/NFR- in fr-nfr.md
├── Architecture & Design            # ARC- in spec.md
├── FR/NFR Design                    # SOL- in fr-nfr.md
└── Decisions                        # DD-
```

System scope sở hữu context, cross-cutting concerns, system FR/NFR, architecture và cross-cutting design. `data`, `api`, `ui-ux` không có System Spec facet mặc định; khi concern thuộc một subsystem cụ thể thì subsystem đó sở hữu.

## 7.2. Subsystem Spec set

Mỗi Subsystem có một `specs/spec.md` làm **Spec core**; các Spec facet là phần bổ sung theo responsibility. Spec core xác định context, internal architecture và decisions ở scope Subsystem; không chứa `FR-`/`NFR-`/`DATA-`/`API-`/`UI-` items và không copy System statement/definition.

```text
Spec core
├── Subsystem Context
├── Architecture & Design
└── Decisions
```

`Subsystem Context` dùng `ACT-`/`EXT-` cho context của scope đó; khi cùng một actor/dependency đã được System định danh, Subsystem reference ID System thay vì tạo bản sao. Subsystem có thể bổ sung `ACT-`/`EXT-` local khi boundary của nó có context mới. `spec.md` giữ `ACT-`/`EXT-`, internal architecture và `DD-`; các requirement/design nằm trong Spec facet tương ứng. Requirement được phân bổ từ System nếu cần item refinement thì đặt tại Spec facet phù hợp và có `Basis` về System Requirement.

Requirement được phân bổ từ System có thể được `Realizes`/`Covers` trực tiếp bởi Design/Test của Subsystem; không bắt buộc tạo Requirement bản sao ở Subsystem. Local Requirement chỉ tạo khi có semantics mới và phải có `Basis` về upstream.
Component phi giao diện và phi dữ liệu của Subsystem (message queue, worker pool, in-memory state, scheduler) dùng `SOL-` trong `fr-nfr.md` với category rõ ràng. Subsystem không tạo prefix mới cho internal architecture.

Thứ tự facet theo §2. Nếu System sở hữu API, Data hoặc UI/UX concern xuyên từ hai subsystem trở lên, có thể thêm `api.md`, `data.md` hoặc `ui-ux.md` ở `system-docs/specs/`; phải ghi Tailoring record trong `meta.md`.

| Facet | Requirement owner | Design owner |
|---|---|---|
| FR/NFR | capability, business rule, measurable quality | components, logic, quality mechanisms, behavior, state |
| Data | entity, meaning, integrity, lifecycle, protection | data model, storage/access, data behavior |
| API | interface, operation, contract, interface constraint | protocol, endpoint, operation, contract, validation, auth, idempotency, retry/timeout, async, sequence |
| UI/UX | task, journey, interaction, experience quality | information architecture, screens/components, visual/content, interaction/state/feedback |

API Design detail:

```text
Structure
├── Interface: Protocol, Endpoint / Resource, Operation, Naming, Versioning
└── Contract: Request, Response, Error, Schema
Behavior
├── Validation
├── Authentication & Authorization
├── Idempotency
├── Retry & Timeout
├── Async / Webhook
└── Sequence
Decisions: DD-
```

## 7.3. Ownership rule

1. Tương tác người dùng → UI/UX
2. Giao diện với bên ngoài → API
3. Ý nghĩa/toàn vẹn/lưu giữ/phân loại dữ liệu → Data
4. Chất lượng đo được → NFR
5. Capability/business rule → FR
6. Policy/compliance/operational constraint xuyên concern → System Spec set

Nếu một requirement trải qua nhiều owner, tách thành các item và nối bằng `Basis`. UI/UX không lặp capability của FR.

## 7.4. Design rules

- Design nằm trong Spec file của scope sở hữu nó; `Realizes` có thể trỏ tới Requirement ở scope upstream.
- System Design (`ARC-`) nằm trong `system-docs/specs/spec.md` tại `Architecture & Design`; `ARC-` chỉ thuộc System architecture và là nguồn canonical cho subsystem boundary/topology. `ARC-` realizes `SRS-` khi có requirement tương ứng; nếu chỉ định nghĩa system boundary/topology thì đó là architectural definition.
- Design theo facet dùng `SOL-`, `DTD-`, `APD-`, `UXD-`.
- Design có thể reference `STK-` và `EXT-`; không tạo requirement mới.

---

# 8. PLAN

`PLAN` là execution planning; `project-plan.md` là governance và schedule của project.

## 8.1. Plan schema

```text
PLAN DOCUMENT
├── Approach
├── Work Items
└── Assumptions & Open Issues
```

```text
Work item — Required: ID, Name, Covers, Done when, Status; Optional: Description, Depends on
Gate item — Required: ID, Name, Exit criteria, Owner, Status; Optional: Description, Depends on
```

`Gate` giữ `Owner` trực tiếp vì Gate là checkpoint, không phải Work item; `Work Assignment` chỉ áp dụng cho execution-bearing Work item.

| Plan | Prefix | `Covers` | Gate allowed |
|---|---|---|---|
| Foundation | `FND-` | `STK-`, `ARC-` | No |
| Build | `BLD-` | Design element | No |
| Test | `TST-` | Requirement | Yes |
| Deploy | `DPL-` | `ARC-`, `STK-`, `NFR-` | Yes |

`TASK-` dùng schema riêng. Plan không tạo requirement/design/technology choice mới.

## 8.2. Project Plan

```text
PROJECT PLAN
├── Approach
├── Phases & Milestones
├── Roles & Responsibilities
└── Risks
```

```text
Phase / Milestone / Checkpoint — Required: ID, Name, Type, Owner, Status; Optional: Includes, Depends on, Target, Estimate, Exit criteria
Role — Required: ID, Role, Responsibility; Optional: Assignee
Work Assignment — Required: Work item, Owner; Optional: Role
Risk — Required: ID, Risk, Probability, Impact, Response, Owner, Status; Optional: Basis
```

Trường `Type` chỉ nhận một trong ba giá trị: `Phase`, `Milestone`, `Checkpoint`.

Project Plan là nơi duy nhất quản lý schedule, target, estimate và assignment của execution-bearing work item; Work Assignment map execution item → Owner và phải resolve tới `ROL-` hoặc Assignee đã được khai báo trong Project Plan. Nếu `Owner` là `ROL-`, ID đó phải resolve tới một Role; nếu `Owner` là Assignee, giá trị phải khớp một `Assignee` đã khai báo trong Project Plan. Project-level checkpoint dùng `Checkpoint`, còn technical `Gate` chỉ thuộc Test/Deploy Plan. Work item không giữ `Owner` riêng: owner được resolve từ **Work Assignment record** trong Project Plan theo item ID; mỗi execution-bearing work item phải có đúng một assignment hợp lệ, nếu không thì item chưa đủ để execution. Project Plan là bắt buộc khi project có execution-bearing work item; chỉ project không có execution work hoặc project đã tailoring một cơ chế assignment tương đương mới có thể bỏ Project Plan.

## 8.3. Foundation Setup Plan

Chuẩn bị environment, toolchain, repository/scaffolding, access và configuration.

- System: foundation dùng chung.
- Subsystem: foundation riêng; có thể phụ thuộc `FND-SYS-*`.

## 8.4. Build Plan — Subsystem

```text
BUILD PLAN
├── Approach
└── Work Items                  # BLD-
```

`build-plan.md` chỉ tồn tại ở **Subsystem** và phân section theo thứ tự facet ở §2; `BLD-` cover Design elements trong các Spec file.

- `BLD-` là planning unit của Subsystem.
- Integration xuyên facet trong một subsystem thuộc Build Plan của subsystem; dependency thực sự xuyên facet được resolve ở Task Plan.
- **Không có System Build Plan.** Build cấp system là tổng hợp execution của các subsystem; coordination xuyên subsystem, khi cần, được ghi tại artifact sở hữu concern đó (Project Plan, Test Plan hoặc Deploy Plan), không tạo `BLD-SYS-*`.

## 8.5. Task Plan

```text
TASK PLAN
├── Approach
├── Tasks
├── Dependency Structure   # derived view from Tasks/Depends on
├── Execution Waves        # derived view from Tasks/Wave
└── Assumptions & Open Issues
```

```text
Task — Required: ID, Name, Derived from, Wave, Done when, Status; Optional: Description, Depends on
```

- `Derived from` → đúng một `BLD-` hoặc `FND-` cùng scope.
- `Depends on` → `TASK-` cùng execution scope.
- `TASK-` là execution unit; đủ nhỏ để thực hiện và kiểm tra trong một change.
- `Dependency Structure` và `Execution Waves` là các view sinh từ `Tasks`: `Dependency Structure` được suy ra từ `Depends on`; `Execution Waves` được suy ra từ `Wave`. Đây không phải item/schema độc lập.
- `Wave` là projection của dependency graph, không phải work item.
- Build Work chưa đủ rõ → sửa Build Plan.
- `execution-bearing` áp dụng theo định nghĩa ở §3.3.

## 8.6. Test Plan

```text
TEST PLAN
├── Approach
└── Test Items                  # TST-
```

`Covers` → Requirement trực tiếp; section theo thứ tự facet ở §2; `Done when` cụ thể hóa `Acceptance`.
Phần `Gate` tuân theo schema chung ở §8.1; Test Plan chỉ xác định exit criteria kiểm thử.

## 8.7. Deploy Plan

`DPL-` mặc định scope `SYS`, tại `system-docs/plans/deploy-plan.md`. Subsystem không có `deploy-plan.md`; release của subsystem trace về `DPL-SYS-*` ở System.

```text
DEPLOY PLAN
├── Approach
└── Work Items                  # DPL-
```

`Covers` → `ARC-`, `STK-`, `NFR-`; có thể `Depends on` Foundation/Build/Test khi release phụ thuộc trực tiếp.
Phần `Gate` tuân theo schema chung ở §8.1; Deploy Plan chỉ xác định exit criteria phát hành.

---

# 9. Traceability và ownership

> **Mỗi nội dung một owner; tài liệu khác reference bằng ID, không copy.**

## 9.1. Trace fields

| Field | Dùng ở | Target |
|---|---|---|
| `Basis` | Spec, STACK, Decision, Risk | target theo bảng §9.3 |
| `Uses` | Spec/Design | Design, `STK-`, `EXT-` |
| `Realizes` | Spec/Design | Requirement |
| `Decisions` | Spec/Design | `DD-` |
| `Covers` | Plan | Foundation → `STK-`, `ARC-`; Build → Design; Test → Requirement; Deploy → `ARC-`, `STK-`, `NFR-` |
| `Includes` | Project / Plan | execution work item hoặc child Plan document có `id` thuộc phạm vi quản lý |
| `Derived from` (INFO) | INF-/ANL- | `INF-` → `SRC-`; `ANL-` → `SRC-`, `INF-` |
| `Derived from` (Task) | Task | một `BLD-`/`FND-` |
| `Depends on` | Plan / Project / Task | execution dependency |
| `Requires` | STACK | `STK-` |
| `Constrained by` | STACK | `SRS-`, `NFR-` thuộc scope áp dụng của Stack item |
| `Applies to` | Requirement / STACK | System / Subsystem |
| `Serves` | Research Question | `PD-`, `STK-`, Requirement, Design |
| `Answers` | Finding | `RQ-` |
| `Impacts` | Analysis | `PD-`, `STK-`, Requirement, Design, `RSK-` |
| `Conflicts with` | Finding | `SRC-`, `INF-`, `ANL-` |
| `Refers to` | Research Gap | `RQ-`, `SRC-`, `INF-`, `ANL-` |
| `Blocks` | Research Gap | `PD-`, `STK-`, Requirement, Design, Plan |

## 9.2. Reference direction

> **Trace lifecycle: downstream → upstream. Không tạo reference ngược.**

`Includes` là quan hệ containment/organization: Project hoặc Plan dùng nó để biểu diễn execution work item hoặc child Plan document thuộc phạm vi quản lý. Child Plan document được dùng làm target của `Includes` phải có document `id`; `Includes` không hàm ý dependency, coverage, realization hay completion.

Các relation sau không tạo lifecycle trace: `Includes`, `Depends on`, `Constrained by`, và INFO relations (`Serves`, `Answers`, `Impacts`, `Conflicts with`, `Refers to`, `Blocks`). CI kiểm theo target riêng của từng relation.

## 9.3. `Basis` targets

| Item | Target |
|---|---|
| `STK-` | `INF-`, `ANL-`, `PD-` |
| Requirement | `SRC-`, `INF-`, `ANL-`, `PD-`, upstream Requirement; `ARC-` chỉ khi Requirement phân bổ system boundary/topology |
| Design | `SRC-`, `INF-`, `ANL-`, `PD-`, upstream Requirement/Design, `STK-`, `ARC-` khi upstream |
| `PD-` | `RQ-`, `SRC-`, `INF-`, `ANL-` |
| `DD-` | upstream `PD-`, `STK-`, `INF-`, `ANL-`, Requirement, `ARC-` |
| `APC-` | upstream `PD-`, `DD-`, `RSK-`, `STK-` |
| `RSK-` | `PD-`, `RQ-`, `GAP-`, và các Spec/Design/Plan item là nguồn rủi ro |

## 9.4. Trace chính

```text
Build:      INFO → PI → (Requirements ‖ STACK) → Design → PLAN → BUILD
Test:       Requirement → TEST
Deploy:     Design · STACK · NFR → DEPLOY
Maintain:   operational feedback → change request/review → affected artifact → downstream → BUILD/TEST/DEPLOY
Subsystem:  System Requirements/Design → Subsystem Requirements/Design → Plan → TASK → BUILD
```

- Concern riêng subsystem do Subsystem owner; concern xuyên subsystem do System owner.
- Task truy ngược được tới đúng một Build/Foundation item.

---

# 10. Prefix và ID

| Prefix | Ý nghĩa | Scope | Owner |
|---|---|---|---|
| `RQ-` | Research Question | `SYS` | `system-docs/info.md` |
| `SRC-` | Source | `SYS` | `system-docs/info.md` |
| `INF-` | Finding | `SYS` | `system-docs/info.md` |
| `ANL-` | Analysis | `SYS` | `system-docs/info.md` |
| `GAP-` | Research Gap | `SYS` | `system-docs/info.md` |
| `PD-` | Project Decision | `SYS` | `system-docs/pi.md` |
| `STK-` | Stack item | `SYS` | `system-docs/tech-tool-stack.md` |
| `ACT-` | Actor | `SYS` / `<subsystem-code>` | System `system-docs/specs/spec.md` or Subsystem `subsystem-docs/<code>/specs/spec.md` |
| `EXT-` | External system/dependency | `SYS` / `<subsystem-code>` | System `system-docs/specs/spec.md` or Subsystem `subsystem-docs/<code>/specs/spec.md` |
| `SRS-` | Cross-cutting system requirement | `SYS` | `system-docs/specs/spec.md` |
| `FR-` / `NFR-` | Functional / Non-functional Requirement | `SYS` / `<subsystem-code>` | `system-docs/specs/fr-nfr.md` or `subsystem-docs/<code>/specs/fr-nfr.md` |
| `UI-` | UI/UX Spec | `<subsystem-code>` or `SYS` when tailored | `subsystem-docs/<code>/specs/ui-ux.md` or tailored system path |
| `API-` | API Spec | `<subsystem-code>` or `SYS` when tailored | `subsystem-docs/<code>/specs/api.md` or tailored system path |
| `DATA-` | Data Spec | `<subsystem-code>` or `SYS` when tailored | `subsystem-docs/<code>/specs/data.md` or tailored system path |
| `ARC-` | Architecture | `SYS` only | `system-docs/specs/spec.md` |
| `SOL-` | FR/NFR Design | `SYS` / `<subsystem-code>` | `system-docs/specs/fr-nfr.md` or `subsystem-docs/<code>/specs/fr-nfr.md` |
| `UXD-` | UI/UX Design | `<subsystem-code>` or `SYS` when tailored | `subsystem-docs/<code>/specs/ui-ux.md` or tailored `system-docs/specs/ui-ux.md` |
| `APD-` | API Design | `<subsystem-code>` or `SYS` when tailored | `subsystem-docs/<code>/specs/api.md` or tailored `system-docs/specs/api.md` |
| `DTD-` | Data Design | `<subsystem-code>` or `SYS` when tailored | `subsystem-docs/<code>/specs/data.md` or tailored `system-docs/specs/data.md` |
| `DD-` | Design Decision | `SYS` / `<subsystem-code>` | Spec file sở hữu Design element mà Decision áp dụng; cross-facet → Spec core (`spec.md`) |
| `APC-` | Approach Decision | `SYS` / `<subsystem-code>` | `system-docs/plans/<plan>.md` or `subsystem-docs/<code>/plans/<plan>.md` |
| `PRJ-` | Project plan item | `SYS` | `system-docs/plans/project-plan.md` |
| `ROL-` | Project role | `SYS` | `system-docs/plans/project-plan.md` |
| `RSK-` | Risk | `SYS` | `system-docs/plans/project-plan.md` |
| `FND-` | Foundation item | `SYS` / `<subsystem-code>` | `system-docs/plans/foundation-setup-plan.md` or `subsystem-docs/<code>/plans/foundation-setup-plan.md` |
| `BLD-` | Build planning item | `<subsystem-code>` | `subsystem-docs/<code>/plans/build-plan.md` |
| `TASK-` | Execution task | `<subsystem-code>` | `subsystem-docs/<code>/plans/task-plan.md` |
| `TST-` | Test item | `SYS` / `<subsystem-code>` | `system-docs/plans/test-plan.md` or `subsystem-docs/<code>/plans/test-plan.md` |
| `DPL-` | Deploy item | `SYS` only | `system-docs/plans/deploy-plan.md` |

```text
<TYPE>-<SCOPE>-<NNN>
<TYPE>-<NNN>        # khi không có scope
```

`SRS-` là prefix framework-local cho cross-cutting system requirement; không phải tên file và không hàm ý `Software Requirements Specification`.

`ACT-` và `EXT-` dùng `<TYPE>-<SCOPE>-<NNN>` ở Subsystem (`ACT-ORD-001`, `EXT-ORD-001`). System dùng ID project-global như `ACT-001`, `EXT-001` khi prefix được khai báo project-global. Khi Subsystem đã có actor/external system do System định danh, reference lại System ID thay vì tạo bản sao local.

ID là immutable, không đổi hoặc tái sử dụng. Prefix phải tuân theo Scope ở bảng trên; form `<TYPE>-<NNN>` chỉ được dùng khi prefix đó được `meta.md` khai báo là project-global. Mỗi (`TYPE`, `SCOPE`) có một sequence duy nhất.

---

# 11. Quy tắc chất lượng

## 11.1. Chất lượng framework

| Test | Câu hỏi |
|---|---|
| Correct | Quy tắc, schema, tree có đúng semantic đã chốt? |
| Complete | Có đủ cấu trúc, ownership, traceability để áp dụng mà không phải tự phát minh? |
| Abstract | Có mô tả loại thông tin ở mức áp dụng cho nhiều dự án, không hard-code fact/decision của một dự án? |
| Reusable | Có thể áp dụng cho dự án khác mà không phải sửa rule; tránh copy/redefine owner khác? |
| Minimal | Không giữ quy tắc dư thừa không phục vụ triển khai hoặc kiểm tra? |

## 11.2. Chất lượng artifact

Áp dụng cho `meta.md`, `system-docs/`, `subsystem-docs/`.

| Test | Câu hỏi |
|---|---|
| Correct | Đúng vai trò và owner? |
| Complete | Downstream làm việc được mà không phải đoán/phát minh phần quan trọng; scope nhỏ vẫn phải đủ substance? |
| Unambiguous | Known cụ thể; unknown được đánh dấu và có cách resolve? |
| Verifiable | Có cách kiểm chứng phù hợp? |
| Consistent | Không mâu thuẫn, copy hoặc redefine owner khác? |
| Traceable | Relation đúng ID; reference không thay substance? |

Unknown → `Open` / `TBD` / `Assumption`; INFO dùng `GAP-`. `N/A` chỉ dùng khi bản chất không áp dụng và phải nêu lý do trong cùng document; nếu document có `Assumptions & Open Issues`, ghi lý do ở đó. Không biến suy luận chưa được chấp nhận thành fact/requirement/decision/design.

## 11.3. Artifact structural rules

Danh mục kiểm tra structural cho project artifact; semantics đầy đủ nằm tại owner tương ứng. Chỉ các invariant được liệt kê tại §12.4 mới mặc định là CI blocking checks.

- Design / Requirement `Realizes` và `Basis` → §7
- Requirement allocation / `Applies to` / coverage → §7
- Plan `Covers` và Gate → §8.1
- `BLD-` / `FND-` → `TASK-` decomposition → §8.5
- Cross-facet dependency → §8.4
- ID scheme và ownership → §10

---

# 12. Cách sử dụng

## 12.1. Khởi tạo

1. Tạo `meta.md`, chọn SCOPE và tailoring.
2. Xây INFO → PI → (Requirements ‖ STACK) → Design trong SPEC.
3. Tạo Project Plan cho project có execution-bearing work item; project không có execution hoặc đã tailoring cơ chế assignment tương đương có thể bỏ Project Plan. Tạo execution plans theo work thực tế.
4. Thêm subsystem bằng `ARC-`; tạo đúng artifact cần thiết.
5. Tạo Task Plan khi cần decomposition/dependency execution.

## 12.2. Thêm subsystem

1. Thêm `ARC-` trong System Spec set.
2. Chọn SCOPE và responsibility.
3. Tạo `specs/spec.md` và các Spec facet cần thiết; trace requirement/design về System/ARC bằng ID.
4. Cập nhật Tree/Traceability trong `meta.md` nếu representation hoặc mapping trace thay mặc định.

## 12.3. Thay đổi

1. Sửa tại owner.
2. Impact analysis bằng trace.
3. Cập nhật downstream bị ảnh hưởng.
4. Sau baseline, change đi qua change request/review kèm impact analysis; baseline không khóa file hoặc `Status` thực thi mà chỉ khóa phần definition đã được phê duyệt của scope đó. Sau release cũng quay lại artifact bị ảnh hưởng và đi tiếp downstream cần thiết.

## 12.4. CI

CI enforce các invariant có tính xác định cao và kiểm tra được bằng máy:

- Front matter hợp lệ và có đủ required fields.
- ID đúng scheme, immutable trong lifecycle, và không duplicate.
- Mọi reference trỏ tới ID tồn tại và đúng loại target theo relation.
- Structural constraints: `TASK-` và `BLD-` chỉ ở Subsystem; System `FND-` không có `TASK-`; `Gate` không có `Covers`.

Coverage, completeness, acceptance quality, Wave ordering, priority, baseline revision và semantic suitability thuộc warning hoặc human review. CI xanh không thay thế human review.

## 12.5. AI

- Bắt đầu từ Tree, Conventions và Traceability để chọn artifact cần đọc.
- Nạp theo ID; mở rộng theo trace khi cần.
- Không tạo nội dung ngoài owner; unknown không phải fact.
- Reference không thay substance.
- Task Plan chỉ phân rã `BLD-`/`FND-` đã có thành `TASK-`; không tạo requirement/design/BLD mới.

---

# 13. Đối chiếu thực tế

Chỉ ghi mapping không hiển nhiên; không phải tuyên bố tuân thủ.

| Thành phần | Tham chiếu |
|---|---|
| System Specification / Architecture | ISO/IEC/IEEE 42010:2022; C4; arc42 |
| Decisions | ADR (Nygard) |
| Task planning | PMBOK work breakdown/activity sequencing; agile delivery practices |
| Traceability | ISO/IEC/IEEE 29148; ISO/IEC/IEEE 12207 |
