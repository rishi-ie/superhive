/**
 * Send a message from the composer.
 * Validates live status, calls the runtime send() on success. Page view
 * retains ownership of input state (clearing + refocusing). Model-selection
 * gating is intentionally not enforced here — the runtime surfaces a
 * "no model" error via toast if Pi rejects the send, and the composer
 * stays interactive so the user can edit and retry.
 */

export interface SendMessageInput {
  text: string
  isLive: boolean
  send: (text: string) => void
}

export interface SendMessageResult {
  ok: boolean
}

export function sendMessage({ text, isLive, send }: SendMessageInput): SendMessageResult {
  const trimmed = text.trim()
  if (!trimmed || !isLive) return { ok: false }
  send(trimmed)
  return { ok: true }
}