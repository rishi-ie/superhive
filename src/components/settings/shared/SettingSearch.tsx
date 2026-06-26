/**
 * Settings sidebar search — filters nav items by label as user types.
 */
import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';

type SettingSearchProps = {
  onFilter: (query: string) => void;
};

/**
 * Search input for settings sidebar — live-filters nav items.
 * @param onFilter - Called with the current query string whenever it changes
 */
export function SettingSearch({ onFilter }: SettingSearchProps) {
  const [value, setValue] = useState('');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setValue(q);
    onFilter(q);
  }, [onFilter]);

  const handleClear = useCallback(() => {
    setValue('');
    onFilter('');
  }, [onFilter]);

  return (
    <div className="relative">
      <Search
        size={13}
        strokeWidth={STROKE_WIDTH}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search settings..."
        className="w-full rounded-md border border-border bg-input py-1.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {value && (
        <IconButton
          aria-label="Clear search"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 size-6 text-muted-foreground hover:text-foreground"
        >
          <X size={12} strokeWidth={STROKE_WIDTH} />
        </IconButton>
      )}
    </div>
  );
}
