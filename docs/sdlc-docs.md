# Bộ tài liệu hướng dẫn SDLC

# 1. Mục đích và phạm vi

## 1.1. Mục đích

Tài liệu này là chuẩn khung (framework) dùng chung cho nhiều dự án. Nó định nghĩa cấu trúc, vai trò, phạm vi sở hữu, schema, quy tắc traceability và cách sử dụng bộ tài liệu SDLC ở hai cấp: **System-level** và **Service-level**.

Bộ tài liệu theo hướng docs-as-code (Markdown, quản lý bằng VCS, review bằng pull request) và đối chiếu với các chuẩn thực tế của ngành (mục 15).

`meta.md` là lớp metadata của bộ tài liệu, không phải artifact trong lifecycle SDLC (mục 3).

## 1.2. Phạm vi

- **Trong phạm vi:** tài liệu nghiên cứu, hoạch định, đặc tả, thiết kế và kế hoạch — là input cho build, kiểm thử và triển khai.
- **Ngoài phạm vi (evidence):** code, kết quả build/test, release record, dữ liệu vận hành, runbook... Chúng sinh ra từ BUILD, TEST, DEPLOY, nằm ở công cụ tương ứng (VCS, CI/CD, quản lý test, hệ thống release/vận hành) và được trace về cây này bằng ID (`BLD-`, `TST-`, `DPL-`); không có file riêng trong `docs/`.
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

| Tầng  | Trả lời câu hỏi                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| INFO   | Ta biết gì: sự thật, bằng chứng, nghiên cứu và phân tích?                                              |
| PI     | Làm gì, trong phạm vi nào, theo định hướng và quyết định cấp dự án nào?                           |
| STACK  | Dùng công nghệ, framework, công cụ và nền tảng nào?                                                      |
| SPEC   | Hệ thống/service phải làm gì và phải đáp ứng điều gì?                                                |
| DESIGN | Các requirement được hiện thực bằng cấu trúc, behavior và quyết định kỹ thuật nào?                |
| PLAN   | Cần làm work item nào, theo cách nào, theo dependency nào để tạo ra kết quả đã đặc tả/thiết kế? |
| BUILD  | Implementation (evidence)                                                                                         |
| TEST   | Verification (evidence)                                                                                           |
| DEPLOY | Release và đưa vào vận hành (evidence)                                                                      |

## 1.5. Nguyên tắc xuyên suốt

```text
Correct → Complete → Abstract → Reusable
```

Bốn phép thử chi tiết ở mục 13.1.

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
    │
    ├── fr-nfr/
    │   ├── fr-nfr-specs.md                      # FR/NFR của service.
    │   ├── fr-nfr-design.md                     # Design FR/NFR của service.
    │   ├── fr-nfr-build-plan.md                 # Build plan FR/NFR của service.
    │   └── fr-nfr-test-plan.md                  # Test plan FR/NFR của service.
    │
    ├── data/                                    # Chỉ dùng nếu service có responsibility về persistent data/DB.
    │   ├── data-specs.md                        # Spec dữ liệu của service.
    │   ├── data-design.md                       # Design data model/storage của service.
    │   ├── data-build-plan.md                   # Build plan database/data layer của service.
    │   └── data-test-plan.md                    # Test plan data của service.
    │
    ├── api/                                     # Chỉ dùng nếu service có giao tiếp với bên ngoài.
    │   ├── api-specs.md                         # Spec API/interface của service.
    │   ├── api-design.md                        # Design API/integration của service.
    │   ├── api-build-plan.md                    # Build plan API/integration của service.
    │   └── api-test-plan.md                     # Test plan API/integration của service.
    │
    ├── ui-ux/                                   # Chỉ dùng nếu service có người dùng trực tiếp.
    │   ├── ui-ux-specs.md                       # Spec UI/UX của service.
    │   ├── ui-ux-design.md                      # Design UI/UX của service.
    │   ├── ui-ux-build-plan.md                  # Build plan UI/UX của service.
    │   └── ui-ux-test-plan.md                   # Test plan UI/UX của service.
    │
    ├── foundation-setup-plan.md                 # Kế hoạch chuẩn bị nền tảng riêng cho service.
    └── build-plan.md                            # Kế hoạch build tổng của service; aggregate các facet
                                                 # build plan, xác định dependency/thứ tự thực hiện
                                                 # và chuẩn hóa thành task.
