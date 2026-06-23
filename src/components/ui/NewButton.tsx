import { Plus } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type NewButtonProps = {
  label: string;
  onClick?: () => void;
};

export function NewButton({ label, onClick }: NewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md bg-sidebar-accent px-3 py-2 text-xs font-semibold text-sidebar-accent-foreground hover:bg-sidebar-accent/90 transition-colors border border-sidebar-border shrink-0"
    >
      <Plus size={12} strokeWidth={STROKE_WIDTH} />
      {label}
    </button>
  );
}
