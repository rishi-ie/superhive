import { useState, useRef, useEffect } from 'react';
import { GitBranch } from 'lucide-react';
import { RightPanelTabs } from './right-auxiliary/RightPanelTabs';
import { FilterToolbar } from './right-auxiliary/FilterToolbar';
import { PanelEmptyState } from './right-auxiliary/PanelEmptyState';
import { MaximizeOnDoubleClick } from './ui/MaximizeOnDoubleClick';
import { rightPanelTabs } from '@/data/right-panel-tabs';

type RightAuxiliaryProps = {
  width: number;
  onWidthChange: (width: number) => void;
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

export function RightAuxiliary({ width, onWidthChange }: RightAuxiliaryProps) {
  const [activeTab, setActiveTab] = useState('changes');
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onWidthChange]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <>
      <div
        className="w-px bg-sidebar-border/40 hover:bg-chart-1 cursor-ew-resize shrink-0 transition-colors"
        onMouseDown={startResize}
      />
      <div
        className="flex h-full flex-col bg-sidebar border-l border-sidebar-border/40"
        style={{ width: `${width}px`, minWidth: `${width}px` }}
      >
        <MaximizeOnDoubleClick className="h-9 shrink-0" />
        <RightPanelTabs
          tabs={rightPanelTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <FilterToolbar fileCount={0} />
        <PanelEmptyState
          icon={<GitBranch size={20} className="text-muted-foreground/60" strokeWidth={1} />}
          title="No changes"
        />
      </div>
    </>
  );
}
