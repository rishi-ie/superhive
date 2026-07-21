import * as React from 'react';
import type { OpenCreateAgentState } from '@/models/agent';

let listeners: Array<(open: boolean) => void> = [];
let currentState = false;

function setGlobalOpen(open: boolean): void {
  currentState = open;
  listeners.forEach((l) => l(open));
}

export function useOpenCreateAgent(): OpenCreateAgentState {
  const [open, setLocal] = React.useState(currentState);

  React.useEffect(() => {
    const listener = (next: boolean) => setLocal(next);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    open,
    setOpen: setGlobalOpen,
  };
}