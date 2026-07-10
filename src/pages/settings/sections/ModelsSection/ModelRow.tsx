import { HugeiconsIcon } from '@/components/ui/icon';
import { Delete01Icon, AlertCircleIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ModelEntry } from '@/types/electron';

interface ModelRowProps {
  model: ModelEntry;
  hasProvider: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onDelete?: () => void;
}

export function ModelRow({
  model,
  hasProvider,
  onToggleEnabled,
  onDelete,
}: ModelRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-md border border-border bg-card px-4 py-3'
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {model.name}
          </span>
          {!hasProvider && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[0.625rem] text-destructive"
            >
              <HugeiconsIcon icon={AlertCircleIcon} className="size-2.5" />
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
        <Switch
          checked={model.enabled}
          onCheckedChange={onToggleEnabled}
          aria-label={`Enable ${model.name}`}
        />
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label={`Delete ${model.name}`}
            className="text-muted-foreground hover:text-destructive cursor-default"
          >
            <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}