```

> Cây là tập tối đa. `fr-nfr/`, `foundation-setup-plan.md` và `build-plan.md` ở gốc `service-docs/` luôn có; `data/`, `api/`, `ui-ux/` xuất hiện theo responsibility thực tế (điều kiện ở mục 10 và 2.2).

## 2.1. Hai hướng phát triển của bộ tài liệu

Cả hai cấp dùng chung một ma trận **giai đoạn × facet**:

| Giai đoạn \ Facet | FR/NFR (`fr-nfr/`)    | Data                | API                | UI/UX                |
| ------------------- | --------------------- | ------------------- | ------------------ | -------------------- |
| Specs               | `fr-nfr-specs`      | `data-specs`      | `api-specs`      | `ui-ux-specs`      |
| Design              | `fr-nfr-design`     | `data-design`     | `api-design`     | `ui-ux-design`     |
| Build plan          | `fr-nfr-build-plan` | `data-build-plan` | `api-build-plan` | `ui-ux-build-plan` |
| Test plan           | `fr-nfr-test-plan`  | `data-test-plan`  | `api-test-plan`  | `ui-ux-test-plan`  |

- **Cấp hệ thống — phát triển theo chiều ngang.** Mỗi giai đoạn trải qua toàn bộ facet của hệ thống rồi mới sang giai đoạn kế: toàn bộ `srs/` → toàn bộ `dds/` → `plans/`. Đọc ma trận theo _hàng_. Kết quả là bức tranh toàn cục, cross-cutting thống nhất (`srs.md`, `dds.md`) và phân rã service bằng `ARC-`. Build Plan và Test Plan cấp system là một leaf duy nhất cho toàn hệ thống (không tách facet); chúng chỉ cover phần xuyên service.
- **Cấp dịch vụ — phát triển theo chiều dọc.** Mỗi facet của service đi trọn vòng đời `specs → design → build-plan → test-plan` ngay trong thư mục facet của nó. Đọc ma trận theo _cột_. Kết quả là mỗi facet là một lát cắt (vertical slice) có thể đặc tả, thiết kế và kiểm thử độc lập; các facet và các service tiến hành song song. Hai leaf ở gốc `service-docs/` là leaf toàn service, không thuộc facet nào: `foundation-setup-plan.md` (nền tảng riêng của service) và `build-plan.md` (aggregate: gom các facet build plan, xác định dependency và thứ tự thực hiện giữa các facet, chuẩn hóa thành task). `build-plan.md` là chỗ duy nhất ở service-level nối các lát cắt dọc theo chiều ngang, nên nội dung của các facet vẫn độc lập với nhau.
- **Điểm nối.** `dds.md` phân rã hệ thống thành service bằng `ARC-`. Service-level bắt đầu khi `ARC-` của service đó đã Approved; mỗi dòng Service Spec trỏ về System Spec hoặc `ARC-` bằng `Basis` (mục 11.4). Phát hiện ở service-level cần đổi upstream thì sửa tại owner ở system-level (mục 14.3), không sửa bản sao.

## 2.2. Nhiều service và điều chỉnh theo quy mô

- **Service** trong tài liệu này là _unit_ theo nghĩa rộng: microservice, module, application, library, pipeline... — mọi đơn vị phân rã có ranh giới và trách nhiệm riêng.
- `service-docs/` trong cây là mẫu cho **một** unit. Mỗi unit có một bản riêng, vị trí do `meta.md` quy định (ví dụ `docs/service-docs/<service-code>/` hoặc trong repo của unit). `<service-code>` là SCOPE trong ID (mục 12).
- Điều kiện tồn tại của facet áp dụng như nhau cho system-level và service-level: `ui-ux` khi có người dùng trực tiếp, `api` khi có external interaction boundary, `data` khi sở hữu persistent data; `fr-nfr` luôn có.
- Hệ thống chỉ có một unit vẫn giữ `system-docs/` (ngang) và một `service-docs/` (dọc). Service Spec và Service Design chỉ ghi phần refine thêm; phần còn lại tham chiếu bằng ID, không copy.
- Mọi điều chỉnh (bỏ leaf, bỏ facet) được ghi trong `meta.md` kèm lý do, theo tinh thần tailoring của ISO/IEC/IEEE 12207.

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

| Leaf                                     | Trả lời                                                                    | Upstream                                         | Downstream                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| `info.md`                              | Ta biết gì?                                                                | Nguồn bên ngoài (`SRC-`)                    | PI, SPEC                                                  |
| `pi.md`                                | Làm gì, phạm vi nào, quyết định gì ở cấp dự án?                  | INFO                                             | STACK, SPEC,`project-plan.md`                           |
| `tech-tool-stack.md`                   | Dùng công nghệ/công cụ nào?                                            | INFO, PI                                         | DESIGN, các Plan                                         |
| `srs.md`                               | Bối cảnh hệ thống (actor, hệ thống ngoài) và yêu cầu xuyên suốt? | INFO, PI                                         | Các leaf SPEC khác, DESIGN                              |
| `*-specs.md`                           | Facet của hệ thống/service phải làm và đáp ứng gì?                 | INFO, PI; System Spec và`ARC-` (với service) | `*-design.md`, Test Plan                                |
| `dds.md`                               | Kiến trúc tổng thể và thiết kế cross-cutting?                         | SPEC, STACK, PI                                  | `*-design.md`, Service Spec (qua `ARC-`), Deploy Plan |
| `*-design.md`                          | Facet được hiện thực thế nào?                                         | Spec cùng facet, STACK,`ARC-`                 | Build Plan, Deploy Plan                                   |
| `project-plan.md`                      | Khi nào, ai làm, rủi ro nào, theo lifecycle nào?                        | PI, các Plan                                    | —                                                        |
| `foundation-setup-plan.md` | Chuẩn bị nền tảng nào để build bắt đầu? | STACK, `ARC-` | Build Plan |
| `*-build-plan.md` | Facet cần build những gì? | Design cùng facet, Foundation | `build-plan.md` cùng service |
| `build-plan.md` (system-docs) | Build phần cấp system và integration xuyên service theo thứ tự và dependency nào? | Design cấp system, Foundation | BUILD |
| `build-plan.md` (service-docs) | Gom các facet build plan thành thứ tự build và task nào? | `*-build-plan.md` cùng service, Foundation (service) | BUILD |
| `test-plan.md`, `*-test-plan.md`     | Kiểm chứng Spec bằng cách nào?                                          | Spec cùng phạm vi                              | TEST                                                      |
| `deploy-plan.md`                       | Phát hành và đưa vào vận hành thế nào?                             | `ARC-` topology, `STK-`, `NFR-`            | DEPLOY                                                    |

## 3.3. Thuật ngữ

| Thuật ngữ              | Nghĩa                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Layer (tầng)            | INFO, PI, STACK, SPEC, DESIGN, PLAN (mục 1.4)                                                                                  |
| Leaf                     | Một file tài liệu trong cây; mỗi leaf có một owner nội dung                                                             |
| Facet                    | Một góc trách nhiệm: FR/NFR (`fr-nfr`), Data, API, UI/UX                                                                    |
| Unit / Service           | Đơn vị phân rã có ranh giới và trách nhiệm riêng (mục 2.2)                                                          |
| Scope                    | `SYS` ở system-level, mã service ở service-level; dùng trong ID                                                           |
| SRS                      | Requirements Specification. Thư mục`srs/` là tầng SPEC; `srs.md` là System Context và Cross-cutting Requirements      |
| DDS                      | Detailed Design Specification. Thư mục`dds/` là tầng DESIGN; `dds.md` là System Architecture và Cross-cutting Design  |
| PI                       | Project Initiation                                                                                                              |
| Task | Work item `BLD-` đã được chuẩn hóa: đủ nhỏ để hoàn thành trong một lần thay đổi (một pull request), `Covers` và `Depends on` xác định, `Done when` kiểm chứng được; là đơn vị thực thi mà công cụ theo dõi công việc dùng (mục 9.4) |
| Requirement / Definition | Requirement: điều phải thực hiện/đáp ứng. Definition: khái niệm cần thống nhất (`ACT-`, `EXT-`, Data Entities) |
| Baseline                 | Trạng thái leaf đã Approved và được gắn tag trong VCS                                                                  |
| Evidence                 | Sản phẩm thực thi của BUILD, TEST, DEPLOY, nằm ngoài cây (mục 1.2)                                                      |

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
| `SRC-`, `INF-`                                                | Unverified · Verified · Obsolete                                   |
| Decision (`PD-`, `DD-`, `APC-`)                             | Proposed · Accepted · Superseded by`<ID>` · Deprecated          |
| `STK-`                                                          | Proposed · Adopted · Deprecated · Replaced by`<ID>`             |
| Spec item                                                         | Draft · Approved · Implemented · Verified · Deferred · Rejected |
| Design element (`ARC-`, `SOL-`, `UXD-`, `APD-`, `DTD-`) | Proposed · Accepted · Implemented · Deprecated                    |
| Work item (`FND-`, `BLD-`, `TST-`, `DPL-`, `PRJ-`)      | Planned · In progress · Blocked · Done · Cancelled               |
| `RSK-`                                                          | Open · Mitigating · Accepted · Closed                             |

`Implemented` và `Verified` của Spec item được cập nhật từ evidence của BUILD và TEST.

**Priority:** MoSCoW — Must · Should · Could · Won't (cho đợt phát hành hiện tại).

**Statement và Acceptance.**

- `Statement` một ý, đơn nghĩa, kiểm chứng được; khuyến nghị dạng "shall" (ISO/IEC/IEEE 29148) hoặc mẫu EARS.
- `Acceptance` là ngưỡng đo được hoặc kịch bản Given/When/Then, kèm cách kiểm chứng: test, inspection, analysis hoặc demonstration.

**Decision schema** (định nghĩa một lần, dùng cho `PD-`, `DD-`, `APC-`):

```text
ID | Decision | Rationale | Basis | Status
```

`Rationale` ghi lý do, phương án đã loại và trade-off khi có. Schema tương đương Architecture Decision Record: `Basis` + `Rationale` là context, `Decision` là quyết định, trade-off là consequences, `Status` là trạng thái.

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
SRC: ID | Source | Type | Date | Reliability | Link
INF: ID | Finding | Source | Confidence | Status
```

