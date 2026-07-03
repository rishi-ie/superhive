import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarRepositories } from "./SidebarRepositories";
import { SidebarUser } from "./SidebarUser";

interface AppSidebarProps {
  width?: number;
}

export function AppSidebar({ width = 330 }: AppSidebarProps) {
  return (
    <Sidebar
      className="border-r border-sidebar-border bg-sidebar"
      collapsible="none"
      style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}
    >
      <SidebarHeader className="gap-1.5 p-1 pt-6" />
      <SidebarContent className="gap-0 px-0">
        <SidebarRepositories />
      </SidebarContent>
      <SidebarFooter className="p-1">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
