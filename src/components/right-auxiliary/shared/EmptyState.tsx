/**
 * Standard right-panel empty state — icon + headline + description + optional CTA.
 */
import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Standard right-panel empty state.
 * @param icon - Optional icon node (32px, muted color)
 * @param title - Headline text (sm, semibold)
 * @param description - Optional description (xs, muted)
 * @param action - Optional CTA button
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
      {icon && (
        <div className="text-muted-foreground/40">
          {icon}
        </div>
      )}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/60 max-w-[200px]">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  );
}
