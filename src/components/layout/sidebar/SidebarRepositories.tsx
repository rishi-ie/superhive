import { NavLink } from "react-router-dom";
import {
  Bot,
  FolderOpen,
  Hexagon,
  Globe,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CollapsibleSection } from "./CollapsibleSection";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarRepositories() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <NavLink
                to="/agents"
                className={({ isActive }) =>
                  cn(
                    "flex h-8 items-center gap-2 rounded-lg px-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-[#b2b2b2] hover:bg-accent hover:text-foreground"
                  )
                }
              >
                <Bot className="size-4" />
                <span>Agent view</span>
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  cn(
                    "flex h-8 items-center gap-2 rounded-lg px-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-[#b2b2b2] hover:bg-accent hover:text-foreground"
                  )
                }
              >
                <FolderOpen className="size-4" />
                <span>Project view</span>
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavLink
                to="/hive"
                className={({ isActive }) =>
                  cn(
                    "flex h-8 items-center gap-2 rounded-lg px-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-[#b2b2b2] hover:bg-accent hover:text-foreground"
                  )
                }
              >
                <Hexagon className="size-4" />
                <span>Meta Hive</span>
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavLink
                to="/remote"
                className={({ isActive }) =>
                  cn(
                    "flex h-8 items-center gap-2 rounded-lg px-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-[#b2b2b2] hover:bg-accent hover:text-foreground"
                  )
                }
              >
                <Globe className="size-4" />
                <span>Remote</span>
              </NavLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="flex h-6 items-center justify-between px-1.5 text-xs font-medium text-muted-foreground">
          <span className="pl-1">Repositories</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Add repository</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Repository options</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <CollapsibleSection trigger="Home" defaultOpen>
                <div className="flex h-8 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-xs text-foreground transition-colors hover:bg-accent">
                  <span className="flex-1 truncate">General chat</span>
                  <span className="text-xs text-muted-foreground">12:34</span>
                </div>
                <div className="flex h-8 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-xs text-foreground transition-colors hover:bg-accent">
                  <span className="flex-1 truncate">General chat introduction</span>
                  <span className="text-xs text-muted-foreground">12:30</span>
                </div>
              </CollapsibleSection>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
