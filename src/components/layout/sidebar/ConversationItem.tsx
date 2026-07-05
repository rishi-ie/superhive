import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { SidebarItem } from "./SidebarItem";
import type { MockConversation } from "./data";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  conversation: MockConversation;
  selected?: boolean;
  onClick?: () => void;
}

export function ConversationItem({
  conversation,
  selected,
  onClick,
}: ConversationItemProps) {
  return (
    <SidebarItem
      icon={<MessageSquare className="size-4" />}
      label={conversation.title}
      selected={selected}
      onClick={onClick}
      contextMenu={
        <ContextMenuPrimitive.Item
          className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none",
            "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
            "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          )}
          onSelect={() => toast.info(`Rename "${conversation.title}" (mock)`)}
        >
          Rename
        </ContextMenuPrimitive.Item>
      }
    />
  );
}
