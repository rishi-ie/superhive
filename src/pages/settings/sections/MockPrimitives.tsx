import { Badge } from "@/components/ui/badge";

export function PreviewNotice({ children = "Changes in this preview are not saved yet." }: { children?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <Badge variant="outline">Preview</Badge>
      <span>{children}</span>
    </div>
  );
}

export function UsageMeter({ label, used, total, detail }: { label: string; used: number; total: number; detail?: string }) {
  const percent = Math.min(100, Math.round((used / total) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{detail ?? `${used} of ${total}`}</span>
      </div>
      <div
        aria-label={`${label}: ${percent}% used`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
