import type { ReactNode } from 'react';

type PanelEmptyStateProps = {
  icon?: ReactNode;
  title: string;
};

export function PanelEmptyState({ icon, title }: PanelEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center size-12 rounded-full bg-sidebar-accent/50">
            {icon}
          </div>
        )}
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