`Source` của `INF-` trỏ về `SRC-`.

## 4.4. Quy tắc

- Các nhóm con trong `Findings` chỉ là gợi ý, có thể thay đổi theo đề tài.
- PI và Spec tham chiếu `INF-` thay vì sao chép bằng chứng.
- `Analysis & Implications` phân tích ý nghĩa của findings nhưng chưa trở thành quyết định.
- Thuật ngữ của domain nằm ở INFO; thuật ngữ của chính hệ thống nằm ở PI (`Glossary`); thuật ngữ của bộ tài liệu nằm ở META.

---

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

```text
ID | Category | Name | Version | Applies to | Role | Basis | Requires | Status
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

- `ACT-` và `EXT-` (Definition) được định nghĩa tại SRS để các leaf khác reference thay vì định nghĩa lại.
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
│   ├── Interface Structure    # APD-: protocol, resource, operations, naming, versioning
│   └── Contracts              # APD-: request/response schema, error model
├── Behavior                   # APD-: sequence, auth, async/event, idempotency
└── Decisions                  # DD-
```

Retry ở mức quality mechanism thuộc FR/NFR Design; API Design chỉ ghi retry/idempotency ở mức contract của interface.

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

Schema work item:

```text
ID | Name | Description | Covers | Depends on | Done when | Status
```

