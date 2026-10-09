# Quy trình GitHub cho SDLC

## 1. Mục đích và Phạm vi

Implementation profile của [docs/sdlc-docs.md](../docs/sdlc-docs.md) trên nền tảng GitHub: từ issue đến deploy và tự động hóa CI/CD. Đổi nền tảng (GitLab, Azure DevOps...) thì thay tài liệu này, không sửa `sdlc-docs.md`.

| Lớp       | Thành phần                 | Trách nhiệm                             |
| --------- | -------------------------- | --------------------------------------- |
| Quy trình | `github-docs.md`           | Team làm việc với GitHub như thế nào?   |
| Thực thi  | `.github/` & Repo Settings | Tự động hóa và ép buộc quy tắc qua máy. |
| Nội dung  | `docs/` & `app/`           | Tài liệu SDLC và mã nguồn sản phẩm.     |

- **Trong phạm vi:** Issue, branch, commit, PR, review/merge, CI/CD, release, CODEOWNERS, templates, repo settings, evidence trace, hướng dẫn AI.
- **Ngoài phạm vi:** Nội dung, cấu trúc, schema, ID tài liệu (`sdlc-docs.md`); quyết định công nghệ/lệnh cụ thể của dự án (STACK, PLAN).
- **Điều kiện áp dụng:** Khi `tech-tool-stack.md` (`STK-`) chọn GitHub làm VCS và CI/CD platform.

---

## 2. Cấu trúc `.github/`

```text
.github/
├── github-docs.md                   # Quy trình làm việc GitHub
├── CODEOWNERS                       # Phân quyền review theo đường dẫn
├── PULL_REQUEST_TEMPLATE.md         # Template pull request
├── ISSUE_TEMPLATE/
│   ├── config.yml                   # Cấu hình chọn template
│   ├── work-item.yml                # Thực thi work item (FND-, BLD-, TST-, DPL-, TASK-)
│   ├── change-request.yml           # Yêu cầu sửa item đã Baselined
│   ├── new-subsystem.yml            # Khởi tạo subsystem/unit mới
│   └── defect.yml                   # Báo cáo lỗi vi phạm test/spec
├── workflows/
│   ├── docs-check.yml               # Kiểm tra tính toàn vẹn tài liệu SDLC
│   ├── docs-baseline.yml            # Chốt baseline tài liệu khi gắn tag (tùy chọn)
│   ├── ci.yml                       # CI sản phẩm: validate, test, build, artifact
│   └── deploy.yml                   # Release và deploy sản phẩm (tùy chọn)
├── dependabot.yml                   # Cập nhật actions và dependencies (tùy chọn)
└── copilot-instructions.md          # Hướng dẫn AI (trỏ về docs)
```

- Workflow `docs-*` thuộc quản trị tài liệu. `ci.yml` và `deploy.yml` thuộc sản phẩm.
- Logic kiểm tra nằm trong script (`tools/docs-check/`); YAML chỉ gọi thực thi.

---

## 3. Ánh xạ Quy tắc SDLC sang GitHub

| Quy tắc (`sdlc-docs.md`)                | Thực thi trên GitHub                                                 | Mục           |
| --------------------------------------- | -------------------------------------------------------------------- | ------------- |
| §1.1 Lifecycle & Evidence               | Gắn ID vào issue, branch, commit, PR, workflow, test report, release | §4, §12       |
| §2 Cấu trúc System/Subsystem            | `system-docs/`, `subsystem-docs/`, phân quyền `CODEOWNERS`           | §2, §13       |
| §3.1 Conventions, Front matter & Status | Kiểm tra tự động trong `docs-check`                                  | §10.3         |
| §9 & §10 Đơn sở hữu (SSOT) & ID Scheme  | `CODEOWNERS` và bắt buộc review từ Code Owner; kiểm tra qua CI       | §9, §13.1     |
| §10 Danh mục ID và ownership            | Ép buộc qua Conventional Commits, branch format và `docs-check`      | §6, §7, §10.3 |
| §11.2 Sáu phép thử chất lượng           | Tiêu chí human review trong Pull Request                             | §8, §9        |
| §11.3 & §12.4 Structural Rules & CI     | Required status checks (`ci-passed`, `docs-check`)                   | §10.2, §10.3  |
| §12.2 Thêm subsystem mới                | Issue template `new-subsystem.yml`                                   | §5            |
| §12.3 Quản lý thay đổi & Baselined      | Issue `change-request.yml`, tag `baseline/...`, Release              | §5, §11.3     |
| §12.5 Hướng dẫn AI                      | `copilot-instructions.md`                                            | §15           |

