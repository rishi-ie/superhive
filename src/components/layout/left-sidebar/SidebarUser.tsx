import { Icon } from "@/components/ui/icon";
import { KeyboardIcon, HeadphonesIcon, SignOutIcon, CreditCardIcon, GearSixIcon } from "@phosphor-icons/react";
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

interface SidebarUserProps {
  showGear?: boolean;
}

export function SidebarUser({ showGear = true }: SidebarUserProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex flex-1 items-center gap-stack rounded-md py-1 px-1.5 hover:cursor-default"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start text-left">
              <span className="truncate text-sm font-medium text-foreground/70 hover:text-foreground">
                User
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Free plan
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="top"
          className="ring-1 ring-sidebar-border bg-modal font-sans text-sm text-modal-foreground p-[6px]"
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

      {showGear && (
        <button
          type="button"
          onClick={() => goToSettings(navigate)}
          aria-label="Open settings"
          title="Settings"
          className="flex size-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:cursor-default"
        >
          <Icon icon={GearSixIcon} className="size-4" />
        </button>
      )}
    </div>
  );
}
