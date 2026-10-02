# AGENTS.md

Behavioral guidelines for AI coding agents working in this repository.

These rules prioritize correctness, simplicity, minimal scope, and verification over speed.
Use repository-specific instructions when they are more specific than these guidelines.

---

## 1. Understand Before Acting

**Inspect first. Do not guess when the repository can answer the question.**

Before making changes:

- Read the relevant files and understand the existing implementation.
- Inspect project structure, configuration, dependencies, and existing tests when relevant.
- Search for existing implementations before creating new ones.
- Infer conventions from surrounding code and follow them.
- State important assumptions only when they materially affect the implementation.
- If ambiguity can be resolved by inspecting the repository, inspect it instead of asking.
- Ask the user only when the ambiguity cannot reasonably be resolved from the codebase or task context.
- If multiple valid approaches exist, choose the simplest one that fits the existing architecture and briefly explain the tradeoff.

**Do not start coding based only on the task description when repository context is available.**

---

## 2. Plan Before Editing

**Turn the request into a small, verifiable execution plan.**

For non-trivial tasks:

1. Identify the relevant files and components.
2. Determine the smallest change that satisfies the request.
3. Identify how the change will be verified.
4. Implement in small, logical steps.
5. Run the appropriate checks after implementation.

Keep the plan proportional to the task.

Do not create elaborate plans for trivial changes.

---

## 3. Simplicity Over Abstraction

**Implement the minimum solution that completely solves the problem.**

- Do not add features that were not requested.
- Do not introduce abstractions for one-time use.
- Do not add configurability without a concrete requirement.
- Do not introduce new dependencies unless necessary.
- Prefer existing utilities, patterns, and dependencies already used by the project.
- Avoid speculative architecture.
- Avoid premature optimization.
- Prefer straightforward code over clever code.

Before finalizing, ask:

> Is this the simplest implementation that satisfies the requirements?

If not, simplify it.

---

## 4. Surgical Changes

**Change only what is necessary.**

When modifying an existing codebase:

- Touch only files relevant to the task.
- Preserve existing architecture and conventions unless the task requires changing them.
- Do not refactor unrelated code.
- Do not reformat unrelated files.
- Do not rename unrelated variables, functions, files, or APIs.
- Do not rewrite working code merely because you prefer another style.
- Do not remove unrelated dead code.
- Do not modify comments unless they become incorrect because of your changes.

If your changes create unused imports, variables, functions, or dependencies, remove those.

Every changed line should have a clear connection to the requested task or to correctness of the resulting implementation.

---

## 5. Reuse Before Creating

**Search before adding.**

Before creating a new:

- component
- utility
- hook
- service
- API client
- type
- helper
- configuration
- test utility

search the repository for an existing equivalent.

Prefer extending or reusing existing code when appropriate.

Do not create duplicate implementations simply because the existing implementation is located somewhere unexpected.

---

## 6. Preserve Existing Contracts

**Do not break behavior outside the requested scope.**

Before changing an API, component, function, schema, database model, or shared utility:

- Identify its callers and consumers.
- Understand its current contract.
- Check existing tests.
- Consider backwards compatibility where relevant.

If a breaking change is necessary, make it explicit and update affected consumers and tests.

---

## 7. Goal-Driven Implementation

**Define what "done" means before considering the task complete.**

Translate vague requests into observable outcomes.

Examples:

- "Fix the bug"→ Reproduce the bug, implement the fix, verify the reproduction no longer fails.
- "Add validation"→ Identify invalid inputs, add coverage for them, implement validation, verify valid inputs still work.
- "Refactor X"→ Preserve existing behavior and verify the relevant test suite still passes.
- "Add a feature"
  → Implement the requested behavior and verify the main success and failure paths.

Do not consider a task complete merely because the code compiles or looks correct.

---

## 8. Verify Your Work

**Never assume the implementation works. Verify it.**

After making changes, run the most relevant available checks:

1. Targeted tests for the changed behavior.
2. Type checking or compilation when applicable.
3. Linting/format checks when applicable.
4. Broader tests when the change could affect other parts of the system.

Prefer the smallest relevant verification first.

If a check fails:

- Determine whether the failure is caused by your changes.
- Fix the underlying issue.
- Re-run the check.
- Do not hide or ignore failures.

If verification cannot be performed, explicitly state what was not verified and why.

---

## 9. Test Behavior, Not Implementation Details

**Tests should protect observable behavior.**

When adding or changing tests:

- Prefer behavior-focused assertions.
- Reproduce bugs with regression tests when practical.
- Cover important edge cases introduced by the change.
- Avoid tests that merely duplicate implementation details.
- Do not add large test suites for trivial changes.

Do not modify or weaken existing tests just to make the implementation pass.

---

## 10. Handle Errors at the Right Boundary

**Do not over-engineer error handling.**

- Handle errors that can realistically occur.
- Follow the project's existing error-handling patterns.
- Validate external or user-controlled input where appropriate.
- Do not add defensive code for impossible states without a concrete reason.
- Do not silently swallow errors.
- Preserve useful error context.

Prefer fixing the source of an error over adding layers of defensive handling.

---

## 11. Respect the Repository

**The codebase is the source of truth for local conventions.**

Before making architectural decisions, inspect:

- existing patterns
- package/dependency choices
- naming conventions
- directory structure
- build scripts
- test setup
- CI configuration
- documentation
- repository-level agent instructions

More specific instructions override these general guidelines.

Do not impose personal preferences over established project conventions without a reason.

---

## 12. Keep Scope Under Control

**Do not turn a focused task into a cleanup project.**

If you discover unrelated issues:

- Do not fix them automatically.
- Do not delete unrelated code.
- Mention important findings in the final response when relevant.

Only expand scope when:

- the requested change requires it,
- the existing code prevents a correct implementation, or
- the user explicitly asks for broader cleanup/refactoring.

---

## 13. Work Autonomously, But Stay Within Scope

**The agent should make reasonable decisions without unnecessary user interaction.**

The agent may independently:

- inspect the repository,
- search for relevant code,
- choose between equivalent implementation approaches,
- run tests and checks,
- fix issues caused by its own changes,
- iterate until verification succeeds.

Ask the user only when a decision requires information that cannot be reliably inferred from the repository or request.

Do not stop for permission to perform normal engineering steps.

Do not make product, architectural, or behavioral assumptions that materially change the requested outcome.

---

## 14. Keep the Diff Reviewable

**A good implementation should be easy to review.**

Before finishing:

- Inspect the final diff.
- Remove accidental changes.
- Remove temporary files and debugging code.
- Confirm formatting is consistent.
- Confirm no unrelated files were modified.
- Confirm the implementation matches the requested scope.

The final diff should tell a simple story:

> Request → necessary changes → verified result.

---

## 15. Final Response

After completing a task, report concisely:

- What changed.
- What was verified.
- Any relevant limitations or unresolved issues.

Do not provide a long narrative of every action taken.

If verification failed, say so clearly instead of presenting the task as complete.

---

## Core Principle

**Inspect → Plan → Implement → Verify → Review**

Prefer:

- evidence over assumptions,
- existing patterns over new abstractions,
- minimal changes over broad refactors,
- autonomous execution over unnecessary questions,
- verified results over "it should work."
