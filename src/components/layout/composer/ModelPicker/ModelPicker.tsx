import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { CaretDownIcon } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getEnabledModels } from '@/flows/settings/crud/get-enabled-models';
import { listProviders } from '@/flows/settings/crud/list-providers';
import { useAgentSettings } from '@/flows/agents/agent-store';
import { cn } from '@/lib/utils';

interface EnabledModel {
  id: string;
  provider: string;
  name: string;
}

interface ModelPickerProps {
  agentId?: string;
}

export function ModelPicker({ agentId }: ModelPickerProps) {
  // Two parallel lists: enabled models and configured providers.
  // We only show models whose provider has a key set, so the user can never
  // pick a model that would fail at the LLM call.
  const [models, setModels] = React.useState<EnabledModel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [localSelection, setLocalSelection] = React.useState<EnabledModel | null>(null);

  const agentSettings = useAgentSettings(agentId ?? null);
  const persistedSelection: EnabledModel | null = React.useMemo(() => {
    if (!agentSettings.settings?.model?.name) return null;
    return {
      id: `${agentSettings.settings.model.provider}:${agentSettings.settings.model.name}`,
      provider: agentSettings.settings.model.provider,
      name: agentSettings.settings.model.name,
    };
  }, [agentSettings.settings?.model]);

  const refetch = React.useCallback(async () => {
    try {
      const [enabledList, providersMap] = await Promise.all([
        getEnabledModels(),
        listProviders(),
      ]);
      // Only show models whose provider has a non-empty API key.
      const keyed = new Set(
        Object.entries(providersMap)
          .filter(([, entry]) => entry?.apiKey && entry.apiKey.trim().length > 0)
          .map(([name]) => name),
      );
      setModels(enabledList.filter((m) => keyed.has(m.provider)));
    } catch {
      setModels([]);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refetch()
      .then(() => {
        if (!cancelled) {
          // Keep the local (decorative) selection in sync with the filtered list.
          setLocalSelection((prev) => {
            if (!prev) return null;
            // If the previously selected model is no longer in the list, drop it.
            return models.find((m) => m.id === prev.id) ? prev : null;
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch the enabled models list when the window regains focus.
  // This picks up changes the user made in the Settings → Models page
  // (added a key, enabled a model) without requiring a full reload of the
  // chat. Silent re-fetch — no loading flash on the trigger button.
  React.useEffect(() => {
    const onFocus = () => {
      refetch().catch(() => undefined);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  // When the filtered list changes, prune the local selection to a valid entry.
  React.useEffect(() => {
    if (!agentId) {
      // Decorative mode (landing): auto-pick the first model on first load.
      const first = models[0] ?? null;
      if (!localSelection && models.length > 0) {
        setLocalSelection(first);
      } else if (localSelection && !models.find((m) => m.id === localSelection.id)) {
        setLocalSelection(first);
      }
    }
  }, [models, agentId, localSelection]);

  const selected: EnabledModel | null = agentId
    ? persistedSelection
    : localSelection;

  const display = loading
    ? 'Loading…'
    : selected
      ? `${selected.name}`
      : 'Select model';

  const onSelect = (model: EnabledModel) => {
    if (agentId) {
      agentSettings.patch('model', { provider: model.provider, name: model.name });
    } else {
      setLocalSelection(model);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-[#9ca3af] hover:text-white cursor-default"
        >
          <span className={cn(!selected && 'text-[#6b7280]')}>{display}</span>
          <Icon icon={CaretDownIcon} className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        {loading ? (
          <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
        ) : models.length === 0 ? (
          <DropdownMenuItem disabled>Add a key in Settings → Models</DropdownMenuItem>
        ) : (
          models.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onSelect={() => onSelect(m)}
              className="flex flex-col items-start gap-0"
            >
              <span className="text-sm">{m.name}</span>
              <span className="text-[0.625rem] text-muted-foreground">
                {m.provider}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
