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
  const isMacOS = typeof window !== "undefined" && window.api?.app?.platform === "darwin";

  return (
    <Sidebar
      className={`${isMacOS ? "bg-sidebar-bg-translucent macos-sidebar-material" : "bg-sidebar-bg"} border-r-[0.5px] border-sidebar-border [--font-scale:1.1]`}
      collapsible="none"
      style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}
    >
      <SidebarHeader />

      <SidebarContent className="flex flex-col gap-0 px-0 pt-6">
        <SidebarRepositories />
        <SidebarAccordion />
        <div className="mt-auto px-button-x py-button-y">
          <UpdateBanner />
        </div>
      </SidebarContent>

      <SidebarFooter className="p-list-item [--font-scale:1]">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
