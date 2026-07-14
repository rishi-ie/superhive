/**
 * Shortcut flow: regenerate the last assistant message.
 * Wraps the existing `regenerate` flow so page views don't call it directly.
 */

import { regenerate } from '@/flows/agents/crud/regenerate'
import type { RuntimeMessage } from '@/types/electron'

export interface ShortcutRegenerateLastInput {
  messages: RuntimeMessage[]
  agentId: string
}

export interface ShortcutRegenerateLastResult {
  ok: boolean
}

export async function shortcutRegenerateLast({
  messages,
  agentId,
}: ShortcutRegenerateLastInput): Promise<ShortcutRegenerateLastResult> {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  if (!lastAssistant) return { ok: false }

  const result = await regenerate({ agentId, fromMessageId: lastAssistant.id })
  return { ok: result.ok }
}
