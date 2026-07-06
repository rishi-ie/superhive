import { Input } from '@/components/ui/input';
import { FieldRow } from '../primitives/FieldRow';
import type { SettingsSectionProps } from './registry';

export function IdentitySection({ settings, patch }: SettingsSectionProps) {
  return (
    <div className="flex flex-col gap-3 px-1 py-1">
      <FieldRow label="Name" htmlFor="name">
        <Input
          id="name"
          className="h-7 text-sm"
          value={settings.name ?? ''}
          onChange={e => patch('name', e.target.value)}
          placeholder="Agent name"
        />
      </FieldRow>
      <FieldRow label="Description" htmlFor="description">
        <Input
          id="description"
          className="h-7 text-sm"
          value={settings.description ?? ''}
          onChange={e => patch('description', e.target.value)}
          placeholder="Brief description"
        />
      </FieldRow>
    </div>
  );
}
