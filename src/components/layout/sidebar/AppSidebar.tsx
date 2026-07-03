import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarTopSection } from "./SidebarTopSection";
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
      <SidebarHeader className="gap-3 p-4">
        <SidebarTopSection />
      </SidebarHeader>
      <SidebarContent className="gap-2 px-2">
        <SidebarRepositories />
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
