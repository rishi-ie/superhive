/**
 * CreateTicketDialog — modal for capturing a new ticket.
 * Title is required. Description, success criteria, priority, type, assignee
 * are optional with sensible defaults.
 */
import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/toasts/context';
import { listProjects } from '@/data/project/store';
import { createTicket } from '@/data/ticket/store';
import { STROKE_WIDTH } from '@/lib/constants';
import type { UniversalTicket, Priority, TicketType } from '@/data/ticket/store';

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 280;
const MAX_CRITERIA = 500;

const PRIORITY_OPTIONS = [
  { value: 'HIGH',   label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW',    label: 'Low' },
] as const;

const TYPE_OPTIONS = [
  { value: 'FEATURE',  label: 'Feature' },
  { value: 'BUG',      label: 'Bug' },
  { value: 'REFACTOR', label: 'Refactor' },
  { value: 'INFRA',    label: 'Infra' },
] as const;

export type CreateTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (ticket: UniversalTicket) => void;
  defaultWorkspaceId?: string;
  defaultProjectName?: string;
  defaultAssigneeName?: string;
};

/**
 * Modal for creating a new ticket. Submit is disabled until title is set.
 * @param open - Whether the dialog is visible
 * @param onOpenChange - Called when the dialog requests open/close (cancel, Esc, backdrop)
 * @param onCreated - Called with the newly created ticket after a successful submit
 * @param defaultWorkspaceId - Workspace preselected when the dialog opens
 * @param defaultProjectName - Project name preselected when the dialog opens
 * @param defaultAssigneeName - Assignee preselected when the dialog opens
 */
export function CreateTicketDialog({
  open,
  onOpenChange,
  onCreated,
  defaultWorkspaceId,
  defaultProjectName,
  defaultAssigneeName,
}: CreateTicketDialogProps) {
  const toast = useToast();
  const projects = listProjects().filter(p => p.workspaceId === defaultWorkspaceId);

  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState<string>('');
  const [description, setDescription] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [type, setType] = useState<TicketType>('FEATURE');
  const [assigneeName, setAssigneeName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setProjectName(defaultProjectName ?? projects[0]?.title ?? '');
      setDescription('');
      setSuccessCriteria('');
      setPriority('MEDIUM');
      setType('FEATURE');
      setAssigneeName(defaultAssigneeName ?? 'Unassigned');
      setSubmitting(false);
    }
  }, [open, defaultProjectName, defaultAssigneeName, projects]);

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit || !defaultWorkspaceId) return;
    setSubmitting(true);
    const ticket = createTicket({
      title: title.trim(),
      projectName: projectName || 'Unassigned',
      workspaceId: defaultWorkspaceId,
      priority,
      type,
      assigneeName,
    });
    if (!ticket) {
      toast({ title: 'Could not create ticket', type: 'error' });
      setSubmitting(false);
      return;
    }
    toast({ title: 'Ticket created', description: ticket.title });
    onCreated?.(ticket);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-chart-3/15 text-chart-3">
              <ClipboardCheck size={16} strokeWidth={STROKE_WIDTH} />
            </div>
            <div>
              <DialogTitle>New ticket</DialogTitle>
              <DialogDescription>
                Track a unit of work for the swarm.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-title" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Title
            </Label>
            <TextInput
              id="ct-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              placeholder="e.g. Add user login screen"
              autoFocus
              maxLength={MAX_TITLE}
            />
            <div className="flex justify-end text-[10px] text-muted-foreground">
              {title.length}/{MAX_TITLE}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ct-project" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Project
              </Label>
              <Select
                value={projectName}
                onChange={setProjectName}
                options={projects.map(p => ({ label: p.title, value: p.title }))}
                placeholder="Choose a project"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-assignee" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Assignee
              </Label>
              <TextInput
                id="ct-assignee"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                placeholder="e.g. Alice"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ct-priority" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Priority
              </Label>
              <Select
                value={priority}
                onChange={(v) => setPriority(v as Priority)}
                options={PRIORITY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-type" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Type
              </Label>
              <Select
                value={type}
                onChange={(v) => setType(v as TicketType)}
                options={TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-description" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="ct-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
              placeholder="What needs to happen?"
              rows={3}
              maxLength={MAX_DESCRIPTION}
            />
            <div className="flex justify-end text-[10px] text-muted-foreground">
              {description.length}/{MAX_DESCRIPTION}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-criteria" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Success criteria
            </Label>
            <Textarea
              id="ct-criteria"
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value.slice(0, MAX_CRITERIA))}
              placeholder="What does done look like?"
              rows={2}
              maxLength={MAX_CRITERIA}
            />
            <div className="flex justify-end text-[10px] text-muted-foreground">
              {successCriteria.length}/{MAX_CRITERIA}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Create ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
