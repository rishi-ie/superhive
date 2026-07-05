import * as React from "react";
import { ChevronRight, Folder, MessageSquare, Bot } from "lucide-react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { toast } from "sonner";
import { SidebarItem } from "./SidebarItem";
import { ProjectTree } from "./ProjectTree";
import type { MockProjectNode } from "./data";
import { cn } from "@/lib/utils";

interface ProjectTreeItemProps {
  node: MockProjectNode;
  depth: number;
}

const TYPE_ICON = {
  folder: Folder,
  chat: MessageSquare,
  agent: Bot,
};

export function ProjectTreeItem({ node, depth }: ProjectTreeItemProps) {
  const [isOpen, setIsOpen] = React.useState(node.defaultExpanded ?? false);
  const hasChildren = !!node.children?.length;
  const Icon = TYPE_ICON[node.type];

  const chevron = hasChildren ? (
    <ChevronRight
      className={cn(
        "size-3 flex-shrink-0 transition-transform duration-100",
        isOpen && "rotate-90"
      )}
    />
  ) : (
    <span className="size-3 flex-shrink-0" />
  );

  return (
    <>
      <SidebarItem
        leading={chevron}
        icon={<Icon className="size-4" />}
        label={node.name}
        indent={depth}
        onClick={
          hasChildren
            ? () => setIsOpen((o) => !o)
            : () => toast.info(`Open ${node.name} (mock)`)
        }
        contextMenu={
          <ContextMenuPrimitive.Item
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none",
              "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
            onSelect={() => toast.info(`Rename "${node.name}" (mock)`)}
          >
            Rename
          </ContextMenuPrimitive.Item>
        }
      />
      {hasChildren && isOpen && (
        <ProjectTree nodes={node.children!} depth={depth + 1} />
      )}
    </>
  );
}
