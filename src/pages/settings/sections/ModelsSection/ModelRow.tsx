import { Icon } from '@/components/ui/icon';
import { CheckCircleIcon, KeyIcon, PencilSimpleIcon, TrashSimpleIcon, XCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ModelEntry } from '@/types/electron';

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
    <div className="flex items-center gap-4 rounded-button border border-border bg-card px-composer py-3">
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-0.5',
          !hasApiKey && 'opacity-60',
        )}
      >
        <div className="flex items-center gap-stack">
          <span className="text-sm font-medium text-foreground truncate">
            {model.name}
          </span>
          {!hasApiKey && (
            <span className="inline-flex items-center gap-gap-tight rounded-full bg-destructive/10 px-1.5 py-0.5 text-[0.625rem] text-destructive">
              <Icon icon={XCircleIcon} className="size-2.5" />
              No key
            </span>
          )}
          {hasApiKey && model.enabled && (
            <span className="inline-flex items-center gap-gap-tight rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[0.625rem] text-emerald-500">
              <Icon icon={CheckCircleIcon} className="size-2.5" />
              Active
            </span>
          )}
          {model.isCustom && (
            <span className="inline-flex items-center gap-gap-tight rounded-full bg-muted px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
              custom
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate font-mono">
          {model.provider}
        </span>
      </div>

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
                className="gap-list-item cursor-default"
                aria-label={hasApiKey ? `Edit ${model.provider} key` : `Add key for ${model.provider}`}
              >
                <Icon
                  icon={hasApiKey ? PencilSimpleIcon : KeyIcon}
                  className="size-3.5"
                />
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
            className="text-muted-foreground hover:text-destructive cursor-default"
          >
            <Icon icon={TrashSimpleIcon} className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
