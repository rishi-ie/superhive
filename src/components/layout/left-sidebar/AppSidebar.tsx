import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@/components/ui/icon";
import { SidebarLeft01Icon, SidebarRight01Icon } from "@hugeicons/core-free-icons";
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
      className="border-r border-sidebar-border bg-sidebar"
      collapsible="none"
      style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}
    >
      <SidebarHeader className="flex h-9 items-center justify-end gap-1 px-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleSidebar()}
          title="Close sidebar"
        >
          <HugeiconsIcon icon={SidebarLeft01Icon} />
          <span className="sr-only">Close sidebar</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleSidebar()}
          title="Open sidebar"
        >
          <HugeiconsIcon icon={SidebarRight01Icon} />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-0">
        <SidebarRepositories />
        <SidebarAccordion />
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-1">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
