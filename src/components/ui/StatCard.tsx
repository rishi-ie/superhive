/**
 * Compact stat card used across global stats views.
 * @param label - Stat label text
 * @param value - Stat value (string or number)
 * @param color - Optional text color class
 */
export function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-2 rounded-md border border-border/40 bg-card">
      <span className={`text-lg font-fustat font-bold ${color ?? 'text-foreground'}`}>{value}</span>
      <span className="text-[10px] tracking-wider font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
