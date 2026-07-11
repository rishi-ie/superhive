interface SessionRowProps {
  name: string;
  cost: number;
  timestamp?: string;
}

export function SessionRow({ name, cost, timestamp }: SessionRowProps) {
  return (
    <div className="flex items-center justify-between gap-gap-loose py-0.5">
      <span className="truncate text-sm text-foreground">{name}</span>
      <div className="flex shrink-0 items-center gap-list-item">
        {timestamp && (
          <span className="text-xs tabular-nums text-muted-foreground/60">
            {timestamp}
          </span>
        )}
        <span className="text-sm tabular-nums text-muted-foreground">
          ${cost.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
