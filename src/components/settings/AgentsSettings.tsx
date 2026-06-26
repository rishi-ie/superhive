/**
 * Agents settings — global agent defaults (default engine for new agents).
 */
import { Check } from 'lucide-react';
import { SettingSection } from './shared/SettingSection';
import { ResetSection } from './shared/ResetSection';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import type { EngineId } from '@/data/settings/interface';
import { STROKE_WIDTH } from '@/lib/constants';

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
      <div className="pb-8">
        <h2 className="text-2xl font-semibold text-foreground">Agents</h2>
        <p className="mt-2 text-sm text-muted-foreground">Configure global defaults applied to new agents when they are spawned.</p>
      </div>

      <SettingSection
        title="Default Engine"
        description="The default model engine assigned to new agents. Configurable per-agent in the Control Matrix."
      >
        <div className="grid grid-cols-2 gap-3">
          {ENGINE_OPTIONS.map(engine => {
            const isActive = currentEngine === engine.value;
            return (
              <button
                key={engine.value}
                type="button"
                onClick={() => {
                  update('agents', { defaultEngine: engine.value });
                  toast({ title: `Default engine set to ${engine.label}` });
                }}
                aria-pressed={isActive}
                className={`relative flex items-start gap-3 rounded-md border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                  isActive
                    ? 'border-chart-1 bg-chart-1/5'
                    : 'border-border hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{engine.label}</span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-chart-1/20 px-1.5 py-0.5 text-[9px] font-medium text-chart-1 uppercase tracking-wider">
                        <Check size={9} strokeWidth={STROKE_WIDTH} />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{engine.description}</p>
                </div>
              </button>
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
