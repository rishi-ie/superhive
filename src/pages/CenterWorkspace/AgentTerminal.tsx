/**
 * AgentTerminal — PTY-driven terminal view for an agent.
 *
 * Manages the full PTY lifecycle: spawns the subprocess on mount via
 * electron.pty, bridges PTY stdout/stderr to the xterm.js Terminal, and
 * forwards terminal input to the subprocess.
 *
 * Replaces the old ChatView for the 'agent' tab type.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal, type TerminalHandle } from '@/components/ui/Terminal';
import { getAgent } from '@/data/agent/store';
import { registerAgentProcess, terminateAgentProcess, setAgentProcessStatus } from '@/data/agent_process/store';
import { registerTerminalControls, unregisterTerminalControls } from '@/lib/terminal';

type PtyStatus = 'idle' | 'starting' | 'running' | 'errored' | 'dead';

type AgentTerminalProps = {
  agentId: string;
};

export function AgentTerminal({ agentId }: AgentTerminalProps) {
  const [status, setStatus] = useState<PtyStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const writeRef = useRef<(data: string) => void>(() => {});
  const clearRef = useRef<() => void>(() => {});
  const ulidRef = useRef<string>('');
  const piPathRef = useRef<string>('');
  const colsRef = useRef<number>(80);
  const rowsRef = useRef<number>(24);
  const unsubsRef = useRef<Array<() => void>>([]);

  const spawnPty = useCallback(async () => {
    const piPath = piPathRef.current;
    const ulid = ulidRef.current;
    const cols = colsRef.current;
    const rows = rowsRef.current;

    if (!piPath || !ulid) return;

    for (const unsub of unsubsRef.current) {
      unsub();
    }
    unsubsRef.current = [];

    if (ulidRef.current) {
      try {
        terminateAgentProcess(ulidRef.current);
      } catch {
        // ignore
      }
      void window.electron.pty.kill(ulidRef.current);
    }

    setStatus('starting');

    const result = await window.electron.pty.spawn(ulid, piPath, cols, rows);

    if (!result.ok) {
      setError(result.error);
      setStatus('errored');
      return;
    }

    const pid = (result as unknown as { pid?: number }).pid;
    if (pid) {
      try {
        registerAgentProcess(ulid, pid);
        setAgentProcessStatus(ulid, 'RUNNING');
      } catch (err) {
        console.warn('[AgentTerminal] failed to register process:', err);
      }
    }

    setStatus('running');

    const unsubData = window.electron.pty.onData(ulid, (data: string) => {
      writeRef.current(data);
    });

    const unsubExit = window.electron.pty.onExit(ulid, () => {
      setStatus('dead');
      try {
        terminateAgentProcess(ulid);
      } catch {
        // ignore
      }
    });

    unsubsRef.current = [unsubData, unsubExit];
  }, []);

  const handleTerminalReady = useCallback((handle: TerminalHandle) => {
    writeRef.current = handle.write;
    clearRef.current = handle.clear;

    const agent = getAgent(agentId);
    const piPath = agent?.piPath ?? '';
    if (!piPath) {
      setError('Agent has no piPath configured. Set the Pi path in agent settings.');
      setStatus('errored');
      return;
    }

    piPathRef.current = piPath;
    const ulid = agentId;
    ulidRef.current = ulid;

    registerTerminalControls({
      clear: () => {
        clearRef.current();
      },
      restart: () => {
        void spawnPty();
      },
    });

    void spawnPty();
  }, [agentId, spawnPty]);

  const handleTerminalData = useCallback((data: string) => {
    if (ulidRef.current) {
      void window.electron.pty.write(ulidRef.current, data);
    }
  }, []);

  useEffect(() => {
    return () => {
      unregisterTerminalControls();
      for (const unsub of unsubsRef.current) {
        unsub();
      }
      unsubsRef.current = [];
      if (ulidRef.current) {
        void window.electron.pty.kill(ulidRef.current);
        try {
          terminateAgentProcess(ulidRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (status === 'errored' && error) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>{error}</p>
      </div>
    );
  }

  if (status === 'idle' || status === 'starting') {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Starting terminal…</p>
      </div>
    );
  }

  return (
    <Terminal
      onData={handleTerminalData}
      onReady={handleTerminalReady}
    />
  );
}
