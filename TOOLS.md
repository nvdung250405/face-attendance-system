# TOOLS.md

Development tools available to AI coding agents in this environment.

`AGENTS.md` defines how the agent should work. This file defines the tools available to perform that work.

---

## CLI Toolchain

| Tool           | Purpose                       | Use for                                                                                              |
| -------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `git`          | Version control               | status, diff, history, branches, commits                                                             |
| `gh`           | GitHub CLI                    | issues, pull requests, reviews, CI runs, releases                                                    |
| `rg`           | Fast code search              | source code, config, text search                                                                     |
| `jq`           | JSON processing               | parse/filter JSON from APIs and CLI tools                                                            |
| `curl`         | HTTP/API client               | call endpoints, inspect responses, debug services                                                    |
| `docker`       | Containers                    | run services, reproduce environments, inspect containers                                             |
| `playwright`   | Web UI & a11y automation      | browser automation, E2E tests, UI & axe-core accessibility verification                              |
| `schemathesis` | API testing                   | OpenAPI/GraphQL contract testing, fuzzing, property-based tests                                      |
| `semgrep`      | Static analysis (SAST)        | code vulnerability scanning, security rule auditing                                                  |
| `trivy`        | Security scanner              | container images, filesystem, dependencies                                                           |
| `just`         | Command runner                | execute commands defined by the repository's `justfile`                                              |
| `flaui`        | Windows desktop UI automation | automate and test Windows desktop applications, including Qt/QML apps where UI Automation is exposed |

---

## Tool Selection

Use the smallest appropriate tool for the task.

### Repository and source

```powershell
git status
git diff
git log
rg "pattern"
```

- Use `rg` for repository-wide search.
- Use `git` for local source-control operations.

### GitHub

```powershell
gh issue list
gh pr view <number>
gh pr checks <number>
```

- Use `gh` for GitHub operations.
- Prefer structured output when available:

```powershell
gh <command> --json <fields>
```

### JSON and APIs

```powershell
curl <url>
curl -I <url>
```

Pipe JSON output through `jq` when useful:

```powershell
... | jq
... | jq '.items[]'
```

- Use `curl` for HTTP/API interaction.
- Use `jq` for JSON parsing/filtering.

### Containers

```powershell
docker ps
docker images
docker compose up
docker compose down
docker logs <container>
docker exec -it <container> <command>
```

Use Docker when the project or task requires containerized services or reproducible environments.

Avoid destructive cleanup unless it is required and safe.

### Project commands

If the repository contains a `justfile`, prefer its recipes:

```powershell
just
just test
just build
just lint
```

Do not recreate a project command manually when an existing `just` recipe already provides the required operation.

### Web UI

Use Playwright for browser-based UI automation:

```powershell
playwright --version
```

Typical uses:

- launch browser
- navigate and interact with UI
- submit forms
- verify visible state
- take screenshots
- run E2E tests
- run automated accessibility (a11y) audits with axe-core (`@axe-core/playwright`)

Only install/use additional browser engines when cross-browser testing is actually required. Chromium is the default available browser environment.

### API Testing

Use Schemathesis for contract and property-based API testing:

```powershell
schemathesis --version
schemathesis run <schema-url-or-path> --checks all
```

Typical uses:

- fuzz backend API endpoints against OpenAPI/Swagger specifications
- verify response schema conformance and HTTP status code contracts
- detect unhandled exceptions and server 5xx errors

### Windows Desktop UI

Use FlaUI CLI for desktop UI automation:

```powershell
flaui --version
flaui --help
```

Available capabilities include:

```text
session     → manage application sessions
elem        → find and interact with UI elements
window      → manage application windows
wait        → wait for UI conditions or window titles
record      → record/manage interaction steps
audit       → inspect selector quality and AutomationIds
batch       → execute multiple UI commands
screenshot  → capture screenshots
```

Typical uses:

- launch and drive desktop applications
- inspect the Windows UI Automation tree
- find controls and interact with them
- enter text and trigger actions
- wait for UI state
- capture screenshots
- verify desktop UI behavior

For Qt/QML applications, use FlaUI when the application exposes the relevant UI through Windows UI Automation.

### Security

Use Semgrep for static application security testing (SAST) and Trivy for vulnerability and dependency scanning:

```powershell
# Semgrep (SAST)
semgrep scan --config auto
semgrep scan --config "p/owasp-top-ten"

# Trivy (SCA & Container Security)
trivy fs .
trivy image <image>
```

Typical uses:

- scan source code for security vulnerabilities, bugs, and insecure patterns (Semgrep)
- inspect dependencies, filesystems, and container images for known CVEs (Trivy)

---

## Tool Usage Principles

- Prefer CLI tools over manual GUI operations when the task can be completed reliably from the terminal.
- Prefer existing repository tooling and commands over introducing new tooling.
- Prefer machine-readable output (`--json`, JSON, exit codes) when available.
- Chain tools when that improves reliability or reduces manual interpretation.
- Inspect command output and errors instead of assuming success.
- Do not use a tool outside its intended scope when a more appropriate tool exists.
- Do not perform destructive operations merely for convenience.

---

## Capability Map

```text
Source control       → git
GitHub               → gh
Code search          → rg
JSON                 → jq
HTTP/API             → curl
Containers           → docker
Project commands     → just
API testing          → schemathesis
Web UI & A11y        → playwright (+ axe-core)
Static security SAST → semgrep
Vulnerability & SCA  → trivy
Desktop UI           → flaui
```

For agent behavior, decision-making, verification, scope control, and repository conventions, follow `AGENTS.md`.
