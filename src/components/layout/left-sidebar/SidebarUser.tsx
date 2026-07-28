import { Icon } from "@/components/ui/icon";
import { KeyboardIcon, HeadphonesIcon, SignOutIcon, CreditCardIcon, GearSixIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { goToSettings } from "@/flows/navigation/go-to-settings";
import { SETTINGS_PREVIEW_ACCOUNT } from "@/lib/settings-preview";

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
                {SETTINGS_PREVIEW_ACCOUNT.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start text-left">
              <span className="truncate text-sm font-medium text-foreground/70 hover:text-foreground">
                {SETTINGS_PREVIEW_ACCOUNT.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {SETTINGS_PREVIEW_ACCOUNT.plan} plan
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="top"
          className="rounded-xl border border-foreground/25 ring-0 bg-sidebar-bg p-[6px] font-sans text-sm text-modal-foreground"
        >
        <DropdownMenuItem className="gap-stack min-h-8 rounded-lg px-row py-1.5 text-[15px] text-modal-foreground hover:!bg-sidebar-accent-l">
          <Icon icon={CreditCardIcon} className="size-4 text-modal-foreground/60" />
          <span>Manage subscription</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 rounded-lg px-row py-1.5 text-[15px] text-modal-foreground hover:!bg-sidebar-accent-l">
          <Icon icon={KeyboardIcon} className="size-4 text-modal-foreground/60" />
          <span>Keyboard shortcuts</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 rounded-lg px-row py-1.5 text-[15px] text-modal-foreground hover:!bg-sidebar-accent-l">
          <Icon icon={HeadphonesIcon} className="size-4 text-modal-foreground/60" />
          <span>Help & support</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-stack min-h-8 rounded-lg px-row py-1.5 text-[15px] text-modal-foreground hover:!bg-sidebar-accent-l" onSelect={() => goToSettings(navigate)}>
          <Icon icon={GearSixIcon} className="size-4 text-modal-foreground/60" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50 -mx-1.5 mx-0" />
        <DropdownMenuItem variant="destructive" className="gap-stack min-h-8 rounded-lg px-row py-1.5 text-[15px] hover:!bg-sidebar-accent-l">
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
          className="flex size-6 shrink-0 items-center justify-center rounded-icon text-muted-foreground transition-colors hover:bg-sidebar-accent-l hover:cursor-default"
        >
          <Icon icon={GearSixIcon} className="size-4" />
        </button>
      )}
    </div>
  );
}
