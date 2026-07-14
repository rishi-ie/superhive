# Per-part renderers for `RuntimeMessage.parts`

See `src/models/runtime.ts` for the `ContentPart` discriminated union.

## Dispatch order

`AssistantMessage` walks `message.parts` in original arrival order and dispatches each to a
dedicated renderer. Settled multi-tool turns (≥2 tool calls) are wrapped in a `<TurnFoldRow>`
which collapses the tool calls behind a single summary line; the final prose after the last
tool call is always visible.

| Part type | Renderer | Notes |
|---|---|---|
| `text` | `MarkdownPart` | Fenced code → `CodeBlock`; tables → `MarkdownTable`; mermaid raw |
| `thinking` | `ThinkingPart` | Collapsible; shows elapsed timer via `useElapsedSeconds` |
| `image` | `ImagePart` | Lightbox on click |
| `compaction-summary` | `CompactionCard` | Divider between compacted history and new work |
| `tool-call` | `ToolCallPart` | Looks up matching `tool-result` by id; passes `running` flag to card |

## Key design decisions

- **Deferred reveal** — `isMessageInFlight()` returns `true` during streaming. `AssistantMessage`
  renders `null` in that case; `ConversationArea` shows a `WorkingTimelineRow` footer instead.
- **Fold detection** — `shouldFold = toolCalls.length >= 2 || parts has non-text/thinking/tool-call/tool-result`.
  Default collapsed. Expand toggles all fold-content; terminal text always visible.
- **`running` derivation** — computed in `ToolCallPart` as `part.state !== 'complete' ||
  (result && result.state !== 'complete')`. Never written to the store.
- **`WorkingTimelineRow`** — absolute-positioned inside `ConversationArea`; not a Virtuoso item.
  Shows pulsing dots + `WorkingTimer` + live tool summary.
- **`CodeBlock`** — shiki highlighting via `getHighlighter()`, language header bar, wrap toggle,
  copy-check feedback (1.2s). Falls back to plain `<pre><code>` before highlighter loads.
- **`MarkdownTable`** — overflow-x-auto, fade mask, expand/collapse for >8 rows,
  copy-as-Markdown / copy-as-CSV via `DropdownMenu`. Serializers live in `src/lib/table-serialize.ts`.

## Files

```
message-parts/
  MarkdownPart.tsx      — react-markdown + remark-gfm/remark-math/rehype-katex
  CodeBlock.tsx        — shiki-highlighted fenced code with header chrome
  MermaidBlock.tsx     — mermaid 11 renderer
  MarkdownTable.tsx    — overflow-x-auto table with copy/expand
  ThinkingPart.tsx     — collapsible thinking transcript
  ImagePart.tsx        — image with lightbox
  CompactionCard.tsx   — compaction summary divider
  ToolCallPart.tsx     — dispatcher: tool-call → Bash/Read/Edit/Write/Grep/Find/Ls/Unknown card
  BashToolCard.tsx     — Bash card with exit badge, elapsed timer, output
  ReadToolCard.tsx     — Read card
  EditToolCard.tsx     — Edit card with diff view
  WriteToolCard.tsx    — Write card with diff view
  GrepToolCard.tsx     — Grep card
  FindToolCard.tsx     — Find card
  LsToolCard.tsx       — Ls card
  UnknownToolCard.tsx  — fallback for unknown tools
  DiffView.tsx         — unified diff renderer for Edit/Write tools
  ImageLightbox.tsx    — image lightbox dialog
  README.md            — this file
```
