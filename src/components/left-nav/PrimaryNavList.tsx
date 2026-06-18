import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { NavItem } from '@/components/ui/NavItem';
import { navItems } from '@/data/left-nav';
import { STROKE_WIDTH } from '@/lib/constants';

type PrimaryNavListProps = {
  onNewWorkspace?: () => void;
};

export function PrimaryNavList({ onNewWorkspace }: PrimaryNavListProps) {
  const [selected, setSelected] = useState<string>('workspaces');

  return (
    <>
      <div className="px-2 py-1">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              active={selected === item.id}
              onClick={() => setSelected(item.id)}
              icon={<item.icon size={16} strokeWidth={STROKE_WIDTH} />}
              label={item.label}
            />
          ))}
        </div>
      </div>

      <div className="px-2 py-1">
        <button
          onClick={onNewWorkspace}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <FolderPlus size={16} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />
          <span className="flex-1 text-left">New Workspace</span>
        </button>
      </div>
    </>
  );
}
