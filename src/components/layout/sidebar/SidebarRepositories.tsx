import { Plus, Search, Hexagon, Globe } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function SidebarRepositories() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <Plus className="size-4" />
              <span>New chat</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <Search className="size-4" />
              <span>Search</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <Hexagon className="size-4" />
              <span>Meta hive</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <Globe className="size-4" />
              <span>Remote</span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
