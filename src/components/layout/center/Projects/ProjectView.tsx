import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectPickerDialog } from './dialogs/ProjectPickerDialog';

export function ProjectView() {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <FolderOpen className="size-6 text-[#2563eb]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-medium text-foreground">No project selected</div>
        <div className="text-xs text-muted-foreground">
          Pick a project from the sidebar or create a new one.
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setPickerOpen(true)}
      >
        <FolderOpen className="size-3.5" />
        Browse projects
      </Button>
      <ProjectPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
