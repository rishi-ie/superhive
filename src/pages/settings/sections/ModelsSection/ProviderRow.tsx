import { Icon } from '@/components/ui/icon';
import { PencilIcon, TrashIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProviderEntry } from '@/types/electron';

interface ProviderRowProps {
  name: string;
  entry: ProviderEntry;
  onEdit: () => void;
  onDelete: () => void;
}

function maskKey(key?: string): string {
  if (!key) return 'No key set';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function ProviderRow({ name, entry, onEdit, onDelete }: ProviderRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-md border border-border bg-card px-4 py-3'
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {entry.name ?? name}
          </span>
        </div>
        {entry.baseUrl && (
          <span className="text-xs text-muted-foreground truncate font-mono">
            {entry.baseUrl}
          </span>
        )}
        <span className="text-xs text-muted-foreground/70 font-mono">
          {maskKey(entry.apiKey)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label={`Edit ${name}`}
          className="text-muted-foreground hover:text-foreground cursor-default"
        >
          <Icon icon={PencilIcon} className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={`Delete ${name}`}
          className="text-muted-foreground hover:text-destructive cursor-default"
        >
          <Icon icon={TrashIcon} className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}