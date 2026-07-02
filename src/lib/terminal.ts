/**
 * Terminal control registry — bridges global keyboard shortcuts to the active
 * AgentTerminal instance.
 *
 * The active AgentTerminal registers its control functions on mount and clears
 * them on unmount. Shortcut actions call into this registry.
 */
type TerminalControls = {
  clear: () => void;
  restart: () => void;
};

let _controls: TerminalControls | null = null;

export function registerTerminalControls(controls: TerminalControls): void {
  _controls = controls;
}

export function unregisterTerminalControls(): void {
  _controls = null;
}

export function clearActiveTerminal(): void {
  _controls?.clear();
}

export function restartActiveTerminal(): void {
  _controls?.restart();
}
