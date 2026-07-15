# Agent Chat UX — Module Inventory

> Canonical source of truth for every visible module in the agent chat UI.
> Updated alongside any rendering change.

---

## How to Read This Document

Each module entry has four fields:

| Field | Meaning |
|---|---|
| **Purpose** | One-line description of what the module does |
| **Props / Contract** | What it receives as input; what it emits (if anything) |
| **Edit boundary** | Which files you touch to change this module |
| **Timing** | When it appears, disappears, and what chat state it's in |

**State labels** used throughout:

| Label | Meaning |
|---|---|
| `initializing` | Agent runtime is booting (boot step visible) |
| `running/busy` | Agent is actively generating a response |
| `streaming` | Individual part is receiving tokens |
| `idle` | Nothing in flight; composer is interactive |
| `complete` | All parts of a message are in terminal state |
| `error` | Runtime threw; error UI shown |
| `stopped` | User or orchestrator halted the run |

---

## Top-Level Page Shell

### `AgentChatView.tsx`
**Purpose** — Root page component; owns `useAgentRuntime(agentId)` and routes to one status view at a time.

**Props / Contract** — No props (reads `agentId` from `useParams()`). Consumes `useAgentRuntime` hook output:
- `status`: `'loading' | 'initializing' | 'running' | 'busy' | 'idle' | 'stopped' | 'error'`
- `messages: RuntimeMessage[]`
- `lastError`, `bootStep`, `usage`, `contextUsage`, `compaction`, `retry`

**Edit boundary** — `src/pages/agent-chat/components/AgentChatView.tsx`

**Timing** — Mounts once per `agentId` visit. Re-renders on every `status` change.

```
Status routing:
  'loading'         → loading spinner
  'initializing'    → <AgentInitializing>
  'error'           → <AgentError>
  'stopped'         → <AgentStopped>
  'running' / 'busy' / 'idle' → <ConversationArea> + <Composer>
```

---

## Status / Lifecycle Views (full-page replacements)

### `AgentEmpty.tsx`
**Purpose** — Full-page placeholder when no agent is selected.

**Props / Contract** — None.

**Edit boundary** — `src/pages/agent-chat/components/AgentEmpty.tsx`

**Timing** — Shown when `AgentChatView` finds no `agentId` in params (route has no agent selected).

---

### `AgentInitializing.tsx`
**Purpose** — Boot-step progress indicator shown while the agent runtime is starting up.

**Props / Contract**
```typescript
{
  currentStep?: InitStep   // Current boot step label from runtime
  agentName?: string
  lastError?: string
  onRestart: () => void    // REQUIRED — restart the agent
}
```

**Edit boundary** — `src/pages/agent-chat/components/AgentInitializing.tsx`

**Timing** — Shown when `useAgentRuntime` returns `status: 'initializing'`. If any single step exceeds **90 seconds**, shows "stuck" UI with a Restart button.

---

### `AgentError.tsx`
**Purpose** — Full-page error display when the runtime throws.

**Props / Contract**
```typescript
{
  error: string
  onRestart: () => void
}
```

**Edit boundary** — `src/pages/agent-chat/components/AgentError.tsx`

**Timing** — Shown when `status: 'error'`. Persists until user clicks Restart.

---

### `AgentStopped.tsx`
**Purpose** — Full-page stopped state shown after a run ends or user stops.

**Props / Contract**
```typescript
{
  onStart: () => void
  agentName?: string
}
```

**Edit boundary** — `src/pages/agent-chat/components/AgentStopped.tsx`

**Timing** — Shown when `status: 'stopped'`.

---

### `SuggestedPrompts.tsx`
**Purpose** — Prompt suggestion chips shown when the chat is empty.

**Props / Contract**
```typescript
{
  onPromptSelect: (prompt: string) => void
}
```

**Edit boundary** — `src/pages/agent-chat/components/SuggestedPrompts.tsx`

