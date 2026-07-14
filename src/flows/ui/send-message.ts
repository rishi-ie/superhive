/**
 * Send a message from the composer.
 * Validates model selection and live status, toasts on failure,
 * calls the runtime send() on success. Page view retains ownership
 * of input state (clearing + refocusing).
 */

import { toast } from 'sonner'

export interface SendMessageInput {
  text: string
  hasModel: boolean
  isLive: boolean
  send: (text: string) => void
}

export interface SendMessageResult {
  ok: boolean
}

export function sendMessage({ text, hasModel, isLive, send }: SendMessageInput): SendMessageResult {
  const trimmed = text.trim()
  if (!trimmed || !isLive) return { ok: false }
  if (!hasModel) {
    toast.error('Pick a model first')
    return { ok: false }
  }
  send(trimmed)
  return { ok: true }
}
