import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import { ChatCircleDotsIcon, UserIcon, FolderPlusIcon, GearSixIcon, HexagonIcon } from "@phosphor-icons/react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandPalette } from "@/flows/ui/use-command-palette";
import { goToSettings } from "@/flows/navigation/go-to-settings";

export function CommandPalette() {
  const navigate = useNavigate();
  const { open, setOpen } = useCommandPalette();

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      className="font-sans"
      overlayClassName="bg-background supports-backdrop-filter:backdrop-blur-xs"
    >
      <Command className="[&_[cmdk-group-heading]]:px-row.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
        <CommandInput placeholder="Type a command or search…" autoFocus />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={run(() => toast.info("New chat — coming soon"))}>
              <Icon icon={ChatCircleDotsIcon} />
              New Chat
            </CommandItem>
            <CommandItem onSelect={run(() => toast.info("New agent — coming soon"))}>
              <Icon icon={UserIcon} />
              New Agent
            </CommandItem>
            <CommandItem onSelect={run(() => toast.info("New project — coming soon"))}>
              <Icon icon={FolderPlusIcon} />
              New Project
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigate">
            <CommandItem onSelect={run(() => goToSettings(navigate))}>
              <Icon icon={GearSixIcon} />
              Settings
            </CommandItem>
            <CommandItem onSelect={run(() => navigate("/hive"))}>
              <Icon icon={HexagonIcon} />
              Meta Hive
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
