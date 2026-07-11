interface SessionRowProps {
  name: string;
  cost: number;
}

export function SessionRow({ name, cost }: SessionRowProps) {
  return (
    <div className="flex items-center justify-between gap-gap-loose py-0.5">
      <span className="truncate text-xs text-foreground">{name}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        ${cost.toFixed(2)}
      </span>
    </div>
  );
}