Mỗi loại Plan dùng cùng schema nhưng khác ID, đích của `Covers` và Category:

| Plan leaf                          | ID       | `Covers` trỏ tới                  | Category mặc định                                                                  |
| ---------------------------------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| `foundation-setup-plan` | `FND-` | `STK-`, `ARC-`                    | Environment, Toolchain, Repository & Scaffolding, Access & Configuration              |
| `build-plan`, `*-build-plan`   | `BLD-` | Design element                        | Implementation, Integration                                                           |
| `test-plan`, `*-test-plan`     | `TST-` | Spec item (Requirement)               | Test level hoặc loại kiểm thử;`Gate`                                            |
| `deploy-plan`                    | `DPL-` | `ARC-` topology, `STK-`, `NFR-` | Environment Provisioning, Release & Rollout, Rollback, Operational Readiness;`Gate` |

Quy tắc:

- `Covers` bắt buộc với work item, trừ `Gate`.
- `Depends on` tạo ra thứ tự thực hiện; không viết lịch riêng trong leaf plan.
- `Done when` là điều kiện hoàn thành riêng của item; Definition of Done chung của leaf nằm ở `Approach`.
- Ngày, người phụ trách, ước lượng thuộc Project Plan, tham chiếu work item bằng ID.
- Plan không tạo requirement, design hay technology choice mới; khi nhắc công cụ, `Approach` trích `STK-`.
- Category mặc định có thể mở rộng qua `meta.md`; `Gate` là loại cố định.
- Project Plan là ngoại lệ, có schema riêng (mục 9.2).

## 9.2. Project Plan

```text
PROJECT PLAN
├── Approach                    # APC-: lifecycle, phương pháp, change và configuration management
├── Phases & Milestones         # PRJ-: phase, milestone, gate; có Target
├── Roles & Responsibilities    # PRJ-: role, responsibility
└── Risks                       # RSK-: risk register
```

Schema:

