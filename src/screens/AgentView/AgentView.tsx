import { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentPickerDialog } from './components/AgentPickerDialog';

export function AgentView() {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <Bot className="size-6 text-[#7c3aed]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-medium text-foreground">No agent selected</div>
        <div className="text-xs text-muted-foreground">
          Pick an agent from the sidebar or create a new one.
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setPickerOpen(true)}
      >
        <Bot className="size-3.5" />
        Browse agents
      </Button>
      <AgentPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
