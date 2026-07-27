# Production Readiness Audit

Audited: 2026-07-27  
Scope: desktop application, packaged Pi runtime, bundled extensions, worker orchestration, release automation.

## Current release decision

**Do not release.** The typecheck, unit suites, bundle-reference check, and Vite build currently pass, but they do not exercise the worker lifecycle end to end. The items below must be resolved or explicitly accepted before a production release.

## Confirmed findings

| Severity | Finding | Affected flow | Required fix | Evidence required |
| --- | --- | --- | --- | --- |
| P0 | Task dispatch started a worker before validating its WorkPacket. | A malformed task could launch a worker without assignment context. | Validate the packet and persist `assignments/<task>.json` and `current.json` before startup or wake. | Invalid packet leaves task `todo`; runtime is never started. |
| P0 | No started agent registered with `MailboxWatcher`. | Worker questions and coordinator replies were persisted but did not wake recipients. | Register on managed start; unregister on stop; share one project-chat watch per project. | Worker question wakes coordinator; direct reply wakes worker; offline entries wake on next start. |
| P0 | Spawn and task dispatch bypassed provider reseeding and status mirroring. | Workers could start with stale/missing provider settings and inconsistent roster state. | Route every start through one managed lifecycle. | Manual, spawned, and dispatched workers receive the same provider configuration and status transitions. |
| P0 | Agent creation was marked active before Pi proved ready. | Failed child processes could appear active. | Wait for ready/error with a bounded timeout; persist actionable idle/error state on failure. | Simulated launch error and timeout remain idle and are visible to the coordinator/UI. |
| P1 | Runtime bundle validation checks only refs and file presence. | A sibling extension can differ from the executable `.runtime` copy. | Establish one generated bundle input and verify content hashes/manifests in CI. | CI rejects changed executable extension content without an approved bundle refresh. |
| P1 | Task-plan ingestion is permissive and destructive. | Malformed plans can silently skip work/dependencies and then clear the source file. | Validate all entries before commit, retain failed plans, use stable IDs, reject ambiguity/cycles. | Invalid plans remain available with coordinator-visible errors; retries are idempotent. |
| P1 | Spawn-roster and clarification writes are not serialized. | Concurrent truth-file writes can lose roster/inbox state. | Reuse a single atomic managed-file mutation helper with retry/counter handling. | Concurrent update test preserves both changes. |
| P1 | Worker behavior contract is stale in prompts/docs/tests. | Coordinators can be told workers are not auto-started or have two tools. | Synchronize General Worker, orchestration/spawn prompts, docs, API comments, and tests. | Search-based contract check and shipped-bundle test agree on auto-start and three member tools. |
| P1 | macOS artifacts are ad-hoc signed only. | Published releases are not hardened or notarized. | Configure signing identity, hardened runtime, entitlements, notarization, and CI verification. | Gatekeeper/notarization verification for the release artifact. |
| P2 | Inbox clarification lacks project-chat navigation and robust error feedback. | Users cannot reliably trace or recover a clarification. | Add linked navigation, display worker/task metadata, and show failed submissions. | UI test for answer, duplicate, missing task/worker, and chat link. |
| P2 | Electron security policy is implicit. | Renderer compromise has a broad IPC surface. | Add navigation, popup, permission, CSP, payload validation, and attachment-size policies. | Security smoke checks and IPC negative tests. |
| P2 | Packaged KaTeX font behavior is not tested. | Build warnings may become missing production assets. | Verify rendered math in a packaged-app smoke test. | Installed-app visual/resource assertion. |

## Implemented in this remediation slice

- A shared `startManagedAgent` lifecycle now reseeds providers, starts Pi, registers mailbox watches, waits for the existing ready signal, and only then writes `active` status and roster state.
- Manual start, worker spawn, and task dispatch use that lifecycle.
- Task dispatch now validates and persists a WorkPacket before starting or waking a worker.
- WorkPacket validation now requires coordinator identity, typed list fields, and the exact General Worker loop.
- Mailbox watches are registered on start and cleaned up on stop/restart without duplicating a project-chat watcher.

## Remaining remediation order

1. Add lifecycle, mailbox, spawn, and task-runner integration tests; fix plan-ingestion atomicity and idempotency.
2. Centralize truth-managed JSON mutation and complete clarification delivery/UI behavior.
3. Make `.runtime/extensions` generated and content-verified; synchronize extension and prompt contracts.
4. Add Electron hardening and release signing/notarization; enforce packaged-app smoke tests in CI.

## Release checklist

- [ ] P0 worker lifecycle and mailbox end-to-end tests pass.
- [ ] P1 task ingestion, data-write, and bundle-integrity tests pass.
- [ ] Packaged macOS artifact is hardened, signed, notarized, and verified.
- [ ] Windows/Linux artifacts are signed or have documented platform verification.
- [ ] Dependency vulnerability scan is reviewed.
- [ ] Packaged app smoke test verifies agent spawn, assignment, clarification, completion, and KaTeX assets.
- [ ] P2 risks are fixed or formally accepted with an owner and release date.
