import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@/components/ui/icon";
import { LayoutAlignLeftIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { SidebarAccordion } from "./SidebarAccordion";
import { SidebarRepositories } from "./SidebarRepositories";
import { SidebarUser } from "./SidebarUser";

interface AppSidebarProps {
  width?: number;
}

export function AppSidebar({ width = 330 }: AppSidebarProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar
      className="relative border-r border-sidebar-border bg-sidebar"
      collapsible="none"
      style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}
    >
      <div className="no-drag absolute top-[7px] left-[92px] flex items-center">
        <Button
          variant="ghost"
          size="icon-lg"
          className="border-none text-muted-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => toggleSidebar()}
          title="Collapse sidebar"
        >
          <HugeiconsIcon icon={LayoutAlignLeftIcon} />
          <span className="sr-only">Collapse sidebar</span>
        </Button>
      </div>

      <SidebarHeader />

      <SidebarContent className="gap-0 px-0 pt-6">
        <SidebarRepositories />
        <SidebarAccordion />
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-1">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
