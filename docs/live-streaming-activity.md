# Spec: Live Streaming Activity

## Objective

Make the in-progress assistant response calm, accurate, and useful. The user sees one replacing live status and stable streamed prose rather than a raw event log.

## Runtime contract

The existing renderer queue remains the only source of live state.

1. `tool-call-start` / `tool-call-delta` means **preparing**.
2. `tool-execution-start` means **running**.
3. `tool-execution-end` means **complete** or **error**.
4. `tool-call-end` never means the tool has completed.
5. `report_activity({ summary })` emits a safe planning/review status for the
   live UI and persisted trace; it never contains raw reasoning.

Only a short, safe target (path, query, URL, or abbreviated command) is persisted for an activity row. Raw tool arguments are never exposed; a normalized tool result is shown only after the user expands its completed State 2 audit row.

## UX contract

- A response run starts when the user sends a prompt and ends only at
  `agent-end`; individual Pi turns never reset it.
- State 1 displays a persistent `Working for …` header followed immediately by
  one shimmering `LiveStatusLine`; there is no divider or in-response Stop control.
- Until prose arrives, each incoming activity replaces the previous State 1
  status. When prose arrives, the preceding status freezes immediately above
  that prose and the latest activity continues beneath it.
- State 1 summarizes thinking as status. In State 2, a frozen thinking row is
  expandable and shows the model-emitted thinking trace for audit.
- Frozen activity uses past tense. Tool rows are expandable and retain their
  tool name, safe target, outcome, and normalized result.
- State 1 preserves `status → prose → status → prose` order. State 2 places
  every earlier status/prose pair in the trace and leaves only the final prose
  outside the accordion.
- State 2 displays `Worked for …` with a chevron; its trace is collapsed by default,
  expands under the divider, and final Markdown follows the trace.
- Manual scrolling is respected; the UI offers a counted `Jump to latest` action.

## Files

- `src/models/assistant-message.ts` — persisted activity shape
- `src/models/runtime.ts` — streaming state and queue operations
- `src/flows/agents/runtime/event-translator.ts` — Pi event mapping
- `src/flows/agents/runtime/queue.ts` — lifecycle state transitions and safe targets
- `src/pages/agent-chat/components/LiveStatusLine.tsx` — State 1 surface
- `src/pages/agent-chat/components/MergedAssistantMessage.tsx` — response-run composition
- `src/pages/agent-chat/components/AssistantMessage.tsx` — State 1 / State 2 composition
- `src/pages/agent-chat/components/ConversationArea.tsx` — scrolling behavior

## Commands

- Typecheck: `bun run typecheck`
- Production build: `bun run build`

## Boundaries

- Always preserve the existing queue as the single writer of streaming state.
- Ask before adding dependencies or expanding the audit scope beyond the
  completed thinking traces and normalized tool results.
- Never persist or display sensitive raw arguments as activity labels.

## Success criteria

- A tool is not displayed as complete before `tool-execution-end`.
- State 1 remains one continuous run across multiple Pi turns, with accurate elapsed time and no in-response Stop control.
- State 2 uses the duration captured at `agent-end` and retains the same
  complete trace after reload.
- Tool-heavy responses remain compact and readable.
- Agent chat and project chat share the same behavior through `ConversationArea`.
