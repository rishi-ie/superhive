import { Icon } from "@/components/ui/icon";
import { KeyboardIcon, HeadphonesIcon, SignOutIcon, CreditCardIcon, GearSixIcon, DotsThreeIcon } from "@phosphor-icons/react";
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
          <Icon icon={GearSixIcon} className="size-4" />
          <span className="flex-1 text-left">Settings</span>
          <Icon icon={DotsThreeIcon} className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="border-border bg-modal font-sans text-sm text-modal-foreground p-[6px]"
      >
        <DropdownMenuLabel className="flex items-center gap-stack p-row rounded-button">
          <Avatar className="size-8">
            <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-modal-foreground">User</span>
            <span className="text-xs text-modal-foreground/60">Free plan</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50 -mx-1.5 mx-0" />
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5 text-modal-foreground">
          <Icon icon={CreditCardIcon} className="size-4 text-modal-foreground/60" />
          <span>Manage subscription</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5 text-modal-foreground">
          <Icon icon={KeyboardIcon} className="size-4 text-modal-foreground/60" />
          <span>Keyboard shortcuts</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5 text-modal-foreground">
          <Icon icon={HeadphonesIcon} className="size-4 text-modal-foreground/60" />
          <span>Help & support</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 px-row py-1.5 text-modal-foreground" onSelect={() => goToSettings(navigate)}>
          <Icon icon={GearSixIcon} className="size-4 text-modal-foreground/60" />
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
