import * as React from 'react'
import { CircleNotchIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  PreparingToastAction,
  PreparingToastHandle,
  PreparingToastInput,
  PreparingToastVariant,
} from '@/models/component'

export type { PreparingToastVariant, PreparingToastAction, PreparingToastInput, PreparingToastHandle }

interface InternalToast extends PreparingToastInput {
  id: string
  variant: PreparingToastVariant
  createdAt: number
}

const listeners = new Set<() => void>()
let toasts: InternalToast[] = []

function emit(): void {
  for (const l of listeners) l()
}

export function usePreparingToast(): PreparingToastHandle {
  return React.useMemo<PreparingToastHandle>(
    () => ({
      show(input) {
        const id = `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        toasts = [
          ...toasts,
          {
            id,
            title: input.title,
            description: input.description,
            variant: input.variant ?? 'loading',
            actions: input.actions,
            createdAt: Date.now(),
          },
        ]
        emit()
        return id
      },
      update(id, patch) {
        toasts = toasts.map((t) => (t.id === id ? { ...t, ...patch } : t))
        emit()
      },
      dismiss(id) {
        toasts = toasts.filter((t) => t.id !== id)
        emit()
      },
    }),
    [],
  )
}

const FADE_OUT_MS = 200

export function PreparingToast() {
  const [, force] = React.useReducer((n) => n + 1, 0)
  const [fadingOut, setFadingOut] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    const listener = () => force()
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setFadingOut((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      emit()
      setFadingOut((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, FADE_OUT_MS)
  }, [])

  const visible = toasts.slice(-4)

  if (visible.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 z-50"
    >
      <div className="pointer-events-none absolute bottom-4 right-4 flex w-80 flex-col items-stretch gap-stack">
        {visible.map((t) => {
          const isError = t.variant === 'error'
          const isFading = fadingOut.has(t.id)
          return (
            <div
              key={t.id}
              data-variant={t.variant}
              className={cn(
                'pointer-events-auto rounded-card border bg-card text-card-foreground shadow-md ring-1 ring-foreground/10 transition-opacity duration-200',
                isFading ? 'opacity-0' : 'opacity-100',
                isError ? 'border-destructive/40' : 'border-border',
              )}
            >
              <div className="flex items-start gap-stack p-card">
                <span className="mt-0.5 shrink-0">
                  {isError ? (
                    <Icon
                      icon={WarningCircleIcon}
                      className="size-4 text-destructive"
                    />
                  ) : (
                    <Icon
                      icon={CircleNotchIcon}
                      className="size-4 animate-spin text-muted-foreground"
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">
                    {t.title}
                  </div>
                  {t.description ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t.description}
                    </div>
                  ) : null}
                  {t.actions && t.actions.length > 0 ? (
                    <div className="mt-3 flex items-center gap-stack">
                      {t.actions.map((a) => (
                        <Button
                          key={a.label}
                          variant="outline"
                          size="sm"
                          onClick={a.onClick}
                        >
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                >
                  <Icon icon={XIcon} className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
