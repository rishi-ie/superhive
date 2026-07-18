# Streaming Queue

## Overview

Pi emits events at its natural cadence over IPC. The renderer buffers these
events in a per-agent queue and applies them to the runtime slice on a fixed
**50ms tick**. One notify per agent per tick, regardless of how many events
arrived — the renderer re-renders at most 20 times per second per agent.

## Pipeline

```
Pi (general-kai)              agent:<id>:event                  queue tick
       │                            │                              │
       │  emits events at           │                              │
       │  Pi's natural cadence      │                              │
       ▼                            ▼                              ▼
   ┌────────────┐   IPC events   ┌──────────────────────────┐  every 50ms
   │ main       │ ──────────────▶│ src/stores/agent.ts      │ ────────▶
   │ process    │                │                          │          │
   └────────────┘                │ onEvent(ev) ──┐          │          │
                                 │               │ enqueue  │          │
                                 │               ▼          │          │
                                 │ ┌────────────────────────┴──────┐   │
                                 │ │ src/stores/agent-stream-queue │   │
                                 │ │   queues: Map<agentId, op[]>  │   │
                                 │ │   setInterval(tick, 50)       │   │
                                 │ └──────────────┬────────────────┘   │
                                 │                │                    │
                                 │                │ applyOp(slice, op) │
                                 │                │ notify()           │
                                 │                ▼                    │
                                 │   ┌──────────────────────────┐      │
                                 │   │ runtimeSlice.messages    │      │
                                 │   │ runtimeSlice.inFlight..  │      │
                                 │   └──────────────────────────┘      │
                                 │                                      │
                                 └──────────────────────────────────────┘
                                                                   ▲
                                              React re-renders     │
                                              (useAgentRuntime) ────┘
```

## Why 50ms

- **Below human perception** — 50ms is well under the ~100ms threshold for
  perceived latency in streaming UIs.
- **Caps React renders** — a flood of N events becomes 1 notify per agent
  per tick. Without the queue, N events would cause N renders per agent.
- **Smooths bursty traffic** — Pi emits deltas in microsecond bursts; the
  queue absorbs them and applies at a steady cadence.

## Op set

The queue's `StreamOp` discriminated union:

| Kind | Purpose | Maps from |
|---|---|---|
| `message-start` | Push empty message if not present | `message-start` |
| `append-part` | Push a new part | `thinking-start`, `tool-call-start`, `image-attachment` |
| `append-delta` | Append text to trailing text/thinking part | `text-delta`, `thinking-delta` |
| `append-tool-call-delta` | Append JSON-string delta to a tool-call's `args` | `tool-call-delta` |
| `finalize-part` | Flip first streaming/pending part of type to `complete` | `text-end`, `thinking-end` |
| `finalize-tool-call` | Set `args` + flip state to `complete` on the matching tool-call | `tool-call-end` |
| `finalize-message` | Defensive flip — any leftover streaming text/thinking → `complete` | `message-end` |
| `increment-inflight` | Adjust `inFlightToolCount` (clamped at 0) | `tool-execution-start` (Δ+1), `tool-execution-end` (Δ−1) |

## What stays immediate

These events trigger IPC round-trips or side effects and cannot be deferred
into the queue without races:

- **`tool-execution-end`** → `agents.getMessages(agentId)` refetch.
- **`compaction-start`** / **`compaction-end`** → `agents.getRuntimeState(agentId)` refetch (and messages refetch on `-end`).
- **`auto-retry-start`** / **`auto-retry-end`** → `agents.getRuntimeState(agentId)` refetch.
- **`error`** → toast + `lastError` set.

Refetches land async and call `notify()` once on completion, so the renderer
re-renders when the refetch finishes. The queue still drains on its 50ms tick
in parallel — there's no coordination needed because refetches overwrite
`entry.messages` with the canonical disk state, while queued ops are
in-flight mutations that haven't been persisted yet.

## Edge cases

| Case | Handling |
|---|---|
| Op arrives for unknown agent (slice disposed) | `tick` skips + clears agent's queue |
| `append-delta` for message with no matching trailing part | `applyOp` appends a new part (no replacement) |
| Cross-agent ops | Each agent has own `StreamOp[]`, drained independently in same tick |
| Queue grows unbounded under flood | Cap at `MAX_QUEUE_SIZE = 1000`; drop oldest beyond cap, log a warning |
| `disposeSlice(agentId)` called | `clearAgentQueue(agentId)` runs in `disposeRuntimeSliceNow` |
| Module hot reload | `clearAll` not exposed for HMR — covered by the timer stopping when queues empty |

## Files

- `src/stores/agent-stream-queue.ts` — queue + tick + `applyOp` + accessor wiring
- `src/stores/agent-stream-queue.test.ts` — 21 unit tests covering ordering, batching, isolation, cap, dispose
- `src/stores/agent.ts` — IPC handlers in `initRuntimeSlice` translate events → `enqueue(op)`
