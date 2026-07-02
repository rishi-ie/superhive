/**
 * Permission toast container — listens for permission:request WS events
 * and shows a toast for each one.
 */
import { useState, useCallback } from 'react';
import { useWsEvents } from '@/lib/ws-client';
import { PermissionRequestToast } from './PermissionRequestToast';

type ActiveRequest = {
  id: string;
  agentUlid: string;
  action: string;
  toolName: string | null;
};

export function PermissionToastContainer() {
  const [requests, setRequests] = useState<ActiveRequest[]>([]);

  const handler = useCallback((event: Record<string, unknown>) => {
    if (event['type'] !== 'permission:request') return;
    const id = String(event['id'] ?? '');
    if (!id) return;
    setRequests((prev) => [
      ...prev,
      {
        id,
        agentUlid: String(event['ulid'] ?? ''),
        action: String(event['action'] ?? ''),
        toolName: (event['toolName'] as string | null) ?? null,
      },
    ]);
  }, []);

  useWsEvents(handler);

  const handleResolved = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (requests.length === 0) return null;

  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto">
      {requests.map((r) => (
        <div
          key={r.id}
          onAnimationEnd={() => undefined}
          className="animate-in fade-in slide-in-from-right-4 duration-200"
        >
          <PermissionRequestToast
            id={r.id}
            agentUlid={r.agentUlid}
            action={r.action}
            toolName={r.toolName}
            onResolved={() => handleResolved(r.id)}
          />
        </div>
      ))}
    </div>
  );
}
