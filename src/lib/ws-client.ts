/**
 * WS client — subscribes to events from the Electron main process.
 * Events come via `ws:event` IPC channel from main.
 */
import { useEffect } from 'react';

type WsEventHandler = (event: Record<string, unknown>) => void;

export function useWsEvents(handler: WsEventHandler): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electron) return;
    const unsubscribe = window.electron.onWsEvent(handler);
    return () => { unsubscribe(); };
  }, [handler]);
}