**Timing** — Shown inside `ConversationArea` only when `messages.length === 0`. Disappears as soon as the first user message is sent.

---

### `LoadingSpinner` (inline)
**Purpose** — Centered spinner shown during the initial `useAgentRuntime` fetch.

**Props / Contract** — None (no props).

**Edit boundary** — Inline JSX in `AgentChatView.tsx`.

**Timing** — Shown when `status: 'loading'`. Typically sub-second.

---

## Conversation Surface

### `ConversationArea.tsx`
**Purpose** — Virtualized scroll container hosting all messages, live overlays (WorkingTimelineRow, ActiveStateBanners), and auto-scroll logic.

**Props / Contract**
```typescript
{
  messages: RuntimeMessage[]          // All messages in conversation
  busy?: boolean                      // True when status is 'busy'
  compaction?: CompactionStatus       // Active compaction from runtime
  retry?: RetryStatus                  // Active auto-retry from runtime
  onCancel?: () => void               // Stop the agent
  agentId?: string
  agentName?: string
  onPromptSelect?: (prompt: string) => void
}
```

**Edit boundary** — `src/pages/agent-chat/components/ConversationArea.tsx`

**Timing** — Mounted for `status: 'running' | 'busy' | 'idle'`. Unmounts when leaving those statuses.

**Overlay layering** (all absolute-positioned inside the container):
```
Top of container:
  <ActiveStateBanners>    ← z-10, pointer-events auto

Scrolling message list (Virtuoso):
  <UserMessage>            ← per message
  <AssistantMessage>       ← per message

Bottom of container:
  <WorkingTimelineRow>     ← z-10, pointer-events none (when in-flight)
```

---

### `ActiveStateBanners.tsx`
**Purpose** — Top-of-conversation overlay showing compaction-in-progress or auto-retry progress.

**Props / Contract**
```typescript
{
  compaction?: CompactionStatus
  retry?: RetryStatus
  onCancel: () => void      // REQUIRED
}
```

**Edit boundary** — `src/pages/agent-chat/components/ActiveStateBanners.tsx`

**Timing** — Mounted whenever `compaction` or `retry` is truthy. Both banners can stack.
- `CompactionBanner`: spinner + "Compacting context… (Esc to cancel)"
- `RetryBanner`: error icon + "Auto-retrying (attempt N)… [progress bar]" filling over `retry.delayMs`

---

### `TurnFoldRow.tsx`
**Purpose** — Collapsible wrapper around a consecutive sequence of tool calls within an assistant message.

**Props / Contract**
```typescript
{
  children: React.ReactNode    // The wrapped tool cards
  defaultOpen?: boolean
}
```

**Edit boundary** — `src/pages/agent-chat/components/TurnFoldRow.tsx`

**Timing** — Rendered inside `AssistantMessage` when `shouldFold === true`. Collapsed by default; user can expand. Appears within an assistant message that has 2+ tool calls OR any non-text/thinking/tool-call/tool-result parts.

---

### `WorkingTimelineRow.tsx`
**Purpose** — Transient "● Working…" pill at the bottom of the chat indicating the agent is actively generating.

**Props / Contract**
```typescript
{
  startedAt: number           // Unix timestamp (ms) = message.ts when the assistant message was created
  toolSummary?: string | null  // e.g. "Running 3 tools…" from runtime
}
```

**Edit boundary** — `src/pages/agent-chat/components/WorkingTimelineRow.tsx`

**Timing** — Appears when `isMessageInFlight(lastMessage) === true`. Disappears when `isMessageInFlight() === false`.
```
startedAt = message.ts (time first streaming part arrived)
Shows:
  · Animated pulsing dot
  · "Working…" label
  · <WorkingTimer> counting up from startedAt
  · toolSummary text if tool calls are pending
```

---

### `WorkingTimer.tsx`
**Purpose** — Live elapsed-seconds counter used inside `WorkingTimelineRow`.