---

## 4. Quy trình Tổng thể

```text
Issue ──→ Branch ──→ Commit ──→ Pull Request ──→ CI (validate · docs-check · test · build)
  │                                                    │
  └────────────────── Done / Merge ◄─── Review ◄───────┘
                        │
                        ▼
                     Release ──→ Deploy (dev → staging → production)
```

| Bước             | Thủ công                                                | Tự động hóa                                            |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| **Issue**        | Tạo/triage từ Plan work item, CR, subsystem mới, defect | Issue forms, labels, Projects                          |
| **Branch**       | Nhánh ngắn từ nhánh chính                               | Ruleset chặn direct push                               |
| **Commit**       | Conventional Commits                                    | Commit lint (hook/action)                              |
| **Pull Request** | Mở draft sớm, điền template, gắn link issue             | Template, pr-title check, auto-request code owners     |
| **CI**           | —                                                       | `validate`, `docs-check`, `test`, `build`, `ci-passed` |
| **Review**       | Kiểm tra code & docs theo 6 phép thử                    | Ruleset bắt buộc Code Owner review                     |
| **Merge**        | Squash merge                                            | Auto-delete branch, auto-close issue                   |
| **Release**      | Tạo tag release theo SemVer                             | Build immutable artifact, release notes                |
| **Deploy**       | Phê duyệt môi trường được bảo vệ                        | Environments protection rules                          |

Nguyên tắc: **1 thay đổi = 1 issue = 1 nhánh ngắn = 1 PR = 1 commit squash trên nhánh chính**. Mọi bước đều mang ID truy vết.

---

## 5. Issue Workflow

| Loại               | Mục đích                        | Mang ID                                 | Template             |
| ------------------ | ------------------------------- | --------------------------------------- | -------------------- |
| **Work item**      | Thực thi work item từ Plan      | `FND-`, `BLD-`, `TST-`, `DPL-`, `TASK-` | `work-item.yml`      |
| **Change request** | Đổi item đã Baselined (§12.3)   | ID item bị thay đổi                     | `change-request.yml` |
| **New subsystem**  | Thêm subsystem/unit mới (§12.2) | Mã SCOPE subsystem                      | `new-subsystem.yml`  |
| **Defect**         | Lỗi vi phạm test hoặc spec      | `TST-` hoặc Spec ID vi phạm             | `defect.yml`         |

- **Tiêu đề:** `[<ID>] <Tóm tắt>`
- **Đơn sở hữu:** Issue là tracking thực thi, không sao chép spec/design/plan.
- **Ready when:** Có ID; mọi `Depends on` đã `Done`; subsystem có `ARC-` liên quan đã `Approved`.
- **Defect:** Fix qua PR `fix` và bắt buộc bổ sung test (`TST-`) chống hồi quy.

---

## 6. Branch Workflow

GitHub Flow + Trunk-based discipline:

- Nhánh chính (`main`/`develop`) luôn sẵn sàng release.
- Nhánh ngắn: sống vài giờ đến 2 ngày, xóa ngay sau merge.
- Định dạng: `<type>/<ID>-<slug>` (vd: `feat/BLD-BE-001-user-entity`, `docs/FR-KSK-001-oval-gate`, `fix/BLD-WEB-005-sidebar`).
- Docs-as-code: Thay đổi code kéo theo tài liệu thì sửa chung trong cùng nhánh và PR.

---

## 7. Commit Workflow

