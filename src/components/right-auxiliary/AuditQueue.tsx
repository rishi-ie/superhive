import { ShieldAlert, GitMerge } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { getAuditItems, type Agent } from '@/data/agents/store';

type AuditQueueProps = {
  agent?: Agent | null;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  onViewDiff?: (auditItemId: string) => void;
  onAuditCountClick?: (agentId: string) => void;
};

export function AuditQueue({ agent, onApprove, onDeny, onViewDiff }: AuditQueueProps) {
  const items = getAuditItems(agent?.id);

  if (items.length === 0) {
    return (
      <div className="p-3">
        <span className="text-[10px] text-muted-foreground/60 italic">No pending audit items</span>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {items.map((item) => {
        const isIntercept = item.type === 'AUTH_INTERCEPT';
        return (
          <div
            key={item.id}
            className={`rounded-md border bg-card p-3 ${
              isIntercept ? 'border-l-2 border-l-chart-1 border-t-0 border-r-0 border-b-0' : 'border-border'
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              {isIntercept ? (
                <ShieldAlert size={14} strokeWidth={STROKE_WIDTH} className="text-chart-1 shrink-0 mt-0.5" />
              ) : (
                <GitMerge size={14} strokeWidth={STROKE_WIDTH} className="text-chart-2 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">{item.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  {item.description}
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-1 font-fustat">{item.timestamp}</div>
              </div>
            </div>
            <div className="flex gap-2">
              {isIntercept ? (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove?.(item.id)}
                    className="flex-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
                  >
                    Grant One-Time Access
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeny?.(item.id)}
                    className="flex-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
                  >
                    Deny
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
                    onClick={() => onViewDiff?.(item.id)}
                  >
                    View Diff
                  </button>
                  <button
                    type="button"
                    onClick={() => onApprove?.(item.id)}
                    className="flex-1 rounded-md bg-chart-1 px-2 py-1 text-[10px] font-medium text-highlight-foreground hover:bg-chart-1/90 transition-colors"
                  >
                    Approve & Merge
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
