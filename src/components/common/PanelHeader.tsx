import type { ReactNode } from 'react';

interface PanelHeaderProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function PanelHeader({ left, right, className }: PanelHeaderProps) {
  return (
    <div className={`flex h-12 items-center justify-between border-b border-border-inverse px-4 ${className ?? ''}`}>
      <div className="flex flex-1 items-center">{left}</div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
