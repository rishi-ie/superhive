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
      <SidebarHeader className="gap-1.5 p-2 pt-12">
        <SidebarTopSection />
      </SidebarHeader>
      <SidebarContent className="gap-1 px-1.5">
        <SidebarRepositories />
      </SidebarContent>
      <SidebarFooter className="p-1.5">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
