/**
 * Phase 13.2 — global keyboard shortcuts for the chat view.
 *
 *   Cmd/Ctrl + Shift + C   copy last assistant message
 *   Cmd/Ctrl + Shift + R   regenerate last assistant message
 *   Cmd/Ctrl + .           stop the running agent (if busy)
 *
 * The hook only attaches a listener once even if many chat views mount
 * (same pattern as `useCommandPalette`). Handlers are forwarded as
 * callbacks so the hook doesn't reach into `@/api` directly — the chat
 * view resolves those from flows.
 *
 * Set `enabled = false` for views that shouldn't receive shortcuts
 * (e.g. settings).
 */

let listenerAttached = false

interface ShortcutHandlers {
  onCopyLast?: () => void
  onRegenerate?: () => void
  onStop?: () => void
  enabled?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

function ensureListener() {
  if (listenerAttached || typeof window === 'undefined') return
  listenerAttached = true
  window.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return
    if (isEditableTarget(e.target)) return
    const key = e.key.toLowerCase()
    if (e.shiftKey && key === 'c') {
      e.preventDefault()
      lastHandlers?.onCopyLast?.()
    } else if (e.shiftKey && key === 'r') {
      e.preventDefault()
      lastHandlers?.onRegenerate?.()
    } else if (key === '.' || e.key === '>') {
      e.preventDefault()
      lastHandlers?.onStop?.()
    }
  })
}

let lastHandlers: ShortcutHandlers | null = null

export function useChatShortcuts(handlers: ShortcutHandlers) {
  ensureListener()
  lastHandlers = handlers
}
