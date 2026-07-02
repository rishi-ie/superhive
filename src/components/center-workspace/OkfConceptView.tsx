/**
 * OKF concept viewer — shows frontmatter + body for a single .md concept.
 * Renders the body as plain text (markdown rendering can come later).
 */
import { useEffect, useState } from 'react';
import { Pencil, FileText } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { readConcept, type OkfFileEntry } from '@/data/okf/fs';

type OkfConceptViewProps = {
  projectId: string;
  path: string | null;
  onEdit?: (path: string) => void;
};

export function OkfConceptView({ projectId, path, onEdit }: OkfConceptViewProps) {
  const [entry, setEntry] = useState<OkfFileEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setEntry(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    readConcept(projectId, path).then((e) => {
      if (!cancelled) {
        setEntry(e);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [projectId, path]);

  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 p-6">
        <FileText size={32} strokeWidth={STROKE_WIDTH} />
        <p className="text-sm">Select a concept from the sidebar</p>
        <p className="text-[10px]">Concepts are markdown files in this project's OKF bundle.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        File not found.
      </div>
    );
  }

  const fmEntries = Object.entries(entry.frontmatter);
  const typeValue = typeof entry.frontmatter['type'] === 'string' ? String(entry.frontmatter['type']) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-3 shrink-0 border-b border-border/40 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-foreground truncate">{path}</h1>
          {typeValue && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {typeValue}{fmEntries.find(([k]) => k === 'title')?.[1] ? ` · ${String(fmEntries.find(([k]) => k === 'title')?.[1])}` : ''}
            </p>
          )}
        </div>
        {onEdit && (
          <Button size="sm" variant="outline" onClick={() => onEdit(path)}>
            <Pencil size={12} strokeWidth={STROKE_WIDTH} />
            Edit
          </Button>
        )}
      </div>

      {fmEntries.length > 0 && (
        <div className="px-6 py-3 border-b border-border/40">
          <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Frontmatter</h2>
          <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-xs">
            {fmEntries.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground font-mono text-[10px]">{k}</dt>
                <dd className="text-foreground font-mono text-[10px] break-all">{JSON.stringify(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
          {entry.body}
        </pre>
      </div>
    </div>
  );
}
