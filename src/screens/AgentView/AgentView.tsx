import { useState } from 'react';
import { Bot, Plus } from 'lucide-react';
import { ChatView } from '@/screens/ChatView';
import { useAgents, useCreateAgent } from '@/hooks/use-agents';
import { Button } from '@/components/ui/button';

export function AgentView() {
  const { data: agents = [], isLoading } = useAgents();
  const createAgent = useCreateAgent();
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = agents.find((a) => a.id === selectedId) ?? null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#141414] text-xs text-muted-foreground">
        Loading agents…
      </div>
    );
  }

  if (!selected && agents.length === 0) {
    return (
      <EmptyAgents
        name={name}
        setName={setName}
        onCreate={async () => {
          const trimmed = name.trim();
          if (!trimmed) return;
          const created = await createAgent.mutateAsync({
            name: trimmed,
            iconName: 'Bot',
            model: 'Composer 2.5 Pro',
          });
          setName('');
          setSelectedId(created.id);
        }}
        creating={createAgent.isPending}
      />
    );
  }

  if (!selected) {
    return (
      <div className="flex h-full flex-col gap-2 overflow-y-auto bg-[#141414] p-4">
        <div className="text-xs text-muted-foreground">
          {agents.length} agent{agents.length === 1 ? '' : 's'}
        </div>
        <div className="grid gap-2">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-left text-xs text-foreground transition-colors hover:bg-accent"
            >
              <Bot className="size-4 text-[#7c3aed]" />
              <span className="font-medium">{a.name}</span>
            </button>
          ))}
        </div>
        <CreateInline
          name={name}
          setName={setName}
          onCreate={async () => {
            const trimmed = name.trim();
            if (!trimmed) return;
            const created = await createAgent.mutateAsync({
              name: trimmed,
              iconName: 'Bot',
              model: 'Composer 2.5 Pro',
            });
            setName('');
            setSelectedId(created.id);
          }}
          creating={createAgent.isPending}
        />
      </div>
    );
  }

  return <ChatView category="agent" agentName={selected.name} />;
}

function EmptyAgents({
  name,
  setName,
  onCreate,
  creating,
}: {
  name: string;
  setName: (v: string) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#141414] p-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <Bot className="size-6 text-[#7c3aed]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-medium text-foreground">No agents yet</div>
        <div className="text-xs text-muted-foreground">
          Create your first agent to get started.
        </div>
      </div>
      <CreateInline
        name={name}
        setName={setName}
        onCreate={onCreate}
        creating={creating}
      />
    </div>
  );
}

function CreateInline({
  name,
  setName,
  onCreate,
  creating,
}: {
  name: string;
  setName: (v: string) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCreate();
        }}
        placeholder="Agent name…"
        className="h-8 flex-1 rounded-md border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
      />
      <Button
        type="button"
        size="sm"
        onClick={onCreate}
        disabled={creating || !name.trim()}
        className="h-8 gap-1.5 px-3 text-xs"
      >
        <Plus className="size-3.5" />
        Create
      </Button>
    </div>
  );
}