Định dạng Conventional Commits: `<type>(<SCOPE>)[!]: <subject>`

| Type                                                         | Ý nghĩa                         | SemVer |
| ------------------------------------------------------------ | ------------------------------- | ------ |
| `feat`                                                       | Tính năng mới                   | MINOR  |
| `fix`                                                        | Sửa lỗi                         | PATCH  |
| `docs`                                                       | Thay đổi tài liệu (`docs/`)     | Không  |
| `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert` | Kỹ thuật, kiểm thử, CI, phụ trợ | Không  |
| `!` hoặc `BREAKING CHANGE:`                                  | Phá vỡ tương thích              | MAJOR  |

- **Footer:** `Refs: <ID>` để liên kết truy vết.
- **PR Title:** `<type>(<SCOPE>): <subject> [<ID>]` (trở thành commit squash trên nhánh chính).

---

## 8. Pull Request Workflow

1. Mở Draft PR sớm; chuyển Ready for Review khi tự kiểm tra xong và CI xanh.
2. 1 PR giải quyết 1 mục đích, liên kết issue bằng từ khóa đóng (`Closes #n`).
3. Điền đầy đủ [PULL_REQUEST_TEMPLATE.md](PULL_REQUEST_TEMPLATE.md).
4. Cập nhật tài liệu liên quan trong cùng PR; chuyển `Status` work item thành `Done` trong Plan tương ứng.
5. Code Owner được tự động gán review qua `CODEOWNERS`.

---

## 9. Review & Merge Workflow

### 9.1. Tiêu chí Review

| Loại PR      | Trọng tâm Thẩm định                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **Tài liệu** | 6 phép thử (§12.1); impact analysis; sửa tại owner, không copy; cập nhật version/status.                |
| **Code**     | Thỏa mãn `Done when` của work item; có test bao phủ; không tự tạo requirement/design ngoài Spec/Design. |
| **Workflow** | Tuân thủ quy trình; YAML không chứa luật ngoài tài liệu.                                                |

### 9.2. Definition of Done (DoD)

1. Required checks (`ci-passed`, `docs-check`) xanh.
2. Tối thiểu 1 approval từ Code Owner; tác giả không tự approve.
3. Mọi conversation đã `Resolved`.
4. `Done when` của work item được đáp ứng kèm test evidence.
5. Tài liệu liên quan đã đồng bộ; `Status` trong Plan đã chuyển `Done`.

### 9.3. Merge

- Bắt buộc **Squash and Merge**; commit message lấy từ tiêu đề PR. Tự động xóa nhánh sau merge.

---

## 10. CI Workflow

### 10.1. Mô hình Stage

```text
Push / PR ──→ Validate ──→ Test ──→ Build ──→ Artifact ──→ Aggregate (ci-passed)
```

| Stage         | Nội dung                                                     | Trigger              | Check Name               |
| ------------- | ------------------------------------------------------------ | -------------------- | ------------------------ |
| **Validate**  | Lint, format, typecheck, pr-title, secret scan, `docs-check` | PR, push nhánh chính | `validate`, `docs-check` |
| **Test**      | Unit test, integration test                                  | PR, push nhánh chính | `test`                   |
| **Build**     | Biên dịch, đóng gói                                          | PR, push nhánh chính | `build`                  |
| **Artifact**  | Đóng gói artifact bất biến                                   | Push nhánh chính     | —                        |
| **Aggregate** | Tổng hợp kết quả toàn bộ stage                               | PR, push nhánh chính | `ci-passed`              |

### 10.2. Nguyên tắc Trigger & Required Checks

- Không dùng path/branch filter ở cấp workflow cho required check (tránh check kẹt "Pending").
- Path filtering đặt ở **cấp job**.
- `ci-passed` là required check tổng hợp (`needs: [validate, test, build]`).

### 10.3. `docs-check` Validation Gate (§12.4)

Tự động kiểm tra tính hợp lệ của tài liệu SDLC:

