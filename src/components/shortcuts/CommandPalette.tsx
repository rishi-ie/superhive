/**
 * CommandPalette — Modal command palette (Cmd/Ctrl+K) backed by cmdk + Radix Dialog.
 * Exposes all high-level actions: navigate settings, switch tabs, open dialogs,
 * jump to universal views, etc. Items are derived from the shortcut registry
 * + Dashboard-level actions, so adding a new action = adding one entry here.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  CommandDialog,
  CommandDialogContent,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/Command';
import { usePlatform, formatChordText, getShortcutById } from '@/lib/shortcuts';
import {
  Command,
  Settings as SettingsIcon,
  Keyboard,
  FolderPlus,
  TicketPlus,
  MessageSquare,
  Bot,
  Layers,
  ClipboardCheck,
  ArrowLeftRight,
  Sun,
} from 'lucide-react';

export type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  /** Shortcut id from the registry — rendered as the hint on the right. */
  shortcutId?: string;
  /** Group label for sub-organization. */
  group: string;
  perform: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandPaletteItem[];
};

/**
 * Headless command palette. Caller supplies the list of items.
 * Use a single instance mounted in `Dashboard.tsx` and drive via the global
 * shortcut manager.
 */
export function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const platform = usePlatform();

  // cmdk re-derives filtered state on each render — we just pass items through.
  const grouped = useMemo(() => {
    const g: Record<string, CommandPaletteItem[]> = {};
    for (const i of items) {
      (g[i.group] ??= []).push(i);
    }
    return g;
  }, [items]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandDialogContent className="max-w-[560px] top-[20%] translate-y-0">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Type a command or search…"
        />
        <CommandList>
          <CommandEmpty>No matching commands.</CommandEmpty>
          {Object.entries(grouped).map(([group, groupItems]) => (
            <CommandGroup key={group} heading={group}>
              {groupItems.map((item) => {
                const Icon = item.icon;
                const chord = item.shortcutId ? getShortcutById(item.shortcutId)?.chord : undefined;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.description ?? ''}`}
                    onSelect={() => {
                      onOpenChange(false);
                      item.perform();
                    }}
                  >
                    {Icon && <Icon size={14} strokeWidth={1.5} />}
                    <span>{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground ml-1">{item.description}</span>
                    )}
                    {chord && <CommandShortcut>{formatChordText(chord, platform)}</CommandShortcut>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialogContent>
    </CommandDialog>
  );
}

/**
 * Helper to construct the standard palette items from a Dashboard surface.
 * Kept here so call sites can re-use without duplicating strings.
 */
export function buildDefaultPaletteItems(api: {
  openSettings: () => void;
  openShortcuts: () => void;
  newProject: () => void;
  newTicket: () => void;
  newAgent: () => void;
  openProjectsAll: () => void;
  openTicketsAll: () => void;
  openChannelsAll: () => void;
  openAgentsAll: () => void;
  toggleTheme: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}): CommandPaletteItem[] {
  return [
    { id: 'go-settings',     label: 'Open settings',                    group: 'Navigate', icon: SettingsIcon, shortcutId: 'settings.open',   perform: api.openSettings },
    { id: 'go-shortcuts',    label: 'Open keyboard shortcuts',          group: 'Navigate', icon: Keyboard,     shortcutId: 'shortcuts.open',  perform: api.openShortcuts },
    { id: 'go-toggle-theme', label: 'Toggle theme',                     group: 'Navigate', icon: Sun,          shortcutId: 'app.theme.toggle', perform: api.toggleTheme },
    { id: 'go-toggle-left',  label: 'Toggle left panel',                group: 'Navigate', icon: ArrowLeftRight, shortcutId: 'nav.left-panel.toggle', perform: api.toggleLeftPanel },
    { id: 'go-toggle-right', label: 'Toggle right panel',               group: 'Navigate', icon: ArrowLeftRight, shortcutId: 'nav.right-panel.toggle', perform: api.toggleRightPanel },

    { id: 'new-project',     label: 'New project',                      group: 'Create',   icon: FolderPlus,    shortcutId: 'project.new',  perform: api.newProject },
    { id: 'new-ticket',      label: 'New ticket',                       group: 'Create',   icon: TicketPlus,    shortcutId: 'ticket.new',   perform: api.newTicket },
    { id: 'new-agent',       label: 'New agent',                        group: 'Create',   icon: Bot,           shortcutId: 'agent.new',    perform: api.newAgent },

    { id: 'view-projects',   label: 'All projects',                     group: 'Views',    icon: Layers,         shortcutId: 'project.universal', perform: api.openProjectsAll },
    { id: 'view-tickets',    label: 'All tickets',                      group: 'Views',    icon: ClipboardCheck, shortcutId: 'ticket.universal',  perform: api.openTicketsAll },
    { id: 'view-channels',   label: 'All channels',                     group: 'Views',    icon: MessageSquare,  shortcutId: 'channel.universal', perform: api.openChannelsAll },
    { id: 'view-agents',     label: 'All agents',                       group: 'Views',    icon: Bot,            shortcutId: 'agent.universal',   perform: api.openAgentsAll },
  ];
}

export const CommandPaletteIcon = Command;
