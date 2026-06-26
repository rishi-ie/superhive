/**
 * Compact stat card used across global stats views.
 * @param label - Stat label text
 * @param value - Stat value (string or number)
 * @param color - Optional text color class
 * @param sub - Optional subtitle line
 */
export function StatCard({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-md border border-border/40 bg-card/30">
      <span className={`text-lg font-fustat font-bold tabular-nums ${color ?? 'text-foreground'}`}>{value}</span>
      <span className="text-[10px] tracking-wider font-medium text-muted-foreground">{label}</span>
      {sub && <span className="text-[10px] text-muted-foreground/70">{sub}</span>}
    </div>
  );
}
