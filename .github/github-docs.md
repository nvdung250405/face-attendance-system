# GitHub Docs — Quy trình làm việc với GitHub cho bộ tài liệu và sản phẩm SDLC

# 1. Mục đích và phạm vi

## 1.1. Mục đích

Tài liệu này mô tả **cách team làm việc với GitHub**: từ issue đến deploy, và cách GitHub tự động hóa các bước đó. Nó gắn các quy tắc của `sdlc-docs.md` vào quy trình ấy. Nó **không định nghĩa lại quy tắc** của `sdlc-docs.md`; mỗi nội dung trỏ về mục gốc.

`github-docs.md` là *implementation profile* của `sdlc-docs.md` cho GitHub. Đổi nền tảng (GitLab, Azure DevOps...) thì thay tài liệu này, không sửa chuẩn khung.

Tài liệu này không phải leaf trong `docs/` và không có ID hay trace item; vai trò của nó giống `meta.md`.

## 1.2. Ba lớp

| Lớp | Là gì | Trả lời câu hỏi |
|---|---|---|
| `github-docs.md` | Quy trình | Team làm việc với GitHub như thế nào? |
| `.github/` (template, workflows, `CODEOWNERS`...) và cài đặt repo | Máy thực hiện | Máy tự động thực hiện và ép buộc quy trình đó ra sao? |
| `docs/` | Nội dung SDLC | Quy trình đó quản lý những tài liệu nào? |

Quy trình quản lý `docs/`; `.github/` hiện thực hóa quy trình. Workflow YAML **không chứa luật** mà tài liệu này chưa có: muốn đổi luật thì sửa tài liệu trước, rồi mới sửa YAML.

## 1.3. Phạm vi

- **Trong phạm vi:** quy trình làm việc (issue, branch, commit, pull request, review và merge, CI, release và deploy), ownership, template, cài đặt repo, bảo mật workflow, cách evidence gắn ID, hướng dẫn cho AI.
- **Ngoài phạm vi:**
  - Quy tắc về nội dung, cấu trúc, schema, ID của tài liệu → `sdlc-docs.md`.
  - Quyết định cụ thể của từng dự án (công nghệ, lệnh lint/test/build, danh sách môi trường, đích deploy, chiến lược khác mặc định) → STACK và Plan (mục 12). Tài liệu này chỉ cung cấp **mặc định** (mô hình stage, gate, quy ước), không chứa lệnh hay đích deploy của một dự án.
  - Nền tảng khác GitHub.

## 1.4. Điều kiện áp dụng

Chỉ áp dụng khi Tool Stack của dự án chọn GitHub làm nền tảng VCS và CI/CD. Điều kiện này được ghi bằng một item `STK-` trong `tech-tool-stack.md` và nhắc lại trong `meta.md`; tài liệu này không lặp lại nó.

---

# 2. Cấu trúc `.github/`

```text
.github/
├── github-docs.md                   # Tài liệu này: quy trình
├── CODEOWNERS                       # Owner theo đường dẫn
├── PULL_REQUEST_TEMPLATE.md         # Template pull request
├── ISSUE_TEMPLATE/
│   ├── config.yml                   # Cấu hình chọn template
│   ├── work-item.yml                # Thực thi một work item của Plan
│   ├── change-request.yml           # Đổi item đã Baselined
│   ├── new-service.yml              # Thêm service/unit mới
│   └── defect.yml                   # Lỗi phát hiện khi kiểm thử/vận hành
├── workflows/
│   ├── docs-check.yml               # Kiểm tra tài liệu (một check của CI)
│   ├── docs-baseline.yml            # Chốt baseline tài liệu khi gắn tag
│   ├── ci.yml                       # CI của sản phẩm: validate, test, build, artifact
│   └── deploy.yml                   # Release và deploy sản phẩm
├── dependabot.yml                   # (Tùy chọn) Cập nhật action và dependency
└── copilot-instructions.md          # Hướng dẫn AI, trỏ về docs
```

- Workflow có tiền tố `docs-` thuộc hệ thống tài liệu (owner: team quản trị tài liệu). `ci.yml` và `deploy.yml` thuộc sản phẩm (owner: team phát triển); tên có thể theo service (`ci-<SCOPE>.yml`).
- Lệnh cụ thể trong `ci.yml` và `deploy.yml` (lint, test, build, deploy) là quyết định của dự án, ghi ở Plan và STACK. Tài liệu này chỉ định nghĩa mô hình stage, tên check, gate và quyền (mục 10, 11, 13).
- Logic kiểm tra tài liệu nằm ngoài `.github/` (ví dụ `tools/docs-check/`); workflow chỉ gọi script để chạy được cả ở máy local lẫn pre-commit.

---

# 3. Ánh xạ quy tắc sang GitHub

Mỗi quy tắc liên quan của `sdlc-docs.md` có đúng một chỗ thực hiện.

