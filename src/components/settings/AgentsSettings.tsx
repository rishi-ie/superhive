/**
 * Agents settings — global agent defaults (default engine for new agents).
 */
import { SettingSection } from './shared/SettingSection';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Badge } from '@/components/ui/Badge';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import type { EngineId } from '@/data/settings/interface';

const ENGINE_OPTIONS: { value: EngineId; label: string; description: string }[] = [
  { value: 'sonnet', label: 'Sonnet 4', description: 'Balanced speed and intelligence — good default for most tasks.' },
  { value: 'opus', label: 'Opus 4.8', description: 'Highest intelligence — best for complex reasoning and long tasks.' },
  { value: 'claude', label: 'Claude 3.5', description: 'Concise outputs — good for quick edits and reviews.' },
  { value: 'codex', label: 'Codex', description: 'Code-first — optimized for code generation and refactoring.' },
];

/**
 * Agents settings page — global defaults applied to new agents.
 */
export function AgentsSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();

  const currentEngine = settings.agents.defaultEngine;

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Agents"
        description="Configure global defaults applied to new agents when they are spawned."
      />

      <SettingSection
        title="Default Engine"
        description="The default model engine assigned to new agents. Configurable per-agent in the Control Matrix."
      >
        <div className="grid grid-cols-2 gap-3">
          {ENGINE_OPTIONS.map(engine => {
            const isActive = currentEngine === engine.value;
            return (
              <SelectableCard
                key={engine.value}
                title={engine.label}
                description={engine.description}
                selected={isActive}
                onClick={() => {
                  update('agents', { defaultEngine: engine.value });
                  toast({ title: `Default engine set to ${engine.label}` });
                }}
              >
                {isActive && <Badge variant="active">Active</Badge>}
              </SelectableCard>
            );
          })}
        </div>
      </SettingSection>
      <div className="mt-6 flex justify-end">
        <ResetSection domain="agents" />
      </div>
    </div>
  );
}
