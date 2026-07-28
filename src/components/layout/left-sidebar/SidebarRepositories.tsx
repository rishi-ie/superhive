import { Icon } from "@/components/ui/icon";
import { HexagonIcon, MagnifyingGlassIcon, UserIcon, PaperPlaneTiltIcon, PuzzlePieceIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { goBackHome, goToAgents, goToPlugins } from "@/flows/navigation";
import { useCommandPalette } from "@/flows/ui/use-command-palette";

export function SidebarRepositories() {
  const navigate = useNavigate();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => goBackHome(navigate)}
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm font-medium text-sidebar-btn-text-l transition-colors hover:bg-sidebar-accent-l hover:cursor-default"
            >
              <Icon icon={PaperPlaneTiltIcon} className="size-4" />
              <span>New Agent</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm font-medium text-sidebar-btn-text-l transition-colors hover:bg-sidebar-accent-l hover:cursor-default"
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
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm font-medium text-sidebar-btn-text-l transition-colors hover:bg-sidebar-accent-l hover:cursor-default"
            >
              <Icon icon={MagnifyingGlassIcon} className="size-4" />
              <span>Search</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => goToAgents(navigate)}
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm font-medium text-sidebar-btn-text-l transition-colors hover:bg-sidebar-accent-l hover:cursor-default"
            >
              <Icon icon={UserIcon} className="size-4" />
              <span>Agents</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => goToPlugins(navigate)}
              className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm font-medium text-sidebar-btn-text-l transition-colors hover:bg-sidebar-accent-l hover:cursor-default"
            >
              <Icon icon={PuzzlePieceIcon} className="size-4" />
              <span>Marketplace</span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
