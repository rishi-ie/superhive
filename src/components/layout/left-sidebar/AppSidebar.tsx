import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarAccordion } from "./SidebarAccordion";
import { SidebarRepositories } from "./SidebarRepositories";
import { SidebarUser } from "./SidebarUser";
import { UpdateBanner } from "./UpdateBanner";

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
      <SidebarHeader />

      <SidebarContent className="gap-0 px-0 pt-6">
        <SidebarRepositories />
        <SidebarAccordion />
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-1 border-t border-border p-1">
        <UpdateBanner />
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
