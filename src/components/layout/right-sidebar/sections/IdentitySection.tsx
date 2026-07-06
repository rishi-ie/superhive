import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SettingsSectionProps } from './registry'

export function IdentitySection({ settings, patch }: SettingsSectionProps) {
  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="name">Name</Label>
        <Input
          id="name"
          className="h-8 text-sm"
          value={settings.name ?? ''}
          onChange={e => patch('name', e.target.value)}
          placeholder="Agent name"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="description">Description</Label>
        <Input
          id="description"
          className="h-8 text-sm"
          value={settings.description ?? ''}
          onChange={e => patch('description', e.target.value)}
          placeholder="Brief description"
        />
      </div>
    </div>
  )
}
