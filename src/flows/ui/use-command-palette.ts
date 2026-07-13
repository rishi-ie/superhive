import * as React from "react";

export interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

let openState = false;
const listeners = new Set<(open: boolean) => void>();
let keyListenerAttached = false;

function setOpenGlobal(next: boolean) {
  if (openState === next) return;
  openState = next;
  listeners.forEach((l) => l(openState));
}

function ensureKeyListener() {
  if (keyListenerAttached || typeof window === "undefined") return;
  keyListenerAttached = true;
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setOpenGlobal(!openState);
    }
  });
}

export function useCommandPalette(): CommandPaletteState {
  ensureKeyListener();

  const [open, setLocalOpen] = React.useState(openState);

  React.useEffect(() => {
    const listener = (next: boolean) => setLocalOpen(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    open,
    setOpen: setOpenGlobal,
    toggle: () => setOpenGlobal(!openState),
  };
}
