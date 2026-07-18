import { copyText } from '@/flows/ui/copy-text'
import type { RuntimeMessage } from '@/types/electron'

/**
 * Copy a single chat message to the clipboard.
 *  - user message → verbatim text (one text part).
 *  - assistant message → only `text` parts, joined with `\n\n`. Thinking,
 *    tool calls, tool results, images, and compaction summaries are excluded.
 *
 * Silent on success — the caller renders its own inline "copied" tick.
 * Returns true on success, false on failure.
 */
export async function copyMessage(message: RuntimeMessage): Promise<boolean> {
  const text = extractCopyableText(message)
  return copyText(text, { silent: true })
}

function extractCopyableText(message: RuntimeMessage): string {
  const chunks: string[] = []
  for (const part of message.parts) {
    if (part.type === 'text') chunks.push(part.text)
  }
  return chunks.join('\n\n')
}
