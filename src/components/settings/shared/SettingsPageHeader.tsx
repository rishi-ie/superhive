/**
 * Settings page header — h2 + description + optional trailing action.
 */
import type { ReactNode } from 'react';

type SettingsPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

/**
 * Standard settings page header block.
 * @param title - Page title (h2)
 * @param description - Subtitle below the title
 * @param action - Optional action element (e.g. New Workspace button) rendered right-aligned
 * @param className - Additional CSS classes
 */
export function SettingsPageHeader({ title, description, action, className }: SettingsPageHeaderProps) {
  if (action) {
    return (
      <div className={`flex items-start justify-between gap-4 pb-8 ${className ?? ''}`}>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    );
  }
  return (
    <div className={`pb-8 ${className ?? ''}`}>
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
