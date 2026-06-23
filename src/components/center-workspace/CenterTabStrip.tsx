import { CenterTab } from './CenterTab';
import type { CenterTab as CenterTabType } from '@/data/tabs/interface';

type CenterTabStripProps = {
  tabs: CenterTabType[];
  activeTabId: string | null;
  workspaceMap: Record<string, string>;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
};

export function CenterTabStrip({ tabs, activeTabId, workspaceMap, onTabClick, onTabClose }: CenterTabStripProps) {
  return (
    <div className="flex items-center h-10 border-b border-border px-2 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(tab => (
        <CenterTab
          key={tab.id}
          tab={tab}
          workspaceName={workspaceMap[tab.workspaceId] ?? tab.workspaceId}
          isActive={tab.id === activeTabId}
          onClick={() => onTabClick(tab.id)}
          onClose={() => onTabClose(tab.id)}
        />
      ))}
    </div>
  );
}
