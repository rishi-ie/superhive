import { Icon } from '@/components/ui/icon';
import { KeyIcon, PencilSimpleIcon, TrashSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
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
    <div
      className={cn(
        'flex items-center gap-4 rounded-md border border-border bg-card px-4 py-3',
        !hasApiKey && 'opacity-60'
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {model.name}
          </span>
          {!hasApiKey && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[0.625rem] text-destructive">
              <Icon icon={WarningCircleIcon} className="size-2.5" />
              No key
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate font-mono">
          {model.provider}
          {model.isCustom ? ' · custom' : ''}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
            <TooltipContent>Add an API key to enable this model</TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onConfigure}
              className="gap-1.5 cursor-default"
              aria-label={hasApiKey ? `Edit ${model.name}` : `Add key for ${model.name}`}
            >
              <Icon
                icon={hasApiKey ? PencilSimpleIcon : KeyIcon}
                className="size-3.5"
              />
              {hasApiKey ? 'Edit' : 'Add key'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasApiKey ? 'Edit API key & base URL' : 'Add API key'}
          </TooltipContent>
        </Tooltip>

        {onDelete && (
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
