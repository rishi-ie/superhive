import * as React from 'react'

interface WorkingTimerProps {
  startedAt: number
  className?: string
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export function WorkingTimer({ startedAt, className }: WorkingTimerProps) {
  const textRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const update = () => {
      if (textRef.current) {
        const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
        textRef.current.textContent = formatElapsed(elapsed)
      }
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return (
    <span ref={textRef} className={className}>
      {formatElapsed(0)}
    </span>
  )
}