| Quy tắc (`sdlc-docs.md`) | Cách thực hiện trên GitHub | Mục |
|---|---|---|
| 3.4 Document control: front matter, status | Kiểm tra front matter trong `docs-check` | 10.3 |
| 11.1 Một owner cho mỗi nội dung | `CODEOWNERS` và code owner bắt buộc review | 9, 13.1 |
| 14.3 Change request: sửa tại owner, impact analysis | Issue `change-request`, pull request template | 5, 8, 13.2 |
| 3.4 Baselined = tag; sau baseline qua change request | Tag `baseline/...`, Release, tag ruleset | 11.3 |
| 14.4 Kiểm tra tự động | `docs-check` là required check | 10.3 |
| 14.2 Thêm service mới | Issue `new-service` | 5 |
| 1.2 Evidence trace về ID | Quy ước gắn ID vào issue, branch, commit, pull request, workflow, test report, release | 12.3 |
| 9.4 Build Plan `Approach`: branching, versioning, Definition of Done | Mặc định ở mục 6, 7, 9 | 12.2 |
| 9.5 Test Plan `Approach`: level, environment, tool, defect handling; `Gate` | Mặc định ở mục 5 (defect), 10 | 12.2 |
| 9.6 Deploy Plan `Approach`: release, rollout, rollback; `Gate` | Mặc định ở mục 11 | 12.2 |
| 14.5 Cho AI sử dụng | `copilot-instructions.md` | 15 |
| 2.2 Nhiều service, nhiều repo | Phân vai repo | 14 |

---

# 4. Workflow tổng thể

```text
Issue
  ↓
Branch
  ↓
Commit
  ↓
Pull Request
  ↓
CI ── validate · docs-check · test · build
  ↓
Review (code owners)
  ↓
Merge (squash)
  ↓
Release ── artifact có version
  ↓
Deploy ── dev → staging → production
```

| Bước | Người làm | Máy làm | Mục |
|---|---|---|---|
| Issue | Tạo hoặc triage issue từ work item, change request, service mới, defect | Issue form, label, Project | 5 |
| Branch | Tạo nhánh ngắn từ `main` | Ruleset chặn push trực tiếp `main` | 6 |
| Commit | Commit nhỏ theo Conventional Commits | (Tùy chọn) commit lint cục bộ | 7 |
| Pull Request | Mở draft sớm, điền template | Template, check `pr-title`, tự yêu cầu code owner review | 8 |
| CI | — | `validate`, `docs-check`, `test`, `build`, `ci-passed` | 10 |
| Review | Code owner và reviewer | `CODEOWNERS`, ruleset | 9 |
| Merge | Tác giả (hoặc merge queue) | Squash merge, xóa nhánh, đóng issue | 9 |
| Release | — | Artifact có version, tag, release notes | 11 |
| Deploy | Người duyệt ở môi trường được bảo vệ | GitHub Environments | 11 |

Nguyên tắc chung:

- **Một thay đổi = một issue = một nhánh ngắn = một pull request = một commit trên `main`.** Thay đổi nhỏ, tích hợp thường xuyên.
- `main` luôn ở trạng thái có thể release.
- Mọi bước mang ID để trace về Spec, Design hoặc Plan (mục 12).
- Quy tắc nằm ở tài liệu, máy chỉ ép buộc; không có quy tắc nào chỉ nằm trong YAML (mục 1.2).

---

# 5. Issue Workflow

| Loại issue | Dùng khi | Mang ID | Template |
|---|---|---|---|
| Work item | Thực thi một work item của Plan | `FND-`, `BLD-`, `TST-`, `DPL-` | `work-item.yml` |
| Change request | Đổi item đã Baselined (`sdlc-docs.md` 14.3) | ID item bị đổi | `change-request.yml` |
| New service | Thêm unit mới (`sdlc-docs.md` 14.2) | Mã service (SCOPE) | `new-service.yml` |
| Defect | Lỗi phát hiện khi kiểm thử hoặc vận hành | `TST-` hoặc Spec ID bị vi phạm | `defect.yml` |

Quy tắc:

- Tiêu đề: `[<ID>] <tóm tắt>`.
- **Issue là bản thực thi, không phải bản sao.** Work item (hoặc item bị đổi) vẫn do Plan (hoặc leaf sở hữu nó) định nghĩa; issue chỉ mang ID và liên kết, không chép nội dung (`sdlc-docs.md` 11.1).
- Assignee, trạng thái làm việc (`In progress`, `Blocked`) và ngày ở cấp task nằm ở Issue/Project. Project Plan giữ mốc cấp milestone (`PRJ-`). Trong Plan, `Status` của work item chỉ đổi ở các mốc `Planned`, `Done`, `Cancelled`; `Done` được đặt trong chính pull request hoàn thành work item (mục 9).
- **Definition of Ready:** issue có ID; mọi `Depends on` đã Done; với service, `ARC-` của service đã Approved (`sdlc-docs.md` 2.1).
- Project board mặc định: Backlog → Ready → In progress → In review → Done.
- **Defect:** issue `defect` mang ID bị vi phạm; bản sửa là pull request `fix` và bổ sung test (`TST-`) chống tái phát. Đây là mặc định cho `defect handling` của Test Plan.
- Label gợi ý: theo `type` (mục 7) và `scope` (SCOPE).

