import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Bot } from "lucide-react";
import { toast } from "sonner";
import { SidebarItem } from "./SidebarItem";
import type { MockAgent } from "./data";
import { cn } from "@/lib/utils";

interface AgentItemProps {
  agent: MockAgent;
  selected?: boolean;
  onClick?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  offline: "bg-muted",
};

export function AgentItem({ agent, selected, onClick }: AgentItemProps) {
  return (
    <SidebarItem
      icon={<Bot className="size-4" />}
      label={agent.name}
      trailing={<StatusDot status={agent.status} />}
      selected={selected}
      onClick={onClick}
      onDoubleClick={() => toast.info(`Open ${agent.name} settings (mock)`)}
      contextMenu={
        <ContextMenuPrimitive.Item
          className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none",
            "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
            "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          )}
          onSelect={() => toast.info(`Rename ${agent.name} (mock)`)}
        >
          Rename
        </ContextMenuPrimitive.Item>
      }
    />
  );
}

function StatusDot({ status }: { status: MockAgent["status"] }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full flex-shrink-0",
        STATUS_COLORS[status] ?? "bg-muted"
      )}
    />
  );
}
