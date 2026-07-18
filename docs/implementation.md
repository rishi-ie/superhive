# Chat Streaming Implementation

## Problem

Streaming is broken. The user sees a "Working..." indicator while Pi is processing, then the entire assistant message appears all at once when the response is done. The chat does **not** show Pi's output streaming in real time — text and tool calls appear retroactively.

## Root cause

Three gaps in the protocol pipeline cause text parts to never reach `state: 'complete'`, which keeps `isMessageInFlight()` returning `true`, which makes `<AssistantMessage>` return `null` during streaming.

### Gap 1 — RawTextAdapter drops `text_start` and `text_end`

`electron/pi-protocol/raw-text-adapter.ts:27-39` only handles `text_delta` from Pi's wire format. Pi emits three sub-events per text block (`text_start` / `text_delta` / `text_end`), but only the middle one is forwarded to the renderer.

Compare with `thinking_start` / `thinking_delta` / `thinking_end` handling at lines 40-74, which works correctly because all three are forwarded.

### Gap 2 — Renderer store ignores `text-end` and `message-end`

`src/stores/agent.ts:209-364` has handlers for:
- text-delta (extends text part with `state: 'streaming'`)
- thinking-end (flips thinking part to `complete`)
- tool-call-end (flips tool-call to `complete`)
- message-start (creates a new message shell)
- compaction-start, compaction-end
- auto-retry-start, auto-retry-end
- tool-execution-start, tool-execution-end
- image-attachment
- error

Missing:
- **text-end** — would flip text part to `complete`
- **message-end** — would mark the message as fully done

### Gap 3 — AssistantMessage hides itself during streaming

`src/pages/agent-chat/components/AssistantMessage.tsx:24,39`:
```ts
const inFlight = isMessageInFlight(message)
if (inFlight) return null  // <-- assistant bubble hidden during streaming
```

`isMessageInFlight` (models/runtime.ts:113-134) returns `true` whenever any text/thinking part has `state: 'streaming'`. Since text parts never get flipped to `complete` (gaps 1+2), `inFlight` returns `true` forever, and the assistant bubble is hidden.

### Why the message "pops up" at the end

When the turn ends with a tool call, `tool-execution-end` (stores/agent.ts:307-317) triggers `agents.getMessages(agentId)` — a refetch from `chat.jsonl`. The on-disk messages have parts with `state: 'complete'`. After the refetch, `inFlight` returns false, and the assistant bubble finally renders.

For text-only turns with no tool call, the message stays hidden until either `message-end` triggers a similar refetch, or until the user does something that triggers one.

---

## The fix

### Step 1 — adapter: emit text-start and text-end

**File**: `electron/pi-protocol/raw-text-adapter.ts`

In the `if (obj.type === 'message_update')` branch, add `text_start` and `text_end` handling. Mirrors the existing `thinking_*` handling at lines 40-74.

**Before** (lines 27-39):
```ts
if (obj.type === 'message_update') {
  const ev = obj.assistantMessageEvent as Record<string, unknown> | undefined
  if (ev?.type === 'text_delta') {
    if (!this.currentMessageId) {
      this.currentMessageId = randomUUID()
      emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
    }
    emit({
      type: 'text-delta',
      messageId: this.currentMessageId,
      delta: (ev.delta as string) ?? '',
    })
  }
```

**After**:
```ts
if (obj.type === 'message_update') {
  const ev = obj.assistantMessageEvent as Record<string, unknown> | undefined
  if (ev?.type === 'text_start') {
    if (!this.currentMessageId) {
      this.currentMessageId = randomUUID()
      emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
    }
    emit({
      type: 'text-start',
      messageId: this.currentMessageId,
      contentIndex: typeof ev.contentIndex === 'number' ? ev.contentIndex : 0,
    })
  }
  if (ev?.type === 'text_delta') {
    if (!this.currentMessageId) {
      this.currentMessageId = randomUUID()
      emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
    }
    emit({
      type: 'text-delta',
      messageId: this.currentMessageId,
      delta: (ev.delta as string) ?? '',
    })
  }
  if (ev?.type === 'text_end') {
    if (!this.currentMessageId) return
    emit({
      type: 'text-end',
      messageId: this.currentMessageId,
      contentIndex: typeof ev.contentIndex === 'number' ? ev.contentIndex : 0,
      content: (ev.content as string) ?? '',
    })
  }
```

The downstream `maybeEmitUsage(ev, emit)` call (line 107) is unchanged — it doesn't depend on which text sub-event was handled.