**Props / Contract**
```typescript
{
  startedAt: number
  className?: string
}
```

**Edit boundary** — `src/pages/agent-chat/components/WorkingTimer.tsx`

**Timing** — Mounts and unmounts with `WorkingTimelineRow`. Updates every 1000ms via `setInterval`.

---

## Per-Message Renderers

### `UserMessage.tsx`
**Purpose** — Right-aligned bubble for a user turn; includes copy and edit actions.

**Props / Contract**
```typescript
{
  message: RuntimeMessage   // role: 'user'
}
```

**Edit boundary** — `src/pages/agent-chat/components/UserMessage.tsx`

**Timing** — Visible immediately when the user message is in the `messages` array. Edit mode is local UI state; does not affect other components.

---

### `AssistantMessage.tsx`
**Purpose** — Left-aligned message for the agent turn; walks the `parts[]` array, handles fold logic, shows usage on hover.

**Props / Contract**
```typescript
{
  message: RuntimeMessage   // role: 'assistant'
  className?: string
  agentId: string
  onRegenerate?: (messageId: string) => void
}
```

**Edit boundary** — `src/pages/agent-chat/components/AssistantMessage.tsx`

**Timing** — **Critical**: when `isMessageInFlight(message) === true`, the component returns `null` (message is invisible). The message appears **atomically** the moment all parts reach terminal states.
```
Parts walk (derived):
  toolCalls[]      = message.parts.filter(type === 'tool-call')
  toolResultsById  = Map from all tool-result parts by id
  shouldFold       = (toolCalls.length >= 2) OR (any non-text/thinking/tool-call/tool-result parts)
  foldContent      = parts[0..lastToolCallIndex]  (wrapped in TurnFoldRow if collapsed)
  nonFoldContent   = parts[lastToolCallIndex+1..]
```

**Internal derived state:**
- `inFlight`: calls `isMessageInFlight(message)` — if true, renders `null`
- `toolResultsById`: `Map<id, tool-result>` built from all parts
- `toolCalls`: array of all `tool-call` parts
- `shouldFold`: boolean

---

### `UsageFooter.tsx`
**Purpose** — Expandable per-message token usage + cost breakdown shown under assistant messages.

**Props / Contract**
```typescript
{
  usage: MessageUsage
  // { input, output, cacheRead, cacheWrite, totalTokens, cost? }
}
```

**Edit boundary** — `src/pages/agent-chat/components/UsageFooter.tsx`

**Timing** — Rendered inside `AssistantMessage` only when `message.usage` exists. `usage` is attached on the `message_end` IPC event, so it appears **after** the message is fully complete and never during streaming.

---

## Content Block Taxonomy (`ContentPart` dispatch)

### `PartRenderer.tsx`
**Purpose** — Dispatcher: routes a single `ContentPart` to the correct renderer.

**Props / Contract**
```typescript
{
  part: ContentPart
  toolResultsById: Map<string, Extract<ContentPart, { type: 'tool-result' }>>
}
```

**Edit boundary** — `src/pages/agent-chat/components/message-parts/PartRenderer.tsx`

**Timing** — Called once per part in `AssistantMessage`'s parts array. The rendering is synchronous; no timing implication.

**Dispatch table:**
| `part.type` | Renderer |
|---|---|
| `thinking` | `ThinkingPart` |
| `image` | `ImagePart` |
| `compaction-summary` | `CompactionCard` |
| `text` (non-empty) | `MarkdownPart` |
| `tool-call` | `ToolCallPart` |
| unknown | `null` |

---

### `MarkdownPart.tsx`
**Purpose** — Standard markdown rendering via `react-markdown` with GFM, math, KaTeX, shiki code, mermaid, and table support.

**Props / Contract**
```typescript
{
  source: string    // Raw markdown string
  cwd?: string      // NOT USED in current implementation
}
```

**Edit boundary** — `src/pages/agent-chat/components/message-parts/MarkdownPart.tsx`

