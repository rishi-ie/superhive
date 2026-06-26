/**
 * Search input with integrated search icon.
 */
import { Search } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { TextInput, type TextInputProps } from './TextInput';
import { cn } from '@/lib/utils';

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: TextInputProps['size'];
  className?: string;
};

/**
 * Search input with integrated search icon.
 * @param value - Current search value
 * @param onChange - Callback when search value changes
 * @param placeholder - Input placeholder text
 * @param size - Input size: sm or md
 * @param className - Additional CSS classes
 */
export function SearchBar({ value, onChange, placeholder = 'Search...', size, className = '' }: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
        strokeWidth={STROKE_WIDTH}
      />
      <TextInput
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        size={size}
        className="pl-9"
      />
    </div>
  );
}
