/**
 * Reusable filter chip row.
 */
import { Pill } from '@/components/ui/Pill';

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
          <Pill
            key={chip.id}
            active={isSelected}
            size="sm"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(chip.id)}
          >
            {chip.label}
          </Pill>
        );
      })}
    </div>
  );
}
