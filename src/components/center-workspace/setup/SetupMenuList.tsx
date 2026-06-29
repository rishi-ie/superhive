/**
 * SetupMenuList — vertical stack of interactive rows with strict 3-slot layout:
 *   [icon] [label                    ] [kbd badge | badge]
 * Each row is a compact, pressable list item. Used by all setup wizards.
 */
import { Hint } from '@/components/shortcuts';
import { cn } from '@/lib/utils';

export type MenuRow = {
  id: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  /** Platform-aware chord hint rendered as kbd chips on the right. */
  chord?: { mac: string; default: string };
  onClick?: () => void;
  disabled?: boolean;
};

type SetupMenuListProps = {
  rows: readonly MenuRow[];
  className?: string;
};

/**
 * Vertical list of interactive rows for setup wizards.
 * Strict 3-slot layout: icon (left, fixed) · label (expanding) · kbd cluster (right, flush).
 * @param rows - Ordered list of menu rows
 * @param className - Additional container classes
 */
export function SetupMenuList({ rows, className }: SetupMenuListProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-border/40 bg-card p-2',
        className,
      )}
    >
      {rows.map((row, idx) => {
        const Icon = row.icon;
        const disabled = row.disabled ?? !row.onClick;

        return (
          <button
            key={row.id}
            type="button"
            disabled={disabled}
            onClick={row.onClick}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 w-full text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-hover-tint cursor-pointer',
              idx > 0 && 'mt-0.5',
            )}
          >
            <Icon
              size={14}
              strokeWidth={1.5}
              className="text-muted-foreground shrink-0"
            />
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {row.label}
            </span>
            {row.chord && (
              <span className="flex items-center gap-0.5 shrink-0">
                <Hint chord={row.chord} size="sm" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