- **Front matter:** Đầy đủ `title`, `version` (MAJOR.MINOR), `status`, `owner` (§3.1).
- **ID & Scheme:** Đúng định dạng (§10), duy nhất toàn repo, không tái sử dụng.
- **Reference:** Mọi liên kết `Basis`, `Realizes`, `Covers`, `Uses`, `Requires`, `Derived from`, `Depends on` trỏ tới ID tồn tại (§9, §11.3).
- **Structural invariants:** `TASK-` và `BLD-` chỉ ở Subsystem; System `FND-` không có `TASK-`; `Gate` không có `Covers` (§12.4).
- **Tree structure:** Đủ cấu trúc `specs/`, `plans/` theo chuẩn cấp System và Subsystem (§2).
- **Change control:** Leaf `Baselined` bị sửa đổi phải tăng version và có Change Request (§12.3).

---

## 11. Release & Deploy Workflow

### 11.1. Hai Luồng Phát hành Độc lập

| Luồng        | Tag Format                         | Workflow                | Kết quả                                            |
| ------------ | ---------------------------------- | ----------------------- | -------------------------------------------------- |
| **Sản phẩm** | `v<M>.<m>.<p>` hoặc `<SCOPE>/v...` | `ci.yml` → `deploy.yml` | Immutable artifact, GitHub Release, deployment     |
| **Tài liệu** | `baseline/<scope>/<version>`       | `docs-baseline.yml`     | Baseline tài liệu, Release kèm traceability matrix |

### 11.2. Triển khai Sản phẩm (Build Once, Deploy Many)

```text
Artifact (bất biến) ──→ dev (tự động) ──→ staging (tự động) ──→ production (phê duyệt)
```

- **SemVer:** Suy ra từ commit (`feat` $\rightarrow$ MINOR, `fix` $\rightarrow$ PATCH, `!` $\rightarrow$ MAJOR).
- **Hạ tầng & Secrets:** GitHub OIDC tới cloud provider; secrets gắn theo GitHub Environment.
- **Rollback:** Redeploy artifact trước đó hoặc revert PR qua pipeline.

### 11.3. Baseline Tài liệu

1. PR chuyển `status: Baselined` cho các leaf trong scope và merge vào nhánh chính.
2. Gắn tag `baseline/<scope>/<version>`.
3. Workflow `docs-baseline.yml` xác thực toàn bộ kiểm tra và xuất ma trận truy vết vào GitHub Release.

---

## 12. Evidence & Traceability

`github-docs.md` không chứa ID cụ thể. Chiều liên kết: **Plan $\rightarrow$ Quy trình** hoặc **Evidence $\rightarrow$ Plan**:

| Evidence         | Cách gắn ID           | Ví dụ                                     |
| ---------------- | --------------------- | ----------------------------------------- |
| **Issue**        | Tiền tố tiêu đề       | `[BLD-BE-001] Khởi tạo Entity Người dùng` |
| **Nhánh**        | Tên nhánh             | `feat/BLD-BE-001-user-entity`             |
| **Commit**       | Footer                | `Refs: BLD-BE-001`                        |
| **Pull Request** | Tiêu đề               | `feat(BE): user entity [BLD-BE-001]`      |
| **Workflow CI**  | Header comment        | `# Evidence: DPL-SYS-001`                 |
| **Test Report**  | Test tag / annotation | `@Tag("TST-BE-001")`                      |
| **Release**      | Release notes         | Danh sách `DPL-` hoàn thành               |

---

## 13. Ownership & Cài đặt Kho lưu trữ

### 13.1. CODEOWNERS

Ánh xạ đường dẫn sang reviewer chịu trách nhiệm:

```text
/docs/meta.md                          @lead-architect
/docs/system-docs/                     @system-leads
/docs/subsystem-docs/                  @subsystem-leads
/.github/workflows/docs-*.yml          @doc-admins
/.github/workflows/ci.yml              @dev-leads
/.github/workflows/deploy.yml          @release-managers
/.github/                              @lead-architect
```

### 13.2. Bảo vệ Nhánh & Ruleset

