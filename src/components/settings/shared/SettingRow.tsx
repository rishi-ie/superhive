/**
 * Setting row — label + optional description on left, control on right.
 * Has subtle bottom divider for separation between rows.
 */
import type { ReactNode } from 'react';

type SettingRowProps = {
  label: string;
  description?: string;
  control: ReactNode;
};

/**
 * Setting row — label and description on the left, interactive control on the right.
 * @param label - Primary label for the setting
 * @param description - Optional secondary description text
 * @param control - React node to render on the right (input, toggle, select, etc.)
 */
export function SettingRow({ label, description, control }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5 border-b border-border/40 last:border-b-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pt-1">
        <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground leading-relaxed">{description}</span>
        )}
      </div>
      <div className="shrink-0 self-center">{control}</div>
    </div>
  );
}
