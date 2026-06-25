/**
 * Tab strip for the right panel — Overview / Manage / Inbox / Sessions.
 */
import { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { STROKE_WIDTH } from '@/lib/constants';

type RightPanelTabsProps = {
  tabs: ReadonlyArray<{
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  }>;
  activeTab?: string;
  onTabChange: (id: string) => void;
  onRefresh?: () => void;
};

/**
 * Tab strip for the right panel — Overview / Manage / Inbox / Sessions.
 * @param tabs - Available tabs to render
 * @param activeTab - Currently active tab id
 * @param onTabChange - Called when tab is selected
 * @param onRefresh - Called when refresh button is clicked
 */
export function RightPanelTabs({
  tabs,
  activeTab,
  onTabChange,
  onRefresh,
}: RightPanelTabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (currentIndex + 1) % tabs.length;
      onTabChange(tabs[next]!.id);
      (tabListRef.current?.querySelectorAll('[role="tab"]')[next] as HTMLButtonElement | undefined)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (currentIndex - 1 + tabs.length) % tabs.length;
      onTabChange(tabs[prev]!.id);
      (tabListRef.current?.querySelectorAll('[role="tab"]')[prev] as HTMLButtonElement | undefined)?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-sidebar-border px-2 h-9">
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Right panel tabs"
        className="flex items-center gap-1"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={e => handleKeyDown(e, index)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                activeTab === tab.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon size={12} strokeWidth={STROKE_WIDTH} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <IconButton onClick={onRefresh} aria-label="Refresh panel">
        <RefreshCw size={14} strokeWidth={STROKE_WIDTH} />
      </IconButton>
    </div>
  );
}
