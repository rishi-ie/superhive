import * as React from "react";

export interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export function useCommandPalette(): CommandPaletteState {
  const [open, setOpen] = React.useState(false);
  const toggle = React.useCallback(() => setOpen((v) => !v), []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return { open, setOpen, toggle };
}
