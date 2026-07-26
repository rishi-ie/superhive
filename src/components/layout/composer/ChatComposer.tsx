import * as React from 'react'
import { cn } from '@/lib/utils'

const MAX_TEXTAREA_HEIGHT = 152

export const composerIconButtonClass =
  'flex size-8 shrink-0 items-center justify-center rounded-icon text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40'

export const composerSendButtonClass =
  'flex size-10 shrink-0 items-center justify-center rounded-full text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40'

export const composerTextareaClass =
  'block min-h-11 max-h-[152px] w-full resize-none overflow-y-hidden border-0 bg-transparent px-5 py-2.5 text-sm font-semibold leading-6 text-sidebar-foreground placeholder:font-normal placeholder:text-muted-foreground outline-none focus-visible:ring-0 focus-visible:ring-offset-0'

export function ChatComposerFrame({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl px-4 py-4 sm:px-6', className)}>
      <div className="relative overflow-visible rounded-3xl border border-border/70 bg-[#1E1E1E] shadow-sm">
        {children}
      </div>
    </div>
  )
}

export function ChatComposerToolbar({ children }: React.PropsWithChildren) {
  return <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">{children}</div>
}

export function useComposerTextareaAutosize(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
) {
  React.useLayoutEffect(() => {
    const textarea = ref.current
    if (!textarea) return

    textarea.style.height = '0px'
    const height = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)
    textarea.style.height = `${height}px`
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden'
  }, [ref, value])
}
