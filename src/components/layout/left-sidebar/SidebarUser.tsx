import { Icon } from "@/components/ui/icon";
import { KeyboardIcon, HeadphonesIcon, SignOutIcon, CreditCardIcon, GearIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { goToSettings } from "@/flows/navigation/go-to-settings";

export function SidebarUser() {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center gap-stack rounded-card px-row text-sm text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground hover:cursor-default"
        >
          <Icon icon={GearIcon} className="size-4" />
          <span className="flex-1 text-left">Settings</span>
          <Icon icon={DotsThreeIcon} className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="border-border bg-sidebar font-sans text-sm p-[6px]"
      >
        <DropdownMenuLabel className="flex items-center gap-stack p-row rounded-button">
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
        <DropdownMenuSeparator className="bg-border/50 -mx-1.5 mx-0" />
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5">
          <Icon icon={CreditCardIcon} className="size-4 text-muted-foreground" />
          <span>Manage subscription</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5">
          <Icon icon={KeyboardIcon} className="size-4 text-muted-foreground" />
          <span>Keyboard shortcuts</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5">
          <Icon icon={HeadphonesIcon} className="size-4 text-muted-foreground" />
          <span>Help & support</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5" onSelect={() => goToSettings(navigate)}>
          <Icon icon={GearIcon} className="size-4 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50 -mx-1.5 mx-0" />
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5 text-destructive focus:text-destructive">
          <Icon icon={SignOutIcon} className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
