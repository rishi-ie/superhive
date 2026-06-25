/**
 * Toggle switch with animated knob for boolean settings.
 */
type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
};

/**
 * Toggle switch with animated knob for boolean settings.
 * @param checked - Current toggle state
 * @param onChange - Callback when toggle state changes
 * @param size - Toggle size: sm or md
 */
export function Toggle({ checked, onChange, size = 'md' }: ToggleProps) {
  const trackClass = checked
    ? 'bg-chart-1'
    : 'bg-input';
  const knobClass = checked
    ? size === 'sm' ? 'translate-x-4' : 'translate-x-5'
    : 'translate-x-0.5';
  const trackH = size === 'sm' ? 'h-4' : 'h-5';
  const trackW = size === 'sm' ? 'w-7' : 'w-9';
  const knobSize = size === 'sm' ? 'size-3' : 'size-4';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex ${trackH} ${trackW} shrink-0 rounded-full border border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      style={{ backgroundColor: checked ? 'var(--chart-1)' : undefined }}
    >
      <span
        className={`pointer-events-none inline-block ${knobSize} rounded-full bg-white shadow-sm transform transition-transform ${trackClass} ${knobClass} mt-0.5`}
      />
    </button>
  );
}