**Timing** — Rendered inline as the part streams in. `source` is a live string that grows token-by-token during `state: 'streaming'`. React updates on each keystroke from the stream.

**Plugins:** `remarkGfm`, `remarkMath`, `rehypeKatex`, `rehypeShiki` (via `CodeBlock`), `MermaidBlock`

---

### `CodeBlock.tsx`
**Purpose** — Syntax-highlighted code fence via shiki; rendered inside `MarkdownPart`.

**Props / Contract** — Consumed as a custom `react-markdown` component, not directly. Internal props derived from the remark plugin.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/CodeBlock.tsx`

**Timing** — Same as `MarkdownPart` — streams in token-by-token during streaming.

---

### `MermaidBlock.tsx`
**Purpose** — Mermaid diagram rendering inside markdown; compiles the diagram string and renders as an SVG.

**Props / Contract** — Consumed as a custom `react-markdown` component inside `MarkdownPart`. Receives the mermaid diagram source string.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/MermaidBlock.tsx`

**Timing** — Appears when a fenced code block with ` ```mermaid ` is encountered in the markdown stream. The mermaid diagram compiles and renders after the full fence content is received.

---

### `MarkdownTable.tsx`
**Purpose** — GFM table with copy-as-Markdown and copy-as-CSV actions.

**Props / Contract** — Rendered as custom `react-markdown` component inside `MarkdownPart`. Receives the table AST from remark.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/MarkdownTable.tsx`

**Timing** — Same as `MarkdownPart`.

---

### `ThinkingPart.tsx`
**Purpose** — Collapsible transcript of the agent's hidden thinking process (shown when thinking is enabled in the model).

**Props / Contract**
```typescript
{
  text: string
  isStreaming: boolean
}
```

**Edit boundary** — `src/pages/agent-chat/components/message-parts/ThinkingPart.tsx`

**Timing:**
| State | Appearance |
|---|---|
| `isStreaming === true` | Collapsible **forced open**; shimmer animation on; timer running |
| `isStreaming === false` | Collapsible **forced closed**; label changes to "Thought for Xs" |

Timer uses `useElapsedSeconds(isStreaming)` — counts up only while streaming.

---

### `ImagePart.tsx` + `ImageLightbox.tsx`
**Purpose** — Inline image with click-to-zoom lightbox.

**Props / Contract**
```typescript
// ImagePart
{ src: string; alt?: string }
// ImageLightbox (dialog)
{ src: string; alt?: string; onClose: () => void }
```

**Edit boundary** — `src/pages/agent-chat/components/message-parts/ImagePart.tsx` and `ImageLightbox.tsx`

**Timing** — Appears when a `type: 'image'` part arrives. Lightbox opens on click.

---

### `CompactionCard.tsx`
**Purpose** — Divider shown when context has been compacted; summarizes what was dropped.

**Props / Contract** — Rendered by `PartRenderer` for `type: 'compaction-summary'` parts.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/CompactionCard.tsx`

**Timing** — Appears inline in the message stream when the runtime emits a compaction event.

---

## Tool Activity

### `ToolCallPart.tsx`
**Purpose** — Dispatcher choosing the correct tool card for a `tool-call` part; also manages the matching `tool-result` lookup.

**Props / Contract**
```typescript
{
  part: Extract<ContentPart, { type: 'tool-call' }>
  result?: Extract<ContentPart, { type: 'tool-result' }>
}
```

**Edit boundary** — `src/pages/agent-chat/components/message-parts/ToolCallPart.tsx`

**Timing:**
| Condition | `running` derived state | Card shown |
|---|---|---|
| `part.state !== 'complete'` | `true` | Pending state with spinner |
| `result?.state !== 'complete'` | `true` | Pending state with spinner |
| Both complete | `false` | Completed state |

```
Dispatch by part.name:
  'bash'     → BashToolCard
  'read'     → ReadToolCard
  'edit'     → EditToolCard
  'write'    → WriteToolCard
  'grep'     → GrepToolCard
  'find'     → FindToolCard
  'ls'       → LsToolCard
  fallback   → UnknownToolCard
