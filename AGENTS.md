# Project Operating Guidelines (AGENTS.md)

## 0. Tool Isolation Boundary
- Harness scripts (`bounded_run`, `repo_map`, `scaffold`, `verify_contracts`, `ast-grep`) belong to the agent environment. NEVER copy or commit them into the repository. Invoke via global CLI or environment path.

## 1. Agent Environment Stack
- **Discovered Host Toolchains:** ast-grep, curl, docker, docker-compose, dotnet, flaui, gh, git, jq, kubectl, mvn, node, npm, playwright, pytest, python
- **Harness & Guards:**
  - Wrap commands: `bounded_run "<cmd>"`
  - Viewport slice: `bounded_run view <file> --line <N> --window <W>`
  - Structural AST map: `.agent/repo_map.txt` (via `repo_map`)
- **State & Memory:**
  - Task session: `.agent/tasks/<id>.md` (`task-handoff`)
  - Invariants: MCP `memory` (`create_entities`, `read_graph`)
  - AST refactor: MCP `ast-grep` (`find_code`, `rewrite_code`)

## 2. Target Project Stack
- **Docker Services:** fas-postgres, fas-backend, fas-web
- **Services:**
  - `app/backend-service`: Java 21 / Spring Boot & Maven
  - `app/kiosk-app`: Python
  - `app/web-portal`: React / TypeScript

## 3. Mandatory Verification Commands
- backend-service test: `bounded_run "cd app/backend-service && ./mvnw test"`
- backend-service lint: `bounded_run "cd app/backend-service && ./mvnw checkstyle:check"`
- kiosk-app test: `bounded_run "cd app/kiosk-app && pytest"`
- kiosk-app lint: `bounded_run "cd app/kiosk-app && ruff check ."`
- web-portal test: `bounded_run "cd app/web-portal && npm test"`
- web-portal lint: `bounded_run "cd app/web-portal && npm run lint"`
- Run `verification-before-completion` before declaring work done.

# SDLC Agent Skills — portable index

Load skills on demand; never paste full catalog into context.
- **Router:** `skills/using-sdlc-skills/SKILL.md` (classifies task, selects workflow & skills).
- **Workflows:** `./workflows/` (full-sdlc, feature-loop, bug-fix, quick-change).
- **Templates & Tasks:** `./templates/` | `.agent/tasks/<id>.md`.
- Do not claim checks passed unless run. Stop for human approval before destructive actions.