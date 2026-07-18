import { toast } from 'sonner'

/**
 * Copy `text` to the OS clipboard. Falls back to a transient text area if
 * `navigator.clipboard.writeText` rejects (older browsers or insecure
 * contexts). Returns true on success.
 *
 * Side effects live here: DOM, navigator.clipboard, sonner toast. Callers
 * stay pure.
 *
 * Lifted from `src/lib/clipboard.ts` and renamed for the flows convention.
 *
 * Pass `{ silent: true }` to skip the success toast — useful for UI that
 * has its own inline indicator (e.g. the "copied" tick in CodeBlock).
 */
export async function copyText(
  text: string,
  options: { successLabel?: string; silent?: boolean } = {},
): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      fallbackCopy(text)
    }
    if (!options.silent) {
      toast.success(options.successLabel ?? 'Copied to clipboard')
    }
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to copy'
    toast.error(message)
    return false
  }
}

function fallbackCopy(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
