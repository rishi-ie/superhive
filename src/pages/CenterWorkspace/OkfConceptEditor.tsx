/**
 * OKF concept editor — edit a .md concept's frontmatter and body.
 * Saves via the IPC `okf:write-concept` handler.
 */
import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/toasts/context';
import { readConcept, writeConcept } from '@/data/okf/fs';

type OkfConceptEditorProps = {
  projectId: string;
  path: string | null;
  onClose: () => void;
  onSaved?: (path: string) => void;
};

export function OkfConceptEditor({ projectId, path, onClose, onSaved }: OkfConceptEditorProps) {
  const toast = useToast();
  const [frontmatterText, setFrontmatterText] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!path) {
      return;
    }
    let cancelled = false;
    readConcept(projectId, path).then((e) => {
      if (!cancelled) {
        setFrontmatterText(formatFrontmatter(e?.frontmatter ?? {}));
        setBody(e?.body ?? '');
      }
    });
    return () => { cancelled = true; };
  }, [projectId, path]);

  if (!path) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const frontmatter = parseFrontmatter(frontmatterText);
      await writeConcept(projectId, path, frontmatter, body);
      toast({ title: 'Concept saved', description: path });
      onSaved?.(path);
      onClose();
    } catch (err) {
      toast({ title: 'Save failed', description: String(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-3 shrink-0 border-b border-border/40 flex items-center justify-between gap-3">
        <h1 className="text-base font-bold text-foreground truncate">Edit · {path}</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save size={12} strokeWidth={STROKE_WIDTH} />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close editor">
            <X size={12} strokeWidth={STROKE_WIDTH} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Frontmatter (YAML)
          </label>
          <TextInput
            value={frontmatterText}
            onChange={e => setFrontmatterText(e.target.value)}
            placeholder="key: value"
            className="font-mono text-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Body (Markdown)
          </label>
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={20}
            className="font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function formatFrontmatter(fm: Record<string, unknown>): string {
  return Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
}

function parseFrontmatter(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of text.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (!key) continue;
    try { out[key] = JSON.parse(val); } catch { out[key] = val; }
  }
  return out;
}