```text
Phase/Milestone/Gate: ID | Name | Type | Includes | Depends on | Target | Estimate | Owner | Exit criteria | Status
Role:                 ID | Role | Responsibility | Assignee
Risk:                 ID | Risk | Probability | Impact | Response | Owner | Basis | Status
```

- `Includes` trỏ tới work item (`FND-`, `BLD-`, `TST-`, `DPL-`) hoặc leaf thuộc phase/milestone đó.
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

## 9.4. Build Plan

```text
BUILD PLAN
├── Approach                    # APC-: increment, integration, branching, versioning, Definition of Done
└── Work Items                  # BLD-: Category Implementation, Integration
```

- System-level Build Plan cover các phần tử Design cấp system và integration xuyên service.
- Service-level có hai tầng build plan:
  - **Facet build plan** (`*-build-plan.md`): cover Design element của đúng facet. `Depends on` chỉ trỏ tới item cùng facet hoặc `FND-`; phụ thuộc giữa các facet không khai báo ở đây.
  - **Service build plan** (`service-docs/build-plan.md`): leaf aggregate của service, mô tả bên dưới.

**Service build plan** dùng template Plan (mục 9.1) kèm một section thứ tự:

```text
SERVICE BUILD PLAN
├── Approach                    # APC-: chiến lược thứ tự giữa các facet, Definition of Done cấp service
├── Build Order                 # Thứ tự thực hiện theo wave: BLD-/FND- của service, dependency xuyên facet
└── Work Items                  # BLD-: Category Integration (ghép các facet)
```

Schema của `Build Order`:

```text
Wave | Includes | Depends on | Done when
```

`Wave` là nhãn cục bộ trong leaf (không phải ID để trace); `Includes` là các `BLD-`/`FND-` theo ID; `Depends on` trỏ tới wave khác; `Done when` là điều kiện hoàn thành wave.

- **Aggregate, không định nghĩa lại:** `Build Order` tham chiếu `BLD-` của các facet bằng ID, không chép item (mục 11.1).
- **Gom:** mọi `BLD-` của mọi facet và `FND-` của service xuất hiện trong `Build Order`.
- **Xác định dependency và thứ tự:** `Build Order` chia item thành các wave; item trong cùng một wave không phụ thuộc nhau và có thể thực hiện song song. Dependency xuyên facet chỉ khai báo ở đây.
- **Chuẩn hóa thành task:** mỗi item vào `Build Order` phải đạt chuẩn task (mục 3.3). Item chưa đạt được sửa tại facet build plan (owner), không sửa ở service build plan.
- **Integration:** `BLD-` loại Integration (ghép các facet, cover Design element có `Uses` xuyên facet) thuộc service build plan.
- `Approach` của service build plan quyết định chiến lược thứ tự (ví dụ làm lát cắt mỏng xuyên facet trước, hoặc theo Priority); đây là quyết định của dự án.

## 9.5. Test Plan

```text
TEST PLAN
├── Approach                    # APC-: test levels, loại kiểm thử, yêu cầu environment, data, công cụ (trích STK-), defect handling
└── Test Items                  # TST-: Category = test level hoặc loại kiểm thử, cộng Gate cho entry/exit
```

- `Covers` trỏ trực tiếp tới Spec. Test Plan trace trực tiếp về Spec, không cần đi qua Design.
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

`Covers` có thể trỏ tới `ARC-` topology, `STK-` và `NFR-` về availability/RPO/RTO.

Ranh giới môi trường:

- Environment dùng để build/test thuộc Foundation Setup.
- Environment hệ thống được phát hành lên (staging, production...) thuộc Deploy Plan.

`Operational Readiness` có thể sinh evidence nằm ngoài cây (cấu hình giám sát, cảnh báo, runbook, kiểm tra backup/restore); chúng được trace bằng `DPL-`.

---

# 10. Service-level Documentation

Service-level sử dụng cùng semantic structure với system-level nhưng phát triển theo **chiều dọc**: mỗi facet là một thư mục có đủ bốn leaf `specs → design → build-plan → test-plan` (mục 2.1). Ở gốc `service-docs/` có thêm hai leaf toàn service, không thuộc facet nào.

| Facet | Có khi | Nội dung bốn leaf |
| --- | --- | --- |
| `fr-nfr/` | Luôn có | FR/NFR thuộc trách nhiệm service, cách service hiện thực chúng, kế hoạch build và kiểm thử |
| `data/` | Service sở hữu/quản lý persistent data | Data entities, rules, lifecycle/protection; data model, storage/access, data flow; kế hoạch triển khai và kiểm thử database/data layer |
| `api/` | Service có external interaction boundary | API/interface service cung cấp hoặc sử dụng; thiết kế interface, contract, behavior; kế hoạch triển khai và kiểm thử API/integration |
| `ui-ux/` | Service có người dùng trực tiếp | User tasks, journeys, interface, interaction, experience qualities; thiết kế chi tiết UI/UX; kế hoạch triển khai và kiểm thử UI/UX |

