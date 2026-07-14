# Implementation: Adopt t3code Chat UI Patterns into Superhive

## Goal & principles

Redesign the **agent chat surface** (composer is out of scope this pass) around three patterns from [pingdotgg/t3code](https://github.com/pingdotgg/t3code):

1. **"Working…" → full reveal.** While the agent is producing a response, only show a `Working for Xs` row (elapsed timer, pulsing dots, live tool summary). When the assistant message becomes complete, render the polished final output in one clean render — markdown with code-block chrome, tables with copy/expand, diffs, image lightbox.
2. **Chronological work log.** Tool calls (and intermediate commentary) live inline in arrival order inside the conversation. Settled turns fold intermediate activity behind a `Worked for Xs` row. Keep our rich specialized cards (Bash/Read/Edit/Write/Grep/Find/Ls) — accessible via expansion.
3. **Polished markdown chrome.** Wire every fenced code block through `CodeBlock`, give tables copy-as-Markdown/CSV + collapse, smart workspace file links.

**Keep:** per-delta runtime (it still feeds the in-flight Working row), full Thinking transcript, user edit/resend, assistant regenerate, rich per-tool card bodies, edit diffs, image lightbox, lifecycle states (initializing/stopped/error), usage footer, token/cost footer.

**Out of scope:** composer, minimap, file-link open-in-editor, mobile layouts, streaming toggle setting.

---

## Phase 0 — Pre-flight

- [ ] Run `bun run typecheck` and `bun run build` to confirm a clean baseline.
- [ ] Confirm `src/components/ui/dropdown-menu` is installed; if not: `bunx shadcn@latest add dropdown-menu`.
- [ ] Re-read `src/styles/presets/radix-mira.css` to know which chat tokens already exist.

---

## Phase 1 — Streaming policy & "Working…" row

### 1.1 Add runtime helpers

**File:** `src/models/runtime.ts`
- [ ] Add `isMessageInFlight(message: RuntimeMessage): boolean`
  - Returns `true` when the message has any part with `state === 'streaming'` OR any tool-call whose `state !== 'complete'` and no matching complete `tool-result`.
- [ ] Add `getMessageStartedAt(message: RuntimeMessage): number | undefined` — earliest `startedAt` on its parts, or `message.ts`.
- [ ] Add `getActiveToolSummary(message: RuntimeMessage): string | null` — `"Running 3 tools…"` when ≥1 in-flight tool call; `null` otherwise.

### 1.2 Shared elapsed hook

**File:** `src/pages/agent-chat/components/message-parts/ThinkingPart.tsx`
- [ ] Extract `useElapsedSeconds(running)` from this file's `ThinkingPart` (lines 14–28) into a new `src/hooks/use-elapsed-seconds.ts`.
- [ ] Replace its inline definition with `import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds'`.

### 1.3 New `<WorkingTimelineRow>`

**New file:** `src/pages/agent-chat/components/WorkingTimelineRow.tsx`
- [ ] Props: `{ startedAt: number; toolSummary?: string | null }`.
- [ ] Three pulsing dots (`h-1 w-1 rounded-full bg-muted-foreground/30 animate-pulse` with staggered `[animation-delay:200ms]` / `[animation-delay:400ms]`).
- [ ] Self-ticking `<WorkingTimer>` writes to a `textContent` ref (no React commit per second — same pattern t3code uses).
- [ ] Tool summary shown after the timer when non-null (`· Running N tools…`).
- [ ] Container: `py-0.5 pl-1.5 text-[11px] text-muted-foreground/70 tabular-nums`.

**New file:** `src/pages/agent-chat/components/WorkingTimer.tsx`
- [ ] Props: `{ startedAt: number; className?: string }`.
- [ ] Initial text `formatWorkingTimerNow(startedAt)` returns `"0s"`, `"12s"`, `"1m 23s"` for ≥60s.
- [ ] `useEffect` schedules `setInterval(updateText, 1000)`, clears on unmount.

### 1.4 Defer text rendering in `AssistantMessage`

**File:** `src/pages/agent-chat/components/AssistantMessage.tsx`
- [ ] At the top of the component, compute `const inFlight = isMessageInFlight(message)`.
- [ ] If `inFlight`, render only the **header line** (avatar + status + elapsed) and **any tool cards** that are already defined (so the chronological work log is visible during the run).
- [ ] When `inFlight === false`, render the full polished markdown body.
- [ ] Keep copy / regenerate / timestamp footer hidden while `inFlight`.
- [ ] Preserve thinking/image/compaction parts in chronological order (re-ordered in Phase 2 — Phase 1 just defers prose).

### 1.5 Surface `<WorkingTimelineRow>` from `<ConversationArea>`

**File:** `src/pages/agent-chat/components/ConversationArea.tsx`
- [ ] After Virtuoso's `itemContent` for the last assistant message, if the last message is in-flight and not yet rendered in `<AssistantMessage>`, render `<WorkingTimelineRow>` as a footer below the Virtuoso.
- [ ] Pass `startedAt = getMessageStartedAt(messages[messages.length - 1])` and `toolSummary = getActiveToolSummary(...)`.
- [ ] Use existing `chat-fade-bottom` mask; new row must sit above the composer and within `max-w-3xl mx-auto px-4 sm:px-6`.

### 1.6 Tokens

**File:** `src/styles/presets/radix-mira.css`
- [ ] Add `--chat-working-fg: var(--muted-foreground);` (reuse `--chat-status-running` for the dots).

### 1.7 Phase 1 verification

- [ ] `bun run typecheck` clean.
- [ ] Manually send a multi-tool prompt: while running, see only the Working row + already-defined tool cards. After completion, see polished final response.
- [ ] Confirm no flicker between streaming and final.

---

## Phase 2 — Chronological work log + turn folding

### 2.1 Render parts in original order

**File:** `src/pages/agent-chat/components/AssistantMessage.tsx`
- [ ] Remove the `proseSections` precomputation (lines 42–54).
- [ ] Replace the render block with a single `message.parts.map((part, i) => …)` that dispatches each part by type:
  - `text` → `<MarkdownPart source={part.text} />` (skip if blank).
  - `thinking` → existing `<ThinkingPart>`.
  - `image` → existing `<ImagePart>`.
  - `compaction-summary` → existing `<CompactionCard>`.
  - `tool-call` → `<ToolCallPart>` with its matched `tool-result`.
- [ ] Keep a `toolResultsById` lookup map (already computed) for `<ToolCallPart>` resolution.

### 2.2 Per-tool `running` flag

**File:** `src/pages/agent-chat/components/message-parts/ToolCallCard.tsx`
- [ ] Add prop `running: boolean` to `ToolCallCardProps` (existing interface at line 59).
- [ ] Derive `running` in `<ToolCallPart>` as `part.state !== 'complete' || (matched result && result.state !== 'complete')`.
- [ ] Pass to each specialized card (Bash/Read/Edit/Write/Grep/Find/Ls/Unknown).
- [ ] Update the helper `stateBackgroundClass` signature — already accepts `'running'`, verify and confirm.

### 2.3 New `<TurnFoldRow>`

**New file:** `src/pages/agent-chat/components/TurnFoldRow.tsx`
- [ ] Props: `{ startedAt: number; endedAt: number; toolCount: number; totalNonTextParts: number; defaultCollapsed?: boolean }`.
- [ ] Renders a single line: `Worked for 12s • 4 tools` with a chevron toggle.
- [ ] Local `useState<boolean>(defaultCollapsed ?? true)`.
- [ ] Returns `null` when expanded — the parent already renders the full content below.
- [ ] Visual: `border-b border-border/60 pb-2 pt-1` row, `text-xs text-muted-foreground` button with `focus-visible:ring-2 focus-visible:ring-ring/70`.

### 2.4 Integrate fold row in `AssistantMessage`

**File:** `src/pages/agent-chat/components/AssistantMessage.tsx`
- [ ] When the message is settled (`!inFlight`) AND has ≥2 `tool-call` parts OR ≥1 non-text non-thinking non-tool part, prepend a `<TurnFoldRow>` to the parts-rendering block.
- [ ] Track `expanded` state locally; when collapsed, render only the fold row and the final **terminal** `text` part of the message (after the last tool-call). When expanded, render everything.
- [ ] Define "terminal text" as the last `text` part that comes after the last `tool-call` part in `parts` order. If there's no terminal text, just show the fold row.

### 2.5 Phase 2 verification

- [ ] Multi-tool prompt: tools appear interleaved with prose, in chronological order. Once settled, fold row appears; clicking reveals all.
- [ ] Confirm Bash tool card still shows exit badge, elapsed timer, output; Edit card still shows old/new diff.
- [ ] Confirm regenerate, copy, timestamp all still work.

---

## Phase 3 — Polished markdown chrome

### 3.1 Wire `CodeBlock` for fenced code

**File:** `src/pages/agent-chat/components/message-parts/MarkdownPart.tsx`
- [ ] Replace the `pre` renderer (line 86) with: extract `<code>` child, detect `className` starting with `language-`, render `<CodeBlock lang={lang} code={text} />`.
- [ ] Keep the mermaid branch (`lang === 'mermaid'`) returning `<MermaidBlock source={text} />`.
- [ ] Update the inline `code` renderer (line 67) to keep inline code on its current path (non-`language-*`).

**File:** `src/pages/agent-chat/components/message-parts/CodeBlock.tsx`
- [ ] Remove the "Show all N lines" footer button — we adopt t3code's wrap instead.
- [ ] Remove the line-number gutter fallback — the Shiki path already renders highlighted code; for the brief pre-highlight moment, render `<pre><code>{code}</code></pre>` without line numbers.
- [ ] Header bar: language label left (uppercase tracking), right side has **wrap toggle** + **copy** + (if there's a fence-title `title="…"`, show that instead of the language).
- [ ] Copy button: `Copy` → `Copied` for 1.2s using a `setTimeout` ref.
- [ ] Wrap toggle: button with `aria-pressed`, applies `whitespace-pre-wrap` to the inner `<pre>` when on.
- [ ] Container: `rounded-lg overflow-hidden border border-border bg-chat-bubble-code-bg`.

### 3.2 Code-block tokens

**File:** `src/styles/presets/radix-mira.css`
- [ ] Confirm `--chat-bubble-code-bg` / `--chat-bubble-code-header-bg` already exist. No new tokens needed.

### 3.3 Table chrome

**New file:** `src/lib/table-serialize.ts`
- [ ] `serializeTableElementToMarkdown(table: HTMLTableElement): string` — returns pipe-table markdown; cells escaped.
- [ ] `serializeTableElementToCsv(table: HTMLTableElement): string` — RFC 4180 quoting.

**New file:** `src/pages/agent-chat/components/message-parts/MarkdownTable.tsx`
- [ ] Props: `{ children: ReactNode }` (matches the `table` element's child shape from `react-markdown`).
- [ ] State: `expanded` (boolean, default `false`); `copied` (boolean, for copy button check state).
- [ ] Wrap children in `<div className="chat-markdown-table-container overflow-x-auto rounded-md border border-border my-2">` + `<table className="w-full border-collapse text-xs">{children}</table>`.
- [ ] When `expanded === false`, apply truncate CSS to each `<th>`/`<td>`.
- [ ] Footer row with **expand/collapse** and **copy** (DropdownMenu with "Copy as Markdown" / "Copy as CSV").

**File:** `src/pages/agent-chat/components/message-parts/MarkdownPart.tsx`
- [ ] Replace `table/thead/tbody/tr/th/td` renderers so `table` returns `<MarkdownTable>{children}</MarkdownTable>` and `thead/tbody/tr/th/td` return their children wrapped in standard tags with token-driven classes.
- [ ] Add an `onCopy` handler on the root `<div>` that, if the selection's `anchorNode` is inside a `.chat-markdown-table-container table`, calls `serializeTableElementToMarkdown` and overrides `clipboardData`.

### 3.4 Table tokens

**File:** `src/styles/presets/radix-mira.css`
- [ ] Add `--chat-bubble-table-header-bg: color-mix(in oklch, var(--muted) 60%, transparent);`
- [ ] Add `--chat-bubble-table-divider: color-mix(in oklch, var(--border) 70%, transparent);`

### 3.5 Smart workspace file links

**New file:** `src/lib/markdown-link-target.ts`
- [ ] `resolveWorkspaceFileLink(href: string, cwd: string | undefined): { fileName: string; parentSuffix: string; displayPath: string } | null`
- [ ] Accept `file:` URIs, relative paths (`./foo.ts`, `../bar/baz.tsx`), and absolute paths under `cwd`.
- [ ] Return `null` for `http(s)://`, `mailto:`, in-page `#anchor`.

**New file:** `src/components/common/FileLinkChip.tsx`
- [ ] Props: `{ href: string; fileName: string; parentSuffix: string; displayPath: string; theme: 'light' | 'dark' }`.
- [ ] Render: Phosphor `FileIcon` + `fileName` + dim `parentSuffix`. Tooltip on hover shows full `displayPath`. Click copies original markdown to clipboard and toasts.

**File:** `src/pages/agent-chat/components/message-parts/MarkdownPart.tsx`
- [ ] Update `a` renderer: if `resolveWorkspaceFileLink(href, cwd)` returns non-null, render `<FileLinkChip>`; else render the existing external-link `<a>`.
- [ ] Add `cwd?: string` prop to `MarkdownPart` and thread from `AgentChatView`.

### 3.6 Phase 3 verification

- [ ] Code fence from assistant now has the language header + wrap toggle + copy check state.
- [ ] Table: copy-as-Markdown and copy-as-CSV both produce clean output.
- [ ] Long table: expand toggle shows wrapped cells.
- [ ] Workspace file link (`./src/foo.ts`) renders as a chip; click copies markdown.
- [ ] External http(s) links still open in a new tab.

---

## Phase 4 — User message polish

### 4.1 Visual refresh

**File:** `src/pages/agent-chat/components/UserMessage.tsx`
- [ ] Replace the bubble wrapper with `max-w-[80%] ml-auto rounded-2xl border border-border bg-secondary p-3`.
- [ ] Render the user text via `<MarkdownPart source={text} />` if non-empty; preserve `whitespace-pre-wrap` semantics by using `remark-breaks` in this render path.
- [ ] Keep the existing inline-edit textarea + Save & resend + Cancel.
- [ ] Footer: combine timestamp + copy + edit in one row; reveal on `group-hover` AND `focus-within`.

### 4.2 Long-message collapse

**File:** `src/pages/agent-chat/components/UserMessage.tsx`
- [ ] Add state `expanded: boolean` and constants `MAX_COLLAPSED_USER_MESSAGE_LINES = 8`, `MAX_COLLAPSED_USER_MESSAGE_LENGTH = 600`.
- [ ] Wrap the rendered text in a fade mask div when collapsed.
- [ ] Footer adds **Show full message** / **Show less** button when collapse is applicable.

### 4.3 User bubble tokens

**File:** `src/styles/presets/radix-mira.css`
- [ ] Add `--chat-bubble-user-bg: var(--secondary);`
- [ ] Add `--chat-bubble-user-border: var(--border);`
- [ ] Add `--chat-bubble-user-radius: 1rem;`

### 4.4 Phase 4 verification

- [ ] User bubble width caps at 80%; long messages collapse with fade; Show full message works.
- [ ] Edit still works; Save & resend still resends.
- [ ] Copy, timestamp, edit affordances all keyboard-reachable (Tab).

---

## Phase 5 — Polish & unify

### 5.1 Hidden-during-streaming copy button

**File:** `src/pages/agent-chat/components/AssistantMessage.tsx`
- [ ] Don't render the copy button when `inFlight === true`.
- [ ] Add a `Tooltip` wrapping the timestamp.

### 5.2 Usage footer placement

**File:** `src/pages/agent-chat/components/AssistantMessage.tsx`
- [ ] Move `<UsageFooter>` into the action footer row, right-aligned, alongside copy/regenerate/timestamp.

### 5.3 Phase 5 verification

- [ ] No copy button appears while the Working row is showing.
- [ ] Hover/focus shows copy + regenerate + timestamp + usage footer in one tight row.

---

## Phase 6 — End-to-end verification

### 6.1 Static checks

- [ ] `bun run typecheck` — clean.
- [ ] `bun run build` — clean.
- [ ] Flow isolation: `rg "@/api" src/components src/pages` → 0 results.
- [ ] Palette isolation: `rg "bg-(emerald|red|blue|green|yellow|orange|purple|pink|cyan|slate|gray|zinc|neutral|amber|lime|teal|sky|indigo|violet|fuchsia|rose)-" src -g '!src/styles/**'` → 0.
- [ ] Hex/rgb isolation: `rg "#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\(" src -g '!src/styles/**'` → 0.
- [ ] No `space-x-*` / `space-y-*`: `rg "\bspace-[xy]-\d" src -g '!src/styles/**'` → 0.
- [ ] All imports use `@/` alias.
- [ ] No manual z-index additions outside shadcn components.

### 6.2 Functional smoke

- [ ] Send a multi-tool prompt (bash → read → edit → final answer). Confirm Working row visible, tools in order, fold row, diff visible.
- [ ] Send a prompt that returns a markdown table. Confirm copy-as-Markdown and copy-as-CSV.
- [ ] Send a prompt that asks for code. Confirm header bar + wrap + copy.
- [ ] Send a long user prompt. Confirm fade collapse + "Show full message".
- [ ] Regenerate still works.
- [ ] Image lightbox still works.
- [ ] Initializing / stopped / error lifecycle screens untouched.
- [ ] Empty conversation still shows `<AgentEmpty>` and `<SuggestedPrompts>`.

### 6.3 Modularity report

- [ ] Run the 15-step modularity audit from `modularity-check.md` and write `modularity-report.md`.

---

## Phase 7 — Documentation

- [ ] Update `src/pages/agent-chat/components/message-parts/README.md` with the new render order.
- [ ] No AGENTS.md changes required (conventions already in place).

---

## Files touched (summary)

**New files**
- `src/hooks/use-elapsed-seconds.ts`
- `src/pages/agent-chat/components/WorkingTimelineRow.tsx`
- `src/pages/agent-chat/components/WorkingTimer.tsx`
- `src/pages/agent-chat/components/TurnFoldRow.tsx`
- `src/pages/agent-chat/components/message-parts/MarkdownTable.tsx`
- `src/components/common/FileLinkChip.tsx`
- `src/lib/table-serialize.ts`
- `src/lib/markdown-link-target.ts`

**Modified files**
- `src/models/runtime.ts`
- `src/pages/agent-chat/components/AssistantMessage.tsx`
- `src/pages/agent-chat/components/ConversationArea.tsx`
- `src/pages/agent-chat/components/UserMessage.tsx`
- `src/pages/agent-chat/components/message-parts/MarkdownPart.tsx`
- `src/pages/agent-chat/components/message-parts/CodeBlock.tsx`
- `src/pages/agent-chat/components/message-parts/ToolCallCard.tsx`
- `src/pages/agent-chat/components/message-parts/ToolCallPart.tsx`
- `src/pages/agent-chat/components/message-parts/ThinkingPart.tsx`
- `src/pages/agent-chat/AgentChatView.tsx`
- `src/styles/presets/radix-mira.css`

**Unchanged (this pass)**
- Composer (all files under `src/components/layout/composer/`).
- All per-tool card files: `BashToolCard`, `ReadToolCard`, `EditToolCard`, `WriteToolCard`, `GrepToolCard`, `FindToolCard`, `LsToolCard`, `UnknownToolCard` (only `running` flag added to `ToolCallCard` base).
- Runtime / store / API / IPC layers.
- `src/pages/agent-chat/components/SuggestedPrompts.tsx`, `AgentInitializing.tsx`, `AgentStopped.tsx`, `AgentError.tsx`.

---

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Streaming flicker | Defer prose entirely until `inFlight` ends; tool cards already render progressively. |
| Scroll anchoring | Reuse existing `chat-fade-bottom` mask and `atBottom` follow-output behavior in `ConversationArea`. |
| Markdown rewire | Manually scan a couple of `.jsonl` agent conversations in `~/.superhive/agents/` after build to catch regressions. |
| Per-tool `running` | Derived rather than added to the store; cheap and reversible. |
| Token reuse | Every new color or radius must come from the preset; Phase 6.1 modularity checks will catch violations. |