### Step 2 — store: handle text-end and message-end

**File**: `src/stores/agent.ts`

Add two new branches to the `onEvent` handler.

**`text-end` handler** — insert immediately after the existing `thinking-end` block (line 248):

```ts
} else if (ev.type === 'text-end') {
  const idx = entry.messages.findIndex((m) => m.id === ev.messageId)
  if (idx !== -1) {
    const msg = entry.messages[idx]!
    let flipped = false
    entry.messages = [
      ...entry.messages.slice(0, idx),
      {
        ...msg,
        parts: msg.parts.map((p) => {
          if (flipped || p.type !== 'text' || p.state === 'complete') return p
          flipped = true
          return { ...p, text: ev.content || p.text, state: 'complete' as const }
        }),
      },
      ...entry.messages.slice(idx + 1),
    ]
  }
}
```

This mirrors `thinking-end` (lines 231-248): finds the message, locates the trailing text part, flips its state to `complete` with the final content.

**`message-end` handler** — insert after the existing `message-start` block (line 360):

```ts
} else if (ev.type === 'message-end') {
  const idx = entry.messages.findIndex((m) => m.id === ev.messageId)
  if (idx !== -1) {
    const msg = entry.messages[idx]!
    entry.messages = [
      ...entry.messages.slice(0, idx),
      {
        ...msg,
        parts: msg.parts.map((p) =>
          (p.type === 'text' || p.type === 'thinking') && p.state === 'streaming'
            ? { ...p, state: 'complete' as const }
            : p
        ),
      },
      ...entry.messages.slice(idx + 1),
    ]
  }
}
```

This is a defensive cleanup that flips any leftover streaming parts to `complete` when the message closes, even if `text-end` was missed.

### Step 3 — AssistantMessage: render during streaming

**File**: `src/pages/agent-chat/components/AssistantMessage.tsx`

**Delete** these two lines (lines 24 and 39):
```ts
const inFlight = isMessageInFlight(message)
// ... and ...
if (inFlight) return null
```

Also remove the `isMessageInFlight` import from line 11 if it's no longer used:
```ts
import { isMessageInFlight, type ContentPart } from '@/models/runtime'
```

Replace with:
```ts
import type { ContentPart } from '@/models/runtime'
```

The rest of the render path stays unchanged. `parts.map(...)` walks the message stream, `<MarkdownPart>` renders text, `<ThinkingPart>` renders thinking, `<ToolCallPart>` renders tool calls. All of these already work with `state: 'streaming'` parts — they just didn't have a chance to render before because of the early return.

### Step 4 — remove WorkingTimelineRow

**File**: `src/pages/agent-chat/components/ConversationArea.tsx`

Since the message itself now streams visibly, the bottom-of-conversation "Working..." overlay is redundant.

**Delete imports** (line 4):
```ts
import { WorkingTimelineRow } from './WorkingTimelineRow'
```

**Slim import** on line 5:
```ts
// Before:
import { isMessageInFlight, getMessageStartedAt, getActiveToolSummary } from '@/models/runtime'
// After:
import {} from '@/models/runtime'
// or just delete the import line if `isMessageInFlight` is no longer used anywhere
```

Note: `isMessageInFlight` is also used by `getActiveToolSummary` which feeds into `WorkingTimelineRow`. After deleting the timeline row, all three imports become unused. Verify with `rg "isMessageInFlight|getMessageStartedAt|getActiveToolSummary" src/pages/agent-chat/components/ConversationArea.tsx` after deletion.

**Delete derivation** (lines 96-100):
```ts
void lastTailRef

const lastMessage = messages[messages.length - 1]
const showWorkingRow =
  lastMessage?.role === 'assistant' && isMessageInFlight(lastMessage)
```

The `void lastTailRef` line at 96 is a vestigial reference for a no-longer-used `useRef`. Delete it.

**Delete render block** (lines 147-154):
```ts
{showWorkingRow ? (
  <div className="absolute bottom-0 inset-x-0 z-10 mx-auto max-w-3xl px-4 sm:px-6 pb-2 pointer-events-none">
    <WorkingTimelineRow
      startedAt={getMessageStartedAt(lastMessage)}
      toolSummary={getActiveToolSummary(lastMessage)}
    />
  </div>
) : null}
```

**Delete the now-unused component file**:
```bash
rm /Users/rishi/work/superhive-5/superhive/src/pages/agent-chat/components/WorkingTimelineRow.tsx
```

