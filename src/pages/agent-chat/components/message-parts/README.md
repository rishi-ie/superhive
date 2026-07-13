# Per-part renderers for `RuntimeMessage.parts`.
# See `src/models/runtime.ts` for the `ContentPart` discriminated union.
#
# Each renderer is invoked once per part, and is responsible for that part's
# UI surface. The list will grow across Phase 3+ as we light up markdown,
# thinking, tool calls, and so on.
