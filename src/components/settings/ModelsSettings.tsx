/**
 * Models settings — available engines, API keys per provider, fallback chain, custom endpoint.
 */
import { useState } from 'react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { IconButton } from '@/components/ui/IconButton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/Collapsible';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import type { EngineId, ModelProvider, ModelProviderConfig } from '@/data/settings/interface';
import { ChevronUp, ChevronDown } from 'lucide-react';

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
  cohere: 'Cohere',
  custom: 'Custom',
};

const ENGINE_LABELS: Record<EngineId, string> = {
  opus: 'Opus 4.8',
  sonnet: 'Sonnet 4',
  claude: 'Claude 3.5',
  codex: 'Codex',
};


/**
 * Models settings page — configure available engines and provider API keys.
 */
export function ModelsSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();

  const [expandedProvider, setExpandedProvider] = useState<ModelProvider | null>(null);

  const toggleEngine = (engineId: EngineId) => {
    update('models', {
      engines: settings.models.engines.map(e =>
        e.id === engineId ? { ...e, enabled: !e.enabled } : e
      ),
    });
  };

  const updateProvider = (providerId: ModelProvider, patch: Partial<ModelProviderConfig>) => {
    update('models', {
      providers: settings.models.providers.map(p =>
        p.id === providerId ? { ...p, ...patch } : p
      ),
    });
  };

  const handleSaveProvider = (providerId: ModelProvider) => {
    toast({ title: `${PROVIDER_LABELS[providerId]} settings saved` });
    setExpandedProvider(null);
  };

  const moveFallback = (providerId: ModelProvider, engineId: EngineId, dir: -1 | 1) => {
    const p = settings.models.providers.find(x => x.id === providerId);
    if (!p) return;
    const idx = p.fallbackOrder.indexOf(engineId);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= p.fallbackOrder.length) return;
    const next = [...p.fallbackOrder];
    [next[idx]!, next[nextIdx]!] = [next[nextIdx]!, next[idx]!];
    updateProvider(providerId, { fallbackOrder: next });
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Models"
        description="Configure which model engines are available and set up provider credentials."
      />

      <SettingSection
        title="Available Engines"
        description="Toggle which model engines appear in the Control Matrix for agents."
      >
        <div className="border border-border/40 rounded-md divide-y divide-border/40">
          {settings.models.engines.map(engine => (
            <div key={engine.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{engine.label}</span>
              </div>
              <Switch
                checked={engine.enabled}
                onCheckedChange={() => toggleEngine(engine.id)}
              />
            </div>
          ))}
        </div>
      </SettingSection>

      <SettingSection
        title="Providers"
        description="Configure API keys and fallback chains for each model provider."
      >
        <div className="space-y-2">
          {settings.models.providers.map(provider => {
            const isOpen = expandedProvider === provider.id;
            return (
              <Collapsible
                key={provider.id}
                open={isOpen}
                onOpenChange={(open) => setExpandedProvider(open ? provider.id : null)}
                className="rounded-md border border-border/40 overflow-hidden"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 px-4 py-3 bg-card hover:bg-card/80 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-foreground">{PROVIDER_LABELS[provider.id]}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {provider.apiKey ? '••••••••' + provider.apiKey.slice(-4) : 'No API key set'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {isOpen ? 'Collapse' : 'Configure'}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-border/40 bg-card/40 px-4 py-4 space-y-4">
                  <SettingRow
                    label="API Key"
                    description="Your API key for this provider. Stored locally, never transmitted to our servers."
                    control={
                      <TextInput
                        type="password"
                        value={provider.apiKey}
                        onChange={e => updateProvider(provider.id, { apiKey: e.target.value })}
                        placeholder="sk-..."
                        className="max-w-xs"
                      />
                    }
                  />
                  <SettingRow
                    label="Custom endpoint URL"
                    description="Optional. Override the default API endpoint for this provider."
                    control={
                      <TextInput
                        type="url"
                        value={provider.customEndpointUrl}
                        onChange={e => updateProvider(provider.id, { customEndpointUrl: e.target.value })}
                        placeholder="https://api.example.com/v1"
                        className="max-w-xs"
                      />
                    }
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Fallback chain</span>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-2">Order engines as fallbacks if the primary fails.</p>
                    <div className="border border-border/40 rounded-md divide-y divide-border/40">
                      {provider.fallbackOrder.map((engineId, i) => (
                        <div key={engineId} className="flex items-center gap-3 px-3 py-2">
                          <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
                          <span className="flex-1 text-xs text-foreground">{ENGINE_LABELS[engineId]}</span>
                          <div className="flex items-center gap-0.5">
                            <IconButton
                              size="sm"
                              variant="ghost"
                              onClick={() => moveFallback(provider.id, engineId, -1)}
                              disabled={i === 0}
                              aria-label="Move up"
                            >
                              <ChevronUp size={14} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              onClick={() => moveFallback(provider.id, engineId, 1)}
                              disabled={i === provider.fallbackOrder.length - 1}
                              aria-label="Move down"
                            >
                              <ChevronDown size={14} />
                            </IconButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="default" size="sm" onClick={() => handleSaveProvider(provider.id)}>
                      Save provider
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </SettingSection>
      <div className="mt-6 flex justify-end">
        <ResetSection domain="models" />
      </div>
    </div>
  );
}