```

---

### `ToolCallCard.tsx`
**Purpose** — Shared chrome for all tool cards: header (icon, name, status dot, timer), body slot, collapse toggle.

**Props / Contract** — Not imported directly; consumed via the specialized cards which wrap it.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/ToolCallCard.tsx`

**Timing** — Same as the parent `ToolCallPart`. Timer runs while `running === true`.

---

### `ToolResultPart.tsx`
**Purpose** — Renders a `tool-result` part. Note: in the current implementation, results are looked up by ID inside `ToolCallPart` and passed as the `result` prop, not rendered separately.

**Props / Contract**
```typescript
{
  part: Extract<ContentPart, { type: 'tool-result' }>
}
```

**Edit boundary** — `src/pages/agent-chat/components/message-parts/ToolResultPart.tsx`

**Timing** — Appears when a `tool-result` part streams in. Usually appears below the corresponding `ToolCallCard`.

---

### `BashToolCard.tsx`
**Purpose** — Renders a shell command tool call and its result.

**Props / Contract** — Wraps `ToolCallCard`; receives `ToolCallPart` props indirectly via the card pattern.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/BashToolCard.tsx`

---

### `ReadToolCard.tsx`
**Purpose** — Renders a file read tool call and its result with syntax highlighting.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/ReadToolCard.tsx`

---

### `EditToolCard.tsx`
**Purpose** — Renders a file edit with inline diff showing before/after.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/EditToolCard.tsx`

---

### `WriteToolCard.tsx`
**Purpose** — Renders a file write with diff preview of what was written.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/WriteToolCard.tsx`

---

### `GrepToolCard.tsx`
**Purpose** — Renders grep/search results: match count, file paths, highlighted match lines.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/GrepToolCard.tsx`

---

### `FindToolCard.tsx`
**Purpose** — Renders find files results with truncation notice if too many.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/FindToolCard.tsx`

---

### `LsToolCard.tsx`
**Purpose** — Renders directory listing with file type icons.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/LsToolCard.tsx`

---

### `UnknownToolCard.tsx`
**Purpose** — Fallback renderer for any tool not matched by name.

**Edit boundary** — `src/pages/agent-chat/components/message-parts/UnknownToolCard.tsx`

---

### `DiffView.tsx`
**Purpose** — Unified diff parser and renderer; used by `EditToolCard` and `WriteToolCard`.

**Props / Contract**
```typescript
{
  diff: string              // Raw unified diff string
  /** other props from usage in EditToolCard */
}
```

**Edit boundary** — `src/pages/agent-chat/components/message-parts/DiffView.tsx`

**Timing** — Streams in as the diff is generated (when `state: 'streaming'`). Updates live.

---

## Composer

> The composer is currently **inlined** in `AgentChatView.tsx` and duplicated in `ProjectChatView`. Phase 5 of the refactor extracts it to `src/components/layout/composer/Composer.tsx`.

### `Composer` (inline in `AgentChatView.tsx`)
**Purpose** — Text input, send/stop button, context usage ring, model picker, and decorative icon buttons.

**Edit boundary** — `src/pages/agent-chat/components/AgentChatView.tsx` (lines ~159-210)

**Timing** — Always visible when `status` is `running | busy | idle`. Stop icon is shown (vs. send) when `status === 'busy'`.

---

### `ContextUsageRing.tsx`
**Purpose** — SVG ring + tooltip showing model context usage as a percentage of max.

**Props / Contract**
```typescript
// Consumes contextUsage from useAgentRuntime
// Shows: used / max tokens as a radial progress ring
```

**Edit boundary** — `src/components/layout/composer/ContextUsageRing.tsx`

**Timing** — Updates reactively as `contextUsage` changes from the runtime. Ring fills in real time during long context operations.

---

### `ModelPicker/` (directory)
**Purpose** — Dropdown for selecting which model to use; filters by enabled providers case-insensitively.

**Edit boundary** — `src/components/layout/composer/ModelPicker/`

**Timing** — Opens on click. Changes are reflected immediately in the composer send action.

---

## Message Actions (per message)

### Copy, Edit, Regenerate
**Purpose** — Action buttons on `UserMessage` (copy, edit) and `AssistantMessage` (copy, regenerate).

**Edit boundary** — `src/pages/agent-chat/components/UserMessage.tsx` (copy, edit); `src/pages/agent-chat/components/AssistantMessage.tsx` (copy, regenerate)

**Timing** — Always visible as buttons on each message bubble. Edit mode on `UserMessage` switches to a textarea in-place.

---

## Response Generation Lifecycle (Exact Timing Reference)

```
1. USER SEND
   Composer → API call
   → useAgentRuntime: status = 'busy'

