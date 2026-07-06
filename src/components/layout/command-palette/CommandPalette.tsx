import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HugeiconsIcon } from "@/components/ui/icon";
import { MessageAdd01Icon, UserIcon, FolderAddIcon, Settings01Icon, HexagonIcon } from "@hugeicons/core-free-icons";
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
      overlayClassName="bg-black/40 backdrop-blur-xs"
    >
      <Command className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
        <CommandInput placeholder="Type a command or search…" autoFocus />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={run(() => toast.info("New chat — coming soon"))}>
              <HugeiconsIcon icon={MessageAdd01Icon} />
              New Chat
            </CommandItem>
            <CommandItem onSelect={run(() => toast.info("New agent — coming soon"))}>
              <HugeiconsIcon icon={UserIcon} />
              New Agent
            </CommandItem>
            <CommandItem onSelect={run(() => toast.info("New project — coming soon"))}>
              <HugeiconsIcon icon={FolderAddIcon} />
              New Project
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigate">
            <CommandItem onSelect={run(() => goToSettings(navigate))}>
              <HugeiconsIcon icon={Settings01Icon} />
              Settings
            </CommandItem>
            <CommandItem onSelect={run(() => navigate("/hive"))}>
              <HugeiconsIcon icon={HexagonIcon} />
              Meta Hive
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
