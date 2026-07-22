# Per-part renderers for `AssistantMessage`

See `src/models/assistant-message.ts` for the persisted shape (`activityTimeline`
+ `response`).

## Layout

`AssistantMessage` renders two stacked sections per assistant turn:

1. **Top indicator** — `● Working…` (state 1) or `✓ Finished` (state 2). Always
   visible at the top of the message. Scrolls with the row (not sticky to
   viewport).
2. **Activity timeline** (`message.activityTimeline`) — one `TimelineItemRow`
   per item. Each row is type-driven:
   - `thinking` — state 1: `▼ Thinking` placeholder (click to expand). State 2:
     `▶ Thought (3.2s)` collapsed (click to expand). Same total-duration label
     for every thinking row in one response.
   - `tool-call` — compact `✓ <toolName>`, no inline args. Non-expandable.
   - `completion` — `✓ Completed`. Non-expandable.
   - `warning` — `⚠ <message>`. `error` — `❌ <message>`. Non-expandable.
   - `planning` / `system` — defined but never emitted today.
3. **Separator** — `h-px bg-border`. Visible only when frozen AND `response.length > 0`.
4. **Response blocks** (`message.response`) — one block per response entry:
   - `text` → `<MarkdownPart>`
   - `image` → `<ImagePart>`
   - `compaction-summary` → `<CompactionCard>`
5. **Footer** (frozen only, opacity-revealed on hover/focus) — copy button,
   timestamp tooltip, `<UsageFooter>`.

In state 1, prose (section 4) is hidden. Only the indicator + timeline show.

## Files

```
message-parts/
  TimelineItemRow.tsx   — one row per TimelineItem (memoized)
  ResponseBlocks.tsx    — text / image / compaction-summary blocks (memoized)
  MarkdownPart.tsx      — react-markdown + remark-gfm/remark-math/rehype-katex
  CodeBlock.tsx         — shiki-highlighted fenced code with header chrome
  MermaidBlock.tsx      — mermaid 11 renderer
  MarkdownTable.tsx     — overflow-x-auto table with copy/expand
  ThinkingPart.tsx      — parked (was inline thinking renderer; timeline replaces it)
  ImagePart.tsx         — image with lightbox
  ImageLightbox.tsx     — image lightbox dialog
  CompactionCard.tsx    — compaction summary divider
  chain-display.ts      — per-tool icon + verb mapping
  README.md             — this file
```

## Memoization (Phase F)

- `TimelineItemRow` is `React.memo`'d on `(item, frozen, isLast, totalDurationMs)`
  reference equality.
- `ResponseBlocks` is `React.memo`'d on `(blocks, frozen)` reference equality.

The comparator's reference-equality on `blocks` and `item` only works because
the queue returns new arrays on every mutation. Don't mutate `state.activityTimeline`
or `state.response` in place — always replace.
