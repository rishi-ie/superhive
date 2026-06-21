type RadioOptionProps = {
  label: string;
  description?: string;
  selected: boolean;
  variant?: 'default' | 'danger';
  onSelect: () => void;
};

export function RadioOption({
  label,
  description,
  selected,
  variant = 'default',
  onSelect,
}: RadioOptionProps) {
  const borderColor = variant === 'danger'
    ? selected ? 'border-chart-5' : 'border-border hover:border-chart-5/50'
    : selected ? 'border-chart-1' : 'border-border hover:border-muted-foreground/50';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left transition-colors ${borderColor} ${selected ? 'bg-sidebar-accent/50' : 'hover:bg-sidebar-accent/30'}`}
    >
      <div
        className={`mt-0.5 shrink-0 rounded-full border-2 ${
          selected
            ? variant === 'danger'
              ? 'border-chart-5 bg-chart-5'
              : 'border-chart-1 bg-chart-1'
            : 'border-muted-foreground/40 bg-transparent'
        }`}
        style={{ width: 14, height: 14 }}
      />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
          {label}
        </div>
        {description && (
          <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
    </button>
  );
}
