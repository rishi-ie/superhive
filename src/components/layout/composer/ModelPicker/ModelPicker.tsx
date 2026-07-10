import * as React from 'react';
import { HugeiconsIcon } from '@/components/ui/icon';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getEnabledModels } from '@/flows/settings/crud/get-enabled-models';
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

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEnabledModels()
      .then((list) => {
        if (!cancelled) {
          setModels(list);
          if (!localSelection && list.length > 0) {
            const match = persistedSelection
              ? list.find((m) => m.id === persistedSelection.id) ?? list[0]
              : list[0];
            if (!agentId) {
              setLocalSelection(match ?? null);
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

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
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        {loading ? (
          <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
        ) : models.length === 0 ? (
          <DropdownMenuItem disabled>No models enabled</DropdownMenuItem>
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