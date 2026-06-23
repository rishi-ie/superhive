import { STROKE_WIDTH } from '@/lib/constants';

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type StatusFilterProps<T extends string> = {
  options: ReadonlyArray<FilterOption<T>>;
  value: T;
  onChange: (value: T) => void;
};

export function StatusFilter<T extends string>({ options, value, onChange }: StatusFilterProps<T>) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map(opt => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
              isActive
                ? 'bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground'
                : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={`text-[10px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
