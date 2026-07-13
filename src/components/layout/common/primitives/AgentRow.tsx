import type { MouseEventHandler } from 'react';
import { Icon } from "@/components/ui/icon";
import { UserIcon } from "@phosphor-icons/react";

interface AgentRowProps {
  name: string;
  status?: 'idle' | 'active';
  showStatus?: boolean;
  compact?: boolean;
  currentAction?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function AgentRow({ name, status = 'idle', showStatus = true, compact = false, currentAction = "Working…", onClick }: AgentRowProps) {
  if (showStatus && status === 'active') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex h-16 w-full cursor-default flex-col items-stretch gap-0 overflow-hidden rounded-card px-row py-1 text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground"
      >
        <div className="flex h-8 flex-shrink-0 items-center gap-stack">
          <Icon icon={UserIcon} className="size-4 flex-shrink-0" />
          <span className="flex-1 truncate text-left">{name}</span>
        </div>
        <div className="flex h-8 flex-shrink-0 items-center gap-list-item pl-6">
          <div className="size-3 rounded-full border border-border border-t-foreground/80 animate-spin" />
          <span className="truncate text-xs text-muted-foreground">{currentAction}</span>
        </div>
      </button>
    );
  }

  if (showStatus) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex h-8 w-full cursor-default items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground"
      >
        <div className="size-2 rounded-full bg-success flex-shrink-0" />
        <Icon icon={UserIcon} className="size-4 flex-shrink-0" />
        <span className="flex-1 truncate text-left">{name}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={compact
        ? "group flex h-6 w-full cursor-default items-center gap-1 rounded-card px-1.5 text-xs text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground"
        : "group flex h-8 w-full cursor-default items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground"
      }
    >
      <Icon icon={UserIcon} className={compact ? "size-3.5 flex-shrink-0" : "size-4 flex-shrink-0"} />
      <span className="flex-1 truncate text-left">{name}</span>
    </button>
  );
}
