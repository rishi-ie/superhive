import { copyText } from '@/flows/ui/copy-text'
import type { ChatRow, AssistantMessage, UserMessage } from '@/models/assistant-message'

/**
 * Copy a single chat message to the clipboard.
 *  - user message → verbatim text.
 *  - assistant message → only the text blocks from `response`, joined with
 *    `\n\n`. Thinking / tool-call / tool-result / image / compaction rows
 *    are excluded.
 *
 * Silent on success — the caller renders its own inline "copied" tick.
 * Returns true on success, false on failure.
 */
export async function copyMessage(message: ChatRow): Promise<boolean> {
  const text = extractCopyableText(message)
  return copyText(text, { silent: true })
}

function extractCopyableText(message: ChatRow): string {
  if (message.role === 'user') {
    return message.text
  }
  return extractAssistantText(message)
}

function extractAssistantText(message: AssistantMessage): string {
  const chunks: string[] = []
  for (const block of message.response) {
    if (block.type === 'text') chunks.push(block.text)
  }
  return chunks.join('\n\n')
}

export type { ChatRow, AssistantMessage, UserMessage }
