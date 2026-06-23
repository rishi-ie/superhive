import { RefreshCw } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { STROKE_WIDTH } from "@/lib/constants";

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

export function RightPanelTabs({
  tabs,
  activeTab,
  onTabChange,
  onRefresh,
}: RightPanelTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-sidebar-border px-2 h-9">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
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
      <IconButton onClick={onRefresh} aria-label="Refresh">
        <RefreshCw size={14} strokeWidth={STROKE_WIDTH} />
      </IconButton>
    </div>
  );
}
