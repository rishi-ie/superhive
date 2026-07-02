/**
 * Permission history view — list of past permission requests for an agent.
 */
import { ShieldCheck, ShieldX, Clock } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { listPermissionRequestsByAgent } from '@/data/permission_requests/store';

type PermissionHistoryProps = {
  agentUlid: string;
};

export function PermissionHistory({ agentUlid }: PermissionHistoryProps) {
  const requests = listPermissionRequestsByAgent(agentUlid);

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 p-6">
        <Clock size={32} strokeWidth={STROKE_WIDTH} />
        <p className="text-sm">No permission requests yet</p>
        <p className="text-[10px]">Requests from this agent will appear here.</p>
      </div>
    );
  }

  const sorted = [...requests].sort((a, b) => (b.requestedAt > a.requestedAt ? 1 : -1));

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      {sorted.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-2 p-2 rounded-md border border-border/40 bg-card/30"
        >
          {r.status === 'GRANTED' ? (
            <ShieldCheck size={14} strokeWidth={STROKE_WIDTH} className="text-chart-2 shrink-0" />
          ) : r.status === 'DENIED' ? (
            <ShieldX size={14} strokeWidth={STROKE_WIDTH} className="text-chart-5 shrink-0" />
          ) : (
            <Clock size={14} strokeWidth={STROKE_WIDTH} className="text-muted-foreground shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{r.action}</div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(r.requestedAt).toLocaleString()}
            </div>
          </div>
          <span className={`text-[10px] uppercase tracking-wider font-medium ${
            r.status === 'GRANTED' ? 'text-chart-2'
            : r.status === 'DENIED' ? 'text-chart-5'
            : 'text-muted-foreground'
          }`}>
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}
