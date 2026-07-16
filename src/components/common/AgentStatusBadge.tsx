import { WarningIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/storage/types";

const STATUS_DOT: Record<AgentStatus, string> = {
  idle: "bg-muted-foreground/30",
  active: "bg-success",
  busy: "bg-info",
  waiting: "bg-warning",
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  active: "Active",
  busy: "Busy",
  waiting: "Waiting",
};

export interface AgentStatusPresentation {
  status: AgentStatus
  /** True when the row carries a `lastError` (idle + lastError renders red). */
  error: boolean
  /** True when the status corresponds to in-progress boot (renders a spinner). */
  booting: boolean
  /** Background class for the dot. */
  dotClass: string
  /** Display label, already taking `error` into account. */
  label: string
}

/**
 * Single source of truth for mapping an `AgentStatus` (+ optional `lastError`)
 * to its dot/label/spinner presentation. Used by `AgentStatusBadge` and by
 * callers that want to render their own dot/label with their own typography.
 */
export function useAgentStatusPresentation(
  status: AgentStatus,
  options: { error?: boolean; booting?: boolean } = {},
): AgentStatusPresentation {
  const error = options.error === true && status === 'idle'
  const booting = options.booting === true && status === 'active' && !error
  const dotClass = error ? "bg-destructive" : STATUS_DOT[status]
  const label = STATUS_LABEL[status]
  return { status, error, booting, dotClass, label }
}

export interface AgentStatusBadgeProps {
  status: AgentStatus
  /** Set true when the row has a non-empty `lastError`. Swaps dot to destructive red. */
  error?: boolean
  /** Show the spinner overlay (use during boot). */
  booting?: boolean
  /** Tighter gap for sidebar rows. */
  compact?: boolean
  className?: string
}

export function AgentStatusBadge({
  status,
  error = false,
  booting = false,
  compact = false,
  className,
}: AgentStatusBadgeProps) {
  const { dotClass, label } = useAgentStatusPresentation(status, { error, booting })

  return (
    <div
      className={cn(
        "flex items-center whitespace-nowrap",
        compact ? "gap-1.5" : "gap-list-item",
        className,
      )}
    >
      <div className={cn("size-1.5 rounded-full shrink-0", dotClass)} />
      {booting ? (
        <Icon
          icon={CircleNotchIcon}
          className="size-2.5 animate-spin shrink-0 text-warning"
        />
      ) : null}
      {error ? (
        <Icon
          icon={WarningIcon}
          className="size-3 shrink-0 text-destructive"
          aria-label="error"
        />
      ) : null}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}