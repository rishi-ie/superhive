import * as React from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { FileTextIcon, LightbulbIcon, LinkSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/ui/icon";

type StatusPanelRow = {
  label: string;
  icon?: PhosphorIcon;
  onClick?: () => void;
};

type StatusPanelSection = {
  label: string;
  emptyLabel?: string;
  rows?: StatusPanelRow[];
  actionLabel?: string;
  onAction?: () => void;
};

export type StatusPanelConfig = {
  planLabel: string;
  plan?: StatusPanelRow;
  outputs: StatusPanelSection;
  sources: StatusPanelSection & { footer?: StatusPanelRow };
};

// Edit labels and rows here until these sections are backed by live workspace data.
export const statusPanelConfig: StatusPanelConfig = {
  planLabel: "Plan",
  plan: { label: "Current plan", icon: LightbulbIcon },
  outputs: { label: "Outputs", emptyLabel: "Create a file or site", actionLabel: "Add output" },
  sources: {
    label: "Sources",
    actionLabel: "Add source",
    rows: [
      { label: "Reference material", icon: FileTextIcon },
      { label: "Additional context", icon: FileTextIcon },
    ],
    footer: { label: "View all", icon: LinkSimpleIcon },
  },
};

interface RightStatusBarProps {
  open: boolean;
  rightOffset: number;
  isPopover: boolean;
  onDismiss?: () => void;
}

function StatusRow({ row, subdued = false }: { row: StatusPanelRow; subdued?: boolean }) {
  const content = (
    <>
      {row.icon && <Icon icon={row.icon} className="size-4 shrink-0" />}
      <span className="min-w-0 truncate">{row.label}</span>
    </>
  );

  return row.onClick ? (
    <button type="button" onClick={row.onClick} className="flex h-8 w-full items-center gap-2.5 rounded-md px-1 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </button>
  ) : (
    <div className={`flex h-8 min-w-0 items-center gap-2.5 px-1 ${subdued ? "text-muted-foreground" : "text-sidebar-foreground"}`}>{content}</div>
  );
}

function StatusSection({ section, footer }: { section: StatusPanelSection; footer?: StatusPanelRow }) {
  return (
    <section className="border-t border-sidebar-border/70 py-4 first:border-t-0 first:pt-0">
      <div className="mb-2 flex h-6 items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{section.label}</h2>
        {section.actionLabel && (
          <button type="button" aria-label={section.actionLabel} onClick={section.onAction} disabled={!section.onAction} className="flex size-7 items-center justify-center rounded-icon text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-muted-foreground">
            <Icon icon={PlusIcon} className="size-4" />
          </button>
        )}
      </div>
      {section.rows?.map((row) => <StatusRow key={row.label} row={row} subdued />)}
      {!section.rows?.length && section.emptyLabel && <p className="px-1 text-sm text-muted-foreground">{section.emptyLabel}</p>}
      {footer && <div className="mt-1"><StatusRow row={footer} subdued /></div>}
    </section>
  );
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
        className={`absolute right-3 top-14 flex max-h-[calc(100vh-4.5rem)] w-[304px] flex-col overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar-bg shadow-xl shadow-black/15 will-change-[opacity,transform] transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "pointer-events-auto translate-x-0 opacity-100 delay-50" : "translate-x-2 opacity-0"
        }`}
      >
        <div className="overflow-y-auto p-5">
          {statusPanelConfig.plan && (
            <div className="mb-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">{statusPanelConfig.planLabel}</p>
              <StatusRow row={statusPanelConfig.plan} />
            </div>
          )}
          <StatusSection section={statusPanelConfig.outputs} />
          <StatusSection section={statusPanelConfig.sources} footer={statusPanelConfig.sources.footer} />
        </div>
      </aside>
    </div>
  );
}
