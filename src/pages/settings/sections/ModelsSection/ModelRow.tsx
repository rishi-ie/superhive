import { Icon } from '@/components/ui/icon';
import { KeyIcon, PencilSimpleIcon, TrashSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        <span className="flex min-w-0 items-center gap-gap-tight">
          <span className="truncate">{model.name}</span>
          {!hasApiKey ? <Badge variant="destructive">No key</Badge> : null}
          {hasApiKey && model.enabled ? <Badge variant="secondary">Active</Badge> : null}
          {model.isCustom ? <Badge variant="outline">Custom</Badge> : null}
          {model.contextWindow ? <Badge variant="outline">{formatContextWindow(model.contextWindow)}</Badge> : null}
        </span>
      }
      description={<span className="font-mono">{model.provider}</span>}
    >
      <div className="flex shrink-0 items-center gap-stack">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Switch
                checked={model.enabled}
                disabled={!hasApiKey}
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

        {!model.isCustom && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onConfigure}
                aria-label={hasApiKey ? `Edit ${model.provider} key` : `Add key for ${model.provider}`}
              >
                <Icon icon={hasApiKey ? PencilSimpleIcon : KeyIcon} data-icon="inline-start" />
                {hasApiKey ? 'Edit key' : 'Add key'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasApiKey ? 'Edit API key & base URL' : 'Add API key'}
            </TooltipContent>
          </Tooltip>
        )}

        {model.isCustom && onDelete && (
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
        )}
      </div>
    </SettingsRow>
  );
}
