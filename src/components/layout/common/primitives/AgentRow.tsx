import type { MouseEventHandler } from 'react';
import { Icon } from "@/components/ui/icon";
import { UserIcon, DotsThreeIcon, PushPinIcon } from "@phosphor-icons/react";

interface AgentRowProps {
  name: string;
  status?: 'idle' | 'active';
  showStatus?: boolean;
  currentAction?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const AgentActions = () => (
  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
    <div className="flex size-5 cursor-default items-center justify-center rounded-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground/80">
      <Icon icon={PushPinIcon} className="size-3.5" />
    </div>
    <div className="flex size-5 cursor-default items-center justify-center rounded-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground/80">
      <Icon icon={DotsThreeIcon} className="size-3.5" />
    </div>
  </span>
);

export function AgentRow({ name, status = 'idle', showStatus = true, currentAction = "Working…", onClick }: AgentRowProps) {
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
          <AgentActions />
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
        <AgentActions />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-8 w-full cursor-default items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground"
    >
      <Icon icon={UserIcon} className="size-4 flex-shrink-0" />
      <span className="flex-1 truncate text-left">{name}</span>
      <AgentActions />
    </button>
  );
}
