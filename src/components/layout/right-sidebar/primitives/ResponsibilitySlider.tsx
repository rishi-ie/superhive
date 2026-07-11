import { cn } from "@/lib/utils";

interface ResponsibilitySliderProps {
  count: number;
  max?: number;
  caption?: string;
}

type Band = "ok" | "warn" | "critical";

function bandFor(count: number): Band {
  if (count <= 5) return "ok";
  if (count <= 10) return "warn";
  return "critical";
}

export function ResponsibilitySlider({
  count,
  max = 20,
  caption = "Less healthy",
}: ResponsibilitySliderProps) {
  const band = bandFor(count);
  const pct = Math.max(0, Math.min(count / max, 1)) * 100;
  const fillClass =
    band === "ok"
      ? "bg-success"
      : band === "warn"
      ? "bg-warning"
      : "bg-destructive";

  return (
    <div className="flex flex-col gap-gap-tight">
      <div className="flex items-center justify-between gap-gap-loose">
        <span className="text-xs text-muted-foreground">Responsibility</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {count}/{max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-300", fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground/60">{caption}</span>
    </div>
  );
}
