/**
 * Audit queue — AUTH_INTERCEPT and DIFF_REVIEW items with approve/deny actions.
 */
import { ShieldAlert, GitMerge } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { getAuditItems, type Agent } from '@/data/agents/store';

type AuditQueueProps = {
  agent?: Agent | null;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  onViewDiff?: (auditItemId: string) => void;
};

/**
 * Audit queue — AUTH_INTERCEPT and DIFF_REVIEW items with approve/deny actions.
 * @param agent - Optional agent to filter audit items
 * @param onApprove - Called when item is approved
 * @param onDeny - Called when item is denied
 * @param onViewDiff - Called when viewing code diff
 */
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
    <div role="list" aria-label="Pending audit items" className="p-3 space-y-2">
      {items.map((item) => {
        const isIntercept = item.type === 'AUTH_INTERCEPT';
        return (
          <div
            key={item.id}
            role="listitem"
            className={`rounded-md border border-border border-l-2 ${
              isIntercept ? 'border-l-chart-1' : 'border-l-chart-2'
            } bg-card p-3`}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onApprove?.(item.id)}
                  >
                    Grant One-Time Access
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onDeny?.(item.id)}
                  >
                    Deny
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewDiff?.(item.id)}
                  >
                    View Code Diff
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => onApprove?.(item.id)}
                  >
                    Approve & Merge
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
