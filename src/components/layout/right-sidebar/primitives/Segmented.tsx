
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onValueChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md bg-muted p-0.5 gap-0.5",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onValueChange(opt.value)}
          className={cn(
            "flex-1 rounded-sm px-2 py-0.5 text-xs font-medium transition-all",
            value === opt.value
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
