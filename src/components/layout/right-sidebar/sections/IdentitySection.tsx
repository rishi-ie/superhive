import * as React from 'react'
import { Input } from '@/components/ui/input'
import { FieldRow } from '../primitives/FieldRow'
import type { SettingsSectionProps } from './registry'

/**
 * Identity section — `settings.identity.{name,description,workspace}`.
 *
 * Text inputs use a per-component 250ms debounce so rapid typing
 * doesn't fire one IPC per keystroke. The local `useState` keeps
 * the input feeling instant; the `patch` fires only after the
 * user pauses typing.
 */
export function IdentitySection({ settings, patch }: SettingsSectionProps) {
  const identity = (settings.identity ?? {}) as {
    name?: string
    description?: string
    workspace?: string
  }
  return (
    <div className="flex flex-col gap-gap-loose px-1 py-1">
      <DebouncedField
        id="identity-name"
        label="Name"
        initialValue={identity.name ?? ''}
        onCommit={(v) => patch?.('identity.name', v)}
        placeholder="Agent name"
      />
      <DebouncedField
        id="identity-description"
        label="Description"
        initialValue={identity.description ?? ''}
        onCommit={(v) => patch?.('identity.description', v)}
        placeholder="Brief description"
      />
      <DebouncedField
        id="identity-workspace"
        label="Workspace"
        initialValue={identity.workspace ?? ''}
        onCommit={(v) => patch?.('identity.workspace', v)}
        placeholder="./workspace"
      />
    </div>
  )
}

function DebouncedField({
  id,
  label,
  initialValue,
  onCommit,
  placeholder,
}: {
  id: string
  label: string
  initialValue: string
  onCommit: (v: string) => void
  placeholder?: string
}) {
  const [local, setLocal] = React.useState(initialValue)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external value -> local when manage.json reloads
  // (e.g. after a write completes, or after a remote write).
  React.useEffect(() => {
    setLocal(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const handleChange = (v: string) => {
    setLocal(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onCommit(v)
      timer.current = null
    }, 250)
  }

  return (
    <FieldRow label={label} htmlFor={id}>
      <Input
        id={id}
        className="h-7 text-sm"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
    </FieldRow>
  )
}
