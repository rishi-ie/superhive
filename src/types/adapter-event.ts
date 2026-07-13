import type { AdapterEvent } from '@/types/electron'

/**
 * Distribute the `AdapterEvent` union by `type`, then pick the variant whose
 * `type` field matches a string-literal `T`. Used by `agents.onEventVariant`
 * to narrow the callback argument without restating the discriminated
 * predicate at every call site.
 *
 * Example:
 *   type T = ExtractAdapterEvent<'thinking-end'>
 *   //   → { type: 'thinking-end'; messageId: string; contentIndex: number; content: string }
 */
export type ExtractAdapterEvent<T extends AdapterEvent['type']> = Extract<
  AdapterEvent,
  { type: T }
>