---

# 6. Branch Workflow

Mặc định: **GitHub flow với kỷ luật trunk-based.**

- `main` là nhánh duy nhất sống lâu; luôn có thể release.
- Nhánh làm việc ngắn: tạo từ `main`, sống từ vài giờ đến tối đa khoảng hai ngày, merge về `main` ít nhất mỗi ngày làm việc có thay đổi hoàn chỉnh.
- Không có nhánh `develop` hay nhánh tính năng sống lâu. Công việc dở dang được ẩn sau feature flag thay vì giữ trên nhánh dài.
- Nhánh `release/*` hoặc `hotfix/*` chỉ dùng khi phải hỗ trợ nhiều phiên bản đã phát hành cùng lúc; tạo từ tag, và vẫn đi qua pull request.
- Xóa nhánh ngay sau khi merge.

Tên nhánh:

```text
<type>/<ID>-<slug>
```

Ví dụ: `feat/BLD-ORD-003-create-order`, `docs/FR-ORD-003-update-acceptance`, `fix/BLD-ORD-007-null-total`. `type` theo mục 7.

Quy tắc:

- Thay đổi code làm đổi nội dung tài liệu thì sửa tài liệu trong **cùng** nhánh và pull request (docs-as-code).
- Một nhánh phục vụ một issue.
- Mặc định này là mặc định cho `branching` của Build Plan; dự án chọn khác (ví dụ Gitflow) thì ghi quyết định ở `APC-` (mục 12.2).

---

# 7. Commit Workflow

Dùng Conventional Commits: `<type>(<SCOPE>)[!]: <subject>`. `SCOPE` là mã service hoặc `SYS` (cùng SCOPE với ID, `sdlc-docs.md` mục 12).

| Type | Dùng cho | Tác động SemVer |
|---|---|---|
| `feat` | Tính năng mới | MINOR |
| `fix` | Sửa lỗi | PATCH |
| `docs` | Chỉ đổi tài liệu | Không |
| `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert` | Các loại còn lại | Không |
| `!` sau type/scope, hoặc footer `BREAKING CHANGE:` | Thay đổi phá vỡ tương thích, áp dụng cho mọi type | MAJOR |

Ví dụ:

```text
feat(ORD): create order

Refs: BLD-ORD-003
```

```text
fix(ORD)!: remove deprecated status field

BREAKING CHANGE: field `status` is removed; use `state`.
```

Quy tắc:

- Commit trong nhánh: theo định dạng trên, ID ở footer `Refs:` (khuyến nghị).
- **Tiêu đề pull request** là commit trên `main` sau squash, nên bắt buộc dạng `<type>(<SCOPE>): <subject> [<ID>]`, ví dụ `feat(ORD): create order [BLD-ORD-003]`. Check `pr-title` ép buộc điều này.
- Thay đổi chỉ trong `docs/` dùng `docs`; thay đổi trong `.github/workflows/` dùng `ci`.
- Không commit secret; có secret scanning và push protection (mục 13.5).
- Version phát hành suy ra từ các type trong lịch sử (mục 11.2).

---

# 8. Pull Request Workflow

- Mở **draft** sớm; chuyển Ready khi đã tự kiểm tra và CI xanh.
- Một pull request một mục đích, đủ nhỏ để review trong một lần.
- Tiêu đề theo mục 7; liên kết issue bằng từ khóa đóng issue (`Closes #n`).
- Điền template (mục 13.2). Cùng một template cho ba loại thay đổi: tài liệu, hệ thống tài liệu, code.
- Tài liệu liên quan cập nhật trong cùng pull request (mục 6).
- Code owner được yêu cầu review tự động (mục 13.1).
- Pull request hoàn thành work item đặt `Status` của work item thành `Done` trong Plan.

---

# 9. Review và Merge Workflow

**Review.** Reviewer kiểm tra tùy loại pull request:

| Loại | Reviewer kiểm gì |
|---|---|
| Tài liệu | Bốn phép thử (`sdlc-docs.md` 13.1); impact analysis đúng; sửa tại owner, không copy; Status và version |
| Code | `Done when` của work item được thỏa; test đủ; không đưa requirement hoặc design mới ngoài Spec và Design |
| Hệ thống tài liệu | Khớp mục 3 (một quy tắc một chỗ thực hiện); YAML không chứa luật ngoài tài liệu này |

- Tối thiểu 1 approval, gồm code owner; tác giả không tự approve.
- Mọi conversation phải được giải quyết trước khi merge; approval cũ bị hủy khi có commit mới.
- Mục tiêu phản hồi review trong một ngày làm việc để nhánh giữ ngắn.

**Merge.**

