/**
 * Coming soon badge — lock icon + "Coming soon" label.
 */
import { Lock } from 'lucide-react';

type ComingSoonBadgeProps = {
  label?: string;
  className?: string;
};

/**
 * Badge indicating a feature is not yet available.
 * @param label - Badge text (default "Coming soon")
 * @param className - Additional CSS classes
 */
export function ComingSoonBadge({ label = 'Coming soon', className }: ComingSoonBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground uppercase tracking-wider ${className ?? ''}`}
    >
      <Lock size={9} />
      {label}
    </span>
  );
}
