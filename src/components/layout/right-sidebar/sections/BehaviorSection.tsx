import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { SettingsSectionProps } from './registry'

export function BehaviorSection({ settings, patch }: SettingsSectionProps) {
  const perms = settings.permissions ?? { filesystem: true, terminal: true, network: true }

  const setPerm = (key: 'filesystem' | 'terminal' | 'network', value: boolean) => {
    patch('permissions', { ...perms, [key]: value })
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          className="min-h-[100px] text-sm resize-none"
          value={settings.systemPrompt ?? ''}
          onChange={e => patch('systemPrompt', e.target.value)}
          placeholder="You are a..."
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs">Permissions</Label>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Filesystem</span>
          <Switch
            checked={perms.filesystem ?? true}
            onCheckedChange={v => setPerm('filesystem', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Terminal</span>
          <Switch
            checked={perms.terminal ?? true}
            onCheckedChange={v => setPerm('terminal', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Network</span>
          <Switch
            checked={perms.network ?? true}
            onCheckedChange={v => setPerm('network', v)}
          />
        </div>
      </div>
    </div>
  )
}
