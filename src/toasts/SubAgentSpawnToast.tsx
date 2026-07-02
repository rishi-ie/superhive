/**
 * Sub-agent spawn toast — appears when an agent requests to spawn a custom sub-agent.
 */
import { useState, useCallback } from 'react';
import { Bot, Check, X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { registerSubAgent, listSubAgentsByParent } from '@/data/sub_agent/store';
import { useWsEvents } from '@/lib/ws-client';
import { useToast } from '@/toasts/context';

type SpawnRequest = {
  id: string;
  ulid: string;
  name: string;
  kind: string;
  description?: string;
  ts: number;
};

export function SubAgentSpawnToastContainer() {
  const [requests, setRequests] = useState<SpawnRequest[]>([]);
  const toast = useToast();

  const handler = useCallback((event: Record<string, unknown>) => {
    if (event['type'] !== 'subagent:spawn-request') return;
    const ulid = String(event['ulid'] ?? '');
    const name = String(event['name'] ?? 'Sub-agent');
    const kind = String(event['kind'] ?? 'custom');
    const description = typeof event['description'] === 'string' ? String(event['description']) : undefined;
    const ts = Number(event['ts'] ?? Date.now());
    setRequests((prev) => [
      ...prev,
      { id: `${ulid}-${ts}`, ulid, name, kind, description, ts },
    ]);
  }, []);

  useWsEvents(handler);

  const handleApprove = (req: SpawnRequest) => {
    const existing = listSubAgentsByParent(req.ulid);
    const newId = `sub-${Date.now().toString(36)}`;
    if (!existing.some(s => s.name === req.name && s.kind === req.kind)) {
      registerSubAgent({ id: newId, parentUlid: req.ulid, name: req.name, kind: req.kind, task: req.description });
    }
    toast({ title: 'Sub-agent spawned', description: req.name });
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };
  const handleDeny = (req: SpawnRequest) => {
    toast({ title: 'Sub-agent spawn denied', description: req.name });
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  if (requests.length === 0) return null;

  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto">
      {requests.map((r, idx) => (
        <div
          key={r.id}
          className="flex items-center gap-2 rounded-md border border-border bg-card p-2 shadow-md w-80"
          style={{ marginTop: idx === 0 ? '4rem' : 0 }}
        >
          <Bot size={16} strokeWidth={STROKE_WIDTH} className="text-chart-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">Spawn {r.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">
              {r.kind}{r.description ? ` · ${r.description}` : ''}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleApprove(r)}>
            <Check size={12} strokeWidth={STROKE_WIDTH} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeny(r)}>
            <X size={12} strokeWidth={STROKE_WIDTH} />
          </Button>
        </div>
      ))}
    </div>
  );
}
