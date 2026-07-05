interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 4, className }: SpinnerProps) {
  return (
    <div
      className={`size-${size} animate-spin rounded-full border-2 border-muted border-t-foreground ${className ?? ''}`}
      role="status"
      aria-label="Loading"
    />
  );
}