- Chỉ squash merge; commit message mặc định lấy từ tiêu đề pull request.
- Chỉ merge khi mọi required check xanh (mục 10.2).
- Merge queue là tùy chọn cho repo có nhiều pull request đồng thời: workflow phải có trigger `merge_group`, nếu không check không chạy và merge thất bại. Khả dụng tùy gói GitHub.
- Sau merge: xóa nhánh, issue tự đóng.

**Definition of Done mặc định** (mặc định cho `Definition of Done` của Build Plan):

1. Required check xanh.
2. Code owner đã approve.
3. `Done when` của work item thỏa.
4. Tài liệu liên quan đã cập nhật; `Status` work item đã `Done`.

**Hotfix.** Đi cùng quy trình, từ nhánh ngắn hoặc `hotfix/*` (mục 6). Không bỏ qua required check; bypass ruleset chỉ dành cho người được chỉ định và được ghi nhận.

---

# 10. CI Workflow

## 10.1. Mô hình stage

Mô hình trừu tượng, không phụ thuộc ngôn ngữ hay công cụ. Dự án quyết định lệnh cụ thể cho từng stage (mục 12.2).

```text
Push / Pull Request
        ↓
    Validate
        ↓
      Test
        ↓
      Build
        ↓
    Artifact
        ↓
(Deploy: mục 11)
```

| Stage | Làm gì | Chạy khi | Check |
|---|---|---|---|
| Validate | Lint, format, type check, `pr-title`, quét secret và dependency; `docs-check` | Pull request, push `main` | `validate`, `docs-check` |
| Test | Unit, integration; cấp cao hơn (e2e, performance) theo Test Plan | Nhanh: pull request. Chậm: sau merge hoặc theo lịch | `test` |
| Build | Biên dịch, đóng gói | Pull request, push `main` | `build` |
| Artifact | Tạo artifact bất biến, gắn version, lưu trữ | Push `main` | — (đầu vào của Deploy) |
| Aggregate | Tổng hợp kết quả các check | Pull request | `ci-passed` |

CI trên pull request nên ngắn (gợi ý khoảng 10 phút); phần chậm chạy sau merge hoặc theo lịch.

## 10.2. Trigger và required check

- Trigger: `pull_request`, `push` lên `main`, và `merge_group` nếu dùng merge queue.
- Required check của ruleset: `ci-passed` và `docs-check` (mục 13.3).
- **Không dùng path filter hoặc branch filter ở cấp workflow cho workflow được đặt là required.** Workflow bị bỏ qua vì filter sẽ để check ở trạng thái "Pending" và chặn merge; job bị bỏ qua bằng điều kiện ở cấp job thì báo "Success". Vì vậy:
  - Workflow chạy trên mọi pull request.
  - Quyết định "có cần chạy phần này không" (ví dụ chỉ chạy `test` của service ORD khi có thay đổi ở ORD) đặt ở **điều kiện cấp job**.
  - `ci-passed` là job tổng hợp (`needs` các job còn lại) để ruleset chỉ cần yêu cầu một check ổn định.
- Hủy các lần chạy cũ của cùng pull request khi có commit mới (concurrency); không hủy lần chạy trên `main` hay deploy.
- Nhiều service trong một repo: mỗi service một nhóm job (hoặc gọi reusable workflow), phát hiện thay đổi bằng điều kiện cấp job.

## 10.3. `docs-check`

Là một check của CI nhưng nằm ở workflow riêng vì thuộc owner khác (team quản trị tài liệu). Chạy trên mọi pull request (mục 10.2); các job kiểm tra tài liệu tự bỏ qua bằng điều kiện cấp job khi pull request không đụng `docs/**`, `.github/**`, `tools/**`.

| Kiểm tra | Mục gốc (`sdlc-docs.md`) | Fail khi |
|---|---|---|
| Front matter | 3.4 | Thiếu hoặc sai trường (`title`, `version`, `status`, `owner`); `status` ngoài tập giá trị |
| ID scheme và duy nhất | 12 | ID sai prefix/scope; trùng; ID bị xóa hoặc tái sử dụng so với nhánh gốc |
| Reference | 11.2 | `Basis`, `Realizes`, `Covers`, `Uses`, `Requires` trỏ tới ID không tồn tại |
| Orphan | 13.2 | Design element thiếu `Realizes`; work item (trừ `Gate`) thiếu `Covers`; Requirement thiếu Design/phân bổ hoặc thiếu Test Item |
| Cấu trúc cây | 2, 10 | Facet đã tồn tại thiếu một trong bốn leaf |
| Change control | 3.4, 14.3 | Pull request sửa item thuộc leaf `Baselined` mà không tham chiếu issue change request |
| Markdown và link | — | Lỗi lint; link hỏng |
| Traceability matrix | 11.1 | Không fail; xuất ma trận làm artifact |

## 10.4. Quy ước workflow

