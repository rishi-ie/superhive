import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { agents } from '@/api/agents';
import type { Agent, AgentStatus } from '@/storage/types';

const STATUS_OPTIONS: { value: AgentStatus; label: string }[] = [
  { value: 'idle', label: 'Idle' },
  { value: 'running', label: 'Running' },
  { value: 'thinking', label: 'Thinking' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'error', label: 'Error' },
];

interface AgentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (agent: Agent) => void;
}

export function AgentCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: AgentCreateDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Agent name is required');
      return;
    }

    setSubmitting(true);
    try {
      const agent = await agents.create({
        name: trimmedName,
        role: role.trim() || undefined,
        status,
      });
      toast.success(`Agent "${agent.name}" created`);
      setName('');
      setRole('');
      setStatus('idle');
      onCreated(agent);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setName('');
      setRole('');
      setStatus('idle');
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create agent</DialogTitle>
          <DialogDescription>
            Add a new agent to your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="agent-name"
              placeholder="Code Reviewer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoFocus
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-role">Role</Label>
            <Input
              id="agent-role"
              placeholder="Code reviewer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as AgentStatus)}
              disabled={submitting}
            >
              <SelectTrigger id="agent-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
