import { useState } from 'react';
import { Bot, FolderOpen, Plus } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useAgents, useCreateAgent } from '@/hooks/use-agents';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import { usePicker } from '@/providers/picker-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { describePgError } from '@/lib/logger';

const MODE_CONFIG = {
  agent: {
    emptyText: 'No agents yet',
    createText: 'Create new agent',
    Icon: Bot,
  },
  project: {
    emptyText: 'No projects yet',
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
  const [pgErr, setPgErr] = useState<ReturnType<typeof describePgError> | null>(null);

  const config = mode ? MODE_CONFIG[mode] : null;

  const resetCreate = () => {
    setCreating(false);
    setNewName('');
    setPgErr(null);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetCreate();
    closePicker();
  };

  const handleSelectCreate = () => {
    setCreating(true);
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPgErr(null);
    try {
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
    } catch (err) {
      setPgErr(describePgError(err));
      return;
    }
    resetCreate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      resetCreate();
    }
  };

  if (!config || !mode) return null;

  const isPending = createAgent.isPending || createProject.isPending;
  const list = mode === 'agent' ? agents : projects;
  const isEmpty = list.length === 0;

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command>
        <div className="p-1">
          {!creating && (
            <CommandInput placeholder={`Search ${mode}s…`} />
          )}
        </div>
        <CommandList>
          {creating ? (
            <>
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
                  onClick={resetCreate}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
              {pgErr && (
                <div className="mx-2 mb-2 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs">
                  <div className="mb-1 font-medium text-red-500">DB error</div>
                  <div className="text-foreground/90">{pgErr.message}</div>
                  {pgErr.code && (
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                      code: {pgErr.code}
                      {pgErr.position ? ` @ position ${pgErr.position}` : ''}
                    </div>
                  )}
                  {pgErr.detail && (
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {pgErr.detail}
                    </div>
                  )}
                  {pgErr.hint && (
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                      hint: {pgErr.hint}
                    </div>
                  )}
                  {pgErr.query && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[10px] text-muted-foreground">
                        query
                      </summary>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
{pgErr.query}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {isEmpty ? (
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  <config.Icon className="size-6 text-muted-foreground/40" />
                  <div className="text-xs font-medium text-foreground">{config.emptyText}</div>
                  <div className="text-xs text-muted-foreground">
                    Create your first {mode} to get started.
                  </div>
                  <CommandItem
                    value="__create__"
                    onSelect={handleSelectCreate}
                    className="mt-1 text-muted-foreground"
                  >
                    <Plus className="size-3.5" />
                    <span>{config.createText}</span>
                  </CommandItem>
                </div>
              ) : (
                <CommandGroup>
                  {mode === 'agent' &&
                    agents.map((agent) => (
                      <CommandItem
                        key={agent.id}
                        value={agent.name}
                        keywords={[agent.id]}
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
                        value={project.name}
                        keywords={[project.id]}
                        onSelect={() => selectProject(project.id)}
                      >
                        <FolderOpen className="size-3.5 text-[#2563eb]" />
                        <span className="flex-1 truncate">{project.name}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
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
      </Command>
    </CommandDialog>
  );
}
