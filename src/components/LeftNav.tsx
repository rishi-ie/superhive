import { useRef, useEffect } from 'react';
import { LeftNavHeader } from './left-nav/LeftNavHeader';
import { TeamSelector } from './left-nav/TeamSelector';
import { PrimaryNavList } from './left-nav/PrimaryNavList';
import { FileExplorer } from './left-nav/FileExplorer';
import { LeftNavFooter } from './left-nav/LeftNavFooter';

type LeftNavProps = {
  width: number;
  onWidthChange: (width: number) => void;
};

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

export function LeftNav({ width, onWidthChange }: LeftNavProps) {
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX));
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
        className="flex h-full flex-col bg-sidebar border-r border-sidebar-border/40"
        style={{ width: `${width}px`, minWidth: `${width}px` }}
      >
        <div className="drag h-2 shrink-0" />
        <LeftNavHeader />
        <TeamSelector teamName="Rishi Sidharda's Team" initials="RT" />
        <PrimaryNavList />
        <FileExplorer />
        <LeftNavFooter brandName="superset" brandIconLetter="s" notificationCount={2} />
      </div>
      <div
        className="w-px bg-sidebar-border/40 hover:bg-chart-1 cursor-ew-resize shrink-0 transition-colors"
        onMouseDown={startResize}
      />
    </>
  );
}