- Tên job và check ổn định (`validate`, `test`, `build`, `docs-check`, `ci-passed`); đổi tên là đổi ruleset.
- `permissions` mặc định chỉ đọc nội dung (`contents: read`); chỉ nâng quyền ở job thật sự cần.
- Pin action theo full-length commit SHA; Dependabot cập nhật action và dependency.
- Logic phức tạp nằm trong script, không nằm trong YAML.
- Mỗi workflow của sản phẩm có comment đầu file nêu work item mà nó thực hiện (mục 12.3).

---

# 11. Release và Deploy Workflow

## 11.1. Hai luồng phát hành

| Luồng | Tag | Workflow | Tạo ra |
|---|---|---|---|
| Sản phẩm | `v<MAJOR>.<MINOR>.<PATCH>` (monorepo nhiều service: `<SCOPE>/v<...>`) | `ci.yml` → `deploy.yml` | Artifact có version, GitHub Release, bản deploy |
| Tài liệu | `baseline/<scope>/<version>` | `docs-baseline.yml` | Baseline tài liệu, Release kèm traceability matrix |

Hai luồng độc lập về tag và nhịp phát hành.

## 11.2. Release và deploy sản phẩm

Nguyên tắc: **build một lần, triển khai nhiều lần** — cùng một artifact đi qua các môi trường.

```text
Merge vào main
      ↓
CI tạo artifact (bất biến, có version)
      ↓
dev ──→ staging ──→ production
```

| Môi trường | Kích hoạt | Bảo vệ mặc định |
|---|---|---|
| dev | Tự động sau merge vào `main` | Không |
| staging | Tự động sau khi dev thành công | Chỉ nhánh `main` được deploy |
| production | Khi tạo release tag (hoặc thủ công) | Required reviewers; wait timer tùy chọn; chỉ `main` hoặc tag release được deploy |

Danh sách môi trường thực tế do Deploy Plan quyết định; bảng trên chỉ là mặc định.

- **Version:** theo SemVer, suy ra từ Conventional Commits: `feat` → MINOR, `fix` → PATCH, breaking → MAJOR. Có thể dùng công cụ sinh release từ lịch sử commit.
- **Release notes:** sinh từ tiêu đề pull request đã squash và liệt kê các ID `DPL-` hoàn thành.
- **Xác thực với hạ tầng:** dùng OIDC thay cho credential dài hạn; secret đặt theo environment, chỉ truy cập được sau khi qua các protection rule.
- **Gate:** `Gate` của Deploy Plan được hiện thực bằng environment protection rule và job kiểm tra sau deploy (smoke test); không định nghĩa lại ở đây.
- **Rollback:** ưu tiên triển khai lại artifact của version trước; hoặc revert pull request rồi đi qua cùng pipeline. Quy trình và người quyết định ghi ở `DPL-` loại Rollback.
- **Tuần tự hóa:** mỗi môi trường chỉ chạy một deploy tại một thời điểm (concurrency theo environment).
- **Hotfix:** theo mục 9; đi cùng pipeline, không có đường tắt.

## 11.3. Baseline tài liệu

- **Kích hoạt:** push tag `baseline/<scope>/<version>` (ví dụ `baseline/SYS/1.0`, `baseline/ORD/1.2`).
- **Thứ tự bắt buộc:** pull request chuyển `status` của các leaf trong phạm vi baseline sang `Baselined` được merge **trước**; tag gắn sau. Tag không sửa được file nên workflow chỉ xác minh.
- **Workflow kiểm tra:** chạy toàn bộ `docs-check`; mọi leaf trong phạm vi có `status: Baselined` và `version` khớp tag.
- **Kết quả:** tạo Release kèm ma trận traceability.

---

# 12. Evidence và liên kết với Plan

## 12.1. Nguyên tắc

`github-docs.md` **không chứa ID của plan và không trace tới plan**:

- Upstream của nó là các mục của `sdlc-docs.md` (mục 3), không phải Spec hay Design của sản phẩm. Plan thuộc sản phẩm cụ thể, còn tài liệu này dùng lại giữa các dự án.
- Nếu tài liệu này chứa ID của plan, nó trở thành tài liệu của một dự án và vi phạm tiêu chí Reusable.

Nó có các điểm chạm với Plan, luôn theo chiều **Plan → tài liệu này** hoặc **evidence → Plan**, không bao giờ ngược lại:

| Điểm chạm | Chiều trace | Ghi ở đâu |
|---|---|---|
| Chọn GitHub làm VCS/CI | Điều kiện áp dụng của tài liệu này trỏ về `STK-` | `tech-tool-stack.md`, `meta.md` (mục 1.4) |
| Thiết lập repo theo tài liệu này | Work item `FND-` (Repository & Scaffolding, Access & Configuration) `Covers` `STK-`; `Done when` tham chiếu checklist mục 16 | `foundation-setup-plan.md` hoặc `fsp.md` |
| Cách làm việc (branch, commit, review, CI, deploy) | `APC-` của Plan trích mục tương ứng ở tài liệu này (mục 12.2) | Plan `Approach` |
| Evidence của build, test, deploy | Evidence → `BLD-`, `TST-`, `DPL-`, `FND-` (mục 12.3) | Chính evidence |

