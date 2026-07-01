/**
 * permission_requests — agent permission request registry.
 *
 * Tracks permission asks from agents: action description, tool name, args, status.
 * Used for the permission request UI in Phase 53.
 */
export type PermissionRequest = {
  id: string;
  agentUlid: string;
  action: string;
  toolName: string | null;
  argsJson: string | null;
  status: 'PENDING' | 'GRANTED' | 'DENIED' | 'EXPIRED';
  requestedAt: string;
  resolvedAt: string | null;
  resolverNote: string | null;
};
