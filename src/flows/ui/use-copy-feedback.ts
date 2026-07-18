import * as React from 'react'

const COPIED_RESET_MS = 1000

/**
 * Inline "copied" tick state. Click handler calls `trigger()` after a
 * successful copy; the icon flips for `COPIED_RESET_MS` then reverts.
 * Caller owns the icon swap; this hook owns the timer + cleanup.
 */
export function useCopyFeedback(): { copied: boolean; trigger: () => void } {
  const [copied, setCopied] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = React.useCallback(() => {
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }, [])

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  return { copied, trigger }
}
