/**
 * CreateProjectDialog — modal for capturing a new project's initial state.
 * Title + Workspace are required. Description, success criteria, color, and team
 * are optional — the user can defer team selection and edit later via Manage.
 */
import { useEffect, useState } from 'react';
import { Layers, Check } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/Checkbox';
import { Avatar } from '@/components/ui/Avatar';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/lib/toast-context';
import { listWorkspaces } from '@/data/workspaces/store';
import { listAgents } from '@/data/agents/store';
import { createProject } from '@/data/projects/store';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Project } from '@/data/projects/interface';

const COLOR_SWATCHES = [
  { name: 'Blue',   value: '#0562EF' },
  { name: 'Green',  value: '#50a878' },
  { name: 'Amber',  value: '#d4a84b' },
  { name: 'Violet', value: '#7b68ee' },
  { name: 'Rose',   value: '#dc6b6b' },
  { name: 'Slate',  value: '#6b7280' },
];

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 280;
const MAX_CRITERIA = 500;

export type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (project: Project) => void;
  defaultWorkspaceId?: string;
};

/**
 * Modal for creating a new project. Submit is disabled until title and workspace
 * are set. Team selection is optional — picks are converted into IDLE ProjectAgents
 * via the projects store.
 *
 * @param open - Whether the dialog is visible
 * @param onOpenChange - Called when the dialog requests open/close (cancel, Esc, backdrop)
 * @param onCreated - Called with the newly created project after a successful submit
 * @param defaultWorkspaceId - Workspace preselected when the dialog opens (falls back to first workspace)
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
  defaultWorkspaceId,
}: CreateProjectDialogProps) {
  const toast = useToast();
  const workspaces = listWorkspaces();
  const agents = listAgents();

  const [title, setTitle] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [color, setColor] = useState<string>(COLOR_SWATCHES[0]!.value);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setWorkspaceId(defaultWorkspaceId ?? workspaces[0]?.id ?? '');
      setDescription('');
      setSuccessCriteria('');
      setColor(COLOR_SWATCHES[0]!.value);
      setSelectedAgentIds(new Set());
      setSubmitting(false);
    }
  }, [open, defaultWorkspaceId, workspaces]);

  const canSubmit = title.trim().length > 0 && workspaceId.length > 0 && !submitting;

  const toggleAgent = (id: string) => {
    setSelectedAgentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const project = createProject({
      title: title.trim(),
      workspaceId,
      description,
      successCriteria,
      color,
      agentIds: Array.from(selectedAgentIds),
    });
    if (!project) {
      toast({ title: 'Could not create project', type: 'error' });
      setSubmitting(false);
      return;
    }
    toast({ title: 'Project created', description: project.title });
    onCreated?.(project);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-chart-1/15 text-chart-1">
              <Layers size={16} strokeWidth={STROKE_WIDTH} />
            </div>
            <div>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Capture the deliverable, the team, and what done looks like.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-title" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Deliverable
            </Label>
            <TextInput
              id="cp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              placeholder="e.g. Q4 Pitch Deck"
              autoFocus
              maxLength={MAX_TITLE}
            />
            <div className="flex justify-end text-[10px] text-muted-foreground">
              {title.length}/{MAX_TITLE}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-workspace" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Workspace
            </Label>
            <Select
              value={workspaceId}
              onChange={setWorkspaceId}
              options={workspaces.map(w => ({ label: w.name, value: w.id }))}
              placeholder="Choose a workspace"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-description" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Brief
            </Label>
            <Textarea
              id="cp-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
              placeholder="Context, constraints, audience."
              rows={3}
              maxLength={MAX_DESCRIPTION}
            />
            <div className="flex justify-end text-[10px] text-muted-foreground">
              {description.length}/{MAX_DESCRIPTION}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-criteria" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Success criteria
            </Label>
            <Textarea
              id="cp-criteria"
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value.slice(0, MAX_CRITERIA))}
              placeholder={"What does 'done' look like?\nOne per line."}
              rows={4}
              maxLength={MAX_CRITERIA}
            />
            <div className="flex justify-end text-[10px] text-muted-foreground">
              {successCriteria.length}/{MAX_CRITERIA}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Color
            </Label>
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map(swatch => {
                const selected = color === swatch.value;
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => setColor(swatch.value)}
                    aria-label={swatch.name}
                    aria-pressed={selected}
                    className="size-7 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{
                      backgroundColor: swatch.value,
                      borderColor: selected ? 'var(--foreground)' : 'transparent',
                    }}
                  >
                    {selected && (
                      <Check
                        size={12}
                        strokeWidth={STROKE_WIDTH * 1.5}
                        className="mx-auto text-white drop-shadow"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Team
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {selectedAgentIds.size} agent{selectedAgentIds.size === 1 ? '' : 's'} selected
              </span>
            </div>
            <div className="rounded-md border border-border max-h-44 overflow-y-auto">
              {agents.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground">No agents available.</div>
              ) : (
                agents.map(agent => {
                  const checked = selectedAgentIds.has(agent.id);
                  return (
                    <label
                      key={agent.id}
                      className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 hover:bg-hover-tint transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleAgent(agent.id)}
                        size="sm"
                      />
                      <Avatar
                        name={agent.name}
                        size="xs3"
                        color="bg-chart-2"
                        className="font-bold text-sidebar-primary-foreground"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-foreground truncate">{agent.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{agent.role}</div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Pick agents to collaborate on this deliverable. You can change this later.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            className="flex-1"
          >
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}