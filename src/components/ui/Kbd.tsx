/**
 * Kbd — a single key cap visual primitive.
 * Reusable across the keyboard settings page, dropdown items, button hints, and tooltips.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type KbdProps = HTMLAttributes<HTMLElement> & {
  /** Optional override for size variant. */
  size?: 'sm' | 'md';
};

/**
 * A small monospace key chip used to render keyboard shortcuts.
 * @param children - The label rendered inside (e.g. '⌘', 'K', 'Ctrl')
 * @param size     - Visual size: 'sm' (inline with text) or 'md' (settings rows)
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ className, size = 'sm', children, ...rest }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-mono font-medium text-foreground/85',
        'rounded border border-border/70 bg-muted/40 shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]',
        size === 'sm' ? 'min-w-[20px] h-5 px-1.5 text-[11px]' : 'min-w-[24px] h-6 px-2 text-xs',
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  ),
);
Kbd.displayName = 'Kbd';
