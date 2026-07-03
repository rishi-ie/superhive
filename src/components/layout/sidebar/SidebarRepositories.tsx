import {
  Sparkles,
  Home,
  PanelLeft,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarRepositories() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-9 rounded-lg px-2 text-sm text-foreground/80 hover:bg-white/[0.05]">
                <Sparkles className="size-4" />
                <span>Automations</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-9 rounded-lg px-2 text-sm text-foreground/80 hover:bg-white/[0.05]">
                <PanelLeft className="size-4" />
                <span>Customize</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="flex h-7 items-center justify-between px-2 text-xs font-medium text-muted-foreground">
          <span>Repositories</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground/80"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground/80"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-9 rounded-lg px-2 text-sm text-foreground/80 hover:bg-white/[0.05]">
                <Home className="size-4" />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 pl-7 text-sm text-foreground/80 transition-colors hover:bg-white/[0.05]">
                <span className="flex-1 truncate">General chat</span>
                <span className="text-xs text-muted-foreground">12:34</span>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 pl-7 text-sm text-foreground/80 transition-colors hover:bg-white/[0.05]">
                <span className="flex-1 truncate">General chat introduction</span>
                <span className="text-xs text-muted-foreground">12:30</span>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
