import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Bot } from "lucide-react";

interface RightSidebarProps {
  width?: number;
}

export function RightSidebar({ width = 280 }: RightSidebarProps) {
  return (
    <Sidebar
      className="h-full flex-shrink-0 border-l border-sidebar-border bg-[#141414]"
      collapsible="none"
      style={{ width: `${width}px` }}
    >
      <SidebarContent className="flex h-full flex-col items-center justify-center gap-2 p-4 bg-[#141414]">
        <Bot className="size-6 text-muted-foreground/40" />
        <div className="text-center text-xs text-muted-foreground">
          Select an agent or project
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
