/**
 * Create/new action button with plus icon.
 */
import { Plus } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type NewButtonProps = {
  label: string;
  onClick?: () => void;
};

/**
 * Create/new action button with plus icon.
 * @param label - Button label text
 * @param onClick - Click handler
 */
export function NewButton({ label, onClick }: NewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md bg-chart-1 px-3 py-2 text-xs font-semibold text-highlight-foreground hover:bg-chart-1/90 transition-colors border border-sidebar-border shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <Plus size={12} strokeWidth={STROKE_WIDTH} />
      {label}
    </button>
  );
}