| Leaf toàn service (gốc `service-docs/`) | Vai trò |
| --- | --- |
| `foundation-setup-plan.md` | Nền tảng riêng của service; chỉ chứa phần riêng, phần dùng chung phụ thuộc system Foundation Setup Plan (mục 9.3) |
| `build-plan.md` | Aggregate: gom các facet build plan, xác định dependency và thứ tự giữa các facet, chuẩn hóa thành task (mục 9.4) |

- `foundation-setup-plan.md` của service phủ toàn service nên nằm ở gốc `service-docs/`, không nằm trong facet nào; system Foundation Setup Plan là foundation dùng chung ở cấp system.
- Service chỉ có facet `fr-nfr/` vẫn có hai leaf toàn service; `build-plan.md` khi đó chỉ gom `fr-nfr-build-plan.md` và các `BLD-` Integration nếu có.
- Chỉ đọc/consume data qua API của service khác không tự động tạo `data/`; responsibility sở hữu/quản lý persistent data mới là điều kiện.
- Điều kiện `api/` không chỉ là BE mà là **external interaction boundary**: nếu service có UI và UI giao tiếp với service thì API vẫn cần được mô tả.
- Mỗi facet đã tồn tại phải có đủ bốn leaf.

---

# 11. Traceability và ownership

## 11.1. Quy tắc cốt lõi

> **Mỗi nội dung chỉ có một owner; các tài liệu khác reference bằng ID, không copy.**

Trace hai chiều: forward (từ Spec đến Design, Plan, Test) và backward (từ item về `Basis`). Ma trận traceability được sinh từ ID bằng công cụ, không viết tay (mục 14.4).

## 11.2. Trace field

Định nghĩa một lần; các mục trước chỉ dùng lại.

| Trường       | Dùng ở                       | Trỏ tới                                 |
| -------------- | ------------------------------ | ----------------------------------------- |
| `Basis`      | Spec, STACK, Decision,`RSK-` | `INF-`, `PD-`, Spec/`ARC-` upstream |
| `Uses`       | Design                         | Phần tử Design khác,`STK-`, `EXT-` |
| `Realizes`   | Design                         | Spec item (Requirement)                   |
| `Decisions`  | Design                         | `DD-`                                   |
| `Covers`     | Plan                           | Tùy loại Plan (mục 9.1)                |
| `Depends on` | Plan, Project Plan             | Item khác cùng phạm vi                 |
| `Requires`   | STACK                          | `STK-` khác                            |
| `Applies to` | STACK                          | System hoặc service (SCOPE)              |

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
Service Spec ─────────────────────┐
    ↓                             ↓
Service Design             Service Test Plan → TEST
    ↓
Facet Build Plan (theo facet)
    ↓
Service Build Plan (gom, thứ tự, task) ←── Foundation Setup Plan (service)
    ↓
