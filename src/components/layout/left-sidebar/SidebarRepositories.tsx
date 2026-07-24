import { Icon } from "@/components/ui/icon";
import { PlusIcon, HexagonIcon, MagnifyingGlassIcon, UserIcon, ArrowsDownUpIcon, PaperPlaneTiltIcon, PuzzlePieceIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { goBackHome, goToAgents, goToPlugins } from "@/flows/navigation";
import { useOpenCreateProject } from "@/flows/projects/ui/open-create-project";
import { useCommandPalette } from "@/flows/ui/use-command-palette";

export function SidebarRepositories() {
  const navigate = useNavigate();
  const { setOpen: setCreateProjectOpen } = useOpenCreateProject();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  return (
    <SidebarGroup className="[--font-scale:1.025]">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => goBackHome(navigate)}
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Icon icon={PaperPlaneTiltIcon} className="size-4" />
              <span>New Agent</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Icon icon={HexagonIcon} className="size-4" />
              <span>Meta hive</span>
              <Badge variant="secondary" className="ml-auto text-[0.625rem] opacity-60">Coming soon</Badge>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Icon icon={MagnifyingGlassIcon} className="size-4" />
              <span>Search</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => goToAgents(navigate)}
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Icon icon={UserIcon} className="size-4" />
              <span>Agents</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => goToPlugins(navigate)}
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Icon icon={PuzzlePieceIcon} className="size-4" />
              <span>Marketplace</span>
            </button>
          </SidebarMenuItem>
          <div className="mt-2 group flex h-8 w-full cursor-default items-center gap-stack px-row text-sm text-muted-foreground">
            <span>Projects</span>
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCreateProjectOpen(true); }}
                className="flex size-6 cursor-default items-center justify-center rounded-card text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                title="Add project"
              >
                <Icon icon={PlusIcon} className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); }}
                className="flex size-6 cursor-default items-center justify-center rounded-card text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                title="Reorder projects"
              >
                <Icon icon={ArrowsDownUpIcon} className="size-4" />
              </button>
            </div>
          </div>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
