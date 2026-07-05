import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { SearchIcon, MapIcon, CodeIcon, BugIcon, EyeIcon, RefreshCwIcon, HelpCircleIcon, BeakerIcon, RocketIcon, FileTextIcon } from "lucide-react";
import { SLASH_COMMANDS } from "../mock";

const iconMap: Record<string, React.ReactNode> = {
  MapIcon: <MapIcon className="size-4" />,
  CodeIcon: <CodeIcon className="size-4" />,
  BugIcon: <BugIcon className="size-4" />,
  EyeIcon: <EyeIcon className="size-4" />,
  RefreshCwIcon: <RefreshCwIcon className="size-4" />,
  HelpCircleIcon: <HelpCircleIcon className="size-4" />,
  BeakerIcon: <BeakerIcon className="size-4" />,
  RocketIcon: <RocketIcon className="size-4" />,
  FileTextIcon: <FileTextIcon className="size-4" />,
  SearchIcon: <SearchIcon className="size-4" />,
};

export function SlashCommandPopover() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.name.includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-2">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 bg-transparent py-2 px-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandList>
            <CommandEmpty>No commands found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((cmd) => (
                <CommandItem
                  key={cmd.name}
                  value={cmd.name}
                  className="flex items-center gap-2.5 py-2 px-2 cursor-pointer"
                >
                  <span className="flex items-center justify-center size-7 rounded-md bg-muted shrink-0">
                    {iconMap[cmd.icon]}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium">{cmd.name}</span>
                    <span className="text-[11px] text-muted-foreground">{cmd.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
