import * as React from 'react';
import type { Project } from '@/types/electron';

let currentState = false;
const listeners = new Set<(state: boolean) => void>();
let afterCreate: ((project: Project) => void) | null = null;

function notify() {
  listeners.forEach((l) => l(currentState));
}

export function useOpenCreateProject(): { open: boolean; setOpen: (open: boolean) => void } {
  const [open, setOpenState] = React.useState(currentState);
  React.useEffect(() => {
    const handler = (state: boolean) => setOpenState(state);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const setOpen = React.useCallback((val: boolean) => {
    currentState = val;
    notify();
  }, []);

  return { open, setOpen };
}

export function openCreateProjectAfterCreate(callback: (project: Project) => void): void {
  afterCreate = callback;
  currentState = true;
  notify();
}

export function takeCreateProjectContinuation(): ((project: Project) => void) | null {
  const callback = afterCreate;
  afterCreate = null;
  return callback;
}

export function clearCreateProjectContinuation(): void {
  afterCreate = null;
}