Implementation
```

- Service-level không copy nguyên văn system-level; mỗi dòng là refinement/phân bổ từ upstream qua `Basis`, `Realizes`, `Covers` tùy loại artifact.
- Facet build plan chỉ cover Design của facet mình; service build plan không định nghĩa lại item mà gom, sắp thứ tự và chuẩn hóa chúng (mục 9.4).
- Một System Spec item được phân bổ xuống service (allocated) coi là đã được thực hiện và kiểm chứng khi mọi Service Spec item dẫn xuất từ nó đã có `Realizes` và `Covers`.
- System Spec item không phân bổ xuống service (xuyên service) được thực hiện bởi System Design và kiểm chứng bởi System Test Plan.

---

# 12. Prefix và ID

| Prefix            | Ý nghĩa                               | Leaf sở hữu                            | Scope                        |
| ----------------- | --------------------------------------- | ---------------------------------------- | ---------------------------- |
| `SRC-`          | Source                                  | `info.md`                              | không                       |
| `INF-`          | Finding                                 | `info.md`                              | không                       |
| `PD-`           | Project Decision                        | `pi.md`                                | không                       |
| `STK-`          | Stack item                              | `tech-tool-stack.md`                   | không (dùng`Applies to`) |
| `ACT-`          | Actor                                   | `srs.md`                               | không                       |
| `EXT-`          | External system / dependency            | `srs.md`                               | không                       |
| `SRS-`          | System cross-cutting requirement        | `srs.md`                               | không                       |
| `FR-`, `NFR-` | Functional / Non-functional Requirement | `fr-nfr-specs.md`                      | có                          |
| `UI-`           | UI/UX specification item                | `ui-ux-specs.md`                       | có                          |
| `API-`          | API specification item                  | `api-specs.md`                         | có                          |
| `DATA-`         | Data specification item                 | `data-specs.md`                        | có                          |
| `ARC-`          | Architecture design item                | `dds.md`                               | không                       |
| `SOL-`          | Solution / FR-NFR design item           | `fr-nfr-design.md`                     | có                          |
| `UXD-`          | UI/UX design item                       | `ui-ux-design.md`                      | có                          |
| `APD-`          | API design item                         | `api-design.md`                        | có                          |
| `DTD-`          | Data design item                        | `data-design.md`                       | có                          |
| `DD-`           | Design Decision                         | Mọi leaf design                         | có                          |
| `APC-`          | Approach Decision                       | Mọi leaf plan                           | có                          |
| `PRJ-`          | Project plan item                       | `project-plan.md`                      | không                       |
| `RSK-`          | Risk                                    | `project-plan.md`                      | không                       |
| `FND-`          | Foundation setup item                   | `foundation-setup-plan.md` | có                          |
| `BLD-`          | Build item                              | `build-plan.md`, `*-build-plan.md`   | có                          |
| `TST-`          | Test item                               | `test-plan.md`, `*-test-plan.md`     | có                          |
| `DPL-`          | Deploy item                             | `deploy-plan.md`                       | không                       |

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

- `SCOPE` là `SYS` ở system-level, mã service ở service-level.
- Mỗi cặp (`TYPE`, `SCOPE`) có một dãy số duy nhất, dùng chung giữa các leaf cùng prefix. Ví dụ mọi `TST-ORD-` trong các test plan facet của service ORD chung một dãy; mọi `BLD-ORD-` trong các build plan facet và `build-plan.md` của service ORD cũng chung một dãy; facet được xác định bằng file chứa item và trường `Covers`.
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
- Không để orphan: mỗi Design element có `Realizes`; mỗi work item có `Covers` (trừ `Gate`); mỗi Requirement có Design thực hiện (hoặc được phân bổ) và có Test Item cover; mỗi `BLD-` và `FND-` của service xuất hiện trong `Build Order` của service đó.
- Không tạo document branch nếu service không có responsibility tương ứng; không để một facet đã tồn tại thiếu một trong bốn leaf.
- Không để `BLD-` của một facet `Depends on` item của facet khác; phụ thuộc xuyên facet chỉ khai báo ở `build-plan.md` của service.
- Không dùng ID ngoài scheme (mục 12); không đổi hoặc tái sử dụng ID.

---

# 14. Cách sử dụng

## 14.1. Khởi tạo dự án mới

1. Tạo `meta.md` từ mặc định (mục 3): đặt SCOPE, ghi tailoring (mục 2.2).
2. **Chiều ngang (`system-docs/`):** INFO → PI → STACK song song với SPEC (`srs.md` trước, rồi các facet) → DESIGN (`dds.md`: phân rã service bằng `ARC-`, rồi các facet) → Plans (Project, Foundation, Build, Test, Deploy).
3. Baseline system-level đến mức service-level bắt đầu được: ít nhất `ARC-` của service đã Approved.
4. **Chiều dọc (`service-docs/`):** với mỗi service, tạo `foundation-setup-plan.md`, `fr-nfr/` và các facet khác theo responsibility; đi `specs → design → build-plan → test-plan` trong từng facet, rồi gom ở `build-plan.md` của service (thứ tự, dependency, task).

## 14.2. Thêm service mới

1. Bổ sung `ARC-` của service trong `dds.md` (qua quy trình thay đổi, mục 14.3).
2. Chọn SCOPE; tạo `fr-nfr/`, các facet theo điều kiện, cùng `foundation-setup-plan.md` và `build-plan.md` ở gốc `service-docs/` (mục 10).
3. Service Spec `Basis` về System Spec hoặc `ARC-`; `foundation-setup-plan.md` của service chỉ ghi phần riêng, phụ thuộc system Foundation Setup Plan.
4. Cập nhật Tree và Registry trong `meta.md`.

## 14.3. Xử lý thay đổi

1. Xác định owner của nội dung cần đổi (mục 7.8, 11.1) và sửa tại owner.
2. Impact analysis bằng trace: tìm mọi item có `Basis`, `Realizes`, `Covers`, `Uses` trỏ tới ID thay đổi.
3. Cập nhật downstream theo thứ tự tầng và đặt Status phù hợp.
4. Với item đã Baselined: change request (pull request kèm impact analysis), tăng version; item thay thế dùng ID mới và `Superseded by`.
5. Thay đổi sau phát hành: bắt đầu từ tầng bị ảnh hưởng, đi lại phần chuỗi downstream.

## 14.4. Kiểm tra tự động

Trong CI cho repo tài liệu:

- Front matter hợp lệ.
- ID đúng scheme, không trùng.
- Mọi `Basis`, `Realizes`, `Covers`, `Uses`, `Requires` trỏ tới ID tồn tại.
- Coverage theo mục 13.2 (orphan).
- Ma trận traceability sinh từ ID.

## 14.5. Cho AI sử dụng

- Bắt đầu từ Registry (mục 3.2) để biết leaf nào trả lời câu hỏi nào.
- Nạp theo ID, không nạp cả cây: leaf cần làm việc cộng các item được trỏ bởi `Basis`, `Realizes`, `Covers`, `Uses` (một bước upstream); mở rộng khi cần.
- ID là handle ổn định; không suy nội dung từ số thứ tự.
- Không tự tạo nội dung thuộc owner khác; nếu thiếu upstream, ghi vào `Assumptions & Open Issues` hoặc đề xuất thay đổi tại owner.

Mục tiêu của framework là tạo một chuỗi tài liệu có **ownership rõ, traceability rõ, không trùng nội dung, có thể refine từ system xuống service và đủ cấu trúc để AI sử dụng làm input cho việc lập kế hoạch và triển khai**.

---

# 15. Đối chiếu với tiêu chuẩn thực tế

Bảng dưới là ánh xạ cấu trúc, không phải tuyên bố tuân thủ. Khi hợp đồng hoặc cơ quan quản lý yêu cầu tuân thủ chính thức, bổ sung ánh xạ chi tiết trong `meta.md`.

| Thành phần                           | Artifact tương ứng trong thực tế                        | Chuẩn / thực hành tham chiếu                                          |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Toàn bộ vòng đời, tailoring       | Quy trình vòng đời phần mềm                            | ISO/IEC/IEEE 12207; ISO/IEC/IEEE 15289 (nội dung information item)       |
| INFO                                   | Discovery, feasibility và market research, evidence log     | Elicitation và analysis theo BABOK                                       |
| PI                                     | Project charter, Vision & Scope                              | PMBOK (project charter), ISO 21502                                        |
| STACK                                  | Technology baseline, tooling inventory                       | Tech radar; ADR cho lựa chọn công nghệ                                |
| SPEC                                   | Requirements specification                                   | ISO/IEC/IEEE 29148 (thay IEEE 830); EARS; MoSCoW                          |
| NFR                                    | Quality requirements                                         | ISO/IEC 25010                                                             |
| UI/UX                                  | UX spec, flows, design system                                | ISO 9241-210 (human-centred design); WCAG                                 |
| API                                    | API contract                                                 | OpenAPI, AsyncAPI                                                         |
| `dds.md`                             | Architecture description                                     | ISO/IEC/IEEE 42010; C4 model; arc42                                       |
| `*-design.md`                        | Software design description                                  | IEEE 1016                                                                 |
| Decisions (`PD-`, `DD-`, `APC-`) | Architecture Decision Record                                 | ADR (Nygard)                                                              |
| Project Plan                           | Project management plan, milestone plan, RACI, risk register | PMBOK, ISO 21502                                                          |
| Foundation, Build Plan                 | Dev environment setup, CI và branching/versioning strategy  | ISO/IEC/IEEE 12207 (configuration management); Definition of Done (Scrum) |
| Service Build Plan (aggregate) | Work breakdown, build sequencing, task breakdown | PMBOK (WBS, sequence activities); Definition of Ready |
| Test Plan                              | Master test plan, level test plan                            | ISO/IEC/IEEE 29119 (phần test documentation); ISTQB test levels          |
| Deploy Plan                            | Release và deployment plan, rollback, operational readiness | ITIL 4 (release management, change enablement)                            |
| Traceability                           | Requirements Traceability Matrix hai chiều                  | ISO/IEC/IEEE 29148, 12207                                                 |
| Document control                       | Docs-as-code, baseline, change control                       | VCS và pull request; ISO/IEC/IEEE 12207 (configuration management)       |
