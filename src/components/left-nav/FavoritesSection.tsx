/**
 * Collapsible Favorites section with star icon and item list.
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight, Star, Bot, Layers } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { IconKey } from '@/data/mock/types';
import type { FavoriteItem } from '@/data/favorites/interface';

const ITEM_ICONS: Record<IconKey, React.ReactElement> = {
  user: <Bot size={12} strokeWidth={STROKE_WIDTH} />,
  folder: <Layers size={12} strokeWidth={STROKE_WIDTH} />,
};

type FavoritesSectionProps = {
  items: FavoriteItem[];
  onItemClick?: (item: FavoriteItem) => void;
  selectedId?: string;
};

/**
 * Collapsible Favorites section with star icon and item list.
 * @param items - Favorite items to display
 * @param onItemClick - Called when a favorite item is clicked
 * @param selectedId - Currently selected item id
 */
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
              onClick={() => onItemClick?.(item)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                selectedId === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <span className="shrink-0">{ITEM_ICONS[item.iconKey]}</span>
              <span className="flex-1 truncate text-left text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type { FavoriteItem };