## 12.2. Mặc định và quyết định của dự án

Một owner cho mỗi nội dung: tài liệu này sở hữu **mặc định**; Plan sở hữu **quyết định của dự án**.

| Nội dung | Mặc định (tài liệu này) | Quyết định của dự án ghi ở | Evidence |
|---|---|---|---|
| Branching, versioning, Definition of Done | Mục 6, 7, 9 | Build Plan `Approach` (`APC-`) | Ruleset, `ci.yml` |
| Test level, tool, defect handling, gate | Mục 5 (defect), 10 | Test Plan `Approach` (`APC-`), `Gate` | `ci.yml` |
| Release, rollout, rollback, môi trường | Mục 11 | Deploy Plan `Approach` (`APC-`), `DPL-` | `deploy.yml`, Environments |
| Thiết lập repo | Mục 13, 16 | Foundation Setup Plan (`FND-`) | Ruleset, `CODEOWNERS` |

- Dự án dùng mặc định: `APC-` chỉ cần trỏ "theo `github-docs.md` mục X".
- Dự án khác mặc định: ghi quyết định và lý do trong `APC-`; phần khác mặc định đó thuộc Plan, không sửa tài liệu này.

## 12.3. Quy ước gắn ID

Evidence mang ID work item để công cụ sinh ma trận nối được với Plan. Tài liệu này chỉ định nghĩa *cách gắn*, không định nghĩa ID.

| Evidence | Cách gắn ID | Ví dụ |
|---|---|---|
| Issue | Tiền tố trong tiêu đề | `[BLD-ORD-003] Create order` |
| Nhánh | `<type>/<ID>-<slug>` | `feat/BLD-ORD-003-create-order` |
| Commit | Footer `Refs:` | `Refs: BLD-ORD-003` |
| Pull request | Hậu tố trong tiêu đề, và mục "ID liên quan" | `feat(ORD): create order [BLD-ORD-003]` |
| Workflow của sản phẩm | Comment đầu file nêu ID work item | `# Evidence: DPL-SYS-002` |
| Test report | ID trong marker/tag/annotation của framework test | Test case gắn `TST-ORD-012` |
| Release | Release notes liệt kê các `DPL-` hoàn thành | — |

## 12.4. Quy tắc

- Pull request code có ít nhất một ID work item; pull request tài liệu ghi ID item bị đổi; thay đổi hệ thống tài liệu ghi `none`.
- Evidence chỉ mang ID, không chép nội dung Plan (`sdlc-docs.md` 11.1).
- `Implemented` và `Verified` của Spec item được cập nhật từ evidence qua ID này (`sdlc-docs.md` 3.4).

---

# 13. Ownership và cài đặt

## 13.1. CODEOWNERS

`CODEOWNERS` ánh xạ đường dẫn sang team GitHub. Trường `owner` trong front matter ghi *vai trò* (`sdlc-docs.md` 3.4); `CODEOWNERS` quyết định *team nào* đóng vai trò đó. Hai nơi không lặp thông tin của nhau.

Ví dụ (tên team chỉ minh họa):

```text
/docs/meta.md                          @org/doc-leads
/docs/system-docs/info.md              @org/analysts
/docs/system-docs/pi.md                @org/product-owners
/docs/system-docs/tech-tool-stack.md   @org/architects
/docs/system-docs/srs/                 @org/analysts
/docs/system-docs/dds/                 @org/architects
/docs/system-docs/plans/               @org/project-managers
/docs/service-docs/                    @org/service-leads
/.github/workflows/docs-*.yml          @org/doc-leads
/.github/workflows/ci.yml              @org/dev-leads
/.github/workflows/deploy.yml          @org/release-managers
/.github/                              @org/doc-leads
```

- Dòng khớp sau cùng thắng, nên đặt dòng chung trước, dòng cụ thể sau. Ghi đè theo từng service bằng dòng riêng cho thư mục của service đó.
- Chỉ có tác dụng khi ruleset bật "Require review from Code Owners" (mục 13.3).
- Mỗi repo có `CODEOWNERS` riêng; nó không được thừa kế từ repo khác.

## 13.2. Template

**Pull request template** — dùng chung cho cả ba loại thay đổi:

```markdown
## Loại thay đổi
- [ ] Tài liệu (`docs/`)
- [ ] Hệ thống tài liệu (`.github/`, `tools/`)
- [ ] Code sản phẩm

## ID liên quan
<!-- Tài liệu: ID item bị đổi (ví dụ FR-ORD-003).
     Code: work item (ví dụ BLD-ORD-003, TST-ORD-012).
     Hệ thống tài liệu: ghi "none". -->

Closes #

## Impact analysis (với tài liệu)
- Item trỏ tới ID thay đổi (Basis, Realizes, Covers, Uses):
- Downstream đã cập nhật:

## Checklist
- [ ] Tiêu đề theo `<type>(<SCOPE>): <subject> [<ID>]`
- [ ] Sửa tại owner, không copy nội dung
- [ ] Tài liệu liên quan đã cập nhật trong cùng pull request; Status và version đã cập nhật
- [ ] Item Baselined: có issue change request (#...)
- [ ] Work item hoàn thành: `Status` đã `Done` trong Plan
- [ ] Đạt bốn phép thử (`sdlc-docs.md` mục 13.1)
- [ ] CI và `docs-check` xanh
```

