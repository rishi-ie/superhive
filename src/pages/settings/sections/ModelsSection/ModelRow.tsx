import { Icon } from '@/components/ui/icon';
import { KeyIcon, PencilSimpleIcon, TrashSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ModelEntry } from '@/types/electron';
import { SettingsRow } from '../../SettingsPrimitives';

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M ctx`
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K ctx`
  return `${tokens} ctx`
}

interface ModelRowProps {
  model: ModelEntry;
  hasApiKey: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onConfigure: () => void;
  onDelete?: () => void;
}

export function ModelRow({
  model,
  hasApiKey,
  onToggleEnabled,
  onConfigure,
  onDelete,
}: ModelRowProps) {
  return (
    <SettingsRow
      title={
        <span className="truncate">{model.name}</span>
      }
      description={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono">{model.provider}</span>
          {model.isCustom ? <span>Custom</span> : null}
          {model.contextWindow ? <span>{formatContextWindow(model.contextWindow)}</span> : null}
          {!hasApiKey ? <span>API key required to enable.</span> : null}
        </span>
      }
    >
      <div className="flex shrink-0 items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Switch
                checked={model.enabled}
                onCheckedChange={onToggleEnabled}
                aria-label={`Enable ${model.name}`}
              />
            </span>
          </TooltipTrigger>
          {!hasApiKey && (
            <TooltipContent>
              Add a key for {model.provider} to enable this model
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onConfigure}
              aria-label={hasApiKey ? `Edit ${model.name}` : `Configure ${model.name}`}
            >
              <Icon icon={hasApiKey ? PencilSimpleIcon : KeyIcon} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasApiKey ? 'Edit model' : 'Configure model'}
          </TooltipContent>
        </Tooltip>

        {model.isCustom && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                aria-label={`Delete ${model.name}`}
                className="text-muted-foreground"
              >
                <Icon icon={TrashSimpleIcon} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete model</TooltipContent>
          </Tooltip>
        )}
      </div>
    </SettingsRow>
  );
}
