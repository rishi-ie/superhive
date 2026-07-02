/**
 * AgentEditDialog — modal for editing an agent's name, role, principles,
 * boundaries, and skills. Sends update to local store (running-agent WS
 * sync is handled in Phase 52).
 */
import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
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
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/toasts/context';
import { patchAgent } from '@/data/agent/store';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Agent } from '@/data/agent/store';

const SKILL_CATALOG = [
  'Typescript', 'Python', 'Rust', 'Go', 'C++',
  'Robotics', 'Perception', 'ML Training', 'Evaluation', 'DevOps',
  'Security', 'Firmware', 'Battery', 'Frontend', 'Backend',
];

const MAX_NAME = 60;
const MAX_ROLE = 80;
const MAX_TEXT = 500;

export type AgentEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  onSaved?: (agent: Agent) => void;
};

/**
 * Modal for editing an existing agent.
 * @param open - Whether the dialog is visible
 * @param onOpenChange - Called when the dialog requests open/close
 * @param agent - Agent to edit
 * @param onSaved - Called with the patched agent after a successful save
 */
export function AgentEditDialog({ open, onOpenChange, agent, onSaved }: AgentEditDialogProps) {
  const toast = useToast();
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [principles, setPrinciples] = useState(agent.principles ?? '');
  const [boundaries, setBoundaries] = useState(agent.boundaries ?? '');
  const [skills, setSkills] = useState<Set<string>>(new Set(agent.skills ?? []));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(agent.name);
      setRole(agent.role);
      setPrinciples(agent.principles ?? '');
      setBoundaries(agent.boundaries ?? '');
      setSkills(new Set(agent.skills ?? []));
      setSubmitting(false);
    }
  }, [open, agent]);

  const canSubmit = name.trim().length > 0 && role.trim().length > 0 && !submitting;

  const toggleSkill = (s: string) => {
    setSkills(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleSave = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const updated = patchAgent(agent.id, {
      name: name.trim(),
      role: role.trim(),
      principles: principles.slice(0, MAX_TEXT),
      boundaries: boundaries.slice(0, MAX_TEXT),
      skills: Array.from(skills),
    });
    if (!updated) {
      toast({ title: 'Could not save agent', type: 'error' });
      setSubmitting(false);
      return;
    }
    toast({ title: 'Agent updated', description: updated.name });
    onSaved?.(updated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-chart-2/15 text-chart-2">
              <Bot size={16} strokeWidth={STROKE_WIDTH} />
            </div>
            <div>
              <DialogTitle>Edit agent</DialogTitle>
              <DialogDescription>
                Tune this agent's identity, principles, and capabilities.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ae-name" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Name
              </Label>
              <TextInput
                id="ae-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                autoFocus
                maxLength={MAX_NAME}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ae-role" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Role
              </Label>
              <TextInput
                id="ae-role"
                value={role}
                onChange={(e) => setRole(e.target.value.slice(0, MAX_ROLE))}
                maxLength={MAX_ROLE}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ae-principles" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Principles
            </Label>
            <Textarea
              id="ae-principles"
              value={principles}
              onChange={(e) => setPrinciples(e.target.value.slice(0, MAX_TEXT))}
              placeholder="What this agent should always do."
              rows={3}
              maxLength={MAX_TEXT}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ae-boundaries" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Boundaries
            </Label>
            <Textarea
              id="ae-boundaries"
              value={boundaries}
              onChange={(e) => setBoundaries(e.target.value.slice(0, MAX_TEXT))}
              placeholder="What this agent should never do."
              rows={3}
              maxLength={MAX_TEXT}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Skills ({skills.size})
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_CATALOG.map(skill => {
                const active = skills.has(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                      active
                        ? 'bg-highlight text-highlight-foreground border-transparent'
                        : 'border-border/40 text-muted-foreground hover:text-foreground hover:bg-hover-tint'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
