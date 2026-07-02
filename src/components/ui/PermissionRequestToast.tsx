/**
 * Permission request toast — appears top-right when an agent requests permission.
 * Approve / Deny actions resolve the request and notify the agent.
 */
import { ShieldCheck, ShieldX } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { resolvePermissionRequest, createPermissionRequest } from '@/data/permission_requests/store';
import { useToast } from '@/lib/toast-context';
import { useState } from 'react';

export type PermissionRequestToastProps = {
  id: string;
  agentUlid: string;
  action: string;
  toolName: string | null;
  onResolved?: () => void;
};

export function PermissionRequestToast({
  id,
  agentUlid,
  action,
  toolName,
  onResolved,
}: PermissionRequestToastProps) {
  const toast = useToast();
  const [resolving, setResolving] = useState(false);

  // Persist the request if it doesn't exist yet.
  try { createPermissionRequest({ agentUlid, action, toolName: toolName ?? undefined }); } catch { /* ignore dup */ }

  const handleApprove = () => {
    setResolving(true);
    resolvePermissionRequest(id, 'GRANTED');
    toast({ title: 'Permission granted', description: action });
    onResolved?.();
  };
  const handleDeny = () => {
    setResolving(true);
    resolvePermissionRequest(id, 'DENIED');
    toast({ title: 'Permission denied', description: action });
    onResolved?.();
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2 shadow-md w-80">
      <ShieldCheck size={16} strokeWidth={STROKE_WIDTH} className="text-chart-3 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">{action}</div>
        <div className="text-[10px] text-muted-foreground truncate">
          {toolName ? `${toolName} · ` : ''}agent {agentUlid}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={handleApprove} disabled={resolving}>
        <ShieldCheck size={12} strokeWidth={STROKE_WIDTH} />
        Approve
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDeny} disabled={resolving}>
        <ShieldX size={12} strokeWidth={STROKE_WIDTH} />
        Deny
      </Button>
    </div>
  );
}
