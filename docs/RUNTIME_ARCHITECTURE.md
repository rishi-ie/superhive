# Runtime architecture

`resources/runtime/manifest.json` is the single pinned-runtime inventory. It
declares the General Kai revision and every app-managed extension revision.
`scripts/setup.ts` uses it to stage a development or first-use runtime, while
the packaged application ships the same staged assets under `resources/runtime`.

## Ownership

| Area | Owner |
| --- | --- |
| Bundle location, verification, first-use preparation | `electron/runtime-provisioner.ts` |
| Bundle manifest and pins | `resources/runtime/manifest.json` |
| Runtime path resolution | `electron/runtime-paths.ts` |
| Agent profiles and core-extension references | `electron/agent-profile.ts` |
| Agent-local reference file | `electron/agent-runtime-reference.ts` |
| Child-process launch and lifecycle | `electron/runtime/*` |
| User-installed extensions and skills | Agent-local `extensions/` and `skills/` folders |

## Agent folder contract

An agent folder holds its state, workspace, settings, history, attachments,
launchers, and `superhive-runtime.json`. It does not contain a copied General
Kai checkout or copied app-managed extensions. The reference file points at
the verified shared runtime; `agent-runner.mjs` resolves Pi from it and
migrates only legacy core-extension manifest entries to shared absolute paths.
User-installed extensions remain agent-local and are never rewritten.

## Lifecycle

1. Creation calls `ensureRuntimePrepared` once per process and writes a
   portable runtime reference with the agent launchers.
2. The profile registry selects logical settings IDs and shared manifest paths.
3. The launcher verifies Pi exists, starts it with the agent manifest, and
   fails with a direct diagnostic if the shared runtime is missing.
4. The main-process runtime manager owns start, readiness, stop, restart,
   watcher cleanup, status persistence, and crash reconciliation.

Project-member spawning uses the project-member profile and returns `ready`.
It never auto-starts a worker; launch remains an explicit lifecycle action.
