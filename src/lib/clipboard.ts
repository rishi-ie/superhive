import { toast } from 'sonner'

/**
 * Copy `text` to the OS clipboard. Falls back to a transient text area if
 * `navigator.clipboard.writeText` rejects (older browsers or insecure
 * contexts). Returns true on success.
 */
export async function copyToClipboard(text: string, successLabel?: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      fallbackCopy(text)
    }
    toast.success(successLabel ?? 'Copied to clipboard')
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