- **Nhánh chính:** Bắt buộc PR; chặn direct push, force push, xóa nhánh.
- **Review:** Tối thiểu 1 approval từ Code Owner; tự động hủy approval khi có commit mới (`Dismiss stale approvals`).
- **Status check:** Bắt buộc `ci-passed` và `docs-check`.
- **Merge:** Bắt buộc Squash merge; bật tự động xóa nhánh (`Automatically delete head branches`).
- **Tag ruleset:** Khóa tag `baseline/*` và `v*` (chỉ CI / release manager được tạo; cấm sửa/xóa).

### 13.3. Bảo mật Workflow

- Quyền mặc định tối thiểu: `permissions: contents: read`.
- Ghim action theo full commit SHA hoặc major version rõ ràng.
- Bật Secret Scanning, Push Protection và Dependabot. Dùng OIDC, không lưu long-lived credentials.

---

## 14. Monorepo và Multi-repo

- **Monorepo:** Toàn bộ docs, code, workflows trong một repo. Phát hiện thay đổi bằng job-level path filter; tag release dạng `<SCOPE>/v...`.
- **Multi-repo:** Mỗi subsystem là repo riêng chứa `subsystem-docs/` và code. Workflows/templates dùng chung đặt tại repo `.github` cấp tổ chức; reference chéo repo kiểm tra qua downstream CI.

---

## 15. Hướng dẫn AI (`copilot-instructions.md`)

Trợ lý AI tuân thủ:

1. Đọc Tree, Conventions và Traceability trong `meta.md` và `sdlc-docs.md` trước; nạp theo ID, không nạp toàn bộ cây (§12.5).
2. Tôn trọng Single Source of Truth (§9, §10): sửa tại leaf owner, không duplicate hay tự tạo requirement.
3. Dùng đúng ID scheme (§10); nhánh, commit, PR luôn mang ID.
4. Không sửa workflow, linter hoặc ruleset để "lách" qua lỗi kiểm tra.

---

## 16. Checklist Thiết lập Kho lưu trữ

| Hạng mục                 | Thành phần                                             | Done when                                                                          |
| ------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **1. Phân quyền**        | `CODEOWNERS`, Branch Ruleset                           | Chặn direct push; bắt buộc Code Owner review; chỉ squash merge.                    |
| **2. Kiểm tra tài liệu** | `tools/docs-check/`, `docs-check.yml`                  | `docs-check` chạy trên mọi PR; xác thực front matter, ID, reference, orphan, tree. |
| **3. CI sản phẩm**       | `ci.yml`, `pr-title`                                   | Stage validate/test/build tự động; `ci-passed` xanh.                               |
| **4. Templates**         | PR & Issue templates                                   | Ép buộc điền template và gắn ID truy vết.                                          |
| **5. Release & Deploy**  | `deploy.yml`, Environments, `docs-baseline.yml`        | Phê duyệt môi trường; OIDC cấu hình; bảo vệ tag release & baseline.                |
| **6. An ninh & AI**      | Dependabot, secret scanning, `copilot-instructions.md` | Push protection bật; hướng dẫn AI trỏ đúng SDLC docs.                              |

---

## 17. Đối chiếu Thực tế

Chỉ ghi mapping không hiển nhiên; không phải tuyên bố tuân thủ.

| Thành phần               | Tham chiếu                                                   |
| ------------------------ | ------------------------------------------------------------ |
| Branching & Integration  | GitHub Flow, Trunk-based Development                         |
| Commit & Versioning      | Conventional Commits 1.0.0, Semantic Versioning 2.0.0        |
| Code Ownership & Review  | GitHub CODEOWNERS, GitHub Rulesets                           |
| CI Pipeline & Filtering  | Monorepo Path Filtering, Aggregate Status Check              |
| Deployment & Security    | Build Once Deploy Many, GitHub Environments, OIDC Federation |
| Documentation Governance | ISO/IEC/IEEE 29148, ISO/IEC/IEEE 12207, Docs-as-Code         |
