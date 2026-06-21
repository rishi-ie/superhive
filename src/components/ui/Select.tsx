import { ChevronDown } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
};

export function Select({ value, options, onChange, className = '' }: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full appearance-none items-center gap-2 rounded-md border border-border bg-input px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={STROKE_WIDTH}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
