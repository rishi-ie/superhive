import * as React from 'react'

/**
 * Track elapsed seconds since `running` became true.
 * Stops counting once `running` flips to false so the caller can
 * freeze the display at the completion moment.
 */
export function useElapsedSeconds(running: boolean): number {
  const [seconds, setSeconds] = React.useState(0)
  const startedAt = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!running) {
      startedAt.current = null
      return
    }
    if (startedAt.current == null) startedAt.current = Date.now()
    const id = setInterval(() => {
      if (startedAt.current != null) {
        setSeconds(Math.round((Date.now() - startedAt.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  return seconds
}
