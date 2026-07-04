import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";

interface RightSidebarProps {
  width?: number;
}

export function RightSidebar({ width = 280 }: RightSidebarProps) {
  return (
    <Sidebar
      className="h-full flex-shrink-0 border-l border-sidebar-border bg-sidebar"
      collapsible="none"
      style={{ width: `${width}px` }}
    >
      <SidebarContent className="p-1" />
    </Sidebar>
  );
}
