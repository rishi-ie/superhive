# Per-part renderers for `AssistantMessage`

See `src/models/assistant-message.ts` for the persisted shape (`activityTimeline`
+ `response`).

## Layout

`AssistantMessage` renders one response run per user prompt. It stays live
across Pi's individual message turns, then freezes into one duration header,
collapsible trace, final prose, and footer.

1. **Live status (State 1)** — `Working for …`, a divider, prose in arrival
   order, then one current action and Stop. Each new action replaces the
   previous one. It does not render raw thinking or full tool output.
2. **Activity + prose (State 2)** — `Worked for …` has a chevron; expanding it
   reveals the trace above final prose:
   - **Activity timeline** (`message.activityTimeline`) — one row per item,
     type-driven:
     - `thinking` — `Thought`; raw thinking is never displayed or persisted.
     - `tool-call` — compact `<verb>` row. Consecutive tool-calls are
       clustered into a single `<ToolCallGroupRow>` via `group-timeline-items`.
     - `warning` — `⚠ <message>`. `error` — `❌ <message>`. Non-expandable.
     - `planning` — an explicit, user-facing `report_activity` summary.
   - **Response blocks** (`message.response`) — stream below the live header,
     then render as final Markdown once frozen:
     - `text` → `<MarkdownPart>`
     - `image` → `<ImagePart>`
     - `compaction-summary` → `<CompactionCard>`
3. **Footer** (frozen only, opacity-revealed on hover/focus) — copy button,
   timestamp tooltip, `<UsageFooter>`. Always last; never appears between
   the lineage and prose.

In State 1, the trace is replaced by the one-line live status; streaming text
remains visible above it.

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

- `TimelineItemRow` is `React.memo`'d on `(item, frozen)` reference equality.
- `ToolCallGroupRow` is `React.memo`'d on `(items, frozen)` reference equality.

The comparator's reference-equality on `blocks` and `item` only works because
the queue returns new arrays on every mutation. Don't mutate `state.activityTimeline`
or `state.response` in place — always replace.
