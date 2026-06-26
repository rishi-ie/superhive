/**
 * Setting section — groups rows under a titled heading.
 * Renders a subtle border divider between sections.
 */
import type { ReactNode } from 'react';

type SettingSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Setting section — groups related rows under a titled heading.
 * @param title - Section heading text
 * @param description - Optional description under the title
 * @param children - SettingRow or other content to render inside the section
 */
export function SettingSection({ title, description, children }: SettingSectionProps) {
  return (
    <div className="pt-6 first:pt-0">
      <div className="pb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
