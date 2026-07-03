/**
 * Segmented control — a group of buttons where only one can be active at a time.
 */
import type { ReactNode } from 'react';

type SegmentedControlOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type SegmentedControlProps = {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
};

const sizeMap: Record<'sm' | 'md', string> = {
  sm: 'px-2.5 py-1.5 text-[10px]',
  md: 'px-3 py-2 text-xs',
};

/**
 * Segmented control — a group of 2–4 buttons in a shared rounded container.
 * Only one option can be active at a time.
 * @param options - Array of { value, label, icon? } options
 * @param value - Currently selected value
 * @param onChange - Callback when selection changes
 * @param size - Button size: sm or md (default)
 * @param className - Additional CSS classes for the container
 */
export function SegmentedControl({ options, value, onChange, size = 'md', className = '' }: SegmentedControlProps) {
  return (
    <div className={`flex rounded-md border border-border overflow-hidden ${className}`}>
      {options.map((opt, i) => {
        const isActive = opt.value === value;
        const isFirst = i === 0;
        const isLast = i === options.length - 1;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${
              sizeMap[size]
            } ${
              isActive
                ? 'bg-accent/15 text-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-tertiary'
            } ${!isFirst ? 'border-l border-border' : ''} ${
              !isLast ? 'border-r border-border' : ''
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
