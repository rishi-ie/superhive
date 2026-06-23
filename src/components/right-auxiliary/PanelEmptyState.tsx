import type { ReactNode } from 'react';

type PanelEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
};

export function PanelEmptyState({ icon, title, description }: PanelEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center size-12 rounded-full bg-sidebar-accent/50">
            {icon}
          </div>
        )}
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/60 text-center max-w-[200px]">{description}</p>
        )}
      </div>
    </div>
  );
}
