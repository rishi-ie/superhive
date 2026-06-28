/**
 * Horizontal tab strip with add-tab menu.
 */
import { useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CenterTab } from './CenterTab';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import type { CenterTab as CenterTabType } from '@/data/tabs/interface';
import type { CenterTabType as NewTabType } from '@/data/tabs/interface';
import { listWorkspaces } from '@/data/workspaces/store';

type CenterTabStripProps = {
  tabs: CenterTabType[];
  activeTabId: string | null;
  activeWorkspaceId?: string;
  workspaceMap: Record<string, string>;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab?: (type: NewTabType, workspaceId: string) => void;
};

const NEW_TAB_OPTIONS: { type: NewTabType; label: string; icon: string }[] = [
  { type: 'home', label: 'Home', icon: '🏠' },
  { type: 'agent', label: 'Chat', icon: '💬' },
  { type: 'projects', label: 'Projects', icon: '📋' },
  { type: 'tickets', label: 'Tickets', icon: '🎫' },
  { type: 'channels', label: 'Comms', icon: '💭' },
  { type: 'agents', label: 'Agents', icon: '🤖' },
];

/**
 * @param tabs - All open tabs
 * @param activeTabId - Currently active tab ID
 * @param activeWorkspaceId - Active workspace ID
 * @param workspaceMap - Map of workspace ID to name
 * @param onTabClick - Called when a tab is clicked
 * @param onTabClose - Called when a tab close button is clicked
 * @param onNewTab - Called when new tab is created from menu
 */
export function CenterTabStrip({
  tabs,
  activeTabId,
  activeWorkspaceId,
  workspaceMap,
  onTabClick,
  onTabClose,
  onNewTab,
}: CenterTabStripProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const wsId = activeWorkspaceId ?? tabs.find(t => t.id === activeTabId)?.workspaceId ?? listWorkspaces()[0]?.id ?? 'acme';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

      {onNewTab && (
        <div className="relative shrink-0" ref={menuRef}>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(v => !v)}
            aria-label="New tab"
          >
            <Plus size={14} />
          </IconButton>

          {showMenu && (
            <div className="absolute top-full right-0 mt-1 w-40 rounded-lg border border-border bg-popover shadow-lg z-50 py-1">
              {NEW_TAB_OPTIONS.map(opt => (
                <Button
                  key={opt.type}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors text-left"
                  onClick={() => {
                    onNewTab(opt.type, wsId);
                    setShowMenu(false);
                  }}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
