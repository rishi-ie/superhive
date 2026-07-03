/**
 * Dashboard — landing screen after boot.
 * Intentionally minimal: a single "Dashboard" label with a welcome subtitle.
 */
export function Dashboard() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <span className="text-xs text-muted-foreground">
          Welcome to Superhive
        </span>
      </div>
    </div>
  );
}
