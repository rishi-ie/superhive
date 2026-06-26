/**
 * Bulk action bar — appears when items are selected in a list.
 */
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

type BulkActionBarProps = {
  count: number;
  onClear: () => void;
  actions: ReactNode;
};

/**
 * Bulk action bar — appears when items are selected in a list.
 * @param count - Number of items selected
 * @param onClear - Called when clear/close is clicked
 * @param actions - Action buttons to render
 */
export function BulkActionBar({ count, onClear, actions }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-sidebar shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {count} selected
        </span>
        {actions}
      </div>
      <IconButton
        variant="ghost"
        size="sm"
        onClick={onClear}
        aria-label="Clear selection"
      >
        <X size={14} />
      </IconButton>
    </div>
  );
}
