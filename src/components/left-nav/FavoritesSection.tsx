import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Star } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

export type FavoriteItem = {
  id: string;
  label: string;
  type: 'project' | 'employee';
  icon?: ReactNode;
};

type FavoritesSectionProps = {
  items: FavoriteItem[];
  onItemClick?: (id: string) => void;
  selectedId?: string;
};

export function FavoritesSection({ items, onItemClick, selectedId }: FavoritesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="px-2 py-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown size={12} strokeWidth={STROKE_WIDTH} className="shrink-0" />
        ) : (
          <ChevronRight size={12} strokeWidth={STROKE_WIDTH} className="shrink-0" />
        )}
        <Star size={12} strokeWidth={STROKE_WIDTH} className="shrink-0 text-chart-3" />
        <span className="flex-1 text-left">Favorites</span>
        <span className="text-[10px] text-muted-foreground font-fustat">{items.length}</span>
      </button>
      {isExpanded && (
        <div className="mt-0.5 ml-2 space-y-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                selectedId === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <span className="shrink-0">{item.icon || <Star size={12} strokeWidth={STROKE_WIDTH} />}</span>
              <span className="flex-1 truncate text-left text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}