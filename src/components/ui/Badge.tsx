/**
 * Small status badge for Active, Current, Recommended, Coming soon, and AI labels.
 */
import type { ReactNode } from 'react';
import { CheckCircle2, Check, Lock } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type BadgeVariant = 'active' | 'current' | 'recommended' | 'coming-soon' | 'ai';
type BadgeTone = 'primary' | 'muted' | 'ai';

type BadgeProps = {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  active:       'bg-chart-1/20 text-chart-1',
  current:      'bg-chart-1/20 text-chart-1',
  recommended:  'bg-chart-2/20 text-chart-2',
  'coming-soon':'bg-muted text-muted-foreground',
  ai:           'bg-chart-2/10 text-chart-2 border border-chart-2/40',
};

const variantIcons: Partial<Record<BadgeVariant, ReactNode>> = {
  active:       <CheckCircle2 size={9} strokeWidth={STROKE_WIDTH} />,
  current:      <Check size={9} strokeWidth={STROKE_WIDTH * 1.5} />,
  recommended:  <Check size={9} strokeWidth={STROKE_WIDTH * 1.5} />,
  'coming-soon':<Lock size={9} strokeWidth={STROKE_WIDTH} />,
};

/**
 * Small status badge for Active, Current, Recommended, Coming soon, and AI labels.
 * @param variant - Badge variant determines colors and optional icon
 * @param tone - Color tone override: primary (chart-1), muted, ai (chart-2)
 * @param icon - Optional icon override
 * @param children - Badge text (defaults to variant label if omitted)
 * @param className - Additional CSS classes
 */
export function Badge({ variant = 'active', tone, icon, children, className = '' }: BadgeProps) {
  const label = children ?? variant.replace('-', ' ');
  const showIcon = icon ?? variantIcons[variant];

  const toneClass = tone === 'muted'
    ? 'bg-muted text-muted-foreground'
    : tone === 'ai'
    ? 'bg-chart-2/10 text-chart-2 border border-chart-2/40'
    : variantStyles[variant];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${toneClass} ${className}`}>
      {showIcon}
      {label}
    </span>
  );
}
