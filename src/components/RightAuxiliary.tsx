import { useState, useRef, useEffect } from 'react';
import { RightPanelTabs } from './right-auxiliary/RightPanelTabs';
import { FilterToolbar } from './right-auxiliary/FilterToolbar';
import { TelemetryDeck } from './right-auxiliary/TelemetryDeck';
import { ControlMatrix } from './right-auxiliary/ControlMatrix';
import { AuditQueue } from './right-auxiliary/AuditQueue';
import { RightPanelActivityFeed } from './right-auxiliary/RightPanelActivityFeed';
import { MaximizeOnDoubleClick } from './ui/MaximizeOnDoubleClick';
import { rightPanelTabs } from '@/data/right-panel-tabs';
import { getActiveEmployee, type Employee } from '@/data/employees/store';
import { listSwarmActivity, listProjectAgents } from '@/data/projects/store';

type RightAuxiliaryProps = {
  width: number;
  onWidthChange: (width: number) => void;
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

export function RightAuxiliary({ width, onWidthChange }: RightAuxiliaryProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const isResizingRef = useRef(false);

  const activeAgent: Employee | null = getActiveEmployee();
  const swarmActivity = listSwarmActivity();
  const projectAgents = listProjectAgents();

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
        <MaximizeOnDoubleClick className="h-9 shrink-0">
          <div />
        </MaximizeOnDoubleClick>
        <RightPanelTabs
          tabs={rightPanelTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <FilterToolbar fileCount={0} />
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && activeAgent && (
            <>
              <TelemetryDeck agent={activeAgent} />
              {swarmActivity.length > 0 && (
                <RightPanelActivityFeed items={swarmActivity} agents={projectAgents} />
              )}
            </>
          )}
          {activeTab === 'manage'   && activeAgent && <ControlMatrix agent={activeAgent} />}
          {activeTab === 'inbox'    && <AuditQueue agent={activeAgent} />}
        </div>
      </div>
    </>
  );
}
