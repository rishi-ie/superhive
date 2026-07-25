import * as React from "react";

interface RightStatusBarProps {
  open: boolean;
  rightOffset: number;
  isPopover: boolean;
  onDismiss?: () => void;
}

export function RightStatusBar({ open, rightOffset, isPopover, onDismiss }: RightStatusBarProps) {
  React.useEffect(() => {
    if (!open || !isPopover || !onDismiss) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPopover, onDismiss, open]);

  return (
    <div
      aria-hidden={!open}
      className={`absolute inset-y-0 left-0 z-[50] transition-[right] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        open && isPopover ? "pointer-events-auto" : "pointer-events-none"
      }`}
      style={{ right: rightOffset }}
      onMouseDown={(event) => {
        if (isPopover && event.target === event.currentTarget) onDismiss?.();
      }}
    >
      <aside
        aria-label="Status panel"
        role="dialog"
        className={`absolute right-0 top-14 h-1/2 w-[320px] overflow-hidden border-l border-y border-sidebar-border bg-sidebar-bg will-change-[opacity,transform] transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "pointer-events-auto translate-x-0 opacity-100 delay-50" : "translate-x-2 opacity-0"
        }`}
      >
        {/* content lands in a follow-up change */}
      </aside>
    </div>
  );
}
