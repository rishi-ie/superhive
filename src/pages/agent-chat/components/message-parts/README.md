# Per-part renderers for `AssistantMessage`

See `src/models/assistant-message.ts` for the persisted shape (`activityTimeline`
+ `response`).

## Layout

`AssistantMessage` renders an indicator, a single chronologically-ordered list,
and a footer per assistant turn. The timeline items and prose blocks are
merged into one list sorted by `startedAt`, so prose that arrived between two
thinking/tool-call rounds renders between them.

1. **Top indicator** — `● Working…` (state 1) or `✓ Finished` (state 2). Always
   visible at the top of the message. Scrolls with the row (not sticky to
   viewport). The finished marker is here ONLY — there is no second
   "Completed" row at the end of the lineage anymore.
2. **Merged lineage + prose** — one ordered list combining:
   - **Activity timeline** (`message.activityTimeline`) — one row per item,
     type-driven:
     - `thinking` — `Thought (N.Ns)` collapsed (click to expand). Same
       total-duration label for every thinking row in one response.
     - `tool-call` — compact `<verb>` row. Consecutive tool-calls are
       clustered into a single `<ToolCallGroupRow>` via `group-timeline-items`.
     - `warning` — `⚠ <message>`. `error` — `❌ <message>`. Non-expandable.
     - `planning` / `system` — defined but never emitted today.
   - **Response blocks** (`message.response`) — only shown when frozen (state 2):
     - `text` → `<MarkdownPart>`
     - `image` → `<ImagePart>`
     - `compaction-summary` → `<CompactionCard>`
3. **Footer** (frozen only, opacity-revealed on hover/focus) — copy button,
   timestamp tooltip, `<UsageFooter>`. Always last; never appears between
   the lineage and prose.

In state 1, response blocks are filtered out. Only the indicator + timeline
items show.

## Files

```
message-parts/
  TimelineItemRow.tsx   — one row per TimelineItem (memoized)
  ToolCallGroupRow.tsx  — single row summarizing N consecutive tool-calls
  group-timeline-items.ts — helper that clusters tool-calls + filters legacy completions
  MarkdownPart.tsx      — react-markdown + remark-gfm/remark-math/rehype-katex
  CodeBlock.tsx         — shiki-highlighted fenced code with header chrome
  MermaidBlock.tsx      — mermaid 11 renderer
  MarkdownTable.tsx     — overflow-x-auto table with copy/expand
  ThinkingPart.tsx      — parked (was inline thinking renderer; timeline replaces it)
  ImagePart.tsx         — image with lightbox
  ImageLightbox.tsx     — image lightbox dialog
  CompactionCard.tsx    — compaction summary divider
  chain-display.ts      — per-tool icon + verb mapping + formatToolName helper
  README.md             — this file
```

## Memoization (Phase F)

- `TimelineItemRow` is `React.memo`'d on `(item, frozen, totalDurationMs)`
  reference equality.
- `ToolCallGroupRow` is `React.memo`'d on `(items, frozen)` reference equality.

The comparator's reference-equality on `blocks` and `item` only works because
the queue returns new arrays on every mutation. Don't mutate `state.activityTimeline`
or `state.response` in place — always replace.
