# Per-part renderers for `RuntimeMessage.parts`

See `src/models/runtime.ts` for the `ContentPart` discriminated union.

`AssistantMessage` splits `message.parts` into two groups:

- **Visible**: `text`, `image`, `compaction-summary` — rendered inline in original order
- **Hidden**: `thinking`, `tool-call` — collected into a single `<ActionChainFold>` at the bottom of the message

| Part type | Renderer | Visible? |
|---|---|---|
| `text` | `MarkdownPart` | ✅ inline |
| `thinking` | (label only, inside fold) | ❌ hidden in fold |
| `image` | `ImagePart` | ✅ inline |
| `compaction-summary` | `CompactionCard` | ✅ inline |
| `tool-call` | (name only, inside fold) | ❌ hidden in fold |

## ActionChainFold

Replaces the per-call blue cards (Phase 16) and the single-purpose `ToolCallList` (Phase 17).

- **Default state** (collapsed): `Worked for Xs · N actions` or `Working… M of N actions` while in flight
- **Expanded**: numbered chronological list of internal actions — `1. Thought`, `2. bash`, `3. Thought`, `4. read`, etc.
- **In-flight derivation**: a part is in flight if `state === 'streaming'` (thinking) or `state !== 'complete'` (tool-call)
- **Duration**: live-ticking while in flight via `useElapsedSeconds`, frozen when done

`ThinkingPart.tsx` is kept parked but no longer rendered inline. Available for a future per-row drill-down.

## Files

```
message-parts/
  MarkdownPart.tsx     — react-markdown + remark-gfm/remark-math/rehype-katex
  CodeBlock.tsx        — shiki-highlighted fenced code with header chrome
  MermaidBlock.tsx     — mermaid 11 renderer
  MarkdownTable.tsx    — overflow-x-auto table with copy/expand
  ThinkingPart.tsx     — parked (was inline thinking renderer; fold replaces it)
  ImagePart.tsx        — image with lightbox
  CompactionCard.tsx   — compaction summary divider
  ActionChainFold.tsx  — fold for thinking + tool-call action chain
  ImageLightbox.tsx    — image lightbox dialog
  README.md            — this file
```

Deleted (Phase 16/17): `PartRenderer`, `ToolCallPart`, `ToolCallCard`,
`BashToolCard`, `ReadToolCard`, `EditToolCard`, `WriteToolCard`, `GrepToolCard`,
`FindToolCard`, `LsToolCard`, `UnknownToolCard`, `DiffView`, `ToolResultPart`,
`ToolCallList`.
