import { Textarea } from '@/components/ui/textarea';
import { SwitchRow } from '../primitives/SwitchRow';
import type { SettingsSectionProps } from './registry';

export function BehaviorSection({ settings, patch }: SettingsSectionProps) {
  const perms = settings.permissions ?? { filesystem: true, terminal: true, network: true };

  const setPerm = (key: 'filesystem' | 'terminal' | 'network', value: boolean) => {
    patch('permissions', { ...perms, [key]: value });
  };

  return (
    <div className="flex flex-col gap-gap-loose py-1">
      <div className="flex flex-col gap-gap-tight">
        <span className="text-xs text-muted-foreground">System Prompt</span>
        <Textarea
          className="min-h-[80px] resize-none text-sm"
          value={settings.systemPrompt ?? ''}
          onChange={e => patch('systemPrompt', e.target.value)}
          placeholder="You are a helpful agent..."
        />
      </div>
      <SwitchRow
        label="Filesystem"
        description="Read and write local files"
        checked={perms.filesystem ?? true}
        onCheckedChange={v => setPerm('filesystem', v)}
      />
      <SwitchRow
        label="Terminal"
        description="Run shell commands"
        checked={perms.terminal ?? true}
        onCheckedChange={v => setPerm('terminal', v)}
      />
      <SwitchRow
        label="Network"
        description="Make HTTP requests"
        checked={perms.network ?? true}
        onCheckedChange={v => setPerm('network', v)}
      />
    </div>
  );
}
