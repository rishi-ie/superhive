import type { HTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        strokeWidth={STROKE_WIDTH}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-input py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
