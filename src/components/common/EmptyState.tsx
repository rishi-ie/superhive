import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-gap-loose ${className ?? ''}`}>
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        {icon}
      </div>
      <div className="flex flex-col items-center gap-gap-tight">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}
