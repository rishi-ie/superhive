/**
 * Reusable filter chip row.
 */
export type FilterChip = {
  id: string;
  label: string;
};

type FilterChipsProps = {
  chips: FilterChip[];
  selected: string;
  onChange: (id: string) => void;
};

/**
 * Reusable filter chip row.
 * @param chips - Array of { id, label }
 * @param selected - Currently selected chip id
 * @param onChange - Called when chip is clicked
 */
export function FilterChips({ chips, selected, onChange }: FilterChipsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filter options"
      className="flex items-center gap-1.5 flex-wrap"
    >
      {chips.map(chip => {
        const isSelected = chip.id === selected;
        return (
          <button
            key={chip.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(chip.id)}
            className={`text-[10px] font-medium px-2 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              isSelected
                ? 'bg-chart-1/15 border-chart-1/40 text-chart-1'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
