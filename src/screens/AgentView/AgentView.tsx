import { Bot } from 'lucide-react';

export function AgentView() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#141414] p-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <Bot className="size-6 text-[#7c3aed]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-medium text-foreground">No agent selected</div>
        <div className="text-xs text-muted-foreground">
          DB layer removed — agents coming soon.
        </div>
      </div>
    </div>
  );
}