**Issue template** — issue form (YAML); `config.yml` tắt issue trống để buộc chọn template:

| Template | Trường chính |
|---|---|
| `work-item.yml` | ID work item, liên kết tới leaf Plan, `Depends on` đã Done chưa, SCOPE (trỏ tới `Done when`, không chép) |
| `change-request.yml` | ID bị đổi, lý do, impact dự kiến, phương án thay thế |
| `new-service.yml` | Mã service (SCOPE), loại unit, facet cần dùng (`core` luôn có; `data`, `api`, `ui-ux` theo responsibility), `ARC-` của service đã Approved chưa |
| `defect.yml` | ID bị vi phạm (`TST-` hoặc Spec ID), môi trường, bước tái hiện, mức độ |

## 13.3. Ruleset và branch protection

Cài đặt trong Settings của repo, không phải file trong `.github/`. Thiếu các cài đặt này thì `CODEOWNERS`, CI và `docs-check` không có tính bắt buộc.

| Cài đặt | Giá trị | Phục vụ |
|---|---|---|
| Nhánh mặc định: yêu cầu pull request | Bật; không push trực tiếp | Mục 8 |
| Số approval tối thiểu | ≥ 1 | Mục 9 |
| Require review from Code Owners | Bật | Mục 13.1 |
| Dismiss stale approvals khi có commit mới | Bật | Mục 9 |
| Require conversation resolution | Bật | Mục 9 |
| Required status checks | `ci-passed`, `docs-check` | Mục 10.2 |
| Cách merge | Chỉ squash; commit message mặc định lấy từ tiêu đề pull request | Mục 7, 9 |
| Tự xóa nhánh sau merge | Bật | Mục 6 |
| Force push và xóa nhánh mặc định | Chặn | — |
| Merge queue | Tùy chọn; workflow phải có trigger `merge_group` | Mục 9 |
| Tag ruleset `baseline/*` | Chỉ team quản trị được tạo; không sửa, không xóa | Mục 11.3 |
| Tag ruleset `v*` (hoặc `<SCOPE>/v*`) | Chỉ release manager hoặc CI được tạo; không sửa, không xóa | Mục 11.2 |
| Bypass | Hạn chế tối đa, có ghi nhận | Mục 9 (hotfix) |

## 13.4. Environments

| Cài đặt | Giá trị mặc định |
|---|---|
| Environment | Một cho mỗi môi trường ở mục 11.2 |
| Required reviewers | Bật cho production (team release/vận hành) |
| Wait timer | Tùy chọn cho production |
| Deployment branches/tags | Giới hạn ở `main` và tag release |
| Secrets | Đặt theo environment, không đặt ở cấp repo |

Environment protection rule và environment secret có sẵn cho repo công khai ở mọi gói; với repo riêng tư cần gói trả phí (Pro, Team hoặc Enterprise). Kiểm tra gói trước khi dựa vào cơ chế này.

## 13.5. Bảo mật mặc định

- `permissions` tối thiểu ở cấp workflow, nâng quyền theo job (mục 10.4).
- Pin action theo full-length commit SHA; bật Dependabot cho `github-actions` và dependency của sản phẩm.
- Không lưu credential dài hạn: dùng OIDC tới hạ tầng; secret theo environment (mục 11.2).
- Bật secret scanning kèm push protection và dependency review; code scanning (CodeQL) tùy chọn, có thể quét cả workflow.

Tên và vị trí cài đặt thay đổi theo giao diện GitHub; đối chiếu tài liệu GitHub khi cấu hình.

---

# 14. Một repo và nhiều repo

- **Một repo:** `docs/`, `.github/`, `tools/` và code cùng repo. Đơn giản nhất. Workflow `docs-*` và workflow sản phẩm cùng nằm trong `.github/workflows/`; tiền tố `docs-` và `CODEOWNERS` phân biệt owner.
- **Nhiều service trong một repo (monorepo):** mỗi service một nhóm job hoặc một workflow gọi reusable workflow; phát hiện thay đổi bằng điều kiện cấp job (mục 10.2); tag release theo `<SCOPE>/v<...>`.
- **Nhiều repo** (`service-docs/` nằm trong repo của unit, `sdlc-docs.md` 2.2):
  - Mỗi repo có `CODEOWNERS` và ruleset riêng.
  - Phần dùng chung đặt ở repo trung tâm: workflow kiểm tra được gọi từ từng repo bằng reusable workflow; template pull request và issue mặc định lấy từ repo `.github` cấp tổ chức.
  - Reference chéo repo (Service Spec trỏ về System Spec hoặc `ARC-`) cần `docs-check` truy cập được repo upstream; đây là điểm cần quyết định khi chuyển sang nhiều repo.

