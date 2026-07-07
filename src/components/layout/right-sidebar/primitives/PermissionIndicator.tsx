interface PermissionIndicatorProps {
  label: string;
  enabled: boolean;
}

export function PermissionIndicator({ label, enabled }: PermissionIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`size-1.5 rounded-full flex-shrink-0 ${enabled ? "bg-green-500" : "bg-muted-foreground/30"}`}
      />
      <span
        className={`text-xs ${enabled ? "text-foreground" : "text-muted-foreground/50 line-through"}`}
      >
        {label}
      </span>
    </div>
  );
}
