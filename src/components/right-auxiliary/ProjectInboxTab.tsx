/**
 * Project inbox tab — delegates to AuditQueue for a project's pending audit items.
 */
import { AuditQueue } from './AuditQueue';
import type { AuditItem } from '@/data/agents/store';

type ProjectInboxTabProps = {
  projectName: string;
  auditItems: AuditItem[];
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  onViewDiff?: (auditItemId: string) => void;
  onAuditCountClick?: (agentId: string) => void;
};

/**
 * Project inbox tab — delegates to AuditQueue for a project's pending audit items.
 * @param projectName - Project name for header
 * @param auditItems - Audit items to display
 * @param onApprove - Called when item is approved
 * @param onDeny - Called when item is denied
 * @param onViewDiff - Called when viewing code diff
 * @param onAuditCountClick - Called when audit count is clicked
 */
export function ProjectInboxTab({
  projectName,
  auditItems,
  onApprove,
  onDeny,
  onViewDiff,
  onAuditCountClick,
}: ProjectInboxTabProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <span className="text-[10px] text-muted-foreground">
          {projectName} · {auditItems.length} pending
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AuditQueue
          onApprove={onApprove}
          onDeny={onDeny}
          onViewDiff={onViewDiff}
          onAuditCountClick={onAuditCountClick}
        />
      </div>
    </div>
  );
}
