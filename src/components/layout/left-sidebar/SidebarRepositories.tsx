import { Plus, Search, Hexagon, Globe } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

export function SidebarRepositories() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Plus className="size-4" />
              <span>New chat</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Search className="size-4" />
              <span>Search</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Hexagon className="size-4" />
              <span>Meta hive</span>
              <Badge variant="secondary" className="ml-auto text-[0.625rem] opacity-60">Coming soon</Badge>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
            >
              <Globe className="size-4" />
              <span>Remote</span>
              <Badge variant="secondary" className="ml-auto text-[0.625rem] opacity-60">Coming soon</Badge>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