---

# 15. Hướng dẫn AI

`copilot-instructions.md` chỉ chứa **con trỏ và các điểm bắt buộc**, không chép luật:

- Đọc Registry (`sdlc-docs.md` 3.2) trước để biết leaf nào trả lời câu hỏi nào.
- Nạp theo ID, không nạp cả cây (`sdlc-docs.md` 14.5).
- Không tự tạo nội dung thuộc owner khác; nếu thiếu upstream, ghi vào `Assumptions & Open Issues` hoặc đề xuất thay đổi tại owner.
- Dùng đúng scheme ID (`sdlc-docs.md` 12); không tự đặt ID mới ngoài scheme.
- Khi tạo nhánh, commit, pull request: theo mục 6, 7, 8 (tên nhánh, Conventional Commits, tiêu đề có ID).
- Không sửa workflow hoặc ruleset để vượt qua check; đề xuất thay đổi qua pull request cho owner.

Tên và cơ chế của file hướng dẫn thay đổi theo công cụ AI; nội dung luôn chỉ trỏ về `sdlc-docs.md` mục 14.5 và tài liệu này.

---

# 16. Lộ trình bắt đầu tối thiểu

| Giai đoạn | Làm gì | Kết quả |
|---|---|---|
| 1 | `CODEOWNERS`, ruleset (mục 13.3), pull request template, `ci.yml` (`validate`, `test`, `build`, `ci-passed`), `docs-check` với front matter, ID, reference; quy ước branch, commit, `pr-title` | Có owner, có quy trình pull request, có CI và kiểm tra tài liệu cơ bản |
| 2 | Issue template, Project board, `docs-check` đầy đủ (orphan, cấu trúc cây, change control, ma trận), Dependabot, bảo mật mặc định (mục 13.5) | Kiểm tra đủ theo `sdlc-docs.md` 14.4; quy trình issue hoàn chỉnh |
| 3 | `deploy.yml` với Environments, tag release và release notes, `docs-baseline.yml`, tag ruleset, `copilot-instructions.md` | Release/deploy có kiểm soát; chốt baseline; AI dùng đúng quy trình |
| 4 | Merge queue, reusable workflow, repo trung tâm, feature flag | Chỉ khi quy mô đòi hỏi |

Mục này đồng thời là checklist `Done when` cho work item `FND-` thiết lập repo (mục 12.1).

---

# 17. Bốn phép thử áp dụng cho tài liệu này

| Phép thử | Câu hỏi với tài liệu này |
|---|---|
| **Correct** — đúng với tên | Mỗi workflow ở mục 5–11 có mô tả đúng cách team làm việc ở bước đó không? Mỗi file trong `.github/` có thực hiện đúng một quy tắc ở mục 3 không? |
| **Complete** — đủ nội dung | Mỗi bước của luồng ở mục 4 có một mục mô tả và một chỗ máy thực hiện không? Mỗi quy tắc liên quan của `sdlc-docs.md` (1.2, 2.2, 3.4, 9.4–9.6, 11.1, 13.2, 14.2–14.5) có chỗ thực hiện ở mục 3 không? |
| **Abstract** — trừu tượng ở mức chi tiết | Mô tả stage, gate, quy ước mà không khóa ngôn ngữ, công cụ test, lệnh build hay đích deploy của một dự án không? Ví dụ chỉ để minh họa không? |
| **Reusable** — tái sử dụng | Có chứa quy tắc hay ID của một dự án cụ thể không? Có định nghĩa lại điều đã có ở `sdlc-docs.md` không? Quyết định riêng của dự án có nằm ở Plan thay vì ở đây không? Chuyển sang dự án khác có phải sửa không? |

---

# 18. Đối chiếu thực hành thị trường

| Thành phần | Thực hành / chuẩn tham chiếu |
|---|---|
| Luồng issue → branch → pull request → review → merge | GitHub flow: workflow nhẹ dựa trên nhánh, review qua pull request, liên kết issue, xóa nhánh sau merge |
| Nhánh ngắn, merge thường xuyên | Trunk-based development; feature flag để ẩn công việc dở dang |
| Commit và version | Conventional Commits 1.0.0; Semantic Versioning |
| Review và ownership | `CODEOWNERS`; ruleset/branch protection: required review, required status check |
| Required check | Không dùng path/branch filter cho workflow required; job tổng hợp (`ci-passed`) |
| Merge queue | Cần trigger `merge_group`; khả dụng tùy gói |
| Bảo mật workflow | Quyền tối thiểu cho `GITHUB_TOKEN`; pin action theo SHA; OIDC; Dependabot |
| Deploy có kiểm soát | GitHub Environments: required reviewers, wait timer, deployment branches, environment secrets |
| Build once, deploy many | Artifact bất biến được promote qua các môi trường |
| Baseline tài liệu | Git tag và GitHub Releases |
| Hướng dẫn AI | File custom instructions của công cụ AI đang dùng |
