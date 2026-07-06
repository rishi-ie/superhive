import * as React from 'react';
import { toast } from 'sonner';
import { agents } from '@/api/agents';
import type {
  Agent,
  RuntimeMessage,
  RuntimeStatusPayload,
  AdapterEvent,
} from '@/types/electron';

export interface UseAgentRuntime {
  agent: Agent | null;
  status: RuntimeStatusPayload['status'];
  messages: RuntimeMessage[];
  lastError?: string;
  bootStep?: RuntimeStatusPayload['bootStep'];
  loading: boolean;
  send: (text: string) => void;
  restart: () => void;
}

export function useAgentRuntime(agentId: string | undefined): UseAgentRuntime {
  const [agent, setAgent] = React.useState<Agent | null>(null);
  const [status, setStatus] = React.useState<RuntimeStatusPayload['status']>('stopped');
  const [messages, setMessages] = React.useState<RuntimeMessage[]>([]);
  const [lastError, setLastError] = React.useState<string | undefined>(undefined);
  const [bootStep, setBootStep] = React.useState<RuntimeStatusPayload['bootStep']>(undefined);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!agentId) {
      setAgent(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    agents
      .get(agentId)
      .then((a) => {
        if (!mounted) return;
        setAgent(a);
        setStatus(a?.status ?? 'stopped');
        setLastError(a?.lastError);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAgent(null);
        setLoading(false);
      });

    agents
      .getRuntimeState(agentId)
      .then((s) => {
        if (!mounted || !s) return;
        setStatus(s.status);
        setBootStep(s.bootStep);
        setLastError(s.lastError);
      })
      .catch(() => {
        // ignore — runtime may not be started yet
      });

    return () => {
      mounted = false;
    };
  }, [agentId]);

  React.useEffect(() => {
    if (!agentId) return;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      agents.onStatus(agentId, (s) => {
        setStatus(s.status);
        setBootStep(s.bootStep);
        setLastError(s.lastError);
      })
    );

    unsubs.push(
      agents.onMessages(agentId, (msgs) => {
        setMessages(msgs);
      })
    );

    unsubs.push(
      agents.onEvent(agentId, (ev: AdapterEvent) => {
        if (ev.type === 'text-delta') {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === ev.messageId);
            if (idx === -1) return prev;
            const existing = prev[idx];
            if (!existing) return prev;
            const next = prev.slice();
            next[idx] = { ...existing, content: existing.content + ev.delta };
            return next;
          });
        } else if (ev.type === 'message-start') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === ev.messageId)) return prev;
            return [
              ...prev,
              {
                id: ev.messageId,
                role: ev.role,
                content: '',
                ts: Date.now(),
              },
            ];
          });
        } else if (ev.type === 'message-end') {
          setMessages((prev) => prev.map((m) => (m.id === ev.messageId ? m : m)));
        } else if (ev.type === 'error') {
          toast.error(ev.message, { duration: Infinity });
          setLastError(ev.message);
        }
      })
    );

    unsubs.push(
      agents.onExit(agentId, () => {
        agents.get(agentId).then((a) => {
          if (a) setStatus(a.status);
          if (a?.lastError) setLastError(a.lastError);
        });
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [agentId]);

  const autoStartIfStopped = React.useCallback(() => {
    if (!agentId) return;
    if (status === 'stopped' || status === 'error') {
      agents.start(agentId).catch(() => {});
    }
  }, [agentId, status]);

  React.useEffect(() => {
    if (loading) return;
    if (!agent) return;
    if (status === 'stopped') {
      autoStartIfStopped();
    }
  }, [loading, agent, status, autoStartIfStopped]);

  const send = React.useCallback(
    (text: string) => {
      if (!agentId) return;
      agents.send(agentId, text).catch(() => {});
    },
    [agentId]
  );

  const restart = React.useCallback(() => {
    if (!agentId) return;
    agents.restart(agentId).catch(() => {});
  }, [agentId]);

  return {
    agent,
    status,
    messages,
    lastError,
    bootStep,
    loading,
    send,
    restart,
  };
}