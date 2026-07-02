/**
 * CreateAgentDialog — modal for capturing a new agent's identity and Pi path.
 *
 * Required: name, role, piPath (must exist on disk).
 * Optional: principles, boundaries, skills (chip multi-select).
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
import { createAgent } from '@/data/agent/store';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Agent } from '@/data/agent/store';

const SKILL_CATALOG = [
  'Typescript', 'Python', 'Rust', 'Go', 'C++',
  'Robotics', 'Perception', 'ML Training', 'Evaluation', 'DevOps',
  'Security', 'Firmware', 'Battery', 'Frontend', 'Backend',
];

const MAX_NAME = 60;
const MAX_ROLE = 80;
const MAX_PATH = 500;
const MAX_TEXT = 500;

export type CreateAgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (agent: Agent) => void;
};

/**
 * Modal for creating a new agent. Submit is disabled until name + role are set.
 * Pi path is validated against the filesystem before submit.
 *
 * @param open - Whether the dialog is visible
 * @param onOpenChange - Called when the dialog requests open/close
 * @param onCreated - Called with the newly created agent after a successful submit
 */
export function CreateAgentDialog({ open, onOpenChange, onCreated }: CreateAgentDialogProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [piPath, setPiPath] = useState('');
  const [principles, setPrinciples] = useState('');
  const [boundaries, setBoundaries] = useState('');
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setRole('');
      setPiPath('');
      setPrinciples('');
      setBoundaries('');
      setSkills(new Set());
      setSubmitting(false);
      setPathError(null);
      // Pre-fill piPath with the default agents dir (auto-created on first call).
      void window.electron.app.agentsDir().then((dir) => {
        setPiPath((current) => (current ? current : dir));
      });
    }
  }, [open]);

  const canSubmit =
    name.trim().length > 0 &&
    role.trim().length > 0 &&
    piPath.trim().length > 0 &&
    !submitting;

  const toggleSkill = (s: string) => {
    setSkills(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setPathError(null);

    const trimmedPath = piPath.trim();
    const exists = await window.electron.fs.pathExists(trimmedPath);
    if (!exists) {
      setPathError(`Path does not exist: ${trimmedPath}`);
      setSubmitting(false);
      return;
    }

    const agent = createAgent({
      name: name.trim(),
      role: role.trim(),
      piPath: trimmedPath,
      principles: principles.slice(0, MAX_TEXT),
      boundaries: boundaries.slice(0, MAX_TEXT),
      skills: Array.from(skills),
    });
    if (!agent) {
      toast({ title: 'Could not create agent', type: 'error' });
      setSubmitting(false);
      return;
    }
    toast({ title: 'Agent created', description: agent.name });
    onCreated?.(agent);
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
              <DialogTitle>New agent</DialogTitle>
              <DialogDescription>
                Give this agent a name, role, and the path to its Pi agent script.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ca-name" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Name
              </Label>
              <TextInput
                id="ca-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                placeholder="e.g. Atlas"
                autoFocus
                maxLength={MAX_NAME}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ca-role" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
                Role
              </Label>
              <TextInput
                id="ca-role"
                value={role}
                onChange={(e) => setRole(e.target.value.slice(0, MAX_ROLE))}
                placeholder="e.g. Code reviewer"
                maxLength={MAX_ROLE}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ca-piPath" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Pi agent path
            </Label>
            <TextInput
              id="ca-piPath"
              value={piPath}
              onChange={(e) => {
                setPiPath(e.target.value.slice(0, MAX_PATH));
                setPathError(null);
              }}
              placeholder="/Users/me/projects/my-pi-agent"
              maxLength={MAX_PATH}
              className={pathError ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            {pathError ? (
              <p className="text-[10px] text-destructive">{pathError}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Absolute path to a directory containing an agent.sh script. Validated against the filesystem.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ca-principles" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Principles
            </Label>
            <Textarea
              id="ca-principles"
              value={principles}
              onChange={(e) => setPrinciples(e.target.value.slice(0, MAX_TEXT))}
              placeholder="What this agent should always do."
              rows={3}
              maxLength={MAX_TEXT}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ca-boundaries" className="text-[10px] uppercase tracking-wider font-normal text-muted-foreground">
              Boundaries
            </Label>
            <Textarea
              id="ca-boundaries"
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
            Create agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}