2. MESSAGE CREATED
   Empty assistant RuntimeMessage created (ts: now, parts: [])
   isMessageInFlight() = false → AssistantMessage renders null

3. FIRST STREAMING PART ARRIVES
   First token of thinking OR text part arrives (state: 'streaming')
   → isMessageInFlight() = true
   → WorkingTimelineRow MOUNTS (bottom of chat)
   → AssistantMessage still null (inFlight = true)

   State: 'running/busy', streaming: true

4. THINKING PART (if enabled)
   ThinkingPart appears, forced OPEN, shimmer, timer running
   → toolSummary shows "Thinking…"

5. THINKING COMPLETES
   thinking part state → 'complete'
   ThinkingPart collapses, label → "Thought for Xs"

6. TOOL CALL STARTS
   tool-call part (state: 'pending' or 'streaming-args')
   → ToolCallPart mounts with pending state
   → toolSummary → "Running 1 tool…"
   → ToolCallCard header: spinner, tool name, timer

7. TOOL ARGS COMPLETE
   tool-call part state → 'complete'

8. TOOL RESULT ARRIVES
   tool-result part (state: 'streaming' → 'complete')
   → ToolResultPart shows result inside ToolCallCard
   → DiffView streams in for edit/write

9. MORE THINKING / TEXT
   Another thinking or text part streams in
   → MarkdownPart/ThinkingPart update live

10. FINAL PART COMPLETES
    All parts → terminal states
    → isMessageInFlight() = false
    → AssistantMessage RENDERS (atomically, all at once)
    → WorkingTimelineRow UNMOUNTS

11. MESSAGE_END EVENT
    → message.usage attached to RuntimeMessage
    → UsageFooter appears on hover over AssistantMessage

12. STATUS UPDATE
    → useAgentRuntime: status = 'idle'
    → Composer re-enables send button
```

---

## Fresh Message Animation

**`ConversationArea.tsx`** applies a slide-in animation to the newest message when it first appears.

**Trigger:** `Virtuoso` renders a message whose index equals `messages.length - 1` for the first time.

**Effect:** CSS `animation: slideInUp 0.2s ease-out` on the new message element.

**Auto-scroll:** `Virtuoso` `followOutput="smooth"` ensures the new message scrolls into view.

---

## Files Not Currently Used (Dead Code)

These exist in the repo but are not rendered anywhere:

| File | Notes |
|---|---|
| `src/pages/agent-chat/components/AgentListRow.tsx` | List row for agent switcher (not in chat view) |
| `src/pages/agent-chat/components/AgentsListView.tsx` | Agent switcher panel |
| `src/pages/agent-chat/components/EmptyAgentsState.tsx` | Empty state for agent list |
| `src/pages/agent-chat/components/WorkingTimer.tsx` | Timer used by WorkingTimelineRow |
| `src/components/layout/composer/` | `Composer/` exists but has only `ContextUsageRing` and `ModelPicker/` — no shared `Composer.tsx` yet |
