import { HugeiconsIcon } from "@/components/ui/icon";
import { PlusSignIcon, Search01Icon, HexagonIcon, GlobalIcon, UserIcon, Add01Icon, ArrowDataTransferVerticalIcon } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { goBackHome } from "@/flows/navigation";

export function SidebarRepositories() {
  const navigate = useNavigate();
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => goBackHome(navigate)}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
              <span>New chat</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <HugeiconsIcon icon={Search01Icon} className="size-4" />
              <span>Search</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <HugeiconsIcon icon={HexagonIcon} className="size-4" />
              <span>Meta hive</span>
              <Badge variant="secondary" className="ml-auto text-[0.625rem] opacity-60">Coming soon</Badge>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <HugeiconsIcon icon={GlobalIcon} className="size-4" />
              <span>Remote</span>
              <Badge variant="secondary" className="ml-auto text-[0.625rem] opacity-60">Coming soon</Badge>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              onClick={() => navigate('/agents')}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <HugeiconsIcon icon={UserIcon} className="size-4" />
              <span>Agents</span>
            </button>
          </SidebarMenuItem>
          <div className="group flex h-8 w-full cursor-default items-center gap-2 px-2 text-sm text-[#9ca3af]">
            <span>Projects</span>
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); }}
                className="flex size-6 cursor-default items-center justify-center rounded-lg text-[#9ca3af] hover:bg-sidebar-accent hover:text-foreground"
                title="Add project"
              >
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); }}
                className="flex size-6 cursor-default items-center justify-center rounded-lg text-[#9ca3af] hover:bg-sidebar-accent hover:text-foreground"
                title="Reorder projects"
              >
                <HugeiconsIcon icon={ArrowDataTransferVerticalIcon} className="size-4" />
              </button>
            </div>
          </div>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
