import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { agents } from '@/api/agents';
import type { Agent } from '@/storage/types';
import { AgentCreateDialog } from './AgentCreateDialog';

interface AgentPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentPickerDialog({
  open,
  onOpenChange,
}: AgentPickerDialogProps) {
  const navigate = useNavigate();
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (open) {
      agents.list().then(setAgentList);
    }
  }, [open]);

  function handleSelectAgent(agent: Agent) {
    onOpenChange(false);
    navigate(`/agents/${agent.id}`);
  }

  function handleCreateNew() {
    onOpenChange(false);
    setCreateOpen(true);
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput placeholder="Search agents..." autoFocus />
        <CommandList>
          <CommandEmpty>No agents yet — pick 'Create new agent…' below.</CommandEmpty>

          <CommandGroup heading="Agents">
            {agentList.map((agent) => (
              <CommandItem
                key={agent.id}
                value={agent.id}
                onSelect={() => handleSelectAgent(agent)}
                className="flex items-center gap-2"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-[#7c3aed]/20">
                  <Bot className="size-3 text-[#7c3aed]" />
                </span>
                <span className="flex-1 truncate font-medium">{agent.name}</span>
                {agent.role && (
                  <span className="text-muted-foreground">{agent.role}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup>
            <CommandItem
              value="__create__"
              onSelect={handleCreateNew}
              className="flex items-center gap-2"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-accent">
                <Plus className="size-3" />
              </span>
              <span className="font-medium">Create new agent…</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <AgentCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(agent) => {
          setCreateOpen(false);
          navigate(`/agents/${agent.id}`);
        }}
      />
    </>
  );
}
