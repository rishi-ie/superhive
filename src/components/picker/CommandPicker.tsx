import { useState } from 'react';
import { Bot, FolderOpen, Plus } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useAgents, useCreateAgent } from '@/hooks/use-agents';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import { usePicker } from '@/providers/picker-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MODE_CONFIG = {
  agent: {
    title: 'Select agent',
    description: 'Choose an agent to chat with.',
    emptyText: 'No agents found.',
    createText: 'Create new agent',
    Icon: Bot,
  },
  project: {
    title: 'Select project',
    description: 'Choose a project to work on.',
    emptyText: 'No projects found.',
    createText: 'Create new project',
    Icon: FolderOpen,
  },
} as const;

export function CommandPicker() {
  const { open, mode, closePicker, selectAgent, selectProject } = usePicker();
  const { data: agents = [] } = useAgents();
  const { data: projects = [] } = useProjects();
  const createAgent = useCreateAgent();
  const createProject = useCreateProject();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const config = mode ? MODE_CONFIG[mode] : null;

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      closePicker();
      setCreating(false);
      setNewName('');
    }
  };

  const handleSelectCreate = () => {
    setCreating(true);
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (mode === 'agent') {
      const created = await createAgent.mutateAsync({
        name: trimmed,
        iconName: 'Bot',
        model: 'Composer 2.5 Pro',
      });
      selectAgent(created.id);
    } else if (mode === 'project') {
      const created = await createProject.mutateAsync({ name: trimmed });
      selectProject(created.id);
    }
    setCreating(false);
    setNewName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      setCreating(false);
      setNewName('');
    }
  };

  if (!config || !mode) return null;

  const isPending = createAgent.isPending || createProject.isPending;

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <div className="p-1">
        {!creating && (
          <CommandInput placeholder={`Search ${mode}s…`} />
        )}
      </div>
      <CommandList>
        {creating ? (
          <div className="flex items-center gap-2 p-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${mode} name…`}
              className="h-7 flex-1 text-xs"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
              className="h-7 px-2 text-xs"
            >
              Create
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setCreating(false); setNewName(''); }}
              className="h-7 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <CommandEmpty>{config.emptyText}</CommandEmpty>
            <CommandGroup>
              {mode === 'agent' &&
                agents.map((agent) => (
                  <CommandItem
                    key={agent.id}
                    value={agent.id}
                    onSelect={() => selectAgent(agent.id)}
                  >
                    <Bot className="size-3.5 text-[#7c3aed]" />
                    <span className="flex-1 truncate">{agent.name}</span>
                  </CommandItem>
                ))}
              {mode === 'project' &&
                projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.id}
                    onSelect={() => selectProject(project.id)}
                  >
                    <FolderOpen className="size-3.5 text-[#2563eb]" />
                    <span className="flex-1 truncate">{project.name}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="__create__"
                onSelect={handleSelectCreate}
                className="text-muted-foreground"
              >
                <Plus className="size-3.5" />
                <span>{config.createText}</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