Also delete `lastTailRef` declaration in the component (line 38) and its `useRef` import — verify with `rg "lastTailRef|VirtuosoHandle" src/pages/agent-chat/components/ConversationArea.tsx`.

---

## Final outcome

After the fix, the user sees:

### Open a chat
Same as today — boot, error, stopped, waiting states stay as full-screen fork components (AgentBooting, AgentError, AgentStopped, AgentWaiting). No change.

### Send a message
```
User types in composer, hits Enter
   ↓
Composer clears, send button → Stop
   ↓
The assistant bubble appears in the chat with an empty/streaming text part
   ↓
Text streams in character by character as Pi generates it
   - "I can help with"
   - "I can help with that."
   - "I can help with that. Let me check"
   - "I can help with that. Let me check the file..."
```

The user watches Pi generate directly in the conversation, exactly like Claude.ai or any modern chat UI.

### Thinking mid-turn
```
Pi starts reasoning
   ↓
A thinking block appears with shimmer effect
   ↓
Delta events stream in, the thinking text grows
   ↓
thinking-end fires → block closes, shimmer stops, timer freezes
```

The thinking block renders normally through `<ThinkingPart>` — no change needed since that flow already worked.

### Tool call mid-turn
```
Pi decides to call a tool
   ↓
Tool card appears with pending background (yellow-tinted)
   ↓
Args stream in (if the args are large enough to delta)
   ↓
tool-call-end fires → args finalized
   ↓
tool-execution-start fires → tool card stays pending while running
   ↓
tool-execution-update events stream partial results in-place (for tools that support it)
   ↓
tool-execution-end fires → background flips to success (green) or error (red)
```

The user sees each tool call appear, run, and complete in real time. No "Working..." hidden behind a curtain.

### End of turn
```
Pi finishes the response
   ↓
text-end fires → trailing text part flips to state:'complete'
   ↓
status flips busy → active
   ↓
Composer re-enables send button (back to up-arrow)
```

The user sees the message was already visible throughout — it doesn't "pop up" at the end. The text part just stops growing.

### Compaction / retry banners
Unchanged. They keep their place at the top of the conversation via `<ActiveStateBanners>`. Cancel buttons currently wired to `stop` (kills the agent) — separate fix to wire them to `abortCompaction` / `abortRetry` is out of scope here.

---

## Verification

After build:
```bash
cd /Users/rishi/work/superhive-5/superhive
bun run typecheck
bun run build
bun test
```

All three must pass. `bun test` should stay 37/37 green — no test changes.

### Manual smoke test
1. Open an agent chat, type a long prompt that produces a multi-paragraph response.
2. Watch the chat as you hit Enter — the assistant bubble should appear and the text should stream in real time, character by character.
3. Send a prompt that triggers a tool call (e.g. "read the package.json").
4. Watch the tool card appear with pending background, the args stream in, then the result.
5. Confirm the message does **not** pop up at the end — it should have been visible the whole time.

### Regression check
- The composer send/stop button still flips between up-arrow and stop icon based on status.
- The compaction banner still appears at the top when Pi auto-compacts.
- The retry banner still appears with countdown when Pi auto-retries.
- All 5 fork components (AgentBooting, AgentError, AgentStopped, AgentWaiting, AgentEmpty) still render as full-screen overlays for their respective non-streaming states.

---

## Files touched

| File | Change |
|---|---|
| `electron/pi-protocol/raw-text-adapter.ts` | +2 event handlers (`text_start`, `text_end`) in the `message_update` branch |
| `src/stores/agent.ts` | +1 branch (`text-end`) after `thinking-end`, +1 branch (`message-end`) after `message-start` |
| `src/pages/agent-chat/components/AssistantMessage.tsx` | -2 lines (inFlight hide), -1 import (isMessageInFlight) |
| `src/pages/agent-chat/components/ConversationArea.tsx` | -1 import (WorkingTimelineRow), -1 import (isMessageInFlight), -1 derivation, -1 render block, -1 dead ref |
| `src/pages/agent-chat/components/WorkingTimelineRow.tsx` | DELETED |

5 files touched (4 modified, 1 deleted).

---

## Out of scope

- Abort IPC plumbing for compaction/retry cancel buttons (separate fix)
- Branching, forking, slash commands
- Header / footer / loaded-resources chrome
- Editor upgrade (multiline, autocomplete, history, kill ring, undo)
- Pre-runtime state consolidation (5 fork components stay)
- Status indicator pill above the composer
- Inline notices in the conversation for transient states

Each of these is a separate concern and was explicitly deferred during planning.
