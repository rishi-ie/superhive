import { Plus } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type TabStripProps = {
  tabs: ReadonlyArray<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (id: string) => void;
  onAddTab?: () => void;
};

export function TabStrip({ tabs, activeTab, onTabChange, onAddTab }: TabStripProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-3 h-10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-3 py-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-chart-1 text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>{tab.label}</span>
        </button>
      ))}
      <button
        onClick={onAddTab}
        className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        aria-label="Add new tab"
      >
        <Plus size={14} strokeWidth={STROKE_WIDTH} />
      </button>
    </div>
  );
}
