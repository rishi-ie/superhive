import { Input } from '@/components/ui/input';
import { FieldRow } from '../primitives/FieldRow';
import type { SettingsSectionProps } from './registry';

/**
 * Identity section — `settings.identity.{name,description,workspace}`.
 *
 * The 4-file truth split moved identity under `manage.json.identity`
 * (was flat in the merged `Superhive-pi-<basename>.json`). Patch keys
 * are dotted so the renderer's `expandDottedKey`/`deepMergeDotted`
 * paths land them at the correct depth in `WRITE_MANAGE`.
 */
export function IdentitySection({ settings, patch }: SettingsSectionProps) {
  const identity = (settings.identity ?? {}) as {
    name?: string;
    description?: string;
    workspace?: string;
  };
  return (
    <div className="flex flex-col gap-gap-loose px-1 py-1">
      <FieldRow label="Name" htmlFor="identity-name">
        <Input
          id="identity-name"
          className="h-7 text-sm"
          value={identity.name ?? ''}
          onChange={(e) => patch?.('identity.name', e.target.value)}
          placeholder="Agent name"
        />
      </FieldRow>
      <FieldRow label="Description" htmlFor="identity-description">
        <Input
          id="identity-description"
          className="h-7 text-sm"
          value={identity.description ?? ''}
          onChange={(e) => patch?.('identity.description', e.target.value)}
          placeholder="Brief description"
        />
      </FieldRow>
      <FieldRow label="Workspace" htmlFor="identity-workspace">
        <Input
          id="identity-workspace"
          className="h-7 text-sm"
          value={identity.workspace ?? ''}
          onChange={(e) => patch?.('identity.workspace', e.target.value)}
          placeholder="./workspace"
        />
      </FieldRow>
    </div>
  );
}
