/**
 * CreateChannelDialog — modal for creating a new communication channel.
 * Topic is required. Status defaults to OPEN. Participants are optional
 * multi-select from project agents. Related ticket is optional.
 */
import { useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { TextInput } from '@/components/ui/TextInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/lib/toast-context';
import { listProjects, listProjectAgents, createChannel } from '@/data/projects/store';
import { listUniversalTickets } from '@/data/tickets/store';
import { STROKE_WIDTH } from '@/lib/constants';
import type { CommunicationChannel, ChannelStatus } from '@/data/projects/store';

const STATUS_OPTIONS = [
  { value: 'OPEN',           label: 'Open' },
  { value: 'AWAITING_REPLY', label: 'Awaiting reply' },
  { value: 'RESOLVED',       label: 'Resolved' },
] as const;

export type CreateChannelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (channel: CommunicationChannel) => void;
  defaultWorkspaceId?: string;
  defaultProjectId?: string;
};

/**
 * Modal for creating a new channel.
 * @param open - Whether the dialog is visible
 * @param onOpenChange - Called when the dialog requests open/close
 * @param onCreated - Called with the newly created channel after a successful submit
 * @param defaultWorkspaceId - Workspace preselected when the dialog opens
 * @param defaultProjectId - Project preselected when the dialog opens
 */
export function CreateChannelDialog({
  open,
  onOpenChange,
  onCreated,
  defaultWorkspaceId,
  defaultProjectId,
}: CreateChannelDialogProps) {
  const toast = useToast();
  const projects = listProjects().filter(p => p.workspaceId === defaultWorkspaceId);

  const [topic, setTopic] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<ChannelStatus>('OPEN');
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [relatedTicketId, setRelatedTicketId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const projectAgents = useMemo(
    () => projectId ? listProjectAgents().filter(a => a.role !== undefined) : [],
    [projectId],
  );

  const ticketsForProject = useMemo(
    () => projectId
      ? listUniversalTickets(defaultWorkspaceId).filter(t => t.projectName === projects.find(p => p.id === projectId)?.title)
      : [],
    [projectId, projects, defaultWorkspaceId],
  );

  useEffect(() => {
    if (open) {
      setTopic('');
      setProjectId(defaultProjectId ?? projects[0]?.id ?? '');
      setStatus('OPEN');
      setSelectedAgentIds(new Set());
      setRelatedTicketId('');
      setSubmitting(false);
    }
  }, [open, defaultProjectId, projects]);

  const canSubmit = topic.trim().length > 0 && projectId.length > 0 && !submitting;

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
    const channel = createChannel({
      projectId,
      topic: topic.trim(),
      status,
      participants: Array.from(selectedAgentIds),
      relatedTicketId: relatedTicketId || undefined,
    });
    if (!channel) {
      toast({ title: 'Could not create channel', type: 'error' });
      setSubmitting(false);
      return;
    }
    toast({ title: 'Channel created', description: channel.topic });
    onCreated?.(channel);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-chart-4/15 text-chart-4">
              <MessageSquare size={16} strokeWidth={STROKE_WIDTH} />
            </div>
            <div>
              <DialogTitle>New channel</DialogTitle>
              <DialogDescription>
                A thread for a topic, with a roster of participants.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cc-topic" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Topic
            </Label>
            <TextInput
              id="cc-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value.slice(0, 80))}
              placeholder="e.g. Site survey handoff"
              autoFocus
              maxLength={80}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc-project" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Project
              </Label>
              <Select
                value={projectId}
                onChange={setProjectId}
                options={projects.map(p => ({ label: p.title, value: p.id }))}
                placeholder="Choose a project"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-status" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Status
              </Label>
              <Select
                value={status}
                onChange={(v) => setStatus(v as ChannelStatus)}
                options={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cc-related" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Related ticket (optional)
            </Label>
            <Select
              value={relatedTicketId}
              onChange={setRelatedTicketId}
              options={[
                { value: '', label: '— None —' },
                ...ticketsForProject.map(t => ({ value: t.id, label: t.title })),
              ]}
              placeholder="Pick a ticket"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Participants ({selectedAgentIds.size})
            </Label>
            {projectAgents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Pick a project to see its agents.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border border-border/40 p-2">
                {projectAgents.map(agent => (
                  <label
                    key={agent.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-hover-tint cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAgentIds.has(agent.id)}
                      onCheckedChange={() => toggleAgent(agent.id)}
                    />
                    <span className="text-xs text-foreground">{agent.name}</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">{agent.role}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Create channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
