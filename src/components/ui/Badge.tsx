/**
 * Small status badge for Active, Current, Recommended, Coming soon, and AI labels.
 * Variants: default (active/current/recommended), secondary (coming-soon), destructive (error), outline, link.
 */
import { cva } from 'class-variance-authority';
import { CheckCircle2, Check, Lock } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  {
    variants: {
      variant: {
        default:       'bg-accent/20 text-accent',
        current:      'bg-accent/20 text-accent',
        recommended:  'bg-chart-2/20 text-chart-2',
        'coming-soon':'bg-muted text-muted-foreground',
        ai:           'bg-chart-2/10 text-chart-2 border border-chart-2/40',
        secondary:    'bg-secondary text-secondary-foreground',
        destructive:  'bg-destructive/20 text-destructive',
        outline:      'border border-current bg-transparent text-foreground',
        link:         'text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeProps = {
  variant?: 'active' | 'current' | 'recommended' | 'coming-soon' | 'ai' | 'secondary' | 'destructive' | 'outline' | 'link';
  children?: React.ReactNode;
  className?: string;
};

const variantIcons: Record<string, React.ReactNode | undefined> = {
  active:        <CheckCircle2 size={9} strokeWidth={STROKE_WIDTH} />,
  current:       <Check size={9} strokeWidth={STROKE_WIDTH * 1.5} />,
  recommended:   <Check size={9} strokeWidth={STROKE_WIDTH * 1.5} />,
  'coming-soon': <Lock size={9} strokeWidth={STROKE_WIDTH} />,
};

const labelMap: Record<string, string> = {
  active: 'Active', current: 'Current', recommended: 'Recommended',
  'coming-soon': 'Coming Soon', ai: 'AI',
};

/**
 * Small status badge with optional icon and custom label via children.
 * @param variant - Badge variant determines colors and optional icon
 * @param children - Badge text label (defaults to variant name if omitted)
 * @param className - Additional CSS classes
 */
export function Badge({ variant = 'active', children, className = '' }: BadgeProps) {
  const cvVariant = variant === 'active' ? 'default' : variant;
  const label = children ?? labelMap[variant] ?? variant;
  const icon = variantIcons[variant];

  return (
    <span className={cn(badgeVariants({ variant: cvVariant }), className)}>
      {icon}
      {label}
    </span>
  );
}
