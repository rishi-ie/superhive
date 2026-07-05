import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cn } from "@/lib/utils";

export interface SidebarItemProps {
  icon?: React.ReactNode;
  leading?: React.ReactNode;
  label: React.ReactNode;
  trailing?: React.ReactNode;
  indent?: number;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  contextMenu?: React.ReactNode;
  className?: string;
}

export function SidebarItem({
  icon,
  leading,
  label,
  trailing,
  indent = 0,
  selected = false,
  onClick,
  onDoubleClick,
  contextMenu,
  className,
}: SidebarItemProps) {
  const paddingLeft = indent * 12 + 8;

  const trigger = (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group/sidebar-item flex h-7 w-full items-center gap-2 rounded-md text-xs transition-colors",
        "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        "focus-visible:outline-none focus-visible:bg-sidebar-accent/60 focus-visible:text-foreground focus-visible:ring-1 focus-visible:ring-ring",
        selected && "bg-sidebar-accent text-sidebar-accent-foreground",
        className
      )}
      style={{ paddingLeft: `${paddingLeft}px`, paddingRight: "8px" }}
    >
      {leading && (
        <span className="flex size-3 flex-shrink-0 items-center justify-center text-muted-foreground group-hover/sidebar-item:text-foreground">
          {leading}
        </span>
      )}
      {icon && (
        <span className="flex size-4 flex-shrink-0 items-center justify-center text-muted-foreground group-hover/sidebar-item:text-foreground group-data-[selected=true]/sidebar-item:text-sidebar-accent-foreground">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {trailing && (
        <span className="flex flex-shrink-0 items-center">{trailing}</span>
      )}
    </button>
  );

  if (contextMenu) {
    return (
      <ContextMenuPrimitive.Root>
        <ContextMenuPrimitive.Trigger asChild>{trigger}</ContextMenuPrimitive.Trigger>
        <ContextMenuPrimitive.Portal>
          <ContextMenuPrimitive.Content
            className={cn(
              "z-50 min-w-32 overflow-hidden rounded-md border border-sidebar-border",
              "bg-popover p-1 text-popover-foreground shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {contextMenu}
          </ContextMenuPrimitive.Content>
        </ContextMenuPrimitive.Portal>
      </ContextMenuPrimitive.Root>
    );
  }

  return trigger;
}
