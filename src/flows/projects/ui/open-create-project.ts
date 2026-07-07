import * as React from 'react';

let currentState = false;
const listeners = new Set<(state: boolean) => void>();

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
