import {
  Keyboard,
  LifeBuoy,
  LogOut,
  CreditCard,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SidebarUser() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-accent">
          <Avatar className="size-8">
            <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col">
            <span className="text-xs font-medium text-foreground">User</span>
            <span className="text-xs text-muted-foreground">Free</span>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="border-border bg-card"
      >
        <DropdownMenuLabel className="flex items-center gap-2 p-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">User</span>
            <span className="text-xs text-muted-foreground">Free plan</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem className="gap-2">
          <CreditCard className="size-4 text-muted-foreground" />
          <span>Manage subscription</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Keyboard className="size-4 text-muted-foreground" />
          <span>Keyboard shortcuts</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <LifeBuoy className="size-4 text-muted-foreground" />
          <span>Help & support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
