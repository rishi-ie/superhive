/**
 * Shortcut flow: copy the last assistant message text to clipboard.
 * Owned by the UI layer — lives here so AgentChatView / ProjectChatView
 * don't import clipboard utilities directly.
 */

import { copyText } from './copy-text'
import { getMessageText } from '@/models/runtime'
import type { ShortcutCopyLastAssistantInput, ShortcutCopyLastAssistantResult } from '@/models/ui'

export async function shortcutCopyLastAssistant({
  messages,
}: ShortcutCopyLastAssistantInput): Promise<ShortcutCopyLastAssistantResult> {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  if (!lastAssistant) return { ok: false }

  const text = getMessageText(lastAssistant)
  const copied = await copyText(text, { successLabel: 'Copied last assistant message' })
  return { ok: copied, text }
}
