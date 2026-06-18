import { useState } from 'react';
import { NavItem } from '@/components/ui/NavItem';
import { mainNavItems, type NavItem as NavItemType } from '@/data/left-nav';
import { STROKE_WIDTH } from '@/lib/constants';

type MainNavListProps = {
  onItemClick?: (id: string) => void;
};

export function MainNavList({ onItemClick }: MainNavListProps) {
  const [selected, setSelected] = useState<string>('projects');

  const handleClick = (item: NavItemType) => {
    setSelected(item.id);
    onItemClick?.(item.id);
  };

  return (
    <div className="px-2 py-1">
      <div className="space-y-0.5">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.id}
            active={selected === item.id}
            onClick={() => handleClick(item)}
            icon={<item.icon size={16} strokeWidth={STROKE_WIDTH} />}
            label={item.label}
          />
        ))}
      </div>
    </div>
  );
}
