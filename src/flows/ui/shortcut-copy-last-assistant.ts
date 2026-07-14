/**
 * Shortcut flow: copy the last assistant message text to clipboard.
 * Owned by the UI layer — lives here so AgentChatView / ProjectChatView
 * don't import clipboard utilities directly.
 */

import { copyToClipboard } from '@/lib/clipboard'
import { getMessageText } from '@/models/runtime'
import type { RuntimeMessage } from '@/types/electron'

export interface ShortcutCopyLastAssistantInput {
  messages: RuntimeMessage[]
}

export interface ShortcutCopyLastAssistantResult {
  ok: boolean
  text?: string
}

export async function shortcutCopyLastAssistant({
  messages,
}: ShortcutCopyLastAssistantInput): Promise<ShortcutCopyLastAssistantResult> {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  if (!lastAssistant) return { ok: false }

  const text = getMessageText(lastAssistant)
  const copied = await copyToClipboard(text, 'Copied last assistant message')
  return { ok: copied, text }
}
